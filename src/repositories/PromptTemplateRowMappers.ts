import type { RowDataPacket } from 'mysql2'
import type { PromptTemplateData } from '@supaproxy/core/domain/prompt'

export interface PromptRow extends RowDataPacket, PromptTemplateData {}
