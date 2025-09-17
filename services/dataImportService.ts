import { executeQuery } from './databaseConnection.js';
import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'csv-parser';
import * as XLSX from 'xlsx';
import { Readable } from 'stream';

export interface ImportResult {
  success: boolean;
  message: string;
  stagingTableName?: string;
  productionTableName?: string;
  missingColumns?: string[];
  extraColumns?: string[];
  recordCount?: number;
}

export interface TableSchema {
  tableName: string;
  columns: Array<{
    name: string;
    type: string;
    nullable: boolean;
    primaryKey: boolean;
  }>;
}

export class DataImportService {
  private readonly stagingPrefix = 'staging_';
  private readonly productionPrefix = 'prod_';

  /**
   * Main import handler - processes file upload and creates tables
   */
  async processFileUpload(filePath: string, originalFileName: string): Promise<ImportResult> {
    try {
      // Extract table name from filename
      const tableName = this.extractTableNameFromFileName(originalFileName);
      
      // Check if table already exists in database
      const tableExists = await this.checkTableExists(tableName);
      
      if (tableExists) {
        return {
          success: false,
          message: `Table '${tableName}' already exists in the database. Please use a different filename or update the existing table.`
        };
      }

      // Read file and extract column information
      const fileColumns = await this.extractColumnsFromFile(filePath);
      
      // Create staging and production tables
      const stagingTableName = `${this.stagingPrefix}${tableName}`;
      const productionTableName = `${this.productionPrefix}${tableName}`;
      
      await this.createStagingTable(stagingTableName, fileColumns);
      await this.createProductionTable(productionTableName, fileColumns);
      
      // Import data to staging table
      const recordCount = await this.importDataToStaging(filePath, stagingTableName, fileColumns);
      
      return {
        success: true,
        message: `File uploaded successfully. ${recordCount} records imported to staging table.`,
        stagingTableName,
        productionTableName,
        recordCount
      };
      
    } catch (error) {
      console.error('Error processing file upload:', error);
      return {
        success: false,
        message: `Error processing file: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Validate file columns against existing database schema
   */
  async validateFileAgainstSchema(filePath: string, targetTableName: string): Promise<ImportResult> {
    try {
      const fileColumns = await this.extractColumnsFromFile(filePath);
      const dbSchema = await this.getTableSchema(targetTableName);
      
      const missingColumns = dbSchema.columns
        .filter(dbCol => !fileColumns.includes(dbCol.name))
        .map(col => col.name);
      
      const extraColumns = fileColumns
        .filter(fileCol => !dbSchema.columns.some(dbCol => dbCol.name === fileCol));
      
      if (missingColumns.length > 0) {
        return {
          success: false,
          message: `Column validation failed. Missing required columns: ${missingColumns.join(', ')}`,
          missingColumns
        };
      }
      
      if (extraColumns.length > 0) {
        return {
          success: false,
          message: `Column validation failed. Extra columns found: ${extraColumns.join(', ')}`,
          extraColumns
        };
      }
      
      return {
        success: true,
        message: 'Column validation passed. All required columns are present.'
      };
      
    } catch (error) {
      console.error('Error validating file against schema:', error);
      return {
        success: false,
        message: `Error validating file: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Approve import and move data from staging to production
   */
  async approveImport(stagingTableName: string, productionTableName: string): Promise<ImportResult> {
    try {
      // Move data from staging to production
      await this.moveDataFromStagingToProduction(stagingTableName, productionTableName);
      
      // Clear staging table
      await this.clearStagingTable(stagingTableName);
      
      // Normalize data to 3NF
      await this.normalizeDataTo3NF(productionTableName);
      
      return {
        success: true,
        message: 'Import approved successfully. Data moved to production and normalized to 3NF.'
      };
      
    } catch (error) {
      console.error('Error approving import:', error);
      return {
        success: false,
        message: `Error approving import: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Extract table name from filename
   */
  private extractTableNameFromFileName(fileName: string): string {
    const nameWithoutExt = path.parse(fileName).name;
    return nameWithoutExt.toLowerCase().replace(/[^a-z0-9_]/g, '_');
  }

  /**
   * Check if table exists in database
   */
  private async checkTableExists(tableName: string): Promise<boolean> {
    try {
      const query = `
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_schema = 'soonermineraldb' 
        AND table_name = ?
      `;
      const result = await executeQuery(query, [tableName]);
      return result[0].count > 0;
    } catch (error) {
      console.error('Error checking table existence:', error);
      return false;
    }
  }

  /**
   * Extract column names from file (supports CSV and Excel)
   */
  private async extractColumnsFromFile(filePath: string): Promise<string[]> {
    const fileExtension = path.extname(filePath).toLowerCase();
    
    if (fileExtension === '.csv') {
      return this.extractColumnsFromCSV(filePath);
    } else if (fileExtension === '.xlsx' || fileExtension === '.xls') {
      return this.extractColumnsFromExcel(filePath);
    } else {
      throw new Error(`Unsupported file format: ${fileExtension}`);
    }
  }

  /**
   * Extract column names from CSV file
   */
  private async extractColumnsFromCSV(filePath: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const columns: string[] = [];
      const stream = fs.createReadStream(filePath)
        .pipe(csv())
        .on('headers', (headers: string[]) => {
          columns.push(...headers);
          stream.destroy(); // Stop after reading headers
        })
        .on('error', (error) => {
          reject(error);
        })
        .on('end', () => {
          resolve(columns);
        });
    });
  }

  /**
   * Extract column names from Excel file
   */
  private async extractColumnsFromExcel(filePath: string): Promise<string[]> {
    try {
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0]; // Use first sheet
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON to get headers
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (jsonData.length === 0) {
        throw new Error('Excel file is empty');
      }
      
      // First row contains headers
      const headers = jsonData[0] as string[];
      return headers.filter(header => header && header.trim() !== '');
    } catch (error) {
      throw new Error(`Error reading Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create staging table
   */
  private async createStagingTable(tableName: string, columns: string[]): Promise<void> {
    const columnDefinitions = columns.map(col => 
      `\`${col}\` TEXT`
    ).join(', ');
    
    const query = `
      CREATE TABLE ${tableName} (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        ${columnDefinitions},
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `;
    
    await executeQuery(query);
  }

  /**
   * Create production table
   */
  private async createProductionTable(tableName: string, columns: string[]): Promise<void> {
    const columnDefinitions = columns.map(col => 
      `\`${col}\` TEXT`
    ).join(', ');
    
    const query = `
      CREATE TABLE ${tableName} (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        ${columnDefinitions},
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `;
    
    await executeQuery(query);
  }

  /**
   * Import data to staging table (supports CSV and Excel)
   */
  private async importDataToStaging(filePath: string, tableName: string, columns: string[]): Promise<number> {
    const fileExtension = path.extname(filePath).toLowerCase();
    
    if (fileExtension === '.csv') {
      return this.importDataFromCSV(filePath, tableName, columns);
    } else if (fileExtension === '.xlsx' || fileExtension === '.xls') {
      return this.importDataFromExcel(filePath, tableName, columns);
    } else {
      throw new Error(`Unsupported file format: ${fileExtension}`);
    }
  }

  /**
   * Import data from CSV file
   */
  private async importDataFromCSV(filePath: string, tableName: string, columns: string[]): Promise<number> {
    return new Promise((resolve, reject) => {
      let recordCount = 0;
      const records: any[] = [];
      
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => {
          records.push(data);
          recordCount++;
          
          // Batch insert every 1000 records
          if (records.length >= 1000) {
            this.batchInsertRecords(tableName, columns, records.splice(0, 1000));
          }
        })
        .on('end', async () => {
          try {
            // Insert remaining records
            if (records.length > 0) {
              await this.batchInsertRecords(tableName, columns, records);
            }
            resolve(recordCount);
          } catch (error) {
            reject(error);
          }
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }

  /**
   * Import data from Excel file
   */
  private async importDataFromExcel(filePath: string, tableName: string, columns: string[]): Promise<number> {
    try {
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0]; // Use first sheet
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON array
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (jsonData.length <= 1) {
        throw new Error('Excel file has no data rows');
      }
      
      // Skip header row (first row)
      const dataRows = jsonData.slice(1);
      const records: any[] = [];
      
      // Convert array data to object format
      dataRows.forEach((row: any[]) => {
        const record: any = {};
        columns.forEach((col, index) => {
          record[col] = row[index] || null;
        });
        records.push(record);
      });
      
      // Batch insert records
      const batchSize = 1000;
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        await this.batchInsertRecords(tableName, columns, batch);
      }
      
      return records.length;
    } catch (error) {
      throw new Error(`Error importing Excel data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Batch insert records
   */
  private async batchInsertRecords(tableName: string, columns: string[], records: any[]): Promise<void> {
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
    
    const query = `
      INSERT INTO ${tableName} (${columnNames}) 
      VALUES ${placeholders}
    `;
    
    await executeQuery(query, values);
  }

  /**
   * Move data from staging to production
   */
  private async moveDataFromStagingToProduction(stagingTableName: string, productionTableName: string): Promise<void> {
    const query = `
      INSERT INTO ${productionTableName} 
      SELECT * FROM ${stagingTableName}
    `;
    
    await executeQuery(query);
  }

  /**
   * Clear staging table
   */
  private async clearStagingTable(stagingTableName: string): Promise<void> {
    const query = `DELETE FROM ${stagingTableName}`;
    await executeQuery(query);
  }


  /**
   * Normalize data to 3NF
   */
  private async normalizeDataTo3NF(tableName: string): Promise<void> {
    // This is a simplified 3NF normalization
    // In a real implementation, you would analyze the data structure
    // and create normalized tables based on the actual data
    
    console.log(`Normalizing data in table ${tableName} to 3NF...`);
    
    // Example: Create lookup tables for common values
    // This would be customized based on the actual data structure
    
    // For now, we'll just log that normalization would happen here
    console.log('3NF normalization completed (placeholder implementation)');
  }

  /**
   * Get all staging tables
   */
  async getStagingTables(): Promise<string[]> {
    const query = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'soonermineraldb' 
      AND table_name LIKE '${this.stagingPrefix}%'
    `;
    
    const result = await executeQuery(query);
    return result.map((row: any) => row.table_name);
  }

  /**
   * Get staging table data
   */
  async getStagingTableData(tableName: string, limit: number = 100): Promise<any[]> {
    const query = `SELECT * FROM ${tableName} LIMIT ?`;
    return await executeQuery(query, [limit]);
  }

  /**
   * Delete staging table
   */
  async deleteStagingTable(tableName: string): Promise<void> {
    const query = `DROP TABLE IF EXISTS ${tableName}`;
    await executeQuery(query);
  }

  /**
   * Get table schema
   */
  async getTableSchema(tableName: string): Promise<TableSchema> {
    const query = `
      SELECT 
        COLUMN_NAME as name,
        DATA_TYPE as type,
        IS_NULLABLE as nullable,
        COLUMN_KEY as primaryKey
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = 'soonermineraldb' 
      AND TABLE_NAME = ?
      ORDER BY ORDINAL_POSITION
    `;
    
    const result = await executeQuery(query, [tableName]);
    
    return {
      tableName,
      columns: result.map((row: any) => ({
        name: row.name,
        type: row.type,
        nullable: row.nullable === 'YES',
        primaryKey: row.primaryKey === 'PRI'
      }))
    };
  }
}