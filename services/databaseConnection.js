// ============================================================================
// DATABASE CONNECTION SERVICE
// ============================================================================
// Real database connection for the Sooner Mineral application
// ============================================================================

import mysql from 'mysql2/promise';

// Database configuration from environment variables
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3359'),
  user: process.env.MYSQL_USER || 'soonermineral',
  password: process.env.MYSQL_PASSWORD || 'soonermineralpass',
  database: process.env.MYSQL_DATABASE || 'soonermineraldb',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
};

// Create connection pool
let pool = null;

// Initialize database connection
export const initializeDatabase = async () => {
  try {
    pool = mysql.createPool(dbConfig);
    
    // Test the connection
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    connection.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
};

// Get database connection
export const getDatabase = () => {
  if (!pool) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return pool;
};

// Execute query with error handling
export const executeQuery = async (query, params = []) => {
  try {
    if (!pool) {
      console.warn('Database not connected, returning empty result');
      return []; // Return empty array instead of throwing error
    }
    const db = getDatabase();
    const [rows] = await db.execute(query, params);
    return rows;
  } catch (error) {
    console.error('Database query error:', error);
    console.error('Query:', query);
    console.error('Params:', params);
    // Don't throw error, return empty array to allow graceful degradation
    console.warn('Database query failed, returning empty result');
    return [];
  }
};

// Execute transaction
export const executeTransaction = async (queries) => {
  const db = getDatabase();
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    for (const { query, params = [] } of queries) {
      await connection.execute(query, params);
    }
    
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// Close database connection
export const closeDatabase = async () => {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('Database connection closed');
  }
};

// Health check
export const healthCheck = async () => {
  try {
    const db = getDatabase();
    const connection = await db.getConnection();
    await connection.ping();
    connection.release();
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
};

export default {
  initializeDatabase,
  getDatabase,
  executeQuery,
  executeTransaction,
  closeDatabase,
  healthCheck
};
