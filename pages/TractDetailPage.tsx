import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Tract, User } from '../types';
import * as api from '../services/api';
import ContactsTab from '../components/ContactsTab';
import LeadsTab from '../components/LeadsTab';
import MappingTab from '../components/MappingTab';
import Button from '../components/ui/Button';

const TractDetailPage: React.FC = () => {
  const { tractId } = useParams<{ tractId: string }>();
  const navigate = useNavigate();
  const [tract, setTract] = useState<Tract | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'contacts' | 'title-chain' | 'leads'>('overview');

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
    return <div className="text-center text-sc-slate">Loading tract details...</div>;
  }

  if (!tract) {
    return <div className="text-center text-sc-slate">Tract not found</div>;
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
          <Button variant="secondary" onClick={() => navigate('/tracts')}>
            ← Back to Tracts
          </Button>
          <h1 className="text-3xl font-bold text-white mt-4">{tract.tractName}</h1>
          <p className="text-sc-slate mt-2">
            {tract.state}, {tract.county} • {tract.titleStatus}
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="secondary">Edit Tract</Button>
          <Button>Export</Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-sc-light-navy">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-sc-blue text-sc-blue'
                  : 'border-transparent text-sc-slate hover:text-sc-light-slate hover:border-sc-light-slate'
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
            <div className="bg-sc-light-navy p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <span className="text-sc-slate text-sm">Tract Name</span>
                  <div className="text-white font-medium">{tract.tractName}</div>
                </div>
                <div>
                  <span className="text-sc-slate text-sm">State</span>
                  <div className="text-white font-medium">{tract.state}</div>
                </div>
                <div>
                  <span className="text-sc-slate text-sm">County</span>
                  <div className="text-white font-medium">{tract.county}</div>
                </div>
                <div>
                  <span className="text-sc-slate text-sm">Title Status</span>
                  <div className="text-white font-medium">{tract.titleStatus}</div>
                </div>
                <div>
                  <span className="text-sc-slate text-sm">Assigned Buyer</span>
                  <div className="text-white font-medium">{tract.assignedBuyer?.name || 'Unassigned'}</div>
                </div>
                <div>
                  <span className="text-sc-slate text-sm">Source Channel</span>
                  <div className="text-white font-medium">{tract.sourceChannel || 'N/A'}</div>
                </div>
              </div>
            </div>

            {/* Legal Information */}
            <div className="bg-sc-light-navy p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-4">Legal Information</h3>
              <div className="space-y-4">
                <div>
                  <span className="text-sc-slate text-sm">Legal Description</span>
                  <div className="text-white mt-1">{tract.legalDescription}</div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <span className="text-sc-slate text-sm">STR</span>
                    <div className="text-white font-medium">{tract.str || 'N/A'}</div>
                  </div>
                  <div>
                    <span className="text-sc-slate text-sm">Abstract Number</span>
                    <div className="text-white font-medium">{tract.abstractNumber || 'N/A'}</div>
                  </div>
                  <div>
                    <span className="text-sc-slate text-sm">ANUM</span>
                    <div className="text-white font-medium">{tract.anum || 'N/A'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Acreage & Financial */}
            <div className="bg-sc-light-navy p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-4">Acreage & Financial</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <span className="text-sc-slate text-sm">Gross Acres</span>
                  <div className="text-white font-medium">{formatAcres(tract.grossAcres)}</div>
                </div>
                <div>
                  <span className="text-sc-slate text-sm">Net Mineral Acres</span>
                  <div className="text-white font-medium">{formatAcres(tract.netMineralAcres)}</div>
                </div>
                <div>
                  <span className="text-sc-slate text-sm">Royalty %</span>
                  <div className="text-white font-medium">{formatPercentage(tract.royalty)}</div>
                </div>
                <div>
                  <span className="text-sc-slate text-sm">Ownership %</span>
                  <div className="text-white font-medium">{formatPercentage(tract.ownershipPercentage)}</div>
                </div>
                <div>
                  <span className="text-sc-slate text-sm">NRA (1/8 normalized)</span>
                  <div className="text-white font-medium">{formatAcres(tract.nra)}</div>
                </div>
                <div>
                  <span className="text-sc-slate text-sm">$/NRA Cap</span>
                  <div className="text-white font-medium">
                    {tract.nraCapUsd ? `$${tract.nraCapUsd.toLocaleString()}` : 'N/A'}
                  </div>
                </div>
              </div>
            </div>

            {/* Notes & Flags */}
            <div className="bg-sc-light-navy p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-4">Notes & Flags</h3>
              <div className="space-y-4">
                <div>
                  <span className="text-sc-slate text-sm">Routing Notes</span>
                  <div className="text-white mt-1">{tract.routingNotes || 'No notes'}</div>
                </div>
                <div className="flex space-x-6">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={tract.heldByFund} 
                      disabled 
                      className="h-4 w-4 rounded border-gray-300 text-sc-blue focus:ring-sc-blue" 
                    />
                    <span className="text-sm text-sc-slate">Held by Fund</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={tract.isLocked} 
                      disabled 
                      className="h-4 w-4 rounded border-gray-300 text-sc-blue focus:ring-sc-blue" 
                    />
                    <span className="text-sm text-sc-slate">Lock Flag</span>
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
          <MappingTab tractId={tract.id} tractName={tract.tractName} />
        )}

        {activeTab === 'title-chain' && (
          <div className="text-center text-sc-slate py-12">
            <h3 className="text-lg font-semibold text-white mb-2">Title Chain</h3>
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