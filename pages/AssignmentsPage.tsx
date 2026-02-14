import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { fetchAssignments, fetchUsers, fetchSections, fetchUnits, createBulkAssignments } from '../services/api';
import { Assignment, User, Section, Unit, AssignmentFilters, CreateAssignmentData } from '../types';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Table from '../components/ui/Table';
import Modal from '../components/ui/Modal';
import { PlusIcon, MagnifyingGlassIcon, FunnelIcon, ClipboardDocumentListIcon } from '../components/icons/Icons';

const AssignmentsPage: React.FC = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<AssignmentFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof Assignment | string>('assignedDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);
  
  // Initialize column visibility from localStorage
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('assignments-column-visibility');
    if (saved) {
      try {
        return new Set(JSON.parse(saved));
      } catch (e) {
        return new Set();
      }
    }
    return new Set();
  });

  // Column width state and resizing
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('assignments-column-widths');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return {};
      }
    }
    return {};
  });
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const [resizeStartX, setResizeStartX] = useState(0);
  const [resizeStartWidth, setResizeStartWidth] = useState(0);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedAssets, setSelectedAssets] = useState<Array<{ type: 'Section' | 'Unit', id: string, name: string }>>([]);
  const [bulkAssignmentData, setBulkAssignmentData] = useState<Partial<CreateAssignmentData>>({
    assignedBuyerId: '',
    priceCapUsd: 0,
    priceCapType: 'Per NRA',
    sourceChannel: 'Broker',
    priorityScore: 50,
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  // Load data when page or page size changes
  useEffect(() => {
    if (currentPage > 1 || pageSize !== 50) {
      loadData(currentPage, pageSize);
    }
  }, [currentPage, pageSize]);

  useEffect(() => {
    if (searchTerm) {
      setFilters(prev => ({ ...prev, search: searchTerm }));
      setCurrentPage(1); // Reset to first page when searching
    } else {
      setFilters(prev => {
        const { search, ...rest } = prev;
        return rest;
      });
    }
  }, [searchTerm]);

  useEffect(() => {
    // Only reload assignments if filters have actually changed (not on initial load)
    if (Object.keys(filters).length > 0) {
      loadAssignments();
    }
  }, [filters]);

  const loadData = async (page = currentPage, limit = pageSize) => {
    try {
      setLoading(true);
      
      const [assignmentsResponse, usersResponse, sectionsResponse, unitsResponse] = await Promise.all([
        fetchAssignments(page, limit, searchTerm),
        fetchUsers(),
        fetchSections(),
        fetchUnits()
      ]);
      
      const assignmentsData = assignmentsResponse.data || assignmentsResponse;
      const usersData = usersResponse.data || usersResponse;
      const sectionsData = sectionsResponse.data || sectionsResponse;
      const unitsData = unitsResponse.data || unitsResponse;
      
      setAssignments(assignmentsData || []);
      setUsers(usersData || []);
      setSections(sectionsData || []);
      setUnits(unitsData || []);
      
      // Update pagination info
      if (assignmentsResponse.pagination) {
        setTotalPages(assignmentsResponse.pagination.totalPages);
        setTotalItems(assignmentsResponse.pagination.total);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setAssignments([]);
      setUsers([]);
      setSections([]);
      setUnits([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAssignments = async () => {
    try {
      setLoading(true);
      const assignmentsResponse = await fetchAssignments(currentPage, pageSize, searchTerm);
      const assignmentsData = assignmentsResponse.data || assignmentsResponse;
      
      setAssignments(assignmentsData || []);
      
      // Update pagination info
      if (assignmentsResponse.pagination) {
        setTotalPages(assignmentsResponse.pagination.totalPages);
        setTotalItems(assignmentsResponse.pagination.total);
      }
    } catch (error) {
      console.error('Error loading assignments:', error);
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof AssignmentFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadData(page, pageSize);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
    loadData(1, newPageSize);
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm('');
  };

  const handleSort = (field: keyof Assignment | string) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field with default ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Sort assignments based on current sort field and direction
  const sortedAssignments = useMemo(() => {
    return [...assignments].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'assetType':
          aValue = a.assetType || '';
          bValue = b.assetType || '';
          break;
        case 'assignedBuyerId':
          aValue = a.assignedBuyer?.name || a.assignedBuyerId || '';
          bValue = b.assignedBuyer?.name || b.assignedBuyerId || '';
          break;
        case 'priceCapUsd':
          aValue = a.priceCapUsd || 0;
          bValue = b.priceCapUsd || 0;
          break;
        case 'sourceChannel':
          aValue = a.sourceChannel || '';
          bValue = b.sourceChannel || '';
          break;
        case 'priorityScore':
          aValue = a.priorityScore || 0;
          bValue = b.priorityScore || 0;
          break;
        case 'status':
          aValue = a.status || '';
          bValue = b.status || '';
          break;
        case 'assignedDate':
          aValue = a.assignedDate ? new Date(a.assignedDate).getTime() : 0;
          bValue = b.assignedDate ? new Date(b.assignedDate).getTime() : 0;
          break;
        default:
          aValue = a[sortField as keyof Assignment] ?? '';
          bValue = b[sortField as keyof Assignment] ?? '';
      }

      // Handle comparison
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();
      if (aStr < bStr) return sortDirection === 'asc' ? -1 : 1;
      if (aStr > bStr) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [assignments, sortField, sortDirection]);

  const handleAssetSelection = (type: 'Section' | 'Unit', id: string, name: string) => {
    const assetKey = `${type}-${id}`;
    const isSelected = selectedAssets.some(asset => `${asset.type}-${asset.id}` === assetKey);
    
    if (isSelected) {
      setSelectedAssets(prev => prev.filter(asset => `${asset.type}-${asset.id}` !== assetKey));
    } else {
      setSelectedAssets(prev => [...prev, { type, id, name }]);
    }
  };

  const handleBulkAssignment = async () => {
    if (!bulkAssignmentData.assignedBuyerId || !bulkAssignmentData.priceCapUsd || selectedAssets.length === 0) {
      alert('Please fill in all required fields and select at least one asset');
      return;
    }

    try {
      const bulkData: CreateAssignmentData[] = selectedAssets.map(asset => ({
        assetType: asset.type,
        assetId: asset.id,
        assignedBuyerId: bulkAssignmentData.assignedBuyerId!,
        priceCapUsd: bulkAssignmentData.priceCapUsd!,
        priceCapType: bulkAssignmentData.priceCapType!,
        sourceChannel: bulkAssignmentData.sourceChannel!,
        priorityScore: bulkAssignmentData.priorityScore!,
        notes: bulkAssignmentData.notes
      }));

      await createBulkAssignments(bulkData);
      await loadAssignments();
      setShowBulkModal(false);
      setSelectedAssets([]);
      setBulkAssignmentData({
        assignedBuyerId: '',
        priceCapUsd: 0,
        priceCapType: 'Per NRA',
        sourceChannel: 'Broker',
        priorityScore: 50,
        notes: ''
      });
    } catch (error) {
      console.error('Error creating bulk assignments:', error);
      alert('Failed to create bulk assignments');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'text-green-600 bg-green-100';
      case 'Completed': return 'text-blue-600 bg-blue-100';
      case 'Cancelled': return 'text-red-600 bg-red-100';
      case 'Expired': return 'text-yellow-600 bg-yellow-100';
      case 'Pending': return 'text-yellow-600 bg-yellow-100';
      case 'DROPPED': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (score: number) => {
    if (score >= 80) return 'text-red-600 bg-red-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const allColumns = [
    {
      header: 'Asset',
      accessor: 'assetType',
      sortable: true,
      alwaysVisible: false,
      cell: (assignment: Assignment) => (
        <div>
          <div className="font-medium text-black">
            {assignment.assetType}: 
            <div className="mt-1">
              {assignment.assetId.split(/\s+(?=[A-Z]+\s+\d+)/).map((unitName, index) => (
                <div key={index} className="text-sm text-black">{unitName.trim()}</div>
              ))}
            </div>
          </div>
        </div>
      )
    },
    {
      header: 'Assigned Buyer',
      accessor: 'assignedBuyerId',
      sortable: true,
      cell: (assignment: Assignment) => (
        <span className="text-sm text-sc-slate">{assignment.assignedBuyer?.name || assignment.assignedBuyerId || 'Unknown'}</span>
      )
    },
    {
      header: 'Price Cap',
      accessor: 'priceCapUsd',
      sortable: true,
      cell: (assignment: Assignment) => (
        <div>
          <div className="font-medium text-gray-900">
            ${assignment.priceCapUsd ? assignment.priceCapUsd.toLocaleString() : 'N/A'}
          </div>
          <div className="text-sm text-gray-600">
            {assignment.priceCapType}
          </div>
        </div>
      )
    },
    {
      header: 'Source',
      accessor: 'sourceChannel',
      sortable: true,
      cell: (assignment: Assignment) => (
        <span className="text-sm text-sc-slate">{assignment.sourceChannel}</span>
      )
    },
    {
      header: 'Priority',
      accessor: 'priorityScore',
      sortable: true,
      cell: (assignment: Assignment) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(assignment.priorityScore)}`}>
          {assignment.priorityScore}
        </span>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      sortable: true,
      cell: (assignment: Assignment) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(assignment.status)}`}>
          {assignment.status}
        </span>
      )
    },
    {
      header: 'Assigned Date',
      accessor: 'assignedDate',
      sortable: true,
      cell: (assignment: Assignment) => (
        <span className="text-sm text-sc-slate">
          {assignment.assignedDate ? new Date(assignment.assignedDate).toLocaleDateString() : 'N/A'}
        </span>
      )
    },
    {
      header: 'Actions',
      accessor: 'actions',
      alwaysVisible: true,
      cell: (assignment: Assignment) => (
        <div className="flex space-x-2">
          <Link
            to={`/assignments/${assignment.id}`}
            className="text-sc-blue hover:text-sc-blue-dark text-sm font-medium"
          >
            View
          </Link>
        </div>
      )
    }
  ];

  // Filter columns based on visibility
  const columns = useMemo(() => {
    return allColumns.filter(col => {
      const accessor = col.accessor as string;
      if (col.alwaysVisible) return true;
      return visibleColumns.size === 0 || visibleColumns.has(accessor);
    });
  }, [visibleColumns]);

  // Initialize visible columns on mount if not set
  useEffect(() => {
    if (visibleColumns.size === 0) {
      const allAccessors = allColumns.map(col => col.accessor as string);
      setVisibleColumns(new Set(allAccessors));
      localStorage.setItem('assignments-column-visibility', JSON.stringify(Array.from(allAccessors)));
    }
  }, []);

  const toggleColumnVisibility = (accessor: string) => {
    const newVisible = new Set(visibleColumns);
    if (newVisible.has(accessor)) {
      newVisible.delete(accessor);
    } else {
      newVisible.add(accessor);
    }
    setVisibleColumns(newVisible);
    localStorage.setItem('assignments-column-visibility', JSON.stringify(Array.from(newVisible)));
  };

  const showAllColumns = () => {
    const allAccessors = allColumns.map(col => col.accessor as string);
    const newVisible = new Set(allAccessors);
    setVisibleColumns(newVisible);
    localStorage.setItem('assignments-column-visibility', JSON.stringify(Array.from(newVisible)));
  };

  const hideAllColumns = () => {
    const newVisible = new Set(['actions']);
    setVisibleColumns(newVisible);
    localStorage.setItem('assignments-column-visibility', JSON.stringify(Array.from(newVisible)));
  };

  // Column resizing handlers
  const handleResizeStart = (e: React.MouseEvent, accessor: string, currentWidth: number) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingColumn(accessor);
    setResizeStartX(e.clientX);
    setResizeStartWidth(currentWidth);
  };

  useEffect(() => {
    if (!resizingColumn) return;

    const handleMouseMove = (e: MouseEvent) => {
      const diff = e.clientX - resizeStartX;
      const newWidth = Math.max(20, resizeStartWidth + diff);
      setColumnWidths(prev => {
        const updated = { ...prev, [resizingColumn]: newWidth };
        localStorage.setItem('assignments-column-widths', JSON.stringify(updated));
        return updated;
      });
    };

    const handleMouseUp = () => {
      setResizingColumn(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingColumn, resizeStartX, resizeStartWidth]);

  const getColumnWidth = (accessor: string): number => {
    return columnWidths[accessor] || 150;
  };

  if (loading && assignments.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-500">Loading buyers...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header with white background and icon */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Buyer Management</h1>
              <p className="text-gray-600 mt-1">
                Manage section and unit assignments to buyers with pricing caps and priority scoring
              </p>
            </div>
          </div>
          <div className="flex space-x-3">
            <Button 
              onClick={() => setShowBulkModal(true)}
              className="flex items-center space-x-2"
            >
              <ClipboardDocumentListIcon className="h-5 w-5" />
              <span>Bulk Assign</span>
            </Button>
            <Link to="/assignments/new">
              <Button className="flex items-center space-x-2">
                <PlusIcon className="h-5 w-5" />
                <span>New Buyer</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <div className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search buyers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filter Toggle */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2"
            >
              <FunnelIcon className="h-5 w-5" />
              <span>Filters</span>
            </Button>

            {/* Column Visibility Toggle */}
            <div className="relative">
              <button
                onClick={() => setIsColumnMenuOpen(!isColumnMenuOpen)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 flex items-center space-x-2 border border-gray-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <span>Columns</span>
                <svg className={`w-4 h-4 transition-transform ${isColumnMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {isColumnMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setIsColumnMenuOpen(false)}
                  ></div>
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-20 max-h-96 overflow-y-auto">
                    <div className="p-3 border-b border-gray-200">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-semibold text-gray-900">Column Visibility</h3>
                        <div className="flex space-x-2">
                          <button
                            onClick={showAllColumns}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            Show All
                          </button>
                          <button
                            onClick={hideAllColumns}
                            className="text-xs text-gray-600 hover:text-gray-800"
                          >
                            Hide All
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="p-2">
                      {allColumns.map((column) => {
                        const accessor = column.accessor as string;
                        const isVisible = column.alwaysVisible || visibleColumns.size === 0 || visibleColumns.has(accessor);
                        const isDisabled = column.alwaysVisible;
                        
                        return (
                          <div key={accessor} className="p-2 rounded hover:bg-gray-50">
                            <label
                              className={`flex items-center space-x-2 cursor-pointer ${
                                isDisabled ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isVisible}
                                onChange={() => !isDisabled && toggleColumnVisibility(accessor)}
                                disabled={isDisabled}
                                className="h-4 w-4 rounded border-gray-300 text-purple-500 focus:ring-purple-500"
                              />
                              <span className="text-sm text-gray-700 flex-1">{column.header}</span>
                              {isDisabled && (
                                <span className="text-xs text-gray-400">Required</span>
                              )}
                            </label>
                            {!isDisabled && (
                              <div className="mt-1 flex items-center space-x-2">
                                <span className="text-xs text-gray-500">Width: {getColumnWidth(accessor)}px</span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const newWidth = getColumnWidth(accessor) + 50;
                                    setColumnWidths(prev => {
                                      const updated = { ...prev, [accessor]: newWidth };
                                      localStorage.setItem('assignments-column-widths', JSON.stringify(updated));
                                      return updated;
                                    });
                                  }}
                                  className="text-xs text-blue-600 hover:text-blue-800 px-2 py-0.5 rounded hover:bg-blue-50"
                                  title="Increase width by 50px"
                                >
                                  +50
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const newWidth = Math.max(20, getColumnWidth(accessor) - 50);
                                    setColumnWidths(prev => {
                                      const updated = { ...prev, [accessor]: newWidth };
                                      localStorage.setItem('assignments-column-widths', JSON.stringify(updated));
                                      return updated;
                                    });
                                  }}
                                  className="text-xs text-blue-600 hover:text-blue-800 px-2 py-0.5 rounded hover:bg-blue-50"
                                  title="Decrease width by 50px"
                                >
                                  -50
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setColumnWidths(prev => {
                                      const updated = { ...prev };
                                      delete updated[accessor];
                                      localStorage.setItem('assignments-column-widths', JSON.stringify(updated));
                                      return updated;
                                    });
                                  }}
                                  className="text-xs text-gray-600 hover:text-gray-800 px-2 py-0.5 rounded hover:bg-gray-100"
                                  title="Reset to default width"
                                >
                                  Reset
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Clear Filters */}
            {Object.keys(filters).length > 0 && (
              <Button variant="outline" onClick={clearFilters}>
                Clear All
              </Button>
            )}
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Asset Type
                  </label>
                  <select
                    value={filters.assetType || ''}
                    onChange={(e) => handleFilterChange('assetType', e.target.value || undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sc-blue focus:border-transparent"
                  >
                    <option value="">All Types</option>
                    <option value="Section">Section</option>
                    <option value="Unit">Unit</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assigned Buyer
                  </label>
                  <select
                    value={filters.assignedBuyerId || ''}
                    onChange={(e) => handleFilterChange('assignedBuyerId', e.target.value || undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sc-blue focus:border-transparent"
                  >
                    <option value="">All Buyers</option>
                    {users.filter(u => u.role.name === 'Buyer').map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Source Channel
                  </label>
                  <select
                    value={filters.sourceChannel || ''}
                    onChange={(e) => handleFilterChange('sourceChannel', e.target.value || undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sc-blue focus:border-transparent"
                  >
                    <option value="">All Sources</option>
                    <option value="Broker">Broker</option>
                    <option value="Inbound">Inbound</option>
                    <option value="Outbound">Outbound</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={filters.status || ''}
                    onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sc-blue focus:border-transparent"
                  >
                    <option value="">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="Expired">Expired</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority Min
                  </label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={filters.priorityMin || ''}
                    onChange={(e) => handleFilterChange('priorityMin', e.target.value ? parseInt(e.target.value) : undefined)}
                    min="0"
                    max="100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority Max
                  </label>
                  <Input
                    type="number"
                    placeholder="100"
                    value={filters.priorityMax || ''}
                    onChange={(e) => handleFilterChange('priorityMax', e.target.value ? parseInt(e.target.value) : undefined)}
                    min="0"
                    max="100"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Results Summary */}
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          Showing {assignments?.length || 0} buyer{(assignments?.length || 0) !== 1 ? 's' : ''}
          {Object.keys(filters).length > 0 && ' (filtered)'}
        </p>
      </div>

      {/* Buyers Table */}
      <Card>
        <div className="p-6">
      {loading ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg mb-2">Loading buyers...</div>
        </div>
      ) : !assignments || assignments.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg mb-2">No buyers found</div>
          <p className="text-gray-500">
            {Object.keys(filters).length > 0 
              ? 'Try adjusting your filters or search terms'
                  : 'Get started by creating your first buyer assignment'
            }
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-sc-light-orange shadow-lg overflow-x-auto">
          <table className="table-auto divide-y divide-sc-light-orange" style={{ minWidth: '100%', tableLayout: 'auto' }}>
            <thead className="bg-gray-100">
              <tr>
                {columns.map((column, index) => {
                  const isSortable = column.sortable !== false;
                  const isActiveSort = sortField === column.accessor;
                  const accessor = column.accessor as string;
                  const width = getColumnWidth(accessor);
                  const isResizing = resizingColumn === accessor;
                  
                  return (
                    <th
                      key={column.header || index}
                      scope="col"
                      style={{ width: `${width}px`, minWidth: `${width}px` }}
                      className={`px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200 relative ${
                        isSortable ? 'cursor-pointer hover:bg-gray-200 select-none' : ''
                      }`}
                      onClick={(e) => {
                        if ((e.target as HTMLElement).classList.contains('column-resizer')) {
                          return;
                        }
                        isSortable && handleSort(column.accessor as keyof Assignment | string);
                      }}
                    >
                      <div className="flex items-center space-x-1">
                        <span>{column.header}</span>
                        {isSortable && (
                          <span className="text-gray-400">
                            {isActiveSort ? (
                              sortDirection === 'asc' ? '↑' : '↓'
                            ) : (
                              <span className="opacity-30">⇅</span>
                            )}
                          </span>
                        )}
                      </div>
                      {/* Resizer handle */}
                      <div
                        className={`column-resizer absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 ${
                          isResizing ? 'bg-blue-500' : 'bg-transparent'
                        }`}
                        onMouseDown={(e) => handleResizeStart(e, accessor, width)}
                        style={{ userSelect: 'none' }}
                      />
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedAssignments.map((item, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-gray-50 transition-colors duration-150">
                  {columns.map((column, colIndex) => {
                    const accessor = column.accessor as string;
                    const width = getColumnWidth(accessor);
                    return (
                      <td
                        key={`${rowIndex}-${colIndex}`}
                        style={{ width: `${width}px`, minWidth: `${width}px` }}
                        className={`px-6 py-4 text-sm text-gray-900 ${column.className || 'whitespace-nowrap'}`}
                      >
                        {column.cell ? column.cell(item) : (item[column.accessor] as React.ReactNode)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
        </div>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <Card className="mt-6">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">
                  Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalItems)} of {totalItems} buyers
                </span>
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-700">Page size:</label>
                  <select
                    value={pageSize}
                    onChange={(e) => handlePageSizeChange(parseInt(e.target.value))}
                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                  >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm"
                >
                  Previous
                </Button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        onClick={() => handlePageChange(pageNum)}
                        className="px-3 py-1 text-sm"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm"
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Bulk Assignment Modal */}
      <Modal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        title="Bulk Buyer Assignment"
        size="xl"
      >
        <div className="space-y-6">
          {/* Asset Selection */}
          <div>
            <h3 className="text-lg font-medium mb-3">Select Assets to Assign</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-h-64 overflow-y-auto">
              {/* Sections */}
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Sections</h4>
                <div className="space-y-2">
                  {sections.map(section => (
                    <label key={section.id} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedAssets.some(asset => asset.type === 'Section' && asset.id === section.id)}
                        onChange={() => handleAssetSelection('Section', section.id, section.sectionName)}
                        className="rounded border-gray-300 text-sc-blue focus:ring-sc-blue"
                      />
                      <span className="text-sm text-gray-700">
                        {section.sectionName} ({section.county}, {section.state})
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Units */}
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Units</h4>
                <div className="space-y-2">
                  {units.map(unit => (
                    <label key={unit.id} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedAssets.some(asset => asset.type === 'Unit' && asset.id === unit.id)}
                        onChange={() => handleAssetSelection('Unit', unit.id, unit.unitName)}
                        className="rounded border-gray-300 text-sc-blue focus:ring-sc-blue"
                      />
                      <span className="text-sm text-gray-700">
                        {unit.unitName} ({unit.county}, {unit.state})
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Assignment Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assigned Buyer *
              </label>
              <select
                value={bulkAssignmentData.assignedBuyerId}
                onChange={(e) => setBulkAssignmentData(prev => ({ ...prev, assignedBuyerId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sc-blue"
                required
              >
                <option value="">Select Buyer</option>
                {users.filter(u => u.role.name === 'Buyer').map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price Cap Type *
              </label>
              <select
                value={bulkAssignmentData.priceCapType}
                onChange={(e) => setBulkAssignmentData(prev => ({ ...prev, priceCapType: e.target.value as 'Per NRA' | 'Per Acre' }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sc-blue"
                required
              >
                <option value="Per NRA">Per NRA</option>
                <option value="Per Acre">Per Acre</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price Cap (USD) *
              </label>
              <Input
                type="number"
                placeholder="0.00"
                value={bulkAssignmentData.priceCapUsd || ''}
                onChange={(e) => setBulkAssignmentData(prev => ({ ...prev, priceCapUsd: parseFloat(e.target.value) || 0 }))}
                min="0"
                step="0.01"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Source Channel *
              </label>
              <select
                value={bulkAssignmentData.sourceChannel}
                onChange={(e) => setBulkAssignmentData(prev => ({ ...prev, sourceChannel: e.target.value as 'Broker' | 'Inbound' | 'Outbound' }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sc-blue"
                required
              >
                <option value="Broker">Broker</option>
                <option value="Inbound">Inbound</option>
                <option value="Outbound">Outbound</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority Score *
              </label>
              <Input
                type="number"
                placeholder="50"
                value={bulkAssignmentData.priorityScore || ''}
                onChange={(e) => setBulkAssignmentData(prev => ({ ...prev, priorityScore: parseInt(e.target.value) || 50 }))}
                min="0"
                max="100"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={bulkAssignmentData.notes || ''}
              onChange={(e) => setBulkAssignmentData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sc-blue"
              placeholder="Add notes about this buyer assignment..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button variant="secondary" onClick={() => setShowBulkModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkAssignment} disabled={selectedAssets.length === 0}>
              Assign {selectedAssets.length} Asset{selectedAssets.length !== 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AssignmentsPage;
