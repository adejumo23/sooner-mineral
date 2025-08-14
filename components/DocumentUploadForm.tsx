import React, { useState } from 'react';
import { ContactEnhanced, ContactDocument } from '../types';
import Button from './ui/Button';
import Input from './ui/Input';

interface DocumentUploadFormProps {
  onSave: (data: Partial<ContactDocument>) => void;
  onCancel: () => void;
  contact: ContactEnhanced | null;
}

const DocumentUploadForm: React.FC<DocumentUploadFormProps> = ({ onSave, onCancel, contact }) => {
  const [formData, setFormData] = useState<Partial<ContactDocument>>({
    documentName: '',
    category: 'Other',
    notes: '',
    redFlagStatus: false,
    linkedTracts: [],
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFile) {
      const documentData: Partial<ContactDocument> = {
        ...formData,
        fileType: selectedFile.type || selectedFile.name.split('.').pop()?.toUpperCase() || 'Unknown',
        fileSize: selectedFile.size,
        originalFileName: selectedFile.name,
        documentName: formData.documentName || selectedFile.name,
      };
      onSave(documentData);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Auto-generate document name if not provided
      if (!formData.documentName) {
        setFormData(prev => ({
          ...prev,
          documentName: file.name.replace(/\.[^/.]+$/, ''), // Remove file extension
        }));
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* File Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select File
        </label>
        <input
          type="file"
          onChange={handleFileChange}
          accept=".pdf,.docx,.doc,.csv,.png,.jpg,.jpeg"
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          required
        />
        <p className="mt-1 text-xs text-gray-500">
          Supported formats: PDF, DOCX, DOC, CSV, PNG, JPG
        </p>
      </div>

      {/* Document Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Document Name
        </label>
        <Input
          type="text"
          value={formData.documentName}
          onChange={(e) => handleInputChange('documentName', e.target.value)}
          placeholder="Enter document name"
          required
        />
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Category
        </label>
        <select
          value={formData.category}
          onChange={(e) => handleInputChange('category', e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          required
        >
          <option value="Lease">Lease</option>
          <option value="Conveyance">Conveyance</option>
          <option value="Title Opinion">Title Opinion</option>
          <option value="Deed">Deed</option>
          <option value="Contract">Contract</option>
          <option value="Correspondence">Correspondence</option>
          <option value="Legal">Legal</option>
          <option value="Financial">Financial</option>
          <option value="Research">Research</option>
          <option value="Other">Other</option>
        </select>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notes
        </label>
        <textarea
          value={formData.notes || ''}
          onChange={(e) => handleInputChange('notes', e.target.value)}
          rows={3}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="Optional description or summary of relevance"
        />
      </div>

      {/* Red Flag Toggle */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id="redFlag"
          checked={formData.redFlagStatus}
          onChange={(e) => handleInputChange('redFlagStatus', e.target.checked)}
          className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
        />
        <label htmlFor="redFlag" className="ml-2 block text-sm text-gray-900">
          Flag for legal review or urgent attention
        </label>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!selectedFile}>
          Upload Document
        </Button>
      </div>
    </form>
  );
};

export default DocumentUploadForm;
