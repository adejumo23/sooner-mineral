// Microsoft 365 Sync API Client
const API_BASE_URL = 'http://localhost:3054/api';

export interface MicrosoftAuthUrl {
  success: boolean;
  authUrl: string;
}

export interface MicrosoftTokens {
  success: boolean;
  message: string;
  expiresIn: number;
}

export interface SyncResult {
  success: boolean;
  message: string;
  syncedCount: number;
  items?: any[];
}

export interface SyncStatus {
  success: boolean;
  syncStatus: Array<{
    sync_type: string;
    last_sync_time: string;
  }>;
}

export interface EmailSendRequest {
  userId: string;
  to: string[];
  subject: string;
  body: string;
  isHtml?: boolean;
}

export interface CalendarEventRequest {
  userId: string;
  subject: string;
  startTime: string;
  endTime: string;
  attendees: string[];
  location?: string;
  isOnlineMeeting?: boolean;
}

class MicrosoftSyncApiClient {
  // Get Microsoft 365 authentication URL
  async getAuthUrl(): Promise<MicrosoftAuthUrl> {
    const response = await fetch(`${API_BASE_URL}/microsoft/auth-url`);
    return await response.json();
  }

  // Exchange authorization code for tokens
  async exchangeToken(code: string, userId: string): Promise<MicrosoftTokens> {
    const response = await fetch(`${API_BASE_URL}/microsoft/exchange-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code, userId })
    });
    return await response.json();
  }

  // Sync emails from Outlook
  async syncEmails(userId: string, lastSyncTime?: string): Promise<SyncResult> {
    const response = await fetch(`${API_BASE_URL}/microsoft/sync-emails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        lastSyncTime
      })
    });
    return await response.json();
  }

  // Sync calendar events
  async syncCalendar(userId: string, startDate?: string, endDate?: string): Promise<SyncResult> {
    const response = await fetch(`${API_BASE_URL}/microsoft/sync-calendar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        startDate,
        endDate
      })
    });
    return await response.json();
  }

  // Get sync status
  async getSyncStatus(userId: string): Promise<SyncStatus> {
    const response = await fetch(`${API_BASE_URL}/microsoft/sync-status/${userId}`);
    return await response.json();
  }

  // Send email through Microsoft Graph
  async sendEmail(request: EmailSendRequest): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/microsoft/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request)
    });
    return await response.json();
  }

  // Create calendar event
  async createCalendarEvent(request: CalendarEventRequest): Promise<{ success: boolean; message: string; eventId?: string }> {
    const response = await fetch(`${API_BASE_URL}/microsoft/create-calendar-event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request)
    });
    return await response.json();
  }

  // Get Microsoft 365 contacts
  async getContacts(userId: string): Promise<{ success: boolean; contacts: any[] }> {
    const response = await fetch(`${API_BASE_URL}/microsoft/contacts/${userId}`);
    return await response.json();
  }

  // Get Microsoft 365 calendar events
  async getCalendarEvents(userId: string, startDate?: string, endDate?: string): Promise<{ success: boolean; events: any[] }> {
    const response = await fetch(`${API_BASE_URL}/microsoft/calendar-events/${userId}?startDate=${startDate}&endDate=${endDate}`);
    return await response.json();
  }

  // Get Microsoft 365 emails
  async getEmails(userId: string, lastSyncTime?: string): Promise<{ success: boolean; emails: any[] }> {
    const response = await fetch(`${API_BASE_URL}/microsoft/emails/${userId}?lastSyncTime=${lastSyncTime}`);
    return await response.json();
  }

  // Disconnect Microsoft 365 account
  async disconnect(userId: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/microsoft/disconnect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId })
    });
    return await response.json();
  }

  // Get sync history
  async getSyncHistory(userId: string): Promise<{ success: boolean; history: any[] }> {
    const response = await fetch(`${API_BASE_URL}/microsoft/sync-history/${userId}`);
    return await response.json();
  }

  // Retry failed sync
  async retrySync(userId: string, syncType: string): Promise<SyncResult> {
    const response = await fetch(`${API_BASE_URL}/microsoft/retry-sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, syncType })
    });
    return await response.json();
  }

  // Get Microsoft 365 user info
  async getUserInfo(userId: string): Promise<{ success: boolean; user: any }> {
    const response = await fetch(`${API_BASE_URL}/microsoft/user-info/${userId}`);
    return await response.json();
  }

  // Check if user is authenticated
  async isAuthenticated(userId: string): Promise<boolean> {
    try {
      const status = await this.getSyncStatus(userId);
      return status.success && status.syncStatus.length > 0;
    } catch (error) {
      return false;
    }
  }

  // Auto-sync (background sync)
  async autoSync(userId: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/microsoft/auto-sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId })
    });
    return await response.json();
  }

  // Get sync statistics
  async getSyncStats(userId: string): Promise<{ success: boolean; stats: any }> {
    const response = await fetch(`${API_BASE_URL}/microsoft/sync-stats/${userId}`);
    return await response.json();
  }
}

export default new MicrosoftSyncApiClient();
