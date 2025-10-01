import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from './ui/Button';
import { 
  mockFetchTicketCategories, 
  mockFetchTicketPriorities, 
  mockCreateTicket,
  TicketCategory, 
  TicketPriority,
  CreateTicketRequest 
} from '../services/ticketApi';
import { mockEmailService } from '../services/emailService';

interface TicketFormProps {
  onSuccess?: (ticketId: string) => void;
  onCancel?: () => void;
  initialData?: Partial<CreateTicketRequest>;
}

const TicketForm: React.FC<TicketFormProps> = ({ onSuccess, onCancel, initialData }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<TicketCategory[]>([]);
  const [priorities, setPriorities] = useState<TicketPriority[]>([]);
  const [formData, setFormData] = useState<CreateTicketRequest>({
    title: '',
    description: '',
    category_id: '',
    priority_id: '',
    module_name: '',
    page_url: '',
    browser_info: '',
    user_agent: '',
    ...initialData
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    loadFormData();
    // Capture current page info
    setFormData(prev => ({
      ...prev,
      page_url: window.location.pathname,
      user_agent: navigator.userAgent,
      browser_info: `${navigator.userAgent.split(' ')[0]} ${navigator.userAgent.split(' ')[1] || ''}`
    }));
  }, []);

  const loadFormData = async () => {
    try {
      const [categoriesData, prioritiesData] = await Promise.all([
        mockFetchTicketCategories(),
        mockFetchTicketPriorities()
      ]);
      setCategories(categoriesData);
      setPriorities(prioritiesData);
    } catch (error) {
      console.error('Error loading form data:', error);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 5) {
      newErrors.title = 'Title must be at least 5 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    if (!formData.category_id) {
      newErrors.category_id = 'Category is required';
    }

    if (!formData.priority_id) {
      newErrors.priority_id = 'Priority is required';
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
      const newTicket = await mockCreateTicket(formData);
      
      // Send email notification to administrators
      try {
        const adminEmails = ['admin@sooner-mineral.com', 'support@sooner-mineral.com'];
        const reporter = {
          name: 'Current User', // This would come from auth context
          email: 'user@example.com'
        };
        
        await mockEmailService.sendNewTicketNotification(newTicket, reporter, adminEmails);
        console.log('Email notification sent successfully');
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
        // Don't fail the ticket creation if email fails
      }
      
      // Show success message
      alert(`Ticket ${newTicket.ticket_number} created successfully! An email notification has been sent to the administrators.`);
      
      if (onSuccess) {
        onSuccess(newTicket.id);
      } else {
        navigate('/tickets');
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
      alert('Failed to create ticket. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreateTicketRequest, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const getModuleName = (url: string): string => {
    const pathSegments = url.split('/').filter(Boolean);
    if (pathSegments.length === 0) return 'Dashboard';
    
    const moduleMap: { [key: string]: string } = {
      'tracts': 'Tracts Management',
      'units': 'Units Management',
      'leads': 'Leads Management',
      'contacts': 'Contacts Management',
      'assignments': 'Assignments Management',
      'mapping': 'Mapping Module',
      'reporting': 'Reporting Module',
      'esg': 'ESG Tracking',
      'data-import': 'Data Import',
      'users': 'User Management',
      'roles': 'Role Management',
      'privileges': 'Privilege Management',
      'calendar-tasks': 'Calendar & Tasks',
      'document-generation': 'Document Generation',
      'communication': 'Message Center',
      'acreage-schedule': 'Acreage Schedule',
      'pricing': 'Pricing Module',
      'lp-portal': 'LP Portal'
    };
    
    return moduleMap[pathSegments[0]] || pathSegments[0].charAt(0).toUpperCase() + pathSegments[0].slice(1);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Support Ticket</h2>
        <p className="text-gray-600">
          Describe the issue you're experiencing and we'll get back to you as soon as possible.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Issue Title *
          </label>
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
              errors.title ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Brief description of the issue"
            maxLength={255}
          />
          {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
        </div>

        {/* Category and Priority */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <select
              id="category_id"
              value={formData.category_id}
              onChange={(e) => handleInputChange('category_id', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                errors.category_id ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {errors.category_id && <p className="mt-1 text-sm text-red-600">{errors.category_id}</p>}
          </div>

          <div>
            <label htmlFor="priority_id" className="block text-sm font-medium text-gray-700 mb-2">
              Priority *
            </label>
            <select
              id="priority_id"
              value={formData.priority_id}
              onChange={(e) => handleInputChange('priority_id', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                errors.priority_id ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select priority</option>
              {priorities.map((priority) => (
                <option key={priority.id} value={priority.id}>
                  {priority.name}
                </option>
              ))}
            </select>
            {errors.priority_id && <p className="mt-1 text-sm text-red-600">{errors.priority_id}</p>}
          </div>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={6}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
              errors.description ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Please provide a detailed description of the issue, including steps to reproduce if applicable..."
          />
          {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
          <p className="mt-1 text-sm text-gray-500">
            {formData.description.length}/1000 characters
          </p>
        </div>

        {/* Module Information */}
        <div className="bg-gray-50 p-4 rounded-md">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Technical Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Module</label>
              <input
                type="text"
                value={getModuleName(formData.page_url || '')}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Page URL</label>
              <input
                type="text"
                value={formData.page_url}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Browser</label>
              <input
                type="text"
                value={formData.browser_info}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">User Agent</label>
              <input
                type="text"
                value={formData.user_agent}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
          {onCancel && (
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={loading}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            {loading ? 'Creating Ticket...' : 'Create Ticket'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default TicketForm;
