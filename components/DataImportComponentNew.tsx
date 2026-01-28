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
      <h1 className="text-3xl font-bold mb-6">Data Import</h1>

      {/* Main File Type Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex space-x-8">
          {(Object.keys(FILE_TYPE_CONFIG) as FileType[]).map((fileType) => {
            const state = fileImports.get(fileType);
            const isActive = activeFileType === fileType;
            const hasActiveImport = state?.currentStep !== 'upload' && state?.currentStep !== 'complete';

            return (
              <button
                key={fileType}
                onClick={() => setActiveFileType(fileType)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } ${hasActiveImport ? 'font-bold' : ''}`}
              >
                {FILE_TYPE_CONFIG[fileType].displayName}
                {hasActiveImport && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    Active
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* File-Specific Content */}
      {currentState && (
        <div className="mt-6">
          {/* Step Tabs within File Tab */}
          <div className="mb-6 border-b border-gray-200">
            <nav className="flex space-x-8">
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
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  currentState.currentStep === 'upload'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Upload
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
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      currentState.currentStep === 'validate'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Column Validation
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
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      currentState.currentStep === 'staging'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    } ${currentState.currentStep === 'complete' ? 'text-green-600' : ''}`}
                  >
                    Staging Preview
                  </button>
                </>
              )}
            </nav>
          </div>

          {/* Upload Tab Content */}
          {currentState.currentStep === 'upload' && (
            <div className="mt-6">
              <div
                ref={dropZoneRef}
                onDragEnter={handleDragIn}
                onDragLeave={handleDragOut}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-12 text-center ${
                  dragActive
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
                <div className="space-y-4">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Select File
                    </button>
                    <p className="mt-2 text-sm text-gray-600">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">CSV, XLS, XLSX up to 50MB</p>
                </div>
              </div>

              {currentState.file && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{currentState.fileName}</p>
                      <p className="text-sm text-gray-500">
                        {(currentState.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <div className="flex space-x-2">
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
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        Remove
                      </button>
                      <button
                        onClick={handleUpload}
                        disabled={currentState.uploadStatus === 'uploading'}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                      >
                        {currentState.uploadStatus === 'uploading' ? 'Uploading...' : 'Upload'}
                      </button>
                    </div>
                  </div>

                  {currentState.uploadStatus === 'uploading' && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">Upload Progress</span>
                        <span className="text-sm text-gray-500">{currentState.uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${currentState.uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {currentState.uploadStatus === 'uploaded' && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                      <p className="text-sm text-green-800">
                        ✓ Upload complete! {currentState.recordCount} records imported.
                      </p>
                    </div>
                  )}

                  {currentState.uploadStatus === 'error' && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-800">Upload failed. Please try again.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Column Validation Tab */}
          {currentState.currentStep === 'validate' && (
            <div className="mt-6">
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Column Comparison</h2>
                <p className="text-sm text-gray-600 mb-6">
                  Compare the columns in your file with the existing table structure.
                </p>

                <div className="space-y-6">
                  {/* Missing Columns */}
                  {columnDiff.missing.length > 0 && (
                    <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
                      <h3 className="font-medium text-yellow-800 mb-2">
                        Missing Columns ({columnDiff.missing.length})
                      </h3>
                      <p className="text-sm text-yellow-700 mb-2">
                        These columns exist in the production table but are not in your file:
                      </p>
                      <ul className="list-disc list-inside text-sm text-yellow-700">
                        {columnDiff.missing.map((col) => (
                          <li key={col}>{col}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* New Columns */}
                  {columnDiff.new.length > 0 && (
                    <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
                      <h3 className="font-medium text-blue-800 mb-2">
                        New Columns ({columnDiff.new.length})
                      </h3>
                      <p className="text-sm text-blue-700 mb-2">
                        These columns are in your file but not in the production table:
                      </p>
                      <ul className="list-disc list-inside text-sm text-blue-700">
                        {columnDiff.new.map((col) => (
                          <li key={col}>{col}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Matching Columns */}
                  {columnDiff.matching.length > 0 && (
                    <div className="border border-green-200 bg-green-50 rounded-lg p-4">
                      <h3 className="font-medium text-green-800 mb-2">
                        Matching Columns ({columnDiff.matching.length})
                      </h3>
                      <p className="text-sm text-green-700 mb-2">
                        These columns match between your file and the production table:
                      </p>
                      <ul className="list-disc list-inside text-sm text-green-700">
                        {columnDiff.matching.map((col) => (
                          <li key={col}>{col}</li>
                        ))}
                      </ul>
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

                <div className="mt-6 flex space-x-4">
                  <button
                    onClick={handleCancelImport}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel Import
                  </button>
                  <button
                    onClick={handleProceedToStaging}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    Proceed to Staging
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Staging Preview Tab */}
          {currentState.currentStep === 'staging' && (
            <div className="mt-6">
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold">Staging Data Preview</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Review your data before moving to production. {currentState.recordCount} records imported.
                    </p>
                  </div>
                  <button
                    onClick={handleApproveToProduction}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                  >
                    Approve & Move to Production
                  </button>
                </div>

                {currentState.stagingData.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          {Object.keys(currentState.stagingData[0]).map((key) => (
                            <th
                              key={key}
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {currentState.stagingData.slice(0, 50).map((row, idx) => (
                          <tr key={idx}>
                            {Object.values(row).map((value: any, colIdx) => (
                              <td key={colIdx} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {value !== null && value !== undefined ? String(value) : '-'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {currentState.stagingData.length > 50 && (
                      <p className="mt-4 text-sm text-gray-500 text-center">
                        Showing first 50 of {currentState.stagingData.length} records
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No staging data available</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Complete Tab */}
          {currentState.currentStep === 'complete' && (
            <div className="mt-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-green-500 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h2 className="text-xl font-semibold text-green-800 mb-2">Import Complete!</h2>
                <p className="text-sm text-green-700 mb-4">
                  Your data has been successfully moved to production.
                </p>
                <button
                  onClick={handleCancelImport}
                  className="px-4 py-2 text-sm font-medium text-green-700 bg-white border border-green-300 rounded-md hover:bg-green-50"
                >
                  Start New Import
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DataImportComponent;
