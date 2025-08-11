import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchUnits, fetchUsers } from '../services/api';
import { Unit, User, UnitFilters } from '../types';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Table from '../components/ui/Table';
import Modal from '../components/ui/Modal';
import { PlusIcon, MagnifyingGlassIcon, FunnelIcon, LockClosedIcon, LockOpenIcon } from '../components/icons/Icons';

const UnitsPage: React.FC = () => {
  const [units, setUnits] = useState<Unit[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<UnitFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

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
    loadUnits();
  }, [filters]);

  const loadData = async () => {
    try {
      const [unitsData, usersData] = await Promise.all([
        fetchUnits(),
        fetchUsers()
      ]);
      setUnits(unitsData || []);
      setUsers(usersData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      setUnits([]);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const loadUnits = async () => {
    try {
      setLoading(true);
      const unitsData = await fetchUnits(filters);
      setUnits(unitsData || []);
    } catch (error) {
      console.error('Error loading units:', error);
      setUnits([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof UnitFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm('');
  };

  const getStatusColor = (status: Unit['status']) => {
    switch (status) {
      case 'Producing': return 'text-green-600 bg-green-100';
      case 'Permitted': return 'text-blue-600 bg-blue-100';
      case 'Held by Production': return 'text-yellow-600 bg-yellow-100';
      case 'Plugged': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const columns = [
    {
      header: 'Unit Name',
      accessor: 'unitName',
      cell: (unit: Unit) => (
        <Link 
          to={`/units/${unit.id}`}
          className="text-sc-blue hover:text-sc-blue-dark font-medium"
        >
          {unit.unitName}
        </Link>
      )
    },
    {
      header: 'Operator',
      accessor: 'operator',
      cell: (unit: Unit) => unit.operator
    },
    {
      header: 'County',
      accessor: 'county',
      cell: (unit: Unit) => `${unit.county}, ${unit.state}`
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (unit: Unit) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(unit.status)}`}>
          {unit.status}
        </span>
      )
    },
    {
      header: 'Gross Acres',
      accessor: 'estimatedGrossAcres',
      cell: (unit: Unit) => unit.estimatedGrossAcres.toLocaleString()
    },
    {
      header: 'Assigned Buyer',
      accessor: 'assignedBuyer',
      cell: (unit: Unit) => unit.assignedBuyer?.name || 'Unassigned'
    },
    {
      header: 'Actions',
      accessor: 'actions',
      cell: (unit: Unit) => (
        <div className="flex items-center space-x-2">
          {unit.isLocked ? (
            <LockClosedIcon className="h-4 w-4 text-red-500" title="Unit is locked" />
          ) : (
            <LockOpenIcon className="h-4 w-4 text-green-500" title="Unit is unlocked" />
          )}
          <Link
            to={`/units/${unit.id}`}
            className="text-sc-blue hover:text-sc-blue-dark text-sm font-medium"
          >
            View
          </Link>
        </div>
      )
    }
  ];

  if (loading && units.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-500">Loading units...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Unit Management</h1>
          <p className="text-gray-600 mt-2">
            Manage leasehold-based pooled acreage groups across minerals and non-operated workflows
          </p>
        </div>
        <Link to="/units/new">
          <Button className="flex items-center space-x-2">
            <PlusIcon className="h-5 w-5" />
            <span>Add Unit</span>
          </Button>
        </Link>
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
                  placeholder="Search by unit name or API number..."
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
                    Operator
                  </label>
                  <Input
                    type="text"
                    placeholder="Filter by operator"
                    value={filters.operator || ''}
                    onChange={(e) => handleFilterChange('operator', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Formation
                  </label>
                  <Input
                    type="text"
                    placeholder="Filter by formation"
                    value={filters.formation || ''}
                    onChange={(e) => handleFilterChange('formation', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    County
                  </label>
                  <Input
                    type="text"
                    placeholder="Filter by county"
                    value={filters.county || ''}
                    onChange={(e) => handleFilterChange('county', e.target.value)}
                  />
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
                    <option value="Permitted">Permitted</option>
                    <option value="Producing">Producing</option>
                    <option value="Held by Production">Held by Production</option>
                    <option value="Plugged">Plugged</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assigned Buyer
                  </label>
                  <select
                    value={filters.assignedBuyer || ''}
                    onChange={(e) => handleFilterChange('assignedBuyer', e.target.value || undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sc-blue focus:border-transparent"
                  >
                    <option value="">All Buyers</option>
                    {users && users.length > 0 && users
                      .filter(u => u.role && u.role.name === 'Buyer')
                      .map(user => (
                        <option key={user.id} value={user.id}>
                          {user.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fund Status
                  </label>
                  <select
                    value={filters.heldByFund === undefined ? '' : filters.heldByFund.toString()}
                    onChange={(e) => handleFilterChange('heldByFund', e.target.value === '' ? undefined : e.target.value === 'true')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sc-blue focus:border-transparent"
                  >
                    <option value="">All</option>
                    <option value="true">Held by Fund</option>
                    <option value="false">Not Held by Fund</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lock Status
                  </label>
                  <select
                    value={filters.isLocked === undefined ? '' : filters.isLocked.toString()}
                    onChange={(e) => handleFilterChange('isLocked', e.target.value === '' ? undefined : e.target.value === 'true')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sc-blue focus:border-transparent"
                  >
                    <option value="">All</option>
                    <option value="true">Locked</option>
                    <option value="false">Unlocked</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Results Summary */}
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          Showing {units?.length || 0} unit{(units?.length || 0) !== 1 ? 's' : ''}
          {Object.keys(filters).length > 0 && ' (filtered)'}
        </p>
      </div>

      {/* Units Table */}
      <Card>
        <div className="p-6">
          {!units || units.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg mb-2">No units found</div>
              <p className="text-gray-500">
                {Object.keys(filters).length > 0 
                  ? 'Try adjusting your filters or search terms'
                  : 'Get started by adding your first unit'
                }
              </p>
            </div>
          ) : (
            <Table
              data={units}
              columns={columns}
              className="w-full"
            />
          )}
        </div>
      </Card>
    </div>
  );
};

export default UnitsPage;
