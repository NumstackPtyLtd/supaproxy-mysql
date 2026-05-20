import type { RowDataPacket } from 'mysql2'

export interface ModelRow extends RowDataPacket { id: string; label: string; is_default: boolean }
