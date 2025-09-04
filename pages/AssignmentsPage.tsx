import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { fetchAssignments, fetchUsers, fetchTracts, fetchUnits, createBulkAssignments } from '../services/api';
import { Assignment, User, Tract, Unit, AssignmentFilters, CreateAssignmentData } from '../types';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Table from '../components/ui/Table';
import Modal from '../components/ui/Modal';
import { PlusIcon, MagnifyingGlassIcon, FunnelIcon, ClipboardDocumentListIcon } from '../components/icons/Icons';

const AssignmentsPage: React.FC = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [tracts, setTracts] = useState<Tract[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<AssignmentFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAssets, setSelectedAssets] = useState<Array<{ type: 'Tract' | 'Unit', id: string, name: string }>>([]);
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

  useEffect(() => {
    if (searchTerm) {
      setFilters(prev => ({ ...prev, search: searchTerm }));
    } else {
      setFilters(prev => {
        const { search, ...rest } = prev;
        return rest;
      });
    }
  }, [searchTerm]);

  useEffect(() => {
    loadAssignments();
  }, [filters]);

  const loadData = async () => {
    try {
      const [assignmentsData, usersData, tractsData, unitsData] = await Promise.all([
        fetchAssignments(),
        fetchUsers(),
        fetchTracts(),
        fetchUnits()
      ]);
      setAssignments(assignmentsData || []);
      setUsers(usersData || []);
      setTracts(tractsData || []);
      setUnits(unitsData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      setAssignments([]);
      setUsers([]);
      setTracts([]);
      setUnits([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAssignments = async () => {
    try {
      setLoading(true);
      const assignmentsData = await fetchAssignments(filters);
      setAssignments(assignmentsData || []);
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

  const clearFilters = () => {
    setFilters({});
    setSearchTerm('');
  };

  const handleAssetSelection = (type: 'Tract' | 'Unit', id: string, name: string) => {
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

  const getStatusColor = (status: Assignment['status']) => {
    switch (status) {
      case 'Active': return 'text-green-600 bg-green-100';
      case 'Completed': return 'text-blue-600 bg-blue-100';
      case 'Cancelled': return 'text-red-600 bg-red-100';
      case 'Expired': return 'text-yellow-600 bg-yellow-100';
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
      accessor: 'asset',
      cell: (assignment: Assignment) => (
        <div>
          <div className="font-medium text-white">
            {assignment.assetType}: {assignment.assetId}
          </div>
          <div className="text-sm text-sc-slate">
            {assignment.asset?.tractName || assignment.asset?.unitName || 'Unknown Asset'}
          </div>
        </div>
      )
    },
    {
      header: 'Assigned Buyer',
      accessor: 'assignedBuyer',
      cell: (assignment: Assignment) => (
        <span className="text-sm text-sc-slate">{assignment.assignedBuyer?.name || 'Unknown'}</span>
      )
    },
    {
      header: 'Price Cap',
      accessor: 'priceCap',
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
          {new Date(assignment.assignedDate).toLocaleDateString()}
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
        <div className="text-lg text-gray-500">Loading assignments...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Assignment & Buyer Routing</h1>
          <p className="text-gray-600 mt-2">
            Manage tract and unit assignments to buyers with pricing caps and priority scoring
          </p>
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
              <span>New Assignment</span>
            </Button>
          </Link>
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
                  placeholder="Search assignments..."
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
                    <option value="Tract">Tract</option>
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
          Showing {assignments?.length || 0} assignment{(assignments?.length || 0) !== 1 ? 's' : ''}
          {Object.keys(filters).length > 0 && ' (filtered)'}
        </p>
      </div>

      {/* Assignments Table */}
      <Card>
        <div className="p-6">
          {!assignments || assignments.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg mb-2">No assignments found</div>
              <p className="text-gray-500">
                {Object.keys(filters).length > 0 
                  ? 'Try adjusting your filters or search terms'
                  : 'Get started by creating your first assignment'
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

      {/* Bulk Assignment Modal */}
      <Modal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        title="Bulk Asset Assignment"
        size="xl"
      >
        <div className="space-y-6">
          {/* Asset Selection */}
          <div>
            <h3 className="text-lg font-medium mb-3">Select Assets to Assign</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-h-64 overflow-y-auto">
              {/* Tracts */}
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Tracts</h4>
                <div className="space-y-2">
                  {tracts.map(tract => (
                    <label key={tract.id} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedAssets.some(asset => asset.type === 'Tract' && asset.id === tract.id)}
                        onChange={() => handleAssetSelection('Tract', tract.id, tract.tractName)}
                        className="rounded border-gray-300 text-sc-blue focus:ring-sc-blue"
                      />
                      <span className="text-sm text-gray-700">
                        {tract.tractName} ({tract.county}, {tract.state})
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
              placeholder="Add notes about this assignment..."
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
