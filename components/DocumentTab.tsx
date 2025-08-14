import React, { useState, useEffect } from 'react';
import { 
  DocumentIcon, 
  PlusIcon, 
  EyeIcon, 
  DownloadIcon, 
  PencilIcon,
  TrashIcon,
  VariableIcon
} from './icons/Icons';
import type { 
  GeneratedDocument, 
  DocumentTemplate, 
  GenerateDocumentRequest,
  ContactEnhanced,
  LeadEnhanced,
  Deal,
  User
} from '../types';
import * as api from '../services/api';

interface DocumentTabProps {
  currentUser: User;
  relatedContactId?: string;
  relatedLeadId?: string;
  relatedDealId?: string;
  relatedContact?: ContactEnhanced;
  relatedLead?: LeadEnhanced;
  relatedDeal?: Deal;
}

const DocumentTab: React.FC<DocumentTabProps> = ({ 
  currentUser, 
  relatedContactId, 
  relatedLeadId, 
  relatedDealId,
  relatedContact,
  relatedLead,
  relatedDeal
}) => {
  const [documents, setDocuments] = useState<GeneratedDocument[]>([]);
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showGenerateDocument, setShowGenerateDocument] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [showDocumentPreview, setShowDocumentPreview] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<GeneratedDocument | null>(null);

  const [newDocument, setNewDocument] = useState<GenerateDocumentRequest>({
    templateId: '',
    documentName: '',
    variables: {},
    fileType: 'docx',
    relatedContactId,
    relatedLeadId,
    relatedDealId
  });

  useEffect(() => {
    fetchData();
  }, [relatedContactId, relatedLeadId, relatedDealId]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [documentsData, templatesData] = await Promise.all([
        api.fetchGeneratedDocuments({
          relatedContactId,
          relatedLeadId,
          relatedDealId
        }),
        api.fetchDocumentTemplates({ isActive: true })
      ]);
      
      setDocuments(documentsData);
      setTemplates(templatesData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
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
        fileType: 'docx',
        relatedContactId,
        relatedLeadId,
        relatedDealId
      });
      setSelectedTemplate(null);
      fetchData();
    } catch (error) {
      console.error('Failed to generate document:', error);
    }
  };

  const handleTemplateSelect = (template: DocumentTemplate) => {
    setSelectedTemplate(template);
    
    // Pre-populate variables with available data
    const variables: Record<string, string> = {};
    
    if (relatedContact) {
      variables['{{Contact Name}}'] = relatedContact.name || '';
      variables['{{Contact Email}}'] = relatedContact.email || '';
      variables['{{Contact Phone}}'] = relatedContact.phone || '';
    }
    
    if (relatedLead) {
      variables['{{Lead Status}}'] = relatedLead.status || '';
      variables['{{Lead Source}}'] = relatedLead.source || '';
    }
    
    if (relatedDeal) {
      variables['{{Deal Value}}'] = relatedDeal.value?.toString() || '';
      variables['{{Deal Stage}}'] = relatedDeal.stage || '';
    }
    
    // System variables
    variables['{{Current Date}}'] = new Date().toLocaleDateString();
    variables['{{Current Time}}'] = new Date().toLocaleTimeString();
    
    setNewDocument(prev => ({
      ...prev,
      templateId: template.id,
      documentName: `${template.name} - ${new Date().toLocaleDateString()}`,
      variables
    }));
    setShowGenerateDocument(true);
  };

  const handleDocumentAction = (document: GeneratedDocument, action: 'view' | 'download' | 'edit' | 'delete') => {
    switch (action) {
      case 'view':
        setSelectedDocument(document);
        setShowDocumentPreview(true);
        break;
      case 'download':
        // In a real app, this would trigger file download
        console.log('Downloading document:', document.id);
        break;
      case 'edit':
        // In a real app, this would open document editor
        console.log('Editing document:', document.id);
        break;
      case 'delete':
        if (confirm('Are you sure you want to delete this document?')) {
          // In a real app, this would delete the document
          console.log('Deleting document:', document.id);
        }
        break;
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
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Documents</h3>
          <p className="text-sm text-gray-600">
            {documents.length} document{documents.length !== 1 ? 's' : ''} found
          </p>
        </div>
        
        <button
          onClick={() => setShowGenerateDocument(true)}
          className="flex items-center px-4 py-2 text-sm font-medium text-white bg-orange-500 border border-transparent rounded-md hover:bg-orange-600"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Generate Document
        </button>
      </div>

      {/* Documents List */}
      {documents.length > 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
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
                {documents.map((document) => (
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
                        <button
                          onClick={() => handleDocumentAction(document, 'view')}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDocumentAction(document, 'download')}
                          className="text-green-600 hover:text-green-900"
                        >
                          <DownloadIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDocumentAction(document, 'edit')}
                          className="text-yellow-600 hover:text-yellow-900"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDocumentAction(document, 'delete')}
                          className="text-red-600 hover:text-red-900"
                        >
                          <TrashIcon className="h-4 w-4" />
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
        <div className="text-center py-12">
          <DocumentIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No documents yet</h3>
          <p className="text-gray-600 mb-4">
            Generate your first document using one of the available templates.
          </p>
          <button
            onClick={() => setShowGenerateDocument(true)}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-orange-500 border border-transparent rounded-md hover:bg-orange-600"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Generate Document
          </button>
        </div>
      )}

      {/* Generate Document Modal */}
      {showGenerateDocument && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-4/5 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Generate Document</h3>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Template</label>
                  <div className="grid grid-cols-1 gap-3">
                    {templates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => handleTemplateSelect(template)}
                        className={`p-4 border rounded-lg text-left transition-colors ${
                          selectedTemplate?.id === template.id
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900">{template.name}</div>
                            <div className="text-sm text-gray-600">{template.description}</div>
                            <div className="flex items-center mt-2">
                              <VariableIcon className="h-4 w-4 text-gray-400 mr-1" />
                              <span className="text-xs text-gray-500">
                                {template.variables.length} variables
                              </span>
                            </div>
                          </div>
                          <div className="text-sm text-gray-500">{template.category}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {selectedTemplate && (
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
                )}
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
                  disabled={!newDocument.documentName || !selectedTemplate}
                  className="px-4 py-2 text-sm font-medium text-white bg-orange-500 border border-transparent rounded-md hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Generate Document
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {showDocumentPreview && selectedDocument && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-4/5 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">{selectedDocument.documentName}</h3>
                <button
                  onClick={() => setShowDocumentPreview(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Template:</span>
                      <span className="ml-2 text-gray-900">{selectedDocument.templateName}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Status:</span>
                      <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedDocument.status)}`}>
                        {selectedDocument.status}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Version:</span>
                      <span className="ml-2 text-gray-900">v{selectedDocument.version}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Generated:</span>
                      <span className="ml-2 text-gray-900">{selectedDocument.generatedAt.toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Document Content</label>
                  <div className="border border-gray-300 rounded-md p-4 bg-white max-h-96 overflow-y-auto">
                    <pre className="text-sm text-gray-900 whitespace-pre-wrap font-mono">
                      {selectedDocument.content}
                    </pre>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowDocumentPreview(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={() => handleDocumentAction(selectedDocument, 'download')}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-500 border border-transparent rounded-md hover:bg-green-600"
                >
                  <DownloadIcon className="h-4 w-4 mr-2 inline" />
                  Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentTab;
