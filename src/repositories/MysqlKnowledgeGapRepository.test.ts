import { describe, it, expect, vi } from 'vitest'
import { MysqlKnowledgeGapRepository } from './MysqlKnowledgeGapRepository.js'

function mockPool(queryRows: unknown[] = []) {
  return {
    execute: vi.fn().mockResolvedValue([{}, []]),
    query: vi.fn().mockResolvedValue([queryRows, []]),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any
}

describe('MysqlKnowledgeGapRepository', () => {
  it('inserts a gap with the sources serialised as JSON', async () => {
    const pool = mockPool()
    const repo = new MysqlKnowledgeGapRepository(pool)
    await repo.create({
      id: 'g1', workspaceId: 'ws1', conversationId: 'c1', topic: 'Rates',
      missingInformation: 'APR', sourcesChecked: ['policy', 'tool'], gapDetail: 'no apr', userName: 'Bob',
    })
    const [sql, params] = pool.execute.mock.calls[0]
    expect(sql).toContain('INSERT INTO knowledge_gaps')
    expect(params[0]).toBe('g1')
    expect(params[5]).toBe(JSON.stringify(['policy', 'tool']))
  })

  it('maps rows to the aggregated shape, parsing sources from a JSON string', async () => {
    const pool = mockPool([
      { topic: 'Rates', missing_information: 'APR', sources_checked: '["policy"]', gap_detail: 'no apr', conversation_id: 'c1', user_name: 'Bob', created_at: '2026-06-07T00:00:00.000Z' },
    ])
    const repo = new MysqlKnowledgeGapRepository(pool)
    const gaps = await repo.listByWorkspace('ws1', 20)
    expect(gaps[0]).toEqual({
      topic: 'Rates', missing_information: 'APR', sources_checked: ['policy'], gap_detail: 'no apr',
      conversation_id: 'c1', user_name: 'Bob', timestamp: '2026-06-07T00:00:00.000Z',
    })
    // query() is used (not execute) so LIMIT binds correctly
    expect(pool.query).toHaveBeenCalled()
  })

  it('handles an already-parsed array, nulls, and a Date created_at', async () => {
    const pool = mockPool([
      { topic: 'X', missing_information: null, sources_checked: ['a', 'b'], gap_detail: null, conversation_id: null, user_name: null, created_at: new Date('2026-06-07T00:00:00.000Z') },
    ])
    const repo = new MysqlKnowledgeGapRepository(pool)
    const gaps = await repo.listByWorkspace('ws1', 20)
    expect(gaps[0].sources_checked).toEqual(['a', 'b'])
    expect(gaps[0].missing_information).toBe('')
    expect(gaps[0].timestamp).toBe('2026-06-07T00:00:00.000Z')
  })
})
