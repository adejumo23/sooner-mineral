import * as fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import XLSX from 'xlsx';
import { executeQuery } from './database.js';
import type { Pool } from 'mysql2/promise';

export async function extractColumnsFromCSV(filePath: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const columns: string[] = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('headers', (headers: string[]) => {
        columns.push(...headers);
        resolve(columns);
      })
      .on('error', reject);
  });
}

export async function extractColumnsFromExcel(filePath: string): Promise<string[]> {
  const fileBuffer = fs.readFileSync(filePath);
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
  
  if (jsonData.length === 0) {
    throw new Error('Excel file is empty');
  }
  
  const headers = jsonData[0];
  return headers.filter((header: any) => header && String(header).trim() !== '');
}

export async function createStagingTable(
  dbPool: Pool | null,
  tableName: string,
  columns: string[]
): Promise<{ originalColumns: string[]; sanitizedColumns: string[] }> {
  const uniqueColumns = [...new Set(columns)];
  const sanitizedColumns = uniqueColumns.map((col, index) => {
    // Allow dollar signs and percentage signs in column names - MySQL supports them when escaped with backticks
    let sanitized = col.replace(/[^a-zA-Z0-9_$%]/g, '_').replace(/_+/g, '_');
    if (sanitized === '' || sanitized.startsWith('_')) {
      sanitized = `column_${index}`;
    }
    return sanitized;
  });
  
  const columnDefinitions = sanitizedColumns.map(col => `\`${col}\` TEXT`).join(', ');
  const query = `
    CREATE TABLE ${tableName} (
      id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
      ${columnDefinitions},
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `;
  await executeQuery(dbPool, query);
  
  // Return unique columns (not the original which may have duplicates) for proper mapping
  return { originalColumns: uniqueColumns, sanitizedColumns };
}

export async function createProductionTable(
  dbPool: Pool | null,
  tableName: string,
  columns: string[]
): Promise<{ originalColumns: string[]; sanitizedColumns: string[] }> {
  const databaseName = process.env.MYSQL_DATABASE || 'soonermineraldb';
  const tableExists = await executeQuery(dbPool, `
    SELECT COUNT(*) as count 
    FROM information_schema.tables 
    WHERE table_schema = ? AND table_name = ?
  `, [databaseName, tableName]);
  
  if (tableExists[0].count > 0) {
    console.log(`Dropping existing production table: ${tableName}`);
    try {
      await executeQuery(dbPool, `DROP TABLE IF EXISTS \`${tableName}\``);
      console.log(`Successfully dropped production table: ${tableName}`);
    } catch (dropError: any) {
      console.error(`Error dropping production table ${tableName}:`, dropError);
    }
  }

  const uniqueColumns = [...new Set(columns)];
  const sanitizedColumns = uniqueColumns.map((col, index) => {
    // Allow dollar signs and percentage signs in column names - MySQL supports them when escaped with backticks
    let sanitized = col.replace(/[^a-zA-Z0-9_$%]/g, '_').replace(/_+/g, '_');
    if (sanitized === '' || sanitized.startsWith('_')) {
      sanitized = `column_${index}`;
    }
    return sanitized;
  });
  
  const columnDefinitions = sanitizedColumns.map(col => `\`${col}\` TEXT`).join(', ');
  const query = `
    CREATE TABLE \`${tableName}\` (
      id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
      ${columnDefinitions},
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `;
  await executeQuery(dbPool, query);
  
  // Return unique columns (not the original which may have duplicates) for proper mapping
  return { originalColumns: uniqueColumns, sanitizedColumns };
}

export async function importDataToStaging(
  dbPool: Pool | null,
  filePath: string,
  tableName: string,
  originalColumns: string[],
  sanitizedColumns: string[],
  fileExtension: string
): Promise<number> {
  // Create mapping from original column names to sanitized column names
  const columnMapping = new Map<string, string>();
  originalColumns.forEach((original, index) => {
    columnMapping.set(original, sanitizedColumns[index] || original);
  });

  if (fileExtension === '.csv') {
    return await importDataFromCSV(dbPool, filePath, tableName, sanitizedColumns, columnMapping);
  } else if (fileExtension === '.xlsx' || fileExtension === '.xls') {
    return await importDataFromExcel(dbPool, filePath, tableName, sanitizedColumns, columnMapping);
  }
  throw new Error(`Unsupported file format: ${fileExtension}`);
}

async function importDataFromCSV(
  dbPool: Pool | null,
  filePath: string,
  tableName: string,
  sanitizedColumns: string[],
  columnMapping: Map<string, string>
): Promise<number> {
  return new Promise((resolve, reject) => {
    let recordCount = 0;
    const records: any[] = [];
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', async (data: any) => {
        const mappedRecord: any = {};
        // Map original column names (which may contain dollar signs) to sanitized column names
        Object.keys(data).forEach((originalCol) => {
          const sanitizedCol = columnMapping.get(originalCol);
          if (sanitizedCol) {
            const value = data[originalCol];
            mappedRecord[sanitizedCol] = (value && String(value).trim() !== '') ? value : null;
          }
        });
        
        const hasData = Object.values(mappedRecord).some(value => value !== null);
        
        if (!hasData) {
          return;
        }
        
        records.push(mappedRecord);
        recordCount++;
        
        if (records.length >= 1000) {
          await batchInsertRecords(dbPool, tableName, sanitizedColumns, records.splice(0, 1000));
        }
      })
      .on('end', async () => {
        try {
          if (records.length > 0) {
            await batchInsertRecords(dbPool, tableName, sanitizedColumns, records);
          }
          resolve(recordCount);
        } catch (error) {
          reject(error);
        }
      })
      .on('error', reject);
  });
}

async function importDataFromExcel(
  dbPool: Pool | null,
  filePath: string,
  tableName: string,
  sanitizedColumns: string[],
  columnMapping: Map<string, string>
): Promise<number> {
  const fileBuffer = fs.readFileSync(filePath);
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
  
  if (jsonData.length <= 1) {
    throw new Error('Excel file has no data rows');
  }
  
  const dataRows = jsonData.slice(1);
  const records: any[] = [];
  
  dataRows.forEach((row) => {
    const hasData = row.some((value: any) => 
      value !== null && value !== undefined && String(value).trim() !== ''
    );
    
    if (!hasData) {
      return;
    }
    
    const record: any = {};
    sanitizedColumns.forEach((col, index) => {
      record[col] = row[index] || null;
    });
    records.push(record);
  });
  
  const batchSize = 1000;
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    await batchInsertRecords(dbPool, tableName, sanitizedColumns, batch);
  }
  
  return records.length;
}

async function batchInsertRecords(
  dbPool: Pool | null,
  tableName: string,
  columns: string[],
  records: any[]
): Promise<void> {
  if (records.length === 0) return;
  
  const columnNames = columns.map(col => `\`${col}\``).join(', ');
  const placeholders = records.map(() => 
    `(${columns.map(() => '?').join(', ')})`
  ).join(', ');
  
  const values: any[] = [];
  records.forEach(record => {
    columns.forEach(col => {
      values.push(record[col] || null);
    });
  });
  
  const query = `INSERT INTO ${tableName} (${columnNames}) VALUES ${placeholders}`;
  await executeQuery(dbPool, query, values);
}

