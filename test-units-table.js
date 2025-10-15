import { initializeDatabase, executeQuery } from './services/databaseConnection.js';

async function testUnitsTable() {
  console.log('Testing units table...');
  try {
    await initializeDatabase();

    // Check if table exists
    const tableExists = await executeQuery("SHOW TABLES LIKE 'prod_unit_summary'");
    if (tableExists.length === 0) {
      console.log('Table prod_unit_summary does NOT exist.');
      return;
    }
    console.log('Table prod_unit_summary EXISTS.');

    // Check if table has data
    const rowCountResult = await executeQuery("SELECT COUNT(*) as count FROM prod_unit_summary");
    const rowCount = rowCountResult[0].count;
    console.log(`Table prod_unit_summary has ${rowCount} rows.`);

    if (rowCount > 0) {
      const sampleData = await executeQuery("SELECT Well_Name, Operator, Status, S, T, R FROM prod_unit_summary LIMIT 3");
      console.log('Sample data from prod_unit_summary:');
      sampleData.forEach((row, index) => {
        console.log(`Row ${index + 1}:`, {
          wellName: row.Well_Name,
          operator: row.Operator,
          status: row.Status,
          section: row.S,
          township: row.T,
          range: row.R
        });
      });
    }

  } catch (error) {
    console.error('Error during units table test:', error);
  }
}

testUnitsTable();


