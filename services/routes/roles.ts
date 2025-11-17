import { Router } from 'express';
import type { Pool } from 'mysql2/promise';
import { executeQuery } from '../utils/database.js';

export const createRolesRoutes = (dbPool: Pool | null) => {
  const router = Router();

  // Get all roles
  router.get('/api/roles', async (req, res) => {
    try {
      if (!dbPool) {
        return res.status(500).json({ success: false, message: 'Database pool not initialized' });
      }

      const query = `
        SELECT 
          id,
          name,
          description,
          created_at,
          updated_at
        FROM roles
        ORDER BY name
      `;

      const rows = await executeQuery(dbPool, query);
      
      const roles = rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description || '',
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));

      res.json(roles);
    } catch (error: any) {
      console.error('Error fetching roles:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch roles',
        error: error.message
      });
    }
  });

  return router;
};

