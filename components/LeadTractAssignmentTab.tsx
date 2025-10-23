import * as React from 'react';
import type { LeadEnhanced, User } from '../types';
import Button from './ui/Button';
import { UserIcon, MapIcon, EyeIcon, PencilIcon, CheckIcon, XCircleIcon, ExclamationTriangleIcon, ChevronDownIcon, ChevronUpIcon, MagnifyingGlassIcon } from './icons/Icons';

// Mock tracts data (same as before, with statusChangeLog and avatar)
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
    statusChangeLog: [
      { status: 'Under Review', changedAt: '2024-06-01T10:00:00Z' },
      { status: 'Curative Pending', changedAt: '2024-05-20T09:00:00Z' },
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
    statusChangeLog: [
      { status: 'Curative Pending', changedAt: '2024-06-02T11:00:00Z' },
    ],
  },
];

const statusMeta: Record<string, { color: string; icon: React.ReactNode; tooltip: string }> = {
  'Under Review': {
    color: 'bg-yellow-100 text-yellow-700',
    icon: <ExclamationTriangleIcon className="h-4 w-4 inline-block mr-1 text-yellow-500" />,
    tooltip: 'Tract is currently under review.',
  },
  'Curative Pending': {
    color: 'bg-red-100 text-red-700',
    icon: <XCircleIcon className="h-4 w-4 inline-block mr-1 text-red-500" />,
    tooltip: 'Curative action is pending for this tract.',
  },
  'Active': {
    color: 'bg-green-100 text-green-700',
    icon: <CheckIcon className="h-4 w-4 inline-block mr-1 text-green-500" />,
    tooltip: 'Tract is active and clear.',
  },
};

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

const LeadTractAssignmentTab: React.FC<{
  lead: LeadEnhanced;
  currentUser: User;
  users: User[];
}> = ({ lead, currentUser, users }) => {
  const [tracts, setTracts] = React.useState(mockTracts);
  const [expandedHistory, setExpandedHistory] = React.useState<{ [id: string]: boolean }>({});
  const [expandedStatus, setExpandedStatus] = React.useState<{ [id: string]: boolean }>({});
  const [reassignTractId, setReassignTractId] = React.useState<string | null>(null);
  const [newBuyerId, setNewBuyerId] = React.useState<string>('');
  const [search, setSearch] = React.useState('');
  const [sortCol, setSortCol] = React.useState('');
  const [sortAsc, setSortAsc] = React.useState(true);
  const [compact, setCompact] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [successMsg, setSuccessMsg] = React.useState('');

  // Permission logic
  const canReassign = currentUser.role.name === 'Manager' || currentUser.role.canReassignLeads;

  // Filter and sort tracts
  let filteredTracts = tracts.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.county.toLowerCase().includes(search.toLowerCase()) ||
      t.status.toLowerCase().includes(search.toLowerCase())
  );
  if (sortCol) {
    filteredTracts = [...filteredTracts].sort((a, b) => {
      if (a[sortCol] < b[sortCol]) return sortAsc ? -1 : 1;
      if (a[sortCol] > b[sortCol]) return sortAsc ? 1 : -1;
      return 0;
    });
  }

  // Handle reassignment (mock async)
  const handleReassign = async () => {
    setLoading(true);
    setTimeout(() => {
      setTracts((tracts) =>
        tracts.map((t) =>
          t.id === reassignTractId
            ? {
                ...t,
                assignedBuyerId: newBuyerId,
                assignmentHistory: [
                  { buyerId: newBuyerId, buyerName: users.find((u) => u.id === newBuyerId)?.name || '', assignedAt: new Date().toISOString() },
                  ...t.assignmentHistory,
                ],
              }
            : t
        )
      );
      setLoading(false);
      setReassignTractId(null);
      setNewBuyerId('');
      setSuccessMsg('Buyer reassigned successfully!');
      setTimeout(() => setSuccessMsg(''), 2000);
    }, 1200);
  };

  // Table header with sorting
  const th = (label: string, col: string, tooltip?: string) => (
    <th
      className={`px-3 py-2 text-left font-semibold cursor-pointer select-none ${compact ? 'py-1' : 'py-2'}`}
      onClick={() => {
        if (sortCol === col) setSortAsc((asc) => !asc);
        else {
          setSortCol(col);
          setSortAsc(true);
        }
      }}
      title={tooltip || ''}
      aria-sort={sortCol === col ? (sortAsc ? 'ascending' : 'descending') : 'none'}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          if (sortCol === col) setSortAsc((asc) => !asc);
          else {
            setSortCol(col);
            setSortAsc(true);
          }
        }
      }}
    >
      {label} {sortCol === col ? (sortAsc ? <ChevronUpIcon className="inline h-3 w-3" /> : <ChevronDownIcon className="inline h-3 w-3" />) : null}
    </th>
  );

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
        <h2 className="text-lg font-semibold text-gray-900">Tract Assignment</h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search tracts..."
              className="border border-gray-300 rounded px-3 py-2 text-sm pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search tracts"
            />
            <MagnifyingGlassIcon className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          </div>
          <Button variant="secondary" size="sm" onClick={() => setCompact((c) => !c)} aria-label="Toggle compact mode">
            {compact ? 'Normal Mode' : 'Compact Mode'}
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow">
        <table className={`min-w-full bg-white text-sm ${compact ? 'table-compact' : ''}`}>
          <thead className="sticky top-0 z-10 bg-gray-50 shadow-sm">
            <tr>
              {th('Tract Name / ID', 'name', 'Tract name and unique identifier')}
              {th('County / State', 'county', 'County and state')}
              {th('STR / ANUM', 'str', 'Legal locator (PLSS or abstract)')}
              {th('Gross Acres', 'grossAcres', 'Total tract size')}
              {th('NMA', 'nma', 'Net mineral acres (contact-specific)')}
              {th('Royalty %', 'royalty', 'Royalty rate for this contact')}
              {th('NRA (1/8th)', 'nra', 'NMA × Royalty % ÷ 0.125')}
              {th('Assigned Buyer', 'assignedBuyerId', 'Current assigned buyer')}
              {th('Valuation Guidance', 'valuation', 'Internal pricing benchmarks')}
              {th('Status', 'status', 'Curative or review status')}
              <th className="px-3 py-2 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTracts.length === 0 && (
              <tr>
                <td colSpan={12} className="text-center py-12 text-gray-400">
                  <div className="flex flex-col items-center gap-2">
                    <ExclamationTriangleIcon className="h-8 w-8 text-yellow-400" />
                    <div>No tracts found for this lead.</div>
                  </div>
                </td>
              </tr>
            )}
            {filteredTracts.map((tract) => {
              const assignedBuyer = users.find((u) => u.id === tract.assignedBuyerId) || { name: 'N/A', id: '', email: '', phone: '' };
              return (
                <tr key={tract.id} className={`border-t border-gray-100 transition-colors ${compact ? 'text-xs' : ''} hover:bg-blue-50`}>
                  <td className="px-3 py-2 font-medium">
                    {tract.name} <span className="text-xs text-gray-400">({tract.id})</span>
                  </td>
                  <td className="px-3 py-2">{tract.county}, {tract.state}</td>
                  <td className="px-3 py-2" title="Legal locator (PLSS or abstract)">{tract.str}</td>
                  <td className="px-3 py-2">{tract.grossAcres}</td>
                  <td className="px-3 py-2" title="Net mineral acres">{tract.nma}</td>
                  <td className="px-3 py-2" title="Royalty rate">{(tract.royalty * 100).toFixed(2)}%</td>
                  <td className="px-3 py-2" title="NRA = NMA × Royalty % ÷ 0.125">{tract.nra}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2 group relative">
                      <div className="w-7 h-7 rounded-full bg-sc-blue text-white flex items-center justify-center font-bold text-xs" title={assignedBuyer.name}>
                        {getInitials(assignedBuyer.name)}
                      </div>
                      <span className="font-semibold text-sc-blue group-hover:underline cursor-pointer" tabIndex={0} title="View buyer details">
                        {assignedBuyer.name}
                      </span>
                      {/* Buyer popover */}
                      <div className="absolute left-0 top-8 z-20 hidden group-hover:block bg-white border border-gray-200 rounded shadow p-3 min-w-[180px] text-xs">
                        <div className="font-bold text-sc-blue mb-1">{assignedBuyer.name}</div>
                        <div>Email: <a href={`mailto:${assignedBuyer.email}`} className="text-sc-blue hover:underline">{assignedBuyer.email}</a></div>
                        <div>Phone: <a href={`tel:${assignedBuyer.phone}`} className="text-sc-blue hover:underline">{assignedBuyer.phone}</a></div>
                      </div>
                      {canReassign && (
                        <Button size="icon" variant="secondary" title="Reassign Buyer" aria-label="Reassign Buyer" onClick={() => { setReassignTractId(tract.id); setNewBuyerId(tract.assignedBuyerId); }}>
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div>
                      <button
                        className="text-xs text-gray-500 hover:underline mt-1 flex items-center gap-1"
                        onClick={() => setExpandedHistory((e) => ({ ...e, [tract.id]: !e[tract.id] }))}
                        type="button"
                        aria-expanded={!!expandedHistory[tract.id]}
                        aria-controls={`history-${tract.id}`}
                      >
                        {expandedHistory[tract.id] ? <ChevronUpIcon className="h-3 w-3" /> : <ChevronDownIcon className="h-3 w-3" />} Assignment History
                      </button>
                      {expandedHistory[tract.id] && (
                        <div id={`history-${tract.id}`} className="bg-gray-50 border border-gray-200 rounded mt-2 p-2 text-xs animate-fade-in">
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
                  <td className="px-3 py-2">
                    <span title={tract.valuation}>💲</span> <span className="underline decoration-dotted cursor-help" title="Valuation is based on internal pricing benchmarks.">{tract.valuation}</span>
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold inline-flex items-center gap-1 ${statusMeta[tract.status]?.color || 'bg-gray-100 text-gray-700'}`}
                      title={statusMeta[tract.status]?.tooltip || ''}
                    >
                      {statusMeta[tract.status]?.icon}
                      {tract.status}
                    </span>
                    <button
                      className="ml-2 text-xs text-gray-500 hover:underline flex items-center gap-1"
                      onClick={() => setExpandedStatus((e) => ({ ...e, [tract.id]: !e[tract.id] }))}
                      type="button"
                      aria-expanded={!!expandedStatus[tract.id]}
                      aria-controls={`statuslog-${tract.id}`}
                    >
                      {expandedStatus[tract.id] ? <ChevronUpIcon className="h-3 w-3" /> : <ChevronDownIcon className="h-3 w-3" />} Status Log
                    </button>
                    {expandedStatus[tract.id] && (
                      <div id={`statuslog-${tract.id}`} className="bg-gray-50 border border-gray-200 rounded mt-2 p-2 text-xs animate-fade-in">
                        <ul>
                          {tract.statusChangeLog?.map((s, i) => (
                            <li key={i} className="mb-1">
                              <span className="font-semibold">{s.status}</span> on {new Date(s.changedAt).toLocaleString()}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
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
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md flex flex-col items-center animate-slide-up">
            <PencilIcon className="h-10 w-10 text-sc-blue mb-2 animate-pulse" />
            <div className="mb-4 text-center font-semibold">Reassign Buyer for this Tract</div>
            <select
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm mb-4"
              value={newBuyerId}
              onChange={(e) => setNewBuyerId(e.target.value)}
              aria-label="Select new buyer"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
            <div className="flex space-x-2">
              <Button variant="secondary" onClick={() => setReassignTractId(null)} disabled={loading}>Cancel</Button>
              <Button variant="primary" onClick={handleReassign} disabled={!newBuyerId || newBuyerId === tracts.find((t) => t.id === reassignTractId)?.assignedBuyerId || loading}>
                {loading ? 'Reassigning...' : <><CheckIcon className="h-4 w-4 mr-1" /> Confirm</>}
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Success Toast */}
      {successMsg && (
        <div className="fixed bottom-6 right-6 bg-green-600 text-white px-4 py-2 rounded shadow-lg animate-fade-in">
          {successMsg}
        </div>
      )}
    </div>
  );
};

export default LeadTractAssignmentTab;
