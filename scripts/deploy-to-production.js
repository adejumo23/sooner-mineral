#!/usr/bin/env node

/**
 * Production Deployment Script for Sooner Mineral Application
 * 
 * This script handles deploying the complete database dump to production
 * including schema creation, data import, and verification.
 * 
 * Usage: node scripts/deploy-to-production.js [dump-file] [production-config]
 */

import mysql from 'mysql2/promise';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Default production configuration
const defaultProductionConfig = {
  host: 'localhost',
  port: 3306,
  user: 'production_user',
  password: 'production_password',
  database: 'soonermineral_production',
  multipleStatements: true
};

// Get parameters from command line
const dumpFile = process.argv[2] || path.join(__dirname, '..', 'database', 'complete-database-dump.sql');
const configFile = process.argv[3] || path.join(__dirname, '..', 'database', 'production-config.json');

async function deployToProduction() {
  let connection;
  
  try {
    console.log('🚀 Starting production deployment...');
    
    // Check if dump file exists
    try {
      await fs.access(dumpFile);
      console.log(`📁 Dump file found: ${dumpFile}`);
    } catch (error) {
      throw new Error(`Dump file not found: ${dumpFile}`);
    }
    
    // Load production configuration
    let productionConfig = defaultProductionConfig;
    try {
      const configData = await fs.readFile(configFile, 'utf8');
      productionConfig = { ...productionConfig, ...JSON.parse(configData) };
      console.log(`⚙️  Using production config from: ${configFile}`);
    } catch (error) {
      console.log(`⚠️  Using default production config (create ${configFile} to customize)`);
    }
    
    // Test connection to production database
    console.log('🔌 Testing production database connection...');
    connection = await mysql.createConnection(productionConfig);
    console.log('✅ Connected to production database successfully');
    
    // Read the dump file
    console.log('📖 Reading dump file...');
    const dumpContent = await fs.readFile(dumpFile, 'utf8');
    console.log(`📊 Dump file size: ${(dumpContent.length / (1024 * 1024)).toFixed(2)} MB`);
    
    // Create backup of existing database if it exists
    const dbName = productionConfig.database;
    try {
      const [databases] = await connection.execute('SHOW DATABASES');
      const dbExists = databases.some(db => db.Database === dbName);
      
      if (dbExists) {
        console.log(`💾 Creating backup of existing database: ${dbName}`);
        const backupName = `${dbName}_backup_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}`;
        
        // Create backup
        await connection.execute(`CREATE DATABASE \`${backupName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        
        // Copy data to backup (this is a simplified backup - in production you might want mysqldump)
        const [tables] = await connection.execute(`SHOW TABLES FROM \`${dbName}\``);
        for (const table of tables) {
          const tableName = Object.values(table)[0];
          await connection.execute(`CREATE TABLE \`${backupName}\`.\`${tableName}\` LIKE \`${dbName}\`.\`${tableName}\``);
          await connection.execute(`INSERT INTO \`${backupName}\`.\`${tableName}\` SELECT * FROM \`${dbName}\`.\`${tableName}\``);
        }
        
        console.log(`✅ Backup created: ${backupName}`);
      }
    } catch (error) {
      console.log(`⚠️  Could not create backup: ${error.message}`);
    }
    
    // Execute the dump
    console.log('🔄 Deploying database schema and data...');
    console.log('⏳ This may take several minutes for large datasets...');
    
    const startTime = Date.now();
    
    // Split the dump into individual statements and execute them
    const statements = dumpContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📋 Executing ${statements.length} SQL statements...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      try {
        await connection.execute(statement);
        successCount++;
        
        // Progress indicator
        if (i % 100 === 0) {
          const progress = ((i / statements.length) * 100).toFixed(1);
          console.log(`📊 Progress: ${progress}% (${i}/${statements.length})`);
        }
      } catch (error) {
        errorCount++;
        console.error(`❌ Error in statement ${i + 1}: ${error.message}`);
        console.error(`Statement: ${statement.substring(0, 100)}...`);
      }
    }
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log(`✅ Deployment completed in ${duration} seconds`);
    console.log(`📊 Successfully executed: ${successCount} statements`);
    if (errorCount > 0) {
      console.log(`⚠️  Failed statements: ${errorCount}`);
    }
    
    // Verify deployment
    console.log('🔍 Verifying deployment...');
    
    const [tables] = await connection.execute(`SHOW TABLES FROM \`${dbName}\``);
    console.log(`📋 Tables in production database: ${tables.length}`);
    
    // Count records in key tables
    const keyTables = ['prod_acreage_schedule', 'staging_acreage_schedule', 'import_sessions', 'producing_wells'];
    for (const tableName of keyTables) {
      try {
        const [count] = await connection.execute(`SELECT COUNT(*) as count FROM \`${tableName}\``);
        console.log(`📊 ${tableName}: ${count[0].count} records`);
      } catch (error) {
        console.log(`⚠️  ${tableName}: Table not found or error counting records`);
      }
    }
    
    // Create deployment log
    const deploymentLog = {
      timestamp: new Date().toISOString(),
      dumpFile: dumpFile,
      productionConfig: {
        host: productionConfig.host,
        port: productionConfig.port,
        database: productionConfig.database,
        user: productionConfig.user
      },
      deployment: {
        duration: duration,
        statementsExecuted: successCount,
        statementsFailed: errorCount,
        tablesCreated: tables.length
      },
      status: errorCount === 0 ? 'SUCCESS' : 'PARTIAL_SUCCESS'
    };
    
    const logFile = path.join(__dirname, '..', 'database', `deployment-log-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`);
    await fs.writeFile(logFile, JSON.stringify(deploymentLog, null, 2), 'utf8');
    console.log(`📄 Deployment log: ${logFile}`);
    
    if (errorCount === 0) {
      console.log('🎉 Production deployment completed successfully!');
    } else {
      console.log('⚠️  Production deployment completed with errors. Please review the log.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Error during production deployment:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Production database connection closed');
    }
  }
}

// Run the script
deployToProduction().catch(console.error);
