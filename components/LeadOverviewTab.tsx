import * as React from 'react';
import type { Lead, User } from '../types';
import Button from './ui/Button';
import { UserIcon, CheckCircleIcon, XCircleIcon, ArrowLeftIcon } from './icons/Icons';

const statusColors: Record<string, string> = {
  Unqualified: 'bg-red-100 text-red-700',
  'Follow-Up': 'bg-yellow-100 text-yellow-700',
  Committed: 'bg-blue-100 text-blue-700',
  Converted: 'bg-green-100 text-green-700',
  'Signed Paperwork': 'bg-green-100 text-green-700',
  Qualified: 'bg-blue-100 text-blue-700',
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
  lead: Lead;
  currentUser: User;
  users: User[];
  onConvertToDeal: () => void;
}> = ({ lead, currentUser, users, onConvertToDeal }) => {
  // Mocked/derived fields
  const assignedBuyer = users.find(u => u.id === lead.buyerId) || users[0];
  const contact = lead.linkedContact || { name: 'N/A', id: '', email: '', phone: '' };
  const lastActivity = lead.lastActivity || '2024-06-01T10:00:00Z';
  const lastStatusChange = lead.lastStatusChange || '2024-06-01T10:00:00Z';
  const convertedBy = lead.convertedBy || null;
  const convertedOn = lead.convertedOn || null;
  const eligibleStatuses = ['Committed', 'Signed Paperwork'];
  const isEligible = eligibleStatuses.includes(lead.status);
  const [showConfirm, setShowConfirm] = React.useState(false);

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8">
      {/* Lead Header */}
      <div className="bg-white rounded-lg border border-gray-200 shadow p-6 flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-4 justify-between">
          <div>
            <div className="text-2xl font-bold text-gray-900">
              <a href={`/contacts/${contact.id}`} className="hover:underline text-sc-blue" title="View Contact Profile">{contact.name}</a>
            </div>
            <div className="text-sm text-gray-500">Lead ID: <span className="font-mono">{lead.id}</span></div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(lead.status)}`}>{lead.status}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-6 text-sm text-gray-700">
          <div title="User who created this lead">
            <span className="font-medium">Created On/By:</span> {new Date(lead.createdAt || '').toLocaleString()} by {lead.createdBy || 'N/A'}
          </div>
          <div title="Most recent outreach (call, note, email)">
            <span className="font-medium">Last Activity:</span> {new Date(lastActivity).toLocaleString()}
          </div>
        </div>
      </div>
      {/* Assignment Summary */}
      <div className="bg-white rounded-lg border border-gray-200 shadow p-6 flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2" title="Assigned Buyer">
            <UserIcon className="h-8 w-8 text-sc-blue" />
            <a href={`/users/${assignedBuyer.id}`} className="font-semibold text-sc-blue hover:underline" title="View User Directory">{assignedBuyer.name}</a>
            <span className="text-xs text-gray-500 ml-2" title={`Email: ${assignedBuyer.email}\nPhone: ${assignedBuyer.phone}`}>({assignedBuyer.role?.name || 'Buyer'})</span>
          </div>
          <div className="flex items-center gap-1" title={priorityTooltips[lead.priority || 'Hot'] || ''}>
            <span className="font-medium">Priority:</span>
            <span className="px-2 py-1 rounded bg-gray-100 text-gray-800 text-xs font-semibold">{lead.priority || 'Hot'}</span>
          </div>
          <div className="flex items-center gap-1" title="How the lead originated">
            <span className="font-medium">Source:</span>
            <span className="text-xs text-gray-700">{lead.source || 'N/A'}</span>
          </div>
          <div className="flex items-center gap-1" title="Region or County">
            <span className="font-medium">Region/County:</span>
            <span className="text-xs text-gray-700">{lead.region || 'N/A'}</span>
          </div>
          <div className="flex items-center gap-1" title="Asset Type">
            <span className="font-medium">Asset Type:</span>
            <span className="text-xs text-gray-700">{assetTypeLabels[lead.assetType || 'unknown']}</span>
          </div>
        </div>
      </div>
      {/* Conversion Tracker Panel */}
      <div className="bg-white rounded-lg border border-gray-200 shadow p-6 flex flex-col gap-4">
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
          <div className="flex items-center gap-2" title="When status was last updated">
            <span className="font-medium">Last Status Change:</span>
            <span className="text-xs text-gray-700">{new Date(lastStatusChange).toLocaleString()}</span>
          </div>
          {lead.status !== 'Converted' && isEligible && (currentUser.role.name === 'Admin' || currentUser.id === lead.buyerId) && (
            <Button onClick={() => setShowConfirm(true)} variant="primary" className="flex items-center gap-1" title="Convert to Deal">
              <ArrowLeftIcon className="h-4 w-4" /> Convert to Deal
            </Button>
          )}
          {lead.status === 'Converted' && convertedBy && convertedOn && (
            <div className="flex items-center gap-2" title="Converted By/On">
              <span className="font-medium">Converted By:</span>
              <span className="text-xs text-gray-700">{convertedBy}</span>
              <span className="font-medium ml-2">On:</span>
              <span className="text-xs text-gray-700">{new Date(convertedOn).toLocaleString()}</span>
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
