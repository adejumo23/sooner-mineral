import React from 'react';
import { ContactDocument } from '../types';
import { DocumentIcon, CalendarIcon, UserIcon, ExclamationTriangleIcon } from './icons/Icons';

interface DocumentDetailsProps {
  document: ContactDocument;
}

const DocumentDetails: React.FC<DocumentDetailsProps> = ({ document }) => {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Lease': return 'bg-blue-100 text-blue-800';
      case 'Deed': return 'bg-green-100 text-green-800';
      case 'Title Opinion': return 'bg-purple-100 text-purple-800';
      case 'Contract': return 'bg-orange-100 text-orange-800';
      case 'Legal': return 'bg-red-100 text-red-800';
      case 'Financial': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with key information */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-center space-x-3">
          <DocumentIcon className="w-8 h-8 text-blue-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{document.documentName}</h3>
            <p className="text-sm text-gray-500">{document.originalFileName}</p>
          </div>
        </div>
      </div>

      {/* Document Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-500">Category</label>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(document.category)}`}>
              {document.category}
            </span>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-500">File Type</label>
            <p className="text-sm text-gray-900">{document.fileType}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-500">File Size</label>
            <p className="text-sm text-gray-900">{formatFileSize(document.fileSize)}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-500">Red Flag Status</label>
            <div className="flex items-center mt-1">
              {document.redFlagStatus ? (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
                  Flagged for Review
                </span>
              ) : (
                <span className="text-sm text-gray-500">No flags</span>
              )}
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-500">Date Uploaded</label>
            <div className="flex items-center mt-1">
              <CalendarIcon className="w-4 h-4 text-gray-400 mr-2" />
              <p className="text-sm text-gray-900">
                {new Date(document.dateUploaded).toLocaleDateString()}
              </p>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-500">Uploaded By</label>
            <div className="flex items-center mt-1">
              <UserIcon className="w-4 h-4 text-gray-400 mr-2" />
              <p className="text-sm text-gray-900">{document.uploadedBy}</p>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-500">Version History</label>
            <div className="flex flex-wrap gap-1 mt-1">
              {document.versionHistory.map((version, index) => (
                <span key={index} className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                  {version}
                </span>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-500">Linked Tracts</label>
            <div className="flex flex-wrap gap-1 mt-1">
              {document.linkedTracts && document.linkedTracts.length > 0 ? (
                document.linkedTracts.map((tractId, index) => (
                  <span key={index} className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                    {tractId}
                  </span>
                ))
              ) : (
                <span className="text-sm text-gray-500">No tracts linked</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Notes Section */}
      {document.notes && (
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-2">Notes</label>
          <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">{document.notes}</p>
        </div>
      )}

      {/* Metadata */}
      <div className="border-t border-gray-200 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-500">
          <div>
            <span className="font-medium">Created:</span> {new Date(document.createdAt).toLocaleString()}
          </div>
          <div>
            <span className="font-medium">Updated:</span> {new Date(document.updatedAt).toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentDetails;
