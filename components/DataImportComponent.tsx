import React, { useState, useRef, useCallback, useEffect } from 'react';
import './DataImportComponent.css';
import apiClient from '../services/apiClient';

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
  const [itemsPerPage] = useState(20);
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
      handleFilePreview(selectedFile);
    }
  };

  const handleFilePreview = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (file.name.endsWith('.csv')) {
        const lines = text.split('\n');
        const headers = lines[0].split(',');
        const rows = lines.slice(1, 6).map(line => {
          const values = line.split(',');
          const row: any = {};
          headers.forEach((header, index) => {
            row[header.trim()] = values[index]?.trim() || '';
          });
          return row;
        });
        setPreviewData(rows);
      }
    };
    reader.readAsText(file);
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
      setImportResult(result);
      
      if (result.success) {
        await fetchStagingTables();
        setShowPreview(false);
        setActiveTab('staging');
        
        // Automatically show the uploaded data
        if (result.stagingTableName) {
          setCurrentUploadedTable(result.stagingTableName);
          setSelectedTable(result.stagingTableName);
          await fetchTableData(result.stagingTableName);
          setShowStagingSubTable(true);
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      setImportResult({
        success: false,
        message: 'Upload failed. Please try again.'
      });
    }
  };

  // Fetch staging tables
  const fetchStagingTables = async () => {
    try {
      const response = await apiClient.fetchStagingTables();
      if (response.success) {
        // Handle both response structures: stagingTables array or data array
        const tableNames = response.stagingTables || response.data || [];
        const tables = Array.isArray(tableNames) ? tableNames.map((tableName: string) => ({
          tableName,
          recordCount: 0
        })) : [];
        setStagingTables(tables);
      } else {
        console.error('Failed to fetch staging tables:', response.message);
        setStagingTables([]);
      }
    } catch (error) {
      console.error('Error fetching staging tables:', error);
      setStagingTables([]);
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
  const fetchTableData = async (tableName: string) => {
    setLoading(true);
    try {
      console.log('Fetching data for table:', tableName);
      const response = await apiClient.fetchStagingTableData(tableName, 1000);
      console.log('API response:', response);
      
      if (response && response.success && response.data) {
        console.log('Setting table data:', response.data);
        setTableData(Array.isArray(response.data) ? response.data : []);
      } else {
        console.error('Failed to fetch table data:', response?.message || 'Unknown error');
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
    setSelectedTable(tableName);
    fetchTableData(tableName);
    setCurrentPage(1);
    setShowStagingSubTable(true);
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
      const response = await apiClient.fetchProductionTableData(tableName, 1000);
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
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

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
            {showPreview && previewData.length > 0 && (
              <div className="file-preview">
                <h4>📋 Data Preview (First 5 rows)</h4>
                <div className="preview-table">
                  <table>
                    <thead>
                      <tr>
                        {Object.keys(previewData[0] || {}).map(header => (
                          <th key={header}>{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((row, index) => (
                        <tr key={index}>
                          {Object.values(row).map((value, cellIndex) => (
                            <td key={cellIndex}>{String(value)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
                  {importResult.success && (
                    <div className="result-actions">
                      <p className="next-step">✅ File uploaded successfully! Data is now displayed in the Staging Tables tab below.</p>
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
                onClick={fetchStagingTables}
              >
                🔄 Refresh
              </button>
            </div>

            {currentUploadedTable ? (
              <div className="current-upload-section">
                <div className="current-upload-card">
                  <div className="table-icon">📊</div>
                  <div className="table-info">
                    <div className="table-name">{currentUploadedTable}</div>
                    <div className="table-count">Current Upload</div>
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
                      <div className="bulk-actions">
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
                            {Object.keys(tableData[0] || {}).map(key => (
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
                    {totalPages > 1 && (
                      <div className="pagination">
                        <button 
                          onClick={() => setCurrentPage((prev: number) => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                        >
                          ← Previous
                        </button>
                        <span className="page-info">
                          Page {currentPage} of {totalPages}
                        </span>
                        <button 
                          onClick={() => setCurrentPage((prev: number) => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                        >
                          Next →
                        </button>
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
                    {totalPages > 1 && (
                      <div className="pagination">
                        <button 
                          onClick={() => setCurrentPage((prev: number) => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                        >
                          ← Previous
                        </button>
                        <span className="page-info">
                          Page {currentPage} of {totalPages}
                        </span>
                        <button 
                          onClick={() => setCurrentPage((prev: number) => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                        >
                          Next →
                        </button>
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