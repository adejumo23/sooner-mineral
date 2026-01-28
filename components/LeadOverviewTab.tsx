import * as React from 'react';
import type { LeadEnhanced, User } from '../types';
import Button from './ui/Button';
import { UserIcon, CheckCircleIcon, XCircleIcon, ArrowLeftIcon } from './icons/Icons';

const statusColors: Record<string, string> = {
  Uncontacted: 'bg-gray-100 text-gray-700',
  Spoke: 'bg-blue-100 text-blue-700',
  Interested: 'bg-yellow-100 text-yellow-700',
  'LOI Sent': 'bg-green-100 text-green-700',
  Dead: 'bg-red-100 text-red-700',
};

const priorityTooltips: Record<string, string> = {
  Hot: 'High priority, act quickly',
  Warm: 'Medium priority',
  Cold: 'Low priority',
};

const assetTypeLabels: Record<string, string> = {
  mineral: 'Mineral',
  lease: 'Lease',
  working: 'Working Interest',
  unknown: 'Unknown',
};

function getStatusColor(status: string) {
  return statusColors[status] || 'bg-gray-100 text-gray-700';
}

const LeadOverviewTab: React.FC<{
  lead: LeadEnhanced;
  currentUser: User;
  users: User[];
  onConvertToDeal: () => void;
}> = ({ lead, currentUser, users, onConvertToDeal }) => {
  // Use real data from LeadEnhanced interface - no mock data
  const assignedBuyer = lead.buyer;
  const contact = lead.linkedContact;
  // Ensure we use the same fallback logic as the leads table - prefer contact field first
  const contactName = lead.contact || lead.linkedContact?.name || lead.name || '';
  const lastActivity = lead.lastContactDate || lead.updatedAt;
  const lastStatusChange = lead.updatedAt;
  const eligibleStatuses = ['Interested', 'LOI Sent'];
  const isEligible = eligibleStatuses.includes(lead.status);
  const [showConfirm, setShowConfirm] = React.useState(false);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Lead Header */}
      <div className="bg-white rounded-lg border border-gray-200 shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Lead Overview</h2>
        <div className="flex flex-wrap items-center gap-4 justify-between">
          <div>
            {contactName && (
              <div className="text-2xl font-bold text-gray-900">
                {contact?.id ? (
                  <a href={`/contacts/${contact.id}`} className="hover:underline text-sc-blue" title="View Contact Profile">{contactName}</a>
                ) : (
                  <span>{contactName}</span>
                )}
              </div>
            )}
            <div className="text-sm text-gray-500">Lead ID: <span className="font-mono">{lead.id}</span></div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(lead.status)}`}>{lead.status}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-6 text-sm text-gray-700 mt-4">
          {lead.createdAt && (
            <div title="When this lead was created">
              <span className="font-medium">Created On:</span> {new Date(lead.createdAt).toLocaleString()}
            </div>
          )}
          {lastActivity && (
            <div title="Most recent outreach (call, note, email)">
              <span className="font-medium">Last Activity:</span> {new Date(lastActivity).toLocaleString()}
            </div>
          )}
          {lead.priorityScore !== undefined && (
            <div title="Priority Score">
              <span className="font-medium">Priority Score:</span> {lead.priorityScore}
            </div>
          )}
        </div>
      </div>
      {/* Assignment Summary */}
      <div className="bg-white rounded-lg border border-gray-200 shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Assignment Summary</h2>
        <div className="flex flex-wrap items-center gap-6">
          {assignedBuyer && (
            <div className="flex items-center gap-2" title="Assigned Buyer">
              <UserIcon className="h-8 w-8 text-blue-600" />
              <span className="font-semibold text-blue-600">{assignedBuyer.name}</span>
              {assignedBuyer.email && (
                <span className="text-xs text-gray-500 ml-2" title={`Email: ${assignedBuyer.email}`}>(Buyer)</span>
              )}
            </div>
          )}
          {lead.priorityScore !== undefined && (
            <div className="flex items-center gap-1" title="Priority Score">
              <span className="font-medium">Priority Score:</span>
              <span className="px-2 py-1 rounded bg-gray-100 text-gray-800 text-xs font-semibold">{lead.priorityScore}</span>
            </div>
          )}
          {lead.sourceChannel && (
            <div className="flex items-center gap-1" title="How the lead originated">
              <span className="font-medium">Source:</span>
              <span className="text-xs text-gray-700">{lead.sourceChannel}</span>
            </div>
          )}
          {contactName && (
            <div className="flex items-center gap-1" title="Contact Information">
              <span className="font-medium">Contact:</span>
              <span className="text-xs text-gray-700">{contactName}</span>
            </div>
          )}
          <div className="flex items-center gap-1" title="Assets">
            <span className="font-medium">Assets:</span>
            <span className="text-xs text-gray-700">
              {lead.linkedSections?.length || 0} sections, {lead.linkedUnits?.length || 0} units
            </span>
          </div>
        </div>
      </div>
      {/* Conversion Tracker Panel */}
      <div className="bg-white rounded-lg border border-gray-200 shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Conversion Tracker</h2>
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2" title="Current qualifying status">
            <span className="font-medium">Current Status:</span>
            <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(lead.status)}`}>{lead.status}</span>
          </div>
          <div className="flex items-center gap-2" title="Conversion eligibility">
            <span className="font-medium">Conversion Eligibility:</span>
            {isEligible ? (
              <span className="flex items-center gap-1 text-green-700"><CheckCircleIcon className="h-4 w-4" /> Yes</span>
            ) : (
              <span className="flex items-center gap-1 text-red-700"><XCircleIcon className="h-4 w-4" /> No</span>
            )}
          </div>
          {lastStatusChange && (
            <div className="flex items-center gap-2" title="When status was last updated">
              <span className="font-medium">Last Status Change:</span>
              <span className="text-xs text-gray-700">{new Date(lastStatusChange).toLocaleString()}</span>
            </div>
          )}
          {lead.status !== 'Dead' && isEligible && (currentUser.role?.name === 'Admin' || currentUser.id === lead.buyerId) && (
            <div className="space-x-2">
              <Button onClick={() => setShowConfirm(true)} variant="primary" className="flex items-center gap-1" title="Convert to Deal">
                <ArrowLeftIcon className="h-4 w-4" /> Convert to Deal
              </Button>
            </div>
          )}
        </div>
      </div>
      {/* Convert to Deal Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md flex flex-col items-center">
            <ArrowLeftIcon className="h-10 w-10 text-sc-blue mb-2" />
            <div className="mb-4 text-center font-semibold">Are you sure you want to convert this lead to a deal?</div>
            <div className="flex space-x-2">
              <Button variant="secondary" onClick={() => setShowConfirm(false)}>Cancel</Button>
              <Button variant="primary" onClick={() => { setShowConfirm(false); onConvertToDeal(); }}>Convert</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadOverviewTab;
