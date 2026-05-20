import { describe, it, expect, vi, beforeEach } from 'vitest'

const { fakePool } = vi.hoisted(() => {
  const fakePool = { execute: vi.fn(), getConnection: vi.fn() }
  return { fakePool }
})

vi.mock('mysql2/promise', () => ({
  default: {
    createPool: vi.fn().mockReturnValue(fakePool),
  },
}))

import mysql from 'mysql2/promise'
import { createPool } from './pool.js'

describe('createPool', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns the pool created by mysql2', () => {
    const pool = createPool({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: 'secret',
      database: 'testdb',
    })

    expect(pool).toBe(fakePool)
  })

  it('passes connection options to mysql2.createPool', () => {
    createPool({
      host: '10.0.0.1',
      port: 3307,
      user: 'admin',
      password: 'pw',
      database: 'mydb',
    })

    expect(mysql.createPool).toHaveBeenCalledWith({
      host: '10.0.0.1',
      port: 3307,
      user: 'admin',
      password: 'pw',
      database: 'mydb',
      waitForConnections: true,
      connectionLimit: 10,
    })
  })

  it('uses custom connectionLimit when provided', () => {
    createPool({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: 'secret',
      database: 'testdb',
      connectionLimit: 25,
    })

    expect(mysql.createPool).toHaveBeenCalledWith(
      expect.objectContaining({ connectionLimit: 25 }),
    )
  })

  it('defaults connectionLimit to 10 when omitted', () => {
    createPool({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: 'secret',
      database: 'testdb',
    })

    expect(mysql.createPool).toHaveBeenCalledWith(
      expect.objectContaining({ connectionLimit: 10 }),
    )
  })
})
