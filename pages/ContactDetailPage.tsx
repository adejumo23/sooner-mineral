import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  fetchContact, 
  fetchContactTractOwnership, 
  fetchContactUnits,
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
  DistressSignal
} from '../types';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import CallLogForm from '../components/CallLogForm';
import CallLogDetails from '../components/CallLogDetails';
import DocumentUploadForm from '../components/DocumentUploadForm';
import DocumentDetails from '../components/DocumentDetails';
import ContactMapTab from '../components/ContactMapTab';
import { 
  ArrowLeftIcon, 
  PencilIcon, 
  ExclamationTriangleIcon,
  UserIcon,
  MapIcon,
  PhoneIcon,
  DocumentIcon,
  ClipboardDocumentListIcon
} from '../components/icons/Icons';

const ContactDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [contact, setContact] = useState<ContactEnhanced | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'tracts' | 'units' | 'map' | 'leads' | 'callLog' | 'documents'>('overview');
  const [loading, setLoading] = useState(true);
  const [tracts, setTracts] = useState<ContactTractOwnershipEnhanced[]>([]);
  const [units, setUnits] = useState<ContactUnitSummary[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [callLogs, setCallLogs] = useState<ContactCallLog[]>([]);
  const [documents, setDocuments] = useState<ContactDocument[]>([]);
  const [distressSignals, setDistressSignals] = useState<DistressSignal[]>([]);
  
  // Call Log state
  const [showAddCallLog, setShowAddCallLog] = useState(false);
  const [editingCallLog, setEditingCallLog] = useState<ContactCallLog | null>(null);
  const [viewingCallLog, setViewingCallLog] = useState<ContactCallLog | null>(null);

  // Documents state
  const [showUploadDocument, setShowUploadDocument] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<ContactDocument | null>(null);
  const [documentFilters, setDocumentFilters] = useState({
    category: '',
    redFlagStatus: '',
    uploadedBy: '',
    dateRange: '',
  });
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [showDocumentFilters, setShowDocumentFilters] = useState(false);

  useEffect(() => {
    if (id) {
      loadContactData();
    }
  }, [id]);

  // Handle URL parameters for tab navigation
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam && ['overview', 'tracts', 'units', 'map', 'leads', 'callLog', 'documents'].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }
  }, []);

  // Update URL when tab changes
  useEffect(() => {
    if (activeTab !== 'overview') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', activeTab);
      window.history.replaceState({}, '', url.toString());
    } else {
      const url = new URL(window.location.href);
      url.searchParams.delete('tab');
      window.history.replaceState({}, '', url.toString());
    }
  }, [activeTab]);

  const loadContactData = async () => {
    try {
      setLoading(true);
      const [contactData, tractsData, unitsData, leadsData, callLogsData, documentsData, signalsData] = await Promise.all([
        fetchContact(id!),
        fetchContactTractOwnership(id!),
        fetchContactUnits(id!),
        fetchContactLeads(id!),
        fetchContactCallLogs(id!),
        fetchContactDocuments(id!),
        fetchDistressSignals(id!)
      ]);

      // Enhance contact data
      const enhancedContact: ContactEnhanced = {
        ...contactData,
        role: 'Landowner' as const,
        ownershipType: 'Mineral' as const,
        preferredContactMethod: 'Call' as const,
        source: 'Manual Entry',
        origination: 'User Input',
        totalNMA: tractsData.reduce((sum, t) => sum + (t.nma || 0), 0),
        totalNRA: tractsData.reduce((sum, t) => sum + (t.nra || 0), 0),
        distressSignals: signalsData,
        linkedTractCount: tractsData.length,
        linkedUnitCount: unitsData.length,
        activeLeadCount: leadsData.filter((l: any) => l.status === 'Open' || l.status === 'In Progress').length
      };

      setContact(enhancedContact);
      setTracts(tractsData);
      setUnits(unitsData);
      setLeads(leadsData);
      setCallLogs(callLogsData);
      setDocuments(documentsData);
      setDistressSignals(signalsData);
    } catch (error) {
      console.error('Failed to load contact data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'Low': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'High': return 'bg-orange-100 text-red-800';
      case 'Critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Call Log handlers
  const handleEditCallLog = (callLog: ContactCallLog) => {
    setEditingCallLog(callLog);
    setShowAddCallLog(true);
  };

  const handleViewCallLogDetails = (callLog: ContactCallLog) => {
    setViewingCallLog(callLog);
  };

  const handleCloseCallLogModal = () => {
    setShowAddCallLog(false);
    setEditingCallLog(null);
    setViewingCallLog(null);
  };

  const handleSaveCallLog = async (callLogData: Partial<ContactCallLog>) => {
    try {
      // TODO: Implement API call to save call log
      console.log('Saving call log:', callLogData);
      
      // For now, just close the modal
      handleCloseCallLogModal();
      
      // Reload call logs
      if (id) {
        const callLogsData = await fetchContactCallLogs(id);
        setCallLogs(callLogsData);
      }
    } catch (error) {
      console.error('Failed to save call log:', error);
    }
  };

  // Document handlers
  const handleUploadDocument = (data: Partial<ContactDocument>) => {
    // TODO: Implement API call to upload document
    console.log('Uploading document:', data);
    setShowUploadDocument(false);
  };

  const handleViewDocument = (document: ContactDocument) => {
    setViewingDocument(document);
  };

  const handleCloseDocumentModal = () => {
    setViewingDocument(null);
    setShowUploadDocument(false);
  };

  const handleDocumentFilterChange = (field: string, value: string) => {
    setDocumentFilters(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDocumentSelection = (documentId: string, checked: boolean) => {
    if (checked) {
      setSelectedDocuments(prev => [...prev, documentId]);
    } else {
      setSelectedDocuments(prev => prev.filter(id => id !== documentId));
    }
  };

  const handleBulkAction = (action: string) => {
    // TODO: Implement bulk actions
    console.log(`Bulk action ${action} on documents:`, selectedDocuments);
    setSelectedDocuments([]);
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: UserIcon },
    { id: 'tracts', name: 'Linked Tracts', icon: MapIcon },
    { id: 'units', name: 'Linked Units', icon: ClipboardDocumentListIcon },
    { id: 'map', name: 'Map', icon: MapIcon },
    { id: 'leads', name: 'Leads', icon: ClipboardDocumentListIcon },
    { id: 'callLog', name: 'Call Log', icon: PhoneIcon },
    { id: 'documents', name: 'Documents', icon: DocumentIcon },
  ];

  if (loading) {
    return <div className="text-center text-gray-600">Loading contact...</div>;
  }

  if (!contact) {
    return <div className="text-center text-gray-600">Contact not found</div>;
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Link to="/contacts" className="text-gray-400 hover:text-gray-600">
            <ArrowLeftIcon className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{contact.name}</h1>
            <p className="text-gray-600 mt-1">
              {contact.role} • {contact.ownershipType} • {contact.city}, {contact.state}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button variant="outline" className="flex items-center space-x-2">
            <PhoneIcon className="h-4 w-4" />
            <span>Call</span>
          </Button>
          <Link to={`/contacts/${id}/edit`}>
            <Button variant="outline" className="flex items-center space-x-2">
              <PencilIcon className="h-4 w-4" />
              <span>Edit</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Distress Signals Alert */}
      {distressSignals.length > 0 && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <div className="p-4">
            <div className="flex items-center space-x-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
              <h3 className="text-sm font-medium text-red-800">
                {distressSignals.length} Distress Signal{distressSignals.length !== 1 ? 's' : ''} Detected
              </h3>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {distressSignals.map((signal) => (
                <span
                  key={signal.id}
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRiskLevelColor(signal.riskLevel)}`}
                >
                  {signal.signalType} ({signal.riskLevel})
                </span>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
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
            {/* Contact Information */}
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                    <dd className="text-sm text-gray-900">{contact.name}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Role</dt>
                    <dd className="text-sm text-gray-900">{contact.role}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Ownership Type</dt>
                    <dd className="text-sm text-gray-900">{contact.ownershipType}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                    <dd className="text-sm text-gray-900">{contact.email || 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Phone</dt>
                    <dd className="text-sm text-gray-900">{contact.phone || 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Address</dt>
                    <dd className="text-sm text-gray-900">
                      {contact.address ? `${contact.address}, ${contact.city}, ${contact.state} ${contact.zipCode}` : 'N/A'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Preferred Contact Method</dt>
                    <dd className="text-sm text-gray-900">{contact.preferredContactMethod}</dd>
                  </div>
                </dl>
              </div>
            </Card>

            {/* Summary Statistics */}
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-sc-blue">{contact.totalNMA.toLocaleString()}</div>
                    <div className="text-sm text-gray-500">Total NMA</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-sc-blue">{contact.totalNRA.toLocaleString()}</div>
                    <div className="text-sm text-gray-500">Total NRA</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-sc-blue">{contact.linkedTractCount}</div>
                    <div className="text-sm text-gray-500">Linked Tracts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-sc-blue">{contact.activeLeadCount}</div>
                    <div className="text-sm text-gray-500">Active Leads</div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Distress Signals */}
            {distressSignals.length > 0 && (
              <Card className="lg:col-span-2">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Distress & Intent Signals</h3>
                  <div className="space-y-3">
                    {distressSignals.map((signal) => (
                      <div key={signal.id} className="border-l-4 border-red-200 pl-4 py-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskLevelColor(signal.riskLevel)}`}>
                                {signal.signalType}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskLevelColor(signal.riskLevel)}`}>
                                {signal.riskLevel} Risk
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              Source: {signal.signalSource} • Confidence: {signal.matchConfidence}%
                            </p>
                            <p className="text-sm text-gray-600">
                              Date: {new Date(signal.dateFlagged).toLocaleDateString()} • Status: {signal.signalStatus}
                            </p>
                            {signal.internalNotes && (
                              <p className="text-sm text-gray-700 mt-1">{signal.internalNotes}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'tracts' && (
          <Card>
            <div className="p-6">
              {/* Header with View Map button */}
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Linked Tracts</h3>
                <Button 
                  variant="outline" 
                  onClick={() => setActiveTab('map')}
                  className="flex items-center space-x-2"
                >
                  <MapIcon className="w-4 h-4" />
                  <span>View Map</span>
                </Button>
              </div>
              {tracts.length === 0 ? (
                <p className="text-gray-500">No tracts linked to this contact</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tract</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STR</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ownership %</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Royalty %</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NMA</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NRA</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {tracts.map((tract) => (
                        <tr key={tract.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{tract.tract.tractName}</div>
                            <div className="text-sm text-gray-500">{tract.tract.county}, {tract.tract.state}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                            {tract.tract.str || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {(tract.ownershipPercentage * 100).toFixed(1)}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {(tract.royaltyPercentage * 100).toFixed(1)}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {tract.nma?.toLocaleString() || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {tract.nra?.toLocaleString() || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <Link to={`/tracts/${tract.tractId}`}>
                                <Button variant="outline" size="sm">View Tract</Button>
                              </Link>
                              {tract.hasActiveLead && (
                                <Button variant="outline" size="sm">View Lead</Button>
                              )}
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
        )}

        {activeTab === 'units' && (
          <Card>
            <div className="p-6">
              {/* Header with View Map button */}
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Linked Units</h3>
                <Button 
                  variant="outline" 
                  onClick={() => setActiveTab('map')}
                  className="flex items-center space-x-2"
                >
                  <MapIcon className="w-4 h-4" />
                  <span>View Map</span>
                </Button>
              </div>

              {/* Unit Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{units.length}</div>
                  <div className="text-sm text-blue-800">Total Units</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {units.filter(unit => unit.status === 'Producing').length}
                  </div>
                  <div className="text-sm text-green-800">Producing</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {units.filter(unit => unit.status === 'Permitted').length}
                  </div>
                  <div className="text-sm text-yellow-800">Permitted</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {units.reduce((sum, unit) => sum + (unit.totalNMA || 0), 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-purple-800">Total NMA</div>
                </div>
              </div>

              {units.length === 0 ? (
                <div className="text-center py-8">
                  <MapIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No units linked to this contact</p>
                  <p className="text-sm text-gray-400 mt-2">Units will appear here when tracts are linked to drilling units</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Unit Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Operator
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Formation
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Assigned Buyer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total NMA
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total NRA
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          View Tracts
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {units.map((unit) => (
                        <React.Fragment key={unit.id}>
                          <tr className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{unit.unitName}</div>
                              <div className="text-xs text-gray-500">{unit.county}, {unit.state}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{unit.operator || 'Unassigned'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                unit.status === 'Producing' ? 'bg-green-100 text-green-800' :
                                unit.status === 'Permitted' ? 'bg-yellow-100 text-yellow-800' :
                                unit.status === 'Drilling' ? 'bg-blue-100 text-blue-800' :
                                unit.status === 'Completed' ? 'bg-gray-100 text-gray-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {unit.status || 'Unknown'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{unit.formation || 'N/A'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{unit.assignedBuyer || 'Unassigned'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {unit.totalNMA?.toLocaleString() || '0'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {unit.totalNRA?.toLocaleString() || '0'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const unitElement = document.getElementById(`unit-${unit.id}`);
                                  if (unitElement) {
                                    const isExpanded = unitElement.classList.contains('hidden');
                                    if (isExpanded) {
                                      unitElement.classList.remove('hidden');
                                    } else {
                                      unitElement.classList.add('hidden');
                                    }
                                  }
                                }}
                                className="flex items-center space-x-1"
                              >
                                <span>View Tracts</span>
                                <svg className="w-4 h-4 transform transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </Button>
                            </td>
                          </tr>
                          
                          {/* Expandable Tracts Sub-View */}
                          <tr id={`unit-${unit.id}`} className="hidden">
                            <td colSpan={8} className="px-0 py-0">
                              <div className="bg-gray-50 border-t border-gray-200">
                                <div className="px-6 py-4">
                                  <h5 className="text-sm font-medium text-gray-700 mb-3">Linked Tracts in {unit.unitName}</h5>
                                  <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                      <thead className="bg-gray-100">
                                        <tr>
                                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Tract Name
                                          </th>
                                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            STR / ANUM
                                          </th>
                                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            NMA (Contact)
                                          </th>
                                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Royalty %
                                          </th>
                                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            NRA (1/8th norm.)
                                          </th>
                                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                          </th>
                                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Lead
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody className="bg-white divide-y divide-gray-200">
                                        {unit.tracts.map((tract) => {
                                          // Calculate NRA (1/8th normalized)
                                          const nra = tract.nma && tract.royaltyPercentage ? 
                                            (tract.nma * tract.royaltyPercentage / 0.125) : 0;
                                          
                                          return (
                                            <tr key={tract.id} className="hover:bg-gray-50">
                                              <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                  {tract.tract.tractName}
                                                </div>
                                              </td>
                                              <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="text-sm text-gray-900 font-mono">
                                                  {tract.tract.str || 'N/A'}
                                                </div>
                                              </td>
                                              <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                  {tract.nma?.toLocaleString() || '0'}
                                                </div>
                                              </td>
                                              <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                  {tract.royaltyPercentage ? (tract.royaltyPercentage * 100).toFixed(4) : '0'}%
                                                </div>
                                              </td>
                                              <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                  {nra.toFixed(1)}
                                                </div>
                                              </td>
                                              <td className="px-4 py-3 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                                  tract.status === 'Under Review' ? 'bg-yellow-100 text-yellow-800' :
                                                  tract.status === 'Unassigned' ? 'bg-gray-100 text-gray-800' :
                                                  tract.status === 'Assigned' ? 'bg-green-100 text-green-800' :
                                                  'bg-gray-100 text-gray-800'
                                                }`}>
                                                  {tract.status || 'Unassigned'}
                                                </span>
                                              </td>
                                              <td className="px-4 py-3 whitespace-nowrap">
                                                {tract.assignedBuyer ? (
                                                  <Link 
                                                    to={`/leads?buyer=${tract.assignedBuyer}&tract=${tract.tractId}`}
                                                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                                                  >
                                                    {tract.assignedBuyer}
                                                  </Link>
                                                ) : (
                                                  <span className="text-sm text-gray-400">—</span>
                                                )}
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Card>
        )}

        {activeTab === 'map' && (
          <div className="h-96">
            <ContactMapTab
              contactId={id!}
              contact={contact}
              tracts={tracts}
              units={units}
              distressSignals={distressSignals}
            />
          </div>
        )}

        {activeTab === 'leads' && (
          <Card>
            <div className="p-6">
              {/* Header with Create New Lead button */}
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Leads</h3>
                {!leads.some(lead => lead.status === 'Open' || lead.status === 'In Progress') && (
                  <Button onClick={() => navigate(`/leads/new?contactId=${id}`)}>
                    <ClipboardDocumentListIcon className="w-4 h-4 mr-2" />
                    Create New Lead
                  </Button>
                )}
              </div>

              {/* Lead Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{leads.length}</div>
                  <div className="text-sm text-blue-800">Total Leads</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {leads.filter(lead => lead.status === 'Open').length}
                  </div>
                  <div className="text-sm text-green-800">Open</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {leads.filter(lead => lead.status === 'In Progress').length}
                  </div>
                  <div className="text-sm text-yellow-800">In Progress</div>
                </div>
                <div className="bg-emerald-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-emerald-600">
                    {leads.filter(lead => lead.status === 'Closed Won').length}
                  </div>
                  <div className="text-sm text-emerald-800">Won</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {leads.filter(lead => lead.status === 'Closed Lost').length}
                  </div>
                  <div className="text-sm text-red-800">Lost</div>
                </div>
              </div>

              {leads.length === 0 ? (
                <div className="text-center py-8">
                  <ClipboardDocumentListIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No leads found for this contact</p>
                  <p className="text-sm text-gray-400 mt-2">Start by creating your first lead</p>
                  <Button 
                    onClick={() => navigate(`/leads/new?contactId=${id}`)}
                    className="mt-4"
                  >
                    Create New Lead
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tract Name / ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          STR
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Lead Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Assigned Buyer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Contacted
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Lead Source
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Signal Flag
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Outcome Summary
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {leads.map((lead) => {
                        // Find associated tract information
                        const associatedTract = tracts.find(t => t.tractId === lead.tractId);
                        // Check for distress signals
                        const hasDistressSignals = distressSignals.length > 0;
                        
                        return (
                          <tr key={lead.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {associatedTract ? associatedTract.tract.tractName : 'N/A'}
                              </div>
                              <div className="text-xs text-gray-500">
                                {associatedTract ? `ID: ${associatedTract.tractId}` : 'No tract linked'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                              {associatedTract ? associatedTract.tract.str || 'N/A' : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                lead.status === 'Closed Won' ? 'bg-green-100 text-green-800' :
                                lead.status === 'Closed Lost' ? 'bg-red-100 text-red-800' :
                                lead.status === 'Open' ? 'bg-blue-100 text-blue-800' :
                                lead.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                                lead.status === 'On Hold' ? 'bg-gray-100 text-gray-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {lead.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {lead.assignedBuyer || 'Unassigned'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {lead.lastContacted ? new Date(lead.lastContacted).toLocaleDateString() : 'Never'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                                {lead.leadSource || 'Unknown'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {hasDistressSignals ? (
                                <div className="flex items-center">
                                  <span 
                                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 cursor-help"
                                    title={`${distressSignals.length} distress signal(s) detected`}
                                  >
                                    <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
                                    {distressSignals.length}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400">None</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900 max-w-xs truncate" title={lead.outcomeSummary || lead.notes}>
                                {lead.outcomeSummary || lead.notes || 'No summary available'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <Link to={`/leads/${lead.id}`}>
                                  <Button variant="outline" size="sm">View Lead</Button>
                                </Link>
                                {(lead.status === 'Open' || lead.status === 'In Progress') && (
                                  <Button variant="outline" size="sm">Edit</Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Card>
        )}

        {activeTab === 'callLog' && (
          <Card>
            <div className="p-6">
              {/* Header with Add New Call Log button */}
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Call Log</h3>
                <Button onClick={() => setShowAddCallLog(true)}>
                  <PhoneIcon className="w-4 h-4 mr-2" />
                  Add New Call Log
                </Button>
              </div>

              {/* Call Log Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{callLogs.length}</div>
                  <div className="text-sm text-blue-800">Total Calls</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {callLogs.filter(log => log.followUpFlag).length}
                  </div>
                  <div className="text-sm text-green-800">Follow-ups Required</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {callLogs.filter(log => log.callStatus === 'Left Message').length}
                  </div>
                  <div className="text-sm text-yellow-800">Messages Left</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {callLogs.filter(log => log.outcome === 'Interested').length}
                  </div>
                  <div className="text-sm text-purple-800">Interested Contacts</div>
                </div>
              </div>

              {/* Call Log Table */}
              {callLogs.length === 0 ? (
                <div className="text-center py-8">
                  <PhoneIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No call logs found for this contact</p>
                  <p className="text-sm text-gray-400 mt-2">Start by adding your first call log entry</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date & Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Caller
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Call Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Notes
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Follow-up
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {callLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {new Date(log.callDate).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-500">{log.callTime}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{log.caller}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              log.callType === 'Outbound' ? 'bg-blue-100 text-blue-800' :
                              log.callType === 'Inbound' ? 'bg-green-100 text-green-800' :
                              log.callType === 'Follow-up' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {log.callType}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              log.callStatus === 'Completed' ? 'bg-green-100 text-green-800' :
                              log.callStatus === 'No Answer' ? 'bg-red-100 text-red-800' :
                              log.callStatus === 'Left Message' ? 'bg-yellow-100 text-yellow-800' :
                              log.callStatus === 'Busy' ? 'bg-orange-100 text-orange-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {log.callStatus}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 max-w-xs truncate" title={log.notes}>
                              {log.notes}
                            </div>
                            {log.duration > 0 && (
                              <div className="text-xs text-gray-500 mt-1">
                                Duration: {Math.floor(log.duration / 60)}:{(log.duration % 60).toString().padStart(2, '0')}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {log.followUpFlag ? (
                              <div className="flex items-center">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
                                  Follow-up Required
                                </span>
                                {log.followUpDate && (
                                  <div className="text-xs text-gray-500 ml-2">
                                    {new Date(log.followUpDate).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">No follow-up</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditCallLog(log)}
                              >
                                <PencilIcon className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewCallLogDetails(log)}
                              >
                                View
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
        )}

        {activeTab === 'documents' && (
          <Card>
            <div className="p-6">
              {/* Header with Upload Button */}
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Documents</h3>
                <Button onClick={() => setShowUploadDocument(true)}>
                  <DocumentIcon className="w-4 h-4 mr-2" />
                  Upload Document
                                </Button>
              </div>

              {/* Document Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{documents.length}</div>
                  <div className="text-sm text-blue-800">Total Documents</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {documents.filter(doc => doc.redFlagStatus).length}
                  </div>
                  <div className="text-sm text-red-800">Red Flagged</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {documents.filter(doc => doc.category === 'Deed').length}
                  </div>
                  <div className="text-sm text-green-800">Deeds</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {documents.filter(doc => doc.category === 'Lease').length}
                  </div>
                  <div className="text-sm text-purple-800">Leases</div>
                </div>
              </div>

              {/* Search and Filter Bar */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <Input
                    type="text"
                    placeholder="Search documents..."
                    className="w-full"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowDocumentFilters(!showDocumentFilters)}
                  >
                    Filters
                  </Button>
                  <Button variant="outline">
                    Export
                  </Button>
                </div>
              </div>

              {/* Filter Panel */}
              {showDocumentFilters && (
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <select
                        value={documentFilters.category}
                        onChange={(e) => handleDocumentFilterChange('category', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="">All Categories</option>
                        <option value="Lease">Lease</option>
                        <option value="Conveyance">Conveyance</option>
                        <option value="Title Opinion">Title Opinion</option>
                        <option value="Deed">Deed</option>
                        <option value="Contract">Contract</option>
                        <option value="Correspondence">Correspondence</option>
                        <option value="Legal">Legal</option>
                        <option value="Financial">Financial</option>
                        <option value="Research">Research</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Red Flag Status</label>
                      <select
                        value={documentFilters.redFlagStatus}
                        onChange={(e) => handleDocumentFilterChange('redFlagStatus', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="">All Documents</option>
                        <option value="flagged">Flagged Only</option>
                        <option value="not-flagged">Not Flagged</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Uploaded By</label>
                      <select
                        value={documentFilters.uploadedBy}
                        onChange={(e) => handleDocumentFilterChange('uploadedBy', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="">All Users</option>
                        <option value="John Smith">John Smith</option>
                        <option value="Jane Doe">Jane Doe</option>
                        <option value="Mike Johnson">Mike Johnson</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                      <select
                        value={documentFilters.dateRange}
                        onChange={(e) => handleDocumentFilterChange('dateRange', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="">All Time</option>
                        <option value="today">Today</option>
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                        <option value="quarter">This Quarter</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Bulk Actions Toolbar */}
              {selectedDocuments.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-800">
                      {selectedDocuments.length} document(s) selected
                    </span>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleBulkAction('delete')}
                      >
                        Delete
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleBulkAction('reclassify')}
                      >
                        Reclassify
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleBulkAction('flag')}
                      >
                        Flag/Unflag
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {documents.length === 0 ? (
                <p className="text-gray-500">No documents found for this contact</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <input
                            type="checkbox"
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedDocuments(documents.map(doc => doc.id));
                              } else {
                                setSelectedDocuments([]);
                              }
                            }}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Document Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          File Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Red Flag Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Version History
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date Uploaded
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Uploaded By
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Notes
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Linked Tracts
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {documents.map((doc) => (
                        <tr key={doc.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedDocuments.includes(doc.id)}
                              onChange={(e) => handleDocumentSelection(doc.id, e.target.checked)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{doc.documentName}</div>
                            <div className="text-xs text-gray-500">{doc.originalFileName}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                              {doc.fileType}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              doc.category === 'Lease' ? 'bg-blue-100 text-blue-800' :
                              doc.category === 'Deed' ? 'bg-green-100 text-green-800' :
                              doc.category === 'Title Opinion' ? 'bg-purple-100 text-purple-800' :
                              doc.category === 'Contract' ? 'bg-orange-100 text-orange-800' :
                              doc.category === 'Legal' ? 'bg-red-100 text-red-800' :
                              doc.category === 'Financial' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {doc.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {doc.redFlagStatus ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
                                Flagged
                              </span>
                            ) : (
                              <span className="text-xs text-gray-500">No flags</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-wrap gap-1">
                              {doc.versionHistory.map((version, index) => (
                                <span key={index} className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                                  {version}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {new Date(doc.dateUploaded).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{doc.uploadedBy}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 max-w-xs truncate" title={doc.notes}>
                              {doc.notes || 'No notes'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-wrap gap-1">
                              {doc.linkedTracts && doc.linkedTracts.length > 0 ? (
                                doc.linkedTracts.map((tractId, index) => (
                                  <span key={index} className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                                    {tractId}
                                  </span>
                                ))
                              ) : (
                                <span className="text-xs text-gray-500">No tracts</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewDocument(doc)}
                              >
                                View
                              </Button>
                              <Button variant="outline" size="sm">
                                Download
                              </Button>
                              <Button variant="outline" size="sm">
                                Edit
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
        )}
      </div>

      {/* Add/Edit Call Log Modal */}
      {showAddCallLog && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingCallLog ? 'Edit Call Log' : 'Add New Call Log'}
                </h3>
                <button
                  onClick={handleCloseCallLogModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <CallLogForm
                callLog={editingCallLog}
                onSave={handleSaveCallLog}
                onCancel={handleCloseCallLogModal}
                contact={contact}
              />
            </div>
          </div>
        </div>
      )}

      {/* View Call Log Details Modal */}
      {viewingCallLog && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Call Log Details</h3>
                <button
                  onClick={handleCloseCallLogModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <CallLogDetails callLog={viewingCallLog} />
            </div>
          </div>
        </div>
      )}

      {/* Upload Document Modal */}
      {showUploadDocument && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Upload Document</h3>
                <button
                  onClick={handleCloseDocumentModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <DocumentUploadForm
                onSave={handleUploadDocument}
                onCancel={handleCloseDocumentModal}
                contact={contact}
              />
            </div>
          </div>
        </div>
      )}

      {/* View Document Details Modal */}
      {viewingDocument && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Document Details</h3>
                <button
                  onClick={handleCloseDocumentModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <DocumentDetails document={viewingDocument} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactDetailPage;
