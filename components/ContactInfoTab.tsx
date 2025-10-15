import * as React from 'react';
import type { LeadEnhanced, User } from '../types';
import Button from './ui/Button';
import Modal from './ui/Modal';
import { useAuth } from '../hooks/useAuth';
import { CheckCircleIcon, XCircleIcon, CogIcon, ExclamationTriangleIcon, PencilIcon, PhoneIcon, EnvelopeIcon } from './icons/Icons';

interface ContactInfoTabProps {
  lead: LeadEnhanced;
  users: User[];
  onContactUpdate: () => void;
}

const ContactInfoTab: React.FC<ContactInfoTabProps> = ({ lead, users, onContactUpdate }) => {
  const { user: currentUser } = useAuth();
  const contact = lead.linkedContact;
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [contactForm, setContactForm] = React.useState({
    name: contact?.name || lead.name || '',
    email: contact?.email || '',
    phone: contact?.phone || lead.phoneEmail || '',
    alternatePhone: contact?.alternatePhone || '',
    company: contact?.company || '',
    address: contact?.address || lead.street || '',
    city: contact?.city || lead.city || '',
    state: contact?.state || lead.state || '',
    zipCode: contact?.zipCode || lead.zip || '',
    ownerNumber: contact?.ownerNumber || '',
    partyType: contact?.partyType || 'individual',
    interestType: contact?.interestType || 'mineral',
    ownershipPercent: contact?.ownershipPercent || lead.ownershipPercentage || 0,
    royaltyPercent: contact?.royaltyPercent || lead.royalty || 0,
    doNotContact: contact?.doNotContact || false,
    deceased: contact?.deceased || false,
    litigation: contact?.litigation || false,
  });

  // Verification/enrichment status (mocked for now)
  const verificationStatus = {
    phoneVerified: contact?.phoneVerified || false,
    emailVerified: contact?.emailVerified || false,
    phoneInvalid: contact?.phoneInvalid || false,
    emailBounced: contact?.emailBounced || false,
    enrichedSource: contact?.enrichedSource || null,
    lastEnriched: contact?.lastEnriched || null,
  };

  // Permission logic
  const canEdit = currentUser?.role?.name === 'Admin' || currentUser?.role?.name === 'Manager';

  // Action handlers (mocked)
  const handleLogCall = () => alert('Log Call functionality');
  const handleSendEmail = () => alert('Send Email functionality');
  const handleEnrichData = () => alert('Enrich Data functionality');
  const handleEditContact = () => setIsEditModalOpen(true);
  const handleSaveContact = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsEditModalOpen(false);
    onContactUpdate();
  };

  // Helper for status flag badges
  const getStatusFlagBadge = (flag: string, isActive: boolean) => {
    if (!isActive) return null;
    const config = {
      doNotContact: { label: 'Do Not Contact', color: 'bg-red-100 text-red-800' },
      deceased: { label: 'Deceased', color: 'bg-gray-100 text-gray-800' },
      litigation: { label: 'Litigation', color: 'bg-yellow-100 text-yellow-800' },
    }[flag as keyof typeof config];
    return config ? (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>{config.label}</span>
    ) : null;
  };

  // Helper for verification icons
  const getVerificationIcon = (type: 'phone' | 'email') => {
    if (type === 'phone') {
      if (verificationStatus.phoneInvalid) return <XCircleIcon className="h-5 w-5 text-red-500" title="Invalid phone number" />;
      if (verificationStatus.phoneVerified) return <CheckCircleIcon className="h-5 w-5 text-green-500" title="Phone verified" />;
      return <CogIcon className="h-5 w-5 text-gray-400" title="Phone not verified" />;
    } else {
      if (verificationStatus.emailBounced) return <XCircleIcon className="h-5 w-5 text-red-500" title="Email bounced" />;
      if (verificationStatus.emailVerified) return <CheckCircleIcon className="h-5 w-5 text-green-500" title="Email verified" />;
      return <CogIcon className="h-5 w-5 text-gray-400" title="Email not verified" />;
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Status Flags */}
      {(contactForm.doNotContact || contactForm.deceased || contactForm.litigation) && (
        <div className="flex flex-wrap gap-2 mb-2">
          {getStatusFlagBadge('doNotContact', contactForm.doNotContact)}
          {getStatusFlagBadge('deceased', contactForm.deceased)}
          {getStatusFlagBadge('litigation', contactForm.litigation)}
        </div>
      )}

      {/* Contact Details */}
      <div className="bg-white rounded-lg border border-gray-200 shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Contact Details</h3>
          {canEdit && (
            <Button size="sm" onClick={handleEditContact} aria-label="Edit Info">
              <PencilIcon className="h-4 w-4 mr-2" /> Edit Info
            </Button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-500">Full Name</label>
            <p className="text-gray-900 font-medium">{contactForm.name || 'Not provided'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Email Address</label>
            <div className="flex items-center space-x-2">
              <p className="text-gray-900">{contactForm.email || 'Not provided'}</p>
              {getVerificationIcon('email')}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Primary Phone</label>
            <div className="flex items-center space-x-2">
              <p className="text-gray-900">{contactForm.phone || 'Not provided'}</p>
              {getVerificationIcon('phone')}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Alternate Phone</label>
            <p className="text-gray-900">{contactForm.alternatePhone || 'Not provided'}</p>
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-500">Company</label>
            <p className="text-gray-900">{contactForm.company || 'Not provided'}</p>
          </div>
        </div>
      </div>

      {/* Mailing Address */}
      <div className="bg-white rounded-lg border border-gray-200 shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Mailing Address</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-500">Street Address</label>
            <p className="text-gray-900">{contactForm.address || 'Not provided'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">City</label>
            <p className="text-gray-900">{contactForm.city || 'Not provided'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">State</label>
            <p className="text-gray-900">{contactForm.state || 'Not provided'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">ZIP Code</label>
            <p className="text-gray-900">{contactForm.zipCode || 'Not provided'}</p>
          </div>
        </div>
      </div>

      {/* Owner Identifiers */}
      <div className="bg-white rounded-lg border border-gray-200 shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Owner Identifiers</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-500">Owner Number</label>
            <p className="text-gray-900">{contactForm.ownerNumber || 'Not provided'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Party Type</label>
            <p className="text-gray-900 capitalize">{contactForm.partyType}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Interest Type</label>
            <p className="text-gray-900 capitalize">{contactForm.interestType}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Ownership %</label>
            <p className="text-gray-900">{contactForm.ownershipPercent}%</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Royalty %</label>
            <p className="text-gray-900">{contactForm.royaltyPercent}%</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-2">
        <Button variant="secondary" onClick={handleLogCall} aria-label="Log Call" disabled={contactForm.doNotContact && !canEdit}>
          <PhoneIcon className="h-4 w-4 mr-2" /> Log Call
        </Button>
        <Button variant="secondary" onClick={handleSendEmail} aria-label="Send Email" disabled={contactForm.doNotContact && !canEdit}>
          <EnvelopeIcon className="h-4 w-4 mr-2" /> Send Email
        </Button>
        <Button variant="secondary" onClick={handleEnrichData} aria-label="Enrich Data">
          <CogIcon className="h-4 w-4 mr-2" /> Enrich Data
        </Button>
      </div>

      {/* Verification & Enrichment Indicators */}
      <div className="bg-white rounded-lg border border-gray-200 shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Verification Status</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Phone Verification</span>
            {getVerificationIcon('phone')}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Email Verification</span>
            {getVerificationIcon('email')}
          </div>
          {verificationStatus.enrichedSource && (
            <div className="pt-4 border-t border-gray-200">
              <label className="block text-sm font-medium text-gray-500">Data Source</label>
              <p className="text-gray-900 text-sm">{verificationStatus.enrichedSource}</p>
              {verificationStatus.lastEnriched && (
                <p className="text-gray-500 text-xs mt-1">
                  Last updated: {new Date(verificationStatus.lastEnriched).toLocaleDateString()}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Contact Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Contact Information" size="lg">
        <form onSubmit={handleSaveContact} className="space-y-6">
          {/* ...modal fields for editing all contact info... */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ContactInfoTab;
