import type mysql from 'mysql2/promise'
import type { GuardrailEventRepository, GuardrailEventData, GuardrailEventFilter, EventStatus } from '@supaproxy/core/domain/guardrail'
import { DEFAULT_PAGINATION_LIMIT } from '@supaproxy/core/defaults'
import { type GuardrailEventRow, type CountRow, mapGuardrailEventRow } from './GuardrailEventRowMappers.js'

export class MysqlGuardrailEventRepository implements GuardrailEventRepository {
  constructor(private readonly pool: mysql.Pool) {}

  async create(data: GuardrailEventData): Promise<void> {
    await this.pool.execute(
      `INSERT INTO guardrail_events (id, workspace_id, conversation_id, event_type, plugin_id, context, outcome, display, actions, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.id, data.workspace_id, data.conversation_id, data.event_type, data.plugin_id, JSON.stringify(data.context), JSON.stringify(data.outcome), JSON.stringify(data.display), JSON.stringify(data.actions), data.status],
    )
  }

  async findByWorkspace(workspaceId: string, limit = DEFAULT_PAGINATION_LIMIT): Promise<GuardrailEventData[]> {
    const [rows] = await this.pool.execute<GuardrailEventRow[]>(
      `SELECT * FROM guardrail_events WHERE workspace_id = ? ORDER BY created_at DESC LIMIT ?`,
      [workspaceId, String(limit)],
    )
    return rows.map(mapGuardrailEventRow)
  }

  async findByWorkspaceFiltered(workspaceId: string, filter: GuardrailEventFilter): Promise<{ events: GuardrailEventData[]; total: number }> {
    const { conditions, params } = this.buildWhere(workspaceId, filter)
    const where = conditions.join(' AND ')
    const limit = filter.limit ?? DEFAULT_PAGINATION_LIMIT
    const offset = filter.offset ?? 0

    const [[countResult], [rows]] = await Promise.all([
      this.pool.execute<CountRow[]>(`SELECT COUNT(*) AS total FROM guardrail_events WHERE ${where}`, params),
      this.pool.execute<GuardrailEventRow[]>(
        `SELECT * FROM guardrail_events WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
        [...params, String(limit), String(offset)],
      ),
    ])

    return { events: rows.map(mapGuardrailEventRow), total: countResult[0]?.total ?? 0 }
  }

  async updateStatus(id: string, status: EventStatus): Promise<void> {
    await this.pool.execute(
      `UPDATE guardrail_events SET status = ? WHERE id = ?`,
      [status, id],
    )
  }

  private buildWhere(workspaceId: string, filter: GuardrailEventFilter): { conditions: string[]; params: string[] } {
    const conditions: string[] = ['workspace_id = ?']
    const params: string[] = [workspaceId]

    if (filter.event_type) {
      conditions.push('event_type = ?')
      params.push(filter.event_type)
    }

    if (filter.status) {
      conditions.push('status = ?')
      params.push(filter.status)
    }

    if (filter.search) {
      conditions.push(`(
        plugin_id LIKE ? OR
        JSON_UNQUOTE(JSON_EXTRACT(context, '$.tool_name')) LIKE ? OR
        JSON_UNQUOTE(JSON_EXTRACT(context, '$.connection_name')) LIKE ? OR
        JSON_UNQUOTE(JSON_EXTRACT(outcome, '$.reason')) LIKE ?
      )`)
      const term = `%${filter.search}%`
      params.push(term, term, term, term)
    }

    return { conditions, params }
  }
}
