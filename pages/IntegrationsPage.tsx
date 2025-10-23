import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import { 
  Cog6ToothIcon, 
  PlusIcon, 
  MagnifyingGlassIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  LinkIcon,
  CloudIcon,
  ServerIcon,
  DatabaseIcon
} from '../components/icons/Icons';

interface Integration {
  id: string;
  name: string;
  description: string;
  type: 'API' | 'Database' | 'File Transfer' | 'Webhook' | 'Cloud Service';
  status: 'Active' | 'Inactive' | 'Error' | 'Pending';
  provider: string;
  endpoint?: string;
  authentication: 'API Key' | 'OAuth' | 'Basic Auth' | 'Certificate' | 'None';
  lastSync?: string;
  syncFrequency: 'Real-time' | 'Hourly' | 'Daily' | 'Weekly' | 'Manual';
  dataFlow: 'Inbound' | 'Outbound' | 'Bidirectional';
  errorCount: number;
  successRate: number;
  createdAt: string;
  updatedAt: string;
}

interface APIConnection {
  id: string;
  name: string;
  baseUrl: string;
  authentication: string;
  status: 'Connected' | 'Disconnected' | 'Error';
  lastTested: string;
  responseTime: number;
  endpoints: string[];
  rateLimit: number;
  usage: number;
  createdAt: string;
  updatedAt: string;
}

const IntegrationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'integrations' | 'connections' | 'logs'>('integrations');
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [connections, setConnections] = useState<APIConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    // Mock data for integrations
    const mockIntegrations: Integration[] = [
      {
        id: '1',
        name: 'ArcGIS Online',
        description: 'Geographic information system integration for mapping and spatial data',
        type: 'API',
        status: 'Active',
        provider: 'Esri',
        endpoint: 'https://services.arcgis.com',
        authentication: 'OAuth',
        lastSync: '2024-01-18T10:30:00Z',
        syncFrequency: 'Real-time',
        dataFlow: 'Bidirectional',
        errorCount: 2,
        successRate: 98.5,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-18T10:30:00Z'
      },
      {
        id: '2',
        name: 'Production Database',
        description: 'Real-time production data synchronization from field systems',
        type: 'Database',
        status: 'Active',
        provider: 'Internal',
        endpoint: 'mysql://prod-db.internal:3306',
        authentication: 'Certificate',
        lastSync: '2024-01-18T10:25:00Z',
        syncFrequency: 'Hourly',
        dataFlow: 'Inbound',
        errorCount: 0,
        successRate: 100,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-18T10:25:00Z'
      },
      {
        id: '3',
        name: 'Regulatory API',
        description: 'Government regulatory compliance data and permit information',
        type: 'API',
        status: 'Error',
        provider: 'Texas Railroad Commission',
        endpoint: 'https://api.rrc.texas.gov',
        authentication: 'API Key',
        lastSync: '2024-01-17T14:00:00Z',
        syncFrequency: 'Daily',
        dataFlow: 'Inbound',
        errorCount: 15,
        successRate: 85.2,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-18T08:00:00Z'
      },
      {
        id: '4',
        name: 'Financial System',
        description: 'Accounting and financial reporting system integration',
        type: 'API',
        status: 'Pending',
        provider: 'QuickBooks',
        endpoint: 'https://sandbox-quickbooks.api.intuit.com',
        authentication: 'OAuth',
        syncFrequency: 'Daily',
        dataFlow: 'Bidirectional',
        errorCount: 0,
        successRate: 0,
        createdAt: '2024-01-15T00:00:00Z',
        updatedAt: '2024-01-15T00:00:00Z'
      }
    ];

    // Mock data for API connections
    const mockConnections: APIConnection[] = [
      {
        id: '1',
        name: 'ArcGIS REST API',
        baseUrl: 'https://services.arcgis.com',
        authentication: 'OAuth 2.0',
        status: 'Connected',
        lastTested: '2024-01-18T10:30:00Z',
        responseTime: 245,
        endpoints: ['/map', '/query', '/geocode'],
        rateLimit: 1000,
        usage: 150,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-18T10:30:00Z'
      },
      {
        id: '2',
        name: 'Weather API',
        baseUrl: 'https://api.openweathermap.org',
        authentication: 'API Key',
        status: 'Connected',
        lastTested: '2024-01-18T10:25:00Z',
        responseTime: 180,
        endpoints: ['/weather', '/forecast'],
        rateLimit: 100,
        usage: 45,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-18T10:25:00Z'
      },
      {
        id: '3',
        name: 'Regulatory API',
        baseUrl: 'https://api.rrc.texas.gov',
        authentication: 'API Key',
        status: 'Error',
        lastTested: '2024-01-17T14:00:00Z',
        responseTime: 0,
        endpoints: ['/permits', '/violations'],
        rateLimit: 500,
        usage: 0,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-18T08:00:00Z'
      }
    ];
    
    setIntegrations(mockIntegrations);
    setConnections(mockConnections);
    setLoading(false);
  }, []);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'API':
        return <LinkIcon className="w-5 h-5 text-blue-500" />;
      case 'Database':
        return <DatabaseIcon className="w-5 h-5 text-green-500" />;
      case 'File Transfer':
        return <ServerIcon className="w-5 h-5 text-purple-500" />;
      case 'Webhook':
        return <CloudIcon className="w-5 h-5 text-orange-500" />;
      case 'Cloud Service':
        return <CloudIcon className="w-5 h-5 text-cyan-500" />;
      default:
        return <Cog6ToothIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Active':
      case 'Connected':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'Inactive':
      case 'Disconnected':
        return <XCircleIcon className="w-5 h-5 text-gray-500" />;
      case 'Error':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />;
      case 'Pending':
        return <ClockIcon className="w-5 h-5 text-yellow-500" />;
      default:
        return <ExclamationTriangleIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
      case 'Connected':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Inactive':
      case 'Disconnected':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'Error':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 95) return 'text-green-600';
    if (rate >= 85) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading integration data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Integration Hub</h1>
          <p className="text-gray-600">Third-party system integrations and APIs</p>
        </div>
        <button
          onClick={() => navigate('/integrations/new')}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          Add Integration
        </button>
      </div>

      {/* Integration Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <LinkIcon className="w-6 h-6 text-blue-500" />
            <div>
              <div className="text-sm text-gray-500">Total Integrations</div>
              <div className="text-2xl font-bold text-gray-900">{integrations.length}</div>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center gap-3">
            <CheckCircleIcon className="w-6 h-6 text-green-500" />
            <div>
              <div className="text-sm text-gray-500">Active</div>
              <div className="text-2xl font-bold text-gray-900">
                {integrations.filter(i => i.status === 'Active').length}
              </div>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center gap-3">
            <ExclamationTriangleIcon className="w-6 h-6 text-red-500" />
            <div>
              <div className="text-sm text-gray-500">Errors</div>
              <div className="text-2xl font-bold text-gray-900">
                {integrations.filter(i => i.status === 'Error').length}
              </div>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center gap-3">
            <ServerIcon className="w-6 h-6 text-purple-500" />
            <div>
              <div className="text-sm text-gray-500">API Connections</div>
              <div className="text-2xl font-bold text-gray-900">{connections.length}</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('integrations')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'integrations'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Integrations ({integrations.length})
          </button>
          <button
            onClick={() => setActiveTab('connections')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'connections'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            API Connections ({connections.length})
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'logs'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Logs
          </button>
        </nav>
      </div>

      {/* Filters and Search */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="API">API</option>
            <option value="Database">Database</option>
            <option value="File Transfer">File Transfer</option>
            <option value="Webhook">Webhook</option>
            <option value="Cloud Service">Cloud Service</option>
          </select>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Error">Error</option>
            <option value="Pending">Pending</option>
          </select>
          
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="name">Sort by Name</option>
              <option value="status">Sort by Status</option>
              <option value="lastSync">Sort by Last Sync</option>
              <option value="successRate">Sort by Success Rate</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {sortOrder === 'asc' ? <ArrowUpIcon className="w-5 h-5" /> : <ArrowDownIcon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </Card>

      {/* Content based on active tab */}
      {activeTab === 'integrations' ? (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Integration</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Provider</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Success Rate</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Last Sync</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {integrations.map((integration) => (
                  <tr key={integration.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div>
                        <div className="font-medium text-gray-900">{integration.name}</div>
                        <div className="text-sm text-gray-500">{integration.description}</div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(integration.type)}
                        <span className="text-sm font-medium text-gray-900">{integration.type}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(integration.status)}
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(integration.status)}`}>
                          {integration.status}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-gray-900">{integration.provider}</td>
                    <td className="py-4 px-4">
                      <div className={`font-medium ${getSuccessRateColor(integration.successRate)}`}>
                        {integration.successRate}%
                      </div>
                    </td>
                    <td className="py-4 px-4 text-gray-900">{formatDateTime(integration.lastSync)}</td>
                    <td className="py-4 px-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate(`/integrations/${integration.id}`)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          View
                        </button>
                        <button
                          onClick={() => navigate(`/integrations/${integration.id}/edit`)}
                          className="text-gray-600 hover:text-gray-800 text-sm font-medium"
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : activeTab === 'connections' ? (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Connection</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Base URL</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Response Time</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Usage</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Last Tested</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {connections.map((connection) => (
                  <tr key={connection.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div>
                        <div className="font-medium text-gray-900">{connection.name}</div>
                        <div className="text-sm text-gray-500">{connection.authentication}</div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm text-gray-900">{connection.baseUrl}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(connection.status)}
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(connection.status)}`}>
                          {connection.status}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm text-gray-900">
                        {connection.responseTime > 0 ? `${connection.responseTime}ms` : 'N/A'}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm text-gray-900">
                        {connection.usage}/{connection.rateLimit}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-gray-900">{formatDateTime(connection.lastTested)}</td>
                    <td className="py-4 px-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate(`/integrations/connections/${connection.id}`)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          View
                        </button>
                        <button
                          onClick={() => navigate(`/integrations/connections/${connection.id}/test`)}
                          className="text-gray-600 hover:text-gray-800 text-sm font-medium"
                        >
                          Test
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="text-center py-8">
            <Cog6ToothIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Integration Logs</h3>
            <p className="text-gray-500 mb-4">Monitor integration activity, errors, and performance metrics.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
              <div className="bg-blue-50 p-6 rounded-lg">
                <ServerIcon className="w-8 h-8 text-blue-500 mx-auto mb-3" />
                <div className="text-lg font-semibold text-blue-900 mb-2">API Calls</div>
                <div className="text-sm text-blue-700">Track all API requests and responses</div>
              </div>
              <div className="bg-red-50 p-6 rounded-lg">
                <ExclamationTriangleIcon className="w-8 h-8 text-red-500 mx-auto mb-3" />
                <div className="text-lg font-semibold text-red-900 mb-2">Error Logs</div>
                <div className="text-sm text-red-700">Monitor integration errors and failures</div>
              </div>
              <div className="bg-green-50 p-6 rounded-lg">
                <CheckCircleIcon className="w-8 h-8 text-green-500 mx-auto mb-3" />
                <div className="text-lg font-semibold text-green-900 mb-2">Success Metrics</div>
                <div className="text-sm text-green-700">Analyze integration performance and success rates</div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default IntegrationsPage;


