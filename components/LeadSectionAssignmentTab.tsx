import * as React from 'react';
import type { LeadEnhanced, User, Section } from '../types';
import Button from './ui/Button';
import { UserIcon, MapIcon, EyeIcon, PencilIcon, CheckIcon, XCircleIcon, ExclamationTriangleIcon, ChevronDownIcon, ChevronUpIcon, MagnifyingGlassIcon } from './icons/Icons';
import * as api from '../services/api';

// Status metadata for section assignments
const statusMeta: Record<string, { color: string; icon: React.ReactNode; tooltip: string }> = {
  'Active': {
    color: 'bg-green-100 text-green-700',
    icon: <CheckIcon className="h-4 w-4 inline-block mr-1 text-green-500" />,
    tooltip: 'Section is active and assigned.',
  },
  'Under Review': {
    color: 'bg-yellow-100 text-yellow-700',
    icon: <ExclamationTriangleIcon className="h-4 w-4 inline-block mr-1 text-yellow-500" />,
    tooltip: 'Section is currently under review.',
  },
  'Pending': {
    color: 'bg-blue-100 text-blue-700',
    icon: <ExclamationTriangleIcon className="h-4 w-4 inline-block mr-1 text-blue-500" />,
    tooltip: 'Section assignment is pending.',
  },
  'Inactive': {
    color: 'bg-gray-100 text-gray-700',
    icon: <XCircleIcon className="h-4 w-4 inline-block mr-1 text-gray-500" />,
    tooltip: 'Section is inactive.',
  },
};

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

const LeadSectionAssignmentTab: React.FC<{
  lead: LeadEnhanced;
  currentUser: User;
  users: User[];
}> = ({ lead, currentUser, users }) => {
  const [sections, setSections] = React.useState<Section[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [expandedHistory, setExpandedHistory] = React.useState<{ [id: string]: boolean }>({});
  const [expandedStatus, setExpandedStatus] = React.useState<{ [id: string]: boolean }>({});
  const [reassignSectionId, setReassignSectionId] = React.useState<string | null>(null);
  const [newBuyerId, setNewBuyerId] = React.useState<string>('');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('');

  // Load sections data
  React.useEffect(() => {
    const loadSections = async () => {
      try {
        setLoading(true);
        // Get sections specifically for this lead
        const sectionsData = await api.fetchLeadSections(lead.id);
        setSections(Array.isArray(sectionsData) ? sectionsData : []);
      } catch (error) {
        console.error('Error loading sections:', error);
        setSections([]);
      } finally {
        setLoading(false);
      }
    };

    loadSections();
  }, [lead.id]);

  // Filter sections based on search and status
  const filteredSections = sections.filter(section => {
    const matchesSearch = !searchTerm || 
      section.sectionName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      section.county?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      section.state?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      section.str?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || section.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });


  // Handle section reassignment
  const handleReassign = async (sectionId: string) => {
    if (!newBuyerId) return;
    
    try {
      // Mock reassignment - in real implementation, this would call an API
      setSections(prev => prev.map(section => 
        section.id === sectionId 
          ? { ...section, assignedBuyerId: newBuyerId, status: 'Under Review' }
          : section
      ));
      
      setReassignSectionId(null);
      setNewBuyerId('');
    } catch (error) {
      console.error('Error reassigning section:', error);
    }
  };

  // Toggle expanded state
  const toggleExpanded = (id: string, type: 'history' | 'status') => {
    if (type === 'history') {
      setExpandedHistory(prev => ({ ...prev, [id]: !prev[id] }));
    } else {
      setExpandedStatus(prev => ({ ...prev, [id]: !prev[id] }));
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading sections...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Section Assignments</h2>
          <p className="text-sm text-gray-600">Manage section assignments for this lead</p>
        </div>
        <div className="text-sm text-gray-500">
          {filteredSections.length} section{filteredSections.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-64">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search sections..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <select
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Under Review">Under Review</option>
          <option value="Pending">Pending</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      {/* Sections List */}
      <div className="space-y-4">
        {filteredSections.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {sections.length === 0 ? 'No sections assigned to this lead.' : 'No sections match your search criteria.'}
          </div>
        ) : (
          filteredSections.map((section) => {
            // Use assignedBuyerName if available, otherwise try to find user by ID
            const assignedBuyer = section.assignedBuyerName && section.assignedBuyerName !== 'Unassigned' 
              ? { name: section.assignedBuyerName }
              : Array.isArray(users) ? users.find(u => u.id === section.assignedBuyerId) : null;
            const statusInfo = statusMeta[section.status || 'Pending'];
            
            return (
              <div key={section.id} className="bg-white rounded-lg border border-gray-200 shadow-sm">
                {/* Section Header */}
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <MapIcon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{section.sectionName || 'Unnamed Section'}</h3>
                        <p className="text-sm text-gray-600">
                          {section.county && section.state ? `${section.county}, ${section.state}` : 'Location not specified'}
                        </p>
                        {section.str && (
                          <p className="text-xs text-gray-500 mt-1">
                            STR: {section.str}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                        {statusInfo.icon}
                        {section.status || 'Pending'}
                      </span>
                    </div>
                  </div>

                  {/* Section Details */}
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <span className="text-xs text-gray-500">Gross Acres</span>
                      <p className="text-sm font-medium">{section.grossAcres || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Net Mineral Acres</span>
                      <p className="text-sm font-medium">{section.netMineralAcres || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Royalty</span>
                      <p className="text-sm font-medium">{section.royalty ? `${section.royalty}%` : 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Assigned Buyer</span>
                      <div className="flex items-center space-x-2">
                        {assignedBuyer ? (
                          <>
                            <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                              <span className="text-xs font-medium text-gray-600">
                                {getInitials(assignedBuyer.name)}
                              </span>
                            </div>
                            <span className="text-sm font-medium">{assignedBuyer.name}</span>
                          </>
                        ) : (
                          <span className="text-sm text-gray-500">Unassigned</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => toggleExpanded(section.id, 'history')}
                    >
                      <EyeIcon className="h-4 w-4 mr-1" />
                      Assignment History
                      {expandedHistory[section.id] ? <ChevronUpIcon className="h-4 w-4 ml-1" /> : <ChevronDownIcon className="h-4 w-4 ml-1" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => toggleExpanded(section.id, 'status')}
                    >
                      <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                      Status History
                      {expandedStatus[section.id] ? <ChevronUpIcon className="h-4 w-4 ml-1" /> : <ChevronDownIcon className="h-4 w-4 ml-1" />}
                    </Button>
                    {currentUser.role?.name === 'Admin' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setReassignSectionId(section.id)}
                      >
                        <PencilIcon className="h-4 w-4 mr-1" />
                        Reassign
                      </Button>
                    )}
                  </div>

                  {/* Assignment History */}
                  {expandedHistory[section.id] && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Assignment History</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                              <span className="text-xs font-medium text-gray-600">
                                {getInitials(assignedBuyer?.name || 'Unknown')}
                              </span>
                            </div>
                            <span>{assignedBuyer?.name || 'Unknown Buyer'}</span>
                          </div>
                          <span className="text-gray-500">
                            {new Date(section.updatedAt || section.createdAt || '').toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Status History */}
                  {expandedStatus[section.id] && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Status History</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                            {statusInfo.icon}
                            {section.status || 'Pending'}
                          </span>
                          <span className="text-gray-500">
                            {new Date(section.updatedAt || section.createdAt || '').toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Reassignment Modal */}
      {reassignSectionId && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Reassign Section</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Buyer</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newBuyerId}
                  onChange={(e) => setNewBuyerId(e.target.value)}
                >
                  <option value="">Select a buyer...</option>
                  {Array.isArray(users) ? users.filter(user => user.role?.name === 'Buyer' || user.role?.name === 'Land Manager').map(user => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  )) : []}
                </select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setReassignSectionId(null);
                    setNewBuyerId('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleReassign(reassignSectionId)}
                  disabled={!newBuyerId}
                >
                  Reassign
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadSectionAssignmentTab;
