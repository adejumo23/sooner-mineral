import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import { 
  ChartBarIcon, 
  PlusIcon, 
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CurrencyDollarIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  CalendarIcon,
  DocumentIcon
} from '../components/icons/Icons';

interface FinancialTransaction {
  id: string;
  transactionType: 'Revenue' | 'Expense' | 'Investment' | 'Acquisition' | 'Disposal';
  description: string;
  amount: number;
  date: string;
  category: string;
  subcategory?: string;
  dealId?: string;
  wellId?: string;
  operator?: string;
  status: 'Pending' | 'Completed' | 'Cancelled';
  reference?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface BudgetItem {
  id: string;
  category: string;
  subcategory?: string;
  budgetedAmount: number;
  actualAmount: number;
  variance: number;
  period: string; // e.g., "2024-Q1"
  status: 'On Track' | 'Over Budget' | 'Under Budget';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const FinancialsPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'transactions' | 'budget' | 'reports'>('transactions');
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    // Mock data for transactions
    const mockTransactions: FinancialTransaction[] = [
      {
        id: '1',
        transactionType: 'Revenue',
        description: 'Oil production revenue - Smith #1H',
        amount: 125000,
        date: '2024-01-15',
        category: 'Production Revenue',
        subcategory: 'Oil Sales',
        dealId: 'deal_1',
        wellId: 'well_1',
        operator: 'Pioneer Natural Resources',
        status: 'Completed',
        reference: 'INV-2024-001',
        notes: 'Monthly production revenue',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z'
      },
      {
        id: '2',
        transactionType: 'Expense',
        description: 'Drilling costs - Johnson #2H',
        amount: -85000,
        date: '2024-01-10',
        category: 'Drilling Costs',
        subcategory: 'Rig Operations',
        dealId: 'deal_2',
        wellId: 'well_2',
        operator: 'EOG Resources',
        status: 'Completed',
        reference: 'EXP-2024-001',
        notes: 'Drilling and completion costs',
        createdAt: '2024-01-10T14:00:00Z',
        updatedAt: '2024-01-10T14:00:00Z'
      },
      {
        id: '3',
        transactionType: 'Acquisition',
        description: 'Mineral rights acquisition - Williams tract',
        amount: -150000,
        date: '2024-01-05',
        category: 'Acquisition Costs',
        subcategory: 'Mineral Rights',
        dealId: 'deal_3',
        status: 'Completed',
        reference: 'ACQ-2024-001',
        notes: 'Mineral rights purchase',
        createdAt: '2024-01-05T09:00:00Z',
        updatedAt: '2024-01-05T09:00:00Z'
      },
      {
        id: '4',
        transactionType: 'Revenue',
        description: 'Gas production revenue - Smith #1H',
        amount: 45000,
        date: '2024-01-15',
        category: 'Production Revenue',
        subcategory: 'Gas Sales',
        dealId: 'deal_1',
        wellId: 'well_1',
        operator: 'Pioneer Natural Resources',
        status: 'Completed',
        reference: 'INV-2024-002',
        notes: 'Monthly gas revenue',
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T10:30:00Z'
      }
    ];

    // Mock data for budget
    const mockBudgetItems: BudgetItem[] = [
      {
        id: '1',
        category: 'Production Revenue',
        subcategory: 'Oil Sales',
        budgetedAmount: 500000,
        actualAmount: 520000,
        variance: 20000,
        period: '2024-Q1',
        status: 'Over Budget',
        notes: 'Higher than expected production',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z'
      },
      {
        id: '2',
        category: 'Drilling Costs',
        subcategory: 'Rig Operations',
        budgetedAmount: 300000,
        actualAmount: 285000,
        variance: -15000,
        period: '2024-Q1',
        status: 'Under Budget',
        notes: 'Efficient drilling operations',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-10T14:00:00Z'
      },
      {
        id: '3',
        category: 'Acquisition Costs',
        subcategory: 'Mineral Rights',
        budgetedAmount: 200000,
        actualAmount: 150000,
        variance: -50000,
        period: '2024-Q1',
        status: 'Under Budget',
        notes: 'Negotiated better terms',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-05T09:00:00Z'
      }
    ];
    
    setTransactions(mockTransactions);
    setBudgetItems(mockBudgetItems);
    setLoading(false);
  }, []);

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'Revenue':
        return <TrendingUpIcon className="w-5 h-5 text-green-500" />;
      case 'Expense':
        return <TrendingDownIcon className="w-5 h-5 text-red-500" />;
      case 'Investment':
        return <CurrencyDollarIcon className="w-5 h-5 text-blue-500" />;
      case 'Acquisition':
        return <DocumentIcon className="w-5 h-5 text-purple-500" />;
      case 'Disposal':
        return <TrendingDownIcon className="w-5 h-5 text-orange-500" />;
      default:
        return <CurrencyDollarIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getBudgetStatusColor = (status: string) => {
    switch (status) {
      case 'On Track':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Over Budget':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Under Budget':
        return 'bg-blue-100 text-blue-800 border-blue-200';
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

  const getTotalRevenue = () => {
    return transactions
      .filter(t => t.transactionType === 'Revenue')
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const getTotalExpenses = () => {
    return Math.abs(transactions
      .filter(t => t.transactionType === 'Expense')
      .reduce((sum, t) => sum + t.amount, 0));
  };

  const getNetIncome = () => {
    return transactions.reduce((sum, t) => sum + t.amount, 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading financial data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Management</h1>
          <p className="text-gray-600">Revenue tracking, budgeting, and financial reporting</p>
        </div>
        <button
          onClick={() => navigate('/financials/new')}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          Add Transaction
        </button>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <TrendingUpIcon className="w-6 h-6 text-green-500" />
            <div>
              <div className="text-sm text-gray-500">Total Revenue</div>
              <div className="text-2xl font-bold text-gray-900">{formatCurrency(getTotalRevenue())}</div>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center gap-3">
            <TrendingDownIcon className="w-6 h-6 text-red-500" />
            <div>
              <div className="text-sm text-gray-500">Total Expenses</div>
              <div className="text-2xl font-bold text-gray-900">{formatCurrency(getTotalExpenses())}</div>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center gap-3">
            <CurrencyDollarIcon className="w-6 h-6 text-blue-500" />
            <div>
              <div className="text-sm text-gray-500">Net Income</div>
              <div className={`text-2xl font-bold ${getNetIncome() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(getNetIncome())}
              </div>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center gap-3">
            <ChartBarIcon className="w-6 h-6 text-purple-500" />
            <div>
              <div className="text-sm text-gray-500">Transactions</div>
              <div className="text-2xl font-bold text-gray-900">{transactions.length}</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('transactions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'transactions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Transactions ({transactions.length})
          </button>
          <button
            onClick={() => setActiveTab('budget')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'budget'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Budget ({budgetItems.length})
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'reports'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Reports
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
            {activeTab === 'transactions' ? (
              <>
                <option value="Revenue">Revenue</option>
                <option value="Expense">Expense</option>
                <option value="Investment">Investment</option>
                <option value="Acquisition">Acquisition</option>
                <option value="Disposal">Disposal</option>
              </>
            ) : (
              <>
                <option value="Production Revenue">Production Revenue</option>
                <option value="Drilling Costs">Drilling Costs</option>
                <option value="Acquisition Costs">Acquisition Costs</option>
                <option value="Operating Costs">Operating Costs</option>
              </>
            )}
          </select>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Statuses</option>
            {activeTab === 'transactions' ? (
              <>
                <option value="Completed">Completed</option>
                <option value="Pending">Pending</option>
                <option value="Cancelled">Cancelled</option>
              </>
            ) : (
              <>
                <option value="On Track">On Track</option>
                <option value="Over Budget">Over Budget</option>
                <option value="Under Budget">Under Budget</option>
              </>
            )}
          </select>
          
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="date">Sort by Date</option>
              <option value="amount">Sort by Amount</option>
              <option value="description">Sort by Description</option>
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
      {activeTab === 'transactions' ? (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Transaction</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Amount</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Reference</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div>
                        <div className="font-medium text-gray-900">{transaction.description}</div>
                        <div className="text-sm text-gray-500">{transaction.category}</div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        {getTransactionIcon(transaction.transactionType)}
                        <span className="text-sm font-medium text-gray-900">{transaction.transactionType}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className={`font-medium ${transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(transaction.amount)}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(transaction.status)}`}>
                        {transaction.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-gray-900">{formatDate(transaction.date)}</td>
                    <td className="py-4 px-4 text-gray-900">{transaction.reference || 'N/A'}</td>
                    <td className="py-4 px-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate(`/financials/transactions/${transaction.id}`)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          View
                        </button>
                        <button
                          onClick={() => navigate(`/financials/transactions/${transaction.id}/edit`)}
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
      ) : activeTab === 'budget' ? (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Category</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Budgeted</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Actual</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Variance</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Period</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {budgetItems.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div>
                        <div className="font-medium text-gray-900">{item.category}</div>
                        <div className="text-sm text-gray-500">{item.subcategory}</div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-gray-900">{formatCurrency(item.budgetedAmount)}</td>
                    <td className="py-4 px-4 text-gray-900">{formatCurrency(item.actualAmount)}</td>
                    <td className="py-4 px-4">
                      <div className={`font-medium ${item.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(item.variance)}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getBudgetStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-gray-900">{item.period}</td>
                    <td className="py-4 px-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate(`/financials/budget/${item.id}`)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          View
                        </button>
                        <button
                          onClick={() => navigate(`/financials/budget/${item.id}/edit`)}
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
          <div className="text-center py-8">
            <ChartBarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Financial Reports</h3>
            <p className="text-gray-500 mb-4">Generate comprehensive financial reports and analytics.</p>
            <div className="flex gap-3 justify-center">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Generate P&L Report
              </button>
              <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                Generate Cash Flow
              </button>
              <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                Generate Budget Report
              </button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default FinancialsPage;

