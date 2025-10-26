import { executeQuery } from './databaseConnection.ts';
import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'csv-parser';
import * as XLSX from 'xlsx';

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
      dataRows.forEach((row: any) => {
        if (Array.isArray(row)) {
          const record: any = {};
          columns.forEach((col, index) => {
            record[col] = row[index] || null;
          });
          records.push(record);
        }
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
    console.log(`Starting normalization of table ${tableName} to 3NF...`);
    
    try {
      // Get the data from the production table
      const data = await executeQuery(`SELECT * FROM ${tableName} LIMIT 1000`);
      
      if (data.length === 0) {
        console.log(`No data found in table ${tableName}, skipping normalization`);
        return;
      }
      
      // Analyze table structure and normalize based on table name
      if (tableName.includes('pricing')) {
        await this.normalizePricingTable(tableName, data);
      } else if (tableName.includes('acreage')) {
        await this.normalizeAcreageTable(tableName, data);
      } else if (tableName.includes('unit_summary')) {
        await this.normalizeUnitSummaryTable(tableName, data);
      } else {
        console.log(`Unknown table type for normalization: ${tableName}`);
      }
      
      console.log(`Successfully normalized table ${tableName} to 3NF`);
      
    } catch (error) {
      console.error(`Error normalizing table ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Normalize pricing tables (texas_pricing, oklahoma_pricing)
   */
  private async normalizePricingTable(tableName: string, data: any[]): Promise<void> {
    console.log(`Normalizing pricing table: ${tableName}`);
    
    // Extract unique counties and create county records
    const counties = Array.from(new Set(data.map(row => row.County).filter(Boolean)));
    for (const county of counties) {
      await this.ensureCountyExists(county, 'TX'); // Default to TX for now
    }
    
    // Extract unique basins and create basin records
    const basins = Array.from(new Set(data.map(row => row.Basin).filter(Boolean)));
    for (const basin of basins) {
      await this.ensureBasinExists(basin);
    }
    
    // Extract unique survey companies and create survey company records
    const surveys = Array.from(new Set(data.map(row => row.Survey).filter(Boolean)));
    for (const survey of surveys) {
      await this.ensureSurveyCompanyExists(survey);
    }
    
    // Extract unique formations and create formation records
    const formations = Array.from(new Set(data.map(row => row.Formation).filter(Boolean)));
    for (const formation of formations) {
      await this.ensureFormationExists(formation);
    }
    
    // Create properties and formation pricing records
    for (const row of data) {
      if (row.Unique_ID) {
        // Create property record
        const propertyId = await this.ensurePropertyExists(row);
        
        // Create formation pricing records
        if (row.Formation && row.Price_Per_Acre) {
          await this.ensureFormationPricingExists(propertyId, row.Formation, row.Price_Per_Acre);
        }
      }
    }
  }

  /**
   * Normalize acreage table
   */
  private async normalizeAcreageTable(tableName: string, data: any[]): Promise<void> {
    console.log(`Normalizing acreage table: ${tableName}`);
    
    // Extract unique counties and create county records
    const counties = Array.from(new Set(data.map(row => row.COUNTY).filter(Boolean)));
    for (const county of counties) {
      const state = county === 'KINGFISHER' ? 'OK' : 'TX';
      await this.ensureCountyExists(county, state);
    }
    
    // Extract unique acquisition statuses and create status records
    const statuses = Array.from(new Set(data.map(row => row.STATUS).filter(Boolean)));
    for (const status of statuses) {
      await this.ensureAcquisitionStatusExists(status);
    }
    
    // Extract unique acquisition activities and create activity records
    for (const status of statuses) {
      await this.ensureAcquisitionActivityExists(status);
    }
    
    // Create sections from S-T-R data
    for (const row of data) {
      if (row['S_T_R'] && row.COUNTY) {
        await this.ensureSectionExists(row['S_T_R'], row.COUNTY);
      }
    }
    
    // Create owners and mineral interests
    for (const row of data) {
      if (row.OWNER_NAME) {
        const ownerId = await this.ensureOwnerExists(row.OWNER_NAME, 'Individual');
        const propertyId = await this.ensurePropertyFromAcreage(row);
        
        if (propertyId && row.NET_MINERAL_ACRES) {
          await this.ensureMineralInterestExists(propertyId, ownerId, row);
        }
      }
    }
  }

  /**
   * Normalize unit summary table
   */
  private async normalizeUnitSummaryTable(tableName: string, data: any[]): Promise<void> {
    console.log(`Normalizing unit summary table: ${tableName}`);
    
    // Extract unique operators and create operator records
    const operators = Array.from(new Set(data.map(row => row.Operator).filter(Boolean)));
    for (const operator of operators) {
      await this.ensureOperatorExists(operator);
    }
    
    // Extract unique well statuses and create well status records
    const wellStatuses = Array.from(new Set(data.map(row => row['Well Status']).filter(Boolean)));
    for (const status of wellStatuses) {
      await this.ensureWellStatusExists(status);
    }
    
    // Extract unique unit tiers and create unit tier records
    const tiers = Array.from(new Set(data.map(row => row['Tier/Class']).filter(Boolean)));
    for (const tier of tiers) {
      await this.ensureUnitTierExists(tier);
    }
    
    // Extract unique unit statuses and create unit status records
    const unitStatuses = Array.from(new Set(data.map(row => row.Status).filter(Boolean)));
    for (const status of unitStatuses) {
      await this.ensureUnitStatusExists(status);
    }
    
    // Create wells and units
    for (const row of data) {
      if (row['Well Name']) {
        const wellId = await this.ensureWellExists(row);
        if (wellId) {
          await this.ensureUnitExists(wellId, row);
        }
      }
    }
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
   * Normalize existing production tables
   */
  async normalizeExistingProductionTables(): Promise<ImportResult> {
    try {
      console.log('Starting normalization of existing production tables...');
      
      const productionTables = [
        'prod_texas_pricing',
        'prod_oklahoma_pricing', 
        'prod_acreage_schedule',
        'prod_unit_summary'
      ];
      
      const results = [];
      
      for (const tableName of productionTables) {
        try {
          // Check if table exists
          const exists = await this.checkTableExists(tableName);
          if (exists) {
            console.log(`Normalizing table: ${tableName}`);
            await this.normalizeDataTo3NF(tableName);
            results.push({ table: tableName, status: 'success' });
          } else {
            console.log(`Table ${tableName} does not exist, skipping...`);
            results.push({ table: tableName, status: 'not_found' });
          }
        } catch (error) {
          console.error(`Error normalizing table ${tableName}:`, error);
          results.push({ table: tableName, status: 'error', error: error instanceof Error ? error.message : 'Unknown error' });
        }
      }
      
      return {
        success: true,
        message: `Normalization completed for ${results.length} tables`,
        recordCount: results.length
      };
      
    } catch (error) {
      console.error('Error normalizing existing production tables:', error);
      return {
        success: false,
        message: `Error normalizing existing tables: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
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

  // Helper methods for ensuring records exist
  private async ensureCountyExists(countyName: string, stateCode: string): Promise<string> {
    const countyId = `county_${countyName.toLowerCase().replace(/\s+/g, '_')}`;
    const stateId = stateCode === 'TX' ? 'state_tx' : stateCode === 'OK' ? 'state_ok' : 'state_tx';
    
    const exists = await executeQuery(
      'SELECT id FROM counties WHERE id = ?',
      [countyId]
    );
    
    if (exists.length === 0) {
      await executeQuery(
        'INSERT INTO counties (id, state_id, name) VALUES (?, ?, ?)',
        [countyId, stateId, countyName]
      );
      console.log(`Created county: ${countyName}`);
    }
    
    return countyId;
  }

  private async ensureBasinExists(basinName: string): Promise<string> {
    const basinId = `basin_${basinName.toLowerCase().replace(/\s+/g, '_')}`;
    
    const exists = await executeQuery(
      'SELECT id FROM basins WHERE id = ?',
      [basinId]
    );
    
    if (exists.length === 0) {
      await executeQuery(
        'INSERT INTO basins (id, name, description) VALUES (?, ?, ?)',
        [basinId, basinName, `Basin in ${basinName} region`]
      );
      console.log(`Created basin: ${basinName}`);
    }
    
    return basinId;
  }

  private async ensureSurveyCompanyExists(surveyName: string): Promise<string> {
    const surveyId = `survey_${surveyName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    
    const exists = await executeQuery(
      'SELECT id FROM survey_companies WHERE id = ?',
      [surveyId]
    );
    
    if (exists.length === 0) {
      await executeQuery(
        'INSERT INTO survey_companies (id, name, description) VALUES (?, ?, ?)',
        [surveyId, surveyName, `Survey company: ${surveyName}`]
      );
      console.log(`Created survey company: ${surveyName}`);
    }
    
    return surveyId;
  }

  private async ensureFormationExists(formationName: string): Promise<string> {
    const formationId = `formation_${formationName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    
    const exists = await executeQuery(
      'SELECT id FROM formations WHERE id = ?',
      [formationId]
    );
    
    if (exists.length === 0) {
      await executeQuery(
        'INSERT INTO formations (id, name, description) VALUES (?, ?, ?)',
        [formationId, formationName, `${formationName} formation`]
      );
      console.log(`Created formation: ${formationName}`);
    }
    
    return formationId;
  }

  private async ensurePropertyExists(row: any): Promise<string> {
    const propertyId = `prop_${row.Unique_ID.replace(/[^a-z0-9]/g, '_')}`;
    const countyId = `county_${row.County.toLowerCase().replace(/\s+/g, '_')}`;
    
    const exists = await executeQuery(
      'SELECT id FROM properties WHERE id = ?',
      [propertyId]
    );
    
    if (exists.length === 0) {
      await executeQuery(
        'INSERT INTO properties (id, county_id, unique_id, legal_description, gross_acres) VALUES (?, ?, ?, ?, ?)',
        [propertyId, countyId, row.Unique_ID, row.Legal_Description || '', parseFloat(row.Gross_Acres) || 0]
      );
      console.log(`Created property: ${row.Unique_ID}`);
    }
    
    return propertyId;
  }

  private async ensureFormationPricingExists(propertyId: string, formationName: string, price: number): Promise<void> {
    const formationId = `formation_${formationName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    
    const exists = await executeQuery(
      'SELECT id FROM formation_pricing WHERE property_id = ? AND formation_id = ?',
      [propertyId, formationId]
    );
    
    if (exists.length === 0) {
      await executeQuery(
        'INSERT INTO formation_pricing (id, property_id, formation_id, price_per_acre) VALUES (?, ?, ?, ?)',
        [`fp_${propertyId}_${formationId}`, propertyId, formationId, price]
      );
      console.log(`Created formation pricing: ${propertyId} - ${formationName}`);
    }
  }

  private async ensureAcquisitionStatusExists(statusName: string): Promise<string> {
    const statusId = `acq_status_${statusName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    
    const exists = await executeQuery(
      'SELECT id FROM acquisition_status_types WHERE id = ?',
      [statusId]
    );
    
    if (exists.length === 0) {
      await executeQuery(
        'INSERT INTO acquisition_status_types (id, name, description) VALUES (?, ?, ?)',
        [statusId, statusName, `Acquisition status: ${statusName}`]
      );
      console.log(`Created acquisition status: ${statusName}`);
    }
    
    return statusId;
  }

  private async ensureAcquisitionActivityExists(activityName: string): Promise<string> {
    const activityId = `activity_${activityName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    
    const exists = await executeQuery(
      'SELECT id FROM acquisition_activities WHERE id = ?',
      [activityId]
    );
    
    if (exists.length === 0) {
      await executeQuery(
        'INSERT INTO acquisition_activities (id, name, description) VALUES (?, ?, ?)',
        [activityId, activityName, `Acquisition activity: ${activityName}`]
      );
      console.log(`Created acquisition activity: ${activityName}`);
    }
    
    return activityId;
  }

  private async ensureSectionExists(str: string, county: string): Promise<string> {
    const sectionId = `section_${str.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    const countyId = `county_${county.toLowerCase().replace(/\s+/g, '_')}`;
    
    const exists = await executeQuery(
      'SELECT id FROM sections WHERE id = ?',
      [sectionId]
    );
    
    if (exists.length === 0) {
      const parts = str.split('-');
      await executeQuery(
        'INSERT INTO sections (id, county_id, section_number, township, range) VALUES (?, ?, ?, ?, ?)',
        [sectionId, countyId, parts[0] || '', parts[1] || '', parts[2] || '']
      );
      console.log(`Created section: ${str}`);
    }
    
    return sectionId;
  }

  private async ensureOwnerExists(ownerName: string, ownerType: string): Promise<string> {
    const ownerId = `owner_${ownerName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    const ownerTypeId = `owner_type_${ownerType.toLowerCase()}`;
    
    const exists = await executeQuery(
      'SELECT id FROM owners WHERE id = ?',
      [ownerId]
    );
    
    if (exists.length === 0) {
      await executeQuery(
        'INSERT INTO owners (id, owner_type_id, legal_name, display_name) VALUES (?, ?, ?, ?)',
        [ownerId, ownerTypeId, ownerName, ownerName]
      );
      console.log(`Created owner: ${ownerName}`);
    }
    
    return ownerId;
  }

  private async ensurePropertyFromAcreage(row: any): Promise<string> {
    const propertyId = `prop_${row['S_T_R']?.replace(/[^a-z0-9]/g, '_')}_${row.COUNTY?.replace(/\s+/g, '_')}`;
    const countyId = `county_${row.COUNTY.toLowerCase().replace(/\s+/g, '_')}`;
    
    const exists = await executeQuery(
      'SELECT id FROM properties WHERE id = ?',
      [propertyId]
    );
    
    if (exists.length === 0) {
      await executeQuery(
        'INSERT INTO properties (id, county_id, unique_id, legal_description) VALUES (?, ?, ?, ?)',
        [propertyId, countyId, row['S_T_R'], `Section ${row.SEC}, Township ${row.TWN}, Range ${row.RNG}`]
      );
      console.log(`Created property from acreage: ${row['S_T_R']}`);
    }
    
    return propertyId;
  }

  private async ensureMineralInterestExists(propertyId: string, ownerId: string, row: any): Promise<void> {
    const interestId = `mineral_${propertyId}_${ownerId}`;
    
    const exists = await executeQuery(
      'SELECT id FROM mineral_interests WHERE id = ?',
      [interestId]
    );
    
    if (exists.length === 0) {
      await executeQuery(
        'INSERT INTO mineral_interests (id, property_id, owner_id, interest_type_id, net_mineral_acres) VALUES (?, ?, ?, ?, ?)',
        [interestId, propertyId, ownerId, 'interest_type_minerals', parseFloat(row.NET_MINERAL_ACRES) || 0]
      );
      console.log(`Created mineral interest: ${propertyId} - ${ownerId}`);
    }
  }

  private async ensureOperatorExists(operatorName: string): Promise<string> {
    const operatorId = `op_${operatorName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    
    const exists = await executeQuery(
      'SELECT id FROM operators WHERE id = ?',
      [operatorId]
    );
    
    if (exists.length === 0) {
      await executeQuery(
        'INSERT INTO operators (id, name, description) VALUES (?, ?, ?)',
        [operatorId, operatorName, `Operator: ${operatorName}`]
      );
      console.log(`Created operator: ${operatorName}`);
    }
    
    return operatorId;
  }

  private async ensureWellStatusExists(statusName: string): Promise<string> {
    const statusId = `well_status_${statusName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    
    const exists = await executeQuery(
      'SELECT id FROM well_status_types WHERE id = ?',
      [statusId]
    );
    
    if (exists.length === 0) {
      await executeQuery(
        'INSERT INTO well_status_types (id, name, description) VALUES (?, ?, ?)',
        [statusId, statusName, `Well status: ${statusName}`]
      );
      console.log(`Created well status: ${statusName}`);
    }
    
    return statusId;
  }

  private async ensureUnitTierExists(tierName: string): Promise<string> {
    const tierId = `tier_${tierName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    
    const exists = await executeQuery(
      'SELECT id FROM unit_tiers WHERE id = ?',
      [tierId]
    );
    
    if (exists.length === 0) {
      const priority = tierName === 'AOI' ? 1 : tierName === 'AOI - Tier 2' ? 2 : 3;
      await executeQuery(
        'INSERT INTO unit_tiers (id, name, description, priority_order) VALUES (?, ?, ?, ?)',
        [tierId, tierName, `Unit tier: ${tierName}`, priority]
      );
      console.log(`Created unit tier: ${tierName}`);
    }
    
    return tierId;
  }

  private async ensureUnitStatusExists(statusName: string): Promise<string> {
    const statusId = `unit_status_${statusName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    
    const exists = await executeQuery(
      'SELECT id FROM unit_status_types WHERE id = ?',
      [statusId]
    );
    
    if (exists.length === 0) {
      await executeQuery(
        'INSERT INTO unit_status_types (id, name, description) VALUES (?, ?, ?)',
        [statusId, statusName, `Unit status: ${statusName}`]
      );
      console.log(`Created unit status: ${statusName}`);
    }
    
    return statusId;
  }

  private async ensureWellExists(row: any): Promise<string> {
    const wellId = `well_${row['Well Name'].toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    const operatorId = `op_${row.Operator.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    const statusId = `well_status_${row['Well Status'].toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    
    // Create a property for this well if it doesn't exist
    const propertyId = `prop_well_${row['Well Name'].toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    const countyId = `county_${row.County?.toLowerCase().replace(/\s+/g, '_') || 'unknown'}`;
    
    const wellExists = await executeQuery(
      'SELECT id FROM wells WHERE id = ?',
      [wellId]
    );
    
    if (wellExists.length === 0) {
      // Ensure property exists
      const propExists = await executeQuery(
        'SELECT id FROM properties WHERE id = ?',
        [propertyId]
      );
      
      if (propExists.length === 0) {
        await executeQuery(
          'INSERT INTO properties (id, county_id, unique_id, legal_description) VALUES (?, ?, ?, ?)',
          [propertyId, countyId, row['Well Name'], `Well property: ${row['Well Name']}`]
        );
      }
      
      await executeQuery(
        'INSERT INTO wells (id, well_name, operator_id, property_id, well_status_id, allocation_percentage) VALUES (?, ?, ?, ?, ?, ?)',
        [wellId, row['Well Name'], operatorId, propertyId, statusId, parseFloat(row['Allocation %']) || 0]
      );
      console.log(`Created well: ${row['Well Name']}`);
    }
    
    return wellId;
  }

  private async ensureUnitExists(wellId: string, row: any): Promise<void> {
    const unitId = `unit_${wellId}_${row['Tier/Class']?.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    const tierId = `tier_${row['Tier/Class']?.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    const statusId = `unit_status_${row.Status?.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    
    const exists = await executeQuery(
      'SELECT id FROM units WHERE id = ?',
      [unitId]
    );
    
    if (exists.length === 0) {
      await executeQuery(
        'INSERT INTO units (id, well_id, tier_id, unit_status_id, tops_price_3_16th, number_of_owners) VALUES (?, ?, ?, ?, ?, ?)',
        [unitId, wellId, tierId, statusId, parseFloat(row['Tops Price 3/16th']) || 0, parseInt(row['# of Owners']) || 0]
      );
      console.log(`Created unit: ${unitId}`);
    }
  }
}