// Microsoft Graph API Service for Outlook and Calendar Integration
import { Client } from '@azure/msal-node';

export interface MicrosoftUser {
  id: string;
  displayName: string;
  mail: string;
  userPrincipalName: string;
}

export interface EmailMessage {
  id: string;
  subject: string;
  body: string;
  from: {
    emailAddress: {
      name: string;
      address: string;
    };
  };
  toRecipients: Array<{
    emailAddress: {
      name: string;
      address: string;
    };
  }>;
  receivedDateTime: string;
  isRead: boolean;
  importance: string;
  hasAttachments: boolean;
}

export interface CalendarEvent {
  id: string;
  subject: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  attendees: Array<{
    emailAddress: {
      name: string;
      address: string;
    };
    status: {
      response: string;
    };
  }>;
  location: {
    displayName: string;
  };
  isOnlineMeeting: boolean;
  onlineMeetingProvider: string;
}

export interface SyncStatus {
  lastSyncTime: string;
  emailsSynced: number;
  calendarEventsSynced: number;
  errors: string[];
}

class MicrosoftGraphService {
  private client: Client;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor() {
    this.client = new Client({
      auth: {
        clientId: process.env.MICROSOFT_CLIENT_ID || '',
        clientSecret: process.env.MICROSOFT_CLIENT_SECRET || '',
        authority: 'https://login.microsoftonline.com/common'
      }
    });
  }

  // OAuth 2.0 Authentication Flow
  async getAuthUrl(): Promise<string> {
    const authUrlParameters = {
      scopes: [
        'https://graph.microsoft.com/Mail.Read',
        'https://graph.microsoft.com/Calendars.Read',
        'https://graph.microsoft.com/User.Read',
        'https://graph.microsoft.com/offline_access'
      ],
      redirectUri: process.env.MICROSOFT_REDIRECT_URI || 'http://localhost:3000/auth/microsoft/callback'
    };

    return await this.client.getAuthCodeUrl(authUrlParameters);
  }

  // Exchange authorization code for access token
  async exchangeCodeForToken(code: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const tokenRequest = {
        code: code,
        scopes: [
          'https://graph.microsoft.com/Mail.Read',
          'https://graph.microsoft.com/Calendars.Read',
          'https://graph.microsoft.com/User.Read',
          'https://graph.microsoft.com/offline_access'
        ],
        redirectUri: process.env.MICROSOFT_REDIRECT_URI || 'http://localhost:3000/auth/microsoft/callback'
      };

      const response = await this.client.acquireTokenByCode(tokenRequest);
      
      this.accessToken = response.accessToken;
      this.refreshToken = response.refreshToken;
      this.tokenExpiry = Date.now() + (response.expiresOn?.getTime() || 0);

      return {
        accessToken: response.accessToken,
        refreshToken: response.refreshToken || ''
      };
    } catch (error) {
      console.error('Error exchanging code for token:', error);
      throw new Error('Failed to authenticate with Microsoft 365');
    }
  }

  // Refresh access token
  async refreshAccessToken(): Promise<string> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await this.client.acquireTokenSilent({
        scopes: [
          'https://graph.microsoft.com/Mail.Read',
          'https://graph.microsoft.com/Calendars.Read',
          'https://graph.microsoft.com/User.Read'
        ],
        account: null // Will use cached account
      });

      this.accessToken = response.accessToken;
      this.tokenExpiry = Date.now() + (response.expiresOn?.getTime() || 0);

      return response.accessToken;
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw new Error('Failed to refresh access token');
    }
  }

  // Get current user information
  async getCurrentUser(): Promise<MicrosoftUser> {
    const token = await this.getValidToken();
    
    const response = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get user info: ${response.statusText}`);
    }

    return await response.json();
  }

  // Sync emails from Outlook
  async syncEmails(userId: string, lastSyncTime?: string): Promise<EmailMessage[]> {
    const token = await this.getValidToken();
    
    let url = `https://graph.microsoft.com/v1.0/me/messages?$orderby=receivedDateTime desc&$top=50`;
    
    if (lastSyncTime) {
      url += `&$filter=receivedDateTime ge ${lastSyncTime}`;
    }

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch emails: ${response.statusText}`);
    }

    const data = await response.json();
    return data.value || [];
  }

  // Sync calendar events
  async syncCalendarEvents(userId: string, startDate?: string, endDate?: string): Promise<CalendarEvent[]> {
    const token = await this.getValidToken();
    
    let url = `https://graph.microsoft.com/v1.0/me/events?$orderby=start/dateTime`;
    
    if (startDate && endDate) {
      url += `&$filter=start/dateTime ge '${startDate}' and start/dateTime le '${endDate}'`;
    }

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch calendar events: ${response.statusText}`);
    }

    const data = await response.json();
    return data.value || [];
  }

  // Send email through Microsoft Graph
  async sendEmail(to: string[], subject: string, body: string, isHtml: boolean = true): Promise<void> {
    const token = await this.getValidToken();
    
    const emailData = {
      message: {
        subject: subject,
        body: {
          contentType: isHtml ? 'HTML' : 'Text',
          content: body
        },
        toRecipients: to.map(email => ({
          emailAddress: {
            address: email
          }
        }))
      }
    };

    const response = await fetch('https://graph.microsoft.com/v1.0/me/sendMail', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailData)
    });

    if (!response.ok) {
      throw new Error(`Failed to send email: ${response.statusText}`);
    }
  }

  // Create calendar event
  async createCalendarEvent(
    subject: string,
    startTime: string,
    endTime: string,
    attendees: string[],
    location?: string,
    isOnlineMeeting: boolean = false
  ): Promise<CalendarEvent> {
    const token = await this.getValidToken();
    
    const eventData = {
      subject: subject,
      start: {
        dateTime: startTime,
        timeZone: 'UTC'
      },
      end: {
        dateTime: endTime,
        timeZone: 'UTC'
      },
      attendees: attendees.map(email => ({
        emailAddress: {
          address: email
        }
      })),
      isOnlineMeeting: isOnlineMeeting,
      onlineMeetingProvider: isOnlineMeeting ? 'teamsForBusiness' : undefined
    };

    if (location) {
      eventData.location = { displayName: location };
    }

    const response = await fetch('https://graph.microsoft.com/v1.0/me/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(eventData)
    });

    if (!response.ok) {
      throw new Error(`Failed to create calendar event: ${response.statusText}`);
    }

    return await response.json();
  }

  // Get valid access token (refresh if needed)
  private async getValidToken(): Promise<string> {
    if (!this.accessToken || Date.now() >= this.tokenExpiry - 300000) { // Refresh 5 minutes before expiry
      if (this.refreshToken) {
        await this.refreshAccessToken();
      } else {
        throw new Error('No valid token available. Please re-authenticate.');
      }
    }

    return this.accessToken!;
  }

  // Store tokens for user
  async storeTokensForUser(userId: string, accessToken: string, refreshToken: string): Promise<void> {
    // Store in database or secure storage
    // This would typically involve saving to a user_tokens table
    console.log(`Storing tokens for user ${userId}`);
  }

  // Get stored tokens for user
  async getStoredTokensForUser(userId: string): Promise<{ accessToken: string; refreshToken: string } | null> {
    // Retrieve from database or secure storage
    // This would typically involve querying a user_tokens table
    console.log(`Retrieving tokens for user ${userId}`);
    return null;
  }
}

export default new MicrosoftGraphService();
