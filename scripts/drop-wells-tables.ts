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

async function dropTables() {
  const dbPool = createPool(dbConfig);
  
  try {
    console.log('Dropping tables...');
    
    // Disable foreign key checks temporarily
    await dbPool.execute('SET FOREIGN_KEY_CHECKS = 0');
    
    // Drop in any order
    await dbPool.execute('DROP TABLE IF EXISTS producing_wells');
    console.log('✓ Dropped producing_wells');
    
    await dbPool.execute('DROP TABLE IF EXISTS operators');
    console.log('✓ Dropped operators');
    
    await dbPool.execute('DROP TABLE IF EXISTS well_statuses');
    console.log('✓ Dropped well_statuses');
    
    // Re-enable foreign key checks
    await dbPool.execute('SET FOREIGN_KEY_CHECKS = 1');
    
    console.log('\n✅ All tables dropped successfully!');
    
  } catch (error: any) {
    console.error('Error:', error.message);
    // Try to re-enable foreign key checks even on error
    try {
      await dbPool.execute('SET FOREIGN_KEY_CHECKS = 1');
    } catch {}
  } finally {
    await dbPool.end();
  }
}

dropTables().catch(console.error);
