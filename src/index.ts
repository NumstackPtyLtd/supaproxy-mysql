import type mysql from 'mysql2/promise'
import type { RowDataPacket } from 'mysql2/promise'
import type { DatabaseAdapter } from '@supaproxy/core/ports/database'

import { MysqlOrganisationRepository } from './repositories/MysqlOrganisationRepository.js'
import { MysqlWorkspaceRepository } from './repositories/MysqlWorkspaceRepository.js'
import { MysqlConversationRepository } from './repositories/MysqlConversationRepository.js'
import { MysqlAuditLogRepository } from './repositories/MysqlAuditLogRepository.js'
import { MysqlModelRepository } from './repositories/MysqlModelRepository.js'
import { MysqlPromptTemplateRepository } from './repositories/MysqlPromptTemplateRepository.js'
import { MysqlGuardrailEventRepository } from './repositories/MysqlGuardrailEventRepository.js'
import { MysqlGuardrailPolicyRepository } from './repositories/MysqlGuardrailPolicyRepository.js'
import { MysqlIntegrationRepository } from './repositories/MysqlIntegrationRepository.js'
import { MysqlEntryPointRepository } from './repositories/MysqlEntryPointRepository.js'
import { MysqlKnowledgeChunkRepository } from './repositories/MysqlKnowledgeChunkRepository.js'

interface GuardrailConfig {
  cost_cap_monthly_usd?: number
  rate_limit?: { per_user_per_minute?: number; per_workspace_per_hour?: number }
  blocked_topics?: string[]
}

export function createMysqlInfra(pool: mysql.Pool): DatabaseAdapter {
  return {
    orgRepo: new MysqlOrganisationRepository(pool),
    workspaceRepo: new MysqlWorkspaceRepository(pool),
    conversationRepo: new MysqlConversationRepository(pool),
    auditRepo: new MysqlAuditLogRepository(pool),
    modelRepo: new MysqlModelRepository(pool),
    promptTemplateRepo: new MysqlPromptTemplateRepository(pool),
    guardrailEventRepo: new MysqlGuardrailEventRepository(pool),
    guardrailPolicyRepo: new MysqlGuardrailPolicyRepository(pool),
    integrationRepo: new MysqlIntegrationRepository(pool),
    entryPointRepo: new MysqlEntryPointRepository(pool),
    knowledgeChunkRepo: new MysqlKnowledgeChunkRepository(pool),

    async getMonthlySpend(workspaceId: string): Promise<number> {
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT COALESCE(SUM(cost_usd), 0) AS total FROM audit_logs WHERE workspace_id = ? AND created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')`,
        [workspaceId]
      )
      return Number(rows[0].total)
    },

    async getWorkspaceGuardrailConfig(workspaceId: string): Promise<GuardrailConfig | null> {
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT config FROM workspace_guardrails WHERE workspace_id = ? AND enabled = TRUE AND config IS NOT NULL`,
        [workspaceId]
      )

      if (rows.length === 0) return null

      const merged: GuardrailConfig = {}

      for (const row of rows) {
        const parsed: GuardrailConfig = typeof row.config === 'string'
          ? JSON.parse(row.config)
          : row.config

        if (parsed.cost_cap_monthly_usd !== undefined) {
          merged.cost_cap_monthly_usd = merged.cost_cap_monthly_usd !== undefined
            ? Math.min(merged.cost_cap_monthly_usd, parsed.cost_cap_monthly_usd)
            : parsed.cost_cap_monthly_usd
        }

        if (parsed.rate_limit) {
          merged.rate_limit = merged.rate_limit ?? {}
          if (parsed.rate_limit.per_user_per_minute !== undefined) {
            merged.rate_limit.per_user_per_minute = merged.rate_limit.per_user_per_minute !== undefined
              ? Math.min(merged.rate_limit.per_user_per_minute, parsed.rate_limit.per_user_per_minute)
              : parsed.rate_limit.per_user_per_minute
          }
          if (parsed.rate_limit.per_workspace_per_hour !== undefined) {
            merged.rate_limit.per_workspace_per_hour = merged.rate_limit.per_workspace_per_hour !== undefined
              ? Math.min(merged.rate_limit.per_workspace_per_hour, parsed.rate_limit.per_workspace_per_hour)
              : parsed.rate_limit.per_workspace_per_hour
          }
        }

        if (parsed.blocked_topics) {
          merged.blocked_topics = merged.blocked_topics ?? []
          for (const topic of parsed.blocked_topics) {
            if (!merged.blocked_topics.includes(topic)) {
              merged.blocked_topics.push(topic)
            }
          }
        }
      }

      return Object.keys(merged).length > 0 ? merged : null
    },
  }
}

export type MysqlInfra = ReturnType<typeof createMysqlInfra>

// Re-export individual repositories for advanced use cases
export { MysqlOrganisationRepository } from './repositories/MysqlOrganisationRepository.js'
export { MysqlWorkspaceRepository } from './repositories/MysqlWorkspaceRepository.js'
export { MysqlConversationRepository } from './repositories/MysqlConversationRepository.js'
export { MysqlAuditLogRepository } from './repositories/MysqlAuditLogRepository.js'
export { MysqlModelRepository } from './repositories/MysqlModelRepository.js'
export { MysqlPromptTemplateRepository } from './repositories/MysqlPromptTemplateRepository.js'
export { MysqlGuardrailEventRepository } from './repositories/MysqlGuardrailEventRepository.js'
export { MysqlGuardrailPolicyRepository } from './repositories/MysqlGuardrailPolicyRepository.js'
export { MysqlIntegrationRepository } from './repositories/MysqlIntegrationRepository.js'
export { MysqlEntryPointRepository } from './repositories/MysqlEntryPointRepository.js'
export { MysqlKnowledgeChunkRepository } from './repositories/MysqlKnowledgeChunkRepository.js'

// Re-export pool factory and migrations
export { createPool, type MysqlPoolOptions } from './pool.js'
export { runMigrations } from './migrations.js'
