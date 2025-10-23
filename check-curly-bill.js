const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkUnits() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'soonermineraldb'
  });

  try {
    const [rows] = await connection.execute(`
      SELECT DISTINCT CURRENT_UNIT_NAME, COUNT(*) as count
      FROM prod_acreage_schedule 
      WHERE CURRENT_UNIT_NAME LIKE '%CURLY BILL%'
      GROUP BY CURRENT_UNIT_NAME
      ORDER BY CURRENT_UNIT_NAME
    `);
    
    console.log('CURLY BILL units in database:');
    rows.forEach(row => {
      console.log(`Unit: "${row.CURRENT_UNIT_NAME}" (Count: ${row.count})`);
      console.log(`Raw bytes: ${Buffer.from(row.CURRENT_UNIT_NAME).toString('hex')}`);
    });
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkUnits();
