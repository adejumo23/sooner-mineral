import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import multer from 'multer';
import XLSX from 'xlsx';
import csv from 'csv-parser';
import * as fs from 'fs';
import { DataImportService } from './services/dataImportService.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.API_PORT || 3051;

// Database connection pool
let dbPool;
let dataImportService;

// Assignment cache to ensure consistency between list and detail views
let assignmentCache = null;
let cacheTimestamp = null;
let cacheLoading = false;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

// Request deduplication to prevent multiple identical requests
const pendingRequests = new Map();

const createDatabasePool = () => {
  try {
    dbPool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.MYSQL_USER || 'soonermineral',
      password: process.env.MYSQL_PASSWORD || 'soonermineralpass',
      database: process.env.MYSQL_DATABASE || 'soonermineraldb',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      idleTimeout: 300000, // 5 minutes
    });
    console.log('✅ Database connection pool created');
    
    // Initialize data import service after database connection
    try {
      dataImportService = new DataImportService(dbPool);
      console.log('✅ Data import service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize data import service:', error.message);
    }
  } catch (error) {
    console.error('❌ Database pool creation failed:', error.message);
    console.log('Make sure your MySQL database is running on port 3359');
  }
};

// Initialize database connection pool
createDatabasePool();

// Function to load all assignments into cache
const loadAssignmentCache = async () => {
  try {
    if (!dbPool) {
      throw new Error('Database pool not initialized');
    }

    console.log('🔄 Loading assignment cache...');
    
    const query = `
      SELECT DISTINCT
        OWNER as contactName,
        CURRENT_UNIT_NAME as unitName,
        NMA as grossAcres,
        NMA as netMineralAcres,
        ROY as royalty,
        NMA as nra,
        ALLO_ as ownershipPercentage,
        BUYER as buyer,
        STATUS as status,
        created_at,
        updated_at
      FROM prod_acreage_schedule
      WHERE OWNER IS NOT NULL AND OWNER != ''
        AND BUYER IS NOT NULL AND BUYER != ''
      ORDER BY 
        CASE 
          WHEN BUYER = 'MICHELLE' THEN 0
          WHEN BUYER = 'JOSH' THEN 1
          ELSE 2
        END,
        OWNER,
        CURRENT_UNIT_NAME
    `;

    const rows = await executeQuery(query);
    
    // Function to simplify contact names
    const simplifyContactName = (name) => {
      if (!name) return 'Unknown Contact';
      
      // Remove "a/k/a" and everything after ">"
      let simplified = name.split('>')[0].split('a/k/a')[0].trim();
      
      // Remove common suffixes and clean up
      simplified = simplified.replace(/\s*,\s*$/, ''); // Remove trailing commas
      simplified = simplified.replace(/\s+HEIRS:.*$/, ''); // Remove HEIRS: part
      simplified = simplified.replace(/\s+et\s+al.*$/, ''); // Remove et al
      
      // Limit length to 50 characters
      if (simplified.length > 50) {
        simplified = simplified.substring(0, 47) + '...';
      }
      
      return simplified;
    };

    // Transform all rows into assignment objects
    assignmentCache = rows.map((row, index) => {
      // Determine asset type and ID based on unit name
      const assetType = row.unitName ? 'Unit' : 'Tract';
      const assetId = row.unitName || `Tract-${row.contactName}-${index}`;
      
      // Calculate priority score based on acreage and royalty
      const grossAcres = parseFloat(row.grossAcres) || 0;
      const royalty = parseFloat(row.royalty) || 0;
      const priorityScore = Math.min(100, Math.max(10, (grossAcres * 2) + (royalty * 2)));
      
      // Determine status based on database status
      let assignmentStatus = 'Active';
      if (row.status === 'DROPPED') assignmentStatus = 'Cancelled';
      else if (row.status === 'LVM/TXT/EMAIL') assignmentStatus = 'Active';
      else if (row.status === 'NEW') assignmentStatus = 'Active';
      else if (row.status === 'WTL') assignmentStatus = 'Active';
      
      return {
        id: `assignment-${index}`,
        assetType: assetType,
        assetId: assetId,
        assignedBuyerId: row.buyer || 'unassigned',
        priceCapUsd: Math.round(grossAcres * 1000), // Estimate based on acreage
        priceCapType: 'Per Acre',
        sourceChannel: 'Broker',
        priorityScore: Math.round(priorityScore),
        status: assignmentStatus,
        notes: `Contact: ${simplifyContactName(row.contactName)}`,
        assignedDate: row.created_at,
        assignedById: 'system',
        updatedAt: row.updated_at,
        
        // Populated fields for display
        assignedBuyer: {
          id: row.buyer?.toLowerCase() || 'unassigned',
          name: row.buyer || 'Unassigned',
          email: `${row.buyer?.toLowerCase()}@company.com` || 'unassigned@company.com'
        },
        asset: {
          id: assetId,
          sectionName: row.unitName || `Section ${index + 1}`,
          unitName: row.unitName,
          grossAcres: grossAcres,
          netMineralAcres: parseFloat(row.netMineralAcres) || 0,
          royalty: royalty
        }
      };
    });

    cacheTimestamp = Date.now();
    console.log(`✅ Assignment cache loaded with ${assignmentCache.length} assignments`);
    
  } catch (error) {
    console.error('❌ Error loading assignment cache:', error);
    throw error;
  }
};

// Function to get cached assignments or load if needed
const getCachedAssignments = async () => {
  const now = Date.now();
  
  // Check if cache is valid
  if (!assignmentCache || !cacheTimestamp || (now - cacheTimestamp) > CACHE_DURATION) {
    // If cache is already being loaded, wait for it
    if (cacheLoading) {
      // Wait for the current loading to complete
      while (cacheLoading) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return assignmentCache;
    }
    
    // Set loading flag and load cache
    cacheLoading = true;
    try {
      await loadAssignmentCache();
    } finally {
      cacheLoading = false;
    }
  }
  
  return assignmentCache;
};

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

// Helper function to execute queries with connection pool
const executeQuery = async (query, params = []) => {
  if (!dbPool) {
    throw new Error('Database pool not initialized');
  }
  
  let connection;
  try {
    // Get connection from pool
    connection = await dbPool.getConnection();
    const [rows] = await connection.execute(query, params);
    return rows;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  } finally {
    // Always release connection back to pool
    if (connection) {
      connection.release();
    }
  }
};

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    // Test database connection
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
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Database connection failed',
      database: 'Disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});


// Root endpoint for API
app.get('/api', (req, res) => {
  res.json({ 
    message: 'Sooner Mineral API Server',
    version: '1.0.0',
    endpoints: [
      '/api/health'
    ]
  });
});

// Debug endpoint to check database tables
app.get('/api/debug/tables', async (req, res) => {
  try {
    if (!dbPool) {
      return res.status(500).json({
        success: false,
        message: 'Database not connected'
      });
    }

    const databaseName = process.env.MYSQL_DATABASE || 'soonermineraldb';
    console.log('Debug: Fetching all tables for database:', databaseName);
    
    const tables = await executeQuery(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = ?
    `, [databaseName]);
    
    console.log('Debug: All tables found:', tables);
    
    res.json({
      success: true,
      database: databaseName,
      tables: tables
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({
      success: false,
      message: 'Debug failed',
      error: error.message
    });
  }
});

// Authentication endpoints
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Simple mock authentication for development
    if (email === 'admin@sooner.cap' && password === 'password') {
      res.json({
        success: true,
        user: {
          id: 'mock-user',
          name: 'Mock User',
          email: email,
          role: {
            name: 'Administrator',
            id: 'admin-role'
          }
        }
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// File upload endpoint
app.post('/api/import/upload', upload.single('file'), async (req, res) => {
  try {
    console.log('Upload request received:', {
      body: req.body,
      file: req.file ? {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      } : null,
      headers: req.headers
    });
    
    if (!req.file) {
      console.log('No file in request');
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    if (!dbPool) {
      // Database not connected, provide basic file validation response
      console.log('Database not connected, providing basic file validation');
      
      // Basic file validation without database operations
      const fileExtension = path.extname(req.file.originalname).toLowerCase();
      const allowedExtensions = ['.csv', '.xls', '.xlsx'];
      
      if (!allowedExtensions.includes(fileExtension)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid file type. Only CSV and Excel files are allowed.',
          databaseConnected: false
        });
      }

      // File is valid but database is not connected
      return res.json({
        success: true,
        message: `File '${req.file.originalname}' received successfully. Database connection required for full processing.`,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        databaseConnected: false
      });
    }

    // Extract table name from filename
    const tableName = path.parse(req.file.originalname).name.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const stagingTableName = `staging_${tableName}`;
    
    // Check if staging table already exists
    const tableExists = await executeQuery(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = ? AND table_name = ?
    `, [process.env.MYSQL_DATABASE || 'soonermineraldb', stagingTableName]);
    
    if (tableExists[0].count > 0) {
      // Drop existing staging table to allow re-upload
      console.log(`Dropping existing staging table: ${stagingTableName}`);
      try {
        await executeQuery(`DROP TABLE IF EXISTS \`${stagingTableName}\``);
        console.log(`Successfully dropped table: ${stagingTableName}`);
      } catch (dropError) {
        console.error(`Error dropping table ${stagingTableName}:`, dropError);
        // Continue anyway, the table might not exist or might be locked
      }
    }

    // Extract columns from file
    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    let columns = [];
    
    if (fileExtension === '.csv') {
      columns = await extractColumnsFromCSV(req.file.path);
    } else if (fileExtension === '.xlsx' || fileExtension === '.xls') {
      columns = await extractColumnsFromExcel(req.file.path);
    } else {
      return res.status(400).json({
        success: false,
        message: `Unsupported file format: ${fileExtension}`
      });
    }

    // Create staging and production tables
    const productionTableName = `prod_${tableName}`;
    
    const stagingMapping = await createStagingTable(stagingTableName, columns);
    const productionMapping = await createProductionTable(productionTableName, columns);
    
    // Import data to staging table using sanitized columns
    const recordCount = await importDataToStaging(req.file.path, stagingTableName, stagingMapping.sanitizedColumns, fileExtension);
    
    res.json({
      success: true,
      message: `File uploaded successfully. ${recordCount} records imported to staging table.`,
      stagingTableName,
      productionTableName,
      recordCount
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: `Upload failed: ${error.message}`
    });
  }
});

// Error handling middleware for multer
app.use((error, req, res, next) => {
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

// Get staging tables
app.get('/api/import/staging-tables', async (req, res) => {
  try {
    if (!dbPool) {
      return res.json({
        success: true,
        message: 'Database pool not initialized - showing empty staging tables',
        data: [],
        databaseConnected: false
      });
    }

    const databaseName = process.env.MYSQL_DATABASE || 'soonermineraldb';
    console.log('Fetching staging tables for database:', databaseName);
    
    // First, let's see all tables in the database
    const allTables = await executeQuery(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = ?
    `, [databaseName]);
    
    console.log('All tables in database:', allTables);
    
    const tables = await executeQuery(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = ? AND table_name LIKE 'staging_%'
    `, [databaseName]);
    
    console.log('Found tables:', tables);
    
    res.json({
      success: true,
      stagingTables: tables.map(row => row.TABLE_NAME)
    });
  } catch (error) {
    console.error('Error fetching staging tables:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching staging tables'
    });
  }
});

// Get production tables
app.get('/api/import/production-tables', async (req, res) => {
  try {
    console.log('Production tables endpoint hit');
    if (!dbPool) {
      console.log('Database not connected');
      return res.json({
        success: true,
        message: 'Database not connected - showing empty production tables',
        data: [],
        databaseConnected: false
      });
    }

    const databaseName = process.env.MYSQL_DATABASE || 'soonermineraldb';
    console.log('Fetching production tables for database:', databaseName);
    
    const tables = await executeQuery(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = ? AND table_name LIKE 'prod_%'
    `, [databaseName]);
    
    console.log('Found production tables:', tables);
    
    res.json({
      success: true,
      productionTables: tables.map(row => row.TABLE_NAME)
    });
  } catch (error) {
    console.error('Error fetching production tables:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching production tables'
    });
  }
});

// Get staging table data
app.get('/api/import/staging-data/:tableName', async (req, res) => {
  try {
    const { tableName } = req.params;
    const { limit = 100 } = req.query;

    if (!dbPool) {
      return res.json({
        success: true,
        message: 'Database not connected - showing empty data',
        data: [],
        count: 0,
        databaseConnected: false
      });
    }

    console.log('Fetching data from table:', tableName);
    console.log('Limit:', limit);

    const data = await executeQuery(`SELECT * FROM \`${tableName}\` LIMIT ${parseInt(limit)}`);
    
    console.log('Data retrieved:', data.length, 'records');
    
    res.json({
      success: true,
      data,
      count: data.length
    });
  } catch (error) {
    console.error('Error fetching staging data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching staging data',
      error: error.message
    });
  }
});

// Get production table data
app.get('/api/import/production-data/:tableName', async (req, res) => {
  try {
    const { tableName } = req.params;
    const { limit = 100 } = req.query;

    if (!dbPool) {
      return res.json({
        success: true,
        message: 'Database not connected - showing empty data',
        data: [],
        count: 0,
        databaseConnected: false
      });
    }

    console.log('Fetching production data from table:', tableName);
    console.log('Limit:', limit);

    const data = await executeQuery(`SELECT * FROM \`${tableName}\` LIMIT ${parseInt(limit)}`);
    
    console.log('Production data retrieved:', data.length, 'records');
    
    res.json({
      success: true,
      data,
      count: data.length
    });
  } catch (error) {
    console.error('Error fetching production data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching production data',
      error: error.message
    });
  }
});

// Normalize existing production tables endpoint
app.post('/api/import/normalize-existing', async (req, res) => {
  try {
    if (!dbPool) {
      return res.status(500).json({ success: false, message: 'Database pool not initialized' });
    }
    
    if (!dataImportService) {
      return res.status(500).json({ success: false, message: 'Data import service not initialized' });
    }
    
    console.log('Normalizing existing production tables...');
    const result = await dataImportService.normalizeExistingProductionTables();
    
    res.json(result);
  } catch (error) {
    console.error('Error normalizing existing tables:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error normalizing existing tables', 
      error: error.message 
    });
  }
});

// Get normalized data overview - using production tables
app.get('/api/normalized/overview', async (req, res) => {
  try {
    if (!dbPool) {
      return res.json({ 
        success: true, 
        message: 'Database not connected - showing empty data',
        data: [],
        databaseConnected: false
      });
    }

    const query = `
      SELECT 'prod_acreage_schedule' as table_name, COUNT(*) as record_count FROM prod_acreage_schedule
      UNION ALL
      SELECT 'prod_oklahoma_pricing', COUNT(*) FROM prod_oklahoma_pricing
      UNION ALL
      SELECT 'prod_texas_pricing', COUNT(*) FROM prod_texas_pricing
      UNION ALL
      SELECT 'prod_unit_summary', COUNT(*) FROM prod_unit_summary
      ORDER BY table_name
    `;

    const rows = await executeQuery(query);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching normalized overview:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching normalized overview', 
      error: error.message 
    });
  }
});

// Get pricing data summary
app.get('/api/normalized/pricing-summary', async (req, res) => {
  try {
    if (!dbPool) {
      return res.json({ 
        success: true, 
        message: 'Database not connected - showing empty data',
        data: [],
        databaseConnected: false
      });
    }

    const query = `
      SELECT
        'Oklahoma' as formation,
        COUNT(*) as pricing_records,
        AVG(CAST(Unit_Price AS DECIMAL(10,2))) as avg_price,
        MIN(CAST(Unit_Price AS DECIMAL(10,2))) as min_price,
        MAX(CAST(Unit_Price AS DECIMAL(10,2))) as max_price
      FROM prod_oklahoma_pricing
      WHERE Unit_Price IS NOT NULL AND Unit_Price != '' AND Unit_Price != '0'
      UNION ALL
      SELECT
        'Texas' as formation,
        COUNT(*) as pricing_records,
        AVG(CAST(Output_Price AS DECIMAL(10,2))) as avg_price,
        MIN(CAST(Output_Price AS DECIMAL(10,2))) as min_price,
        MAX(CAST(Output_Price AS DECIMAL(10,2))) as max_price
      FROM prod_texas_pricing
      WHERE Output_Price IS NOT NULL AND Output_Price != '' AND Output_Price != '0'
      ORDER BY avg_price DESC
    `;

    const rows = await executeQuery(query);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching pricing summary:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching pricing summary', 
      error: error.message 
    });
  }
});

// Get acreage data summary
app.get('/api/normalized/acreage-summary', async (req, res) => {
  try {
    if (!dbPool) {
      return res.json({ 
        success: true, 
        message: 'Database not connected - showing empty data',
        data: [],
        databaseConnected: false
      });
    }

    const query = `
      SELECT 
        COUNTY as county,
        COUNT(DISTINCT OWNER) as unique_owners,
        COUNT(*) as mineral_interests,
        SUM(CAST(NMA AS DECIMAL(10,2))) as total_acres,
        AVG(CAST(ALLO_ AS DECIMAL(5,2))) as avg_interest
      FROM prod_acreage_schedule
      WHERE NMA IS NOT NULL AND NMA != '' AND NMA != '0'
      GROUP BY COUNTY
      ORDER BY total_acres DESC
    `;

    const rows = await executeQuery(query);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching acreage summary:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching acreage summary', 
      error: error.message 
    });
  }
});

// Get unit/well data summary
app.get('/api/normalized/unit-summary', async (req, res) => {
  try {
    if (!dbPool) {
      return res.json({ 
        success: true, 
        message: 'Database not connected - showing empty data',
        data: [],
        databaseConnected: false
      });
    }

    const query = `
      SELECT 
        'Production Data' as operator,
        COUNT(*) as total_units,
        COUNT(*) as total_wells,
        AVG(CAST(ALLO_ AS DECIMAL(5,2))) as avg_allocation,
        AVG(CAST(ROY AS DECIMAL(5,2))) as avg_pricing
      FROM prod_acreage_schedule
      WHERE ALLO_ IS NOT NULL AND ALLO_ != '' AND ALLO_ != '0'
      UNION ALL
      SELECT 
        'Oklahoma Pricing' as operator,
        COUNT(*) as total_units,
        COUNT(*) as total_wells,
        0 as avg_allocation,
        AVG(CAST(Unit_Price AS DECIMAL(10,2))) as avg_pricing
      FROM prod_oklahoma_pricing
      WHERE Unit_Price IS NOT NULL AND Unit_Price != '' AND Unit_Price != '0'
      UNION ALL
      SELECT 
        'Texas Pricing' as operator,
        COUNT(*) as total_units,
        COUNT(*) as total_wells,
        0 as avg_allocation,
        AVG(CAST(Output_Price AS DECIMAL(10,2))) as avg_pricing
      FROM prod_texas_pricing
      WHERE Output_Price IS NOT NULL AND Output_Price != '' AND Output_Price != '0'
      ORDER BY total_units DESC
    `;

    const rows = await executeQuery(query);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching unit summary:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching unit summary', 
      error: error.message 
    });
  }
});

// Test endpoint first
app.get('/api/test-acreage', async (req, res) => {
  try {
    if (!dbPool) {
      return res.status(500).json({ success: false, message: 'Database pool not initialized' });
    }

    const query = `SELECT * FROM prod_acreage_schedule LIMIT 1`;
    const rows = await executeQuery(query);
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Error testing acreage:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error testing acreage', 
      error: error.message 
    });
  }
});

// Test endpoint for pricing table structure
app.get('/api/test-pricing-structure', async (req, res) => {
  try {
    if (!dbPool) {
      return res.status(500).json({ success: false, message: 'Database pool not initialized' });
    }

    const oklahomaRows = await executeQuery(`DESCRIBE prod_oklahoma_pricing`);
    const texasRows = await executeQuery(`DESCRIBE prod_texas_pricing`);
    
    res.json({ 
      success: true, 
      data: {
        oklahoma_columns: oklahomaRows,
        texas_columns: texasRows
      }
    });
  } catch (error) {
    console.error('Error testing pricing structure:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error testing pricing structure', 
      error: error.message 
    });
  }
});

// Get Oklahoma pricing data
app.get('/api/pricing/oklahoma', async (req, res) => {
  try {
    if (!dbPool) {
      return res.status(500).json({ success: false, message: 'Database pool not initialized' });
    }

    const query = `
      SELECT 
        id,
        County,
        SEC,
        TWN,
        RNG,
        T_R,
        S_T_R,
        SEC_2,
        TWN_2,
        RNG_3,
        STR,
        Play,
        WDFD_Curve,
        MRMC_Curve,
        SPGR_Curve,
        SYC_Curve,
        OSG_Curve,
        Acquisition_Area,
        Type_Curve_Price,
        Unit_Price,
        Play AS Basin,
        'Oklahoma Survey' AS Survey_Company,
        Play AS Formation,
        CAST(Unit_Price AS DECIMAL(10,2)) AS Price_Per_Acre,
        created_at,
        updated_at
      FROM prod_oklahoma_pricing
      WHERE Unit_Price IS NOT NULL AND Unit_Price != '' AND Unit_Price != '0'
      ORDER BY CAST(Unit_Price AS DECIMAL(10,2)) DESC
      LIMIT 500
    `;

    const rows = await executeQuery(query);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching Oklahoma pricing:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching Oklahoma pricing data', 
      error: error.message 
    });
  }
});

// Get Texas pricing data
app.get('/api/pricing/texas', async (req, res) => {
  try {
    if (!dbPool) {
      return res.status(500).json({ success: false, message: 'Database pool not initialized' });
    }

    const query = `
      SELECT 
        id,
        Unique_ID,
        Basin,
        County,
        FIP_ID,
        Abstract,
        Section,
        Block,
        Survey,
        ANUM,
        State_Land_,
        Upper_Spraberry,
        Lower_Spraberry,
        3rd_Bone_Spring,
        Wolfcamp_A,
        Wolfcamp_B,
        Lower_Wolfcamp_B,
        Wolfcamp_D_Cline_,
        column_17,
        Output_Price,
        column_19,
        Total_BOE_Acre,
        Total_BOE_per_ANUM,
        Letter_Rank_NEW_VALUES_,
        NRA_Price,
        Survey AS Survey_Company,
        'Texas Formation' AS Formation,
        CAST(Output_Price AS DECIMAL(10,2)) AS Price_Per_Acre,
        created_at,
        updated_at
      FROM prod_texas_pricing
      WHERE Output_Price IS NOT NULL AND Output_Price != '' AND Output_Price != '0'
      ORDER BY CAST(Output_Price AS DECIMAL(10,2)) DESC
      LIMIT 500
    `;

    const rows = await executeQuery(query);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching Texas pricing:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching Texas pricing data', 
      error: error.message 
    });
  }
});

// Get single assignment by ID
app.get('/api/assignments/:id', async (req, res) => {
  try {
    if (!dbPool) {
      return res.status(500).json({ success: false, message: 'Database pool not initialized' });
    }

    const { id } = req.params;
    
    // Get cached assignments
    const allAssignments = await getCachedAssignments();
    
    // Find the assignment by ID
    const assignment = allAssignments.find(a => a.id === id);
    
    if (!assignment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Assignment not found' 
      });
    }
    
    res.json(assignment);
  } catch (error) {
    console.error('Error fetching assignment:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching assignment', 
      error: error.message 
    });
  }
});

// Get assignment history
app.get('/api/assignments/:id/history', async (req, res) => {
  try {
    if (!dbPool) {
      return res.status(500).json({ success: false, message: 'Database pool not initialized' });
    }

    const { id } = req.params;
    
    // Return mock assignment history
    const mockHistory = [
      {
        id: 'history-1',
        assignmentId: id,
        action: 'Created',
        description: 'Assignment created and assigned to buyer',
        timestamp: '2025-09-25T03:43:56.000Z',
        userId: 'system',
        userName: 'System'
      },
      {
        id: 'history-2',
        assignmentId: id,
        action: 'Status Changed',
        description: 'Status changed from Active to Cancelled',
        timestamp: '2025-09-25T04:00:00.000Z',
        userId: 'josh',
        userName: 'JOSH'
      }
    ];
    
    res.json(mockHistory);
  } catch (error) {
    console.error('Error fetching assignment history:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching assignment history', 
      error: error.message 
    });
  }
});

// Get tracts data from prod_acreage_schedule table
// Get single tract by ID
app.get('/api/tracts/:id', async (req, res) => {
  try {
    if (!dbPool) {
      return res.status(500).json({ success: false, message: 'Database pool not initialized' });
    }

    const { id } = req.params;
    const query = `
      SELECT 
        id,
        COUNTY,
        S_T_R,
        NULL AS sectionNumber,
        NULL AS township,
        NULL AS \`range\`,
        LEGAL_DESCRIPTION,
        NMA,
        OWNER,
        STREET,
        CITY,
        ST,
        ZIP,
        PHONE_EMAIL,
        ROY,
        ALLO_ AS ALLOCATION_PERCENT,
        TITLE_SOURCE,
        STATUS,
        BUYER,
        NOTE,
        INTEREST_TYPE,
        CONTACT,
        CURRENT_UNIT_NAME,
        PAYSTUB_NRI,
        CALCULATED_ACREAGE,
        column_16,
        column_21,
        column_22,
        TOTAL_,
        LAST_OGL,
        NEW_OCC_TYPE,
        NEW_UNIT_NAME,
        DATE,
        created_at,
        updated_at
      FROM prod_acreage_schedule
      WHERE id = ?
    `;

    const rows = await executeQuery(query, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Tract not found' });
    }

    const row = rows[0];
    
    // Parse S_T_R to extract section, township, range if possible
    const strParts = row.S_T_R ? row.S_T_R.split('-') : [];
    const sectionNumber = strParts[0] || null;
    const township = strParts[1] ? strParts[1].replace(/[NS]/, '') : null;
    const range = strParts[2] ? strParts[2].replace(/[EW]/, '') : null;
    
    // Calculate NRA (Net Royalty Acres) - NMA * Royalty / 0.125
    const netMineralAcres = parseFloat(row.NMA) || 0;
    const royalty = parseFloat(row.ROY) || 0;
    const nra = royalty > 0 ? netMineralAcres * royalty / 0.125 : 0;
    
    // Determine title status based on available data
    let titleStatus = 'Unmapped';
    if (row.LEGAL_DESCRIPTION && row.NMA && row.OWNER) {
      titleStatus = 'Verified';
    } else if (row.LEGAL_DESCRIPTION || row.OWNER) {
      titleStatus = 'In Progress';
    }

    const tract = {
      id: row.id,
      state: row.ST || 'OK', // Default to Oklahoma if not specified
      county: row.COUNTY,
      tractName: `${row.COUNTY} - ${row.S_T_R}`,
      legalDescription: row.LEGAL_DESCRIPTION || '',
      str: row.S_T_R,
      sectionNumber: sectionNumber,
      township: township,
      range: range,
      abstractNumber: null, // Not available in current data
      anum: row.id, // Use ID as unique identifier
      grossAcres: parseFloat(row.NMA) || 0, // Using NMA as gross acres for now
      royalty: royalty,
      netMineralAcres: netMineralAcres,
      nra: nra,
      ownershipPercentage: parseFloat(row.ALLOCATION_PERCENT) || 0,
      titleStatus: titleStatus,
      assignedBuyerId: null, // Not available in current data
      assignedBuyer: null,
      nraCapUsd: parseFloat(row.TOTAL_) || 0, // Using TOTAL_ as potential cap
      sourceChannel: row.TITLE_SOURCE || 'Import',
      routingNotes: row.NOTE || '',
      heldByFund: false, // Default value
      isLocked: false, // Default value
      esgProfileId: null,
      esgRiskLevel: null,
      carbonIntensity: null,
      operatorComplianceScore: null,
      titleVerificationStatus: titleStatus === 'Verified' ? 'Clean' : 'Unknown',
      hasRiskFlags: false,
      lastESGUpdate: null,
      // Additional fields from the original data for reference
      owner: row.OWNER,
      street: row.STREET,
      city: row.CITY,
      zip: row.ZIP,
      phoneEmail: row.PHONE_EMAIL,
      buyer: row.BUYER,
      status: row.STATUS,
      interestType: row.INTEREST_TYPE,
      contact: row.CONTACT,
      currentUnitName: row.CURRENT_UNIT_NAME,
      paystubNri: row.PAYSTUB_NRI,
      calculatedAcreage: row.CALCULATED_ACREAGE,
      lastOgl: row.LAST_OGL,
      newOccType: row.NEW_OCC_TYPE,
      newUnitName: row.NEW_UNIT_NAME,
      date: row.DATE,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };

    res.json(tract);
  } catch (error) {
    console.error('Error fetching tract:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching tract', 
      error: error.message 
    });
  }
});

// Get acreage schedule data from prod_acreage_schedule table
app.get('/api/normalized/recreate-acreage-schedule', async (req, res) => {
  try {
    if (!dbPool) {
      return res.status(500).json({ success: false, message: 'Database pool not initialized' });
    }

    const query = `
      SELECT 
        COUNTY,
        S_T_R AS S_TR,
        LEGAL_DESCRIPTION,
        NMA,
        OWNER,
        STREET,
        CITY,
        ST,
        ZIP,
        PHONE_EMAIL,
        ROY,
        '0' AS ALLOCATION_PERCENT,
        TITLE_SOURCE,
        COALESCE(STATUS, 'Unknown') AS STATUS,
        COALESCE(BUYER, '') AS BUYER,
        COALESCE(NOTE, '') AS NOTE,
        id AS mineral_interest_id,
        id AS property_id,
        id AS owner_id,
        id AS county_id,
        id AS section_id,
        id AS state_id
      FROM prod_acreage_schedule
      ORDER BY COUNTY, S_T_R, OWNER
      LIMIT 1000
    `;

    const rows = await executeQuery(query);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching acreage schedule:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching acreage schedule', 
      error: error.message 
    });
  }
});

// Get acreage schedule summary statistics
app.get('/api/normalized/acreage-summary-stats', async (req, res) => {
  try {
    if (!dbPool) {
      return res.status(500).json({ success: false, message: 'Database pool not initialized' });
    }

    const query = `
      SELECT 
        COUNT(*) as total_records,
        SUM(NMA) as total_acres,
        COUNT(DISTINCT OWNER) as unique_owners,
        COUNT(DISTINCT COUNTY) as unique_counties,
        0 as avg_allocation,
        COUNT(DISTINCT STATUS) as unique_statuses
      FROM prod_acreage_schedule
    `;

    const rows = await executeQuery(query);
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Error fetching acreage summary stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching acreage summary stats', 
      error: error.message 
    });
  }
});

// Get acreage schedule breakdown by status
app.get('/api/normalized/acreage-status-breakdown', async (req, res) => {
  try {
    if (!dbPool) {
      return res.status(500).json({ success: false, message: 'Database pool not initialized' });
    }

    const query = `
      SELECT 
        COALESCE(STATUS, 'Unknown') as status,
        COUNT(*) as count,
        SUM(NMA) as total_acres
      FROM prod_acreage_schedule
      GROUP BY STATUS
      ORDER BY count DESC
    `;

    const rows = await executeQuery(query);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching acreage status breakdown:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching acreage status breakdown', 
      error: error.message 
    });
  }
});

// Get acreage schedule breakdown by county
app.get('/api/normalized/acreage-county-breakdown', async (req, res) => {
  try {
    if (!dbPool) {
      return res.status(500).json({ success: false, message: 'Database pool not initialized' });
    }

    const query = `
      SELECT 
        COUNTY as county,
        ST as state,
        COUNT(*) as count,
        SUM(NMA) as total_acres,
        COUNT(DISTINCT OWNER) as unique_owners
      FROM prod_acreage_schedule
      GROUP BY COUNTY, ST
      ORDER BY count DESC
    `;

    const rows = await executeQuery(query);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching acreage county breakdown:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching acreage county breakdown', 
      error: error.message 
    });
  }
});

// Update staging table record
app.put('/api/import/staging-data/:tableName/:recordId', async (req, res) => {
  try {
    const { tableName, recordId } = req.params;
    const updateData = req.body;

    if (!dbPool) {
      return res.status(500).json({
        success: false,
        message: 'Database not connected'
      });
    }

    // Remove id, created_at, updated_at from update data
    delete updateData.id;
    delete updateData.created_at;
    delete updateData.updated_at;

    // Build dynamic UPDATE query
    const updateFields = Object.keys(updateData)
      .filter(key => updateData[key] !== undefined)
      .map(key => `\`${key}\` = ?`)
      .join(', ');

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    const values = Object.keys(updateData)
      .filter(key => updateData[key] !== undefined)
      .map(key => updateData[key]);

    values.push(recordId);

    const query = `UPDATE \`${tableName}\` SET ${updateFields} WHERE id = ?`;
    
    console.log('Updating record:', recordId, 'in table:', tableName);
    console.log('Query:', query);
    console.log('Values:', values);

    const result = await executeQuery(query, values);
    
    console.log('Update result:', result);
    
    res.json({
      success: true,
      message: 'Record updated successfully',
      affectedRows: result.affectedRows
    });
  } catch (error) {
    console.error('Error updating staging data:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating staging data',
      error: error.message
    });
  }
});

// Delete staging table record
app.delete('/api/import/staging-data/:tableName/:recordId', async (req, res) => {
  try {
    const { tableName, recordId } = req.params;

    if (!dbPool) {
      return res.status(500).json({
        success: false,
        message: 'Database not connected'
      });
    }

    const query = `DELETE FROM \`${tableName}\` WHERE id = ?`;
    
    console.log('Deleting record:', recordId, 'from table:', tableName);

    const result = await executeQuery(query, [recordId]);
    
    console.log('Delete result:', result);
    
    res.json({
      success: true,
      message: 'Record deleted successfully',
      affectedRows: result.affectedRows
    });
  } catch (error) {
    console.error('Error deleting staging data:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting staging data',
      error: error.message
    });
  }
});

// Approve import
app.post('/api/import/approve', async (req, res) => {
  try {
    const { stagingTableName, productionTableName } = req.body;

    if (!dbPool) {
      return res.status(500).json({
        success: false,
        message: 'Database not connected'
      });
    }

    // Move data from staging to production
    await executeQuery(`INSERT INTO ${productionTableName} SELECT * FROM ${stagingTableName}`);
    
    // Clear staging table
    await executeQuery(`DELETE FROM ${stagingTableName}`);
    
    res.json({
      success: true,
      message: 'Import approved successfully. Data moved to production.'
    });
  } catch (error) {
    console.error('Error approving import:', error);
    res.status(500).json({
      success: false,
      message: `Error approving import: ${error.message}`
    });
  }
});

// Delete staging table
app.delete('/api/import/staging-table/:tableName', async (req, res) => {
  try {
    const { tableName } = req.params;

    if (!dbPool) {
      return res.status(500).json({
        success: false,
        message: 'Database not connected'
      });
    }

    await executeQuery(`DROP TABLE IF EXISTS ${tableName}`);
    
    res.json({
      success: true,
      message: 'Staging table deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting staging table:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting staging table'
    });
  }
});

// Helper functions
async function extractColumnsFromCSV(filePath) {
  return new Promise((resolve, reject) => {
    const columns = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('headers', (headers) => {
        columns.push(...headers);
        resolve(columns);
      })
      .on('error', reject);
  });
}

async function extractColumnsFromExcel(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  if (jsonData.length === 0) {
    throw new Error('Excel file is empty');
  }
  
  const headers = jsonData[0];
  return headers.filter(header => header && header.trim() !== '');
}

async function createStagingTable(tableName, columns) {
  // Remove duplicates and sanitize column names
  const uniqueColumns = [...new Set(columns)];
  const sanitizedColumns = uniqueColumns.map((col, index) => {
    // Sanitize column name and handle duplicates
    let sanitized = col.replace(/[^a-zA-Z0-9_]/g, '_').replace(/_+/g, '_');
    if (sanitized === '' || sanitized.startsWith('_')) {
      sanitized = `column_${index}`;
    }
    return sanitized;
  });
  
  const columnDefinitions = sanitizedColumns.map(col => `\`${col}\` TEXT`).join(', ');
  const query = `
    CREATE TABLE ${tableName} (
      id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
      ${columnDefinitions},
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `;
  await executeQuery(query);
  
  // Store the mapping for data import
  return { originalColumns: columns, sanitizedColumns };
}

async function createProductionTable(tableName, columns) {
  // Check if production table already exists and drop it
  const tableExists = await executeQuery(`
    SELECT COUNT(*) as count 
    FROM information_schema.tables 
    WHERE table_schema = ? AND table_name = ?
  `, [process.env.MYSQL_DATABASE || 'soonermineraldb', tableName]);
  
  if (tableExists[0].count > 0) {
    console.log(`Dropping existing production table: ${tableName}`);
    try {
      await executeQuery(`DROP TABLE IF EXISTS \`${tableName}\``);
      console.log(`Successfully dropped production table: ${tableName}`);
    } catch (dropError) {
      console.error(`Error dropping production table ${tableName}:`, dropError);
      // Continue anyway, the table might not exist or might be locked
    }
  }

  // Remove duplicates and sanitize column names
  const uniqueColumns = [...new Set(columns)];
  const sanitizedColumns = uniqueColumns.map((col, index) => {
    // Sanitize column name and handle duplicates
    let sanitized = col.replace(/[^a-zA-Z0-9_]/g, '_').replace(/_+/g, '_');
    if (sanitized === '' || sanitized.startsWith('_')) {
      sanitized = `column_${index}`;
    }
    return sanitized;
  });
  
  const columnDefinitions = sanitizedColumns.map(col => `\`${col}\` TEXT`).join(', ');
  const query = `
    CREATE TABLE \`${tableName}\` (
      id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
      ${columnDefinitions},
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `;
  await executeQuery(query);
  
  return { originalColumns: columns, sanitizedColumns };
}

async function importDataToStaging(filePath, tableName, columns, fileExtension) {
  if (fileExtension === '.csv') {
    return await importDataFromCSV(filePath, tableName, columns);
  } else if (fileExtension === '.xlsx' || fileExtension === '.xls') {
    return await importDataFromExcel(filePath, tableName, columns);
  }
}

async function importDataFromCSV(filePath, tableName, sanitizedColumns) {
  return new Promise((resolve, reject) => {
    let recordCount = 0;
    const records = [];
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
        // Map original column names to sanitized column names
        const mappedRecord = {};
        sanitizedColumns.forEach((sanitizedCol, index) => {
          const originalCol = Object.keys(data)[index];
          const value = data[originalCol];
          // Only include non-empty values
          mappedRecord[sanitizedCol] = (value && value.toString().trim() !== '') ? value : null;
        });
        
        // Check if the record has any non-null values
        const hasData = Object.values(mappedRecord).some(value => value !== null);
        
        // Skip empty records
        if (!hasData) {
          return;
        }
        
        records.push(mappedRecord);
        recordCount++;
        
        if (records.length >= 1000) {
          batchInsertRecords(tableName, sanitizedColumns, records.splice(0, 1000));
        }
      })
      .on('end', async () => {
        try {
          if (records.length > 0) {
            await batchInsertRecords(tableName, sanitizedColumns, records);
          }
          resolve(recordCount);
        } catch (error) {
          reject(error);
        }
      })
      .on('error', reject);
  });
}

async function importDataFromExcel(filePath, tableName, sanitizedColumns) {
  const fileBuffer = fs.readFileSync(filePath);
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  if (jsonData.length <= 1) {
    throw new Error('Excel file has no data rows');
  }
  
  const dataRows = jsonData.slice(1);
  const records = [];
  
  dataRows.forEach((row) => {
    // Check if the row has any non-empty values
    const hasData = row.some(value => 
      value !== null && value !== undefined && value.toString().trim() !== ''
    );
    
    // Skip empty rows
    if (!hasData) {
      return;
    }
    
    const record = {};
    sanitizedColumns.forEach((col, index) => {
      record[col] = row[index] || null;
    });
    records.push(record);
  });
  
  const batchSize = 1000;
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    await batchInsertRecords(tableName, sanitizedColumns, batch);
  }
  
  return records.length;
}

async function batchInsertRecords(tableName, columns, records) {
  if (records.length === 0) return;
  
  const columnNames = columns.map(col => `\`${col}\``).join(', ');
  const placeholders = records.map(() => 
    `(${columns.map(() => '?').join(', ')})`
  ).join(', ');
  
  const values = [];
  records.forEach(record => {
    columns.forEach(col => {
      values.push(record[col] || null);
    });
  });
  
  const query = `INSERT INTO ${tableName} (${columnNames}) VALUES ${placeholders}`;
  await executeQuery(query, values);
}

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// Start server
// ArcGIS Mapping API endpoints
app.get('/api/tract-spatial', async (req, res) => {
  try {
    if (!dbPool) {
      return res.status(500).json({ success: false, message: 'Database pool not initialized' });
    }

    // Check if tract_spatial table exists and has the expected columns
    try {
      const query = `
        SELECT 
          id,
          tract_id,
          geometry,
          centroid_lat,
          centroid_lon,
          area_acres,
          created_at,
          updated_at
        FROM tract_spatial
        ORDER BY created_at DESC
        LIMIT 1000
      `;

      const rows = await executeQuery(query);
      
      res.json({
        success: true,
        data: rows
      });
           } catch (tableError) {
             // If table doesn't exist or has wrong structure, return mock data
             console.log('tract_spatial table not available, returning mock data');
             const mockData = [
               {
                 id: 'mock-1',
                 tract_id: '222ed8ac-9337-11f0-abb1-76fc11c0f2a6',
                 geometry: null,
                 centroid_lat: 35.8617,
                 centroid_lon: -97.9365,
                 area_acres: 160,
                 section_number: '7',
                 township: '15N',
                 range: '2W',
                 created_at: new Date().toISOString(),
                 updated_at: new Date().toISOString()
               }
             ];

             res.json({
               success: true,
               data: mockData
             });
           }
  } catch (error) {
    console.error('Error fetching tract spatial data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tract spatial data',
      error: error.message
    });
  }
});

app.get('/api/map/layer-preferences', async (req, res) => {
  try {
    // Return default layer preferences
    const defaultPreferences = [
      {
        id: 'tracts',
        name: 'Tracts',
        visible: true,
        opacity: 0.8,
        color: '#ff6b6b'
      },
      {
        id: 'wells',
        name: 'Wells',
        visible: true,
        opacity: 0.6,
        color: '#4ecdc4'
      },
      {
        id: 'units',
        name: 'Units',
        visible: false,
        opacity: 0.7,
        color: '#45b7d1'
      },
      {
        id: 'counties',
        name: 'Counties',
        visible: true,
        opacity: 0.3,
        color: '#96ceb4'
      }
    ];

    res.json({
      success: true,
      data: defaultPreferences
    });
  } catch (error) {
    console.error('Error fetching layer preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch layer preferences',
      error: error.message
    });
  }
});

// Users API endpoint
app.get('/api/users', async (req, res) => {
  try {
    if (!dbPool) {
      return res.status(500).json({ success: false, message: 'Database pool not initialized' });
    }

    // Parse pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pagination parameters. Page must be >= 1, limit must be between 1 and 1000'
      });
    }

    // Get total count for pagination metadata
    const countQuery = `SELECT COUNT(*) as total FROM users`;
    const countResult = await executeQuery(countQuery);
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

    const rows = await executeQuery(query);
    
    // Transform the data to match the User interface
    const users = rows.map(row => ({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: null, // Phone not available in current schema
      role: {
        id: row.role_id,
        name: row.role_name || 'User'
      },
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // Return paginated response
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
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
});

// Get all units from acreage schedule data
app.get('/api/units', async (req, res) => {
  try {
    if (!dbPool) {
      return res.status(500).json({ success: false, message: 'Database pool not initialized' });
    }

    // Parse pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pagination parameters. Page must be >= 1, limit must be between 1 and 1000'
      });
    }

    // Get total count for pagination metadata - count unique unit names (not split by line breaks)
    const countQuery = `
      SELECT COUNT(DISTINCT TRIM(REPLACE(REPLACE(CURRENT_UNIT_NAME, '\r\n', ' '), '\n', ' '))) as total
      FROM prod_acreage_schedule
      WHERE CURRENT_UNIT_NAME IS NOT NULL 
        AND CURRENT_UNIT_NAME != ''
    `;
    const countResult = await executeQuery(countQuery);
    const totalCount = countResult[0].total;

    // First, get all unique unit names to properly paginate (treat as single units, not split)
    const uniqueUnitsQuery = `
      SELECT DISTINCT TRIM(REPLACE(REPLACE(CURRENT_UNIT_NAME, '\r\n', ' '), '\n', ' ')) as CURRENT_UNIT_NAME
      FROM prod_acreage_schedule
      WHERE CURRENT_UNIT_NAME IS NOT NULL 
        AND CURRENT_UNIT_NAME != ''
      ORDER BY TRIM(REPLACE(REPLACE(CURRENT_UNIT_NAME, '\r\n', ' '), '\n', ' '))
    `;
    
    const uniqueUnits = await executeQuery(uniqueUnitsQuery);
    const totalUniqueUnits = uniqueUnits.length;
    
    // Calculate pagination for unique units
    const startIndex = offset;
    const endIndex = Math.min(offset + limit, totalUniqueUnits);
    const paginatedUnitNames = uniqueUnits.slice(startIndex, endIndex).map(u => u.CURRENT_UNIT_NAME);
    
    if (paginatedUnitNames.length === 0) {
      return res.json({
        data: [],
        pagination: {
          page,
          limit,
          total: totalUniqueUnits,
          totalPages: Math.ceil(totalUniqueUnits / limit),
          hasNextPage: page < Math.ceil(totalUniqueUnits / limit),
          hasPrevPage: page > 1,
          nextPage: page < Math.ceil(totalUniqueUnits / limit) ? page + 1 : null,
          prevPage: page > 1 ? page - 1 : null
        }
      });
    }
    
    // Now get aggregated data for the paginated unit names with section counts and buyer info
    const placeholders = paginatedUnitNames.map(() => '?').join(',');
    const query = `
      SELECT 
        TRIM(REPLACE(REPLACE(CURRENT_UNIT_NAME, '\r\n', ' '), '\n', ' ')) as unit_name,
        COUNT(DISTINCT S_T_R) as section_count,
        SUM(NMA) as total_net_mineral_acres,
        AVG(ROY) as average_royalty,
        MAX(BUYER) as assigned_buyer,
        MAX(COUNTY) as primary_county,
        MAX(ST) as state,
        MAX(STATUS) as status,
        MAX(NOTE) as notes,
        MAX(created_at) as created_at,
        MAX(updated_at) as updated_at
      FROM prod_acreage_schedule
      WHERE TRIM(REPLACE(REPLACE(CURRENT_UNIT_NAME, '\r\n', ' '), '\n', ' ')) IN (${placeholders})
      GROUP BY TRIM(REPLACE(REPLACE(CURRENT_UNIT_NAME, '\r\n', ' '), '\n', ' '))
      ORDER BY TRIM(REPLACE(REPLACE(CURRENT_UNIT_NAME, '\r\n', ' '), '\n', ' '))
    `;

    const rows = await executeQuery(query, paginatedUnitNames);
    
    // Process the aggregated data to create units
    const units = rows.map((row, index) => {
      // Use the unit name as the ID (URL encoded)
      const unitId = encodeURIComponent(row.unit_name);
      
      return {
        id: unitId,
        unitName: row.unit_name, // Keep unit name as-is without adding line breaks
        operator: 'Unknown', // Not available in current data
        apiNumbers: [], // Would need to be extracted from unit name or other sources
        targetFormations: ['Hunton', 'Woodford', 'Mississippian'], // Common OK formations
        status: row.status === 'PRODUCING' ? 'Producing' : 
               row.status === 'PERMITTED' ? 'Permitted' : 'Held by Production',
        estimatedGrossAcres: parseFloat(row.total_net_mineral_acres) || 0,
        estimatedNetAcres: parseFloat(row.total_net_mineral_acres) || 0,
        county: row.primary_county || 'Unknown',
        state: row.state || 'OK',
        linkedSectionIds: [], // Will be populated with section count
        linkedContactIds: [],
        assignedBuyerId: null,
        assignedBuyer: row.assigned_buyer ? { name: row.assigned_buyer } : null,
        heldByFund: false,
        exitStrategy: 'Hold',
        isLocked: false,
        notes: row.notes || '',
        createdAt: row.created_at || new Date().toISOString(),
        updatedAt: row.updated_at || new Date().toISOString(),
        createdBy: 'system',
        updatedBy: 'system',
        createdByUser: null,
        updatedByUser: null,
        esgProfileId: null,
        esgRiskLevel: null,
        carbonIntensity: null,
        operatorComplianceScore: null,
        regulatoryCompliance: null,
        hasRiskFlags: false,
        lastESGUpdate: null,
        // Additional fields from acreage data
        totalNetMineralAcres: parseFloat(row.total_net_mineral_acres) || 0,
        averageRoyalty: parseFloat(row.average_royalty) || 0,
        allocationPercentage: 0,
        buyer: row.assigned_buyer,
        sectionCount: parseInt(row.section_count) || 0,
        // Store section count in linkedTractIds for compatibility
        linkedTractIds: Array.from({ length: parseInt(row.section_count) || 0 }, (_, i) => `section_${i + 1}`)
      };
    });

    // Units are already processed and sorted

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalUniqueUnits / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // Return paginated response
    res.json({
      data: units,
      pagination: {
        page: page,
        limit: limit,
        total: totalUniqueUnits,
        totalPages: totalPages,
        hasNextPage: hasNextPage,
        hasPrevPage: hasPrevPage,
        nextPage: hasNextPage ? page + 1 : null,
        prevPage: hasPrevPage ? page - 1 : null
      }
    });
  } catch (error) {
    console.error('Error fetching units:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching units', 
      error: error.message 
    });
  }
});

// Get single unit by ID
app.get('/api/units/:id', async (req, res) => {
  try {
    if (!dbPool) {
      return res.status(500).json({ success: false, message: 'Database pool not initialized' });
    }

    const { id } = req.params;
    
    // Decode the URL-encoded unit name
    const unitName = decodeURIComponent(id);
    console.log('Looking for unit name:', unitName);
    
    // Now get all records for this unit
    const query = `
      SELECT 
        id,
        COUNTY,
        S_T_R,
        CURRENT_UNIT_NAME,
        OWNER,
        NMA,
        ROY,
        ALLO_ AS ALLOCATION_PERCENT,
        STATUS,
        BUYER,
        NOTE,
        INTEREST_TYPE,
        LEGAL_DESCRIPTION,
        STREET,
        CITY,
        ST,
        ZIP,
        PHONE_EMAIL,
        CONTACT,
        created_at,
        updated_at
      FROM prod_acreage_schedule
      WHERE TRIM(REPLACE(REPLACE(CURRENT_UNIT_NAME, '\r\n', ' '), '\n', ' ')) = ?
      ORDER BY CURRENT_UNIT_NAME, COUNTY, S_T_R
    `;

    console.log('Querying for unit name:', unitName);
    const rows = await executeQuery(query, [unitName]);
    console.log('Found rows:', rows.length);
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Unit not found' });
    }

    // Process the data similar to the units endpoint
    const unitMap = new Map();
    
    rows.forEach(row => {
      if (row.CURRENT_UNIT_NAME) {
        // Get the full unit name with line breaks for display
        const fullUnitName = row.CURRENT_UNIT_NAME;
        const trimmedUnitName = fullUnitName.trim();
        
        if (!unitMap.has(trimmedUnitName)) {
          unitMap.set(trimmedUnitName, {
            id: row.id,
            unitName: trimmedUnitName.replace(/\s+(?=[A-Z]+\s+[A-Z]+\s+\d+)/g, '\n'), // Add line breaks between complete unit names
            operator: 'Unknown',
            apiNumbers: [],
            targetFormations: ['Hunton', 'Woodford', 'Mississippian'],
            status: row.STATUS === 'PRODUCING' ? 'Producing' : 
                   row.STATUS === 'PERMITTED' ? 'Permitted' : 'Held by Production',
            estimatedGrossAcres: parseFloat(row.NMA) || 0,
            estimatedNetAcres: parseFloat(row.NMA) || 0,
            county: row.COUNTY,
            state: row.ST || 'OK',
            linkedTractIds: [row.id],
            linkedContactIds: [],
            assignedBuyerId: null,
            assignedBuyer: null,
            heldByFund: false,
            exitStrategy: 'Hold',
            isLocked: false,
            notes: row.NOTE || '',
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            createdBy: 'system',
            updatedBy: 'system',
            createdByUser: null,
            updatedByUser: null,
            esgProfileId: null,
            esgRiskLevel: null,
            carbonIntensity: null,
            operatorComplianceScore: null,
            regulatoryCompliance: null,
            hasRiskFlags: false,
            lastESGUpdate: null,
            // Additional fields from acreage data
            totalNetMineralAcres: parseFloat(row.NMA) || 0,
            averageRoyalty: parseFloat(row.ROY) || 0,
            allocationPercentage: parseFloat(row.ALLOCATION_PERCENT) || 0,
            buyer: row.BUYER,
            interestType: row.INTEREST_TYPE,
            legalDescription: row.LEGAL_DESCRIPTION,
            owner: row.OWNER,
            contact: row.CONTACT,
            street: row.STREET,
            city: row.CITY,
            zip: row.ZIP,
            phoneEmail: row.PHONE_EMAIL
          });
        } else if (unitMap.has(trimmedUnitName)) {
          const existingUnit = unitMap.get(trimmedUnitName);
          existingUnit.linkedTractIds.push(row.id);
          existingUnit.estimatedGrossAcres += parseFloat(row.NMA) || 0;
          existingUnit.estimatedNetAcres += parseFloat(row.NMA) || 0;
          existingUnit.totalNetMineralAcres += parseFloat(row.NMA) || 0;
        }
      }
    });

    const units = Array.from(unitMap.values());
    
    if (units.length === 0) {
      return res.status(404).json({ success: false, message: 'Unit not found' });
    }

    // Return the first matching unit
    res.json(units[0]);
  } catch (error) {
    console.error('Error fetching unit:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching unit',
      error: error.message 
    });
  }
});

// Get unit names for a specific unit
app.get('/api/units/:id/unit-names', async (req, res) => {
  try {
    if (!dbPool) {
      return res.status(500).json({ success: false, message: 'Database pool not initialized' });
    }

    const { id } = req.params;
    
    // Decode the URL-encoded unit name
    const unitName = decodeURIComponent(id);
    console.log('Looking for unit names for:', unitName);
    
    // Get all records for this unit to extract unit names
    // Find rows where CURRENT_UNIT_NAME matches, then extract both CURRENT and NEW unit names from those rows
    const query = `
      SELECT DISTINCT 
        CURRENT_UNIT_NAME,
        NEW_UNIT_NAME
      FROM prod_acreage_schedule
      WHERE TRIM(REPLACE(REPLACE(CURRENT_UNIT_NAME, '\r\n', ' '), '\n', ' ')) = ?
      ORDER BY CURRENT_UNIT_NAME, NEW_UNIT_NAME
    `;
    
    const rows = await executeQuery(query, [unitName]);
    console.log('Found unit name records:', rows.length);
    console.log('Query for unit name:', unitName);
    if (rows.length > 0) {
      console.log('Sample rows:');
      rows.slice(0, 3).forEach((row, idx) => {
        console.log(`  Row ${idx}: CURRENT="${row.CURRENT_UNIT_NAME}", NEW="${row.NEW_UNIT_NAME}"`);
      });
    }
    
    if (rows.length === 0) {
      return res.json({
        currentUnitNames: [],
        newUnitNames: [],
        totalRecords: 0
      });
    }
    
    // Extract individual unit names from the grouped unit name
    const allUnitNames = new Set();
    const allNewUnitNames = new Set();
    
    rows.forEach((row, index) => {
      if (row.CURRENT_UNIT_NAME) {
        // Split by line breaks to get individual unit names
        const unitNames = row.CURRENT_UNIT_NAME.split(/\r\n|\n/).filter(name => name.trim() !== '');
        unitNames.forEach(name => allUnitNames.add(name.trim()));
      }
      
      // Check for NEW_UNIT_NAME - handle NULL, empty strings, and whitespace
      if (row.NEW_UNIT_NAME != null && row.NEW_UNIT_NAME !== '') {
        const trimmedNewName = String(row.NEW_UNIT_NAME).trim();
        if (trimmedNewName && trimmedNewName !== 'NULL' && trimmedNewName !== 'null') {
          console.log(`Row ${index} - NEW_UNIT_NAME found: "${trimmedNewName}"`);
          // Check if it contains line breaks
          if (trimmedNewName.includes('\n') || trimmedNewName.includes('\r\n')) {
            const newUnitNames = trimmedNewName.split(/\r\n|\n/).filter(name => name.trim() !== '' && name.trim() !== 'NULL' && name.trim() !== 'null');
            newUnitNames.forEach(name => allNewUnitNames.add(name.trim()));
          } else {
            // Single new unit name
            allNewUnitNames.add(trimmedNewName);
          }
        }
      } else {
        console.log(`Row ${index} - NEW_UNIT_NAME is null or empty`);
      }
    });
    
    const currentUnitNames = Array.from(allUnitNames);
    const newUnitNames = Array.from(allNewUnitNames);
    
    console.log(`Extracted ${newUnitNames.length} new unit names:`, newUnitNames);
    
    res.json({
      currentUnitNames: currentUnitNames,
      newUnitNames: newUnitNames,
      totalRecords: currentUnitNames.length
    });
    
  } catch (error) {
    console.error('Error fetching unit names:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching unit names',
      error: error.message 
    });
  }
});

// Get unit tracts data
app.get('/api/units/:id/tracts', async (req, res) => {
  try {
    if (!dbPool) {
      return res.status(500).json({ success: false, message: 'Database pool not initialized' });
    }

    const { id } = req.params;
    
    // Use the ID directly as it's now just the database ID
    const databaseId = id;
    
    // First, get the unit name from the database record
    const unitQuery = `
      SELECT DISTINCT CURRENT_UNIT_NAME
      FROM prod_acreage_schedule
      WHERE id = ?
    `;
    
    const unitRows = await executeQuery(unitQuery, [databaseId]);
    
    if (unitRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Unit not found' });
    }
    
    const unitName = unitRows[0].CURRENT_UNIT_NAME;
    
    // Now get all records for this unit
    const query = `
      SELECT 
        id,
        COUNTY,
        S_T_R,
        CURRENT_UNIT_NAME,
        OWNER,
        NMA,
        ROY,
        ALLO_ AS ALLOCATION_PERCENT,
        STATUS,
        BUYER,
        NOTE,
        INTEREST_TYPE,
        LEGAL_DESCRIPTION,
        STREET,
        CITY,
        ST,
        ZIP,
        PHONE_EMAIL,
        CONTACT,
        created_at,
        updated_at
      FROM prod_acreage_schedule
      WHERE CURRENT_UNIT_NAME = ?
      ORDER BY COUNTY, S_T_R
    `;

    const rows = await executeQuery(query, [unitName]);
    
    if (rows.length === 0) {
      return res.json([]);
    }

    // Transform the data to match the Tract interface for unit tracts
    const tracts = rows.map(row => ({
      id: row.id,
      tractName: `${row.COUNTY} - ${row.S_T_R}`,
      county: row.COUNTY,
      section: row.S_T_R,
      str: row.S_T_R,
      sectionNumber: null,
      township: null,
      range: null,
      legalDescription: row.LEGAL_DESCRIPTION,
      netMineralAcres: parseFloat(row.NMA) || 0,
      grossAcres: parseFloat(row.NMA) || 0,
      state: row.ST || 'OK',
      heldByFund: false,
      isLocked: false,
      titleStatus: 'Unmapped',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      createdBy: 'system',
      updatedBy: 'system',
      // Additional fields from acreage data
      owner: row.OWNER,
      street: row.STREET,
      city: row.CITY,
      zip: row.ZIP,
      phoneEmail: row.PHONE_EMAIL,
      royalty: parseFloat(row.ROY) || 0,
      allocationPercent: parseFloat(row.ALLOCATION_PERCENT) || 0,
      buyer: row.BUYER,
      interestType: row.INTEREST_TYPE,
      notes: row.NOTE,
      contact: row.CONTACT,
      status: row.STATUS,
      unitName: row.CURRENT_UNIT_NAME ? row.CURRENT_UNIT_NAME.split('\r\n')[0].trim() : null
    }));
    
    res.json(tracts);
  } catch (error) {
    console.error('Error fetching unit tracts:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching unit tracts', 
      error: error.message 
    });
  }
});

// Get unit tracts enhanced data
app.get('/api/units/:id/tracts/enhanced', async (req, res) => {
  try {
    if (!dbPool) {
      return res.status(500).json({ success: false, message: 'Database pool not initialized' });
    }

    const { id } = req.params;
    
    // Use the ID directly as it's now just the database ID
    const databaseId = id;
    
    // First, get the unit name from the database record
    const unitQuery = `
      SELECT DISTINCT CURRENT_UNIT_NAME
      FROM prod_acreage_schedule
      WHERE id = ?
    `;
    
    const unitRows = await executeQuery(unitQuery, [databaseId]);
    
    if (unitRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Unit not found' });
    }
    
    const unitName = unitRows[0].CURRENT_UNIT_NAME;
    
    const query = `
      SELECT 
        id,
        COUNTY,
        S_T_R,
        CURRENT_UNIT_NAME,
        OWNER,
        NMA,
        ROY,
        ALLO_ AS ALLOCATION_PERCENT,
        STATUS,
        BUYER,
        NOTE,
        INTEREST_TYPE,
        LEGAL_DESCRIPTION,
        STREET,
        CITY,
        ST,
        ZIP,
        PHONE_EMAIL,
        CONTACT,
        created_at,
        updated_at
      FROM prod_acreage_schedule
      WHERE CURRENT_UNIT_NAME = ?
      ORDER BY COUNTY, S_T_R
    `;

    const rows = await executeQuery(query, [unitName]);
    
    if (rows.length === 0) {
      return res.json([]);
    }

    // Transform the data to match the Tract interface for unit tracts
    const tracts = rows.map(row => ({
      id: row.id,
      tractName: `${row.COUNTY} - ${row.S_T_R}`,
      county: row.COUNTY,
      section: row.S_T_R,
      str: row.S_T_R,
      sectionNumber: null,
      township: null,
      range: null,
      legalDescription: row.LEGAL_DESCRIPTION,
      netMineralAcres: parseFloat(row.NMA) || 0,
      grossAcres: parseFloat(row.NMA) || 0,
      state: row.ST || 'OK',
      heldByFund: false,
      isLocked: false,
      titleStatus: 'Unmapped',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      createdBy: 'system',
      updatedBy: 'system',
      // Additional fields from acreage data
      owner: row.OWNER,
      street: row.STREET,
      city: row.CITY,
      zip: row.ZIP,
      phoneEmail: row.PHONE_EMAIL,
      royalty: parseFloat(row.ROY) || 0,
      allocationPercent: parseFloat(row.ALLOCATION_PERCENT) || 0,
      buyer: row.BUYER,
      interestType: row.INTEREST_TYPE,
      notes: row.NOTE,
      contact: row.CONTACT,
      status: row.STATUS,
      unitName: row.CURRENT_UNIT_NAME ? row.CURRENT_UNIT_NAME.split('\r\n')[0].trim() : null
    }));
    
    res.json(tracts);
  } catch (error) {
    console.error('Error fetching unit tracts enhanced:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching unit tracts enhanced', 
      error: error.message 
    });
  }
});

// Get unit assignments
app.get('/api/units/:id/assignments', async (req, res) => {
  try {
    if (!dbPool) {
      return res.status(500).json({ success: false, message: 'Database pool not initialized' });
    }

    const { id } = req.params;
    
    // Decode the URL-encoded unit name
    const unitName = decodeURIComponent(id);
    console.log('Looking for assignments for unit:', unitName);
    
    // Check if there's already a pending request for this unit
    if (pendingRequests.has(unitName)) {
      console.log('🔄 Deduplicating request for unit:', unitName);
      const result = await pendingRequests.get(unitName);
      return res.json(result);
    }
    
    // Create a promise for this request
    const requestPromise = (async () => {
      // Get assignments linked to this unit by matching assetId
      // Since assignments are stored in memory, we need to filter them by assetId
      const allAssignments = await getCachedAssignments();
      console.log('Retrieved assignments from cache, total:', allAssignments.length);
      
      // Filter assignments that match this unit name
      const matchingAssignments = allAssignments.filter(assignment => {
        if (assignment.assetType !== 'Unit') return false;
        
        // Check if the assetId contains the unit name (for grouped units)
        const assetId = assignment.assetId || '';
        const normalizedAssetId = assetId.replace(/\r\n/g, ' ').replace(/\n/g, ' ').trim();
        const normalizedUnitName = unitName.replace(/\r\n/g, ' ').replace(/\n/g, ' ').trim();
        
        // Check for exact match or partial match
        return normalizedAssetId === normalizedUnitName || 
               normalizedAssetId.includes(normalizedUnitName) || 
               normalizedUnitName.includes(normalizedAssetId);
      });
      
      // Deduplicate by buyer name to avoid showing the same buyer multiple times
      const uniqueAssignments = matchingAssignments.reduce((unique, assignment) => {
        const buyerName = assignment.assignedBuyer?.name || assignment.assignedBuyerId;
        if (!unique.find(item => (item.assignedBuyer?.name || item.assignedBuyerId) === buyerName)) {
          unique.push(assignment);
        }
        return unique;
      }, []);
      
      console.log('Found assignments:', matchingAssignments.length);
      console.log('Unique assignments after deduplication:', uniqueAssignments.length);
      
      // Transform the assignment data to match the UnitAssignment interface
      const transformedAssignments = uniqueAssignments.map(assignment => ({
        id: assignment.id,
        unitId: assignment.assetId,
        buyerId: assignment.assignedBuyerId,
        buyer: assignment.assignedBuyer ? {
          id: assignment.assignedBuyer.id,
          name: assignment.assignedBuyer.name,
          email: assignment.assignedBuyer.email
        } : null,
        assignedBy: assignment.assignedById,
        assignedByUser: null, // Will be populated if needed
        assignedAt: assignment.assignedDate,
        removedBy: assignment.status === 'Cancelled' ? assignment.assignedById : null,
        removedByUser: null, // Will be populated if needed
        removedAt: assignment.status === 'Cancelled' ? assignment.updatedAt : null,
        status: assignment.status,
        notes: assignment.notes ? assignment.notes.replace(/^Contact:\s*/, '') : assignment.notes,
        priceCapUsd: assignment.priceCapUsd,
        priceCapType: assignment.priceCapType,
        sourceChannel: assignment.sourceChannel,
        priorityScore: assignment.priorityScore,
        asset: assignment.asset
      }));
      
      return transformedAssignments;
    })();
    
    // Store the promise in pending requests
    pendingRequests.set(unitName, requestPromise);
    
    try {
      const result = await requestPromise;
      res.json(result);
    } finally {
      // Clean up the pending request
      pendingRequests.delete(unitName);
    }
  } catch (error) {
    console.error('Error fetching unit assignments:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching unit assignments', 
      error: error.message 
    });
  }
});

// Get unit notes
app.get('/api/units/:id/notes', async (req, res) => {
  try {
    if (!dbPool) {
      return res.status(500).json({ success: false, message: 'Database pool not initialized' });
    }

    const { id } = req.params;
    
    // Use the ID directly as it's now just the database ID
    const databaseId = id;
    
    // First, get the unit name from the database record
    const unitQuery = `
      SELECT DISTINCT CURRENT_UNIT_NAME
      FROM prod_acreage_schedule
      WHERE id = ?
    `;
    
    const unitRows = await executeQuery(unitQuery, [databaseId]);
    
    if (unitRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Unit not found' });
    }
    
    
    const unitName = unitRows[0].CURRENT_UNIT_NAME;
    
    const query = `
      SELECT 
        id,
        NOTE,
        created_at,
        updated_at
      FROM prod_acreage_schedule
      WHERE CURRENT_UNIT_NAME = ?
      ORDER BY created_at DESC
    `;

    const rows = await executeQuery(query, [unitName]);
    
    // Transform notes data
    const notes = rows
      .filter(row => row.NOTE && row.NOTE.trim() !== '')
      .map((row, index) => ({
        id: `note-${row.id}-${index}`,
        content: row.NOTE,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        createdBy: 'system',
        updatedBy: 'system'
      }));
    
    res.json(notes);
  } catch (error) {
    console.error('Error fetching unit notes:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching unit notes', 
      error: error.message 
    });
  }
});

// Get unit contacts
app.get('/api/units/:id/contacts', async (req, res) => {
  try {
    if (!dbPool) {
      return res.status(500).json({ success: false, message: 'Database pool not initialized' });
    }

    const { id } = req.params;
    
    // Decode the URL-encoded unit name
    const unitName = decodeURIComponent(id);
    console.log('Looking for contacts for unit:', unitName);
    
    const query = `
      SELECT 
        id,
        OWNER,
        CONTACT,
        STREET,
        CITY,
        ST,
        ZIP,
        PHONE_EMAIL,
        created_at,
        updated_at
      FROM prod_acreage_schedule
      WHERE TRIM(REPLACE(REPLACE(CURRENT_UNIT_NAME, '\r\n', ' '), '\n', ' ')) = ?
      ORDER BY OWNER
    `;

    const rows = await executeQuery(query, [unitName]);
    console.log('Found contacts:', rows.length);
    
    // Transform contacts data
    const contacts = rows
      .filter(row => row.OWNER && row.OWNER.trim() !== '')
      .map((row, index) => ({
        id: `contact-${row.id}-${index}`,
        name: row.OWNER,
        contact: row.CONTACT,
        street: row.STREET,
        city: row.CITY,
        state: row.ST,
        zip: row.ZIP,
        phoneEmail: row.PHONE_EMAIL,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
    
    res.json(contacts);
  } catch (error) {
    console.error('Error fetching unit contacts:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching unit contacts', 
      error: error.message 
    });
  }
});

// Get tract contacts
app.get('/api/tracts/:id/contacts', async (req, res) => {
  try {
    if (!dbPool) {
      return res.status(500).json({ success: false, message: 'Database pool not initialized' });
    }

    const { id } = req.params;
    
    // Get contacts for this specific tract
    const query = `
      SELECT 
        id,
        OWNER,
        CONTACT,
        STREET,
        CITY,
        ST,
        ZIP,
        PHONE_EMAIL,
        NMA,
        ROY,
        ALLO_,
        created_at,
        updated_at
      FROM prod_acreage_schedule
      WHERE id = ?
        AND OWNER IS NOT NULL 
        AND OWNER != ''
      ORDER BY OWNER
    `;

    const rows = await executeQuery(query, [id]);
    
    // Transform contacts data
    const contacts = rows.map((row, index) => ({
      id: `contact-${row.id}-${index}`,
      name: row.OWNER,
      contact: row.CONTACT,
      street: row.STREET,
      city: row.CITY,
      state: row.ST,
      zip: row.ZIP,
      phoneEmail: row.PHONE_EMAIL,
      nma: row.NMA,
      royalty: row.ROY,
      allocation: row.ALLO_,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
    
    res.json(contacts);
  } catch (error) {
    console.error('Error fetching tract contacts:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching tract contacts', 
      error: error.message 
    });
  }
});

// Get unit contacts aggregated
app.get('/api/units/:id/contacts/aggregated', async (req, res) => {
  try {
    if (!dbPool) {
      return res.status(500).json({ success: false, message: 'Database pool not initialized' });
    }

    const { id } = req.params;
    
    // Decode the URL-encoded unit name
    const unitName = decodeURIComponent(id);
    console.log('Looking for aggregated contacts for unit:', unitName);
    
    const query = `
      SELECT 
        OWNER as owner,
        CONTACT as contact,
        STREET as street,
        CITY as city,
        ST as state,
        ZIP as zip,
        PHONE_EMAIL as phoneEmail,
        NMA as nma,
        ROY as royalty,
        ALLO_ as allocation,
        COUNT(*) as tractCount,
        SUM(CAST(NMA AS DECIMAL(10,2))) as totalNMA,
        AVG(CAST(ROY AS DECIMAL(5,2))) as avgRoyalty,
        AVG(CAST(ALLO_ AS DECIMAL(5,2))) as avgAllocation
      FROM prod_acreage_schedule
      WHERE TRIM(REPLACE(REPLACE(CURRENT_UNIT_NAME, '\r\n', ' '), '\n', ' ')) = ?
        AND OWNER IS NOT NULL AND OWNER != ''
      GROUP BY OWNER, CONTACT, STREET, CITY, ST, ZIP, PHONE_EMAIL, NMA, ROY, ALLO_
      ORDER BY OWNER
    `;

    const rows = await executeQuery(query, [unitName]);
    
    // Transform the data to match UnitContactAggregated interface
    const aggregatedContacts = rows.map((row, index) => {
      const totalNMA = parseFloat(row.totalNMA) || 0;
      const avgRoyalty = parseFloat(row.avgRoyalty) || 0;
      const totalNRA = avgRoyalty > 0 ? totalNMA * (avgRoyalty / 100) / 0.125 : 0;
      
      return {
        id: `contact-${index}`,
        unitId: id,
        contactId: `contact-${row.owner}-${index}`,
        contact: {
          id: `contact-${row.owner}-${index}`,
          name: row.owner,
          contact: row.contact,
          street: row.street,
          city: row.city,
          state: row.state,
          zip: row.zip,
          phoneEmail: row.phoneEmail,
          contactType: 'Landowner'
        },
        ownershipPercentageWeighted: parseFloat(row.avgAllocation) / 100 || 0,
        royaltyPercentageWeighted: parseFloat(row.avgRoyalty) / 100 || 0,
        totalNMA: totalNMA,
        totalNRA: totalNRA,
        tractsOwned: Array.from({ length: parseInt(row.tractCount) }, (_, i) => `tract-${i}`),
        lastOutreach: null,
        leadStatus: 'Unassigned',
        hasActiveLeads: false
      };
    });
    
    res.json(aggregatedContacts);
  } catch (error) {
    console.error('Error fetching unit contacts aggregated:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching unit contacts aggregated', 
      error: error.message 
    });
  }
});

// Get all contacts
app.get('/api/contacts', async (req, res) => {
  try {
    if (!dbPool) {
      return res.status(500).json({ success: false, message: 'Database pool not initialized' });
    }

    // Parse pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pagination parameters. Page must be >= 1, limit must be between 1 and 1000'
      });
    }

    // Get total count for pagination metadata
    const countQuery = `
      SELECT COUNT(DISTINCT OWNER) as total
      FROM prod_acreage_schedule
      WHERE OWNER IS NOT NULL AND OWNER != ''
    `;
    const countResult = await executeQuery(countQuery);
    const totalCount = countResult[0].total;

    const query = `
      SELECT 
        OWNER as name,
        MAX(CONTACT) as contact,
        MAX(STREET) as street,
        MAX(CITY) as city,
        MAX(ST) as state,
        MAX(ZIP) as zip,
        MAX(PHONE_EMAIL) as phoneEmail,
        MAX(CURRENT_UNIT_NAME) as unitName,
        SUM(CAST(NMA AS DECIMAL(10,2))) as totalNMA,
        MAX(created_at) as created_at,
        MAX(updated_at) as updated_at
      FROM prod_acreage_schedule
      WHERE OWNER IS NOT NULL AND OWNER != ''
      GROUP BY OWNER
      ORDER BY OWNER
      LIMIT ${limit} OFFSET ${offset}
    `;

    const rows = await executeQuery(query);
    
    // Transform contacts data
    const contacts = rows.map((row, index) => ({
      id: `contact-${offset + index}`,
      name: row.name,
      contact: row.contact,
      street: row.street,
      city: row.city,
      state: row.state,
      zip: row.zip,
      phoneEmail: row.phoneEmail,
      unitName: row.unitName,
      totalNMA: parseFloat(row.totalNMA) || 0,
      netMineralAcres: parseFloat(row.totalNMA) || 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // Return paginated response
    res.json({
      data: contacts,
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
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching contacts', 
      error: error.message 
    });
  }
});

// Contact sub-routes - MUST come before /api/contacts/:id to be matched first
// Contact tract ownership endpoint
app.get('/api/contacts/:id/tract-ownership', async (req, res) => {
  try {
    if (!dbPool) {
      return res.status(500).json({ success: false, message: 'Database pool not initialized' });
    }

    const { id } = req.params;
    console.log(`GET /api/contacts/${id}/tract-ownership requested`);
    
    // Parse contact ID to get owner name - handle contact-0 format
    let offset;
    if (id.startsWith('contact-')) {
      offset = parseInt(id.replace('contact-', ''));
    } else if (id.startsWith('c')) {
      const contactNumber = parseInt(id.replace('c', ''));
      offset = contactNumber - 1;
    } else {
      return res.status(404).json({ error: 'Invalid contact ID format' });
    }
    
    if (isNaN(offset) || offset < 0) {
      return res.status(404).json({ error: 'Invalid contact ID' });
    }
    
    // Get all contacts to find the owner name
    const allContacts = await executeQuery(`
      SELECT DISTINCT OWNER as owner_name
      FROM prod_acreage_schedule 
      WHERE (OWNER IS NOT NULL AND OWNER != '')
      ORDER BY OWNER
      LIMIT 10000
    `);
    
    if (offset >= allContacts.length) {
      return res.json([]);
    }
    
    const ownerName = allContacts[offset].owner_name;
    
    // Get all sections/tracts for this owner
    const results = await executeQuery(`
      SELECT 
        S_T_R as str,
        MAX(COUNTY) as county,
        MAX(ST) as state,
        SUM(CAST(NMA AS DECIMAL(10,2))) as net_mineral_acres,
        AVG(CAST(ROY AS DECIMAL(5,2))) as royalty_percentage,
        AVG(CAST(ALLO_ AS DECIMAL(5,2))) as ownership_percentage
      FROM prod_acreage_schedule 
      WHERE OWNER = ?
      GROUP BY S_T_R
      ORDER BY S_T_R
    `, [ownerName]);
    
    const tractOwnership = results.map((row, index) => {
      const sectionId = `s${index + 1}`;
      const sectionName = row.str || 'Unknown Section';
      
      return {
        id: `to${index + 1}`,
        contactId: id,
        sectionId: sectionId,
        tractId: sectionId, // For backward compatibility
        section: {
          id: sectionId,
          str: row.str,
          county: row.county,
          state: row.state,
          sectionName: sectionName,
          tractName: sectionName // For backward compatibility
        },
        tract: { // For backward compatibility
          id: sectionId,
          tractId: sectionId,
          tractName: sectionName,
          str: row.str,
          county: row.county,
          state: row.state
        },
        ownershipPercentage: (parseFloat(row.ownership_percentage) || 0) / 100,
        royaltyPercentage: (parseFloat(row.royalty_percentage) || 0) / 100,
        nma: parseFloat(row.net_mineral_acres) || 0,
        nra: (parseFloat(row.net_mineral_acres) || 0) * ((parseFloat(row.royalty_percentage) || 0) / 100) / 0.125,
        hasActiveLead: false
      };
    });
    
    res.json(tractOwnership);
  } catch (error) {
    console.error('Error fetching contact tract ownership:', error);
    res.status(500).json({ error: 'Failed to fetch contact tract ownership' });
  }
});

// Contact units endpoint
app.get('/api/contacts/:id/units', async (req, res) => {
  try {
    if (!dbPool) {
      return res.status(500).json({ success: false, message: 'Database pool not initialized' });
    }

    const { id } = req.params;
    console.log(`GET /api/contacts/${id}/units requested`);
    
    // Parse contact ID to get owner name - handle contact-0 format
    let offset;
    if (id.startsWith('contact-')) {
      offset = parseInt(id.replace('contact-', ''));
    } else if (id.startsWith('c')) {
      const contactNumber = parseInt(id.replace('c', ''));
      offset = contactNumber - 1;
    } else {
      return res.status(404).json({ error: 'Invalid contact ID format' });
    }
    
    if (isNaN(offset) || offset < 0) {
      return res.status(404).json({ error: 'Invalid contact ID' });
    }
    
    // Get all contacts to find the owner name
    const allContacts = await executeQuery(`
      SELECT DISTINCT OWNER as owner_name
      FROM prod_acreage_schedule 
      WHERE (OWNER IS NOT NULL AND OWNER != '')
      ORDER BY OWNER
      LIMIT 10000
    `);
    
    if (offset >= allContacts.length) {
      return res.json([]);
    }
    
    const ownerName = allContacts[offset].owner_name;
    
    // Get all unique units for this owner
    const unitResults = await executeQuery(`
      SELECT 
        TRIM(REPLACE(REPLACE(CURRENT_UNIT_NAME, '\r\n', ' '), '\n', ' ')) as unit_name,
        MAX(COUNTY) as county,
        MAX(ST) as state,
        MAX(BUYER) as assigned_buyer,
        SUM(CAST(NMA AS DECIMAL(10,2))) as total_nma,
        COUNT(DISTINCT S_T_R) as section_count
      FROM prod_acreage_schedule 
      WHERE OWNER = ?
        AND CURRENT_UNIT_NAME IS NOT NULL 
        AND CURRENT_UNIT_NAME != ''
        AND TRIM(REPLACE(REPLACE(CURRENT_UNIT_NAME, '\r\n', ' '), '\n', ' ')) != ''
      GROUP BY TRIM(REPLACE(REPLACE(CURRENT_UNIT_NAME, '\r\n', ' '), '\n', ' '))
      ORDER BY unit_name
    `, [ownerName]);
    
    // Get sections for each unit to build the full unit summary
    const units = await Promise.all(unitResults.map(async (row, index) => {
      const unitName = row.unit_name;
      
      // Get all sections for this owner in this unit
      const sectionResults = await executeQuery(`
        SELECT 
          S_T_R as str,
          MAX(COUNTY) as county,
          MAX(ST) as state,
          SUM(CAST(NMA AS DECIMAL(10,2))) as net_mineral_acres,
          AVG(CAST(ROY AS DECIMAL(5,2))) as royalty_percentage,
          AVG(CAST(ALLO_ AS DECIMAL(5,2))) as ownership_percentage,
          MAX(BUYER) as assigned_buyer
        FROM prod_acreage_schedule 
        WHERE OWNER = ?
          AND TRIM(REPLACE(REPLACE(CURRENT_UNIT_NAME, '\r\n', ' '), '\n', ' ')) = ?
        GROUP BY S_T_R
        ORDER BY S_T_R
      `, [ownerName, unitName]);
      
      const sections = sectionResults.map((sectionRow, sectionIndex) => {
        const sectionId = `s${sectionIndex + 1}`;
        const sectionName = sectionRow.str || 'Unknown Section';
        
        return {
          id: `tos${sectionIndex + 1}`,
          contactId: id,
          sectionId: sectionId,
          section: {
            id: sectionId,
            str: sectionRow.str,
            county: sectionRow.county,
            state: sectionRow.state,
            sectionName: sectionName,
            tractName: sectionName
          },
          ownershipPercentage: (parseFloat(sectionRow.ownership_percentage) || 0) / 100,
          royaltyPercentage: (parseFloat(sectionRow.royalty_percentage) || 0) / 100,
          nma: parseFloat(sectionRow.net_mineral_acres) || 0,
          nra: (parseFloat(sectionRow.net_mineral_acres) || 0) * ((parseFloat(sectionRow.royalty_percentage) || 0) / 100) / 0.125,
          hasActiveLead: false,
          status: sectionRow.assigned_buyer ? 'Assigned' : 'Unassigned',
          assignedBuyer: sectionRow.assigned_buyer ? { name: sectionRow.assigned_buyer } : null
        };
      });
      
      // Determine unit status based on sections
      let unitStatus = 'Active';
      if (sections.some(s => s.status === 'Assigned')) {
        unitStatus = 'Producing';
      }
      
      // Calculate total NRA
      const totalNRA = sections.reduce((sum, s) => sum + (s.nra || 0), 0);
      
      return {
        id: `unit-${index + 1}`,
        unitId: `unit-${index + 1}`,
        unitName: unitName,
        operator: 'Unknown', // Would need to be fetched from unit tracker or other source
        county: row.county || 'Unknown',
        state: row.state || 'OK',
        formation: 'Unknown', // Would need to be fetched from unit tracker
        totalNMA: parseFloat(row.total_nma) || 0,
        totalNRA: totalNRA,
        sectionCount: parseInt(row.section_count) || sections.length,
        sections: sections,
        hasActiveLead: false,
        assignedBuyer: row.assigned_buyer ? { name: row.assigned_buyer } : null,
        status: unitStatus
      };
    }));
    
    res.json(units);
  } catch (error) {
    console.error('Error fetching contact units:', error);
    res.status(500).json({ error: 'Failed to fetch contact units' });
  }
});

// Contact leads endpoint
app.get('/api/contacts/:id/leads', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`GET /api/contacts/${id}/leads requested`);
    res.json([]);
  } catch (error) {
    console.error('Error fetching contact leads:', error);
    res.status(500).json({ error: 'Failed to fetch contact leads' });
  }
});

// Contact call logs endpoint
app.get('/api/contacts/:id/call-logs', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`GET /api/contacts/${id}/call-logs requested`);
    res.json([]);
  } catch (error) {
    console.error('Error fetching contact call logs:', error);
    res.status(500).json({ error: 'Failed to fetch contact call logs' });
  }
});

// Contact documents endpoint
app.get('/api/contacts/:id/documents', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`GET /api/contacts/${id}/documents requested`);
    res.json([]);
  } catch (error) {
    console.error('Error fetching contact documents:', error);
    res.status(500).json({ error: 'Failed to fetch contact documents' });
  }
});

// Contact distress signals endpoint
app.get('/api/contacts/:id/distress-signals', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`GET /api/contacts/${id}/distress-signals requested`);
    res.json([]);
  } catch (error) {
    console.error('Error fetching contact distress signals:', error);
    res.status(500).json({ error: 'Failed to fetch contact distress signals' });
  }
});

// Contact detail endpoint - MUST come after all sub-routes
app.get('/api/contacts/:id', async (req, res) => {
  try {
    if (!dbPool) {
      return res.status(500).json({ success: false, message: 'Database pool not initialized' });
    }

    const { id } = req.params;
    console.log(`GET /api/contacts/${id} requested`);
    
    // Parse the contact ID to get the offset - handle contact-0 format
    let offset;
    if (id.startsWith('contact-')) {
      offset = parseInt(id.replace('contact-', ''));
    } else if (id.startsWith('c')) {
      const contactNumber = parseInt(id.replace('c', ''));
      offset = contactNumber - 1;
    } else {
      return res.status(404).json({ error: 'Invalid contact ID format' });
    }
    
    if (isNaN(offset) || offset < 0) {
      return res.status(404).json({ error: 'Invalid contact ID' });
    }
    
    // Get all contacts grouped by owner with summed NMA
    const allResults = await executeQuery(`
      SELECT 
        OWNER as owner_name,
        MAX(CONTACT) as contact_info,
        MAX(PHONE_EMAIL) as phone_email,
        MAX(STREET) as street,
        MAX(CITY) as city,
        MAX(ST) as state,
        MAX(ZIP) as zip,
        SUM(CAST(NMA AS DECIMAL(10,2))) as total_net_mineral_acres
      FROM prod_acreage_schedule 
      WHERE (OWNER IS NOT NULL AND OWNER != '')
      GROUP BY OWNER
      ORDER BY OWNER
      LIMIT 10000
    `);
    
    if (offset >= allResults.length) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    
    const row = allResults[offset];
    
    // Parse phone and email from PHONE_EMAIL field
    let phone = '';
    let email = '';
    if (row.phone_email) {
      const parts = row.phone_email.split(' - ');
      if (parts.length >= 2) {
        phone = parts[0].trim();
        email = parts[1].trim();
      } else {
        phone = row.phone_email.trim();
      }
    }
    
    const contact = {
      id: id,
      name: row.owner_name || 'Unknown Owner',
      email: email || '',
      phone: phone || '',
      address: row.street || '',
      city: row.city || 'Unknown',
      state: row.state || 'Unknown',
      zipCode: row.zip || '',
      contactType: 'Landowner',
      netMineralAcres: parseFloat(row.total_net_mineral_acres) || 0,
      totalNMA: parseFloat(row.total_net_mineral_acres) || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    res.json(contact);
  } catch (error) {
    console.error('Error fetching contact:', error);
    res.status(500).json({ error: 'Failed to fetch contact' });
  }
});

// Get all leads
app.get('/api/leads', async (req, res) => {
  try {
    if (!dbPool) {
      return res.status(500).json({ success: false, message: 'Database pool not initialized' });
    }

    // Parse pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pagination parameters. Page must be >= 1, limit must be between 1 and 1000'
      });
    }

    // Build search conditions
    let searchConditions = '';
    if (search) {
      searchConditions = `
        AND (
          OWNER LIKE '%${search}%' OR
          CONTACT LIKE '%${search}%' OR
          CURRENT_UNIT_NAME LIKE '%${search}%' OR
          PHONE_EMAIL LIKE '%${search}%' OR
          BUYER LIKE '%${search}%' OR
          STATUS LIKE '%${search}%'
        )
      `;
    }

    // Get total count for pagination metadata
    const countQuery = `
      SELECT COUNT(DISTINCT OWNER) as total
      FROM prod_acreage_schedule
      WHERE OWNER IS NOT NULL AND OWNER != ''
      ${searchConditions}
    `;
    const countResult = await executeQuery(countQuery);
    const totalCount = countResult[0].total;

    const query = `
      SELECT DISTINCT
        OWNER as name,
        CONTACT as contact,
        STREET as street,
        CITY as city,
        ST as state,
        ZIP as zip,
        PHONE_EMAIL as phoneEmail,
        CURRENT_UNIT_NAME as unitName,
        NMA as grossAcres,
        NMA as netMineralAcres,
        ROY as royalty,
        BUYER as buyer,
        STATUS as status,
        created_at,
        updated_at
      FROM prod_acreage_schedule
      WHERE OWNER IS NOT NULL AND OWNER != ''
      ${searchConditions}
      ORDER BY OWNER
      LIMIT ${limit} OFFSET ${offset}
    `;

    const rows = await executeQuery(query);
    
    // Transform leads data to match LeadEnhanced interface
    const leads = rows.map((row, index) => {
      // Determine status based on database status
      let leadStatus = 'Uncontacted';
      if (row.status === 'DROPPED') leadStatus = 'Dead';
      else if (row.status === 'LVM/TXT/EMAIL') leadStatus = 'Spoke';
      else if (row.status === 'NEW') leadStatus = 'Uncontacted';
      else if (row.status === 'WTL') leadStatus = 'Interested';
      
      // Calculate priority score based on acreage and royalty
      const grossAcres = parseFloat(row.grossAcres) || 0;
      const royalty = parseFloat(row.royalty) || 0;
      const priorityScore = Math.min(100, Math.max(10, (grossAcres * 2) + (royalty * 2)));
      
      return {
        id: `lead-${offset + index}`,
        linkedContactId: `contact-${offset + index}`,
        linkedSectionIds: row.unitName ? [`section-${row.unitName}`] : [],
        linkedUnitIds: row.unitName ? [`unit-${row.unitName}`] : [],
        buyerId: row.buyer?.toLowerCase() || 'unassigned',
        sourceChannel: 'Broker',
        status: leadStatus,
        priorityScore: Math.round(priorityScore),
        lastContactDate: row.updated_at,
        nextFollowUpDate: null,
        notes: `Contact: ${row.contact || 'N/A'}, Phone/Email: ${row.phoneEmail || 'N/A'}`,
        outreachCount: 0,
        documentLinks: [],
        assignmentId: null,
        
        // Additional fields for display
        name: row.name,
        contact: row.contact,
        street: row.street,
        city: row.city,
        state: row.state,
        zip: row.zip,
        phoneEmail: row.phoneEmail,
        unitName: row.unitName,
        grossAcres: grossAcres,
        netMineralAcres: parseFloat(row.netMineralAcres) || 0,
        royalty: royalty,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        
        // Populated fields for display
        linkedContact: {
          id: `contact-${offset + index}`,
          name: row.name,
          city: row.city,
          state: row.state,
          street: row.street,
          zip: row.zip,
          phoneEmail: row.phoneEmail
        },
        linkedSections: row.unitName ? [{
          id: `section-${row.unitName}`,
          sectionName: row.unitName,
          unitName: row.unitName
        }] : [],
        linkedUnits: row.unitName ? [{
          id: `unit-${row.unitName}`,
          unitName: row.unitName
        }] : [],
        buyer: {
          id: row.buyer?.toLowerCase() || 'unassigned',
          name: row.buyer || 'Unassigned',
          email: `${row.buyer?.toLowerCase()}@company.com` || 'unassigned@company.com'
        }
      };
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // Return paginated response
    res.json({
      data: leads,
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
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching leads', 
      error: error.message 
    });
  }
});

// Get all assignments
app.get('/api/assignments', async (req, res) => {
  try {
    if (!dbPool) {
      return res.status(500).json({ success: false, message: 'Database pool not initialized' });
    }

    // Parse pagination and search parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pagination parameters. Page must be >= 1, limit must be between 1 and 1000'
      });
    }

    // Get cached assignments
    const allAssignments = await getCachedAssignments();
    
    // Apply search filter if provided
    let filteredAssignments = allAssignments;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredAssignments = allAssignments.filter(assignment => 
        assignment.assignedBuyer?.name?.toLowerCase().includes(searchLower) ||
        assignment.asset?.sectionName?.toLowerCase().includes(searchLower) ||
        assignment.asset?.unitName?.toLowerCase().includes(searchLower) ||
        assignment.status?.toLowerCase().includes(searchLower) ||
        assignment.notes?.toLowerCase().includes(searchLower)
      );
    }

    // Apply pagination
    const totalCount = filteredAssignments.length;
    const paginatedAssignments = filteredAssignments.slice(offset, offset + limit);


    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // Return paginated response
    res.json({
      data: paginatedAssignments,
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
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching assignments', 
      error: error.message 
    });
  }
});

// =============================================================================
// Data Import API Endpoints
// =============================================================================

// Get all staging tables
app.get('/api/import/staging-tables', async (req, res) => {
  try {
    if (!dataImportService) {
      return res.status(500).json({ success: false, message: 'Data import service not available' });
    }

    const stagingTables = await dataImportService.getStagingTables();
    res.json({
      success: true,
      stagingTables
    });
  } catch (error) {
    console.error('Error fetching staging tables:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching staging tables', 
      error: error.message 
    });
  }
});

// Get staging table data
app.get('/api/import/staging-data/:tableName', async (req, res) => {
  try {
    if (!dataImportService) {
      return res.status(500).json({ success: false, message: 'Data import service not available' });
    }

    const { tableName } = req.params;
    const { limit = 100 } = req.query;
    
    const data = await dataImportService.getStagingTableData(tableName, parseInt(limit));
    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error fetching staging table data:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching staging table data', 
      error: error.message 
    });
  }
});

// Get production tables
app.get('/api/import/production-tables', async (req, res) => {
  try {
    if (!dbPool) {
      return res.status(500).json({ success: false, message: 'Database pool not initialized' });
    }

    const query = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'soonermineraldb' 
      AND table_name LIKE 'prod_%'
    `;
    
    const rows = await executeQuery(query);
    const productionTables = rows.map(row => row.table_name);
    
    res.json({
      success: true,
      productionTables
    });
  } catch (error) {
    console.error('Error fetching production tables:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching production tables', 
      error: error.message 
    });
  }
});

// Get production table data
app.get('/api/import/production-data/:tableName', async (req, res) => {
  try {
    if (!dbPool) {
      return res.status(500).json({ success: false, message: 'Database pool not initialized' });
    }

    const { tableName } = req.params;
    const { limit = 100 } = req.query;
    
    const query = `SELECT * FROM ${tableName} LIMIT ?`;
    const rows = await executeQuery(query, [parseInt(limit)]);
    
    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Error fetching production table data:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching production table data', 
      error: error.message 
    });
  }
});

// Approve import (move from staging to production)
app.post('/api/import/approve', async (req, res) => {
  try {
    if (!dataImportService) {
      return res.status(500).json({ success: false, message: 'Data import service not available' });
    }

    const { stagingTableName, productionTableName } = req.body;
    
    if (!stagingTableName || !productionTableName) {
      return res.status(400).json({ 
        success: false, 
        message: 'stagingTableName and productionTableName are required' 
      });
    }

    const result = await dataImportService.approveImport(stagingTableName, productionTableName);
    res.json(result);
  } catch (error) {
    console.error('Error approving import:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error approving import', 
      error: error.message 
    });
  }
});

// Delete staging table
app.delete('/api/import/staging-table/:tableName', async (req, res) => {
  try {
    if (!dataImportService) {
      return res.status(500).json({ success: false, message: 'Data import service not available' });
    }

    const { tableName } = req.params;
    await dataImportService.deleteStagingTable(tableName);
    
    res.json({
      success: true,
      message: `Staging table ${tableName} deleted successfully`
    });
  } catch (error) {
    console.error('Error deleting staging table:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting staging table', 
      error: error.message 
    });
  }
});

// Update staging record
app.put('/api/import/staging-data/:tableName/:recordId', async (req, res) => {
  try {
    if (!dbPool) {
      return res.status(500).json({ success: false, message: 'Database pool not initialized' });
    }

    const { tableName, recordId } = req.params;
    const updateData = req.body;
    
    // Build dynamic update query
    const setClause = Object.keys(updateData)
      .map(key => `\`${key}\` = ?`)
      .join(', ');
    
    const values = Object.values(updateData);
    values.push(recordId);
    
    const query = `UPDATE ${tableName} SET ${setClause} WHERE id = ?`;
    await executeQuery(query, values);
    
    res.json({
      success: true,
      message: 'Record updated successfully'
    });
  } catch (error) {
    console.error('Error updating staging record:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating staging record', 
      error: error.message 
    });
  }
});

// Delete staging record
app.delete('/api/import/staging-data/:tableName/:recordId', async (req, res) => {
  try {
    if (!dbPool) {
      return res.status(500).json({ success: false, message: 'Database pool not initialized' });
    }

    const { tableName, recordId } = req.params;
    
    const query = `DELETE FROM ${tableName} WHERE id = ?`;
    await executeQuery(query, [recordId]);
    
    res.json({
      success: true,
      message: 'Record deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting staging record:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting staging record', 
      error: error.message 
    });
  }
});

// Normalize existing production tables
app.post('/api/import/normalize', async (req, res) => {
  try {
    if (!dataImportService) {
      return res.status(500).json({ success: false, message: 'Data import service not available' });
    }

    const result = await dataImportService.normalizeExistingProductionTables();
    res.json(result);
  } catch (error) {
    console.error('Error normalizing production tables:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error normalizing production tables', 
      error: error.message 
    });
  }
});

// Get normalized data overview
app.get('/api/normalized/overview', async (req, res) => {
  try {
    if (!dbPool) {
      return res.status(500).json({ success: false, message: 'Database pool not initialized' });
    }

    // Get counts from normalized tables
    const queries = [
      'SELECT COUNT(*) as count FROM properties',
      'SELECT COUNT(*) as count FROM owners',
      'SELECT COUNT(*) as count FROM mineral_interests',
      'SELECT COUNT(*) as count FROM wells',
      'SELECT COUNT(*) as count FROM units'
    ];

    const results = await Promise.all(
      queries.map(query => executeQuery(query))
    );

    const overview = {
      properties: results[0][0].count,
      owners: results[1][0].count,
      mineralInterests: results[2][0].count,
      wells: results[3][0].count,
      units: results[4][0].count
    };

    res.json({
      success: true,
      data: overview
    });
  } catch (error) {
    console.error('Error fetching normalized overview:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching normalized overview', 
      error: error.message 
    });
  }
});

// Get pricing summary
app.get('/api/normalized/pricing-summary', async (req, res) => {
  try {
    if (!dbPool) {
      return res.status(500).json({ success: false, message: 'Database pool not initialized' });
    }

    const query = `
      SELECT 
        f.name as formation,
        AVG(fp.price_per_acre) as avg_price,
        MIN(fp.price_per_acre) as min_price,
        MAX(fp.price_per_acre) as max_price,
        COUNT(*) as record_count
      FROM formation_pricing fp
      JOIN formations f ON fp.formation_id = f.id
      GROUP BY f.id, f.name
      ORDER BY avg_price DESC
    `;

    const rows = await executeQuery(query);
    
    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Error fetching pricing summary:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching pricing summary', 
      error: error.message 
    });
  }
});

// Get acreage summary
app.get('/api/normalized/acreage-summary', async (req, res) => {
  try {
    if (!dbPool) {
      return res.status(500).json({ success: false, message: 'Database pool not initialized' });
    }

    const query = `
      SELECT 
        c.name as county,
        SUM(mi.net_mineral_acres) as total_acres,
        COUNT(DISTINCT mi.owner_id) as owner_count,
        COUNT(DISTINCT mi.property_id) as property_count
      FROM mineral_interests mi
      JOIN properties p ON mi.property_id = p.id
      JOIN counties c ON p.county_id = c.id
      GROUP BY c.id, c.name
      ORDER BY total_acres DESC
    `;

    const rows = await executeQuery(query);
    
    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Error fetching acreage summary:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching acreage summary', 
      error: error.message 
    });
  }
});

// Get unit summary
app.get('/api/normalized/unit-summary', async (req, res) => {
  try {
    if (!dbPool) {
      return res.status(500).json({ success: false, message: 'Database pool not initialized' });
    }

    const query = `
      SELECT 
        ut.name as tier,
        us.name as status,
        COUNT(*) as unit_count,
        AVG(u.tops_price_3_16th) as avg_tops_price,
        AVG(u.number_of_owners) as avg_owners
      FROM units u
      JOIN unit_tiers ut ON u.tier_id = ut.id
      JOIN unit_status_types us ON u.unit_status_id = us.id
      GROUP BY ut.id, ut.name, us.id, us.name
      ORDER BY unit_count DESC
    `;

    const rows = await executeQuery(query);
    
    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Error fetching unit summary:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching unit summary', 
      error: error.message 
    });
  }
});


// Sections API endpoint with pagination
app.get('/api/sections', async (req, res) => {
  try {
    if (!dbPool) {
      return res.status(500).json({ success: false, message: 'Database pool not initialized' });
    }

    // Parse pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pagination parameters. Page must be >= 1, limit must be between 1 and 1000'
      });
    }

    // Get total count for pagination metadata
    const countQuery = `
      SELECT COUNT(DISTINCT S_T_R) as total
      FROM prod_acreage_schedule 
      WHERE S_T_R IS NOT NULL
    `;
    const countResult = await executeQuery(countQuery);
    const totalCount = countResult[0].total;

    // Get paginated data - group by S_T_R only to get unique sections
    const query = `
      SELECT 
        S_T_R as str,
        MAX(COUNTY) as county,
        MAX(ST) as state,
        GROUP_CONCAT(DISTINCT STATUS ORDER BY STATUS SEPARATOR ',\n') as statuses,
        GROUP_CONCAT(DISTINCT LEGAL_DESCRIPTION ORDER BY LEGAL_DESCRIPTION SEPARATOR ';\n') as legal_descriptions,
        SUM(NMA) as net_mineral_acres,
        AVG(CALCULATED_ACREAGE) as calculated_acreage,
        GROUP_CONCAT(DISTINCT BUYER ORDER BY BUYER SEPARATOR ', ') as assigned_buyer,
        COUNT(DISTINCT BUYER) as buyer_count,
        COUNT(DISTINCT OWNER) as owner_count,
        MIN(DATE) as date_created,
        GROUP_CONCAT(DISTINCT TITLE_SOURCE ORDER BY TITLE_SOURCE SEPARATOR ', ') as title_sources,
        GROUP_CONCAT(DISTINCT CURRENT_UNIT_NAME ORDER BY CURRENT_UNIT_NAME SEPARATOR ',\n') as current_unit
      FROM prod_acreage_schedule 
      WHERE S_T_R IS NOT NULL 
      GROUP BY S_T_R
      ORDER BY S_T_R
      LIMIT ${limit} OFFSET ${offset}
    `;

    const rows = await executeQuery(query);
    
    // Transform the data to match sections format
    const sections = rows.map((row, index) => {
      // Parse S-T-R format (e.g., "06-01S-03W" -> section: "06", township: "01S", range: "03W")
      let section = null, township = null, range = null;
      if (row.str) {
        const parts = row.str.split('-');
        if (parts.length >= 3) {
          section = parts[0];
          township = parts[1];
          range = parts[2];
        }
      }
      
      // Use net mineral acres for both gross and net acres
      const netAcres = parseFloat(row.net_mineral_acres) || 0;
      
      // Compute status based on buyer: empty buyer = unassigned, non-empty buyer = assigned
      const buyer = row.assigned_buyer ? row.assigned_buyer.trim() : '';
      const status = buyer ? 'assigned' : 'unassigned';
      
      return {
        id: `s${offset + index + 1}`,
        section_name: row.str || `Section ${offset + index + 1}`,
        state: row.state || 'OK',
        county: row.county || 'Unknown',
        sectionNumber: section,
        township: township,
        range: range,
        str: row.str,
        grossAcres: netAcres,
        netMineralAcres: netAcres,
        titleStatus: row.statuses || 'Unknown',
        status: status,
        legalDescription: row.legal_descriptions || 'No description available',
        assignedBuyer: row.assigned_buyer ? { name: row.assigned_buyer } : null,
        buyerCount: row.buyer_count || 0,
        ownerCount: row.owner_count || 0,
        date_created: row.date_created || new Date().toISOString(),
        title_source: row.title_sources || 'Unknown',
        current_unit: row.current_unit || 'Unknown',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // Return paginated response
    res.json({
      data: sections,
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
  } catch (error) {
    console.error('Error fetching sections:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching sections', 
      error: error.message 
    });
  }
});

// Find section by STR - using query parameter to avoid route conflicts
app.get('/api/sections/by-str', async (req, res) => {
  try {
    if (!dbPool) {
      return res.status(500).json({ success: false, message: 'Database pool not initialized' });
    }

    const str = req.query.str;
    if (!str) {
      return res.status(400).json({ success: false, message: 'STR query parameter is required' });
    }
    
    const decodedStr = decodeURIComponent(str);
    console.log('Looking for section with STR:', decodedStr);
    
    // Get all sections ordered by STR to find the index
    const allResults = await executeQuery(`
      SELECT DISTINCT S_T_R as str
      FROM prod_acreage_schedule 
      WHERE S_T_R IS NOT NULL 
      ORDER BY S_T_R
    `);
    
    // Find the index of the matching STR
    const index = allResults.findIndex(row => row.str === decodedStr);
    
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Section not found', str: decodedStr });
    }
    
    // Return the section ID (s1, s2, etc.)
    const sectionId = `s${index + 1}`;
    console.log(`Found section ${sectionId} for STR ${decodedStr}`);
    res.json({ id: sectionId, str: decodedStr, index });
  } catch (error) {
    console.error('Error finding section by STR:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error finding section by STR',
      error: error.message 
    });
  }
});

// Get section contacts

app.get('/api/sections/:id/contacts', async (req, res) => {
  try {
    if (!dbPool) {
      return res.status(500).json({ success: false, message: 'Database pool not initialized' });
    }

    const { id } = req.params;
    
    // For now, return contacts that might be related to this section
    // In a real implementation, this would join with section data
    const query = `
      SELECT DISTINCT
        OWNER as name,
        CONTACT as contact,
        STREET as street,
        CITY as city,
        ST as state,
        ZIP as zip,
        PHONE_EMAIL as phoneEmail,
        CURRENT_UNIT_NAME as unitName,
        created_at,
        updated_at
      FROM prod_acreage_schedule
      WHERE OWNER IS NOT NULL AND OWNER != ''
      ORDER BY OWNER
      LIMIT 50
    `;

    const rows = await executeQuery(query);
    
    // Transform contacts data
    const contacts = rows.map((row, index) => ({
      id: `contact-${index}`,
      name: row.name,
      contact: row.contact,
      street: row.street,
      city: row.city,
      state: row.state,
      zip: row.zip,
      phoneEmail: row.phoneEmail,
      unitName: row.unitName,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
    
    res.json(contacts);
  } catch (error) {
    console.error('Error fetching section contacts:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching section contacts', 
      error: error.message 
    });
  }
});

// Get section leads
app.get('/api/sections/:id/leads', async (req, res) => {
  try {
    if (!dbPool) {
      return res.status(500).json({ success: false, message: 'Database pool not initialized' });
    }

    const { id } = req.params;
    
    // Get leads for this specific section based on the section ID
    // We'll use the section name or ID to match with the database
    const query = `
      SELECT DISTINCT
        OWNER as name,
        CONTACT as contact,
        STREET as street,
        CITY as city,
        ST as state,
        ZIP as zip,
        PHONE_EMAIL as phoneEmail,
        CURRENT_UNIT_NAME as unitName,
        NMA as grossAcres,
        NMA as netMineralAcres,
        ROY as royalty,
        BUYER as buyer,
        STATUS as status,
        created_at,
        updated_at
      FROM prod_acreage_schedule
      WHERE OWNER IS NOT NULL AND OWNER != ''
        AND (CURRENT_UNIT_NAME LIKE '%${id}%' OR CURRENT_UNIT_NAME IS NOT NULL)
      ORDER BY OWNER
      LIMIT 50
    `;

    const rows = await executeQuery(query);
    
    // Transform leads data to match SectionLead interface
    const leads = rows.map((row, index) => {
      // Determine status based on database status
      let leadStatus = 'In Progress';
      if (row.status === 'DROPPED') leadStatus = 'Closed';
      else if (row.status === 'LVM/TXT/EMAIL') leadStatus = 'In Progress';
      else if (row.status === 'NEW') leadStatus = 'In Progress';
      else if (row.status === 'WTL') leadStatus = 'In Progress';
      
      return {
        id: `lead-${id}-${index}`,
        sectionId: id,
        buyerId: row.buyer?.toLowerCase() || 'unassigned',
        status: leadStatus,
        leadSource: 'Assignment',
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        lastActivity: row.updated_at,
        noteCount: 0,
        
        // Additional fields for display
        name: row.name,
        contact: row.contact,
        street: row.street,
        city: row.city,
        state: row.state,
        zip: row.zip,
        phoneEmail: row.phoneEmail,
        unitName: row.unitName,
        grossAcres: parseFloat(row.grossAcres) || 0,
        netMineralAcres: parseFloat(row.netMineralAcres) || 0,
        royalty: parseFloat(row.royalty) || 0,
        priority: 'Medium',
        
        // Populated buyer info
        buyer: {
          id: row.buyer?.toLowerCase() || 'unassigned',
          name: row.buyer || 'Unassigned',
          email: `${row.buyer?.toLowerCase()}@company.com` || 'unassigned@company.com'
        }
      };
    });
    
    res.json(leads);
  } catch (error) {
    console.error('Error fetching section leads:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching section leads', 
      error: error.message 
    });
  }
});

// Get single lead by ID
app.get('/api/leads/:id', async (req, res) => {
  try {
    if (!dbPool) {
      return res.status(500).json({ success: false, message: 'Database pool not initialized' });
    }

    const { id } = req.params;
    
    // Extract the index from the lead ID (e.g., "lead-0" -> 0)
    const leadIndex = parseInt(id.replace('lead-', ''));
    
    // Get the lead data from the database using the same logic as the main endpoint
    const query = `
      SELECT DISTINCT
        OWNER as name,
        CONTACT as contact,
        STREET as street,
        CITY as city,
        ST as state,
        ZIP as zip,
        PHONE_EMAIL as phoneEmail,
        CURRENT_UNIT_NAME as unitName,
        NMA as grossAcres,
        NMA as netMineralAcres,
        ROY as royalty,
        BUYER as buyer,
        STATUS as status,
        created_at,
        updated_at
      FROM prod_acreage_schedule
      WHERE OWNER IS NOT NULL AND OWNER != ''
      ORDER BY OWNER
      LIMIT 1 OFFSET ${leadIndex}
    `;

    const rows = await executeQuery(query);
    
    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Lead not found' 
      });
    }

    const row = rows[0];
    
    // Determine status based on database status
    let leadStatus = 'Uncontacted';
    if (row.status === 'DROPPED') leadStatus = 'Dead';
    else if (row.status === 'LVM/TXT/EMAIL') leadStatus = 'Spoke';
    else if (row.status === 'NEW') leadStatus = 'Uncontacted';
    else if (row.status === 'WTL') leadStatus = 'Interested';
    
    // Calculate priority score based on acreage and royalty
    const grossAcres = parseFloat(row.grossAcres) || 0;
    const royalty = parseFloat(row.royalty) || 0;
    const priorityScore = Math.min(100, Math.max(10, (grossAcres * 2) + (royalty * 2)));
    
    const lead = {
      id: id,
      linkedContactId: `contact-${leadIndex}`,
      linkedSectionIds: row.unitName ? [`section-${row.unitName}`] : [],
      linkedUnitIds: row.unitName ? [`unit-${row.unitName}`] : [],
      buyerId: row.buyer?.toLowerCase() || 'unassigned',
      sourceChannel: 'Broker',
      status: leadStatus,
      priorityScore: Math.round(priorityScore),
      lastContactDate: row.updated_at,
      nextFollowUpDate: null,
      notes: `Contact: ${row.contact || 'N/A'}, Phone/Email: ${row.phoneEmail || 'N/A'}`,
      outreachCount: 0,
      documentLinks: [],
      assignmentId: null,
      
      // Additional fields for display
      name: row.name,
      contact: row.contact,
      street: row.street,
      city: row.city,
      state: row.state,
      zip: row.zip,
      phoneEmail: row.phoneEmail,
      unitName: row.unitName,
      grossAcres: grossAcres,
      netMineralAcres: parseFloat(row.netMineralAcres) || 0,
      royalty: royalty,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      
      // Populated fields for display
      linkedContact: {
        id: `contact-${leadIndex}`,
        name: row.name,
        city: row.city,
        state: row.state,
        street: row.street,
        zip: row.zip,
        phoneEmail: row.phoneEmail
      },
      linkedSections: row.unitName ? [{
        id: `section-${row.unitName}`,
        sectionName: row.unitName,
        unitName: row.unitName
      }] : [],
      linkedUnits: row.unitName ? [{
        id: `unit-${row.unitName}`,
        unitName: row.unitName
      }] : [],
      buyer: {
        id: row.buyer?.toLowerCase() || 'unassigned',
        name: row.buyer || 'Unassigned',
        email: `${row.buyer?.toLowerCase()}@company.com` || 'unassigned@company.com'
      }
    };
    
    res.json(lead);
  } catch (error) {
    console.error('Error fetching lead:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching lead', 
      error: error.message 
    });
  }
});

// Get lead sections
app.get('/api/leads/:id/sections', async (req, res) => {
  try {
    if (!dbPool) {
      return res.status(500).json({ success: false, message: 'Database pool not initialized' });
    }

    const { id } = req.params;
    
    // Extract the index from the lead ID (e.g., "lead-0" -> 0)
    const leadIndex = parseInt(id.replace('lead-', ''));
    
    // Get the lead data first to find associated sections
    const leadQuery = `
      SELECT DISTINCT
        OWNER as name,
        CURRENT_UNIT_NAME as unitName,
        BUYER as buyer,
        STATUS as status,
        created_at,
        updated_at
      FROM prod_acreage_schedule
      WHERE OWNER IS NOT NULL AND OWNER != ''
      ORDER BY OWNER
      LIMIT 1 OFFSET ${leadIndex}
    `;

    const leadRows = await executeQuery(leadQuery);
    
    if (leadRows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Lead not found' 
      });
    }

    const leadRow = leadRows[0];
    
    // Get sections related to this lead based on unit name or owner
    const sectionsQuery = `
      SELECT DISTINCT
        CURRENT_UNIT_NAME as sectionName,
        COUNTY as county,
        ST as state,
        S_T_R as str,
        NMA as grossAcres,
        NMA as netMineralAcres,
        ROY as royalty,
        BUYER as assignedBuyerId,
        STATUS as status,
        created_at,
        updated_at
      FROM prod_acreage_schedule
      WHERE OWNER = '${leadRow.name}' 
        AND CURRENT_UNIT_NAME IS NOT NULL 
        AND CURRENT_UNIT_NAME != ''
      ORDER BY CURRENT_UNIT_NAME
    `;

    const sectionRows = await executeQuery(sectionsQuery);
    
    // Transform sections data
    const sections = sectionRows.map((row, index) => ({
      id: `section-${leadIndex}-${index}`,
      sectionName: row.sectionName,
      county: row.county,
      state: row.state || 'OK',
      str: row.str,
      legalDescription: row.sectionName || '',
      grossAcres: parseFloat(row.grossAcres) || 0,
      netMineralAcres: parseFloat(row.netMineralAcres) || 0,
      royalty: parseFloat(row.royalty) || 0,
      assignedBuyerId: row.assignedBuyerId?.toLowerCase() || 'unassigned',
      assignedBuyerName: row.assignedBuyerId || 'Unassigned',
      titleStatus: 'Not Verified',
      heldByFund: false,
      isLocked: false,
      status: row.status === 'DROPPED' ? 'Inactive' : 
              row.status === 'LVM/TXT/EMAIL' ? 'Active' :
              row.status === 'NEW' ? 'Pending' :
              row.status === 'WTL' ? 'Under Review' : 'Pending',
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
    
    res.json(sections);
  } catch (error) {
    console.error('Error fetching lead sections:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching lead sections', 
      error: error.message 
    });
  }
});

// Get lead notes
app.get('/api/leads/:id/notes', async (req, res) => {
  try {
    if (!dbPool) {
      return res.status(500).json({ success: false, message: 'Database pool not initialized' });
    }

    const { id } = req.params;
    
    // Extract the index from the lead ID (e.g., "lead-0" -> 0)
    const leadIndex = parseInt(id.replace('lead-', ''));
    
    // Get the lead data first to find the actual lead ID
    const leadQuery = `
      SELECT DISTINCT
        OWNER as name,
        CURRENT_UNIT_NAME as unitName,
        BUYER as buyer,
        STATUS as status,
        created_at,
        updated_at
      FROM prod_acreage_schedule
      WHERE OWNER IS NOT NULL AND OWNER != ''
      ORDER BY OWNER
      LIMIT 1 OFFSET ${leadIndex}
    `;

    const leadRows = await executeQuery(leadQuery);
    
    if (leadRows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Lead not found' 
      });
    }

    const leadRow = leadRows[0];
    
    // Query the lead_notes table for this lead
    const notesQuery = `
      SELECT 
        ln.id,
        ln.lead_id,
        ln.note_text,
        ln.note_type,
        ln.created_by_id,
        ln.created_at,
        u.name as created_by_name,
        u.email as created_by_email
      FROM lead_notes ln
      LEFT JOIN users u ON ln.created_by_id = u.id
      WHERE ln.lead_id = 'lead${leadIndex + 1}'
      ORDER BY ln.created_at DESC
    `;

    const notesRows = await executeQuery(notesQuery);
    
    // Transform notes data to match frontend expectations
    const notes = notesRows.map((row, index) => ({
      id: row.id,
      leadId: row.lead_id,
      noteText: row.note_text,
      noteType: row.note_type || 'General',
      createdBy: row.created_by_id,
      createdAt: row.created_at,
      createdByUser: {
        id: row.created_by_id,
        name: row.created_by_name || 'Unknown User',
        email: row.created_by_email || 'unknown@company.com'
      }
    }));
    
    res.json(notes);
  } catch (error) {
    console.error('Error fetching lead notes:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching lead notes', 
      error: error.message 
    });
  }
});

// Get section spatial data
app.get('/api/section-spatial', async (req, res) => {
  try {
    if (!dbPool) {
      return res.status(500).json({ success: false, message: 'Database pool not initialized' });
    }

    // Return mock spatial data for now
    const spatialData = {
      id: 'spatial-1',
      sectionId: 's1',
      latitude: 35.4676,
      longitude: -97.5164,
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-97.52, 35.46],
          [-97.51, 35.46],
          [-97.51, 35.47],
          [-97.52, 35.47],
          [-97.52, 35.46]
        ]]
      },
      area: 640, // acres
      perimeter: 4.0 // miles
    };
    
    res.json(spatialData);
  } catch (error) {
    console.error('Error fetching section spatial data:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching section spatial data', 
      error: error.message 
    });
  }
});

// Get map layer preferences
app.get('/api/map/layer-preferences', async (req, res) => {
  try {
    // Return default layer preferences
    const preferences = [
      { layerName: 'wells', isVisible: true, opacity: 0.8 },
      { layerName: 'permits', isVisible: true, opacity: 0.7 },
      { layerName: 'rigs', isVisible: true, opacity: 0.9 },
      { layerName: 'units', isVisible: true, opacity: 0.6 }
    ];
    
    res.json(preferences);
  } catch (error) {
    console.error('Error fetching map layer preferences:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching map layer preferences', 
      error: error.message 
    });
  }
});

// Get nearby wells
app.get('/api/map/nearby/wells', async (req, res) => {
  try {
    if (!dbPool) {
      return res.status(500).json({ success: false, message: 'Database pool not initialized' });
    }

    const { lat, lng, radius } = req.query;
    
    // Return mock wells data for now
    const wells = [
      {
        id: 'well-1',
        name: 'Sample Well 1',
        latitude: parseFloat(lat) + 0.001,
        longitude: parseFloat(lng) + 0.001,
        status: 'Producing',
        operator: 'Sample Operator',
        depth: 8500,
        formation: 'Woodford'
      },
      {
        id: 'well-2',
        name: 'Sample Well 2',
        latitude: parseFloat(lat) - 0.001,
        longitude: parseFloat(lng) - 0.001,
        status: 'Drilling',
        operator: 'Another Operator',
        depth: 9200,
        formation: 'Mississippian'
      }
    ];
    
    res.json(wells);
  } catch (error) {
    console.error('Error fetching nearby wells:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching nearby wells', 
      error: error.message 
    });
  }
});

// Get nearby permits
app.get('/api/map/nearby/permits', async (req, res) => {
  try {
    const { lat, lng, radius } = req.query;
    
    // Return mock permits data for now
    const permits = [
      {
        id: 'permit-1',
        permitNumber: 'P-12345',
        latitude: parseFloat(lat) + 0.002,
        longitude: parseFloat(lng) + 0.002,
        status: 'Approved',
        operator: 'Sample Operator',
        issueDate: '2024-01-15',
        expirationDate: '2025-01-15'
      }
    ];
    
    res.json(permits);
  } catch (error) {
    console.error('Error fetching nearby permits:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching nearby permits', 
      error: error.message 
    });
  }
});

// Get nearby rigs
app.get('/api/map/nearby/rigs', async (req, res) => {
  try {
    const { lat, lng, radius } = req.query;
    
    // Return mock rigs data for now
    const rigs = [
      {
        id: 'rig-1',
        name: 'Rig Alpha',
        latitude: parseFloat(lat) + 0.003,
        longitude: parseFloat(lng) + 0.003,
        status: 'Active',
        operator: 'Drilling Company',
        depth: 7500,
        targetFormation: 'Woodford'
      }
    ];
    
    res.json(rigs);
  } catch (error) {
    console.error('Error fetching nearby rigs:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching nearby rigs', 
      error: error.message 
    });
  }
});

// Get nearby units
app.get('/api/map/nearby/units', async (req, res) => {
  try {
    const { lat, lng, radius } = req.query;
    
    // Return mock units data for now
    const units = [
      {
        id: 'unit-1',
        name: 'Sample Unit',
        latitude: parseFloat(lat) + 0.004,
        longitude: parseFloat(lng) + 0.004,
        status: 'Active',
        operator: 'Unit Operator',
        formation: 'Woodford',
        acreage: 640
      }
    ];
    
    res.json(units);
  } catch (error) {
    console.error('Error fetching nearby units:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching nearby units', 
      error: error.message 
    });
  }
});

// Update map layer preference
app.put('/api/map/layer-preferences/:layerName', async (req, res) => {
  try {
    const { layerName } = req.params;
    const { isVisible, opacity } = req.body;
    
    // In a real implementation, this would update the database
    res.json({ 
      success: true, 
      message: `Layer ${layerName} preference updated`,
      layerName,
      isVisible,
      opacity
    });
  } catch (error) {
    console.error('Error updating map layer preference:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating map layer preference', 
      error: error.message 
    });
  }
});

// Get unit sections
app.get('/api/units/:id/sections', async (req, res) => {
  try {
    if (!dbPool) {
      return res.status(500).json({ success: false, message: 'Database pool not initialized' });
    }

    const { id } = req.params;
    
    // Decode the URL-encoded unit name
    const unitName = decodeURIComponent(id);
    console.log('Looking for sections for unit:', unitName);
    
    // Get sections related to this unit
    const query = `
      SELECT DISTINCT
        S_T_R as str,
        COUNTY as county,
        ST as state,
        STATUS as title_status,
        LEGAL_DESCRIPTION as legal_description,
        NMA as net_mineral_acres,
        CALCULATED_ACREAGE as calculated_acreage,
        BUYER as assigned_buyer,
        OWNER as owner_name,
        CONTACT as contact_info,
        PHONE_EMAIL as phone_email,
        NOTE as notes,
        CURRENT_UNIT_NAME as current_unit,
        NEW_UNIT_NAME as new_unit,
        DATE as date_created,
        TITLE_SOURCE as title_source
      FROM prod_acreage_schedule 
      WHERE TRIM(REPLACE(REPLACE(CURRENT_UNIT_NAME, '\r\n', ' '), '\n', ' ')) = ? AND S_T_R IS NOT NULL 
      ORDER BY S_T_R
    `;

    const rows = await executeQuery(query, [unitName]);
    console.log('Found sections:', rows.length);
    
    // Transform sections data
    const sections = rows.map((row, index) => {
      // Parse S-T-R into components
      let section = '';
      let township = '';
      let range = '';
      
      if (row.str) {
        const parts = row.str.split('-');
        if (parts.length >= 3) {
          section = parts[0];
          township = parts[1];
          range = parts[2];
        }
      }
      
      const netAcres = parseFloat(row.net_mineral_acres) || 0;
      
      return {
        id: `s${index + 1}`,
        section_name: row.str || `Section ${index + 1}`,
        state: row.state || 'OK',
        county: row.county || 'Unknown',
        sectionNumber: section,
        township: township,
        range: range,
        str: row.str,
        grossAcres: netAcres,
        netMineralAcres: netAcres,
        titleStatus: row.title_status || 'Unknown',
        legalDescription: row.legal_description || '',
        assignedBuyer: row.assigned_buyer || '',
        ownerName: row.owner_name || '',
        contactInfo: row.contact_info || '',
        phoneEmail: row.phone_email || '',
        notes: row.notes || '',
        currentUnit: row.current_unit || '',
        newUnit: row.new_unit || '',
        dateCreated: row.date_created || new Date().toISOString(),
        titleSource: row.title_source || ''
      };
    });
    
    res.json(sections);
  } catch (error) {
    console.error('Error fetching unit sections:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching unit sections', 
      error: error.message 
    });
  }
});

// Get unit sections enhanced
app.get('/api/units/:id/sections/enhanced', async (req, res) => {
  try {
    if (!dbPool) {
      return res.status(500).json({ success: false, message: 'Database pool not initialized' });
    }

    const { id } = req.params;
    
    // Decode the URL-encoded unit name
    const unitName = decodeURIComponent(id);
    console.log('Looking for enhanced sections for unit:', unitName);
    
    // Get enhanced sections data with more details, grouped by STR only
    const query = `
      SELECT 
        S_T_R as str,
        MAX(COUNTY) as county,
        MAX(ST) as state,
        MAX(STATUS) as title_status,
        MAX(LEGAL_DESCRIPTION) as legal_description,
        SUM(NMA) as net_mineral_acres,
        SUM(CALCULATED_ACREAGE) as calculated_acreage,
        MAX(BUYER) as assigned_buyer,
        GROUP_CONCAT(DISTINCT OWNER SEPARATOR '; ') as owner_name,
        GROUP_CONCAT(DISTINCT CONTACT SEPARATOR '; ') as contact_info,
        GROUP_CONCAT(DISTINCT PHONE_EMAIL SEPARATOR '; ') as phone_email,
        GROUP_CONCAT(DISTINCT NOTE SEPARATOR '; ') as notes,
        MAX(CURRENT_UNIT_NAME) as current_unit,
        MAX(NEW_UNIT_NAME) as new_unit,
        MAX(DATE) as date_created,
        MAX(TITLE_SOURCE) as title_source,
        GROUP_CONCAT(DISTINCT STREET SEPARATOR '; ') as street,
        GROUP_CONCAT(DISTINCT CITY SEPARATOR '; ') as city,
        GROUP_CONCAT(DISTINCT ZIP SEPARATOR '; ') as zip,
        GROUP_CONCAT(DISTINCT INTEREST_TYPE SEPARATOR '; ') as interest_type
      FROM prod_acreage_schedule 
      WHERE TRIM(REPLACE(REPLACE(CURRENT_UNIT_NAME, '\r\n', ' '), '\n', ' ')) = ? AND S_T_R IS NOT NULL 
      GROUP BY S_T_R
      ORDER BY S_T_R
    `;

    const rows = await executeQuery(query, [unitName]);
    console.log('Found enhanced sections:', rows.length);
    
    // Transform enhanced sections data
    const sections = rows.map((row, index) => {
      // Parse S-T-R into components
      let section = '';
      let township = '';
      let range = '';
      
      if (row.str) {
        const parts = row.str.split('-');
        if (parts.length >= 3) {
          section = parts[0];
          township = parts[1];
          range = parts[2];
        }
      }
      
      const netAcres = parseFloat(row.net_mineral_acres) || 0;
      
      return {
        id: `s${index + 1}`,
        section_name: row.str || `Section ${index + 1}`,
        state: row.state || 'OK',
        county: row.county || 'Unknown',
        sectionNumber: section,
        township: township,
        range: range,
        str: row.str,
        grossAcres: netAcres,
        netMineralAcres: netAcres,
        titleStatus: row.title_status || 'Unknown',
        legalDescription: row.legal_description || '',
        assignedBuyer: row.assigned_buyer || '',
        ownerName: row.owner_name || '',
        contactInfo: row.contact_info || '',
        phoneEmail: row.phone_email || '',
        notes: row.notes || '',
        currentUnit: row.current_unit || '',
        newUnit: row.new_unit || '',
        dateCreated: row.date_created || new Date().toISOString(),
        titleSource: row.title_source || '',
        street: row.street || '',
        city: row.city || '',
        zip: row.zip || '',
        interestType: row.interest_type || ''
      };
    });
    
    res.json(sections);
  } catch (error) {
    console.error('Error fetching unit sections enhanced:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching unit sections enhanced', 
      error: error.message 
    });
  }
});

// Tract CRUD operations
app.get('/api/tracts', async (req, res) => {
  try {
    if (!dbPool) {
      return res.status(500).json({ success: false, message: 'Database pool not initialized' });
    }

    // Parse pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pagination parameters. Page must be >= 1, limit must be between 1 and 1000'
      });
    }

    // Get total count for pagination metadata
    const countQuery = `
      SELECT COUNT(*) as total
      FROM prod_acreage_schedule
      WHERE CURRENT_UNIT_NAME IS NOT NULL 
        AND CURRENT_UNIT_NAME != ''
    `;
    const countResult = await executeQuery(countQuery);
    const totalCount = countResult[0].total;

    const query = `
      SELECT 
        id,
        COUNTY,
        S_T_R,
        CURRENT_UNIT_NAME,
        OWNER,
        NMA,
        ROY,
        ALLO_ AS ALLOCATION_PERCENT,
        STATUS,
        BUYER,
        NOTE,
        INTEREST_TYPE,
        LEGAL_DESCRIPTION,
        STREET,
        CITY,
        ST,
        ZIP,
        PHONE_EMAIL,
        CONTACT,
        created_at,
        updated_at
      FROM prod_acreage_schedule
      WHERE CURRENT_UNIT_NAME IS NOT NULL 
        AND CURRENT_UNIT_NAME != ''
      ORDER BY CURRENT_UNIT_NAME, COUNTY, S_T_R
      LIMIT ${limit} OFFSET ${offset}
    `;

    const rows = await executeQuery(query);
    
    // Transform to tract format
    const tracts = rows.map(row => ({
      id: row.id,
      tractName: row.CURRENT_UNIT_NAME,
      state: row.ST || 'OK',
      county: row.COUNTY,
      legalDescription: row.LEGAL_DESCRIPTION || '',
      str: row.S_T_R,
      grossAcres: parseFloat(row.NMA) || 0,
      netMineralAcres: parseFloat(row.NMA) || 0,
      royalty: parseFloat(row.ROY) || 0,
      ownershipPercentage: parseFloat(row.ALLO_) || 0,
      titleStatus: 'In Progress',
      assignedBuyerId: null,
      assignedBuyer: null,
      nraCapUsd: null,
      sourceChannel: null,
      routingNotes: row.NOTE || '',
      heldByFund: false,
      isLocked: false,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // Return paginated response
    res.json({
      data: tracts,
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
  } catch (error) {
    console.error('Error fetching tracts:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching tracts', 
      error: error.message 
    });
  }
});

app.put('/api/tracts/:id', async (req, res) => {
  try {
    if (!dbPool) {
      return res.status(500).json({ success: false, message: 'Database pool not initialized' });
    }

    const { id } = req.params;
    const tractData = req.body;

    // For now, just return success since we're working with read-only data
    res.json({ 
      success: true, 
      message: 'Tract updated successfully',
      id: id,
      ...tractData
    });
  } catch (error) {
    console.error('Error updating tract:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating tract', 
      error: error.message 
    });
  }
});

app.post('/api/tracts', async (req, res) => {
  try {
    if (!dbPool) {
      return res.status(500).json({ success: false, message: 'Database pool not initialized' });
    }

    const tractData = req.body;

    // For now, just return success since we're working with read-only data
    const newId = `tract-${Date.now()}`;
    res.json({ 
      success: true, 
      message: 'Tract created successfully',
      id: newId,
      ...tractData
    });
  } catch (error) {
    console.error('Error creating tract:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error creating tract', 
      error: error.message 
    });
  }
});

app.delete('/api/tracts/:id', async (req, res) => {
  try {
    if (!dbPool) {
      return res.status(500).json({ success: false, message: 'Database pool not initialized' });
    }

    const { id } = req.params;

    // For now, just return success since we're working with read-only data
    res.json({ 
      success: true, 
      message: 'Tract deleted successfully',
      id: id
    });
  } catch (error) {
    console.error('Error deleting tract:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting tract', 
      error: error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Import API server running on port ${PORT}`);
  console.log(`📊 Database: MySQL (${process.env.MYSQL_DATABASE || 'soonermineraldb'})`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});

export default app;

