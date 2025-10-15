import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
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
  assignUnit,
  unassignUnit,
  updateUnitLock,
  createUnitNote,
  deleteUnit
} from '../services/api';
import { Unit, UnitSection, UnitSectionEnhanced, UnitContact, UnitContactAggregated, UnitNote, UnitAssignment, User, TitleStatus } from '../types';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import UnitMappingTab from '../components/UnitMappingTab';
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
  const navigate = useNavigate();
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

  useEffect(() => {
    if (id) {
      loadUnitData();
    }
  }, [id]);

  const loadUnitData = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const [
        unitData, 
        sectionsData, 
        contactsData, 
        contactsAggregatedData,
        notesData, 
        assignmentsData,
        unitNamesData,
        usersData
      ] = await Promise.all([
        fetchUnit(id),
        fetchUnitSections(id),
        fetchUnitContacts(id),
        fetchUnitContactsAggregated(id),
        fetchUnitNotes(id),
        fetchUnitAssignments(id),
        fetchUnitNames(id),
        fetchUsers()
      ]);
      
      setUnit(unitData);
      setUnitSections(sectionsData);
      setUnitSectionsEnhanced(await fetchUnitSectionsEnhanced(id)); // Fetch enhanced sections
      setUnitContacts(contactsData);
      setUnitContactsAggregated(contactsAggregatedData);
      setUnitNotes(notesData);
      setUnitAssignments(assignmentsData);
      setUnitNames(unitNamesData);
      setUsers(usersData.data || usersData); // Fix: Access data property from paginated response
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

  const tabs = [
    { id: 'overview', name: 'Overview', icon: DocumentTextIcon },
    { id: 'sections', name: 'Linked Sections', icon: MapIcon },
    { id: 'contacts', name: 'Contacts', icon: UserIcon },
    { id: 'mapping', name: 'Mapping Preview', icon: MapIcon },
    { id: 'assignment', name: 'Assignment', icon: CogIcon },
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
      
      if (sectionSortBy === 'sectionName') return aSectionName.localeCompare(bSectionName);
      if (sectionSortBy === 'grossAcres') return bGrossAcres - aGrossAcres;
      if (sectionSortBy === 'netMineralAcres') return bNetAcres - aNetAcres;
      if (sectionSortBy === 'titleStatus') return aTitleStatus.localeCompare(bTitleStatus);
      if (sectionSortBy === 'lastActivity') return new Date(b.lastActivity || 0).getTime() - new Date(a.lastActivity || 0).getTime();
      return 0;
    });

  const handleViewTitleChain = (section: UnitSectionEnhanced) => {
    // Navigate to section detail page with title-chain tab active
    navigate(`/sections/${section.sectionId}?tab=title-chain`);
  };

  const handleViewContacts = (section: UnitSectionEnhanced) => {
    // Navigate to section detail page with contacts tab active
    navigate(`/sections/${section.sectionId}?tab=contacts`);
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
            <h1 className="text-3xl font-bold text-gray-900">{unit.unitName}</h1>
            <p className="text-gray-600 mt-1">
              {unit.operator} • {unit.county}, {unit.state}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
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
            {/* Basic Information */}
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Unit Name</dt>
                    <dd className="text-sm text-gray-900">{unit.unitName}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Operator</dt>
                    <dd className="text-sm text-gray-900">{unit.operator}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Status</dt>
                    <dd className="text-sm text-gray-900">{unit.status}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">County</dt>
                    <dd className="text-sm text-gray-900">{unit.county}, {unit.state}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Exit Strategy</dt>
                    <dd className="text-sm text-gray-900">{unit.exitStrategy}</dd>
                  </div>
                </dl>
              </div>
            </Card>

            {/* Acreage & Wells */}
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Acreage & Wells</h3>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Estimated Gross Acres</dt>
                    <dd className="text-sm text-gray-900">{unit.estimatedGrossAcres ? unit.estimatedGrossAcres.toLocaleString() : 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Estimated Net Acres</dt>
                    <dd className="text-sm text-gray-900">
                      {unit.estimatedNetAcres ? unit.estimatedNetAcres.toLocaleString() : 'TBD'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">API Numbers</dt>
                    <dd className="text-sm text-gray-900">
                      {unit.apiNumbers.map(api => (
                        <div key={api} className="font-mono">{api}</div>
                      ))}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Target Formations</dt>
                    <dd className="text-sm text-gray-900">
                      {unit.targetFormations.join(', ')}
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

            {/* Assignment & Notes */}
            <Card className="lg:col-span-2">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Assignment & Notes</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-md font-medium text-gray-700 mb-3">Current Assignment</h4>
                    {unit.assignedBuyer ? (
                      <div className="bg-gray-50 p-3 rounded-md">
                        <p className="text-sm text-gray-900">
                          <span className="font-medium">Assigned to:</span> {unit.assignedBuyer.name}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          <span className="font-medium">Email:</span> {unit.assignedBuyer.email}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No buyer currently assigned</p>
                    )}
                  </div>
                  
                  <div>
                    <h4 className="text-md font-medium text-gray-700 mb-3">Notes</h4>
                    {unit.notes ? (
                      <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">{unit.notes}</p>
                    ) : (
                      <p className="text-sm text-gray-500">No notes available</p>
                    )}
                  </div>
                </div>
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
                      onChange={(e) => setSectionSortBy(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sc-blue focus:border-transparent"
                    >
                      <option value="sectionName">Sort by Section Name</option>
                      <option value="grossAcres">Sort by Gross Acres</option>
                      <option value="netMineralAcres">Sort by Net Acres</option>
                      <option value="titleStatus">Sort by Title Status</option>
                      <option value="lastActivity">Sort by Last Activity</option>
                    </select>
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
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Section ID
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            STR
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Gross Acres
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Net Acres (NMA)
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Royalty %
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            NRA (1/8 Normalized)
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Title Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Assignment
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Last Activity
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Quick Links
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredAndSortedSections.map((section) => {
                          const sectionName = section.section?.sectionName || section.sectionName || 'N/A';
                          const county = section.section?.county || '';
                          const state = section.section?.state || '';
                          const str = section.str || section.section?.str || 'N/A';
                          const grossAcres = section.grossAcres || section.section?.grossAcres || 0;
                          const netAcres = section.netMineralAcres || section.section?.netMineralAcres || 0;
                          const titleStatus = section.titleStatus || section.section?.titleStatus || 'Unknown';
                          
                          return (
                            <tr 
                              key={section.id} 
                              className="hover:bg-gray-50 transition-colors duration-150"
                              title={`${sectionName} - ${county}, ${state}`}
                            >
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {sectionName}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {county}, {state}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900 font-mono">
                                  {str}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900 font-medium">
                                  {grossAcres ? grossAcres.toLocaleString() : 'N/A'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {netAcres ? netAcres.toLocaleString() : 'N/A'}
                                </div>
                              </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {section.royalty ? `${(section.royalty * 100).toFixed(2)}%` : 'N/A'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {section.nra ? section.nra.toLocaleString() : 'N/A'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTitleStatusColor(titleStatus)}`}>
                                {titleStatus}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {section.assignedBuyer ? (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {section.assignedBuyer.name}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                    Unassigned
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
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
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={!section.hasTitleChain}
                                  className="text-xs hover:bg-blue-50 hover:border-blue-300 transition-colors duration-150"
                                  onClick={() => handleViewTitleChain(section)}
                                  title={section.hasTitleChain ? "View title chain details" : "No title chain data available"}
                                >
                                  View Title Chain
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={!section.hasContacts}
                                  className="text-xs hover:bg-green-50 hover:border-green-300 transition-colors duration-150"
                                  onClick={() => handleViewContacts(section)}
                                  title={section.hasContacts ? "View contact information" : "No contact data available"}
                                >
                                  View Contacts
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
                  <h3 className="text-lg font-semibold text-gray-900">Unit Contacts</h3>
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
                  <p className="text-gray-500">No contacts linked to this unit</p>
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
                              {contact.totalNMA ? contact.totalNMA.toLocaleString() : 'N/A'}
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
                    <div className="text-sm text-gray-500">Total Contacts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {unitContactsAggregated.filter(c => c.leadStatus === 'Open').length}
                    </div>
                    <div className="text-sm text-gray-500">Active Leads</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {unitContactsAggregated.reduce((sum, c) => sum + (c.totalNMA || 0), 0).toLocaleString()}
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
            {/* Current Assignment */}
            <Card>
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Current Assignment</h3>
                  {!unit.assignedBuyer ? (
                    <Button onClick={() => setShowAssignmentModal(true)}>
                      Assign Unit
                    </Button>
                  ) : (
                    <Button onClick={() => setShowAssignmentModal(true)}>
                      Reassign Buyer
                    </Button>
                  )}
                </div>
                
                {unit.assignedBuyer ? (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Assignment Details</h4>
                        <dl className="space-y-2">
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Assigned Buyer</dt>
                            <dd className="text-sm text-gray-900">{unit.assignedBuyer.name}</dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Email</dt>
                            <dd className="text-sm text-gray-600">{unit.assignedBuyer.email}</dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Role</dt>
                            <dd className="text-sm text-gray-600">{unit.assignedBuyer.role.name}</dd>
                          </div>
                        </dl>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Assignment Status</h4>
                        <dl className="space-y-2">
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Status</dt>
                            <dd className="text-sm">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                In Progress
                              </span>
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Assignment Date</dt>
                                                      <dd className="text-sm text-gray-600">
                            {unitAssignments.length > 0 && unitAssignments[0].assignedAt ? new Date(unitAssignments[0].assignedAt).toLocaleDateString() : 'N/A'}
                          </dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Assigned By</dt>
                            <dd className="text-sm text-gray-600">
                              {unitAssignments.length > 0 ? unitAssignments[0].assignedByUser?.name : 'N/A'}
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
                              Create leads for contacts tied to linked sections
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

            {/* Assignment History */}
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Assignment History</h3>
                {unitAssignments.length === 0 ? (
                  <p className="text-gray-500">No assignment history available</p>
                ) : (
                  <div className="space-y-3">
                    {unitAssignments.map((assignment) => (
                      <div key={assignment.id} className="border-l-4 border-gray-200 pl-4 py-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm text-gray-900">
                              <span className="font-medium">Assigned to:</span> {assignment.buyer?.name}
                            </p>
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">By:</span> {assignment.assignedByUser?.name}
                            </p>
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Date:</span> {new Date(assignment.assignedAt).toLocaleDateString()}
                            </p>
                            {assignment.notes && (
                              <p className="text-sm text-gray-600 mt-1">{assignment.notes}</p>
                            )}
                          </div>
                          {assignment.removedAt && (
                            <div className="text-right">
                              <p className="text-sm text-red-600">
                                Removed: {new Date(assignment.removedAt).toLocaleDateString()}
                              </p>
                              {assignment.removedByUser && (
                                <p className="text-sm text-gray-600">
                                  by {assignment.removedByUser.name}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            {/* Comment Thread */}
            <Card>
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
            <Card>
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Unit Notes</h3>
                  <Button onClick={() => setShowNoteModal(true)}>
                    Add Note
                  </Button>
                </div>
                
                {unitNotes.length === 0 ? (
                  <p className="text-gray-500">No notes available</p>
                ) : (
                  <div className="space-y-3">
                    {unitNotes.map((note) => (
                      <div key={note.id} className="border-l-4 border-gray-200 pl-4 py-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm text-gray-900">{note.noteText}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {note.createdByUser?.name} • {new Date(note.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            note.noteType === 'Assignment' ? 'bg-blue-100 text-blue-800' :
                            note.noteType === 'Status Change' ? 'bg-yellow-100 text-yellow-800' :
                            note.noteType === 'Lock/Unlock' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {note.noteType}
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
      </div>

      {/* Assignment Modal */}
      <Modal
        isOpen={showAssignmentModal}
        onClose={() => setShowAssignmentModal(false)}
        title={unit.assignedBuyer ? "Reassign Unit to Buyer" : "Assign Unit to Buyer"}
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
              Assignment Status
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
                Create leads for contacts tied to linked sections
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Optional checkbox to suppress auto-lead creation (for review-only assignments)
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assignment Notes (Optional)
            </label>
            <textarea
              value={assignmentNotes}
              onChange={(e) => setAssignmentNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Add any notes about this assignment..."
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
              ? 'Unlocking this unit will allow outreach and assignment activities.'
              : 'Locking this unit will prevent outreach and assignment activities while under due diligence.'
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
            This action cannot be undone. All unit data, assignments, and notes will be permanently removed.
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
              <option value="Assignment">Assignment</option>
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
    </div>
  );
};

export default UnitDetailPage;
