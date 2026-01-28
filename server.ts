import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import multer from 'multer';
import * as fs from 'fs';

// Import route handlers
import { createAllRoutes } from './services/routes/index.js';

// Import services
import { DataImportService } from './services/dataImportService.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.API_PORT || 3051;

// Database connection pool
let dbPool: mysql.Pool | null = null;
let dataImportService: DataImportService | null = null;

// Request deduplication
const pendingRequests = new Map<string, Promise<any>>();

const createDatabasePool = async () => {
  try {
    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.MYSQL_USER || 'soonermineral',
      password: process.env.MYSQL_PASSWORD || 'soonermineralpass',
      database: process.env.MYSQL_DATABASE || 'soonermineraldb',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      idleTimeout: 300000, // 5 minutes
    };
    
    console.log('🔌 Attempting to connect to database...');
    console.log(`   Host: ${dbConfig.host}`);
    console.log(`   Port: ${dbConfig.port}`);
    console.log(`   Database: ${dbConfig.database}`);
    console.log(`   User: ${dbConfig.user}`);
    
    dbPool = mysql.createPool(dbConfig);
    
    // Test the connection
    try {
      const connection = await dbPool.getConnection();
      await connection.ping();
      connection.release();
      console.log('✅ Database connection pool created and tested successfully');
      
      // Initialize data import service after database connection
      try {
        dataImportService = new DataImportService(dbPool);
        console.log('✅ Data import service initialized');
      } catch (error: any) {
        console.error('❌ Failed to initialize data import service:', error.message);
        dbPool = null; // Mark as failed
      }
    } catch (error: any) {
      console.error('❌ Database connection test failed:', error.message);
      console.error('   Error details:', error);
      console.log('');
      console.log('⚠️  Make sure:');
      console.log('   1. MySQL database is running');
      console.log('   2. Database credentials are correct in .env file');
      console.log('   3. Database "' + dbConfig.database + '" exists');
      console.log('   4. User "' + dbConfig.user + '" has proper permissions');
      console.log('   5. Port ' + dbConfig.port + ' is accessible');
      dbPool = null; // Mark as failed
    }
  } catch (error: any) {
    console.error('❌ Database pool creation failed:', error.message);
    console.error('   Error details:', error);
    dbPool = null;
    console.log('');
    console.log('⚠️  Make sure your MySQL database is running and accessible');
  }
};

// Initialize database connection pool
createDatabasePool().catch((error) => {
  console.error('❌ Failed to initialize database pool:', error);
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/imports';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    const allowedExtensions = ['.csv', '.xlsx', '.xls'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (allowedMimes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV and Excel files (.csv, .xls, .xlsx) are allowed.'));
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit for Excel files
  }
});

// Register all routes
app.use(createAllRoutes(dbPool, upload, dataImportService));

// Error handling middleware for multer
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (error instanceof multer.MulterError) {
    console.error('Multer error:', error);
    return res.status(400).json({
      success: false,
      message: 'File upload error: ' + error.message
    });
  }
  if (error) {
    console.error('Upload middleware error:', error);
    return res.status(400).json({
      success: false,
      message: 'File upload error: ' + error.message
    });
  }
  next();
});

// General error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Import API server running on port ${PORT}`);
  console.log(`📊 Database: MySQL (${process.env.MYSQL_DATABASE || 'soonermineraldb'})`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});

export default app;

