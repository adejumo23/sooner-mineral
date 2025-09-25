// ============================================================================
// FIX TRACT DATA SCRIPT
// ============================================================================
// This script executes the fix_tract_data.sql file to add normalized tables
// and comprehensive tract data to the database
// ============================================================================

import { initializeDatabase, executeQuery, closeDatabase } from './services/databaseConnection.ts';
import fs from 'fs';
import path from 'path';

async function fixTractData() {
  try {
    console.log('🔄 Initializing database connection...');
    await initializeDatabase();
    
    console.log('📖 Reading SQL file...');
    const sqlFile = path.join(process.cwd(), 'database', 'fix_tract_data.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');
    
    // Split the SQL content into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
          await executeQuery(statement);
        } catch (error) {
          // Some statements might fail due to existing data, which is expected
          if (error.message.includes('Duplicate entry') || 
              error.message.includes('already exists') ||
              error.message.includes('Duplicate key')) {
            console.log(`⚠️  Statement ${i + 1} skipped (already exists): ${error.message.split('\n')[0]}`);
          } else {
            console.error(`❌ Error in statement ${i + 1}:`, error.message);
            throw error;
          }
        }
      }
    }
    
    console.log('✅ Tract data fix completed successfully!');
    
    // Verify the data was inserted
    console.log('🔍 Verifying data...');
    const verificationQueries = [
      'SELECT COUNT(*) as count FROM states',
      'SELECT COUNT(*) as count FROM counties', 
      'SELECT COUNT(*) as count FROM properties',
      'SELECT COUNT(*) as count FROM owners',
      'SELECT COUNT(*) as count FROM mineral_interests',
      'SELECT COUNT(*) as count FROM acquisition_tracking'
    ];
    
    for (const query of verificationQueries) {
      const result = await executeQuery(query);
      const tableName = query.split('FROM ')[1];
      console.log(`📊 ${tableName}: ${result[0].count} records`);
    }
    
  } catch (error) {
    console.error('❌ Error fixing tract data:', error);
    process.exit(1);
  } finally {
    await closeDatabase();
  }
}

// Run the script
fixTractData();
