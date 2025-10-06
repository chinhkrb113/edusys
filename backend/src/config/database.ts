import mysql from 'mysql2/promise';
import { logger } from '../utils/logger';

export interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  connectionLimit: number;
}

const dbConfig: DatabaseConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'curriculum_management',
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10'),
};

let pool: mysql.Pool | null = null;

export const getPool = (): mysql.Pool => {
  if (!pool) {
    pool = mysql.createPool({
      ...dbConfig,
      connectTimeout: 5000,
    });

    // Handle pool events
    pool.on('connection', (connection) => {
      logger.info('Database connection established', {
        threadId: connection.threadId
      });
    });
  }
  return pool;
};

export const config = {
  testConnection: async (): Promise<void> => {
    try {
      // Test with direct connection instead of pool
      const mysql = await import('mysql2/promise');
      const connection = await mysql.createConnection({
        host: dbConfig.host,
        port: dbConfig.port,
        user: dbConfig.user,
        password: dbConfig.password,
        database: dbConfig.database,
        connectTimeout: 5000,
      });

      await connection.execute('SELECT 1');
      await connection.end();
      logger.info('Database connection test successful');
    } catch (error) {
      logger.error('Database connection test failed:', error);
      throw error;
    }
  },

  query: async <T = any>(
    sql: string,
    params: any[] = []
  ): Promise<[mysql.RowDataPacket[], mysql.FieldPacket[]]> => {
    const pool = getPool();
    try {
      const [rows, fields] = await pool.query(sql, params);
      return [rows as mysql.RowDataPacket[], fields];
    } catch (error) {
      logger.error('Database query error:', { sql, params, error });
      throw error;
    }
  },

  transaction: async <T>(
    callback: (connection: mysql.PoolConnection) => Promise<T>
  ): Promise<T> => {
    const pool = getPool();
    const connection = await pool.getConnection();

    await connection.beginTransaction();

    try {
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      logger.error('Transaction rolled back:', error);
      throw error;
    } finally {
      connection.release();
    }
  },

  close: async (): Promise<void> => {
    if (pool) {
      await pool.end();
      pool = null;
      logger.info('Database pool closed');
    }
  }
};

export default config;