import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { 
  DocumentArrowUpIcon, 
  DocumentTextIcon, 
  TableCellsIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  EyeIcon,
  TrashIcon,
  DownloadIcon,
  RefreshIcon,
  InformationCircleIcon,
  MagnifyingGlassIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  FunnelIcon
} from '../components/icons/Icons';
import * as api from '../services/api';

interface ImportedFile {
  id: string;
  filename: string;
  originalName: string;
  fileSize: number;
  uploadDate: string;
  status: 'processing' | 'completed' | 'failed';
  recordCount: number;
  uploadedBy: string;
  dataPreview?: any[];
  errors?: string[];
  allData?: any[]; // Full dataset
}

interface ImportSession {
  id: string;
  name: string;
  description: string;
  dataType: 'tracts' | 'contacts' | 'units' | 'leads' | 'assignments';
  files: ImportedFile[];
  createdAt: string;
  createdBy: string;
  status: 'active' | 'archived';
}

interface DataTableState {
  currentPage: number;
  pageSize: number;
  sortColumn: string;
  sortDirection: 'asc' | 'desc';
  searchTerm: string;
  selectedFile: string | null;
}

const DataImportPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'upload' | 'sessions' | 'data'>('upload');
  const [importSessions, setImportSessions] = useState<ImportSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ImportSession | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'preparing' | 'uploading' | 'processing' | 'completed' | 'failed'>('idle');
  const [uploadMessage, setUploadMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dataType, setDataType] = useState<'tracts' | 'contacts' | 'units' | 'leads' | 'assignments'>('tracts');
  const [sessionName, setSessionName] = useState('');
  const [sessionDescription, setSessionDescription] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false);
  
  // Data table state
  const [tableState, setTableState] = useState<DataTableState>({
    currentPage: 1,
    pageSize: 25,
    sortColumn: '',
    sortDirection: 'asc',
    searchTerm: '',
    selectedFile: null
  });

  // Computed data for table
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [allData, setAllData] = useState<any[]>([]);

  useEffect(() => {
    fetchImportSessions();
  }, []);

  useEffect(() => {
    if (activeTab === 'data' && selectedSession) {
      loadSessionData();
    }
  }, [activeTab, selectedSession]);

  useEffect(() => {
    if (allData.length > 0) {
      filterAndSortData();
    }
  }, [allData, tableState]);

  const fetchImportSessions = async () => {
    try {
      const sessions = await api.fetchImportSessions();
      setImportSessions(sessions);
    } catch (error) {
      console.error('Failed to fetch import sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSessionData = async () => {
    if (!selectedSession) return;
    
    setIsLoadingData(true);
    try {
      // Load full data for all files in the session
      const sessionWithData = await api.fetchImportSessionData(selectedSession.id);
      const allSessionData: any[] = [];
      
      sessionWithData.files.forEach((file: ImportedFile) => {
        if (file.allData && file.allData.length > 0) {
          // Add file identifier to each record
          const dataWithFile = file.allData.map((record: any) => ({
            ...record,
            _fileId: file.id,
            _fileName: file.originalName
          }));
          allSessionData.push(...dataWithFile);
        }
      });
      
      setAllData(allSessionData);
      setTableState(prev => ({
        ...prev,
        selectedFile: sessionWithData.files[0]?.id || null
      }));
    } catch (error) {
      console.error('Failed to load session data:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const filterAndSortData = () => {
    let filtered = [...allData];

    // Apply search filter
    if (tableState.searchTerm) {
      const searchLower = tableState.searchTerm.toLowerCase();
      filtered = filtered.filter(record => 
        Object.values(record).some(value => 
          String(value).toLowerCase().includes(searchLower)
        )
      );
    }

    // Apply file filter
    if (tableState.selectedFile) {
      filtered = filtered.filter(record => record._fileId === tableState.selectedFile);
    }

    // Apply sorting
    if (tableState.sortColumn) {
      filtered.sort((a, b) => {
        const aVal = a[tableState.sortColumn];
        const bVal = b[tableState.sortColumn];
        
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;
        
        const comparison = String(aVal).localeCompare(String(bVal));
        return tableState.sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    setFilteredData(filtered);
  };

  const handleSort = (column: string) => {
    setTableState(prev => ({
      ...prev,
      sortColumn: column,
      sortDirection: prev.sortColumn === column && prev.sortDirection === 'asc' ? 'desc' : 'asc',
      currentPage: 1
    }));
  };

  const handleSearch = (searchTerm: string) => {
    setTableState(prev => ({
      ...prev,
      searchTerm,
      currentPage: 1
    }));
  };

  const handlePageChange = (page: number) => {
    setTableState(prev => ({
      ...prev,
      currentPage: page
    }));
  };

  const handlePageSizeChange = (pageSize: number) => {
    setTableState(prev => ({
      ...prev,
      pageSize,
      currentPage: 1
    }));
  };

  const handleFileFilterChange = (fileId: string | null) => {
    setTableState(prev => ({
      ...prev,
      selectedFile: fileId,
      currentPage: 1
    }));
  };

  const getPaginatedData = () => {
    const startIndex = (tableState.currentPage - 1) * tableState.pageSize;
    const endIndex = startIndex + tableState.pageSize;
    return filteredData.slice(startIndex, endIndex);
  };

  const getTotalPages = () => {
    return Math.ceil(filteredData.length / tableState.pageSize);
  };

  const getSortIcon = (column: string) => {
    if (tableState.sortColumn !== column) {
      return <ChevronUpIcon className="h-4 w-4 text-gray-400" />;
    }
    return tableState.sortDirection === 'asc' 
      ? <ChevronUpIcon className="h-4 w-4 text-orange-500" />
      : <ChevronDownIcon className="h-4 w-4 text-orange-500" />;
  };

  const exportToCSV = () => {
    if (filteredData.length === 0) return;
    
    const headers = Object.keys(filteredData[0]).filter(key => !key.startsWith('_'));
    const csvContent = [
      headers.join(','),
      ...filteredData.map(row => 
        headers.map(header => {
          const value = row[header];
          return typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : String(value || '');
        }).join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedSession?.name || 'data'}_export.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      setSelectedFile(file);
    } else {
      alert('Please select a valid Excel file (.xlsx)');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !sessionName.trim()) {
      alert('Please select a file and provide a session name');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatus('preparing');
    setUploadMessage('Preparing upload...');

    try {
      // Simulate preparation phase
      await new Promise(resolve => setTimeout(resolve, 500));
      setUploadProgress(10);
      setUploadStatus('uploading');
      setUploadMessage('Uploading file to server...');

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('dataType', dataType);
      formData.append('sessionName', sessionName);
      formData.append('sessionDescription', sessionDescription);
      formData.append('uploadedBy', user?.id || '');

      const result = await api.uploadExcelFile(formData, (progress) => {
        setUploadProgress(10 + Math.floor(progress * 0.7)); // Upload phase: 10-80%
        if (progress === 100) {
          setUploadStatus('processing');
          setUploadMessage('Processing data...');
        }
      });

      // Simulate processing phase
      setUploadProgress(80);
      setUploadMessage('Validating data...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setUploadProgress(90);
      setUploadMessage('Importing records...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setUploadProgress(100);
      setUploadStatus('completed');
      setUploadMessage('Upload completed successfully!');

      console.log('Upload successful:', result);
      
      // Reset form after a brief delay to show completion
      setTimeout(() => {
        setSelectedFile(null);
        setSessionName('');
        setSessionDescription('');
        setUploadProgress(0);
        setUploadStatus('idle');
        setUploadMessage('');
        setIsUploading(false);
        
        // Refresh sessions
        fetchImportSessions();
        
        // Switch to sessions tab
        setActiveTab('sessions');
      }, 2000);
      
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadStatus('failed');
      setUploadMessage('Upload failed. Please try again.');
      setIsUploading(false);
    }
  };

  const handleSessionSelect = async (session: ImportSession) => {
    setSelectedSession(session);
    setActiveTab('data');
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (confirm('Are you sure you want to delete this import session? This will also delete all imported data.')) {
      try {
        await api.deleteImportSession(sessionId);
        await fetchImportSessions();
        if (selectedSession?.id === sessionId) {
          setSelectedSession(null);
        }
      } catch (error) {
        console.error('Failed to delete session:', error);
        alert('Failed to delete session');
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'processing': return 'text-yellow-600 bg-yellow-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircleIcon className="h-4 w-4" />;
      case 'processing': return <RefreshIcon className="h-4 w-4 animate-spin" />;
      case 'failed': return <XMarkIcon className="h-4 w-4" />;
      default: return <InformationCircleIcon className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data Import</h1>
          <p className="text-gray-600">Upload Excel files to import data into the system</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('upload')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'upload'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <DocumentArrowUpIcon className="h-4 w-4 inline mr-2" />
            Upload Files
          </button>
          <button
            onClick={() => setActiveTab('sessions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'sessions'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <DocumentTextIcon className="h-4 w-4 inline mr-2" />
            Import Sessions
          </button>
          {selectedSession && (
            <button
              onClick={() => setActiveTab('data')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'data'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <TableCellsIcon className="h-4 w-4 inline mr-2" />
              View Data
            </button>
          )}
        </nav>
      </div>

      {/* Upload Tab */}
      {activeTab === 'upload' && (
        <Card className="p-6">
          <div className="max-w-2xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Excel File</h2>
            
            {/* Upload Status Indicator */}
            {!isUploading && selectedFile && sessionName.trim() && (
              <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircleIcon className="h-5 w-5 text-green-600" />
                  <span className="text-green-800 font-medium">Ready to Upload</span>
                </div>
                <p className="text-green-700 text-sm mt-1">
                  All required fields are completed. Click "Start Upload" to begin the import process.
                </p>
              </div>
            )}
            
            <div className="space-y-6">
              {/* File Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Excel File (.xlsx)
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <DocumentArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-orange-600 hover:text-orange-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-orange-500"
                      >
                        <span>Upload a file</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          className="sr-only"
                          accept=".xlsx,.xls"
                          onChange={handleFileSelect}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">Excel files only</p>
                  </div>
                </div>
                {selectedFile && (
                  <div className="mt-2 text-sm text-gray-600">
                    Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                  </div>
                )}
              </div>

              {/* Data Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data Type
                </label>
                <select
                  value={dataType}
                  onChange={(e) => setDataType(e.target.value as any)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm rounded-md"
                >
                  <option value="tracts">Land Tracts</option>
                  <option value="contacts">Contacts</option>
                  <option value="units">Units</option>
                  <option value="leads">Leads</option>
                  <option value="assignments">Assignments</option>
                </select>
              </div>

              {/* Session Details */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Session Name *
                </label>
                <input
                  type="text"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                  placeholder="e.g., Q1 2024 Tract Import"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={sessionDescription}
                  onChange={(e) => setSessionDescription(e.target.value)}
                  rows={3}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                  placeholder="Optional description of this import session"
                />
              </div>

              {/* Upload Button - Moved up for better visibility */}
              <div className="pt-4 border-t border-gray-200">
                <Button
                  onClick={handleUpload}
                  disabled={!selectedFile || !sessionName.trim() || isUploading}
                  className="w-full py-4 text-lg font-semibold bg-orange-600 hover:bg-orange-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                  size="lg"
                >
                  {isUploading ? (
                    <div className="flex items-center space-x-3">
                      <RefreshIcon className="h-6 w-6 animate-spin" />
                      <span>Uploading...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3">
                      <DocumentArrowUpIcon className="h-6 w-6" />
                      <span>Start Upload</span>
                    </div>
                  )}
                </Button>
                
                {!isUploading && selectedFile && sessionName.trim() && (
                  <div className="mt-3 text-center text-sm text-gray-600 bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="font-medium text-green-800">Ready to Upload!</p>
                    <p className="text-green-700">File: <span className="font-medium">{selectedFile.name}</span></p>
                    <p className="text-green-700">Session: <span className="font-medium">{sessionName}</span></p>
                  </div>
                )}
                
                {!selectedFile || !sessionName.trim() ? (
                  <div className="mt-3 text-center text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <p>Please select a file and enter a session name to enable upload</p>
                  </div>
                ) : null}
              </div>

              {/* Upload Progress */}
              {isUploading && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {uploadStatus === 'completed' ? (
                        <CheckCircleIcon className="h-5 w-5 text-green-600" />
                      ) : uploadStatus === 'failed' ? (
                        <XMarkIcon className="h-5 w-5 text-red-600" />
                      ) : (
                        <RefreshIcon className="h-5 w-5 text-orange-600 animate-spin" />
                      )}
                      <span className="font-medium text-gray-900">{uploadMessage}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-600">{uploadProgress}%</span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`${
                        uploadStatus === 'completed'
                          ? 'bg-green-600'
                          : uploadStatus === 'failed'
                            ? 'bg-red-600'
                            : 'bg-orange-600'
                      } h-3 rounded-full transition-all duration-500 ease-out`}
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>
                      {uploadStatus === 'preparing' && 'Preparing file for upload...'}
                      {uploadStatus === 'uploading' && 'Transferring file to server...'}
                      {uploadStatus === 'processing' && 'Processing and validating data...'}
                      {uploadStatus === 'completed' && 'Upload successful! Redirecting...'}
                      {uploadStatus === 'failed' && 'Upload failed. Please check your file and try again.'}
                    </span>
                    {uploadStatus === 'uploading' && (
                      <span>Estimated time: {Math.ceil((100 - uploadProgress) / 10)}s</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Sessions Tab */}
      {activeTab === 'sessions' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Import Sessions</h2>
            <Button onClick={fetchImportSessions} variant="secondary" size="sm">
              <RefreshIcon className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {isLoading ? (
            <Card className="p-6">
              <div className="text-center">Loading sessions...</div>
            </Card>
          ) : importSessions.length === 0 ? (
            <Card className="p-6">
              <div className="text-center text-gray-500">
                <DocumentTextIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No import sessions found</p>
                <p className="text-sm">Upload your first Excel file to get started</p>
              </div>
            </Card>
          ) : (
            <div className="grid gap-4">
              {importSessions.map((session) => (
                <Card key={session.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-medium text-gray-900">{session.name}</h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                          {session.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{session.description}</p>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <span>Type: {session.dataType}</span>
                        <span>Files: {session.files.length}</span>
                        <span>Created: {new Date(session.createdAt).toLocaleDateString()}</span>
                        <span>By: {session.createdBy}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={() => handleSessionSelect(session)}
                        variant="secondary"
                        size="sm"
                      >
                        <EyeIcon className="h-4 w-4 mr-2" />
                        View Data
                      </Button>
                      <Button
                        onClick={() => handleDeleteSession(session.id)}
                        variant="secondary"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Files in Session */}
                  {session.files.length > 0 && (
                    <div className="mt-4 border-t pt-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Files:</h4>
                      <div className="space-y-2">
                        {session.files.map((file) => (
                          <div key={file.id} className="flex items-center justify-between text-sm">
                            <div className="flex items-center space-x-2">
                              <DocumentTextIcon className="h-4 w-4 text-gray-400" />
                              <span>{file.originalName}</span>
                              <span className="text-gray-500">({formatFileSize(file.fileSize)})</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(file.status)}`}>
                                {getStatusIcon(file.status)}
                                <span className="ml-1">{file.status}</span>
                              </span>
                              {file.recordCount > 0 && (
                                <span className="text-gray-500">{file.recordCount} records</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Enhanced Data View Tab */}
      {activeTab === 'data' && selectedSession && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Imported Data</h2>
              <p className="text-sm text-gray-600">{selectedSession.name}</p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={exportToCSV}
                variant="secondary"
                size="sm"
                disabled={filteredData.length === 0}
              >
                <DownloadIcon className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button
                onClick={() => setActiveTab('sessions')}
                variant="secondary"
                size="sm"
              >
                Back to Sessions
              </Button>
            </div>
          </div>

          <Card className="p-6">
            {isLoadingData ? (
              <div className="text-center py-8">
                <RefreshIcon className="h-8 w-8 mx-auto mb-4 animate-spin text-orange-500" />
                <p>Loading data...</p>
              </div>
            ) : allData.length === 0 ? (
              <div className="text-center py-8">
                <TableCellsIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">No data available for this session</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Filters and Controls */}
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Search */}
                  <div className="flex-1">
                    <div className="relative">
                      <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search all fields..."
                        value={tableState.searchTerm}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>
                  </div>

                  {/* File Filter */}
                  {selectedSession.files.length > 1 && (
                    <div className="sm:w-64">
                      <select
                        value={tableState.selectedFile || ''}
                        onChange={(e) => handleFileFilterChange(e.target.value || null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                      >
                        <option value="">All Files</option>
                        {selectedSession.files.map((file) => (
                          <option key={file.id} value={file.id}>
                            {file.originalName}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Page Size */}
                  <div className="sm:w-32">
                    <select
                      value={tableState.pageSize}
                      onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                    >
                      <option value={10}>10 rows</option>
                      <option value={25}>25 rows</option>
                      <option value={50}>50 rows</option>
                      <option value={100}>100 rows</option>
                    </select>
                  </div>
                </div>

                {/* Data Summary */}
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>
                    Showing {((tableState.currentPage - 1) * tableState.pageSize) + 1} to{' '}
                    {Math.min(tableState.currentPage * tableState.pageSize, filteredData.length)} of{' '}
                    {filteredData.length} records
                  </span>
                  <span>
                    {selectedSession.files.length} file(s) • {selectedSession.dataType} data
                  </span>
                </div>

                {/* Data Table */}
                {filteredData.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          {Object.keys(filteredData[0])
                            .filter(key => !key.startsWith('_'))
                            .map((column) => (
                              <th
                                key={column}
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSort(column)}
                              >
                                <div className="flex items-center space-x-1">
                                  <span>{column}</span>
                                  {getSortIcon(column)}
                                </div>
                              </th>
                            ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {getPaginatedData().map((row, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            {Object.keys(row)
                              .filter(key => !key.startsWith('_'))
                              .map((key, cellIndex) => (
                                <td
                                  key={cellIndex}
                                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                                >
                                  {String(row[key] || '')}
                                </td>
                              ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FunnelIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500">No records match your search criteria</p>
                  </div>
                )}

                {/* Pagination */}
                {getTotalPages() > 1 && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-700">
                        Page {tableState.currentPage} of {getTotalPages()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={() => handlePageChange(tableState.currentPage - 1)}
                        disabled={tableState.currentPage === 1}
                        variant="secondary"
                        size="sm"
                      >
                        Previous
                      </Button>
                      <Button
                        onClick={() => handlePageChange(tableState.currentPage + 1)}
                        disabled={tableState.currentPage === getTotalPages()}
                        variant="secondary"
                        size="sm"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};

export default DataImportPage;
