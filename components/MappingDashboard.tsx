import React, { useState, useEffect, useRef } from 'react';
import { MapIcon, FilterIcon, EyeIcon, EyeSlashIcon, DownloadIcon, UserGroupIcon, CubeIcon, MapPinIcon, ChevronDownIcon, ChevronUpIcon } from './icons/Icons';
import type { MapAsset, MapFilter, MapSelection, MapOverlay, MapLayerConfig, User } from '../types';
import * as api from '../services/api';
import * as arcgis from '../services/arcgis';

interface MappingDashboardProps {
  currentUser: User;
}

const MappingDashboard: React.FC<MappingDashboardProps> = ({ currentUser }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapView, setMapView] = useState<any>(null);
  const [assets, setAssets] = useState<MapAsset[]>([]);
  const [overlays, setOverlays] = useState<MapOverlay[]>([]);
  const [layerConfigs, setLayerConfigs] = useState<MapLayerConfig[]>([]);
  const [filters, setFilters] = useState<MapFilter>({});
  const [filterOptions, setFilterOptions] = useState<any>(null);
  const [selectedAssets, setSelectedAssets] = useState<MapAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(true);
  const [showLegend, setShowLegend] = useState(true);
  const [basemapType, setBasemapType] = useState<'streets' | 'satellite'>('streets');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeMap();
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (filters && Object.keys(filters).length > 0) {
      fetchAssets();
    }
  }, [filters]);

  useEffect(() => {
    if (mapView && assets.length > 0) {
      addLayersToMap(assets, overlays);
    }
  }, [mapView, assets, overlays]);

  useEffect(() => {
    if (mapView && assets.length > 0) {
      addLayersToMap(assets, overlays);
    }
  }, [mapView, assets, overlays]);

  const initializeMap = async () => {
    if (!mapRef.current) return;

    try {
      const container = mapRef.current;
      const view = await arcgis.createMapView(container);
      setMapView(view);
    } catch (error) {
      console.error('Failed to initialize map:', error);
      setError('Failed to initialize map. Please refresh the page.');
    }
  };

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [assetsData, overlaysData, configsData, optionsData] = await Promise.all([
        api.fetchMapAssets(),
        api.fetchMapOverlays(),
        api.fetchMapLayerConfigs(),
        api.getMapFilterOptions()
      ]);

      setAssets(assetsData);
      setOverlays(overlaysData);
      setLayerConfigs(configsData);
      setFilterOptions(optionsData);

      // Add layers to map if map is initialized
      if (mapView) {
        await addLayersToMap(assetsData, overlaysData);
      }
    } catch (error) {
      console.error('Failed to fetch initial data:', error);
      setError('Failed to load map data.');
    } finally {
      setIsLoading(false);
    }
  };

  const addLayersToMap = async (assetsData: MapAsset[], overlaysData: MapOverlay[]) => {
    if (!mapView) return;

    try {
      // Create and add tract layer
      const tractAssets = assetsData.filter(a => a.assetType === 'Tract');
      if (tractAssets.length > 0) {
        const tractLayer = await arcgis.createTractLayerForMap(tractAssets);
        await arcgis.addLayerToMap(mapView, tractLayer);
      }

      // Create and add unit layer
      const unitAssets = assetsData.filter(a => a.assetType === 'Unit');
      if (unitAssets.length > 0) {
        const unitLayer = await arcgis.createUnitLayerForMap(unitAssets);
        await arcgis.addLayerToMap(mapView, unitLayer);
      }

      // Create and add overlay layers
      if (overlaysData.length > 0) {
        const wellsLayer = await arcgis.createWellsLayer(overlaysData.filter(o => o.type === 'wells').flatMap(o => o.data || []));
        await arcgis.addLayerToMap(mapView, wellsLayer);

        const permitsLayer = await arcgis.createPermitsLayer(overlaysData.filter(o => o.type === 'permits').flatMap(o => o.data || []));
        await arcgis.addLayerToMap(mapView, permitsLayer);

        const rigsLayer = await arcgis.createRigsLayer(overlaysData.filter(o => o.type === 'rigs').flatMap(o => o.data || []));
        await arcgis.addLayerToMap(mapView, rigsLayer);

        const distressLayer = await arcgis.createDistressSignalsLayer(overlaysData.filter(o => o.type === 'distress').flatMap(o => o.data || []));
        await arcgis.addLayerToMap(mapView, distressLayer);
      }
    } catch (error) {
      console.error('Failed to add layers to map:', error);
    }
  };

  const fetchAssets = async () => {
    try {
      const assetsData = await api.fetchMapAssets(filters);
      setAssets(assetsData);
    } catch (error) {
      console.error('Failed to fetch assets:', error);
    }
  };

  const handleFilterChange = (key: keyof MapFilter, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  const handleAssetClick = (asset: MapAsset) => {
    setSelectedAssets(prev => {
      const isSelected = prev.some(a => a.id === asset.id);
      if (isSelected) {
        return prev.filter(a => a.id !== asset.id);
      } else {
        return [...prev, asset];
      }
    });
  };

  const handleBulkAssignment = async () => {
    if (selectedAssets.length === 0) return;

    try {
      // Log the interaction
      await api.logMapInteraction({
        userId: currentUser.id,
        action: 'assign',
        details: `Bulk assignment of ${selectedAssets.length} assets`,
        selectedAssets: selectedAssets.map(a => a.id)
      });

      // TODO: Implement actual assignment logic
      console.log('Assigning assets:', selectedAssets);
    } catch (error) {
      console.error('Failed to log interaction:', error);
    }
  };

  const handleExport = async (exportType: 'excel' | 'csv' | 'pdf' | 'assignment-list') => {
    try {
      const exportData = await api.exportMapData({
        userId: currentUser.id,
        exportType,
        filters,
        selectedAssets: selectedAssets.map(a => a.id)
      });

      console.log('Export created:', exportData);
      // TODO: Handle download when status is completed
    } catch (error) {
      console.error('Failed to export data:', error);
    }
  };

  const toggleOverlay = (overlayId: string) => {
    setOverlays(prev => 
      prev.map(o => o.id === overlayId ? { ...o, isVisible: !o.isVisible } : o)
    );
  };

  const toggleLayer = (layerId: string) => {
    setLayerConfigs(prev => 
      prev.map(l => l.id === layerId ? { ...l, isVisible: !l.isVisible } : l)
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Unassigned': return 'bg-gray-500';
      case 'Assigned': return 'bg-blue-500';
      case 'In Negotiation': return 'bg-yellow-500';
      case 'Under Review': return 'bg-purple-500';
      case 'Completed': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">{error}</div>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <MapIcon className="h-8 w-8 text-orange-500" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mapping Dashboard</h1>
              <p className="text-sm text-gray-600">Visualize and analyze assets across geographies</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <FilterIcon className="h-4 w-4 mr-2" />
              {showFilters ? 'Hide' : 'Show'} Filters
            </button>
            
            <button
              onClick={() => setShowLegend(!showLegend)}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <EyeIcon className="h-4 w-4 mr-2" />
              {showLegend ? 'Hide' : 'Show'} Legend
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Filter Panel */}
        {showFilters && (
          <div className="w-80 bg-white border-r border-gray-200 p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Filters</h3>
              <button
                onClick={clearFilters}
                className="text-sm text-orange-600 hover:text-orange-700"
              >
                Clear All
              </button>
            </div>

            {filterOptions && (
              <div className="space-y-4">
                {/* Asset Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Asset Type
                  </label>
                  <select
                    value={filters.assetType || 'All'}
                    onChange={(e) => handleFilterChange('assetType', e.target.value === 'All' ? undefined : e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  >
                    <option value="All">All Types</option>
                    {filterOptions.assetTypes.map((type: string) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                {/* County */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    County
                  </label>
                  <select
                    value={filters.county || ''}
                    onChange={(e) => handleFilterChange('county', e.target.value || undefined)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  >
                    <option value="">All Counties</option>
                    {filterOptions.counties.map((county: string) => (
                      <option key={county} value={county}>{county}</option>
                    ))}
                  </select>
                </div>

                {/* State */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State
                  </label>
                  <select
                    value={filters.state || ''}
                    onChange={(e) => handleFilterChange('state', e.target.value || undefined)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  >
                    <option value="">All States</option>
                    {filterOptions.states.map((state: string) => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>

                {/* Assignment Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assignment Status
                  </label>
                  <select
                    value={filters.assignmentStatus || 'All'}
                    onChange={(e) => handleFilterChange('assignmentStatus', e.target.value === 'All' ? undefined : e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  >
                    <option value="All">All Statuses</option>
                    {filterOptions.assignmentStatuses.map((status: string) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>

                {/* Price Cap Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price Cap Range ($/NRA)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.priceCapMin || ''}
                      onChange={(e) => handleFilterChange('priceCapMin', e.target.value ? Number(e.target.value) : undefined)}
                      className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.priceCapMax || ''}
                      onChange={(e) => handleFilterChange('priceCapMax', e.target.value ? Number(e.target.value) : undefined)}
                      className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Main Map Area */}
        <div className="flex-1 flex flex-col">
          {/* Map Controls */}
          <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Basemap Toggle */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Basemap:</span>
                <button
                  onClick={() => setBasemapType('streets')}
                  className={`px-3 py-1 text-xs rounded ${basemapType === 'streets' ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                >
                  Streets
                </button>
                <button
                  onClick={() => setBasemapType('satellite')}
                  className={`px-3 py-1 text-xs rounded ${basemapType === 'satellite' ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                >
                  Satellite
                </button>
              </div>

              {/* Overlay Toggles */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Overlays:</span>
                {overlays.map(overlay => (
                  <button
                    key={overlay.id}
                    onClick={() => toggleOverlay(overlay.id)}
                    className={`px-2 py-1 text-xs rounded flex items-center space-x-1 ${
                      overlay.isVisible ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    <span>{overlay.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              {selectedAssets.length > 0 && (
                <button
                  onClick={handleBulkAssignment}
                  className="bg-orange-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-orange-600"
                >
                  Assign {selectedAssets.length} Assets
                </button>
              )}
              
              <div className="relative">
                <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-200 flex items-center">
                  <DownloadIcon className="h-4 w-4 mr-2" />
                  Export
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                  <div className="py-1">
                    <button
                      onClick={() => handleExport('excel')}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Export to Excel
                    </button>
                    <button
                      onClick={() => handleExport('csv')}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Export to CSV
                    </button>
                    <button
                      onClick={() => handleExport('assignment-list')}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Export Assignment List
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Map Container */}
          <div className="flex-1 relative">
            <div ref={mapRef} className="w-full h-full" />
            
            {isLoading && (
              <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading map...</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Legend Panel */}
        {showLegend && (
          <div className="w-80 bg-white border-l border-gray-200 p-6 overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Legend</h3>
            
            {/* Asset Status Colors */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Asset Status</h4>
              <div className="space-y-2">
                {['Unassigned', 'Assigned', 'In Negotiation', 'Under Review', 'Completed'].map(status => (
                  <div key={status} className="flex items-center space-x-2">
                    <div className={`w-4 h-4 rounded ${getStatusColor(status)}`}></div>
                    <span className="text-sm text-gray-600">{status}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Asset Types */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Asset Types</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <MapPinIcon className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-gray-600">Tract</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CubeIcon className="w-4 h-4 text-purple-500" />
                  <span className="text-sm text-gray-600">Unit</span>
                </div>
              </div>
            </div>

            {/* Overlay Legends */}
            {overlays.filter(o => o.isVisible && o.legend).map(overlay => (
              <div key={overlay.id} className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">{overlay.legend!.title}</h4>
                <div className="space-y-2">
                  {overlay.legend!.items.map((item, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div 
                        className="w-4 h-4 rounded" 
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="text-sm text-gray-600">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Selected Assets Summary */}
            {selectedAssets.length > 0 && (
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Selected Assets ({selectedAssets.length})</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedAssets.map(asset => (
                    <div key={asset.id} className="text-sm text-gray-600 p-2 bg-gray-50 rounded">
                      <div className="font-medium">{asset.assetType}: {asset.asset.id}</div>
                      <div className="text-xs text-gray-500">
                        {asset.county}, {asset.state} • {asset.grossAcres} acres
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MappingDashboard;
