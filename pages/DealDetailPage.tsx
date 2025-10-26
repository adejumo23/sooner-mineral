import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import { 
  CurrencyDollarIcon, 
  ArrowLeftIcon,
  PencilIcon,
  DocumentIcon,
  CalendarIcon,
  UserIcon,
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
  loiDocumentId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface DealAuditTrail {
  dealId: string;
  userId: string;
  action: string;
  timestamp: string;
  notes?: string;
}

const DealDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [auditTrail, setAuditTrail] = useState<DealAuditTrail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data for now
    const mockDeal: Deal = {
      id: id || '1',
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
      loiDocumentId: 'doc_123',
      notes: 'Successful acquisition of mineral rights in Permian Basin. All documentation completed and filed.',
      createdAt: '2024-01-10T09:00:00Z',
      updatedAt: '2024-01-15T10:30:00Z'
    };

    const mockAuditTrail: DealAuditTrail[] = [
      {
        dealId: id || '1',
        userId: 'user_1',
        action: 'Deal Created',
        timestamp: '2024-01-10T09:00:00Z',
        notes: 'Deal created from lead conversion'
      },
      {
        dealId: id || '1',
        userId: 'user_1',
        action: 'LOI Sent',
        timestamp: '2024-01-12T14:30:00Z',
        notes: 'Letter of Intent sent to seller'
      },
      {
        dealId: id || '1',
        userId: 'user_1',
        action: 'LOI Signed',
        timestamp: '2024-01-15T10:30:00Z',
        notes: 'LOI executed and deal converted'
      }
    ];

    setDeal(mockDeal);
    setAuditTrail(mockAuditTrail);
    setLoading(false);
  }, [id]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Converted':
        return <CheckCircleIcon className="w-6 h-6 text-green-500" />;
      case 'Pending':
        return <ClockIcon className="w-6 h-6 text-yellow-500" />;
      case 'Error':
        return <XCircleIcon className="w-6 h-6 text-red-500" />;
      default:
        return <ExclamationTriangleIcon className="w-6 h-6 text-gray-500" />;
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

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading deal details...</div>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Deal not found</h3>
        <p className="text-gray-500 mb-4">The deal you're looking for doesn't exist.</p>
        <button
          onClick={() => navigate('/deals')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Back to Deals
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/deals')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{deal.dealName}</h1>
            <p className="text-gray-600">Deal ID: {deal.id}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/deals/${deal.id}/edit`)}
            className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <PencilIcon className="w-4 h-4" />
            Edit
          </button>
        </div>
      </div>

      {/* Status and Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            {getStatusIcon(deal.status)}
            <div>
              <div className="text-sm text-gray-500">Status</div>
              <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium border ${getStatusColor(deal.status)}`}>
                {deal.status}
              </div>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center gap-3">
            <CurrencyDollarIcon className="w-6 h-6 text-green-500" />
            <div>
              <div className="text-sm text-gray-500">Total Value</div>
              <div className="text-lg font-semibold text-gray-900">{formatCurrency(deal.totalValue)}</div>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center gap-3">
            <DocumentIcon className="w-6 h-6 text-blue-500" />
            <div>
              <div className="text-sm text-gray-500">Net Mineral Acres</div>
              <div className="text-lg font-semibold text-gray-900">{deal.nma.toFixed(1)}</div>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center gap-3">
            <CalendarIcon className="w-6 h-6 text-purple-500" />
            <div>
              <div className="text-sm text-gray-500">Price per Acre</div>
              <div className="text-lg font-semibold text-gray-900">{formatCurrency(deal.pricePerAcre)}</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Deal Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Deal Information</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500">Deal Type</label>
                <div className="text-sm font-medium text-gray-900">{deal.type}</div>
              </div>
              <div>
                <label className="text-sm text-gray-500">LOI Status</label>
                <div className="text-sm font-medium text-gray-900">{deal.loiStatus}</div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500">Seller Name</label>
                <div className="text-sm font-medium text-gray-900">{deal.sellerName}</div>
              </div>
              <div>
                <label className="text-sm text-gray-500">Assigned Owner</label>
                <div className="text-sm font-medium text-gray-900">{deal.assignedOwner}</div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500">Effective Date</label>
                <div className="text-sm font-medium text-gray-900">{formatDate(deal.effectiveDate)}</div>
              </div>
              <div>
                <label className="text-sm text-gray-500">Execution Date</label>
                <div className="text-sm font-medium text-gray-900">{formatDateTime(deal.executionTimestamp)}</div>
              </div>
            </div>
            
            {deal.notes && (
              <div>
                <label className="text-sm text-gray-500">Notes</label>
                <div className="text-sm text-gray-900 mt-1 p-3 bg-gray-50 rounded-lg">{deal.notes}</div>
              </div>
            )}
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Related Information</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-500">Lead ID</label>
              <div className="text-sm font-medium text-gray-900">{deal.leadId}</div>
            </div>
            
            <div>
              <label className="text-sm text-gray-500">Owner ID</label>
              <div className="text-sm font-medium text-gray-900">{deal.ownerId}</div>
            </div>
            
            {deal.loiDocumentId && (
              <div>
                <label className="text-sm text-gray-500">LOI Document</label>
                <div className="text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer">
                  {deal.loiDocumentId}
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500">Created</label>
                <div className="text-sm font-medium text-gray-900">{formatDateTime(deal.createdAt)}</div>
              </div>
              <div>
                <label className="text-sm text-gray-500">Last Updated</label>
                <div className="text-sm font-medium text-gray-900">{formatDateTime(deal.updatedAt)}</div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Audit Trail */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Audit Trail</h3>
        <div className="space-y-3">
          {auditTrail.map((entry, index) => (
            <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-900">{entry.action}</span>
                  <span className="text-xs text-gray-500">{formatDateTime(entry.timestamp)}</span>
                </div>
                {entry.notes && (
                  <div className="text-sm text-gray-600">{entry.notes}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default DealDetailPage;



