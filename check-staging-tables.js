import { initializeDatabase, executeQuery } from './services/databaseConnection.js';

async function checkStagingTables() {
  console.log('Checking staging tables...');
  try {
    await initializeDatabase();

    // Check if staging_unit_tracking exists
    const stagingExists = await executeQuery("SHOW TABLES LIKE 'staging_unit_tracking'");
    if (stagingExists.length === 0) {
      console.log('Table staging_unit_tracking does NOT exist.');
      return;
    }
    console.log('Table staging_unit_tracking EXISTS.');

    // Check if prod_unit_tracker exists
    const prodExists = await executeQuery("SHOW TABLES LIKE 'prod_unit_tracker'");
    if (prodExists.length === 0) {
      console.log('Table prod_unit_tracker does NOT exist.');
      return;
    }
    console.log('Table prod_unit_tracker EXISTS.');

    // Get staging table structure
    console.log('\n=== STAGING TABLE STRUCTURE ===');
    const stagingStructure = await executeQuery("DESCRIBE staging_unit_tracking");
    console.log('Staging table columns:');
    stagingStructure.forEach(col => {
      console.log(`  ${col.Field} (${col.Type})`);
    });

    // Get production table structure
    console.log('\n=== PRODUCTION TABLE STRUCTURE ===');
    const prodStructure = await executeQuery("DESCRIBE prod_unit_tracker");
    console.log('Production table columns:');
    prodStructure.forEach(col => {
      console.log(`  ${col.Field} (${col.Type})`);
    });

    // Check row counts
    const stagingCount = await executeQuery("SELECT COUNT(*) as count FROM staging_unit_tracking");
    const prodCount = await executeQuery("SELECT COUNT(*) as count FROM prod_unit_tracker");
    
    console.log(`\nStaging table has ${stagingCount[0].count} rows`);
    console.log(`Production table has ${prodCount[0].count} rows`);

    // Show sample data from staging
    if (stagingCount[0].count > 0) {
      console.log('\n=== SAMPLE STAGING DATA ===');
      const sampleData = await executeQuery("SELECT * FROM staging_unit_tracking LIMIT 3");
      console.log('Sample staging data:');
      sampleData.forEach((row, index) => {
        console.log(`Row ${index + 1}:`, row);
      });
    }

  } catch (error) {
    console.error('Error checking staging tables:', error);
  }
}

checkStagingTables();





