import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { fetchLeads, fetchUsers, fetchSections, fetchUnits } from '../services/api';
import { LeadEnhanced, User, Section, Unit, LeadFilters } from '../types';
import Table from '../components/ui/Table';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { MagnifyingGlassIcon, FunnelIcon, PlusIcon } from '../components/icons/Icons';

const LeadsPage: React.FC = () => {
  const [leads, setLeads] = useState<LeadEnhanced[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<LeadFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortField, setSortField] = useState<keyof LeadEnhanced | string>('priorityScore');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);
  
  // Initialize column visibility from localStorage
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('leads-column-visibility');
    if (saved) {
      try {
        return new Set(JSON.parse(saved));
      } catch (e) {
        return new Set();
      }
    }
    return new Set();
  });
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  // Debounce search term to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    loadLeads();
  }, [filters, debouncedSearchTerm, currentPage, pageSize]);
  
  // Reset to page 1 when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, filters]);

  const loadData = async () => {
    try {
      const [usersData, sectionsData, unitsData] = await Promise.all([
        fetchUsers(),
        fetchSections().then(response => response.data || response),
        fetchUnits()
      ]);
      setUsers(usersData || []);
      setSections(sectionsData || []);
      setUnits(unitsData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const loadLeads = async () => {
    try {
      setLoading(true);
      const leadsResponse = await fetchLeads({
        ...filters,
        search: debouncedSearchTerm || undefined
      }, currentPage, pageSize);
      const leadsData = leadsResponse.data || leadsResponse;
      setLeads(Array.isArray(leadsData) ? leadsData : []);
      
      // Update pagination info
      if (leadsResponse.pagination) {
        setTotalPages(leadsResponse.pagination.totalPages || 0);
        setTotalItems(leadsResponse.pagination.total || 0);
      }
    } catch (error) {
      console.error('Error loading leads:', error);
      setLeads([]);
      setTotalPages(0);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };
  
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  
  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  const handleFilterChange = (key: keyof LeadFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm('');
  };

  const handleSort = (field: keyof LeadEnhanced | string) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field with default ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Sort leads based on current sort field and direction
  const sortedLeads = [...leads].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    // Handle different field types
    switch (sortField) {
      case 'linkedContact':
        aValue = a.linkedContact?.name || a.name || '';
        bValue = b.linkedContact?.name || b.name || '';
        break;
      case 'status':
        aValue = a.status || '';
        bValue = b.status || '';
        break;
      case 'priorityScore':
        aValue = a.priorityScore ?? 0;
        bValue = b.priorityScore ?? 0;
        break;
      case 'lastContactDate':
        aValue = a.lastContactDate ? new Date(a.lastContactDate).getTime() : 0;
        bValue = b.lastContactDate ? new Date(b.lastContactDate).getTime() : 0;
        break;
      case 'nextFollowUpDate':
        aValue = a.nextFollowUpDate ? new Date(a.nextFollowUpDate).getTime() : 0;
        bValue = b.nextFollowUpDate ? new Date(b.nextFollowUpDate).getTime() : 0;
        break;
      case 'buyer':
        aValue = a.buyer?.name || '';
        bValue = b.buyer?.name || '';
        break;
      default:
        aValue = a[sortField as keyof LeadEnhanced] ?? '';
        bValue = b[sortField as keyof LeadEnhanced] ?? '';
    }

    // Handle comparison
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const getStatusColor = (status: LeadEnhanced['status']) => {
    switch (status) {
      case 'Uncontacted': return 'bg-gray-100 text-gray-800';
      case 'Spoke': return 'bg-blue-100 text-blue-800';
      case 'Interested': return 'bg-green-100 text-green-800';
      case 'LOI Sent': return 'bg-yellow-100 text-yellow-800';
      case 'Dead': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 80) return 'bg-red-100 text-red-800';
    if (priority >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const allColumns = [
    {
      header: 'Contact',
      accessor: 'linkedContact',
      sortable: true,
      className: 'min-w-[200px]',
      alwaysVisible: false,
      cell: (lead: LeadEnhanced) => {
        // Use the same logic everywhere: prefer contact field, then linkedContact.name, then name
        const displayName = lead.contact || lead.linkedContact?.name || lead.name || 'Unknown Contact';
        return (
        <div>
          <div className="font-medium text-gray-900">
            {displayName}
          </div>
          <div className="text-sm text-gray-600 hidden sm:block">
            {lead.linkedContact?.city || lead.city}, {lead.linkedContact?.state || lead.state}
          </div>
          <div className="text-xs text-gray-500 hidden md:block">
            {lead.phoneEmail || 'No contact info'}
          </div>
        </div>
        );
      }
    },
    {
      header: 'Assets',
      accessor: 'assets',
      sortable: false,
      className: 'min-w-[180px] hidden lg:table-cell',
      cell: (lead: LeadEnhanced) => {
        // Sections are already deduplicated on the server
        const sections = lead.linkedSections || [];
        // Units are already deduplicated on the server
        const units = lead.linkedUnits || [];
        
        return (
          <div>
            {sections.slice(0, 2).map(section => (
              <div key={section.id || section.str} className="text-sm text-gray-600">
                Section: {section.sectionName || section.str || 'Unknown Section'}
              </div>
            ))}
            {sections.length > 2 && (
              <div className="text-xs text-gray-500">+{sections.length - 2} more sections</div>
            )}
            {units.slice(0, 2).map(unit => (
              <div key={unit.id || unit.unitName} className="text-sm text-gray-600">
                Unit: {unit.unitName}
              </div>
            ))}
            {units.length > 2 && (
              <div className="text-xs text-gray-500">+{units.length - 2} more units</div>
            )}
            {sections.length === 0 && units.length === 0 && (
              <div className="text-sm text-gray-400 italic">No assets</div>
            )}
            <div className="text-xs text-gray-500 mt-1">
              {lead.grossAcres ? `${lead.grossAcres.toFixed(2)} acres` : 'No acreage data'}
            </div>
          </div>
        );
      }
    },
    {
      header: 'Buyer',
      accessor: 'buyer',
      sortable: true,
      className: 'hidden md:table-cell',
      cell: (lead: LeadEnhanced) => (
        <span className="text-sm text-gray-600">{lead.buyer?.name || 'Unassigned'}</span>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      sortable: true,
      className: 'min-w-[100px]',
      cell: (lead: LeadEnhanced) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(lead.status)}`}>
          {lead.status}
        </span>
      )
    },
    {
      header: 'Priority',
      accessor: 'priorityScore',
      sortable: true,
      className: 'hidden sm:table-cell',
      cell: (lead: LeadEnhanced) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(lead.priorityScore)}`}>
          {lead.priorityScore}
        </span>
      )
    },
    {
      header: 'Last Contact',
      accessor: 'lastContactDate',
      sortable: true,
      className: 'hidden lg:table-cell',
      cell: (lead: LeadEnhanced) => (
        <span className="text-sm text-gray-600 whitespace-nowrap">
          {lead.lastContactDate ? new Date(lead.lastContactDate).toLocaleDateString() : 'Never'}
        </span>
      )
    },
    {
      header: 'Next Follow-up',
      accessor: 'nextFollowUpDate',
      sortable: true,
      className: 'hidden xl:table-cell',
      cell: (lead: LeadEnhanced) => (
        <span className="text-sm text-gray-600 whitespace-nowrap">
          {lead.nextFollowUpDate ? new Date(lead.nextFollowUpDate).toLocaleDateString() : 'Not set'}
        </span>
      )
    },
    {
      header: 'Actions',
      accessor: 'actions',
      sortable: false,
      className: 'min-w-[80px]',
      alwaysVisible: true,
      cell: (lead: LeadEnhanced) => (
        <div className="flex space-x-2">
          <Link
            to={`/leads/${lead.id}`}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium whitespace-nowrap"
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
      localStorage.setItem('leads-column-visibility', JSON.stringify(Array.from(allAccessors)));
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
    localStorage.setItem('leads-column-visibility', JSON.stringify(Array.from(newVisible)));
  };

  const showAllColumns = () => {
    const allAccessors = allColumns.map(col => col.accessor as string);
    const newVisible = new Set(allAccessors);
    setVisibleColumns(newVisible);
    localStorage.setItem('leads-column-visibility', JSON.stringify(Array.from(newVisible)));
  };

  const hideAllColumns = () => {
    const newVisible = new Set(['actions']);
    setVisibleColumns(newVisible);
    localStorage.setItem('leads-column-visibility', JSON.stringify(Array.from(newVisible)));
  };

  return (
    <div className="space-y-6">
      {/* Header with white background and icon */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-indigo-500 rounded-lg flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Leads</h1>
              <p className="text-gray-600 mt-1">Manage and track lead outreach</p>
            </div>
          </div>
          <Link to="/leads/new">
            <Button>
              <PlusIcon className="h-4 w-4 mr-2" />
              New Lead
            </Button>
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="flex space-x-4">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search leads by contact name or notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
            >
              <FunnelIcon className="h-4 w-4 mr-2" />
              Filters
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
                                className="h-4 w-4 rounded border-gray-300 text-indigo-500 focus:ring-indigo-500"
                              />
                              <span className="text-sm text-gray-700 flex-1">{column.header}</span>
                              {isDisabled && (
                                <span className="text-xs text-gray-400">Required</span>
                              )}
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
            
            <Button variant="outline" onClick={clearFilters}>
              Clear
            </Button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.status || ''}
                  onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sc-blue"
                >
                  <option value="">All Statuses</option>
                  <option value="Uncontacted">Uncontacted</option>
                  <option value="Spoke">Spoke</option>
                  <option value="Interested">Interested</option>
                  <option value="LOI Sent">LOI Sent</option>
                  <option value="Dead">Dead</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Buyer</label>
                <select
                  value={filters.buyerId || ''}
                  onChange={(e) => handleFilterChange('buyerId', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sc-blue"
                >
                  <option value="">All Buyers</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Source Channel</label>
                <select
                  value={filters.sourceChannel || ''}
                  onChange={(e) => handleFilterChange('sourceChannel', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sc-blue"
                >
                  <option value="">All Sources</option>
                  <option value="Broker">Broker</option>
                  <option value="Inbound">Inbound</option>
                  <option value="Outbound">Outbound</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority Min</label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={filters.priorityMin || ''}
                  onChange={(e) => handleFilterChange('priorityMin', e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority Max</label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={filters.priorityMax || ''}
                  onChange={(e) => handleFilterChange('priorityMax', e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Contact From</label>
                <Input
                  type="date"
                  value={filters.lastContactFrom || ''}
                  onChange={(e) => handleFilterChange('lastContactFrom', e.target.value || undefined)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Contact To</label>
                <Input
                  type="date"
                  value={filters.lastContactTo || ''}
                  onChange={(e) => handleFilterChange('lastContactTo', e.target.value || undefined)}
                />
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Results Summary */}
      <div className="text-sm text-gray-500">
        {loading ? (
          'Loading...'
        ) : (
          <>
            Showing {totalItems > 0 ? `${((currentPage - 1) * pageSize) + 1} to ${Math.min(currentPage * pageSize, totalItems)}` : '0'} of {totalItems} lead{totalItems !== 1 ? 's' : ''}
            {debouncedSearchTerm && (
              <span className="ml-2 text-blue-600">
                (filtered by "{debouncedSearchTerm}")
              </span>
            )}
          </>
        )}
      </div>

      {/* Leads Table */}
      <Card>
        {loading ? (
          <div className="text-center py-8">
            <div className="text-lg">Loading leads...</div>
          </div>
        ) : sortedLeads.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-2">No leads found</div>
            <p className="text-gray-500">
              {Object.keys(filters).length > 0 || debouncedSearchTerm
                ? 'Try adjusting your filters or search terms'
                : 'Get started by creating your first lead'
              }
            </p>
          </div>
        ) : (
          <Table 
            data={sortedLeads} 
            columns={columns}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
          />
        )}
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <Card className="mt-6">
          <div className="p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <span className="text-sm text-gray-700">
                  Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalItems)} of {totalItems} leads
                </span>
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-700">Page size:</label>
                  <select
                    value={pageSize}
                    onChange={(e) => handlePageSizeChange(parseInt(e.target.value))}
                    className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-sc-blue"
                  >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={200}>200</option>
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
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        onClick={() => handlePageChange(pageNum)}
                        className="px-3 py-1 text-sm min-w-[40px]"
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
    </div>
  );
};

export default LeadsPage;
