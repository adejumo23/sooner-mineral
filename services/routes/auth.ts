import { Router } from 'express';
import type { Pool } from 'mysql2/promise';
import { executeQuery } from '../utils/database.js';
import { hashPassword, verifyPassword } from '../utils/password.js';

export const createAuthRoutes = (dbPool: Pool | null) => {
  const router = Router();

  // Login endpoint
  router.post('/api/auth/login', async (req, res) => {
    try {
      if (!dbPool) {
        return res.status(500).json({ success: false, message: 'Database pool not initialized' });
      }

      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
      }

      // Query the database for the user
      const query = `
        SELECT 
          u.id,
          u.name,
          u.email,
          u.password_hash,
          u.role_id,
          r.name as role_name
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        WHERE u.email = ?
      `;
      
      const users = await executeQuery(dbPool, query, [email]);
      
      console.log('Login attempt for email:', email);
      console.log('Users found:', users.length);
      
      if (users.length === 0) {
        console.log('No user found with email:', email);
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      const user = users[0];
      console.log('User found:', { id: user.id, email: user.email });
      
      // Check if stored password is already MD5 hashed (32 hex characters) or plaintext
      const isMD5Hash = /^[a-f0-9]{32}$/i.test(user.password_hash);
      
      let passwordValid = false;
      if (isMD5Hash) {
        // Password is already hashed, verify using MD5 comparison
        passwordValid = verifyPassword(password, user.password_hash);
      } else {
        // Password is plaintext (legacy), compare directly and upgrade to MD5
        if (user.password_hash === password) {
          passwordValid = true;
          // Upgrade plaintext password to MD5 hash
          const hashedPassword = hashPassword(password);
          await executeQuery(dbPool, 'UPDATE users SET password_hash = ? WHERE id = ?', [hashedPassword, user.id]);
          console.log('Upgraded plaintext password to MD5 hash for user:', user.email);
        }
      }
      
      if (!passwordValid) {
        console.log('Password verification failed for user:', user.email);
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }
      
      console.log('Login successful for user:', user.email);

      // Return user data (without password)
      res.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: {
            id: user.role_id,
            name: user.role_name || 'User'
          }
        }
      });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Login failed',
        error: error.message
      });
    }
  });

  // Logout endpoint
  router.post('/api/auth/logout', (req, res) => {
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  });

  return router;
};

