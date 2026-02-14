import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import type { Section, User, TitleStatus } from '../types';
import * as api from '../services/api';
import LeadsTab from '../components/LeadsTab';
import ArcGISMappingTab from '../components/ArcGISMappingTab';
import Button from '../components/ui/Button';
import { formatNMA, formatAcres, formatPercentage, formatOccDate } from '../utils/formatting';
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
            {/* Quick Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200 p-4">
                <div className="text-blue-600 text-sm font-medium mb-1">Net Mineral Acres</div>
                <div className="text-2xl font-bold text-blue-900">{formatNMA(section.netMineralAcres)}</div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200 p-4">
                <div className="text-green-600 text-sm font-medium mb-1">Closed Deals</div>
                <div className="text-2xl font-bold text-green-900">{section.closedDealsCount || 0}</div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200 p-4">
                <div className="text-purple-600 text-sm font-medium mb-1">Acres Acquired</div>
                <div className="text-2xl font-bold text-purple-900">{formatNMA(section.netMineralAcresAcquired)}</div>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200 p-4">
                <div className="text-orange-600 text-sm font-medium mb-1">Status</div>
                <div className="text-lg font-bold text-orange-900">
                  {section.status === 'assigned' ? (
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      Assigned
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                      Unassigned
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Basic Information */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div 
                className="p-5 cursor-pointer flex items-center justify-between hover:bg-gray-50 transition-colors border-b border-gray-100"
                onClick={() => toggleCardCollapse('basicInfo')}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                </div>
                <svg 
                  className={`w-5 h-5 text-gray-400 transform transition-transform ${collapsedCards.basicInfo ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              {!collapsedCards.basicInfo && (
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-1">
                      <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">Section Name</span>
                      <div className="text-gray-900 font-semibold text-base">{section.sectionName}</div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">State</span>
                      <div className="text-gray-900 font-semibold text-base">{section.state}</div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">County</span>
                      <div className="text-gray-900 font-semibold text-base">{section.county}</div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">Assigned Buyer</span>
                      <div className={`font-semibold text-base ${section.assignedBuyer?.name ? 'text-gray-900' : 'text-gray-400'}`}>
                        {section.assignedBuyer?.name || 'Unassigned'}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">Source Channel</span>
                      <div className="text-gray-900 font-semibold text-base">{section.sourceChannel || 'N/A'}</div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">Title Source</span>
                      <div className="text-gray-900 font-semibold text-base">{(section as any).title_source || 'N/A'}</div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">ANUM</span>
                      <div className="text-gray-900 font-semibold text-base">{section.anum || 'N/A'}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Legal Descriptions */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div 
                className="p-5 cursor-pointer flex items-center justify-between hover:bg-gray-50 transition-colors border-b border-gray-100"
                onClick={() => toggleCardCollapse('legalInfo')}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Legal Descriptions</h3>
                </div>
                <svg 
                  className={`w-5 h-5 text-gray-400 transform transition-transform ${collapsedCards.legalInfo ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              {!collapsedCards.legalInfo && (
                <div className="p-6">
                  <div className="space-y-5">
                    <div>
                      <span className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-2 block">Legal Descriptions</span>
                      <div className="text-gray-900 mt-1 leading-relaxed bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
                        {(() => {
                          const raw = section.legalDescription || '';
                          const distinct = Array.from(new Set(
                            raw.split(/\s*;\s*/).map((s: string) => s.trim()).filter(Boolean)
                          ));
                          if (distinct.length === 0) {
                            return <span className="text-gray-500">No description available</span>;
                          }
                          return distinct.map((desc, i) => (
                            <div key={i} className="whitespace-pre-line border-b border-gray-200 last:border-0 last:pb-0 pb-3 last:pb-0">
                              {desc}
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Unit Information */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div 
                className="p-5 cursor-pointer flex items-center justify-between hover:bg-gray-50 transition-colors border-b border-gray-100"
                onClick={() => toggleCardCollapse('unitInfo')}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Unit Information</h3>
                </div>
                <svg 
                  className={`w-5 h-5 text-gray-400 transform transition-transform ${collapsedCards.unitInfo ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              {!collapsedCards.unitInfo && (
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-blue-50 rounded-lg p-5 border border-blue-100">
                      <h4 className="text-sm font-semibold text-blue-900 mb-4 uppercase tracking-wide">Current Unit</h4>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <span className="text-blue-700 text-xs font-medium uppercase tracking-wide block mb-1">Current Unit</span>
                            <div className="text-blue-900 font-semibold text-sm whitespace-pre-line">{section.current_unit || 'N/A'}</div>
                          </div>
                          <div>
                            <span className="text-blue-700 text-xs font-medium uppercase tracking-wide block mb-1">Allocation %</span>
                            <div className="text-blue-900 font-semibold text-sm">
                              {(() => {
                                const raw = section.allo_percent || '';
                                const values = raw.split(/[,\s]+/).map((s: string) => s.trim()).filter(Boolean);
                                if (values.length === 0) return 'N/A';
                                return values.map((v, i) => <div key={i}>{v}</div>);
                              })()}
                            </div>
                          </div>
                        </div>
                        <div>
                          <span className="text-blue-700 text-xs font-medium uppercase tracking-wide block mb-1">SPUD DATE</span>
                          <div className="text-blue-900 font-semibold text-sm">{(section as any).spudDate || 'N/A'}</div>
                        </div>
                        <div>
                          <span className="text-blue-700 text-xs font-medium uppercase tracking-wide block mb-1">First Production</span>
                          <div className="text-blue-900 font-semibold text-sm">{(section as any).firstProduction || 'N/A'}</div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-5 border border-green-100">
                      <h4 className="text-sm font-semibold text-green-900 mb-4 uppercase tracking-wide">New Unit</h4>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <span className="text-green-700 text-xs font-medium uppercase tracking-wide block mb-1">New Unit</span>
                            <div className="text-green-900 font-semibold text-sm whitespace-pre-line">{section.new_unit_name || section.new_unit || 'N/A'}</div>
                          </div>
                          <div>
<span className="text-green-700 text-xs font-medium uppercase tracking-wide block mb-1">Allocation %</span>
                          <div className="text-green-900 font-semibold text-sm">
                            {(() => {
                              const raw = section.new_allo_percent || (section as any).allo_percent_al || section.allo_percent || '';
                              const values = raw.split(/[,\s]+/).map((s: string) => s.trim()).filter(Boolean);
                              if (values.length === 0) return 'N/A';
                              return values.map((v, i) => <div key={i}>{v}</div>);
                            })()}
                          </div>
                          </div>
                        </div>
                        <div>
                          <span className="text-green-700 text-xs font-medium uppercase tracking-wide block mb-1">OCC DATE</span>
                          <div className="text-green-900 font-semibold text-sm">{formatOccDate((section as any).occDate, 'N/A')}</div>
                        </div>
                        <div>
                          <span className="text-green-700 text-xs font-medium uppercase tracking-wide block mb-1">OCC TYPE</span>
                          <div className="text-green-900 font-semibold text-sm">{section.new_occ_type || 'N/A'}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Acreage & Financial */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div 
                className="p-5 cursor-pointer flex items-center justify-between hover:bg-gray-50 transition-colors border-b border-gray-100"
                onClick={() => toggleCardCollapse('acreageFinancial')}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Acreage & Financial</h3>
                </div>
                <svg 
                  className={`w-5 h-5 text-gray-400 transform transition-transform ${collapsedCards.acreageFinancial ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              {!collapsedCards.acreageFinancial && (
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                    <div className="space-y-1">
                      <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">NET MINERAL ACRES</span>
                      <div className="text-gray-900 font-semibold text-lg">{formatNMA(section.netMineralAcres)}</div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">NET ROYALTY ACRES</span>
                      <div className="text-gray-900 font-semibold text-lg">
                        {section.netRoyaltyAcres != null ? formatNMA(section.netRoyaltyAcres) : (section.nra != null ? formatAcres(section.nra) : 'N/A')}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">NRA/$ CAP</span>
                      <div className="text-gray-900 font-semibold text-lg">
                        {section.nraCapUsd != null ? `$${Number(section.nraCapUsd).toLocaleString()}` : 'N/A'}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">NUMBER OF DEALS CLOSED</span>
                      <div className="text-gray-900 font-semibold text-lg">{section.closedDealsCount ?? 0}</div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">NET MINERAL ACRES ACQUIRED</span>
                      <div className="text-gray-900 font-semibold text-lg">{formatNMA(section.netMineralAcresAcquired)}</div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">ROYALTY</span>
                      <div className="text-gray-900 font-semibold text-lg">{section.royalty != null ? `${Number(section.royalty).toFixed(4)}%` : 'N/A'}</div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">NET ROYALTY ACRES ACQUIRED</span>
                      <div className="text-gray-900 font-semibold text-lg">
                        {section.netRoyaltyAcresAcquired != null ? formatNMA(section.netRoyaltyAcresAcquired) : 'N/A'}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">OWNERSHIP % IN SECTION</span>
                      <div className="text-gray-900 font-semibold text-lg">
                        {section.ownershipPercentInSection != null ? `${section.ownershipPercentInSection.toFixed(6)}%` : 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Notes & Flags */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div 
                className="p-5 cursor-pointer flex items-center justify-between hover:bg-gray-50 transition-colors border-b border-gray-100"
                onClick={() => toggleCardCollapse('notesFlags')}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Notes & Flags</h3>
                </div>
                <svg 
                  className={`w-5 h-5 text-gray-400 transform transition-transform ${collapsedCards.notesFlags ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              {!collapsedCards.notesFlags && (
                <div className="p-6">
                  <div className="space-y-5">
                    {section.routingNotes && (
                      <div>
                        <span className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-2 block">Routing Notes</span>
                        <div className="text-gray-900 mt-1 bg-gray-50 p-4 rounded-lg border border-gray-200 leading-relaxed">
                          {section.routingNotes}
                        </div>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-4">
                      <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${section.heldByFund ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
                        <div className={`w-3 h-3 rounded-full ${section.heldByFund ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <span className={`text-sm font-medium ${section.heldByFund ? 'text-green-700' : 'text-gray-600'}`}>
                          Held by Fund
                        </span>
                      </div>
                      <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${section.isLocked ? 'bg-red-50 border border-red-200' : 'bg-gray-50 border border-gray-200'}`}>
                        <div className={`w-3 h-3 rounded-full ${section.isLocked ? 'bg-red-500' : 'bg-gray-300'}`}></div>
                        <span className={`text-sm font-medium ${section.isLocked ? 'text-red-700' : 'text-gray-600'}`}>
                          Lock Flag
                        </span>
                      </div>
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