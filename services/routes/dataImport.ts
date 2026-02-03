import { Router } from 'express';
import type { Pool } from 'mysql2/promise';
import type { Multer } from 'multer';
import path from 'path';
import { executeQuery } from '../utils/database.js';
import {
  extractColumnsFromCSV,
  extractColumnsFromExcel,
  createStagingTable,
  createProductionTable,
  importDataToStaging
} from '../utils/dataImport.js';
import { DataImportService } from '../dataImportService.js';

export const createDataImportRoutes = (
  dbPool: Pool | null,
  dataImportService: DataImportService | null,
  upload: Multer
) => {
  const router = Router();

  // File upload endpoint
  router.post('/api/import/upload', upload.single('file'), async (req, res) => {
    try {
      console.log('Upload request received:', {
        body: req.body,
        file: req.file ? {
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size
        } : null,
        headers: req.headers
      });
      
      if (!req.file) {
        console.log('No file in request');
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      if (!dbPool) {
        const fileExtension = path.extname(req.file.originalname).toLowerCase();
        const allowedExtensions = ['.csv', '.xls', '.xlsx'];
        
        if (!allowedExtensions.includes(fileExtension)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid file type. Only CSV and Excel files are allowed.',
            databaseConnected: false
          });
        }

        return res.json({
          success: true,
          message: `File '${req.file.originalname}' received successfully. Database connection required for full processing.`,
          fileName: req.file.originalname,
          fileSize: req.file.size,
          databaseConnected: false
        });
      }

      const tableName = path.parse(req.file.originalname).name.toLowerCase().replace(/[^a-z0-9_]/g, '_');
      const stagingTableName = `staging_${tableName}`;
      
      const databaseName = process.env.MYSQL_DATABASE || 'soonermineraldb';
      const tableExists = await executeQuery(dbPool, `
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_schema = ? AND table_name = ?
      `, [databaseName, stagingTableName]);
      
      if (tableExists[0].count > 0) {
        console.log(`Dropping existing staging table: ${stagingTableName}`);
        try {
          await executeQuery(dbPool, `DROP TABLE IF EXISTS \`${stagingTableName}\``);
          console.log(`Successfully dropped table: ${stagingTableName}`);
        } catch (dropError: any) {
          console.error(`Error dropping table ${stagingTableName}:`, dropError);
        }
      }

      const fileExtension = path.extname(req.file.originalname).toLowerCase();
      let columns: string[] = [];
      
      if (fileExtension === '.csv') {
        columns = await extractColumnsFromCSV(req.file.path);
      } else if (fileExtension === '.xlsx' || fileExtension === '.xls') {
        columns = await extractColumnsFromExcel(req.file.path);
      } else {
        return res.status(400).json({
          success: false,
          message: `Unsupported file format: ${fileExtension}`
        });
      }

      const productionTableName = `prod_${tableName}`;
      
      const stagingMapping = await createStagingTable(dbPool, stagingTableName, columns);
      const productionMapping = await createProductionTable(dbPool, productionTableName, columns);
      
      const recordCount = await importDataToStaging(
        dbPool,
        req.file.path,
        stagingTableName,
        stagingMapping.originalColumns,
        stagingMapping.sanitizedColumns,
        fileExtension
      );
      
      res.json({
        success: true,
        message: `File uploaded successfully. ${recordCount} records imported to staging table.`,
        stagingTableName,
        productionTableName,
        recordCount
      });
      
    } catch (error: any) {
      console.error('Upload error:', error);
      res.status(500).json({
        success: false,
        message: `Upload failed: ${error.message}`
      });
    }
  });

  // Get staging tables
  router.get('/api/import/staging-tables', async (req, res) => {
    try {
      if (dataImportService) {
        const stagingTables = await dataImportService.getStagingTables();
        return res.json({
          success: true,
          stagingTables
        });
      }

      if (!dbPool) {
        return res.json({
          success: true,
          message: 'Database pool not initialized - showing empty staging tables',
          data: [],
          databaseConnected: false
        });
      }

      const databaseName = process.env.MYSQL_DATABASE || 'soonermineraldb';
      const tables = await executeQuery(dbPool, `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = ? AND table_name LIKE 'staging_%'
      `, [databaseName]);
      
      res.json({
        success: true,
        stagingTables: tables.map((row: any) => row.TABLE_NAME)
      });
    } catch (error: any) {
      console.error('Error fetching staging tables:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching staging tables', 
        error: error.message 
      });
    }
  });

  // Get production tables
  router.get('/api/import/production-tables', async (req, res) => {
    try {
      if (!dbPool) {
        return res.json({
          success: true,
          message: 'Database not connected - showing empty production tables',
          data: [],
          databaseConnected: false
        });
      }

      const databaseName = process.env.MYSQL_DATABASE || 'soonermineraldb';
      const tables = await executeQuery(dbPool, `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = ? AND table_name LIKE 'prod_%'
      `, [databaseName]);
      
      res.json({
        success: true,
        productionTables: tables.map((row: any) => row.TABLE_NAME)
      });
    } catch (error: any) {
      console.error('Error fetching production tables:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching production tables', 
        error: error.message 
      });
    }
  });

  // Get staging table data
  router.get('/api/import/staging-data/:tableName', async (req, res) => {
    try {
      const { tableName } = req.params;
      const limit = parseInt(req.query.limit as string) || 100;

      if (dataImportService) {
        const data = await dataImportService.getStagingTableData(tableName, limit);
        return res.json({
          success: true,
          data
        });
      }

      if (!dbPool) {
        return res.json({
          success: true,
          message: 'Database not connected - showing empty data',
          data: [],
          count: 0,
          databaseConnected: false
        });
      }

      const data = await executeQuery(dbPool, `SELECT * FROM \`${tableName}\` LIMIT ${limit}`);
      
      res.json({
        success: true,
        data,
        count: data.length
      });
    } catch (error: any) {
      console.error('Error fetching staging data:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching staging data',
        error: error.message
      });
    }
  });

  // Get production table data
  router.get('/api/import/production-data/:tableName', async (req, res) => {
    try {
      const { tableName } = req.params;
      const limit = parseInt(req.query.limit as string) || 100;

      if (!dbPool) {
        return res.json({
          success: true,
          message: 'Database not connected - showing empty data',
          data: [],
          count: 0,
          databaseConnected: false
        });
      }

      const data = await executeQuery(dbPool, `SELECT * FROM \`${tableName}\` LIMIT ${limit}`);
      
      res.json({
        success: true,
        data,
        count: data.length
      });
    } catch (error: any) {
      console.error('Error fetching production data:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching production data',
        error: error.message
      });
    }
  });

  // Normalize existing production tables
  router.post('/api/import/normalize-existing', async (req, res) => {
    try {
      if (!dbPool) {
        return res.status(500).json({ success: false, message: 'Database pool not initialized' });
      }
      
      if (!dataImportService) {
        return res.status(500).json({ success: false, message: 'Data import service not initialized' });
      }
      
      console.log('Normalizing existing production tables...');
      const result = await dataImportService.normalizeExistingProductionTables();
      
      res.json(result);
    } catch (error: any) {
      console.error('Error normalizing existing tables:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error normalizing existing tables', 
        error: error.message 
      });
    }
  });

  // Normalize endpoint (alias)
  router.post('/api/import/normalize', async (req, res) => {
    try {
      if (!dbPool) {
        return res.status(500).json({ success: false, message: 'Database pool not initialized' });
      }
      
      if (!dataImportService) {
        return res.status(500).json({ success: false, message: 'Data import service not available' });
      }

      const result = await dataImportService.normalizeExistingProductionTables();
      res.json(result);
    } catch (error: any) {
      console.error('Error normalizing production tables:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error normalizing production tables', 
        error: error.message 
      });
    }
  });

  // Get normalized data overview
  router.get('/api/normalized/overview', async (req, res) => {
    try {
      if (!dbPool) {
        return res.json({ 
          success: true, 
          message: 'Database not connected - showing empty data',
          data: [],
          databaseConnected: false
        });
      }

      const query = `
        SELECT 'prod_acreage_schedule' as table_name, COUNT(*) as record_count FROM prod_acreage_schedule
        UNION ALL
        SELECT 'prod_oklahoma_pricing', COUNT(*) FROM prod_oklahoma_pricing
        UNION ALL
        SELECT 'prod_texas_pricing', COUNT(*) FROM prod_texas_pricing
        UNION ALL
        SELECT 'prod_unit_summary', COUNT(*) FROM prod_unit_summary
        ORDER BY table_name
      `;

      const rows = await executeQuery(dbPool, query);
      res.json({ success: true, data: rows });
    } catch (error: any) {
      console.error('Error fetching normalized overview:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching normalized overview', 
        error: error.message 
      });
    }
  });

  // Get pricing data summary
  router.get('/api/normalized/pricing-summary', async (req, res) => {
    try {
      if (!dbPool) {
        return res.json({ 
          success: true, 
          message: 'Database not connected - showing empty data',
          data: [],
          databaseConnected: false
        });
      }

      const query = `
        SELECT
          'Oklahoma' as formation,
          COUNT(*) as pricing_records,
          AVG(CAST(Unit_Price AS DECIMAL(10,2))) as avg_price,
          MIN(CAST(Unit_Price AS DECIMAL(10,2))) as min_price,
          MAX(CAST(Unit_Price AS DECIMAL(10,2))) as max_price
        FROM prod_oklahoma_pricing
        WHERE Unit_Price IS NOT NULL AND Unit_Price != '' AND Unit_Price != '0'
        UNION ALL
        SELECT
          'Texas' as formation,
          COUNT(*) as pricing_records,
          AVG(CAST(Output_Price AS DECIMAL(10,2))) as avg_price,
          MIN(CAST(Output_Price AS DECIMAL(10,2))) as min_price,
          MAX(CAST(Output_Price AS DECIMAL(10,2))) as max_price
        FROM prod_texas_pricing
        WHERE Output_Price IS NOT NULL AND Output_Price != '' AND Output_Price != '0'
        ORDER BY avg_price DESC
      `;

      const rows = await executeQuery(dbPool, query);
      res.json({ success: true, data: rows });
    } catch (error: any) {
      console.error('Error fetching pricing summary:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching pricing summary', 
        error: error.message 
      });
    }
  });

  // Get acreage data summary
  router.get('/api/normalized/acreage-summary', async (req, res) => {
    try {
      if (!dbPool) {
        return res.json({ 
          success: true, 
          message: 'Database not connected - showing empty data',
          data: [],
          databaseConnected: false
        });
      }

      const query = `
        SELECT 
          COUNTY as county,
          COUNT(DISTINCT OWNER) as unique_owners,
          COUNT(*) as mineral_interests,
          SUM(CAST(NMA AS DECIMAL(10,2))) as total_acres,
          AVG(CAST(\`CURRENT_ALLO_%\` AS DECIMAL(5,2))) as avg_interest
        FROM prod_acreage_schedule
        WHERE NMA IS NOT NULL AND NMA != '' AND NMA != '0'
        GROUP BY COUNTY
        ORDER BY total_acres DESC
      `;

      const rows = await executeQuery(dbPool, query);
      res.json({ success: true, data: rows });
    } catch (error: any) {
      console.error('Error fetching acreage summary:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching acreage summary', 
        error: error.message 
      });
    }
  });

  // Get unit/well data summary
  router.get('/api/normalized/unit-summary', async (req, res) => {
    try {
      if (!dbPool) {
        return res.json({ 
          success: true, 
          message: 'Database not connected - showing empty data',
          data: [],
          databaseConnected: false
        });
      }

      const query = `
        SELECT 
          'Production Data' as operator,
          COUNT(*) as total_units,
          COUNT(*) as total_wells,
          AVG(CAST(\`CURRENT_ALLO_%\` AS DECIMAL(5,2))) as avg_allocation,
          AVG(CAST(ROY AS DECIMAL(5,2))) as avg_pricing
        FROM prod_acreage_schedule
        WHERE \`CURRENT_ALLO_%\` IS NOT NULL AND \`CURRENT_ALLO_%\` != '' AND \`CURRENT_ALLO_%\` != '0'
        UNION ALL
        SELECT 
          'Oklahoma Pricing' as operator,
          COUNT(*) as total_units,
          COUNT(*) as total_wells,
          0 as avg_allocation,
          AVG(CAST(Unit_Price AS DECIMAL(10,2))) as avg_pricing
        FROM prod_oklahoma_pricing
        WHERE Unit_Price IS NOT NULL AND Unit_Price != '' AND Unit_Price != '0'
        UNION ALL
        SELECT 
          'Texas Pricing' as operator,
          COUNT(*) as total_units,
          COUNT(*) as total_wells,
          0 as avg_allocation,
          AVG(CAST(Output_Price AS DECIMAL(10,2))) as avg_pricing
        FROM prod_texas_pricing
        WHERE Output_Price IS NOT NULL AND Output_Price != '' AND Output_Price != '0'
        ORDER BY total_units DESC
      `;

      const rows = await executeQuery(dbPool, query);
      res.json({ success: true, data: rows });
    } catch (error: any) {
      console.error('Error fetching unit summary:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching unit summary', 
        error: error.message 
      });
    }
  });

  // Test endpoint for acreage
  router.get('/api/test-acreage', async (req, res) => {
    try {
      if (!dbPool) {
        return res.status(500).json({ success: false, message: 'Database pool not initialized' });
      }

      const query = `SELECT * FROM prod_acreage_schedule LIMIT 1`;
      const rows = await executeQuery(dbPool, query);
      res.json({ success: true, data: rows[0] });
    } catch (error: any) {
      console.error('Error testing acreage:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error testing acreage', 
        error: error.message 
      });
    }
  });

  // Test endpoint for pricing structure
  router.get('/api/test-pricing-structure', async (req, res) => {
    try {
      if (!dbPool) {
        return res.status(500).json({ success: false, message: 'Database pool not initialized' });
      }

      const oklahomaRows = await executeQuery(dbPool, `DESCRIBE prod_oklahoma_pricing`);
      const texasRows = await executeQuery(dbPool, `DESCRIBE prod_texas_pricing`);
      
      res.json({ 
        success: true, 
        data: {
          oklahoma_columns: oklahomaRows,
          texas_columns: texasRows
        }
      });
    } catch (error: any) {
      console.error('Error testing pricing structure:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error testing pricing structure', 
        error: error.message 
      });
    }
  });

  // Recreate acreage schedule
  router.get('/api/normalized/recreate-acreage-schedule', async (req, res) => {
    try {
      if (!dbPool) {
        return res.status(500).json({ success: false, message: 'Database pool not initialized' });
      }

      const query = `
        SELECT 
          COUNTY,
          S_T_R AS S_TR,
          LEGAL_DESCRIPTION,
          NMA,
          OWNER,
          OWNER_STREET,
          OWNER_CITY,
          OWNER_ST,
          OWNER_ZIP,
          PHONE_EMAIL,
          ROY,
          '0' AS ALLOCATION_PERCENT,
          TITLE_SOURCE,
          COALESCE(STATUS, 'Unknown') AS STATUS,
          COALESCE(BUYER, '') AS BUYER,
          COALESCE(NOTE, '') AS NOTE,
          id AS mineral_interest_id,
          id AS property_id,
          id AS owner_id,
          id AS county_id,
          id AS section_id,
          id AS state_id
        FROM prod_acreage_schedule
        ORDER BY COUNTY, S_T_R, OWNER
        LIMIT 1000
      `;

      const rows = await executeQuery(dbPool, query);
      res.json({ success: true, data: rows });
    } catch (error: any) {
      console.error('Error fetching acreage schedule:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching acreage schedule', 
        error: error.message 
      });
    }
  });

  // Get acreage summary statistics
  router.get('/api/normalized/acreage-summary-stats', async (req, res) => {
    try {
      if (!dbPool) {
        return res.status(500).json({ success: false, message: 'Database pool not initialized' });
      }

      const query = `
        SELECT 
          COUNT(*) as total_records,
          SUM(NMA) as total_acres,
          COUNT(DISTINCT OWNER) as unique_owners,
          COUNT(DISTINCT COUNTY) as unique_counties,
          0 as avg_allocation,
          COUNT(DISTINCT STATUS) as unique_statuses
        FROM prod_acreage_schedule
      `;

      const rows = await executeQuery(dbPool, query);
      res.json({ success: true, data: rows[0] });
    } catch (error: any) {
      console.error('Error fetching acreage summary stats:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching acreage summary stats', 
        error: error.message 
      });
    }
  });

  // Get acreage status breakdown
  router.get('/api/normalized/acreage-status-breakdown', async (req, res) => {
    try {
      if (!dbPool) {
        return res.status(500).json({ success: false, message: 'Database pool not initialized' });
      }

      const query = `
        SELECT 
          COALESCE(STATUS, 'Unknown') as status,
          COUNT(*) as count,
          SUM(NMA) as total_acres
        FROM prod_acreage_schedule
        GROUP BY STATUS
        ORDER BY count DESC
      `;

      const rows = await executeQuery(dbPool, query);
      res.json({ success: true, data: rows });
    } catch (error: any) {
      console.error('Error fetching acreage status breakdown:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching acreage status breakdown', 
        error: error.message 
      });
    }
  });

  // Get acreage county breakdown
  router.get('/api/normalized/acreage-county-breakdown', async (req, res) => {
    try {
      if (!dbPool) {
        return res.status(500).json({ success: false, message: 'Database pool not initialized' });
      }

      const query = `
        SELECT 
          COUNTY as county,
          OWNER_ST as state,
          COUNT(*) as count,
          SUM(NMA) as total_acres,
          COUNT(DISTINCT OWNER) as unique_owners
        FROM prod_acreage_schedule
        GROUP BY COUNTY, OWNER_ST
        ORDER BY count DESC
      `;

      const rows = await executeQuery(dbPool, query);
      res.json({ success: true, data: rows });
    } catch (error: any) {
      console.error('Error fetching acreage county breakdown:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching acreage county breakdown', 
        error: error.message 
      });
    }
  });

  // Update staging table record
  router.put('/api/import/staging-data/:tableName/:recordId', async (req, res) => {
    try {
      const { tableName, recordId } = req.params;
      const updateData = req.body;

      if (!dbPool) {
        return res.status(500).json({
          success: false,
          message: 'Database not connected'
        });
      }

      delete updateData.id;
      delete updateData.created_at;
      delete updateData.updated_at;

      const updateFields = Object.keys(updateData)
        .filter(key => updateData[key] !== undefined)
        .map(key => `\`${key}\` = ?`)
        .join(', ');

      if (updateFields.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No valid fields to update'
        });
      }

      const values = Object.keys(updateData)
        .filter(key => updateData[key] !== undefined)
        .map(key => updateData[key]);

      values.push(recordId);

      const query = `UPDATE \`${tableName}\` SET ${updateFields} WHERE id = ?`;
      
      const result = await executeQuery(dbPool, query, values);
      
      res.json({
        success: true,
        message: 'Record updated successfully',
        affectedRows: (result as any).affectedRows
      });
    } catch (error: any) {
      console.error('Error updating staging data:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating staging data',
        error: error.message
      });
    }
  });

  // Delete staging table record
  router.delete('/api/import/staging-data/:tableName/:recordId', async (req, res) => {
    try {
      const { tableName, recordId } = req.params;

      if (!dbPool) {
        return res.status(500).json({
          success: false,
          message: 'Database not connected'
        });
      }

      const query = `DELETE FROM \`${tableName}\` WHERE id = ?`;
      const result = await executeQuery(dbPool, query, [recordId]);
      
      res.json({
        success: true,
        message: 'Record deleted successfully',
        affectedRows: (result as any).affectedRows
      });
    } catch (error: any) {
      console.error('Error deleting staging data:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting staging data',
        error: error.message
      });
    }
  });

  // Approve import
  router.post('/api/import/approve', async (req, res) => {
    try {
      const { stagingTableName, productionTableName } = req.body;

      if (dataImportService) {
        const result = await dataImportService.approveImport(stagingTableName, productionTableName);
        return res.json(result);
      }

      if (!dbPool) {
        return res.status(500).json({
          success: false,
          message: 'Database not connected'
        });
      }

      await executeQuery(dbPool, `INSERT INTO ${productionTableName} SELECT * FROM ${stagingTableName}`);
      await executeQuery(dbPool, `DELETE FROM ${stagingTableName}`);
      
      res.json({
        success: true,
        message: 'Import approved successfully. Data moved to production.'
      });
    } catch (error: any) {
      console.error('Error approving import:', error);
      res.status(500).json({
        success: false,
        message: `Error approving import: ${error.message}`
      });
    }
  });

  // Delete staging table
  router.delete('/api/import/staging-table/:tableName', async (req, res) => {
    try {
      const { tableName } = req.params;

      if (dataImportService) {
        await dataImportService.deleteStagingTable(tableName);
        return res.json({
          success: true,
          message: `Staging table ${tableName} deleted successfully`
        });
      }

      if (!dbPool) {
        return res.status(500).json({
          success: false,
          message: 'Database not connected'
        });
      }

      await executeQuery(dbPool, `DROP TABLE IF EXISTS ${tableName}`);
      
      res.json({
        success: true,
        message: 'Staging table deleted successfully'
      });
    } catch (error: any) {
      console.error('Error deleting staging table:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error deleting staging table',
        error: error.message 
      });
    }
  });

  // Get table columns for comparison
  router.get('/api/import/table-columns/:tableName', async (req, res) => {
    try {
      const { tableName } = req.params;

      if (!dbPool) {
        return res.status(500).json({
          success: false,
          message: 'Database pool not initialized'
        });
      }

      const databaseName = process.env.MYSQL_DATABASE || 'soonermineraldb';
      const query = `
        SELECT COLUMN_NAME as columnName
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
        AND COLUMN_NAME NOT IN ('id', 'created_at', 'updated_at')
        ORDER BY ORDINAL_POSITION
      `;

      const columns = await executeQuery(dbPool, query, [databaseName, tableName]);
      
      res.json({
        success: true,
        columns: columns.map((row: any) => row.columnName)
      });
    } catch (error: any) {
      console.error('Error fetching table columns:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching table columns',
        error: error.message
      });
    }
  });

  // Get file columns before upload (for validation)
  router.post('/api/import/preview-columns', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      const fileExtension = path.extname(req.file.originalname).toLowerCase();
      let columns: string[] = [];

      if (fileExtension === '.csv') {
        columns = await extractColumnsFromCSV(req.file.path);
      } else if (fileExtension === '.xlsx' || fileExtension === '.xls') {
        columns = await extractColumnsFromExcel(req.file.path);
      } else {
        return res.status(400).json({
          success: false,
          message: `Unsupported file format: ${fileExtension}`
        });
      }

      res.json({
        success: true,
        columns,
        fileName: req.file.originalname
      });
    } catch (error: any) {
      console.error('Error previewing columns:', error);
      res.status(500).json({
        success: false,
        message: 'Error previewing columns',
        error: error.message
      });
    }
  });

  return router;
};

