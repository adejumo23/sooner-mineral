import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import type { Tract, User, TitleStatus } from '../types';
import * as api from '../services/api';
import LeadsTab from '../components/LeadsTab';
import ArcGISMappingTab from '../components/ArcGISMappingTab';
import Button from '../components/ui/Button';

const TractDetailPage: React.FC = () => {
  const { tractId } = useParams<{ tractId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [tract, setTract] = useState<Tract | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'contacts' | 'mapping' | 'title-chain' | 'leads'>('overview');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (tractId) {
      fetchTractData();
    }
  }, [tractId]);

  useEffect(() => {
    // Check if there's a tab query parameter and set the active tab
    const tabParam = searchParams.get('tab');
    if (tabParam && ['overview', 'contacts', 'mapping', 'title-chain', 'leads'].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }
  }, [searchParams]);

  const fetchTractData = async () => {
    setIsLoading(true);
    try {
      const [tractsData, usersData, contactsData] = await Promise.all([
        api.fetchTracts(),
        api.fetchUsers(),
        api.fetchTractContacts(tractId!)
      ]);
      
      const foundTract = tractsData.find(t => t.id === tractId);
      if (foundTract) {
        setTract(foundTract);
      } else {
        navigate('/tracts');
        return;
      }
      
      setUsers(usersData);
      setContacts(contactsData);
    } catch (error) {
      console.error('Failed to fetch tract data:', error);
      navigate('/tracts');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="text-center text-gray-600">Loading tract details...</div>;
  }

  if (!tract) {
    return <div className="text-center text-gray-600">Tract not found</div>;
  }

  const formatPercentage = (value?: number): string => {
    return value ? `${(value * 100).toFixed(2)}%` : 'N/A';
  };

  const formatAcres = (value?: number): string => {
    return value ? value.toFixed(2) : 'N/A';
  };

  const handleEditTract = () => {
    setIsEditModalOpen(true);
  };

  const handleExportTract = () => {
    if (!tract) return;

    // Prepare the data for export
    const exportData = {
      'Tract Name': tract.tractName,
      'State': tract.state,
      'County': tract.county,
      'Legal Description': tract.legalDescription,
      'STR': tract.str || '',
      'Section Number': tract.sectionNumber || '',
      'Township': tract.township || '',
      'Range': tract.range || '',
      'Abstract Number': tract.abstractNumber || '',
      'ANUM': tract.anum || '',
      'Gross Acres': tract.grossAcres,
      'Net Mineral Acres': tract.netMineralAcres || '',
      'Royalty': tract.royalty || '',
      'Ownership Percentage': tract.ownershipPercentage || '',
      'Title Status': tract.titleStatus,
      'Assigned Buyer': tract.assignedBuyer?.name || 'Unassigned',
      'NRA Cap USD': tract.nraCapUsd || '',
      'Source Channel': tract.sourceChannel || '',
      'Routing Notes': tract.routingNotes || '',
      'Held by Fund': tract.heldByFund ? 'Yes' : 'No',
      'Is Locked': tract.isLocked ? 'Yes' : 'No',
      'Created At': tract.createdAt || '',
      'Updated At': tract.updatedAt || ''
    };

    // Convert to CSV
    const headers = Object.keys(exportData);
    const values = Object.values(exportData);
    const csvContent = [headers.join(','), values.map(v => `"${v}"`).join(',')].join('\n');

    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${tract.tractName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_tract_export.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
  };

  const handleSaveTract = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!tract) return;

    setIsSaving(true);
    try {
      const formData = new FormData(e.currentTarget);
      
      const tractData: Partial<Tract> = {
        tractName: formData.get('tractName') as string,
        state: formData.get('state') as string,
        county: formData.get('county') as string,
        legalDescription: formData.get('legalDescription') as string,
        str: formData.get('str') as string || undefined,
        sectionNumber: formData.get('sectionNumber') as string || undefined,
        township: formData.get('township') as string || undefined,
        range: formData.get('range') as string || undefined,
        abstractNumber: formData.get('abstractNumber') as string || undefined,
        anum: formData.get('anum') as string || undefined,
        grossAcres: parseFloat(formData.get('grossAcres') as string) || undefined,
        netMineralAcres: parseFloat(formData.get('netMineralAcres') as string) || undefined,
        royalty: (parseFloat(formData.get('royalty') as string) || 0) / 100,
        ownershipPercentage: (parseFloat(formData.get('ownershipPercentage') as string) || 0) / 100,
        titleStatus: formData.get('titleStatus') as TitleStatus,
        nraCapUsd: parseFloat(formData.get('nraCapUsd') as string) || undefined,
        sourceChannel: formData.get('sourceChannel') as string || undefined,
        routingNotes: formData.get('routingNotes') as string || undefined,
        heldByFund: formData.has('heldByFund'),
        isLocked: formData.has('isLocked'),
      };

      await api.updateTract(tract.id, tractData);
      
      // Update local state
      setTract({ ...tract, ...tractData });
      setIsEditModalOpen(false);
      
      // Show success message
      alert('Tract updated successfully!');
    } catch (error) {
      console.error('Failed to update tract:', error);
      alert('Failed to update tract. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'contacts', label: 'Contacts' },
    { id: 'mapping', label: 'Mapping' },
    { id: 'title-chain', label: 'Title Chain' },
    { id: 'leads', label: 'Leads' }
  ] as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <button
            onClick={() => navigate('/tracts')}
            className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold rounded-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
            style={{ backgroundColor: '#fbbf24' }}
          >
            ← Back to Tracts
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">{tract.tractName}</h1>
          <p className="text-gray-600 mt-2">
            {tract.state}, {tract.county} • {tract.titleStatus}
          </p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={handleEditTract}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Edit Tract
          </button>
          <button 
            onClick={handleExportTract}
            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Export
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <span className="text-gray-600 text-sm">Tract Name</span>
                  <div className="text-gray-900 font-medium">{tract.tractName}</div>
                </div>
                <div>
                  <span className="text-gray-600 text-sm">State</span>
                  <div className="text-gray-900 font-medium">{tract.state}</div>
                </div>
                <div>
                  <span className="text-gray-600 text-sm">County</span>
                  <div className="text-gray-900 font-medium">{tract.county}</div>
                </div>
                <div>
                  <span className="text-gray-600 text-sm">Title Status</span>
                  <div className="text-gray-900 font-medium">{tract.titleStatus}</div>
                </div>
                <div>
                  <span className="text-gray-600 text-sm">Assigned Buyer</span>
                  <div className="text-gray-900 font-medium">{tract.assignedBuyer?.name || 'Unassigned'}</div>
                </div>
                <div>
                  <span className="text-gray-600 text-sm">Source Channel</span>
                  <div className="text-gray-900 font-medium">{tract.sourceChannel || 'N/A'}</div>
                </div>
              </div>
            </div>

            {/* Legal Information */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Legal Information</h3>
              <div className="space-y-4">
                <div>
                  <span className="text-gray-600 text-sm">Legal Description</span>
                  <div className="text-gray-900 mt-1">{tract.legalDescription}</div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <span className="text-gray-600 text-sm">STR (Combined)</span>
                    <div className="text-gray-900 font-medium">{tract.str || 'N/A'}</div>
                  </div>
                  <div>
                    <span className="text-gray-600 text-sm">Abstract Number</span>
                    <div className="text-gray-900 font-medium">{tract.abstractNumber || 'N/A'}</div>
                  </div>
                  <div>
                    <span className="text-gray-600 text-sm">ANUM</span>
                    <div className="text-gray-900 font-medium">{tract.anum || 'N/A'}</div>
                  </div>
                </div>
                
                {/* STR Breakdown */}
                <div className="mt-4">
                  <h4 className="text-md font-medium text-gray-900 mb-3">STR Breakdown</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <span className="text-gray-600 text-sm">Section Number</span>
                      <div className="text-gray-900 font-medium">{tract.sectionNumber || 'N/A'}</div>
                    </div>
                    <div>
                      <span className="text-gray-600 text-sm">Township</span>
                      <div className="text-gray-900 font-medium">{tract.township || 'N/A'}</div>
                    </div>
                    <div>
                      <span className="text-gray-600 text-sm">Range</span>
                      <div className="text-gray-900 font-medium">{tract.range || 'N/A'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Acreage & Financial */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Acreage & Financial</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <span className="text-gray-600 text-sm">Gross Acres</span>
                  <div className="text-gray-900 font-medium">{formatAcres(tract.grossAcres)}</div>
                </div>
                <div>
                  <span className="text-gray-600 text-sm">Net Mineral Acres</span>
                  <div className="text-gray-900 font-medium">{formatAcres(tract.netMineralAcres)}</div>
                </div>
                <div>
                  <span className="text-gray-600 text-sm">Royalty %</span>
                  <div className="text-gray-900 font-medium">{formatPercentage(tract.royalty)}</div>
                </div>
                <div>
                  <span className="text-gray-600 text-sm">Ownership %</span>
                  <div className="text-gray-900 font-medium">{formatPercentage(tract.ownershipPercentage)}</div>
                </div>
                <div>
                  <span className="text-gray-600 text-sm">NRA (1/8 normalized)</span>
                  <div className="text-gray-900 font-medium">{formatAcres(tract.nra)}</div>
                </div>
                <div>
                  <span className="text-gray-600 text-sm">$/NRA Cap</span>
                  <div className="text-gray-900 font-medium">
                    {tract.nraCapUsd ? `$${tract.nraCapUsd.toLocaleString()}` : 'N/A'}
                  </div>
                </div>
              </div>
            </div>

            {/* Notes & Flags */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes & Flags</h3>
              <div className="space-y-4">
                <div>
                  <span className="text-gray-600 text-sm">Routing Notes</span>
                  <div className="text-gray-900 mt-1">{tract.routingNotes || 'No notes'}</div>
                </div>
                <div className="flex space-x-6">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={tract.heldByFund} 
                      disabled 
                      className="h-4 w-4 rounded border-gray-300 text-gray-600 focus:ring-gray-600" 
                    />
                    <span className="text-sm text-gray-600">Held by Fund</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={tract.isLocked} 
                      disabled 
                      className="h-4 w-4 rounded border-gray-300 text-gray-600 focus:ring-gray-600" 
                    />
                    <span className="text-sm text-gray-600">Lock Flag</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'contacts' && (
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Tract Contacts</h3>
              <div className="text-sm text-gray-500">
                {contacts.length} contact{contacts.length !== 1 ? 's' : ''} found
              </div>
            </div>
            
            {contacts.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <p>No contacts found for this tract.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {contacts.map((contact, index) => (
                  <div key={contact.id || index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Contact Information */}
                      <div className="space-y-2">
                        <h4 className="font-medium text-gray-900">{contact.name}</h4>
                        {contact.contact && (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Contact:</span> {contact.contact}
                          </p>
                        )}
                        {contact.phoneEmail && (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Phone/Email:</span> {contact.phoneEmail}
                          </p>
                        )}
                      </div>
                      
                      {/* Address Information */}
                      <div className="space-y-2">
                        {(contact.street || contact.city || contact.state || contact.zip) && (
                          <div>
                            <span className="font-medium text-gray-900 text-sm">Address:</span>
                            <div className="text-sm text-gray-600">
                              {contact.street && <div>{contact.street}</div>}
                              {(contact.city || contact.state || contact.zip) && (
                                <div>
                                  {contact.city && contact.city}
                                  {contact.city && contact.state && ', '}
                                  {contact.state && contact.state}
                                  {contact.zip && ` ${contact.zip}`}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Ownership Information */}
                      <div className="space-y-2">
                        {(contact.nma || contact.royalty || contact.allocation) && (
                          <div>
                            <span className="font-medium text-gray-900 text-sm">Ownership:</span>
                            <div className="text-sm text-gray-600 space-y-1">
                              {contact.nma && (
                                <div>NMA: {parseFloat(contact.nma).toFixed(2)}</div>
                              )}
                              {contact.royalty && (
                                <div>Royalty: {parseFloat(contact.royalty).toFixed(2)}%</div>
                              )}
                              {contact.allocation && (
                                <div>Allocation: {parseFloat(contact.allocation).toFixed(2)}%</div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'mapping' && (
          <ArcGISMappingTab 
            tractId={tract.id} 
            tractName={tract.tractName}
            tract={{
              sectionNumber: tract.sectionNumber,
              township: tract.township,
              range: tract.range,
              county: tract.county,
              state: tract.state,
              str: tract.str
            }}
          />
        )}

        {activeTab === 'title-chain' && (
          <div className="text-center text-gray-600 py-12">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Title Chain</h3>
            <p>Title chain functionality coming soon...</p>
          </div>
        )}

        {activeTab === 'leads' && (
          <LeadsTab tractId={tract.id} users={users} />
        )}
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Edit Tract</h2>
                <button
                  onClick={handleCloseEditModal}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSaveTract} className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tract Name *
                    </label>
                    <input
                      type="text"
                      name="tractName"
                      defaultValue={tract.tractName}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State *
                    </label>
                    <input
                      type="text"
                      name="state"
                      defaultValue={tract.state}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      County *
                    </label>
                    <input
                      type="text"
                      name="county"
                      defaultValue={tract.county}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title Status *
                    </label>
                    <select
                      name="titleStatus"
                      defaultValue={tract.titleStatus}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Verified">Verified</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Failed">Failed</option>
                      <option value="Verified with Curative Requirements">Verified with Curative Requirements</option>
                      <option value="Unmapped">Unmapped</option>
                    </select>
                  </div>
                </div>

                {/* Legal Information */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Legal Description
                  </label>
                  <textarea
                    name="legalDescription"
                    defaultValue={tract.legalDescription}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      STR (Combined)
                    </label>
                    <input
                      type="text"
                      name="str"
                      defaultValue={tract.str}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Section Number
                    </label>
                    <input
                      type="text"
                      name="sectionNumber"
                      defaultValue={tract.sectionNumber}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Abstract Number
                    </label>
                    <input
                      type="text"
                      name="abstractNumber"
                      defaultValue={tract.abstractNumber}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Township
                    </label>
                    <input
                      type="text"
                      name="township"
                      defaultValue={tract.township}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Range
                    </label>
                    <input
                      type="text"
                      name="range"
                      defaultValue={tract.range}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ANUM
                    </label>
                    <input
                      type="text"
                      name="anum"
                      defaultValue={tract.anum}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Acreage & Financial */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gross Acres
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="grossAcres"
                      defaultValue={tract.grossAcres}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Net Mineral Acres
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="netMineralAcres"
                      defaultValue={tract.netMineralAcres}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Royalty %
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="royalty"
                      defaultValue={tract.royalty ? (tract.royalty * 100).toFixed(2) : ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ownership %
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="ownershipPercentage"
                      defaultValue={tract.ownershipPercentage ? (tract.ownershipPercentage * 100).toFixed(2) : ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      $/NRA Cap
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="nraCapUsd"
                      defaultValue={tract.nraCapUsd}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Source Channel
                    </label>
                    <input
                      type="text"
                      name="sourceChannel"
                      defaultValue={tract.sourceChannel}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Notes & Flags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Routing Notes
                  </label>
                  <textarea
                    name="routingNotes"
                    defaultValue={tract.routingNotes}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex space-x-6">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="heldByFund"
                      defaultChecked={tract.heldByFund}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Held by Fund</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="isLocked"
                      defaultChecked={tract.isLocked}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Lock Flag</span>
                  </label>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleCloseEditModal}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TractDetailPage; 