import React, { useState, useEffect } from 'react';
import { 
  Communication, 
  CommunicationMethod, 
  CommunicationOutcome, 
  Contact, 
  Lead, 
  User 
} from '../types';
import { 
  PhoneIcon, 
  EnvelopeIcon, 
  ChatBubbleLeftRightIcon, 
  EnvelopeIcon as MailIcon,
  PlusIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from './icons/Icons';

interface CommunicationTabProps {
  contactId: string;
  contact?: Contact;
  leadId?: string;
  lead?: Lead;
  currentUser: User;
}

const CommunicationTab: React.FC<CommunicationTabProps> = ({
  contactId,
  contact,
  leadId,
  lead,
  currentUser
}) => {
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewCommunicationForm, setShowNewCommunicationForm] = useState(false);
  const [newCommunication, setNewCommunication] = useState({
    method: 'Call' as CommunicationMethod,
    outcome: 'Sent' as CommunicationOutcome,
    subject: '',
    messageSnippet: '',
    attachments: [] as string[]
  });

  useEffect(() => {
    fetchCommunications();
  }, [contactId, leadId]);

  const fetchCommunications = async () => {
    setIsLoading(true);
    try {
      // Mock API call - replace with actual API
      const mockCommunications: Communication[] = [
        {
          id: '1',
          userId: currentUser.id,
          user: currentUser,
          contactId,
          contact,
          leadId,
          lead,
          method: 'Call',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          outcome: 'Left Voicemail',
          messageSnippet: 'Called to discuss mineral rights offer',
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          userId: currentUser.id,
          user: currentUser,
          contactId,
          contact,
          leadId,
          lead,
          method: 'Email',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          outcome: 'Sent',
          subject: 'Mineral Rights Acquisition Opportunity',
          messageSnippet: 'Sent initial offer letter',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];
      setCommunications(mockCommunications);
    } catch (error) {
      console.error('Error fetching communications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewCommunication = async () => {
    try {
      const communication: Communication = {
        id: Date.now().toString(),
        userId: currentUser.id,
        user: currentUser,
        contactId,
        contact,
        leadId,
        lead,
        method: newCommunication.method,
        timestamp: new Date().toISOString(),
        outcome: newCommunication.outcome,
        subject: newCommunication.subject,
        messageSnippet: newCommunication.messageSnippet,
        attachments: newCommunication.attachments,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Mock API call - replace with actual API
      setCommunications(prev => [communication, ...prev]);
      setShowNewCommunicationForm(false);
      setNewCommunication({
        method: 'Call',
        outcome: 'Sent',
        subject: '',
        messageSnippet: '',
        attachments: []
      });
    } catch (error) {
      console.error('Error creating communication:', error);
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
      case 'Read':
        return <CheckCircleIcon className="w-4 h-4 text-green-500" />;
      case 'Replied':
        return <CheckCircleIcon className="w-4 h-4 text-blue-500" />;
      case 'Bounced':
      case 'Failed':
        return <XCircleIcon className="w-4 h-4 text-red-500" />;
      case 'No Answer':
      case 'Left Voicemail':
        return <ClockIcon className="w-4 h-4 text-yellow-500" />;
      default:
        return <ExclamationTriangleIcon className="w-4 h-4 text-gray-500" />;
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Communication History</h3>
          <p className="text-sm text-gray-500">
            {contact?.name && `All communications with ${contact.name}`}
            {lead?.name && ` - ${lead.name}`}
          </p>
        </div>
        <button
          onClick={() => setShowNewCommunicationForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          Log Communication
        </button>
      </div>

      {/* New Communication Form */}
      {showNewCommunicationForm && (
        <div className="bg-gray-50 p-6 rounded-lg border">
          <h4 className="text-md font-medium text-gray-900 mb-4">Log New Communication</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Method
              </label>
              <select
                value={newCommunication.method}
                onChange={(e) => setNewCommunication(prev => ({ ...prev, method: e.target.value as CommunicationMethod }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Call">Call</option>
                <option value="Email">Email</option>
                <option value="SMS">SMS</option>
                <option value="Mail">Mail</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Outcome
              </label>
              <select
                value={newCommunication.outcome}
                onChange={(e) => setNewCommunication(prev => ({ ...prev, outcome: e.target.value as CommunicationOutcome }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Sent">Sent</option>
                <option value="Delivered">Delivered</option>
                <option value="Read">Read</option>
                <option value="Replied">Replied</option>
                <option value="No Answer">No Answer</option>
                <option value="Left Voicemail">Left Voicemail</option>
                <option value="Bounced">Bounced</option>
                <option value="Failed">Failed</option>
              </select>
            </div>
            {newCommunication.method === 'Email' && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  value={newCommunication.subject}
                  onChange={(e) => setNewCommunication(prev => ({ ...prev, subject: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Email subject line"
                />
              </div>
            )}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message / Notes
              </label>
              <textarea
                value={newCommunication.messageSnippet}
                onChange={(e) => setNewCommunication(prev => ({ ...prev, messageSnippet: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Brief description of the communication"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3 mt-4">
            <button
              onClick={() => setShowNewCommunicationForm(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleNewCommunication}
              className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Log Communication
            </button>
          </div>
        </div>
      )}

      {/* Communications List */}
      <div className="space-y-4">
        {communications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <EnvelopeIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No communications logged yet.</p>
            <p className="text-sm">Click "Log Communication" to get started.</p>
          </div>
        ) : (
          communications.map((communication) => (
            <div
              key={communication.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    {getMethodIcon(communication.method)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">
                        {communication.user?.name || 'Unknown User'}
                      </span>
                      <span className="text-sm text-gray-500">•</span>
                      <span className="text-sm text-gray-500">
                        {formatTimestamp(communication.timestamp)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getOutcomeIcon(communication.outcome)}
                      <span className="text-sm text-gray-500 capitalize">
                        {communication.outcome.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                    </div>
                  </div>
                  
                  {communication.subject && (
                    <p className="text-sm font-medium text-gray-900 mt-1">
                      {communication.subject}
                    </p>
                  )}
                  
                  {communication.messageSnippet && (
                    <p className="text-sm text-gray-600 mt-1">
                      {communication.messageSnippet}
                    </p>
                  )}
                  
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                    <span className="capitalize">{communication.method}</span>
                    {communication.attachments && communication.attachments.length > 0 && (
                      <span>{communication.attachments.length} attachment(s)</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CommunicationTab;
