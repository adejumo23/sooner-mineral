import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import { 
  ShieldExclamationIcon, 
  PlusIcon, 
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  DocumentIcon,
  CalendarIcon
} from '../components/icons/Icons';

interface Permit {
  id: string;
  permitNumber: string;
  operator: string;
  latitude: number;
  longitude: number;
  permitType: 'Drilling' | 'Recompletion' | 'Workover' | 'Abandonment';
  permitDate: string;
  spudDate?: string;
  totalDepth?: number;
  targetFormation?: string;
  status: 'Pending' | 'Approved' | 'Drilling' | 'Completed' | 'Abandoned';
  county: string;
  state: string;
  apiNumber?: string;
  wellName?: string;
  createdAt: string;
  updatedAt: string;
}

interface Violation {
  id: string;
  operatorName: string;
  apiNumber?: string;
  violationType: 'Environmental' | 'Safety' | 'Compliance' | 'Financial' | 'Other';
  violationDescription: string;
  violationDate: string;
  penaltyAmount?: number;
  resolutionStatus: 'Open' | 'Resolved' | 'Appealed' | 'Dismissed';
  resolutionDate?: string;
  repeatOffender: boolean;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  affectedTracts?: string[];
  affectedUnits?: string[];
  createdAt: string;
  updatedAt: string;
}

const CompliancePage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'permits' | 'violations'>('permits');
  const [permits, setPermits] = useState<Permit[]>([]);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('permitDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    // Mock data for permits
    const mockPermits: Permit[] = [
      {
        id: '1',
        permitNumber: 'P-2024-001',
        operator: 'Pioneer Natural Resources',
        latitude: 31.9686,
        longitude: -99.9018,
        permitType: 'Drilling',
        permitDate: '2024-01-15',
        spudDate: '2024-01-20',
        totalDepth: 12500,
        targetFormation: 'Wolfcamp',
        status: 'Drilling',
        county: 'Midland',
        state: 'TX',
        apiNumber: '42-001-12345-00-00',
        wellName: 'Smith #1H',
        createdAt: '2024-01-15T08:00:00Z',
        updatedAt: '2024-01-20T10:30:00Z'
      },
      {
        id: '2',
        permitNumber: 'P-2024-002',
        operator: 'EOG Resources',
        latitude: 31.9786,
        longitude: -99.9118,
        permitType: 'Recompletion',
        permitDate: '2024-01-10',
        spudDate: '2024-01-25',
        totalDepth: 11800,
        targetFormation: 'Bone Spring',
        status: 'Approved',
        county: 'Midland',
        state: 'TX',
        apiNumber: '42-001-12346-00-00',
        wellName: 'Johnson #2H',
        createdAt: '2024-01-10T09:00:00Z',
        updatedAt: '2024-01-15T14:00:00Z'
      },
      {
        id: '3',
        permitNumber: 'P-2024-003',
        operator: 'Diamondback Energy',
        latitude: 31.9586,
        longitude: -99.8918,
        permitType: 'Abandonment',
        permitDate: '2024-01-05',
        status: 'Completed',
        county: 'Midland',
        state: 'TX',
        apiNumber: '42-001-12347-00-00',
        wellName: 'Williams #3H',
        createdAt: '2024-01-05T10:00:00Z',
        updatedAt: '2024-01-30T16:00:00Z'
      }
    ];

    // Mock data for violations
    const mockViolations: Violation[] = [
      {
        id: '1',
        operatorName: 'Pioneer Natural Resources',
        apiNumber: '42-001-12345-00-00',
        violationType: 'Environmental',
        violationDescription: 'Exceeded permitted emissions during drilling operations',
        violationDate: '2024-01-15',
        penaltyAmount: 25000,
        resolutionStatus: 'Open',
        repeatOffender: false,
        riskLevel: 'Medium',
        affectedTracts: ['tract_1', 'tract_2'],
        createdAt: '2024-01-15T12:00:00Z',
        updatedAt: '2024-01-15T12:00:00Z'
      },
      {
        id: '2',
        operatorName: 'EOG Resources',
        apiNumber: '42-001-12346-00-00',
        violationType: 'Safety',
        violationDescription: 'Inadequate safety equipment on drilling rig',
        violationDate: '2024-01-10',
        penaltyAmount: 15000,
        resolutionStatus: 'Resolved',
        resolutionDate: '2024-01-25',
        repeatOffender: true,
        riskLevel: 'High',
        affectedTracts: ['tract_3'],
        createdAt: '2024-01-10T14:00:00Z',
        updatedAt: '2024-01-25T10:00:00Z'
      },
      {
        id: '3',
        operatorName: 'Diamondback Energy',
        violationType: 'Compliance',
        violationDescription: 'Late filing of production reports',
        violationDate: '2024-01-05',
        penaltyAmount: 5000,
        resolutionStatus: 'Appealed',
        repeatOffender: false,
        riskLevel: 'Low',
        createdAt: '2024-01-05T16:00:00Z',
        updatedAt: '2024-01-20T11:00:00Z'
      }
    ];
    
    setPermits(mockPermits);
    setViolations(mockViolations);
    setLoading(false);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Approved':
      case 'Completed':
      case 'Resolved':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'Pending':
      case 'Open':
        return <ClockIcon className="w-5 h-5 text-yellow-500" />;
      case 'Drilling':
        return <ExclamationTriangleIcon className="w-5 h-5 text-blue-500" />;
      case 'Abandoned':
      case 'Appealed':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      default:
        return <ExclamationTriangleIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved':
      case 'Completed':
      case 'Resolved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Pending':
      case 'Open':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Drilling':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Abandoned':
      case 'Appealed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'Low':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'High':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Critical':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading compliance data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Regulatory Compliance</h1>
          <p className="text-gray-600">Track permits, regulations, and compliance status</p>
        </div>
        <button
          onClick={() => navigate('/compliance/new')}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          Add Record
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <DocumentIcon className="w-6 h-6 text-blue-500" />
            <div>
              <div className="text-sm text-gray-500">Total Permits</div>
              <div className="text-2xl font-bold text-gray-900">{permits.length}</div>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center gap-3">
            <CheckCircleIcon className="w-6 h-6 text-green-500" />
            <div>
              <div className="text-sm text-gray-500">Active Permits</div>
              <div className="text-2xl font-bold text-gray-900">
                {permits.filter(p => p.status === 'Approved' || p.status === 'Drilling').length}
              </div>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center gap-3">
            <ExclamationTriangleIcon className="w-6 h-6 text-red-500" />
            <div>
              <div className="text-sm text-gray-500">Open Violations</div>
              <div className="text-2xl font-bold text-gray-900">
                {violations.filter(v => v.resolutionStatus === 'Open').length}
              </div>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center gap-3">
            <ShieldExclamationIcon className="w-6 h-6 text-orange-500" />
            <div>
              <div className="text-sm text-gray-500">Total Penalties</div>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(violations.reduce((sum, v) => sum + (v.penaltyAmount || 0), 0))}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('permits')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'permits'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Permits ({permits.length})
          </button>
          <button
            onClick={() => setActiveTab('violations')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'violations'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Violations ({violations.length})
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
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Statuses</option>
            {activeTab === 'permits' ? (
              <>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Drilling">Drilling</option>
                <option value="Completed">Completed</option>
                <option value="Abandoned">Abandoned</option>
              </>
            ) : (
              <>
                <option value="Open">Open</option>
                <option value="Resolved">Resolved</option>
                <option value="Appealed">Appealed</option>
                <option value="Dismissed">Dismissed</option>
              </>
            )}
          </select>
          
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            {activeTab === 'permits' ? (
              <>
                <option value="Drilling">Drilling</option>
                <option value="Recompletion">Recompletion</option>
                <option value="Workover">Workover</option>
                <option value="Abandonment">Abandonment</option>
              </>
            ) : (
              <>
                <option value="Environmental">Environmental</option>
                <option value="Safety">Safety</option>
                <option value="Compliance">Compliance</option>
                <option value="Financial">Financial</option>
                <option value="Other">Other</option>
              </>
            )}
          </select>
          
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="permitDate">Sort by Date</option>
              <option value="operator">Sort by Operator</option>
              <option value="status">Sort by Status</option>
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
      {activeTab === 'permits' ? (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Permit</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Operator</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Well</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {permits.map((permit) => (
                  <tr key={permit.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div>
                        <div className="font-medium text-gray-900">{permit.permitNumber}</div>
                        <div className="text-sm text-gray-500">{permit.county}, {permit.state}</div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-gray-900">{permit.operator}</td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {permit.permitType}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(permit.status)}
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(permit.status)}`}>
                          {permit.status}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{permit.wellName || 'N/A'}</div>
                        <div className="text-xs text-gray-500">{permit.apiNumber || 'N/A'}</div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-gray-900">{formatDate(permit.permitDate)}</td>
                    <td className="py-4 px-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate(`/compliance/permits/${permit.id}`)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          View
                        </button>
                        <button
                          onClick={() => navigate(`/compliance/permits/${permit.id}/edit`)}
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
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Violation</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Operator</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Risk Level</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Penalty</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {violations.map((violation) => (
                  <tr key={violation.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div>
                        <div className="font-medium text-gray-900">{violation.violationDescription}</div>
                        <div className="text-sm text-gray-500">ID: {violation.id}</div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-gray-900">{violation.operatorName}</td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {violation.violationType}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(violation.resolutionStatus)}
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(violation.resolutionStatus)}`}>
                          {violation.resolutionStatus}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRiskLevelColor(violation.riskLevel)}`}>
                        {violation.riskLevel}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-gray-900">
                      {violation.penaltyAmount ? formatCurrency(violation.penaltyAmount) : 'N/A'}
                    </td>
                    <td className="py-4 px-4 text-gray-900">{formatDate(violation.violationDate)}</td>
                    <td className="py-4 px-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate(`/compliance/violations/${violation.id}`)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          View
                        </button>
                        <button
                          onClick={() => navigate(`/compliance/violations/${violation.id}/edit`)}
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
      )}
    </div>
  );
};

export default CompliancePage;



