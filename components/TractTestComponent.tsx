import React, { useState, useEffect } from 'react';
import { fetchTracts, fetchTractOwners, fetchTractPricing, fetchTractDashboard } from '../services/api';

const TractTestComponent: React.FC = () => {
  const [tracts, setTracts] = useState<any[]>([]);
  const [selectedTract, setSelectedTract] = useState<any>(null);
  const [owners, setOwners] = useState<any[]>([]);
  const [pricing, setPricing] = useState<any[]>([]);
  const [dashboard, setDashboard] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load tracts
      const tractsData = await fetchTracts();
      setTracts(tractsData);

      // Load dashboard
      const dashboardData = await fetchTractDashboard();
      setDashboard(dashboardData);

      // Select first tract if available
      if (tractsData.length > 0) {
        setSelectedTract(tractsData[0]);
        await loadTractDetails(tractsData[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const loadTractDetails = async (tractId: string) => {
    try {
      const [ownersData, pricingData] = await Promise.all([
        fetchTractOwners(tractId),
        fetchTractPricing(tractId)
      ]);
      setOwners(ownersData);
      setPricing(pricingData);
    } catch (err) {
      console.error('Error loading tract details:', err);
    }
  };

  const handleTractSelect = async (tract: any) => {
    setSelectedTract(tract);
    await loadTractDetails(tract.id);
  };

  if (loading) {
    return <div className="p-4">Loading normalized data...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">Error: {error}</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Normalized Database Test</h1>
      
      {/* Dashboard Summary */}
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-3">Dashboard Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{dashboard.totalTracts || 0}</div>
            <div className="text-sm text-gray-600">Total Tracts</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{dashboard.workingTracts || 0}</div>
            <div className="text-sm text-gray-600">Working</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{dashboard.droppedTracts || 0}</div>
            <div className="text-sm text-gray-600">Dropped</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{dashboard.newTracts || 0}</div>
            <div className="text-sm text-gray-600">New</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tracts List */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Tracts ({tracts.length})</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {tracts.map((tract) => (
              <div
                key={tract.id}
                className={`p-3 border rounded cursor-pointer transition-colors ${
                  selectedTract?.id === tract.id
                    ? 'bg-blue-100 border-blue-300'
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}
                onClick={() => handleTractSelect(tract)}
              >
                <div className="font-medium">{tract.tractName}</div>
                <div className="text-sm text-gray-600">
                  {tract.state} - {tract.county}
                </div>
                <div className="text-sm text-gray-500">
                  {tract.grossAcres} acres • {tract.numberOfOwners || 0} owners
                </div>
                <div className="text-xs text-gray-400">
                  Status: {tract.titleStatus || 'Unknown'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Tract Details */}
        {selectedTract && (
          <div>
            <h2 className="text-lg font-semibold mb-3">Tract Details</h2>
            <div className="bg-white border rounded-lg p-4">
              <div className="space-y-2">
                <div><strong>ID:</strong> {selectedTract.id}</div>
                <div><strong>Name:</strong> {selectedTract.tractName}</div>
                <div><strong>State:</strong> {selectedTract.state}</div>
                <div><strong>County:</strong> {selectedTract.county}</div>
                <div><strong>Legal Description:</strong> {selectedTract.legalDescription}</div>
                <div><strong>STR:</strong> {selectedTract.str}</div>
                <div><strong>Gross Acres:</strong> {selectedTract.grossAcres}</div>
                <div><strong>Net Mineral Acres:</strong> {selectedTract.netMineralAcres}</div>
                <div><strong>Number of Owners:</strong> {selectedTract.numberOfOwners}</div>
                <div><strong>Status:</strong> {selectedTract.titleStatus}</div>
                <div><strong>Assigned Buyer:</strong> {selectedTract.assignedBuyer || 'None'}</div>
              </div>

              {/* Owners */}
              <div className="mt-4">
                <h3 className="font-medium mb-2">Owners ({owners.length})</h3>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {owners.map((owner, index) => (
                    <div key={index} className="text-sm bg-gray-50 p-2 rounded">
                      <div className="font-medium">{owner.legalName}</div>
                      <div className="text-gray-600">
                        {owner.netMineralAcres} NMA • {owner.royaltyPercentage ? (owner.royaltyPercentage * 100).toFixed(2) + '%' : 'N/A'} royalty
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing */}
              <div className="mt-4">
                <h3 className="font-medium mb-2">Formation Pricing ({pricing.length})</h3>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {pricing.map((price, index) => (
                    <div key={index} className="text-sm bg-gray-50 p-2 rounded">
                      <div className="font-medium">{price.formationName}</div>
                      <div className="text-gray-600">
                        ${price.pricePerAcre?.toLocaleString() || 'N/A'} per acre
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TractTestComponent;
