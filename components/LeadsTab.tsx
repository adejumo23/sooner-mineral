import React, { useState, useEffect } from 'react';
import type { SectionLead, LeadNote, User } from '../types';
import * as api from '../services/api';
import Button from './ui/Button';
import Modal from './ui/Modal';
import { formatOccDate } from '../utils/formatting';

interface LeadsTabProps {
  sectionId: string;
  users: User[];
}

const LeadsTab: React.FC<LeadsTabProps> = ({ sectionId, users }) => {
  const [leads, setLeads] = useState<SectionLead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedLeads, setExpandedLeads] = useState<Set<string>>(new Set());
  const [isCreateLeadModalOpen, setIsCreateLeadModalOpen] = useState(false);
  const [isAddNoteModalOpen, setIsAddNoteModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<SectionLead | null>(null);
  const [leadNotes, setLeadNotes] = useState<Record<string, LeadNote[]>>({});
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLeads();
  }, [sectionId]);

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const leadsData = await api.fetchSectionLeads(sectionId);
      setLeads(leadsData);
      
      // Expand the most recent lead by default
      if (leadsData.length > 0) {
        const mostRecent = leadsData.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0];
        setExpandedLeads(new Set([mostRecent.id]));
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
      await api.createSectionLead(sectionId, leadData);
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

  const handleStatusChange = async (leadId: string, newStatus: SectionLead['status']) => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/90cd929f-97f2-432d-9ab8-554a6577ecbc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'LeadsTab.tsx:104',message:'handleStatusChange entry',data:{sectionId:sectionId,leadId:leadId,newStatus:newStatus,newStatusType:typeof newStatus},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1,H2,H3'})}).catch(()=>{});
    // #endregion
    
    // Optimistically update the UI immediately
    setLeads(prevLeads => 
      prevLeads.map(lead => 
        lead.id === leadId ? { ...lead, status: newStatus } : lead
      )
    );
    
    try {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/90cd929f-97f2-432d-9ab8-554a6577ecbc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'LeadsTab.tsx:107',message:'Before api.updateSectionLeadStatus call',data:{sectionId:sectionId,leadId:leadId,newStatus:newStatus},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1,H2,H3'})}).catch(()=>{});
      // #endregion
      await api.updateSectionLeadStatus(sectionId, leadId, newStatus);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/90cd929f-97f2-432d-9ab8-554a6577ecbc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'LeadsTab.tsx:110',message:'After api.updateSectionLeadStatus call - success',data:{sectionId:sectionId,leadId:leadId,newStatus:newStatus},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1,H2,H3'})}).catch(()=>{});
      // #endregion
      // Refresh from server to ensure we have the latest data
      await fetchLeads();
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/90cd929f-97f2-432d-9ab8-554a6577ecbc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'LeadsTab.tsx:113',message:'handleStatusChange error caught',data:{sectionId:sectionId,leadId:leadId,newStatus:newStatus,errorMessage:error instanceof Error ? error.message : String(error),errorStack:error instanceof Error ? error.stack : undefined},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1,H2,H3,H4'})}).catch(()=>{});
      // #endregion
      console.error('Failed to update lead status:', error);
      // Revert optimistic update on error
      await fetchLeads();
    }
  };

  const getStatusColor = (status: SectionLead['status']) => {
    switch (status) {
      case 'NEW':
        return 'bg-blue-100 text-blue-800';
      case 'Working to Locate':
        return 'bg-yellow-100 text-yellow-800';
      case 'LVM/TXT/EMAIL':
        return 'bg-purple-100 text-purple-800';
      case 'sent mailer':
        return 'bg-indigo-100 text-indigo-800';
      case 'Negotiating':
        return 'bg-orange-100 text-orange-800';
      case 'Offer Accepted':
        return 'bg-green-100 text-green-800';
      case 'Not Selling Now':
        return 'bg-gray-100 text-gray-800';
      case 'Unable to Locate':
        return 'bg-red-100 text-red-800';
      case 'Dropped':
        return 'bg-gray-200 text-gray-900';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: SectionLead['status']) => {
    switch (status) {
      case 'NEW':
        return '🆕';
      case 'Working to Locate':
        return '🔍';
      case 'LVM/TXT/EMAIL':
        return '📞';
      case 'sent mailer':
        return '📮';
      case 'Negotiating':
        return '🤝';
      case 'Offer Accepted':
        return '✅';
      case 'Not Selling Now':
        return '⏸️';
      case 'Unable to Locate':
        return '❌';
      case 'Dropped':
        return '🗑️';
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

  // Filter leads based on search term
  const filteredLeads = React.useMemo(() => {
    if (!searchTerm.trim()) return leads;
    
    const searchLower = searchTerm.toLowerCase();
    return leads.filter(lead => {
      const name = (lead.name || '').toLowerCase();
      const contact = (lead.contact || '').toLowerCase();
      const phoneEmail = (lead.phoneEmail || '').toLowerCase();
      const status = (lead.status || '').toLowerCase();
      const unitName = (lead.unitName || '').toLowerCase();
      const buyer = (lead.buyer?.name || '').toLowerCase();
      const priority = (lead.priority || '').toLowerCase();
      
      return name.includes(searchLower) ||
             contact.includes(searchLower) ||
             phoneEmail.includes(searchLower) ||
             status.includes(searchLower) ||
             unitName.includes(searchLower) ||
             buyer.includes(searchLower) ||
             priority.includes(searchLower);
    });
  }, [leads, searchTerm]);

  if (isLoading) {
    return <div className="text-center text-sc-slate">Loading leads...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Section Leads</h3>
        <Button onClick={() => setIsCreateLeadModalOpen(true)}>
          Create New Lead
        </Button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search leads by name, contact, phone/email, status, unit, buyer, or priority..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-orange-500 focus:border-orange-500 text-sm"
          />
        </div>
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50 transition duration-200"
          >
            Clear
          </button>
        )}
      </div>

      {/* Leads List */}
      <div className="space-y-4">
        {leads.length === 0 ? (
          <div className="text-center text-sc-slate py-12">
            <p>No leads found for this section.</p>
            <p className="text-sm mt-2">Create a new lead to get started.</p>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="text-center text-sc-slate py-12">
            <p>No leads found matching "{searchTerm}".</p>
            <p className="text-sm mt-2">Try a different search term or clear the search.</p>
          </div>
        ) : (
          filteredLeads.map((lead) => (
            <div key={lead.id} className="bg-white rounded-lg border border-gray-200 shadow-sm">
              {/* Lead Header */}
              <div 
                className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleLeadExpansion(lead.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className="text-2xl">{getStatusIcon(lead.status)}</span>
                    <div>
                      <div className="flex items-center space-x-3">
                        <h4 className="text-gray-900 font-medium">{lead.name}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(lead.status)}`}>
                          {lead.status}
                        </span>
                        <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                          {lead.priority || 'Medium'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
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
                    <select
                      value={lead.status}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleStatusChange(lead.id, e.target.value as SectionLead['status']);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-sc-blue focus:border-transparent"
                    >
                      <option value="NEW">NEW</option>
                      <option value="Working to Locate">Working to Locate</option>
                      <option value="LVM/TXT/EMAIL">LVM/TXT/EMAIL</option>
                      <option value="sent mailer">sent mailer</option>
                      <option value="Negotiating">Negotiating</option>
                      <option value="Offer Accepted">Offer Accepted</option>
                      <option value="Not Selling Now">Not Selling Now</option>
                      <option value="Unable to Locate">Unable to Locate</option>
                      <option value="Dropped">Dropped</option>
                    </select>
                    <button className="text-sc-slate hover:text-white transition-colors">
                      {expandedLeads.has(lead.id) ? '▼' : '▶'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedLeads.has(lead.id) && (
                <div className="border-t border-gray-200 p-4">
                  {/* Lead Details - from database */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    <div>
                      <span className="text-gray-600 text-sm block">Contact</span>
                      <div className="text-gray-900 font-medium">{lead.contact || 'N/A'}</div>
                    </div>
                    <div>
                      <span className="text-gray-600 text-sm block">Phone/Email</span>
                      <div className="text-gray-900 font-medium">{lead.phoneEmail || 'N/A'}</div>
                    </div>
                    <div>
                      <span className="text-gray-600 text-sm block">Status</span>
                      <div className="text-gray-900 font-medium">{lead.status}</div>
                    </div>
                    <div>
                      <span className="text-gray-600 text-sm block">Created</span>
                      <div className="text-gray-900 font-medium">{formatDateTime(lead.createdAt)}</div>
                    </div>
                    <div>
                      <span className="text-gray-600 text-sm block">Last Updated</span>
                      <div className="text-gray-900 font-medium">{formatDateTime(lead.updatedAt)}</div>
                    </div>
                    <div>
                      <span className="text-gray-600 text-sm block">Last Activity</span>
                      <div className="text-gray-900 font-medium">
                        {lead.lastActivity ? formatDateTime(lead.lastActivity) : 'No activity'}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600 text-sm block">Net Royalty Acres</span>
                      <div className="text-gray-900 font-medium">
                        {lead.netRoyaltyAcres != null ? Number(lead.netRoyaltyAcres).toFixed(6) : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600 text-sm block">Net Mineral Acres</span>
                      <div className="text-gray-900 font-medium">
                        {lead.netMineralAcres != null ? Number(lead.netMineralAcres).toFixed(6) : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600 text-sm block">Royalty</span>
                      <div className="text-gray-900 font-medium">
                        {lead.royalty != null ? `${Number(lead.royalty).toFixed(2)}%` : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600 text-sm block">Current Unit</span>
                      <div className="text-gray-900 font-medium whitespace-pre-line">{lead.unitName || 'N/A'}</div>
                    </div>
                    <div>
                      <span className="text-gray-600 text-sm block">Allocation %</span>
                      <div className="text-gray-900 font-medium whitespace-pre-line">{lead.alloPercent ?? 'N/A'}</div>
                    </div>
                    <div>
                      <span className="text-gray-600 text-sm block">Spud Date</span>
                      <div className="text-gray-900 font-medium">{lead.spudDate || 'N/A'}</div>
                    </div>
                    <div>
                      <span className="text-gray-600 text-sm block">First Production</span>
                      <div className="text-gray-900 font-medium">{lead.firstProduction || 'N/A'}</div>
                    </div>
                    <div>
                      <span className="text-gray-600 text-sm block">New Unit</span>
                      <div className="text-gray-900 font-medium whitespace-pre-line">{lead.newUnitName ?? 'N/A'}</div>
                    </div>
                    <div>
                      <span className="text-gray-600 text-sm block">New Unit Allocation %</span>
                      <div className="text-gray-900 font-medium whitespace-pre-line">
                        {lead.alloPercentAl != null && lead.alloPercentAl !== ''
                          ? String(lead.alloPercentAl).split(/\s+/).filter(Boolean).join('\n')
                          : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600 text-sm block">OCC Date</span>
                      <div className="text-gray-900 font-medium">{formatOccDate(lead.occDate, 'N/A')}</div>
                    </div>
                    <div>
                      <span className="text-gray-600 text-sm block">OCC Type</span>
                      <div className="text-gray-900 font-medium">{lead.occType || 'N/A'}</div>
                    </div>
                    <div>
                      <span className="text-gray-600 text-sm block">NRA/$ Cap</span>
                      <div className="text-gray-900 font-medium">
                        {lead.nraCapUsd != null ? `$${Number(lead.nraCapUsd).toLocaleString()}` : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600 text-sm block">NMA/$ Offer</span>
                      <div className="text-gray-900 font-medium">
                        {lead.nmaOffer != null ? `$${Number(lead.nmaOffer).toLocaleString()}` : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600 text-sm block">Total NMA/$</span>
                      <div className="text-gray-900 font-medium">
                        {lead.totalNmaUsd != null ? `$${Number(lead.totalNmaUsd).toLocaleString()}` : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600 text-sm block">NRA/$ Offer (Converted)</span>
                      <div className="text-gray-900 font-medium">
                        {lead.nraOfferConverted != null ? `$${Number(lead.nraOfferConverted).toLocaleString()}` : 'N/A'}
                      </div>
                    </div>
                  </div>

                  {/* Outreach Timeline */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h5 className="text-gray-900 font-medium">Outreach Timeline</h5>
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
                            <div key={note.id} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center space-x-2">
                                  <span className="text-lg">{getOutreachMethodIcon(note.outreachMethod)}</span>
                                  <span className="text-xs text-sc-blue bg-sc-blue bg-opacity-20 px-2 py-1 rounded">
                                    {note.outreachMethod}
                                  </span>
                                </div>
                                <span className="text-xs text-gray-600">
                                  {formatDateTime(note.createdAt)}
                                </span>
                              </div>
                              <p className="text-gray-900 text-sm">{note.noteText}</p>
                              <p className="text-xs text-gray-600 mt-1">
                                By: {note.createdByUser?.name}
                              </p>
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-600 text-sm">No outreach notes yet.</p>
                        )
                      ) : (
                        <div className="text-center text-gray-600 py-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
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