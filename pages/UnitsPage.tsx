import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { fetchUnits, fetchUsers } from '../services/api';
import { Unit, User, UnitFilters } from '../types';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Table from '../components/ui/Table';
import Modal from '../components/ui/Modal';
import { PlusIcon, MagnifyingGlassIcon, FunnelIcon, LockClosedIcon, LockOpenIcon } from '../components/icons/Icons';
import { formatOccDate } from '../utils/formatting';

const UnitsPage: React.FC = () => {
  const [units, setUnits] = useState<Unit[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<UnitFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof Unit | string>('unitName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);
  
  // Initialize column visibility from localStorage (unitName = shared column for both tables)
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('units-column-visibility');
    if (saved) {
      try {
        const arr = JSON.parse(saved) as string[];
        const set = new Set(arr);
        if (set.has('currentUnitName')) {
          set.delete('currentUnitName');
          set.add('unitName');
        }
        return set;
      } catch (e) {
        return new Set();
      }
    }
    return new Set();
  });

  // Column width state and resizing
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('units-column-widths');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return {};
      }
    }
    return {};
  });
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const [resizeStartX, setResizeStartX] = useState(0);
  const [resizeStartWidth, setResizeStartWidth] = useState(0);

  // New Unit table pagination
  const [newUnitPage, setNewUnitPage] = useState(1);
  const [newUnitPageSize, setNewUnitPageSize] = useState(25);

  // Current Unit table sort (independent from New Unit table)
  const [currentUnitSortField, setCurrentUnitSortField] = useState<string>('unitName');
  const [currentUnitSortDirection, setCurrentUnitSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    loadData();
  }, []);

  // Reset to page 1 when filters/sort or data change
  useEffect(() => {
    setNewUnitPage(1);
  }, [searchTerm, filters, sortField, sortDirection, units.length]);

  useEffect(() => {
    if (searchTerm) {
      setFilters(prev => ({ ...prev, search: searchTerm }));
    } else {
      setFilters(prev => {
        const { search, ...rest } = prev;
        return rest;
      });
    }
  }, [searchTerm]);

  const loadData = async () => {
    try {
      const [unitsResponse, usersResponse] = await Promise.all([
        fetchUnits(1, 1000),
        fetchUsers()
      ]);
      const unitsData = unitsResponse.data || unitsResponse;
      const usersData = usersResponse.data || usersResponse;
      setUnits(Array.isArray(unitsData) ? unitsData : []);
      setUsers(usersData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      setUnits([]);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const loadUnits = async () => {
    try {
      setLoading(true);
      const unitsResponse = await fetchUnits(1, 1000);
      const unitsData = unitsResponse.data || unitsResponse;
      setUnits(Array.isArray(unitsData) ? unitsData : []);
    } catch (error) {
      console.error('Error loading units:', error);
      setUnits([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof UnitFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm('');
  };

  const handleSort = (field: keyof Unit | string) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field with default ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter units by search and filters
  const filteredUnits = useMemo(() => {
    let list = [...units];
    const term = (searchTerm || '').toLowerCase().trim();
    if (term) {
      list = list.filter(
        (u) =>
          (u.currentUnitName || '').toLowerCase().includes(term) ||
          (u.unitName || '').toLowerCase().includes(term) ||
          (u.operator || '').toLowerCase().includes(term) ||
          (u.county || '').toLowerCase().includes(term) ||
          (u.str || '').toLowerCase().includes(term)
      );
    }
    if (filters.operator) {
      list = list.filter((u) => (u.operator || '').toLowerCase().includes(String(filters.operator).toLowerCase()));
    }
    if (filters.county) {
      list = list.filter((u) => (u.county || '').toLowerCase().includes(String(filters.county).toLowerCase()));
    }
    if (filters.status) {
      list = list.filter((u) => u.status === filters.status);
    }
    if (filters.assignedBuyer && users?.length) {
      const buyer = users.find((u) => u.id === filters.assignedBuyer);
      const buyerName = buyer?.name || '';
      list = list.filter((u) => (u.buyer || u.assignedBuyer?.name || '').toLowerCase() === buyerName.toLowerCase());
    }
    return list;
  }, [units, searchTerm, filters, users]);

  // Current units: one row per unique current unit (grouped)
  const currentUnits = useMemo(() => {
    const byId = new Map<string, Unit & { lineItemCount: number; totalNetAcres: number; strList: string[] }>();
    for (const u of filteredUnits) {
      const id = u.id;
      const existing = byId.get(id);
      const nma = u.estimatedNetAcres ?? u.estimatedGrossAcres ?? 0;
      const strVal = u.str && String(u.str).trim() ? String(u.str).trim() : null;
      if (!existing) {
        byId.set(id, {
          ...u,
          lineItemCount: 1,
          totalNetAcres: nma,
          strList: strVal ? [strVal] : []
        });
      } else {
        existing.lineItemCount += 1;
        existing.totalNetAcres += nma;
        if (strVal && !existing.strList.includes(strVal)) {
          existing.strList.push(strVal);
        }
      }
    }
    return Array.from(byId.values());
  }, [filteredUnits]);

  const handleCurrentUnitSort = (field: string) => {
    if (currentUnitSortField === field) {
      setCurrentUnitSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setCurrentUnitSortField(field);
      setCurrentUnitSortDirection('asc');
    }
  };

  // Sorted Current Units for the Current Unit table
  const sortedCurrentUnits = useMemo(() => {
    return [...currentUnits].sort((a, b) => {
      let aVal: any;
      let bVal: any;
      switch (currentUnitSortField) {
        case 'currentUnitName':
        case 'unitName':
          aVal = (a.currentUnitName || a.unitName || '').toLowerCase();
          bVal = (b.currentUnitName || b.unitName || '').toLowerCase();
          break;
        case 'str':
          aVal = (a.strList || []).join(',').toLowerCase();
          bVal = (b.strList || []).join(',').toLowerCase();
          break;
        case 'operator':
          aVal = (a.operator || '').toLowerCase();
          bVal = (b.operator || '').toLowerCase();
          break;
        case 'county':
          aVal = (a.county || '').toLowerCase();
          bVal = (b.county || '').toLowerCase();
          break;
        case 'allocationPercentage':
          aVal = (a as Unit).allocationPercentage ?? -1;
          bVal = (b as Unit).allocationPercentage ?? -1;
          break;
        case 'status':
          aVal = (a.status || '').toLowerCase();
          bVal = (b.status || '').toLowerCase();
          break;
        case 'lineItemCount':
          aVal = (a as { lineItemCount?: number }).lineItemCount ?? 0;
          bVal = (b as { lineItemCount?: number }).lineItemCount ?? 0;
          break;
        case 'totalNetAcres':
          aVal = (a as { totalNetAcres?: number }).totalNetAcres ?? 0;
          bVal = (b as { totalNetAcres?: number }).totalNetAcres ?? 0;
          break;
        case 'assignedBuyer':
          aVal = (a.buyer || a.assignedBuyer?.name || '').toLowerCase();
          bVal = (b.buyer || b.assignedBuyer?.name || '').toLowerCase();
          break;
        default:
          aVal = (a as any)[currentUnitSortField] ?? '';
          bVal = (b as any)[currentUnitSortField] ?? '';
      }
      const mult = currentUnitSortDirection === 'asc' ? 1 : -1;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return mult * (aVal - bVal);
      }
      const aStr = String(aVal);
      const bStr = String(bVal);
      if (aStr < bStr) return -mult;
      if (aStr > bStr) return mult;
      return 0;
    });
  }, [currentUnits, currentUnitSortField, currentUnitSortDirection]);

  // New Unit table: aggregate by unitName to remove redundancy (one row per unique new unit)
  type NewUnitAggRow = Unit & {
    strList?: string[];
    allocationList?: (number | undefined)[];
    lineItemCount?: number;
    totalNetAcres?: number;
    nraCapUsdSum?: number;
  };
  const aggregatedNewUnits = useMemo(() => {
    const byUnitName = new Map<string, NewUnitAggRow>();
    const sameAllo = (a: number | undefined, b: number | undefined) =>
      a === b || (a != null && b != null && Math.abs(a - b) < 1e-9);
    for (const u of filteredUnits) {
      const rawName = (u.unitName || '').trim() || '—';
      const key = rawName.toLowerCase();
      const existing = byUnitName.get(key);
      const nma = u.estimatedNetAcres ?? u.estimatedGrossAcres ?? 0;
      const strVal = u.str && String(u.str).trim() ? String(u.str).trim() : null;
      const alloVal = u.allocationPercentage != null ? Number(u.allocationPercentage) : undefined;
      const nraVal = u.nraCapUsd != null ? Number(u.nraCapUsd) : null;
      if (!existing) {
        byUnitName.set(key, {
          ...u,
          unitName: rawName,
          strList: strVal ? [strVal] : [],
          allocationList: alloVal !== undefined ? [alloVal] : [],
          lineItemCount: 1,
          totalNetAcres: nma,
          nraCapUsdSum: nraVal != null ? nraVal : undefined
        });
      } else {
        existing.lineItemCount = (existing.lineItemCount ?? 1) + 1;
        existing.totalNetAcres = (existing.totalNetAcres ?? 0) + nma;
        if (nraVal != null) {
          existing.nraCapUsdSum = (existing.nraCapUsdSum ?? 0) + nraVal;
        }
        if (strVal && !existing.strList!.includes(strVal)) {
          existing.strList!.push(strVal);
        }
        if (alloVal !== undefined && !existing.allocationList!.some((v) => sameAllo(v, alloVal))) {
          existing.allocationList!.push(alloVal);
        }
      }
    }
    return Array.from(byUnitName.values());
  }, [filteredUnits]);

  // Sort units (for New Unit table) based on current sort field and direction
  const sortedUnits = useMemo(() => {
    return [...aggregatedNewUnits].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'unitName':
          aValue = a.unitName || '';
          bValue = b.unitName || '';
          break;
        case 'currentUnitName':
          aValue = a.currentUnitName || '';
          bValue = b.currentUnitName || '';
          break;
        case 'operator':
          aValue = a.operator || '';
          bValue = b.operator || '';
          break;
        case 'county':
          aValue = a.county || '';
          bValue = b.county || '';
          break;
        case 'status':
          aValue = a.status || '';
          bValue = b.status || '';
          break;
        case 'sectionCount':
          aValue = (a as NewUnitAggRow).lineItemCount ?? a.sectionCount ?? a.linkedSectionIds?.length ?? 0;
          bValue = (b as NewUnitAggRow).lineItemCount ?? b.sectionCount ?? b.linkedSectionIds?.length ?? 0;
          break;
        case 'estimatedNetAcres':
          aValue = (a as NewUnitAggRow).totalNetAcres ?? a.estimatedNetAcres ?? 0;
          bValue = (b as NewUnitAggRow).totalNetAcres ?? b.estimatedNetAcres ?? 0;
          break;
        case 'assignedBuyer':
          aValue = a.buyer || a.assignedBuyer?.name || 'Unassigned';
          bValue = b.buyer || b.assignedBuyer?.name || 'Unassigned';
          break;
        case 'str':
          aValue = a.str ?? '';
          bValue = b.str ?? '';
          break;
        case 'allocationPercentage':
          aValue = a.allocationPercentage ?? -1;
          bValue = b.allocationPercentage ?? -1;
          break;
        case 'spudDate':
          aValue = a.spudDate ? new Date(a.spudDate).getTime() : 0;
          bValue = b.spudDate ? new Date(b.spudDate).getTime() : 0;
          break;
        case 'occDate':
          aValue = a.occDate ? new Date(a.occDate).getTime() : 0;
          bValue = b.occDate ? new Date(b.occDate).getTime() : 0;
          break;
        case 'occType':
          aValue = a.occType ?? '';
          bValue = b.occType ?? '';
          break;
        case 'nraCapUsd':
          aValue = (a as NewUnitAggRow).nraCapUsdSum ?? a.nraCapUsd ?? -1;
          bValue = (b as NewUnitAggRow).nraCapUsdSum ?? b.nraCapUsd ?? -1;
          break;
        default:
          aValue = a[sortField as keyof Unit] ?? '';
          bValue = b[sortField as keyof Unit] ?? '';
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();
      if (aStr < bStr) return sortDirection === 'asc' ? -1 : 1;
      if (aStr > bStr) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [aggregatedNewUnits, sortField, sortDirection]);

  // Paginated slice for New Unit table
  const totalNewUnitItems = sortedUnits.length;
  const totalNewUnitPages = Math.max(1, Math.ceil(totalNewUnitItems / newUnitPageSize));
  const paginatedNewUnits = useMemo(() => {
    const start = (newUnitPage - 1) * newUnitPageSize;
    return sortedUnits.slice(start, start + newUnitPageSize);
  }, [sortedUnits, newUnitPage, newUnitPageSize]);
  const newUnitStart = totalNewUnitItems === 0 ? 0 : (newUnitPage - 1) * newUnitPageSize + 1;
  const newUnitEnd = Math.min(newUnitPage * newUnitPageSize, totalNewUnitItems);

  const getStatusColor = (status: Unit['status']) => {
    switch (status) {
      case 'Producing': return 'text-green-600 bg-green-100';
      case 'Permitted': return 'text-blue-600 bg-blue-100';
      case 'Held by Production': return 'text-yellow-600 bg-yellow-100';
      case 'Plugged': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  type CurrentUnitRow = Unit & { lineItemCount: number; totalNetAcres: number; strList: string[] };

  const currentUnitColumns: Array<{
    header: string;
    accessor: string;
    sortable?: boolean;
    className?: string;
    alwaysVisible?: boolean;
    cell: (row: CurrentUnitRow) => React.ReactNode;
  }> = [
    {
      header: 'Current Unit Name',
      accessor: 'unitName',
      sortable: true,
      className: 'whitespace-normal min-w-0',
      cell: (row: CurrentUnitRow) => (
        <Link to={`/units/${row.id}`} className="text-sc-blue hover:text-sc-blue-dark font-medium block break-words">
          {row.currentUnitName || row.unitName || '—'}
        </Link>
      )
    },
    {
      header: 'S-T-R',
      accessor: 'str',
      sortable: true,
      className: 'w-28 whitespace-normal',
      cell: (row: CurrentUnitRow) => {
        const list = row.strList || [];
        if (list.length === 0) return '—';
        return (
          <span className="block">
            {list.map((s, i) => (
              <span key={i} className="block">{s}</span>
            ))}
          </span>
        );
      }
    },
    {
      header: 'Operator',
      accessor: 'operator',
      sortable: true,
      className: 'w-24',
      cell: (row: CurrentUnitRow) => row.operator ?? '—'
    },
    {
      header: 'County',
      accessor: 'county',
      sortable: true,
      className: 'w-32',
      cell: (row: CurrentUnitRow) => `${row.county || '—'}, ${row.state || '—'}`
    },
    {
      header: 'Allocation %',
      accessor: 'allocationPercentage',
      sortable: true,
      className: 'w-24 whitespace-normal',
      cell: (row: CurrentUnitRow) =>
        row.allocationPercentage != null ? Number(row.allocationPercentage).toFixed(6) : '—'
    },
    {
      header: 'Status',
      accessor: 'status',
      sortable: true,
      className: 'w-32',
      cell: (row: CurrentUnitRow) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(row.status)}`}>
          {row.status}
        </span>
      )
    },
    {
      header: 'Number of Owners',
      accessor: 'lineItemCount',
      sortable: true,
      className: 'w-20',
      cell: (row: CurrentUnitRow) => {
        const n = (row as CurrentUnitRow).lineItemCount;
        return (
          <span className="text-sm text-gray-600">{n} owner{n !== 1 ? 's' : ''}</span>
        );
      }
    },
    {
      header: 'Net Acres',
      accessor: 'totalNetAcres',
      sortable: true,
      className: 'w-24',
      cell: (row: CurrentUnitRow) =>
        (row as CurrentUnitRow).totalNetAcres != null
          ? Number((row as CurrentUnitRow).totalNetAcres).toLocaleString()
          : '—'
    },
    {
      header: 'Assigned Buyer',
      accessor: 'assignedBuyer',
      sortable: true,
      className: 'w-28',
      cell: (row: CurrentUnitRow) => row.buyer || row.assignedBuyer?.name || 'Unassigned'
    },
    {
      header: 'Actions',
      accessor: 'actions',
      sortable: false,
      className: 'w-24',
      alwaysVisible: true,
      cell: (row: CurrentUnitRow) => (
        <div className="flex items-center space-x-2">
          {row.isLocked ? (
            <LockClosedIcon className="h-4 w-4 text-red-500" />
          ) : (
            <LockOpenIcon className="h-4 w-4 text-green-500" />
          )}
          <Link
            to={`/units/${row.id}?unitType=current&unitName=${encodeURIComponent(row.currentUnitName || row.unitName || '')}`}
            className="text-sc-blue hover:text-sc-blue-dark text-sm font-medium"
          >
            View
          </Link>
        </div>
      )
    }
  ];

  // Filter Current Unit columns by visibility (same visibility set as New Unit table)
  const currentUnitColumnsFiltered = React.useMemo(() => {
    return currentUnitColumns.filter((col) => {
      const accessor = col.accessor as string;
      return col.alwaysVisible || visibleColumns.size === 0 || visibleColumns.has(accessor);
    });
  }, [visibleColumns, currentUnitColumns]);

  const allColumns = [
    {
      header: 'New Unit',
      accessor: 'unitName',
      sortable: true,
      className: 'whitespace-normal min-w-0 w-1/3',
      alwaysVisible: false,
      cell: (unit: Unit) => (
        <Link 
          to={`/units/${unit.id}?unitType=new&unitName=${encodeURIComponent(unit.unitName || '')}`}
          className="text-sc-blue hover:text-sc-blue-dark font-medium block break-words"
        >
          {unit.unitName || 'Unnamed Unit'}
        </Link>
      )
    },
    {
      header: 'S-T-R',
      accessor: 'str',
      sortable: true,
      className: 'w-28 whitespace-normal',
      cell: (unit: Unit) => {
        const list = (unit as NewUnitAggRow).strList;
        if (list && list.length > 0) {
          return (
            <span className="block">
              {list.map((s, i) => (
                <span key={i} className="block">{s}</span>
              ))}
            </span>
          );
        }
        return unit.str ?? '—';
      }
    },
    {
      header: 'Allocation %',
      accessor: 'allocationPercentage',
      sortable: true,
      className: 'w-24 whitespace-normal',
      cell: (unit: Unit) => {
        const list = (unit as NewUnitAggRow).allocationList;
        if (list && list.length > 0) {
          return (
            <span className="block">
              {list.map((v, i) => (
                <span key={i} className="block">{v != null ? Number(v).toFixed(6) : '—'}</span>
              ))}
            </span>
          );
        }
        return unit.allocationPercentage != null ? Number(unit.allocationPercentage).toFixed(6) : '—';
      }
    },
    {
      header: 'Spud Date',
      accessor: 'spudDate',
      sortable: true,
      className: 'w-24',
      cell: (unit: Unit) => unit.spudDate ? new Date(unit.spudDate).toLocaleDateString() : '—'
    },
    {
      header: 'OCC Date',
      accessor: 'occDate',
      sortable: true,
      className: 'w-24',
      cell: (unit: Unit) => formatOccDate(unit.occDate)
    },
    {
      header: 'OCC Type',
      accessor: 'occType',
      sortable: true,
      className: 'w-32',
      cell: (unit: Unit) => unit.occType ?? '—'
    },
    {
      header: 'NRA/$ Cap',
      accessor: 'nraCapUsd',
      sortable: true,
      className: 'w-24',
      cell: (unit: Unit) => {
        const sum = (unit as NewUnitAggRow).nraCapUsdSum;
        const val = sum != null ? sum : unit.nraCapUsd;
        return val != null ? `$${Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—';
      }
    },
    {
      header: 'Operator',
      accessor: 'operator',
      sortable: true,
      className: 'w-24',
      cell: (unit: Unit) => unit.operator
    },
    {
      header: 'County',
      accessor: 'county',
      sortable: true,
      className: 'w-32',
      cell: (unit: Unit) => `${unit.county || '—'}, ${unit.state || '—'}`
    },
    {
      header: 'Status',
      accessor: 'status',
      sortable: true,
      className: 'w-32',
      cell: (unit: Unit) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(unit.status)}`}>
          {unit.status}
        </span>
      )
    },
    {
      header: 'Sections',
      accessor: 'sectionCount',
      sortable: true,
      className: 'w-20',
      cell: (unit: Unit) => {
        const count = (unit as NewUnitAggRow).lineItemCount ?? unit.sectionCount ?? unit.linkedSectionIds?.length ?? 0;
        return (
          <span className="text-sm text-gray-600">
            {count} section{count !== 1 ? 's' : ''}
          </span>
        );
      }
    },
    {
      header: 'Net Acres',
      accessor: 'estimatedNetAcres',
      sortable: true,
      className: 'w-24',
      cell: (unit: Unit) => {
        const total = (unit as NewUnitAggRow).totalNetAcres ?? unit.estimatedNetAcres;
        return total != null ? Number(total).toLocaleString() : '—';
      }
    },
    {
      header: 'Assigned Buyer',
      accessor: 'assignedBuyer',
      sortable: true,
      className: 'w-28',
      cell: (unit: Unit) => unit.buyer || unit.assignedBuyer?.name || 'Unassigned'
    },
    {
      header: 'Actions',
      accessor: 'actions',
      className: 'w-24',
      alwaysVisible: true,
      cell: (unit: Unit) => (
        <div className="flex items-center space-x-2">
          {unit.isLocked ? (
            <LockClosedIcon className="h-4 w-4 text-red-500" />
          ) : (
            <LockOpenIcon className="h-4 w-4 text-green-500" />
          )}
          <Link
            to={`/units/${unit.id}?unitType=new&unitName=${encodeURIComponent(unit.unitName || '')}`}
            className="text-sc-blue hover:text-sc-blue-dark text-sm font-medium"
          >
            View
          </Link>
        </div>
      )
    }
  ];

  // Filter columns based on visibility
  const columns = React.useMemo(() => {
    return allColumns.filter(col => {
      const accessor = col.accessor as string;
      // Always show Actions column
      if (col.alwaysVisible) return true;
      // Show if in visibleColumns set, or if visibleColumns is empty (initial state - show all)
      return visibleColumns.size === 0 || visibleColumns.has(accessor);
    });
  }, [visibleColumns]);

  // All column options for the menu: Current Unit + New Unit (merge by accessor so shared columns appear once)
  const allColumnOptionsForMenu = React.useMemo(() => {
    const seen = new Set<string>();
    const list: { accessor: string; header: string; alwaysVisible?: boolean }[] = [];
    for (const col of currentUnitColumns) {
      const a = col.accessor as string;
      if (!seen.has(a)) {
        seen.add(a);
        list.push({ accessor: a, header: col.header, alwaysVisible: col.alwaysVisible });
      }
    }
    for (const col of allColumns) {
      const a = col.accessor as string;
      if (!seen.has(a)) {
        seen.add(a);
        list.push({ accessor: a, header: col.header, alwaysVisible: col.alwaysVisible });
      }
    }
    return list;
  }, [currentUnitColumns, allColumns]);

  // Initialize visible columns on mount if not set (include both Current Unit and New Unit columns)
  useEffect(() => {
    if (visibleColumns.size === 0) {
      const allAccessors = allColumnOptionsForMenu.map((col) => col.accessor);
      setVisibleColumns(new Set(allAccessors));
      localStorage.setItem('units-column-visibility', JSON.stringify(Array.from(allAccessors)));
    }
  }, []);

  const toggleColumnVisibility = (accessor: string) => {
    const newVisible = new Set(visibleColumns);
    if (newVisible.has(accessor)) {
      newVisible.delete(accessor);
    } else {
      newVisible.add(accessor);
    }
    setVisibleColumns(newVisible);
    localStorage.setItem('units-column-visibility', JSON.stringify(Array.from(newVisible)));
  };

  const showAllColumns = () => {
    const allAccessors = allColumnOptionsForMenu.map((col) => col.accessor);
    const newVisible = new Set(allAccessors);
    setVisibleColumns(newVisible);
    localStorage.setItem('units-column-visibility', JSON.stringify(Array.from(newVisible)));
  };

  const hideAllColumns = () => {
    const required = allColumnOptionsForMenu.filter((col) => col.alwaysVisible).map((col) => col.accessor);
    const newVisible = new Set(required.length ? required : ['actions']);
    setVisibleColumns(newVisible);
    localStorage.setItem('units-column-visibility', JSON.stringify(Array.from(newVisible)));
  };

  // Column resizing handlers
  const handleResizeStart = (e: React.MouseEvent, accessor: string, currentWidth: number) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingColumn(accessor);
    setResizeStartX(e.clientX);
    setResizeStartWidth(currentWidth);
  };

  useEffect(() => {
    if (!resizingColumn) return;

    const handleMouseMove = (e: MouseEvent) => {
      const diff = e.clientX - resizeStartX;
      const newWidth = Math.max(20, resizeStartWidth + diff);
      setColumnWidths(prev => {
        const updated = { ...prev, [resizingColumn]: newWidth };
        localStorage.setItem('units-column-widths', JSON.stringify(updated));
        return updated;
      });
    };

    const handleMouseUp = () => {
      setResizingColumn(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingColumn, resizeStartX, resizeStartWidth]);

  const getColumnWidth = (accessor: string): number => {
    return columnWidths[accessor] || 150; // Default width of 150px
  };

  if (loading && units.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-500">Loading units...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header with white background and icon */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5-10v1m0-1v1m0 0h1m-1 0h1" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Unit Management</h1>
              <p className="text-gray-600 mt-1">
                Manage leasehold-based pooled acreage groups across minerals and non-operated workflows
              </p>
            </div>
          </div>
          <Link to="/units/new">
            <Button className="flex items-center space-x-2">
              <PlusIcon className="h-5 w-5" />
              <span>Add Unit</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <div className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by unit name or API number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filter Toggle */}
            <Button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            >
              <FunnelIcon className="h-5 w-5" />
              <span>Filters</span>
            </Button>

            {/* Column Visibility Toggle */}
            <div className="relative">
              <button
                onClick={() => setIsColumnMenuOpen(!isColumnMenuOpen)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 flex items-center space-x-2 border border-gray-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <span>Columns</span>
                <svg className={`w-4 h-4 transition-transform ${isColumnMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {isColumnMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setIsColumnMenuOpen(false)}
                  ></div>
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-20 max-h-96 overflow-y-auto">
                    <div className="p-3 border-b border-gray-200">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-semibold text-gray-900">Column Visibility</h3>
                        <div className="flex space-x-2">
                          <button
                            onClick={showAllColumns}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            Show All
                          </button>
                          <button
                            onClick={hideAllColumns}
                            className="text-xs text-gray-600 hover:text-gray-800"
                          >
                            Hide All
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="p-2">
                      {allColumnOptionsForMenu.map((column) => {
                        const accessor = column.accessor;
                        const isVisible = column.alwaysVisible || visibleColumns.size === 0 || visibleColumns.has(accessor);
                        const isDisabled = column.alwaysVisible;
                        
                        return (
                          <div key={accessor} className="p-2 rounded hover:bg-gray-50">
                            <label
                              className={`flex items-center space-x-2 cursor-pointer ${
                                isDisabled ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isVisible}
                                onChange={() => !isDisabled && toggleColumnVisibility(accessor)}
                                disabled={isDisabled}
                                className="h-4 w-4 rounded border-gray-300 text-green-500 focus:ring-green-500"
                              />
                              <span className="text-sm text-gray-700 flex-1">{column.header}</span>
                              {isDisabled && (
                                <span className="text-xs text-gray-400">Required</span>
                              )}
                            </label>
                            {!isDisabled && (
                              <div className="mt-1 flex items-center space-x-2">
                                <span className="text-xs text-gray-500">Width: {getColumnWidth(accessor)}px</span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const newWidth = getColumnWidth(accessor) + 50;
                                    setColumnWidths(prev => {
                                      const updated = { ...prev, [accessor]: newWidth };
                                      localStorage.setItem('units-column-widths', JSON.stringify(updated));
                                      return updated;
                                    });
                                  }}
                                  className="text-xs text-blue-600 hover:text-blue-800 px-2 py-0.5 rounded hover:bg-blue-50"
                                  title="Increase width by 50px"
                                >
                                  +50
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const newWidth = Math.max(20, getColumnWidth(accessor) - 50);
                                    setColumnWidths(prev => {
                                      const updated = { ...prev, [accessor]: newWidth };
                                      localStorage.setItem('units-column-widths', JSON.stringify(updated));
                                      return updated;
                                    });
                                  }}
                                  className="text-xs text-blue-600 hover:text-blue-800 px-2 py-0.5 rounded hover:bg-blue-50"
                                  title="Decrease width by 50px"
                                >
                                  -50
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setColumnWidths(prev => {
                                      const updated = { ...prev };
                                      delete updated[accessor];
                                      localStorage.setItem('units-column-widths', JSON.stringify(updated));
                                      return updated;
                                    });
                                  }}
                                  className="text-xs text-gray-600 hover:text-gray-800 px-2 py-0.5 rounded hover:bg-gray-100"
                                  title="Reset to default width"
                                >
                                  Reset
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Clear Filters */}
            {Object.keys(filters).length > 0 && (
              <Button 
                onClick={clearFilters}
                className="border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              >
                Clear All
              </Button>
            )}
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Operator
                  </label>
                  <Input
                    type="text"
                    placeholder="Filter by operator"
                    value={filters.operator || ''}
                    onChange={(e) => handleFilterChange('operator', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Formation
                  </label>
                  <Input
                    type="text"
                    placeholder="Filter by formation"
                    value={filters.formation || ''}
                    onChange={(e) => handleFilterChange('formation', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    County
                  </label>
                  <Input
                    type="text"
                    placeholder="Filter by county"
                    value={filters.county || ''}
                    onChange={(e) => handleFilterChange('county', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={filters.status || ''}
                    onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sc-blue focus:border-transparent"
                  >
                    <option value="">All Statuses</option>
                    <option value="Permitted">Permitted</option>
                    <option value="Producing">Producing</option>
                    <option value="Held by Production">Held by Production</option>
                    <option value="Plugged">Plugged</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assigned Buyer
                  </label>
                  <select
                    value={filters.assignedBuyer || ''}
                    onChange={(e) => handleFilterChange('assignedBuyer', e.target.value || undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sc-blue focus:border-transparent"
                  >
                    <option value="">All Buyers</option>
                    {users && users.length > 0 && users
                      .filter(u => u.role && u.role.name === 'Buyer')
                      .map(user => (
                        <option key={user.id} value={user.id}>
                          {user.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fund Status
                  </label>
                  <select
                    value={filters.heldByFund === undefined ? '' : filters.heldByFund.toString()}
                    onChange={(e) => handleFilterChange('heldByFund', e.target.value === '' ? undefined : e.target.value === 'true')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sc-blue focus:border-transparent"
                  >
                    <option value="">All</option>
                    <option value="true">Held by Fund</option>
                    <option value="false">Not Held by Fund</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lock Status
                  </label>
                  <select
                    value={filters.isLocked === undefined ? '' : filters.isLocked.toString()}
                    onChange={(e) => handleFilterChange('isLocked', e.target.value === '' ? undefined : e.target.value === 'true')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sc-blue focus:border-transparent"
                  >
                    <option value="">All</option>
                    <option value="true">Locked</option>
                    <option value="false">Unlocked</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Results Summary */}
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          {currentUnits.length} current unit{currentUnits.length !== 1 ? 's' : ''}, {filteredUnits.length} line item{filteredUnits.length !== 1 ? 's' : ''}
          {Object.keys(filters).length > 0 && ' (filtered)'}
        </p>
      </div>

      {/* Current Units Datatable */}
      <Card className="mb-6">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Units</h2>
          {loading ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg mb-2">Loading...</div>
            </div>
          ) : currentUnits.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg mb-2">No current units found</div>
              <p className="text-gray-500">
                {Object.keys(filters).length > 0 ? 'Try adjusting your filters or search terms' : 'No units with current unit name'}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-sc-light-orange shadow overflow-x-auto">
              <table className="table-auto divide-y divide-sc-light-orange" style={{ minWidth: '100%', tableLayout: 'auto' }}>
                <thead className="bg-gray-100">
                  <tr>
                    {currentUnitColumnsFiltered.map((col, index) => {
                      const isSortable = col.sortable !== false;
                      const isActiveSort = currentUnitSortField === col.accessor;
                      const accessor = col.accessor as string;
                      const width = getColumnWidth(accessor);
                      const isResizing = resizingColumn === accessor;
                      return (
                        <th
                          key={col.header || index}
                          scope="col"
                          style={{ width: `${width}px`, minWidth: `${width}px` }}
                          className={`px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200 relative ${
                            isSortable ? 'cursor-pointer hover:bg-gray-200 select-none' : ''
                          } ${col.className || ''}`}
                          onClick={(e) => {
                            if ((e.target as HTMLElement).classList.contains('column-resizer')) return;
                            isSortable && handleCurrentUnitSort(accessor);
                          }}
                        >
                          <div className="flex items-center space-x-1">
                            <span>{col.header}</span>
                            {isSortable && (
                              <span className="text-gray-400">
                                {isActiveSort ? (currentUnitSortDirection === 'asc' ? '↑' : '↓') : <span className="opacity-30">⇅</span>}
                              </span>
                            )}
                          </div>
                          <div
                            className={`column-resizer absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 ${isResizing ? 'bg-blue-500' : 'bg-transparent'}`}
                            onMouseDown={(e) => handleResizeStart(e, accessor, width)}
                            style={{ userSelect: 'none' }}
                          />
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedCurrentUnits.map((row, rowIndex) => (
                    <tr key={row.id} className="hover:bg-gray-50 transition-colors duration-150">
                      {currentUnitColumnsFiltered.map((col, colIndex) => {
                        const accessor = col.accessor as string;
                        const width = getColumnWidth(accessor);
                        return (
                          <td
                            key={`${rowIndex}-${colIndex}`}
                            style={{ width: `${width}px`, minWidth: `${width}px` }}
                            className={`px-6 py-4 text-sm text-gray-900 ${col.className || 'whitespace-nowrap'}`}
                          >
                            {col.cell(row)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      {/* New Unit Details Datatable */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">New Unit Details</h2>
          {loading ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg mb-2">Loading...</div>
            </div>
          ) : !sortedUnits || sortedUnits.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg mb-2">No new unit line items found</div>
              <p className="text-gray-500">
                {Object.keys(filters).length > 0 ? 'Try adjusting your filters or search terms' : 'No schedule line items'}
              </p>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-lg border border-sc-light-orange shadow-lg overflow-x-auto">
                <table className="table-auto divide-y divide-sc-light-orange" style={{ minWidth: '100%', tableLayout: 'auto' }}>
                  <thead className="bg-gray-100">
                    <tr>
                      {columns.map((column, index) => {
                        const isSortable = column.sortable !== false;
                        const isActiveSort = sortField === column.accessor;
                        const accessor = column.accessor as string;
                        const width = getColumnWidth(accessor);
                        const isResizing = resizingColumn === accessor;
                        return (
                          <th
                            key={column.header || index}
                            scope="col"
                            style={{ width: `${width}px`, minWidth: `${width}px` }}
                            className={`px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200 relative ${
                              isSortable ? 'cursor-pointer hover:bg-gray-200 select-none' : ''
                            }`}
                            onClick={(e) => {
                              if ((e.target as HTMLElement).classList.contains('column-resizer')) return;
                              isSortable && handleSort(column.accessor as keyof Unit | string);
                            }}
                          >
                            <div className="flex items-center space-x-1">
                              <span>{column.header}</span>
                              {isSortable && (
                                <span className="text-gray-400">
                                  {isActiveSort ? (sortDirection === 'asc' ? '↑' : '↓') : <span className="opacity-30">⇅</span>}
                                </span>
                              )}
                            </div>
                            <div
                              className={`column-resizer absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 ${isResizing ? 'bg-blue-500' : 'bg-transparent'}`}
                              onMouseDown={(e) => handleResizeStart(e, accessor, width)}
                              style={{ userSelect: 'none' }}
                            />
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedNewUnits.map((item, rowIndex) => (
                      <tr key={item.scheduleRowId ?? item.id ?? rowIndex} className="hover:bg-gray-50 transition-colors duration-150">
                        {columns.map((column, colIndex) => {
                          const accessor = column.accessor as string;
                          const width = getColumnWidth(accessor);
                          return (
                            <td
                              key={`${rowIndex}-${colIndex}`}
                              style={{ width: `${width}px`, minWidth: `${width}px` }}
                              className={`px-6 py-4 text-sm text-gray-900 ${column.className || 'whitespace-nowrap'}`}
                            >
                              {column.cell ? column.cell(item) : (item[column.accessor as keyof Unit] as React.ReactNode)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">
                    Showing {newUnitStart}–{newUnitEnd} of {totalNewUnitItems}
                  </span>
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    Rows per page:
                    <select
                      value={newUnitPageSize}
                      onChange={(e) => {
                        setNewUnitPageSize(Number(e.target.value));
                        setNewUnitPage(1);
                      }}
                      className="border border-gray-300 rounded px-2 py-1 text-sm"
                    >
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                      <option value={250}>250</option>
                    </select>
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setNewUnitPage((p) => Math.max(1, p - 1))}
                    disabled={newUnitPage <= 1}
                    className="border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-600 px-2">
                    Page {newUnitPage} of {totalNewUnitPages}
                  </span>
                  <Button
                    onClick={() => setNewUnitPage((p) => Math.min(totalNewUnitPages, p + 1))}
                    disabled={newUnitPage >= totalNewUnitPages}
                    className="border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
};

export default UnitsPage;
