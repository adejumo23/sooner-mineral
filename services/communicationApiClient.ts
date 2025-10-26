// Communication Integration API Client
// Handles all communication-related API calls

const API_BASE_URL = 'http://localhost:3053/api';

// Generic API request helper
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

// ============================================================================
// COMMUNICATIONS API
// ============================================================================

export interface Communication {
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
  user_name?: string;
  user_email?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  lead_name?: string;
  deal_name?: string;
}

export interface CommunicationFilters {
  page?: number;
  limit?: number;
  method?: string;
  outcome?: string;
  user_id?: string;
  contact_id?: string;
  lead_id?: string;
  start_date?: string;
  end_date?: string;
  search?: string;
}

export interface CommunicationResponse {
  success: boolean;
  data: Communication[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// Get all communications with filtering
export const fetchCommunications = async (filters: CommunicationFilters = {}): Promise<CommunicationResponse> => {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, value.toString());
    }
  });

  return await apiRequest(`/communications?${params.toString()}`);
};

// Get communication by ID
export const fetchCommunication = async (id: string): Promise<{ success: boolean; data: Communication }> => {
  return await apiRequest(`/communications/${id}`);
};

// Create new communication
export const createCommunication = async (communication: Partial<Communication>): Promise<{ success: boolean; data: { id: string } }> => {
  return await apiRequest('/communications', {
    method: 'POST',
    body: JSON.stringify(communication),
  });
};

// Update communication
export const updateCommunication = async (id: string, updates: Partial<Communication>): Promise<{ success: boolean }> => {
  return await apiRequest(`/communications/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
};

// Get communications for a specific contact
export const fetchContactCommunications = async (contactId: string, page = 1, limit = 50): Promise<{ success: boolean; data: Communication[] }> => {
  return await apiRequest(`/communications/contact/${contactId}?page=${page}&limit=${limit}`);
};

// Get communications for a specific lead
export const fetchLeadCommunications = async (leadId: string, page = 1, limit = 50): Promise<{ success: boolean; data: Communication[] }> => {
  return await apiRequest(`/communications/lead/${leadId}?page=${page}&limit=${limit}`);
};

// ============================================================================
// EMAIL CAMPAIGNS API
// ============================================================================

export interface EmailCampaign {
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
  created_by_name?: string;
}

export interface EmailCampaignFilters {
  page?: number;
  limit?: number;
  status?: string;
}

// Get all email campaigns
export const fetchEmailCampaigns = async (filters: EmailCampaignFilters = {}): Promise<{ success: boolean; data: EmailCampaign[] }> => {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, value.toString());
    }
  });

  return await apiRequest(`/email-campaigns?${params.toString()}`);
};

// Get email campaign by ID
export const fetchEmailCampaign = async (id: string): Promise<{ success: boolean; data: EmailCampaign }> => {
  return await apiRequest(`/email-campaigns/${id}`);
};

// Create new email campaign
export const createEmailCampaign = async (campaign: Partial<EmailCampaign>): Promise<{ success: boolean; data: { id: string } }> => {
  return await apiRequest('/email-campaigns', {
    method: 'POST',
    body: JSON.stringify(campaign),
  });
};

// Update email campaign
export const updateEmailCampaign = async (id: string, updates: Partial<EmailCampaign>): Promise<{ success: boolean }> => {
  return await apiRequest(`/email-campaigns/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
};

// Start email campaign
export const startEmailCampaign = async (id: string): Promise<{ success: boolean }> => {
  return await apiRequest(`/email-campaigns/${id}/start`, {
    method: 'POST',
  });
};

// Pause email campaign
export const pauseEmailCampaign = async (id: string): Promise<{ success: boolean }> => {
  return await apiRequest(`/email-campaigns/${id}/pause`, {
    method: 'POST',
  });
};

// Stop email campaign
export const stopEmailCampaign = async (id: string): Promise<{ success: boolean }> => {
  return await apiRequest(`/email-campaigns/${id}/stop`, {
    method: 'POST',
  });
};

// ============================================================================
// EMAIL SEQUENCE STEPS API
// ============================================================================

export interface EmailSequenceStep {
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

// Get sequence steps for a campaign
export const fetchEmailSequenceSteps = async (campaignId: string): Promise<{ success: boolean; data: EmailSequenceStep[] }> => {
  return await apiRequest(`/email-campaigns/${campaignId}/steps`);
};

// Create sequence step
export const createEmailSequenceStep = async (step: Partial<EmailSequenceStep>): Promise<{ success: boolean; data: { id: string } }> => {
  return await apiRequest('/email-sequence-steps', {
    method: 'POST',
    body: JSON.stringify(step),
  });
};

// Update sequence step
export const updateEmailSequenceStep = async (id: string, updates: Partial<EmailSequenceStep>): Promise<{ success: boolean }> => {
  return await apiRequest(`/email-sequence-steps/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
};

// Delete sequence step
export const deleteEmailSequenceStep = async (id: string): Promise<{ success: boolean }> => {
  return await apiRequest(`/email-sequence-steps/${id}`, {
    method: 'DELETE',
  });
};

// ============================================================================
// CAMPAIGN RECIPIENTS API
// ============================================================================

export interface CampaignRecipient {
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

// Get campaign recipients
export const fetchCampaignRecipients = async (campaignId: string): Promise<{ success: boolean; data: CampaignRecipient[] }> => {
  return await apiRequest(`/email-campaigns/${campaignId}/recipients`);
};

// Add recipients to campaign
export const addCampaignRecipients = async (campaignId: string, recipients: Partial<CampaignRecipient>[]): Promise<{ success: boolean }> => {
  return await apiRequest(`/email-campaigns/${campaignId}/recipients`, {
    method: 'POST',
    body: JSON.stringify({ recipients }),
  });
};

// Remove recipient from campaign
export const removeCampaignRecipient = async (recipientId: string): Promise<{ success: boolean }> => {
  return await apiRequest(`/campaign-recipients/${recipientId}`, {
    method: 'DELETE',
  });
};

// ============================================================================
// COMMUNICATION TEMPLATES API
// ============================================================================

export interface CommunicationTemplate {
  id: string;
  name: string;
  type: 'Email' | 'SMS' | 'Call Script' | 'Mail';
  subject?: string;
  content: string;
  variables?: Record<string, any>;
  created_by: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  created_by_name?: string;
}

export interface TemplateFilters {
  type?: string;
  is_public?: boolean;
}

// Get communication templates
export const fetchCommunicationTemplates = async (filters: TemplateFilters = {}): Promise<{ success: boolean; data: CommunicationTemplate[] }> => {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, value.toString());
    }
  });

  return await apiRequest(`/communication-templates?${params.toString()}`);
};

// Get template by ID
export const fetchCommunicationTemplate = async (id: string): Promise<{ success: boolean; data: CommunicationTemplate }> => {
  return await apiRequest(`/communication-templates/${id}`);
};

// Create communication template
export const createCommunicationTemplate = async (template: Partial<CommunicationTemplate>): Promise<{ success: boolean; data: { id: string } }> => {
  return await apiRequest('/communication-templates', {
    method: 'POST',
    body: JSON.stringify(template),
  });
};

// Update communication template
export const updateCommunicationTemplate = async (id: string, updates: Partial<CommunicationTemplate>): Promise<{ success: boolean }> => {
  return await apiRequest(`/communication-templates/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
};

// Delete communication template
export const deleteCommunicationTemplate = async (id: string): Promise<{ success: boolean }> => {
  return await apiRequest(`/communication-templates/${id}`, {
    method: 'DELETE',
  });
};

// ============================================================================
// DIRECT MAIL LOGS API
// ============================================================================

export interface DirectMailLog {
  id: string;
  contact_id: string;
  lead_id?: string;
  mail_type: 'Letter' | 'Postcard' | 'Brochure' | 'Contract' | 'Other';
  subject?: string;
  content_summary?: string;
  sent_by: string;
  sent_date: string;
  tracking_number?: string;
  status: 'Sent' | 'Delivered' | 'Returned' | 'Failed';
  return_reason?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  contact_name?: string;
  contact_email?: string;
  lead_name?: string;
  sent_by_name?: string;
}

export interface DirectMailLogFilters {
  page?: number;
  limit?: number;
  status?: string;
  contact_id?: string;
  lead_id?: string;
}

// Get direct mail logs
export const fetchDirectMailLogs = async (filters: DirectMailLogFilters = {}): Promise<{ success: boolean; data: DirectMailLog[] }> => {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, value.toString());
    }
  });

  return await apiRequest(`/direct-mail-logs?${params.toString()}`);
};

// Create direct mail log
export const createDirectMailLog = async (mailLog: Partial<DirectMailLog>): Promise<{ success: boolean; data: { id: string } }> => {
  return await apiRequest('/direct-mail-logs', {
    method: 'POST',
    body: JSON.stringify(mailLog),
  });
};

// Update direct mail log
export const updateDirectMailLog = async (id: string, updates: Partial<DirectMailLog>): Promise<{ success: boolean }> => {
  return await apiRequest(`/direct-mail-logs/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
};

// ============================================================================
// HEALTH CHECK
// ============================================================================

export const checkCommunicationApiHealth = async (): Promise<{ status: string; message: string; database: string; timestamp: string }> => {
  return await apiRequest('/health');
};
