import React, { useState, useEffect } from 'react';
import { fetchSections, fetchSectionOwners, fetchSectionPricing, fetchSectionDashboard } from '../services/api';

const SectionTestComponent: React.FC = () => {
  const [sections, setSections] = useState<any[]>([]);
  const [selectedSection, setSelectedSection] = useState<any>(null);
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

      // Load sections
      const sectionsResponse = await fetchSections();
      const sectionsData = sectionsResponse.data || sectionsResponse;
      setSections(sectionsData);

      // Load dashboard
      const dashboardData = await fetchSectionDashboard();
      setDashboard(dashboardData);

      // Select first section if available
      if (sectionsData.length > 0) {
        setSelectedSection(sectionsData[0]);
        await loadSectionDetails(sectionsData[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const loadSectionDetails = async (sectionId: string) => {
    try {
      const [ownersData, pricingData] = await Promise.all([
        fetchSectionOwners(sectionId),
        fetchSectionPricing(sectionId)
      ]);
      setOwners(ownersData);
      setPricing(pricingData);
    } catch (err) {
      console.error('Error loading section details:', err);
    }
  };

  const handleSectionSelect = async (section: any) => {
    setSelectedSection(section);
    await loadSectionDetails(section.id);
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
            <div className="text-2xl font-bold text-blue-600">{dashboard.totalSections || 0}</div>
            <div className="text-sm text-gray-600">Total Sections</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{dashboard.workingSections || 0}</div>
            <div className="text-sm text-gray-600">Working</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{dashboard.droppedSections || 0}</div>
            <div className="text-sm text-gray-600">Dropped</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{dashboard.newSections || 0}</div>
            <div className="text-sm text-gray-600">New</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sections List */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Sections ({sections.length})</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {sections.map((section) => (
              <div
                key={section.id}
                className={`p-3 border rounded cursor-pointer transition-colors ${
                  selectedSection?.id === section.id
                    ? 'bg-blue-100 border-blue-300'
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}
                onClick={() => handleSectionSelect(section)}
              >
                <div className="font-medium">{section.sectionName}</div>
                <div className="text-sm text-gray-600">
                  {section.state} - {section.county}
                </div>
                <div className="text-sm text-gray-500">
                  {section.grossAcres} acres • {section.numberOfOwners || 0} owners
                </div>
                <div className="text-xs text-gray-400">
                  Status: {section.titleStatus || 'Unknown'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Section Details */}
        {selectedSection && (
          <div>
            <h2 className="text-lg font-semibold mb-3">Section Details</h2>
            <div className="bg-white border rounded-lg p-4">
              <div className="space-y-2">
                <div><strong>ID:</strong> {selectedSection.id}</div>
                <div><strong>Name:</strong> {selectedSection.sectionName}</div>
                <div><strong>State:</strong> {selectedSection.state}</div>
                <div><strong>County:</strong> {selectedSection.county}</div>
                <div><strong>Legal Description:</strong> {selectedSection.legalDescription}</div>
                <div><strong>STR:</strong> {selectedSection.str}</div>
                <div><strong>Gross Acres:</strong> {selectedSection.grossAcres}</div>
                <div><strong>Net Mineral Acres:</strong> {selectedSection.netMineralAcres}</div>
                <div><strong>Number of Owners:</strong> {selectedSection.numberOfOwners}</div>
                <div><strong>Status:</strong> {selectedSection.titleStatus}</div>
                <div><strong>Assigned Buyer:</strong> {selectedSection.assignedBuyer || 'None'}</div>
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

export default SectionTestComponent;
