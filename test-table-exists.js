import { executeQuery } from './services/databaseConnection.js';

async function testTable() {
  try {
    console.log('Testing if prod_acreage_schedule table exists...');
    
    // First, initialize the database connection
    const { initializeDatabase } = await import('./services/databaseConnection.js');
    await initializeDatabase();
    
    // Check if table exists
    const tableCheck = await executeQuery(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'soonermineraldb' 
      AND table_name = 'prod_acreage_schedule'
    `);
    
    console.log('Table exists check:', tableCheck);
    
    if (tableCheck[0].count > 0) {
      // Check row count
      const rowCount = await executeQuery(`SELECT COUNT(*) as count FROM prod_acreage_schedule`);
      console.log('Row count:', rowCount[0].count);
      
      // Get sample data
      const sampleData = await executeQuery(`SELECT * FROM prod_acreage_schedule LIMIT 3`);
      console.log('Sample data:', sampleData);
    } else {
      console.log('Table prod_acreage_schedule does not exist');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testTable();







