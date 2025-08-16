import * as React from 'react';
import type { LeadEnhanced, User, Deal, DealConversion } from '../types';
import Button from './ui/Button';
import Modal from './ui/Modal';
import * as api from '../services/api';

interface ConversionTrackerTabProps {
  lead: LeadEnhanced;
  currentUser: User;
  onConversion: (deal: Deal, conversion: DealConversion) => void;
}

const eligibleStatuses = ['Committed', 'Signed Paperwork'];
const dealTypes = ['Minerals', 'Non-Op', 'Leasehold', 'Other'];

const ConversionTrackerTab: React.FC<ConversionTrackerTabProps> = ({ lead, currentUser, onConversion }) => {
  const [effectiveDate, setEffectiveDate] = React.useState('');
  const [loiStatus, setLoiStatus] = React.useState('');
  const [sellerName, setSellerName] = React.useState(lead.linkedContact?.name || '');
  const [executionTimestamp, setExecutionTimestamp] = React.useState('');
  const [loiDocumentId, setLoiDocumentId] = React.useState<string | undefined>(undefined);
  const [notes, setNotes] = React.useState('');
  const [assignedOwnerId, setAssignedOwnerId] = React.useState(lead.buyerId || '');
  const [dealType, setDealType] = React.useState<'Minerals' | 'Non-Op' | 'Leasehold' | 'Other'>('Minerals');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [conversionResult, setConversionResult] = React.useState<{ deal: Deal, conversion: DealConversion } | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const eligible = eligibleStatuses.includes(lead.status);
  const canConvert = eligible && effectiveDate && loiStatus && sellerName && executionTimestamp && assignedOwnerId && dealType && (currentUser.role.name === 'Admin' || currentUser.id === lead.buyerId);
  const isReadOnly = lead.status === 'Converted' && currentUser.role.name !== 'Admin';

  const handleConvert = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const { deal, conversion } = await api.convertLeadToDeal(lead.id, {
        userId: currentUser.id,
        notes,
        loiDocumentId,
        assignedOwnerId,
        dealType,
        effectiveDate,
        loiStatus,
        sellerName,
        executionTimestamp,
      });
      setConversionResult({ deal, conversion });
      onConversion(deal, conversion);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Conversion Tracker</h2>
      <div className="mb-4">
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${eligible ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
              title={eligible ? 'Lead is eligible for conversion' : 'Lead is not eligible for conversion'}>
          {eligible ? 'Eligible for Conversion' : 'Not Eligible for Conversion'}
        </span>
        <span className="ml-4 text-sm text-gray-600">Current Status: <b>{lead.status}</b></span>
      </div>
      <form className="space-y-4" onSubmit={e => { e.preventDefault(); if (canConvert) handleConvert(); }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Effective Date *</label>
            <input type="date" className="w-full border border-gray-300 rounded-md px-3 py-2" value={effectiveDate} onChange={e => setEffectiveDate(e.target.value)} disabled={isReadOnly} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">LOI Status *</label>
            <input type="text" className="w-full border border-gray-300 rounded-md px-3 py-2" value={loiStatus} onChange={e => setLoiStatus(e.target.value)} disabled={isReadOnly} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Seller Name *</label>
            <input type="text" className="w-full border border-gray-300 rounded-md px-3 py-2" value={sellerName} onChange={e => setSellerName(e.target.value)} disabled={isReadOnly} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Execution Timestamp *</label>
            <input type="datetime-local" className="w-full border border-gray-300 rounded-md px-3 py-2" value={executionTimestamp} onChange={e => setExecutionTimestamp(e.target.value)} disabled={isReadOnly} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">LOI Document (optional)</label>
            <input type="text" className="w-full border border-gray-300 rounded-md px-3 py-2" value={loiDocumentId || ''} onChange={e => setLoiDocumentId(e.target.value)} disabled={isReadOnly} placeholder="Document ID or URL" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Assign Deal Owner *</label>
            <input type="text" className="w-full border border-gray-300 rounded-md px-3 py-2" value={assignedOwnerId} onChange={e => setAssignedOwnerId(e.target.value)} disabled={isReadOnly} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Deal Type *</label>
            <select className="w-full border border-gray-300 rounded-md px-3 py-2" value={dealType} onChange={e => setDealType(e.target.value as any)} disabled={isReadOnly} required>
              {dealTypes.map(type => <option key={type} value={type}>{type}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Conversion Notes</label>
          <textarea className="w-full border border-gray-300 rounded-md px-3 py-2" value={notes} onChange={e => setNotes(e.target.value)} disabled={isReadOnly} rows={3} />
        </div>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <div className="flex justify-end">
          <Button type="submit" disabled={!canConvert || isSubmitting || isReadOnly} aria-label="Create Deal">
            {isSubmitting ? 'Converting...' : 'Create Deal'}
          </Button>
        </div>
      </form>
      {conversionResult && (
        <div className="mt-8 border-t pt-6">
          <h3 className="text-md font-semibold text-gray-900 mb-2">Conversion Audit Trail</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><b>Conversion Date:</b> {new Date(conversionResult.conversion.timestamp).toLocaleString()}</div>
            <div><b>Created By:</b> {currentUser.name}</div>
            <div><b>Assigned Deal Owner:</b> {conversionResult.deal.assignedOwnerId}</div>
            <div><b>Deal Type:</b> {conversionResult.deal.type}</div>
            <div><b>Linked LOI Document:</b> {conversionResult.deal.loiDocumentId ? <a href={conversionResult.deal.loiDocumentId} target="_blank" rel="noopener noreferrer">View</a> : 'None'}</div>
            <div><b>Conversion Notes:</b> {conversionResult.deal.notes || 'None'}</div>
            <div><b>Conversion Status:</b> {conversionResult.conversion.status}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConversionTrackerTab;
