import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import { 
  CurrencyDollarIcon, 
  PlusIcon, 
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '../components/icons/Icons';

interface Deal {
  id: string;
  dealName: string;
  leadId: string;
  ownerId: string;
  type: 'Minerals' | 'Non-Op' | 'Leasehold' | 'Other';
  status: 'Converted' | 'Error' | 'Pending';
  loiStatus: string;
  sellerName: string;
  effectiveDate: string;
  executionTimestamp: string;
  totalValue: number;
  nma: number;
  pricePerAcre: number;
  assignedOwner: string;
  createdAt: string;
  updatedAt: string;
}

const DealsPage: React.FC = () => {
  const navigate = useNavigate();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    // Mock data for now
    const mockDeals: Deal[] = [
      {
        id: '1',
        dealName: 'Smith Mineral Acquisition',
        leadId: 'lead_1',
        ownerId: 'user_1',
        type: 'Minerals',
        status: 'Converted',
        loiStatus: 'Signed',
        sellerName: 'John Smith',
        effectiveDate: '2024-01-15',
        executionTimestamp: '2024-01-15T10:30:00Z',
        totalValue: 150000,
        nma: 25.5,
        pricePerAcre: 5882,
        assignedOwner: 'Buyer A',
        createdAt: '2024-01-10T09:00:00Z',
        updatedAt: '2024-01-15T10:30:00Z'
      },
      {
        id: '2',
        dealName: 'Johnson Royalty Interest',
        leadId: 'lead_2',
        ownerId: 'user_2',
        type: 'Non-Op',
        status: 'Pending',
        loiStatus: 'Draft',
        sellerName: 'Mary Johnson',
        effectiveDate: '2024-02-01',
        executionTimestamp: '',
        totalValue: 75000,
        nma: 12.3,
        pricePerAcre: 6098,
        assignedOwner: 'Buyer B',
        createdAt: '2024-01-20T14:00:00Z',
        updatedAt: '2024-01-25T16:00:00Z'
      },
      {
        id: '3',
        dealName: 'Williams Leasehold',
        leadId: 'lead_3',
        ownerId: 'user_3',
        type: 'Leasehold',
        status: 'Error',
        loiStatus: 'Rejected',
        sellerName: 'Robert Williams',
        effectiveDate: '',
        executionTimestamp: '',
        totalValue: 0,
        nma: 0,
        pricePerAcre: 0,
        assignedOwner: 'Buyer C',
        createdAt: '2024-01-25T11:00:00Z',
        updatedAt: '2024-01-30T13:00:00Z'
      }
    ];
    
    setDeals(mockDeals);
    setLoading(false);
  }, []);

  const filteredDeals = deals.filter(deal => {
    const matchesSearch = deal.dealName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         deal.sellerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || deal.status === statusFilter;
    const matchesType = typeFilter === 'all' || deal.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const sortedDeals = [...filteredDeals].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'dealName':
        aValue = a.dealName;
        bValue = b.dealName;
        break;
      case 'totalValue':
        aValue = a.totalValue;
        bValue = b.totalValue;
        break;
      case 'createdAt':
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
        break;
      case 'effectiveDate':
        aValue = new Date(a.effectiveDate).getTime();
        bValue = new Date(b.effectiveDate).getTime();
        break;
      default:
        aValue = a.dealName;
        bValue = b.dealName;
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Converted':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'Pending':
        return <ClockIcon className="w-5 h-5 text-yellow-500" />;
      case 'Error':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      default:
        return <ExclamationTriangleIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Converted':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Error':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading deals...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Deal Management</h1>
          <p className="text-gray-600">Track and manage mineral rights acquisitions</p>
        </div>
        <button
          onClick={() => navigate('/deals/new')}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          New Deal
        </button>
      </div>

      {/* Filters and Search */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search deals..."
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
            <option value="Converted">Converted</option>
            <option value="Pending">Pending</option>
            <option value="Error">Error</option>
          </select>
          
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="Minerals">Minerals</option>
            <option value="Non-Op">Non-Op</option>
            <option value="Leasehold">Leasehold</option>
            <option value="Other">Other</option>
          </select>
          
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="createdAt">Sort by Date</option>
              <option value="dealName">Sort by Name</option>
              <option value="totalValue">Sort by Value</option>
              <option value="effectiveDate">Sort by Effective Date</option>
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

      {/* Deals Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Deal</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Type</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Seller</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Value</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">NMA</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Price/Acre</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Effective Date</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedDeals.map((deal) => (
                <tr key={deal.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <div>
                      <div className="font-medium text-gray-900">{deal.dealName}</div>
                      <div className="text-sm text-gray-500">ID: {deal.id}</div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {deal.type}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(deal.status)}
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(deal.status)}`}>
                        {deal.status}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-gray-900">{deal.sellerName}</td>
                  <td className="py-4 px-4 font-medium text-gray-900">{formatCurrency(deal.totalValue)}</td>
                  <td className="py-4 px-4 text-gray-900">{deal.nma.toFixed(1)}</td>
                  <td className="py-4 px-4 text-gray-900">{formatCurrency(deal.pricePerAcre)}</td>
                  <td className="py-4 px-4 text-gray-900">{formatDate(deal.effectiveDate)}</td>
                  <td className="py-4 px-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/deals/${deal.id}`)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View
                      </button>
                      <button
                        onClick={() => navigate(`/deals/${deal.id}/edit`)}
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
        
        {sortedDeals.length === 0 && (
          <div className="text-center py-8">
            <CurrencyDollarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No deals found</h3>
            <p className="text-gray-500 mb-4">Get started by creating your first deal.</p>
            <button
              onClick={() => navigate('/deals/new')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Deal
            </button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default DealsPage;


