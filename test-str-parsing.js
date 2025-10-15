import { executeQuery } from './services/databaseConnection.js';

async function testSTRParsing() {
  try {
    console.log('Testing S_T_R parsing...');
    
    // First, initialize the database connection
    const { initializeDatabase } = await import('./services/databaseConnection.js');
    await initializeDatabase();
    
    // Get some sample S_T_R data
    const results = await executeQuery(`
      SELECT S_T_R as str
      FROM prod_acreage_schedule 
      WHERE S_T_R IS NOT NULL 
      LIMIT 5
    `);
    
    console.log('Sample S_T_R values:');
    results.forEach((row, index) => {
      console.log(`${index + 1}. Raw S_T_R: "${row.str}"`);
      
      // Test the parsing logic
      let section = null, township = null, range = null;
      if (row.str) {
        const parts = row.str.split('-');
        console.log(`   Parts after split: [${parts.map(p => `"${p}"`).join(', ')}]`);
        console.log(`   Parts length: ${parts.length}`);
        
        if (parts.length >= 3) {
          section = parts[0];
          township = parts[1];
          range = parts[2];
          console.log(`   Parsed - Section: "${section}", Township: "${township}", Range: "${range}"`);
        } else {
          console.log(`   ❌ Not enough parts for parsing`);
        }
      }
      console.log('');
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testSTRParsing();


