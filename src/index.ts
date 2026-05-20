import type mysql from 'mysql2/promise'
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
