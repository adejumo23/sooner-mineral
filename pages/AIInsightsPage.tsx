import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import { 
  LightBulbIcon, 
  PlusIcon, 
  MagnifyingGlassIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ChartBarIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  BrainIcon,
  SparklesIcon
} from '../components/icons/Icons';

interface AIInsight {
  id: string;
  title: string;
  description: string;
  category: 'Production Optimization' | 'Risk Assessment' | 'Market Analysis' | 'Operational Efficiency' | 'Predictive Maintenance';
  confidence: number; // 0-100
  impact: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'New' | 'In Review' | 'Implemented' | 'Dismissed';
  generatedAt: string;
  expiresAt?: string;
  data: Record<string, any>;
  recommendations: string[];
  relatedAssets: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface AIModel {
  id: string;
  name: string;
  description: string;
  type: 'Production Prediction' | 'Risk Analysis' | 'Market Forecasting' | 'Optimization' | 'Anomaly Detection';
  status: 'Active' | 'Training' | 'Inactive' | 'Error';
  accuracy: number; // 0-100
  lastTrained: string;
  performance: {
    precision: number;
    recall: number;
    f1Score: number;
  };
  createdAt: string;
  updatedAt: string;
}

const AIInsightsPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'insights' | 'models' | 'analytics'>('insights');
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [models, setModels] = useState<AIModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('generatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    // Mock data for AI insights
    const mockInsights: AIInsight[] = [
      {
        id: '1',
        title: 'Production Optimization Opportunity',
        description: 'AI analysis suggests 15% production increase possible through optimized drilling parameters',
        category: 'Production Optimization',
        confidence: 87,
        impact: 'High',
        status: 'New',
        generatedAt: '2024-01-18T10:00:00Z',
        expiresAt: '2024-02-18T10:00:00Z',
        data: {
          currentProduction: 450,
          predictedIncrease: 67.5,
          recommendedParameters: {
            drillingSpeed: 'Increase by 20%',
            mudWeight: 'Optimize to 9.2 ppg',
            bitType: 'Switch to PDC bit'
          }
        },
        recommendations: [
          'Implement optimized drilling parameters',
          'Monitor production closely for 30 days',
          'Consider similar optimization for other wells'
        ],
        relatedAssets: ['well_1', 'well_2'],
        createdBy: 'AI System',
        createdAt: '2024-01-18T10:00:00Z',
        updatedAt: '2024-01-18T10:00:00Z'
      },
      {
        id: '2',
        title: 'Equipment Failure Risk',
        description: 'Predictive analysis indicates 78% probability of pump failure within 30 days',
        category: 'Risk Assessment',
        confidence: 78,
        impact: 'Critical',
        status: 'In Review',
        generatedAt: '2024-01-17T14:30:00Z',
        expiresAt: '2024-02-17T14:30:00Z',
        data: {
          riskFactors: ['Vibration increase', 'Temperature rise', 'Pressure fluctuations'],
          probability: 78,
          recommendedActions: ['Schedule maintenance', 'Order replacement parts', 'Increase monitoring frequency']
        },
        recommendations: [
          'Schedule immediate maintenance inspection',
          'Order replacement pump as backup',
          'Increase monitoring to daily checks'
        ],
        relatedAssets: ['well_1'],
        createdBy: 'AI System',
        createdAt: '2024-01-17T14:30:00Z',
        updatedAt: '2024-01-18T08:00:00Z'
      },
      {
        id: '3',
        title: 'Market Price Prediction',
        description: 'AI forecasts 12% increase in oil prices over next quarter based on market trends',
        category: 'Market Analysis',
        confidence: 82,
        impact: 'Medium',
        status: 'Implemented',
        generatedAt: '2024-01-15T09:00:00Z',
        data: {
          currentPrice: 75.50,
          predictedPrice: 84.56,
          confidenceInterval: [80.20, 88.92],
          factors: ['Supply constraints', 'Geopolitical tensions', 'Seasonal demand']
        },
        recommendations: [
          'Consider hedging strategies',
          'Optimize production timing',
          'Review sales contracts'
        ],
        relatedAssets: ['portfolio'],
        createdBy: 'AI System',
        createdAt: '2024-01-15T09:00:00Z',
        updatedAt: '2024-01-16T11:00:00Z'
      }
    ];

    // Mock data for AI models
    const mockModels: AIModel[] = [
      {
        id: '1',
        name: 'Production Prediction Model',
        description: 'Predicts well production based on geological and operational parameters',
        type: 'Production Prediction',
        status: 'Active',
        accuracy: 89,
        lastTrained: '2024-01-15T00:00:00Z',
        performance: {
          precision: 0.87,
          recall: 0.91,
          f1Score: 0.89
        },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-15T00:00:00Z'
      },
      {
        id: '2',
        name: 'Equipment Failure Detection',
        description: 'Detects early signs of equipment failure using sensor data',
        type: 'Anomaly Detection',
        status: 'Active',
        accuracy: 92,
        lastTrained: '2024-01-10T00:00:00Z',
        performance: {
          precision: 0.94,
          recall: 0.90,
          f1Score: 0.92
        },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-10T00:00:00Z'
      },
      {
        id: '3',
        name: 'Market Price Forecasting',
        description: 'Forecasts commodity prices using market data and economic indicators',
        type: 'Market Forecasting',
        status: 'Training',
        accuracy: 76,
        lastTrained: '2024-01-12T00:00:00Z',
        performance: {
          precision: 0.74,
          recall: 0.78,
          f1Score: 0.76
        },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-12T00:00:00Z'
      }
    ];
    
    setInsights(mockInsights);
    setModels(mockModels);
    setLoading(false);
  }, []);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Production Optimization':
        return <TrendingUpIcon className="w-5 h-5 text-green-500" />;
      case 'Risk Assessment':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />;
      case 'Market Analysis':
        return <ChartBarIcon className="w-5 h-5 text-blue-500" />;
      case 'Operational Efficiency':
        return <LightBulbIcon className="w-5 h-5 text-purple-500" />;
      case 'Predictive Maintenance':
        return <ClockIcon className="w-5 h-5 text-orange-500" />;
      default:
        return <BrainIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'New':
        return <SparklesIcon className="w-5 h-5 text-blue-500" />;
      case 'In Review':
        return <ClockIcon className="w-5 h-5 text-yellow-500" />;
      case 'Implemented':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'Dismissed':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />;
      default:
        return <BrainIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'In Review':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Implemented':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Dismissed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'Critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'High':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getModelStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Training':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'Error':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatConfidence = (confidence: number) => {
    return `${confidence}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading AI insights...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Insights</h1>
          <p className="text-gray-600">Machine learning powered analytics and predictions</p>
        </div>
        <button
          onClick={() => navigate('/ai-insights/new')}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          Generate Insight
        </button>
      </div>

      {/* AI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <BrainIcon className="w-6 h-6 text-blue-500" />
            <div>
              <div className="text-sm text-gray-500">Total Insights</div>
              <div className="text-2xl font-bold text-gray-900">{insights.length}</div>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center gap-3">
            <CheckCircleIcon className="w-6 h-6 text-green-500" />
            <div>
              <div className="text-sm text-gray-500">Implemented</div>
              <div className="text-2xl font-bold text-gray-900">
                {insights.filter(i => i.status === 'Implemented').length}
              </div>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center gap-3">
            <SparklesIcon className="w-6 h-6 text-purple-500" />
            <div>
              <div className="text-sm text-gray-500">New Insights</div>
              <div className="text-2xl font-bold text-gray-900">
                {insights.filter(i => i.status === 'New').length}
              </div>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center gap-3">
            <ChartBarIcon className="w-6 h-6 text-orange-500" />
            <div>
              <div className="text-sm text-gray-500">Active Models</div>
              <div className="text-2xl font-bold text-gray-900">
                {models.filter(m => m.status === 'Active').length}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('insights')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'insights'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Insights ({insights.length})
          </button>
          <button
            onClick={() => setActiveTab('models')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'models'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Models ({models.length})
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'analytics'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Analytics
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
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            <option value="Production Optimization">Production Optimization</option>
            <option value="Risk Assessment">Risk Assessment</option>
            <option value="Market Analysis">Market Analysis</option>
            <option value="Operational Efficiency">Operational Efficiency</option>
            <option value="Predictive Maintenance">Predictive Maintenance</option>
          </select>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Statuses</option>
            {activeTab === 'insights' ? (
              <>
                <option value="New">New</option>
                <option value="In Review">In Review</option>
                <option value="Implemented">Implemented</option>
                <option value="Dismissed">Dismissed</option>
              </>
            ) : (
              <>
                <option value="Active">Active</option>
                <option value="Training">Training</option>
                <option value="Inactive">Inactive</option>
                <option value="Error">Error</option>
              </>
            )}
          </select>
          
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="generatedAt">Sort by Date</option>
              <option value="confidence">Sort by Confidence</option>
              <option value="impact">Sort by Impact</option>
              <option value="title">Sort by Title</option>
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
      {activeTab === 'insights' ? (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Insight</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Category</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Confidence</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Impact</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Generated</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {insights.map((insight) => (
                  <tr key={insight.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div>
                        <div className="font-medium text-gray-900">{insight.title}</div>
                        <div className="text-sm text-gray-500">{insight.description}</div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(insight.category)}
                        <span className="text-sm font-medium text-gray-900">{insight.category}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${insight.confidence}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{formatConfidence(insight.confidence)}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getImpactColor(insight.impact)}`}>
                        {insight.impact}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(insight.status)}
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(insight.status)}`}>
                          {insight.status}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-gray-900">{formatDate(insight.generatedAt)}</td>
                    <td className="py-4 px-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate(`/ai-insights/${insight.id}`)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          View
                        </button>
                        <button
                          onClick={() => navigate(`/ai-insights/${insight.id}/edit`)}
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
      ) : activeTab === 'models' ? (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Model</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Accuracy</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Last Trained</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Performance</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {models.map((model) => (
                  <tr key={model.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div>
                        <div className="font-medium text-gray-900">{model.name}</div>
                        <div className="text-sm text-gray-500">{model.description}</div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {model.type}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ width: `${model.accuracy}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{model.accuracy}%</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getModelStatusColor(model.status)}`}>
                        {model.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-gray-900">{formatDate(model.lastTrained)}</td>
                    <td className="py-4 px-4">
                      <div className="text-sm">
                        <div>F1: {model.performance.f1Score.toFixed(2)}</div>
                        <div>Precision: {model.performance.precision.toFixed(2)}</div>
                        <div>Recall: {model.performance.recall.toFixed(2)}</div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate(`/ai-insights/models/${model.id}`)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          View
                        </button>
                        <button
                          onClick={() => navigate(`/ai-insights/models/${model.id}/train`)}
                          className="text-gray-600 hover:text-gray-800 text-sm font-medium"
                        >
                          Train
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
            <BrainIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">AI Analytics Dashboard</h3>
            <p className="text-gray-500 mb-4">Advanced analytics and model performance insights.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
              <div className="bg-blue-50 p-6 rounded-lg">
                <ChartBarIcon className="w-8 h-8 text-blue-500 mx-auto mb-3" />
                <div className="text-lg font-semibold text-blue-900 mb-2">Model Performance</div>
                <div className="text-sm text-blue-700">Track accuracy and performance metrics across all AI models</div>
              </div>
              <div className="bg-green-50 p-6 rounded-lg">
                <TrendingUpIcon className="w-8 h-8 text-green-500 mx-auto mb-3" />
                <div className="text-lg font-semibold text-green-900 mb-2">Insight Trends</div>
                <div className="text-sm text-green-700">Analyze patterns in AI-generated insights and recommendations</div>
              </div>
              <div className="bg-purple-50 p-6 rounded-lg">
                <LightBulbIcon className="w-8 h-8 text-purple-500 mx-auto mb-3" />
                <div className="text-lg font-semibold text-purple-900 mb-2">Impact Analysis</div>
                <div className="text-sm text-purple-700">Measure the business impact of implemented AI recommendations</div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default AIInsightsPage;


