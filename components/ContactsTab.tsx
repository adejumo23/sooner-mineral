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

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const formatAcres = (value: number) => {
    return `${value.toFixed(2)} NMA`;
  };

  const getLastOutreach = (contact: ContactTractOwnership) => {
    // This would typically come from the contact notes or lead activity
    // For now, returning a placeholder
    return 'N/A';
  };

  const hasLinkedLead = (contact: ContactTractOwnership) => {
    // This would check if there's an active lead for this contact
    // For now, returning false as placeholder
    return false;
  };

  const getContactInfo = (contact: ContactTractOwnership) => {
    if (!contact.contact) return 'N/A';
    
    const { email, phone, address } = contact.contact;
    const contactMethods = [];
    
    if (email) contactMethods.push(`📧 ${email}`);
    if (phone) contactMethods.push(`📞 ${phone}`);
    if (address) contactMethods.push(`📍 ${address}`);
    
    return contactMethods.length > 0 ? contactMethods.join('\n') : 'N/A';
  };

  const getSourceOfTitle = (contact: ContactTractOwnership) => {
    if (!contact.sourceOfTitle) return 'N/A';
    
    // Truncate long titles and show full on hover
    return contact.sourceOfTitle.length > 50 
      ? `${contact.sourceOfTitle.substring(0, 50)}...`
      : contact.sourceOfTitle;
  };

  // Sort contacts based on current sort criteria
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
        aValue = a.contact?.name || '';
        bValue = b.contact?.name || '';
    }
    
    if (sortOrder === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
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
      {/* Header with description */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-2">Tract Contacts</h3>
        <p className="text-sc-slate text-sm">
          Manage landowners and stakeholders associated with this tract. View ownership interest, 
          contact details, and create leads for buyer outreach opportunities.
        </p>
      </div>

      {/* Contacts Table */}
      <div className="bg-sc-light-navy rounded-lg border border-sc-navy overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-sc-navy">
            <thead className="bg-sc-navy">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-sc-slate uppercase tracking-wider cursor-pointer hover:text-white"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Contact Name</span>
                    {sortBy === 'name' && (
                      <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-sc-slate uppercase tracking-wider cursor-pointer hover:text-white"
                  onClick={() => handleSort('ownership')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Ownership %</span>
                    {sortBy === 'ownership' && (
                      <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-sc-slate uppercase tracking-wider">
                  Royalty %
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-sc-slate uppercase tracking-wider">
                  NMA
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-sc-slate uppercase tracking-wider">
                  NRA (1/8 normalized)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-sc-slate uppercase tracking-wider">
                  Source of Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-sc-slate uppercase tracking-wider">
                  Contact Info
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-sc-slate uppercase tracking-wider cursor-pointer hover:text-white"
                  onClick={() => handleSort('lastOutreach')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Last Outreach</span>
                    {sortBy === 'lastOutreach' && (
                      <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-sc-slate uppercase tracking-wider">
                  Linked Lead
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-sc-slate uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-sc-light-navy divide-y divide-sc-navy">
              {sortedContacts.map((contact) => (
                <tr key={contact.id} className="hover:bg-sc-navy cursor-pointer" onClick={() => handleContactClick(contact)}>
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
                    {formatAcres(contact.nma || 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-sc-slate">
                    {formatAcres(contact.nra || 0)}
                  </td>
                  <td className="px-6 py-4 text-sm text-sc-slate">
                    <div className="max-w-xs" title={contact.sourceOfTitle}>
                      {getSourceOfTitle(contact)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-sc-slate">
                    <div className="max-w-xs whitespace-pre-line" title={getContactInfo(contact)}>
                      {getContactInfo(contact)}
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
            </tbody>
          </table>
        </div>
      </div>

      {/* Contact Details Modal */}
      {selectedContact && (
        <Modal
          isOpen={isNoteModalOpen || isLeadModalOpen}
          onClose={() => {
            setIsNoteModalOpen(false);
            setIsLeadModalOpen(false);
            setSelectedContact(null);
          }}
          title={`${selectedContact.contact?.name} - ${isNoteModalOpen ? 'Add Note' : 'Create Lead'}`}
        >
          {isNoteModalOpen && (
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
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsNoteModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  Add Note
                </Button>
              </div>
            </form>
          )}

          {isLeadModalOpen && (
            <form onSubmit={handleCreateLead} className="space-y-4">
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
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsLeadModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  Create Lead
                </Button>
              </div>
            </form>
          )}
        </Modal>
      )}

      {/* Contact Details Panel */}
      {selectedContact && !isNoteModalOpen && !isLeadModalOpen && (
        <div className="bg-sc-light-navy p-4 rounded-lg">
          <div className="flex justify-between items-start mb-4">
            <h4 className="text-lg font-medium text-white">
              {selectedContact.contact?.name} - Contact Details
            </h4>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setSelectedContact(null)}
            >
              Close
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contact Information */}
            <div>
              <h5 className="text-sm font-medium text-sc-slate mb-3">Contact Information</h5>
              <div className="space-y-2 text-sm text-white">
                {selectedContact.contact?.email && (
                  <div><span className="text-sc-slate">Email:</span> {selectedContact.contact.email}</div>
                )}
                {selectedContact.contact?.phone && (
                  <div><span className="text-sc-slate">Phone:</span> {selectedContact.contact.phone}</div>
                )}
                {selectedContact.contact?.address && (
                  <div><span className="text-sc-slate">Address:</span> {selectedContact.contact.address}</div>
                )}
              </div>
            </div>

            {/* Ownership Details */}
            <div>
              <h5 className="text-sm font-medium text-sc-slate mb-3">Ownership Details</h5>
              <div className="space-y-2 text-sm text-white">
                <div><span className="text-sc-slate">Ownership %:</span> {formatPercentage(selectedContact.ownershipPercentage)}</div>
                <div><span className="text-sc-slate">Royalty %:</span> {formatPercentage(selectedContact.royaltyPercentage)}</div>
                <div><span className="text-sc-slate">NMA:</span> {formatAcres(selectedContact.nma || 0)}</div>
                <div><span className="text-sc-slate">NRA (1/8 normalized):</span> {formatAcres(selectedContact.nra || 0)}</div>
                <div><span className="text-sc-slate">Source of Title:</span> {selectedContact.sourceOfTitle || 'N/A'}</div>
              </div>
            </div>
          </div>

          {/* Notes Section */}
          <div className="mt-6">
            <h5 className="text-sm font-medium text-sc-slate mb-3">Contact Notes</h5>
            <div className="space-y-3">
              {contactNotes.length > 0 ? (
                contactNotes.map((note) => (
                  <div key={note.id} className="bg-sc-navy p-3 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs text-sc-slate">
                        {new Date(note.createdAt).toLocaleDateString()} - {note.noteType}
                      </span>
                    </div>
                    <p className="text-xs text-sc-slate mt-1">{note.noteText}</p>
                  </div>
                ))
              ) : (
                <p className="text-sc-slate text-sm">No notes yet</p>
              )}
            </div>
          </div>

          {/* Leads Section */}
          <div className="mt-6">
            <h5 className="text-sm font-medium text-sc-slate mb-3">Linked Leads</h5>
            <div className="space-y-3">
              {contactLeads.length > 0 ? (
                contactLeads.map((lead) => (
                  <div key={lead.id} className="bg-sc-navy p-3 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs text-sc-slate">
                        {new Date(lead.createdAt).toLocaleDateString()} - {lead.leadType}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        lead.status === 'Open' ? 'bg-green-100 text-green-800' :
                        lead.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                        lead.status === 'Closed' ? 'bg-gray-100 text-gray-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {lead.status}
                      </span>
                    </div>
                    <p className="text-xs text-sc-slate mt-1">{lead.notes || 'No notes'}</p>
                  </div>
                ))
              ) : (
                <p className="text-sc-slate text-sm">No leads yet</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactsTab; 