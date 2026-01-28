import React, { useState, useRef, useCallback, useEffect } from 'react';
import './DataImportComponent.css';
import apiClient from '../services/apiClient';
import * as XLSX from 'xlsx';

interface ImportResult {
  success: boolean;
  message: string;
  stagingTableName?: string;
  productionTableName?: string;
  missingColumns?: string[];
  extraColumns?: string[];
  recordCount?: number;
}

interface StagingTable {
  tableName: string;
  recordCount: number;
}

interface UploadProgress {
  stage: 'uploading' | 'processing' | 'validating' | 'importing' | 'complete';
  progress: number;
  message: string;
}

const DataImportComponent: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [stagingTables, setStagingTables] = useState<StagingTable[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [tableData, setTableData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [showAllRows, setShowAllRows] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'staging' | 'production' | 'normalized'>('upload');
  const [productionData, setProductionData] = useState<any[]>([]);
  const [selectedProductionTable, setSelectedProductionTable] = useState<string>('');
  const [productionTables, setProductionTables] = useState<StagingTable[]>([]);
  const [showStagingSubTable, setShowStagingSubTable] = useState(false);
  const [currentUploadedTable, setCurrentUploadedTable] = useState<string>('');
  const [currentProductionTable, setCurrentProductionTable] = useState<string>('');
  
  // Normalized data state
  const [normalizedOverview, setNormalizedOverview] = useState<any[]>([]);
  const [pricingSummary, setPricingSummary] = useState<any[]>([]);
  const [acreageSummary, setAcreageSummary] = useState<any[]>([]);
  const [unitSummary, setUnitSummary] = useState<any[]>([]);
  
  // Column validation state
  const [columnWarnings, setColumnWarnings] = useState<{
    emptyColumns: string[];
    duplicateHeaders: string[];
    specialChars: string[];
    longNames: string[];
  }>({
    emptyColumns: [],
    duplicateHeaders: [],
    specialChars: [],
    longNames: []
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Drag and drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragActive(true);
    }
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type.includes('csv') || droppedFile.type.includes('excel') || droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.csv')) {
        setFile(droppedFile);
        setImportResult(null);
        setShowPreview(true);
        // Reset warnings
        setColumnWarnings({
          emptyColumns: [],
          duplicateHeaders: [],
          specialChars: [],
          longNames: []
        });
        handleFilePreview(droppedFile);
      } else {
        alert('Please upload a CSV or Excel file');
      }
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setImportResult(null);
      setShowPreview(true);
      // Reset warnings
      setColumnWarnings({
        emptyColumns: [],
        duplicateHeaders: [],
        specialChars: [],
        longNames: []
      });
      handleFilePreview(selectedFile);
    }
  };

  const analyzeColumns = (headers: string[], rows: any[]) => {
    const warnings = {
      emptyColumns: [] as string[],
      duplicateHeaders: [] as string[],
      specialChars: [] as string[],
      longNames: [] as string[]
    };
    
    // Check for empty columns
    headers.forEach((header, index) => {
      const isEmpty = rows.every(row => {
        const value = Object.values(row)[index];
        return !value || String(value).trim() === '';
      });
      if (isEmpty && rows.length > 0) {
        warnings.emptyColumns.push(header.trim());
      }
    });
    
    // Check for duplicate headers
    const headerCounts: { [key: string]: number } = {};
    headers.forEach(header => {
      const trimmed = header.trim();
      headerCounts[trimmed] = (headerCounts[trimmed] || 0) + 1;
    });
    Object.entries(headerCounts).forEach(([header, count]) => {
      if (count > 1) {
        warnings.duplicateHeaders.push(header);
      }
    });
    
    // Check for special characters in headers
    headers.forEach(header => {
      const trimmed = header.trim();
      if (/[^a-zA-Z0-9_\s-]/.test(trimmed)) {
        warnings.specialChars.push(trimmed);
      }
    });
    
    // Check for very long column names
    headers.forEach(header => {
      if (header.trim().length > 50) {
        warnings.longNames.push(header.trim());
      }
    });
    
    setColumnWarnings(warnings);
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          current += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // End of field
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    // Add last field
    result.push(current.trim());
    return result;
  };

  const handleFilePreview = (file: File) => {
    const fileName = file.name.toLowerCase();
    const isCSV = fileName.endsWith('.csv');
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
    
    if (!isCSV && !isExcel) {
      alert('Please upload a CSV or Excel file (.csv, .xlsx, .xls)');
      setPreviewData([]);
      return;
    }

    if (isCSV) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          if (!text || text.trim().length === 0) {
            setPreviewData([]);
            return;
          }
          
          // Handle different line endings
          const lines = text.split(/\r?\n/).filter(line => line.trim());
          if (lines.length === 0) {
            setPreviewData([]);
            return;
          }
          
          // Parse header with proper CSV handling
          const headers = parseCSVLine(lines[0]).map(h => h.replace(/^"|"$/g, '').trim());
          
          // Parse rows (limit to first 5 for preview)
          const rows = lines.slice(1, 6).map(line => {
            const values = parseCSVLine(line);
            const row: any = {};
            headers.forEach((header, index) => {
              let value = values[index] || '';
              // Remove surrounding quotes if present
              value = value.replace(/^"|"$/g, '');
              row[header] = value.trim();
            });
            return row;
          });
          
          setPreviewData(rows);
          analyzeColumns(headers, rows);
        } catch (error) {
          console.error('Error parsing CSV file:', error);
          alert('Error reading CSV file. Please check the file format.');
          setPreviewData([]);
        }
      };
      reader.onerror = () => {
        alert('Error reading file');
        setPreviewData([]);
      };
      reader.readAsText(file);
    } else if (isExcel) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'array' });
          
          if (workbook.SheetNames.length === 0) {
            alert('Excel file has no sheets');
            setPreviewData([]);
            return;
          }
          
          // Use first sheet
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          // Convert to JSON with header row
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];
          
          if (jsonData.length === 0) {
            setPreviewData([]);
            return;
          }
          
          // First row is headers
          const headers = jsonData[0].map((h: any) => String(h || '').trim()).filter((h: string) => h.length > 0);
          
          if (headers.length === 0) {
            alert('Excel file has no column headers');
            setPreviewData([]);
            return;
          }
          
          // Convert remaining rows to objects (limit to first 5 for preview)
          const rows = jsonData.slice(1, 6).map((row: any[]) => {
            const rowObj: any = {};
            headers.forEach((header, index) => {
              const value = row[index];
              rowObj[header] = value !== null && value !== undefined ? String(value).trim() : '';
            });
            return rowObj;
          });
          
          setPreviewData(rows);
          analyzeColumns(headers, rows);
        } catch (error) {
          console.error('Error parsing Excel file:', error);
          alert('Error reading Excel file. Please check the file format.');
          setPreviewData([]);
        }
      };
      reader.onerror = () => {
        alert('Error reading file');
        setPreviewData([]);
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const simulateProgress = () => {
    const stages = [
      { stage: 'uploading' as const, progress: 25, message: 'Uploading file...' },
      { stage: 'processing' as const, progress: 50, message: 'Processing file...' },
      { stage: 'validating' as const, progress: 75, message: 'Validating data...' },
      { stage: 'importing' as const, progress: 90, message: 'Importing to staging...' },
      { stage: 'complete' as const, progress: 100, message: 'Import complete!' }
    ];

    stages.forEach((stage, index) => {
      setTimeout(() => {
        setUploadProgress(stage);
        if (index === stages.length - 1) {
          setUploading(false);
          setUploadProgress(null);
        }
      }, index * 1000);
    });
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setImportResult(null);
    simulateProgress();

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const result = await apiClient.uploadFile(formData);
      console.log('Upload result:', result);
      console.log('Upload result details:', {
        success: result.success,
        stagingTableName: result.stagingTableName,
        recordCount: result.recordCount,
        message: result.message
      });
      setImportResult(result);
      
      if (result.success) {
        if (!result.stagingTableName) {
          console.error('Upload succeeded but no stagingTableName returned:', result);
          setImportResult({
            ...result,
            success: false,
            message: result.message || 'Upload succeeded but no staging table was created. Please check the backend server.'
          });
          return;
        }
        
        console.log('Upload successful, staging table:', result.stagingTableName);
        
        // Wait a bit for the database to finish processing
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Fetch staging tables list first
        const stagingTablesResult = await fetchStagingTables();
        console.log('Staging tables fetched:', stagingTablesResult);
        
        // Verify the table actually exists in the list
        const tableExists = stagingTablesResult.tables?.some(
          (t: any) => t.tableName === result.stagingTableName
        ) || stagingTablesResult.tables?.length === 0; // If list is empty, we can't verify
        
        if (!tableExists && stagingTablesResult.tables && stagingTablesResult.tables.length > 0) {
          console.error('⚠️ WARNING: Upload reported success but table not found in staging tables list!');
          console.error('Upload said table:', result.stagingTableName);
          console.error('Staging tables list:', stagingTablesResult.tables);
          setImportResult({
            ...result,
            success: false,
            message: `Upload reported success, but table "${result.stagingTableName}" was not found in the database. The backend may not be properly connected to the database.`
          });
          return;
        }
        
        setShowPreview(false);
        setActiveTab('staging');
        
        // Automatically show the uploaded data
        console.log('Setting staging table:', result.stagingTableName);
        setCurrentUploadedTable(result.stagingTableName);
        setSelectedTable(result.stagingTableName);
        setShowStagingSubTable(true);
        
        // Wait a bit more before fetching data to ensure table is ready
        // Increased delay to allow database to fully process the import
        console.log('Waiting for database to process...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('Fetching table data for:', result.stagingTableName);
        const dataResult = await fetchTableData(result.stagingTableName, 0);
        
        // Verify data was actually retrieved
        if (tableData.length === 0 && result.recordCount && result.recordCount > 0) {
          console.error('⚠️ WARNING: Upload reported', result.recordCount, 'records but table is empty!');
          console.error('This indicates the data was not actually inserted into the database.');
          setImportResult({
            ...result,
            success: false,
            message: `Upload reported ${result.recordCount} records imported, but the table is empty. The backend may not be properly connected to the database, or the data insertion failed silently.`
          });
        }
      } else {
        console.error('Upload failed:', result.message);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setImportResult({
        success: false,
        message: 'Upload failed. Please try again.'
      });
    } finally {
      setUploading(false);
    }
  };

  // Fetch staging tables
  const fetchStagingTables = async () => {
    try {
      console.log('Fetching staging tables list...');
      const response = await apiClient.fetchStagingTables();
      console.log('Staging tables response:', response);
      
      if (response.success) {
        // Handle both response structures: stagingTables array or data array
        const tableNames = response.stagingTables || response.data || [];
        const tables = Array.isArray(tableNames) ? tableNames.map((tableName: string) => ({
          tableName,
          recordCount: 0
        })) : [];
        console.log('Setting staging tables:', tables);
        setStagingTables(tables);
        return { success: true, tables };
      } else {
        console.error('Failed to fetch staging tables:', response.message);
        setStagingTables([]);
        return { success: false, error: response.message };
      }
    } catch (error) {
      console.error('Error fetching staging tables:', error);
      setStagingTables([]);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  // Fetch production tables
  const fetchProductionTables = async () => {
    try {
      const response = await apiClient.fetchProductionTables();
      if (response.success) {
        // Handle both response structures: productionTables array or data array
        const tableNames = response.productionTables || response.data || [];
        const tables = Array.isArray(tableNames) ? tableNames.map((tableName: string) => ({
          tableName,
          recordCount: 0
        })) : [];
        setProductionTables(tables);
      } else {
        console.error('Failed to fetch production tables:', response.message);
        setProductionTables([]);
      }
    } catch (error) {
      console.error('Error fetching production tables:', error);
      setProductionTables([]);
    }
  };

  // Fetch table data
  const fetchTableData = async (tableName: string, retryCount = 0) => {
    if (!tableName) {
      console.warn('fetchTableData called without tableName');
      return;
    }
    
    setLoading(true);
    try {
      console.log('Fetching data for table:', tableName);
      // Fetch a large number of rows to show all data (10000 should be enough for most cases)
      const response = await apiClient.fetchStagingTableData(tableName, 10000);
      console.log('API response:', response);
      console.log('Response data type:', typeof response?.data, 'Is array:', Array.isArray(response?.data));
      console.log('Response data length:', response?.data?.length);
      
      if (response && response.success) {
        // Check if this is mock data (backend not connected)
        if (response._isMock) {
          console.error('⚠️ Backend server is not available - using mock empty data');
          setTableData([]);
          setImportResult(prev => prev ? {
            ...prev,
            success: false,
            message: prev.message + ' (Backend server not connected - data not actually imported)'
          } : null);
          return;
        }
        
        const data = response.data;
        if (Array.isArray(data)) {
          console.log('Setting table data:', data.length, 'rows');
          setTableData(data);
          
          // Check if upload reported records but data is empty
          if (data.length === 0 && importResult?.success && importResult?.recordCount && importResult.recordCount > 0) {
            console.error('⚠️ CRITICAL: Upload reported', importResult.recordCount, 'records but table is empty!');
            console.error('This indicates the data was NOT actually inserted into the database.');
            console.error('Possible causes:');
            console.error('  1. Database connection is not established');
            console.error('  2. Data insertion failed silently');
            console.error('  3. Transaction was rolled back');
            console.error('  4. Table was created but data insert failed');
            
            // Update import result to reflect the actual state
            setImportResult(prev => prev ? {
              ...prev,
              success: false,
              message: `Upload reported ${prev.recordCount} records, but the table is empty. The data was not actually inserted into the database. Please check the backend server logs and database connection.`
            } : null);
          } else if (data.length === 0) {
            console.warn('⚠️ Table data is empty. This could mean:', {
              tableEmpty: 'Table exists but has no data',
              databaseNotConnected: 'Database connection may not be established',
              uploadFailed: 'Data may not have been inserted during upload',
              tableName
            });
          }
        } else if (data && typeof data === 'object') {
          // Handle case where data might be wrapped
          const dataArray = Array.isArray(data.data) ? data.data : [];
          console.log('Setting table data (wrapped):', dataArray.length, 'rows');
          setTableData(dataArray);
        } else {
          console.warn('Unexpected data format:', data);
          setTableData([]);
        }
      } else {
        console.error('Failed to fetch table data:', response?.message || 'Unknown error', response);
        setTableData([]);
      }
    } catch (error) {
      console.error('Error fetching table data:', error);
      setTableData([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle table selection
  const handleTableSelect = (tableName: string) => {
    console.log('Table selected:', tableName);
    setSelectedTable(tableName);
    setCurrentPage(1);
    setSearchTerm('');
    setSortConfig(null);
    setShowStagingSubTable(true);
    setShowAllRows(false); // Reset show all when selecting new table
    fetchTableData(tableName, 0);
  };

  // Handle production table selection
  const handleProductionTableSelect = (tableName: string) => {
    setSelectedProductionTable(tableName);
    fetchProductionData(tableName);
    setCurrentPage(1);
  };

  // Fetch production data
  const fetchProductionData = async (tableName: string) => {
    setLoading(true);
    try {
      console.log('Fetching production data for table:', tableName);
      // Fetch a large number of rows to show all data (10000 should be enough for most cases)
      const response = await apiClient.fetchProductionTableData(tableName, 10000);
      console.log('Production API response:', response);
      
      if (response && response.success && response.data) {
        console.log('Setting production data:', response.data);
        setProductionData(Array.isArray(response.data) ? response.data : []);
      } else {
        console.error('Failed to fetch production data:', response?.message || 'Unknown error');
        setProductionData([]);
      }
    } catch (error) {
      console.error('Error fetching production data:', error);
      setProductionData([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch normalized data
  const fetchNormalizedData = async () => {
    try {
      const [overviewRes, pricingRes, acreageRes, unitRes] = await Promise.all([
        apiClient.fetchNormalizedOverview(),
        apiClient.fetchPricingSummary(),
        apiClient.fetchAcreageSummary(),
        apiClient.fetchUnitSummary()
      ]);

      if (overviewRes.success && Array.isArray(overviewRes.data)) {
        setNormalizedOverview(overviewRes.data);
      }
      if (pricingRes.success && Array.isArray(pricingRes.data)) {
        setPricingSummary(pricingRes.data);
      }
      if (acreageRes.success && Array.isArray(acreageRes.data)) {
        setAcreageSummary(acreageRes.data);
      }
      if (unitRes.success && Array.isArray(unitRes.data)) {
        setUnitSummary(unitRes.data);
      }
    } catch (error) {
      console.error('Error fetching normalized data:', error);
    }
  };

  // Sorting functionality
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Filter and sort data
  const getFilteredAndSortedData = () => {
    const dataToFilter = activeTab === 'production' ? productionData : tableData;
    let filtered = dataToFilter;
    
    if (searchTerm) {
      filtered = dataToFilter.filter(row =>
        Object.values(row).some(value =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    if (sortConfig) {
      filtered = [...filtered].sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  };

  // Pagination
  const getPaginatedData = () => {
    const filtered = getFilteredAndSortedData();
    if (showAllRows) {
      return filtered; // Return all rows when "Show All" is enabled
    }
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filtered.slice(startIndex, startIndex + itemsPerPage);
  };

  // Row selection
  const handleRowSelect = (rowId: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(rowId)) {
      newSelected.delete(rowId);
    } else {
      newSelected.add(rowId);
    }
    setSelectedRows(newSelected);
  };

  const handleSelectAll = () => {
    const paginatedData = getPaginatedData();
    if (selectedRows.size === paginatedData.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(paginatedData.map((row: any) => row.id)));
    }
  };

  // Edit functionality
  const startEditing = (rowId: string, rowData: any) => {
    setEditingRow(rowId);
    setEditingData({ ...rowData });
  };

  const cancelEditing = () => {
    setEditingRow(null);
    setEditingData({});
  };

  const handleEditChange = (key: string, value: string) => {
    setEditingData(prev => ({ ...prev, [key]: value }));
  };

  const saveEditing = async () => {
    if (!editingRow) return;
    
    setSaving(true);
    try {
      await apiClient.updateStagingRecord(selectedTable, editingRow, editingData);
      await fetchTableData(selectedTable);
      setEditingRow(null);
      setEditingData({});
    } catch (error) {
      console.error('Error updating record:', error);
    } finally {
      setSaving(false);
    }
  };

  const deleteRecord = async (rowId: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    
    try {
      await apiClient.deleteStagingRecord(selectedTable, rowId);
      await fetchTableData(selectedTable);
    } catch (error) {
      console.error('Error deleting record:', error);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedRows.size} records?`)) return;
    
    try {
      for (const rowId of selectedRows) {
        await apiClient.deleteStagingRecord(selectedTable, rowId);
      }
      await fetchTableData(selectedTable);
      setSelectedRows(new Set());
    } catch (error) {
      console.error('Error deleting records:', error);
    }
  };


  const moveToProduction = async () => {
    if (!selectedTable || !importResult?.productionTableName) {
      alert('No staging table selected or production table not available');
      return;
    }
    
    try {
      const result = await apiClient.approveImport(
        selectedTable,
        importResult.productionTableName
      );
      
      if (result.success) {
        // Refresh both staging and production tables
        await fetchStagingTables();
        await fetchProductionTables();
        
        // Switch to production tab and show the moved data
        setActiveTab('production');
        setCurrentProductionTable(importResult.productionTableName);
        setSelectedProductionTable(importResult.productionTableName);
        await fetchProductionData(importResult.productionTableName);
        
        // Clear staging selection
        setSelectedTable('');
        setTableData([]);
        setShowStagingSubTable(false);
        setCurrentUploadedTable('');
        
        alert('Data moved to production successfully!');
      } else {
        alert('Failed to move to production: ' + result.message);
      }
    } catch (error) {
      console.error('Error moving to production:', error);
      alert('Error moving to production');
    }
  };

  const deleteStagingTable = async (tableName: string) => {
    if (!confirm(`Are you sure you want to delete staging table ${tableName}?`)) return;
    
    try {
      await apiClient.deleteStagingTable(tableName);
      await fetchStagingTables();
      if (selectedTable === tableName) {
        setSelectedTable('');
        setTableData([]);
        setShowStagingSubTable(false);
      }
      if (currentUploadedTable === tableName) {
        setCurrentUploadedTable('');
      }
    } catch (error) {
      console.error('Error deleting staging table:', error);
    }
  };

  // Load tables on component mount
  useEffect(() => {
    fetchStagingTables();
    fetchProductionTables();
    fetchNormalizedData();
  }, []);

  const filteredData = getFilteredAndSortedData();
  const paginatedData = getPaginatedData();
  const totalPages = showAllRows ? 1 : Math.ceil(filteredData.length / itemsPerPage);

  return (
    <div className="data-import-container">
      {/* Header */}
      <div className="import-header">
        <div className="header-content">
          <div className="header-icon">📊</div>
          <div className="header-text">
            <h1>Data Import & Management</h1>
            <p>Upload, preview, and manage your data imports with advanced editing capabilities</p>
          </div>
        </div>
        <div className="header-stats">
          <div className="stat-card">
            <div className="stat-number">{stagingTables.length}</div>
            <div className="stat-label">Staging Tables</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{tableData.length}</div>
            <div className="stat-label">Current Records</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{filteredData.length}</div>
            <div className="stat-label">Filtered Records</div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={`tab-btn ${activeTab === 'upload' ? 'active' : ''}`}
          onClick={() => setActiveTab('upload')}
        >
          📤 Upload
        </button>
        <button 
          className={`tab-btn ${activeTab === 'staging' ? 'active' : ''}`}
          onClick={() => setActiveTab('staging')}
        >
          🗂️ Staging Tables ({stagingTables.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'production' ? 'active' : ''}`}
          onClick={() => setActiveTab('production')}
        >
          🏭 Production Tables ({productionTables.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'normalized' ? 'active' : ''}`}
          onClick={() => setActiveTab('normalized')}
        >
          📊 Normalized Data
        </button>
      </div>

      {/* Upload Tab */}
      {activeTab === 'upload' && (
        <div className="tab-content">
          {/* Help Guide Section */}
          <div className="help-guide-section" style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
            color: 'white'
          }}>
            <div style={{ display: 'flex', alignItems: 'start', gap: '16px' }}>
              <div style={{ fontSize: '32px' }}>💡</div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '20px', fontWeight: 'bold' }}>
                  How Data Import Works
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginTop: '16px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.1)', padding: '12px', borderRadius: '8px' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>1️⃣ Upload Your File</div>
                    <div style={{ fontSize: '14px', opacity: 0.9 }}>Upload a CSV or Excel file. The system will automatically detect your columns.</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.1)', padding: '12px', borderRadius: '8px' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>2️⃣ Preview & Validate</div>
                    <div style={{ fontSize: '14px', opacity: 0.9 }}>Review your data preview. Check for empty columns, formatting issues, or missing data.</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.1)', padding: '12px', borderRadius: '8px' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>3️⃣ Import to Staging</div>
                    <div style={{ fontSize: '14px', opacity: 0.9 }}>Your data goes to a staging area where you can review and edit before final import.</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.1)', padding: '12px', borderRadius: '8px' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>4️⃣ Move to Production</div>
                    <div style={{ fontSize: '14px', opacity: 0.9 }}>Once verified, move your data to production where it's ready to use.</div>
                  </div>
                </div>
                <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(255,255,255,0.15)', borderRadius: '8px', fontSize: '14px' }}>
                  <strong>💡 Tip:</strong> Column names in your file will be automatically cleaned (spaces → underscores, special characters removed). 
                  Make sure your first row contains clear column headers. Empty columns will be preserved but may cause issues later.
                </div>
              </div>
            </div>
          </div>

          <div className="upload-section">
            <div className="section-title">
              <h3>📤 File Upload</h3>
              <p>Upload your data files to create staging tables</p>
            </div>
            
            <div 
              ref={dropZoneRef}
              className={`drop-zone ${dragActive ? 'active' : ''} ${file ? 'has-file' : ''}`}
              onDragEnter={handleDragIn}
              onDragLeave={handleDragOut}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              
              {file ? (
                <div className="file-selected">
                  <div className="file-icon">📄</div>
                  <div className="file-info">
                    <div className="file-name">{file.name}</div>
                    <div className="file-size">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                  </div>
                  <button 
                    className="remove-file-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                      setShowPreview(false);
                    }}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="drop-content">
                  <div className="drop-icon">📁</div>
                  <div className="drop-text">
                    <h3>Drag & drop your file here</h3>
                    <p>or click to browse</p>
                    <div className="supported-formats">Supports: CSV, Excel (.xlsx, .xls)</div>
                  </div>
                </div>
              )}
            </div>

            {file && (
              <div className="file-actions">
                <button 
                  className="preview-btn"
                  onClick={() => setShowPreview(!showPreview)}
                >
                  {showPreview ? '👁️‍🗨️ Hide Preview' : '👁️ Preview Data'}
                </button>
                <button 
                  className="upload-btn primary"
                  onClick={handleUpload}
                  disabled={uploading}
                >
                  {uploading ? '⏳ Uploading...' : '🚀 Upload File'}
                </button>
              </div>
            )}

            {/* Upload Progress */}
            {uploadProgress && (
              <div className="upload-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${uploadProgress.progress}%` }}
                  ></div>
                </div>
                <div className="progress-text">{uploadProgress.message}</div>
              </div>
            )}

            {/* File Preview */}
            {showPreview && (
              <div className="file-preview">
                {previewData.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                    <p>No preview data available. Please select a valid CSV or Excel file.</p>
                    <p style={{ fontSize: '12px', marginTop: '8px' }}>
                      Make sure the file has headers in the first row and at least one data row.
                    </p>
                  </div>
                ) : (
                  <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h4>📋 Data Preview (First 5 rows)</h4>
                  <div style={{ fontSize: '14px', color: '#666' }}>
                    {Object.keys(previewData[0] || {}).length} columns detected
                  </div>
                </div>
                
                {/* Column Validation Warnings */}
                {(columnWarnings.emptyColumns.length > 0 || 
                  columnWarnings.duplicateHeaders.length > 0 || 
                  columnWarnings.specialChars.length > 0 ||
                  columnWarnings.longNames.length > 0) && (
                  <div style={{
                    background: '#fff3cd',
                    border: '1px solid #ffc107',
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '16px'
                  }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '12px', color: '#856404' }}>
                      ⚠️ Column Validation Warnings
                    </div>
                    <div style={{ fontSize: '14px', color: '#856404' }}>
                      {columnWarnings.emptyColumns.length > 0 && (
                        <div style={{ marginBottom: '8px' }}>
                          <strong>Empty Columns:</strong> {columnWarnings.emptyColumns.join(', ')}
                          <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.8 }}>
                            These columns appear to have no data. Consider removing them or checking your file.
                          </div>
                        </div>
                      )}
                      {columnWarnings.duplicateHeaders.length > 0 && (
                        <div style={{ marginBottom: '8px' }}>
                          <strong>Duplicate Headers:</strong> {columnWarnings.duplicateHeaders.join(', ')}
                          <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.8 }}>
                            Duplicate column names will be renamed automatically (e.g., "Column_1", "Column_2").
                          </div>
                        </div>
                      )}
                      {columnWarnings.specialChars.length > 0 && (
                        <div style={{ marginBottom: '8px' }}>
                          <strong>Special Characters:</strong> {columnWarnings.specialChars.join(', ')}
                          <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.8 }}>
                            Special characters in column names will be replaced with underscores automatically.
                          </div>
                        </div>
                      )}
                      {columnWarnings.longNames.length > 0 && (
                        <div style={{ marginBottom: '8px' }}>
                          <strong>Long Column Names:</strong> {columnWarnings.longNames.length} column(s) exceed 50 characters
                          <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.8 }}>
                            Very long column names may be truncated. Consider using shorter names.
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Success message if no warnings */}
                {columnWarnings.emptyColumns.length === 0 && 
                 columnWarnings.duplicateHeaders.length === 0 && 
                 columnWarnings.specialChars.length === 0 &&
                 columnWarnings.longNames.length === 0 && (
                  <div style={{
                    background: '#d4edda',
                    border: '1px solid #28a745',
                    borderRadius: '8px',
                    padding: '12px',
                    marginBottom: '16px',
                    color: '#155724'
                  }}>
                    ✅ Your file looks good! All columns have data and headers are properly formatted.
                  </div>
                )}
                
                <div className="preview-table" style={{ overflowX: 'auto', maxHeight: '400px', overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 10 }}>
                      <tr>
                        {Object.keys(previewData[0] || {}).map((header, idx) => {
                          const isEmpty = columnWarnings.emptyColumns.includes(header);
                          return (
                            <th 
                              key={header} 
                              style={{
                                padding: '8px',
                                border: '1px solid #dee2e6',
                                background: isEmpty ? '#fff3cd' : '#f8f9fa',
                                fontWeight: 'bold',
                                textAlign: 'left'
                              }}
                            >
                              {header}
                              {isEmpty && <span style={{ fontSize: '10px', color: '#856404', marginLeft: '4px' }}>⚠️</span>}
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((row, index) => (
                        <tr key={index}>
                          {Object.entries(row).map(([key, value], cellIndex) => {
                            const isEmpty = columnWarnings.emptyColumns.includes(key);
                            return (
                              <td 
                                key={cellIndex}
                                style={{
                                  padding: '8px',
                                  border: '1px solid #dee2e6',
                                  background: isEmpty ? '#fff3cd' : 'white'
                                }}
                              >
                                {String(value) || <span style={{ color: '#999', fontStyle: 'italic' }}>empty</span>}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ marginTop: '12px', fontSize: '12px', color: '#666', fontStyle: 'italic' }}>
                  💡 Tip: Review the preview carefully. You can edit data after import in the Staging Tables tab.
                </div>
                  </>
                )}
              </div>
            )}

            {/* Import Result */}
            {importResult && (
              <div className={`import-result ${importResult.success ? 'success' : 'error'}`}>
                <div className="result-icon">
                  {importResult.success ? '✅' : '❌'}
                </div>
                <div className="result-content">
                  <h4>{importResult.success ? 'Import Successful!' : 'Import Failed'}</h4>
                  <p>{importResult.message}</p>
                  {importResult.recordCount && (
                    <p>Records imported: {importResult.recordCount}</p>
                  )}
                  
                  {/* Show missing/extra columns if validation failed */}
                  {!importResult.success && (
                    <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(255,0,0,0.1)', borderRadius: '8px' }}>
                      {importResult.missingColumns && importResult.missingColumns.length > 0 && (
                        <div style={{ marginBottom: '8px' }}>
                          <strong>Missing Required Columns:</strong>
                          <ul style={{ marginTop: '4px', paddingLeft: '20px' }}>
                            {importResult.missingColumns.map((col, idx) => (
                              <li key={idx}>{col}</li>
                            ))}
                          </ul>
                          <div style={{ fontSize: '12px', marginTop: '4px', color: '#666' }}>
                            Your file must include these columns. Please add them to your file and try again.
                          </div>
                        </div>
                      )}
                      {importResult.extraColumns && importResult.extraColumns.length > 0 && (
                        <div>
                          <strong>Unexpected Columns:</strong>
                          <ul style={{ marginTop: '4px', paddingLeft: '20px' }}>
                            {importResult.extraColumns.map((col, idx) => (
                              <li key={idx}>{col}</li>
                            ))}
                          </ul>
                          <div style={{ fontSize: '12px', marginTop: '4px', color: '#666' }}>
                            These columns are not expected. You can remove them or they will be ignored during import.
                          </div>
                        </div>
                      )}
                      <div style={{ marginTop: '12px', padding: '8px', background: 'rgba(255,255,255,0.5)', borderRadius: '4px' }}>
                        <strong>How to Fix:</strong>
                        <ol style={{ marginTop: '4px', paddingLeft: '20px', fontSize: '12px' }}>
                          <li>Check your file's first row - it should contain column headers</li>
                          <li>Make sure column names match exactly (case-sensitive)</li>
                          <li>Remove any extra columns you don't need</li>
                          <li>Add any missing required columns</li>
                          <li>Save your file and try uploading again</li>
                        </ol>
                      </div>
                    </div>
                  )}
                  
                  {importResult.success && (
                    <div className="result-actions">
                      <p className="next-step">✅ File uploaded successfully! Data is now displayed in the Staging Tables tab below.</p>
                      <div style={{ marginTop: '12px', padding: '12px', background: '#e7f3ff', borderRadius: '8px', fontSize: '14px' }}>
                        <strong>Next Steps:</strong>
                        <ol style={{ marginTop: '8px', paddingLeft: '20px' }}>
                          <li>Go to the "Staging Tables" tab to review your data</li>
                          <li>Edit any records that need correction</li>
                          <li>Click "Move to Production" when you're ready</li>
                        </ol>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Staging Tables Tab */}
      {activeTab === 'staging' && (
        <div className="tab-content">
          <div className="staging-section">
            <div className="section-header">
              <div className="section-title">
                <h3>🗂️ Staging Tables</h3>
                <p>Review and edit your imported data before moving to production. Data from your latest upload is shown below.</p>
              </div>
              <button 
                className="refresh-btn"
                onClick={async () => {
                  try {
                    await fetchStagingTables();
                    if (selectedTable) {
                      await fetchTableData(selectedTable);
                    }
                  } catch (error) {
                    console.error('Error refreshing:', error);
                  }
                }}
              >
                🔄 Refresh
              </button>
            </div>
            
            {/* Connection Error Warning */}
            {importResult && !importResult.success && importResult.message?.includes('Server not available') && (
              <div style={{
                padding: '16px',
                marginBottom: '20px',
                background: '#fff3cd',
                border: '1px solid #ffc107',
                borderRadius: '8px',
                color: '#856404'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '20px' }}>⚠️</span>
                  <strong>Backend Server Not Available</strong>
                </div>
                <p style={{ margin: 0, fontSize: '14px' }}>
                  The application cannot connect to the backend server. Please ensure the backend server is running.
                  {importResult.message && <span> Error: {importResult.message}</span>}
                </p>
              </div>
            )}

            {currentUploadedTable ? (
              <div className="current-upload-section">
                <div className="current-upload-card">
                  <div className="table-icon">📊</div>
                  <div className="table-info">
                    <div className="table-name">{currentUploadedTable}</div>
                    <div className="table-count">
                      {importResult?.recordCount ? `${importResult.recordCount} records` : 'Current Upload'}
                    </div>
                  </div>
                  <div className="table-actions">
                    <button 
                      className="action-btn view-btn"
                      onClick={() => handleTableSelect(currentUploadedTable)}
                      title="View & Edit Data"
                    >
                      ✏️
                    </button>
                    <button 
                      className="action-btn delete-btn"
                      onClick={() => deleteStagingTable(currentUploadedTable)}
                      title="Delete Table"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ) : file && !importResult ? (
              <div className="no-tables" style={{ padding: '20px', background: '#fff3cd', borderRadius: '8px', border: '1px solid #ffc107' }}>
                <div className="no-tables-icon">⚠️</div>
                <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>File selected but not uploaded yet</p>
                <p style={{ fontSize: '14px', color: '#666' }}>
                  You have a file selected with preview data, but you need to click the "🚀 Upload File" button 
                  in the Upload tab to actually import the data to the staging tables.
                </p>
                <button
                  onClick={() => setActiveTab('upload')}
                  style={{
                    marginTop: '12px',
                    padding: '8px 16px',
                    background: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Go to Upload Tab
                </button>
              </div>
            ) : (
              <div className="no-tables">
                <div className="no-tables-icon">📭</div>
                <p>No file uploaded yet. Upload a file to get started!</p>
              </div>
            )}

            {/* Staging Data Sub-Table */}
            {showStagingSubTable && selectedTable && (
              <div className="staging-sub-table">
                <div className="sub-table-header">
                  <div className="sub-table-title">
                    <h4>📋 {selectedTable} - Staging Data</h4>
                    <p>Review and edit your data before moving to production</p>
                  </div>
                  <div className="sub-table-actions">
                    <button 
                      className="move-to-production-btn"
                      onClick={moveToProduction}
                      disabled={!importResult?.productionTableName}
                    >
                      🚀 Move to Production
                    </button>
                    <button 
                      className="close-sub-table-btn"
                      onClick={() => {
                        setShowStagingSubTable(false);
                        setSelectedTable('');
                        setTableData([]);
                      }}
                    >
                      ✕ Close
                    </button>
                  </div>
                </div>

                {loading ? (
                  <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Loading data...</p>
                  </div>
                ) : tableData.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
                    <h4>No data found in this table</h4>
                    <p style={{ marginTop: '8px', fontSize: '14px' }}>
                      The table "{selectedTable}" exists but contains no data.
                    </p>
                    <div style={{ 
                      marginTop: '16px', 
                      padding: '12px', 
                      background: '#fff3cd', 
                      borderRadius: '8px', 
                      border: '1px solid #ffc107',
                      textAlign: 'left',
                      maxWidth: '600px',
                      margin: '16px auto 0'
                    }}>
                      <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', color: '#856404' }}>
                        ⚠️ Possible Issues:
                      </p>
                      <ul style={{ margin: '0', paddingLeft: '20px', fontSize: '12px', color: '#856404' }}>
                        {importResult?.success && importResult?.recordCount ? (
                          <li>Expected {importResult.recordCount} records, but table is empty</li>
                        ) : null}
                        <li>Backend server may not be running or connected</li>
                        <li>Database connection may not be established</li>
                        <li>Data may not have been inserted during upload</li>
                        <li>Table may exist but be empty due to import failure</li>
                      </ul>
                      <p style={{ margin: '8px 0 0 0', fontSize: '11px', color: '#856404', fontStyle: 'italic' }}>
                        Check the browser console for detailed error messages. Ensure the backend server is running and the database is connected.
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '16px' }}>
                      <button
                        onClick={() => fetchTableData(selectedTable, 0)}
                        style={{
                          padding: '8px 16px',
                          background: '#007bff',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        🔄 Refresh Data
                      </button>
                      {importResult?.success && (
                        <button
                          onClick={async () => {
                            await fetchStagingTables();
                            await fetchTableData(selectedTable, 0);
                          }}
                          style={{
                            padding: '8px 16px',
                            background: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          🔄 Refresh Tables & Data
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="data-controls">
                      <div className="search-box">
                        <input
                          type="text"
                          placeholder="Search data..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <span className="search-icon">🔍</span>
                      </div>
                      <div className="bulk-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button 
                          className="bulk-btn"
                          onClick={() => {
                            setShowAllRows(!showAllRows);
                            setCurrentPage(1);
                          }}
                          style={{ 
                            padding: '8px 16px', 
                            background: showAllRows ? '#28a745' : '#6c757d',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          {showAllRows ? '📄 Show Paginated' : '📋 Show All Rows'}
                        </button>
                        <span style={{ fontSize: '12px', color: '#666' }}>
                          ({filteredData.length} total rows)
                        </span>
                        <button 
                          className="bulk-btn delete-btn"
                          onClick={handleBulkDelete}
                          disabled={selectedRows.size === 0}
                        >
                          🗑️ Delete Selected ({selectedRows.size})
                        </button>
                      </div>
                    </div>
                    
                    <div className="data-table-container">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th className="select-column">
                              <input
                                type="checkbox"
                                checked={selectedRows.size === paginatedData.length && paginatedData.length > 0}
                                onChange={handleSelectAll}
                              />
                            </th>
                            {tableData.length > 0 && Object.keys(tableData[0] || {}).map(key => (
                              <th 
                                key={key}
                                className={sortConfig?.key === key ? `sorted ${sortConfig.direction}` : ''}
                                onClick={() => handleSort(key)}
                              >
                                {key}
                                {sortConfig?.key === key && (
                                  <span className="sort-indicator">
                                    {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                  </span>
                                )}
                              </th>
                            ))}
                            <th className="actions-column">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedData.map((row, index) => (
                            <tr 
                              key={row.id || index}
                              className={`${editingRow === row.id ? 'editing' : ''} ${selectedRows.has(row.id) ? 'selected' : ''}`}
                            >
                              <td className="select-column">
                                <input
                                  type="checkbox"
                                  checked={selectedRows.has(row.id)}
                                  onChange={() => handleRowSelect(row.id)}
                                />
                              </td>
                              {Object.entries(row).map(([key, value]) => {
                                if (key === 'id' || key === 'created_at' || key === 'updated_at') {
                                  return <td key={key} className="system-field">{String(value)}</td>;
                                }
                                if (editingRow === row.id) {
                                  return (
                                    <td key={key}>
                                      <input
                                        type="text"
                                        value={editingData[key] || ''}
                                        onChange={(e) => handleEditChange(key, e.target.value)}
                                        className="edit-input"
                                      />
                                    </td>
                                  );
                                }
                                return <td key={key}>{String(value)}</td>;
                              })}
                              <td className="actions-cell">
                                {editingRow === row.id ? (
                                  <div className="edit-actions">
                                    <button 
                                      onClick={saveEditing} 
                                      disabled={saving} 
                                      className="save-button"
                                    >
                                      {saving ? 'Saving...' : '💾'}
                                    </button>
                                    <button 
                                      onClick={cancelEditing} 
                                      disabled={saving} 
                                      className="cancel-button"
                                    >
                                      ❌
                                    </button>
                                  </div>
                                ) : (
                                  <div className="row-actions">
                                    <button 
                                      onClick={() => startEditing(row.id, row)} 
                                      className="edit-button"
                                      title="Edit"
                                    >
                                      ✏️
                                    </button>
                                    <button 
                                      onClick={() => deleteRecord(row.id)} 
                                      className="delete-button"
                                      title="Delete"
                                    >
                                      🗑️
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {!showAllRows && totalPages > 1 && (
                      <div className="pagination">
                        <button 
                          onClick={() => setCurrentPage((prev: number) => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                        >
                          ← Previous
                        </button>
                        <span className="page-info">
                          Page {currentPage} of {totalPages} (Showing {paginatedData.length} of {filteredData.length} rows)
                        </span>
                        <button 
                          onClick={() => setCurrentPage((prev: number) => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                        >
                          Next →
                        </button>
                      </div>
                    )}
                    {showAllRows && (
                      <div style={{ padding: '12px', textAlign: 'center', color: '#666', fontSize: '14px' }}>
                        Showing all {filteredData.length} rows
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Production Tables Tab */}
      {activeTab === 'production' && (
        <div className="tab-content">
          <div className="production-section">
            <div className="section-header">
              <div className="section-title">
                <h3>🏭 Production Data</h3>
                <p>View the data that was recently moved from staging to production</p>
              </div>
              <button 
                className="refresh-btn"
                onClick={fetchProductionTables}
              >
                🔄 Refresh
              </button>
            </div>

            {currentProductionTable ? (
              <div className="current-production-section">
                <div className="current-production-card">
                  <div className="table-icon">🏭</div>
                  <div className="table-info">
                    <div className="table-name">{currentProductionTable}</div>
                    <div className="table-count">Recently Moved to Production</div>
                  </div>
                  <div className="table-actions">
                    <button 
                      className="action-btn view-btn"
                      onClick={() => handleProductionTableSelect(currentProductionTable)}
                      title="View Data"
                    >
                      👁️
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="no-tables">
                <div className="no-tables-icon">🏭</div>
                <p>No data moved to production yet. Move data from staging to see it here!</p>
              </div>
            )}

            {/* Production Data Display */}
            {selectedProductionTable && (
              <div className="production-data-display">
                <div className="data-header">
                  <h4>📊 {selectedProductionTable} - Production Data</h4>
                  <p>This data has been moved from staging to production</p>
                </div>

                {loading ? (
                  <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Loading production data...</p>
                  </div>
                ) : (
                  <>
                    <div className="data-controls">
                      <div className="search-box">
                        <input
                          type="text"
                          placeholder="Search production data..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <span className="search-icon">🔍</span>
                      </div>
                      <div className="bulk-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button 
                          className="bulk-btn"
                          onClick={() => {
                            setShowAllRows(!showAllRows);
                            setCurrentPage(1);
                          }}
                          style={{ 
                            padding: '8px 16px', 
                            background: showAllRows ? '#28a745' : '#6c757d',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          {showAllRows ? '📄 Show Paginated' : '📋 Show All Rows'}
                        </button>
                        <span style={{ fontSize: '12px', color: '#666' }}>
                          ({filteredData.length} total rows)
                        </span>
                      </div>
                    </div>
                    
                    <div className="data-table-container">
                      <table className="data-table">
                        <thead>
                          <tr>
                            {Object.keys(productionData[0] || {}).map(key => (
                              <th 
                                key={key}
                                className={sortConfig?.key === key ? `sorted ${sortConfig.direction}` : ''}
                                onClick={() => handleSort(key)}
                              >
                                {key}
                                {sortConfig?.key === key && (
                                  <span className="sort-indicator">
                                    {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                  </span>
                                )}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedData.map((row, index) => (
                            <tr key={row.id || index}>
                              {Object.entries(row).map(([key, value]) => {
                                if (key === 'id' || key === 'created_at' || key === 'updated_at') {
                                  return <td key={key} className="system-field">{String(value)}</td>;
                                }
                                return <td key={key}>{String(value)}</td>;
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination for Production Data */}
                    {!showAllRows && totalPages > 1 && (
                      <div className="pagination">
                        <button 
                          onClick={() => setCurrentPage((prev: number) => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                        >
                          ← Previous
                        </button>
                        <span className="page-info">
                          Page {currentPage} of {totalPages} (Showing {paginatedData.length} of {filteredData.length} rows)
                        </span>
                        <button 
                          onClick={() => setCurrentPage((prev: number) => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                        >
                          Next →
                        </button>
                      </div>
                    )}
                    {showAllRows && (
                      <div style={{ padding: '12px', textAlign: 'center', color: '#666', fontSize: '14px' }}>
                        Showing all {filteredData.length} rows
                      </div>
                    )}

                    {productionData.length === 0 && (
                      <div className="no-data">
                        <p>No production data available for this table.</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Normalized Data Tab */}
      {activeTab === 'normalized' && (
        <div className="tab-content">
          <div className="normalized-section">
            <div className="section-header">
              <div className="section-title">
                <h3>📊 Normalized Data Overview</h3>
                <p>View the 3NF normalized data structure and summaries</p>
              </div>
              <button 
                className="refresh-btn"
                onClick={fetchNormalizedData}
              >
                🔄 Refresh
              </button>
            </div>

            {/* Data Overview */}
            <div className="data-overview-grid">
              <div className="overview-card">
                <h4>📈 Data Overview</h4>
                <div className="overview-stats">
                  {Array.isArray(normalizedOverview) && normalizedOverview.map((item, index) => (
                    <div key={index} className="stat-item">
                      <span className="stat-label">{item.table_name}:</span>
                      <span className="stat-value">{item.record_count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing Summary */}
              <div className="overview-card">
                <h4>💰 Pricing Summary</h4>
                <div className="summary-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Formation</th>
                        <th>Records</th>
                        <th>Avg Price</th>
                        <th>Min Price</th>
                        <th>Max Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.isArray(pricingSummary) && pricingSummary.map((item, index) => (
                        <tr key={index}>
                          <td>{item.formation}</td>
                          <td>{item.pricing_records}</td>
                          <td>${parseFloat(item.avg_price).toLocaleString()}</td>
                          <td>${parseFloat(item.min_price).toLocaleString()}</td>
                          <td>${parseFloat(item.max_price).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Acreage Summary */}
              <div className="overview-card">
                <h4>🏞️ Acreage Summary</h4>
                <div className="summary-table">
                  <table>
                    <thead>
                      <tr>
                        <th>County</th>
                        <th>Owners</th>
                        <th>Interests</th>
                        <th>Total Acres</th>
                        <th>Avg Interest</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.isArray(acreageSummary) && acreageSummary.map((item, index) => (
                        <tr key={index}>
                          <td>{item.county}</td>
                          <td>{item.unique_owners}</td>
                          <td>{item.mineral_interests}</td>
                          <td>{parseFloat(item.total_acres).toLocaleString()}</td>
                          <td>{parseFloat(item.avg_interest).toFixed(2)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Unit Summary */}
              <div className="overview-card">
                <h4>⛽ Unit Summary</h4>
                <div className="summary-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Operator</th>
                        <th>Units</th>
                        <th>Wells</th>
                        <th>Avg Allocation</th>
                        <th>Avg Pricing</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.isArray(unitSummary) && unitSummary.map((item, index) => (
                        <tr key={index}>
                          <td>{item.operator}</td>
                          <td>{item.total_units}</td>
                          <td>{item.total_wells}</td>
                          <td>{parseFloat(item.avg_allocation).toFixed(2)}%</td>
                          <td>${parseFloat(item.avg_pricing).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Query Information */}
            <div className="query-info">
              <h4>🔍 Available Queries</h4>
              <p>Use the SQL queries in <code>database/normalized_data_queries.sql</code> to explore the normalized data in detail.</p>
              <div className="query-examples">
                <h5>Example Queries:</h5>
                <ul>
                  <li><strong>Pricing by Formation:</strong> View pricing data grouped by geological formations</li>
                  <li><strong>Mineral Interests by County:</strong> See ownership distribution across counties</li>
                  <li><strong>Unit Performance by Operator:</strong> Compare operator performance metrics</li>
                  <li><strong>Cross-Reference Analysis:</strong> Find properties with both pricing and mineral interest data</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataImportComponent;