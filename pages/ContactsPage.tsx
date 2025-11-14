import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  fetchContacts, 
  fetchContactTractOwnership, 
  fetchContactLeads,
  fetchContactCallLogs,
  fetchContactDocuments,
  fetchDistressSignals
} from '../services/api';
import { 
  ContactEnhanced, 
  ContactTractOwnershipEnhanced, 
  ContactUnitSummary,
  ContactCallLog,
  ContactDocument,
  DistressSignal,
  ContactFilters 
} from '../types';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Table from '../components/ui/Table';
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  FunnelIcon,
  ExclamationTriangleIcon,
  UserIcon,
  MapIcon,
  PhoneIcon,
  DocumentIcon
} from '../components/icons/Icons';

const ContactsPage: React.FC = () => {
  const [contacts, setContacts] = useState<ContactEnhanced[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<ContactEnhanced[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<ContactFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'totalNMA' | 'totalNRA' | 'lastContactedDate' | 'riskLevel'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    loadContacts();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [contacts, searchTerm, filters, sortBy, sortOrder]);

  const loadContacts = async () => {
    try {
      setLoading(true);
      // In a real implementation, this would fetch enhanced contacts with all the calculated fields
      const contactsResponse = await fetchContacts();
      const contactsData = contactsResponse.data || contactsResponse;
      const enhancedContacts: ContactEnhanced[] = contactsData.map(contact => ({
        ...contact,
        role: 'Landowner' as const,
        ownershipType: 'Mineral' as const,
        preferredContactMethod: 'Call' as const,
        source: 'Manual Entry',
        origination: 'User Input',
        totalNMA: contact.totalNMA || contact.netMineralAcres || 0, // Use NMA sum from API
        totalNRA: 0, // Would be calculated from linked tracts
        distressSignals: [], // Would be fetched separately
        linkedTractCount: 0,
        linkedUnitCount: 0,
        activeLeadCount: 0
      }));
      setContacts(enhancedContacts);
    } catch (error) {
      console.error('Failed to load contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = contacts.filter(contact => {
      // Search filter
      if (searchTerm && !contact.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !contact.city?.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Role filter
      if (filters.role && contact.role !== filters.role) return false;

      // Ownership type filter
      if (filters.ownershipType && contact.ownershipType !== filters.ownershipType) return false;

      // Contact type filter
      if (filters.contactType && contact.contactType !== filters.contactType) return false;

      // State filter
      if (filters.state && contact.state !== filters.state) return false;

      // County filter
      if (filters.county && contact.city !== filters.county) return false;

      // Distress signals filter
      if (filters.hasDistressSignals && contact.distressSignals.length === 0) return false;

      // Distress signal type filter
      if (filters.distressSignalType && 
          !contact.distressSignals.some(signal => signal.signalType === filters.distressSignalType)) {
        return false;
      }

      // Risk level filter
      if (filters.riskLevel && 
          !contact.distressSignals.some(signal => signal.riskLevel === filters.riskLevel)) {
        return false;
      }

      // Active leads filter
      if (filters.hasActiveLeads && contact.activeLeadCount === 0) return false;

      // Preferred contact method filter
      if (filters.preferredContactMethod && contact.preferredContactMethod !== filters.preferredContactMethod) return false;

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'totalNMA':
          aValue = a.totalNMA;
          bValue = b.totalNMA;
          break;
        case 'totalNRA':
          aValue = a.totalNRA;
          bValue = b.totalNRA;
          break;
        case 'lastContactedDate':
          aValue = a.lastContactedDate || '';
          bValue = b.lastContactedDate || '';
          break;
        case 'riskLevel':
          const aMaxRisk = Math.max(...a.distressSignals.map(s => ['Low', 'Medium', 'High', 'Critical'].indexOf(s.riskLevel)));
          const bMaxRisk = Math.max(...b.distressSignals.map(s => ['Low', 'Medium', 'High', 'Critical'].indexOf(s.riskLevel)));
          aValue = aMaxRisk;
          bValue = bMaxRisk;
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    setFilteredContacts(filtered);
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'Low': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'High': return 'bg-orange-100 text-orange-800';
      case 'Critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDistressSignalIcon = (signals: DistressSignal[]) => {
    if (signals.length === 0) return null;
    
    const criticalSignals = signals.filter(s => s.riskLevel === 'Critical');
    const highSignals = signals.filter(s => s.riskLevel === 'High');
    
    if (criticalSignals.length > 0) {
      return <ExclamationTriangleIcon className="h-5 w-5 text-red-600" title={`${criticalSignals.length} critical distress signals`} />;
    } else if (highSignals.length > 0) {
      return <ExclamationTriangleIcon className="h-5 w-5 text-orange-600" title={`${highSignals.length} high risk distress signals`} />;
    } else {
      return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" title={`${signals.length} distress signals`} />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-500">Loading owners...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header with white background and icon */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-teal-500 rounded-lg flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Owner Management</h1>
              <p className="text-gray-600 mt-1">
                Manage landowners, sellers, and individuals linked to mineral and non-op tracts
              </p>
            </div>
          </div>
          <Link to="/contacts/new">
            <Button className="flex items-center space-x-2">
              <PlusIcon className="h-4 w-4" />
              <span>Add Owner</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <div className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Input
                type="text"
                placeholder="Search owners by name, email, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            </div>

            {/* Filter Toggle */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2"
            >
              <FunnelIcon className="h-4 w-4" />
              <span>Filters</span>
            </Button>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sc-blue focus:border-transparent"
            >
              <option value="name">Sort by Name</option>
              <option value="totalNMA">Sort by Total NMA</option>
              <option value="totalNRA">Sort by Total NRA</option>
              <option value="lastContactedDate">Sort by Last Contact</option>
              <option value="riskLevel">Sort by Risk Level</option>
            </select>

            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sc-blue focus:border-transparent"
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <select
                  value={filters.role || ''}
                  onChange={(e) => setFilters({ ...filters, role: e.target.value as any || undefined })}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sc-blue focus:border-transparent"
                >
                  <option value="">All Roles</option>
                  <option value="Seller">Seller</option>
                  <option value="Landowner">Landowner</option>
                  <option value="Heir">Heir</option>
                  <option value="Attorney-in-Fact">Attorney-in-Fact</option>
                  <option value="Unknown">Unknown</option>
                </select>

                <select
                  value={filters.ownershipType || ''}
                  onChange={(e) => setFilters({ ...filters, ownershipType: e.target.value as any || undefined })}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sc-blue focus:border-transparent"
                >
                  <option value="">All Ownership Types</option>
                  <option value="Mineral">Mineral</option>
                  <option value="Royalty">Royalty</option>
                  <option value="NPRI">NPRI</option>
                  <option value="ORRI">ORRI</option>
                  <option value="Working Interest">Working Interest</option>
                </select>

                <select
                  value={filters.contactType || ''}
                  onChange={(e) => setFilters({ ...filters, contactType: e.target.value as any || undefined })}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sc-blue focus:border-transparent"
                >
                  <option value="">All Contact Types</option>
                  <option value="Landowner">Landowner</option>
                  <option value="Broker">Broker</option>
                  <option value="Attorney">Attorney</option>
                  <option value="Other">Other</option>
                </select>

                <select
                  value={filters.state || ''}
                  onChange={(e) => setFilters({ ...filters, state: e.target.value || undefined })}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sc-blue focus:border-transparent"
                >
                  <option value="">All States</option>
                  <option value="TX">Texas</option>
                  <option value="OK">Oklahoma</option>
                  <option value="NM">New Mexico</option>
                  <option value="LA">Louisiana</option>
                </select>

                <select
                  value={filters.hasDistressSignals ? 'true' : ''}
                  onChange={(e) => setFilters({ ...filters, hasDistressSignals: e.target.value === 'true' || undefined })}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sc-blue focus:border-transparent"
                >
                  <option value="">All Owners</option>
                  <option value="true">With Distress Signals</option>
                </select>

                <select
                  value={filters.distressSignalType || ''}
                  onChange={(e) => setFilters({ ...filters, distressSignalType: e.target.value as any || undefined })}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sc-blue focus:border-transparent"
                >
                  <option value="">All Signal Types</option>
                  <option value="Death">Death</option>
                  <option value="Bankruptcy">Bankruptcy</option>
                  <option value="Tax Lien">Tax Lien</option>
                  <option value="Judgment">Judgment</option>
                  <option value="Criminal">Criminal</option>
                  <option value="Indebtedness">Indebtedness</option>
                  <option value="Divorce">Divorce</option>
                  <option value="Foreclosure">Foreclosure</option>
                </select>

                <select
                  value={filters.riskLevel || ''}
                  onChange={(e) => setFilters({ ...filters, riskLevel: e.target.value as any || undefined })}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sc-blue focus:border-transparent"
                >
                  <option value="">All Risk Levels</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>

                <select
                  value={filters.preferredContactMethod || ''}
                  onChange={(e) => setFilters({ ...filters, preferredContactMethod: e.target.value as any || undefined })}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sc-blue focus:border-transparent"
                >
                  <option value="">All Contact Methods</option>
                  <option value="Call">Call</option>
                  <option value="Email">Email</option>
                  <option value="Text">Text</option>
                  <option value="Do Not Contact">Do Not Contact</option>
                </select>
              </div>

              {/* Clear Filters */}
              <div className="mt-4 flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setFilters({})}
                  className="text-gray-600 hover:text-gray-800"
                >
                  Clear All Filters
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Results Summary */}
      <div className="mb-4 text-sm text-gray-500">
        Showing {filteredContacts.length} of {contacts.length} owners
      </div>

      {/* Contacts Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role & Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Acres
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Distress Signals
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredContacts.map((contact) => (
                <tr key={contact.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <UserIcon className="h-5 w-5 text-gray-700" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          <Link 
                            to={`/contacts/${contact.id}`}
                            className="text-sc-blue hover:text-sc-blue-600"
                          >
                            {contact.name}
                          </Link>
                        </div>
                        <div className="text-sm text-gray-500">
                          {contact.city}, {contact.state}
                        </div>
                        {contact.email && (
                          <div className="text-xs text-gray-400">
                            {contact.email}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div className="font-medium">{contact.role}</div>
                      <div className="text-gray-500">{contact.ownershipType}</div>
                      <div className="text-xs text-gray-400">{contact.contactType}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div className="font-medium">
                        {contact.totalNMA ? contact.totalNMA.toLocaleString() : '0'} NMA
                      </div>
                      <div className="text-gray-500">
                        {contact.totalNRA ? contact.totalNRA.toLocaleString() : '0'} NRA
                      </div>
                      <div className="text-xs text-gray-400">
                        {contact.linkedTractCount} tracts
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getDistressSignalIcon(contact.distressSignals)}
                      {contact.distressSignals.length > 0 && (
                        <span className="text-sm text-gray-900">
                          {contact.distressSignals.length} signal{contact.distressSignals.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {contact.lastContactedDate ? (
                        <span>{new Date(contact.lastContactedDate).toLocaleDateString()}</span>
                      ) : (
                        <span className="text-gray-400">Never contacted</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col space-y-1">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        contact.preferredContactMethod === 'Do Not Contact' 
                          ? 'bg-red-100 text-red-800'
                          : contact.preferredContactMethod === 'Call'
                          ? 'bg-blue-100 text-blue-800'
                          : contact.preferredContactMethod === 'Email'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {contact.preferredContactMethod}
                      </span>
                      {contact.activeLeadCount > 0 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          {contact.activeLeadCount} active lead{contact.activeLeadCount !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <Link to={`/contacts/${contact.id}`}>
                        <Button variant="outline" size="sm">
                          View Profile
                        </Button>
                      </Link>
                      <Button variant="outline" size="sm">
                        <PhoneIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredContacts.length === 0 && (
          <div className="text-center py-12">
            <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No owners found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || Object.keys(filters).length > 0
                ? 'Try adjusting your search or filters.'
                : 'Get started by creating a new contact.'}
            </p>
            {!searchTerm && Object.keys(filters).length === 0 && (
              <div className="mt-6">
                <Link to="/contacts/new">
                  <Button>
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Contact
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default ContactsPage;
