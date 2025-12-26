import { createPool } from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.MYSQL_USER || 'soonermineral',
  password: process.env.MYSQL_PASSWORD || 'soonermineralpass',
  database: process.env.MYSQL_DATABASE || 'soonermineraldb',
};

async function verifyWells() {
  const pool = createPool(dbConfig);
  
  try {
    const [rows] = await pool.execute('SELECT COUNT(*) as count FROM producing_wells');
    const count = (rows as any[])[0].count;
    console.log(`\n✅ Total wells in producing_wells table: ${count}\n`);
    
    const [sample] = await pool.execute('SELECT id, api_number, well_name, operator, status, latitude, longitude FROM producing_wells LIMIT 10');
    console.log('Sample records:');
    (sample as any[]).forEach((r, i) => {
      console.log(`${i + 1}. ${r.well_name || 'Unknown'} (${r.operator || 'Unknown'}) - ${r.status || 'Unknown'} - [${r.latitude}, ${r.longitude}]`);
    });
    
    // Check operators table
    try {
      const [opCount] = await pool.execute('SELECT COUNT(*) as count FROM operators');
      console.log(`\nOperators table: ${(opCount as any[])[0].count} records`);
    } catch (e) {
      console.log('\nOperators table: does not exist');
    }
    
    // Check well_statuses table
    try {
      const [statusCount] = await pool.execute('SELECT COUNT(*) as count FROM well_statuses');
      console.log(`Well_statuses table: ${(statusCount as any[])[0].count} records`);
    } catch (e) {
      console.log('Well_statuses table: does not exist');
    }
    
  } catch (error: any) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

verifyWells();
