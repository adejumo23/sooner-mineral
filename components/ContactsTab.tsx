import React, { useState, useEffect } from 'react';
import type { ContactTractOwnership, ContactNote, Lead, User } from '../types';
import * as api from '../services/api';
import Table from './ui/Table';
import Button from './ui/Button';
import Modal from './ui/Modal';
import Input from './ui/Input';

interface ContactsTabProps {
  tractId: string;
  users: User[];
}

const ContactsTab: React.FC<ContactsTabProps> = ({ tractId, users }) => {
  const [contacts, setContacts] = useState<ContactTractOwnership[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState<ContactTractOwnership | null>(null);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [contactNotes, setContactNotes] = useState<ContactNote[]>([]);
  const [contactLeads, setContactLeads] = useState<Lead[]>([]);
  const [sortBy, setSortBy] = useState<'name' | 'ownership' | 'lastOutreach'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    fetchContacts();
  }, [tractId]);

  const fetchContacts = async () => {
    setIsLoading(true);
    try {
      const contactsData = await api.fetchTractContacts(tractId);
      setContacts(contactsData);
    } catch (error) {
      console.error('Failed to fetch contacts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContactClick = async (contact: ContactTractOwnership) => {
    setSelectedContact(contact);
    try {
      const [notes, leads] = await Promise.all([
        api.fetchContactNotes(contact.contactId, tractId),
        api.fetchContactLeads(contact.contactId, tractId)
      ]);
      setContactNotes(notes);
      setContactLeads(leads);
    } catch (error) {
      console.error('Failed to fetch contact details:', error);
    }
  };

  const handleCreateNote = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedContact) return;

    const formData = new FormData(e.currentTarget);
    const noteData = {
      noteText: formData.get('noteText') as string,
      noteType: formData.get('noteType') as string,
      tractId: tractId,
    };

    try {
      await api.createContactNote(selectedContact.contactId, noteData);
      const updatedNotes = await api.fetchContactNotes(selectedContact.contactId, tractId);
      setContactNotes(updatedNotes);
      setIsNoteModalOpen(false);
      e.currentTarget.reset();
    } catch (error) {
      console.error('Failed to create note:', error);
    }
  };

  const handleCreateLead = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedContact) return;

    const formData = new FormData(e.currentTarget);
    const leadData = {
      contactId: selectedContact.contactId,
      tractId: tractId,
      leadType: formData.get('leadType') as string,
      priority: formData.get('priority') as string,
      notes: formData.get('notes') as string,
    };

    try {
      await api.createLead(leadData);
      const updatedLeads = await api.fetchContactLeads(selectedContact.contactId, tractId);
      setContactLeads(updatedLeads);
      setIsLeadModalOpen(false);
      e.currentTarget.reset();
    } catch (error) {
      console.error('Failed to create lead:', error);
    }
  };

  const getLastOutreach = (contact: ContactTractOwnership): string => {
    const notes = contactNotes.filter(note => note.contactId === contact.contactId);
    if (notes.length === 0) return 'No outreach';
    
    const latestNote = notes.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];
    
    return new Date(latestNote.createdAt).toLocaleDateString();
  };

  const hasLinkedLead = (contact: ContactTractOwnership): boolean => {
    return contactLeads.some(lead => 
      lead.contactId === contact.contactId && 
      ['Open', 'In Progress', 'Qualified'].includes(lead.status)
    );
  };

  const formatPercentage = (value: number): string => {
    return `${(value * 100).toFixed(2)}%`;
  };

  const formatAcres = (value?: number): string => {
    return value ? value.toFixed(2) : 'N/A';
  };

  const sortedContacts = [...contacts].sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (sortBy) {
      case 'name':
        aValue = a.contact?.name || '';
        bValue = b.contact?.name || '';
        break;
      case 'ownership':
        aValue = a.ownershipPercentage;
        bValue = b.ownershipPercentage;
        break;
      case 'lastOutreach':
        aValue = getLastOutreach(a);
        bValue = getLastOutreach(b);
        break;
      default:
        return 0;
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const handleSort = (column: 'name' | 'ownership' | 'lastOutreach') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  if (isLoading) {
    return <div className="text-center text-sc-slate">Loading contacts...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Contacts Table */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Tract Contacts</h3>
        <Table headers={[
          'Contact Name',
          'Ownership %',
          'Royalty %',
          'NMA',
          'NRA (1/8 normalized)',
          'Source of Title',
          'Last Outreach',
          'Linked Lead',
          'Actions'
        ]}>
          {sortedContacts.map((contact) => (
            <tr key={contact.id} className="hover:bg-sc-light-navy cursor-pointer" onClick={() => handleContactClick(contact)}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                <div>
                  <div className="font-medium">{contact.contact?.name}</div>
                  {contact.contact?.entityType === 'Entity' && (
                    <div className="text-xs text-sc-slate mt-1" title={contact.contact.legalName}>
                      {contact.contact.legalName.length > 50 
                        ? contact.contact.legalName.substring(0, 50) + '...'
                        : contact.contact.legalName
                      }
                    </div>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-sc-slate">
                {formatPercentage(contact.ownershipPercentage)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-sc-slate">
                {formatPercentage(contact.royaltyPercentage)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-sc-slate">
                {formatAcres(contact.nma)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-sc-slate">
                {formatAcres(contact.nra)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-sc-slate">
                <div className="max-w-xs truncate" title={contact.sourceOfTitle}>
                  {contact.sourceOfTitle || 'N/A'}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-sc-slate">
                {getLastOutreach(contact)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-sc-slate">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  hasLinkedLead(contact) 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {hasLinkedLead(contact) ? 'Yes' : 'No'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleContactClick(contact);
                    setIsNoteModalOpen(true);
                  }}
                >
                  Add Note
                </Button>
                {!hasLinkedLead(contact) && (
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleContactClick(contact);
                      setIsLeadModalOpen(true);
                    }}
                  >
                    Create Lead
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </Table>
      </div>

      {/* Contact Details Modal */}
      {selectedContact && (
        <Modal 
          isOpen={!!selectedContact} 
          onClose={() => setSelectedContact(null)}
          title={`Contact Details - ${selectedContact.contact?.name}`}
        >
          <div className="space-y-6">
            {/* Contact Info */}
            <div className="bg-sc-light-navy p-4 rounded-lg">
              <h4 className="text-white font-semibold mb-3">Contact Information</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-sc-slate">Name:</span>
                  <div className="text-white">{selectedContact.contact?.name}</div>
                </div>
                <div>
                  <span className="text-sc-slate">Entity Type:</span>
                  <div className="text-white">{selectedContact.contact?.entityType}</div>
                </div>
                <div>
                  <span className="text-sc-slate">Email:</span>
                  <div className="text-white">{selectedContact.contact?.email || 'N/A'}</div>
                </div>
                <div>
                  <span className="text-sc-slate">Phone:</span>
                  <div className="text-white">{selectedContact.contact?.phone || 'N/A'}</div>
                </div>
                <div className="col-span-2">
                  <span className="text-sc-slate">Address:</span>
                  <div className="text-white">{selectedContact.contact?.address || 'N/A'}</div>
                </div>
                {selectedContact.contact?.entityType === 'Entity' && (
                  <div className="col-span-2">
                    <span className="text-sc-slate">Legal Name:</span>
                    <div className="text-white">{selectedContact.contact.legalName}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Ownership Info */}
            <div className="bg-sc-light-navy p-4 rounded-lg">
              <h4 className="text-white font-semibold mb-3">Ownership Information</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-sc-slate">Ownership %:</span>
                  <div className="text-white">{formatPercentage(selectedContact.ownershipPercentage)}</div>
                </div>
                <div>
                  <span className="text-sc-slate">Royalty %:</span>
                  <div className="text-white">{formatPercentage(selectedContact.royaltyPercentage)}</div>
                </div>
                <div>
                  <span className="text-sc-slate">NMA:</span>
                  <div className="text-white">{formatAcres(selectedContact.nma)}</div>
                </div>
                <div>
                  <span className="text-sc-slate">NRA (1/8 normalized):</span>
                  <div className="text-white">{formatAcres(selectedContact.nra)}</div>
                </div>
                <div className="col-span-2">
                  <span className="text-sc-slate">Source of Title:</span>
                  <div className="text-white">{selectedContact.sourceOfTitle || 'N/A'}</div>
                </div>
              </div>
            </div>

            {/* Notes Section */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-white font-semibold">Contact Notes</h4>
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={() => setIsNoteModalOpen(true)}
                >
                  Add Note
                </Button>
              </div>
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {contactNotes.length === 0 ? (
                  <p className="text-sc-slate text-sm">No notes yet</p>
                ) : (
                  contactNotes.map((note) => (
                    <div key={note.id} className="bg-sc-light-navy p-3 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs text-sc-blue bg-sc-blue bg-opacity-20 px-2 py-1 rounded">
                          {note.noteType}
                        </span>
                        <span className="text-xs text-sc-slate">
                          {new Date(note.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-white text-sm">{note.noteText}</p>
                      <p className="text-xs text-sc-slate mt-1">
                        By: {note.createdByUser?.name}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Leads Section */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-white font-semibold">Linked Leads</h4>
                {!hasLinkedLead(selectedContact) && (
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={() => setIsLeadModalOpen(true)}
                  >
                    Create Lead
                  </Button>
                )}
              </div>
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {contactLeads.length === 0 ? (
                  <p className="text-sc-slate text-sm">No leads yet</p>
                ) : (
                  contactLeads.map((lead) => (
                    <div key={lead.id} className="bg-sc-light-navy p-3 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex space-x-2">
                          <span className={`text-xs px-2 py-1 rounded ${
                            lead.status === 'Open' ? 'bg-blue-100 text-blue-800' :
                            lead.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                            lead.status === 'Qualified' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {lead.status}
                          </span>
                          <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                            {lead.leadType}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            lead.priority === 'High' || lead.priority === 'Urgent' ? 'bg-red-100 text-red-800' :
                            lead.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {lead.priority}
                          </span>
                        </div>
                        <span className="text-xs text-sc-slate">
                          {new Date(lead.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {lead.notes && (
                        <p className="text-white text-sm mb-2">{lead.notes}</p>
                      )}
                      <div className="text-xs text-sc-slate">
                        Assigned to: {lead.assignedToUser?.name || 'Unassigned'}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Note Modal */}
      <Modal 
        isOpen={isNoteModalOpen} 
        onClose={() => setIsNoteModalOpen(false)}
        title="Add Contact Note"
      >
        <form onSubmit={handleCreateNote} className="space-y-4">
          <div>
            <label htmlFor="noteType" className="block text-sm font-medium text-sc-slate mb-1">
              Note Type
            </label>
            <select 
              id="noteType" 
              name="noteType" 
              required
              className="w-full px-4 py-2 bg-sc-light-navy border border-sc-light-navy rounded-md text-sc-light-slate focus:outline-none focus:ring-2 focus:ring-sc-blue"
            >
              <option value="Outreach">Outreach</option>
              <option value="Follow-up">Follow-up</option>
              <option value="Meeting">Meeting</option>
              <option value="Documentation">Documentation</option>
              <option value="Other">Other</option>
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
              placeholder="Enter your note here..."
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4 border-t border-sc-light-navy">
            <Button type="button" variant="secondary" onClick={() => setIsNoteModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Note</Button>
          </div>
        </form>
      </Modal>

      {/* Create Lead Modal */}
      <Modal 
        isOpen={isLeadModalOpen} 
        onClose={() => setIsLeadModalOpen(false)}
        title="Create Lead"
      >
        <form onSubmit={handleCreateLead} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="leadType" className="block text-sm font-medium text-sc-slate mb-1">
                Lead Type
              </label>
              <select 
                id="leadType" 
                name="leadType" 
                required
                className="w-full px-4 py-2 bg-sc-light-navy border border-sc-light-navy rounded-md text-sc-light-slate focus:outline-none focus:ring-2 focus:ring-sc-blue"
              >
                <option value="Acquisition">Acquisition</option>
                <option value="Lease">Lease</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-sc-slate mb-1">
                Priority
              </label>
              <select 
                id="priority" 
                name="priority" 
                required
                className="w-full px-4 py-2 bg-sc-light-navy border border-sc-light-navy rounded-md text-sc-light-slate focus:outline-none focus:ring-2 focus:ring-sc-blue"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-sc-slate mb-1">
              Notes
            </label>
            <textarea 
              id="notes" 
              name="notes" 
              rows={3}
              className="w-full px-4 py-2 bg-sc-light-navy border border-sc-light-navy rounded-md text-sc-light-slate placeholder-sc-slate focus:outline-none focus:ring-2 focus:ring-sc-blue"
              placeholder="Enter lead notes..."
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4 border-t border-sc-light-navy">
            <Button type="button" variant="secondary" onClick={() => setIsLeadModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Lead</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ContactsTab; 