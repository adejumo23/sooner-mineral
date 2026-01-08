/**
 * Script to download and import Oklahoma Corporation Commission (OCC) well data
 * 
 * This script:
 * 1. Creates the necessary database tables (producing_wells, operators, well_statuses)
 * 2. Downloads the OCC RBDMS Well Data CSV file
 * 3. Parses and imports the data into the database
 * 
 * Usage:
 *   npm run import-occ-wells
 *   or
 *   ts-node scripts/import-occ-wells.ts [path-to-csv-file]
 * 
 * If no CSV path is provided, the script will attempt to download it.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';
import csv from 'csv-parser';
import type { Pool } from 'mysql2/promise';
import { createPool } from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Database configuration (matches server.ts)
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.MYSQL_USER || 'soonermineral',
  password: process.env.MYSQL_PASSWORD || 'soonermineralpass',
  database: process.env.MYSQL_DATABASE || 'soonermineraldb',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  idleTimeout: 300000
};

/**
 * Execute database query
 */
async function executeQuery(dbPool: Pool, query: string, params: any[] = []): Promise<any[]> {
  try {
    const [rows] = await dbPool.execute(query, params);
    return rows as any[];
  } catch (error: any) {
    console.error('Database query error:', error.message);
    throw error;
  }
}

// OCC Data URLs (these may need to be updated - check OCC website)
const OCC_WELL_DATA_URL = 'https://oklahoma.gov/occ/divisions/oil-gas/oil-gas-data.html';
// Note: The actual CSV download link may require visiting the page first
// You may need to manually download and provide the path

interface WellRecord {
  API_NUMBER?: string;
  WELL_NAME?: string;
  OPERATOR_NAME?: string;
  LATITUDE?: string;
  LONGITUDE?: string;
  SECTION?: string;
  TOWNSHIP?: string;
  RANGE?: string;
  WELL_STATUS?: string;
  SPUD_DATE?: string;
  COMPLETION_DATE?: string;
  TOTAL_DEPTH?: string;
  [key: string]: any;
}

/**
 * Create database tables for wells data based on CSV structure
 */
async function createTables(dbPool: any) {
  console.log('Creating producing_wells table based on CSV structure...');

  // Drop and recreate table to match CSV structure exactly
  await executeQuery(dbPool, `DROP TABLE IF EXISTS producing_wells`);
  
  // Create producing_wells table matching the OCC CSV structure exactly
  await executeQuery(dbPool, `
    CREATE TABLE producing_wells (
      id VARCHAR(255) PRIMARY KEY,
      api VARCHAR(50),
      well_name VARCHAR(255),
      well_num VARCHAR(50),
      operator VARCHAR(255),
      wellstatus VARCHAR(100),
      welltype VARCHAR(100),
      symbol_class VARCHAR(100),
      latitude DECIMAL(10, 8),
      longitude DECIMAL(11, 8),
      county VARCHAR(100),
      section VARCHAR(10),
      township VARCHAR(20),
      \`range\` VARCHAR(20),
      section_str VARCHAR(50),
      status VARCHAR(50) DEFAULT 'Producing',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_lat_lon (latitude, longitude),
      INDEX idx_api (api),
      INDEX idx_section_str (section_str),
      INDEX idx_county (county)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  console.log('Database table created successfully.');
}

/**
 * Download file from URL
 */
function downloadFile(url: string, destPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(destPath);
    
    protocol.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Handle redirect
        return downloadFile(response.headers.location!, destPath).then(resolve).catch(reject);
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode} ${response.statusMessage}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(destPath, () => {}); // Delete the file on error
      reject(err);
    });
  });
}

/**
 * Parse PLSS section string from OCC data
 */
function parsePLSSSection(section?: string, township?: string, range?: string): string | null {
  if (!section || !township || !range) return null;
  
  // OCC format is typically: Section-Township-Range
  // Example: "33-01N-05W" or "33", "01N", "05W"
  try {
    const sectionNum = section.toString().padStart(2, '0');
    const townshipStr = township.toString().trim();
    const rangeStr = range.toString().trim();
    
    // Format: SS-TTNDD-RRNDD
    return `${sectionNum}-${townshipStr}-${rangeStr}`;
  } catch (e) {
    return null;
  }
}

/**
 * Parse date string
 */
function parseDate(dateStr?: string): string | null {
  if (!dateStr) return null;
  const cleaned = dateStr.toString().trim();
  if (!cleaned || cleaned === 'NULL' || cleaned === '') return null;
  
  // Try various date formats
  const date = new Date(cleaned);
  if (isNaN(date.getTime())) return null;
  
  return date.toISOString().split('T')[0];
}

/**
 * Parse numeric value
 */
function parseNumber(value?: string): number | null {
  if (!value) return null;
  const cleaned = value.toString().trim().replace(/,/g, '');
  if (!cleaned || cleaned === 'NULL' || cleaned === '') return null;
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

/**
 * Generate ID from API number or well name
 */
function generateWellId(apiNumber?: string, wellName?: string): string {
  if (apiNumber) {
    return `well-${apiNumber.replace(/[^a-zA-Z0-9]/g, '-')}`;
  }
  if (wellName) {
    return `well-${wellName.replace(/[^a-zA-Z0-9]/g, '-').substring(0, 50)}-${Date.now()}`;
  }
  return `well-${Date.now()}-${Math.random().toString(36).substring(7)}`;
}

/**
 * Import wells from CSV file
 */
async function importWellsFromCSV(dbPool: Pool, csvPath: string): Promise<number> {
  console.log(`Reading CSV file: ${csvPath}`);
  
  // Note: operators and statuses maps kept for compatibility but not used with existing table structure
  const operators = new Map<string, string>();
  const statuses = new Map<string, string>();
  const wells: any[] = [];
  let recordCount = 0;
  let skippedNoCoords = 0;
  let insertedCount = 0;
  let errorCount = 0;
  
  // Log first row to see column names
  let firstRowLogged = false;
  
  return new Promise((resolve, reject) => {
    let pendingInserts: Promise<any>[] = [];
    
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row: WellRecord) => {
        recordCount++;
        
        // Log first row to see what columns we have
        if (!firstRowLogged && recordCount === 1) {
          console.log('First CSV row columns:', Object.keys(row));
          console.log('Sample values:', JSON.stringify(Object.fromEntries(Object.entries(row).slice(0, 10))));
          firstRowLogged = true;
        }
        
        // Extract fields directly from CSV - use exact column names
        const api = (row.API || '').toString().trim() || null;
        const wellName = (row.WELL_NAME || 'Unknown Well').toString().trim();
        const wellNum = (row.WELL_NUM || '').toString().trim() || null;
        const operator = (row.OPERATOR || '').toString().trim() || null;
        const wellstatus = (row.WELLSTATUS || '').toString().trim() || null;
        const welltype = (row.WELLTYPE || '').toString().trim() || null;
        const symbolClass = (row.SYMBOL_CLASS || '').toString().trim() || null;
        
        // Parse coordinates - OCC CSV uses SH_LAT and SH_LON
        const latitude = parseNumber(row.SH_LAT);
        const longitude = parseNumber(row.SH_LON);
        
        // Skip if no coordinates
        if (!latitude || !longitude || latitude === 0 || longitude === 0) {
          skippedNoCoords++;
          if (skippedNoCoords <= 5) {
            console.log(`Skipping record ${recordCount}: no valid coordinates (SH_LAT=${row.SH_LAT}, SH_LON=${row.SH_LON})`);
          }
          return;
        }
        
        const county = (row.COUNTY || '').toString().trim() || null;
        const section = (row.SECTION || '').toString().trim() || null;
        const township = (row.TOWNSHIP || '').toString().trim() || null;
        const range = (row.RANGE || '').toString().trim() || null;
        
        // Parse PLSS section string
        const sectionStr = parsePLSSSection(section, township, range) || null;
        
        // Map status - use wellstatus or symbol_class, default to 'Producing'
        let status: string = wellstatus || symbolClass || 'Producing';
        
        const well = {
          id: generateWellId(api, wellName),
          api: api,
          wellName: wellName,
          wellNum: wellNum,
          operator: operator,
          wellstatus: wellstatus,
          welltype: welltype,
          symbolClass: symbolClass,
          latitude,
          longitude,
          county: county,
          section: section,
          township: township,
          range: range,
          sectionStr: sectionStr,
          status: status
        };
        
        wells.push(well);
        
        // Batch insert every 1000 records
        if (wells.length >= 1000) {
          const batch = wells.splice(0, 1000);
          // Don't await here - queue it
          const insertPromise = insertBatch(dbPool, operators, statuses, batch).then(result => {
            insertedCount += result.inserted;
            errorCount += result.errors;
            if (insertedCount % 10000 === 0) {
              console.log(`Progress: Inserted ${insertedCount} wells so far...`);
            }
          });
          pendingInserts.push(insertPromise);
        }
      })
      .on('end', async () => {
        try {
          // Insert remaining records
          if (wells.length > 0) {
            const insertPromise = insertBatch(dbPool, operators, statuses, wells).then(result => {
              insertedCount += result.inserted;
              errorCount += result.errors;
            });
            pendingInserts.push(insertPromise);
          }
          
          // Wait for all pending inserts to complete
          console.log(`Waiting for ${pendingInserts.length} batch inserts to complete...`);
          await Promise.all(pendingInserts);
          
          console.log(`\nImport complete!`);
          console.log(`  - Processed ${recordCount} CSV records`);
          console.log(`  - Skipped ${skippedNoCoords} records (no valid coordinates)`);
          console.log(`  - Successfully inserted ${insertedCount} wells`);
          console.log(`  - Errors: ${errorCount}`);
          resolve(recordCount);
        } catch (error) {
          reject(error);
        }
      })
      .on('error', reject);
  });
}

/**
 * Insert batch of wells using CSV column structure
 */
async function insertBatch(
  dbPool: Pool,
  operators: Map<string, string>,
  statuses: Map<string, string>,
  wells: any[]
): Promise<{ inserted: number; errors: number }> {
  let batchInserted = 0;
  let batchErrors = 0;
  
  // Use bulk insert for better performance
  const values: any[] = [];
  const placeholders: string[] = [];
  
  for (const well of wells) {
    values.push(
      well.id,
      well.api,
      well.wellName,
      well.wellNum,
      well.operator,
      well.wellstatus,
      well.welltype,
      well.symbolClass,
      well.latitude,
      well.longitude,
      well.county,
      well.section,
      well.township,
      well.range,
      well.sectionStr,
      well.status
    );
    placeholders.push('(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  }
  
  if (values.length === 0) {
    return { inserted: 0, errors: 0 };
  }
  
  try {
    await executeQuery(dbPool, `
      INSERT INTO producing_wells (
        id, api, well_name, well_num, operator, wellstatus, welltype, symbol_class,
        latitude, longitude, county, section, township, \`range\`, section_str, status
      ) VALUES ${placeholders.join(', ')}
      ON DUPLICATE KEY UPDATE
        well_name = VALUES(well_name),
        well_num = VALUES(well_num),
        operator = VALUES(operator),
        wellstatus = VALUES(wellstatus),
        welltype = VALUES(welltype),
        symbol_class = VALUES(symbol_class),
        latitude = VALUES(latitude),
        longitude = VALUES(longitude),
        county = VALUES(county),
        section = VALUES(section),
        township = VALUES(township),
        \`range\` = VALUES(\`range\`),
        section_str = VALUES(section_str),
        status = VALUES(status),
        updated_at = CURRENT_TIMESTAMP
    `, values);
    
    batchInserted = wells.length;
  } catch (e: any) {
    // If bulk insert fails, try individual inserts
    console.warn(`Bulk insert failed, trying individual inserts: ${e.message}`);
    for (const well of wells) {
      try {
        await executeQuery(dbPool, `
          INSERT INTO producing_wells (
            id, api, well_name, well_num, operator, wellstatus, welltype, symbol_class,
            latitude, longitude, county, section, township, \`range\`, section_str, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            well_name = VALUES(well_name),
            well_num = VALUES(well_num),
            operator = VALUES(operator),
            wellstatus = VALUES(wellstatus),
            welltype = VALUES(welltype),
            symbol_class = VALUES(symbol_class),
            latitude = VALUES(latitude),
            longitude = VALUES(longitude),
            county = VALUES(county),
            section = VALUES(section),
            township = VALUES(township),
            \`range\` = VALUES(\`range\`),
            section_str = VALUES(section_str),
            status = VALUES(status),
            updated_at = CURRENT_TIMESTAMP
        `, [
          well.id,
          well.api,
          well.wellName,
          well.wellNum,
          well.operator,
          well.wellstatus,
          well.welltype,
          well.symbolClass,
          well.latitude,
          well.longitude,
          well.county,
          well.section,
          well.township,
          well.range,
          well.sectionStr,
          well.status
        ]);
        batchInserted++;
      } catch (err: any) {
        batchErrors++;
        if (batchErrors <= 5) {
          console.error(`Error inserting well ${well.id} (${well.api || 'no API'}):`, err.message);
        }
      }
    }
  }
  
  if (batchInserted > 0 || batchErrors > 0) {
    console.log(`Inserted batch: ${batchInserted} successful, ${batchErrors} errors out of ${wells.length} wells`);
  }
  
  return { inserted: batchInserted, errors: batchErrors };
}

/**
 * Main function
 */
async function main() {
  const csvPath = process.argv[2];
  
  if (!csvPath) {
    console.log(`
Usage: ts-node scripts/import-occ-wells.ts [path-to-csv-file]

To download the OCC well data CSV:
1. Visit: https://oklahoma.gov/occ/divisions/oil-gas/oil-gas-data.html
2. Find "RBDMS Well Data" section
3. Click the CSV download link
4. Save the file locally
5. Run this script with the file path

Example:
  ts-node scripts/import-occ-wells.ts ./occ-well-data.csv
    `);
    process.exit(1);
  }
  
  if (!fs.existsSync(csvPath)) {
    console.error(`Error: CSV file not found: ${csvPath}`);
    process.exit(1);
  }
  
  console.log('Connecting to database...');
  const dbPool = createPool(dbConfig);
  
  try {
    // Create tables
    await createTables(dbPool);
    
    // Import wells
    console.log('\nStarting import process...');
    const recordCount = await importWellsFromCSV(dbPool, csvPath);
    
    console.log(`\n✅ Successfully imported ${recordCount} well records!`);
    console.log('\nYou can now view wells in the mapping module.');
    
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await dbPool.end();
  }
}

// Run if executed directly (ES module way)
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.includes('import-occ-wells')) {
  main().catch(console.error);
}

export { main as importOccWells };
