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

async function checkWellTypes() {
  const dbPool = createPool(dbConfig);
  
  try {
    const [rows] = await dbPool.execute('SELECT welltype, COUNT(*) as count FROM producing_wells WHERE welltype IS NOT NULL GROUP BY welltype ORDER BY count DESC');
    console.log('Well types in database:');
    (rows as any[]).forEach((row: any) => {
      console.log(`  ${row.welltype}: ${row.count} wells`);
    });
  } catch (error: any) {
    console.error('Error:', error.message);
  } finally {
    await dbPool.end();
  }
}

checkWellTypes().catch(console.error);
