import type mysql from 'mysql2/promise'
import type { IntegrationRepository, IntegrationData } from '@supaproxy/core/domain/integration'
import { type IntegrationRow, mapIntegrationRow } from './IntegrationRowMappers.js'

export class MysqlIntegrationRepository implements IntegrationRepository {
  constructor(private readonly pool: mysql.Pool) {}

  async findByOrg(orgId: string): Promise<IntegrationData[]> {
    const [rows] = await this.pool.execute<IntegrationRow[]>(
      'SELECT * FROM consumer_integrations WHERE org_id = ? ORDER BY type',
      [orgId],
    )
    return rows.map(mapIntegrationRow)
  }

  async findByOrgAndType(orgId: string, type: string): Promise<IntegrationData | null> {
    const [rows] = await this.pool.execute<IntegrationRow[]>(
      'SELECT * FROM consumer_integrations WHERE org_id = ? AND type = ? LIMIT 1',
      [orgId, type],
    )
    return rows[0] ? mapIntegrationRow(rows[0]) : null
  }

  async create(data: IntegrationData): Promise<void> {
    await this.pool.execute(
      'INSERT INTO consumer_integrations (id, org_id, type, status) VALUES (?, ?, ?, ?)',
      [data.id, data.org_id, data.type, data.status],
    )
  }

  async updateStatus(id: string, status: 'active' | 'inactive'): Promise<void> {
    await this.pool.execute('UPDATE consumer_integrations SET status = ? WHERE id = ?', [status, id])
  }

  async delete(id: string): Promise<void> {
    await this.pool.execute('DELETE FROM consumer_integrations WHERE id = ?', [id])
  }
}
