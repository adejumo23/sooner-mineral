import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchLead, createLead, updateLead, fetchUsers, fetchContacts, fetchSections, fetchUnits } from '../services/api';
import { Lead, User, Contact, Section, Unit, CreateLeadData, UpdateLeadData } from '../types';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { ArrowLeftIcon } from '../components/icons/Icons';

const LeadFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [users, setUsers] = useState<User[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [tracts, setTracts] = useState<Tract[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<CreateLeadData>({
    linkedContactId: '',
    linkedTractIds: [],
    linkedUnitIds: [],
    buyerId: '',
    sourceChannel: 'Broker',
    priorityScore: 50,
    notes: '',
    assignmentId: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (isEditing && id) {
      loadLead();
    }
  }, [isEditing, id]);

  const loadData = async () => {
    try {
      const [usersData, contactsData, tractsData, unitsData] = await Promise.all([
        fetchUsers(),
        fetchContacts(),
        fetchSections().then(response => response.data || response),
        fetchUnits()
      ]);
      setUsers(usersData || []);
      setContacts(contactsData || []);
      setTracts(tractsData || []);
      setUnits(unitsData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLead = async () => {
    try {
      const leadData = await fetchLead(id!);
      if (leadData) {
        setFormData({
          linkedContactId: leadData.linkedContactId,
          linkedTractIds: leadData.linkedTractIds,
          linkedUnitIds: leadData.linkedUnitIds,
          buyerId: leadData.buyerId,
          sourceChannel: leadData.sourceChannel,
          priorityScore: leadData.priorityScore,
          notes: leadData.notes || '',
          assignmentId: leadData.assignmentId || ''
        });
      }
    } catch (error) {
      console.error('Error loading lead:', error);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.linkedContactId) {
      newErrors.linkedContactId = 'Contact is required';
    }
    if (!formData.buyerId) {
      newErrors.buyerId = 'Buyer is required';
    }
    if (formData.priorityScore < 0 || formData.priorityScore > 100) {
      newErrors.priorityScore = 'Priority score must be between 0 and 100';
    }
    if (formData.linkedTractIds.length === 0 && formData.linkedUnitIds.length === 0) {
      newErrors.assets = 'At least one tract or unit must be selected';
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
        await updateLead(id, formData);
      } else {
        await createLead(formData);
      }
      
      navigate('/leads');
    } catch (error) {
      console.error('Error saving lead:', error);
      alert('Failed to save lead');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (key: keyof CreateLeadData, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: '' }));
    }
  };

  const handleAssetToggle = (assetType: 'tract' | 'unit', assetId: string) => {
    if (assetType === 'tract') {
      const newTractIds = formData.linkedTractIds.includes(assetId)
        ? formData.linkedTractIds.filter(id => id !== assetId)
        : [...formData.linkedTractIds, assetId];
      handleInputChange('linkedTractIds', newTractIds);
    } else {
      const newUnitIds = formData.linkedUnitIds.includes(assetId)
        ? formData.linkedUnitIds.filter(id => id !== assetId)
        : [...formData.linkedUnitIds, assetId];
      handleInputChange('linkedUnitIds', newUnitIds);
    }
    
    if (errors.assets) {
      setErrors(prev => ({ ...prev, assets: '' }));
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {isEditing ? 'Edit Lead' : 'New Lead'}
          </h1>
          <p className="text-sc-slate">
            {isEditing ? 'Update lead information' : 'Create a new lead'}
          </p>
        </div>
        <Link to="/leads">
          <Button variant="outline">
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Leads
          </Button>
        </Link>
      </div>

      {/* Form */}
      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Contact Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contact *
            </label>
            <select
              value={formData.linkedContactId}
              onChange={(e) => handleInputChange('linkedContactId', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-sc-blue ${
                errors.linkedContactId ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select a contact</option>
              {contacts.map(contact => (
                <option key={contact.id} value={contact.id}>
                  {contact.name} - {contact.city}, {contact.state}
                </option>
              ))}
            </select>
            {errors.linkedContactId && (
              <p className="text-red-500 text-sm mt-1">{errors.linkedContactId}</p>
            )}
          </div>

          {/* Asset Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assets *
            </label>
            
            {/* Tracts */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Tracts</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {tracts.map(tract => (
                  <label key={tract.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.linkedTractIds.includes(tract.id)}
                      onChange={() => handleAssetToggle('tract', tract.id)}
                      className="rounded border-gray-300 text-sc-blue focus:ring-sc-blue"
                    />
                    <span className="text-sm text-gray-700">
                      {tract.tractName} ({tract.county}, {tract.state})
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Units */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Units</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {units.map(unit => (
                  <label key={unit.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.linkedUnitIds.includes(unit.id)}
                      onChange={() => handleAssetToggle('unit', unit.id)}
                      className="rounded border-gray-300 text-sc-blue focus:ring-sc-blue"
                    />
                    <span className="text-sm text-gray-700">
                      {unit.unitName} ({unit.county}, {unit.state})
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {errors.assets && (
              <p className="text-red-500 text-sm mt-1">{errors.assets}</p>
            )}
          </div>

          {/* Buyer Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buyer *
            </label>
            <select
              value={formData.buyerId}
              onChange={(e) => handleInputChange('buyerId', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-sc-blue ${
                errors.buyerId ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select a buyer</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.role.name})
                </option>
              ))}
            </select>
            {errors.buyerId && (
              <p className="text-red-500 text-sm mt-1">{errors.buyerId}</p>
            )}
          </div>

          {/* Source Channel */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Source Channel
            </label>
            <select
              value={formData.sourceChannel}
              onChange={(e) => handleInputChange('sourceChannel', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sc-blue"
            >
              <option value="Broker">Broker</option>
              <option value="Inbound">Inbound</option>
              <option value="Outbound">Outbound</option>
            </select>
          </div>

          {/* Priority Score */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority Score
            </label>
            <Input
              type="number"
              min="0"
              max="100"
              value={formData.priorityScore}
              onChange={(e) => handleInputChange('priorityScore', parseInt(e.target.value))}
              error={errors.priorityScore}
            />
            <p className="text-sm text-gray-500 mt-1">
              0 = Low priority, 100 = High priority
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sc-blue"
              placeholder="Enter any additional notes about this lead..."
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Link to="/leads">
              <Button variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : (isEditing ? 'Update Lead' : 'Create Lead')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default LeadFormPage;
