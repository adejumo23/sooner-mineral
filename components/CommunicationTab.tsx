import * as React from 'react';
import type { User } from '../types';
import Button from './ui/Button';
import { 
  EnvelopeIcon, 
  PhoneIcon, 
  ChatBubbleLeftRightIcon, 
  DocumentTextIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  ClockIcon
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

interface CommunicationTabProps {
  contactId?: string;
  leadId?: string;
  currentUser: User;
  users: User[];
}

const CommunicationTab: React.FC<CommunicationTabProps> = ({ 
  contactId, 
  leadId, 
  currentUser, 
  users 
}) => {
  const [communications, setCommunications] = React.useState<Communication[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showNewForm, setShowNewForm] = React.useState(false);
  const [selectedCommunication, setSelectedCommunication] = React.useState<Communication | null>(null);
  const [showDetail, setShowDetail] = React.useState(false);

  // Load communications
  React.useEffect(() => {
    const loadCommunications = async () => {
      try {
        setLoading(true);
        let endpoint = '';
        
        if (contactId) {
          endpoint = `http://localhost:3053/api/communications/contact/${contactId}`;
        } else if (leadId) {
          endpoint = `http://localhost:3053/api/communications/lead/${leadId}`;
        } else {
          return;
        }

        const response = await fetch(endpoint);
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
  }, [contactId, leadId]);

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

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const handleNewCommunication = () => {
    setShowNewForm(true);
  };

  const handleViewCommunication = (comm: Communication) => {
    setSelectedCommunication(comm);
    setShowDetail(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Communication History</h3>
          <p className="text-sm text-gray-600">
            Track all communications with this {contactId ? 'contact' : 'lead'}
          </p>
        </div>
        <Button onClick={handleNewCommunication} className="flex items-center gap-2">
          <PlusIcon className="h-4 w-4" />
          New Communication
        </Button>
      </div>

      {/* Communications Timeline */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading communications...</div>
        ) : communications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="mb-4">
              <EnvelopeIcon className="h-12 w-12 text-gray-300 mx-auto" />
            </div>
            <p>No communications yet</p>
            <p className="text-sm text-gray-400">Start by creating your first communication</p>
          </div>
        ) : (
          <div className="space-y-3">
            {communications.map((comm, index) => (
              <div
                key={comm.id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full">
                      {getMethodIcon(comm.method)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">
                          {comm.method} • {comm.direction}
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getOutcomeColor(comm.outcome)}`}>
                          {comm.outcome}
                        </span>
                        {comm.is_private && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Private
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <ClockIcon className="h-3 w-3" />
                          {formatTimestamp(comm.timestamp)}
                        </span>
                        <Button
                          size="icon"
                          variant="secondary"
                          onClick={() => handleViewCommunication(comm)}
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-900 mb-2">
                      {comm.subject || comm.message_snippet || 'No subject'}
                    </div>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>By {comm.user_name}</span>
                      {comm.duration_seconds && (
                        <span>
                          {Math.floor(comm.duration_seconds / 60)}m {comm.duration_seconds % 60}s
                        </span>
                      )}
                      {comm.attachment_count > 0 && (
                        <span>{comm.attachment_count} attachment(s)</span>
                      )}
                      {comm.lead_name && (
                        <span>Lead: {comm.lead_name}</span>
                      )}
                      {comm.deal_name && (
                        <span>Deal: {comm.deal_name}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Communication Form Modal */}
      {showNewForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">New Communication</h3>
                <Button
                  variant="secondary"
                  onClick={() => setShowNewForm(false)}
                >
                  Cancel
                </Button>
              </div>

              <form className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
                    <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm">
                      <option value="Email">Email</option>
                      <option value="Call">Call</option>
                      <option value="SMS">SMS</option>
                      <option value="Mail">Mail</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Direction</label>
                    <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm">
                      <option value="Outbound">Outbound</option>
                      <option value="Inbound">Inbound</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    placeholder="Enter subject..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                  <textarea
                    rows={4}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    placeholder="Enter your message..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Outcome</label>
                    <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm">
                      <option value="Sent">Sent</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Replied">Replied</option>
                      <option value="Opened">Opened</option>
                      <option value="Clicked">Clicked</option>
                      <option value="No Answer">No Answer</option>
                      <option value="Left Voicemail">Left Voicemail</option>
                      <option value="Bounced">Bounced</option>
                      <option value="Failed">Failed</option>
                      <option value="Returned">Returned</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration (seconds)</label>
                    <input
                      type="number"
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_private"
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="is_private" className="text-sm text-gray-700">
                    Private communication (Admin/Legal only)
                  </label>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowNewForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    Create Communication
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sent By</label>
                    <p className="text-sm text-gray-900">{selectedCommunication.user_name}</p>
                    <p className="text-xs text-gray-500">{selectedCommunication.user_email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Timestamp</label>
                    <p className="text-sm text-gray-900">
                      {new Date(selectedCommunication.timestamp).toLocaleString()}
                    </p>
                  </div>
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

export default CommunicationTab;