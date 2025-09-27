#!/usr/bin/env node
// =============================================================================
// SOONER MINERAL - DATABASE INTEGRATION TEST
// =============================================================================
// This script tests the complete database integration for the Sooner Mineral application
// Run with: node test-integration.js
// =============================================================================

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testDatabaseIntegration() {
  let connection;
  
  try {
    console.log('🧪 Testing Database Integration with Docker Compose...\n');

    // Connect to database using Docker Compose service
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3359, // Docker Compose exposed port
      user: process.env.MYSQL_USER || 'soonermineral',
      password: process.env.MYSQL_PASSWORD || 'soonermineralpass',
      database: process.env.MYSQL_DATABASE || 'soonermineraldb'
    });

    console.log('✅ Database connected successfully\n');

    // Test 1: Check tracts table
    console.log('1. Testing tracts table...');
    const [tracts] = await connection.execute('SELECT * FROM tracts LIMIT 5');
    console.log(`✅ Found ${tracts.length} tracts:`);
    tracts.forEach(tract => {
      console.log(`   - ${tract.tract_name} (${tract.state}-${tract.county}) - ${tract.title_status}`);
    });

    // Test 2: Check contacts table
    console.log('\n2. Testing contacts table...');
    const [contacts] = await connection.execute('SELECT * FROM contacts LIMIT 5');
    console.log(`✅ Found ${contacts.length} contacts:`);
    contacts.forEach(contact => {
      console.log(`   - ${contact.name} (${contact.entity_type || 'N/A'}) - ${contact.email}`);
    });

    // Test 3: Check users table
    console.log('\n3. Testing users table...');
    const [users] = await connection.execute('SELECT * FROM users LIMIT 5');
    console.log(`✅ Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`   - ${user.name} (${user.email}) - Role: ${user.role_id}`);
    });

    // Test 4: Test dashboard query
    console.log('\n4. Testing dashboard query...');
    const [dashboard] = await connection.execute(`
      SELECT 
        COUNT(*) as totalTracts,
        SUM(CASE WHEN title_status = 'Verified' THEN 1 ELSE 0 END) as verifiedTracts,
        SUM(CASE WHEN title_status = 'In Progress' THEN 1 ELSE 0 END) as inProgressTracts,
        SUM(CASE WHEN title_status = 'Pending' THEN 1 ELSE 0 END) as pendingTracts,
        SUM(gross_acres) as totalGrossAcres,
        AVG(nra_cap_usd) as avgNraPrice
      FROM tracts
    `);
    
    console.log('✅ Dashboard statistics:');
    console.log(`   - Total Tracts: ${dashboard[0].totalTracts}`);
    console.log(`   - Verified: ${dashboard[0].verifiedTracts}`);
    console.log(`   - In Progress: ${dashboard[0].inProgressTracts}`);
    console.log(`   - Pending: ${dashboard[0].pendingTracts}`);
    console.log(`   - Total Gross Acres: ${dashboard[0].totalGrossAcres}`);
    console.log(`   - Avg NRA Price: $${dashboard[0].avgNraPrice}`);

    // Test 5: Check spatial tables (if they exist)
    console.log('\n5. Testing spatial tables...');
    try {
      const [spatialTables] = await connection.execute(`
        SELECT TABLE_NAME 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_SCHEMA = 'soonermineraldb' 
        AND TABLE_NAME LIKE '%spatial%'
      `);
      
      if (spatialTables.length > 0) {
        console.log(`✅ Found ${spatialTables.length} spatial tables:`);
        spatialTables.forEach(table => {
          console.log(`   - ${table.TABLE_NAME}`);
        });
      } else {
        console.log('ℹ️  No spatial tables found (this is normal if mapping.sql was not executed)');
      }
    } catch (error) {
      console.log('ℹ️  Spatial tables test skipped:', error.message);
    }

    await connection.end();
    console.log('\n🎉 All tests passed! Database integration is working correctly with Docker Compose.');
    console.log('\n📋 Next steps:');
    console.log('   1. Start the web application: make up');
    console.log('   2. Access the app: http://localhost:3050');
    console.log('   3. Check service status: make status');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('\n🔧 Troubleshooting:');
    console.error('   1. Make sure Docker Compose services are running: make up');
    console.error('   2. Check database logs: make logs-db');
    console.error('   3. Verify environment variables in .env file');
    console.error('   4. Wait for database initialization (30-60 seconds)');
    process.exit(1);
  }
}

// Run the test
testDatabaseIntegration();
