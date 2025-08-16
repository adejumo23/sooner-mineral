import * as React from 'react';
import type { Lead, User } from '../types';
import Button from './ui/Button';
import { DocumentTextIcon, LockClosedIcon, LockOpenIcon, TrashIcon, PencilIcon, EyeIcon, DownloadIcon, PlusIcon, XCircleIcon } from './icons/Icons';

const mockFiles = [
  {
    id: '1',
    name: 'Executed_LOI.pdf',
    type: 'pdf',
    uploadedBy: 'Alice Admin',
    uploadedById: 'admin1',
    uploadDate: '2024-06-01T10:00:00Z',
    tags: ['Executed LOI'],
    visibility: 'private',
    url: '#',
  },
  {
    id: '2',
    name: 'Title_Report.docx',
    type: 'docx',
    uploadedBy: 'Bob Legal',
    uploadedById: 'legal1',
    uploadDate: '2024-06-02T14:30:00Z',
    tags: ['Title Docs'],
    visibility: 'public',
    url: '#',
  },
];

const tagOptions = ['Executed LOI', 'Title Docs', 'Legal Notes', 'Valuation'];

function getFileIcon(type: string) {
  switch (type) {
    case 'pdf': return <DocumentTextIcon className="h-5 w-5 text-red-500 inline-block mr-2" title="PDF" />;
    case 'docx': return <DocumentTextIcon className="h-5 w-5 text-blue-500 inline-block mr-2" title="Word" />;
    case 'xlsx': return <DocumentTextIcon className="h-5 w-5 text-green-500 inline-block mr-2" title="Excel" />;
    case 'jpg':
    case 'jpeg':
    case 'png': return <DocumentTextIcon className="h-5 w-5 text-yellow-500 inline-block mr-2" title="Image" />;
    default: return <DocumentTextIcon className="h-5 w-5 text-gray-400 inline-block mr-2" title="File" />;
  }
}

const LeadDocumentsTab: React.FC<{ lead: Lead; currentUser: User }> = ({ lead, currentUser }) => {
  const [files, setFiles] = React.useState(mockFiles);
  const [search, setSearch] = React.useState('');
  const [tagFilter, setTagFilter] = React.useState('');
  const [uploading, setUploading] = React.useState(false);
  const [uploadFiles, setUploadFiles] = React.useState<File[]>([]);
  const [uploadTags, setUploadTags] = React.useState<string[]>([]);
  const [uploadVisibility, setUploadVisibility] = React.useState<'public' | 'private'>('public');
  const [deleteFileId, setDeleteFileId] = React.useState<string | null>(null);
  const [dragActive, setDragActive] = React.useState(false);

  // Filtered files
  const filteredFiles = files.filter(f =>
    (!search || f.name.toLowerCase().includes(search.toLowerCase()) || f.uploadedBy.toLowerCase().includes(search.toLowerCase())) &&
    (!tagFilter || f.tags.includes(tagFilter))
  );

  // Permission logic
  const canDeleteOrReplace = (file: typeof mockFiles[0]) =>
    currentUser.role.name === 'Admin' || file.uploadedById === currentUser.id;
  const canView = (file: typeof mockFiles[0]) =>
    file.visibility === 'public' || currentUser.role.name === 'Admin' || currentUser.role.name === 'Legal';

  // Upload handler (mock)
  const handleFileUpload = async (filesToUpload: File[]) => {
    setUploading(true);
    setTimeout(() => {
      setFiles(prev => [
        ...prev,
        ...filesToUpload.map(file => ({
          id: Math.random().toString(36).slice(2),
          name: file.name,
          type: file.name.split('.').pop()?.toLowerCase() || 'file',
          uploadedBy: currentUser.name,
          uploadedById: currentUser.id,
          uploadDate: new Date().toISOString(),
          tags: uploadTags,
          visibility: uploadVisibility,
          url: '#',
        })),
      ]);
      setUploading(false);
      setUploadFiles([]);
      setUploadTags([]);
      setUploadVisibility('public');
    }, 1200);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setUploadFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleDelete = () => {
    setFiles(prev => prev.filter(f => f.id !== deleteFileId));
    setDeleteFileId(null);
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Documents</h2>
      </div>
      {/* Drag and Drop Upload Area */}
      <div
        className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 mb-4 transition-colors duration-200 ${dragActive ? 'border-sc-blue bg-blue-50' : 'border-gray-300 bg-white'}`}
        onDragOver={e => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={e => { e.preventDefault(); setDragActive(false); }}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-upload-input')?.click()}
        style={{ cursor: 'pointer' }}
        aria-label="Drag and drop files here or click to select"
      >
        <input
          id="file-upload-input"
          type="file"
          multiple
          className="hidden"
          onChange={e => {
            if (e.target.files) setUploadFiles(Array.from(e.target.files));
          }}
        />
        <span className="text-gray-500 mb-2">Drag & drop files here or click to select</span>
        {uploadFiles.length > 0 && (
          <ul className="text-xs text-gray-700 mt-2">
            {uploadFiles.map(f => <li key={f.name}>{f.name}</li>)}
          </ul>
        )}
        <div className="w-full flex flex-col md:flex-row gap-2 mt-4">
          <select
            multiple
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            value={uploadTags}
            onChange={e => setUploadTags(Array.from(e.target.selectedOptions, o => o.value))}
            aria-label="Select tags"
          >
            {tagOptions.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
          <select
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            value={uploadVisibility}
            onChange={e => setUploadVisibility(e.target.value as 'public' | 'private')}
            aria-label="Select visibility"
          >
            <option value="public">Public (all users)</option>
            <option value="private">Private (Admin/Legal only)</option>
          </select>
          <Button
            onClick={() => handleFileUpload(uploadFiles)}
            disabled={uploading || uploadFiles.length === 0}
            aria-label="Upload files"
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          type="text"
          placeholder="Search by file name or uploader..."
          className="border border-gray-300 rounded px-3 py-2 text-sm"
          value={search}
          onChange={e => setSearch(e.target.value)}
          aria-label="Search documents"
        />
        <select
          className="border border-gray-300 rounded px-3 py-2 text-sm"
          value={tagFilter}
          onChange={e => setTagFilter(e.target.value)}
          aria-label="Filter by tag"
        >
          <option value="">All Tags</option>
          {tagOptions.map(tag => (
            <option key={tag} value={tag}>{tag}</option>
          ))}
        </select>
      </div>
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">File Name</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Uploaded By</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Upload Date</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tags</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Visibility</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredFiles.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-400">
                  <div className="flex flex-col items-center">
                    <DocumentTextIcon className="h-10 w-10 mb-2 text-gray-200" />
                    <span>No documents found.</span>
                  </div>
                </td>
              </tr>
            )}
            {filteredFiles.map(file => canView(file) && (
              <tr key={file.id}>
                <td className="px-4 py-2 text-sc-blue font-medium cursor-pointer hover:underline flex items-center">
                  {getFileIcon(file.type)}
                  <a href={file.url} target="_blank" rel="noopener noreferrer">{file.name}</a>
                </td>
                <td className="px-4 py-2">{file.type.toUpperCase()}</td>
                <td className="px-4 py-2 text-sm text-gray-700">{file.uploadedBy}</td>
                <td className="px-4 py-2 text-sm text-gray-700">{new Date(file.uploadDate).toLocaleString()}</td>
                <td className="px-4 py-2 text-sm text-gray-700">
                  {file.tags.map((tag: string) => (
                    <span key={tag} className="inline-block bg-gray-100 text-gray-800 rounded px-2 py-1 text-xs mr-1">{tag}</span>
                  ))}
                </td>
                <td className="px-4 py-2">
                  {file.visibility === 'private' ? <LockClosedIcon className="h-5 w-5 text-red-500" title="Private" /> : <LockOpenIcon className="h-5 w-5 text-green-500" title="Public" />}
                </td>
                <td className="px-4 py-2 flex space-x-2">
                  <a href={file.url} target="_blank" rel="noopener noreferrer" title="Preview" aria-label="Preview">
                    <EyeIcon className="h-5 w-5 text-gray-500 hover:text-sc-blue" />
                  </a>
                  <a href={file.url} download title="Download" aria-label="Download">
                    <DownloadIcon className="h-5 w-5 text-gray-500 hover:text-sc-blue" />
                  </a>
                  {canDeleteOrReplace(file) && <>
                    <Button size="icon" variant="secondary" title="Replace" aria-label="Replace">
                      <PencilIcon className="h-5 w-5" />
                    </Button>
                    <Button size="icon" variant="danger" title="Delete" aria-label="Delete" onClick={() => setDeleteFileId(file.id)}>
                      <TrashIcon className="h-5 w-5" />
                    </Button>
                  </>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Delete Confirmation Modal */}
      {deleteFileId && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-sm flex flex-col items-center">
            <XCircleIcon className="h-10 w-10 text-red-500 mb-2" />
            <div className="mb-4 text-center">Are you sure you want to delete this document?</div>
            <div className="flex space-x-2">
              <Button variant="secondary" onClick={() => setDeleteFileId(null)}>Cancel</Button>
              <Button variant="danger" onClick={handleDelete}>Delete</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadDocumentsTab;
