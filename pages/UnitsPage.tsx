import React, { useState, useEffect, useMemo } from 'react';
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
  const [sortField, setSortField] = useState<keyof Unit | string>('unitName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);
  
  // Initialize column visibility from localStorage
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('units-column-visibility');
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
    const saved = localStorage.getItem('units-column-widths');
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

  const handleSort = (field: keyof Unit | string) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field with default ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Sort units based on current sort field and direction
  const sortedUnits = useMemo(() => {
    return [...units].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'unitName':
          aValue = a.unitName || '';
          bValue = b.unitName || '';
          break;
        case 'operator':
          aValue = a.operator || '';
          bValue = b.operator || '';
          break;
        case 'county':
          aValue = a.county || '';
          bValue = b.county || '';
          break;
        case 'status':
          aValue = a.status || '';
          bValue = b.status || '';
          break;
        case 'sectionCount':
          aValue = a.sectionCount || a.linkedSectionIds?.length || 0;
          bValue = b.sectionCount || b.linkedSectionIds?.length || 0;
          break;
        case 'estimatedNetAcres':
          aValue = a.estimatedNetAcres || 0;
          bValue = b.estimatedNetAcres || 0;
          break;
        case 'assignedBuyer':
          aValue = a.buyer || a.assignedBuyer?.name || 'Unassigned';
          bValue = b.buyer || b.assignedBuyer?.name || 'Unassigned';
          break;
        default:
          aValue = a[sortField as keyof Unit] ?? '';
          bValue = b[sortField as keyof Unit] ?? '';
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
  }, [units, sortField, sortDirection]);

  const getStatusColor = (status: Unit['status']) => {
    switch (status) {
      case 'Producing': return 'text-green-600 bg-green-100';
      case 'Permitted': return 'text-blue-600 bg-blue-100';
      case 'Held by Production': return 'text-yellow-600 bg-yellow-100';
      case 'Plugged': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Split unit name into individual well names if multiple wells are present
  // Pattern: Split when we see a well identifier (ending with pattern like XHW, XHM, or containing dashes/numbers)
  // followed by a space and then a capital letter sequence that starts a new well name
  const splitUnitName = (unitName: string): string[] => {
    if (!unitName) return [];
    
    // Pattern: Split on space that comes after a well identifier pattern
    // Well identifier: ends with letters like XHW/XHM or contains dashes with numbers/letters (at least 2 chars)
    // Lookahead: followed by capital letters (could be single word like "GAPSTOW" or two words like "CURLY BILL")
    // followed by space and then digits/dashes (the well number)
    // This splits both:
    // - "CURLY BILL 2-27-34XHW CURLY BILL 6-27-34XHM" (two-word well names)
    // - "GAPSTOW 2-25-23XHW GAPSTOW 3-14-25XHW" (single-word well names)
    const parts = unitName.split(/(?<=[\d-]+[A-Z0-9]{2,})\s+(?=[A-Z]+(?:\s+[A-Z]+)?\s+[\d-])/);
    
    // If no split occurred, return the original name as single item
    if (parts.length === 1) {
      return [unitName];
    }
    
    // Return the split parts, trimming whitespace
    return parts.map(part => part.trim()).filter(part => part.length > 0);
  };

  const allColumns = [
    {
      header: 'Unit Name',
      accessor: 'unitName',
      sortable: true,
      className: 'whitespace-normal min-w-0 w-1/3',
      alwaysVisible: false,
      cell: (unit: Unit) => {
        const wellNames = splitUnitName(unit.unitName || 'Unnamed Unit');
        return (
          <Link 
            to={`/units/${unit.id}`}
            className="text-sc-blue hover:text-sc-blue-dark font-medium block"
          >
            {wellNames.map((name, index) => (
              <div key={index} className="break-words">{name}</div>
            ))}
          </Link>
        );
      }
    },
    {
      header: 'Operator',
      accessor: 'operator',
      sortable: true,
      className: 'w-24',
      cell: (unit: Unit) => unit.operator
    },
    {
      header: 'County',
      accessor: 'county',
      sortable: true,
      className: 'w-32',
      cell: (unit: Unit) => `${unit.county}, ${unit.state}`
    },
    {
      header: 'Status',
      accessor: 'status',
      sortable: true,
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
      sortable: true,
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
      sortable: true,
      className: 'w-24',
      cell: (unit: Unit) => unit.estimatedNetAcres ? unit.estimatedNetAcres.toLocaleString() : 'N/A'
    },
    {
      header: 'Assigned Buyer',
      accessor: 'assignedBuyer',
      sortable: true,
      className: 'w-28',
      cell: (unit: Unit) => unit.buyer || unit.assignedBuyer?.name || 'Unassigned'
    },
    {
      header: 'Actions',
      accessor: 'actions',
      className: 'w-24',
      alwaysVisible: true,
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

  // Filter columns based on visibility
  const columns = React.useMemo(() => {
    return allColumns.filter(col => {
      const accessor = col.accessor as string;
      // Always show Actions column
      if (col.alwaysVisible) return true;
      // Show if in visibleColumns set, or if visibleColumns is empty (initial state - show all)
      return visibleColumns.size === 0 || visibleColumns.has(accessor);
    });
  }, [visibleColumns]);

  // Initialize visible columns on mount if not set
  useEffect(() => {
    if (visibleColumns.size === 0) {
      const allAccessors = allColumns.map(col => col.accessor as string);
      setVisibleColumns(new Set(allAccessors));
      localStorage.setItem('units-column-visibility', JSON.stringify(Array.from(allAccessors)));
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
    localStorage.setItem('units-column-visibility', JSON.stringify(Array.from(newVisible)));
  };

  const showAllColumns = () => {
    const allAccessors = allColumns.map(col => col.accessor as string);
    const newVisible = new Set(allAccessors);
    setVisibleColumns(newVisible);
    localStorage.setItem('units-column-visibility', JSON.stringify(Array.from(newVisible)));
  };

  const hideAllColumns = () => {
    const newVisible = new Set(['actions']); // Keep only Actions
    setVisibleColumns(newVisible);
    localStorage.setItem('units-column-visibility', JSON.stringify(Array.from(newVisible)));
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
      const newWidth = Math.max(100, resizeStartWidth + diff); // Minimum width of 100px
      setColumnWidths(prev => {
        const updated = { ...prev, [resizingColumn]: newWidth };
        localStorage.setItem('units-column-widths', JSON.stringify(updated));
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
    return columnWidths[accessor] || 150; // Default width of 150px
  };

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
                                className="h-4 w-4 rounded border-gray-300 text-green-500 focus:ring-green-500"
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
                                      localStorage.setItem('units-column-widths', JSON.stringify(updated));
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
                                    const newWidth = Math.max(100, getColumnWidth(accessor) - 50);
                                    setColumnWidths(prev => {
                                      const updated = { ...prev, [accessor]: newWidth };
                                      localStorage.setItem('units-column-widths', JSON.stringify(updated));
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
                                      localStorage.setItem('units-column-widths', JSON.stringify(updated));
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
                            isSortable && handleSort(column.accessor as keyof Unit | string);
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
                  {sortedUnits.map((item, rowIndex) => (
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
    </div>
  );
};

export default UnitsPage;
