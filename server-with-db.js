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

const createDatabasePool = () => {
  try {
    dbPool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3359,
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
      '/api/health',
      '/api/tracts',
      '/api/units',
      '/api/users'
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

// Get tracts data from prod_acreage_schedule table
app.get('/api/tracts', async (req, res) => {
  try {
    if (!dbPool) {
      return res.status(500).json({ success: false, message: 'Database pool not initialized' });
    }

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
      ORDER BY COUNTY, S_T_R
      LIMIT 1000
    `;

    const rows = await executeQuery(query);
    
    // Transform the data to match the Tract interface
    const tracts = rows.map(row => {
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

      return {
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
    });

    res.json(tracts);
  } catch (error) {
    console.error('Error fetching tracts data:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching tracts data', 
      error: error.message 
    });
  }
});

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
    
    res.json(users);
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
      LIMIT 1000
    `;

    const rows = await executeQuery(query);
    
    // Process the data to extract units
    const unitMap = new Map();
    
    rows.forEach(row => {
      if (row.CURRENT_UNIT_NAME) {
        // Split unit names by line breaks and process each
        const unitNames = row.CURRENT_UNIT_NAME.split('\r\n').filter(name => name.trim() !== '');
        
        unitNames.forEach(unitName => {
          const trimmedUnitName = unitName.trim();
          if (trimmedUnitName && !unitMap.has(trimmedUnitName)) {
            // Create unit with proper numeric ID based on database record
            unitMap.set(trimmedUnitName, {
              id: row.id,
              unitName: trimmedUnitName,
              operator: 'Unknown', // Not available in current data
              apiNumbers: [], // Would need to be extracted from unit name or other sources
              targetFormations: ['Hunton', 'Woodford', 'Mississippian'], // Common OK formations
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
            // Add tract to existing unit
            const existingUnit = unitMap.get(trimmedUnitName);
            existingUnit.linkedTractIds.push(row.id);
            existingUnit.estimatedGrossAcres += parseFloat(row.NMA) || 0;
            existingUnit.estimatedNetAcres += parseFloat(row.NMA) || 0;
            existingUnit.totalNetMineralAcres += parseFloat(row.NMA) || 0;
          }
        });
      }
    });

    // Convert map to array and sort
    const units = Array.from(unitMap.values()).sort((a, b) => a.unitName.localeCompare(b.unitName));
    
    res.json(units);
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
      ORDER BY CURRENT_UNIT_NAME, COUNTY, S_T_R
    `;

    const rows = await executeQuery(query, [unitName]);
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Unit not found' });
    }

    // Process the data similar to the units endpoint
    const unitMap = new Map();
    
    rows.forEach(row => {
      if (row.CURRENT_UNIT_NAME) {
        const unitNames = row.CURRENT_UNIT_NAME.split('\r\n').filter(name => name.trim() !== '');
        
        unitNames.forEach(unitNameItem => {
          const trimmedUnitName = unitNameItem.trim();
          
          if (!unitMap.has(trimmedUnitName)) {
            unitMap.set(trimmedUnitName, {
              id: row.id,
              unitName: trimmedUnitName,
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
        });
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
    
    // For now, return empty assignments array since we don't have assignment data
    // This prevents 404 errors while maintaining the API structure
    res.json([]);
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
      WHERE CURRENT_UNIT_NAME = ?
      ORDER BY OWNER
    `;

    const rows = await executeQuery(query, [unitName]);
    
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

// Get unit contacts aggregated
app.get('/api/units/:id/contacts/aggregated', async (req, res) => {
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
      WHERE CURRENT_UNIT_NAME = ?
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
    console.error('Error fetching contacts:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching contacts', 
      error: error.message 
    });
  }
});

// Get all leads
app.get('/api/leads', async (req, res) => {
  try {
    if (!dbPool) {
      return res.status(500).json({ success: false, message: 'Database pool not initialized' });
    }

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
        GROSS_ACRES as grossAcres,
        NET_MINERAL_ACRES as netMineralAcres,
        ROYALTY as royalty,
        created_at,
        updated_at
      FROM prod_acreage_schedule
      WHERE OWNER IS NOT NULL AND OWNER != ''
      ORDER BY OWNER
    `;

    const rows = await executeQuery(query);
    
    // Transform leads data
    const leads = rows.map((row, index) => ({
      id: `lead-${index}`,
      name: row.name,
      contact: row.contact,
      street: row.street,
      city: row.city,
      state: row.state,
      zip: row.zip,
      phoneEmail: row.phoneEmail,
      unitName: row.unitName,
      grossAcres: row.grossAcres,
      netMineralAcres: row.netMineralAcres,
      royalty: row.royalty,
      status: 'Active',
      priority: 'Medium',
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
    
    res.json(leads);
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

    const query = `
      SELECT DISTINCT
        OWNER as contactName,
        CURRENT_UNIT_NAME as unitName,
        GROSS_ACRES as grossAcres,
        NET_MINERAL_ACRES as netMineralAcres,
        ROYALTY as royalty,
        NRA as nra,
        OWNERSHIP_PERCENTAGE as ownershipPercentage,
        created_at,
        updated_at
      FROM prod_acreage_schedule
      WHERE OWNER IS NOT NULL AND OWNER != ''
      ORDER BY OWNER
    `;

    const rows = await executeQuery(query);
    
    // Transform assignments data
    const assignments = rows.map((row, index) => ({
      id: `assignment-${index}`,
      contactName: row.contactName,
      unitName: row.unitName,
      grossAcres: row.grossAcres,
      netMineralAcres: row.netMineralAcres,
      royalty: row.royalty,
      nra: row.nra,
      ownershipPercentage: row.ownershipPercentage,
      buyer: 'Unassigned',
      status: 'Pending',
      priority: 'Medium',
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
    
    res.json(assignments);
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

app.listen(PORT, () => {
  console.log(`🚀 Import API server running on port ${PORT}`);
  console.log(`📊 Database: MySQL (${process.env.MYSQL_DATABASE || 'soonermineraldb'})`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});

export default app;

