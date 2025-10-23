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

  const loadData = async () => {
    try {
      const [unitsResponse, usersResponse] = await Promise.all([
        fetchUnits(),
        fetchUsers()
      ]);
      const unitsData = unitsResponse.data || unitsResponse;
      const usersData = usersResponse.data || usersResponse;
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
      const unitsResponse = await fetchUnits();
      const unitsData = unitsResponse.data || unitsResponse;
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
      className: 'whitespace-normal min-w-0 w-1/3',
      cell: (unit: Unit) => (
        <Link 
          to={`/units/${unit.id}`}
          className="text-sc-blue hover:text-sc-blue-dark font-medium block"
        >
          {unit.unitName.split('\n').map((line, index) => (
            <div key={index} className="break-words">{line}</div>
          ))}
        </Link>
      )
    },
    {
      header: 'Operator',
      accessor: 'operator',
      className: 'w-24',
      cell: (unit: Unit) => unit.operator
    },
    {
      header: 'County',
      accessor: 'county',
      className: 'w-32',
      cell: (unit: Unit) => `${unit.county}, ${unit.state}`
    },
    {
      header: 'Status',
      accessor: 'status',
      className: 'w-32',
      cell: (unit: Unit) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(unit.status)}`}>
          {unit.status}
        </span>
      )
    },
    {
      header: 'Sections',
      accessor: 'sectionCount',
      className: 'w-20',
      cell: (unit: Unit) => (
        <span className="text-sm text-gray-600">
          {unit.sectionCount || unit.linkedSectionIds?.length || 0} sections
        </span>
      )
    },
    {
      header: 'Net Acres',
      accessor: 'estimatedNetAcres',
      className: 'w-24',
      cell: (unit: Unit) => unit.estimatedNetAcres ? unit.estimatedNetAcres.toLocaleString() : 'N/A'
    },
    {
      header: 'Assigned Buyer',
      accessor: 'assignedBuyer',
      className: 'w-28',
      cell: (unit: Unit) => unit.buyer || unit.assignedBuyer?.name || 'Unassigned'
    },
    {
      header: 'Actions',
      accessor: 'actions',
      className: 'w-24',
      cell: (unit: Unit) => (
        <div className="flex items-center space-x-2">
          {unit.isLocked ? (
            <LockClosedIcon className="h-4 w-4 text-red-500" />
          ) : (
            <LockOpenIcon className="h-4 w-4 text-green-500" />
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
      {/* Header with white background and icon */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5-10v1m0-1v1m0 0h1m-1 0h1" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Unit Management</h1>
              <p className="text-gray-600 mt-1">
                Manage leasehold-based pooled acreage groups across minerals and non-operated workflows
              </p>
            </div>
          </div>
          <Link to="/units/new">
            <Button className="flex items-center space-x-2">
              <PlusIcon className="h-5 w-5" />
              <span>Add Unit</span>
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
                  placeholder="Search by unit name or API number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filter Toggle */}
            <Button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            >
              <FunnelIcon className="h-5 w-5" />
              <span>Filters</span>
            </Button>

            {/* Clear Filters */}
            {Object.keys(filters).length > 0 && (
              <Button 
                onClick={clearFilters}
                className="border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              >
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
          {loading ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg mb-2">Loading units...</div>
            </div>
          ) : !units || units.length === 0 ? (
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
              className="w-full table-auto"
            />
          )}
        </div>
      </Card>
    </div>
  );
};

export default UnitsPage;
