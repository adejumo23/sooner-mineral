import { Router } from 'express';
import type { Pool } from 'mysql2/promise';
import { executeQuery } from '../utils/database.js';
import { hashPassword } from '../utils/password.js';

export const createUsersRoutes = (dbPool: Pool | null) => {
  const router = Router();

  // Get all users with pagination
  router.get('/api/users', async (req, res) => {
    try {
      if (!dbPool) {
        return res.status(500).json({ success: false, message: 'Database pool not initialized' });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;

      if (page < 1 || limit < 1 || limit > 1000) {
        return res.status(400).json({
          success: false,
          message: 'Invalid pagination parameters. Page must be >= 1, limit must be between 1 and 1000'
        });
      }

      const countQuery = `SELECT COUNT(*) as total FROM users`;
      const countResult = await executeQuery(dbPool, countQuery);
      const totalCount = countResult[0].total;

      const query = `
        SELECT 
          u.id,
          u.name,
          u.email,
          u.created_at,
          u.updated_at,
          r.name as role_name,
          r.id as role_id
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        ORDER BY u.name
        LIMIT ${limit} OFFSET ${offset}
      `;

      const rows = await executeQuery(dbPool, query);
      
      const users = rows.map(row => ({
        id: row.id,
        name: row.name,
        email: row.email,
        phone: null,
        role: {
          id: row.role_id,
          name: row.role_name || 'User'
        },
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));

      const totalPages = Math.ceil(totalCount / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      res.json({
        data: users,
        pagination: {
          page: page,
          limit: limit,
          total: totalCount,
          totalPages: totalPages,
          hasNextPage: hasNextPage,
          hasPrevPage: hasPrevPage,
          nextPage: hasNextPage ? page + 1 : null,
          prevPage: hasPrevPage ? page - 1 : null
        }
      });
    } catch (error: any) {
      console.error('Error fetching users:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch users',
        error: error.message
      });
    }
  });

  // Create a new user
  router.post('/api/users', async (req, res) => {
    try {
      if (!dbPool) {
        return res.status(500).json({ success: false, message: 'Database pool not initialized' });
      }

      const { name, email, password, roleId } = req.body;

      if (!name || !email || !password || !roleId) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: name, email, password, and roleId are required'
        });
      }

      const checkQuery = `SELECT id FROM users WHERE email = ?`;
      const existingUser = await executeQuery(dbPool, checkQuery, [email]);
      
      if (existingUser.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'User with this email already exists'
        });
      }

      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const hashedPassword = hashPassword(password);

      const insertQuery = `
        INSERT INTO users (id, name, email, password_hash, role_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, NOW(), NOW())
      `;
      
      await executeQuery(dbPool, insertQuery, [userId, name, email, hashedPassword, roleId]);

      const fetchQuery = `
        SELECT 
          u.id,
          u.name,
          u.email,
          u.created_at,
          u.updated_at,
          r.name as role_name,
          r.id as role_id
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        WHERE u.id = ?
      `;
      
      const newUser = await executeQuery(dbPool, fetchQuery, [userId]);
      
      if (newUser.length === 0) {
        return res.status(500).json({
          success: false,
          message: 'User created but failed to retrieve'
        });
      }

      const user = newUser[0];
      const response = {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: null,
        role: {
          id: user.role_id,
          name: user.role_name || 'User'
        },
        createdAt: user.created_at,
        updatedAt: user.updated_at
      };

      res.status(201).json(response);
    } catch (error: any) {
      console.error('Error creating user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create user',
        error: error.message
      });
    }
  });

  // Update an existing user
  router.put('/api/users/:id', async (req, res) => {
    try {
      if (!dbPool) {
        return res.status(500).json({ success: false, message: 'Database pool not initialized' });
      }

      const userId = req.params.id;
      const { name, email, roleId, password } = req.body;

      const checkUserQuery = `SELECT id FROM users WHERE id = ?`;
      const existingUser = await executeQuery(dbPool, checkUserQuery, [userId]);
      
      if (existingUser.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const updates: string[] = [];
      const values: any[] = [];

      if (name !== undefined) {
        updates.push('name = ?');
        values.push(name);
      }

      if (email !== undefined) {
        const emailCheckQuery = `SELECT id FROM users WHERE email = ? AND id != ?`;
        const emailCheck = await executeQuery(dbPool, emailCheckQuery, [email, userId]);
        
        if (emailCheck.length > 0) {
          return res.status(409).json({
            success: false,
            message: 'Email is already taken by another user'
          });
        }
        
        updates.push('email = ?');
        values.push(email);
      }

      if (roleId !== undefined) {
        updates.push('role_id = ?');
        values.push(roleId);
      }

      if (password !== undefined && password !== '') {
        const hashedPassword = hashPassword(password);
        updates.push('password_hash = ?');
        values.push(hashedPassword);
      }

      if (updates.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No fields to update'
        });
      }

      updates.push('updated_at = NOW()');
      values.push(userId);

      const updateQuery = `
        UPDATE users 
        SET ${updates.join(', ')}
        WHERE id = ?
      `;
      
      await executeQuery(dbPool, updateQuery, values);

      const fetchQuery = `
        SELECT 
          u.id,
          u.name,
          u.email,
          u.created_at,
          u.updated_at,
          r.name as role_name,
          r.id as role_id
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        WHERE u.id = ?
      `;
      
      const updatedUser = await executeQuery(dbPool, fetchQuery, [userId]);
      
      if (updatedUser.length === 0) {
        return res.status(500).json({
          success: false,
          message: 'User updated but failed to retrieve'
        });
      }

      const user = updatedUser[0];
      const response = {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: null,
        role: {
          id: user.role_id,
          name: user.role_name || 'User'
        },
        createdAt: user.created_at,
        updatedAt: user.updated_at
      };

      res.json(response);
    } catch (error: any) {
      console.error('Error updating user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update user',
        error: error.message
      });
    }
  });

  // Delete a user
  router.delete('/api/users/:id', async (req, res) => {
    try {
      if (!dbPool) {
        return res.status(500).json({ success: false, message: 'Database pool not initialized' });
      }

      const userId = req.params.id;

      const checkUserQuery = `SELECT id FROM users WHERE id = ?`;
      const existingUser = await executeQuery(dbPool, checkUserQuery, [userId]);
      
      if (existingUser.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const deleteQuery = `DELETE FROM users WHERE id = ?`;
      await executeQuery(dbPool, deleteQuery, [userId]);

      res.json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error: any) {
      console.error('Error deleting user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete user',
        error: error.message
      });
    }
  });

  return router;
};

