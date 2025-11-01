import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { fetchUnit, createUnit, updateUnit, fetchUsers, fetchSections, fetchContacts } from '../services/api';
import { Unit, User, Section, Contact } from '../types';

const UnitFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState<Partial<Unit>>({
    unitName: '',
    operator: '',
    apiNumbers: [],
    targetFormations: [],
    status: 'Permitted',
    estimatedGrossAcres: 0,
    estimatedNetAcres: 0,
    county: '',
    state: '',
    linkedSectionIds: [],
    linkedContactIds: [],
    assignedBuyerId: '',
    heldByFund: false,
    exitStrategy: 'Hold',
    isLocked: false,
    notes: ''
  });

  const [users, setUsers] = useState<User[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [tempApiNumber, setTempApiNumber] = useState('');
  const [tempFormation, setTempFormation] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [usersData, sectionsData, contactsData] = await Promise.all([
          fetchUsers(),
          fetchSections().then(response => response.data || response),
          fetchContacts()
        ]);
        setUsers(usersData);
        setSections(sectionsData);
        setContacts(contactsData);

        if (isEditing && id) {
          const unitData = await fetchUnit(id);
          setFormData(unitData);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, isEditing]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.unitName?.trim()) {
      newErrors.unitName = 'Unit Name is required';
    }
    if (!formData.operator?.trim()) {
      newErrors.operator = 'Operator is required';
    }
    if (!formData.county?.trim()) {
      newErrors.county = 'County is required';
    }
    if (!formData.status) {
      newErrors.status = 'Status is required';
    }
    if (!formData.estimatedGrossAcres || formData.estimatedGrossAcres <= 0) {
      newErrors.estimatedGrossAcres = 'Estimated Gross Acres must be greater than 0';
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
        await updateUnit(id, formData);
      } else {
        await createUnit(formData as Omit<Unit, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>);
      }
      navigate('/units');
    } catch (error) {
      console.error('Error saving unit:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof Unit, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const addApiNumber = () => {
    if (tempApiNumber.trim() && !formData.apiNumbers?.includes(tempApiNumber.trim())) {
      handleInputChange('apiNumbers', [...(formData.apiNumbers || []), tempApiNumber.trim()]);
      setTempApiNumber('');
    }
  };

  const removeApiNumber = (index: number) => {
    const newApiNumbers = [...(formData.apiNumbers || [])];
    newApiNumbers.splice(index, 1);
    handleInputChange('apiNumbers', newApiNumbers);
  };

  const addFormation = () => {
    if (tempFormation.trim() && !formData.targetFormations?.includes(tempFormation.trim())) {
      handleInputChange('targetFormations', [...(formData.targetFormations || []), tempFormation.trim()]);
      setTempFormation('');
    }
  };

  const removeFormation = (index: number) => {
    const newFormations = [...(formData.targetFormations || [])];
    newFormations.splice(index, 1);
    handleInputChange('targetFormations', newFormations);
  };

  const addSection = (sectionId: string) => {
    if (!formData.linkedSectionIds?.includes(sectionId)) {
      handleInputChange('linkedSectionIds', [...(formData.linkedSectionIds || []), sectionId]);
    }
    setShowSectionModal(false);
  };

  const removeSection = (sectionId: string) => {
    const newSectionIds = formData.linkedSectionIds?.filter(id => id !== sectionId) || [];
    handleInputChange('linkedSectionIds', newSectionIds);
  };

  const addContact = (contactId: string) => {
    if (!formData.linkedContactIds?.includes(contactId)) {
      handleInputChange('linkedContactIds', [...(formData.linkedContactIds || []), contactId]);
    }
    setShowContactModal(false);
  };

  const removeContact = (contactId: string) => {
    const newContactIds = formData.linkedContactIds?.filter(id => id !== contactId) || [];
    handleInputChange('linkedContactIds', newContactIds);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          {isEditing ? 'Edit Unit' : 'Create New Unit'}
        </h1>
        <p className="text-gray-600 mt-2">
          {isEditing ? 'Update unit information and settings' : 'Define a new production, spacing, or drilling unit'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unit Name *
                </label>
                <Input
                  value={formData.unitName || ''}
                  onChange={(e) => handleInputChange('unitName', e.target.value)}
                  placeholder="e.g., Smith Unit #1"
                  error={errors.unitName}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Operator *
                </label>
                <Input
                  value={formData.operator || ''}
                  onChange={(e) => handleInputChange('operator', e.target.value)}
                  placeholder="e.g., Pioneer Natural Resources"
                  error={errors.operator}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  County *
                </label>
                <Input
                  value={formData.county || ''}
                  onChange={(e) => handleInputChange('county', e.target.value)}
                  placeholder="e.g., Midland"
                  error={errors.county}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State
                </label>
                <Input
                  value={formData.state || ''}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  placeholder="e.g., TX"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status *
                </label>
                <select
                  value={formData.status || ''}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Permitted">Permitted</option>
                  <option value="Producing">Producing</option>
                  <option value="Held by Production">Held by Production</option>
                  <option value="Plugged">Plugged</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Exit Strategy
                </label>
                <select
                  value={formData.exitStrategy || ''}
                  onChange={(e) => handleInputChange('exitStrategy', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Hold">Hold</option>
                  <option value="Flip">Flip</option>
                  <option value="LP Buyout">LP Buyout</option>
                </select>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Acreage & Wells</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Gross Acres *
                </label>
                <Input
                  type="number"
                  value={formData.estimatedGrossAcres || ''}
                  onChange={(e) => handleInputChange('estimatedGrossAcres', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  error={errors.estimatedGrossAcres}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Net Acres
                </label>
                <Input
                  type="number"
                  value={formData.estimatedNetAcres || ''}
                  onChange={(e) => handleInputChange('estimatedNetAcres', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Numbers
              </label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={tempApiNumber}
                  onChange={(e) => setTempApiNumber(e.target.value)}
                  placeholder="Enter API number"
                  className="flex-1"
                />
                <Button onClick={addApiNumber} type="button" variant="secondary">
                  Add
                </Button>
              </div>
              {formData.apiNumbers && formData.apiNumbers.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.apiNumbers.map((api, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                    >
                      {api}
                      <button
                        type="button"
                        onClick={() => removeApiNumber(index)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Formations
              </label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={tempFormation}
                  onChange={(e) => setTempFormation(e.target.value)}
                  placeholder="Enter formation name"
                  className="flex-1"
                />
                <Button onClick={addFormation} type="button" variant="secondary">
                  Add
                </Button>
              </div>
              {formData.targetFormations && formData.targetFormations.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.targetFormations.map((formation, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
                    >
                      {formation}
                      <button
                        type="button"
                        onClick={() => removeFormation(index)}
                        className="ml-2 text-green-600 hover:text-green-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Linked Data</h2>
            
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Linked Sections
                </label>
                <Button
                  onClick={() => setShowSectionModal(true)}
                  type="button"
                  variant="secondary"
                >
                  Add Sections
                </Button>
              </div>
              {formData.linkedSectionIds && formData.linkedSectionIds.length > 0 ? (
                <div className="space-y-2">
                  {formData.linkedSectionIds.map(sectionId => {
                    const section = sections.find(s => s.id === sectionId);
                    return section ? (
                      <div key={sectionId} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                        <span className="text-sm">{section.sectionName} - {section.county}, {section.state}</span>
                        <button
                          type="button"
                          onClick={() => removeSection(sectionId)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ) : null;
                  })}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No sections linked to this unit</p>
              )}
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Linked Owners
                </label>
                <Button
                  onClick={() => setShowContactModal(true)}
                  type="button"
                  variant="secondary"
                >
                  Add Owners
                </Button>
              </div>
              {formData.linkedContactIds && formData.linkedContactIds.length > 0 ? (
                <div className="space-y-2">
                  {formData.linkedContactIds.map(contactId => {
                    const contact = contacts.find(c => c.id === contactId);
                    return contact ? (
                      <div key={contactId} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                        <span className="text-sm">{contact.firstName} {contact.lastName} - {contact.county}, {contact.state}</span>
                        <button
                          type="button"
                          onClick={() => removeContact(contactId)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ) : null;
                  })}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No owners linked to this unit</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assigned Buyer
              </label>
              <select
                value={formData.assignedBuyerId || ''}
                onChange={(e) => handleInputChange('assignedBuyerId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a buyer</option>
                {users.filter(user => user.role === 'Buyer').map(user => (
                  <option key={user.id} value={user.id}>
                    {user.firstName} {user.lastName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Settings & Notes</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="heldByFund"
                  checked={formData.heldByFund || false}
                  onChange={(e) => handleInputChange('heldByFund', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="heldByFund" className="ml-2 block text-sm text-gray-900">
                  Held by Fund
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isLocked"
                  checked={formData.isLocked || false}
                  onChange={(e) => handleInputChange('isLocked', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isLocked" className="ml-2 block text-sm text-gray-900">
                  Lock Unit (prevents outreach)
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Internal Notes
              </label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Add internal notes about this unit..."
              />
            </div>
          </div>
        </Card>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/units')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={saving}
          >
            {saving ? 'Saving...' : (isEditing ? 'Update Unit' : 'Create Unit')}
          </Button>
        </div>
      </form>

      {/* Section Selection Modal */}
      <Modal
        isOpen={showSectionModal}
        onClose={() => setShowSectionModal(false)}
        title="Select Sections to Link"
      >
        <div className="max-h-96 overflow-y-auto">
          {sections.map(section => (
            <div
              key={section.id}
              className="flex items-center justify-between p-3 border-b border-gray-200 hover:bg-gray-50"
            >
              <div>
                <div className="font-medium">{section.sectionName}</div>
                <div className="text-sm text-gray-600">{section.county}, {section.state}</div>
              </div>
              <Button
                onClick={() => addSection(section.id)}
                type="button"
                variant="secondary"
                size="sm"
              >
                Link
              </Button>
            </div>
          ))}
        </div>
      </Modal>

      {/* Contact Selection Modal */}
      <Modal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        title="Select Owners to Link"
      >
        <div className="max-h-96 overflow-y-auto">
          {contacts.map(contact => (
            <div
              key={contact.id}
              className="flex items-center justify-between p-3 border-b border-gray-200 hover:bg-gray-50"
            >
              <div>
                <div className="font-medium">{contact.firstName} {contact.lastName}</div>
                <div className="text-sm text-gray-600">{contact.county}, {contact.state}</div>
              </div>
              <Button
                onClick={() => addContact(contact.id)}
                type="button"
                variant="secondary"
                size="sm"
              >
                Link
              </Button>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
};

export default UnitFormPage;
