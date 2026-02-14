import * as React from 'react';
import type { LeadEnhanced, User, LeadCallLog, LeadNote } from '../types';
import Button from './ui/Button';
import { ArrowLeftIcon } from './icons/Icons';

const DEFAULT_PRODUCTION_COLUMN_WIDTHS: Record<string, number> = {
  currentUnit: 200,
  allocationPct: 140,
  newUnit: 200,
  newAlloPct: 140,
  occType: 120,
  docType: 140,
  nraCap: 140,
};

const statusColors: Record<string, string> = {
  Uncontacted: 'bg-gray-100 text-gray-700',
  Spoke: 'bg-blue-100 text-blue-700',
  Interested: 'bg-yellow-100 text-yellow-700',
  'LOI Sent': 'bg-green-100 text-green-700',
  Dead: 'bg-red-100 text-red-700',
};

function getStatusColor(status: string) {
  return statusColors[status] || 'bg-gray-100 text-gray-700';
}

interface LeadOverviewTabProps {
  lead: LeadEnhanced;
  currentUser: User;
  users: User[];
  onConvertToDeal: () => void;
  callLogs?: LeadCallLog[];
  notes?: LeadNote[];
  onLogCall?: () => void;
  onSendEmail?: () => void;
}

const LeadOverviewTab: React.FC<LeadOverviewTabProps> = ({
  lead,
  currentUser,
  users,
  onConvertToDeal,
  callLogs = [],
  notes = [],
  onLogCall,
  onSendEmail,
}) => {
  const contactName = lead.contact || (lead as any).name || lead.linkedContact?.name || '';
  const str = (lead as any).str ?? lead.linkedSections?.[0]?.str ?? '';
  const county = (lead as any).county ?? lead.linkedSections?.[0]?.county ?? '';
  const netMineralAcres = (lead as any).netMineralAcres ?? lead.linkedSections?.[0]?.netMineralAcres;
  const royalty = (lead as any).royalty ?? lead.linkedSections?.[0]?.royalty;
  const netRoyaltyAcres = (lead as any).netRoyaltyAcres ?? (netMineralAcres != null && royalty != null
    ? Number(netMineralAcres) * (Number(royalty) / 100)
    : null);
  const address = [
    lead.linkedContact?.street ?? (lead as any).street,
    lead.linkedContact?.city ?? (lead as any).city,
    lead.linkedContact?.state ?? (lead as any).state,
    lead.linkedContact?.zipCode ?? (lead as any).zip,
  ].filter(Boolean).join(', ') || '—';
  const primaryPhone = lead.linkedContact?.phone ?? (lead as any).phoneEmail ?? '—';
  const secondaryPhone = lead.linkedContact?.alternatePhone ?? '—';
  const emails = lead.linkedContact?.email
    ? [lead.linkedContact.email]
    : (lead as any).phoneEmail && String((lead as any).phoneEmail).includes('@')
      ? [(lead as any).phoneEmail]
      : [];
  const eligibleStatuses = ['Interested', 'LOI Sent'];
  const isEligible = eligibleStatuses.includes(lead.status);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [buyerConversationNotes, setBuyerConversationNotes] = React.useState('');
  const [emailNotesLog, setEmailNotesLog] = React.useState('');
  const [ownerStatus, setOwnerStatus] = React.useState('');
  const [dealType, setDealType] = React.useState('Mineral Interest / Working Interest / Overriding Royalty Interest');
  const [documentType, setDocumentType] = React.useState('Letter Agreement (LOI) / Mineral Deed / Oil & Gas Lease / Assignment');
  const [interestAmount, setInterestAmount] = React.useState('(ARTI - UND 1/2 - UND 1/3 - UND 1/4 - OT-RI)');
  const [deliverableNmi, setDeliverableNmi] = React.useState('');
  const [nraCapUsd, setNraCapUsd] = React.useState((lead as any).nraCapUsd != null ? String((lead as any).nraCapUsd) : '13000');
  const [nraCapConversion, setNraCapConversion] = React.useState('22000');
  const [nraPtaTakedown, setNraPtaTakedown] = React.useState('9000');
  const [nraPtaConversion, setNraPtaConversion] = React.useState('11000');
  const [totalPurchasePrice, setTotalPurchasePrice] = React.useState('20000');
  const [competingOffer, setCompetingOffer] = React.useState('13000 - NMA');
  const [contactByCompany, setContactByCompany] = React.useState('Dry Creek Minerals, LLC');

  const [productionColumnWidths, setProductionColumnWidths] = React.useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('lead-overview-production-column-widths');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [productionResizingColumn, setProductionResizingColumn] = React.useState<string | null>(null);
  const productionResizeStartXRef = React.useRef(0);
  const productionResizeStartWidthRef = React.useRef(0);
  const productionResizingColumnRef = React.useRef<string | null>(null);
  const productionPrevResizingRef = React.useRef<string | null>(null);

  const getProductionColumnWidth = React.useCallback((accessor: string) => {
    return productionColumnWidths[accessor] ?? DEFAULT_PRODUCTION_COLUMN_WIDTHS[accessor] ?? 150;
  }, [productionColumnWidths]);

  const handleProductionResizeStart = React.useCallback((e: React.MouseEvent, accessor: string, currentWidth: number) => {
    e.preventDefault();
    productionResizingColumnRef.current = accessor;
    productionResizeStartXRef.current = e.clientX;
    productionResizeStartWidthRef.current = currentWidth;
    setProductionResizingColumn(accessor);
  }, []);

  React.useEffect(() => {
    if (!productionResizingColumn) return;
    const handleMouseMove = (e: MouseEvent) => {
      const accessor = productionResizingColumnRef.current;
      if (!accessor) return;
      const delta = e.clientX - productionResizeStartXRef.current;
      const newWidth = Math.max(20, Math.min(500, productionResizeStartWidthRef.current + delta));
      setProductionColumnWidths(prev => ({ ...prev, [accessor]: newWidth }));
    };
    const handleMouseUp = () => {
      setProductionResizingColumn(null);
      productionResizingColumnRef.current = null;
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [productionResizingColumn]);

  React.useEffect(() => {
    const wasResizing = productionPrevResizingRef.current != null;
    productionPrevResizingRef.current = productionResizingColumn;
    if (wasResizing && productionResizingColumn === null) {
      localStorage.setItem('lead-overview-production-column-widths', JSON.stringify(productionColumnWidths));
    }
  }, [productionResizingColumn, productionColumnWidths]);

  const productionRows = React.useMemo(() => {
    let unitNames: string;
    if (lead.linkedUnits?.length) {
      unitNames = lead.linkedUnits.map(u => u.unitName).filter(Boolean).join('\n');
    } else {
      const raw = (lead as any).unitName;
      if (typeof raw === 'string' && raw.includes(',')) {
        unitNames = raw.split(',').map(s => s.trim()).filter(Boolean).join('\n');
      } else {
        unitNames = raw ?? '—';
      }
    }
    const currentAlloPct = (lead as any).allocationPct ?? lead.linkedSections?.[0]?.allo_percent;
    const allocationPct = currentAlloPct != null && currentAlloPct !== ''
      ? (typeof currentAlloPct === 'number' ? currentAlloPct.toFixed(8) : String(currentAlloPct))
      : '—';
    const newUnitName = (lead as any).newUnitName ?? (lead as any).new_unit_name;
    let newUnit: string;
    if (Array.isArray(newUnitName)) {
      newUnit = newUnitName.filter(Boolean).join('\n');
    } else if (typeof newUnitName === 'string' && newUnitName.includes(',')) {
      newUnit = newUnitName.split(',').map((s: string) => s.trim()).filter(Boolean).join('\n');
    } else {
      newUnit = newUnitName ?? '—';
    }
    const newAlloPctRaw = (lead as any).newAlloPct ?? (lead as any).new_allo_pct;
    const newAlloPct = newAlloPctRaw != null && newAlloPctRaw !== ''
      ? (typeof newAlloPctRaw === 'number' ? newAlloPctRaw.toFixed(8) : String(newAlloPctRaw))
      : '—';
    const nraCap = (lead as any).nraCapUsd != null
      ? `$${Number((lead as any).nraCapUsd).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : '—';
    return [{ currentUnit: unitNames, allocationPct, newUnit, newAlloPct, occType: 'N/A', docType: 'N/A', nraCap }];
  }, [lead]);

  const conversationEntries = React.useMemo(() => {
    const entries: { id: string; date: string; text: string; type: 'call' | 'note' }[] = [];
    (callLogs || []).forEach(log => {
      entries.push({
        id: log.id,
        date: new Date(log.callDate).toLocaleDateString(),
        text: [log.outcome, log.notes].filter(Boolean).join(' — ') || 'Call logged',
        type: 'call',
      });
    });
    (notes || []).forEach(note => {
      entries.push({
        id: note.id,
        date: new Date(note.createdAt).toLocaleDateString(),
        text: note.noteText,
        type: 'note',
      });
    });
    entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return entries;
  }, [callLogs, notes]);

  const conversionLogEntries = [
    { date: '10/12/2025', text: 'Letter Agreement Generated' },
    { date: '10/10/2025', text: 'Executed letter Agreement - [Breakdown]' },
  ];

  const interestType = lead.linkedContact?.interestType === 'mineral' ? 'Minerals' : (lead.linkedContact?.interestType === 'override' ? 'Override' : 'Minerals');
  const ownerType = lead.linkedContact?.partyType === 'individual' ? 'Individual' : (lead.linkedContact?.partyType === 'entity' ? 'Entity' : 'Individual');
  const ownerNumber = lead.linkedContact?.ownerNumber ?? '—';
  const ownershipPct = lead.linkedContact?.ownershipPercent != null
    ? `${(Number(lead.linkedContact.ownershipPercent) * 100).toFixed(4)}%`
    : '—';

  return (
    <div className="w-full max-w-[1600px] mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 shadow p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Lead Overview</h2>
            <div className="grid gap-3 text-sm">
              <div>
                <div className="text-gray-500 font-medium">Full Name</div>
                <div className="text-gray-900 font-medium">{contactName || '—'}</div>
                <div className="text-gray-500 text-xs mt-0.5">Lead ID-{String(lead.id).replace('lead-', '')}</div>
              </div>
              <div>
                <div className="text-gray-500 font-medium">Section</div>
                <div className="text-gray-900">{str || '—'}</div>
              </div>
              <div>
                <div className="text-gray-500 font-medium">County</div>
                <div className="text-gray-900">{county || '—'}</div>
              </div>
              <div>
                <div className="text-gray-500 font-medium">Net Mineral Acres</div>
                <div className="text-gray-900">{netMineralAcres != null ? Number(netMineralAcres).toFixed(6) : '—'}</div>
              </div>
              <div>
                <div className="text-gray-500 font-medium">Royalty Burden</div>
                <div className="text-gray-900">{royalty != null ? Number(royalty).toFixed(4) : '—'}</div>
              </div>
              <div>
                <div className="text-gray-500 font-medium">Net Royalty Acres</div>
                <div className="text-gray-900">{netRoyaltyAcres != null ? Number(netRoyaltyAcres).toFixed(6) : '—'}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
            <div className="grid gap-3 text-sm">
              <div>
                <div className="text-gray-500 font-medium">Address</div>
                <div className="text-gray-900">{address}</div>
              </div>
              <div>
                <div className="text-gray-500 font-medium">Primary Phone #</div>
                <div className="text-gray-900 whitespace-pre-line">{primaryPhone}</div>
              </div>
              <div>
                <div className="text-gray-500 font-medium">Secondary Phone #</div>
                <div className="text-gray-900 whitespace-pre-line">{secondaryPhone || '—'}</div>
              </div>
              <div>
                <div className="text-gray-500 font-medium">Email Address(s)</div>
                <div className="text-gray-900 whitespace-pre-line">{emails.length ? emails.join('\n') : '—'}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow p-5">
            <div className="flex items-center gap-2 mb-3">
              <label className="text-sm font-medium text-gray-700">Owner Status</label>
              <select
                value={ownerStatus}
                onChange={e => setOwnerStatus(e.target.value)}
                className="flex-1 border border-gray-300 rounded-md px-2 py-1.5 text-sm"
              >
                <option value="">Select...</option>
                <option value="Contacted">Contacted</option>
                <option value="Not Contacted">Not Contacted</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onLogCall} className="bg-amber-100 border-amber-300 text-amber-800 hover:bg-amber-200">
                To Log Call
              </Button>
              <Button variant="outline" size="sm" onClick={onSendEmail} className="bg-amber-100 border-amber-300 text-amber-800 hover:bg-amber-200">
                Send Email
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Buyer Conversation Notes (Then Moved to log)</h2>
            <textarea
              value={buyerConversationNotes}
              onChange={e => setBuyerConversationNotes(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm min-h-[100px]"
              placeholder=""
            />
          </div>
        </div>

        {/* Center column */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 shadow p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Owner Identifiers</h2>
            <div className="grid gap-3 text-sm">
              <div>
                <div className="text-gray-500 font-medium">Interest Type</div>
                <div className="text-gray-900">{interestType}</div>
              </div>
              <div>
                <div className="text-gray-500 font-medium">Owner Type (manual)</div>
                <div className="text-gray-900">{ownerType}</div>
              </div>
              <div>
                <div className="text-gray-500 font-medium">Owner Number</div>
                <div className="text-gray-900">{ownerNumber}</div>
              </div>
              <div>
                <div className="text-gray-500 font-medium">Ownership % by Section</div>
                <div className="text-gray-900">{ownershipPct}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Conversation Notes / Log</h2>
            <div className="space-y-2 max-h-48 overflow-y-auto mb-4">
              {conversationEntries.length === 0 ? (
                <p className="text-sm text-gray-500">No entries yet.</p>
              ) : (
                conversationEntries.map(entry => (
                  <div key={entry.id} className="text-sm border-l-2 border-gray-200 pl-3 py-1">
                    <span className="text-gray-500 font-medium">{entry.date}</span>
                    <p className="text-gray-900 mt-0.5">{entry.text}</p>
                  </div>
                ))
              )}
            </div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Notes / Log</label>
            <textarea
              value={emailNotesLog}
              onChange={e => setEmailNotesLog(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm min-h-[80px]"
            />
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 shadow p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Conversion Log</h2>
            <div className="space-y-2">
              {conversionLogEntries.map((entry, i) => (
                <div key={i} className="text-sm">
                  <span className="text-gray-500 font-medium">{entry.date}:</span>{' '}
                  <span className="text-gray-900">{entry.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow p-5">
            <div className="grid gap-3 text-sm mb-4">
              <div>
                <label className="text-gray-500 font-medium block">Deal Type</label>
                <select
                  value={dealType}
                  onChange={e => setDealType(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 mt-0.5"
                >
                  <option>Mineral Interest / Working Interest / Overriding Royalty Interest</option>
                </select>
              </div>
              <div>
                <label className="text-gray-500 font-medium block">Document Type</label>
                <select
                  value={documentType}
                  onChange={e => setDocumentType(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 mt-0.5"
                >
                  <option>Letter Agreement (LOI) / Mineral Deed / Oil & Gas Lease / Assignment</option>
                </select>
              </div>
            </div>
            <div className="grid gap-3 text-sm">
              <div>
                <label className="text-gray-500 font-medium block">Interest Amount</label>
                <select
                  value={interestAmount}
                  onChange={e => setInterestAmount(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 mt-0.5"
                >
                  <option>(ARTI - UND 1/2 - UND 1/3 - UND 1/4 - OT-RI)</option>
                </select>
              </div>
              <div>
                <label className="text-gray-500 font-medium block">Deliverable NMI if Working Interest</label>
                <input
                  type="text"
                  value={deliverableNmi}
                  onChange={e => setDeliverableNmi(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 mt-0.5"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Financial Figures</h2>
            <div className="grid gap-3 text-sm">
              <div>
                <label className="text-gray-500 font-medium block">NRA/$ Cap</label>
                <input
                  type="text"
                  value={nraCapUsd}
                  onChange={e => setNraCapUsd(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 mt-0.5"
                />
              </div>
              <div>
                <label className="text-gray-500 font-medium block">NRA/$ Cap (Conversion)</label>
                <input
                  type="text"
                  value={nraCapConversion}
                  onChange={e => setNraCapConversion(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 mt-0.5"
                />
              </div>
              <div>
                <label className="text-gray-500 font-medium block">NRA/$ PTA Take down</label>
                <input
                  type="text"
                  value={nraPtaTakedown}
                  onChange={e => setNraPtaTakedown(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 mt-0.5"
                />
              </div>
              <div>
                <label className="text-gray-500 font-medium block">NRA/$ PTA (Conversion)</label>
                <input
                  type="text"
                  value={nraPtaConversion}
                  onChange={e => setNraPtaConversion(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 mt-0.5"
                />
              </div>
              <div>
                <label className="text-gray-500 font-medium block">Total Purchase Price</label>
                <input
                  type="text"
                  value={totalPurchasePrice}
                  onChange={e => setTotalPurchasePrice(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 mt-0.5"
                />
              </div>
              <div>
                <label className="text-gray-500 font-medium block">Competing Offer</label>
                <input
                  type="text"
                  value={competingOffer}
                  onChange={e => setCompetingOffer(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 mt-0.5"
                />
              </div>
              <div>
                <label className="text-gray-500 font-medium block">Contact by Company</label>
                <input
                  type="text"
                  value={contactByCompany}
                  onChange={e => setContactByCompany(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 mt-0.5"
                />
              </div>
              <div>
                <label className="text-gray-500 font-medium block">First Sales Language F/N</label>
                <select className="w-full border border-gray-300 rounded-md px-2 py-1.5 mt-0.5">
                  <option value="">Select...</option>
                </select>
              </div>
              <div>
                <label className="text-gray-500 font-medium block">Effective Date</label>
                <select className="w-full border border-gray-300 rounded-md px-2 py-1.5 mt-0.5">
                  <option value="">Select...</option>
                </select>
              </div>
              <div>
                <label className="text-gray-500 font-medium block">Close Date</label>
                <select className="w-full border border-gray-300 rounded-md px-2 py-1.5 mt-0.5">
                  <option value="">Select...</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Production Information - full width at bottom, larger and resizable */}
      <div className="mt-8 bg-white rounded-lg border border-gray-200 shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Production Information</h2>
        <div className="overflow-x-auto">
          <table
            className="min-w-full border border-gray-200 text-base"
            style={{ tableLayout: 'fixed' }}
          >
            <thead>
              <tr className="bg-gray-50">
                {[
                  { accessor: 'currentUnit', label: 'Current Unit' },
                  { accessor: 'allocationPct', label: 'Current Allocation %' },
                  { accessor: 'newUnit', label: 'New Unit Name' },
                  { accessor: 'newAlloPct', label: 'New Allocation %' },
                  { accessor: 'occType', label: 'OCC Type' },
                  { accessor: 'docType', label: 'DOC Type' },
                  { accessor: 'nraCap', label: 'NRA/$ Cap ($_NRA)' },
                ].map(({ accessor, label }) => {
                  const width = getProductionColumnWidth(accessor);
                  const isResizing = productionResizingColumn === accessor;
                  return (
                    <th
                      key={accessor}
                      className="relative px-4 py-3 text-left font-semibold text-gray-700 border-b border-gray-200"
                      style={{ width, minWidth: width, maxWidth: width }}
                    >
                      <span className="truncate block">{label}</span>
                      <div
                        className={`column-resizer absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-blue-500 ${isResizing ? 'bg-blue-500' : 'bg-transparent'}`}
                        onMouseDown={e => {
                          e.preventDefault();
                          handleProductionResizeStart(e, accessor, width);
                        }}
                        title="Drag to resize"
                      />
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {productionRows.map((row, i) => (
                <tr key={i} className="border-b border-gray-100">
                  {['currentUnit', 'allocationPct', 'newUnit', 'newAlloPct', 'occType', 'docType', 'nraCap'].map(accessor => {
                    const width = getProductionColumnWidth(accessor);
                    const isUnitColumn = accessor === 'currentUnit' || accessor === 'newUnit';
                    const value = (row as Record<string, string>)[accessor];
                    return (
                      <td
                        key={accessor}
                        className="px-4 py-3 text-gray-900"
                        style={{ width, minWidth: width, maxWidth: width }}
                      >
                        <div className={isUnitColumn ? 'whitespace-pre-line' : 'truncate'}>{value}</div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

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
