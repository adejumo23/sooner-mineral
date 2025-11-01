import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchUsers, fetchSections, fetchUnits, createAssignment, updateAssignment, fetchAssignment } from '../services/api';
import { User, Section, Unit, Assignment, CreateAssignmentData } from '../types';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { ArrowLeftIcon, CheckIcon } from '../components/icons/Icons';

const AssignmentFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;
  
  const [users, setUsers] = useState<User[]>([]);
  const [tracts, setTracts] = useState<Tract[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState<CreateAssignmentData>({
    assetType: 'Tract',
    assetId: '',
    assignedBuyerId: '',
    priceCapUsd: 0,
    priceCapType: 'Per NRA',
    sourceChannel: 'Broker',
    priorityScore: 50,
    notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (isEditing && id) {
      loadAssignment();
    }
  }, [isEditing, id]);

  const loadData = async () => {
    try {
      const [usersData, sectionsResponse, unitsData] = await Promise.all([
        fetchUsers(),
        fetchSections(),
        fetchUnits()
      ]);
      
      const sectionsData = sectionsResponse.data || sectionsResponse;
      setUsers(usersData || []);
      setSections(sectionsData || []);
      setUnits(unitsData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      setUsers([]);
      setTracts([]);
      setUnits([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAssignment = async () => {
    if (!id) return;
    
    try {
      const assignment = await fetchAssignment(id);
      if (assignment) {
        setFormData({
          assetType: assignment.assetType,
          assetId: assignment.assetId,
          assignedBuyerId: assignment.assignedBuyerId,
          priceCapUsd: assignment.priceCapUsd,
          priceCapType: assignment.priceCapType,
          sourceChannel: assignment.sourceChannel,
          priorityScore: assignment.priorityScore,
          notes: assignment.notes || ''
        });
      }
    } catch (error) {
      console.error('Error loading assignment:', error);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.assetId) {
      newErrors.assetId = 'Asset is required';
    }
    if (!formData.assignedBuyerId) {
      newErrors.assignedBuyerId = 'Assigned buyer is required';
    }
    if (!formData.priceCapUsd || formData.priceCapUsd <= 0) {
      newErrors.priceCapUsd = 'Price cap must be greater than 0';
    }
    if (formData.priorityScore < 0 || formData.priorityScore > 100) {
      newErrors.priorityScore = 'Priority score must be between 0 and 100';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    
    try {
      if (isEditing && id) {
        await updateAssignment(id, formData);
      } else {
        await createAssignment(formData);
      }
      
      navigate('/assignments');
    } catch (error) {
      console.error('Error saving assignment:', error);
      alert('Failed to save assignment');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof CreateAssignmentData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const getAssetOptions = () => {
    if (formData.assetType === 'Tract') {
      return tracts.map(tract => ({
        value: tract.id,
        label: `${tract.tractName} (${tract.county}, ${tract.state})`
      }));
    } else {
      return units.map(unit => ({
        value: unit.id,
        label: `${unit.unitName} (${unit.county}, ${unit.state})`
      }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Link to="/assignments">
            <Button variant="secondary" className="flex items-center space-x-2">
              <ArrowLeftIcon className="h-5 w-5" />
              <span>Back</span>
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEditing ? 'Edit Buyer Assignment' : 'New Buyer Assignment'}
            </h1>
            <p className="text-gray-600 mt-1">
              {isEditing ? 'Update buyer assignment details' : 'Create a new buyer assignment'}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <Card>
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Asset Selection */}
            <div className="lg:col-span-2">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Asset Selection</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Asset Type *
                  </label>
                  <select
                    value={formData.assetType}
                    onChange={(e) => {
                      handleInputChange('assetType', e.target.value as 'Tract' | 'Unit');
                      handleInputChange('assetId', ''); // Reset asset selection when type changes
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sc-blue focus:border-transparent"
                    required
                  >
                    <option value="Tract">Tract</option>
                    <option value="Unit">Unit</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Asset *
                  </label>
                  <select
                    value={formData.assetId}
                    onChange={(e) => handleInputChange('assetId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sc-blue focus:border-transparent"
                    required
                  >
                    <option value="">Select {formData.assetType}</option>
                    {getAssetOptions().map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.assetId && (
                    <p className="mt-1 text-sm text-red-600">{errors.assetId}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Assignment Details */}
            <div className="lg:col-span-2">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Assignment Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assigned Buyer *
                  </label>
                  <select
                    value={formData.assignedBuyerId}
                    onChange={(e) => handleInputChange('assignedBuyerId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sc-blue focus:border-transparent"
                    required
                  >
                    <option value="">Select Buyer</option>
                    {users.filter(u => u.role.name === 'Buyer').map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                  {errors.assignedBuyerId && (
                    <p className="mt-1 text-sm text-red-600">{errors.assignedBuyerId}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Source Channel *
                  </label>
                  <select
                    value={formData.sourceChannel}
                    onChange={(e) => handleInputChange('sourceChannel', e.target.value as 'Broker' | 'Inbound' | 'Outbound')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sc-blue focus:border-transparent"
                    required
                  >
                    <option value="Broker">Broker</option>
                    <option value="Inbound">Inbound</option>
                    <option value="Outbound">Outbound</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Financial Details */}
            <div className="lg:col-span-2">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Financial Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price Cap (USD) *
                  </label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={formData.priceCapUsd || ''}
                    onChange={(e) => handleInputChange('priceCapUsd', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                    required
                    error={errors.priceCapUsd}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price Cap Type *
                  </label>
                  <select
                    value={formData.priceCapType}
                    onChange={(e) => handleInputChange('priceCapType', e.target.value as 'Per NRA' | 'Per Acre')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sc-blue focus:border-transparent"
                    required
                  >
                    <option value="Per NRA">Per NRA</option>
                    <option value="Per Acre">Per Acre</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Priority and Notes */}
            <div className="lg:col-span-2">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Priority & Notes</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority Score *
                  </label>
                  <Input
                    type="number"
                    placeholder="50"
                    value={formData.priorityScore || ''}
                    onChange={(e) => handleInputChange('priorityScore', parseInt(e.target.value) || 50)}
                    min="0"
                    max="100"
                    required
                    error={errors.priorityScore}
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    0 = Low priority, 100 = High priority
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sc-blue focus:border-transparent"
                    placeholder="Add notes about this assignment..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Link to="/assignments">
              <Button variant="secondary" type="button">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={saving} className="flex items-center space-x-2">
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckIcon className="h-5 w-5" />
                  <span>{isEditing ? 'Update Assignment' : 'Create Assignment'}</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default AssignmentFormPage;
