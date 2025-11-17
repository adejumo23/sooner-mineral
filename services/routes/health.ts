import { Router } from 'express';
import type { Pool } from 'mysql2/promise';

export const createHealthRoutes = (dbPool: Pool | null) => {
  const router = Router();

  // Health check endpoint
  router.get('/api/health', async (req, res) => {
    try {
      if (dbPool) {
        const connection = await dbPool.getConnection();
        await connection.ping();
        connection.release();
      }
      
      res.json({ 
        status: 'OK', 
        message: 'Import API server is running',
        database: dbPool ? 'Connected' : 'Disconnected',
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      res.status(500).json({
        status: 'ERROR',
        message: 'Database connection failed',
        database: 'Disconnected',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Root endpoint
  router.get('/api', (req, res) => {
    res.json({ 
      message: 'Sooner Mineral API Server',
      version: '1.0.0',
      endpoints: [
        '/api/health'
      ]
    });
  });

  // Debug endpoint to check database tables
  router.get('/api/debug/tables', async (req, res) => {
    try {
      if (!dbPool) {
        return res.status(500).json({
          success: false,
          message: 'Database not connected'
        });
      }

      const databaseName = process.env.MYSQL_DATABASE || 'soonermineraldb';
      console.log('Debug: Fetching all tables for database:', databaseName);
      
      const query = `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = ?
      `;
      
      const connection = await dbPool.getConnection();
      const [tables] = await connection.execute(query, [databaseName]);
      connection.release();
      
      console.log('Debug: All tables found:', tables);
      
      res.json({
        success: true,
        database: databaseName,
        tables: tables
      });
    } catch (error: any) {
      console.error('Debug error:', error);
      res.status(500).json({
        success: false,
        message: 'Debug failed',
        error: error.message
      });
    }
  });

  return router;
};

