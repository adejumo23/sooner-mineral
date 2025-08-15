import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchLead, fetchLeadCallLogs, fetchLeadNotes, createLeadCallLog, createLeadNote, updateLead, deleteLead, fetchUsers } from '../services/api';
import { Lead, LeadCallLog, LeadNote, CreateCallLogData, CreateLeadNoteData, UpdateLeadData, User } from '../types';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { ArrowLeftIcon, PencilIcon, TrashIcon, PhoneIcon, DocumentTextIcon, PlusIcon } from '../components/icons/Icons';
import ActivityLogTab from '../components/ActivityLogTab';

const LeadDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [lead, setLead] = useState<Lead | null>(null);
  const [callLogs, setCallLogs] = useState<LeadCallLog[]>([]);
  const [notes, setNotes] = useState<LeadNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCallLogModal, setShowCallLogModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [editData, setEditData] = useState<UpdateLeadData>({});
  const [callLogData, setCallLogData] = useState<CreateCallLogData>({
    leadId: id || '',
    outcome: 'No Answer',
    notes: '',
    nextSteps: ''
  });
  const [noteData, setNoteData] = useState<CreateLeadNoteData>({
    leadId: id || '',
    noteText: '',
    noteType: 'General'
  });
  const [activeTab, setActiveTab] = useState<'overview' | 'activity-log'>('overview');
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    if (id) {
      loadLead();
      loadCallLogs();
      loadNotes();
      loadUsers();
    }
  }, [id]);

  const loadLead = async () => {
    try {
      setLoading(true);
      const leadData = await fetchLead(id!);
      setLead(leadData);
      if (leadData) {
        setEditData({
          status: leadData.status,
          priorityScore: leadData.priorityScore,
          lastContactDate: leadData.lastContactDate,
          nextFollowUpDate: leadData.nextFollowUpDate,
          notes: leadData.notes,
          documentLinks: leadData.documentLinks
        });
      }
    } catch (error) {
      console.error('Error loading lead:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCallLogs = async () => {
    try {
      const logs = await fetchLeadCallLogs(id!);
      setCallLogs(logs || []);
    } catch (error) {
      console.error('Error loading call logs:', error);
    }
  };

  const loadNotes = async () => {
    try {
      const notesData = await fetchLeadNotes(id!);
      setNotes(notesData || []);
    } catch (error) {
      console.error('Error loading notes:', error);
    }
  };

  const handleSave = async () => {
    if (!lead) return;
    
    try {
      await updateLead(lead.id, editData);
      await loadLead();
      setShowEditModal(false);
    } catch (error) {
      console.error('Error updating lead:', error);
      alert('Failed to update lead');
    }
  };

  const handleDelete = async () => {
    if (!lead) return;
    
    try {
      await deleteLead(lead.id);
      navigate('/leads');
    } catch (error) {
      console.error('Error deleting lead:', error);
      alert('Failed to delete lead');
    }
  };

  const handleCallLogSubmit = async () => {
    try {
      await createLeadCallLog(id!, callLogData);
      setCallLogData({
        leadId: id || '',
        outcome: 'No Answer',
        notes: '',
        nextSteps: ''
      });
      setShowCallLogModal(false);
      await loadCallLogs();
      await loadLead(); // Refresh lead to update last contact date
    } catch (error) {
      console.error('Error creating call log:', error);
      alert('Failed to create call log');
    }
  };

  const handleNoteSubmit = async () => {
    try {
      await createLeadNote(id!, noteData);
      setNoteData({
        leadId: id || '',
        noteText: '',
        noteType: 'General'
      });
      setShowNoteModal(false);
      await loadNotes();
    } catch (error) {
      console.error('Error creating note:', error);
      alert('Failed to create note');
    }
  };

  const getStatusColor = (status: Lead['status']) => {
    switch (status) {
      case 'Uncontacted': return 'bg-gray-100 text-gray-800';
      case 'Spoke': return 'bg-blue-100 text-blue-800';
      case 'Interested': return 'bg-green-100 text-green-800';
      case 'LOI Sent': return 'bg-yellow-100 text-yellow-800';
      case 'Dead': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 80) return 'bg-red-100 text-red-800';
    if (priority >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getOutcomeColor = (outcome: LeadCallLog['outcome']) => {
    switch (outcome) {
      case 'Interested': return 'bg-green-100 text-green-800';
      case 'Not Interested': return 'bg-red-100 text-red-800';
      case 'Spoke': return 'bg-blue-100 text-blue-800';
      case 'No Answer': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const loadUsers = async () => {
    try {
      const usersData = await fetchUsers();
      setUsers(usersData || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="text-lg">Loading lead...</div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="text-center py-8">
        <div className="text-lg">Lead not found</div>
        <Link to="/leads" className="text-sc-blue hover:text-sc-blue-dark">
          Back to Leads
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Link to="/leads">
            <Button variant="outline" size="sm">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Lead Details</h1>
            <p className="text-sc-slate">
              {lead.linkedContact?.name} - {lead.linkedContact?.city}, {lead.linkedContact?.state}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => setShowCallLogModal(true)}>
            <PhoneIcon className="h-4 w-4 mr-2" />
            Log Call
          </Button>
          <Button variant="outline" onClick={() => setShowEditModal(true)}>
            <PencilIcon className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline" onClick={() => setShowDeleteModal(true)}>
            <TrashIcon className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-sc-blue text-sc-blue'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('activity-log')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'activity-log'
                ? 'border-sc-blue text-sc-blue'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Activity Log
          </button>
        </nav>
      </div>

      {activeTab === 'overview' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
          {/* Lead Overview */}
          <Card>
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Lead Overview</h2>
              <div className="flex space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
                  {lead.status}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(lead.priorityScore)}`}>
                  Priority: {lead.priorityScore}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Source Channel</label>
                <p className="text-gray-900">{lead.sourceChannel}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Buyer</label>
                <p className="text-gray-900">{lead.buyer?.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Last Contact</label>
                <p className="text-gray-900">
                  {lead.lastContactDate ? new Date(lead.lastContactDate).toLocaleDateString() : 'Never'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Next Follow-up</label>
                <p className="text-gray-900">
                  {lead.nextFollowUpDate ? new Date(lead.nextFollowUpDate).toLocaleDateString() : 'Not set'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Outreach Count</label>
                <p className="text-gray-900">{lead.outreachCount}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Created</label>
                <p className="text-gray-900">{new Date(lead.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            {lead.notes && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-500">Notes</label>
                <p className="text-gray-900">{lead.notes}</p>
              </div>
            )}
          </Card>

          {/* Asset Summary */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Asset Summary</h2>
            <div className="space-y-4">
              {lead.linkedTracts && lead.linkedTracts.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Linked Tracts</h3>
                  {lead.linkedTracts.map(tract => (
                    <div key={tract.id} className="bg-gray-50 p-3 rounded-lg">
                      <div className="font-medium">{tract.tractName}</div>
                      <div className="text-sm text-gray-600">
                        {tract.county}, {tract.state} - {tract.grossAcres} gross acres
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {lead.linkedUnits && lead.linkedUnits.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Linked Units</h3>
                  {lead.linkedUnits.map(unit => (
                    <div key={unit.id} className="bg-gray-50 p-3 rounded-lg">
                      <div className="font-medium">{unit.unitName}</div>
                      <div className="text-sm text-gray-600">
                        {unit.county}, {unit.state} - {unit.estimatedGrossAcres} gross acres
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Call Log */}
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Call Log</h2>
              <Button size="sm" onClick={() => setShowCallLogModal(true)}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Call
              </Button>
            </div>
            
            {callLogs.length > 0 ? (
              <div className="space-y-3">
                {callLogs.map((log) => (
                  <div key={log.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0">
                      <PhoneIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getOutcomeColor(log.outcome)}`}>
                          {log.outcome}
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(log.callDate).toLocaleString()}
                        </span>
                      </div>
                      {log.notes && (
                        <p className="text-sm text-gray-700">{log.notes}</p>
                      )}
                      {log.nextSteps && (
                        <div className="mt-1">
                          <span className="text-xs font-medium text-gray-500">Next Steps:</span>
                          <p className="text-sm text-gray-700">{log.nextSteps}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No call logs available</p>
            )}
          </Card>

          {/* Notes */}
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Notes</h2>
              <Button size="sm" onClick={() => setShowNoteModal(true)}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Note
              </Button>
            </div>
            
            {notes.length > 0 ? (
              <div className="space-y-3">
                {notes.map((note) => (
                  <div key={note.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        note.noteType === 'Important' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {note.noteType}
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(note.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{note.noteText}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No notes available</p>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Info */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Info</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-500">Name</label>
                                  <p className="text-gray-900">{lead.linkedContact?.name}</p>
              </div>
              {lead.linkedContact?.email && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">Email</label>
                  <p className="text-gray-900">{lead.linkedContact.email}</p>
                </div>
              )}
              {lead.linkedContact?.phone && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">Phone</label>
                  <p className="text-gray-900">{lead.linkedContact.phone}</p>
                </div>
              )}
              {lead.linkedContact?.address && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">Address</label>
                  <p className="text-gray-900">{lead.linkedContact.address}</p>
                  <p className="text-gray-900">
                    {lead.linkedContact.city}, {lead.linkedContact.state} {lead.linkedContact.zipCode}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Documents */}
          {lead.documentLinks && lead.documentLinks.length > 0 && (
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Documents</h2>
              <div className="space-y-2">
                {lead.documentLinks.map((link, index) => (
                  <a
                    key={index}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-sc-blue hover:text-sc-blue-dark"
                  >
                    <DocumentTextIcon className="h-4 w-4" />
                    <span className="text-sm">Document {index + 1}</span>
                  </a>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
      ) : (
        <ActivityLogTab leadId={id!} users={users} />
      )}

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Lead"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={editData.status || ''}
              onChange={(e) => setEditData(prev => ({ ...prev, status: e.target.value as Lead['status'] }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sc-blue"
            >
              <option value="Uncontacted">Uncontacted</option>
              <option value="Spoke">Spoke</option>
              <option value="Interested">Interested</option>
              <option value="LOI Sent">LOI Sent</option>
              <option value="Dead">Dead</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority Score</label>
            <Input
              type="number"
              min="0"
              max="100"
              value={editData.priorityScore || ''}
              onChange={(e) => setEditData(prev => ({ ...prev, priorityScore: e.target.value ? parseInt(e.target.value) : undefined }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Contact Date</label>
            <Input
              type="date"
              value={editData.lastContactDate || ''}
              onChange={(e) => setEditData(prev => ({ ...prev, lastContactDate: e.target.value || undefined }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Next Follow-up Date</label>
            <Input
              type="date"
              value={editData.nextFollowUpDate || ''}
              onChange={(e) => setEditData(prev => ({ ...prev, nextFollowUpDate: e.target.value || undefined }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={editData.notes || ''}
              onChange={(e) => setEditData(prev => ({ ...prev, notes: e.target.value || undefined }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sc-blue"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Lead"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to delete this lead? This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* Call Log Modal */}
      <Modal
        isOpen={showCallLogModal}
        onClose={() => setShowCallLogModal(false)}
        title="Log Call"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Outcome</label>
            <select
              value={callLogData.outcome}
              onChange={(e) => setCallLogData(prev => ({ ...prev, outcome: e.target.value as LeadCallLog['outcome'] }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sc-blue"
            >
              <option value="No Answer">No Answer</option>
              <option value="Left Message">Left Message</option>
              <option value="Spoke">Spoke</option>
              <option value="Not Interested">Not Interested</option>
              <option value="Interested">Interested</option>
              <option value="Call Back Later">Call Back Later</option>
              <option value="Wrong Number">Wrong Number</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={callLogData.notes}
              onChange={(e) => setCallLogData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sc-blue"
              placeholder="Describe the call outcome..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Next Steps</label>
            <textarea
              value={callLogData.nextSteps}
              onChange={(e) => setCallLogData(prev => ({ ...prev, nextSteps: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sc-blue"
              placeholder="What should happen next?"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowCallLogModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCallLogSubmit}>
              Log Call
            </Button>
          </div>
        </div>
      </Modal>

      {/* Note Modal */}
      <Modal
        isOpen={showNoteModal}
        onClose={() => setShowNoteModal(false)}
        title="Add Note"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Note Type</label>
            <select
              value={noteData.noteType}
              onChange={(e) => setNoteData(prev => ({ ...prev, noteType: e.target.value as LeadNote['noteType'] }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sc-blue"
            >
              <option value="General">General</option>
              <option value="Follow Up">Follow Up</option>
              <option value="Important">Important</option>
              <option value="Internal">Internal</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Note Text</label>
            <textarea
              value={noteData.noteText}
              onChange={(e) => setNoteData(prev => ({ ...prev, noteText: e.target.value }))}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sc-blue"
              placeholder="Enter your note..."
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowNoteModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleNoteSubmit}>
              Add Note
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default LeadDetailPage;
