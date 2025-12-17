import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import type { Section, User, TitleStatus } from '../types';
import * as api from '../services/api';
import LeadsTab from '../components/LeadsTab';
import ArcGISMappingTab from '../components/ArcGISMappingTab';
import Button from '../components/ui/Button';
import { formatNMA, formatAcres, formatPercentage } from '../utils/formatting';
import { useAuth } from '../hooks/useAuth';

interface RecordRowProps {
  record: any;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (data: any) => void;
}

const RecordRow: React.FC<RecordRowProps> = ({ record, isEditing, onEdit, onCancel, onSave }) => {
  const [formData, setFormData] = useState({
    OWNER: record.OWNER || '',
    NMA: record.NMA || '',
    ROY: record.ROY || '',
    STATUS: record.STATUS || '',
    BUYER: record.BUYER || '',
    LEGAL_DESCRIPTION: record.LEGAL_DESCRIPTION || '',
    NOTE: record.NOTE || '',
    COUNTY: record.COUNTY || '',
    STREET: record.STREET || '',
    CITY: record.CITY || '',
    ST: record.ST || '',
    ZIP: record.ZIP || '',
    PHONE_EMAIL: record.PHONE_EMAIL || '',
    CONTACT: record.CONTACT || '',
    CURRENT_UNIT_NAME: record.CURRENT_UNIT_NAME || '',
    NEW_UNIT_NAME: record.NEW_UNIT_NAME || '',
    TITLE_SOURCE: record.TITLE_SOURCE || '',
    CALCULATED_ACREAGE: record.CALCULATED_ACREAGE || '',
  });

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSave(formData);
  };

  if (isEditing) {
    return (
      <tr className="bg-yellow-50">
        <td className="px-3 py-2 border border-gray-300">
          <input
            type="text"
            value={formData.OWNER}
            onChange={(e) => handleChange('OWNER', e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
          />
        </td>
        <td className="px-3 py-2 border border-gray-300">
          <input
            type="number"
            step="0.01"
            value={formData.NMA}
            onChange={(e) => handleChange('NMA', e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
          />
        </td>
        <td className="px-3 py-2 border border-gray-300">
          <input
            type="number"
            step="0.01"
            value={formData.ROY}
            onChange={(e) => handleChange('ROY', e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
          />
        </td>
        <td className="px-3 py-2 border border-gray-300">
          <input
            type="text"
            value={formData.STATUS}
            onChange={(e) => handleChange('STATUS', e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
          />
        </td>
        <td className="px-3 py-2 border border-gray-300">
          <input
            type="text"
            value={formData.BUYER}
            onChange={(e) => handleChange('BUYER', e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
          />
        </td>
        <td className="px-3 py-2 border border-gray-300">
          <textarea
            value={formData.LEGAL_DESCRIPTION}
            onChange={(e) => handleChange('LEGAL_DESCRIPTION', e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            rows={2}
          />
        </td>
        <td className="px-3 py-2 border border-gray-300">
          <textarea
            value={formData.NOTE}
            onChange={(e) => handleChange('NOTE', e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            rows={2}
          />
        </td>
        <td className="px-3 py-2 border border-gray-300">
          <div className="flex space-x-1">
            <button
              onClick={handleSave}
              className="px-2 py-1 bg-green-500 hover:bg-green-600 text-white text-xs rounded"
            >
              Save
            </button>
            <button
              onClick={onCancel}
              className="px-2 py-1 bg-gray-500 hover:bg-gray-600 text-white text-xs rounded"
            >
              Cancel
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-3 py-2 border border-gray-300 text-sm">{record.OWNER || 'N/A'}</td>
      <td className="px-3 py-2 border border-gray-300 text-sm">{formatNMA(record.NMA)}</td>
      <td className="px-3 py-2 border border-gray-300 text-sm">{record.ROY || 'N/A'}</td>
      <td className="px-3 py-2 border border-gray-300 text-sm">{record.STATUS || 'N/A'}</td>
      <td className="px-3 py-2 border border-gray-300 text-sm">{record.BUYER || 'N/A'}</td>
      <td className="px-3 py-2 border border-gray-300 text-sm max-w-xs truncate" title={record.LEGAL_DESCRIPTION || ''}>
        {record.LEGAL_DESCRIPTION || 'N/A'}
      </td>
      <td className="px-3 py-2 border border-gray-300 text-sm max-w-xs truncate" title={record.NOTE || ''}>
        {record.NOTE || 'N/A'}
      </td>
      <td className="px-3 py-2 border border-gray-300">
        <button
          onClick={onEdit}
          className="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded"
        >
          Edit
        </button>
      </td>
    </tr>
  );
};

const SectionDetailPage: React.FC = () => {
  const { sectionId } = useParams<{ sectionId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [section, setSection] = useState<Section | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [acreageScheduleRecords, setAcreageScheduleRecords] = useState<any[]>([]);
  const [editingRecordId, setEditingRecordId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAcreageSchedule, setIsLoadingAcreageSchedule] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'contacts' | 'mapping' | 'title-chain' | 'leads'>('overview');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [collapsedCards, setCollapsedCards] = useState<{[key: string]: boolean}>({
    basicInfo: false,
    legalInfo: false,
    acreageFinancial: false,
    unitInfo: false,
    notesFlags: false
  });

  // Normalize role name (handle "Administrator" vs "Admin", etc.)
  const normalizeRole = (role: string): string => {
    const normalized = role.trim();
    if (normalized.toLowerCase() === 'administrator') return 'Admin';
    if (normalized.toLowerCase() === 'read-only') return 'Viewer';
    return normalized;
  };

  const userRole = user?.role?.name || 'Viewer';
  const normalizedUserRole = normalizeRole(userRole);
  const isManagerOrAdmin = normalizedUserRole === 'Manager' || normalizedUserRole === 'Admin';

  useEffect(() => {
    if (sectionId) {
      fetchSectionData();
    }
  }, [sectionId]);

  useEffect(() => {
    // Check if there's a tab query parameter and set the active tab
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      // If user tries to access title-chain but is not Manager/Admin, redirect to overview
      if (tabParam === 'title-chain' && !isManagerOrAdmin) {
        setActiveTab('overview');
        return;
      }
      if (['overview', 'mapping', 'title-chain', 'leads'].includes(tabParam)) {
        setActiveTab(tabParam as any);
      }
    }
  }, [searchParams, isManagerOrAdmin]);

  // Redirect non-managers away from title-chain tab if they're on it
  useEffect(() => {
    if (activeTab === 'title-chain' && !isManagerOrAdmin) {
      setActiveTab('overview');
    }
  }, [activeTab, isManagerOrAdmin]);

  // Filter tabs based on user role - only Manager and Admin can see Title Chain
  // IMPORTANT: This must be called before any early returns to follow Rules of Hooks
  const tabs = useMemo(() => {
    const allTabs = [
      { id: 'overview', label: 'Overview' },
      { id: 'mapping', label: 'Mapping' },
      { id: 'title-chain', label: 'Title Chain' },
      { id: 'leads', label: 'Leads' }
    ];
    
    // Filter out title-chain if user is not Manager or Admin
    return allTabs.filter(tab => {
      if (tab.id === 'title-chain' && !isManagerOrAdmin) {
        return false;
      }
      return true;
    });
  }, [isManagerOrAdmin]);

  const fetchSectionData = async () => {
    setIsLoading(true);
    try {
      const [sectionsResponse, usersResponse, contactsData] = await Promise.all([
        api.fetchSections(),
        api.fetchUsers(),
        api.fetchSectionContacts(sectionId!)
      ]);
      
      const sectionsData = sectionsResponse.data || sectionsResponse;
      const usersData = usersResponse.data || usersResponse;
      
      const foundSection = sectionsData.find(s => s.id === sectionId);
      if (foundSection) {
        // Normalize section data to ensure consistent field names
        const normalizedSection = {
          ...foundSection,
          sectionName: foundSection.sectionName || (foundSection as any).section_name,
          county: foundSection.county || (foundSection as any).COUNTY,
          state: foundSection.state || (foundSection as any).ST || (foundSection as any).state,
          str: foundSection.str || (foundSection as any).S_T_R || (foundSection as any).s_t_r
        };
        console.log('Section data loaded:', normalizedSection);
        console.log('County value:', normalizedSection.county);
        console.log('STR value:', normalizedSection.str);
        setSection(normalizedSection);
      } else {
        navigate('/sections');
        return;
      }
      
      setUsers(usersData);
      setContacts(contactsData);
    } catch (error) {
      console.error('Failed to fetch section data:', error);
      navigate('/sections');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="text-center text-gray-600">Loading section details...</div>;
  }

  if (!section) {
    return <div className="text-center text-gray-600">Section not found</div>;
  }


  const handleEditSection = async () => {
    setIsEditModalOpen(true);
    if (sectionId) {
      setIsLoadingAcreageSchedule(true);
      try {
        console.log('Fetching acreage schedule for section:', sectionId, 'STR:', section?.str);
        const records = await api.fetchSectionAcreageSchedule(sectionId, section?.str);
        console.log('Fetched acreage schedule records:', records);
        setAcreageScheduleRecords(records || []);
      } catch (error) {
        console.error('Failed to fetch acreage schedule records:', error);
        setAcreageScheduleRecords([]);
      } finally {
        setIsLoadingAcreageSchedule(false);
      }
    }
  };

  const handleExportSection = () => {
    if (!section) return;

    // Prepare the data for export
    const exportData = {
      'Section Name': section.sectionName,
      'State': section.state,
      'County': section.county,
      'Legal Description': section.legalDescription,
      'STR': section.str || '',
      'Section Number': section.sectionNumber || '',
      'Township': section.township || '',
      'Range': section.range || '',
      'ANUM': section.anum || '',
      'Gross Acres': section.grossAcres,
      'Net Mineral Acres': section.netMineralAcres || '',
      'Royalty': section.royalty || '',
      'Ownership Percentage': section.ownershipPercentage || '',
      'Title Status': section.titleStatus,
      'Assigned Buyer': section.assignedBuyer?.name || 'Unassigned',
      'NRA Cap USD': section.nraCapUsd || '',
      'Source Channel': section.sourceChannel || '',
      'Routing Notes': section.routingNotes || '',
      'Held by Fund': section.heldByFund ? 'Yes' : 'No',
      'Is Locked': section.isLocked ? 'Yes' : 'No',
      'Created At': section.createdAt || '',
      'Updated At': section.updatedAt || ''
    };

    // Convert to CSV
    const headers = Object.keys(exportData);
    const values = Object.values(exportData);
    const csvContent = [headers.join(','), values.map(v => `"${v}"`).join(',')].join('\n');

    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${section.sectionName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_section_export.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setAcreageScheduleRecords([]);
    setEditingRecordId(null);
  };

  const handleEditRecord = (recordId: number) => {
    setEditingRecordId(recordId);
  };

  const handleCancelEditRecord = () => {
    setEditingRecordId(null);
  };

  const handleSaveRecord = async (recordId: number, recordData: any) => {
    try {
      await api.updateAcreageScheduleRecord(recordId, recordData);
      
      // Update local state
      setAcreageScheduleRecords(prev => 
        prev.map(record => 
          record.id === recordId ? { ...record, ...recordData } : record
        )
      );
      
      setEditingRecordId(null);
      alert('Record updated successfully!');
    } catch (error) {
      console.error('Failed to update record:', error);
      alert('Failed to update record. Please try again.');
    }
  };

  const toggleCardCollapse = (cardKey: string) => {
    setCollapsedCards(prev => ({
      ...prev,
      [cardKey]: !prev[cardKey]
    }));
  };

  const handleSaveSection = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!section) return;

    setIsSaving(true);
    try {
      const formData = new FormData(e.currentTarget);
      
      const sectionData: Partial<Section> = {
        sectionName: formData.get('sectionName') as string,
        state: 'OK', // Hardcode state to 'OK' as requested
        county: formData.get('county') as string,
        legalDescription: formData.get('legalDescription') as string,
        str: formData.get('str') as string || undefined,
        sectionNumber: formData.get('sectionNumber') as string || undefined,
        township: formData.get('township') as string || undefined,
        range: formData.get('range') as string || undefined,
        anum: formData.get('anum') as string || undefined,
        grossAcres: parseFloat(formData.get('grossAcres') as string) || undefined,
        netMineralAcres: parseFloat(formData.get('netMineralAcres') as string) || undefined,
        royalty: (parseFloat(formData.get('royalty') as string) || 0) / 100,
        ownershipPercentage: (parseFloat(formData.get('ownershipPercentage') as string) || 0) / 100,
        titleStatus: formData.get('titleStatus') as TitleStatus,
        nraCapUsd: parseFloat(formData.get('nraCapUsd') as string) || undefined,
        sourceChannel: formData.get('sourceChannel') as string || undefined,
        routingNotes: formData.get('routingNotes') as string || undefined,
        heldByFund: formData.has('heldByFund'),
        isLocked: formData.has('isLocked'),
      };

      await api.updateSection(section.id, sectionData);
      
      // Update local state
      setSection({ ...section, ...sectionData });
      setIsEditModalOpen(false);
      
      // Show success message
      alert('Section updated successfully!');
    } catch (error) {
      console.error('Failed to update section:', error);
      alert('Failed to update section. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <button
            onClick={() => navigate('/sections')}
            className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold rounded-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
            style={{ backgroundColor: '#fbbf24' }}
          >
            ← Back to Sections
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">{section.sectionName}</h1>
          <p className="text-gray-600 mt-2">
            {section.assignedBuyer || section.assignedBuyerId ? 'Assigned' : 'Unassigned'}
          </p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={handleEditSection}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Edit Section
          </button>
          <button 
            onClick={handleExportSection}
            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Export
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div 
                className="p-6 cursor-pointer flex items-center justify-between hover:bg-gray-50 transition-colors"
                onClick={() => toggleCardCollapse('basicInfo')}
              >
                <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                <svg 
                  className={`w-5 h-5 text-gray-500 transform transition-transform ${collapsedCards.basicInfo ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              {!collapsedCards.basicInfo && (
                <div className="px-6 pb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <span className="text-gray-600 text-sm">Section Name</span>
                  <div className="text-gray-900 font-medium">{section.sectionName}</div>
                </div>
                <div>
                  <span className="text-gray-600 text-sm">State</span>
                  <div className="text-gray-900 font-medium">{section.state}</div>
                </div>
                <div>
                  <span className="text-gray-600 text-sm">County</span>
                  <div className="text-gray-900 font-medium">{section.county}</div>
                </div>
                <div>
                  <span className="text-gray-600 text-sm">Assigned Buyer</span>
                  <div className="text-gray-900 font-medium">{section.assignedBuyer?.name || 'Unassigned'}</div>
                </div>
                <div>
                  <span className="text-gray-600 text-sm">Source Channel</span>
                  <div className="text-gray-900 font-medium">{section.sourceChannel || 'N/A'}</div>
                </div>
                  </div>
                </div>
              )}
            </div>

            {/* Legal Information */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div 
                className="p-6 cursor-pointer flex items-center justify-between hover:bg-gray-50 transition-colors"
                onClick={() => toggleCardCollapse('legalInfo')}
              >
                <h3 className="text-lg font-semibold text-gray-900">Legal Information</h3>
                <svg 
                  className={`w-5 h-5 text-gray-500 transform transition-transform ${collapsedCards.legalInfo ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              {!collapsedCards.legalInfo && (
                <div className="px-6 pb-6">
                  <div className="space-y-4">
                <div>
                  <span className="text-gray-600 text-sm">Legal Description</span>
                  <div className="text-gray-900 mt-1 whitespace-pre-line">{section.legalDescription}</div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-600 text-sm">STR (Combined)</span>
                    <div className="text-gray-900 font-medium">{section.str || 'N/A'}</div>
                  </div>
                  <div>
                    <span className="text-gray-600 text-sm">ANUM</span>
                    <div className="text-gray-900 font-medium">{section.anum || 'N/A'}</div>
                  </div>
                </div>
                  </div>
                </div>
              )}
            </div>

            {/* Unit Information */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div 
                className="p-6 cursor-pointer flex items-center justify-between hover:bg-gray-50 transition-colors"
                onClick={() => toggleCardCollapse('unitInfo')}
              >
                <h3 className="text-lg font-semibold text-gray-900">Unit Information</h3>
                <svg 
                  className={`w-5 h-5 text-gray-500 transform transition-transform ${collapsedCards.unitInfo ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              {!collapsedCards.unitInfo && (
                <div className="px-6 pb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <span className="text-gray-600 text-sm">Current Unit</span>
                      <div className="text-gray-900 font-medium whitespace-pre-line">{section.current_unit || 'N/A'}</div>
                    </div>
                    <div>
                      <span className="text-gray-600 text-sm">New Unit</span>
                      <div className="text-gray-900 font-medium whitespace-pre-line">{section.new_unit || 'N/A'}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Acreage & Financial */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div 
                className="p-6 cursor-pointer flex items-center justify-between hover:bg-gray-50 transition-colors"
                onClick={() => toggleCardCollapse('acreageFinancial')}
              >
                <h3 className="text-lg font-semibold text-gray-900">Acreage & Financial</h3>
                <svg 
                  className={`w-5 h-5 text-gray-500 transform transition-transform ${collapsedCards.acreageFinancial ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              {!collapsedCards.acreageFinancial && (
                <div className="px-6 pb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <span className="text-gray-600 text-sm">Gross Acres</span>
                  <div className="text-gray-900 font-medium">{formatAcres(section.grossAcres)}</div>
                </div>
                <div>
                  <span className="text-gray-600 text-sm">Net Mineral Acres</span>
                  <div className="text-gray-900 font-medium">{formatNMA(section.netMineralAcres)}</div>
                </div>
                <div>
                  <span className="text-gray-600 text-sm">Royalty %</span>
                  <div className="text-gray-900 font-medium">{formatPercentage(section.royalty)}</div>
                </div>
                <div>
                  <span className="text-gray-600 text-sm">Ownership %</span>
                  <div className="text-gray-900 font-medium">{formatPercentage(section.ownershipPercentage)}</div>
                </div>
                <div>
                  <span className="text-gray-600 text-sm">NRA (1/8 normalized)</span>
                  <div className="text-gray-900 font-medium">{formatAcres(section.nra)}</div>
                </div>
                <div>
                  <span className="text-gray-600 text-sm">$/NRA Cap</span>
                  <div className="text-gray-900 font-medium">
                    {section.nraCapUsd ? `$${section.nraCapUsd.toLocaleString()}` : 'N/A'}
                  </div>
                </div>
                  </div>
                </div>
              )}
            </div>

            {/* Notes & Flags */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div 
                className="p-6 cursor-pointer flex items-center justify-between hover:bg-gray-50 transition-colors"
                onClick={() => toggleCardCollapse('notesFlags')}
              >
                <h3 className="text-lg font-semibold text-gray-900">Notes & Flags</h3>
                <svg 
                  className={`w-5 h-5 text-gray-500 transform transition-transform ${collapsedCards.notesFlags ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              {!collapsedCards.notesFlags && (
                <div className="px-6 pb-6">
                  <div className="space-y-4">
                <div>
                  <span className="text-gray-600 text-sm">Routing Notes</span>
                  <div className="text-gray-900 mt-1">{section.routingNotes || 'No notes'}</div>
                </div>
                <div className="flex space-x-6">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={section.heldByFund} 
                      disabled 
                      className="h-4 w-4 rounded border-gray-300 text-gray-600 focus:ring-gray-600" 
                    />
                    <span className="text-sm text-gray-600">Held by Fund</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={section.isLocked} 
                      disabled 
                      className="h-4 w-4 rounded border-gray-300 text-gray-600 focus:ring-gray-600" 
                    />
                    <span className="text-sm text-gray-600">Lock Flag</span>
                  </label>
                </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'contacts' && (
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Section Owners</h3>
              <div className="text-sm text-gray-500">
                {contacts.length} owner{contacts.length !== 1 ? 's' : ''} found
              </div>
            </div>
            
            {contacts.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <p>No owners found for this section.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {contacts.map((contact, index) => (
                  <div key={contact.id || index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Contact Information */}
                      <div className="space-y-2">
                        <h4 className="font-medium text-gray-900">{contact.name}</h4>
                        {contact.contact && (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Contact:</span> {contact.contact}
                          </p>
                        )}
                        {contact.phoneEmail && (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Phone/Email:</span> {contact.phoneEmail}
                          </p>
                        )}
                      </div>
                      
                      {/* Address Information */}
                      <div className="space-y-2">
                        {(contact.street || contact.city || contact.state || contact.zip) && (
                          <div>
                            <span className="font-medium text-gray-900 text-sm">Address:</span>
                            <div className="text-sm text-gray-600">
                              {contact.street && <div>{contact.street}</div>}
                              {(contact.city || contact.state || contact.zip) && (
                                <div>
                                  {contact.city && contact.city}
                                  {contact.city && contact.state && ', '}
                                  {contact.state && contact.state}
                                  {contact.zip && ` ${contact.zip}`}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Ownership Information */}
                      <div className="space-y-2">
                        {(contact.nma || contact.royalty || contact.allocation) && (
                          <div>
                            <span className="font-medium text-gray-900 text-sm">Ownership:</span>
                            <div className="text-sm text-gray-600 space-y-1">
                              {contact.nma && (
                                <div>NMA: {formatNMA(contact.nma)}</div>
                              )}
                              {contact.royalty && (
                                <div>Royalty: {parseFloat(contact.royalty).toFixed(2)}%</div>
                              )}
                              {contact.allocation && (
                                <div>Allocation: {parseFloat(contact.allocation).toFixed(2)}%</div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'mapping' && (
          <ArcGISMappingTab 
            sectionId={section.id} 
            sectionName={section.sectionName || (section as any).section_name}
            section={{
              sectionNumber: section.sectionNumber,
              township: section.township,
              range: section.range,
              county: section.county,
              state: section.state,
              str: section.str
            }}
          />
        )}

        {activeTab === 'title-chain' && (
          <div className="text-center text-gray-600 py-12">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Title Chain</h3>
            <p>Title chain functionality coming soon...</p>
          </div>
        )}

        {activeTab === 'leads' && (
          <LeadsTab sectionId={section.id} users={users} />
        )}
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Edit Section</h2>
                <button
                  onClick={handleCloseEditModal}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSaveSection} className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Section Name *
                    </label>
                    <input
                      type="text"
                      name="sectionName"
                      defaultValue={section.sectionName}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State *
                    </label>
                    <input
                      type="text"
                      name="state"
                      defaultValue={section.state}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      County *
                    </label>
                    <input
                      type="text"
                      name="county"
                      defaultValue={section.county}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title Status *
                    </label>
                    <select
                      name="titleStatus"
                      defaultValue={section.titleStatus}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Verified">Verified</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Failed">Failed</option>
                      <option value="Verified with Curative Requirements">Verified with Curative Requirements</option>
                      <option value="Unmapped">Unmapped</option>
                    </select>
                  </div>
                </div>

                {/* Legal Information */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Legal Description
                  </label>
                  <textarea
                    name="legalDescription"
                    defaultValue={section.legalDescription}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      STR (Combined)
                    </label>
                    <input
                      type="text"
                      name="str"
                      defaultValue={section.str}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Section Number
                    </label>
                    <input
                      type="text"
                      name="sectionNumber"
                      defaultValue={section.sectionNumber}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Township
                    </label>
                    <input
                      type="text"
                      name="township"
                      defaultValue={section.township}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Range
                    </label>
                    <input
                      type="text"
                      name="range"
                      defaultValue={section.range}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ANUM
                    </label>
                    <input
                      type="text"
                      name="anum"
                      defaultValue={section.anum}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Acreage & Financial */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gross Acres
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="grossAcres"
                      defaultValue={section.grossAcres}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Net Mineral Acres
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="netMineralAcres"
                      defaultValue={section.netMineralAcres}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Royalty %
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="royalty"
                      defaultValue={section.royalty ? (section.royalty * 100).toFixed(2) : ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ownership %
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="ownershipPercentage"
                      defaultValue={section.ownershipPercentage ? (section.ownershipPercentage * 100).toFixed(2) : ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      $/NRA Cap
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="nraCapUsd"
                      defaultValue={section.nraCapUsd}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Source Channel
                    </label>
                    <input
                      type="text"
                      name="sourceChannel"
                      defaultValue={section.sourceChannel}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Notes & Flags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Routing Notes
                  </label>
                  <textarea
                    name="routingNotes"
                    defaultValue={section.routingNotes}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex space-x-6">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="heldByFund"
                      defaultChecked={section.heldByFund}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Held by Fund</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="isLocked"
                      defaultChecked={section.isLocked}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Lock Flag</span>
                  </label>
                </div>

                {/* Acreage Schedule Records */}
                <div className="pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Acreage Schedule Records</h3>
                  
                  {isLoadingAcreageSchedule ? (
                    <div className="text-center text-gray-600 py-4">Loading acreage schedule records...</div>
                  ) : acreageScheduleRecords.length === 0 ? (
                    <div className="text-center text-gray-500 py-4">
                      <p>No acreage schedule records found for this section.</p>
                      {section?.str ? (
                        <p className="text-xs mt-2">Section STR: {section.str}</p>
                      ) : (
                        <p className="text-xs mt-2 text-red-500">Warning: Section STR not available</p>
                      )}
                    </div>
                  ) : (
                    <div className="overflow-x-auto max-h-96 overflow-y-auto">
                      <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border border-gray-300">Owner</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border border-gray-300">NMA</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border border-gray-300">Royalty</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border border-gray-300">Status</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border border-gray-300">Buyer</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border border-gray-300">Legal Description</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border border-gray-300">Note</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border border-gray-300">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {acreageScheduleRecords.map((record) => (
                            <RecordRow
                              key={record.id}
                              record={record}
                              isEditing={editingRecordId === record.id}
                              onEdit={() => handleEditRecord(record.id)}
                              onCancel={handleCancelEditRecord}
                              onSave={(data) => handleSaveRecord(record.id, data)}
                            />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleCloseEditModal}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SectionDetailPage; 