import type mysql from 'mysql2/promise'
import type { GuardrailEventData } from '@supaproxy/core/domain/guardrail'

export interface GuardrailEventRow extends mysql.RowDataPacket {
  id: string
  workspace_id: string
  conversation_id: string | null
  event_type: string
  plugin_id: string
  context: string | null
  outcome: string | null
  display: string | null
  actions: string | null
  status: string
  created_at: string
}

export interface CountRow extends mysql.RowDataPacket {
  total: number
}

export function parseJson(raw: string | object | null): Record<string, unknown> {
  if (!raw) return {}
  if (typeof raw === 'object') return raw as Record<string, unknown>
  try { return JSON.parse(raw) } catch { return {} }
}

export function parseJsonArray<T>(raw: string | T[] | null): T[] {
  if (!raw) return []
  if (Array.isArray(raw)) return raw
  try { return JSON.parse(raw) } catch { return [] }
}

export function mapGuardrailEventRow(r: GuardrailEventRow): GuardrailEventData {
  return {
    id: r.id,
    workspace_id: r.workspace_id,
    conversation_id: r.conversation_id,
    event_type: r.event_type as GuardrailEventData['event_type'],
    plugin_id: r.plugin_id,
    context: parseJson(r.context),
    outcome: parseJson(r.outcome),
    display: parseJsonArray(r.display),
    actions: parseJsonArray(r.actions),
    status: r.status as GuardrailEventData['status'],
    created_at: r.created_at,
  }
}
