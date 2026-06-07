import type { Pool, RowDataPacket } from 'mysql2/promise'
import type { KnowledgeGapRepository, KnowledgeGapRecord, AggregatedKnowledgeGap } from '@supaproxy/core/domain/knowledge'

interface GapRow extends RowDataPacket {
  topic: string
  missing_information: string | null
  sources_checked: unknown
  gap_detail: string | null
  conversation_id: string | null
  user_name: string | null
  created_at: string | Date
}

/** A JSON column may arrive as a parsed array or a raw string depending on the driver. */
function parseSources(raw: unknown): string[] {
  let value = raw
  if (typeof raw === 'string') {
    try { value = JSON.parse(raw) } catch { return [] }
  }
  return Array.isArray(value) ? value.filter((s): s is string => typeof s === 'string') : []
}

function toIso(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : value
}

export class MysqlKnowledgeGapRepository implements KnowledgeGapRepository {
  constructor(private pool: Pool) {}

  async create(record: KnowledgeGapRecord): Promise<void> {
    await this.pool.execute(
      `INSERT INTO knowledge_gaps (id, workspace_id, conversation_id, topic, missing_information, sources_checked, gap_detail, user_name)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        record.id, record.workspaceId, record.conversationId, record.topic,
        record.missingInformation, JSON.stringify(record.sourcesChecked), record.gapDetail, record.userName,
      ],
    )
  }

  async listByWorkspace(workspaceId: string, limit: number): Promise<AggregatedKnowledgeGap[]> {
    // query() (not execute()) for LIMIT: the prepared-statement path mishandles it.
    const [rows] = await this.pool.query<GapRow[]>(
      `SELECT topic, missing_information, sources_checked, gap_detail, conversation_id, user_name, created_at
       FROM knowledge_gaps WHERE workspace_id = ? ORDER BY created_at DESC LIMIT ?`,
      [workspaceId, limit],
    )
    return rows.map(r => ({
      topic: r.topic,
      missing_information: r.missing_information ?? '',
      sources_checked: parseSources(r.sources_checked),
      gap_detail: r.gap_detail ?? '',
      conversation_id: r.conversation_id,
      user_name: r.user_name,
      timestamp: toIso(r.created_at),
    }))
  }
}
