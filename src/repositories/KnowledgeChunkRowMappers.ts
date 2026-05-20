import type { RowDataPacket } from 'mysql2'

export interface ChunkRow extends RowDataPacket {
  id: string
  source_id: string
  workspace_id: string
  text: string
  chunk_index: number
  content_hash: string
  created_at: string
}
