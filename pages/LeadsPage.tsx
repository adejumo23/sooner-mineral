import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchLeads, fetchUsers, fetchSections, fetchUnits } from '../services/api';
import { LeadEnhanced, User, Section, Unit, LeadFilters } from '../types';
import Table from '../components/ui/Table';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { MagnifyingGlassIcon, FunnelIcon, PlusIcon } from '../components/icons/Icons';

const LeadsPage: React.FC = () => {
  const [leads, setLeads] = useState<LeadEnhanced[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<LeadFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortField, setSortField] = useState<keyof LeadEnhanced | string>('priorityScore');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadData();
  }, []);

  // Debounce search term to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    loadLeads();
  }, [filters, debouncedSearchTerm]);

  const loadData = async () => {
    try {
      const [usersData, sectionsData, unitsData] = await Promise.all([
        fetchUsers(),
        fetchSections().then(response => response.data || response),
        fetchUnits()
      ]);
      setUsers(usersData || []);
      setSections(sectionsData || []);
      setUnits(unitsData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const loadLeads = async () => {
    try {
      setLoading(true);
      const leadsResponse = await fetchLeads({
        ...filters,
        search: debouncedSearchTerm || undefined
      });
      const leadsData = leadsResponse.data || leadsResponse;
      setLeads(Array.isArray(leadsData) ? leadsData : []);
    } catch (error) {
      console.error('Error loading leads:', error);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof LeadFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm('');
  };

  const handleSort = (field: keyof LeadEnhanced | string) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field with default ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Sort leads based on current sort field and direction
  const sortedLeads = [...leads].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    // Handle different field types
    switch (sortField) {
      case 'linkedContact':
        aValue = a.linkedContact?.name || a.name || '';
        bValue = b.linkedContact?.name || b.name || '';
        break;
      case 'status':
        aValue = a.status || '';
        bValue = b.status || '';
        break;
      case 'priorityScore':
        aValue = a.priorityScore ?? 0;
        bValue = b.priorityScore ?? 0;
        break;
      case 'lastContactDate':
        aValue = a.lastContactDate ? new Date(a.lastContactDate).getTime() : 0;
        bValue = b.lastContactDate ? new Date(b.lastContactDate).getTime() : 0;
        break;
      case 'nextFollowUpDate':
        aValue = a.nextFollowUpDate ? new Date(a.nextFollowUpDate).getTime() : 0;
        bValue = b.nextFollowUpDate ? new Date(b.nextFollowUpDate).getTime() : 0;
        break;
      case 'buyer':
        aValue = a.buyer?.name || '';
        bValue = b.buyer?.name || '';
        break;
      default:
        aValue = a[sortField as keyof LeadEnhanced] ?? '';
        bValue = b[sortField as keyof LeadEnhanced] ?? '';
    }

    // Handle comparison
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const getStatusColor = (status: LeadEnhanced['status']) => {
    switch (status) {
      case 'Uncontacted': return 'bg-gray-100 text-gray-800';
      case 'Spoke': return 'bg-blue-100 text-blue-800';
      case 'Interested': return 'bg-green-100 text-green-800';
      case 'LOI Sent': return 'bg-yellow-100 text-yellow-800';
      case 'Dead': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 80) return 'bg-red-100 text-red-800';
    if (priority >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const columns = [
    {
      header: 'Contact',
      accessor: 'linkedContact',
      sortable: true,
      cell: (lead: LeadEnhanced) => (
        <div>
          <div className="font-medium text-gray-900">
            {lead.linkedContact?.name || lead.name || 'Unknown Contact'}
          </div>
          <div className="text-sm text-gray-600">
            {lead.linkedContact?.city || lead.city}, {lead.linkedContact?.state || lead.state}
          </div>
          <div className="text-xs text-gray-500">
            {lead.phoneEmail || 'No contact info'}
          </div>
        </div>
      )
    },
    {
      header: 'Assets',
      accessor: 'assets',
      sortable: false,
      cell: (lead: LeadEnhanced) => {
        // Sections are already deduplicated on the server
        const sections = lead.linkedSections || [];
        // Units are already deduplicated on the server
        const units = lead.linkedUnits || [];
        
        return (
          <div>
            {sections.map(section => (
              <div key={section.id || section.str} className="text-sm text-gray-600">
                Section: {section.sectionName || section.str || 'Unknown Section'}
              </div>
            ))}
            {units.map(unit => (
              <div key={unit.id || unit.unitName} className="text-sm text-gray-600">
                Unit: {unit.unitName}
              </div>
            ))}
            {sections.length === 0 && units.length === 0 && (
              <div className="text-sm text-gray-400 italic">No assets</div>
            )}
            <div className="text-xs text-gray-500 mt-1">
              {lead.grossAcres ? `${lead.grossAcres.toFixed(2)} acres` : 'No acreage data'}
            </div>
          </div>
        );
      }
    },
    {
      header: 'Buyer',
      accessor: 'buyer',
      sortable: true,
      cell: (lead: LeadEnhanced) => (
        <span className="text-sm text-gray-600">{lead.buyer?.name || 'Unassigned'}</span>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      sortable: true,
      cell: (lead: LeadEnhanced) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
          {lead.status}
        </span>
      )
    },
    {
      header: 'Priority',
      accessor: 'priorityScore',
      sortable: true,
      cell: (lead: LeadEnhanced) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(lead.priorityScore)}`}>
          {lead.priorityScore}
        </span>
      )
    },
    {
      header: 'Last Contact',
      accessor: 'lastContactDate',
      sortable: true,
      cell: (lead: LeadEnhanced) => (
        <span className="text-sm text-gray-600">
          {lead.lastContactDate ? new Date(lead.lastContactDate).toLocaleDateString() : 'Never'}
        </span>
      )
    },
    {
      header: 'Next Follow-up',
      accessor: 'nextFollowUpDate',
      sortable: true,
      cell: (lead: LeadEnhanced) => (
        <span className="text-sm text-gray-600">
          {lead.nextFollowUpDate ? new Date(lead.nextFollowUpDate).toLocaleDateString() : 'Not set'}
        </span>
      )
    },
    {
      header: 'Actions',
      accessor: 'actions',
      sortable: false,
      cell: (lead: LeadEnhanced) => (
        <div className="flex space-x-2">
          <Link
            to={`/leads/${lead.id}`}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            View
          </Link>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header with white background and icon */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-indigo-500 rounded-lg flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Leads</h1>
              <p className="text-gray-600 mt-1">Manage and track lead outreach</p>
            </div>
          </div>
          <Link to="/leads/new">
            <Button>
              <PlusIcon className="h-4 w-4 mr-2" />
              New Lead
            </Button>
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="flex space-x-4">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search leads by contact name or notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
            >
              <FunnelIcon className="h-4 w-4 mr-2" />
              Filters
            </Button>
            <Button variant="outline" onClick={clearFilters}>
              Clear
            </Button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.status || ''}
                  onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sc-blue"
                >
                  <option value="">All Statuses</option>
                  <option value="Uncontacted">Uncontacted</option>
                  <option value="Spoke">Spoke</option>
                  <option value="Interested">Interested</option>
                  <option value="LOI Sent">LOI Sent</option>
                  <option value="Dead">Dead</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Buyer</label>
                <select
                  value={filters.buyerId || ''}
                  onChange={(e) => handleFilterChange('buyerId', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sc-blue"
                >
                  <option value="">All Buyers</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Source Channel</label>
                <select
                  value={filters.sourceChannel || ''}
                  onChange={(e) => handleFilterChange('sourceChannel', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sc-blue"
                >
                  <option value="">All Sources</option>
                  <option value="Broker">Broker</option>
                  <option value="Inbound">Inbound</option>
                  <option value="Outbound">Outbound</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority Min</label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={filters.priorityMin || ''}
                  onChange={(e) => handleFilterChange('priorityMin', e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority Max</label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={filters.priorityMax || ''}
                  onChange={(e) => handleFilterChange('priorityMax', e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Contact From</label>
                <Input
                  type="date"
                  value={filters.lastContactFrom || ''}
                  onChange={(e) => handleFilterChange('lastContactFrom', e.target.value || undefined)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Contact To</label>
                <Input
                  type="date"
                  value={filters.lastContactTo || ''}
                  onChange={(e) => handleFilterChange('lastContactTo', e.target.value || undefined)}
                />
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Results Summary */}
      <div className="text-sm text-gray-500">
        {loading ? (
          'Loading...'
        ) : (
          <>
            Showing {sortedLeads.length} lead{sortedLeads.length !== 1 ? 's' : ''}
            {debouncedSearchTerm && (
              <span className="ml-2 text-blue-600">
                (filtered by "{debouncedSearchTerm}")
              </span>
            )}
          </>
        )}
      </div>

      {/* Leads Table */}
      <Card>
        {loading ? (
          <div className="text-center py-8">
            <div className="text-lg">Loading leads...</div>
          </div>
        ) : (
          <Table 
            data={sortedLeads} 
            columns={columns}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
          />
        )}
      </Card>
    </div>
  );
};

export default LeadsPage;
