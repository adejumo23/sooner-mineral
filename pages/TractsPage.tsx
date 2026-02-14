
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Section, User, TitleStatus } from '../types';
import * as api from '../services/api';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';

const titleStatuses: TitleStatus[] = ['In Progress', 'Verified', 'Verified with Curative Requirements', 'Failed', 'Unmapped'];

const SectionsPage: React.FC = () => {
  const navigate = useNavigate();
  const [sections, setSections] = useState<Section[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [sortField, setSortField] = useState<keyof Section | string>('sectionName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);
  
  // Initialize column visibility from localStorage
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('tracts-column-visibility');
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
    const saved = localStorage.getItem('tracts-column-widths');
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
  
  const handleSaveSection = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const sectionData: Omit<Section, 'id' | 'assignedBuyer' | 'nra'> = {
        sectionName: formData.get('sectionName') as string,
        state: formData.get('state') as string,
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
    
    if (editingSection) {
      await api.updateSection(editingSection.id, sectionData);
    } else {
      await api.createSection(sectionData);
    }
    fetchData();
    handleCloseModal();
  };

  const handleSort = (field: keyof Section | string) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field with default ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Sort sections based on current sort field and direction
  const sortedSections = useMemo(() => {
    return [...sections].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'sectionName':
          aValue = a.sectionName || '';
          bValue = b.sectionName || '';
          break;
        case 'state':
          aValue = a.state || '';
          bValue = b.state || '';
          break;
        case 'county':
          aValue = a.county || '';
          bValue = b.county || '';
          break;
        case 'sectionNumber':
          aValue = a.sectionNumber || '';
          bValue = b.sectionNumber || '';
          break;
        case 'township':
          aValue = a.township || '';
          bValue = b.township || '';
          break;
        case 'range':
          aValue = a.range || '';
          bValue = b.range || '';
          break;
        case 'titleStatus':
          aValue = a.titleStatus || '';
          bValue = b.titleStatus || '';
          break;
        case 'assignedBuyer':
          aValue = a.assignedBuyer?.name || 'Unassigned';
          bValue = b.assignedBuyer?.name || 'Unassigned';
          break;
        case 'netMineralAcres':
          aValue = a.netMineralAcres || 0;
          bValue = b.netMineralAcres || 0;
          break;
        case 'grossAcres':
          aValue = a.grossAcres || 0;
          bValue = b.grossAcres || 0;
          break;
        default:
          aValue = a[sortField as keyof Section] ?? '';
          bValue = b[sortField as keyof Section] ?? '';
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
  }, [sections, sortField, sortDirection]);

  const allColumns = [
    {
      header: 'Section Name',
      accessor: 'sectionName',
      sortable: true,
      alwaysVisible: false,
      cell: (section: Section) => (
        <span className="text-sm font-medium text-gray-900">{section.sectionName}</span>
      )
    },
    {
      header: 'State',
      accessor: 'state',
      sortable: true,
      cell: (section: Section) => (
        <span className="text-sm text-gray-900">{section.state}</span>
      )
    },
    {
      header: 'County',
      accessor: 'county',
      sortable: true,
      cell: (section: Section) => (
        <span className="text-sm text-gray-900">{section.county}</span>
      )
    },
    {
      header: 'Section',
      accessor: 'sectionNumber',
      sortable: true,
      cell: (section: Section) => (
        <span className="text-sm text-gray-900">{section.sectionNumber || 'N/A'}</span>
      )
    },
    {
      header: 'Township',
      accessor: 'township',
      sortable: true,
      cell: (section: Section) => (
        <span className="text-sm text-gray-900">{section.township || 'N/A'}</span>
      )
    },
    {
      header: 'Range',
      accessor: 'range',
      sortable: true,
      cell: (section: Section) => (
        <span className="text-sm text-gray-900">{section.range || 'N/A'}</span>
      )
    },
    {
      header: 'Status',
      accessor: 'titleStatus',
      sortable: true,
      cell: (section: Section) => (
        <span className="text-sm text-gray-900">{section.titleStatus}</span>
      )
    },
    {
      header: 'Assigned To',
      accessor: 'assignedBuyer',
      sortable: true,
      cell: (section: Section) => (
        <span className="text-sm text-gray-900">{section.assignedBuyer?.name || 'Unassigned'}</span>
      )
    },
    {
      header: 'Acres (Net/Gross)',
      accessor: 'acres',
      cell: (section: Section) => (
        <span className="text-sm text-gray-900">{section.netMineralAcres || 'N/A'} / {section.grossAcres}</span>
      )
    },
    {
      header: 'Actions',
      accessor: 'actions',
      alwaysVisible: true,
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
      localStorage.setItem('tracts-column-visibility', JSON.stringify(Array.from(allAccessors)));
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
    localStorage.setItem('tracts-column-visibility', JSON.stringify(Array.from(newVisible)));
  };

  const showAllColumns = () => {
    const allAccessors = allColumns.map(col => col.accessor as string);
    const newVisible = new Set(allAccessors);
    setVisibleColumns(newVisible);
    localStorage.setItem('tracts-column-visibility', JSON.stringify(Array.from(newVisible)));
  };

  const hideAllColumns = () => {
    const newVisible = new Set(['actions']);
    setVisibleColumns(newVisible);
    localStorage.setItem('tracts-column-visibility', JSON.stringify(Array.from(newVisible)));
  };

  return (
    <div>
      {/* Header with white background and icon */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex justify-between items-center">
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
      </div>

      {/* Column Visibility Toggle */}
      {!isLoading && (
        <div className="mb-4 flex justify-end">
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
                              <span className="text-xs text-gray-500">Width: {getColumnWidth(accessor)}px</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const newWidth = getColumnWidth(accessor) + 50;
                                  setColumnWidths(prev => {
                                    const updated = { ...prev, [accessor]: newWidth };
                                    localStorage.setItem('tracts-column-widths', JSON.stringify(updated));
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
                                    localStorage.setItem('tracts-column-widths', JSON.stringify(updated));
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
                                    localStorage.setItem('tracts-column-widths', JSON.stringify(updated));
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
      )}

      {isLoading ? (
        <p className="text-center text-sc-medium-gray">Loading sections...</p>
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
                        isSortable && handleSort(column.accessor as keyof Section | string);
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
