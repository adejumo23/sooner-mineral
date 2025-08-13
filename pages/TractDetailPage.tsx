import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Tract, User } from '../types';
import * as api from '../services/api';
import ContactsTab from '../components/ContactsTab';
import LeadsTab from '../components/LeadsTab';
import ArcGISMappingTab from '../components/ArcGISMappingTab';
import Button from '../components/ui/Button';

const TractDetailPage: React.FC = () => {
  const { tractId } = useParams<{ tractId: string }>();
  const navigate = useNavigate();
  const [tract, setTract] = useState<Tract | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'contacts' | 'mapping' | 'title-chain' | 'leads'>('overview');

  useEffect(() => {
    if (tractId) {
      fetchTractData();
    }
  }, [tractId]);

  const fetchTractData = async () => {
    setIsLoading(true);
    try {
      const [tractsData, usersData] = await Promise.all([
        api.fetchTracts(),
        api.fetchUsers()
      ]);
      
      const foundTract = tractsData.find(t => t.id === tractId);
      if (foundTract) {
        setTract(foundTract);
      } else {
        navigate('/tracts');
        return;
      }
      
      setUsers(usersData);
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
          <button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
            Edit Tract
          </button>
          <button className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2">
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
                    <span className="text-gray-600 text-sm">STR</span>
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
          <ContactsTab tractId={tract.id} users={users} />
        )}

        {activeTab === 'mapping' && (
          <ArcGISMappingTab tractId={tract.id} tractName={tract.tractName} />
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
    </div>
  );
};

export default TractDetailPage; 