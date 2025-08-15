import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { 
  EyeIcon, 
  DocumentArrowDownIcon, 
  ChartBarIcon, 
  GlobeAltIcon, 
  FolderOpenIcon,
  MapIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  DownloadIcon,
  RefreshIcon
} from '../components/icons/Icons';

interface LPDashboard {
  lpId: string;
  lpName: string;
  fundName: string;
  lastUpdate: string;
  portfolioMetrics: {
    totalNMA: number;
    capitalDeployed: number;
    assetCount: number;
    avgPricePerNRA: number;
  };
  dealPacing: {
    totalLeads: number;
    loiCount: number;
    closedCount: number;
    conversionRate: number;
  };
  assetDistribution: {
    byBasin: Record<string, number>;
    byCounty: Record<string, number>;
    byOperator: Record<string, number>;
    byESGTier: Record<string, number>;
  };
}

interface ESGScorecard {
  tractId: string;
  tractName: string;
  esgScore: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  complianceStatus: 'Compliant' | 'Pending' | 'Flagged';
  lastAssessment: string;
}

interface LPDocument {
  id: string;
  title: string;
  type: 'ESG Memo' | 'Fund Summary' | 'Quarterly Update' | 'Compliance Report';
  uploadDate: string;
  version: string;
  size: string;
  uploadedBy: string;
}

const LPPortalPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'assets' | 'esg' | 'docs'>('overview');
  const [dashboardData, setDashboardData] = useState<LPDashboard | null>(null);
  const [esgData, setEsgData] = useState<ESGScorecard[]>([]);
  const [documents, setDocuments] = useState<LPDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Mock data - in real implementation, this would come from API based on LP permissions
  useEffect(() => {
    const mockDashboard: LPDashboard = {
      lpId: 'LP001',
      lpName: 'Institutional Capital Partners',
      fundName: 'Sooner Mineral Fund II',
      lastUpdate: new Date().toISOString(),
      portfolioMetrics: {
        totalNMA: 15420,
        capitalDeployed: 12500000,
        assetCount: 47,
        avgPricePerNRA: 811.28
      },
      dealPacing: {
        totalLeads: 156,
        loiCount: 23,
        closedCount: 18,
        conversionRate: 11.5
      },
      assetDistribution: {
        byBasin: {
          'Permian': 45,
          'Eagle Ford': 32,
          'Bakken': 23
        },
        byCounty: {
          'Midland': 28,
          'Reeves': 19,
          'Williams': 15
        },
        byOperator: {
          'Pioneer': 25,
          'EOG': 18,
          'ConocoPhillips': 14
        },
        byESGTier: {
          'Low Risk': 65,
          'Medium Risk': 28,
          'High Risk': 7
        }
      }
    };

    const mockESGData: ESGScorecard[] = [
      {
        tractId: 'T001',
        tractName: 'North Star Prospect',
        esgScore: 85,
        riskLevel: 'Low',
        complianceStatus: 'Compliant',
        lastAssessment: '2024-01-15'
      },
      {
        tractId: 'T002',
        tractName: 'Red River Minerals',
        esgScore: 72,
        riskLevel: 'Medium',
        complianceStatus: 'Pending',
        lastAssessment: '2024-01-10'
      },
      {
        tractId: 'T003',
        tractName: 'Wilson Eagle Ford',
        esgScore: 91,
        riskLevel: 'Low',
        complianceStatus: 'Compliant',
        lastAssessment: '2024-01-20'
      }
    ];

    const mockDocuments: LPDocument[] = [
      {
        id: 'DOC001',
        title: 'Q4 2023 Fund Performance Summary',
        type: 'Fund Summary',
        uploadDate: '2024-01-15',
        version: '1.0',
        size: '2.4 MB',
        uploadedBy: 'Fund Manager'
      },
      {
        id: 'DOC002',
        title: 'ESG Compliance Report - December 2023',
        type: 'ESG Memo',
        uploadDate: '2024-01-10',
        version: '2.1',
        size: '1.8 MB',
        uploadedBy: 'ESG Team'
      },
      {
        id: 'DOC003',
        title: 'Portfolio Update - January 2024',
        type: 'Quarterly Update',
        uploadDate: '2024-01-25',
        version: '1.0',
        size: '3.2 MB',
        uploadedBy: 'Portfolio Manager'
      }
    ];

    setDashboardData(mockDashboard);
    setEsgData(mockESGData);
    setDocuments(mockDocuments);
    setIsLoading(false);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const handleExport = (format: 'PDF' | 'Excel') => {
    // In real implementation, this would trigger an export API call
    alert(`${format} export initiated. This will be available for download shortly.`);
  };

  const getESGRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'text-green-600 bg-green-100';
      case 'Medium': return 'text-yellow-600 bg-yellow-100';
      case 'High': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getComplianceColor = (status: string) => {
    switch (status) {
      case 'Compliant': return 'text-green-600 bg-green-100';
      case 'Pending': return 'text-yellow-600 bg-yellow-100';
      case 'Flagged': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading LP Portal...</div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 text-lg">Access Denied</div>
        <p className="text-gray-600 mt-2">You do not have permission to access the LP Portal.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-lg p-6 text-white">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">LP Portal</h1>
            <p className="text-blue-100 text-lg">{dashboardData.fundName}</p>
            <p className="text-blue-200 text-sm mt-1">
              Last updated: {new Date(dashboardData.lastUpdate).toLocaleDateString()}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{dashboardData.lpName}</div>
            <div className="text-blue-200 text-sm">Limited Partner</div>
          </div>
        </div>
      </div>

      {/* Export Controls */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          Read-only access • Data refreshed automatically
        </div>
        <div className="flex space-x-3">
          <Button
            variant="secondary"
            onClick={() => handleExport('PDF')}
            className="flex items-center space-x-2"
          >
            <DocumentArrowDownIcon className="w-4 h-4" />
            <span>PDF Snapshot</span>
          </Button>
          <Button
            variant="secondary"
            onClick={() => handleExport('Excel')}
            className="flex items-center space-x-2"
          >
            <DownloadIcon className="w-4 h-4" />
            <span>Excel Download</span>
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { key: 'overview', label: 'Overview', icon: EyeIcon },
            { key: 'assets', label: 'Assets', icon: MapIcon },
            { key: 'esg', label: 'ESG', icon: GlobeAltIcon },
            { key: 'docs', label: 'Documents', icon: FolderOpenIcon }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-96">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Portfolio Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {formatNumber(dashboardData.portfolioMetrics.totalNMA)}
                </div>
                <div className="text-sm text-gray-600">Total NMA</div>
                <div className="text-xs text-gray-500 mt-1">Net Mineral Acres</div>
              </Card>
              <Card className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(dashboardData.portfolioMetrics.capitalDeployed)}
                </div>
                <div className="text-sm text-gray-600">Capital Deployed</div>
                <div className="text-xs text-gray-500 mt-1">Total Investment</div>
              </Card>
              <Card className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {dashboardData.portfolioMetrics.assetCount}
                </div>
                <div className="text-sm text-gray-600">Total Assets</div>
                <div className="text-xs text-gray-500 mt-1">Tracts & Units</div>
              </Card>
              <Card className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  ${dashboardData.portfolioMetrics.avgPricePerNRA}
                </div>
                <div className="text-sm text-gray-600">Avg $/NRA</div>
                <div className="text-xs text-gray-500 mt-1">Price per Net Royalty Acre</div>
              </Card>
            </div>

            {/* Deal Pacing */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <ChartBarIcon className="w-5 h-5 mr-2 text-blue-600" />
                Deal Pipeline Progress
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{dashboardData.dealPacing.totalLeads}</div>
                  <div className="text-sm text-gray-600">Total Leads</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{dashboardData.dealPacing.loiCount}</div>
                  <div className="text-sm text-gray-600">LOIs</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{dashboardData.dealPacing.closedCount}</div>
                  <div className="text-sm text-gray-600">Closed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{dashboardData.dealPacing.conversionRate}%</div>
                  <div className="text-sm text-gray-600">Conversion Rate</div>
                </div>
              </div>
              <div className="mt-4 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(dashboardData.dealPacing.closedCount / dashboardData.dealPacing.totalLeads) * 100}%` }}
                ></div>
              </div>
            </Card>

            {/* Asset Distribution */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribution by Basin</h3>
                <div className="space-y-3">
                  {Object.entries(dashboardData.assetDistribution.byBasin).map(([basin, count]) => (
                    <div key={basin} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{basin}</span>
                      <span className="font-semibold text-gray-900">{count}</span>
                    </div>
                  ))}
                </div>
              </Card>
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">ESG Risk Distribution</h3>
                <div className="space-y-3">
                  {Object.entries(dashboardData.assetDistribution.byESGTier).map(([tier, count]) => (
                    <div key={tier} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{tier}</span>
                      <span className="font-semibold text-gray-900">{count}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'assets' && (
          <div className="space-y-6">
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Portfolio Map View</h3>
              <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <MapIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p>Interactive map view coming soon</p>
                  <p className="text-sm">Will show tract/unit outlines with status overlays</p>
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Counties</h3>
                <div className="space-y-3">
                  {Object.entries(dashboardData.assetDistribution.byCounty)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5)
                    .map(([county, count]) => (
                      <div key={county} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{county}</span>
                        <span className="font-semibold text-gray-900">{count}</span>
                      </div>
                    ))}
                </div>
              </Card>
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Operators</h3>
                <div className="space-y-3">
                  {Object.entries(dashboardData.assetDistribution.byOperator)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5)
                    .map(([operator, count]) => (
                      <div key={operator} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{operator}</span>
                        <span className="font-semibold text-gray-900">{count}</span>
                      </div>
                    ))}
                </div>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'esg' && (
          <div className="space-y-6">
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">ESG Scorecard Summary</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tract
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ESG Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Risk Level
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Assessment
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {esgData.map((item) => (
                      <tr key={item.tractId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.tractName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.esgScore}/100
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getESGRiskColor(item.riskLevel)}`}>
                            {item.riskLevel}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getComplianceColor(item.complianceStatus)}`}>
                            {item.complianceStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(item.lastAssessment).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {esgData.filter(item => item.riskLevel === 'Low').length}
                </div>
                <div className="text-sm text-gray-600">Low Risk Assets</div>
              </Card>
              <Card className="text-center">
                <div className="text-3xl font-bold text-yellow-600">
                  {esgData.filter(item => item.riskLevel === 'Medium').length}
                </div>
                <div className="text-sm text-gray-600">Medium Risk Assets</div>
              </Card>
              <Card className="text-center">
                <div className="text-3xl font-bold text-red-600">
                  {esgData.filter(item => item.riskLevel === 'High').length}
                </div>
                <div className="text-sm text-gray-600">High Risk Assets</div>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'docs' && (
          <div className="space-y-6">
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Documents</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Document
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Version
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Size
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Upload Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {documents.map((doc) => (
                      <tr key={doc.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{doc.title}</div>
                          <div className="text-sm text-gray-500">Uploaded by {doc.uploadedBy}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {doc.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {doc.version}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {doc.size}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(doc.uploadDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => alert(`Downloading ${doc.title}`)}
                            className="flex items-center space-x-1"
                          >
                            <DownloadIcon className="w-3 h-3" />
                            <span>Download</span>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center py-6 border-t border-gray-200">
        <p className="text-gray-500 text-sm">
          LP Portal • Sooner Capital CRM • Secure Read-Only Access
        </p>
        <p className="text-gray-400 text-xs mt-2">
          All data is filtered based on your access permissions • Contact your fund manager for additional access
        </p>
      </div>
    </div>
  );
};

export default LPPortalPage;
