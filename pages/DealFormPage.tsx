import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import { 
  ArrowLeftIcon,
  SaveIcon,
  XMarkIcon
} from '../components/icons/Icons';

interface DealFormData {
  dealName: string;
  leadId: string;
  ownerId: string;
  type: 'Minerals' | 'Non-Op' | 'Leasehold' | 'Other';
  loiStatus: string;
  sellerName: string;
  effectiveDate: string;
  totalValue: number;
  nma: number;
  pricePerAcre: number;
  assignedOwner: string;
  loiDocumentId?: string;
  notes?: string;
}

const DealFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  
  const [formData, setFormData] = useState<DealFormData>({
    dealName: '',
    leadId: '',
    ownerId: '',
    type: 'Minerals',
    loiStatus: 'Draft',
    sellerName: '',
    effectiveDate: '',
    totalValue: 0,
    nma: 0,
    pricePerAcre: 0,
    assignedOwner: '',
    loiDocumentId: '',
    notes: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isEditing) {
      // Load existing deal data
      const mockDeal: DealFormData = {
        dealName: 'Smith Mineral Acquisition',
        leadId: 'lead_1',
        ownerId: 'user_1',
        type: 'Minerals',
        loiStatus: 'Signed',
        sellerName: 'John Smith',
        effectiveDate: '2024-01-15',
        totalValue: 150000,
        nma: 25.5,
        pricePerAcre: 5882,
        assignedOwner: 'Buyer A',
        loiDocumentId: 'doc_123',
        notes: 'Successful acquisition of mineral rights in Permian Basin.'
      };
      setFormData(mockDeal);
    }
  }, [id, isEditing]);

  const handleInputChange = (field: keyof DealFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.dealName.trim()) {
      newErrors.dealName = 'Deal name is required';
    }
    
    if (!formData.leadId.trim()) {
      newErrors.leadId = 'Lead ID is required';
    }
    
    if (!formData.sellerName.trim()) {
      newErrors.sellerName = 'Seller name is required';
    }
    
    if (formData.totalValue <= 0) {
      newErrors.totalValue = 'Total value must be greater than 0';
    }
    
    if (formData.nma <= 0) {
      newErrors.nma = 'Net Mineral Acres must be greater than 0';
    }
    
    if (formData.pricePerAcre <= 0) {
      newErrors.pricePerAcre = 'Price per acre must be greater than 0';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Navigate back to deals list
      navigate('/deals');
    } catch (error) {
      console.error('Error saving deal:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/deals');
  };

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
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Edit Deal' : 'Create New Deal'}
            </h1>
            <p className="text-gray-600">
              {isEditing ? 'Update deal information' : 'Add a new mineral rights acquisition'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Deal Name *
              </label>
              <input
                type="text"
                value={formData.dealName}
                onChange={(e) => handleInputChange('dealName', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.dealName ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter deal name"
              />
              {errors.dealName && (
                <p className="text-red-500 text-sm mt-1">{errors.dealName}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Deal Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleInputChange('type', e.target.value as DealFormData['type'])}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Minerals">Minerals</option>
                <option value="Non-Op">Non-Op</option>
                <option value="Leasehold">Leasehold</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lead ID *
              </label>
              <input
                type="text"
                value={formData.leadId}
                onChange={(e) => handleInputChange('leadId', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.leadId ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter lead ID"
              />
              {errors.leadId && (
                <p className="text-red-500 text-sm mt-1">{errors.leadId}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                LOI Status
              </label>
              <select
                value={formData.loiStatus}
                onChange={(e) => handleInputChange('loiStatus', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Draft">Draft</option>
                <option value="Sent">Sent</option>
                <option value="Signed">Signed</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Seller Information */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Seller Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Seller Name *
              </label>
              <input
                type="text"
                value={formData.sellerName}
                onChange={(e) => handleInputChange('sellerName', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.sellerName ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter seller name"
              />
              {errors.sellerName && (
                <p className="text-red-500 text-sm mt-1">{errors.sellerName}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assigned Owner
              </label>
              <input
                type="text"
                value={formData.assignedOwner}
                onChange={(e) => handleInputChange('assignedOwner', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter assigned owner"
              />
            </div>
          </div>
        </Card>

        {/* Financial Information */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Value ($) *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.totalValue}
                onChange={(e) => handleInputChange('totalValue', parseFloat(e.target.value) || 0)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.totalValue ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
              {errors.totalValue && (
                <p className="text-red-500 text-sm mt-1">{errors.totalValue}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Net Mineral Acres *
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.nma}
                onChange={(e) => handleInputChange('nma', parseFloat(e.target.value) || 0)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.nma ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="0.0"
              />
              {errors.nma && (
                <p className="text-red-500 text-sm mt-1">{errors.nma}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price per Acre ($) *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.pricePerAcre}
                onChange={(e) => handleInputChange('pricePerAcre', parseFloat(e.target.value) || 0)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.pricePerAcre ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
              {errors.pricePerAcre && (
                <p className="text-red-500 text-sm mt-1">{errors.pricePerAcre}</p>
              )}
            </div>
          </div>
        </Card>

        {/* Dates and Documents */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Dates and Documents</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Effective Date
              </label>
              <input
                type="date"
                value={formData.effectiveDate}
                onChange={(e) => handleInputChange('effectiveDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                LOI Document ID
              </label>
              <input
                type="text"
                value={formData.loiDocumentId}
                onChange={(e) => handleInputChange('loiDocumentId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter document ID"
              />
            </div>
          </div>
        </Card>

        {/* Notes */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter any additional notes or comments..."
            />
          </div>
        </Card>

        {/* Form Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={handleCancel}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <XMarkIcon className="w-4 h-4" />
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <SaveIcon className="w-4 h-4" />
            {loading ? 'Saving...' : (isEditing ? 'Update Deal' : 'Create Deal')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DealFormPage;



