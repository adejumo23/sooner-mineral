# Microsoft 365 Integration Setup Guide

## Overview

This guide will help you set up Microsoft 365 integration with your CRM to sync emails, calendar events, and contacts from Outlook.

## Prerequisites

1. **Microsoft 365 Business or Enterprise account**
2. **Azure Active Directory access** (admin permissions)
3. **Node.js and npm** installed
4. **MySQL database** running

## Step 1: Azure App Registration

### 1.1 Create Azure App Registration

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** > **App registrations**
3. Click **New registration**
4. Fill in the details:
   - **Name**: `Sooner Mineral CRM Integration`
   - **Supported account types**: `Accounts in any organizational directory and personal Microsoft accounts`
   - **Redirect URI**: `Web` - `http://localhost:3000/auth/microsoft/callback`
5. Click **Register**

### 1.2 Configure API Permissions

1. In your app registration, go to **API permissions**
2. Click **Add a permission**
3. Select **Microsoft Graph**
4. Choose **Delegated permissions**
5. Add the following permissions:
   - `Mail.Read`
   - `Calendars.Read`
   - `User.Read`
   - `offline_access`
6. Click **Add permissions**
7. Click **Grant admin consent** (if you have admin rights)

### 1.3 Create Client Secret

1. Go to **Certificates & secrets**
2. Click **New client secret**
3. Add a description: `CRM Integration Secret`
4. Set expiration: `24 months`
5. Click **Add**
6. **Copy the secret value** (you won't see it again)

### 1.4 Get Application ID

1. Go to **Overview** in your app registration
2. Copy the **Application (client) ID**

## Step 2: Environment Configuration

### 2.1 Update .env File

Add these variables to your `.env` file:

```env
# Microsoft 365 Integration
MICROSOFT_CLIENT_ID=your_application_client_id_here
MICROSOFT_CLIENT_SECRET=your_client_secret_here
MICROSOFT_TENANT_ID=common
MICROSOFT_REDIRECT_URI=http://localhost:3000/auth/microsoft/callback

# Microsoft 365 Sync Server
MICROSOFT_SYNC_PORT=3054
```

### 2.2 Install Required Dependencies

```bash
npm install @azure/msal-node
```

## Step 3: Database Setup

### 3.1 Create Microsoft Sync Tables

Run the SQL script to create the necessary tables:

```bash
mysql -u root -p soonermineraldb < database/05-create-microsoft-sync-tables.sql
```

### 3.2 Verify Tables Created

Check that these tables were created:
- `user_microsoft_tokens`
- `user_sync_status`
- `microsoft_contacts`
- `microsoft_calendar_events`
- `microsoft_email_threads`
- `microsoft_sync_logs`

## Step 4: Start Microsoft Sync Server

### 4.1 Start the Sync Server

```bash
node server-microsoft-sync.js
```

You should see:
```
✅ Microsoft Sync database connection pool created
🚀 Microsoft 365 Sync API server running on port 3054
📊 Database: MySQL (soonermineraldb)
🔗 Health check: http://localhost:3054/api/health
```

### 4.2 Test the Connection

```bash
curl http://localhost:3054/api/health
```

Expected response:
```json
{
  "success": true,
  "message": "Microsoft 365 Sync API is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "port": 3054
}
```

## Step 5: Frontend Integration

### 5.1 Update Message Center

The Message Center now includes a **Microsoft 365** button that allows users to:
- Connect their Microsoft 365 account
- Sync emails from Outlook
- Sync calendar events
- View sync status and history

### 5.2 User Authentication Flow

1. User clicks **Microsoft 365** button in Message Center
2. System generates authentication URL
3. User is redirected to Microsoft login
4. User authorizes the application
5. System receives authorization code
6. System exchanges code for access tokens
7. Tokens are stored securely in database
8. User can now sync data

## Step 6: Testing the Integration

### 6.1 Test Authentication

1. Go to Message Center
2. Click **Microsoft 365** button
3. Click **Connect Microsoft 365**
4. Complete Microsoft authentication
5. Verify connection status shows as connected

### 6.2 Test Email Sync

1. Click **Sync Emails** button
2. Check that emails appear in Message Center
3. Verify email details are correct

### 6.3 Test Calendar Sync

1. Click **Sync Calendar** button
2. Check that calendar events appear
3. Verify event details are correct

## Step 7: Production Deployment

### 7.1 Update Redirect URI

For production, update the redirect URI in Azure:
- Change from `http://localhost:3000/auth/microsoft/callback`
- To `https://yourdomain.com/auth/microsoft/callback`

### 7.2 Environment Variables

Update production environment variables:
```env
MICROSOFT_REDIRECT_URI=https://yourdomain.com/auth/microsoft/callback
MICROSOFT_SYNC_HOST=yourdomain.com
```

### 7.3 SSL Certificate

Ensure your production server has a valid SSL certificate for HTTPS.

## Troubleshooting

### Common Issues

#### 1. Authentication Fails
- **Issue**: "Invalid client" error
- **Solution**: Check `MICROSOFT_CLIENT_ID` and `MICROSOFT_CLIENT_SECRET`
- **Verify**: Azure app registration is correct

#### 2. Permission Denied
- **Issue**: "Insufficient privileges" error
- **Solution**: Grant admin consent for API permissions
- **Verify**: All required permissions are granted

#### 3. Database Connection Failed
- **Issue**: "Table doesn't exist" error
- **Solution**: Run the database setup script
- **Verify**: All tables are created successfully

#### 4. Sync Fails
- **Issue**: "Failed to sync" error
- **Solution**: Check user tokens are valid
- **Verify**: Microsoft Graph API is accessible

### Debug Steps

1. **Check server logs** for error messages
2. **Verify database connection** is working
3. **Test API endpoints** individually
4. **Check user permissions** in Azure
5. **Validate environment variables** are correct

## Security Considerations

### 1. Token Storage
- Tokens are encrypted in the database
- Refresh tokens are used to maintain access
- Tokens expire automatically for security

### 2. Permission Scope
- Only required permissions are requested
- Users can revoke access at any time
- Admin consent is required for organization-wide access

### 3. Data Privacy
- Only necessary data is synced
- Users control what data is shared
- Data is stored securely in your database

## API Endpoints

### Authentication
- `GET /api/microsoft/auth-url` - Get authentication URL
- `POST /api/microsoft/exchange-token` - Exchange code for tokens

### Sync Operations
- `POST /api/microsoft/sync-emails` - Sync emails from Outlook
- `POST /api/microsoft/sync-calendar` - Sync calendar events
- `GET /api/microsoft/sync-status/:userId` - Get sync status

### Data Management
- `GET /api/microsoft/emails/:userId` - Get synced emails
- `GET /api/microsoft/calendar-events/:userId` - Get calendar events
- `GET /api/microsoft/contacts/:userId` - Get contacts

## Support

For technical support or questions about Microsoft 365 integration:

1. **Check the logs** for error messages
2. **Verify Azure configuration** is correct
3. **Test API endpoints** individually
4. **Check user permissions** and consent
5. **Validate environment variables** are set correctly

## Conclusion

The Microsoft 365 integration provides seamless synchronization between your CRM and Outlook, enabling users to:
- View all communications in one place
- Sync calendar events automatically
- Access contact information from Outlook
- Maintain data consistency across platforms

This integration enhances productivity by reducing context-switching and ensuring all communication data is centralized in your CRM system.
