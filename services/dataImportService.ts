import * as XLSX from 'xlsx';

export interface ColumnSchema {
  name: string;
  type: 'VARCHAR' | 'INT' | 'DECIMAL' | 'TEXT' | 'DATE' | 'BOOLEAN';
  length?: number;
  nullable: boolean;
  defaultValue?: any;
}

export interface ImportValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  columnMappings: Record<string, string>;
}

export interface StagingTable {
  id: string;
  sessionId: string;
  tableName: string;
  columnSchema: ColumnSchema[];
  recordCount: number;
  createdAt: string;
}

export interface ProductionTable {
  id: string;
  sessionId: string;
  tableName: string;
  columnSchema: ColumnSchema[];
  recordCount: number;
  createdAt: string;
}

export interface ImportSession {
  id: string;
  name: string;
  description: string;
  dataType: 'tracts' | 'contacts' | 'units' | 'leads' | 'assignments' | 'custom';
  status: 'staging' | 'review' | 'production' | 'archived';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ImportFile {
  id: string;
  sessionId: string;
  filename: string;
  originalName: string;
  fileSize: number;
  uploadDate: string;
  status: 'uploading' | 'processing' | 'staged' | 'error';
  recordCount: number;
  errorMessage?: string;
}

export class DataImportService {
  private static instance: DataImportService;
  
  private constructor() {}
  
  public static getInstance(): DataImportService {
    if (!DataImportService.instance) {
      DataImportService.instance = new DataImportService();
    }
    return DataImportService.instance;
  }

  /**
   * Parse Excel file and extract column headers and data
   */
  public async parseExcelFile(file: File): Promise<{
    headers: string[];
    data: any[][];
    totalRows: number;
  }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          // Convert to JSON with headers
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          if (jsonData.length === 0) {
            reject(new Error('Excel file is empty'));
            return;
          }
          
          const headers = jsonData[0] as string[];
          const dataRows = jsonData.slice(1) as any[][];
          
          resolve({
            headers,
            data: dataRows,
            totalRows: dataRows.length
          });
        } catch (error) {
          reject(new Error(`Failed to parse Excel file: ${error}`));
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Validate Excel columns against expected schema
   */
  public validateColumns(
    excelHeaders: string[],
    dataType: string,
    validationRules: any
  ): ImportValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const columnMappings: Record<string, string> = {};

    // Check if validation rules exist for this data type
    if (validationRules && validationRules.required_columns) {
      const requiredColumns = validationRules.required_columns;
      
      for (const requiredCol of requiredColumns) {
        const found = excelHeaders.find(header => 
          header.toLowerCase() === requiredCol.toLowerCase()
        );
        
        if (!found) {
          errors.push(`Required column '${requiredCol}' not found in Excel file`);
        } else {
          columnMappings[found] = requiredCol;
        }
      }
    }

    // Create column mappings for all headers
    excelHeaders.forEach(header => {
      if (!columnMappings[header]) {
        columnMappings[header] = header;
      }
    });

    // Check for duplicate column names (case-insensitive)
    const lowerHeaders = excelHeaders.map(h => h.toLowerCase());
    const uniqueLowerHeaders = [...new Set(lowerHeaders)];
    
    if (lowerHeaders.length !== uniqueLowerHeaders.length) {
      warnings.push('Duplicate column names detected (case-insensitive)');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      columnMappings
    };
  }

  /**
   * Generate SQL for creating staging table
   */
  public generateStagingTableSQL(
    tableName: string,
    columns: ColumnSchema[]
  ): string {
    const columnDefinitions = columns.map(col => {
      let definition = `${col.name} ${col.type}`;
      
      if (col.length && (col.type === 'VARCHAR' || col.type === 'INT')) {
        definition += `(${col.length})`;
      }
      
      if (!col.nullable) {
        definition += ' NOT NULL';
      }
      
      if (col.defaultValue !== undefined) {
        if (typeof col.defaultValue === 'string') {
          definition += ` DEFAULT '${col.defaultValue}'`;
        } else {
          definition += ` DEFAULT ${col.defaultValue}`;
        }
      }
      
      return definition;
    });

    return `
      CREATE TABLE IF NOT EXISTS ${tableName} (
        id VARCHAR(36) PRIMARY KEY,
        ${columnDefinitions.join(',\n        ')},
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `;
  }

  /**
   * Generate SQL for creating production table
   */
  public generateProductionTableSQL(
    tableName: string,
    columns: ColumnSchema[]
  ): string {
    const columnDefinitions = columns.map(col => {
      let definition = `${col.name} ${col.type}`;
      
      if (col.length && (col.type === 'VARCHAR' || col.type === 'INT')) {
        definition += `(${col.length})`;
      }
      
      if (!col.nullable) {
        definition += ' NOT NULL';
      }
      
      if (col.defaultValue !== undefined) {
        if (typeof col.defaultValue === 'string') {
          definition += ` DEFAULT '${col.defaultValue}'`;
        } else {
          definition += ` DEFAULT ${col.defaultValue}`;
        }
      }
      
      return definition;
    });

    return `
      CREATE TABLE IF NOT EXISTS ${tableName} (
        id VARCHAR(36) PRIMARY KEY,
        ${columnDefinitions.join(',\n        ')},
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `;
  }

  /**
   * Infer column types from data
   */
  public inferColumnTypes(headers: string[], sampleData: any[][]): ColumnSchema[] {
    const schemas: ColumnSchema[] = [];
    
    headers.forEach((header, colIndex) => {
      const sampleValues = sampleData.map(row => row[colIndex]).filter(val => val !== undefined && val !== null);
      
      let type: ColumnSchema['type'] = 'VARCHAR';
      let length = 255;
      let nullable = true;
      
      if (sampleValues.length > 0) {
        // Check if all values are numbers
        const allNumbers = sampleValues.every(val => !isNaN(Number(val)) && val !== '');
        if (allNumbers) {
          const maxValue = Math.max(...sampleValues.map(v => Math.abs(Number(v))));
          if (maxValue <= 2147483647) {
            type = 'INT';
            length = undefined;
          } else {
            type = 'DECIMAL';
            length = undefined;
          }
        }
        
        // Check if all values are dates
        const allDates = sampleValues.every(val => {
          const date = new Date(val);
          return !isNaN(date.getTime());
        });
        if (allDates) {
          type = 'DATE';
          length = undefined;
        }
        
        // Check if all values are booleans
        const allBooleans = sampleValues.every(val => 
          val === true || val === false || val === 1 || val === 0 || 
          val === 'true' || val === 'false' || val === '1' || val === '0'
        );
        if (allBooleans) {
          type = 'BOOLEAN';
          length = undefined;
        }
        
        // Determine VARCHAR length
        if (type === 'VARCHAR') {
          const maxLength = Math.max(...sampleValues.map(v => String(v).length));
          length = Math.max(50, Math.min(maxLength * 2, 1000)); // Reasonable limits
        }
      }
      
      schemas.push({
        name: header.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase(), // Sanitize column name
        type,
        length,
        nullable
      });
    });
    
    return schemas;
  }

  /**
   * Generate INSERT SQL for staging data
   */
  public generateInsertSQL(tableName: string, columns: string[], data: any[][]): string[] {
    const columnNames = columns.map(col => col.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase());
    const insertStatements: string[] = [];
    
    data.forEach((row, index) => {
      const values = row.map((val, colIndex) => {
        if (val === null || val === undefined) {
          return 'NULL';
        }
        
        const column = columnNames[colIndex];
        const schema = this.getColumnSchemaByName(column);
        
        if (schema?.type === 'VARCHAR' || schema?.type === 'TEXT' || schema?.type === 'DATE') {
          return `'${String(val).replace(/'/g, "''")}'`; // Escape single quotes
        }
        
        if (schema?.type === 'BOOLEAN') {
          if (val === true || val === 1 || val === 'true' || val === '1') {
            return '1';
          }
          return '0';
        }
        
        return String(val);
      });
      
      const insertSQL = `
        INSERT INTO ${tableName} (id, ${columnNames.join(', ')}) 
        VALUES ('${this.generateUUID()}', ${values.join(', ')})
      `;
      
      insertStatements.push(insertSQL);
    });
    
    return insertStatements;
  }

  /**
   * Generate UUID for database records
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Get column schema by name (placeholder for actual implementation)
   */
  private getColumnSchemaByName(columnName: string): ColumnSchema | undefined {
    // This would be implemented to fetch from the actual database schema
    return undefined;
  }

  /**
   * Move data from staging to production
   */
  public generateProductionInsertSQL(
    stagingTableName: string,
    productionTableName: string,
    columns: string[]
  ): string {
    const columnNames = columns.map(col => col.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase());
    
    return `
      INSERT INTO ${productionTableName} (id, ${columnNames.join(', ')})
      SELECT id, ${columnNames.join(', ')}
      FROM ${stagingTableName}
    `;
  }
}

export default DataImportService.getInstance();
