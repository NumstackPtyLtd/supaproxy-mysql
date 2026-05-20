import type { RowDataPacket } from 'mysql2'

export interface OrgRow extends RowDataPacket { id: string; name: string; slug: string; created_at: string }
export interface UserRow extends RowDataPacket { id: string; org_id: string | null; email: string; name: string; password_hash: string; org_role: 'admin' | 'workspace_admin' | 'user'; created_at: string }
export interface SettingRow extends RowDataPacket { id: string; key_name: string; value: string; is_secret: boolean }
export interface TeamRow extends RowDataPacket { id: string; name: string }
export interface IdRow extends RowDataPacket { id: string }
export interface ValueRow extends RowDataPacket { value: string }
export interface KeyValueRow extends RowDataPacket { key_name: string; value: string }
export interface UserListRow extends RowDataPacket { id: string; name: string; email: string; org_role: string; created_at: string }
export interface CountRow extends RowDataPacket { total: number }
