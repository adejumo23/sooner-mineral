import React, { useState, useEffect, useCallback } from 'react';
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
  status: 'uploading' | 'processing' | 'staged' | 'error';
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
  dataType: 'tracts' | 'contacts' | 'units' | 'leads' | 'assignments' | 'custom';
  files: ImportedFile[];
  createdAt: string;
  createdBy: string;
  status: 'staging' | 'review' | 'production' | 'archived';
  updatedAt: string;
}

interface StagingTable {
  id: string;
  sessionId: string;
  tableName: string;
  columnSchema: any[];
  recordCount: number;
  createdAt: string;
  data?: any[];
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
     const [activeTab, setActiveTab] = useState<'upload' | 'sessions' | 'staging' | 'production' | 'data'>('upload');
  const [importSessions, setImportSessions] = useState<ImportSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ImportSession | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'preparing' | 'uploading' | 'processing' | 'completed' | 'failed'>('idle');
  const [uploadMessage, setUploadMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dataType, setDataType] = useState<'tracts' | 'contacts' | 'units' | 'leads' | 'assignments' | 'custom'>('custom');
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

  // Staging workflow state
  const [stagingTable, setStagingTable] = useState<StagingTable | null>(null);
  const [stagingData, setStagingData] = useState<any[]>([]);
  
  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRowData, setEditingRowData] = useState<any>(null);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  
  // Production promotion state
  const [isPromotingToProduction, setIsPromotingToProduction] = useState(false);

  useEffect(() => {
    fetchImportSessions();
  }, []);

  useEffect(() => {
    if (activeTab === 'data' && selectedSession) {
      loadSessionData();
    }
  }, [activeTab, selectedSession]);

     useEffect(() => {
     if (activeTab === 'staging' && selectedSession) {
       loadSessionData();
     }
   }, [activeTab, selectedSession]);

   useEffect(() => {
     if (activeTab === 'production' && selectedSession) {
       loadSessionData();
     }
   }, [activeTab, selectedSession]);

  useEffect(() => {
    console.log('filteredData changed to:', filteredData);
  }, [filteredData]);

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
      if (selectedSession.status === 'staging') {
        // Load staging table data
        console.log('Loading staging data for session:', selectedSession.id);
        const stagingData = await api.fetchStagingTableData(selectedSession.id);
        console.log('Staging data received:', stagingData);
        
        // Check if stagingData is an array (direct data) or object with data property
        if (Array.isArray(stagingData)) {
          // Direct data array - create a proper StagingTable object
          const stagingTableObj: StagingTable = {
            id: selectedSession.id,
            sessionId: selectedSession.id,
            tableName: selectedSession.name,
            columnSchema: stagingData.length > 0 ? Object.keys(stagingData[0]).map(key => ({ name: key, type: 'string' })) : [],
            recordCount: stagingData.length,
            createdAt: selectedSession.createdAt,
            data: stagingData
          };
          setStagingTable(stagingTableObj);
          setAllData(stagingData);
          console.log('All data set (direct array):', stagingData);
          console.log('allData length after set:', stagingData.length);
        } else if (stagingData && typeof stagingData === 'object' && 'data' in stagingData && Array.isArray((stagingData as any).data)) {
          // Object with data property
          const typedStagingData = stagingData as any;
          setStagingTable(typedStagingData as StagingTable);
          setAllData(typedStagingData.data);
          console.log('All data set (object.data):', typedStagingData.data);
          console.log('allData length after set:', typedStagingData.data.length);
        } else {
          // No data or invalid structure
          console.log('No valid staging data found');
          setStagingTable(null);
          setAllData([]);
        }
      } else {
        // Load production data
        const sessionWithData = await api.fetchImportSessionData(selectedSession.id);
        const allSessionData: any[] = [];
        
        // Safety check for files array
        if (sessionWithData.files && Array.isArray(sessionWithData.files)) {
          sessionWithData.files.forEach((file: ImportedFile) => {
            if (file.allData && Array.isArray(file.allData) && file.allData.length > 0) {
              // Add file identifier to each record
              const dataWithFile = file.allData.map((record: any) => ({
                ...record,
                _fileId: file.id,
                _fileName: file.originalName
              }));
              allSessionData.push(...dataWithFile);
            }
          });
        }
        
        setAllData(allSessionData);
      }
      
      // Safety check for files array before accessing
      if (selectedSession.files && Array.isArray(selectedSession.files) && selectedSession.files.length > 0) {
        setTableState(prev => ({
          ...prev,
          selectedFile: selectedSession.files[0]?.id || null
        }));
      }
    } catch (error) {
      console.error('Failed to load session data:', error);
      // Set empty data on error to prevent undefined issues
      setAllData([]);
      setStagingTable(null);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handlePromoteToProduction = async () => {
    if (!selectedSession) return;
    
    setIsPromotingToProduction(true);
    try {
      const result = await api.promoteToProduction(selectedSession.id);
      
      // Update local state
      setSelectedSession(prev => prev ? { ...prev, status: 'production' } : null);
      setImportSessions(prev => prev.map(s => 
        s.id === selectedSession.id ? { ...s, status: 'production' } : s
      ));
      
      // Reload data
      await loadSessionData();
      
      alert(result.message);
    } catch (error) {
      console.error('Failed to promote to production:', error);
      alert('Failed to promote to production. Please try again.');
    } finally {
      setIsPromotingToProduction(false);
    }
  };

  const handleEditRow = (rowId: string, data: any) => {
    setEditingRowId(rowId);
    setEditingRowData({ ...data }); // Create a copy to avoid modifying original data
    setIsEditModalOpen(true);
  };

  const handleResetChanges = () => {
    if (selectedSession && editingRowId) {
      // Find the original data and reset to it
      const originalData = allData.find(row => row.id === editingRowId);
      if (originalData) {
        setEditingRowData({ ...originalData });
      }
    }
  };

  const handleSaveEdit = async () => {
    console.log('handleSaveEdit called with:', { selectedSession, editingRowId, editingRowData });
    
    if (!selectedSession || !editingRowId || !editingRowData) {
      console.log('Missing required data:', { selectedSession: !!selectedSession, editingRowId: !!editingRowId, editingRowData: !!editingRowData });
      return;
    }
    
    try {
      console.log('Updating data...');
      
      // Update the local data first
      const updatedData = allData.map(row => 
        row.id === editingRowId ? { ...row, ...editingRowData } : row
      );
      
      console.log('Updated data:', updatedData);
      
      // Update the staging table with the new data
      await api.updateStagingData(selectedSession.id, updatedData);
      
      // Update local state
      setAllData(updatedData);
      
      setEditingRowId(null);
      setEditingRowData(null);
      setIsEditModalOpen(false);
      alert('Data updated successfully');
    } catch (error) {
      console.error('Failed to update data:', error);
      alert('Failed to update data. Please try again.');
    }
  };

  const handleDeleteRow = async (rowId: string) => {
    if (!selectedSession || !confirm('Are you sure you want to delete this record?')) return;
    
    try {
      // Remove the row from local data
      const updatedData = allData.filter(row => row.id !== rowId);
      
      // Update the staging table with the new data
      await api.updateStagingData(selectedSession.id, updatedData);
      
      // Update local state
      setAllData(updatedData);
      
      alert('Record deleted successfully');
    } catch (error) {
      console.error('Failed to delete record:', error);
      alert('Failed to delete record. Please try again.');
    }
  };

  const filterAndSortData = useCallback(() => {
    console.log('filterAndSortData called with allData:', allData);
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

    // Apply file filter - only for production data that has _fileId
    if (tableState.selectedFile && selectedSession?.status !== 'staging') {
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

    console.log('filteredData set to:', filtered);
    setFilteredData(filtered);
  }, [allData, tableState.searchTerm, tableState.sortColumn, tableState.sortDirection, tableState.selectedFile, selectedSession?.status]);

  useEffect(() => {
    console.log('useEffect triggered - allData changed:', allData.length);
    filterAndSortData();
  }, [filterAndSortData]);

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

  // Helper functions for the enhanced modal
  const getInputType = (fieldName: string, value: any): string => {
    const lowerFieldName = fieldName.toLowerCase();
    
    // Email fields
    if (lowerFieldName.includes('email') || lowerFieldName.includes('mail')) {
      return 'email';
    }
    
    // URL fields
    if (lowerFieldName.includes('url') || lowerFieldName.includes('website') || lowerFieldName.includes('link')) {
      return 'url';
    }
    
    // Phone fields
    if (lowerFieldName.includes('phone') || lowerFieldName.includes('tel') || lowerFieldName.includes('mobile')) {
      return 'tel';
    }
    
    // Number fields
    if (lowerFieldName.includes('amount') || lowerFieldName.includes('price') || lowerFieldName.includes('cost') || 
        lowerFieldName.includes('quantity') || lowerFieldName.includes('count') || lowerFieldName.includes('number') ||
        lowerFieldName.includes('size') || lowerFieldName.includes('area') || lowerFieldName.includes('acres')) {
      return 'number';
    }
    
    // Date fields
    if (lowerFieldName.includes('date') || lowerFieldName.includes('created') || lowerFieldName.includes('updated') ||
        lowerFieldName.includes('start') || lowerFieldName.includes('end') || lowerFieldName.includes('due')) {
      return 'date';
    }
    
    // Default to text
    return 'text';
  };

  const getFieldDescription = (fieldName: string): string | null => {
    const lowerFieldName = fieldName.toLowerCase();
    
    // Common field descriptions
    const descriptions: { [key: string]: string } = {
      'email': 'Enter a valid email address',
      'phone': 'Enter phone number with area code',
      'amount': 'Enter numeric value only',
      'date': 'Select a date',
      'url': 'Enter a valid website URL',
      'acres': 'Enter the acreage in decimal format (e.g., 150.5)',
      'size': 'Enter the size in appropriate units',
      'area': 'Enter the area measurement',
      'quantity': 'Enter the quantity as a whole number',
      'count': 'Enter the count as a whole number',
      'price': 'Enter the price without currency symbols',
      'cost': 'Enter the cost without currency symbols'
    };
    
    // Check for partial matches
    for (const [key, description] of Object.entries(descriptions)) {
      if (lowerFieldName.includes(key)) {
        return description;
      }
    }
    
    return null;
  };

  const getValidationErrors = (data: any): string[] => {
    const errors: string[] = [];
    
    // Check for required fields (common business fields)
    const requiredFields = ['name', 'title', 'description', 'type', 'status'];
    for (const field of requiredFields) {
      if (data[field] !== undefined && (!data[field] || data[field].toString().trim() === '')) {
        errors.push(`${field.charAt(0).toUpperCase() + field.slice(1)} is required`);
      }
    }
    
    // Email validation
    if (data.email && !isValidEmail(data.email)) {
      errors.push('Please enter a valid email address');
    }
    
    // URL validation
    if (data.url && !isValidUrl(data.url)) {
      errors.push('Please enter a valid URL');
    }
    
    // Phone validation
    if (data.phone && !isValidPhone(data.phone)) {
      errors.push('Please enter a valid phone number');
    }
    
    // Number validation for numeric fields
    const numericFields = ['amount', 'price', 'cost', 'quantity', 'count', 'size', 'area', 'acres'];
    for (const field of numericFields) {
      if (data[field] && isNaN(Number(data[field]))) {
        errors.push(`${field.charAt(0).toUpperCase() + field.slice(1)} must be a valid number`);
      }
    }
    
    return errors;
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const isValidPhone = (phone: string): boolean => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
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
      setTimeout(async () => {
        setSelectedFile(null);
        setSessionName('');
        setSessionDescription('');
        setUploadProgress(0);
        setUploadStatus('idle');
        setUploadMessage('');
        setIsUploading(false);
        
        // Refresh sessions and automatically select the new one
        const updatedSessions = await api.fetchImportSessions();
        setImportSessions(updatedSessions);
        
        // Find and select the newly created session
        const newSession = updatedSessions.find(s => s.id === result.sessionId);
        if (newSession) {
          setSelectedSession(newSession);
          // Switch to staging tab to show the data
          setActiveTab('staging');
        } else {
          // Fallback to sessions tab if session not found
          setActiveTab('sessions');
        }
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
    if (session.status === 'staging') {
      setActiveTab('staging');
    } else {
      setActiveTab('data');
    }
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
                     {selectedSession && selectedSession.status === 'staging' && (
             <button
               onClick={() => setActiveTab('staging')}
               className={`py-2 px-1 border-b-2 font-medium text-sm ${
                 activeTab === 'staging'
                   ? 'border-orange-500 text-orange-600'
                   : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
               }`}
             >
               <TableCellsIcon className="h-4 w-4 inline mr-2" />
               Staging
             </button>
           )}
           {selectedSession && selectedSession.status === 'production' && (
             <button
               onClick={() => setActiveTab('production')}
               className={`py-2 px-1 border-b-2 font-medium text-sm ${
                 activeTab === 'production'
                   ? 'border-orange-500 text-orange-600'
                   : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
               }`}
             >
               <CheckCircleIcon className="h-4 w-4 inline mr-2" />
               Production
             </button>
           )}
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

      {/* Staging Tab */}
      {activeTab === 'staging' && (
        <div className="space-y-4">
          {!selectedSession ? (
            <div className="text-center py-8">
              <TableCellsIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">Please select a session to view staging data</p>
              <Button
                onClick={() => setActiveTab('sessions')}
                variant="primary"
                size="sm"
                className="mt-4"
              >
                Go to Sessions
              </Button>
            </div>
          ) : selectedSession.status !== 'staging' ? (
            <div className="text-center py-8">
              <TableCellsIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">This session is not in staging mode</p>
              <p className="text-sm text-gray-400 mt-2">Status: {selectedSession.status}</p>
              <Button
                onClick={() => setActiveTab('sessions')}
                variant="primary"
                size="sm"
                className="mt-4"
              >
                Back to Sessions
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Staging Data</h2>
                  <p className="text-sm text-gray-600">
                    Review and edit data before promoting to production. 
                    {stagingTable && ` Table: ${stagingTable.tableName}`}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={handlePromoteToProduction}
                    variant="primary"
                    size="sm"
                    disabled={isPromotingToProduction || !stagingTable}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isPromotingToProduction ? (
                      <>
                        <RefreshIcon className="h-4 w-4 mr-2 animate-spin" />
                        Promoting...
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="h-4 w-4 mr-2" />
                        Promote to Production
                      </>
                      )}
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
                    <p>Loading staging data...</p>
                  </div>
                ) : !stagingTable || allData.length === 0 ? (
                  <div className="text-center py-8">
                    <TableCellsIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500">No staging data available</p>
                    <p className="text-sm text-gray-400 mt-2">Session: {selectedSession.name}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Staging Info */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2">
                        <InformationCircleIcon className="h-5 w-5 text-blue-600" />
                        <span className="text-blue-800 font-medium">Staging Mode</span>
                      </div>
                      <p className="text-blue-700 text-sm mt-1">
                        This data is in staging. You can edit, delete, or modify records before promoting to production.
                        Once promoted, the data will be moved to the production table and cannot be easily modified.
                      </p>
                    </div>

                                                                                   {/* Filters and Controls */}
                      <div className="mb-6 bg-white pb-4 border-b border-gray-200">
                        <div className="flex flex-col space-y-4 lg:space-y-0 lg:flex-row lg:items-center lg:justify-between">
                          {/* Search */}
                          <div className="flex-1 lg:max-w-md">
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

                          {/* Page Size */}
                          <div className="lg:w-40">
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
                      </div>

                                         {/* Enhanced Data Summary and Bulk Actions */}
                     <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-4">
                       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                         <div className="flex items-center space-x-4 mb-3 sm:mb-0">
                           <div className="flex items-center space-x-2">
                             <div className="p-2 bg-blue-100 rounded-lg">
                               <TableCellsIcon className="h-5 w-5 text-blue-600" />
                             </div>
                             <div>
                               <p className="text-sm font-medium text-blue-900">
                                 {filteredData.length} of {allData.length} records
                               </p>
                               <p className="text-xs text-blue-700">
                                 Showing {((tableState.currentPage - 1) * tableState.pageSize) + 1} to{' '}
                                 {Math.min(tableState.currentPage * tableState.pageSize, filteredData.length)}
                               </p>
                             </div>
                           </div>
                           
                           {/* Quick Stats */}
                           <div className="hidden lg:flex items-center space-x-4 text-xs text-blue-700">
                             <span className="flex items-center space-x-1">
                               <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                               <span>Valid: {filteredData.filter(row => 
                                 Object.values(row).some(val => val && val.toString().trim() !== '')
                               ).length}</span>
                             </span>
                             <span className="flex items-center space-x-1">
                               <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                               <span>Incomplete: {filteredData.filter(row => 
                                 Object.values(row).some(val => !val || val.toString().trim() === '')
                               ).length}</span>
                             </span>
                           </div>
                         </div>
                         
                         {/* Bulk Actions */}
                         <div className="flex items-center space-x-2">
                           <Button
                             onClick={() => {
                               const csvContent = [
                                 stagingTable.columnSchema.map(col => col.name).join(','),
                                 ...filteredData.map(row => 
                                   stagingTable.columnSchema.map(col => {
                                     const value = row[col.name] || '';
                                     return typeof value === 'string' && value.includes(',') 
                                       ? `"${value}"` 
                                       : String(value);
                                   }).join(',')
                                 )
                               ].join('\n');
                               
                               const blob = new Blob([csvContent], { type: 'text/csv' });
                               const url = window.URL.createObjectURL(blob);
                               const a = document.createElement('a');
                               a.href = url;
                               a.download = `${selectedSession?.name || 'staging'}_data.csv`;
                               a.click();
                               window.URL.revokeObjectURL(url);
                             }}
                             variant="secondary"
                             size="sm"
                             className="text-blue-700 border-blue-300 hover:bg-blue-50"
                           >
                             <DownloadIcon className="h-4 w-4 mr-2" />
                             Export CSV
                           </Button>
                           
                           <Button
                             onClick={() => {
                               // Refresh data
                               loadSessionData();
                             }}
                             variant="secondary"
                             size="sm"
                             className="text-gray-700 border-gray-300 hover:bg-gray-50"
                           >
                             <RefreshIcon className="h-4 w-4 mr-2" />
                             Refresh
                           </Button>
                         </div>
                       </div>
                     </div>

                                         {/* Enhanced Staging Data Table */}
                     <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                       <div className="overflow-x-auto">
                         <table className="min-w-full divide-y divide-gray-200">
                           <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                             <tr>
                               {stagingTable.columnSchema.map((column) => (
                                 <th
                                   key={column.name}
                                   onClick={() => handleSort(column.name)}
                                   className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors duration-150 group"
                                 >
                                   <div className="flex items-center justify-between">
                                     <span className="font-semibold">{column.name.replace(/_/g, ' ').toUpperCase()}</span>
                                     <div className="flex items-center space-x-1">
                                       {tableState.sortColumn === column.name ? (
                                         tableState.sortDirection === 'asc' ? (
                                           <ChevronUpIcon className="h-4 w-4 text-orange-500" />
                                         ) : (
                                           <ChevronDownIcon className="h-4 w-4 text-orange-500" />
                                         )
                                       ) : (
                                         <ChevronUpIcon className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                                       )}
                                     </div>
                                   </div>
                                 </th>
                               ))}
                               <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gray-50">
                                 Actions
                               </th>
                             </tr>
                           </thead>
                           <tbody className="bg-white divide-y divide-gray-100">
                             {getPaginatedData().map((row: any, index: number) => (
                               <tr 
                                 key={row.id || index} 
                                 className="hover:bg-orange-50 transition-colors duration-150 group"
                               >
                                 {stagingTable.columnSchema.map((column) => (
                                   <td key={column.name} className="px-4 py-3 text-sm">
                                     <div className="flex items-center">
                                       <span className="text-gray-900 group-hover:text-gray-700">
                                         {row[column.name] || (
                                           <span className="text-gray-400 italic">—</span>
                                         )}
                                       </span>
                                       {column.name.toLowerCase().includes('email') && row[column.name] && (
                                         <a 
                                           href={`mailto:${row[column.name]}`}
                                           className="ml-2 text-blue-600 hover:text-blue-800 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                                           title="Send email"
                                         >
                                           <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                             <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                             <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                                           </svg>
                                         </a>
                                       )}
                                       {column.name.toLowerCase().includes('phone') && row[column.name] && (
                                         <a 
                                           href={`tel:${row[column.name]}`}
                                           className="ml-2 text-green-600 hover:text-green-800 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                                           title="Call phone"
                                         >
                                           <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                             <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                           </svg>
                                         </a>
                                       )}
                                       {column.name.toLowerCase().includes('url') && row[column.name] && (
                                         <a 
                                           href={row[column.name].startsWith('http') ? row[column.name] : `https://${row[column.name]}`}
                                           target="_blank"
                                           rel="noopener noreferrer"
                                           className="ml-2 text-purple-600 hover:text-purple-800 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                                           title="Open link"
                                         >
                                           <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                             <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 01-1.414-1.414l3-3z" clipRule="evenodd" />
                                             <path fillRule="evenodd" d="M12 4a2 2 0 00-2 2v4a2 2 0 002 2h4a2 2 0 002-2V6a2 2 0 00-2-2h-4z" clipRule="evenodd" />
                                           </svg>
                                         </a>
                                       )}
                                     </div>
                                   </td>
                                 ))}
                                 <td className="px-4 py-3 text-sm text-gray-500">
                                   <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                                     <button
                                       onClick={() => handleEditRow(row.id, row)}
                                       className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors duration-150"
                                       title="Edit record"
                                     >
                                       <EyeIcon className="h-4 w-4" />
                                     </button>
                                     <button
                                       onClick={() => handleDeleteRow(row.id)}
                                       className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors duration-150"
                                       title="Delete record"
                                     >
                                       <TrashIcon className="h-4 w-4" />
                                     </button>
                                     <button
                                       onClick={() => {
                                         // Copy row data to clipboard
                                         const rowText = stagingTable.columnSchema
                                           .map(col => `${col.name}: ${row[col.name] || ''}`)
                                           .join('\n');
                                         navigator.clipboard.writeText(rowText);
                                         alert('Row data copied to clipboard!');
                                       }}
                                       className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-md transition-colors duration-150"
                                       title="Copy row data"
                                     >
                                       <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                         <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                                         <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                                       </svg>
                                     </button>
                                   </div>
                                 </td>
                               </tr>
                             ))}
                           </tbody>
                         </table>
                       </div>
                       
                       {/* Enhanced Empty State */}
                       {getPaginatedData().length === 0 && (
                         <div className="text-center py-12 bg-gray-50">
                           <FunnelIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                           <h3 className="text-lg font-medium text-gray-900 mb-2">No records found</h3>
                           <p className="text-gray-500 mb-4">
                             {tableState.searchTerm 
                               ? `No records match "${tableState.searchTerm}"` 
                               : 'No data available for this session'
                             }
                           </p>
                           {tableState.searchTerm && (
                             <button
                               onClick={() => handleSearch('')}
                               className="text-orange-600 hover:text-orange-700 font-medium"
                             >
                               Clear search
                             </button>
                           )}
                         </div>
                       )}
                     </div>

                                         {/* Enhanced Pagination */}
                     {Math.ceil(filteredData.length / tableState.pageSize) > 1 && (
                       <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                         <div className="flex items-center justify-between">
                           <div className="flex flex-1 justify-between sm:hidden">
                             <Button
                               onClick={() => handlePageChange(tableState.currentPage - 1)}
                               disabled={tableState.currentPage === 1}
                               variant="secondary"
                               size="sm"
                               className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                             >
                               Previous
                             </Button>
                             <Button
                               onClick={() => handlePageChange(tableState.currentPage + 1)}
                               disabled={tableState.currentPage >= Math.ceil(filteredData.length / tableState.pageSize)}
                               variant="secondary"
                               size="sm"
                               className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                             >
                               Next
                             </Button>
                           </div>
                           <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                             <div>
                               <p className="text-sm text-gray-700">
                                 Showing{' '}
                                 <span className="font-medium">
                                   {((tableState.currentPage - 1) * tableState.pageSize) + 1}
                                 </span>{' '}
                                 to{' '}
                                 <span className="font-medium">
                                   {Math.min(tableState.currentPage * tableState.pageSize, filteredData.length)}
                                 </span>{' '}
                                 of{' '}
                                 <span className="font-medium">{filteredData.length}</span>{' '}
                                 results
                               </p>
                             </div>
                             <div>
                               <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                 <Button
                                   onClick={() => handlePageChange(tableState.currentPage - 1)}
                                   disabled={tableState.currentPage === 1}
                                   variant="secondary"
                                   size="sm"
                                   className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                 >
                                   <span className="sr-only">Previous</span>
                                   <ChevronUpIcon className="h-5 w-5 transform rotate-90" />
                                 </Button>
                                 
                                 {/* Page Numbers */}
                                 {(() => {
                                   const totalPages = Math.ceil(filteredData.length / tableState.pageSize);
                                   const currentPage = tableState.currentPage;
                                   const pages = [];
                                   
                                   // Always show first page
                                   if (currentPage > 1) {
                                     pages.push(1);
                                   }
                                   
                                   // Show ellipsis if there's a gap
                                   if (currentPage > 3) {
                                     pages.push('...');
                                   }
                                   
                                   // Show current page and surrounding pages
                                   for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
                                     if (i !== 1 && i !== totalPages) {
                                       pages.push(i);
                                     }
                                   }
                                   
                                   // Show ellipsis if there's a gap
                                   if (currentPage < totalPages - 2) {
                                     pages.push('...');
                                   }
                                   
                                   // Always show last page
                                   if (currentPage < totalPages) {
                                     pages.push(totalPages);
                                   }
                                   
                                   return pages.map((page, index) => (
                                     <button
                                       key={index}
                                       onClick={() => typeof page === 'number' ? handlePageChange(page) : null}
                                       disabled={page === '...'}
                                       className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                         page === currentPage
                                           ? 'z-10 bg-orange-50 border-orange-500 text-orange-600'
                                           : page === '...'
                                           ? 'bg-white border-gray-300 text-gray-500 cursor-default'
                                           : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                       }`}
                                     >
                                       {page}
                                     </button>
                                   ));
                                 })()}
                                 
                                 <Button
                                   onClick={() => handlePageChange(tableState.currentPage + 1)}
                                   disabled={tableState.currentPage >= Math.ceil(filteredData.length / tableState.pageSize)}
                                   variant="secondary"
                                   size="sm"
                                   className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                 >
                                   <span className="sr-only">Next</span>
                                   <ChevronUpIcon className="h-5 w-5 transform -rotate-90" />
                                 </Button>
                               </nav>
                             </div>
                           </div>
                         </div>
                       </div>
                     )}
                  </div>
                )}
              </Card>
            </div>
          )}
                 </div>
       )}

       {/* Production Tab */}
       {activeTab === 'production' && (
         <div className="space-y-4">
           {!selectedSession ? (
             <div className="text-center py-8">
               <CheckCircleIcon className="h-12 w-12 mx-auto mb-4 text-green-300" />
               <p className="text-gray-500">Please select a session to view production data</p>
               <Button
                 onClick={() => setActiveTab('sessions')}
                 variant="primary"
                 size="sm"
                 className="mt-4"
               >
                 Go to Sessions
               </Button>
             </div>
           ) : selectedSession.status !== 'production' ? (
             <div className="text-center py-8">
               <CheckCircleIcon className="h-12 w-12 mx-auto mb-4 text-green-300" />
               <p className="text-gray-500">This session is not in production mode</p>
               <p className="text-sm text-gray-400 mt-2">Status: {selectedSession.status}</p>
               <Button
                 onClick={() => setActiveTab('sessions')}
                 variant="primary"
                 size="sm"
                 className="mt-4"
               >
                 Back to Sessions
               </Button>
             </div>
           ) : (
             <div className="space-y-4">
               <div className="flex items-center justify-between">
                 <div>
                   <h2 className="text-lg font-semibold text-gray-900">Production Data</h2>
                   <p className="text-sm text-gray-600">
                     Data has been promoted to production and is now read-only. 
                     {stagingTable && ` Table: ${stagingTable.tableName}`}
                   </p>
                 </div>
                 <div className="flex items-center space-x-2">
                   <div className="flex items-center space-x-2 px-3 py-2 bg-green-100 text-green-800 rounded-lg">
                     <CheckCircleIcon className="h-5 w-5" />
                     <span className="text-sm font-medium">Production Ready</span>
                   </div>
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
                     <RefreshIcon className="h-8 w-8 mx-auto mb-4 animate-spin text-green-500" />
                     <p>Loading production data...</p>
                   </div>
                 ) : !stagingTable || allData.length === 0 ? (
                   <div className="text-center py-8">
                     <CheckCircleIcon className="h-12 w-12 mx-auto mb-4 text-green-300" />
                     <p className="text-gray-500">No production data available</p>
                     <p className="text-sm text-gray-400 mt-2">Session: {selectedSession.name}</p>
                   </div>
                 ) : (
                   <div className="space-y-4">
                     {/* Production Info */}
                     <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                       <div className="flex items-center space-x-2">
                         <CheckCircleIcon className="h-5 w-5 text-green-600" />
                         <span className="text-green-800 font-medium">Production Mode</span>
                       </div>
                       <p className="text-green-700 text-sm mt-1">
                         This data is now in production and is read-only. The data has been validated and approved for production use.
                         Any changes must go through a new import process.
                       </p>
                     </div>

                     {/* Enhanced Filters and Controls */}
                     <div className="mb-6 bg-white pb-4 border-b border-gray-200">
                       <div className="flex flex-col space-y-4 lg:space-y-0 lg:flex-row lg:items-center lg:justify-between">
                         {/* Search */}
                         <div className="flex-1 lg:max-w-md">
                           <div className="relative">
                             <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                             <input
                               type="text"
                               placeholder="Search all fields..."
                               value={tableState.searchTerm}
                               onChange={(e) => handleSearch(e.target.value)}
                               className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                             />
                           </div>
                         </div>

                         {/* Page Size */}
                         <div className="lg:w-40">
                           <select
                             value={tableState.pageSize}
                             onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                           >
                             <option value={10}>10 rows</option>
                             <option value={25}>25 rows</option>
                             <option value={50}>50 rows</option>
                             <option value={100}>100 rows</option>
                           </select>
                         </div>
                       </div>
                     </div>

                     {/* Enhanced Production Data Summary */}
                     <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 mb-4">
                       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                         <div className="flex items-center space-x-4 mb-3 sm:mb-0">
                           <div className="flex items-center space-x-2">
                             <div className="p-2 bg-green-100 rounded-lg">
                               <CheckCircleIcon className="h-5 w-5 text-green-600" />
                             </div>
                             <div>
                               <p className="text-sm font-medium text-green-900">
                                 {filteredData.length} of {allData.length} production records
                               </p>
                               <p className="text-xs text-green-700">
                                 Showing {((tableState.currentPage - 1) * tableState.pageSize) + 1} to{' '}
                                 {Math.min(tableState.currentPage * tableState.pageSize, filteredData.length)}
                               </p>
                             </div>
                           </div>
                           
                           {/* Production Stats */}
                           <div className="hidden lg:flex items-center space-x-4 text-xs text-green-700">
                             <span className="flex items-center space-x-1">
                               <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                               <span>Validated: {filteredData.filter(row => 
                                 Object.values(row).some(val => val && val.toString().trim() !== '')
                               ).length}</span>
                             </span>
                             <span className="flex items-center space-x-1">
                               <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                               <span>Total Fields: {stagingTable?.columnSchema?.length || 0}</span>
                             </span>
                           </div>
                         </div>
                         
                         {/* Production Actions */}
                         <div className="flex items-center space-x-2">
                           <Button
                             onClick={() => {
                               const csvContent = [
                                 stagingTable.columnSchema.map(col => col.name).join(','),
                                 ...filteredData.map(row => 
                                   stagingTable.columnSchema.map(col => {
                                     const value = row[col.name] || '';
                                     return typeof value === 'string' && value.includes(',') 
                                       ? `"${value}"` 
                                       : String(value);
                                   }).join(',')
                                 )
                               ].join('\n');
                               
                               const blob = new Blob([csvContent], { type: 'text/csv' });
                               const url = window.URL.createObjectURL(blob);
                               const a = document.createElement('a');
                               a.href = url;
                               a.download = `${selectedSession?.name || 'production'}_data.csv`;
                               a.click();
                               window.URL.revokeObjectURL(url);
                             }}
                             variant="secondary"
                             size="sm"
                             className="text-green-700 border-green-300 hover:bg-green-50"
                           >
                             <DownloadIcon className="h-4 w-4 mr-2" />
                             Export CSV
                           </Button>
                           
                           <Button
                             onClick={() => {
                               // Refresh data
                               loadSessionData();
                             }}
                             variant="secondary"
                             size="sm"
                             className="text-gray-700 border-gray-300 hover:bg-gray-50"
                           >
                             <RefreshIcon className="h-4 w-4 mr-2" />
                             Refresh
                           </Button>
                         </div>
                       </div>
                     </div>

                                                                                       {/* Enhanced Production Data Table */}
                       <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                         <div className="overflow-x-auto">
                           <table className="min-w-full divide-y divide-gray-200">
                             <thead className="bg-gradient-to-r from-green-50 to-emerald-100">
                               <tr>
                                 {stagingTable.columnSchema.map((column) => (
                                   <th
                                     key={column.name}
                                     onClick={() => handleSort(column.name)}
                                     className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-green-200 transition-colors duration-150 group"
                                   >
                                     <div className="flex items-center justify-between">
                                       <span className="font-semibold">{column.name.replace(/_/g, ' ').toUpperCase()}</span>
                                       <div className="flex items-center space-x-1">
                                         {tableState.sortColumn === column.name ? (
                                           tableState.sortDirection === 'asc' ? (
                                             <ChevronUpIcon className="h-4 w-4 text-green-500" />
                                           ) : (
                                             <ChevronDownIcon className="h-4 w-4 text-green-500" />
                                           )
                                         ) : (
                                           <ChevronUpIcon className="h-4 w-4 text-gray-400 group-hover:text-green-600" />
                                         )}
                                       </div>
                                     </div>
                                   </th>
                                 ))}
                                 <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider bg-green-50">
                                   Actions
                                 </th>
                               </tr>
                             </thead>
                             <tbody className="bg-white divide-y divide-gray-100">
                               {getPaginatedData().map((row: any, index: number) => (
                                 <tr 
                                   key={row.id || index} 
                                   className="hover:bg-green-50 transition-colors duration-150 group"
                                 >
                                   {stagingTable.columnSchema.map((column) => (
                                     <td key={column.name} className="px-4 py-3 text-sm">
                                       <div className="flex items-center">
                                         <span className="text-gray-900 group-hover:text-gray-700">
                                           {row[column.name] || (
                                             <span className="text-gray-400 italic">—</span>
                                           )}
                                         </span>
                                         {column.name.toLowerCase().includes('email') && row[column.name] && (
                                           <a 
                                             href={`mailto:${row[column.name]}`}
                                             className="ml-2 text-blue-600 hover:text-blue-800 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                                             title="Send email"
                                           >
                                             <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                               <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                               <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                                             </svg>
                                           </a>
                                         )}
                                         {column.name.toLowerCase().includes('phone') && row[column.name] && (
                                           <a 
                                             href={`tel:${row[column.name]}`}
                                             className="ml-2 text-green-600 hover:text-green-800 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                                             title="Call phone"
                                           >
                                             <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                               <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                             </svg>
                                           </a>
                                         )}
                                         {column.name.toLowerCase().includes('url') && row[column.name] && (
                                           <a 
                                             href={row[column.name].startsWith('http') ? row[column.name] : `https://${row[column.name]}`}
                                             target="_blank"
                                             rel="noopener noreferrer"
                                             className="ml-2 text-purple-600 hover:text-purple-800 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                                             title="Open link"
                                           >
                                             <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                               <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 01-1.414-1.414l3-3z" clipRule="evenodd" />
                                               <path fillRule="evenodd" d="M12 4a2 2 0 00-2 2v4a2 2 0 002 2h4a2 2 0 002-2V6a2 2 0 00-2-2h-4z" clipRule="evenodd" />
                                             </svg>
                                           </a>
                                         )}
                                       </div>
                                     </td>
                                   ))}
                                   <td className="px-4 py-3 text-sm text-gray-500">
                                     <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                                       <button
                                         onClick={() => {
                                           // Copy row data to clipboard
                                           const rowText = stagingTable.columnSchema
                                             .map(col => `${col.name}: ${row[col.name] || ''}`)
                                             .join('\n');
                                           navigator.clipboard.writeText(rowText);
                                           alert('Row data copied to clipboard!');
                                         }}
                                         className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-md transition-colors duration-150"
                                         title="Copy row data"
                                       >
                                         <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                           <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                                           <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                                         </svg>
                                       </button>
                                       <button
                                         onClick={() => {
                                           // View row details in a read-only modal
                                           alert(`Viewing production record ID: ${row.id}\n\nThis is a read-only view. Production data cannot be edited.`);
                                         }}
                                         className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors duration-150"
                                         title="View record details (read-only)"
                                       >
                                         <EyeIcon className="h-4 w-4" />
                                       </button>
                                     </div>
                                   </td>
                                 </tr>
                               ))}
                             </tbody>
                           </table>
                         </div>
                        
                        {/* Enhanced Empty State */}
                        {getPaginatedData().length === 0 && (
                          <div className="text-center py-12 bg-gray-50">
                            <FunnelIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No records found</h3>
                            <p className="text-gray-500 mb-4">
                              {tableState.searchTerm 
                                ? `No records match "${tableState.searchTerm}"` 
                                : 'No production data available for this session'
                              }
                            </p>
                            {tableState.searchTerm && (
                              <button
                                onClick={() => handleSearch('')}
                                className="text-green-600 hover:text-green-700 font-medium"
                              >
                                Clear search
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                     {/* Enhanced Pagination */}
                     {Math.ceil(filteredData.length / tableState.pageSize) > 1 && (
                       <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                         <div className="flex items-center justify-between">
                           <div className="flex flex-1 justify-between sm:hidden">
                             <Button
                               onClick={() => handlePageChange(tableState.currentPage - 1)}
                               disabled={tableState.currentPage === 1}
                               variant="secondary"
                               size="sm"
                               className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                             >
                               Previous
                             </Button>
                             <Button
                               onClick={() => handlePageChange(tableState.currentPage + 1)}
                               disabled={tableState.currentPage >= Math.ceil(filteredData.length / tableState.pageSize)}
                               variant="secondary"
                               size="sm"
                               className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                             >
                               Next
                             </Button>
                           </div>
                           <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                             <div>
                               <p className="text-sm text-gray-700">
                                 Showing{' '}
                                 <span className="font-medium">
                                   {((tableState.currentPage - 1) * tableState.pageSize) + 1}
                                 </span>{' '}
                                 to{' '}
                                 <span className="text-green-600 font-medium">
                                   {Math.min(tableState.currentPage * tableState.pageSize, filteredData.length)}
                                 </span>{' '}
                                 of{' '}
                                 <span className="font-medium">{filteredData.length}</span>{' '}
                                 results
                               </p>
                             </div>
                             <div>
                               <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                 <Button
                                   onClick={() => handlePageChange(tableState.currentPage - 1)}
                                   disabled={tableState.currentPage === 1}
                                   variant="secondary"
                                   size="sm"
                                   className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                 >
                                   <span className="sr-only">Previous</span>
                                   <ChevronUpIcon className="h-5 w-5 transform rotate-90" />
                                 </Button>
                                 
                                 {/* Page Numbers */}
                                 {(() => {
                                   const totalPages = Math.ceil(filteredData.length / tableState.pageSize);
                                   const currentPage = tableState.currentPage;
                                   const pages = [];
                                   
                                   // Always show first page
                                   if (currentPage > 1) {
                                     pages.push(1);
                                   }
                                   
                                   // Show ellipsis if there's a gap
                                   if (currentPage > 3) {
                                     pages.push('...');
                                   }
                                   
                                   // Show current page and surrounding pages
                                   for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
                                     if (i !== 1 && i !== totalPages) {
                                       pages.push(i);
                                     }
                                   }
                                   
                                   // Show ellipsis if there's a gap
                                   if (currentPage < totalPages - 2) {
                                     pages.push('...');
                                   }
                                   
                                   // Always show last page
                                   if (currentPage < totalPages) {
                                     pages.push(totalPages);
                                   }
                                   
                                   return pages.map((page, index) => (
                                     <button
                                       key={index}
                                       onClick={() => typeof page === 'number' ? handlePageChange(page) : null}
                                       disabled={page === '...'}
                                       className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                         page === currentPage
                                           ? 'z-10 bg-green-50 border-green-500 text-green-600'
                                           : page === '...'
                                           ? 'bg-white border-gray-300 text-gray-500 cursor-default'
                                           : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                       }`}
                                     >
                                       {page}
                                     </button>
                                   ));
                                 })()}
                                 
                                 <Button
                                   onClick={() => handlePageChange(tableState.currentPage + 1)}
                                   disabled={tableState.currentPage >= Math.ceil(filteredData.length / tableState.pageSize)}
                                   variant="secondary"
                                   size="sm"
                                   className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                 >
                                   <span className="sr-only">Next</span>
                                   <ChevronUpIcon className="h-5 w-5 transform -rotate-90" />
                                 </Button>
                               </nav>
                             </div>
                           </div>
                         </div>
                       </div>
                     )}
                   </div>
                 )}
               </Card>
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
                  <div className="mb-6 bg-white pb-4 border-b border-gray-200">
                    <div className="flex flex-col space-y-4 lg:space-y-0 lg:flex-row lg:items-center lg:justify-between">
                      {/* Search */}
                      <div className="flex-1 lg:max-w-md">
                        <div className="relative">
                          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search all fields..."
                            value={tableState.searchTerm}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-md focus:ring-orange-500 focus:border-orange-500"
                          />
                        </div>
                      </div>

                      {/* Right side controls */}
                      <div className="flex flex-col space-y-3 lg:space-y-0 lg:flex-row lg:items-center lg:space-x-4">
                        {/* File Filter */}
                        {selectedSession.files.length > 1 && (
                          <div className="lg:w-64">
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
                        <div className="lg:w-40">
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

             {/* Enhanced Edit Data Modal */}
       {isEditModalOpen && editingRowData && (
         <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[95vh] flex flex-col">
             {/* Header - Fixed */}
             <div className="bg-gradient-to-r from-orange-50 to-orange-100 px-6 py-4 border-b border-orange-200 flex-shrink-0">
               <div className="flex items-center justify-between">
                 <div className="flex items-center space-x-3">
                   <div className="p-2 bg-orange-100 rounded-lg">
                     <EyeIcon className="h-6 w-6 text-orange-600" />
                   </div>
                   <div>
                     <h3 className="text-xl font-bold text-gray-900">Edit Record</h3>
                     <p className="text-sm text-orange-700">Make changes to the selected record</p>
                   </div>
                 </div>
                 <button
                   onClick={() => {
                     setIsEditModalOpen(false);
                     setEditingRowData(null);
                     setEditingRowId(null);
                   }}
                   className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-colors duration-200"
                   title="Close modal"
                 >
                   <XMarkIcon className="h-6 w-6" />
                 </button>
               </div>
             </div>
             
             {/* Content - Scrollable */}
             <div className="flex-1 overflow-y-auto bg-gray-50">
               <div className="p-6">
                 <div className="bg-white rounded-lg border border-gray-200 p-6">
                   {/* Record Info */}
                   <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                     <div className="flex items-center space-x-2 text-blue-800">
                       <InformationCircleIcon className="h-5 w-5" />
                       <span className="font-medium">Editing Record ID: {editingRowId}</span>
                     </div>
                     <p className="text-sm text-blue-700 mt-1">
                       Changes will be saved to the staging table. You can continue editing other records or promote to production when ready.
                     </p>
                   </div>

                   {/* Form Fields */}
                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                     {stagingTable?.columnSchema ? (
                       stagingTable.columnSchema.map((column, index) => (
                         <div key={column.name} className="space-y-2">
                           <label className="block text-sm font-semibold text-gray-700 capitalize">
                             {column.name.replace(/_/g, ' ')}
                             <span className="text-gray-500 font-normal ml-1">({column.type || 'text'})</span>
                           </label>
                           <div className="relative">
                             <input
                               type={getInputType(column.name, editingRowData[column.name])}
                               value={editingRowData[column.name] || ''}
                               onChange={(e) => setEditingRowData((prev: any) => ({
                                 ...prev,
                                 [column.name]: e.target.value
                               }))}
                               className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 hover:border-gray-400"
                               placeholder={`Enter ${column.name.replace(/_/g, ' ').toLowerCase()}`}
                             />
                             {editingRowData[column.name] && (
                               <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                 <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                               </div>
                             )}
                           </div>
                           {getFieldDescription(column.name) && (
                             <p className="text-xs text-gray-500">{getFieldDescription(column.name)}</p>
                           )}
                         </div>
                       ))
                     ) : (
                       // Fallback: show all keys from editingRowData if columnSchema is not available
                       Object.keys(editingRowData).filter(key => key !== 'id').map((key, index) => (
                         <div key={key} className="space-y-2">
                           <label className="block text-sm font-semibold text-gray-700 capitalize">
                             {key.replace(/_/g, ' ')}
                           </label>
                           <div className="relative">
                             <input
                               type={getInputType(key, editingRowData[key])}
                               value={editingRowData[key] || ''}
                               onChange={(e) => setEditingRowData((prev: any) => ({
                                 ...prev,
                                 [key]: e.target.value
                               }))}
                               className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 hover:border-gray-400"
                               placeholder={`Enter ${key.replace(/_/g, ' ').toLowerCase()}`}
                             />
                             {editingRowData[key] && (
                               <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                 <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                               </div>
                             )}
                           </div>
                           {getFieldDescription(key) && (
                             <p className="text-xs text-gray-500">{getFieldDescription(key)}</p>
                           )}
                         </div>
                       ))
                     )}
                   </div>

                   {/* Validation Messages */}
                   {getValidationErrors(editingRowData).length > 0 && (
                     <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                       <div className="flex items-center space-x-2 text-red-800 mb-2">
                         <ExclamationTriangleIcon className="h-5 w-5" />
                         <span className="font-medium">Validation Issues</span>
                       </div>
                       <ul className="text-sm text-red-700 space-y-1">
                         {getValidationErrors(editingRowData).map((error, index) => (
                           <li key={index} className="flex items-center space-x-2">
                             <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                             <span>{error}</span>
                           </li>
                         ))}
                       </ul>
                     </div>
                   )}
                 </div>
               </div>
             </div>
             
             {/* Footer - Fixed */}
             <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex-shrink-0">
               <div className="flex items-center justify-between">
                 <div className="flex items-center space-x-4 text-sm text-gray-600">
                   <div className="flex items-center space-x-2">
                     <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                     <span>Valid fields</span>
                   </div>
                   <div className="flex items-center space-x-2">
                     <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                     <span>Empty fields</span>
                   </div>
                 </div>
                 <div className="flex items-center space-x-3">
                   <Button
                     onClick={handleResetChanges}
                     variant="secondary"
                     size="sm"
                     className="px-4 py-2.5 text-gray-600 hover:text-gray-800 border-gray-300 hover:border-gray-400"
                     title="Reset all changes to original values"
                   >
                     <RefreshIcon className="h-4 w-4 mr-2" />
                     Reset
                   </Button>
                   <Button
                     onClick={() => {
                       setIsEditModalOpen(false);
                       setEditingRowData(null);
                       setEditingRowId(null);
                     }}
                     variant="secondary"
                     size="sm"
                     className="px-6 py-2.5"
                   >
                     Cancel
                   </Button>
                   <Button
                     onClick={handleSaveEdit}
                     variant="primary"
                     size="sm"
                     className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2.5 shadow-lg hover:shadow-xl transition-all duration-200"
                     disabled={getValidationErrors(editingRowData).length > 0}
                   >
                     <CheckCircleIcon className="h-4 w-4 mr-2" />
                     Save Changes
                   </Button>
                 </div>
               </div>
             </div>
           </div>
         </div>
       )}
    </div>
  );
};

export default DataImportPage;
