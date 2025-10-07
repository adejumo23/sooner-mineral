import React, { useState, useEffect } from 'react';
import { 
  Communication, 
  CommunicationMethod, 
  CommunicationOutcome, 
  CommunicationCampaign,
  User 
} from '../types';
import { 
  PhoneIcon, 
  EnvelopeIcon, 
  ChatBubbleLeftRightIcon, 
  EnvelopeIcon as MailIcon,
  FunnelIcon,
  CalendarIcon,
  UserGroupIcon,
  ChartBarIcon,
  PlusIcon
} from './icons/Icons';

interface MessageCenterProps {
  currentUser: User;
}

const MessageCenter: React.FC<MessageCenterProps> = ({ currentUser }) => {
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [campaigns, setCampaigns] = useState<CommunicationCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'inbox' | 'campaigns' | 'templates'>('inbox');
  
  // Filters
  const [filters, setFilters] = useState({
    buyer: '',
    campaign: '',
    method: '',
    status: '',
    dateRange: '7d' as '1d' | '7d' | '30d' | '90d' | 'all'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Mock API calls - replace with actual API
      const mockCommunications: Communication[] = [
        {
          id: '1',
          userId: 'user1',
          user: { id: 'user1', name: 'John Smith', email: 'john@example.com', role: { id: '1', name: 'Buyer', description: 'Land Buyer' } },
          contactId: 'contact1',
          contact: { id: 'contact1', name: 'Alice Johnson', email: 'alice@example.com', contactType: 'Landowner', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
          leadId: 'lead1',
          method: 'Call',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          outcome: 'Left Voicemail',
          messageSnippet: 'Called to discuss mineral rights offer',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          userId: 'user2',
          user: { id: 'user2', name: 'Sarah Wilson', email: 'sarah@example.com', role: { id: '2', name: 'Buyer', description: 'Land Buyer' } },
          contactId: 'contact2',
          contact: { id: 'contact2', name: 'Bob Davis', email: 'bob@example.com', contactType: 'Landowner', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
          method: 'Email',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          outcome: 'Replied',
          subject: 'Mineral Rights Acquisition',
          messageSnippet: 'Interested in discussing the offer',
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '3',
          userId: 'user1',
          user: { id: 'user1', name: 'John Smith', email: 'john@example.com', role: { id: '1', name: 'Buyer', description: 'Land Buyer' } },
          contactId: 'contact3',
          contact: { id: 'contact3', name: 'Carol Brown', email: 'carol@example.com', contactType: 'Landowner', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
          method: 'SMS',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          outcome: 'Delivered',
          messageSnippet: 'Sent follow-up text message',
          createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
        }
      ];

      const mockCampaigns: CommunicationCampaign[] = [
        {
          id: 'camp1',
          name: 'Q1 Mineral Rights Outreach',
          description: 'Targeted outreach to landowners in Oklahoma',
          type: 'Email Sequence',
          status: 'Active',
          createdBy: 'user1',
          createdByUser: { id: 'user1', name: 'John Smith', email: 'john@example.com', role: { id: '1', name: 'Buyer', description: 'Land Buyer' } },
          targetAudience: 'Geographic',
          totalRecipients: 150,
          successfulDeliveries: 142,
          responses: 23,
          optOuts: 3,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-15'
        },
        {
          id: 'camp2',
          name: 'Tax Lien Follow-up',
          description: 'Follow-up campaign for tax lien contacts',
          type: 'Call Campaign',
          status: 'Active',
          createdBy: 'user2',
          createdByUser: { id: 'user2', name: 'Sarah Wilson', email: 'sarah@example.com', role: { id: '2', name: 'Buyer', description: 'Land Buyer' } },
          targetAudience: 'Specific Leads',
          totalRecipients: 45,
          successfulDeliveries: 42,
          responses: 8,
          optOuts: 1,
          createdAt: '2024-01-10',
          updatedAt: '2024-01-20'
        }
      ];

      setCommunications(mockCommunications);
      setCampaigns(mockCampaigns);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getMethodIcon = (method: CommunicationMethod) => {
    switch (method) {
      case 'Call':
        return <PhoneIcon className="w-4 h-4" />;
      case 'Email':
        return <EnvelopeIcon className="w-4 h-4" />;
      case 'SMS':
        return <ChatBubbleLeftRightIcon className="w-4 h-4" />;
      case 'Mail':
        return <MailIcon className="w-4 h-4" />;
      default:
        return <EnvelopeIcon className="w-4 h-4" />;
    }
  };

  const getOutcomeIcon = (outcome: CommunicationOutcome) => {
    switch (outcome) {
      case 'Sent':
      case 'Delivered':
        return <div className="w-2 h-2 bg-green-500 rounded-full"></div>;
      case 'Replied':
        return <div className="w-2 h-2 bg-blue-500 rounded-full"></div>;
      case 'Bounced':
      case 'Failed':
        return <div className="w-2 h-2 bg-red-500 rounded-full"></div>;
      case 'No Answer':
      case 'Left Voicemail':
        return <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>;
      default:
        return <div className="w-2 h-2 bg-gray-500 rounded-full"></div>;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  const filteredCommunications = communications.filter(comm => {
    if (filters.buyer && comm.user?.name !== filters.buyer) return false;
    if (filters.method && comm.method !== filters.method) return false;
    if (filters.status && comm.outcome !== filters.status) return false;
    if (filters.campaign && comm.campaignId !== filters.campaign) return false;
    
    if (filters.dateRange !== 'all') {
      const commDate = new Date(comm.timestamp);
      const now = new Date();
      const diffInDays = Math.floor((now.getTime() - commDate.getTime()) / (1000 * 60 * 60 * 24));
      
      switch (filters.dateRange) {
        case '1d': if (diffInDays > 1) return false; break;
        case '7d': if (diffInDays > 7) return false; break;
        case '30d': if (diffInDays > 30) return false; break;
        case '90d': if (diffInDays > 90) return false; break;
      }
    }
    
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with white background and icon */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Message Center</h2>
              <p className="text-gray-600 mt-1">Manage all communications and campaigns</p>
            </div>
          </div>
          <div className="flex space-x-3">
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              <CalendarIcon className="w-4 h-4 mr-2" />
              Schedule Call
            </button>
            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
              <UserGroupIcon className="w-4 h-4 mr-2" />
              New Campaign
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('inbox')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'inbox'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Inbox
          </button>
          <button
            onClick={() => setActiveTab('campaigns')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'campaigns'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Campaigns
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'templates'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Templates
          </button>
        </nav>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <FunnelIcon className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          
          <select
            value={filters.buyer}
            onChange={(e) => setFilters(prev => ({ ...prev, buyer: e.target.value }))}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Buyers</option>
            <option value="John Smith">John Smith</option>
            <option value="Sarah Wilson">Sarah Wilson</option>
          </select>

          <select
            value={filters.method}
            onChange={(e) => setFilters(prev => ({ ...prev, method: e.target.value }))}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Methods</option>
            <option value="Call">Call</option>
            <option value="Email">Email</option>
            <option value="SMS">SMS</option>
            <option value="Mail">Mail</option>
          </select>

          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Outcomes</option>
            <option value="Sent">Sent</option>
            <option value="Delivered">Delivered</option>
            <option value="Replied">Replied</option>
            <option value="No Answer">No Answer</option>
            <option value="Left Voicemail">Left Voicemail</option>
          </select>

          <select
            value={filters.dateRange}
            onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value as any }))}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="1d">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="all">All time</option>
          </select>
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'inbox' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">
              Recent Communications ({filteredCommunications.length})
            </h3>
          </div>
          
          {filteredCommunications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <EnvelopeIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No communications found matching your filters.</p>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {filteredCommunications.map((communication) => (
                  <li key={communication.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            {getMethodIcon(communication.method)}
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-900">
                              {communication.contact?.name}
                            </span>
                            <span className="text-sm text-gray-500">•</span>
                            <span className="text-sm text-gray-500">
                              {communication.user?.name}
                            </span>
                          </div>
                          {communication.subject && (
                            <p className="text-sm text-gray-600">{communication.subject}</p>
                          )}
                          {communication.messageSnippet && (
                            <p className="text-sm text-gray-600">{communication.messageSnippet}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          {getOutcomeIcon(communication.outcome)}
                          <span className="text-sm text-gray-500 capitalize">
                            {communication.outcome.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                        </div>
                        <span className="text-sm text-gray-400">
                          {formatTimestamp(communication.timestamp)}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {activeTab === 'campaigns' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">
              Active Campaigns ({campaigns.filter(c => c.status === 'Active').length})
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-medium text-gray-900">{campaign.name}</h4>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    campaign.status === 'Active' ? 'bg-green-100 text-green-800' :
                    campaign.status === 'Draft' ? 'bg-gray-100 text-gray-800' :
                    campaign.status === 'Paused' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {campaign.status}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 mb-4">{campaign.description}</p>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Type:</span>
                    <span className="font-medium">{campaign.type}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Recipients:</span>
                    <span className="font-medium">{campaign.totalRecipients}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Responses:</span>
                    <span className="font-medium text-green-600">{campaign.responses}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Success Rate:</span>
                    <span className="font-medium">
                      {Math.round((campaign.successfulDeliveries / campaign.totalRecipients) * 100)}%
                    </span>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">
                      Created by {campaign.createdByUser?.name}
                    </span>
                    <button className="text-sm text-blue-600 hover:text-blue-800">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'templates' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Communication Templates</h3>
            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
              <PlusIcon className="w-4 h-4 mr-2" />
              New Template
            </button>
          </div>
          
          <div className="text-center py-8 text-gray-500">
            <EnvelopeIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No templates created yet.</p>
            <p className="text-sm">Create reusable templates for common communications.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageCenter;
