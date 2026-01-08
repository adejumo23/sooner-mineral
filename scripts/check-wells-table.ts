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

async function checkTable() {
  const dbPool = createPool(dbConfig);
  
  try {
    // Check count
    const [countRows] = await dbPool.execute('SELECT COUNT(*) as count FROM producing_wells');
    console.log('Total records in producing_wells:', (countRows as any[])[0].count);
    
    // Check structure
    const [columns] = await dbPool.execute('DESCRIBE producing_wells');
    console.log('\nTable structure:');
    (columns as any[]).forEach((col: any) => {
      console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Key ? `[${col.Key}]` : ''}`);
    });
    
    // Sample records
    const [samples] = await dbPool.execute('SELECT * FROM producing_wells WHERE section_str IS NOT NULL LIMIT 5');
    console.log('\nSample records with section_str:');
    (samples as any[]).forEach((row: any, i: number) => {
      console.log(`\nRecord ${i + 1}:`);
      console.log('  ID:', row.id);
      console.log('  API:', row.api || row.api_number || 'N/A');
      console.log('  Name:', row.well_name);
      console.log('  Section:', row.section, 'Township:', row.township, 'Range:', row.range);
      console.log('  section_str:', row.section_str);
      console.log('  Lat/Lon:', row.latitude, row.longitude);
    });
    
    // Check section_str format distribution
    const [sectionStrs] = await dbPool.execute('SELECT section_str, COUNT(*) as count FROM producing_wells WHERE section_str IS NOT NULL GROUP BY section_str ORDER BY count DESC LIMIT 10');
    console.log('\nTop 10 section_str formats:');
    (sectionStrs as any[]).forEach((row: any) => {
      console.log(`  "${row.section_str}": ${row.count} wells`);
    });
    
  } catch (error: any) {
    console.error('Error:', error.message);
  } finally {
    await dbPool.end();
  }
}

checkTable().catch(console.error);
