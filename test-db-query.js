import { executeQuery } from './services/databaseConnection.js';

async function testQuery() {
  try {
    console.log('Testing database query...');
    
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
      LIMIT 5
    `);
    
    console.log('Query results:', results.length, 'rows');
    console.log('First row:', results[0]);
    
  } catch (error) {
    console.error('Database error:', error);
  }
}

testQuery();





