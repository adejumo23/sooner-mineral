
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Section, User, TitleStatus } from '../types';
import * as api from '../services/api';
import * as arcgis from '../services/arcgis';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import { formatNMA } from '../utils/formatting';
import { parsePLSS, calculatePLSSCoordinates, createPLSSPolygon, type ParsedPLSS } from '../utils/plssCoordinates';
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";

const titleStatuses: TitleStatus[] = ['In Progress', 'Verified', 'Verified with Curative Requirements', 'Failed', 'Unmapped'];

type SortField = 'sectionName' | 'state' | 'county' | 'netMineralAcres' | 'grossAcres' | 'status' | 'assignedBuyer' | null;
type SortDirection = 'asc' | 'desc';

const SectionsPage: React.FC = () => {
  const navigate = useNavigate();
  const [sections, setSections] = useState<Section[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'table' | 'map'>('table');
  
  // Map-related state
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapView, setMapView] = useState<any>(null);
  const [arcgisLoaded, setArcgisLoaded] = useState(false);
  const [sectionsLayer, setSectionsLayer] = useState<any>(null);
  const [isMapLoading, setIsMapLoading] = useState(false);
  
  // Initialize column visibility from localStorage or default to all visible
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('sections-column-visibility');
    if (saved) {
      try {
        return new Set(JSON.parse(saved));
      } catch (e) {
        // If parsing fails, return default (all visible)
      }
    }
    // Default: all columns visible except we'll track them all
    return new Set();
  });

  // Column width state and resizing
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('sections-column-widths');
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

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [sectionsResponse, usersResponse] = await Promise.all([api.fetchSections(), api.fetchUsers()]);
      // Handle new paginated response structure
      const sectionsData = sectionsResponse.data || sectionsResponse;
      const usersData = usersResponse.data || usersResponse;
      setSections(sectionsData || []);
      setUsers(usersData.filter(u => u.role.name === 'Buyer' || u.role.name === 'Land Manager'));
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setSections([]);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenModal = (section: Section | null = null) => {
    setEditingSection(section);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingSection(null);
    setIsModalOpen(false);
  };

  const handleDelete = async (sectionId: string) => {
    if (window.confirm('Are you sure you want to delete this section?')) {
        await api.deleteSection(sectionId);
        fetchData();
    }
  };
  
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter sections based on search term
  const filteredSections = React.useMemo(() => {
    if (!searchTerm.trim()) return sections;

    const searchLower = searchTerm.toLowerCase().trim();
    return sections.filter(section => {
      const sectionName = (section.sectionName || '').toLowerCase();
      const county = (section.county || '').toLowerCase();
      const state = (section.state || '').toLowerCase();
      const str = (section.str || '').toLowerCase();
      const sectionNumber = (section.sectionNumber || '').toLowerCase();
      const township = (section.township || '').toLowerCase();
      const range = (section.range || '').toLowerCase();
      const legalDescription = (section.legalDescription || '').toLowerCase();
      const assignedBuyer = (section.assignedBuyer?.name || '').toLowerCase();
      const abstractNumber = (section.abstractNumber || '').toLowerCase();
      const anum = (section.anum || '').toLowerCase();
      
      return sectionName.includes(searchLower) ||
        county.includes(searchLower) ||
        state.includes(searchLower) ||
        str.includes(searchLower) ||
        sectionNumber.includes(searchLower) ||
        township.includes(searchLower) ||
        range.includes(searchLower) ||
        legalDescription.includes(searchLower) ||
        assignedBuyer.includes(searchLower) ||
        abstractNumber.includes(searchLower) ||
        anum.includes(searchLower);
    });
  }, [sections, searchTerm]);

  const sortedSections = React.useMemo(() => {
    if (!sortField) return filteredSections;

    return [...filteredSections].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'sectionName':
          aValue = a.sectionName || '';
          bValue = b.sectionName || '';
          return sortDirection === 'asc' 
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        
        case 'state':
          aValue = a.state || '';
          bValue = b.state || '';
          return sortDirection === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        
        case 'county':
          aValue = a.county || '';
          bValue = b.county || '';
          return sortDirection === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        
        case 'netMineralAcres':
          aValue = a.netMineralAcres || 0;
          bValue = b.netMineralAcres || 0;
          return sortDirection === 'asc'
            ? aValue - bValue
            : bValue - aValue;
        
        case 'grossAcres':
          aValue = a.grossAcres || 0;
          bValue = b.grossAcres || 0;
          return sortDirection === 'asc'
            ? aValue - bValue
            : bValue - aValue;
        
        case 'status':
          aValue = a.status || (a.assignedBuyer?.name || a.assignedBuyerId ? 'assigned' : 'unassigned');
          bValue = b.status || (b.assignedBuyer?.name || b.assignedBuyerId ? 'assigned' : 'unassigned');
          return sortDirection === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        
        case 'assignedBuyer':
          aValue = a.assignedBuyer?.name || 'Unassigned';
          bValue = b.assignedBuyer?.name || 'Unassigned';
          return sortDirection === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        
        default:
          return 0;
      }
    });
  }, [filteredSections, sortField, sortDirection]);

  const handleSaveSection = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const sectionData: Omit<Section, 'id' | 'assignedBuyer' | 'nra'> = {
        sectionName: formData.get('sectionName') as string,
        state: 'OK', // Hardcode state to 'OK' as requested
        county: formData.get('county') as string,
        legalDescription: formData.get('legalDescription') as string,
        str: formData.get('str') as string || undefined,
        sectionNumber: formData.get('sectionNumber') as string || undefined,
        township: formData.get('township') as string || undefined,
        range: formData.get('range') as string || undefined,
        abstractNumber: formData.get('abstractNumber') as string || undefined,
        anum: formData.get('anum') as string || undefined,
        grossAcres: parseFloat(formData.get('grossAcres') as string),
        netMineralAcres: parseFloat(formData.get('netMineralAcres') as string) || undefined,
        royalty: parseFloat(formData.get('royalty') as string) || undefined,
        ownershipPercentage: parseFloat(formData.get('ownershipPercentage') as string) || undefined,
        titleStatus: formData.get('titleStatus') as TitleStatus,
        assignedBuyerId: formData.get('assignedBuyerId') as string || undefined,
        nraCapUsd: parseFloat(formData.get('nraCapUsd') as string) || undefined,
        sourceChannel: formData.get('sourceChannel') as string || undefined,
        routingNotes: formData.get('routingNotes') as string || undefined,
        heldByFund: formData.has('heldByFund'),
        isLocked: formData.has('isLocked'),
    };
    
    try {
      if (editingSection) {
        await api.updateSection(editingSection.id, sectionData);
      } else {
        await api.createSection(sectionData);
      }
      await fetchData();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving section:', error);
      alert('Failed to save section. Please try again.');
    }
  };

  // Initialize visible columns on mount if not set
  useEffect(() => {
    if (visibleColumns.size === 0) {
      const allColumns = ['sectionName', 'state', 'county', 'sectionNumber', 'township', 'range', 'current_unit', 'status', 'assignedBuyer', 'netMineralAcres', 'actions'];
      setVisibleColumns(new Set(allColumns));
    }
  }, []);

  const allColumns = [
    {
      header: 'Section Name',
      accessor: 'sectionName',
      cell: (section: Section) => (
        <span className="text-sm font-medium text-gray-900">{section.sectionName}</span>
      )
    },
    {
      header: 'State',
      accessor: 'state',
      cell: (section: Section) => (
        <span className="text-sm text-gray-900">{section.state}</span>
      )
    },
    {
      header: 'County',
      accessor: 'county',
      cell: (section: Section) => (
        <span className="text-sm text-gray-900">{section.county}</span>
      )
    },
    {
      header: 'Section',
      accessor: 'sectionNumber',
      cell: (section: Section) => (
        <span className="text-sm text-gray-900">{section.sectionNumber || 'N/A'}</span>
      )
    },
    {
      header: 'Township',
      accessor: 'township',
      cell: (section: Section) => (
        <span className="text-sm text-gray-900">{section.township || 'N/A'}</span>
      )
    },
    {
      header: 'Range',
      accessor: 'range',
      cell: (section: Section) => (
        <span className="text-sm text-gray-900">{section.range || 'N/A'}</span>
      )
    },
    {
      header: 'Current Unit',
      accessor: 'current_unit',
      cell: (section: Section) => (
        <div className="text-sm text-gray-900 whitespace-pre-line">{section.current_unit || 'N/A'}</div>
      )
    },
    {
      header: 'ALLO_%',
      accessor: 'allo_percent',
      cell: (section: Section) => (
        <div className="text-sm text-gray-900 whitespace-pre-line">{section.allo_percent || 'N/A'}</div>
      )
    },
    {
      header: 'NEW_UNIT_NAME',
      accessor: 'new_unit_name',
      cell: (section: Section) => (
        <div className="text-sm text-gray-900 whitespace-pre-line">{section.new_unit_name || 'N/A'}</div>
      )
    },
    {
      header: 'NEW_OCC_TYPE',
      accessor: 'new_occ_type',
      cell: (section: Section) => (
        <div className="text-sm text-gray-900 whitespace-pre-line">{section.new_occ_type || 'N/A'}</div>
      )
    },
    {
      header: '$_NRA',
      accessor: 'dollar_nra',
      cell: (section: Section) => (
        <div className="text-sm text-gray-900 whitespace-pre-line">{section.dollar_nra || 'N/A'}</div>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (section: Section) => {
        // Use status from server (computed from buyer column), or compute it if not available
        const status = section.status || 
          (section.assignedBuyer?.name || section.assignedBuyerId ? 'assigned' : 'unassigned');
        const statusDisplay = status.charAt(0).toUpperCase() + status.slice(1);
        return (
          <span className={`text-sm font-medium ${
            status === 'assigned' ? 'text-green-600' : 'text-gray-600'
          }`}>
            {statusDisplay}
          </span>
        );
      }
    },
    {
      header: 'Assigned To',
      accessor: 'assignedBuyer',
      cell: (section: Section) => (
        <span className="text-sm text-gray-900">{section.assignedBuyer?.name || 'Unassigned'}</span>
      )
    },
    {
      header: 'Net Mineral Acres',
      accessor: 'netMineralAcres',
      cell: (section: Section) => (
        <span className="text-sm text-gray-900">{formatNMA(section.netMineralAcres)}</span>
      )
    },
    {
      header: 'Actions',
      accessor: 'actions',
      alwaysVisible: true, // Actions column should always be visible
      cell: (section: Section) => (
        <div className="flex space-x-2">
          <button
            onClick={() => navigate(`/sections/${section.id}`)}
            className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold rounded-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
            style={{ backgroundColor: '#fbbf24' }}
          >
            View Details
          </button>
          <button
            onClick={() => handleOpenModal(section)}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Edit
          </button>
          <button
            onClick={() => handleDelete(section.id)}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Delete
          </button>
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
      // Show if in visibleColumns set, or if visibleColumns is empty (initial state)
      return visibleColumns.size === 0 || visibleColumns.has(accessor);
    });
  }, [visibleColumns]);

  const toggleColumnVisibility = (accessor: string) => {
    const newVisible = new Set(visibleColumns);
    if (newVisible.has(accessor)) {
      newVisible.delete(accessor);
    } else {
      newVisible.add(accessor);
    }
    setVisibleColumns(newVisible);
    // Save to localStorage
    localStorage.setItem('sections-column-visibility', JSON.stringify(Array.from(newVisible)));
  };

  const showAllColumns = () => {
    const allAccessors = allColumns.map(col => col.accessor as string);
    const newVisible = new Set(allAccessors);
    setVisibleColumns(newVisible);
    localStorage.setItem('sections-column-visibility', JSON.stringify(Array.from(newVisible)));
  };

  const hideAllColumns = () => {
    const newVisible = new Set(['actions']); // Keep only Actions
    setVisibleColumns(newVisible);
    localStorage.setItem('sections-column-visibility', JSON.stringify(Array.from(newVisible)));
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
        localStorage.setItem('sections-column-widths', JSON.stringify(updated));
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

  return (
    <div>
      {/* Header with white background and icon */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Manage Sections</h1>
              <p className="text-gray-600 mt-1">Track and manage mineral rights acquisitions</p>
            </div>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
          >
            Add Section
          </button>
        </div>
        
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mt-4">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('table')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'table'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Table View
            </button>
            <button
              onClick={() => setActiveTab('map')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'map'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Map View
            </button>
          </nav>
        </div>
      </div>

      {/* Search Bar and Column Controls - Only show in table view */}
      {activeTab === 'table' && (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <Input
              type="text"
              placeholder="Search sections by name, county, state, STR, section number, township, range, legal description, buyer, abstract number, or ANUM..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Clear
            </button>
          )}
          {/* Column Visibility Toggle */}
          <div className="relative">
            <button
              onClick={() => setIsColumnMenuOpen(!isColumnMenuOpen)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 flex items-center space-x-2"
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
                          const width = getColumnWidth(accessor);
                          
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
                                  className="h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                                />
                                <span className="text-sm text-gray-700 flex-1">{column.header}</span>
                                {isDisabled && (
                                  <span className="text-xs text-gray-400">Required</span>
                                )}
                              </label>
                              {!isDisabled && (
                                <div className="mt-1 flex items-center space-x-2">
                                  <span className="text-xs text-gray-500">Width: {width}px</span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const newWidth = width + 50;
                                      setColumnWidths(prev => {
                                        const updated = { ...prev, [accessor]: newWidth };
                                        localStorage.setItem('sections-column-widths', JSON.stringify(updated));
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
                                      const newWidth = Math.max(100, width - 50);
                                      setColumnWidths(prev => {
                                        const updated = { ...prev, [accessor]: newWidth };
                                        localStorage.setItem('sections-column-widths', JSON.stringify(updated));
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
                                        localStorage.setItem('sections-column-widths', JSON.stringify(updated));
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
        {searchTerm && (
          <p className="text-sm text-gray-500">
            Showing {sortedSections.length} of {sections.length} sections
          </p>
        )}
      </div>
      )}

      {isLoading ? (
        <p className="text-center text-sc-medium-gray">Loading sections...</p>
      ) : activeTab === 'map' ? (
        <div className="bg-white rounded-lg border border-sc-light-orange shadow-lg relative" style={{ height: 'calc(100vh - 300px)', minHeight: '600px' }}>
          {isMapLoading && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mb-2"></div>
                <p className="text-gray-600">Loading map...</p>
              </div>
            </div>
          )}
          <div ref={mapRef} style={{ width: '100%', height: '100%' }}></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-sc-light-orange shadow-lg overflow-x-auto">
          <table className="table-auto divide-y divide-sc-light-orange" style={{ minWidth: '100%', tableLayout: 'auto' }}>
            <thead className="bg-gray-100">
              <tr>
                  {columns.map((column, index) => {
                  const isSortable = ['sectionName', 'state', 'county', 'netMineralAcres', 'grossAcres', 'status', 'assignedBuyer'].includes(column.accessor as string);
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
                        // Don't trigger sort if clicking on resizer
                        if ((e.target as HTMLElement).classList.contains('column-resizer')) {
                          return;
                        }
                        isSortable && handleSort(column.accessor as SortField);
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
              {sortedSections.map((item, rowIndex) => (
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

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingSection ? 'Edit Section' : 'Add Section'}>
        <form onSubmit={handleSaveSection} className="space-y-6 max-h-[75vh] overflow-y-auto pr-3">
            {/* Core Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="sectionName" className="block text-sm font-medium text-sc-slate mb-1">Section Name</label>
                    <Input id="sectionName" name="sectionName" type="text" defaultValue={editingSection?.sectionName} required />
                </div>
                 <div>
                    <label htmlFor="state" className="block text-sm font-medium text-sc-slate mb-1">State</label>
                    <Input id="state" name="state" type="text" defaultValue={editingSection?.state} required />
                </div>
                <div>
                    <label htmlFor="county" className="block text-sm font-medium text-sc-slate mb-1">County</label>
                    <Input id="county" name="county" type="text" defaultValue={editingSection?.county} required />
                </div>
                 <div>
                    <label htmlFor="sourceChannel" className="block text-sm font-medium text-sc-slate mb-1">Source Channel</label>
                    <Input id="sourceChannel" name="sourceChannel" type="text" defaultValue={editingSection?.sourceChannel} />
                </div>
            </div>

            {/* Legal Info */}
            <div>
                <label htmlFor="legalDescription" className="block text-sm font-medium text-sc-slate mb-1">Legal Description</label>
                <textarea id="legalDescription" name="legalDescription" defaultValue={editingSection?.legalDescription} required  className="w-full px-4 py-2 bg-white border border-sc-light-orange rounded-md text-sc-dark-gray placeholder-sc-medium-gray focus:outline-none focus:ring-2 focus:ring-sc-orange transition duration-200" rows={3}></textarea>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div>
                    <label htmlFor="str" className="block text-sm font-medium text-sc-slate mb-1">STR (Combined)</label>
                    <Input id="str" name="str" type="text" defaultValue={editingSection?.str} />
                </div>
                <div>
                    <label htmlFor="abstractNumber" className="block text-sm font-medium text-sc-slate mb-1">Abstract Number</label>
                    <Input id="abstractNumber" name="abstractNumber" type="text" defaultValue={editingSection?.abstractNumber} />
                </div>
                <div>
                    <label htmlFor="anum" className="block text-sm font-medium text-sc-slate mb-1">ANUM</label>
                    <Input id="anum" name="anum" type="text" defaultValue={editingSection?.anum} />
                </div>
            </div>
            
            {/* STR Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label htmlFor="sectionNumber" className="block text-sm font-medium text-sc-slate mb-1">Section Number</label>
                    <Input id="sectionNumber" name="sectionNumber" type="text" defaultValue={editingSection?.sectionNumber} />
                </div>
                <div>
                    <label htmlFor="township" className="block text-sm font-medium text-sc-slate mb-1">Township</label>
                    <Input id="township" name="township" type="text" defaultValue={editingSection?.township} />
                </div>
                <div>
                    <label htmlFor="range" className="block text-sm font-medium text-sc-slate mb-1">Range</label>
                    <Input id="range" name="range" type="text" defaultValue={editingSection?.range} />
                </div>
            </div>
            
            {/* Acreage & Ownership */}
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                    <label htmlFor="grossAcres" className="block text-sm font-medium text-sc-slate mb-1">Gross Acres</label>
                    <Input id="grossAcres" name="grossAcres" type="number" step="any" defaultValue={editingSection?.grossAcres} required />
                </div>
                <div>
                    <label htmlFor="netMineralAcres" className="block text-sm font-medium text-sc-slate mb-1">Net Mineral Acres</label>
                    <Input id="netMineralAcres" name="netMineralAcres" type="number" step="any" defaultValue={editingSection?.netMineralAcres} />
                </div>
                <div>
                    <label htmlFor="royalty" className="block text-sm font-medium text-sc-slate mb-1">Royalty (%)</label>
                    <Input id="royalty" name="royalty" type="number" step="any" placeholder="e.g. 0.25" defaultValue={editingSection?.royalty}/>
                </div>
                <div>
                    <label htmlFor="ownershipPercentage" className="block text-sm font-medium text-sc-slate mb-1">Ownership (%)</label>
                    <Input id="ownershipPercentage" name="ownershipPercentage" placeholder="e.g. 1.0" type="number" step="any" defaultValue={editingSection?.ownershipPercentage} />
                </div>
            </div>

            {/* Assignment & Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label htmlFor="titleStatus" className="block text-sm font-medium text-sc-slate mb-1">Title Status</label>
                    <select id="titleStatus" name="titleStatus" defaultValue={editingSection?.titleStatus || 'In Progress'} className="w-full px-4 py-2 bg-white border border-sc-light-orange rounded-md text-sc-dark-gray focus:outline-none focus:ring-2 focus:ring-sc-orange" required>
                        {titleStatuses.map(status => <option key={status} value={status}>{status}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="assignedBuyerId" className="block text-sm font-medium text-sc-slate mb-1">Assigned Buyer</label>
                    <select id="assignedBuyerId" name="assignedBuyerId" defaultValue={editingSection?.assignedBuyerId} className="w-full px-4 py-2 bg-white border border-sc-light-orange rounded-md text-sc-dark-gray focus:outline-none focus:ring-2 focus:ring-sc-orange">
                        <option value="">Unassigned</option>
                        {users.map(user => <option key={user.id} value={user.id}>{user.name}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="nraCapUsd" className="block text-sm font-medium text-sc-slate mb-1">$/NRA Cap</label>
                    <Input id="nraCapUsd" name="nraCapUsd" type="number" step="any" defaultValue={editingSection?.nraCapUsd} />
                </div>
            </div>

             <div>
                <label htmlFor="routingNotes" className="block text-sm font-medium text-sc-slate mb-1">Routing Notes</label>
                <textarea id="routingNotes" name="routingNotes" defaultValue={editingSection?.routingNotes} className="w-full px-4 py-2 bg-white border border-sc-light-orange rounded-md text-sc-dark-gray placeholder-sc-medium-gray focus:outline-none focus:ring-2 focus:ring-sc-orange transition duration-200" rows={3}></textarea>
            </div>

             {/* Flags */}
             <div className="flex items-center space-x-8">
                <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" name="heldByFund" defaultChecked={editingSection?.heldByFund} className="h-4 w-4 rounded border-gray-300 text-sc-orange focus:ring-sc-orange" />
                    <span className="text-sm text-sc-dark-gray">Held by Fund</span>
                </label>
                 <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" name="isLocked" defaultChecked={editingSection?.isLocked} className="h-4 w-4 rounded border-gray-300 text-sc-orange focus:ring-sc-orange" />
                    <span className="text-sm text-sc-dark-gray">Lock Flag (e.g. under LOI)</span>
                </label>
             </div>
            
            <div className="flex justify-end space-x-3 pt-4 border-t border-sc-light-orange">
                <Button type="button" variant="secondary" onClick={handleCloseModal}>Cancel</Button>
                <Button type="submit">Save Section</Button>
            </div>
        </form>
      </Modal>
    </div>
  );
};

export default SectionsPage;
