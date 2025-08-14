import React, { useState, useEffect, useRef } from 'react';
import type { 
  ContactEnhanced, 
  ContactTractOwnershipEnhanced, 
  ContactUnitSummary,
  TractSpatial,
  Unit,
  DistressSignal,
  MapLayerPreference
} from '../types';
import * as api from '../services/api';
import * as arcgis from '../services/arcgis';
import Button from './ui/Button';
import Card from './ui/Card';
import { 
  MapIcon, 
  EyeIcon, 
  EyeSlashIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from './icons/Icons';

interface ContactMapTabProps {
  contactId: string;
  contact: ContactEnhanced;
  tracts: ContactTractOwnershipEnhanced[];
  units: ContactUnitSummary[];
  distressSignals: DistressSignal[];
}

const ContactMapTab: React.FC<ContactMapTabProps> = ({ 
  contactId, 
  contact, 
  tracts, 
  units, 
  distressSignals 
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapView, setMapView] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [arcgisLoaded, setArcgisLoaded] = useState(false);
  
  // Map layers and overlays
  const [layers, setLayers] = useState<{ [key: string]: any }>({});
  const [layerPreferences, setLayerPreferences] = useState<MapLayerPreference[]>([]);
  const [selectedFeature, setSelectedFeature] = useState<any>(null);
  
  // Overlay toggles
  const [showProducingWells, setShowProducingWells] = useState(true);
  const [showPermits, setShowPermits] = useState(true);
  const [showRigs, setShowRigs] = useState(true);
  const [showDistressSignals, setShowDistressSignals] = useState(true);
  
  // UI state
  const [showLegend, setShowLegend] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedAssetType, setSelectedAssetType] = useState<'all' | 'tracts' | 'units'>('all');
  const [selectedBuyer, setSelectedBuyer] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Initialize map when component is mounted
  useEffect(() => {
    const timer = setTimeout(() => {
      const container = mapRef.current;
      if (container && !arcgisLoaded) {
        initializeMap(container);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [arcgisLoaded]);

  // Fetch map data when map is loaded
  useEffect(() => {
    if (arcgisLoaded) {
      fetchMapData();
    }
  }, [arcgisLoaded, contactId]);

  const initializeMap = async (container: HTMLElement) => {
    try {
      setIsLoading(true);
      console.log('Initializing Contact Map...');
      
      // Check if API key is available
      const apiKey = process.env.REACT_APP_ARCGIS_API_KEY;
      if (!apiKey) {
        throw new Error('ArcGIS API key not found');
      }

      // Load ArcGIS modules
      await arcgis.loadModules();
      
      // Create map view
      const view = await arcgis.createContactMapView(container, contact, tracts, units);
      setMapView(view);
      setArcgisLoaded(true);
      
      // Set up event handlers
      view.on('click', handleMapClick);
      view.on('mouse-wheel', handleMouseWheel);
      
    } catch (err) {
      console.error('Failed to initialize map:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize map');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMapData = async () => {
    try {
      // Fetch spatial data for tracts and units
      const tractSpatialData = await Promise.all(
        tracts.map(tract => api.fetchTractSpatial(tract.tractId))
      );
      
      // Fetch overlay data
      const [wells, permits, rigs] = await Promise.all([
        api.fetchProducingWells(),
        api.fetchPermits(),
        api.fetchRigs()
      ]);

      // Add layers to map
      await addTractLayers(tractSpatialData);
      await addUnitLayers(units);
      await addOverlayLayers(wells, permits, rigs);
      await addDistressSignalLayers(distressSignals);

      // Zoom to fit all assets
      await zoomToFitAll();
      
    } catch (err) {
      console.error('Failed to fetch map data:', err);
      setError('Failed to load map data');
    }
  };

  const addTractLayers = async (tractSpatialData: TractSpatial[]) => {
    if (!mapView) return;

    const tractLayer = await arcgis.createTractLayer(tractSpatialData, {
      color: '#3B82F6', // Blue for tracts
      outlineColor: '#1E40AF',
      opacity: 0.7
    });

    mapView.map.add(tractLayer);
    setLayers(prev => ({ ...prev, tracts: tractLayer }));
  };

  const addUnitLayers = async (unitData: ContactUnitSummary[]) => {
    if (!mapView) return;

    const unitLayer = await arcgis.createUnitLayer(unitData, {
      color: '#8B5CF6', // Purple for units
      outlineColor: '#6D28D9',
      opacity: 0.6
    });

    mapView.map.add(unitLayer);
    setLayers(prev => ({ ...prev, units: unitLayer }));
  };

  const addOverlayLayers = async (wells: any[], permits: any[], rigs: any[]) => {
    if (!mapView) return;

    if (showProducingWells && wells.length > 0) {
      const wellsLayer = await arcgis.createWellsLayer(wells);
      mapView.map.add(wellsLayer);
      setLayers(prev => ({ ...prev, wells: wellsLayer }));
    }

    if (showPermits && permits.length > 0) {
      const permitsLayer = await arcgis.createPermitsLayer(permits);
      mapView.map.add(permitsLayer);
      setLayers(prev => ({ ...prev, permits: permitsLayer }));
    }

    if (showRigs && rigs.length > 0) {
      const rigsLayer = await arcgis.createRigsLayer(rigs);
      mapView.map.add(rigsLayer);
      setLayers(prev => ({ ...prev, rigs: rigsLayer }));
    }
  };

  const addDistressSignalLayers = async (signals: DistressSignal[]) => {
    if (!mapView || !showDistressSignals || signals.length === 0) return;

    const signalsLayer = await arcgis.createDistressSignalsLayer(signals, {
      color: '#EF4444', // Red for distress signals
      size: 12
    });

    mapView.map.add(signalsLayer);
    setLayers(prev => ({ ...prev, distressSignals: signalsLayer }));
  };

  const zoomToFitAll = async () => {
    if (!mapView) return;

    try {
      // Get all graphics from tract and unit layers
      const allGraphics: any[] = [];
      
      if (layers.tracts) {
        const tractGraphics = layers.tracts.graphics?.toArray() || [];
        allGraphics.push(...tractGraphics);
      }
      
      if (layers.units) {
        const unitGraphics = layers.units.graphics?.toArray() || [];
        allGraphics.push(...unitGraphics);
      }

      if (allGraphics.length > 0) {
        await mapView.goTo(allGraphics, {
          padding: { top: 50, bottom: 50, left: 50, right: 50 }
        });
      }
    } catch (err) {
      console.error('Failed to zoom to fit all:', err);
    }
  };

  const handleMapClick = (event: any) => {
    if (!mapView) return;

    mapView.hitTest(event).then((response: any) => {
      if (response.results.length > 0) {
        const result = response.results[0];
        setSelectedFeature({
          graphic: result.graphic,
          data: result.graphic.attributes,
          type: result.graphic.layer?.id || 'unknown'
        });
      } else {
        setSelectedFeature(null);
      }
    });
  };

  const handleMouseWheel = () => {
    // Hide feature details when zooming/panning
    setSelectedFeature(null);
  };

  const handleLayerToggle = (layerType: string, visible: boolean) => {
    if (!layers[layerType]) return;

    layers[layerType].visible = visible;
    setLayers({ ...layers });
  };

  const handleFilterChange = () => {
    // Apply filters to map layers
    if (layers.tracts) {
      const tractGraphics = layers.tracts.graphics?.toArray() || [];
      tractGraphics.forEach((graphic: any) => {
        const tract = tracts.find(t => t.tractId === graphic.attributes.tractId);
        if (tract) {
          const matchesAssetType = selectedAssetType === 'all' || selectedAssetType === 'tracts';
          const matchesBuyer = selectedBuyer === 'all' || tract.assignedBuyerId === selectedBuyer;
          const matchesStatus = selectedStatus === 'all' || tract.titleStatus === selectedStatus;
          
          graphic.visible = matchesAssetType && matchesBuyer && matchesStatus;
        }
      });
    }

    if (layers.units) {
      const unitGraphics = layers.units.graphics?.toArray() || [];
      unitGraphics.forEach((graphic: any) => {
        const unit = units.find(u => u.id === graphic.attributes.unitId);
        if (unit) {
          const matchesAssetType = selectedAssetType === 'all' || selectedAssetType === 'units';
          const matchesBuyer = selectedBuyer === 'all' || unit.assignedBuyer === selectedBuyer;
          const matchesStatus = selectedStatus === 'all' || unit.status === selectedStatus;
          
          graphic.visible = matchesAssetType && matchesBuyer && matchesStatus;
        }
      });
    }
  };

  const getBuyerOptions = () => {
    const buyers = new Set<string>();
    tracts.forEach(tract => {
      if (tract.assignedBuyerId) buyers.add(tract.assignedBuyerId);
    });
    units.forEach(unit => {
      if (unit.assignedBuyer) buyers.add(unit.assignedBuyer);
    });
    return Array.from(buyers);
  };

  const getStatusOptions = () => {
    const tractStatuses = new Set(tracts.map(t => t.titleStatus));
    const unitStatuses = new Set(units.map(u => u.status).filter(Boolean));
    return Array.from(new Set([...tractStatuses, ...unitStatuses]));
  };

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center text-red-600">
          <ExclamationTriangleIcon className="h-12 w-12 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Map Error</h3>
          <p className="text-sm">{error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-4"
          >
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Map Controls Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-semibold text-gray-900">Contact Asset Map</h3>
            <span className="text-sm text-gray-500">
              {tracts.length} Tracts • {units.length} Units
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowLegend(!showLegend)}
              className="flex items-center space-x-2"
            >
              {showLegend ? <EyeIcon className="h-4 w-4" /> : <EyeSlashIcon className="h-4 w-4" />}
              <span>Legend</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2"
            >
              {showFilters ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
              <span>Filters</span>
            </Button>
            
            <Button
              onClick={zoomToFitAll}
              size="sm"
              className="flex items-center space-x-2"
            >
              <MapIcon className="h-4 w-4" />
              <span>Fit All</span>
            </Button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Asset Type</label>
              <select
                value={selectedAssetType}
                onChange={(e) => {
                  setSelectedAssetType(e.target.value as any);
                  handleFilterChange();
                }}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">All Assets</option>
                <option value="tracts">Tracts Only</option>
                <option value="units">Units Only</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Buyer</label>
              <select
                value={selectedBuyer}
                onChange={(e) => {
                  setSelectedBuyer(e.target.value);
                  handleFilterChange();
                }}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">All Buyers</option>
                {getBuyerOptions().map(buyerId => (
                  <option key={buyerId} value={buyerId}>{buyerId}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  handleFilterChange();
                }}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">All Statuses</option>
                {getStatusOptions().map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-end">
              <Button
                onClick={handleFilterChange}
                size="sm"
                className="w-full"
              >
                Apply Filters
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        <div
          ref={mapRef}
          id="contact-map-container"
          className="w-full h-full"
        />
        
        {isLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sc-blue mx-auto mb-4"></div>
              <p className="text-gray-600">Loading map...</p>
            </div>
          </div>
        )}
      </div>

      {/* Legend Panel */}
      {showLegend && (
        <div className="bg-white border-t border-gray-200 p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Map Legend</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span className="text-sm text-gray-600">Tracts</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-purple-500 rounded"></div>
              <span className="text-sm text-gray-600">Units</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Producing Wells</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Distress Signals</span>
            </div>
          </div>
        </div>
      )}

      {/* Feature Details Panel */}
      {selectedFeature && (
        <div className="absolute top-4 right-4 w-80 bg-white rounded-lg shadow-lg border border-gray-200">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-900">Asset Details</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedFeature(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </Button>
            </div>
            
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-500">Type:</span>
                <span className="ml-2 text-gray-900 capitalize">
                  {selectedFeature.type === 'tracts' ? 'Tract' : 
                   selectedFeature.type === 'units' ? 'Unit' : 
                   selectedFeature.type}
                </span>
              </div>
              
              {selectedFeature.data.name && (
                <div>
                  <span className="text-gray-500">Name:</span>
                  <span className="ml-2 text-gray-900">{selectedFeature.data.name}</span>
                </div>
              )}
              
              {selectedFeature.data.status && (
                <div>
                  <span className="text-gray-500">Status:</span>
                  <span className="ml-2 text-gray-900">{selectedFeature.data.status}</span>
                </div>
              )}
              
              {selectedFeature.data.assignedBuyer && (
                <div>
                  <span className="text-gray-500">Buyer:</span>
                  <span className="ml-2 text-gray-900">{selectedFeature.data.assignedBuyer}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactMapTab;
