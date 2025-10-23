// Microsoft 365 Sync Component
import React, { useState, useEffect } from 'react';
import { 
  CloudIcon, 
  EnvelopeIcon, 
  CalendarIcon, 
  UserGroupIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  CogIcon
} from '@heroicons/react/24/outline';

interface SyncStatus {
  emails: {
    lastSync: string | null;
    count: number;
    errors: number;
  };
  calendar: {
    lastSync: string | null;
    count: number;
    errors: number;
  };
  contacts: {
    lastSync: string | null;
    count: number;
    errors: number;
  };
}

interface Microsoft365SyncProps {
  userId: string;
  currentUser: any;
}

const Microsoft365Sync: React.FC<Microsoft365SyncProps> = ({ userId, currentUser }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authUrl, setAuthUrl] = useState<string | null>(null);

  // Check authentication status
  useEffect(() => {
    checkAuthenticationStatus();
  }, [userId]);

  const checkAuthenticationStatus = async () => {
    try {
      const response = await fetch(`http://localhost:3054/api/microsoft/sync-status/${userId}`);
      const data = await response.json();
      
      if (data.success) {
        setIsAuthenticated(data.syncStatus.length > 0);
        setSyncStatus(data.syncStatus);
      }
    } catch (error) {
      console.error('Error checking authentication status:', error);
    }
  };

  const handleConnectMicrosoft = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:3054/api/microsoft/auth-url');
      const data = await response.json();
      
      if (data.success) {
        setAuthUrl(data.authUrl);
        // Open Microsoft authentication in new window
        window.open(data.authUrl, 'microsoft-auth', 'width=600,height=600');
      }
    } catch (error) {
      console.error('Error getting auth URL:', error);
      setError('Failed to get authentication URL');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncEmails = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:3054/api/microsoft/sync-emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          lastSyncTime: syncStatus?.emails.lastSync
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setError(null);
        await checkAuthenticationStatus(); // Refresh sync status
      } else {
        setError(data.message || 'Failed to sync emails');
      }
    } catch (error) {
      console.error('Error syncing emails:', error);
      setError('Failed to sync emails');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncCalendar = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:3054/api/microsoft/sync-calendar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // Last 30 days
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // Next 30 days
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setError(null);
        await checkAuthenticationStatus(); // Refresh sync status
      } else {
        setError(data.message || 'Failed to sync calendar');
      }
    } catch (error) {
      console.error('Error syncing calendar:', error);
      setError('Failed to sync calendar');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncAll = async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        handleSyncEmails(),
        handleSyncCalendar()
      ]);
    } catch (error) {
      console.error('Error syncing all:', error);
      setError('Failed to sync all data');
    } finally {
      setIsLoading(false);
    }
  };

  const formatLastSync = (lastSync: string | null) => {
    if (!lastSync) return 'Never';
    return new Date(lastSync).toLocaleString();
  };

  const getSyncStatusIcon = (count: number, errors: number) => {
    if (errors > 0) {
      return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
    }
    if (count > 0) {
      return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
    }
    return <ArrowPathIcon className="h-5 w-5 text-gray-400" />;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <CloudIcon className="h-8 w-8 text-blue-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Microsoft 365 Integration</h3>
            <p className="text-sm text-gray-500">Sync your Outlook emails and calendar with the CRM</p>
          </div>
        </div>
        
        {!isAuthenticated && (
          <button
            onClick={handleConnectMicrosoft}
            disabled={isLoading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <CogIcon className="h-4 w-4" />
            Connect Microsoft 365
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        </div>
      )}

      {isAuthenticated ? (
        <div className="space-y-4">
          {/* Sync Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <EnvelopeIcon className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-gray-900">Emails</span>
                </div>
                {getSyncStatusIcon(syncStatus?.emails.count || 0, syncStatus?.emails.errors || 0)}
              </div>
              <p className="text-sm text-gray-500">
                Last sync: {formatLastSync(syncStatus?.emails.lastSync)}
              </p>
              <p className="text-xs text-gray-400">
                {syncStatus?.emails.count || 0} items synced
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-gray-900">Calendar</span>
                </div>
                {getSyncStatusIcon(syncStatus?.calendar.count || 0, syncStatus?.calendar.errors || 0)}
              </div>
              <p className="text-sm text-gray-500">
                Last sync: {formatLastSync(syncStatus?.calendar.lastSync)}
              </p>
              <p className="text-xs text-gray-400">
                {syncStatus?.calendar.count || 0} items synced
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <UserGroupIcon className="h-5 w-5 text-purple-600" />
                  <span className="font-medium text-gray-900">Contacts</span>
                </div>
                {getSyncStatusIcon(syncStatus?.contacts.count || 0, syncStatus?.contacts.errors || 0)}
              </div>
              <p className="text-sm text-gray-500">
                Last sync: {formatLastSync(syncStatus?.contacts.lastSync)}
              </p>
              <p className="text-xs text-gray-400">
                {syncStatus?.contacts.count || 0} items synced
              </p>
            </div>
          </div>

          {/* Sync Actions */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleSyncEmails}
              disabled={isLoading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <EnvelopeIcon className="h-4 w-4" />
              Sync Emails
            </button>

            <button
              onClick={handleSyncCalendar}
              disabled={isLoading}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <CalendarIcon className="h-4 w-4" />
              Sync Calendar
            </button>

            <button
              onClick={handleSyncAll}
              disabled={isLoading}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <ArrowPathIcon className="h-4 w-4" />
              Sync All
            </button>
          </div>

          {isLoading && (
            <div className="flex items-center gap-2 text-blue-600">
              <ArrowPathIcon className="h-4 w-4 animate-spin" />
              <span className="text-sm">Syncing data...</span>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <CloudIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">Connect Microsoft 365</h4>
          <p className="text-gray-500 mb-4">
            Connect your Microsoft 365 account to sync emails, calendar events, and contacts with the CRM.
          </p>
          <button
            onClick={handleConnectMicrosoft}
            disabled={isLoading}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
          >
            <CogIcon className="h-5 w-5" />
            Connect Microsoft 365
          </button>
        </div>
      )}
    </div>
  );
};

export default Microsoft365Sync;
