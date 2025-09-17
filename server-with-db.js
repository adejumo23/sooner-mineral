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

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Database connection
let dbConnection;

const connectToDatabase = async () => {
  try {
    dbConnection = await mysql.createConnection({
      host: 'localhost',
      port: 3359,
      user: process.env.MYSQL_USER || 'soonermineral',
      password: process.env.MYSQL_PASSWORD || 'soonermineralpass',
      database: process.env.MYSQL_DATABASE || 'soonermineraldb'
    });
    console.log('✅ Connected to MySQL database');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('Make sure your MySQL database is running on port 3359');
  }
};

// Initialize database connection
connectToDatabase();

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
      cb(new Error('Only CSV and Excel files (.csv, .xls, .xlsx) are allowed'));
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit for Excel files
  }
});

// Helper function to execute queries
const executeQuery = async (query, params = []) => {
  if (!dbConnection) {
    throw new Error('Database not connected');
  }
  const [rows] = await dbConnection.execute(query, params);
  return rows;
};

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Import API server is running',
    database: dbConnection ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString()
  });
});

// Debug endpoint to check database tables
app.get('/api/debug/tables', async (req, res) => {
  try {
    if (!dbConnection) {
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

    if (!dbConnection) {
      return res.status(500).json({
        success: false,
        message: 'Database not connected. Please check your MySQL server.'
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
    if (!dbConnection) {
      return res.status(500).json({
        success: false,
        message: 'Database not connected'
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
    if (!dbConnection) {
      console.log('Database not connected');
      return res.status(500).json({
        success: false,
        message: 'Database not connected'
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

    if (!dbConnection) {
      return res.status(500).json({
        success: false,
        message: 'Database not connected'
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

    if (!dbConnection) {
      return res.status(500).json({
        success: false,
        message: 'Database not connected'
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

// Update staging table record
app.put('/api/import/staging-data/:tableName/:recordId', async (req, res) => {
  try {
    const { tableName, recordId } = req.params;
    const updateData = req.body;

    if (!dbConnection) {
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

    if (!dbConnection) {
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

    if (!dbConnection) {
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

    if (!dbConnection) {
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
app.listen(PORT, () => {
  console.log(`🚀 Import API server running on port ${PORT}`);
  console.log(`📊 Database: MySQL (${process.env.MYSQL_DATABASE || 'soonermineraldb'})`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});

export default app;

