import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock all repository constructors before importing the module under test
vi.mock('./repositories/MysqlOrganisationRepository.js', () => ({
  MysqlOrganisationRepository: vi.fn().mockImplementation(() => ({ _type: 'org' })),
}))
vi.mock('./repositories/MysqlWorkspaceRepository.js', () => ({
  MysqlWorkspaceRepository: vi.fn().mockImplementation(() => ({ _type: 'workspace' })),
}))
vi.mock('./repositories/MysqlConversationRepository.js', () => ({
  MysqlConversationRepository: vi.fn().mockImplementation(() => ({ _type: 'conversation' })),
}))
vi.mock('./repositories/MysqlAuditLogRepository.js', () => ({
  MysqlAuditLogRepository: vi.fn().mockImplementation(() => ({ _type: 'audit' })),
}))
vi.mock('./repositories/MysqlModelRepository.js', () => ({
  MysqlModelRepository: vi.fn().mockImplementation(() => ({ _type: 'model' })),
}))
vi.mock('./repositories/MysqlPromptTemplateRepository.js', () => ({
  MysqlPromptTemplateRepository: vi.fn().mockImplementation(() => ({ _type: 'promptTemplate' })),
}))
vi.mock('./repositories/MysqlGuardrailEventRepository.js', () => ({
  MysqlGuardrailEventRepository: vi.fn().mockImplementation(() => ({ _type: 'guardrailEvent' })),
}))
vi.mock('./repositories/MysqlGuardrailPolicyRepository.js', () => ({
  MysqlGuardrailPolicyRepository: vi.fn().mockImplementation(() => ({ _type: 'guardrailPolicy' })),
}))
vi.mock('./repositories/MysqlIntegrationRepository.js', () => ({
  MysqlIntegrationRepository: vi.fn().mockImplementation(() => ({ _type: 'integration' })),
}))
vi.mock('./repositories/MysqlEntryPointRepository.js', () => ({
  MysqlEntryPointRepository: vi.fn().mockImplementation(() => ({ _type: 'entryPoint' })),
}))
vi.mock('./repositories/MysqlKnowledgeChunkRepository.js', () => ({
  MysqlKnowledgeChunkRepository: vi.fn().mockImplementation(() => ({ _type: 'knowledgeChunk' })),
}))

import { createMysqlInfra } from './index.js'

function makePool(executeResult: unknown = [[{ total: 0 }], []]) {
  return { execute: vi.fn().mockResolvedValue(executeResult) } as any
}

describe('createMysqlInfra', () => {
  it('returns an object with all expected repository keys', () => {
    const infra = createMysqlInfra(makePool())

    const expectedKeys = [
      'orgRepo',
      'workspaceRepo',
      'conversationRepo',
      'conversationQueryRepo',
      'auditRepo',
      'modelRepo',
      'promptTemplateRepo',
      'guardrailEventRepo',
      'guardrailPolicyRepo',
      'integrationRepo',
      'entryPointRepo',
      'knowledgeChunkRepo',
      'getMonthlySpend',
      'getWorkspaceGuardrailConfig',
    ]

    for (const key of expectedKeys) {
      expect(infra).toHaveProperty(key)
    }
  })

  it('exposes getMonthlySpend and getWorkspaceGuardrailConfig as functions', () => {
    const infra = createMysqlInfra(makePool())
    expect(typeof infra.getMonthlySpend).toBe('function')
    expect(typeof infra.getWorkspaceGuardrailConfig).toBe('function')
  })

  describe('getMonthlySpend', () => {
    it('returns the numeric total from the query', async () => {
      const pool = makePool([[{ total: '42.50' }], []])
      const infra = createMysqlInfra(pool)

      const result = await infra.getMonthlySpend('ws-1')

      expect(result).toBe(42.5)
      expect(pool.execute).toHaveBeenCalledWith(
        expect.stringContaining('SUM(cost_usd)'),
        ['ws-1'],
      )
    })

    it('returns 0 when COALESCE yields 0', async () => {
      const pool = makePool([[{ total: 0 }], []])
      const infra = createMysqlInfra(pool)

      const result = await infra.getMonthlySpend('ws-empty')
      expect(result).toBe(0)
    })
  })

  describe('getWorkspaceGuardrailConfig', () => {
    it('returns null when no rows match', async () => {
      const pool = makePool([[], []])
      const infra = createMysqlInfra(pool)

      const result = await infra.getWorkspaceGuardrailConfig('ws-none')
      expect(result).toBeNull()
    })

    it('returns parsed config from a single row (JSON string)', async () => {
      const config = { cost_cap_monthly_usd: 100 }
      const pool = makePool([[{ config: JSON.stringify(config) }], []])
      const infra = createMysqlInfra(pool)

      const result = await infra.getWorkspaceGuardrailConfig('ws-1')
      expect(result).toEqual({ cost_cap_monthly_usd: 100 })
    })

    it('returns parsed config from a single row (already object)', async () => {
      const config = { cost_cap_monthly_usd: 200 }
      const pool = makePool([[{ config }], []])
      const infra = createMysqlInfra(pool)

      const result = await infra.getWorkspaceGuardrailConfig('ws-1')
      expect(result).toEqual({ cost_cap_monthly_usd: 200 })
    })

    it('merges multiple rows: takes minimum cost cap', async () => {
      const rows = [
        { config: { cost_cap_monthly_usd: 500 } },
        { config: { cost_cap_monthly_usd: 200 } },
      ]
      const pool = makePool([rows, []])
      const infra = createMysqlInfra(pool)

      const result = await infra.getWorkspaceGuardrailConfig('ws-1')
      expect(result!.cost_cap_monthly_usd).toBe(200)
    })

    it('merges multiple rows: takes minimum rate limits', async () => {
      const rows = [
        { config: { rate_limit: { per_user_per_minute: 60, per_workspace_per_hour: 1000 } } },
        { config: { rate_limit: { per_user_per_minute: 30 } } },
      ]
      const pool = makePool([rows, []])
      const infra = createMysqlInfra(pool)

      const result = await infra.getWorkspaceGuardrailConfig('ws-1')
      expect(result!.rate_limit!.per_user_per_minute).toBe(30)
      expect(result!.rate_limit!.per_workspace_per_hour).toBe(1000)
    })

    it('merges multiple rows: deduplicates blocked_topics', async () => {
      const rows = [
        { config: { blocked_topics: ['violence', 'drugs'] } },
        { config: { blocked_topics: ['drugs', 'weapons'] } },
      ]
      const pool = makePool([rows, []])
      const infra = createMysqlInfra(pool)

      const result = await infra.getWorkspaceGuardrailConfig('ws-1')
      expect(result!.blocked_topics).toEqual(['violence', 'drugs', 'weapons'])
    })

    it('returns null when rows exist but yield empty merged config', async () => {
      const rows = [{ config: '{}' }]
      const pool = makePool([rows, []])
      const infra = createMysqlInfra(pool)

      const result = await infra.getWorkspaceGuardrailConfig('ws-1')
      expect(result).toBeNull()
    })
  })
})
