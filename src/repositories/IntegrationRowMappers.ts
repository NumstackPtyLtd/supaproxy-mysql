import type mysql from 'mysql2/promise'
import type { IntegrationData, EntryPointData } from '@supaproxy/core/domain/integration'

export interface IntegrationRow extends mysql.RowDataPacket {
  id: string
  org_id: string
  type: string
  status: string
  created_at: string
  updated_at: string
}

export interface EntryPointRow extends mysql.RowDataPacket {
  id: string
  integration_id: string
  channel_id: string
  channel_name: string | null
  direct: number
  direct_workspace_id: string | null
  created_at: string
}

export interface EntryPointWithTypeRow extends EntryPointRow {
  integration_type: string
  org_id: string
}

export function mapIntegrationRow(r: IntegrationRow): IntegrationData {
  return { id: r.id, org_id: r.org_id, type: r.type, status: r.status as IntegrationData['status'], created_at: r.created_at, updated_at: r.updated_at }
}

export function mapEntryPointRow(r: EntryPointRow): EntryPointData {
  return {
    id: r.id,
    integration_id: r.integration_id,
    channel_id: r.channel_id,
    channel_name: r.channel_name,
    direct: Boolean(r.direct),
    direct_workspace_id: r.direct_workspace_id,
    created_at: r.created_at,
  }
}
