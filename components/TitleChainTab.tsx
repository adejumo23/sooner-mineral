import React, { useState, useEffect } from 'react';
import type { 
  TitleInstrument, 
  CurativeIssue, 
  TitleDocument, 
  TitleChainSummary,
  TitleInstrumentStatus,
  InstrumentType,
  User,
  Contact
} from '../types';
import * as api from '../services/api';

interface TitleChainTabProps {
  tractId: string;
  users: User[];
  contacts: Contact[];
}

const TitleChainTab: React.FC<TitleChainTabProps> = ({ tractId, users, contacts }) => {
  const [instruments, setInstruments] = useState<TitleInstrument[]>([]);
  const [curativeIssues, setCurativeIssues] = useState<CurativeIssue[]>([]);
  const [documents, setDocuments] = useState<TitleDocument[]>([]);
  const [summary, setSummary] = useState<TitleChainSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showInstrumentModal, setShowInstrumentModal] = useState(false);
  const [showCurativeModal, setShowCurativeModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [showEditInstrumentModal, setShowEditInstrumentModal] = useState(false);
  const [showEditCurativeModal, setShowEditCurativeModal] = useState(false);

  // Edit states
  const [editingInstrument, setEditingInstrument] = useState<TitleInstrument | null>(null);
  const [editingCurativeIssue, setEditingCurativeIssue] = useState<CurativeIssue | null>(null);

  // Form states
  const [instrumentForm, setInstrumentForm] = useState({
    instrumentType: 'Deed' as InstrumentType,
    recordedDate: '',
    recordingInfo: '',
    notes: '',
    status: 'In Progress' as TitleInstrumentStatus
  });

  const [curativeForm, setCurativeForm] = useState({
    issueDescription: '',
    requiredAction: '',
    responsibleParty: '',
    targetResolution: '',
    status: 'Open' as 'Open' | 'In Progress' | 'Resolved'
  });

  const [documentForm, setDocumentForm] = useState({
    instrumentType: 'Deed' as InstrumentType,
    contactName: '',
    file: null as File | null
  });

  useEffect(() => {
    fetchTitleChainData();
  }, [tractId]);

  const fetchTitleChainData = async () => {
    try {
      setLoading(true);
      const [instrumentsData, curativeData, documentsData, summaryData] = await Promise.all([
        api.fetchTractTitleInstruments(tractId),
        api.fetchTractCurativeIssues(tractId),
        api.fetchTractTitleDocuments(tractId),
        api.fetchTractTitleChainSummary(tractId)
      ]);
      
      setInstruments(instrumentsData);
      setCurativeIssues(curativeData);
      setDocuments(documentsData);
      setSummary(summaryData);
    } catch (err) {
      console.error('Error fetching title chain data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInstrument = async () => {
    try {
      const newInstrument = await api.createTitleInstrument({
        tractId,
        ...instrumentForm
      });
      setInstruments([...instruments, newInstrument]);
      setShowInstrumentModal(false);
      setInstrumentForm({
        instrumentType: 'Deed',
        recordedDate: '',
        recordingInfo: '',
        notes: '',
        status: 'In Progress'
      });
      await fetchTitleChainData();
    } catch (err) {
      console.error('Error creating instrument:', err);
    }
  };

  const handleEditInstrument = (instrument: TitleInstrument) => {
    setEditingInstrument(instrument);
    setInstrumentForm({
      instrumentType: instrument.instrumentType,
      recordedDate: instrument.recordedDate,
      recordingInfo: instrument.recordingInfo,
      notes: instrument.notes || '',
      status: instrument.status
    });
    setShowEditInstrumentModal(true);
  };

  const handleUpdateInstrument = async () => {
    if (!editingInstrument) return;
    
    try {
      const updatedInstrument = await api.updateTitleInstrument(editingInstrument.id, {
        instrumentType: instrumentForm.instrumentType,
        recordedDate: instrumentForm.recordedDate,
        recordingInfo: instrumentForm.recordingInfo,
        notes: instrumentForm.notes,
        status: instrumentForm.status
      });
      
      setInstruments(instruments.map(i => i.id === editingInstrument.id ? updatedInstrument : i));
      setShowEditInstrumentModal(false);
      setEditingInstrument(null);
      setInstrumentForm({
        instrumentType: 'Deed',
        recordedDate: '',
        recordingInfo: '',
        notes: '',
        status: 'In Progress'
      });
      await fetchTitleChainData();
    } catch (err) {
      console.error('Error updating instrument:', err);
    }
  };

  const handleDeleteInstrument = async (instrumentId: string) => {
    if (!confirm('Are you sure you want to delete this instrument?')) return;
    
    try {
      await api.deleteTitleInstrument(instrumentId);
      setInstruments(instruments.filter(i => i.id !== instrumentId));
      await fetchTitleChainData();
    } catch (err) {
      console.error('Error deleting instrument:', err);
    }
  };

  const handleCreateCurativeIssue = async () => {
    try {
      const newIssue = await api.createCurativeIssue({
        tractId,
        ...curativeForm
      });
      setCurativeIssues([...curativeIssues, newIssue]);
      setShowCurativeModal(false);
      setCurativeForm({
        issueDescription: '',
        requiredAction: '',
        responsibleParty: '',
        targetResolution: '',
        status: 'Open'
      });
      await fetchTitleChainData();
    } catch (err) {
      console.error('Error creating curative issue:', err);
    }
  };

  const handleEditCurativeIssue = (issue: CurativeIssue) => {
    setEditingCurativeIssue(issue);
    setCurativeForm({
      issueDescription: issue.issueDescription,
      requiredAction: issue.requiredAction,
      responsibleParty: issue.responsibleParty,
      targetResolution: issue.targetResolution || '',
      status: issue.status
    });
    setShowEditCurativeModal(true);
  };

  const handleUpdateCurativeIssue = async () => {
    if (!editingCurativeIssue) return;
    
    try {
      const updatedIssue = await api.updateCurativeIssue(editingCurativeIssue.id, {
        issueDescription: curativeForm.issueDescription,
        requiredAction: curativeForm.requiredAction,
        responsibleParty: curativeForm.responsibleParty,
        targetResolution: curativeForm.targetResolution
      });
      
      setCurativeIssues(curativeIssues.map(i => i.id === editingCurativeIssue.id ? updatedIssue : i));
      setShowEditCurativeModal(false);
      setEditingCurativeIssue(null);
      setCurativeForm({
        issueDescription: '',
        requiredAction: '',
        responsibleParty: '',
        targetResolution: '',
        status: 'Open'
      });
      await fetchTitleChainData();
    } catch (err) {
      console.error('Error updating curative issue:', err);
    }
  };

  const handleDeleteCurativeIssue = async (issueId: string) => {
    if (!confirm('Are you sure you want to delete this curative issue?')) return;
    
    try {
      await api.deleteCurativeIssue(issueId);
      setCurativeIssues(curativeIssues.filter(i => i.id !== issueId));
      await fetchTitleChainData();
    } catch (err) {
      console.error('Error deleting curative issue:', err);
    }
  };

  const handleUploadDocument = async () => {
    if (!documentForm.file) return;
    
    try {
      const newDocument = await api.uploadTitleDocument({
        tractId,
        file: documentForm.file,
        instrumentType: documentForm.instrumentType,
        contactName: documentForm.contactName
      });
      setDocuments([...documents, newDocument]);
      setShowDocumentModal(false);
      setDocumentForm({
        instrumentType: 'Deed',
        contactName: '',
        file: null
      });
    } catch (err) {
      console.error('Error uploading document:', err);
    }
  };

  const getStatusColor = (status: TitleInstrumentStatus) => {
    switch (status) {
      case 'Verified': return 'bg-green-100 text-green-800';
      case 'Requirements': return 'bg-red-100 text-red-800';
      case 'In Progress': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: TitleInstrumentStatus) => {
    switch (status) {
      case 'Verified': return '✓';
      case 'Requirements': return '⚠';
      case 'In Progress': return '⏳';
      default: return '•';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Loading title chain data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title Chain Summary */}
      {summary && (
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Title Chain Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{summary.totalInstruments}</div>
              <div className="text-sm text-gray-600">Total Instruments</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{summary.verifiedInstruments}</div>
              <div className="text-sm text-gray-600">Verified</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{summary.inProgressInstruments}</div>
              <div className="text-sm text-gray-600">In Progress</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{summary.requirementInstruments}</div>
              <div className="text-sm text-gray-600">Requirements</div>
            </div>
          </div>
        </div>
      )}

      {/* Title Chain Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Title Chain Table</h3>
          <button
            onClick={() => setShowInstrumentModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Add Instrument
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Instrument Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recorded Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recording Info</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {instruments.map((instrument) => (
                <tr key={instrument.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(instrument.status)}`}>
                      {getStatusIcon(instrument.status)} {instrument.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{instrument.instrumentType}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(instrument.recordedDate)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{instrument.recordingInfo}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{instrument.notes}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEditInstrument(instrument)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteInstrument(instrument.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Curative Tracking Sub-Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Curative Tracking</h3>
          <button
            onClick={() => setShowCurativeModal(true)}
            className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
          >
            Add Curative Issue
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Required Action</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Responsible Party</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target Resolution</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {curativeIssues.map((issue) => (
                <tr key={issue.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{issue.issueDescription}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{issue.requiredAction}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{issue.responsibleParty}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      issue.status === 'Open' ? 'bg-red-100 text-red-800' :
                      issue.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {issue.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {issue.targetResolution ? formatDate(issue.targetResolution) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEditCurativeIssue(issue)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteCurativeIssue(issue.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Document Upload Panel */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Supporting Documents</h3>
          <button
            onClick={() => setShowDocumentModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            Upload Document
          </button>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((document) => (
              <div key={document.id} className="border border-gray-200 rounded-lg p-4">
                <div className="text-sm font-medium text-gray-900 mb-2">{document.instrumentType}</div>
                <div className="text-xs text-gray-600 mb-2">
                  {document.contactName && <div>Contact: {document.contactName}</div>}
                  <div>Uploaded: {formatDate(document.uploadDate)}</div>
                  <div>Size: {(document.fileSize / 1024).toFixed(1)} KB</div>
                </div>
                <div className="flex space-x-2">
                  <button className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors">
                    View
                  </button>
                  <button className="px-3 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200 transition-colors">
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Instrument Modal */}
      {showInstrumentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Title Instrument</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Instrument Type</label>
                <select
                  value={instrumentForm.instrumentType}
                  onChange={(e) => setInstrumentForm({...instrumentForm, instrumentType: e.target.value as InstrumentType})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                >
                  <option value="Deed">Deed</option>
                  <option value="Probate">Probate</option>
                  <option value="Affidavit">Affidavit</option>
                  <option value="Abstract">Abstract</option>
                  <option value="Assignment">Assignment</option>
                  <option value="Lease">Lease</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Recorded Date</label>
                <input
                  type="date"
                  value={instrumentForm.recordedDate}
                  onChange={(e) => setInstrumentForm({...instrumentForm, recordedDate: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Recording Info</label>
                <input
                  type="text"
                  value={instrumentForm.recordingInfo}
                  onChange={(e) => setInstrumentForm({...instrumentForm, recordingInfo: e.target.value})}
                  placeholder="Book/Page, Doc #, or Index number"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={instrumentForm.status}
                  onChange={(e) => setInstrumentForm({...instrumentForm, status: e.target.value as TitleInstrumentStatus})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                >
                  <option value="In Progress">In Progress</option>
                  <option value="Verified">Verified</option>
                  <option value="Requirements">Requirements</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={instrumentForm.notes}
                  onChange={(e) => setInstrumentForm({...instrumentForm, notes: e.target.value})}
                  placeholder="Free-text summary or curative instructions"
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowInstrumentModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateInstrument}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Create Instrument
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Curative Issue Modal */}
      {showCurativeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Curative Issue</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Issue Description</label>
                <textarea
                  value={curativeForm.issueDescription}
                  onChange={(e) => setCurativeForm({...curativeForm, issueDescription: e.target.value})}
                  placeholder="Nature of the gap, defect, or inconsistency"
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Required Action</label>
                <textarea
                  value={curativeForm.requiredAction}
                  onChange={(e) => setCurativeForm({...curativeForm, requiredAction: e.target.value})}
                  placeholder="Legal or administrative action required"
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Responsible Party</label>
                <input
                  type="text"
                  value={curativeForm.responsibleParty}
                  onChange={(e) => setCurativeForm({...curativeForm, responsibleParty: e.target.value})}
                  placeholder="Internal staff or external legal/vendor"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Resolution (Optional)</label>
                <input
                  type="date"
                  value={curativeForm.targetResolution}
                  onChange={(e) => setCurativeForm({...curativeForm, targetResolution: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowCurativeModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateCurativeIssue}
                  className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
                >
                  Create Issue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Document Modal */}
      {showDocumentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Title Document</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Instrument Type</label>
                <select
                  value={documentForm.instrumentType}
                  onChange={(e) => setDocumentForm({...documentForm, instrumentType: e.target.value as InstrumentType})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                >
                  <option value="Deed">Deed</option>
                  <option value="Probate">Probate</option>
                  <option value="Affidavit">Affidavit</option>
                  <option value="Abstract">Abstract</option>
                  <option value="Assignment">Assignment</option>
                  <option value="Lease">Lease</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name (Optional)</label>
                <input
                  type="text"
                  value={documentForm.contactName}
                  onChange={(e) => setDocumentForm({...documentForm, contactName: e.target.value})}
                  placeholder="Contact name if applicable"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Document File</label>
                <input
                  type="file"
                  onChange={(e) => setDocumentForm({...documentForm, file: e.target.files?.[0] || null})}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                />
                <p className="text-xs text-gray-500 mt-1">Supported formats: PDF, DOC, DOCX, JPG, JPEG, PNG</p>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowDocumentModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUploadDocument}
                  disabled={!documentForm.file}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Upload Document
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Instrument Modal */}
      {showEditInstrumentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Title Instrument</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Instrument Type</label>
                <select
                  value={instrumentForm.instrumentType}
                  onChange={(e) => setInstrumentForm({...instrumentForm, instrumentType: e.target.value as InstrumentType})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                >
                  <option value="Deed">Deed</option>
                  <option value="Probate">Probate</option>
                  <option value="Affidavit">Affidavit</option>
                  <option value="Abstract">Abstract</option>
                  <option value="Assignment">Assignment</option>
                  <option value="Lease">Lease</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Recorded Date</label>
                <input
                  type="date"
                  value={instrumentForm.recordedDate}
                  onChange={(e) => setInstrumentForm({...instrumentForm, recordedDate: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Recording Info</label>
                <input
                  type="text"
                  value={instrumentForm.recordingInfo}
                  onChange={(e) => setInstrumentForm({...instrumentForm, recordingInfo: e.target.value})}
                  placeholder="Book/Page, Doc #, or Index number"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={instrumentForm.status}
                  onChange={(e) => setInstrumentForm({...instrumentForm, status: e.target.value as TitleInstrumentStatus})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                >
                  <option value="In Progress">In Progress</option>
                  <option value="Verified">Verified</option>
                  <option value="Requirements">Requirements</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={instrumentForm.notes}
                  onChange={(e) => setInstrumentForm({...instrumentForm, notes: e.target.value})}
                  placeholder="Free-text summary or curative instructions"
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowEditInstrumentModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateInstrument}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Update Instrument
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Curative Issue Modal */}
      {showEditCurativeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Curative Issue</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Issue Description</label>
                <textarea
                  value={curativeForm.issueDescription}
                  onChange={(e) => setCurativeForm({...curativeForm, issueDescription: e.target.value})}
                  placeholder="Nature of the gap, defect, or inconsistency"
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Required Action</label>
                <textarea
                  value={curativeForm.requiredAction}
                  onChange={(e) => setCurativeForm({...curativeForm, requiredAction: e.target.value})}
                  placeholder="Legal or administrative action required"
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Responsible Party</label>
                <input
                  type="text"
                  value={curativeForm.responsibleParty}
                  onChange={(e) => setCurativeForm({...curativeForm, responsibleParty: e.target.value})}
                  placeholder="Internal staff or external legal/vendor"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={curativeForm.status}
                  onChange={(e) => setCurativeForm({...curativeForm, status: e.target.value as 'Open' | 'In Progress' | 'Resolved'})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                >
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Resolution (Optional)</label>
                <input
                  type="date"
                  value={curativeForm.targetResolution}
                  onChange={(e) => setCurativeForm({...curativeForm, targetResolution: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowEditCurativeModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateCurativeIssue}
                  className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
                >
                  Update Issue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TitleChainTab;
