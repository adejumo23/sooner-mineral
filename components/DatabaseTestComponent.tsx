import React, { useState, useEffect } from 'react';
import { 
  fetchTracts, 
  fetchContacts, 
  fetchLeads, 
  fetchAssignments,
  fetchTractOwners,
  fetchTractDashboard 
} from '../services/api';

const DatabaseTestComponent: React.FC = () => {
  const [tracts, setTracts] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [dashboard, setDashboard] = useState<any>({});
  const [selectedTract, setSelectedTract] = useState<any>(null);
  const [owners, setOwners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('tracts');

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load all data in parallel
      const [tractsData, contactsData, leadsData, assignmentsData, dashboardData] = await Promise.all([
        fetchTracts(),
        fetchContacts(),
        fetchLeads(),
        fetchAssignments(),
        fetchTractDashboard()
      ]);

      setTracts(tractsData);
      setContacts(contactsData);
      setLeads(leadsData);
      setAssignments(assignmentsData);
      setDashboard(dashboardData);

      // Select first tract if available
      if (tractsData.length > 0) {
        setSelectedTract(tractsData[0]);
        await loadTractOwners(tractsData[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const loadTractOwners = async (tractId: string) => {
    try {
      const ownersData = await fetchTractOwners(tractId);
      setOwners(ownersData);
    } catch (err) {
      console.error('Error loading tract owners:', err);
    }
  };

  const handleTractSelect = async (tract: any) => {
    setSelectedTract(tract);
    await loadTractOwners(tract.id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading database data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-600">
        <h2 className="text-xl font-bold mb-2">Database Error</h2>
        <p>{error}</p>
        <button 
          onClick={loadAllData}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Database Integration Test</h1>
      
      {/* Dashboard Summary */}
      <div className="bg-gray-100 p-6 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-4">Dashboard Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{dashboard.totalTracts || 0}</div>
            <div className="text-sm text-gray-600">Total Tracts</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{dashboard.workingTracts || 0}</div>
            <div className="text-sm text-gray-600">Working</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600">{dashboard.droppedTracts || 0}</div>
            <div className="text-sm text-gray-600">Dropped</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-600">{dashboard.newTracts || 0}</div>
            <div className="text-sm text-gray-600">New</div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{dashboard.assignedTracts || 0}</div>
            <div className="text-sm text-gray-600">Assigned</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">{dashboard.totalGrossAcres || 0}</div>
            <div className="text-sm text-gray-600">Gross Acres</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-pink-600">${dashboard.avgNraPrice || 0}</div>
            <div className="text-sm text-gray-600">Avg NRA Price</div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="flex space-x-1 bg-gray-200 p-1 rounded-lg">
          {[
            { id: 'tracts', label: 'Tracts', count: tracts.length },
            { id: 'contacts', label: 'Contacts', count: contacts.length },
            { id: 'leads', label: 'Leads', count: leads.length },
            { id: 'assignments', label: 'Assignments', count: assignments.length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white border rounded-lg p-6">
        {activeTab === 'tracts' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Tracts ({tracts.length})</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {tracts.map((tract) => (
                  <div
                    key={tract.id}
                    className={`p-3 border rounded cursor-pointer transition-colors ${
                      selectedTract?.id === tract.id
                        ? 'bg-blue-100 border-blue-300'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                    onClick={() => handleTractSelect(tract)}
                  >
                    <div className="font-medium">{tract.tract_name}</div>
                    <div className="text-sm text-gray-600">
                      {tract.state} - {tract.county}
                    </div>
                    <div className="text-sm text-gray-500">
                      {tract.gross_acres} acres • {tract.title_status}
                    </div>
                  </div>
                ))}
              </div>

              {selectedTract && (
                <div>
                  <h3 className="font-medium mb-3">Tract Details</h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>ID:</strong> {selectedTract.id}</div>
                    <div><strong>Name:</strong> {selectedTract.tract_name}</div>
                    <div><strong>State:</strong> {selectedTract.state}</div>
                    <div><strong>County:</strong> {selectedTract.county}</div>
                    <div><strong>Legal Description:</strong> {selectedTract.legal_description}</div>
                    <div><strong>STR:</strong> {selectedTract.str}</div>
                    <div><strong>Gross Acres:</strong> {selectedTract.gross_acres}</div>
                    <div><strong>Net Mineral Acres:</strong> {selectedTract.net_mineral_acres}</div>
                    <div><strong>Status:</strong> {selectedTract.title_status}</div>
                    <div><strong>NRA Cap USD:</strong> ${selectedTract.nra_cap_usd}</div>
                  </div>

                  {/* Owners */}
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Owners ({owners.length})</h4>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {owners.map((owner, index) => (
                        <div key={index} className="text-sm bg-gray-50 p-2 rounded">
                          <div className="font-medium">{owner.name}</div>
                          <div className="text-gray-600">
                            {owner.ownership_percentage * 100}% • {owner.net_mineral_acres} NMA
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'contacts' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Contacts ({contacts.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {contacts.map((contact) => (
                <div key={contact.id} className="border rounded-lg p-4">
                  <div className="font-medium">{contact.name}</div>
                  <div className="text-sm text-gray-600">{contact.contact_type}</div>
                  <div className="text-sm text-gray-500">{contact.email}</div>
                  <div className="text-sm text-gray-500">{contact.phone}</div>
                  <div className="text-sm text-gray-500">{contact.city}, {contact.state}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'leads' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Leads ({leads.length})</h2>
            <div className="space-y-4">
              {leads.map((lead) => (
                <div key={lead.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{lead.lead_name}</div>
                      <div className="text-sm text-gray-600">{lead.lead_type} • {lead.source}</div>
                      <div className="text-sm text-gray-500">
                        {lead.tract_name} • {lead.contact_name}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        lead.status === 'New' ? 'bg-blue-100 text-blue-800' :
                        lead.status === 'Qualified' ? 'bg-green-100 text-green-800' :
                        lead.status === 'Closed Won' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {lead.status}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {lead.priority} • {lead.probability_percentage}%
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    Estimated Value: ${lead.estimated_value} • 
                    Expected Close: {lead.expected_close_date}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'assignments' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Assignments ({assignments.length})</h2>
            <div className="space-y-4">
              {assignments.map((assignment) => (
                <div key={assignment.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{assignment.tract_name}</div>
                      <div className="text-sm text-gray-600">
                        {assignment.assigned_to_name} • {assignment.assignment_type}
                      </div>
                      <div className="text-sm text-gray-500">
                        {assignment.state} - {assignment.county}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        assignment.status === 'Active' ? 'bg-green-100 text-green-800' :
                        assignment.status === 'Completed' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {assignment.status}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {assignment.priority} • Due: {assignment.due_date}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    {assignment.instructions}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DatabaseTestComponent;
