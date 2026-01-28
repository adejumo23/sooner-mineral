import React, { useState, useRef, useCallback, useEffect } from 'react';
import './DataImportComponent.css';
import apiClient from '../services/apiClient';

interface FileImportState {
  fileName: string;
  displayName: string;
  file: File | null;
  uploadProgress: number;
  uploadStatus: 'idle' | 'uploading' | 'uploaded' | 'error';
  fileColumns: string[];
  existingTableColumns: string[];
  stagingTableName: string | null;
  productionTableName: string | null;
  recordCount: number;
  stagingData: any[];
  currentStep: 'upload' | 'validate' | 'staging' | 'complete';
}

type FileType = 'acreage' | 'pricing' | 'units' | 'custom';

const FILE_TYPE_CONFIG: Record<FileType, { displayName: string; tableName: string }> = {
  acreage: { displayName: 'Acreage Schedule', tableName: 'prod_acreage_schedule' },
  pricing: { displayName: 'Pricing Data', tableName: 'prod_pricing' },
  units: { displayName: 'Unit Summary', tableName: 'prod_unit_summary' },
  custom: { displayName: 'Custom Import', tableName: '' },
};

const DataImportComponent: React.FC = () => {
  const [activeFileType, setActiveFileType] = useState<FileType>('acreage');
  const [fileImports, setFileImports] = useState<Map<FileType, FileImportState>>(new Map());
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Initialize file import states
  useEffect(() => {
    const initialStates = new Map<FileType, FileImportState>();
    (Object.keys(FILE_TYPE_CONFIG) as FileType[]).forEach((type) => {
      initialStates.set(type, {
        fileName: '',
        displayName: FILE_TYPE_CONFIG[type].displayName,
        file: null,
        uploadProgress: 0,
        uploadStatus: 'idle',
        fileColumns: [],
        existingTableColumns: [],
        stagingTableName: null,
        productionTableName: null,
        recordCount: 0,
        stagingData: [],
        currentStep: 'upload',
      });
    });
    setFileImports(initialStates);
  }, []);

  // Load existing table columns when file type changes
  useEffect(() => {
    const config = FILE_TYPE_CONFIG[activeFileType];
    if (config.tableName) {
      loadExistingColumns(activeFileType, config.tableName);
    }
  }, [activeFileType]);

  const loadExistingColumns = async (fileType: FileType, tableName: string) => {
    try {
      const response = await apiClient.getTableColumns(tableName);
      if (response.success && response.columns) {
        setFileImports((prev) => {
          const updated = new Map(prev);
          const current = updated.get(fileType);
          if (current) {
            updated.set(fileType, {
              ...current,
              existingTableColumns: response.columns,
            });
          }
          return updated;
        });
      }
    } catch (error) {
      console.log('Table does not exist yet or error loading columns:', error);
      // This is fine - table might not exist yet
    }
  };

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
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, [activeFileType]);

  const handleFileSelect = async (file: File) => {
    const currentState = fileImports.get(activeFileType);
    if (!currentState) return;

    // Validate file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!['csv', 'xlsx', 'xls'].includes(fileExtension || '')) {
      alert('Please upload a CSV or Excel file');
      return;
    }

    // Update state with file
    setFileImports((prev) => {
      const updated = new Map(prev);
      const current = updated.get(activeFileType);
      if (current) {
        updated.set(activeFileType, {
          ...current,
          file,
          fileName: file.name,
          uploadStatus: 'idle',
        });
      }
      return updated;
    });

    // Preview columns from file
    try {
      const previewResponse = await apiClient.previewFileColumns(file);
      if (previewResponse.success && previewResponse.columns) {
        setFileImports((prev) => {
          const updated = new Map(prev);
          const current = updated.get(activeFileType);
          if (current) {
            updated.set(activeFileType, {
              ...current,
              fileColumns: previewResponse.columns,
            });
          }
          return updated;
        });
      }
    } catch (error) {
      console.error('Error previewing file columns:', error);
      alert('Error reading file. Please try again.');
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleUpload = async () => {
    const currentState = fileImports.get(activeFileType);
    if (!currentState || !currentState.file) return;

    setFileImports((prev) => {
      const updated = new Map(prev);
      const current = updated.get(activeFileType);
      if (current) {
        updated.set(activeFileType, {
          ...current,
          uploadStatus: 'uploading',
          uploadProgress: 0,
        });
      }
      return updated;
    });

    try {
      const formData = new FormData();
      formData.append('file', currentState.file!);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setFileImports((prev) => {
          const updated = new Map(prev);
          const current = updated.get(activeFileType);
          if (current && current.uploadProgress < 90) {
            updated.set(activeFileType, {
              ...current,
              uploadProgress: current.uploadProgress + 10,
            });
          }
          return updated;
        });
      }, 200);

      const result = await apiClient.uploadFile(formData);
      clearInterval(progressInterval);

      if (result.success && result.stagingTableName) {
        setFileImports((prev) => {
          const updated = new Map(prev);
          const current = updated.get(activeFileType);
          if (current) {
            updated.set(activeFileType, {
              ...current,
              uploadStatus: 'uploaded',
              uploadProgress: 100,
              stagingTableName: result.stagingTableName,
              productionTableName: result.productionTableName,
              recordCount: result.recordCount || 0,
              currentStep: 'validate',
            });
          }
          return updated;
        });

        // Load staging data
        await loadStagingData(activeFileType, result.stagingTableName);
      } else {
        throw new Error(result.message || 'Upload failed');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      setFileImports((prev) => {
        const updated = new Map(prev);
        const current = updated.get(activeFileType);
        if (current) {
          updated.set(activeFileType, {
            ...current,
            uploadStatus: 'error',
            uploadProgress: 0,
          });
        }
        return updated;
      });
      alert(`Upload failed: ${error.message || 'Unknown error'}`);
    }
  };

  const loadStagingData = async (fileType: FileType, tableName: string) => {
    try {
      const response = await apiClient.fetchStagingTableData(tableName, 100);
      if (response.success && response.data) {
        setFileImports((prev) => {
          const updated = new Map(prev);
          const current = updated.get(activeFileType);
          if (current) {
            updated.set(activeFileType, {
              ...current,
              stagingData: response.data,
            });
          }
          return updated;
        });
      }
    } catch (error) {
      console.error('Error loading staging data:', error);
    }
  };

  const handleProceedToStaging = () => {
    setFileImports((prev) => {
      const updated = new Map(prev);
      const current = updated.get(activeFileType);
      if (current) {
        updated.set(activeFileType, {
          ...current,
          currentStep: 'staging',
        });
      }
      return updated;
    });
  };

  const handleCancelImport = () => {
    setFileImports((prev) => {
      const updated = new Map(prev);
      const current = updated.get(activeFileType);
      if (current) {
        updated.set(activeFileType, {
          ...current,
          file: null,
          fileName: '',
          uploadStatus: 'idle',
          uploadProgress: 0,
          fileColumns: [],
          stagingTableName: null,
          productionTableName: null,
          recordCount: 0,
          stagingData: [],
          currentStep: 'upload',
        });
      }
      return updated;
    });
  };

  const handleApproveToProduction = async () => {
    const currentState = fileImports.get(activeFileType);
    if (!currentState?.stagingTableName || !currentState?.productionTableName) return;

    try {
      const result = await apiClient.approveImport(
        currentState.stagingTableName,
        currentState.productionTableName
      );

      if (result.success) {
        setFileImports((prev) => {
          const updated = new Map(prev);
          const current = updated.get(activeFileType);
          if (current) {
            updated.set(activeFileType, {
              ...current,
              currentStep: 'complete',
            });
          }
          return updated;
        });
        alert('Import approved! Data moved to production.');
      } else {
        throw new Error(result.message || 'Approval failed');
      }
    } catch (error: any) {
      console.error('Error approving import:', error);
      alert(`Failed to approve import: ${error.message || 'Unknown error'}`);
    }
  };

  const getColumnDifferences = (fileType: FileType) => {
    const currentState = fileImports.get(fileType);
    if (!currentState) return { missing: [], new: [], matching: [] };

    const fileCols = new Set(currentState.fileColumns.map((col) => col.toLowerCase()));
    const existingCols = new Set(currentState.existingTableColumns.map((col) => col.toLowerCase()));

    const missing = currentState.existingTableColumns.filter(
      (col) => !fileCols.has(col.toLowerCase())
    );
    const newCols = currentState.fileColumns.filter(
      (col) => !existingCols.has(col.toLowerCase())
    );
    const matching = currentState.fileColumns.filter((col) =>
      existingCols.has(col.toLowerCase())
    );

    return { missing, new: newCols, matching };
  };

  const currentState = fileImports.get(activeFileType);
  const columnDiff = currentState ? getColumnDifferences(activeFileType) : { missing: [], new: [], matching: [] };

  return (
    <div className="data-import-container p-6">
      <div className="import-header">
        <div className="header-content">
          <div className="header-icon">📊</div>
          <div className="header-text">
            <h1>Data Import Center</h1>
            <p>Import and manage your data files with ease</p>
          </div>
        </div>
      </div>

      {/* Main File Type Tabs */}
      <div className="tab-navigation" style={{ marginBottom: '30px', position: 'relative' }}>
        {(Object.keys(FILE_TYPE_CONFIG) as FileType[]).map((fileType) => {
          const state = fileImports.get(fileType);
          const isActive = activeFileType === fileType;
          const hasActiveImport = state?.currentStep !== 'upload' && state?.currentStep !== 'complete';
          const icons: Record<FileType, string> = {
            acreage: '📋',
            pricing: '💰',
            units: '🏢',
            custom: '📁',
          };

          return (
            <button
              key={fileType}
              onClick={() => setActiveFileType(fileType)}
              className={`tab-btn ${isActive ? 'active' : ''}`}
              title={FILE_TYPE_CONFIG[fileType].displayName}
              style={{
                position: 'relative',
                borderBottom: isActive ? '3px solid #667eea' : '3px solid transparent',
                fontWeight: isActive ? '700' : '500',
                transform: isActive ? 'translateY(-2px)' : 'none',
                boxShadow: isActive ? '0 4px 12px rgba(102, 126, 234, 0.2)' : 'none',
              }}
            >
              <span className="mr-2" style={{ fontSize: '1.2rem' }}>{icons[fileType]}</span>
              {FILE_TYPE_CONFIG[fileType].displayName}
              {hasActiveImport && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-white bg-opacity-30 text-white animate-pulse">
                  ● Active
                </span>
              )}
              {isActive && (
                <>
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-white bg-opacity-50 text-white">
                    ← Current
                  </span>
                  <div 
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '0',
                      height: '0',
                      borderLeft: '8px solid transparent',
                      borderRight: '8px solid transparent',
                      borderTop: '8px solid #667eea',
                      marginTop: '-1px',
                    }}
                  />
                </>
              )}
            </button>
          );
        })}
      </div>

      {/* Current File Type Banner - More Prominent */}
      {currentState && (
        <div 
          className="mb-6 p-5 rounded-lg"
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)',
            border: '2px solid rgba(255, 255, 255, 0.2)',
          }}
        >
          <div className="flex items-center gap-4">
            <div 
              style={{
                fontSize: '2.5rem',
                background: 'rgba(255, 255, 255, 0.2)',
                padding: '12px',
                borderRadius: '12px',
                backdropFilter: 'blur(10px)',
              }}
            >
              {FILE_TYPE_CONFIG[activeFileType].displayName === 'Acreage Schedule' ? '📋' :
               FILE_TYPE_CONFIG[activeFileType].displayName === 'Pricing Data' ? '💰' :
               FILE_TYPE_CONFIG[activeFileType].displayName === 'Unit Summary' ? '🏢' : '📁'}
            </div>
            <div style={{ flex: 1 }}>
              <div className="flex items-center gap-2 mb-1">
                <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: 'white' }}>
                  {FILE_TYPE_CONFIG[activeFileType].displayName}
                </h3>
                <span 
                  style={{
                    padding: '4px 10px',
                    background: 'rgba(255, 255, 255, 0.3)',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                  }}
                >
                  ACTIVE TAB
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '1rem', color: 'rgba(255, 255, 255, 0.9)' }}>
                {currentState.currentStep === 'upload' && 'Ready to upload a new file'}
                {currentState.currentStep === 'validate' && `Validating columns for ${currentState.fileName}`}
                {currentState.currentStep === 'staging' && `Reviewing ${currentState.recordCount} records in staging`}
                {currentState.currentStep === 'complete' && 'Import completed successfully'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* File-Specific Content */}
      {currentState && (
        <div 
          className="mt-6"
          style={{
            border: '2px solid #667eea',
            borderRadius: '12px',
            padding: '20px',
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.03) 0%, rgba(118, 75, 162, 0.03) 100%)',
            boxShadow: '0 4px 20px rgba(102, 126, 234, 0.1)',
          }}
        >
          {/* Step Tabs within File Tab */}
          <div className="tab-navigation mb-6">
            <button
              onClick={() => {
                if (currentState.currentStep !== 'complete') {
                  setFileImports((prev) => {
                    const updated = new Map(prev);
                    const current = updated.get(activeFileType);
                    if (current) {
                      updated.set(activeFileType, { ...current, currentStep: 'upload' });
                    }
                    return updated;
                  });
                }
              }}
              className={`tab-btn ${currentState.currentStep === 'upload' ? 'active' : ''}`}
            >
              <span className="mr-2">📤</span> Upload
            </button>
            {currentState.uploadStatus === 'uploaded' && (
              <>
                <button
                  onClick={() => {
                    setFileImports((prev) => {
                      const updated = new Map(prev);
                      const current = updated.get(activeFileType);
                      if (current) {
                        updated.set(activeFileType, { ...current, currentStep: 'validate' });
                      }
                      return updated;
                    });
                  }}
                  className={`tab-btn ${currentState.currentStep === 'validate' ? 'active' : ''}`}
                >
                  <span className="mr-2">✓</span> Column Validation
                </button>
                <button
                  onClick={() => {
                    if (currentState.currentStep === 'staging' || currentState.currentStep === 'complete') {
                      setFileImports((prev) => {
                        const updated = new Map(prev);
                        const current = updated.get(activeFileType);
                        if (current) {
                          updated.set(activeFileType, { ...current, currentStep: 'staging' });
                        }
                        return updated;
                      });
                    }
                  }}
                  className={`tab-btn ${currentState.currentStep === 'staging' ? 'active' : ''} ${currentState.currentStep === 'complete' ? 'text-green-600' : ''}`}
                >
                  <span className="mr-2">👁️</span> Staging Preview
                </button>
              </>
            )}
          </div>

          {/* Upload Tab Content */}
          {currentState.currentStep === 'upload' && (
            <div className="tab-content">
              <div className="section-title">
                <h3>
                  <span style={{ marginRight: '10px', fontSize: '1.5rem' }}>
                    {FILE_TYPE_CONFIG[activeFileType].displayName === 'Acreage Schedule' ? '📋' :
                     FILE_TYPE_CONFIG[activeFileType].displayName === 'Pricing Data' ? '💰' :
                     FILE_TYPE_CONFIG[activeFileType].displayName === 'Unit Summary' ? '🏢' : '📁'}
                  </span>
                  Upload Your {FILE_TYPE_CONFIG[activeFileType].displayName} File
                </h3>
                <p>
                  Select a CSV or Excel file for <strong>{FILE_TYPE_CONFIG[activeFileType].displayName}</strong> to begin the import process
                </p>
              </div>
              <div className="upload-section">
                <div
                  ref={dropZoneRef}
                  onDragEnter={handleDragIn}
                  onDragLeave={handleDragOut}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`drop-zone ${dragActive ? 'active' : ''} ${currentState.file ? 'has-file' : ''}`}
                  style={{
                    borderColor: dragActive ? '#667eea' : currentState.file ? '#28a745' : undefined,
                    background: dragActive 
                      ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%)'
                      : currentState.file
                      ? 'linear-gradient(135deg, rgba(40, 167, 69, 0.1) 0%, rgba(40, 167, 69, 0.05) 100%)'
                      : undefined,
                  }}
                >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
                  <div className="drop-content">
                    {!currentState.file ? (
                      <>
                        <div className="drop-icon">📁</div>
                        <div className="drop-text">
                          <h3>Drag & Drop Your File</h3>
                          <p>or click the button below to browse</p>
                        </div>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="upload-btn primary"
                        >
                          <span>📂</span> Select File
                        </button>
                        <p className="supported-formats">CSV, XLS, XLSX up to 50MB</p>
                      </>
                    ) : (
                      <div className="file-selected">
                        <div className="file-icon">📄</div>
                        <div className="file-info">
                          <div className="file-name">{currentState.fileName}</div>
                          <div className="file-size">
                            {(currentState.file.size / 1024 / 1024).toFixed(2)} MB
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
              </div>

                {currentState.file && (
                  <div className="file-actions">
                    <button
                      onClick={() => {
                        setFileImports((prev) => {
                          const updated = new Map(prev);
                          const current = updated.get(activeFileType);
                          if (current) {
                            updated.set(activeFileType, {
                              ...current,
                              file: null,
                              fileName: '',
                              fileColumns: [],
                            });
                          }
                          return updated;
                        });
                      }}
                      className="preview-btn"
                    >
                      <span>🗑️</span> Remove
                    </button>
                    <button
                      onClick={handleUpload}
                      disabled={currentState.uploadStatus === 'uploading'}
                      className="upload-btn primary"
                    >
                      {currentState.uploadStatus === 'uploading' ? (
                        <>
                          <span className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></span>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <span>⬆️</span> Upload File
                        </>
                      )}
                    </button>
                  </div>
                )}

                {currentState.uploadStatus === 'uploading' && (
                  <div className="upload-progress">
                    <div className="flex items-center justify-between mb-2">
                      <span className="progress-text">Uploading your file...</span>
                      <span className="progress-text font-bold">{currentState.uploadProgress}%</span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${currentState.uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {currentState.uploadStatus === 'uploaded' && (
                  <div className="import-result success">
                    <div className="result-icon">✅</div>
                    <div className="result-content">
                      <h4>Upload Successful!</h4>
                      <p>
                        {currentState.recordCount} records have been imported to staging.
                        Proceed to column validation to review your data.
                      </p>
                    </div>
                  </div>
                )}

                {currentState.uploadStatus === 'error' && (
                  <div className="import-result error">
                    <div className="result-icon">❌</div>
                    <div className="result-content">
                      <h4>Upload Failed</h4>
                      <p>There was an error uploading your file. Please try again.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Column Validation Tab */}
          {currentState.currentStep === 'validate' && (
            <div className="tab-content">
              <div className="section-title">
                <h3>🔍 Column Validation</h3>
                <p>Review how your file columns compare to the existing table structure</p>
              </div>

                <div className="space-y-6">
                  {/* Missing Columns */}
                  {columnDiff.missing.length > 0 && (
                    <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-4 shadow-sm">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">⚠️</span>
                        <div className="flex-1">
                          <h3 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                            Missing Columns
                            <span className="px-2 py-1 bg-yellow-200 rounded-full text-xs">
                              {columnDiff.missing.length}
                            </span>
                          </h3>
                          <p className="text-sm text-yellow-700 mb-3">
                            These columns exist in the production table but are not in your file:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {columnDiff.missing.map((col) => (
                              <span
                                key={col}
                                className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-md text-sm font-medium border border-yellow-300"
                              >
                                {col}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* New Columns */}
                  {columnDiff.new.length > 0 && (
                    <div className="border border-blue-200 bg-blue-50 rounded-lg p-4 shadow-sm">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">✨</span>
                        <div className="flex-1">
                          <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                            New Columns
                            <span className="px-2 py-1 bg-blue-200 rounded-full text-xs">
                              {columnDiff.new.length}
                            </span>
                          </h3>
                          <p className="text-sm text-blue-700 mb-3">
                            These columns are in your file but not in the production table:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {columnDiff.new.map((col) => (
                              <span
                                key={col}
                                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-md text-sm font-medium border border-blue-300"
                              >
                                {col}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Matching Columns */}
                  {columnDiff.matching.length > 0 && (
                    <div className="border border-green-200 bg-green-50 rounded-lg p-4 shadow-sm">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">✅</span>
                        <div className="flex-1">
                          <h3 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                            Matching Columns
                            <span className="px-2 py-1 bg-green-200 rounded-full text-xs">
                              {columnDiff.matching.length}
                            </span>
                          </h3>
                          <p className="text-sm text-green-700 mb-3">
                            These columns match between your file and the production table:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {columnDiff.matching.map((col) => (
                              <span
                                key={col}
                                className="px-3 py-1 bg-green-100 text-green-800 rounded-md text-sm font-medium border border-green-300"
                              >
                                {col}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* No Differences */}
                  {columnDiff.missing.length === 0 &&
                    columnDiff.new.length === 0 &&
                    currentState.existingTableColumns.length > 0 && (
                      <div className="border border-green-200 bg-green-50 rounded-lg p-4">
                        <p className="text-sm text-green-800">
                          ✓ All columns match! Your file structure is compatible with the production table.
                        </p>
                      </div>
                    )}

                  {/* No Existing Table */}
                  {currentState.existingTableColumns.length === 0 && (
                    <div className="border border-gray-200 bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-700">
                        No existing production table found. This will create a new table.
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-8 flex space-x-4 justify-end">
                  <button
                    onClick={handleCancelImport}
                    className="px-6 py-3 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all"
                  >
                    <span className="mr-2">❌</span> Cancel Import
                  </button>
                  <button
                    onClick={handleProceedToStaging}
                    className="px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
                  >
                    <span className="mr-2">➡️</span> Proceed to Staging
                  </button>
                </div>
            </div>
          )}

          {/* Staging Preview Tab */}
          {currentState.currentStep === 'staging' && (
            <div className="tab-content">
              <div className="section-header">
                <div className="section-title">
                  <h3>👁️ Staging Data Preview</h3>
                  <p>
                    Review your data before moving to production. 
                    <strong className="ml-2 text-blue-600">{currentState.recordCount}</strong> records imported.
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to move this data to production? This action cannot be undone.')) {
                      handleApproveToProduction();
                    }
                  }}
                  className="move-to-production-btn"
                >
                  <span>✅</span> Approve & Move to Production
                </button>
              </div>

              {currentState.stagingData.length > 0 ? (
                <div className="data-table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        {Object.keys(currentState.stagingData[0]).map((key) => (
                          <th key={key}>
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {currentState.stagingData.slice(0, 50).map((row, idx) => (
                        <tr key={idx}>
                          {Object.values(row).map((value: any, colIdx) => (
                            <td key={colIdx}>
                              {value !== null && value !== undefined ? String(value) : <span className="text-gray-400">-</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {currentState.stagingData.length > 50 && (
                    <div className="text-center py-4 bg-gray-50 border-t">
                      <p className="text-sm text-gray-600 font-medium">
                        📊 Showing first 50 of <strong>{currentState.stagingData.length}</strong> records
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="no-data">
                  <div className="no-tables-icon">📭</div>
                  <p>No staging data available</p>
                </div>
              )}
            </div>
          )}

          {/* Complete Tab */}
          {currentState.currentStep === 'complete' && (
            <div className="tab-content">
              <div className="import-result success" style={{ flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '60px 40px' }}>
                <div className="result-icon" style={{ fontSize: '5rem', marginBottom: '20px' }}>🎉</div>
                <div className="result-content">
                  <h2 style={{ fontSize: '2rem', marginBottom: '15px', color: '#155724' }}>Import Complete!</h2>
                  <p style={{ fontSize: '1.1rem', marginBottom: '30px', color: '#155724' }}>
                    Your data has been successfully moved to production. 
                    <br />
                    <strong>{currentState.recordCount}</strong> records are now available in the production table.
                  </p>
                  <button
                    onClick={handleCancelImport}
                    className="approve-btn"
                    style={{ padding: '12px 24px', fontSize: '1rem' }}
                  >
                    <span className="mr-2">🔄</span> Start New Import
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DataImportComponent;
