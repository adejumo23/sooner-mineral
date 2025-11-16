import React, { useState, useEffect, useRef } from 'react';
import type { TractSpatial, ProducingWell, Permit, Rig, Unit, MapLayerPreference } from '../types';
import * as api from '../services/api';
import * as arcgis from '../services/arcgis';
import Button from './ui/Button';
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import { getCountyCenter, getStateCenter } from '../utils/countyCoordinates';

interface ArcGISMappingTabProps {
  sectionId: string;
  sectionName: string;
  section?: {
    sectionNumber?: string;
    township?: string;
    range?: string;
    county?: string;
    state?: string;
  };
}

// County and state center functions are now imported from utils/countyCoordinates.ts

const ArcGISMappingTab: React.FC<ArcGISMappingTabProps> = ({ sectionId, sectionName, section }) => {
  console.log('ArcGISMappingTab component rendered with sectionId:', sectionId, 'sectionName:', sectionName);
  console.log('Section prop received:', section);
  if (section?.county) {
    const countyCenter = getCountyCenter(section.county, section.state);
    console.log(`County lookup for "${section.county}", "${section.state}":`, countyCenter);
  }
  
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapView, setMapView] = useState<any>(null);
  const [sectionSpatial, setSectionSpatial] = useState<TractSpatial | null>(null);
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
  const [useFallbackMap, setUseFallbackMap] = useState(false);

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

  // Fetch data when tractId changes and map is loaded
  useEffect(() => {
    if (arcgisLoaded || useFallbackMap) {
      fetchMapData();
    }
  }, [sectionId, arcgisLoaded, useFallbackMap]);

  // Update map center when section data changes (especially county)
  useEffect(() => {
    if (mapView && !useFallbackMap && section?.county && section?.state) {
      const countyCenter = getCountyCenter(section.county, section.state);
      if (countyCenter) {
        console.log(`Updating map center based on section county change: ${section.county}, ${section.state}`);
        mapView.center = [countyCenter[0], countyCenter[1]];
        mapView.zoom = 12;
      }
    }
  }, [mapView, section?.county, section?.state, useFallbackMap]);

  // Add section graphics when tract spatial data is available
  useEffect(() => {
    if (arcgisLoaded && sectionSpatial && !useFallbackMap) {
      addSectionGraphics();
    }
  }, [arcgisLoaded, sectionSpatial, useFallbackMap]);

  const initializeMap = async (container: HTMLElement) => {
    if (!container) {
      console.error('Map container is not available');
      return;
    }

    try {
      console.log('=== Starting ArcGIS initialization ===');
      setIsLoading(true);
      setError(null);
      
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
      console.log('Creating MapView...');
      // Try county first, then fall back to state
      const initialCenter = getCountyCenter(section?.county, section?.state) || getStateCenter(section?.state);
      console.log(`Using initial center for ${section?.county || 'no county'}, ${section?.state || 'default'}:`, initialCenter);
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
        tractBoundary: new GraphicsLayer({ id: "tract-boundary", title: "Tract Boundary" }),
        sections: new GraphicsLayer({ id: "sections", title: "Township Sections" }),
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

      // Note: Removed popup event handlers due to compatibility issues
      // The popup.watch method is not available in this ArcGIS version
      // Feature selection can be handled through click events instead

    } catch (error) {
      console.error('=== ArcGIS initialization failed ===');
      console.error('Error details:', error);
      console.log('Falling back to simple map display');
      setUseFallbackMap(true);
      setError(null); // Clear error since we're using fallback
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMapData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const [spatial, preferences] = await Promise.all([
        api.fetchSectionSpatial(sectionId),
        api.fetchMapLayerPreferences()
      ]);
      
      setSectionSpatial(spatial);
      setLayerPreferences(Array.isArray(preferences) ? preferences : []);

      // Determine center coordinates: prioritize county (if available), then spatial data, then state
      // NOTE: We prioritize county over spatial data because spatial data might have default/incorrect coordinates
      let centerLat: number;
      let centerLon: number;
      
      // First, try county-specific coordinates (most reliable for correct location)
      const countyCenter = getCountyCenter(section?.county, section?.state);
      if (countyCenter) {
        centerLon = countyCenter[0];
        centerLat = countyCenter[1];
        console.log(`Using county coordinates for ${section?.county}, ${section?.state}: [${centerLon}, ${centerLat}]`);
      } else if (spatial?.latitude && spatial?.longitude) {
        // Use spatial data if county not found
        centerLat = spatial.latitude;
        centerLon = spatial.longitude;
        console.log(`Using spatial data coordinates: [${centerLon}, ${centerLat}]`);
      } else {
        // Fall back to state-based center
        const stateCenter = getStateCenter(section?.state);
        centerLon = stateCenter[0];
        centerLat = stateCenter[1];
        console.log(`Using state center for ${section?.state}: [${centerLon}, ${centerLat}]`);
      }

      // Update map center
      if (mapView && !useFallbackMap) {
        mapView.center = [centerLon, centerLat];
        console.log(`Map center updated to: [${centerLon}, ${centerLat}]`);
        // Also update zoom to ensure we can see the area
        mapView.zoom = 12;
      }
      
      // Fetch nearby data (include county for filtering)
      // Normalize county name (trim whitespace, handle case variations)
      const normalizedCounty = section?.county?.trim() || null;
      console.log(`Fetching wells for section:`, {
        county: section?.county,
        normalizedCounty: normalizedCounty,
        state: section?.state,
        center: [centerLat, centerLon],
        sectionData: section
      });
      const [wellsData, permitsData, rigsData, unitsData] = await Promise.all([
        api.fetchNearbyWells(centerLat, centerLon, 10, normalizedCounty),
        api.fetchNearbyPermits(centerLat, centerLon, 10),
        api.fetchNearbyRigs(centerLat, centerLon, 10),
        api.fetchNearbyUnits(centerLat, centerLon, 10)
      ]);
      
      setWells(wellsData);
      setPermits(permitsData);
      setRigs(rigsData);
      setUnits(unitsData);

      // Add features to map
      if (arcgisLoaded && !useFallbackMap && spatial) {
        addFeaturesToMap(spatial, wellsData, permitsData, rigsData, unitsData);
      }
    } catch (error) {
      console.error('Failed to fetch map data:', error);
      setError(`Failed to fetch map data: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      setError(`Error adding features to map: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleLayerToggle = async (layerName: string, isVisible: boolean) => {
    try {
      const preference = layerPreferences.find(p => p.layerName === layerName);
      const opacity = preference?.opacity || 0.8;
      
      await api.updateMapLayerPreference(layerName, { isVisible, opacity });
      
      setLayerPreferences(prev => 
        Array.isArray(prev) ? prev.map(p => p.layerName === layerName ? { ...p, isVisible } : p) : []
      );

      // Update layer visibility
      if (layers[layerName]) {
        layers[layerName].visible = isVisible;
      }

      // Refresh map data if needed
      if (sectionSpatial && !useFallbackMap) {
        addFeaturesToMap(sectionSpatial, wells, permits, rigs, units);
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
        Array.isArray(prev) ? prev.map(p => p.layerName === layerName ? { ...p, opacity } : p) : []
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
    if (!Array.isArray(layerPreferences)) return true;
    const preference = layerPreferences.find(p => p.layerName === layerName);
    return preference?.isVisible ?? true;
  };

  const getLayerOpacity = (layerName: string): number => {
    if (!Array.isArray(layerPreferences)) return 0.8;
    const preference = layerPreferences.find(p => p.layerName === layerName);
    return preference?.opacity ?? 0.8;
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

  // Add section graphics to the map
  const addSectionGraphics = async () => {
    if (!mapView || !sectionSpatial || !layers.sections) return;

    try {
      // Clear existing section graphics
      layers.sections.removeAll();

      // Get the current section number
      const currentSection = parseInt(sectionSpatial.section_number || '1');
      
      // Create a 6x6 grid of sections
      const sectionSize = 0.01; // Approximate size in degrees
      // Use spatial data if available, otherwise try county, then fall back to state-based center
      const fallbackCenter = getCountyCenter(section?.county, section?.state) || getStateCenter(section?.state);
      const centerLat = sectionSpatial.centroid_lat || sectionSpatial.latitude || fallbackCenter[1];
      const centerLon = sectionSpatial.centroid_lon || sectionSpatial.longitude || fallbackCenter[0];

      // Calculate the starting position (top-left corner of the 6x6 grid)
      const startLat = centerLat + (sectionSize * 2.5); // Start from top
      const startLon = centerLon - (sectionSize * 2.5); // Start from left

      for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 6; col++) {
          const sectionNum = row * 6 + col + 1;
          const isCurrentSection = sectionNum === currentSection;
          
          // Calculate section boundaries
          const sectionLat = startLat - (row * sectionSize);
          const sectionLon = startLon + (col * sectionSize);
          
          // Create section polygon
          const sectionPolygon = {
            type: "polygon",
            rings: [[
              [sectionLon, sectionLat],
              [sectionLon + sectionSize, sectionLat],
              [sectionLon + sectionSize, sectionLat - sectionSize],
              [sectionLon, sectionLat - sectionSize],
              [sectionLon, sectionLat]
            ]]
          };

          // Create section graphic
          const sectionGraphic = {
            geometry: sectionPolygon,
            symbol: {
              type: "simple-fill",
              color: isCurrentSection ? [59, 130, 246, 0.7] : [200, 200, 200, 0.3],
              outline: {
                color: isCurrentSection ? [59, 130, 246] : [100, 100, 100],
                width: isCurrentSection ? 2 : 1
              }
            },
            attributes: {
              sectionNumber: sectionNum,
              isCurrentSection: isCurrentSection,
              township: sectionSpatial.township,
              range: sectionSpatial.range,
              str: `${sectionNum}-${sectionSpatial.township}-${sectionSpatial.range}`
            },
            popupTemplate: {
              title: `Section ${sectionNum}`,
              content: `
                <div>
                  <p><strong>Section:</strong> ${sectionNum}</p>
                  <p><strong>Township:</strong> ${sectionSpatial.township || 'N/A'}</p>
                  <p><strong>Range:</strong> ${sectionSpatial.range || 'N/A'}</p>
                  <p><strong>STR:</strong> ${sectionNum}-${sectionSpatial.township}-${sectionSpatial.range}</p>
                  ${isCurrentSection ? '<p><strong>Current Tract Section</strong></p>' : ''}
                </div>
              `
            }
          };

          // Add text label for section number
          const textGraphic = {
            geometry: {
              type: "point",
              longitude: sectionLon + (sectionSize / 2),
              latitude: sectionLat - (sectionSize / 2)
            },
            symbol: {
              type: "text",
              text: sectionNum.toString(),
              color: isCurrentSection ? "white" : "black",
              font: {
                size: 12,
                weight: isCurrentSection ? "bold" : "normal"
              }
            }
          };

          layers.sections.add(sectionGraphic);
          layers.sections.add(textGraphic);

          // Add STR label overlay for current section
          if (isCurrentSection && sectionSpatial.str) {
            const strLabelGraphic = {
              geometry: {
                type: "point",
                longitude: sectionLon + (sectionSize / 2),
                latitude: sectionLat - (sectionSize / 2) - 0.002 // Position below section number
              },
              symbol: {
                type: "text",
                text: `STR: ${sectionSpatial.str}`,
                color: [59, 130, 246], // Blue color
                font: {
                  size: 14,
                  weight: "bold"
                },
                haloColor: "white",
                haloSize: 2
              }
            };
            layers.sections.add(strLabelGraphic);
          }
        }
      }

      console.log('Section graphics added to map');
    } catch (error) {
      console.error('Error adding section graphics:', error);
    }
  };

  // Show error with fallback option
  if (error && !useFallbackMap) {
    return (
      <div className="space-y-6">
        <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded">
          <h4 className="font-semibold">ArcGIS Error</h4>
          <p>{error}</p>
          <div className="mt-4 space-x-2">
            <Button 
              onClick={() => window.location.reload()} 
              size="sm"
              className="mr-2"
            >
              Retry
            </Button>
            <Button 
              onClick={() => setUseFallbackMap(true)}
              variant="secondary"
              size="sm"
            >
              Use Simple Map
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Map Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-white">
            {useFallbackMap ? 'Simple Spatial View' : 'ArcGIS Spatial View'}
          </h3>
          <p className="text-sc-slate text-sm">
            {sectionName} {section?.county && section?.state && `• ${section.county}, ${section.state}`}
            {sectionSpatial?.geometryType === 'STR' && ` • ${sectionSpatial.geometryData?.str}`}
            {!sectionSpatial?.geometryType && ' • Point Location'}
          </p>
          {useFallbackMap && (
            <p className="text-yellow-400 text-xs">Simple map mode - ArcGIS not available</p>
          )}
        </div>
        {!useFallbackMap && (
          <div className="flex space-x-2">
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
        )}
      </div>

      {/* Map Container */}
      <div className="relative mb-8">
        <div 
          ref={mapRef}
          id="arcgis-map-container"
          className="arcgis-map-container w-full h-96 rounded-lg border border-gray-600"
          style={{ backgroundColor: '#1a202c' }}
        />
        {/* STR Overlay - Top Right Corner */}
        {(sectionSpatial?.str || section?.str) && !useFallbackMap && (
          <div className="absolute top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg border-2 border-blue-400 z-10">
            <div className="text-xs font-semibold text-blue-100 mb-1">STR</div>
            <div className="text-lg font-bold">{sectionSpatial?.str || section?.str}</div>
            {section?.county && section?.state ? (
              <div className="text-xs text-blue-100 mt-1 font-semibold">
                📍 {section.county}, {section.state}
                {(() => {
                  const countyCenter = getCountyCenter(section.county, section.state);
                  return countyCenter ? (
                    <span className="text-green-300 ml-1">✓</span>
                  ) : (
                    <span className="text-yellow-300 ml-1">⚠</span>
                  );
                })()}
              </div>
            ) : section?.county ? (
              <div className="text-xs text-yellow-300 mt-1 font-semibold">
                ⚠️ County: {section.county} (State missing)
              </div>
            ) : (
              <div className="text-xs text-yellow-300 mt-1 font-semibold">
                ⚠️ County data not available
              </div>
            )}
            {(sectionSpatial?.township && sectionSpatial?.range) || (section?.township && section?.range) ? (
              <div className="text-xs text-blue-100 mt-1">
                T{sectionSpatial?.township || section?.township} R{sectionSpatial?.range || section?.range}
              </div>
            ) : null}
          </div>
        )}
        {(isLoading || !arcgisLoaded) && !useFallbackMap && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75 rounded-lg">
            <div className="text-center text-gray-300">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
              <p>{isLoading ? 'Loading map data...' : 'Loading ArcGIS map...'}</p>
            </div>
          </div>
        )}

        {/* Fallback Map Display */}
        {useFallbackMap && !isLoading && (
          <div className="absolute inset-0 bg-gray-100 rounded-lg overflow-hidden">
            {/* STR Overlay - Top Right Corner for Fallback Map */}
            {(sectionSpatial?.str || section?.str) && (
              <div className="absolute top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg border-2 border-blue-400 z-10">
                <div className="text-xs font-semibold text-blue-100 mb-1">STR</div>
                <div className="text-lg font-bold">{sectionSpatial?.str || section?.str}</div>
                {section?.county && section?.state && (
                  <div className="text-xs text-blue-100 mt-1">
                    {section.county}, {section.state}
                  </div>
                )}
                {(sectionSpatial?.township && sectionSpatial?.range) || (section?.township && section?.range) ? (
                  <div className="text-xs text-blue-100 mt-1">
                    T{sectionSpatial?.township || section?.township} R{sectionSpatial?.range || section?.range}
                  </div>
                ) : null}
              </div>
            )}
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="bg-blue-600 text-white p-4">
                <h3 className="text-lg font-semibold">Tract Section Map</h3>
                <p className="text-sm text-blue-100">
                  {section?.county && section?.state 
                    ? `${section.county}, ${section.state}`
                    : sectionSpatial?.township && sectionSpatial?.range 
                    ? `Township ${sectionSpatial.township}, Range ${sectionSpatial.range}`
                    : 'Section Information'
                  }
                </p>
              </div>
              
              {/* Section Grid */}
              <div className="flex-1 p-4">
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-700 mb-2">Section Grid (6x6 Township)</h4>
                  <div className="grid grid-cols-6 gap-1 max-w-md mx-auto">
                    {Array.from({ length: 36 }, (_, i) => {
                      const sectionNum = i + 1;
                      const isCurrentSection = sectionNum.toString() === sectionSpatial?.section_number;
                      
                      return (
                        <div
                          key={sectionNum}
                          className={`
                            w-12 h-12 border border-gray-400 flex items-center justify-center text-xs font-medium
                            ${isCurrentSection 
                              ? 'bg-blue-500 text-white border-blue-600' 
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }
                          `}
                        >
                          {sectionNum}
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="mt-4 text-center text-sm text-gray-600">
                    <p><strong>Current Section:</strong> {sectionSpatial?.section_number || 'N/A'}</p>
                    <p><strong>STR:</strong> {sectionSpatial?.str || 'N/A'}</p>
                  </div>
                </div>
                
                {/* Tract Information */}
                <div className="bg-white p-4 rounded shadow">
                  <h4 className="font-semibold text-gray-800 mb-2">Tract Details</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {section?.state && (
                      <div><span className="text-gray-600">State:</span> <span className="font-semibold">{section.state}</span></div>
                    )}
                    {section?.county && (
                      <div><span className="text-gray-600">County:</span> <span className="font-semibold">{section.county}</span></div>
                    )}
                    <div><span className="text-gray-600">Section:</span> <span className="font-semibold">{sectionSpatial?.section_number || 'N/A'}</span></div>
                    <div><span className="text-gray-600">Township:</span> <span className="font-semibold">{sectionSpatial?.township || 'N/A'}</span></div>
                    <div><span className="text-gray-600">Range:</span> <span className="font-semibold">{sectionSpatial?.range || 'N/A'}</span></div>
                    <div><span className="text-gray-600">STR:</span> <span className="font-semibold">{sectionSpatial?.str || 'N/A'}</span></div>
                  </div>
                </div>
                
                {/* Summary Stats */}
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-white p-3 rounded shadow">
                    <div className="font-semibold text-blue-600">{wells.length}</div>
                    <div className="text-gray-600">Producing Wells</div>
                  </div>
                  <div className="bg-white p-3 rounded shadow">
                    <div className="font-semibold text-yellow-600">{permits.length}</div>
                    <div className="text-gray-600">Active Permits</div>
                  </div>
                  <div className="bg-white p-3 rounded shadow">
                    <div className="font-semibold text-pink-600">{rigs.length}</div>
                    <div className="text-gray-600">Active Rigs</div>
                  </div>
                  <div className="bg-white p-3 rounded shadow">
                    <div className="font-semibold text-purple-600">{units.length}</div>
                    <div className="text-gray-600">Nearby Units</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Layer Controls - Only show for ArcGIS mode */}
      {!useFallbackMap && (
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h4 className="text-white font-semibold text-lg mb-6">Map Layers</h4>
          
          {/* Attribution Text */}
          <div className="mb-6 p-4 bg-gray-700 rounded text-xs text-gray-300 border border-gray-600">
            <p className="leading-relaxed">
              Powered by Esri • Data sources: City of Midland, Texas Parks & Wildlife, CONANP, Esri, TomTom, Garmin, SafeGraph, GeoTechnologies, Inc, METI/NASA, USGS, EPA, NPS, USDA, USFWS
            </p>
          </div>
          
          {/* Layer Controls Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(arcgis.LAYER_CONFIG).map(([key, config]) => (
              <div key={key} className="flex items-center justify-between p-4 bg-gray-700 rounded border border-gray-600">
                <label className="flex items-center space-x-3 cursor-pointer flex-1">
                  <input
                    type="checkbox"
                    checked={getLayerVisibility(key)}
                    onChange={(e) => handleLayerToggle(key, e.target.checked)}
                    className="h-4 w-4 rounded border-gray-400 text-orange-500 focus:ring-orange-500 focus:ring-2"
                    disabled={!arcgisLoaded}
                  />
                  <span className="text-sm text-white font-medium">{config.title}</span>
                </label>
                {getLayerVisibility(key) && (
                  <div className="flex items-center space-x-3 ml-4">
                    <span className="text-xs text-gray-300 whitespace-nowrap">Opacity:</span>
                    <div className="relative w-24">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={getLayerOpacity(key)}
                        onChange={(e) => handleOpacityChange(key, parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                        style={{
                          background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${getLayerOpacity(key) * 100}%, #4b5563 ${getLayerOpacity(key) * 100}%, #4b5563 100%)`
                        }}
                        disabled={!arcgisLoaded}
                      />
                    </div>
                    <span className="text-xs text-gray-300 w-10 text-right font-mono">
                      {Math.round(getLayerOpacity(key) * 100)}%
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Feature Details Panel */}
      {selectedFeature && !useFallbackMap && (
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
                  <div><span className="text-sc-slate">Total Depth:</span> <span className="text-white">{selectedFeature.data.totalDepth?.toLocaleString()} ft</span></div>
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
                  <div><span className="text-sc-slate">Total Depth:</span> <span className="text-white">{selectedFeature.data.totalDepth?.toLocaleString()} ft</span></div>
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
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <div className="text-2xl font-bold text-white">{wells.length}</div>
          <div className="text-gray-300 text-sm">Producing Wells</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <div className="text-2xl font-bold text-white">{permits.length}</div>
          <div className="text-gray-300 text-sm">Active Permits</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <div className="text-2xl font-bold text-white">{rigs.length}</div>
          <div className="text-gray-300 text-sm">Active Rigs</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <div className="text-2xl font-bold text-white">{units.length}</div>
          <div className="text-gray-300 text-sm">Nearby Units</div>
        </div>
      </div>
    </div>
  );
};

export default ArcGISMappingTab; 