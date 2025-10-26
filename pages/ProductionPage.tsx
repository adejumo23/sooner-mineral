import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import { 
  BeakerIcon, 
  PlusIcon, 
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ChartBarIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  ExclamationTriangleIcon
} from '../components/icons/Icons';

interface Well {
  id: string;
  apiNumber: string;
  wellName: string;
  operator: string;
  latitude: number;
  longitude: number;
  status: 'Producing' | 'Shut-in' | 'Abandoned' | 'Drilling';
  spudDate?: string;
  completionDate?: string;
  totalDepth?: number;
  formation: string;
  county: string;
  state: string;
  currentProduction: {
    oil: number; // BBL/day
    gas: number; // MCF/day
    water: number; // BBL/day
  };
  cumulativeProduction: {
    oil: number; // BBL
    gas: number; // MCF
    water: number; // BBL
  };
  lastProductionDate: string;
  createdAt: string;
  updatedAt: string;
}

const ProductionPage: React.FC = () => {
  const navigate = useNavigate();
  const [wells, setWells] = useState<Well[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [operatorFilter, setOperatorFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('wellName');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    // Mock data for now
    const mockWells: Well[] = [
      {
        id: '1',
        apiNumber: '42-001-12345-00-00',
        wellName: 'Smith #1H',
        operator: 'Pioneer Natural Resources',
        latitude: 31.9686,
        longitude: -99.9018,
        status: 'Producing',
        spudDate: '2023-06-15',
        completionDate: '2023-08-20',
        totalDepth: 12500,
        formation: 'Wolfcamp',
        county: 'Midland',
        state: 'TX',
        currentProduction: {
          oil: 450,
          gas: 1200,
          water: 85
        },
        cumulativeProduction: {
          oil: 125000,
          gas: 350000,
          water: 15000
        },
        lastProductionDate: '2024-01-15',
        createdAt: '2023-06-15T08:00:00Z',
        updatedAt: '2024-01-15T10:30:00Z'
      },
      {
        id: '2',
        apiNumber: '42-001-12346-00-00',
        wellName: 'Johnson #2H',
        operator: 'EOG Resources',
        latitude: 31.9786,
        longitude: -99.9118,
        status: 'Producing',
        spudDate: '2023-07-10',
        completionDate: '2023-09-15',
        totalDepth: 11800,
        formation: 'Bone Spring',
        county: 'Midland',
        state: 'TX',
        currentProduction: {
          oil: 380,
          gas: 950,
          water: 120
        },
        cumulativeProduction: {
          oil: 95000,
          gas: 280000,
          water: 12000
        },
        lastProductionDate: '2024-01-15',
        createdAt: '2023-07-10T09:00:00Z',
        updatedAt: '2024-01-15T10:30:00Z'
      },
      {
        id: '3',
        apiNumber: '42-001-12347-00-00',
        wellName: 'Williams #3H',
        operator: 'Diamondback Energy',
        latitude: 31.9586,
        longitude: -99.8918,
        status: 'Shut-in',
        spudDate: '2023-08-05',
        completionDate: '2023-10-10',
        totalDepth: 13200,
        formation: 'Wolfcamp',
        county: 'Midland',
        state: 'TX',
        currentProduction: {
          oil: 0,
          gas: 0,
          water: 0
        },
        cumulativeProduction: {
          oil: 75000,
          gas: 200000,
          water: 8000
        },
        lastProductionDate: '2024-01-10',
        createdAt: '2023-08-05T10:00:00Z',
        updatedAt: '2024-01-10T14:00:00Z'
      }
    ];
    
    setWells(mockWells);
    setLoading(false);
  }, []);

  const filteredWells = wells.filter(well => {
    const matchesSearch = well.wellName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         well.apiNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         well.operator.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || well.status === statusFilter;
    const matchesOperator = operatorFilter === 'all' || well.operator === operatorFilter;
    
    return matchesSearch && matchesStatus && matchesOperator;
  });

  const sortedWells = [...filteredWells].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'wellName':
        aValue = a.wellName;
        bValue = b.wellName;
        break;
      case 'operator':
        aValue = a.operator;
        bValue = b.operator;
        break;
      case 'currentProduction':
        aValue = a.currentProduction.oil;
        bValue = b.currentProduction.oil;
        break;
      case 'cumulativeProduction':
        aValue = a.cumulativeProduction.oil;
        bValue = b.cumulativeProduction.oil;
        break;
      case 'lastProductionDate':
        aValue = new Date(a.lastProductionDate).getTime();
        bValue = new Date(b.lastProductionDate).getTime();
        break;
      default:
        aValue = a.wellName;
        bValue = b.wellName;
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Producing':
        return <TrendingUpIcon className="w-5 h-5 text-green-500" />;
      case 'Shut-in':
        return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />;
      case 'Abandoned':
        return <TrendingDownIcon className="w-5 h-5 text-red-500" />;
      case 'Drilling':
        return <BeakerIcon className="w-5 h-5 text-blue-500" />;
      default:
        return <ExclamationTriangleIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Producing':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Shut-in':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Abandoned':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Drilling':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading production data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Production Monitoring</h1>
          <p className="text-gray-600">Real-time well production and performance tracking</p>
        </div>
        <button
          onClick={() => navigate('/production/new')}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          Add Well
        </button>
      </div>

      {/* Production Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <ChartBarIcon className="w-6 h-6 text-blue-500" />
            <div>
              <div className="text-sm text-gray-500">Total Wells</div>
              <div className="text-2xl font-bold text-gray-900">{wells.length}</div>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center gap-3">
            <TrendingUpIcon className="w-6 h-6 text-green-500" />
            <div>
              <div className="text-sm text-gray-500">Producing Wells</div>
              <div className="text-2xl font-bold text-gray-900">
                {wells.filter(w => w.status === 'Producing').length}
              </div>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center gap-3">
            <BeakerIcon className="w-6 h-6 text-purple-500" />
            <div>
              <div className="text-sm text-gray-500">Total Daily Oil</div>
              <div className="text-2xl font-bold text-gray-900">
                {formatNumber(wells.reduce((sum, w) => sum + w.currentProduction.oil, 0))} BBL
              </div>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center gap-3">
            <TrendingUpIcon className="w-6 h-6 text-orange-500" />
            <div>
              <div className="text-sm text-gray-500">Total Daily Gas</div>
              <div className="text-2xl font-bold text-gray-900">
                {formatNumber(wells.reduce((sum, w) => sum + w.currentProduction.gas, 0))} MCF
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search wells..."
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
            <option value="Producing">Producing</option>
            <option value="Shut-in">Shut-in</option>
            <option value="Abandoned">Abandoned</option>
            <option value="Drilling">Drilling</option>
          </select>
          
          <select
            value={operatorFilter}
            onChange={(e) => setOperatorFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Operators</option>
            {Array.from(new Set(wells.map(w => w.operator))).map(operator => (
              <option key={operator} value={operator}>{operator}</option>
            ))}
          </select>
          
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="wellName">Sort by Name</option>
              <option value="operator">Sort by Operator</option>
              <option value="currentProduction">Sort by Current Production</option>
              <option value="cumulativeProduction">Sort by Cumulative Production</option>
              <option value="lastProductionDate">Sort by Last Production</option>
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

      {/* Wells Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Well</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Operator</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Current Production</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Cumulative</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Last Production</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedWells.map((well) => (
                <tr key={well.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <div>
                      <div className="font-medium text-gray-900">{well.wellName}</div>
                      <div className="text-sm text-gray-500">{well.apiNumber}</div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-gray-900">{well.operator}</td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(well.status)}
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(well.status)}`}>
                        {well.status}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="text-sm">
                      <div>Oil: {formatNumber(well.currentProduction.oil)} BBL/d</div>
                      <div>Gas: {formatNumber(well.currentProduction.gas)} MCF/d</div>
                      <div>Water: {formatNumber(well.currentProduction.water)} BBL/d</div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="text-sm">
                      <div>Oil: {formatNumber(well.cumulativeProduction.oil)} BBL</div>
                      <div>Gas: {formatNumber(well.cumulativeProduction.gas)} MCF</div>
                      <div>Water: {formatNumber(well.cumulativeProduction.water)} BBL</div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-gray-900">{formatDate(well.lastProductionDate)}</td>
                  <td className="py-4 px-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/production/${well.id}`)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View
                      </button>
                      <button
                        onClick={() => navigate(`/production/${well.id}/edit`)}
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
        
        {sortedWells.length === 0 && (
          <div className="text-center py-8">
            <BeakerIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No wells found</h3>
            <p className="text-gray-500 mb-4">Get started by adding your first well.</p>
            <button
              onClick={() => navigate('/production/new')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Well
            </button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ProductionPage;



