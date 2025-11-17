import type { Pool } from 'mysql2/promise';

/**
 * Execute a database query with connection pool
 */
export const executeQuery = async (
  dbPool: Pool | null,
  query: string,
  params: any[] = []
): Promise<any[]> => {
  if (!dbPool) {
    throw new Error('Database pool not initialized');
  }
  
  let connection;
  try {
    connection = await dbPool.getConnection();
    const [rows] = await connection.execute(query, params);
    return rows as any[];
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

