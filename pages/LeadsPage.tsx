import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchLeads, fetchUsers, fetchTracts, fetchUnits } from '../services/api';
import { Lead, User, Tract, Unit, LeadFilters } from '../types';
import Table from '../components/ui/Table';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { MagnifyingGlassIcon, FunnelIcon, PlusIcon } from '../components/icons/Icons';

const LeadsPage: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [tracts, setTracts] = useState<Tract[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<LeadFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadLeads();
  }, [filters, searchTerm]);

  const loadData = async () => {
    try {
      const [usersData, tractsData, unitsData] = await Promise.all([
        fetchUsers(),
        fetchTracts(),
        fetchUnits()
      ]);
      setUsers(usersData || []);
      setTracts(tractsData || []);
      setUnits(unitsData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const loadLeads = async () => {
    try {
      setLoading(true);
      const leadsData = await fetchLeads({
        ...filters,
        search: searchTerm || undefined
      });
      setLeads(leadsData || []);
    } catch (error) {
      console.error('Error loading leads:', error);
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

  const getStatusColor = (status: Lead['status']) => {
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
      cell: (lead: Lead) => (
        <div>
          <div className="font-medium text-white">
            {lead.linkedContact?.name || 'Unknown Contact'}
          </div>
          <div className="text-sm text-sc-slate">
            {lead.linkedContact?.city}, {lead.linkedContact?.state}
          </div>
        </div>
      )
    },
    {
      header: 'Assets',
      accessor: 'assets',
      cell: (lead: Lead) => (
        <div>
          {lead.linkedTracts?.map(tract => (
            <div key={tract.id} className="text-sm text-sc-slate">
              Tract: {tract.tractName}
            </div>
          ))}
          {lead.linkedUnits?.map(unit => (
            <div key={unit.id} className="text-sm text-sc-slate">
              Unit: {unit.unitName}
            </div>
          ))}
        </div>
      )
    },
    {
      header: 'Buyer',
      accessor: 'buyer',
      cell: (lead: Lead) => (
        <span className="text-sm text-sc-slate">{lead.buyer?.name || 'Unknown'}</span>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (lead: Lead) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
          {lead.status}
        </span>
      )
    },
    {
      header: 'Priority',
      accessor: 'priorityScore',
      cell: (lead: Lead) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(lead.priorityScore)}`}>
          {lead.priorityScore}
        </span>
      )
    },
    {
      header: 'Last Contact',
      accessor: 'lastContactDate',
      cell: (lead: Lead) => (
        <span className="text-sm text-sc-slate">
          {lead.lastContactDate ? new Date(lead.lastContactDate).toLocaleDateString() : 'Never'}
        </span>
      )
    },
    {
      header: 'Next Follow-up',
      accessor: 'nextFollowUpDate',
      cell: (lead: Lead) => (
        <span className="text-sm text-sc-slate">
          {lead.nextFollowUpDate ? new Date(lead.nextFollowUpDate).toLocaleDateString() : 'Not set'}
        </span>
      )
    },
    {
      header: 'Actions',
      accessor: 'actions',
      cell: (lead: Lead) => (
        <div className="flex space-x-2">
          <Link
            to={`/leads/${lead.id}`}
            className="text-sc-blue hover:text-sc-blue-dark text-sm font-medium"
          >
            View
          </Link>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Leads</h1>
          <p className="text-sc-slate">Manage and track lead outreach</p>
        </div>
        <Link to="/leads/new">
          <Button>
            <PlusIcon className="h-4 w-4 mr-2" />
            New Lead
          </Button>
        </Link>
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
        Showing {leads.length} leads
      </div>

      {/* Leads Table */}
      <Card>
        {loading ? (
          <div className="text-center py-8">
            <div className="text-lg">Loading leads...</div>
          </div>
        ) : (
          <Table data={leads} columns={columns} />
        )}
      </Card>
    </div>
  );
};

export default LeadsPage;
