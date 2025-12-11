
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Section, User, TitleStatus } from '../types';
import * as api from '../services/api';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import { formatNMA } from '../utils/formatting';

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

  const sortedSections = React.useMemo(() => {
    if (!sortField) return sections;

    return [...sections].sort((a, b) => {
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
  }, [sections, sortField, sortDirection]);

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
    
    if (editingSection) {
      await api.updateSection(editingSection.id, sectionData);
    } else {
      await api.createSection(sectionData);
    }
    fetchData();
    handleCloseModal();
  };

  const columns = [
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

      {isLoading ? (
        <p className="text-center text-sc-medium-gray">Loading sections...</p>
      ) : (
        <div className="bg-white rounded-lg border border-sc-light-orange shadow-lg overflow-x-auto">
          <table className="min-w-full table-auto divide-y divide-sc-light-orange">
            <thead className="bg-gray-100">
              <tr>
                {columns.map((column, index) => {
                  const isSortable = ['sectionName', 'state', 'county', 'netMineralAcres', 'grossAcres', 'status', 'assignedBuyer'].includes(column.accessor as string);
                  const isActiveSort = sortField === column.accessor;
                  
                  return (
                    <th
                      key={column.header || index}
                      scope="col"
                      className={`px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200 ${
                        isSortable ? 'cursor-pointer hover:bg-gray-200 select-none' : ''
                      }`}
                      onClick={() => isSortable && handleSort(column.accessor as SortField)}
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
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedSections.map((item, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-gray-50 transition-colors duration-150">
                  {columns.map((column, colIndex) => (
                    <td
                      key={`${rowIndex}-${colIndex}`}
                      className={`px-6 py-4 text-sm text-gray-900 ${column.className || 'whitespace-nowrap'}`}
                    >
                      {column.cell ? column.cell(item) : (item[column.accessor] as React.ReactNode)}
                    </td>
                  ))}
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
