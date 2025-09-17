import { DataImportService, ImportResult } from './dataImportService.js';
import { Request, Response } from 'express';
import multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';

const dataImportService = new DataImportService();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/imports';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    const allowedExtensions = ['.csv', '.xls', '.xlsx'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (allowedMimes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV and Excel files (.csv, .xls, .xlsx) are allowed'));
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit for Excel files
  }
});

/**
 * Upload file and create staging/production tables
 */
export const uploadFile = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const result = await dataImportService.processFileUpload(
      req.file.path,
      req.file.originalname
    );

    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        stagingTableName: result.stagingTableName,
        productionTableName: result.productionTableName,
        recordCount: result.recordCount
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
        missingColumns: result.missingColumns,
        extraColumns: result.extraColumns
      });
    }
  } catch (error) {
    console.error('Error in uploadFile:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during file upload'
    });
  }
};

/**
 * Validate file against existing database schema
 */
export const validateFile = async (req: Request, res: Response) => {
  try {
    const { filePath, targetTableName } = req.body;

    if (!filePath || !targetTableName) {
      return res.status(400).json({
        success: false,
        message: 'filePath and targetTableName are required'
      });
    }

    const result = await dataImportService.validateFileAgainstSchema(filePath, targetTableName);

    if (result.success) {
      res.json({
        success: true,
        message: result.message
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
        missingColumns: result.missingColumns,
        extraColumns: result.extraColumns
      });
    }
  } catch (error) {
    console.error('Error in validateFile:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during file validation'
    });
  }
};

/**
 * Approve import and move data from staging to production
 */
export const approveImport = async (req: Request, res: Response) => {
  try {
    const { stagingTableName, productionTableName } = req.body;

    if (!stagingTableName || !productionTableName) {
      return res.status(400).json({
        success: false,
        message: 'stagingTableName and productionTableName are required'
      });
    }

    const result = await dataImportService.approveImport(stagingTableName, productionTableName);

    if (result.success) {
      res.json({
        success: true,
        message: result.message
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Error in approveImport:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during import approval'
    });
  }
};

/**
 * Get all staging tables
 */
export const getStagingTables = async (req: Request, res: Response) => {
  try {
    const stagingTables = await dataImportService.getStagingTables();
    
    res.json({
      success: true,
      stagingTables
    });
  } catch (error) {
    console.error('Error in getStagingTables:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching staging tables'
    });
  }
};

/**
 * Get staging table data
 */
export const getStagingTableData = async (req: Request, res: Response) => {
  try {
    const { tableName } = req.params;
    const { limit = 100 } = req.query;

    if (!tableName) {
      return res.status(400).json({
        success: false,
        message: 'tableName is required'
      });
    }

    const data = await dataImportService.getStagingTableData(tableName, Number(limit));
    
    res.json({
      success: true,
      data,
      count: data.length
    });
  } catch (error) {
    console.error('Error in getStagingTableData:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching staging table data'
    });
  }
};

/**
 * Delete staging table
 */
export const deleteStagingTable = async (req: Request, res: Response) => {
  try {
    const { tableName } = req.params;

    if (!tableName) {
      return res.status(400).json({
        success: false,
        message: 'tableName is required'
      });
    }

    await dataImportService.deleteStagingTable(tableName);
    
    res.json({
      success: true,
      message: 'Staging table deleted successfully'
    });
  } catch (error) {
    console.error('Error in deleteStagingTable:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while deleting staging table'
    });
  }
};

/**
 * Get table schema
 */
export const getTableSchema = async (req: Request, res: Response) => {
  try {
    const { tableName } = req.params;

    if (!tableName) {
      return res.status(400).json({
        success: false,
        message: 'tableName is required'
      });
    }

    const schema = await dataImportService.getTableSchema(tableName);
    
    res.json({
      success: true,
      schema
    });
  } catch (error) {
    console.error('Error in getTableSchema:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching table schema'
    });
  }
};

// Export multer middleware for use in routes
export { upload };
