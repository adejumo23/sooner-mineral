import { Router } from 'express';
import { 
  uploadFile, 
  validateFile, 
  approveImport, 
  getStagingTables, 
  getStagingTableData, 
  deleteStagingTable, 
  getTableSchema,
  upload 
} from '../services/importApi.js';

const router = Router();

// File upload endpoint
router.post('/upload', upload.single('file'), uploadFile);

// Validate file against schema
router.post('/validate', validateFile);

// Approve import
router.post('/approve', approveImport);

// Get all staging tables
router.get('/staging-tables', getStagingTables);

// Get staging table data
router.get('/staging-data/:tableName', getStagingTableData);

// Delete staging table
router.delete('/staging-table/:tableName', deleteStagingTable);

// Get table schema
router.get('/schema/:tableName', getTableSchema);

export default router;
