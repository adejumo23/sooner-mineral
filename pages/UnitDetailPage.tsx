import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  fetchUnit, 
  fetchUnitSections, 
  fetchUnitSectionsEnhanced,
  fetchUnitContacts, 
  fetchUnitContactsAggregated,
  fetchUnitNotes, 
  fetchUnitAssignments,
  fetchUnitNames,
  fetchUsers,
  fetchSections,
  assignUnit,
  unassignUnit,
  updateUnitLock,
  createUnitNote,
  deleteUnit,
  fetchUnitAcreageSchedule,
  updateAcreageScheduleRecord,
  fetchUnitTracker,
  updateUnitTrackerRecord
} from '../services/api';
import { Unit, UnitSection, UnitSectionEnhanced, UnitContact, UnitContactAggregated, UnitNote, UnitAssignment, User, TitleStatus } from '../types';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import UnitMappingTab from '../components/UnitMappingTab';
import { formatNMA } from '../utils/formatting';
import { 
  ArrowLeftIcon, 
  PencilIcon, 
  TrashIcon, 
  LockClosedIcon, 
  LockOpenIcon,
  UserIcon,
  MapIcon,
  DocumentTextIcon,
  CogIcon,
  PlusIcon,
  ClipboardDocumentListIcon,
  MapPinIcon
} from '../components/icons/Icons';

const UnitDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const unitType = searchParams.get('unitType'); // 'new' when viewing from New Unit table
  const unitNameFromQuery = searchParams.get('unitName'); // new unit name when unitType=new
  const [unit, setUnit] = useState<Unit | null>(null);
  const [unitSections, setUnitSections] = useState<UnitSection[]>([]);
  const [unitSectionsEnhanced, setUnitSectionsEnhanced] = useState<UnitSectionEnhanced[]>([]);
  const [unitContacts, setUnitContacts] = useState<UnitContact[]>([]);
  const [unitContactsAggregated, setUnitContactsAggregated] = useState<UnitContactAggregated[]>([]);
  const [unitNotes, setUnitNotes] = useState<UnitNote[]>([]);
  const [unitAssignments, setUnitAssignments] = useState<UnitAssignment[]>([]);
  const [unitNames, setUnitNames] = useState<{currentUnitNames: string[], newUnitNames: string[], totalRecords: number}>({currentUnitNames: [], newUnitNames: [], totalRecords: 0});
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showLockModal, setShowLockModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [selectedBuyer, setSelectedBuyer] = useState('');
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [lockNotes, setLockNotes] = useState('');
  const [noteText, setNoteText] = useState('');
  const [noteType, setNoteType] = useState<UnitNote['noteType']>('Internal');
  const [sectionSearchTerm, setSectionSearchTerm] = useState('');
  const [sectionSortBy, setSectionSortBy] = useState('sectionName');
  const [sectionFilterStatus, setSectionFilterStatus] = useState('');
  const [sectionSortDirection, setSectionSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showAcreageScheduleModal, setShowAcreageScheduleModal] = useState(false);
  const [acreageScheduleRecords, setAcreageScheduleRecords] = useState<any[]>([]);
  const [unitTrackerRecords, setUnitTrackerRecords] = useState<any[]>([]);
  const [isLoadingAcreageSchedule, setIsLoadingAcreageSchedule] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState<number | null>(null);
  const [editingTrackerRecordId, setEditingTrackerRecordId] = useState<string | null>(null);
  const [activeSourceTab, setActiveSourceTab] = useState<'acreage' | 'tracker'>('acreage');

  useEffect(() => {
    if (id) {
      loadUnitData();
    }
  }, [id]);

  // Reload data when returning from edit page
  useEffect(() => {
    const handleFocus = () => {
      if (id && document.visibilityState === 'visible') {
        loadUnitData();
      }
    };
    
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [id]);

  const loadUnitData = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      
      // Fetch all data, handling individual errors gracefully
      const results = await Promise.allSettled([
        fetchUnit(id),
        fetchUnitSections(id),
        fetchUnitContacts(id),
        fetchUnitContactsAggregated(id),
        fetchUnitNotes(id),
        fetchUnitAssignments(id),
        fetchUnitNames(id),
        fetchUsers()
      ]);
      
      // Extract results, using empty defaults for failed requests
      const unitData = results[0].status === 'fulfilled' ? results[0].value : null;
      const sectionsData = results[1].status === 'fulfilled' ? results[1].value : [];
      const contactsData = results[2].status === 'fulfilled' ? results[2].value : [];
      const contactsAggregatedData = results[3].status === 'fulfilled' ? results[3].value : [];
      const notesData = results[4].status === 'fulfilled' ? results[4].value : [];
      const assignmentsData = results[5].status === 'fulfilled' ? results[5].value : [];
      const unitNamesData = results[6].status === 'fulfilled' ? results[6].value : { currentUnitNames: [], newUnitNames: [], totalRecords: 0 };
      const usersData = results[7].status === 'fulfilled' ? results[7].value : { data: [] };
      
      // Log any errors
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          const endpointNames = ['unit', 'sections', 'contacts', 'contactsAggregated', 'notes', 'assignments', 'unitNames', 'users'];
          console.error(`Error loading ${endpointNames[index]}:`, result.reason);
        }
      });
      
      if (!unitData) {
        console.error('Failed to load unit data');
        return;
      }
      
      setUnit(unitData);
      setUnitSections(sectionsData);
      
      // Fetch enhanced sections separately
      try {
        const enhancedSections = await fetchUnitSectionsEnhanced(id);
        const list = Array.isArray(enhancedSections) ? enhancedSections : (enhancedSections?.data ?? []);
        setUnitSectionsEnhanced(list);
      } catch (error) {
        console.error('Error loading enhanced sections:', error);
        setUnitSectionsEnhanced([]);
      }
      
      setUnitContacts(contactsData);
      setUnitContactsAggregated(contactsAggregatedData);
      // Ensure unitNotes is always an array
      setUnitNotes(Array.isArray(notesData) ? notesData : []);
      setUnitAssignments(Array.isArray(assignmentsData) ? assignmentsData : []);
      setUnitNames(unitNamesData);
      setUsers(usersData.data || usersData);
    } catch (error) {
      console.error('Error loading unit data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignUnit = async () => {
    if (!id || !selectedBuyer) return;
    
    try {
      await assignUnit(id, { buyerId: selectedBuyer, notes: assignmentNotes });
      await loadUnitData(); // Reload data
      setShowAssignmentModal(false);
      setSelectedBuyer('');
      setAssignmentNotes('');
    } catch (error) {
      console.error('Error assigning unit:', error);
    }
  };

  const handleUnassignUnit = async () => {
    if (!id) return;
    
    try {
      await unassignUnit(id, 'Unit unassigned by user');
      await loadUnitData(); // Reload data
    } catch (error) {
      console.error('Error unassigning unit:', error);
    }
  };

  const handleUpdateLock = async () => {
    if (!id) return;
    
    try {
      await updateUnitLock(id, { 
        isLocked: !unit?.isLocked, 
        notes: lockNotes 
      });
      await loadUnitData(); // Reload data
      setShowLockModal(false);
      setLockNotes('');
    } catch (error) {
      console.error('Error updating unit lock:', error);
    }
  };

  const handleCreateNote = async () => {
    if (!id || !noteText) return;
    
    try {
      await createUnitNote(id, { noteText, noteType });
      await loadUnitData(); // Reload data
      setShowNoteModal(false);
      setNoteText('');
      setNoteType('Internal');
    } catch (error) {
      console.error('Error creating note:', error);
    }
  };

  const handleDeleteUnit = async () => {
    if (!id) return;
    
    try {
      await deleteUnit(id);
      navigate('/units');
    } catch (error) {
      console.error('Error deleting unit:', error);
    }
  };

  const handleLoadAcreageSchedule = async () => {
    if (!id) return;
    
    setIsLoadingAcreageSchedule(true);
    try {
      const [acreageRecords, trackerRecords] = await Promise.all([
        fetchUnitAcreageSchedule(id).catch(err => {
          console.error('Failed to fetch acreage schedule records:', err);
          return [];
        }),
        fetchUnitTracker(id).catch(err => {
          console.error('Failed to fetch unit tracker records:', err);
          return [];
        })
      ]);
      setAcreageScheduleRecords(acreageRecords || []);
      setUnitTrackerRecords(trackerRecords || []);
    } catch (error) {
      console.error('Failed to fetch source records:', error);
      setAcreageScheduleRecords([]);
      setUnitTrackerRecords([]);
    } finally {
      setIsLoadingAcreageSchedule(false);
    }
  };

  const handleEditRecord = (recordId: number) => {
    setEditingRecordId(recordId);
  };

  const handleCancelEditRecord = () => {
    setEditingRecordId(null);
  };

  const handleSaveRecord = async (recordId: number, recordData: any) => {
    try {
      await updateAcreageScheduleRecord(recordId, recordData);
      
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

  const handleEditTrackerRecord = (recordId: string) => {
    setEditingTrackerRecordId(recordId);
  };

  const handleCancelEditTrackerRecord = () => {
    setEditingTrackerRecordId(null);
  };

  const handleSaveTrackerRecord = async (recordId: string, recordData: any) => {
    try {
      await updateUnitTrackerRecord(recordId, recordData);
      
      // Update local state
      setUnitTrackerRecords(prev => 
        prev.map(record => 
          record.id === recordId ? { ...record, ...recordData } : record
        )
      );
      
      setEditingTrackerRecordId(null);
      alert('Unit tracker record updated successfully!');
    } catch (error) {
      console.error('Failed to update unit tracker record:', error);
      alert('Failed to update unit tracker record. Please try again.');
    }
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

  const getExitStrategyColor = (strategy: Unit['exitStrategy']) => {
    switch (strategy) {
      case 'Hold': return 'text-blue-600 bg-blue-100';
      case 'Flip': return 'text-yellow-600 bg-yellow-100';
      case 'LP Buyout': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTitleStatusColor = (status: TitleStatus) => {
    switch (status) {
      case 'Verified': return 'text-green-600 bg-green-100';
      case 'In Progress': return 'text-blue-600 bg-blue-100';
      case 'Failed': return 'text-red-600 bg-red-100';
      case 'Verified with Curative Requirements': return 'text-yellow-600 bg-yellow-100';
      case 'Unmapped': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-500">Loading unit...</div>
      </div>
    );
  }

  if (!unit) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-500">Unit not found</div>
      </div>
    );
  }

  const displayUnitName = unitNameFromQuery
    ? decodeURIComponent(unitNameFromQuery)
    : (unit.currentUnitName || unit.unitName || '');
  const unitTypeLabel = unitType === 'new' ? 'New' : 'Current';

  const tabs = [
    { id: 'overview', name: 'Overview', icon: DocumentTextIcon },
    { id: 'sections', name: 'Linked Sections', icon: MapIcon },
    { id: 'mapping', name: 'Mapping Preview', icon: MapIcon },
  ];

  const filteredAndSortedSections = unitSectionsEnhanced
    .filter(section => {
      const sectionName = section.section?.sectionName || section.sectionName || '';
      const str = section.str || section.section?.str || '';
      const county = section.section?.county || '';
      const state = section.section?.state || '';
      
      return sectionName.toLowerCase().includes(sectionSearchTerm.toLowerCase()) ||
        str.toLowerCase().includes(sectionSearchTerm.toLowerCase()) ||
        county.toLowerCase().includes(sectionSearchTerm.toLowerCase()) ||
        state.toLowerCase().includes(sectionSearchTerm.toLowerCase());
    })
    .filter(section => {
      const titleStatus = section.titleStatus || section.section?.titleStatus || '';
      return sectionFilterStatus ? titleStatus === sectionFilterStatus : true;
    })
    .sort((a, b) => {
      const aSectionName = a.section?.sectionName || a.sectionName || '';
      const bSectionName = b.section?.sectionName || b.sectionName || '';
      const aGrossAcres = a.grossAcres || a.section?.grossAcres || 0;
      const bGrossAcres = b.grossAcres || b.section?.grossAcres || 0;
      const aNetAcres = a.netMineralAcres || a.section?.netMineralAcres || 0;
      const bNetAcres = b.netMineralAcres || b.section?.netMineralAcres || 0;
      const aTitleStatus = a.titleStatus || a.section?.titleStatus || '';
      const bTitleStatus = b.titleStatus || b.section?.titleStatus || '';
      
      let result = 0;
      if (sectionSortBy === 'sectionName') {
        result = aSectionName.localeCompare(bSectionName);
      } else if (sectionSortBy === 'grossAcres') {
        result = aGrossAcres - bGrossAcres;
      } else if (sectionSortBy === 'netMineralAcres') {
        result = aNetAcres - bNetAcres;
      } else if (sectionSortBy === 'titleStatus') {
        result = aTitleStatus.localeCompare(bTitleStatus);
      } else if (sectionSortBy === 'lastActivity') {
        result = new Date(a.lastActivity || 0).getTime() - new Date(b.lastActivity || 0).getTime();
      }
      
      return sectionSortDirection === 'asc' ? result : -result;
    });

  const handleViewTitleChain = (section: UnitSectionEnhanced) => {
    const sectionId = section.sectionId || (section as any).id;
    if (sectionId) {
      navigate(`/sections/${sectionId}?tab=title-chain`);
    }
  };

  const handleViewContacts = async (section: UnitSectionEnhanced) => {
    console.log('handleViewContacts called with section:', section);
    // Find the section ID by matching the STR value
    const str = section.str || section.section?.str || '';
    
    console.log('STR value:', str);
    
    if (!str) {
      console.error('No STR value found for section:', section);
      alert('Unable to find section information. Please try navigating to sections manually.');
      return;
    }
    
    try {
      console.log('Fetching section by STR:', str);
      // Use the new API endpoint to find section by STR
      // Use query parameter to avoid route conflicts
      const apiBaseUrl = (import.meta as any).env?.VITE_API_BASE_URL || '/api';
      const encodedStr = encodeURIComponent(str);
      const url = `${apiBaseUrl}/sections/by-str?str=${encodedStr}`;
      
      console.log('Fetching URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Response status:', response.status, response.statusText);
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text.substring(0, 200));
        throw new Error(`Server returned HTML instead of JSON. Status: ${response.status}`);
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API error:', errorData);
        throw new Error(`Section not found: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Section data received:', data);
      
      if (data.id) {
        console.log('Navigating to section:', data.id);
        // Navigate to section detail page
        navigate(`/sections/${data.id}`);
      } else {
        throw new Error('Section ID not found in response');
      }
    } catch (error) {
      console.error('Error finding section:', error);
      // On error, navigate to sections page
      navigate('/sections');
      alert(`Error loading section with STR "${str}": ${error instanceof Error ? error.message : 'Unknown error'}. Please try navigating to sections manually.`);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Link to="/units" className="text-gray-400 hover:text-gray-600">
            <ArrowLeftIcon className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {displayUnitName || 'Unnamed Unit'}
            </h1>
            <p className="text-gray-600 mt-1">
              {unit.operator} • {unit.county}, {unit.state}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={() => {
              setShowAcreageScheduleModal(true);
              handleLoadAcreageSchedule();
            }}
            className="flex items-center space-x-2"
          >
            <ClipboardDocumentListIcon className="h-4 w-4" />
            <span>Edit Source Records</span>
          </Button>
          
          {unit.isLocked ? (
            <Button
              variant="outline"
              onClick={() => setShowLockModal(true)}
              className="flex items-center space-x-2"
            >
              <LockClosedIcon className="h-4 w-4" />
              <span>Unlock</span>
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => setShowLockModal(true)}
              className="flex items-center space-x-2"
            >
              <LockOpenIcon className="h-4 w-4" />
              <span>Lock</span>
            </Button>
          )}
          
          <Link to={`/units/${id}/edit`}>
            <Button variant="outline" className="flex items-center space-x-2">
              <PencilIcon className="h-4 w-4" />
              <span>Edit</span>
            </Button>
          </Link>
          
          <Button
            variant="outline"
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center space-x-2 text-red-600 hover:text-red-700"
          >
            <TrashIcon className="h-4 w-4" />
            <span>Delete</span>
          </Button>
        </div>
      </div>

      {/* Status Badges */}
      <div className="flex items-center space-x-4 mb-6">
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(unit.status)}`}>
          {unit.status}
        </span>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getExitStrategyColor(unit.exitStrategy)}`}>
          {unit.exitStrategy}
        </span>
        {unit.heldByFund && (
          <span className="px-3 py-1 rounded-full text-sm font-medium text-purple-600 bg-purple-100">
            Held by Fund
          </span>
        )}
        {unit.isLocked && (
          <span className="px-3 py-1 rounded-full text-sm font-medium text-red-600 bg-red-100">
            Locked
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'border-sc-blue text-sc-blue'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-96">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Information - Left column */}
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Unit Name</dt>
                    <dd className="text-sm text-gray-900 mt-0.5">{displayUnitName || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Operator</dt>
                    <dd className="text-sm text-gray-900">{unit.operator || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Status</dt>
                    <dd className="text-sm text-gray-900">{unit.status || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">County</dt>
                    <dd className="text-sm text-gray-900">{unit.county}, {unit.state}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Exit Strategy</dt>
                    <dd className="text-sm text-gray-900">{unit.exitStrategy || '—'}</dd>
                  </div>
                </dl>
              </div>
            </Card>

            {/* Basic Information - Right column */}
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">&nbsp;</h3>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Unit Type</dt>
                    <dd className="text-sm text-gray-900 mt-0.5">{unitTypeLabel}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Section(s)</dt>
                    <dd className="text-sm text-gray-900 mt-0.5">
                      {(unit as Unit & { strList?: string[] }).strList?.length ? (
                        <span className="block">
                          {(unit as Unit & { strList?: string[] }).strList!.map((s, i) => (
                            <span key={i} className="block">{s}</span>
                          ))}
                        </span>
                      ) : unit.str ? (
                        <span className="block">{unit.str}</span>
                      ) : (
                        '—'
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Allocation %</dt>
                    <dd className="text-sm text-gray-900 mt-0.5">
                      {(unit as Unit & { allocationList?: (number | undefined)[] }).allocationList?.length ? (
                        <span className="block">
                          {(unit as Unit & { allocationList?: (number | undefined)[] }).allocationList!.map((v, i) => (
                            <span key={i} className="block">{v != null ? Number(v).toFixed(6) : '—'}</span>
                          ))}
                        </span>
                      ) : unit.allocationPercentage != null ? (
                        Number(unit.allocationPercentage).toFixed(6)
                      ) : (
                        '—'
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Estimated Net Acres</dt>
                    <dd className="text-sm text-gray-900 mt-0.5">
                      {unit.estimatedNetAcres != null
                        ? Number(unit.estimatedNetAcres).toLocaleString()
                        : (unit as Unit & { estimatedNetAcresList?: number[] }).estimatedNetAcresList?.length
                          ? (unit as Unit & { estimatedNetAcresList?: number[] }).estimatedNetAcresList!.reduce((s, v) => s + Number(v) || 0, 0).toLocaleString()
                          : '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Estimated Number of Owners</dt>
                    <dd className="text-sm text-gray-900 mt-0.5">
                      {(unit as Unit & { estimatedNumberOfOwnersList?: number[] }).estimatedNumberOfOwnersList?.length ? (
                        <span className="block">
                          {(unit as Unit & { estimatedNumberOfOwnersList?: number[] }).estimatedNumberOfOwnersList!.map((v, i) => (
                            <span key={i} className="block">{v}</span>
                          ))}
                        </span>
                      ) : (
                        '—'
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">NRA / $ Cap</dt>
                    <dd className="text-sm text-gray-900 mt-0.5">
                      {(unit as Unit & { nraCapUsdList?: (number | null)[] }).nraCapUsdList?.length ? (
                        <span className="block">
                          {(unit as Unit & { nraCapUsdList?: (number | null)[] }).nraCapUsdList!.map((v, i) => (
                            <span key={i} className="block">
                              {v != null ? `$${Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                            </span>
                          ))}
                        </span>
                      ) : unit.nraCapUsd != null ? (
                        `$${Number(unit.nraCapUsd).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      ) : (
                        '—'
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">API Number</dt>
                    <dd className="text-sm text-gray-900 mt-0.5 font-mono">
                      {unit.apiNumbers?.length ? unit.apiNumbers.join(', ') : '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Spud Date</dt>
                    <dd className="text-sm text-gray-900 mt-0.5">
                      {unit.spudDate ? new Date(unit.spudDate).toLocaleDateString() : '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Target Formation(s)</dt>
                    <dd className="text-sm text-gray-900 mt-0.5">
                      {unit.targetFormations?.length ? unit.targetFormations.join(', ') : '—'}
                    </dd>
                  </div>
                </dl>
              </div>
            </Card>

            {/* Unit Names */}
            <Card className="lg:col-span-2">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Unit Names</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-md font-medium text-gray-700 mb-3">Current Unit Names</h4>
                    {unitNames.currentUnitNames.length > 0 ? (
                      <div className="space-y-2">
                        {unitNames.currentUnitNames.map((name, index) => (
                          <div key={index} className="bg-blue-50 p-3 rounded-md border-l-4 border-blue-400">
                            <p className="text-sm text-gray-900 font-medium">{name}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No current unit names found</p>
                    )}
                  </div>
                  
                  <div>
                    <h4 className="text-md font-medium text-gray-700 mb-3">New Unit Names</h4>
                    {unitNames.newUnitNames.length > 0 ? (
                      <div className="space-y-2">
                        {unitNames.newUnitNames.map((name, index) => (
                          <div key={index} className="bg-green-50 p-3 rounded-md border-l-4 border-green-400">
                            <p className="text-sm text-gray-900 font-medium">{name}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No new unit names found</p>
                    )}
                  </div>
                </div>
                {unitNames.totalRecords > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      Found {unitNames.totalRecords} records with unit name data
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* Buyer Assignment History */}
            <Card className="lg:col-span-2">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Buyer Assignment History</h3>
                <dl className="space-y-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Assigned to</dt>
                    <dd className="text-sm text-gray-900 mt-0.5">
                      {unit.assignedBuyer?.name ?? unit.buyer ?? '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Date Assigned</dt>
                    <dd className="text-sm text-gray-900 mt-0.5">
                      {unitAssignments.length > 0 && unitAssignments[0].assignedAt
                        ? new Date(unitAssignments[0].assignedAt).toLocaleDateString()
                        : '—'}
                    </dd>
                  </div>
                </dl>
              </div>
            </Card>

            {/* Section Notes */}
            <Card className="lg:col-span-2">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Section Notes</h3>
                <div className="bg-gray-50 border border-gray-200 rounded-md min-h-[80px] p-3">
                  {unit.notes ? (
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{unit.notes}</p>
                  ) : (
                    <p className="text-sm text-gray-500">No section notes</p>
                  )}
                </div>
              </div>
            </Card>

            {/* Current Buyer Assignment */}
            <Card className="lg:col-span-2">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Current Buyer Assignment</h3>
                  {!unit?.assignedBuyer ? (
                    <Button onClick={() => setShowAssignmentModal(true)}>
                      Assign Unit
                    </Button>
                  ) : (
                    <Button onClick={() => setShowAssignmentModal(true)}>
                      Reassign Buyer
                    </Button>
                  )}
                </div>
                
                {unit?.assignedBuyer ? (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Buyer Assignment Details</h4>
                        <dl className="space-y-2">
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Assigned Buyer</dt>
                            <dd className="text-sm text-gray-900">{unit.assignedBuyer?.name || 'N/A'}</dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Email</dt>
                            <dd className="text-sm text-gray-600">{unit.assignedBuyer?.email || 'N/A'}</dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Role</dt>
                            <dd className="text-sm text-gray-600">{unit.assignedBuyer?.role?.name || 'N/A'}</dd>
                          </div>
                        </dl>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Buyer Assignment Status</h4>
                        <dl className="space-y-2">
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Status</dt>
                            <dd className="text-sm">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                In Progress
                              </span>
                            </dd>
                          </div>
                        </dl>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Valuation Cap ($/NRA)
                          </label>
                          <div className="flex items-center space-x-2">
                            <span className="text-2xl font-bold text-gray-900">$2,500</span>
                            <Button variant="outline" size="sm">
                              <PencilIcon className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Target price per normalized royalty acre for underwriting
                          </p>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Auto-Generate Leads
                          </label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="autoGenerateLeads"
                              defaultChecked={true}
                              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                            />
                            <label htmlFor="autoGenerateLeads" className="text-sm text-gray-700">
                              Create leads for owners tied to linked sections
                            </label>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Optional checkbox to suppress auto-lead creation
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <Button
                        variant="outline"
                        onClick={handleUnassignUnit}
                        className="text-red-600 hover:text-red-700"
                      >
                        Unassign Unit
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">No buyer currently assigned to this unit</p>
                )}
              </div>
            </Card>

            {/* Comment Thread */}
            <Card className="lg:col-span-2">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Comment Thread</h3>
                  <Button onClick={() => setShowNoteModal(true)}>
                    Add Comment
                  </Button>
                </div>
                
                <div className="space-y-3">
                  <div className="border-l-4 border-blue-200 pl-4 py-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm text-gray-900">
                          Initial assignment made for acquisition campaign. Unit shows strong potential with multiple target formations.
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Alice Admin • {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
                        </p>
                      </div>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Assignment
                      </span>
                    </div>
                  </div>
                  
                  <div className="border-l-4 border-green-200 pl-4 py-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm text-gray-900">
                          Valuation cap set at $2,500/NRA based on recent comparable sales in the area.
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Bob Manager • {new Date(Date.now() - 86400000).toLocaleDateString()} {new Date(Date.now() - 86400000).toLocaleTimeString()}
                        </p>
                      </div>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Valuation
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Unit Notes */}
            <Card className="lg:col-span-2">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Unit Notes</h3>
                  <Button onClick={() => setShowNoteModal(true)}>
                    Add Note
                  </Button>
                </div>
                
                {!Array.isArray(unitNotes) || unitNotes.length === 0 ? (
                  <p className="text-gray-500">No notes available</p>
                ) : (
                  <div className="space-y-3">
                    {unitNotes.map((note) => (
                      <div key={note?.id || Math.random()} className="border-l-4 border-gray-200 pl-4 py-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm text-gray-900">{note?.noteText || 'N/A'}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {note?.createdByUser?.name || 'Unknown'} • {note?.createdAt ? new Date(note.createdAt).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            note?.noteType === 'Assignment' ? 'bg-blue-100 text-blue-800' :
                            note?.noteType === 'Status Change' ? 'bg-yellow-100 text-yellow-800' :
                            note?.noteType === 'Lock/Unlock' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {note?.noteType || 'Unknown'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'sections' && (
          <div className="space-y-6">
            {/* Header Bar */}
            <Card>
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Linked Sections in This Unit</h3>
                  <div className="flex space-x-3">
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder="Search sections..."
                        value={sectionSearchTerm}
                        onChange={(e) => setSectionSearchTerm(e.target.value)}
                        className="w-64 pl-8"
                      />
                      <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                    </div>
                    <select
                      value={sectionSortBy}
                      onChange={(e) => {
                        setSectionSortBy(e.target.value);
                        setSectionSortDirection('asc');
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sc-blue focus:border-transparent"
                    >
                      <option value="sectionName">Sort by Section Name</option>
                      <option value="netMineralAcres">Sort by Net Acres (NMA)</option>
                      <option value="titleStatus">Sort by Title Status</option>
                      <option value="lastActivity">Sort by Last Activity</option>
                    </select>
                    <button
                      onClick={() => setSectionSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
                      className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sc-blue"
                      title={`Sort ${sectionSortDirection === 'asc' ? 'Descending' : 'Ascending'}`}
                    >
                      {sectionSortDirection === 'asc' ? '↑' : '↓'}
                    </button>
                    <select
                      value={sectionFilterStatus}
                      onChange={(e) => setSectionFilterStatus(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sc-blue focus:border-transparent"
                    >
                      <option value="">All Title Statuses</option>
                      <option value="Verified">Verified</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Failed">Failed</option>
                      <option value="Verified with Curative Requirements">Curative Required</option>
                      <option value="Unmapped">Unmapped</option>
                    </select>
                  </div>
                </div>
                
                {filteredAndSortedSections.length === 0 ? (
                  <p className="text-gray-500">No sections linked to this unit</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th 
                            className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 ${
                              sectionSortBy === 'sectionName' ? 'bg-gray-100' : ''
                            }`}
                            onClick={() => {
                              setSectionSortBy('sectionName');
                              setSectionSortDirection(prev => sectionSortBy === 'sectionName' ? (prev === 'asc' ? 'desc' : 'asc') : 'asc');
                            }}
                          >
                            <div className="flex items-center space-x-1">
                              <span>STR</span>
                              {sectionSortBy === 'sectionName' && (
                                <span className="text-gray-400">
                                  {sectionSortDirection === 'asc' ? '↑' : '↓'}
                                </span>
                              )}
                              {sectionSortBy !== 'sectionName' && (
                                <span className="opacity-30 text-xs">⇅</span>
                              )}
                            </div>
                          </th>
                          <th 
                            className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 ${
                              sectionSortBy === 'netMineralAcres' ? 'bg-gray-100' : ''
                            }`}
                            onClick={() => {
                              setSectionSortBy('netMineralAcres');
                              setSectionSortDirection(prev => sectionSortBy === 'netMineralAcres' ? (prev === 'asc' ? 'desc' : 'asc') : 'asc');
                            }}
                          >
                            <div className="flex items-center space-x-1">
                              <span>Net Acres (NMA)</span>
                              {sectionSortBy === 'netMineralAcres' && (
                                <span className="text-gray-400">
                                  {sectionSortDirection === 'asc' ? '↑' : '↓'}
                                </span>
                              )}
                              {sectionSortBy !== 'netMineralAcres' && (
                                <span className="opacity-30 text-xs">⇅</span>
                              )}
                            </div>
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Allocation%
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            # of Owners
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Unit Type
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            API Number
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            NRA / $ Cap
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Assigned Buyers
                          </th>
                          <th 
                            className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 ${
                              sectionSortBy === 'lastActivity' ? 'bg-gray-100' : ''
                            }`}
                            onClick={() => {
                              setSectionSortBy('lastActivity');
                              setSectionSortDirection(prev => sectionSortBy === 'lastActivity' ? (prev === 'asc' ? 'desc' : 'asc') : 'asc');
                            }}
                          >
                            <div className="flex items-center space-x-1">
                              <span>Last Activity</span>
                              {sectionSortBy === 'lastActivity' && (
                                <span className="text-gray-400">
                                  {sectionSortDirection === 'asc' ? '↑' : '↓'}
                                </span>
                              )}
                              {sectionSortBy !== 'lastActivity' && (
                                <span className="opacity-30 text-xs">⇅</span>
                              )}
                            </div>
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Quick Links
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredAndSortedSections.map((section) => {
                          const sectionName = section.section?.sectionName || section.sectionName || 'N/A';
                          const county = section.section?.county || '';
                          const state = section.section?.state || '';
                          
                          // Clean STR value: remove all commas, newlines, and extra whitespace
                          let strValue = section.str || section.section?.str || 'N/A';
                          
                          // Handle arrays (in case STR is accidentally an array)
                          if (Array.isArray(strValue)) {
                            strValue = strValue.join(' ').replace(/,/g, '');
                          }
                          // Convert to string and clean
                          let str = String(strValue)
                            .replace(/,/g, '') // Remove all commas first
                            .replace(/\r\n/g, ' ') // Replace Windows line breaks
                            .replace(/\n/g, ' ') // Replace Unix line breaks
                            .replace(/\r/g, ' ') // Replace old Mac line breaks
                            .replace(/\s+/g, ' ') // Replace multiple spaces with single space
                            .trim();
                          // Final pass: remove any commas that might have been reintroduced
                          str = str.replace(/,/g, '').trim();
                          const netAcres = section.netMineralAcres ?? section.section?.netMineralAcres ?? (section as any).net_mineral_acres ?? 0;
                          const allocationPct = (section as any).allocationPct;
                          const ownerCount = (section as any).ownerCount;
                          const nraCapUsd = (section as any).nraCapUsd;
                          const apiNumber = unit?.apiNumbers?.length ? unit.apiNumbers[0] : '—';
                          
                          return (
                            <tr 
                              key={section.id} 
                              className="hover:bg-gray-50 transition-colors duration-150"
                              title={`${sectionName} - ${county}, ${state}`}
                            >
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900 font-mono whitespace-nowrap">
                                  {str}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {county && state ? `${county}, ${state}` : county || state || ''}
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {formatNMA(netAcres)}
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900 font-mono">
                                  {allocationPct != null ? Number(allocationPct).toFixed(6) : '—'}
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {ownerCount != null ? ownerCount : '—'}
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {unitTypeLabel}
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900 font-mono">
                                  {apiNumber}
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {nraCapUsd != null
                                    ? `$${Number(nraCapUsd).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                    : '—'}
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {(() => {
                                    const buyerName = typeof section.assignedBuyer === 'string' 
                                      ? section.assignedBuyer 
                                      : (section.assignedBuyer?.name || '');
                                    return buyerName && buyerName.trim() ? (
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        {buyerName}
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                        Unassigned
                                      </span>
                                    );
                                  })()}
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500">
                                  {section.lastActivity ? (
                                    <span title={`Last activity: ${new Date(section.lastActivity).toLocaleString()}`}>
                                      {new Date(section.lastActivity).toLocaleDateString()}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">No activity</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="flex flex-wrap gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs hover:bg-green-50 hover:border-green-300 transition-colors duration-150"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleViewContacts(section);
                                    }}
                                    title="View owners for this section"
                                  >
                                    View Owners
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs hover:bg-blue-50 hover:border-blue-300 transition-colors duration-150"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleViewTitleChain(section);
                                    }}
                                    title="View title chain for this section"
                                  >
                                    View Title Chain
                                  </Button>
                                </div>
                              </td>
                            </tr>
                        );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
                
                {filteredAndSortedSections.length > 0 && (
                  <div className="mt-4 text-sm text-gray-500">
                    Showing {filteredAndSortedSections.length} of {unitSectionsEnhanced.length} sections
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'contacts' && (
          <div className="space-y-6">
            {/* Header with Actions */}
            <Card>
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Unit Owners</h3>
                  <div className="flex space-x-3">
                    <Button variant="outline" size="sm">
                      Filter & Sort
                    </Button>
                    <Button variant="outline" size="sm">
                      Bulk Actions
                    </Button>
                  </div>
                </div>
                
                {unitContactsAggregated.length === 0 ? (
                  <p className="text-gray-500">No owners linked to this unit</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Contact Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Ownership % (Weighted)
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Royalty % (Weighted)
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            NMA (Total)
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            NRA (1/8 Normalized)
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Sections Owned
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Last Outreach
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Lead Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {unitContactsAggregated.map((contact) => (
                          <tr key={contact.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                    <span className="text-sm font-medium text-gray-700">
                                      {contact.contact?.name?.charAt(0) || '?'}
                                    </span>
                                  </div>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    <Link 
                                      to={`/contacts/${contact.contactId}`}
                                      className="text-primary hover:text-primary-600"
                                    >
                                      {contact.contact?.name || 'Unknown Contact'}
                                    </Link>
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {contact.contact?.contactType || 'Unknown Type'}
                                  </div>
                                  {contact.contact?.email && (
                                    <div className="text-xs text-gray-400">
                                      {contact.contact.email}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {(contact.ownershipPercentageWeighted * 100).toFixed(1)}%
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {(contact.royaltyPercentageWeighted * 100).toFixed(1)}%
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatNMA(contact.totalNMA)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {contact.totalNRA ? contact.totalNRA.toLocaleString() : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div className="flex flex-wrap gap-1">
                                {(Array.isArray(contact.sectionsOwned) ? contact.sectionsOwned : []).map((sectionId) => {
                                  const section = unitSections.find(us => us.sectionId === sectionId)?.section;
                                  return (
                                    <span 
                                      key={sectionId}
                                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                      title={section?.sectionName || sectionId}
                                    >
                                      {section?.sectionName || sectionId}
                                    </span>
                                  );
                                })}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {contact.lastOutreach ? (
                                <span>{new Date(contact.lastOutreach).toLocaleDateString()}</span>
                              ) : (
                                <span className="text-gray-400">No outreach</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                contact.leadStatus === 'Open' ? 'bg-green-100 text-green-800' :
                                contact.leadStatus === 'Closed' ? 'bg-gray-100 text-gray-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {contact.leadStatus}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                {!contact.hasActiveLeads ? (
                                  <Button size="sm" variant="outline">
                                    Create Lead
                                  </Button>
                                ) : (
                                  <Button size="sm" variant="outline">
                                    View Leads
                                  </Button>
                                )}
                                <Button size="sm" variant="outline">
                                  <PencilIcon className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </Card>

            {/* Contact Summary Statistics */}
            <Card>
              <div className="p-6">
                <h4 className="text-md font-medium text-gray-900 mb-4">Contact Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {unitContactsAggregated.length}
                    </div>
                    <div className="text-sm text-gray-500">Total Owners</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {unitContactsAggregated.filter(c => c.leadStatus === 'Open').length}
                    </div>
                    <div className="text-sm text-gray-500">Active Leads</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {formatNMA(unitContactsAggregated.reduce((sum, c) => sum + (c.totalNMA || 0), 0))}
                    </div>
                    <div className="text-sm text-gray-500">Total NMA</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {unitContactsAggregated.reduce((sum, c) => sum + (c.totalNRA || 0), 0).toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">Total NRA</div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'mapping' && (
          <div className="h-[600px]">
            <UnitMappingTab 
              unitId={unit.id} 
              unit={unit} 
              unitTracts={unitSectionsEnhanced} 
            />
          </div>
        )}

        {activeTab === 'assignment' && (
          <div className="space-y-6">
            {/* Current Buyer Assignments */}
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Buyer Assignments</h3>
                {!Array.isArray(unitAssignments) || unitAssignments.length === 0 ? (
                  <p className="text-gray-500">No current buyer assignments</p>
                ) : (
                  <div className="space-y-3">
                    {unitAssignments
                      .filter(assignment => assignment?.assignmentStatus === 'In Progress' || !assignment?.removedAt)
                      .reduce((unique, assignment) => {
                        // Only add if we haven't seen this buyer before
                        if (!unique.find(item => item?.buyer?.name === assignment?.buyer?.name)) {
                          unique.push(assignment);
                        }
                        return unique;
                      }, [] as typeof unitAssignments)
                      .map((assignment) => (
                      <div key={assignment?.id || Math.random()} className="border-l-4 border-blue-200 pl-4 py-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm text-gray-900">
                              <span className="font-medium">Assigned to:</span> {assignment?.buyer?.name || 'Unknown'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Assignment Modal */}
      <Modal
        isOpen={showAssignmentModal}
        onClose={() => setShowAssignmentModal(false)}
        title={unit?.assignedBuyer ? "Reassign Unit to Buyer" : "Assign Unit to Buyer"}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Buyer
            </label>
            <select
              value={selectedBuyer}
              onChange={(e) => setSelectedBuyer(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">Choose a buyer...</option>
              {users.filter(u => u.role.name === 'Buyer' || u.role.name === 'Manager').map(user => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email}) - {user.role.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buyer Assignment Status
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="In Progress">In Progress</option>
              <option value="Under Review">Under Review</option>
              <option value="Closed">Closed</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Valuation Cap ($/NRA)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                type="number"
                placeholder="2500"
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Target price per normalized royalty acre for underwriting
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Auto-Generate Leads
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="modalAutoGenerateLeads"
                defaultChecked={true}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <label htmlFor="modalAutoGenerateLeads" className="text-sm text-gray-700">
                Create leads for owners tied to linked sections
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Optional checkbox to suppress auto-lead creation (for review-only assignments)
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buyer Assignment Notes (Optional)
            </label>
            <textarea
              value={assignmentNotes}
              onChange={(e) => setAssignmentNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Add any notes about this buyer assignment..."
            />
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <Button variant="outline" onClick={() => setShowAssignmentModal(false)}>
            Cancel
          </Button>
          <Button onClick={handleAssignUnit} disabled={!selectedBuyer}>
            {unit.assignedBuyer ? 'Reassign Unit' : 'Assign Unit'}
          </Button>
        </div>
      </Modal>

      {/* Lock/Unlock Modal */}
      <Modal
        isOpen={showLockModal}
        onClose={() => setShowLockModal(false)}
        title={unit.isLocked ? 'Unlock Unit' : 'Lock Unit'}
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            {unit.isLocked 
              ? 'Unlocking this unit will allow outreach and buyer assignment activities.'
              : 'Locking this unit will prevent outreach and buyer assignment activities while under due diligence.'
            }
          </p>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={lockNotes}
              onChange={(e) => setLockNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sc-blue focus:border-transparent"
              placeholder={`Add notes about ${unit.isLocked ? 'unlocking' : 'locking'} this unit...`}
            />
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <Button variant="outline" onClick={() => setShowLockModal(false)}>
            Cancel
          </Button>
          <Button onClick={handleUpdateLock}>
            {unit.isLocked ? 'Unlock Unit' : 'Lock Unit'}
          </Button>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Unit"
      >
        <div className="space-y-4">
          <p className="text-red-600 font-medium">
            Are you sure you want to delete this unit?
          </p>
          <p className="text-gray-600">
            This action cannot be undone. All unit data, buyer assignments, and notes will be permanently removed.
          </p>
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button onClick={handleDeleteUnit} className="bg-red-600 hover:bg-red-700">
            Delete Unit
          </Button>
        </div>
      </Modal>

      {/* Add Note Modal */}
      <Modal
        isOpen={showNoteModal}
        onClose={() => setShowNoteModal(false)}
        title="Add Unit Note"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Note Type
            </label>
            <select
              value={noteType}
              onChange={(e) => setNoteType(e.target.value as UnitNote['noteType'])}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sc-blue focus:border-transparent"
            >
              <option value="Internal">Internal</option>
              <option value="Assignment">Buyer Assignment</option>
              <option value="Status Change">Status Change</option>
              <option value="Lock/Unlock">Lock/Unlock</option>
              <option value="Other">Other</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Note Text
            </label>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sc-blue focus:border-transparent"
              placeholder="Enter your note..."
            />
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <Button variant="outline" onClick={() => setShowNoteModal(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreateNote} disabled={!noteText}>
            Add Note
          </Button>
        </div>
      </Modal>

      {/* Edit Source Records Modal */}
      <Modal
        isOpen={showAcreageScheduleModal}
        onClose={() => {
          setShowAcreageScheduleModal(false);
          setAcreageScheduleRecords([]);
          setUnitTrackerRecords([]);
          setEditingRecordId(null);
          setEditingTrackerRecordId(null);
          setActiveSourceTab('acreage');
        }}
        title="Edit Source Records"
        size="3xl"
      >
        <div className="space-y-4">
          {/* Tabs for switching between acreage schedule and unit tracker */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveSourceTab('acreage')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeSourceTab === 'acreage'
                    ? 'border-sc-blue text-sc-blue'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                prod_acreage_schedule ({acreageScheduleRecords.length})
              </button>
              <button
                onClick={() => setActiveSourceTab('tracker')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeSourceTab === 'tracker'
                    ? 'border-sc-blue text-sc-blue'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                prod_unit_tracker ({unitTrackerRecords.length})
              </button>
            </nav>
          </div>

          {isLoadingAcreageSchedule ? (
            <div className="text-center py-8">
              <div className="text-gray-500">Loading records...</div>
            </div>
          ) : activeSourceTab === 'acreage' ? (
            acreageScheduleRecords.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-500">No acreage schedule records found for this unit</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-300">
                  <thead className="bg-gray-100 sticky top-0 z-10">
                    <tr>
                      <th className="px-3 py-2 border border-gray-300 text-left text-xs font-medium text-gray-700 uppercase">S-T-R</th>
                      <th className="px-3 py-2 border border-gray-300 text-left text-xs font-medium text-gray-700 uppercase">Owner</th>
                      <th className="px-3 py-2 border border-gray-300 text-left text-xs font-medium text-gray-700 uppercase">NMA</th>
                      <th className="px-3 py-2 border border-gray-300 text-left text-xs font-medium text-gray-700 uppercase">Royalty</th>
                      <th className="px-3 py-2 border border-gray-300 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                      <th className="px-3 py-2 border border-gray-300 text-left text-xs font-medium text-gray-700 uppercase">Buyer</th>
                      <th className="px-3 py-2 border border-gray-300 text-left text-xs font-medium text-gray-700 uppercase">Legal Description</th>
                      <th className="px-3 py-2 border border-gray-300 text-left text-xs font-medium text-gray-700 uppercase">Note</th>
                      <th className="px-3 py-2 border border-gray-300 text-left text-xs font-medium text-gray-700 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
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
            )
          ) : (
            unitTrackerRecords.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-500">No unit tracker records found for this unit</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-300">
                  <thead className="bg-gray-100 sticky top-0 z-10">
                    <tr>
                      <th className="px-3 py-2 border border-gray-300 text-left text-xs font-medium text-gray-700 uppercase">Unit</th>
                      <th className="px-3 py-2 border border-gray-300 text-left text-xs font-medium text-gray-700 uppercase">Well Name</th>
                      <th className="px-3 py-2 border border-gray-300 text-left text-xs font-medium text-gray-700 uppercase">Operator</th>
                      <th className="px-3 py-2 border border-gray-300 text-left text-xs font-medium text-gray-700 uppercase">API Number</th>
                      <th className="px-3 py-2 border border-gray-300 text-left text-xs font-medium text-gray-700 uppercase">S</th>
                      <th className="px-3 py-2 border border-gray-300 text-left text-xs font-medium text-gray-700 uppercase">T</th>
                      <th className="px-3 py-2 border border-gray-300 text-left text-xs font-medium text-gray-700 uppercase">R</th>
                      <th className="px-3 py-2 border border-gray-300 text-left text-xs font-medium text-gray-700 uppercase">County</th>
                      <th className="px-3 py-2 border border-gray-300 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                      <th className="px-3 py-2 border border-gray-300 text-left text-xs font-medium text-gray-700 uppercase">Target Formation</th>
                      <th className="px-3 py-2 border border-gray-300 text-left text-xs font-medium text-gray-700 uppercase">Allocation</th>
                      <th className="px-3 py-2 border border-gray-300 text-left text-xs font-medium text-gray-700 uppercase">Notes</th>
                      <th className="px-3 py-2 border border-gray-300 text-left text-xs font-medium text-gray-700 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unitTrackerRecords.map((record) => (
                      <UnitTrackerRow
                        key={record.id}
                        record={record}
                        isEditing={editingTrackerRecordId === record.id}
                        onEdit={() => handleEditTrackerRecord(record.id)}
                        onCancel={handleCancelEditTrackerRecord}
                        onSave={(data) => handleSaveTrackerRecord(record.id, data)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      </Modal>
    </div>
  );
};

// RecordRow component for editing individual records
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
        <td className="px-3 py-2 border border-gray-300 text-sm">{record.S_T_R || 'N/A'}</td>
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
            step="0.000001"
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
      <td className="px-3 py-2 border border-gray-300 text-sm">{record.S_T_R || 'N/A'}</td>
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

// UnitTrackerRow component for editing prod_unit_tracker records
interface UnitTrackerRowProps {
  record: any;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (data: any) => void;
}

const UnitTrackerRow: React.FC<UnitTrackerRowProps> = ({ record, isEditing, onEdit, onCancel, onSave }) => {
  const [formData, setFormData] = useState({
    Unit: record.Unit || '',
    Well_Name: record.Well_Name || '',
    Operator: record.Operator || '',
    API_NEW_: record.API_NEW_ || '',
    S: record.S || '',
    T: record.T || '',
    R: record.R || '',
    County: record.County || '',
    Status: record.Status || '',
    Target_Formation: record.Target_Formation || '',
    Allo_: record.Allo_ || '',
    Allo_Status: record.Allo_Status || '',
    Notes: record.Notes || '',
    Spud: record.Spud || '',
    Comp: record.Comp || '',
    '1st_Prod': record['1st_Prod'] || '',
    Tops_NRA: record.Tops_NRA || ''
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
            value={formData.Unit}
            onChange={(e) => handleChange('Unit', e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
          />
        </td>
        <td className="px-3 py-2 border border-gray-300">
          <input
            type="text"
            value={formData.Well_Name}
            onChange={(e) => handleChange('Well_Name', e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
          />
        </td>
        <td className="px-3 py-2 border border-gray-300">
          <input
            type="text"
            value={formData.Operator}
            onChange={(e) => handleChange('Operator', e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
          />
        </td>
        <td className="px-3 py-2 border border-gray-300">
          <input
            type="text"
            value={formData.API_NEW_}
            onChange={(e) => handleChange('API_NEW_', e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
          />
        </td>
        <td className="px-3 py-2 border border-gray-300">
          <input
            type="text"
            value={formData.S}
            onChange={(e) => handleChange('S', e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
          />
        </td>
        <td className="px-3 py-2 border border-gray-300">
          <input
            type="text"
            value={formData.T}
            onChange={(e) => handleChange('T', e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
          />
        </td>
        <td className="px-3 py-2 border border-gray-300">
          <input
            type="text"
            value={formData.R}
            onChange={(e) => handleChange('R', e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
          />
        </td>
        <td className="px-3 py-2 border border-gray-300">
          <input
            type="text"
            value={formData.County}
            onChange={(e) => handleChange('County', e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
          />
        </td>
        <td className="px-3 py-2 border border-gray-300">
          <input
            type="text"
            value={formData.Status}
            onChange={(e) => handleChange('Status', e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
          />
        </td>
        <td className="px-3 py-2 border border-gray-300">
          <input
            type="text"
            value={formData.Target_Formation}
            onChange={(e) => handleChange('Target_Formation', e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
          />
        </td>
        <td className="px-3 py-2 border border-gray-300">
          <input
            type="text"
            value={formData.Allo_}
            onChange={(e) => handleChange('Allo_', e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
          />
        </td>
        <td className="px-3 py-2 border border-gray-300">
          <textarea
            value={formData.Notes}
            onChange={(e) => handleChange('Notes', e.target.value)}
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
      <td className="px-3 py-2 border border-gray-300 text-sm">{record.Unit || 'N/A'}</td>
      <td className="px-3 py-2 border border-gray-300 text-sm">{record.Well_Name || 'N/A'}</td>
      <td className="px-3 py-2 border border-gray-300 text-sm">{record.Operator || 'N/A'}</td>
      <td className="px-3 py-2 border border-gray-300 text-sm">{record.API_NEW_ || 'N/A'}</td>
      <td className="px-3 py-2 border border-gray-300 text-sm">{record.S || 'N/A'}</td>
      <td className="px-3 py-2 border border-gray-300 text-sm">{record.T || 'N/A'}</td>
      <td className="px-3 py-2 border border-gray-300 text-sm">{record.R || 'N/A'}</td>
      <td className="px-3 py-2 border border-gray-300 text-sm">{record.County || 'N/A'}</td>
      <td className="px-3 py-2 border border-gray-300 text-sm">{record.Status || 'N/A'}</td>
      <td className="px-3 py-2 border border-gray-300 text-sm">{record.Target_Formation || 'N/A'}</td>
      <td className="px-3 py-2 border border-gray-300 text-sm">{record.Allo_ || 'N/A'}</td>
      <td className="px-3 py-2 border border-gray-300 text-sm max-w-xs truncate" title={record.Notes || ''}>
        {record.Notes || 'N/A'}
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

export default UnitDetailPage;
