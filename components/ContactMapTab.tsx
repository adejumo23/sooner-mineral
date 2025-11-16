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
  ExclamationTriangleIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from './icons/Icons';
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import { getCountyCenter, getStateCenter } from '../utils/countyCoordinates';

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
  const [useFallbackMap, setUseFallbackMap] = useState(false);
  
  // Map layers and overlays
  const [layers, setLayers] = useState<{ [key: string]: any }>({});
  const [layerPreferences, setLayerPreferences] = useState<MapLayerPreference[]>([]);
  const [selectedFeature, setSelectedFeature] = useState<any>(null);
  
  // Data state
  const [wells, setWells] = useState<any[]>([]);
  const [permits, setPermits] = useState<any[]>([]);
  const [rigs, setRigs] = useState<any[]>([]);
  
  // UI state
  const [showLegend, setShowLegend] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Initialize map when component is mounted
  useEffect(() => {
    const timer = setTimeout(() => {
      const container = mapRef.current;
      if (container && !arcgisLoaded && !useFallbackMap) {
        initializeMap(container);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [arcgisLoaded, useFallbackMap]);

  // Fetch map data when map is loaded
  useEffect(() => {
    if (arcgisLoaded || useFallbackMap) {
      fetchMapData();
    }
  }, [arcgisLoaded, useFallbackMap, contactId]);

  const initializeMap = async (container: HTMLElement) => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('Initializing Contact Map...');
      
      // Check if API key is available
      const apiKey = process.env.REACT_APP_ARCGIS_API_KEY;
      if (!apiKey) {
        console.warn('ArcGIS API key not found, using fallback map');
        setUseFallbackMap(true);
        setIsLoading(false);
        return;
      }

      // Load ArcGIS modules
      await arcgis.loadModules();
      
      // Create map
      console.log('Creating ArcGIS Map...');
      const map = new Map({
        basemap: "streets-vector"
      });
      console.log('Map created successfully');

      // Create map view with county or state-based center
      // Try to get county from first tract, or use contact state
      const firstTract = tracts && tracts.length > 0 ? tracts[0] : null;
      const county = firstTract?.section?.county || contact?.county;
      const state = firstTract?.section?.state || contact?.state;
      const initialCenter = getCountyCenter(county, state) || getStateCenter(state);
      console.log(`Using initial center for contact: county=${county || 'none'}, state=${state || 'default'}:`, initialCenter);
      console.log('Creating MapView...');
      const view = new MapView({
        container: container as HTMLDivElement,
        map: map,
        center: initialCenter,
        zoom: 12
      });
      console.log('MapView created successfully');

      // Wait for the view to be ready
      console.log('Waiting for MapView to be ready...');
      await view.when();
      console.log('MapView is ready');

      // Create graphics layers for each feature type
      console.log('Creating graphics layers...');
      const graphicsLayers = {
        tracts: new GraphicsLayer({ id: "contact-tracts", title: "Contact Tracts" }),
        units: new GraphicsLayer({ id: "contact-units", title: "Contact Units" }),
        producingWells: new GraphicsLayer({ id: "producing-wells", title: "Producing Wells" }),
        permits: new GraphicsLayer({ id: "permits", title: "Permits" }),
        rigs: new GraphicsLayer({ id: "rigs", title: "Rigs" }),
        distressSignals: new GraphicsLayer({ id: "distress-signals", title: "Distress Signals" })
      };

      // Add layers to map
      console.log('Adding graphics layers to map...');
      Object.values(graphicsLayers).forEach(layer => {
        map.add(layer);
      });
      console.log('Graphics layers added to map');

      setMapView(view);
      setLayers(graphicsLayers);
      setArcgisLoaded(true);
      console.log('=== Contact Map initialization complete ===');

    } catch (error) {
      console.error('=== Contact Map initialization failed ===');
      console.error('Error details:', error);
      console.log('Falling back to simple map display');
      setUseFallbackMap(true);
      setError(null); // Clear error since we're using fallback
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMapData = async () => {
    try {
      if (useFallbackMap) {
        // For fallback map, we don't need to fetch spatial data
        return;
      }

      // Determine center coordinates from tracts or contact
      const firstTract = tracts && tracts.length > 0 ? tracts[0] : null;
      const county = firstTract?.section?.county || (contact as any)?.county;
      const state = firstTract?.section?.state || contact?.state;
      
      let centerLat: number;
      let centerLon: number;
      
      // First, try county-specific coordinates
      const countyCenter = getCountyCenter(county, state);
      if (countyCenter) {
        centerLon = countyCenter[0];
        centerLat = countyCenter[1];
        console.log(`Using county coordinates for contact: ${county}, ${state}: [${centerLon}, ${centerLat}]`);
      } else {
        // Fall back to state-based center
        const stateCenter = getStateCenter(state);
        centerLon = stateCenter[0];
        centerLat = stateCenter[1];
        console.log(`Using state center for contact: ${state}: [${centerLon}, ${centerLat}]`);
      }

      // Update map center
      if (mapView && !useFallbackMap) {
        mapView.center = [centerLon, centerLat];
        mapView.zoom = 12;
      }

      // Fetch overlay data (include county for filtering)
      const normalizedCounty = county?.trim() || null;
      const [wellsData, permitsData, rigsData] = await Promise.all([
        api.fetchNearbyWells(centerLat, centerLon, 10, normalizedCounty),
        api.fetchNearbyPermits(centerLat, centerLon, 10),
        api.fetchNearbyRigs(centerLat, centerLon, 10)
      ]);

      setWells(wellsData);
      setPermits(permitsData);
      setRigs(rigsData);

      // Add features to map
      if (arcgisLoaded && !useFallbackMap) {
        addFeaturesToMap(wellsData, permitsData, rigsData);
      }
      
    } catch (err) {
      console.error('Failed to fetch map data:', err);
      setError('Failed to load map data');
    }
  };

  const addFeaturesToMap = async (wells: any[], permits: any[], rigs: any[]) => {
    if (!mapView || !layers) {
      console.log('MapView or layers not ready');
      return;
    }

    try {
      console.log('Adding features to contact map...');
      
      // Clear existing graphics
      Object.values(layers).forEach(layer => {
        layer.removeAll();
      });

      // Add tracts
      if (tracts && tracts.length > 0) {
        const validTracts = tracts.filter(tract => tract && tract.tractId);
        if (validTracts.length > 0) {
          const tractGraphics = arcgis.createGraphicsFromData(validTracts.map(tract => ({
            id: tract.tractId,
            latitude: (tract.tract as any)?.latitude || 31.9686,
            longitude: (tract.tract as any)?.longitude || -102.0776,
            name: tract.tract?.tractName || 'Unknown Tract',
            geometryType: 'Point'
          })).filter(tract => tract.id), 'tract', {
            id: "contact-tracts",
            title: "Contact Tracts",
            color: [59, 130, 246, 0.7], // Blue
            symbol: "polygon"
          });
          layers.tracts.addMany(tractGraphics);
          console.log(`Added ${tractGraphics.length} tract graphics`);
        }
      }

      // Add units
      if (units && units.length > 0) {
        const validUnits = units.filter(unit => unit && unit.unitId);
        if (validUnits.length > 0) {
          const unitGraphics = arcgis.createGraphicsFromData(validUnits.map(unit => ({
            id: unit.unitId,
            latitude: (unit as any)?.latitude || 31.9686,
            longitude: (unit as any)?.longitude || -102.0776,
            name: unit.unitName || 'Unknown Unit',
            geometryType: 'Point'
          })).filter(unit => unit.id), 'unit', {
            id: "contact-units",
            title: "Contact Units",
            color: [156, 39, 176, 0.6], // Purple
            symbol: "polygon"
          });
          layers.units.addMany(unitGraphics);
          console.log(`Added ${unitGraphics.length} unit graphics`);
        }
      }

      // Add wells
      if (wells && wells.length > 0) {
        const validWells = wells.filter(well => well && well.latitude && well.longitude);
        if (validWells.length > 0) {
          const wellGraphics = arcgis.createGraphicsFromData(validWells, 'well', arcgis.LAYER_CONFIG.producingWells);
          layers.producingWells.addMany(wellGraphics);
          console.log(`Added ${wellGraphics.length} well graphics`);
        }
      }

      // Add permits
      if (permits && permits.length > 0) {
        const validPermits = permits.filter(permit => permit && permit.latitude && permit.longitude);
        if (validPermits.length > 0) {
          const permitGraphics = arcgis.createGraphicsFromData(validPermits, 'permit', arcgis.LAYER_CONFIG.permits);
          layers.permits.addMany(permitGraphics);
          console.log(`Added ${permitGraphics.length} permit graphics`);
        }
      }

      // Add rigs
      if (rigs && rigs.length > 0) {
        const validRigs = rigs.filter(rig => rig && rig.latitude && rig.longitude);
        if (validRigs.length > 0) {
          const rigGraphics = arcgis.createGraphicsFromData(validRigs, 'rig', arcgis.LAYER_CONFIG.rigs);
          layers.rigs.addMany(rigGraphics);
          console.log(`Added ${rigGraphics.length} rig graphics`);
        }
      }

      // Add distress signals
      if (distressSignals && distressSignals.length > 0) {
        const validSignals = distressSignals.filter(signal => signal && (signal as any).latitude && (signal as any).longitude);
        if (validSignals.length > 0) {
          const distressGraphics = arcgis.createGraphicsFromData(validSignals, 'distress', {
            id: "distress-signals",
            title: "Distress Signals",
            color: [239, 68, 68, 0.8], // Red
            symbol: "circle"
          });
          layers.distressSignals.addMany(distressGraphics);
          console.log(`Added ${distressGraphics.length} distress signal graphics`);
        }
      }
      
      console.log('All features added to contact map successfully');
    } catch (error) {
      console.error('Error adding features to contact map:', error);
      setError(`Error adding features to map: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleLayerToggle = (layerType: string, visible: boolean) => {
    if (!layers[layerType]) return;

    layers[layerType].visible = visible;
    setLayers({ ...layers });
  };

  if (error && !useFallbackMap) {
    return (
      <Card className="p-6">
        <div className="text-center text-red-600">
          <ExclamationTriangleIcon className="h-12 w-12 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Map Error</h3>
          <p className="text-sm">{error}</p>
          <div className="mt-4 space-x-2">
            <Button 
              onClick={() => window.location.reload()} 
              className="mr-2"
            >
              Retry
            </Button>
            <Button 
              onClick={() => setUseFallbackMap(true)}
              variant="secondary"
            >
              Use Simple Map
            </Button>
          </div>
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
            {useFallbackMap && (
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                Simple Map Mode
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowLegend(!showLegend)}
              className="flex items-center space-x-2"
            >
              {showLegend ? <EyeIcon className="h-4 w-4" /> : <EyeSlashIcon className="h-4 w-4" />}
              <span>Legend</span>
            </Button>
            
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2"
            >
              {showFilters ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
              <span>Filters</span>
            </Button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Show Tracts</label>
              <input
                type="checkbox"
                checked={layers.tracts?.visible !== false}
                onChange={(e) => handleLayerToggle('tracts', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Show Units</label>
              <input
                type="checkbox"
                checked={layers.units?.visible !== false}
                onChange={(e) => handleLayerToggle('units', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Show Wells & Permits</label>
              <input
                type="checkbox"
                checked={layers.producingWells?.visible !== false}
                onChange={(e) => {
                  handleLayerToggle('producingWells', e.target.checked);
                  handleLayerToggle('permits', e.target.checked);
                }}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Show Distress Signals</label>
              <input
                type="checkbox"
                checked={layers.distressSignals?.visible !== false}
                onChange={(e) => handleLayerToggle('distressSignals', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Map Container */}
      <div className="flex-1 relative" style={{ minHeight: '400px', maxHeight: '600px' }}>
        <div
          ref={mapRef}
          id="contact-map-container"
          className="w-full h-full"
          style={{ 
            width: '100%', 
            height: '100%',
            minHeight: '400px',
            maxHeight: '600px',
            maxWidth: '100%'
          }}
        />
        
        {isLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sc-blue mx-auto mb-4"></div>
              <p className="text-gray-600">
                {useFallbackMap ? 'Loading simple map...' : 'Loading ArcGIS map...'}
              </p>
            </div>
          </div>
        )}

        {/* Fallback Map Display */}
        {useFallbackMap && !isLoading && (
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
            <div className="text-center p-8">
              <MapIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Contact Asset Overview</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-white p-3 rounded shadow">
                  <div className="font-semibold text-blue-600">{tracts.length}</div>
                  <div className="text-gray-600">Tracts</div>
                </div>
                <div className="bg-white p-3 rounded shadow">
                  <div className="font-semibold text-purple-600">{units.length}</div>
                  <div className="text-gray-600">Units</div>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-4">
                Configure REACT_APP_ARCGIS_API_KEY for full mapping features.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Legend Panel */}
      {showLegend && !useFallbackMap && (
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
      {selectedFeature && !useFallbackMap && (
        <div className="absolute top-4 right-4 w-80 bg-white rounded-lg shadow-lg border border-gray-200">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-900">Feature Details</h4>
              <Button
                variant="secondary"
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
                <span className="ml-2 text-gray-900 capitalize">{selectedFeature.type}</span>
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactMapTab;
