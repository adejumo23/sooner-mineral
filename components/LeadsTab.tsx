import React, { useState, useEffect } from 'react';
import type { TractLead, LeadNote, User } from '../types';
import * as api from '../services/api';
import Button from './ui/Button';
import Modal from './ui/Modal';

interface LeadsTabProps {
  tractId: string;
  users: User[];
}

const LeadsTab: React.FC<LeadsTabProps> = ({ tractId, users }) => {
  const [leads, setLeads] = useState<TractLead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedLeads, setExpandedLeads] = useState<Set<string>>(new Set());
  const [isCreateLeadModalOpen, setIsCreateLeadModalOpen] = useState(false);
  const [isAddNoteModalOpen, setIsAddNoteModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<TractLead | null>(null);
  const [leadNotes, setLeadNotes] = useState<Record<string, LeadNote[]>>({});

  useEffect(() => {
    fetchLeads();
  }, [tractId]);

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const leadsData = await api.fetchTractLeads(tractId);
      setLeads(leadsData);
      
      // Expand the most recent active lead by default
      const activeLeads = leadsData.filter(lead => lead.status === 'In Progress');
      if (activeLeads.length > 0) {
        const mostRecentActive = activeLeads.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0];
        setExpandedLeads(new Set([mostRecentActive.id]));
      }
    } catch (error) {
      console.error('Failed to fetch leads:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleLeadExpansion = async (leadId: string) => {
    const newExpanded = new Set(expandedLeads);
    if (newExpanded.has(leadId)) {
      newExpanded.delete(leadId);
    } else {
      newExpanded.add(leadId);
      // Load notes if not already loaded
      if (!leadNotes[leadId]) {
        try {
          const notes = await api.fetchLeadNotes(leadId);
          setLeadNotes(prev => ({ ...prev, [leadId]: notes }));
        } catch (error) {
          console.error('Failed to fetch lead notes:', error);
        }
      }
    }
    setExpandedLeads(newExpanded);
  };

  const handleCreateLead = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const leadData = {
      buyerId: formData.get('buyerId') as string,
      leadSource: formData.get('leadSource') as string,
    };

    try {
      await api.createTractLead(tractId, leadData);
      fetchLeads();
      setIsCreateLeadModalOpen(false);
      e.currentTarget.reset();
    } catch (error) {
      console.error('Failed to create lead:', error);
    }
  };

  const handleAddNote = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedLead) return;

    const formData = new FormData(e.currentTarget);
    const noteData = {
      noteText: formData.get('noteText') as string,
      outreachMethod: formData.get('outreachMethod') as string,
    };

    try {
      await api.createLeadNote(selectedLead.id, noteData);
      const updatedNotes = await api.fetchLeadNotes(selectedLead.id);
      setLeadNotes(prev => ({ ...prev, [selectedLead.id]: updatedNotes }));
      setIsAddNoteModalOpen(false);
      e.currentTarget.reset();
    } catch (error) {
      console.error('Failed to create note:', error);
    }
  };

  const handleStatusChange = async (leadId: string, newStatus: TractLead['status']) => {
    try {
      await api.updateLeadStatus(leadId, newStatus);
      fetchLeads();
    } catch (error) {
      console.error('Failed to update lead status:', error);
    }
  };

  const getStatusColor = (status: TractLead['status']) => {
    switch (status) {
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'Closed':
        return 'bg-gray-100 text-gray-800';
      case 'Converted':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: TractLead['status']) => {
    switch (status) {
      case 'In Progress':
        return '🔵';
      case 'Closed':
        return '⚪';
      case 'Converted':
        return '🟢';
      default:
        return '⚪';
    }
  };

  const getOutreachMethodIcon = (method: LeadNote['outreachMethod']) => {
    switch (method) {
      case 'Phone Call':
        return '📞';
      case 'Email':
        return '📧';
      case 'Text':
        return '💬';
      case 'Meeting':
        return '🤝';
      case 'Letter':
        return '📮';
      default:
        return '📝';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (isLoading) {
    return <div className="text-center text-sc-slate">Loading leads...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Tract Leads</h3>
        <Button onClick={() => setIsCreateLeadModalOpen(true)}>
          Create New Lead
        </Button>
      </div>

      {/* Leads List */}
      <div className="space-y-4">
        {leads.length === 0 ? (
          <div className="text-center text-sc-slate py-12">
            <p>No leads found for this tract.</p>
            <p className="text-sm mt-2">Create a new lead to get started.</p>
          </div>
        ) : (
          leads.map((lead) => (
            <div key={lead.id} className="bg-sc-light-navy rounded-lg border border-sc-navy">
              {/* Lead Header */}
              <div 
                className="p-4 cursor-pointer hover:bg-sc-navy transition-colors"
                onClick={() => toggleLeadExpansion(lead.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className="text-2xl">{getStatusIcon(lead.status)}</span>
                    <div>
                      <div className="flex items-center space-x-3">
                        <h4 className="text-white font-medium">{lead.buyer?.name}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(lead.status)}`}>
                          {lead.status}
                        </span>
                        <span className="text-xs text-sc-slate bg-sc-navy px-2 py-1 rounded">
                          {lead.leadSource}
                        </span>
                      </div>
                      <div className="text-sm text-sc-slate mt-1">
                        Created: {formatDate(lead.createdAt)} • 
                        Last Activity: {lead.lastActivity ? formatDate(lead.lastActivity) : 'No activity'}
                        {lead.noteCount && lead.noteCount > 0 && (
                          <span className="ml-2">• {lead.noteCount} notes</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="secondary" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedLead(lead);
                        setIsAddNoteModalOpen(true);
                      }}
                    >
                      Add Note
                    </Button>
                    <Button 
                      variant="secondary" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        const newStatus = lead.status === 'In Progress' ? 'Closed' : 'In Progress';
                        handleStatusChange(lead.id, newStatus);
                      }}
                    >
                      {lead.status === 'In Progress' ? 'Close' : 'Reopen'}
                    </Button>
                    <button className="text-sc-slate hover:text-white transition-colors">
                      {expandedLeads.has(lead.id) ? '▼' : '▶'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedLeads.has(lead.id) && (
                <div className="border-t border-sc-navy p-4">
                  {/* Lead Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div>
                      <span className="text-sc-slate text-sm">Buyer</span>
                      <div className="text-white font-medium">{lead.buyer?.name}</div>
                    </div>
                    <div>
                      <span className="text-sc-slate text-sm">Lead Source</span>
                      <div className="text-white font-medium">{lead.leadSource}</div>
                    </div>
                    <div>
                      <span className="text-sc-slate text-sm">Status</span>
                      <div className="text-white font-medium">{lead.status}</div>
                    </div>
                    <div>
                      <span className="text-sc-slate text-sm">Created</span>
                      <div className="text-white font-medium">{formatDateTime(lead.createdAt)}</div>
                    </div>
                    <div>
                      <span className="text-sc-slate text-sm">Last Updated</span>
                      <div className="text-white font-medium">{formatDateTime(lead.updatedAt)}</div>
                    </div>
                    <div>
                      <span className="text-sc-slate text-sm">Last Activity</span>
                      <div className="text-white font-medium">
                        {lead.lastActivity ? formatDateTime(lead.lastActivity) : 'No activity'}
                      </div>
                    </div>
                  </div>

                  {/* Outreach Timeline */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h5 className="text-white font-medium">Outreach Timeline</h5>
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={() => {
                          setSelectedLead(lead);
                          setIsAddNoteModalOpen(true);
                        }}
                      >
                        Add Note
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      {leadNotes[lead.id] ? (
                        leadNotes[lead.id].length > 0 ? (
                          leadNotes[lead.id].map((note) => (
                            <div key={note.id} className="bg-sc-navy p-3 rounded-lg">
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center space-x-2">
                                  <span className="text-lg">{getOutreachMethodIcon(note.outreachMethod)}</span>
                                  <span className="text-xs text-sc-blue bg-sc-blue bg-opacity-20 px-2 py-1 rounded">
                                    {note.outreachMethod}
                                  </span>
                                </div>
                                <span className="text-xs text-sc-slate">
                                  {formatDateTime(note.createdAt)}
                                </span>
                              </div>
                              <p className="text-white text-sm">{note.noteText}</p>
                              <p className="text-xs text-sc-slate mt-1">
                                By: {note.createdByUser?.name}
                              </p>
                            </div>
                          ))
                        ) : (
                          <p className="text-sc-slate text-sm">No outreach notes yet.</p>
                        )
                      ) : (
                        <div className="text-center text-sc-slate py-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-sc-blue mx-auto"></div>
                          <p className="text-sm mt-2">Loading notes...</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Create Lead Modal */}
      <Modal 
        isOpen={isCreateLeadModalOpen} 
        onClose={() => setIsCreateLeadModalOpen(false)}
        title="Create New Lead"
      >
        <form onSubmit={handleCreateLead} className="space-y-4">
          <div>
            <label htmlFor="buyerId" className="block text-sm font-medium text-sc-slate mb-1">
              Assign Buyer
            </label>
            <select 
              id="buyerId" 
              name="buyerId" 
              required
              className="w-full px-4 py-2 bg-sc-light-navy border border-sc-light-navy rounded-md text-sc-light-slate focus:outline-none focus:ring-2 focus:ring-sc-blue"
            >
              <option value="">Select a buyer</option>
              {users.filter(user => user.role.name === 'Buyer' || user.role.name === 'Land Manager').map(user => (
                <option key={user.id} value={user.id}>{user.name} ({user.role.name})</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="leadSource" className="block text-sm font-medium text-sc-slate mb-1">
              Lead Source
            </label>
            <select 
              id="leadSource" 
              name="leadSource" 
              required
              className="w-full px-4 py-2 bg-sc-light-navy border border-sc-light-navy rounded-md text-sc-light-slate focus:outline-none focus:ring-2 focus:ring-sc-blue"
            >
              <option value="Assignment">Assignment</option>
              <option value="Inbound">Inbound</option>
              <option value="Referral">Referral</option>
              <option value="Cold Outreach">Cold Outreach</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="flex justify-end space-x-3 pt-4 border-t border-sc-light-navy">
            <Button type="button" variant="secondary" onClick={() => setIsCreateLeadModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Lead</Button>
          </div>
        </form>
      </Modal>

      {/* Add Note Modal */}
      <Modal 
        isOpen={isAddNoteModalOpen} 
        onClose={() => setIsAddNoteModalOpen(false)}
        title="Add Outreach Note"
      >
        <form onSubmit={handleAddNote} className="space-y-4">
          <div>
            <label htmlFor="outreachMethod" className="block text-sm font-medium text-sc-slate mb-1">
              Outreach Method
            </label>
            <select 
              id="outreachMethod" 
              name="outreachMethod" 
              required
              className="w-full px-4 py-2 bg-sc-light-navy border border-sc-light-navy rounded-md text-sc-light-slate focus:outline-none focus:ring-2 focus:ring-sc-blue"
            >
              <option value="Phone Call">📞 Phone Call</option>
              <option value="Email">📧 Email</option>
              <option value="Text">💬 Text</option>
              <option value="Meeting">🤝 Meeting</option>
              <option value="Letter">📮 Letter</option>
              <option value="Other">📝 Other</option>
            </select>
          </div>
          <div>
            <label htmlFor="noteText" className="block text-sm font-medium text-sc-slate mb-1">
              Note Text
            </label>
            <textarea 
              id="noteText" 
              name="noteText" 
              required
              rows={4}
              className="w-full px-4 py-2 bg-sc-light-navy border border-sc-light-navy rounded-md text-sc-light-slate placeholder-sc-slate focus:outline-none focus:ring-2 focus:ring-sc-blue"
              placeholder="Describe your outreach activity..."
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4 border-t border-sc-light-navy">
            <Button type="button" variant="secondary" onClick={() => setIsAddNoteModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Note</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default LeadsTab; 