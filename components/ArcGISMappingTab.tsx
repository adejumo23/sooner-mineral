import React, { useState, useEffect, useRef } from 'react';
import type { TractSpatial, ProducingWell, Permit, Rig, Unit, MapLayerPreference } from '../types';
import * as api from '../services/api';
import * as arcgis from '../services/arcgis';
import Button from './ui/Button';

interface ArcGISMappingTabProps {
  tractId: string;
  tractName: string;
}

const ArcGISMappingTab: React.FC<ArcGISMappingTabProps> = ({ tractId, tractName }) => {
  console.log('ArcGISMappingTab component rendered with tractId:', tractId, 'tractName:', tractName);
  
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapView, setMapView] = useState<any>(null);
  const [tractSpatial, setTractSpatial] = useState<TractSpatial | null>(null);
  const [wells, setWells] = useState<ProducingWell[]>([]);
  const [permits, setPermits] = useState<Permit[]>([]);
  const [rigs, setRigs] = useState<Rig[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [layerPreferences, setLayerPreferences] = useState<MapLayerPreference[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [layers, setLayers] = useState<{ [key: string]: any }>({});
  const [selectedFeature, setSelectedFeature] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [arcgisLoaded, setArcgisLoaded] = useState(false);

  // Monitor when ref becomes available
  useEffect(() => {
    console.log('Ref monitoring useEffect - mapRef.current:', mapRef.current);
  }, [mapRef.current]);

  // Initialize map when component is mounted and ref is available
  useEffect(() => {
    console.log('useEffect triggered - mapRef.current:', mapRef.current, 'arcgisLoaded:', arcgisLoaded);
    
    // Try multiple approaches to get the DOM element
    const getMapContainer = () => {
      if (mapRef.current) {
        console.log('Found mapRef.current:', mapRef.current);
        return mapRef.current;
      }
      
      // Fallback: try to find by ID
      const elementById = document.getElementById('arcgis-map-container');
      if (elementById) {
        console.log('Found element by ID:', elementById);
        return elementById;
      }
      
      // Fallback: try to find by class
      const elementByClass = document.querySelector('.arcgis-map-container');
      if (elementByClass) {
        console.log('Found element by class:', elementByClass);
        return elementByClass;
      }
      
      console.log('No map container found by any method');
      return null;
    };
    
    // Add a small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      const container = getMapContainer();
      if (container && !arcgisLoaded) {
        console.log('Map container ready, initializing ArcGIS...');
        initializeMap(container);
      } else {
        console.log('useEffect conditions not met - container:', !!container, 'arcgisLoaded:', arcgisLoaded);
      }
    }, 200); // Increased delay to 200ms

    return () => clearTimeout(timer);
  }, [arcgisLoaded]);

  // Fetch data when tractId changes and map is loaded
  useEffect(() => {
    console.log('Data fetch useEffect triggered - tractId:', tractId, 'arcgisLoaded:', arcgisLoaded);
    if (arcgisLoaded) {
      fetchMapData();
    } else {
      console.log('Data fetch useEffect - arcgisLoaded is false, skipping fetchMapData');
    }
  }, [tractId, arcgisLoaded]);

  const initializeMap = async (container: HTMLElement) => {
    if (!container) {
      console.error('Map container is not available');
      return;
    }

    try {
      console.log('=== Starting ArcGIS initialization ===');
      console.log('Map container:', container);
      console.log('Loading ArcGIS modules...');
      
      // Check if API key is available
      const apiKey = process.env.REACT_APP_ARCGIS_API_KEY;
      console.log('API key check:', apiKey ? 'Found' : 'Missing');
      if (!apiKey) {
        setError('ArcGIS API key is not configured. Please check your .env file.');
        return;
      }
      
      console.log('API key found:', apiKey.substring(0, 10) + '...');

      // Try to import ArcGIS modules with more detailed error handling
      console.log('Attempting to import @arcgis/core/Map...');
      let Map, MapView, GraphicsLayer;
      try {
        const mapModule = await import("@arcgis/core/Map");
        Map = mapModule.Map;
        MapView = mapModule.MapView;
        GraphicsLayer = mapModule.GraphicsLayer;
        console.log('Successfully imported Map, MapView, GraphicsLayer');
      } catch (importError) {
        console.error('Failed to import ArcGIS Map modules:', importError);
        setError(`Failed to import ArcGIS Map modules: ${importError.message}`);
        return;
      }

      console.log('Attempting to import @arcgis/core/config...');
      let config;
      try {
        const configModule = await import("@arcgis/core/config");
        config = configModule.config;
        console.log('Successfully imported config');
      } catch (importError) {
        console.error('Failed to import ArcGIS config:', importError);
        setError(`Failed to import ArcGIS config: ${importError.message}`);
        return;
      }
      
      console.log('ArcGIS modules loaded successfully');

      // Configure ArcGIS
      console.log('Configuring ArcGIS with API key...');
      config.apiKey = apiKey;
      console.log('ArcGIS configured with API key');

      // Create map
      console.log('Creating ArcGIS Map...');
      const map = new Map({
        basemap: "satellite"
      });
      console.log('Map created successfully');

      // Create map view
      console.log('Creating MapView...');
      const view = new MapView({
        container: container,
        map: map,
        center: [-102.0776, 31.9686],
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
        tractBoundary: new GraphicsLayer({ id: "tract-boundary", title: "Tract Boundary" }),
        producingWells: new GraphicsLayer({ id: "producing-wells", title: "Producing Wells" }),
        permits: new GraphicsLayer({ id: "permits", title: "Permits" }),
        rigs: new GraphicsLayer({ id: "rigs", title: "Rigs" }),
        units: new GraphicsLayer({ id: "units", title: "Units" })
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
      console.log('=== ArcGIS initialization complete ===');

      // Handle popup events
      view.popup.watch("visible", (visible: boolean) => {
        if (!visible) {
          setSelectedFeature(null);
        }
      });

      view.popup.watch("selectedFeature", (feature: any) => {
        if (feature) {
          setSelectedFeature({
            type: feature.graphic.attributes.type || 'unknown',
            data: feature.graphic.attributes
          });
        }
      });

    } catch (error) {
      console.error('=== ArcGIS initialization failed ===');
      console.error('Error details:', error);
      console.error('Error stack:', error.stack);
      setError(`Failed to initialize ArcGIS map: ${error.message}`);
    }
  };

  const fetchMapData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const [spatial, preferences] = await Promise.all([
        api.fetchTractSpatial(tractId),
        api.fetchMapLayerPreferences()
      ]);
      
      setTractSpatial(spatial);
      setLayerPreferences(preferences);

      if (spatial?.latitude && spatial?.longitude) {
        // Update map center to tract location
        if (mapView) {
          mapView.center = [spatial.longitude, spatial.latitude];
        }
        
        // Fetch nearby data
        const [wellsData, permitsData, rigsData, unitsData] = await Promise.all([
          api.fetchNearbyWells(spatial.latitude, spatial.longitude, 10),
          api.fetchNearbyPermits(spatial.latitude, spatial.longitude, 10),
          api.fetchNearbyRigs(spatial.latitude, spatial.longitude, 10),
          api.fetchNearbyUnits(spatial.latitude, spatial.longitude, 10)
        ]);
        
        setWells(wellsData);
        setPermits(permitsData);
        setRigs(rigsData);
        setUnits(unitsData);

        // Add features to map
        if (arcgisLoaded) {
          addFeaturesToMap(spatial, wellsData, permitsData, rigsData, unitsData);
        }
      }
    } catch (error) {
      console.error('Failed to fetch map data:', error);
      setError(`Failed to fetch map data: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const addFeaturesToMap = (spatial: TractSpatial, wells: ProducingWell[], permits: Permit[], rigs: Rig[], units: Unit[]) => {
    if (!mapView || !layers) {
      console.log('MapView or layers not ready');
      return;
    }

    try {
      console.log('Adding features to map...');
      
      // Clear existing graphics
      Object.values(layers).forEach(layer => {
        layer.removeAll();
      });

      // Add tract boundary
      if (spatial && getLayerVisibility('tract_boundary')) {
        const tractGraphics = arcgis.createGraphicsFromData([spatial], 'tract', arcgis.LAYER_CONFIG.tractBoundary);
        layers.tractBoundary.addMany(tractGraphics);
        console.log('Added tract boundary graphics');
      }

      // Add wells
      if (getLayerVisibility('producing_wells') && wells.length > 0) {
        const wellGraphics = arcgis.createGraphicsFromData(wells, 'well', arcgis.LAYER_CONFIG.producingWells);
        layers.producingWells.addMany(wellGraphics);
        console.log(`Added ${wells.length} well graphics`);
      }

      // Add permits
      if (getLayerVisibility('permits') && permits.length > 0) {
        const permitGraphics = arcgis.createGraphicsFromData(permits, 'permit', arcgis.LAYER_CONFIG.permits);
        layers.permits.addMany(permitGraphics);
        console.log(`Added ${permits.length} permit graphics`);
      }

      // Add rigs
      if (getLayerVisibility('rigs') && rigs.length > 0) {
        const rigGraphics = arcgis.createGraphicsFromData(rigs, 'rig', arcgis.LAYER_CONFIG.rigs);
        layers.rigs.addMany(rigGraphics);
        console.log(`Added ${rigs.length} rig graphics`);
      }

      // Add units
      if (getLayerVisibility('units') && units.length > 0) {
        const unitGraphics = arcgis.createGraphicsFromData(units, 'unit', arcgis.LAYER_CONFIG.units);
        layers.units.addMany(unitGraphics);
        console.log(`Added ${units.length} unit graphics`);
      }
      
      console.log('All features added to map successfully');
    } catch (error) {
      console.error('Error adding features to map:', error);
      setError(`Error adding features to map: ${error.message}`);
    }
  };

  const handleLayerToggle = async (layerName: string, isVisible: boolean) => {
    try {
      const preference = layerPreferences.find(p => p.layerName === layerName);
      const opacity = preference?.opacity || 0.8;
      
      await api.updateMapLayerPreference(layerName, { isVisible, opacity });
      
      setLayerPreferences(prev => 
        prev.map(p => p.layerName === layerName ? { ...p, isVisible } : p)
      );

      // Update layer visibility
      if (layers[layerName]) {
        layers[layerName].visible = isVisible;
      }

      // Refresh map data if needed
      if (tractSpatial) {
        addFeaturesToMap(tractSpatial, wells, permits, rigs, units);
      }
    } catch (error) {
      console.error('Failed to update layer preference:', error);
    }
  };

  const handleOpacityChange = async (layerName: string, opacity: number) => {
    try {
      const preference = layerPreferences.find(p => p.layerName === layerName);
      const isVisible = preference?.isVisible ?? true;
      
      await api.updateMapLayerPreference(layerName, { isVisible, opacity });
      
      setLayerPreferences(prev => 
        prev.map(p => p.layerName === layerName ? { ...p, opacity } : p)
      );

      // Update layer opacity
      if (layers[layerName]) {
        layers[layerName].opacity = opacity;
      }
    } catch (error) {
      console.error('Failed to update layer opacity:', error);
    }
  };

  const getLayerVisibility = (layerName: string): boolean => {
    const preference = layerPreferences.find(p => p.layerName === layerName);
    return preference?.isVisible ?? true;
  };

  const getLayerOpacity = (layerName: string): number => {
    const preference = layerPreferences.find(p => p.layerName === layerName);
    return preference?.opacity ?? 0.8;
  };

  const handleBasemapChange = async (basemapId: string) => {
    if (mapView) {
      try {
        const { Basemap } = await import("@arcgis/core/Basemap");
        const basemap = await Basemap.fromId(basemapId);
        mapView.map.basemap = basemap;
      } catch (error) {
        console.error('Failed to change basemap:', error);
      }
    }
  };

  const handleZoomIn = () => {
    if (mapView) {
      mapView.zoom += 1;
    }
  };

  const handleZoomOut = () => {
    if (mapView) {
      mapView.zoom -= 1;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Always render the map container, handle loading with overlay
  return (
    <div className="space-y-6">
      {/* Map Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-white">ArcGIS Spatial View</h3>
          <p className="text-sc-slate text-sm">
            {tractName} • {tractSpatial?.geometryType === 'STR' ? tractSpatial.geometryData?.str : 'Point Location'}
          </p>
          {!arcgisLoaded && (
            <p className="text-yellow-400 text-xs">Loading ArcGIS components...</p>
          )}
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="secondary" 
            size="sm"
            onClick={() => handleBasemapChange('satellite')}
            disabled={!arcgisLoaded}
          >
            🛰️ Satellite
          </Button>
          <Button 
            variant="secondary" 
            size="sm"
            onClick={() => handleBasemapChange('streets-vector')}
            disabled={!arcgisLoaded}
          >
            🗺️ Streets
          </Button>
          <Button 
            variant="secondary" 
            size="sm"
            onClick={handleZoomIn}
            disabled={!arcgisLoaded}
          >
            🔍 Zoom In
          </Button>
          <Button 
            variant="secondary" 
            size="sm"
            onClick={handleZoomOut}
            disabled={!arcgisLoaded}
          >
            🔍 Zoom Out
          </Button>
        </div>
      </div>

      {/* ArcGIS Map Container */}
      <div className="relative">
        <div 
          ref={mapRef}
          id="arcgis-map-container" // Added ID for fallback
          className="arcgis-map-container w-full h-96 rounded-lg border border-sc-light-navy" // Added class for fallback
          style={{ backgroundColor: '#1a202c' }}
        />
        {(isLoading || !arcgisLoaded) && (
          <div className="absolute inset-0 flex items-center justify-center bg-sc-navy bg-opacity-75">
            <div className="text-center text-sc-slate">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sc-blue mx-auto mb-2"></div>
              <p>{isLoading ? 'Loading map data...' : 'Loading ArcGIS map...'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded">
          <h4 className="font-semibold">ArcGIS Error</h4>
          <p>{error}</p>
          <p className="text-sm mt-2">
            Please check your browser console for more details and ensure your ArcGIS API key is configured correctly.
          </p>
        </div>
      )}

      {/* Layer Controls */}
      <div className="bg-sc-light-navy p-4 rounded-lg">
        <h4 className="text-white font-semibold mb-3">Map Layers</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(arcgis.LAYER_CONFIG).map(([key, config]) => (
            <div key={key} className="flex items-center space-x-3">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={getLayerVisibility(key)}
                  onChange={(e) => handleLayerToggle(key, e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-sc-blue focus:ring-sc-blue"
                  disabled={!arcgisLoaded}
                />
                <span className="text-sm text-sc-slate">{config.title}</span>
              </label>
              {getLayerVisibility(key) && (
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={getLayerOpacity(key)}
                  onChange={(e) => handleOpacityChange(key, parseFloat(e.target.value))}
                  className="w-16 h-2 bg-sc-navy rounded-lg appearance-none cursor-pointer"
                  disabled={!arcgisLoaded}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Feature Details Panel */}
      {selectedFeature && (
        <div className="bg-sc-light-navy p-4 rounded-lg">
          <div className="flex justify-between items-start mb-3">
            <h4 className="text-white font-semibold">
              {selectedFeature.type === 'tract' && 'Tract Details'}
              {selectedFeature.type === 'well' && 'Well Details'}
              {selectedFeature.type === 'permit' && 'Permit Details'}
              {selectedFeature.type === 'rig' && 'Rig Details'}
              {selectedFeature.type === 'unit' && 'Unit Details'}
            </h4>
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => setSelectedFeature(null)}
            >
              ✕
            </Button>
          </div>
          
          <div className="space-y-2 text-sm">
            {selectedFeature.type === 'tract' && (
              <>
                <div><span className="text-sc-slate">Name:</span> <span className="text-white">{tractName}</span></div>
                <div><span className="text-sc-slate">Location:</span> <span className="text-white">{selectedFeature.data.latitude?.toFixed(6)}, {selectedFeature.data.longitude?.toFixed(6)}</span></div>
                <div><span className="text-sc-slate">Geometry Type:</span> <span className="text-white">{selectedFeature.data.geometryType}</span></div>
                {selectedFeature.data.str && (
                  <div><span className="text-sc-slate">STR:</span> <span className="text-white">{selectedFeature.data.str}</span></div>
                )}
              </>
            )}
            
            {selectedFeature.type === 'well' && (
              <>
                <div><span className="text-sc-slate">Well Name:</span> <span className="text-white">{selectedFeature.data.wellName}</span></div>
                <div><span className="text-sc-slate">API Number:</span> <span className="text-white">{selectedFeature.data.apiNumber}</span></div>
                <div><span className="text-sc-slate">Operator:</span> <span className="text-white">{selectedFeature.data.operator}</span></div>
                <div><span className="text-sc-slate">Status:</span> <span className="text-white">{selectedFeature.data.status}</span></div>
                <div><span className="text-sc-slate">Total Depth:</span> <span className="text-white">{selectedFeature.data.totalDepth?.toLocaleString()} ft</span></div>
                {selectedFeature.data.spudDate && (
                  <div><span className="text-sc-slate">Spud Date:</span> <span className="text-white">{formatDate(selectedFeature.data.spudDate)}</span></div>
                )}
                {selectedFeature.data.completionDate && (
                  <div><span className="text-sc-slate">Completion Date:</span> <span className="text-white">{formatDate(selectedFeature.data.completionDate)}</span></div>
                )}
              </>
            )}
            
            {selectedFeature.type === 'permit' && (
              <>
                <div><span className="text-sc-slate">Permit Number:</span> <span className="text-white">{selectedFeature.data.permitNumber}</span></div>
                <div><span className="text-sc-slate">Operator:</span> <span className="text-white">{selectedFeature.data.operator}</span></div>
                <div><span className="text-sc-slate">Type:</span> <span className="text-white">{selectedFeature.data.permitType}</span></div>
                <div><span className="text-sc-slate">Status:</span> <span className="text-white">{selectedFeature.data.status}</span></div>
                <div><span className="text-sc-slate">Permit Date:</span> <span className="text-white">{formatDate(selectedFeature.data.permitDate)}</span></div>
                {selectedFeature.data.targetFormation && (
                  <div><span className="text-sc-slate">Target Formation:</span> <span className="text-white">{selectedFeature.data.targetFormation}</span></div>
                )}
                {selectedFeature.data.totalDepth && (
                  <div><span className="text-sc-slate">Total Depth:</span> <span className="text-white">{selectedFeature.data.totalDepth.toLocaleString()} ft</span></div>
                )}
              </>
            )}
            
            {selectedFeature.type === 'rig' && (
              <>
                <div><span className="text-sc-slate">Rig Name:</span> <span className="text-white">{selectedFeature.data.rigName}</span></div>
                <div><span className="text-sc-slate">Operator:</span> <span className="text-white">{selectedFeature.data.operator}</span></div>
                <div><span className="text-sc-slate">Type:</span> <span className="text-white">{selectedFeature.data.rigType}</span></div>
                <div><span className="text-sc-slate">Status:</span> <span className="text-white">{selectedFeature.data.status}</span></div>
                {selectedFeature.data.spudDate && (
                  <div><span className="text-sc-slate">Spud Date:</span> <span className="text-white">{formatDate(selectedFeature.data.spudDate)}</span></div>
                )}
                {selectedFeature.data.targetCompletion && (
                  <div><span className="text-sc-slate">Target Completion:</span> <span className="text-white">{formatDate(selectedFeature.data.targetCompletion)}</span></div>
                )}
                {selectedFeature.data.totalDepth && (
                  <div><span className="text-sc-slate">Total Depth:</span> <span className="text-white">{selectedFeature.data.totalDepth.toLocaleString()} ft</span></div>
                )}
              </>
            )}
            
            {selectedFeature.type === 'unit' && (
              <>
                <div><span className="text-sc-slate">Unit Name:</span> <span className="text-white">{selectedFeature.data.unitName}</span></div>
                <div><span className="text-sc-slate">Operator:</span> <span className="text-white">{selectedFeature.data.operator}</span></div>
                <div><span className="text-sc-slate">Type:</span> <span className="text-white">{selectedFeature.data.unitType}</span></div>
                <div><span className="text-sc-slate">Status:</span> <span className="text-white">{selectedFeature.data.status}</span></div>
                {selectedFeature.data.formation && (
                  <div><span className="text-sc-slate">Formation:</span> <span className="text-white">{selectedFeature.data.formation}</span></div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-sc-light-navy p-4 rounded-lg">
          <div className="text-2xl font-bold text-white">{wells.length}</div>
          <div className="text-sc-slate text-sm">Producing Wells</div>
        </div>
        <div className="bg-sc-light-navy p-4 rounded-lg">
          <div className="text-2xl font-bold text-white">{permits.length}</div>
          <div className="text-sc-slate text-sm">Active Permits</div>
        </div>
        <div className="bg-sc-light-navy p-4 rounded-lg">
          <div className="text-2xl font-bold text-white">{rigs.length}</div>
          <div className="text-sc-slate text-sm">Active Rigs</div>
        </div>
        <div className="bg-sc-light-navy p-4 rounded-lg">
          <div className="text-2xl font-bold text-white">{units.length}</div>
          <div className="text-sc-slate text-sm">Nearby Units</div>
        </div>
      </div>
    </div>
  );
};

export default ArcGISMappingTab; 