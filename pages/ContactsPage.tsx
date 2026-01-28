import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  fetchContacts, 
  fetchContactTractOwnership, 
  fetchContactLeads,
  fetchContactCallLogs,
  fetchContactDocuments,
  fetchDistressSignals
} from '../services/api';
import { 
  ContactEnhanced, 
  ContactTractOwnershipEnhanced, 
  ContactUnitSummary,
  ContactCallLog,
  ContactDocument,
  DistressSignal,
  ContactFilters 
} from '../types';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Table from '../components/ui/Table';
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  FunnelIcon,
  ExclamationTriangleIcon,
  UserIcon,
  MapIcon,
  PhoneIcon,
  DocumentIcon
} from '../components/icons/Icons';

const ContactsPage: React.FC = () => {
  const [contacts, setContacts] = useState<ContactEnhanced[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<ContactEnhanced[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<ContactFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'totalNMA' | 'totalNRA' | 'lastContactedDate' | 'riskLevel'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);
  
  // Initialize column visibility from localStorage
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('contacts-column-visibility');
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
    const saved = localStorage.getItem('contacts-column-widths');
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

  const handleColumnSort = (field: 'name' | 'totalNMA' | 'totalNRA' | 'lastContactedDate' | 'riskLevel') => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const allColumns = [
    { header: 'Contact', accessor: 'contact', alwaysVisible: false },
    { header: 'Role & Type', accessor: 'roleType', alwaysVisible: false },
    { header: 'Total Acres', accessor: 'totalAcres', alwaysVisible: false },
    { header: 'Distress Signals', accessor: 'distressSignals', alwaysVisible: false },
    { header: 'Last Contact', accessor: 'lastContact', alwaysVisible: false },
    { header: 'Status', accessor: 'status', alwaysVisible: false },
    { header: 'Actions', accessor: 'actions', alwaysVisible: true },
  ];

  // Initialize visible columns on mount if not set
  useEffect(() => {
    if (visibleColumns.size === 0) {
      const allAccessors = allColumns.map(col => col.accessor);
      setVisibleColumns(new Set(allAccessors));
      localStorage.setItem('contacts-column-visibility', JSON.stringify(Array.from(allAccessors)));
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
    localStorage.setItem('contacts-column-visibility', JSON.stringify(Array.from(newVisible)));
  };

  const showAllColumns = () => {
    const allAccessors = allColumns.map(col => col.accessor);
    const newVisible = new Set(allAccessors);
    setVisibleColumns(newVisible);
    localStorage.setItem('contacts-column-visibility', JSON.stringify(Array.from(newVisible)));
  };

  const hideAllColumns = () => {
    const newVisible = new Set(['actions']);
    setVisibleColumns(newVisible);
    localStorage.setItem('contacts-column-visibility', JSON.stringify(Array.from(newVisible)));
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
      const newWidth = Math.max(100, resizeStartWidth + diff);
      setColumnWidths(prev => {
        const updated = { ...prev, [resizingColumn]: newWidth };
        localStorage.setItem('contacts-column-widths', JSON.stringify(updated));
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

  useEffect(() => {
    loadContacts();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [contacts, searchTerm, filters, sortBy, sortOrder]);

  const loadContacts = async () => {
    try {
      setLoading(true);
      // In a real implementation, this would fetch enhanced contacts with all the calculated fields
      const contactsResponse = await fetchContacts();
      const contactsData = contactsResponse.data || contactsResponse;
      const enhancedContacts: ContactEnhanced[] = contactsData.map(contact => ({
        ...contact,
        role: 'Landowner' as const,
        ownershipType: 'Mineral' as const,
        preferredContactMethod: 'Call' as const,
        source: 'Manual Entry',
        origination: 'User Input',
        totalNMA: contact.totalNMA || contact.netMineralAcres || 0, // Use NMA sum from API
        totalNRA: 0, // Would be calculated from linked tracts
        distressSignals: [], // Would be fetched separately
        linkedTractCount: 0,
        linkedUnitCount: 0,
        activeLeadCount: 0
      }));
      setContacts(enhancedContacts);
    } catch (error) {
      console.error('Failed to load contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = contacts.filter(contact => {
      // Search filter
      if (searchTerm && !contact.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !contact.city?.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Role filter
      if (filters.role && contact.role !== filters.role) return false;

      // Ownership type filter
      if (filters.ownershipType && contact.ownershipType !== filters.ownershipType) return false;

      // Contact type filter
      if (filters.contactType && contact.contactType !== filters.contactType) return false;

      // State filter
      if (filters.state && contact.state !== filters.state) return false;

      // County filter
      if (filters.county && contact.city !== filters.county) return false;

      // Distress signals filter
      if (filters.hasDistressSignals && contact.distressSignals.length === 0) return false;

      // Distress signal type filter
      if (filters.distressSignalType && 
          !contact.distressSignals.some(signal => signal.signalType === filters.distressSignalType)) {
        return false;
      }

      // Risk level filter
      if (filters.riskLevel && 
          !contact.distressSignals.some(signal => signal.riskLevel === filters.riskLevel)) {
        return false;
      }

      // Active leads filter
      if (filters.hasActiveLeads && contact.activeLeadCount === 0) return false;

      // Preferred contact method filter
      if (filters.preferredContactMethod && contact.preferredContactMethod !== filters.preferredContactMethod) return false;

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'totalNMA':
          aValue = a.totalNMA;
          bValue = b.totalNMA;
          break;
        case 'totalNRA':
          aValue = a.totalNRA;
          bValue = b.totalNRA;
          break;
        case 'lastContactedDate':
          aValue = a.lastContactedDate || '';
          bValue = b.lastContactedDate || '';
          break;
        case 'riskLevel':
          const aMaxRisk = Math.max(...a.distressSignals.map(s => ['Low', 'Medium', 'High', 'Critical'].indexOf(s.riskLevel)));
          const bMaxRisk = Math.max(...b.distressSignals.map(s => ['Low', 'Medium', 'High', 'Critical'].indexOf(s.riskLevel)));
          aValue = aMaxRisk;
          bValue = bMaxRisk;
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    setFilteredContacts(filtered);
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'Low': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'High': return 'bg-orange-100 text-orange-800';
      case 'Critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDistressSignalIcon = (signals: DistressSignal[]) => {
    if (signals.length === 0) return null;
    
    const criticalSignals = signals.filter(s => s.riskLevel === 'Critical');
    const highSignals = signals.filter(s => s.riskLevel === 'High');
    
    if (criticalSignals.length > 0) {
      return <ExclamationTriangleIcon className="h-5 w-5 text-red-600" title={`${criticalSignals.length} critical distress signals`} />;
    } else if (highSignals.length > 0) {
      return <ExclamationTriangleIcon className="h-5 w-5 text-orange-600" title={`${highSignals.length} high risk distress signals`} />;
    } else {
      return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" title={`${signals.length} distress signals`} />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-500">Loading owners...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header with white background and icon */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-teal-500 rounded-lg flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Owner Management</h1>
              <p className="text-gray-600 mt-1">
                Manage landowners, sellers, and individuals linked to mineral and non-op tracts
              </p>
            </div>
          </div>
          <Link to="/contacts/new">
            <Button className="flex items-center space-x-2">
              <PlusIcon className="h-4 w-4" />
              <span>Add Owner</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <div className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Input
                type="text"
                placeholder="Search owners by name, email, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            </div>

            {/* Filter Toggle */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2"
            >
              <FunnelIcon className="h-4 w-4" />
              <span>Filters</span>
            </Button>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sc-blue focus:border-transparent"
            >
              <option value="name">Sort by Name</option>
              <option value="totalNMA">Sort by Total NMA</option>
              <option value="totalNRA">Sort by Total NRA</option>
              <option value="lastContactedDate">Sort by Last Contact</option>
              <option value="riskLevel">Sort by Risk Level</option>
            </select>

            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sc-blue focus:border-transparent"
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>

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
                        const accessor = column.accessor;
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
                                className="h-4 w-4 rounded border-gray-300 text-teal-500 focus:ring-teal-500"
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
                                      localStorage.setItem('contacts-column-widths', JSON.stringify(updated));
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
                                      localStorage.setItem('contacts-column-widths', JSON.stringify(updated));
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
                                      localStorage.setItem('contacts-column-widths', JSON.stringify(updated));
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
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <select
                  value={filters.role || ''}
                  onChange={(e) => setFilters({ ...filters, role: e.target.value as any || undefined })}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sc-blue focus:border-transparent"
                >
                  <option value="">All Roles</option>
                  <option value="Seller">Seller</option>
                  <option value="Landowner">Landowner</option>
                  <option value="Heir">Heir</option>
                  <option value="Attorney-in-Fact">Attorney-in-Fact</option>
                  <option value="Unknown">Unknown</option>
                </select>

                <select
                  value={filters.ownershipType || ''}
                  onChange={(e) => setFilters({ ...filters, ownershipType: e.target.value as any || undefined })}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sc-blue focus:border-transparent"
                >
                  <option value="">All Ownership Types</option>
                  <option value="Mineral">Mineral</option>
                  <option value="Royalty">Royalty</option>
                  <option value="NPRI">NPRI</option>
                  <option value="ORRI">ORRI</option>
                  <option value="Working Interest">Working Interest</option>
                </select>

                <select
                  value={filters.contactType || ''}
                  onChange={(e) => setFilters({ ...filters, contactType: e.target.value as any || undefined })}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sc-blue focus:border-transparent"
                >
                  <option value="">All Contact Types</option>
                  <option value="Landowner">Landowner</option>
                  <option value="Broker">Broker</option>
                  <option value="Attorney">Attorney</option>
                  <option value="Other">Other</option>
                </select>

                <select
                  value={filters.state || ''}
                  onChange={(e) => setFilters({ ...filters, state: e.target.value || undefined })}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sc-blue focus:border-transparent"
                >
                  <option value="">All States</option>
                  <option value="TX">Texas</option>
                  <option value="OK">Oklahoma</option>
                  <option value="NM">New Mexico</option>
                  <option value="LA">Louisiana</option>
                </select>

                <select
                  value={filters.hasDistressSignals ? 'true' : ''}
                  onChange={(e) => setFilters({ ...filters, hasDistressSignals: e.target.value === 'true' || undefined })}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sc-blue focus:border-transparent"
                >
                  <option value="">All Owners</option>
                  <option value="true">With Distress Signals</option>
                </select>

                <select
                  value={filters.distressSignalType || ''}
                  onChange={(e) => setFilters({ ...filters, distressSignalType: e.target.value as any || undefined })}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sc-blue focus:border-transparent"
                >
                  <option value="">All Signal Types</option>
                  <option value="Death">Death</option>
                  <option value="Bankruptcy">Bankruptcy</option>
                  <option value="Tax Lien">Tax Lien</option>
                  <option value="Judgment">Judgment</option>
                  <option value="Criminal">Criminal</option>
                  <option value="Indebtedness">Indebtedness</option>
                  <option value="Divorce">Divorce</option>
                  <option value="Foreclosure">Foreclosure</option>
                </select>

                <select
                  value={filters.riskLevel || ''}
                  onChange={(e) => setFilters({ ...filters, riskLevel: e.target.value as any || undefined })}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sc-blue focus:border-transparent"
                >
                  <option value="">All Risk Levels</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>

                <select
                  value={filters.preferredContactMethod || ''}
                  onChange={(e) => setFilters({ ...filters, preferredContactMethod: e.target.value as any || undefined })}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sc-blue focus:border-transparent"
                >
                  <option value="">All Contact Methods</option>
                  <option value="Call">Call</option>
                  <option value="Email">Email</option>
                  <option value="Text">Text</option>
                  <option value="Do Not Contact">Do Not Contact</option>
                </select>
              </div>

              {/* Clear Filters */}
              <div className="mt-4 flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setFilters({})}
                  className="text-gray-600 hover:text-gray-800"
                >
                  Clear All Filters
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Results Summary */}
      <div className="mb-4 text-sm text-gray-500">
        Showing {filteredContacts.length} of {contacts.length} owners
      </div>

      {/* Contacts Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {visibleColumns.has('contact') || visibleColumns.size === 0 ? (() => {
                  const accessor = 'contact';
                  const width = getColumnWidth(accessor);
                  const isResizing = resizingColumn === accessor;
                  return (
                    <th 
                      style={{ width: `${width}px`, minWidth: `${width}px` }}
                      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 relative ${
                        sortBy === 'name' ? 'bg-gray-100' : ''
                      }`}
                      onClick={(e) => {
                        if ((e.target as HTMLElement).classList.contains('column-resizer')) {
                          return;
                        }
                        handleColumnSort('name');
                      }}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Contact</span>
                        {sortBy === 'name' && (
                          <span className="text-gray-400">
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                        {sortBy !== 'name' && (
                          <span className="opacity-30 text-xs">⇅</span>
                        )}
                      </div>
                      <div
                        className={`column-resizer absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 ${
                          isResizing ? 'bg-blue-500' : 'bg-transparent'
                        }`}
                        onMouseDown={(e) => handleResizeStart(e, accessor, width)}
                        style={{ userSelect: 'none' }}
                      />
                    </th>
                  );
                })() : null}
                {visibleColumns.has('roleType') || visibleColumns.size === 0 ? (() => {
                  const accessor = 'roleType';
                  const width = getColumnWidth(accessor);
                  const isResizing = resizingColumn === accessor;
                  return (
                    <th 
                      style={{ width: `${width}px`, minWidth: `${width}px` }}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative"
                    >
                      Role & Type
                      <div
                        className={`column-resizer absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 ${
                          isResizing ? 'bg-blue-500' : 'bg-transparent'
                        }`}
                        onMouseDown={(e) => handleResizeStart(e, accessor, width)}
                        style={{ userSelect: 'none' }}
                      />
                    </th>
                  );
                })() : null}
                {visibleColumns.has('totalAcres') || visibleColumns.size === 0 ? (() => {
                  const accessor = 'totalAcres';
                  const width = getColumnWidth(accessor);
                  const isResizing = resizingColumn === accessor;
                  return (
                    <th 
                      style={{ width: `${width}px`, minWidth: `${width}px` }}
                      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 relative ${
                        sortBy === 'totalNMA' || sortBy === 'totalNRA' ? 'bg-gray-100' : ''
                      }`}
                      onClick={(e) => {
                        if ((e.target as HTMLElement).classList.contains('column-resizer')) {
                          return;
                        }
                        handleColumnSort('totalNMA');
                      }}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Total Acres</span>
                        {(sortBy === 'totalNMA' || sortBy === 'totalNRA') && (
                          <span className="text-gray-400">
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                        {sortBy !== 'totalNMA' && sortBy !== 'totalNRA' && (
                          <span className="opacity-30 text-xs">⇅</span>
                        )}
                      </div>
                      <div
                        className={`column-resizer absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 ${
                          isResizing ? 'bg-blue-500' : 'bg-transparent'
                        }`}
                        onMouseDown={(e) => handleResizeStart(e, accessor, width)}
                        style={{ userSelect: 'none' }}
                      />
                    </th>
                  );
                })() : null}
                {visibleColumns.has('distressSignals') || visibleColumns.size === 0 ? (() => {
                  const accessor = 'distressSignals';
                  const width = getColumnWidth(accessor);
                  const isResizing = resizingColumn === accessor;
                  return (
                    <th 
                      style={{ width: `${width}px`, minWidth: `${width}px` }}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative"
                    >
                      Distress Signals
                      <div
                        className={`column-resizer absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 ${
                          isResizing ? 'bg-blue-500' : 'bg-transparent'
                        }`}
                        onMouseDown={(e) => handleResizeStart(e, accessor, width)}
                        style={{ userSelect: 'none' }}
                      />
                    </th>
                  );
                })() : null}
                {visibleColumns.has('lastContact') || visibleColumns.size === 0 ? (() => {
                  const accessor = 'lastContact';
                  const width = getColumnWidth(accessor);
                  const isResizing = resizingColumn === accessor;
                  return (
                    <th 
                      style={{ width: `${width}px`, minWidth: `${width}px` }}
                      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 relative ${
                        sortBy === 'lastContactedDate' ? 'bg-gray-100' : ''
                      }`}
                      onClick={(e) => {
                        if ((e.target as HTMLElement).classList.contains('column-resizer')) {
                          return;
                        }
                        handleColumnSort('lastContactedDate');
                      }}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Last Contact</span>
                        {sortBy === 'lastContactedDate' && (
                          <span className="text-gray-400">
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                        {sortBy !== 'lastContactedDate' && (
                          <span className="opacity-30 text-xs">⇅</span>
                        )}
                      </div>
                      <div
                        className={`column-resizer absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 ${
                          isResizing ? 'bg-blue-500' : 'bg-transparent'
                        }`}
                        onMouseDown={(e) => handleResizeStart(e, accessor, width)}
                        style={{ userSelect: 'none' }}
                      />
                    </th>
                  );
                })() : null}
                {visibleColumns.has('status') || visibleColumns.size === 0 ? (() => {
                  const accessor = 'status';
                  const width = getColumnWidth(accessor);
                  const isResizing = resizingColumn === accessor;
                  return (
                    <th 
                      style={{ width: `${width}px`, minWidth: `${width}px` }}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative"
                    >
                      Status
                      <div
                        className={`column-resizer absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 ${
                          isResizing ? 'bg-blue-500' : 'bg-transparent'
                        }`}
                        onMouseDown={(e) => handleResizeStart(e, accessor, width)}
                        style={{ userSelect: 'none' }}
                      />
                    </th>
                  );
                })() : null}
                {visibleColumns.has('actions') || visibleColumns.size === 0 ? (() => {
                  const accessor = 'actions';
                  const width = getColumnWidth(accessor);
                  const isResizing = resizingColumn === accessor;
                  return (
                    <th 
                      style={{ width: `${width}px`, minWidth: `${width}px` }}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative"
                    >
                      Actions
                      <div
                        className={`column-resizer absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 ${
                          isResizing ? 'bg-blue-500' : 'bg-transparent'
                        }`}
                        onMouseDown={(e) => handleResizeStart(e, accessor, width)}
                        style={{ userSelect: 'none' }}
                      />
                    </th>
                  );
                })() : null}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredContacts.map((contact) => (
                <tr key={contact.id} className="hover:bg-gray-50">
                  {(visibleColumns.has('contact') || visibleColumns.size === 0) && (
                    <td style={{ width: `${getColumnWidth('contact')}px`, minWidth: `${getColumnWidth('contact')}px` }} className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <UserIcon className="h-5 w-5 text-gray-700" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            <Link 
                              to={`/contacts/${contact.id}`}
                              className="text-sc-blue hover:text-sc-blue-600"
                            >
                              {contact.name}
                            </Link>
                          </div>
                          <div className="text-sm text-gray-500">
                            {contact.city}, {contact.state}
                          </div>
                          {contact.email && (
                            <div className="text-xs text-gray-400">
                              {contact.email}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  )}
                  {(visibleColumns.has('roleType') || visibleColumns.size === 0) && (
                    <td style={{ width: `${getColumnWidth('roleType')}px`, minWidth: `${getColumnWidth('roleType')}px` }} className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="font-medium">{contact.role}</div>
                        <div className="text-gray-500">{contact.ownershipType}</div>
                        <div className="text-xs text-gray-400">{contact.contactType}</div>
                      </div>
                    </td>
                  )}
                  {(visibleColumns.has('totalAcres') || visibleColumns.size === 0) && (
                    <td style={{ width: `${getColumnWidth('totalAcres')}px`, minWidth: `${getColumnWidth('totalAcres')}px` }} className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="font-medium">
                          {contact.totalNMA ? contact.totalNMA.toLocaleString() : '0'} NMA
                        </div>
                        <div className="text-gray-500">
                          {contact.totalNRA ? contact.totalNRA.toLocaleString() : '0'} NRA
                        </div>
                        <div className="text-xs text-gray-400">
                          {contact.linkedTractCount} tracts
                        </div>
                      </div>
                    </td>
                  )}
                  {(visibleColumns.has('distressSignals') || visibleColumns.size === 0) && (
                    <td style={{ width: `${getColumnWidth('distressSignals')}px`, minWidth: `${getColumnWidth('distressSignals')}px` }} className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getDistressSignalIcon(contact.distressSignals)}
                        {contact.distressSignals.length > 0 && (
                          <span className="text-sm text-gray-900">
                            {contact.distressSignals.length} signal{contact.distressSignals.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </td>
                  )}
                  {(visibleColumns.has('lastContact') || visibleColumns.size === 0) && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {contact.lastContactedDate ? (
                          <span>{new Date(contact.lastContactedDate).toLocaleDateString()}</span>
                        ) : (
                          <span className="text-gray-400">Never contacted</span>
                        )}
                      </div>
                    </td>
                  )}
                  {(visibleColumns.has('status') || visibleColumns.size === 0) && (
                    <td style={{ width: `${getColumnWidth('status')}px`, minWidth: `${getColumnWidth('status')}px` }} className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          contact.preferredContactMethod === 'Do Not Contact' 
                            ? 'bg-red-100 text-red-800'
                            : contact.preferredContactMethod === 'Call'
                            ? 'bg-blue-100 text-blue-800'
                            : contact.preferredContactMethod === 'Email'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {contact.preferredContactMethod}
                        </span>
                        {contact.activeLeadCount > 0 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            {contact.activeLeadCount} active lead{contact.activeLeadCount !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </td>
                  )}
                  {(visibleColumns.has('actions') || visibleColumns.size === 0) && (
                    <td style={{ width: `${getColumnWidth('actions')}px`, minWidth: `${getColumnWidth('actions')}px` }} className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Link to={`/contacts/${contact.id}`}>
                          <Button variant="outline" size="sm">
                            View Profile
                          </Button>
                        </Link>
                        <Button variant="outline" size="sm">
                          <PhoneIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredContacts.length === 0 && (
          <div className="text-center py-12">
            <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No owners found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || Object.keys(filters).length > 0
                ? 'Try adjusting your search or filters.'
                : 'Get started by creating a new contact.'}
            </p>
            {!searchTerm && Object.keys(filters).length === 0 && (
              <div className="mt-6">
                <Link to="/contacts/new">
                  <Button>
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Contact
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default ContactsPage;
