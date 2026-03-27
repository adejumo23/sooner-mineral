import React, { useState, useEffect, useMemo } from 'react';
import './AcreageSchedulePage.css';
import { fetchAcreageSchedule } from '../services/apiClient';
import { formatNMA, formatOccDate } from '../utils/formatting';

type AcreageRecord = Record<string, any>;

interface AcreageSummary {
  totalRecords: number;
  totalAcres: number;
  uniqueOwners: number;
  uniqueCounties: number;
  averageAllocation: number;
  statusBreakdown: { [key: string]: number };
  countyBreakdown: { [key: string]: number };
}

const getRecordVal = (r: AcreageRecord, ...keys: string[]) => {
  for (const k of keys) {
    const v = r[k];
    if (v != null && String(v).trim() !== '') return String(v).trim();
  }
  return '';
};

const TABLE_COLUMNS = [
  { key: 'COUNTY', label: 'County', sortKey: 'COUNTY' },
  { key: 'S_TR', label: 'S-T-R', sortKey: null },
  { key: 'OWNER', label: 'Owner', sortKey: 'OWNER' },
  { key: 'NMA', label: 'NMA', sortKey: 'NMA' },
  { key: 'STATUS', label: 'Status', sortKey: 'STATUS' },
  { key: 'BUYER', label: 'Buyer', sortKey: 'BUYER' },
  { key: 'actions', label: 'Actions', sortKey: null }
] as const;

const AcreageSchedulePage: React.FC = () => {
  const [acreageData, setAcreageData] = useState<AcreageRecord[]>([]);
  const [filteredData, setFilteredData] = useState<AcreageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCounty, setSelectedCounty] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedOwner, setSelectedOwner] = useState('');
  const [sortField, setSortField] = useState<string>('COUNTY');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);
  const [selectedRecord, setSelectedRecord] = useState<AcreageRecord | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [filtersExpanded, setFiltersExpanded] = useState(true);

  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('acreage-schedule-column-widths');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return {};
  });
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const [resizeStartX, setResizeStartX] = useState(0);
  const [resizeStartWidth, setResizeStartWidth] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await fetchAcreageSchedule();
        if (result?.success && Array.isArray(result.data)) {
          setAcreageData(result.data);
          setFilteredData(result.data);
        } else {
          setError('Failed to load acreage data');
          setAcreageData([]);
          setFilteredData([]);
        }
      } catch (err) {
        setError('Error fetching acreage schedule');
        setAcreageData([]);
        setFilteredData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const summary: AcreageSummary = useMemo(() => {
    const totalRecords = filteredData.length;
    const totalAcres = filteredData.reduce((sum, r) => sum + (parseFloat(r.NMA) || 0), 0);
    const owners = new Set(filteredData.map(r => getRecordVal(r, 'OWNER')).filter(Boolean));
    const counties = new Set(filteredData.map(r => getRecordVal(r, 'COUNTY')).filter(Boolean));
    const allocKey = filteredData.find(r => r.ALLOCATION_PERCENT != null) ? 'ALLOCATION_PERCENT' : 'New_ALLO_%';
    const avgAlloc = totalRecords
      ? filteredData.reduce((s, r) => s + (parseFloat(r[allocKey]) || 0), 0) / totalRecords
      : 0;
    const statusBreakdown: { [key: string]: number } = {};
    const countyBreakdown: { [key: string]: number } = {};
    filteredData.forEach(r => {
      const st = getRecordVal(r, 'STATUS') || 'Unknown';
      statusBreakdown[st] = (statusBreakdown[st] || 0) + 1;
      const co = getRecordVal(r, 'COUNTY');
      if (co) countyBreakdown[co] = (countyBreakdown[co] || 0) + 1;
    });
    return {
      totalRecords,
      totalAcres,
      uniqueOwners: owners.size,
      uniqueCounties: counties.size,
      averageAllocation: avgAlloc,
      statusBreakdown,
      countyBreakdown
    };
  }, [filteredData]);

  useEffect(() => {
    let filtered = [...acreageData];
    const term = searchTerm.toLowerCase().trim();
    if (term) {
      filtered = filtered.filter(r =>
        Object.values(r).some(v => String(v ?? '').toLowerCase().includes(term))
      );
    }
    if (selectedCounty) filtered = filtered.filter(r => getRecordVal(r, 'COUNTY') === selectedCounty);
    if (selectedStatus) filtered = filtered.filter(r => (getRecordVal(r, 'STATUS') || 'Unknown') === selectedStatus);
    if (selectedOwner) filtered = filtered.filter(r => getRecordVal(r, 'OWNER') === selectedOwner);
    const aVal = (r: AcreageRecord) => {
      const v = r[sortField];
      if (v == null) return '';
      if (typeof v === 'number' || !Number.isNaN(parseFloat(v))) return parseFloat(v);
      return String(v).toLowerCase();
    };
    filtered.sort((a, b) => {
      const av = aVal(a);
      const bv = aVal(b);
      if (av < bv) return sortDirection === 'asc' ? -1 : 1;
      if (av > bv) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    setFilteredData(filtered);
    setCurrentPage(1);
  }, [acreageData, searchTerm, selectedCounty, selectedStatus, selectedOwner, sortField, sortDirection]);

  const uniqueCounties = useMemo(() =>
    [...new Set(acreageData.map(r => getRecordVal(r, 'COUNTY')).filter(Boolean))].sort(),
    [acreageData]);
  const uniqueStatuses = useMemo(() =>
    [...new Set(acreageData.map(r => getRecordVal(r, 'STATUS') || 'Unknown').filter(Boolean))].sort(),
    [acreageData]);
  const uniqueOwners = useMemo(() =>
    [...new Set(acreageData.map(r => getRecordVal(r, 'OWNER')).filter(Boolean))].sort(),
    [acreageData]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const handleSort = (field: string) => {
    setSortField(field);
    setSortDirection(prev => (sortField === field ? (prev === 'asc' ? 'desc' : 'asc') : 'asc'));
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCounty('');
    setSelectedStatus('');
    setSelectedOwner('');
  };

  const handleResizeStart = (e: React.MouseEvent, key: string, currentWidth: number) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingColumn(key);
    setResizeStartX(e.clientX);
    setResizeStartWidth(currentWidth);
  };

  useEffect(() => {
    if (!resizingColumn) return;
    const handleMouseMove = (e: MouseEvent) => {
      const diff = e.clientX - resizeStartX;
      const newWidth = Math.max(20, resizeStartWidth + diff);
      setColumnWidths(prev => {
        const next = { ...prev, [resizingColumn]: newWidth };
        try {
          localStorage.setItem('acreage-schedule-column-widths', JSON.stringify(next));
        } catch (_) {}
        return next;
      });
    };
    const handleMouseUp = () => setResizingColumn(null);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingColumn, resizeStartX, resizeStartWidth]);

  const getColumnWidth = (key: string): number => {
    return columnWidths[key] ?? 120;
  };

  const hasActiveFilters = searchTerm || selectedCounty || selectedStatus || selectedOwner;

  if (loading) {
    return (
      <div className="acreage-page">
        <div className="acreage-loading">
          <div className="acreage-spinner" />
          <p className="acreage-loading-text">Loading acreage schedule…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="acreage-page">
        <div className="acreage-error">
          <div className="acreage-error-icon" aria-hidden>!</div>
          <h2>Acreage data unavailable</h2>
          <p>{error}</p>
          <button type="button" className="acreage-btn acreage-btn-primary" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="acreage-page">
      <header className="acreage-header">
        <div className="acreage-header-inner">
          <div>
            <h1 className="acreage-title">Acreage Schedule</h1>
            <p className="acreage-subtitle">Mineral rights ownership and acquisition tracking</p>
          </div>
          <div className="acreage-view-toggle">
            <button
              type="button"
              className={viewMode === 'table' ? 'active' : ''}
              onClick={() => setViewMode('table')}
              aria-pressed={viewMode === 'table'}
            >
              <span className="acreage-view-icon" aria-hidden>⊞</span>
              Table
            </button>
            <button
              type="button"
              className={viewMode === 'cards' ? 'active' : ''}
              onClick={() => setViewMode('cards')}
              aria-pressed={viewMode === 'cards'}
            >
              <span className="acreage-view-icon" aria-hidden>▦</span>
              Cards
            </button>
          </div>
        </div>
      </header>

      <section className="acreage-stats">
        <div className="acreage-stat">
          <span className="acreage-stat-value">{summary.totalRecords.toLocaleString()}</span>
          <span className="acreage-stat-label">Records</span>
        </div>
        <div className="acreage-stat">
          <span className="acreage-stat-value">{summary.totalAcres.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
          <span className="acreage-stat-label">Acres</span>
        </div>
        <div className="acreage-stat">
          <span className="acreage-stat-value">{summary.uniqueOwners.toLocaleString()}</span>
          <span className="acreage-stat-label">Owners</span>
        </div>
        <div className="acreage-stat">
          <span className="acreage-stat-value">{summary.uniqueCounties.toLocaleString()}</span>
          <span className="acreage-stat-label">Counties</span>
        </div>
        <div className="acreage-stat">
          <span className="acreage-stat-value">{summary.averageAllocation.toFixed(1)}%</span>
          <span className="acreage-stat-label">Avg allocation</span>
        </div>
      </section>

      <section className="acreage-filters">
        <button
          type="button"
          className="acreage-filters-toggle"
          onClick={() => setFiltersExpanded(!filtersExpanded)}
          aria-expanded={filtersExpanded}
        >
          {filtersExpanded ? 'Hide filters' : 'Show filters'}
          {hasActiveFilters && <span className="acreage-filters-badge">{[searchTerm, selectedCounty, selectedStatus, selectedOwner].filter(Boolean).length}</span>}
        </button>
        {filtersExpanded && (
          <div className="acreage-filters-grid">
            <div className="acreage-search-wrap">
              <span className="acreage-search-icon" aria-hidden>⌕</span>
              <input
                type="search"
                placeholder="Search all fields…"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="acreage-search"
              />
            </div>
            <select
              value={selectedCounty}
              onChange={e => setSelectedCounty(e.target.value)}
              className="acreage-select"
              aria-label="County"
            >
              <option value="">All counties</option>
              {uniqueCounties.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="acreage-select"
              aria-label="Status"
            >
              <option value="">All statuses</option>
              {uniqueStatuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select
              value={selectedOwner}
              onChange={e => setSelectedOwner(e.target.value)}
              className="acreage-select"
              aria-label="Owner"
            >
              <option value="">All owners</option>
              {uniqueOwners.slice(0, 200).map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            {hasActiveFilters && (
              <button type="button" className="acreage-btn acreage-btn-ghost" onClick={clearFilters}>
                Clear filters
              </button>
            )}
          </div>
        )}
      </section>

      {!filtersExpanded && filteredData.length > 0 && (
        <div className="acreage-breakdown-bar">
          <div className="acreage-breakdown-scroll">
            {Object.entries(summary.statusBreakdown).slice(0, 12).map(([status, count]) => (
              <span key={status} className="acreage-breakdown-pill">
                <span className="acreage-breakdown-label">{status}</span>
                <span className="acreage-breakdown-count">{count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <section className="acreage-content">
        {filteredData.length === 0 ? (
          <div className="acreage-empty">
            <p>No records match your filters.</p>
            <button type="button" className="acreage-btn acreage-btn-ghost" onClick={clearFilters}>
              Clear filters
            </button>
          </div>
        ) : viewMode === 'table' ? (
          <div className="acreage-table-wrap">
            <table className="acreage-table">
              <thead>
                <tr>
                  {TABLE_COLUMNS.map((col) => {
                    const sortKey = col.sortKey ?? (col.key === 'S_TR' ? (paginatedData.some(r => r.S_T_R != null) ? 'S_T_R' : 'S_TR') : null);
                    const width = getColumnWidth(col.key);
                    const isResizing = resizingColumn === col.key;
                    return (
                      <th
                        key={col.key}
                        className={`acreage-th ${sortKey ? 'sortable' : ''}`}
                        style={{ width: `${width}px`, minWidth: `${width}px` }}
                        onClick={sortKey ? (e) => { if ((e.target as HTMLElement).classList.contains('acreage-resizer')) return; handleSort(sortKey); } : undefined}
                      >
                        <span className="acreage-th-inner">
                          {col.label}
                          {sortKey && sortField === sortKey && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
                        </span>
                        {col.key !== 'actions' && (
                          <div
                            className={`acreage-resizer ${isResizing ? 'active' : ''}`}
                            onMouseDown={(e) => handleResizeStart(e, col.key, width)}
                            aria-hidden
                          />
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((record, idx) => {
                  const str = getRecordVal(record, 'S_T_R', 'S_TR');
                  const status = getRecordVal(record, 'STATUS') || 'Unknown';
                  const nma = record.NMA != null ? formatNMA(record.NMA) : '—';
                  return (
                    <tr
                      key={record.mineral_interest_id ?? record.id ?? idx}
                      className="acreage-tr"
                      onClick={() => { setSelectedRecord(record); setShowModal(true); }}
                    >
                      {TABLE_COLUMNS.map((col) => {
                        const width = getColumnWidth(col.key);
                        if (col.key === 'COUNTY') return <td key={col.key} style={{ width: `${width}px`, minWidth: `${width}px` }}>{getRecordVal(record, 'COUNTY') || '—'}</td>;
                        if (col.key === 'S_TR') return <td key={col.key} style={{ width: `${width}px`, minWidth: `${width}px` }}>{str || '—'}</td>;
                        if (col.key === 'OWNER') return <td key={col.key} className="acreage-cell-owner" style={{ width: `${width}px`, minWidth: `${width}px` }}>{getRecordVal(record, 'OWNER') || '—'}</td>;
                        if (col.key === 'NMA') return <td key={col.key} className="acreage-cell-num" style={{ width: `${width}px`, minWidth: `${width}px` }}>{nma}</td>;
                        if (col.key === 'STATUS') return (
                          <td key={col.key} style={{ width: `${width}px`, minWidth: `${width}px` }}>
                            <span className={`acreage-status acreage-status--${status.toLowerCase().replace(/\s+/g, '-')}`}>{status}</span>
                          </td>
                        );
                        if (col.key === 'BUYER') return <td key={col.key} style={{ width: `${width}px`, minWidth: `${width}px` }}>{getRecordVal(record, 'BUYER') || '—'}</td>;
                        return (
                          <td key={col.key} style={{ width: `${width}px`, minWidth: `${width}px` }}>
                            <button
                              type="button"
                              className="acreage-btn acreage-btn-sm"
                              onClick={e => { e.stopPropagation(); setSelectedRecord(record); setShowModal(true); }}
                            >
                              View
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="acreage-cards">
            {paginatedData.map((record, idx) => {
              const owner = getRecordVal(record, 'OWNER');
              const str = getRecordVal(record, 'S_T_R', 'S_TR');
              const status = getRecordVal(record, 'STATUS') || 'Unknown';
              const nma = record.NMA != null ? formatNMA(record.NMA) : '—';
              const alloc = record.ALLOCATION_PERCENT ?? record['New_ALLO_%'];
              const allocPct = alloc != null && alloc !== '' ? `${Number(alloc).toFixed(2)}%` : '—';
              return (
                <div
                  key={record.mineral_interest_id ?? record.id ?? idx}
                  className="acreage-card"
                  onClick={() => { setSelectedRecord(record); setShowModal(true); }}
                  onKeyDown={e => { if (e.key === 'Enter') { setSelectedRecord(record); setShowModal(true); } }}
                  role="button"
                  tabIndex={0}
                >
                  <div className="acreage-card-head">
                    <span className="acreage-card-owner">{owner || '—'}</span>
                    <span className={`acreage-status acreage-status--${status.toLowerCase().replace(/\s+/g, '-')}`}>{status}</span>
                  </div>
                  <div className="acreage-card-body">
                    <div className="acreage-card-row">
                      <span>Location</span>
                      <span>{getRecordVal(record, 'COUNTY')}, {getRecordVal(record, 'OWNER_ST', 'ST')} · {str || '—'}</span>
                    </div>
                    <div className="acreage-card-row">
                      <span>NMA</span>
                      <span>{nma}</span>
                    </div>
                    <div className="acreage-card-row">
                      <span>Allocation</span>
                      <span>{allocPct}</span>
                    </div>
                    <div className="acreage-card-row">
                      <span>Buyer</span>
                      <span>{getRecordVal(record, 'BUYER') || 'Unassigned'}</span>
                    </div>
                  </div>
                  <div className="acreage-card-footer">
                    <button
                      type="button"
                      className="acreage-btn acreage-btn-sm acreage-btn-ghost"
                      onClick={e => { e.stopPropagation(); setSelectedRecord(record); setShowModal(true); }}
                    >
                      View details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {filteredData.length > 0 && totalPages > 1 && (
        <footer className="acreage-pagination">
          <button
            type="button"
            className="acreage-btn acreage-btn-ghost"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <span className="acreage-pagination-info">
            Page {currentPage} of {totalPages} · {filteredData.length} records
          </span>
          <button
            type="button"
            className="acreage-btn acreage-btn-ghost"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </footer>
      )}

      {showModal && selectedRecord && (
        <div className="acreage-modal-overlay" onClick={() => setShowModal(false)} role="dialog" aria-modal="true" aria-labelledby="acreage-modal-title">
          <div className="acreage-modal" onClick={e => e.stopPropagation()}>
            <div className="acreage-modal-head">
              <h2 id="acreage-modal-title">Acreage details</h2>
              <button type="button" className="acreage-modal-close" onClick={() => setShowModal(false)} aria-label="Close">×</button>
            </div>
            <div className="acreage-modal-body">
              <div className="acreage-detail-grid">
                <div className="acreage-detail-block">
                  <h4>Location</h4>
                  <dl>
                    <dt>County</dt><dd>{getRecordVal(selectedRecord, 'COUNTY') || '—'}</dd>
                    <dt>State</dt><dd>{getRecordVal(selectedRecord, 'OWNER_ST', 'ST') || '—'}</dd>
                    <dt>S-T-R</dt><dd>{getRecordVal(selectedRecord, 'S_T_R', 'S_TR') || '—'}</dd>
                    <dt>Legal description</dt><dd>{getRecordVal(selectedRecord, 'LEGAL_DESCRIPTION') || '—'}</dd>
                  </dl>
                </div>
                <div className="acreage-detail-block">
                  <h4>Owner</h4>
                  <dl>
                    <dt>Owner</dt><dd>{getRecordVal(selectedRecord, 'OWNER') || '—'}</dd>
                    <dt>Address</dt>
                    <dd>
                      {[getRecordVal(selectedRecord, 'OWNER_STREET', 'STREET'), `${getRecordVal(selectedRecord, 'OWNER_CITY', 'CITY')}, ${getRecordVal(selectedRecord, 'OWNER_ST', 'ST')} ${getRecordVal(selectedRecord, 'OWNER_ZIP', 'ZIP')}`.trim()].filter(Boolean).join(' · ') || '—'}
                    </dd>
                    <dt>Contact</dt><dd>{getRecordVal(selectedRecord, 'PHONE_EMAIL') || '—'}</dd>
                  </dl>
                </div>
                <div className="acreage-detail-block">
                  <h4>Mineral interest</h4>
                  <dl>
                    <dt>NMA</dt><dd>{selectedRecord.NMA != null ? formatNMA(selectedRecord.NMA) : '—'}</dd>
                    <dt>Royalty %</dt><dd>{selectedRecord.ROY != null ? Number(selectedRecord.ROY).toFixed(4) + '%' : '—'}</dd>
                    <dt>Allocation %</dt><dd>{selectedRecord.ALLOCATION_PERCENT != null ? Number(selectedRecord.ALLOCATION_PERCENT).toFixed(2) + '%' : selectedRecord['New_ALLO_%'] != null ? Number(selectedRecord['New_ALLO_%']).toFixed(2) + '%' : '—'}</dd>
                    <dt>Title source</dt><dd>{getRecordVal(selectedRecord, 'TITLE_SOURCE') || '—'}</dd>
                    {(selectedRecord.OCC_DATE != null || selectedRecord.occDate != null) && (
                      <>
                        <dt>OCC date</dt><dd>{formatOccDate(selectedRecord.OCC_DATE ?? selectedRecord.occDate, '—')}</dd>
                      </>
                    )}
                    <dt>OCC type</dt>
                    <dd>{getRecordVal(selectedRecord, 'NEW_OCC_TYPE', 'new_occ_type', 'newOccType') || '—'}</dd>
                  </dl>
                </div>
                <div className="acreage-detail-block">
                  <h4>Acquisition</h4>
                  <dl>
                    <dt>Status</dt>
                    <dd>
                      <span className={`acreage-status acreage-status--${(getRecordVal(selectedRecord, 'STATUS') || 'unknown').toLowerCase().replace(/\s+/g, '-')}`}>
                        {getRecordVal(selectedRecord, 'STATUS') || 'Unknown'}
                      </span>
                    </dd>
                    <dt>Buyer</dt><dd>{getRecordVal(selectedRecord, 'BUYER') || 'Unassigned'}</dd>
                    <dt>Notes</dt><dd>{getRecordVal(selectedRecord, 'NOTE') || '—'}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AcreageSchedulePage;
