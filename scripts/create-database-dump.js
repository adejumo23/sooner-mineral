#!/usr/bin/env node

/**
 * Database Dump Script for Sooner Mineral Application
 * 
 * This script creates a comprehensive SQL dump including:
 * - Complete database schema
 * - All table structures
 * - All data from production tables
 * - All data from staging tables
 * - Import metadata and validation rules
 * 
 * Usage: node scripts/create-database-dump.js [output-file]
 */

import mysql from 'mysql2/promise';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database configuration
const dbConfig = {
  host: 'localhost',
  port: 3359,
  user: process.env.MYSQL_USER || 'soonermineral',
  password: process.env.MYSQL_PASSWORD || 'soonermineralpass',
  database: process.env.MYSQL_DATABASE || 'soonermineraldb',
  multipleStatements: true
};

// Get output file from command line or use default
const outputFile = process.argv[2] || path.join(__dirname, '..', 'database', 'complete-database-dump.sql');

async function createDatabaseDump() {
  let connection;
  
  try {
    console.log('🔌 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database successfully');

    console.log('📊 Gathering database information...');
    
    // Get database name
    const [dbResult] = await connection.execute('SELECT DATABASE() as db_name');
    const dbName = dbResult[0].db_name;
    
    console.log(`📋 Database: ${dbName}`);
    
    // Get all tables
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME as table_name, TABLE_TYPE as table_type
      FROM information_schema.tables 
      WHERE table_schema = ?
      ORDER BY table_type, table_name
    `, [dbName]);
    
    console.log(`📋 Found ${tables.length} tables`);
    
    // Start building the SQL dump
    let sqlDump = `-- ============================================================================
-- SOONER MINERAL APPLICATION - COMPLETE DATABASE DUMP
-- ============================================================================
-- Generated on: ${new Date().toISOString()}
-- Database: ${dbName}
-- Total Tables: ${tables.length}
-- ============================================================================

-- ============================================================================
-- DATABASE CREATION AND SELECTION
-- ============================================================================

DROP DATABASE IF EXISTS \`${dbName}\`;
CREATE DATABASE \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE \`${dbName}\`;

-- ============================================================================
-- TABLE SCHEMAS AND DATA
-- ============================================================================

`;

    // Process each table
    for (const table of tables) {
      const tableName = table.table_name;
      const tableType = table.table_type;
      
      console.log(`📝 Processing table: ${tableName} (${tableType})`);
      
      // Get table structure
      const [createTable] = await connection.execute(`SHOW CREATE TABLE \`${tableName}\``);
      const createStatement = createTable[0]['Create Table'];
      
      sqlDump += `-- ============================================================================
-- TABLE: ${tableName.toUpperCase()}
-- ============================================================================

${createStatement};

`;

      // Get table data
      try {
        const [rows] = await connection.execute(`SELECT * FROM \`${tableName}\``);
        
        if (rows.length > 0) {
          console.log(`📊 Found ${rows.length} records in ${tableName}`);
          
          // Get column names
          const [columns] = await connection.execute(`DESCRIBE \`${tableName}\``);
          const columnNames = columns.map(col => `\`${col.Field}\``).join(', ');
          
          sqlDump += `-- Data for table \`${tableName}\` (${rows.length} records)
INSERT INTO \`${tableName}\` (${columnNames}) VALUES
`;
          
          // Insert data
          const values = rows.map(row => {
            const rowValues = columns.map(col => {
              const value = row[col.Field];
              if (value === null) return 'NULL';
              if (value === undefined) return 'NULL';
              if (typeof value === 'string') {
                // Escape single quotes and backslashes
                return `'${value.replace(/'/g, "''").replace(/\\/g, '\\\\')}'`;
              }
              if (value instanceof Date) {
                return `'${value.toISOString().slice(0, 19).replace('T', ' ')}'`;
              }
              if (typeof value === 'object') {
                return `'${JSON.stringify(value).replace(/'/g, "''").replace(/\\/g, '\\\\')}'`;
              }
              return value;
            });
            return `(${rowValues.join(', ')})`;
          });
          
          // Split into chunks of 1000 records to avoid SQL statement limits
          const chunkSize = 1000;
          for (let i = 0; i < values.length; i += chunkSize) {
            const chunk = values.slice(i, i + chunkSize);
            sqlDump += chunk.join(',\n') + ';\n';
          }
          
          sqlDump += '\n';
        } else {
          console.log(`📊 Table ${tableName} is empty`);
          sqlDump += `-- Table \`${tableName}\` is empty\n\n`;
        }
      } catch (error) {
        console.log(`⚠️  Could not dump data for ${tableName}: ${error.message}`);
        sqlDump += `-- Could not dump data for \`${tableName}\`: ${error.message}\n\n`;
      }
    }
    
    // Add footer
    sqlDump += `-- ============================================================================
-- DUMP COMPLETED
-- ============================================================================
-- Total tables processed: ${tables.length}
-- Dump completed at: ${new Date().toISOString()}
-- ============================================================================`;

    // Ensure database directory exists
    const dbDir = path.dirname(outputFile);
    await fs.mkdir(dbDir, { recursive: true });
    
    // Write the dump file
    console.log(`💾 Writing dump to: ${outputFile}`);
    await fs.writeFile(outputFile, sqlDump, 'utf8');
    
    // Get file size
    const stats = await fs.stat(outputFile);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    console.log(`✅ Database dump completed successfully!`);
    console.log(`📁 Output file: ${outputFile}`);
    console.log(`📊 File size: ${fileSizeMB} MB`);
    console.log(`📋 Tables processed: ${tables.length}`);
    
    // Create a summary file
    const summaryFile = outputFile.replace('.sql', '-summary.txt');
    const summary = `SOONER MINERAL DATABASE DUMP SUMMARY
=====================================
Generated: ${new Date().toISOString()}
Database: ${dbName}
Output File: ${outputFile}
File Size: ${fileSizeMB} MB
Total Tables: ${tables.length}

TABLES INCLUDED:
${tables.map(t => `- ${t.table_name} (${t.table_type})`).join('\n')}

USAGE:
1. To restore this dump:
   mysql -u username -p database_name < ${path.basename(outputFile)}

2. To restore to a new database:
   mysql -u username -p -e "CREATE DATABASE new_db_name;"
   mysql -u username -p new_db_name < ${path.basename(outputFile)}
`;
    
    await fs.writeFile(summaryFile, summary, 'utf8');
    console.log(`📄 Summary file: ${summaryFile}`);
    
  } catch (error) {
    console.error('❌ Error creating database dump:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the script
createDatabaseDump().catch(console.error);
