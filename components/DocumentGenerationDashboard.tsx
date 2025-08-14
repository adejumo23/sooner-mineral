import React, { useState, useEffect } from 'react';
import { 
  DocumentIcon, 
  TemplateIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  EyeIcon, 
  DownloadIcon, 
  FilterIcon,
  VariableIcon,
  FileTextIcon
} from './icons/Icons';
import type { 
  DocumentTemplate, 
  GeneratedDocument, 
  CreateTemplateRequest, 
  UpdateTemplateRequest, 
  GenerateDocumentRequest,
  TemplateFilter,
  DocumentFilter,
  VariableMapping,
  User
} from '../types';
import * as api from '../services/api';

interface DocumentGenerationDashboardProps {
  currentUser: User;
}

const DocumentGenerationDashboard: React.FC<DocumentGenerationDashboardProps> = ({ currentUser }) => {
  // State management
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [generatedDocuments, setGeneratedDocuments] = useState<GeneratedDocument[]>([]);
  const [selectedView, setSelectedView] = useState<'templates' | 'documents'>('templates');
  const [isLoading, setIsLoading] = useState(true);
  
  // Template management
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [showEditTemplate, setShowEditTemplate] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<DocumentTemplate | null>(null);
  const [templateFilters, setTemplateFilters] = useState<TemplateFilter>({});
  
  // Document generation
  const [showGenerateDocument, setShowGenerateDocument] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [documentFilters, setDocumentFilters] = useState<DocumentFilter>({});
  
  // Form states
  const [newTemplate, setNewTemplate] = useState<CreateTemplateRequest>({
    name: '',
    description: '',
    category: 'Other',
    content: '',
    fileType: 'docx'
  });
  
  const [newDocument, setNewDocument] = useState<GenerateDocumentRequest>({
    templateId: '',
    documentName: '',
    variables: {},
    fileType: 'docx'
  });

  useEffect(() => {
    fetchData();
  }, [templateFilters, documentFilters]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [templatesData, documentsData] = await Promise.all([
        api.fetchDocumentTemplates(templateFilters),
        api.fetchGeneratedDocuments(documentFilters)
      ]);
      
      setTemplates(templatesData);
      setGeneratedDocuments(documentsData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    try {
      await api.createDocumentTemplate(newTemplate);
      setShowCreateTemplate(false);
      setNewTemplate({
        name: '',
        description: '',
        category: 'Other',
        content: '',
        fileType: 'docx'
      });
      fetchData();
    } catch (error) {
      console.error('Failed to create template:', error);
    }
  };

  const handleUpdateTemplate = async () => {
    if (!editingTemplate) return;
    
    try {
      await api.updateDocumentTemplate(editingTemplate.id, editingTemplate);
      setShowEditTemplate(false);
      setEditingTemplate(null);
      fetchData();
    } catch (error) {
      console.error('Failed to update template:', error);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    
    try {
      await api.deleteDocumentTemplate(templateId);
      fetchData();
    } catch (error) {
      console.error('Failed to delete template:', error);
    }
  };

  const handleGenerateDocument = async () => {
    try {
      await api.generateDocument(newDocument);
      setShowGenerateDocument(false);
      setNewDocument({
        templateId: '',
        documentName: '',
        variables: {},
        fileType: 'docx'
      });
      setSelectedTemplate(null);
      fetchData();
    } catch (error) {
      console.error('Failed to generate document:', error);
    }
  };

  const handleTemplateSelect = (template: DocumentTemplate) => {
    setSelectedTemplate(template);
    setNewDocument(prev => ({
      ...prev,
      templateId: template.id,
      documentName: `${template.name} - ${new Date().toLocaleDateString()}`,
      variables: {}
    }));
    setShowGenerateDocument(true);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'LOI': return 'bg-blue-100 text-blue-800';
      case 'Call Script': return 'bg-green-100 text-green-800';
      case 'Due Diligence': return 'bg-purple-100 text-purple-800';
      case 'Mail Merge': return 'bg-yellow-100 text-yellow-800';
      case 'Contract': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'final': return 'bg-green-100 text-green-800';
      case 'signed': return 'bg-blue-100 text-blue-800';
      case 'shared': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading document generation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <DocumentIcon className="h-8 w-8 text-orange-500" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Document Generation</h1>
              <p className="text-sm text-gray-600">Create templates and generate documents with dynamic data</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowCreateTemplate(true)}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-orange-500 border border-transparent rounded-md hover:bg-orange-600"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              New Template
            </button>
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setSelectedView('templates')}
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
              selectedView === 'templates'
                ? 'bg-orange-500 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <TemplateIcon className="h-4 w-4 mr-2" />
            Templates
          </button>
          <button
            onClick={() => setSelectedView('documents')}
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
              selectedView === 'documents'
                ? 'bg-orange-500 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <FileTextIcon className="h-4 w-4 mr-2" />
            Generated Documents
          </button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Filters Panel */}
        <div className="w-80 bg-white border-r border-gray-200 p-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Filters</h3>
            <button
              onClick={() => {
                if (selectedView === 'templates') {
                  setTemplateFilters({});
                } else {
                  setDocumentFilters({});
                }
              }}
              className="text-sm text-orange-600 hover:text-orange-700"
            >
              Clear All
            </button>
          </div>

          {selectedView === 'templates' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={templateFilters.category || ''}
                  onChange={(e) => setTemplateFilters(prev => ({ ...prev, category: e.target.value || undefined }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="">All Categories</option>
                  <option value="LOI">LOI</option>
                  <option value="Call Script">Call Script</option>
                  <option value="Due Diligence">Due Diligence</option>
                  <option value="Mail Merge">Mail Merge</option>
                  <option value="Contract">Contract</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={templateFilters.isActive === undefined ? '' : templateFilters.isActive.toString()}
                  onChange={(e) => setTemplateFilters(prev => ({ 
                    ...prev, 
                    isActive: e.target.value === '' ? undefined : e.target.value === 'true' 
                  }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="">All Statuses</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={documentFilters.category || ''}
                  onChange={(e) => setDocumentFilters(prev => ({ ...prev, category: e.target.value || undefined }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="">All Categories</option>
                  <option value="LOI">LOI</option>
                  <option value="Call Script">Call Script</option>
                  <option value="Due Diligence">Due Diligence</option>
                  <option value="Mail Merge">Mail Merge</option>
                  <option value="Contract">Contract</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={documentFilters.status || ''}
                  onChange={(e) => setDocumentFilters(prev => ({ ...prev, status: e.target.value || undefined }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="">All Statuses</option>
                  <option value="draft">Draft</option>
                  <option value="final">Final</option>
                  <option value="signed">Signed</option>
                  <option value="shared">Shared</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Final Version
                </label>
                <select
                  value={documentFilters.isFinalVersion === undefined ? '' : documentFilters.isFinalVersion.toString()}
                  onChange={(e) => setDocumentFilters(prev => ({ 
                    ...prev, 
                    isFinalVersion: e.target.value === '' ? undefined : e.target.value === 'true' 
                  }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="">All Versions</option>
                  <option value="true">Final Only</option>
                  <option value="false">Draft Only</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          {selectedView === 'templates' ? (
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Document Templates</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {templates.length} templates found
                </p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Template
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Variables
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {templates.map((template) => (
                      <tr key={template.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{template.name}</div>
                            {template.description && (
                              <div className="text-sm text-gray-500">{template.description}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(template.category)}`}>
                            {template.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-1">
                            <VariableIcon className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-900">{template.variables.length}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            template.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {template.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleTemplateSelect(template)}
                              className="text-orange-600 hover:text-orange-900"
                            >
                              Generate
                            </button>
                            <button
                              onClick={() => {
                                setEditingTemplate(template);
                                setShowEditTemplate(true);
                              }}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteTemplate(template.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Generated Documents</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {generatedDocuments.length} documents found
                </p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Document
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Template
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Version
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {generatedDocuments.map((document) => (
                      <tr key={document.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{document.documentName}</div>
                            <div className="text-sm text-gray-500">
                              Generated {document.generatedAt.toLocaleDateString()}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{document.templateName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(document.status)}`}>
                            {document.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-900">v{document.version}</span>
                            {document.isFinalVersion && (
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                Final
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button className="text-blue-600 hover:text-blue-900">
                              View
                            </button>
                            <button className="text-green-600 hover:text-green-900">
                              <DownloadIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Template Modal */}
      {showCreateTemplate && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-4/5 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Create New Template</h3>
                <button
                  onClick={() => setShowCreateTemplate(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Template Name</label>
                    <input
                      type="text"
                      value={newTemplate.name}
                      onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      placeholder="Enter template name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Category</label>
                    <select
                      value={newTemplate.category}
                      onChange={(e) => setNewTemplate(prev => ({ ...prev, category: e.target.value as any }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    >
                      <option value="LOI">LOI</option>
                      <option value="Call Script">Call Script</option>
                      <option value="Due Diligence">Due Diligence</option>
                      <option value="Mail Merge">Mail Merge</option>
                      <option value="Contract">Contract</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={newTemplate.description}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    rows={2}
                    placeholder="Enter template description"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">File Type</label>
                    <select
                      value={newTemplate.fileType}
                      onChange={(e) => setNewTemplate(prev => ({ ...prev, fileType: e.target.value as any }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    >
                      <option value="docx">Word Document (.docx)</option>
                      <option value="pdf">PDF (.pdf)</option>
                      <option value="html">HTML (.html)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Template Content
                    <span className="text-xs text-gray-500 ml-2">
                      Use {'{{Variable Name}}'} for dynamic fields
                    </span>
                  </label>
                  <textarea
                    value={newTemplate.content}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, content: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-mono"
                    rows={15}
                    placeholder="Enter your template content here..."
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowCreateTemplate(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTemplate}
                  disabled={!newTemplate.name || !newTemplate.content}
                  className="px-4 py-2 text-sm font-medium text-white bg-orange-500 border border-transparent rounded-md hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Generate Document Modal */}
      {showGenerateDocument && selectedTemplate && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-4/5 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Generate Document from Template</h3>
                <button
                  onClick={() => setShowGenerateDocument(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Document Name</label>
                    <input
                      type="text"
                      value={newDocument.documentName}
                      onChange={(e) => setNewDocument(prev => ({ ...prev, documentName: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      placeholder="Enter document name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">File Type</label>
                    <select
                      value={newDocument.fileType}
                      onChange={(e) => setNewDocument(prev => ({ ...prev, fileType: e.target.value as any }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    >
                      <option value="docx">Word Document (.docx)</option>
                      <option value="pdf">PDF (.pdf)</option>
                      <option value="html">HTML (.html)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Template Variables
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedTemplate.variables.map((variable) => (
                      <div key={variable}>
                        <label className="block text-sm font-medium text-gray-700">
                          {variable.replace(/[{}]/g, '')}
                        </label>
                        <input
                          type="text"
                          value={newDocument.variables[variable] || ''}
                          onChange={(e) => setNewDocument(prev => ({
                            ...prev,
                            variables: { ...prev.variables, [variable]: e.target.value }
                          }))}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                          placeholder={`Enter ${variable.replace(/[{}]/g, '')}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowGenerateDocument(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerateDocument}
                  disabled={!newDocument.documentName}
                  className="px-4 py-2 text-sm font-medium text-white bg-orange-500 border border-transparent rounded-md hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Generate Document
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentGenerationDashboard;
