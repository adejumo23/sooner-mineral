import * as React from 'react';
import type { Lead, User } from '../types';
import Button from './ui/Button';
import { UserIcon, MapIcon, EyeIcon, PencilIcon, CheckIcon, XCircleIcon } from './icons/Icons';

// Mock tracts data
const mockTracts = [
  {
    id: 'tract1',
    name: 'Tract 1',
    county: 'Kingfisher',
    state: 'OK',
    str: 'T18N R7W S12',
    grossAcres: 160,
    nma: 40,
    royalty: 0.1875,
    nra: 60,
    assignedBuyerId: 'buyer1',
    valuation: '$2,500 - $3,000/NMA',
    status: 'Under Review',
    assignmentHistory: [
      { buyerId: 'buyer1', buyerName: 'Alice Buyer', assignedAt: '2024-06-01T10:00:00Z' },
      { buyerId: 'buyer2', buyerName: 'Bob Buyer', assignedAt: '2024-05-15T09:00:00Z' },
    ],
  },
  {
    id: 'tract2',
    name: 'Tract 2',
    county: 'Canadian',
    state: 'OK',
    str: 'A-123',
    grossAcres: 80,
    nma: 20,
    royalty: 0.125,
    nra: 20,
    assignedBuyerId: 'buyer2',
    valuation: '$2,000/NMA',
    status: 'Curative Pending',
    assignmentHistory: [
      { buyerId: 'buyer2', buyerName: 'Bob Buyer', assignedAt: '2024-06-02T11:00:00Z' },
    ],
  },
];

const statusColors: Record<string, string> = {
  'Under Review': 'bg-yellow-100 text-yellow-700',
  'Curative Pending': 'bg-red-100 text-red-700',
  'Active': 'bg-green-100 text-green-700',
};

const LeadTractAssignmentTab: React.FC<{
  lead: Lead;
  currentUser: User;
  users: User[];
}> = ({ lead, currentUser, users }) => {
  const [tracts, setTracts] = React.useState(mockTracts);
  const [expandedHistory, setExpandedHistory] = React.useState<{ [id: string]: boolean }>({});
  const [reassignTractId, setReassignTractId] = React.useState<string | null>(null);
  const [newBuyerId, setNewBuyerId] = React.useState<string>('');

  // Permission logic
  const canReassign = currentUser.role.name === 'Manager' || currentUser.role.canReassignLeads;

  // Handle reassignment (mock)
  const handleReassign = () => {
    setTracts(tracts.map(t =>
      t.id === reassignTractId
        ? {
            ...t,
            assignedBuyerId: newBuyerId,
            assignmentHistory: [
              { buyerId: newBuyerId, buyerName: users.find(u => u.id === newBuyerId)?.name || '', assignedAt: new Date().toISOString() },
              ...t.assignmentHistory,
            ],
          }
        : t
    ));
    setReassignTractId(null);
    setNewBuyerId('');
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Tract Assignment</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-3 py-2 text-left font-semibold">Tract Name / ID</th>
              <th className="px-3 py-2 text-left font-semibold">County / State</th>
              <th className="px-3 py-2 text-left font-semibold">STR / ANUM</th>
              <th className="px-3 py-2 text-left font-semibold">Gross Acres</th>
              <th className="px-3 py-2 text-left font-semibold">NMA</th>
              <th className="px-3 py-2 text-left font-semibold">Royalty %</th>
              <th className="px-3 py-2 text-left font-semibold">NRA (1/8th)</th>
              <th className="px-3 py-2 text-left font-semibold">Assigned Buyer</th>
              <th className="px-3 py-2 text-left font-semibold">Valuation Guidance</th>
              <th className="px-3 py-2 text-left font-semibold">Status</th>
              <th className="px-3 py-2 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tracts.map(tract => {
              const assignedBuyer = users.find(u => u.id === tract.assignedBuyerId) || { name: 'N/A', id: '', email: '', phone: '' };
              return (
                <tr key={tract.id} className="border-t border-gray-100">
                  <td className="px-3 py-2 font-medium">{tract.name} <span className="text-xs text-gray-400">({tract.id})</span></td>
                  <td className="px-3 py-2">{tract.county}, {tract.state}</td>
                  <td className="px-3 py-2">{tract.str}</td>
                  <td className="px-3 py-2">{tract.grossAcres}</td>
                  <td className="px-3 py-2">{tract.nma}</td>
                  <td className="px-3 py-2">{(tract.royalty * 100).toFixed(2)}%</td>
                  <td className="px-3 py-2">{tract.nra}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <UserIcon className="h-5 w-5 text-sc-blue" />
                      <span className="font-semibold text-sc-blue">{assignedBuyer.name}</span>
                      {canReassign && (
                        <Button size="icon" variant="secondary" title="Reassign Buyer" aria-label="Reassign Buyer" onClick={() => { setReassignTractId(tract.id); setNewBuyerId(tract.assignedBuyerId); }}>
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div>
                      <button
                        className="text-xs text-gray-500 hover:underline mt-1"
                        onClick={() => setExpandedHistory(e => ({ ...e, [tract.id]: !e[tract.id] }))}
                        type="button"
                      >
                        Assignment History
                      </button>
                      {expandedHistory[tract.id] && (
                        <div className="bg-gray-50 border border-gray-200 rounded mt-2 p-2 text-xs">
                          <ul>
                            {tract.assignmentHistory.map((h, i) => (
                              <li key={i} className="mb-1">
                                <span className="font-semibold text-sc-blue">{h.buyerName}</span> assigned on {new Date(h.assignedAt).toLocaleString()}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2">{tract.valuation}</td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${statusColors[tract.status] || 'bg-gray-100 text-gray-700'}`}>{tract.status}</span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <Button size="icon" variant="secondary" title="View Tract" aria-label="View Tract" onClick={() => window.open(`/tracts/${tract.id}`, '_blank')}>
                        <EyeIcon className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="secondary" title="View on Map" aria-label="View on Map" onClick={() => window.open(`/map?tract=${tract.id}`, '_blank')}>
                        <MapIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* Reassignment Confirmation Modal */}
      {reassignTractId && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md flex flex-col items-center">
            <PencilIcon className="h-10 w-10 text-sc-blue mb-2" />
            <div className="mb-4 text-center font-semibold">Reassign Buyer for this Tract</div>
            <select
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm mb-4"
              value={newBuyerId}
              onChange={e => setNewBuyerId(e.target.value)}
            >
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
            <div className="flex space-x-2">
              <Button variant="secondary" onClick={() => setReassignTractId(null)}>Cancel</Button>
              <Button variant="primary" onClick={handleReassign} disabled={!newBuyerId || newBuyerId === tracts.find(t => t.id === reassignTractId)?.assignedBuyerId}>
                <CheckIcon className="h-4 w-4 mr-1" /> Confirm
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadTractAssignmentTab;
