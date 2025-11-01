import React, { useState, useEffect, useCallback } from 'react';
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

  const columns = [
    {
      header: 'Asset',
      accessor: 'assetType',
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
      cell: (assignment: Assignment) => (
        <span className="text-sm text-sc-slate">{assignment.assignedBuyer?.name || assignment.assignedBuyerId || 'Unknown'}</span>
      )
    },
    {
      header: 'Price Cap',
      accessor: 'priceCapUsd',
      cell: (assignment: Assignment) => (
        <div>
          <div className="font-medium text-white">
            ${assignment.priceCapUsd ? assignment.priceCapUsd.toLocaleString() : 'N/A'}
          </div>
          <div className="text-sm text-sc-slate">
            {assignment.priceCapType}
          </div>
        </div>
      )
    },
    {
      header: 'Source',
      accessor: 'sourceChannel',
      cell: (assignment: Assignment) => (
        <span className="text-sm text-sc-slate">{assignment.sourceChannel}</span>
      )
    },
    {
      header: 'Priority',
      accessor: 'priorityScore',
      cell: (assignment: Assignment) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(assignment.priorityScore)}`}>
          {assignment.priorityScore}
        </span>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (assignment: Assignment) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(assignment.status)}`}>
          {assignment.status}
        </span>
      )
    },
    {
      header: 'Assigned Date',
      accessor: 'assignedDate',
      cell: (assignment: Assignment) => (
        <span className="text-sm text-sc-slate">
          {assignment.assignedDate ? new Date(assignment.assignedDate).toLocaleDateString() : 'N/A'}
        </span>
      )
    },
    {
      header: 'Actions',
      accessor: 'actions',
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
        <Table
          data={assignments}
          columns={columns}
          className="w-full"
        />
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
