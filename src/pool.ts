import mysql from 'mysql2/promise'

export interface MysqlPoolOptions {
  host: string
  port: number
  user: string
  password: string
  database: string
  connectionLimit?: number
}

export function createPool(options: MysqlPoolOptions): mysql.Pool {
  return mysql.createPool({
    host: options.host,
    port: options.port,
    user: options.user,
    password: options.password,
    database: options.database,
    waitForConnections: true,
    connectionLimit: options.connectionLimit ?? 10,
  })
}
