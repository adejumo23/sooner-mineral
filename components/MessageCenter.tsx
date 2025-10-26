import * as React from 'react';
import type { User } from '../types';
import Button from './ui/Button';
import Microsoft365Sync from './Microsoft365Sync';
import { 
  EnvelopeIcon, 
  PhoneIcon, 
  ChatBubbleLeftRightIcon, 
  DocumentTextIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CloudIcon
} from './icons/Icons';

interface Communication {
  id: string;
  user_id: string;
  contact_id?: string;
  lead_id?: string;
  deal_id?: string;
  method: 'Email' | 'Call' | 'SMS' | 'Mail';
  direction: 'Inbound' | 'Outbound';
  subject?: string;
  message_snippet?: string;
  full_message?: string;
  outcome: 'No Answer' | 'Left Voicemail' | 'Sent' | 'Bounced' | 'Replied' | 'Delivered' | 'Failed' | 'Returned' | 'Opened' | 'Clicked';
  timestamp: string;
  duration_seconds?: number;
  phone_number?: string;
  email_address?: string;
  campaign_id?: string;
  sequence_step?: number;
  attachment_count: number;
  is_private: boolean;
  user_name: string;
  user_email: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  lead_name?: string;
  deal_name?: string;
}

interface MessageCenterProps {
  currentUser: User;
  users: User[];
}

const MessageCenter: React.FC<MessageCenterProps> = ({ currentUser, users }) => {
  const [communications, setCommunications] = React.useState<Communication[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [methodFilter, setMethodFilter] = React.useState('');
  const [outcomeFilter, setOutcomeFilter] = React.useState('');
  const [dateFilter, setDateFilter] = React.useState('');
  const [showFilters, setShowFilters] = React.useState(false);
  const [selectedCommunication, setSelectedCommunication] = React.useState<Communication | null>(null);
  const [showDetail, setShowDetail] = React.useState(false);
  const [showMicrosoftSync, setShowMicrosoftSync] = React.useState(false);

  // Load communications
  React.useEffect(() => {
    const loadCommunications = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (methodFilter) params.append('method', methodFilter);
        if (outcomeFilter) params.append('outcome', outcomeFilter);
        if (dateFilter) {
          const date = new Date();
          date.setDate(date.getDate() - parseInt(dateFilter));
          params.append('start_date', date.toISOString().split('T')[0]);
        }

        const response = await fetch(`http://localhost:3053/api/communications?${params.toString()}`);
        const data = await response.json();
        
        if (data.success) {
          setCommunications(data.data);
        }
      } catch (error) {
        console.error('Error loading communications:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCommunications();
  }, [search, methodFilter, outcomeFilter, dateFilter]);

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'Email': return <EnvelopeIcon className="h-4 w-4" />;
      case 'Call': return <PhoneIcon className="h-4 w-4" />;
      case 'SMS': return <ChatBubbleLeftRightIcon className="h-4 w-4" />;
      case 'Mail': return <DocumentTextIcon className="h-4 w-4" />;
      default: return <EnvelopeIcon className="h-4 w-4" />;
    }
  };

  const getOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case 'Delivered':
      case 'Replied':
      case 'Opened':
      case 'Clicked':
        return 'text-green-600 bg-green-100';
      case 'Sent':
      case 'Left Voicemail':
        return 'text-blue-600 bg-blue-100';
      case 'No Answer':
      case 'Bounced':
      case 'Failed':
      case 'Returned':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const filteredCommunications = communications.filter(comm => {
    if (search && !comm.subject?.toLowerCase().includes(search.toLowerCase()) && 
        !comm.message_snippet?.toLowerCase().includes(search.toLowerCase()) &&
        !comm.contact_name?.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Message Center</h1>
        <p className="text-gray-600">Track and manage all communications with landowners and stakeholders</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search communications..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sc-blue focus:border-transparent"
              />
            </div>
          </div>

          {/* Filter Toggle */}
          <Button
            variant="secondary"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <FunnelIcon className="h-4 w-4" />
            Filters
          </Button>

          {/* Microsoft 365 Sync */}
          <Button
            variant="secondary"
            onClick={() => setShowMicrosoftSync(!showMicrosoftSync)}
            className="flex items-center gap-2"
          >
            <CloudIcon className="h-4 w-4" />
            Microsoft 365
          </Button>

          {/* New Communication */}
          <Button className="flex items-center gap-2">
            <PlusIcon className="h-4 w-4" />
            New Communication
          </Button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
                <select
                  value={methodFilter}
                  onChange={(e) => setMethodFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                >
                  <option value="">All Methods</option>
                  <option value="Email">Email</option>
                  <option value="Call">Call</option>
                  <option value="SMS">SMS</option>
                  <option value="Mail">Mail</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Outcome</label>
                <select
                  value={outcomeFilter}
                  onChange={(e) => setOutcomeFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                >
                  <option value="">All Outcomes</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Replied">Replied</option>
                  <option value="Opened">Opened</option>
                  <option value="Clicked">Clicked</option>
                  <option value="Sent">Sent</option>
                  <option value="Left Voicemail">Left Voicemail</option>
                  <option value="No Answer">No Answer</option>
                  <option value="Bounced">Bounced</option>
                  <option value="Failed">Failed</option>
                  <option value="Returned">Returned</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time Range</label>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                >
                  <option value="">All Time</option>
                  <option value="1">Last 24 hours</option>
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Microsoft 365 Sync Section */}
        {showMicrosoftSync && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <Microsoft365Sync 
              userId={currentUser.id} 
              currentUser={currentUser} 
            />
          </div>
        )}
      </div>

      {/* Communications List */}
      <div className="bg-white rounded-lg border border-gray-200">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading communications...</div>
        ) : filteredCommunications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No communications found</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredCommunications.map((comm) => (
              <div
                key={comm.id}
                className="p-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => {
                  setSelectedCommunication(comm);
                  setShowDetail(true);
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full">
                        {getMethodIcon(comm.method)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {comm.contact_name || 'Unknown Contact'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {comm.method} • {comm.direction}
                        </span>
                        {comm.is_private && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Private
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-900 mb-1">
                        {comm.subject || comm.message_snippet || 'No subject'}
                      </div>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>By {comm.user_name}</span>
                        <span>{formatTimestamp(comm.timestamp)}</span>
                        {comm.lead_name && <span>Lead: {comm.lead_name}</span>}
                        {comm.attachment_count > 0 && (
                          <span>{comm.attachment_count} attachment(s)</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getOutcomeColor(comm.outcome)}`}>
                      {comm.outcome}
                    </span>
                    <Button
                      size="icon"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCommunication(comm);
                        setShowDetail(true);
                      }}
                    >
                      <EyeIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Communication Detail Modal */}
      {showDetail && selectedCommunication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Communication Details</h3>
                <Button
                  variant="secondary"
                  onClick={() => setShowDetail(false)}
                >
                  Close
                </Button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
                    <div className="flex items-center space-x-2">
                      {getMethodIcon(selectedCommunication.method)}
                      <span className="text-sm text-gray-900">{selectedCommunication.method}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Outcome</label>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getOutcomeColor(selectedCommunication.outcome)}`}>
                      {selectedCommunication.outcome}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <p className="text-sm text-gray-900">{selectedCommunication.subject || 'No subject'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                  <div className="bg-gray-50 rounded p-3 text-sm text-gray-900 whitespace-pre-wrap">
                    {selectedCommunication.full_message || selectedCommunication.message_snippet || 'No message content'}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact</label>
                    <p className="text-sm text-gray-900">{selectedCommunication.contact_name || 'Unknown'}</p>
                    {selectedCommunication.contact_email && (
                      <p className="text-xs text-gray-500">{selectedCommunication.contact_email}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sent By</label>
                    <p className="text-sm text-gray-900">{selectedCommunication.user_name}</p>
                    <p className="text-xs text-gray-500">{selectedCommunication.user_email}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Timestamp</label>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedCommunication.timestamp).toLocaleString()}
                  </p>
                </div>

                {selectedCommunication.duration_seconds && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                    <p className="text-sm text-gray-900">
                      {Math.floor(selectedCommunication.duration_seconds / 60)}m {selectedCommunication.duration_seconds % 60}s
                    </p>
                  </div>
                )}

                {selectedCommunication.lead_name && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Related Lead</label>
                    <p className="text-sm text-gray-900">{selectedCommunication.lead_name}</p>
                  </div>
                )}

                {selectedCommunication.deal_name && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Related Deal</label>
                    <p className="text-sm text-gray-900">{selectedCommunication.deal_name}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageCenter;