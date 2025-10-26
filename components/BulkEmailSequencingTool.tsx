import * as React from 'react';
import type { User } from '../types';
import Button from './ui/Button';
import { 
  EnvelopeIcon, 
  PlusIcon, 
  TrashIcon, 
  PlayIcon, 
  PauseIcon,
  StopIcon,
  EyeIcon,
  PencilIcon,
  ClockIcon,
  UsersIcon
} from './icons/Icons';

interface EmailCampaign {
  id: string;
  name: string;
  description: string;
  created_by: string;
  status: 'Draft' | 'Active' | 'Paused' | 'Completed' | 'Cancelled';
  total_recipients: number;
  sent_count: number;
  opened_count: number;
  clicked_count: number;
  bounced_count: number;
  unsubscribed_count: number;
  created_at: string;
  updated_at: string;
  created_by_name: string;
}

interface EmailSequenceStep {
  id: string;
  campaign_id: string;
  step_number: number;
  subject: string;
  template_content: string;
  delay_days: number;
  delay_hours: number;
  is_active: boolean;
  created_at: string;
}

interface CampaignRecipient {
  id: string;
  campaign_id: string;
  contact_id: string;
  lead_id?: string;
  email_address: string;
  status: 'Pending' | 'Sent' | 'Delivered' | 'Opened' | 'Clicked' | 'Bounced' | 'Unsubscribed' | 'Failed';
  current_step: number;
  last_sent_at?: string;
  next_send_at?: string;
  unsubscribed_at?: string;
  created_at: string;
  updated_at: string;
}

interface BulkEmailSequencingToolProps {
  currentUser: User;
  users: User[];
}

const BulkEmailSequencingTool: React.FC<BulkEmailSequencingToolProps> = ({ 
  currentUser, 
  users 
}) => {
  const [campaigns, setCampaigns] = React.useState<EmailCampaign[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showNewCampaign, setShowNewCampaign] = React.useState(false);
  const [selectedCampaign, setSelectedCampaign] = React.useState<EmailCampaign | null>(null);
  const [showCampaignDetail, setShowCampaignDetail] = React.useState(false);
  const [showSequenceBuilder, setShowSequenceBuilder] = React.useState(false);
  const [sequenceSteps, setSequenceSteps] = React.useState<EmailSequenceStep[]>([]);
  const [campaignRecipients, setCampaignRecipients] = React.useState<CampaignRecipient[]>([]);

  // Load campaigns
  React.useEffect(() => {
    const loadCampaigns = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:3053/api/email-campaigns');
        const data = await response.json();
        
        if (data.success) {
          setCampaigns(data.data);
        }
      } catch (error) {
        console.error('Error loading campaigns:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCampaigns();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'text-green-600 bg-green-100';
      case 'Paused':
        return 'text-yellow-600 bg-yellow-100';
      case 'Completed':
        return 'text-blue-600 bg-blue-100';
      case 'Cancelled':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const handleNewCampaign = () => {
    setShowNewCampaign(true);
  };

  const handleViewCampaign = (campaign: EmailCampaign) => {
    setSelectedCampaign(campaign);
    setShowCampaignDetail(true);
  };

  const handleEditSequence = (campaign: EmailCampaign) => {
    setSelectedCampaign(campaign);
    setShowSequenceBuilder(true);
  };

  const handleStartCampaign = async (campaignId: string) => {
    try {
      const response = await fetch(`http://localhost:3052/api/email-campaigns/${campaignId}/start`, {
        method: 'POST'
      });
      
      if (response.ok) {
        // Reload campaigns
        const campaignsResponse = await fetch('http://localhost:3052/api/email-campaigns');
        const campaignsData = await campaignsResponse.json();
        if (campaignsData.success) {
          setCampaigns(campaignsData.data);
        }
      }
    } catch (error) {
      console.error('Error starting campaign:', error);
    }
  };

  const handlePauseCampaign = async (campaignId: string) => {
    try {
      const response = await fetch(`http://localhost:3052/api/email-campaigns/${campaignId}/pause`, {
        method: 'POST'
      });
      
      if (response.ok) {
        // Reload campaigns
        const campaignsResponse = await fetch('http://localhost:3052/api/email-campaigns');
        const campaignsData = await campaignsResponse.json();
        if (campaignsData.success) {
          setCampaigns(campaignsData.data);
        }
      }
    } catch (error) {
      console.error('Error pausing campaign:', error);
    }
  };

  const handleStopCampaign = async (campaignId: string) => {
    try {
      const response = await fetch(`http://localhost:3052/api/email-campaigns/${campaignId}/stop`, {
        method: 'POST'
      });
      
      if (response.ok) {
        // Reload campaigns
        const campaignsResponse = await fetch('http://localhost:3052/api/email-campaigns');
        const campaignsData = await campaignsResponse.json();
        if (campaignsData.success) {
          setCampaigns(campaignsData.data);
        }
      }
    } catch (error) {
      console.error('Error stopping campaign:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Bulk Email Sequencing</h3>
          <p className="text-sm text-gray-600">
            Create and manage multi-step email campaigns with automated follow-ups
          </p>
        </div>
        <Button onClick={handleNewCampaign} className="flex items-center gap-2">
          <PlusIcon className="h-4 w-4" />
          New Campaign
        </Button>
      </div>

      {/* Campaigns List */}
      <div className="bg-white rounded-lg border border-gray-200">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading campaigns...</div>
        ) : campaigns.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <div className="mb-4">
              <EnvelopeIcon className="h-12 w-12 text-gray-300 mx-auto" />
            </div>
            <p>No email campaigns yet</p>
            <p className="text-sm text-gray-400">Create your first campaign to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="text-lg font-medium text-gray-900">{campaign.name}</h4>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                        {campaign.status}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-4">{campaign.description}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <div className="text-2xl font-semibold text-gray-900">{campaign.total_recipients}</div>
                        <div className="text-xs text-gray-500">Total Recipients</div>
                      </div>
                      <div>
                        <div className="text-2xl font-semibold text-blue-600">{campaign.sent_count}</div>
                        <div className="text-xs text-gray-500">Sent</div>
                      </div>
                      <div>
                        <div className="text-2xl font-semibold text-green-600">{campaign.opened_count}</div>
                        <div className="text-xs text-gray-500">Opened</div>
                      </div>
                      <div>
                        <div className="text-2xl font-semibold text-purple-600">{campaign.clicked_count}</div>
                        <div className="text-xs text-gray-500">Clicked</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>Created by {campaign.created_by_name}</span>
                      <span>Created {formatDate(campaign.created_at)}</span>
                      <span>Updated {formatDate(campaign.updated_at)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      size="icon"
                      variant="secondary"
                      onClick={() => handleViewCampaign(campaign)}
                    >
                      <EyeIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="secondary"
                      onClick={() => handleEditSequence(campaign)}
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                    
                    {campaign.status === 'Draft' && (
                      <Button
                        size="sm"
                        onClick={() => handleStartCampaign(campaign.id)}
                        className="flex items-center gap-1"
                      >
                        <PlayIcon className="h-4 w-4" />
                        Start
                      </Button>
                    )}
                    
                    {campaign.status === 'Active' && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handlePauseCampaign(campaign.id)}
                        className="flex items-center gap-1"
                      >
                        <PauseIcon className="h-4 w-4" />
                        Pause
                      </Button>
                    )}
                    
                    {campaign.status === 'Paused' && (
                      <Button
                        size="sm"
                        onClick={() => handleStartCampaign(campaign.id)}
                        className="flex items-center gap-1"
                      >
                        <PlayIcon className="h-4 w-4" />
                        Resume
                      </Button>
                    )}
                    
                    {(campaign.status === 'Active' || campaign.status === 'Paused') && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleStopCampaign(campaign.id)}
                        className="flex items-center gap-1"
                      >
                        <StopIcon className="h-4 w-4" />
                        Stop
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Campaign Modal */}
      {showNewCampaign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Create New Campaign</h3>
                <Button
                  variant="secondary"
                  onClick={() => setShowNewCampaign(false)}
                >
                  Cancel
                </Button>
              </div>

              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    placeholder="Enter campaign name..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    rows={3}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    placeholder="Enter campaign description..."
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowNewCampaign(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    Create Campaign
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Campaign Detail Modal */}
      {showCampaignDetail && selectedCampaign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Campaign Details</h3>
                <Button
                  variant="secondary"
                  onClick={() => setShowCampaignDetail(false)}
                >
                  Close
                </Button>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-2">{selectedCampaign.name}</h4>
                  <p className="text-sm text-gray-600">{selectedCampaign.description}</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-2xl font-semibold text-gray-900">{selectedCampaign.total_recipients}</div>
                    <div className="text-sm text-gray-500">Total Recipients</div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-2xl font-semibold text-blue-600">{selectedCampaign.sent_count}</div>
                    <div className="text-sm text-gray-500">Sent</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-2xl font-semibold text-green-600">{selectedCampaign.opened_count}</div>
                    <div className="text-sm text-gray-500">Opened</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="text-2xl font-semibold text-purple-600">{selectedCampaign.clicked_count}</div>
                    <div className="text-sm text-gray-500">Clicked</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-red-50 rounded-lg p-4">
                    <div className="text-2xl font-semibold text-red-600">{selectedCampaign.bounced_count}</div>
                    <div className="text-sm text-gray-500">Bounced</div>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <div className="text-2xl font-semibold text-yellow-600">{selectedCampaign.unsubscribed_count}</div>
                    <div className="text-sm text-gray-500">Unsubscribed</div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-500">
                    Created by {selectedCampaign.created_by_name} on {formatDate(selectedCampaign.created_at)}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="secondary"
                      onClick={() => handleEditSequence(selectedCampaign)}
                    >
                      Edit Sequence
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => setShowCampaignDetail(false)}
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sequence Builder Modal */}
      {showSequenceBuilder && selectedCampaign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Email Sequence Builder</h3>
                <Button
                  variant="secondary"
                  onClick={() => setShowSequenceBuilder(false)}
                >
                  Close
                </Button>
              </div>

              <div className="space-y-4">
                <div className="text-sm text-gray-600">
                  Build your email sequence for: <strong>{selectedCampaign.name}</strong>
                </div>

                <div className="space-y-4">
                  {sequenceSteps.map((step, index) => (
                    <div key={step.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">Step {step.step_number}</h4>
                        <Button size="icon" variant="secondary">
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                          <input
                            type="text"
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                            value={step.subject}
                            placeholder="Enter email subject..."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Delay</label>
                          <div className="flex space-x-2">
                            <input
                              type="number"
                              className="w-20 border border-gray-300 rounded px-3 py-2 text-sm"
                              placeholder="0"
                              value={step.delay_days}
                            />
                            <span className="text-sm text-gray-500 self-center">days</span>
                            <input
                              type="number"
                              className="w-20 border border-gray-300 rounded px-3 py-2 text-sm"
                              placeholder="0"
                              value={step.delay_hours}
                            />
                            <span className="text-sm text-gray-500 self-center">hours</span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Content</label>
                        <textarea
                          rows={6}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                          placeholder="Enter email content..."
                          value={step.template_content}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  variant="secondary"
                  onClick={() => {
                    // Add new step logic
                  }}
                  className="w-full"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Step
                </Button>

                <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200">
                  <Button
                    variant="secondary"
                    onClick={() => setShowSequenceBuilder(false)}
                  >
                    Cancel
                  </Button>
                  <Button>
                    Save Sequence
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkEmailSequencingTool;
