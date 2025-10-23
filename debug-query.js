import { executeQuery } from './services/databaseConnection.js';

async function debugQuery() {
  try {
    console.log('Testing database query...');
    
    // First, initialize the database connection
    const { initializeDatabase } = await import('./services/databaseConnection.js');
    await initializeDatabase();
    
    // Test the exact query from server.js
    const results = await executeQuery(`
      SELECT DISTINCT
        S_T_R as str,
        COUNTY as county,
        ST as state,
        STATUS as title_status,
        LEGAL_DESCRIPTION as legal_description,
        NMA as net_mineral_acres,
        CALCULATED_ACREAGE as gross_acres,
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
      WHERE S_T_R IS NOT NULL 
      ORDER BY S_T_R
      LIMIT 3
    `);
    
    console.log('Query results count:', results.length);
    console.log('First result:', results[0]);
    
    if (results.length > 0) {
      const row = results[0];
      console.log('Raw data from database:');
      console.log('S_T_R (str):', row.str);
      console.log('COUNTY:', row.county);
      console.log('ST (state):', row.state);
      console.log('NMA (net_mineral_acres):', row.net_mineral_acres);
      console.log('CALCULATED_ACREAGE (gross_acres):', row.gross_acres);
      
      // Test the transformation logic
      let section = null, township = null, range = null;
      if (row.str) {
        const parts = row.str.split('-');
        if (parts.length >= 3) {
          section = parts[0];
          township = parts[1];
          range = parts[2];
        }
      }
      
      console.log('Parsed S-T-R:');
      console.log('Section:', section);
      console.log('Township:', township);
      console.log('Range:', range);
      
      const netAcres = parseFloat(row.net_mineral_acres) || 0;
      console.log('Net acres:', netAcres);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

debugQuery();






