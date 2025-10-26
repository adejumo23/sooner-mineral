// Microsoft 365 Sync Server
import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import dotenv from 'dotenv';
import { ConfidentialClientApplication } from '@azure/msal-node';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3054;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
let dbPool;

const initializeDatabase = async () => {
  try {
    dbPool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3359,
      user: process.env.MYSQL_USER || 'soonermineral',
      password: process.env.MYSQL_PASSWORD || 'soonermineralpass',
      database: process.env.MYSQL_DATABASE || 'soonermineraldb',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    console.log('✅ Microsoft Sync database connection pool created');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

// Microsoft Graph API client (only initialize if credentials are available)
let msalClient = null;
if (process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET) {
  msalClient = new ConfidentialClientApplication({
    auth: {
      clientId: process.env.MICROSOFT_CLIENT_ID,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
      authority: 'https://login.microsoftonline.com/common'
    }
  });
}

// ============================================================================
// MICROSOFT 365 SYNC API ENDPOINTS
// ============================================================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Microsoft 365 Sync API is running',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Get Microsoft 365 authentication URL
app.get('/api/microsoft/auth-url', async (req, res) => {
  try {
    if (!msalClient) {
      return res.status(400).json({
        success: false,
        message: 'Microsoft 365 integration not configured. Please set MICROSOFT_CLIENT_ID and MICROSOFT_CLIENT_SECRET environment variables.'
      });
    }

    const authUrlParameters = {
      scopes: [
        'https://graph.microsoft.com/Mail.Read',
        'https://graph.microsoft.com/Calendars.Read',
        'https://graph.microsoft.com/User.Read',
        'https://graph.microsoft.com/offline_access'
      ],
      redirectUri: process.env.MICROSOFT_REDIRECT_URI || 'http://localhost:3000/auth/microsoft/callback'
    };

    const authUrl = await msalClient.getAuthCodeUrl(authUrlParameters);
    
    res.json({
      success: true,
      authUrl: authUrl
    });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate authentication URL',
      error: error.message
    });
  }
});

// Exchange authorization code for tokens
app.post('/api/microsoft/exchange-token', async (req, res) => {
  try {
    const { code, userId } = req.body;

    if (!code || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Authorization code and user ID are required'
      });
    }

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

    const response = await msalClient.acquireTokenByCode(tokenRequest);
    
    // Store tokens in database
    await storeUserTokens(userId, response.accessToken, response.refreshToken, response.expiresOn);

    res.json({
      success: true,
      message: 'Tokens stored successfully',
      expiresIn: response.expiresOn?.getTime() - Date.now()
    });
  } catch (error) {
    console.error('Error exchanging token:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to exchange authorization code',
      error: error.message
    });
  }
});

// Sync emails from Outlook
app.post('/api/microsoft/sync-emails', async (req, res) => {
  try {
    const { userId, lastSyncTime } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Get stored tokens
    const tokens = await getUserTokens(userId);
    if (!tokens) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated with Microsoft 365'
      });
    }

    // Fetch emails from Microsoft Graph
    const emails = await fetchEmailsFromGraph(tokens.accessToken, lastSyncTime);
    
    // Store emails in communications table
    const syncedEmails = await storeEmailsInDatabase(userId, emails);

    // Update last sync time
    await updateLastSyncTime(userId, 'emails');

    res.json({
      success: true,
      message: 'Emails synced successfully',
      syncedCount: syncedEmails.length,
      emails: syncedEmails
    });
  } catch (error) {
    console.error('Error syncing emails:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync emails',
      error: error.message
    });
  }
});

// Sync calendar events
app.post('/api/microsoft/sync-calendar', async (req, res) => {
  try {
    const { userId, startDate, endDate } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Get stored tokens
    const tokens = await getUserTokens(userId);
    if (!tokens) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated with Microsoft 365'
      });
    }

    // Fetch calendar events from Microsoft Graph
    const events = await fetchCalendarEventsFromGraph(tokens.accessToken, startDate, endDate);
    
    // Store calendar events in database
    const syncedEvents = await storeCalendarEventsInDatabase(userId, events);

    // Update last sync time
    await updateLastSyncTime(userId, 'calendar');

    res.json({
      success: true,
      message: 'Calendar events synced successfully',
      syncedCount: syncedEvents.length,
      events: syncedEvents
    });
  } catch (error) {
    console.error('Error syncing calendar:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync calendar events',
      error: error.message
    });
  }
});

// Get sync status
app.get('/api/microsoft/sync-status/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const syncStatus = await getSyncStatus(userId);

    res.json({
      success: true,
      syncStatus: syncStatus
    });
  } catch (error) {
    console.error('Error getting sync status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get sync status',
      error: error.message
    });
  }
});

// Send email through Microsoft Graph
app.post('/api/microsoft/send-email', async (req, res) => {
  try {
    const { userId, to, subject, body, isHtml = true } = req.body;

    if (!userId || !to || !subject || !body) {
      return res.status(400).json({
        success: false,
        message: 'User ID, recipients, subject, and body are required'
      });
    }

    // Get stored tokens
    const tokens = await getUserTokens(userId);
    if (!tokens) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated with Microsoft 365'
      });
    }

    // Send email through Microsoft Graph
    await sendEmailThroughGraph(tokens.accessToken, to, subject, body, isHtml);

    res.json({
      success: true,
      message: 'Email sent successfully'
    });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send email',
      error: error.message
    });
  }
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Store user tokens in database
async function storeUserTokens(userId, accessToken, refreshToken, expiresOn) {
  const query = `
    INSERT INTO user_microsoft_tokens (user_id, access_token, refresh_token, expires_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, NOW(), NOW())
    ON DUPLICATE KEY UPDATE
    access_token = VALUES(access_token),
    refresh_token = VALUES(refresh_token),
    expires_at = VALUES(expires_at),
    updated_at = NOW()
  `;

  await dbPool.execute(query, [userId, accessToken, refreshToken, expiresOn]);
}

// Get user tokens from database
async function getUserTokens(userId) {
  const query = `
    SELECT access_token, refresh_token, expires_at
    FROM user_microsoft_tokens
    WHERE user_id = ?
    ORDER BY updated_at DESC
    LIMIT 1
  `;

  const [rows] = await dbPool.execute(query, [userId]);
  return rows.length > 0 ? rows[0] : null;
}

// Fetch emails from Microsoft Graph
async function fetchEmailsFromGraph(accessToken, lastSyncTime) {
  let url = `https://graph.microsoft.com/v1.0/me/messages?$orderby=receivedDateTime desc&$top=50`;
  
  if (lastSyncTime) {
    url += `&$filter=receivedDateTime ge ${lastSyncTime}`;
  }

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch emails: ${response.statusText}`);
  }

  const data = await response.json();
  return data.value || [];
}

// Fetch calendar events from Microsoft Graph
async function fetchCalendarEventsFromGraph(accessToken, startDate, endDate) {
  let url = `https://graph.microsoft.com/v1.0/me/events?$orderby=start/dateTime`;
  
  if (startDate && endDate) {
    url += `&$filter=start/dateTime ge '${startDate}' and start/dateTime le '${endDate}'`;
  }

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch calendar events: ${response.statusText}`);
  }

  const data = await response.json();
  return data.value || [];
}

// Store emails in database
async function storeEmailsInDatabase(userId, emails) {
  const syncedEmails = [];

  for (const email of emails) {
    const communicationId = `comm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const query = `
      INSERT INTO communications (
        id, user_id, method, direction, subject, message_snippet, 
        full_message, outcome, timestamp, email_address, 
        created_at, updated_at
      ) VALUES (?, ?, 'Email', 'Inbound', ?, ?, ?, 'Delivered', ?, ?, NOW(), NOW())
    `;

    await dbPool.execute(query, [
      communicationId,
      userId,
      email.subject,
      email.body?.content?.substring(0, 500) || '',
      email.body?.content || '',
      email.receivedDateTime,
      email.from?.emailAddress?.address || ''
    ]);

    syncedEmails.push({
      id: communicationId,
      subject: email.subject,
      receivedDateTime: email.receivedDateTime
    });
  }

  return syncedEmails;
}

// Store calendar events in database
async function storeCalendarEventsInDatabase(userId, events) {
  const syncedEvents = [];

  for (const event of events) {
    const communicationId = `comm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const query = `
      INSERT INTO communications (
        id, user_id, method, direction, subject, message_snippet,
        outcome, timestamp, created_at, updated_at
      ) VALUES (?, ?, 'Call', 'Inbound', ?, ?, 'Delivered', ?, NOW(), NOW())
    `;

    const eventDescription = `Calendar Event: ${event.subject}\nStart: ${event.start?.dateTime}\nEnd: ${event.end?.dateTime}\nLocation: ${event.location?.displayName || 'N/A'}`;

    await dbPool.execute(query, [
      communicationId,
      userId,
      `Meeting: ${event.subject}`,
      eventDescription,
      event.start?.dateTime
    ]);

    syncedEvents.push({
      id: communicationId,
      subject: event.subject,
      startTime: event.start?.dateTime
    });
  }

  return syncedEvents;
}

// Send email through Microsoft Graph
async function sendEmailThroughGraph(accessToken, to, subject, body, isHtml) {
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
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(emailData)
  });

  if (!response.ok) {
    throw new Error(`Failed to send email: ${response.statusText}`);
  }
}

// Update last sync time
async function updateLastSyncTime(userId, syncType) {
  const query = `
    INSERT INTO user_sync_status (user_id, sync_type, last_sync_time, created_at, updated_at)
    VALUES (?, ?, NOW(), NOW(), NOW())
    ON DUPLICATE KEY UPDATE
    last_sync_time = NOW(),
    updated_at = NOW()
  `;

  await dbPool.execute(query, [userId, syncType]);
}

// Get sync status
async function getSyncStatus(userId) {
  const query = `
    SELECT sync_type, last_sync_time
    FROM user_sync_status
    WHERE user_id = ?
  `;

  const [rows] = await dbPool.execute(query, [userId]);
  return rows;
}

// ============================================================================
// START SERVER
// ============================================================================

const startServer = async () => {
  try {
    await initializeDatabase();
    
    app.listen(PORT, () => {
      console.log(`🚀 Microsoft 365 Sync API server running on port ${PORT}`);
      console.log(`📊 Database: MySQL (${process.env.MYSQL_DATABASE || 'soonermineraldb'})`);
      console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
