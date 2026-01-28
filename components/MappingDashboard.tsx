import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapIcon, FilterIcon, EyeIcon, EyeSlashIcon, DownloadIcon, UserGroupIcon, CubeIcon, MapPinIcon, ChevronDownIcon, ChevronUpIcon } from './icons/Icons';
import type { MapAsset, MapFilter, MapSelection, MapOverlay, MapLayerConfig, User, Section } from '../types';
import * as api from '../services/api';
import * as arcgis from '../services/arcgis';
import { loadShapefileToMap } from '../services/shapefileService';
import { parsePLSS, calculatePLSSCoordinates, createPLSSPolygon, type ParsedPLSS } from '../utils/plssCoordinates';
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import { getCountyCenter } from '../utils/countyCoordinates';

interface MappingDashboardProps {
  currentUser: User;
}

const MappingDashboard: React.FC<MappingDashboardProps> = ({ currentUser }) => {
  const navigate = useNavigate();
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapView, setMapView] = useState<any>(null);
  const [assets, setAssets] = useState<MapAsset[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
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
  const [arcgisLoaded, setArcgisLoaded] = useState(false);
  const [useFallbackMap, setUseFallbackMap] = useState(false);
  const [sectionsLayer, setSectionsLayer] = useState<any>(null);
  const [shapefileLayers, setShapefileLayers] = useState<any[]>([]);
  const [showShapefileUpload, setShowShapefileUpload] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sectionSearchTerm, setSectionSearchTerm] = useState('');
  const [showLabels, setShowLabels] = useState(true);
  const [wellsLayer, setWellsLayer] = useState<any>(null);
  const [showWells, setShowWells] = useState(true);
  const [selectedWellTypes, setSelectedWellTypes] = useState<string[]>([]); // Empty array = show all
  const [isLoadingWells, setIsLoadingWells] = useState(false);

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
    if (mapView && sections.length > 0) {
      addSectionsToMap(sections);
    }
  }, [mapView, sections]);

  // Fetch wells when map view extent changes or well type filter changes
  useEffect(() => {
    if (mapView && showWells && arcgisLoaded) {
      const handleExtentChange = async () => {
        try {
          const extent = mapView.extent;
          if (extent && extent.xmin !== undefined && extent.ymin !== undefined) {
            console.log('Map extent changed, fetching wells for extent:', extent);
            await addWellsToMap(extent, sections);
          }
        } catch (error) {
          console.error('Error fetching wells on extent change:', error);
        }
      };

      // Fetch wells on initial load (with delay to ensure map is ready)
      setTimeout(handleExtentChange, 2000);

      // Watch for extent changes (debounced to avoid too many requests)
      let timeoutId: NodeJS.Timeout;
      const watchHandle = mapView.watch('extent', () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(handleExtentChange, 1000); // Debounce by 1 second
      });

      return () => {
        clearTimeout(timeoutId);
        watchHandle.remove();
      };
    }
  }, [mapView, showWells, arcgisLoaded, sections, selectedWellTypes]);

  const initializeMap = async () => {
    if (!mapRef.current) return;

    try {
      setIsLoading(true);
      setError(null);
      console.log('Initializing Mapping Dashboard...');
      
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
      
      const container = mapRef.current;
      
      // Create map
      console.log('Creating ArcGIS Map...');
      const map = new Map({
        basemap: basemapType === 'satellite' ? "satellite" : "streets-vector"
      });
      console.log('Map created successfully');

      // Create map view
      console.log('Creating MapView...');
      // Default to Oklahoma center (most data appears to be in OK)
      const { getStateCenter } = await import('../utils/countyCoordinates');
      const defaultCenter = getStateCenter('OK');
      const view = new MapView({
        container: container as HTMLDivElement,
        map: map,
        center: defaultCenter,
        zoom: 10
      });
      console.log('MapView created successfully');

      // Wait for the view to be ready
      console.log('Waiting for MapView to be ready...');
      await view.when();
      console.log('MapView is ready');

      setMapView(view);
      setArcgisLoaded(true);
      console.log('=== Mapping Dashboard initialization complete ===');

    } catch (error) {
      console.error('=== Mapping Dashboard initialization failed ===');
      console.error('Error details:', error);
      console.log('Falling back to simple map display');
      setUseFallbackMap(true);
      setError(null); // Clear error since we're using fallback
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [assetsData, overlaysData, configsData, optionsData, sectionsResponse] = await Promise.all([
        api.fetchMapAssets(),
        api.fetchMapOverlays(),
        api.fetchMapLayerConfigs(),
        api.getMapFilterOptions ? api.getMapFilterOptions() : Promise.resolve(null),
        (api.fetchSections as any)(1, 10000) // Fetch all sections (increased limit for complete grid)
      ]);

      setAssets(assetsData);
      setOverlays(overlaysData);
      setLayerConfigs(configsData);
      setFilterOptions(optionsData);
      
      // Handle paginated sections response
      const sectionsData = sectionsResponse.data || sectionsResponse;
      const sectionsArray = Array.isArray(sectionsData) ? sectionsData : [];
      console.log(`Fetched ${sectionsArray.length} sections from API`);
      setSections(sectionsArray);

      // Add layers to map if map is initialized
      if (mapView) {
        await addLayersToMap(assetsData, overlaysData);
        if (sectionsArray.length > 0) {
          await addSectionsToMap(sectionsArray);
        } else {
          console.warn('No sections data to display on map');
        }
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
        const wellsLayer = await arcgis.createWellsLayer(overlaysData.filter(o => (o as any).type === 'wells').flatMap(o => o.data || []));
        await arcgis.addLayerToMap(mapView, wellsLayer);

        const permitsLayer = await arcgis.createPermitsLayer(overlaysData.filter(o => (o as any).type === 'permits').flatMap(o => o.data || []));
        await arcgis.addLayerToMap(mapView, permitsLayer);

        const rigsLayer = await arcgis.createRigsLayer(overlaysData.filter(o => (o as any).type === 'rigs').flatMap(o => o.data || []));
        await arcgis.addLayerToMap(mapView, rigsLayer);

        const distressLayer = await arcgis.createDistressSignalsLayer(overlaysData.filter(o => (o as any).type === 'distress').flatMap(o => o.data || []));
        await arcgis.addLayerToMap(mapView, distressLayer);
      }
    } catch (error) {
      console.error('Failed to add layers to map:', error);
    }
  };

  // Add wells to map within the visible sections
  const addWellsToMap = async (extent: any, sectionsData: Section[]) => {
    if (!mapView || !arcgisLoaded || !showWells) {
      return;
    }

    // Prevent multiple simultaneous requests
    if (isLoadingWells) {
      console.log('Wells fetch already in progress, skipping...');
      return;
    }

    setIsLoadingWells(true);
    try {
      // Calculate bounds from extent or sections
      let bounds: { minLat: number; maxLat: number; minLon: number; maxLon: number } | undefined;
      const sectionStrs: string[] = [];

      if (extent && extent.xmin !== undefined && extent.ymin !== undefined) {
        // Convert from Web Mercator to WGS84 if needed
        // Check if coordinates are in Web Mercator (typically very large numbers)
        const isWebMercator = Math.abs(extent.xmin) > 180 || Math.abs(extent.ymin) > 90;
        
        if (isWebMercator) {
          // Convert Web Mercator to WGS84
          const PointModule = await import('@arcgis/core/geometry/Point');
          const SpatialReferenceModule = await import('@arcgis/core/geometry/SpatialReference');
          const { load, project } = await import('@arcgis/core/geometry/projection');
          const Point = PointModule.default;
          const SpatialReference = SpatialReferenceModule.default;
          
          // Load projection module
          await load();
          
          // Create points for corners and convert
          const bottomLeft = new Point({
            x: extent.xmin,
            y: extent.ymin,
            spatialReference: extent.spatialReference || SpatialReference.WebMercator
          });
          
          const topRight = new Point({
            x: extent.xmax,
            y: extent.ymax,
            spatialReference: extent.spatialReference || SpatialReference.WebMercator
          });
          
          // Project to WGS84
          const bottomLeftWGS84 = project(bottomLeft, SpatialReference.WGS84) as any;
          const topRightWGS84 = project(topRight, SpatialReference.WGS84) as any;
          
          bounds = {
            minLat: bottomLeftWGS84.latitude,
            maxLat: topRightWGS84.latitude,
            minLon: bottomLeftWGS84.longitude,
            maxLon: topRightWGS84.longitude
          };
        } else {
          // Already in WGS84
          bounds = {
            minLat: extent.ymin,
            maxLat: extent.ymax,
            minLon: extent.xmin,
            maxLon: extent.xmax
          };
        }
      }

      // Collect section STRs from database sections
      sectionsData.forEach(section => {
        const str = section.str || section.sectionName || '';
        if (str) {
          sectionStrs.push(str);
        }
      });

      // Fetch wells
      console.log('Fetching wells with bounds:', bounds, 'sectionStrs:', sectionStrs, 'wellTypes:', selectedWellTypes);
      const wells = await api.fetchWellsBySections(
        bounds, 
        sectionStrs.length > 0 ? sectionStrs : undefined,
        selectedWellTypes.length > 0 ? selectedWellTypes : undefined
      );
      
      console.log('Received wells from API:', wells?.length || 0, 'wells');
      
      if (!wells || wells.length === 0) {
        console.log('No wells found in the visible sections');
        return;
      }

      console.log(`Found ${wells.length} wells to display`);

      // Remove existing wells layer if it exists and clear it
      if (wellsLayer) {
        try {
          wellsLayer.removeAll();
          mapView.map.remove(wellsLayer);
          setWellsLayer(null);
        } catch (e) {
          console.warn('Error removing old wells layer:', e);
        }
      }
      
      // Also try to find and remove any existing wells layer by ID
      try {
        const existingLayer = mapView.map.layers.find((l: any) => l.id === 'wells-layer');
        if (existingLayer) {
          existingLayer.removeAll();
          mapView.map.remove(existingLayer);
        }
      } catch (e) {
        // Ignore errors
      }

      // Load ArcGIS modules
      await arcgis.loadModules();
      const GraphicsLayerModule = await import('@arcgis/core/layers/GraphicsLayer');
      const GraphicModule = await import('@arcgis/core/Graphic');
      const PointModule = await import('@arcgis/core/geometry/Point');
      const SimpleMarkerSymbolModule = await import('@arcgis/core/symbols/SimpleMarkerSymbol');
      const SpatialReferenceModule = await import('@arcgis/core/geometry/SpatialReference');
      const PopupTemplateModule = await import('@arcgis/core/PopupTemplate');
      
      const GraphicsLayer = GraphicsLayerModule.default;
      const Graphic = GraphicModule.default;
      const Point = PointModule.default;
      const SimpleMarkerSymbol = SimpleMarkerSymbolModule.default;
      const SpatialReference = SpatialReferenceModule.default;
      const PopupTemplate = PopupTemplateModule.default;

      // Create wells layer
      const wellsLayerInstance = new GraphicsLayer({
        id: 'wells-layer',
        title: 'Wells',
        listMode: 'show'
      });

      // Add wells as points
      wells.forEach((well: any) => {
        if (well.latitude && well.longitude) {
          const wellPoint = new Point({
            longitude: well.longitude,
            latitude: well.latitude,
            spatialReference: SpatialReference.WGS84
          });

          // Color based on status
          let color: number[] = [100, 100, 100, 1]; // Default gray
          const statusUpper = (well.status || '').toUpperCase();
          if (statusUpper === 'PRODUCING' || statusUpper === 'PA') {
            color = [0, 200, 0, 1]; // Green
          } else if (statusUpper === 'DRILLING' || statusUpper === '2D' || statusUpper === '2DNC') {
            color = [255, 165, 0, 1]; // Orange
          } else if (statusUpper === 'SHUT-IN' || statusUpper === 'STFD' || statusUpper === '2RSI') {
            color = [255, 0, 0, 1]; // Red
          } else if (statusUpper === 'ABANDONED' || statusUpper === 'P&A' || statusUpper === 'DRY') {
            color = [128, 128, 128, 1]; // Gray
          }
          
          // Also check welltype for additional color coding if needed
          // OIL = green, GAS = blue, DRY = gray, etc.
          const wellType = (well as any).wellType || (well as any).welltype;
          if (wellType === 'OIL') {
            color = [0, 200, 0, 0.8]; // Green for oil
          } else if (wellType === 'GAS') {
            color = [0, 100, 255, 0.8]; // Blue for gas
          } else if (wellType === 'DRY') {
            color = [128, 128, 128, 0.8]; // Gray for dry
          }

          const markerSymbol = new SimpleMarkerSymbol({
            style: 'circle',
            color: color,
            size: 8,
            outline: {
              color: [255, 255, 255, 1],
              width: 1
            }
          });

          const popupTemplate = new PopupTemplate({
            title: well.wellName || 'Well',
            content: `
              <div style="padding: 10px;">
                <p><strong>Well Name:</strong> ${well.wellName || 'Unknown'}</p>
                <p><strong>API Number:</strong> ${well.apiNumber || 'N/A'}</p>
                <p><strong>Operator:</strong> ${well.operator || 'Unknown'}</p>
                <p><strong>Status:</strong> ${well.status || 'Unknown'}</p>
                ${well.totalDepth ? `<p><strong>Total Depth:</strong> ${well.totalDepth.toLocaleString()} ft</p>` : ''}
                ${well.spudDate ? `<p><strong>Spud Date:</strong> ${new Date(well.spudDate).toLocaleDateString()}</p>` : ''}
                ${well.completionDate ? `<p><strong>Completion Date:</strong> ${new Date(well.completionDate).toLocaleDateString()}</p>` : ''}
              </div>
            `
          });

          const wellGraphic = new Graphic({
            geometry: wellPoint,
            symbol: markerSymbol,
            attributes: {
              id: well.id,
              wellName: well.wellName,
              apiNumber: well.apiNumber,
              operator: well.operator,
              status: well.status
            },
            popupTemplate: popupTemplate
          });

          wellsLayerInstance.add(wellGraphic);
        }
      });

      // Add wells layer to map
      mapView.map.add(wellsLayerInstance);
      setWellsLayer(wellsLayerInstance);
      
      console.log(`Added ${wells.length} wells to map`);
    } catch (error) {
      console.error('Error adding wells to map:', error);
    } finally {
      setIsLoadingWells(false);
    }
  };

  const addSectionsToMap = async (sectionsData: Section[]) => {
    if (!mapView) {
      console.warn('MapView not available, cannot add sections');
      return;
    }

    if (!arcgisLoaded) {
      console.warn('ArcGIS not loaded yet, cannot add sections');
      return;
    }

    if (!sectionsData || sectionsData.length === 0) {
      console.warn('No sections data provided to addSectionsToMap');
      return;
    }

    console.log(`Adding ${sectionsData.length} sections to map...`);
    setIsLoading(true); // Show loading indicator during grid generation

    try {
      // Load ArcGIS modules if needed
      await arcgis.loadModules();
      
      // Import ArcGIS modules dynamically
      const GraphicsLayerModule = await import('@arcgis/core/layers/GraphicsLayer');
      const GraphicModule = await import('@arcgis/core/Graphic');
      const PointModule = await import('@arcgis/core/geometry/Point');
      const PolygonModule = await import('@arcgis/core/geometry/Polygon');
      const SimpleMarkerSymbolModule = await import('@arcgis/core/symbols/SimpleMarkerSymbol');
      const SimpleFillSymbolModule = await import('@arcgis/core/symbols/SimpleFillSymbol');
      const SpatialReferenceModule = await import('@arcgis/core/geometry/SpatialReference');
      
      const GraphicsLayer = GraphicsLayerModule.default;
      const Graphic = GraphicModule.default;
      const Point = PointModule.default;
      const Polygon = PolygonModule.default;
      const SimpleMarkerSymbol = SimpleMarkerSymbolModule.default;
      const SimpleFillSymbol = SimpleFillSymbolModule.default;
      const SpatialReference = SpatialReferenceModule.default;

      // Remove existing sections layer and label layer if they exist
      if (sectionsLayer) {
        // Clean up event handlers
        if ((sectionsLayer as any)._clickHandler) {
          (sectionsLayer as any)._clickHandler.remove();
        }
        if ((sectionsLayer as any)._pointerMoveHandler) {
          (sectionsLayer as any)._pointerMoveHandler.remove();
        }
        if ((sectionsLayer as any)._popupActionHandler) {
          // Only remove if it has a remove method (event handlers)
          if (typeof (sectionsLayer as any)._popupActionHandler.remove === 'function') {
            (sectionsLayer as any)._popupActionHandler.remove();
          }
        }
        if ((sectionsLayer as any)._popupOpenHandler) {
          // Watch handlers need to be removed differently
          if (typeof (sectionsLayer as any)._popupOpenHandler.remove === 'function') {
            (sectionsLayer as any)._popupOpenHandler.remove();
          }
        }
        mapView.map.remove(sectionsLayer);
      }
      
      // Remove existing label layer if it exists
      const existingLabelLayer = mapView.map.findLayerById('sections-labels-layer');
      if (existingLabelLayer) {
        if ((existingLabelLayer as any)._zoomWatchHandler) {
          (existingLabelLayer as any)._zoomWatchHandler.remove();
        }
        mapView.map.remove(existingLabelLayer);
      }

      // Create new sections layer
      const layer = new GraphicsLayer({
        id: 'sections-layer',
        title: 'Sections',
        listMode: 'show'
      });
      
      // Add layer to map EARLY so graphics can be added to it
      mapView.map.add(layer);
      setSectionsLayer(layer);
      console.log('Sections layer created and added to map');

      // Import additional modules for polygon and text rendering
      const PopupTemplateModule = await import('@arcgis/core/PopupTemplate');
      const PopupTemplate = PopupTemplateModule.default;
      const TextSymbolModule = await import('@arcgis/core/symbols/TextSymbol');
      const TextSymbol = TextSymbolModule.default;

      // Create a separate layer for labels with zoom-based visibility
      const labelLayer = new GraphicsLayer({
        id: 'sections-labels-layer',
        title: 'Section Labels',
        listMode: 'hide', // Hide from layer list
        minScale: 100000, // Hide labels when zoomed out (scale > 100000)
        maxScale: 0 // Show labels when zoomed in (scale < 100000)
      });

      // Create a Set of sections that exist in the database (normalized STR format)
      const sectionsInDatabase = new Set<string>();
      sectionsData.forEach((section) => {
        const str = section.str || section.sectionName || '';
        if (str) {
          // Normalize the STR format for comparison
          const normalized = str.trim().toUpperCase().replace(/\s+/g, '');
          sectionsInDatabase.add(normalized);
        }
      });

      console.log(`Found ${sectionsInDatabase.size} unique sections in database`);

      // Determine the range of townships and ranges to display
      // Extract min/max from existing sections, or use reasonable defaults for Oklahoma
      let minTownshipN = 999, maxTownshipN = 0;
      let minTownshipS = 999, maxTownshipS = 0;
      let minRangeE = 999, maxRangeE = 0;
      let minRangeW = 999, maxRangeW = 0;
      let hasValidPLSS = false;

      sectionsData.forEach((section) => {
        const plss = parsePLSS(section.str || section.sectionName || '');
        if (plss.isValid) {
          hasValidPLSS = true;
          if (plss.townshipDirection === 'N') {
            minTownshipN = Math.min(minTownshipN, plss.townshipNumber);
            maxTownshipN = Math.max(maxTownshipN, plss.townshipNumber);
          } else {
            minTownshipS = Math.min(minTownshipS, plss.townshipNumber);
            maxTownshipS = Math.max(maxTownshipS, plss.townshipNumber);
          }
          if (plss.rangeDirection === 'E') {
            minRangeE = Math.min(minRangeE, plss.rangeNumber);
            maxRangeE = Math.max(maxRangeE, plss.rangeNumber);
          } else {
            minRangeW = Math.min(minRangeW, plss.rangeNumber);
            maxRangeW = Math.max(maxRangeW, plss.rangeNumber);
          }
        }
      });

      // If no valid PLSS found, use reasonable defaults for Oklahoma
      if (!hasValidPLSS) {
        minTownshipN = 1; maxTownshipN = 15;
        minTownshipS = 1; maxTownshipS = 15;
        minRangeE = 1; maxRangeE = 15;
        minRangeW = 1; maxRangeW = 15;
      } else {
        // Use actual min/max, resetting if no sections found in that direction
        if (minTownshipN === 999) { minTownshipN = 0; maxTownshipN = 0; }
        if (minTownshipS === 999) { minTownshipS = 0; maxTownshipS = 0; }
        if (minRangeE === 999) { minRangeE = 0; maxRangeE = 0; }
        if (minRangeW === 999) { minRangeW = 0; maxRangeW = 0; }
      }

      // Expand range slightly to show surrounding grid (but limit expansion to prevent too many sections)
      const expandBy = 1; // Reduced from 2 to limit total sections
      const maxTownshipRange = 20; // Maximum township range to prevent excessive generation
      const maxRangeRange = 20; // Maximum range range to prevent excessive generation

      const townshipRanges: Array<{dir: 'N' | 'S', min: number, max: number}> = [];
      if (maxTownshipN > 0) {
        townshipRanges.push({
          dir: 'N',
          min: Math.max(1, minTownshipN - expandBy),
          max: Math.min(maxTownshipN + expandBy, maxTownshipRange)
        });
      }
      if (maxTownshipS > 0) {
        townshipRanges.push({
          dir: 'S',
          min: Math.max(1, minTownshipS - expandBy),
          max: Math.min(maxTownshipS + expandBy, maxTownshipRange)
        });
      }

      const rangeRanges: Array<{dir: 'E' | 'W', min: number, max: number}> = [];
      if (maxRangeE > 0) {
        rangeRanges.push({
          dir: 'E',
          min: Math.max(1, minRangeE - expandBy),
          max: Math.min(maxRangeE + expandBy, maxRangeRange)
        });
      }
      if (maxRangeW > 0) {
        rangeRanges.push({
          dir: 'W',
          min: Math.max(1, minRangeW - expandBy),
          max: Math.min(maxRangeW + expandBy, maxRangeRange)
        });
      }

      // If no ranges found, use defaults (but keep them small)
      // This ensures we always generate at least some sections for testing
      if (townshipRanges.length === 0) {
        console.log('No township ranges found, using defaults');
        townshipRanges.push({ dir: 'N', min: 1, max: 10 }, { dir: 'S', min: 1, max: 10 });
      }
      if (rangeRanges.length === 0) {
        console.log('No range ranges found, using defaults');
        rangeRanges.push({ dir: 'E', min: 1, max: 10 }, { dir: 'W', min: 1, max: 10 });
      }
      
      console.log('Township ranges:', townshipRanges);
      console.log('Range ranges:', rangeRanges);

      // Calculate total sections to generate
      const totalSectionsEstimate = townshipRanges.reduce((sum, tr) => 
        sum + (tr.max - tr.min + 1), 0
      ) * rangeRanges.reduce((sum, rr) => 
        sum + (rr.max - rr.min + 1), 0
      ) * 36;

      console.log(`Generating PLSS grid with optimized ranges to improve performance`);
      console.log(`Estimated sections to generate: ${totalSectionsEstimate}`);
      
      // Warn if generating too many sections
      if (totalSectionsEstimate > 50000) {
        console.warn(`Warning: Generating ${totalSectionsEstimate} sections may cause performance issues. Consider limiting the range.`);
      }

      // Generate all sections in the grid with batch processing for performance
      let totalGraphicsAdded = 0;
      let sectionsInDbCount = 0;
      let sectionsNotInDbCount = 0;
      
      // Batch processing configuration
      const BATCH_SIZE = 1000; // Process 1000 sections at a time (increased for better performance)
      let batchGraphics: any[] = [];
      let batchLabels: any[] = [];
      let processedCount = 0;

      // Helper function to process a batch
      const processBatch = async () => {
        if (batchGraphics.length > 0) {
          layer.addMany(batchGraphics);
          batchGraphics = [];
        }
        if (batchLabels.length > 0) {
          labelLayer.addMany(batchLabels);
          batchLabels = [];
        }
        // Yield to browser to prevent blocking
        await new Promise(resolve => setTimeout(resolve, 0));
      };

      // Generate all sections for the determined range
      for (const townshipRange of townshipRanges) {
        for (let townshipNum = townshipRange.min; townshipNum <= townshipRange.max; townshipNum++) {
          for (const rangeRange of rangeRanges) {
            for (let rangeNum = rangeRange.min; rangeNum <= rangeRange.max; rangeNum++) {
              // Generate all 36 sections for this township/range
              for (let sectionNum = 1; sectionNum <= 36; sectionNum++) {
                const plss: ParsedPLSS = {
                  section: sectionNum,
                  townshipNumber: townshipNum,
                  townshipDirection: townshipRange.dir,
                  rangeNumber: rangeNum,
                  rangeDirection: rangeRange.dir,
                  isValid: true
                };

                // Create STR format to check if it exists in database
                const strFormat = `${String(sectionNum).padStart(2, '0')}-${String(townshipNum).padStart(2, '0')}${townshipRange.dir}-${String(rangeNum).padStart(2, '0')}${rangeRange.dir}`;
                const normalizedStr = strFormat.toUpperCase();
                const existsInDatabase = sectionsInDatabase.has(normalizedStr);

                // Calculate actual PLSS coordinates
                const sectionCenter = calculatePLSSCoordinates(plss);
                const polygonRings = createPLSSPolygon(plss);

                if (!sectionCenter || !polygonRings) {
                  console.warn(`Could not calculate coordinates for section ${strFormat}`);
                  continue;
                }

                const [sectionLon, sectionLat] = sectionCenter;
                
                // Debug: Log first few sections to verify coordinates
                if (processedCount < 5) {
                  console.log(`Section ${strFormat}: Center=[${sectionLon.toFixed(6)}, ${sectionLat.toFixed(6)}], InDB=${existsInDatabase}`);
                }

                // Create polygon geometry for section using actual PLSS coordinates
                const sectionPolygon = new Polygon({
                  rings: [polygonRings],
                  spatialReference: SpatialReference.WGS84
                });

                // Use different colors based on whether section exists in database
                // Made slightly more visible: increased opacity and outline width
                const fillSymbol = new SimpleFillSymbol({
                  color: existsInDatabase 
                    ? [173, 160, 200, 0.7]  // Purple/blue for sections in database (increased from 0.6)
                    : [220, 220, 220, 0.4], // Light gray for sections not in database (increased from 0.3)
                  outline: {
                    color: existsInDatabase
                      ? [100, 90, 120, 0.9]  // Darker purple for sections in database (increased from 0.8)
                      : [180, 180, 180, 0.6], // Light gray outline for sections not in database (increased from 0.5)
                    width: existsInDatabase ? 1.5 : 0.8  // Increased width for better visibility
                  }
                });

                // Get PLSS designation (section-township-range format)
                const plssLabel = strFormat;
                
                // Find section data if it exists in database
                const sectionData = sectionsData.find(s => {
                  const sStr = (s.str || s.sectionName || '').trim().toUpperCase().replace(/\s+/g, '');
                  return sStr === normalizedStr;
                });
                
                // Create popup template
                const popupTemplate = new PopupTemplate({
                  title: plssLabel,
                  content: `
                    <div style="padding: 10px;">
                      <p><strong>Section:</strong> ${plssLabel}</p>
                      <p><strong>PLSS:</strong> Section ${plss.section}, Township ${plss.townshipNumber}${plss.townshipDirection}, Range ${plss.rangeNumber}${plss.rangeDirection}</p>
                      ${existsInDatabase && sectionData ? `
                        <p><strong>County:</strong> ${sectionData.county || 'N/A'}</p>
                        <p><strong>State:</strong> ${sectionData.state || 'N/A'}</p>
                        <p><strong>Net Mineral Acres:</strong> ${sectionData.netMineralAcres?.toFixed(2) || '0'}</p>
                        <p><strong>Status:</strong> ${sectionData.status || 'unassigned'}</p>
                      ` : `
                        <p><em>This section is not in the database</em></p>
                      `}
                    </div>
                  `,
                  actions: existsInDatabase && sectionData ? [
                    {
                      title: 'View Details',
                      id: 'view-details',
                      type: 'button' as const
                    }
                  ] : []
                });

                // Create polygon graphic
                const polygonGraphic = new Graphic({
                  geometry: sectionPolygon,
                  symbol: fillSymbol,
                  attributes: {
                    id: sectionData?.id || `plss-${strFormat}`,
                    sectionName: sectionData?.sectionName || plssLabel,
                    county: sectionData?.county || 'Unknown',
                    state: sectionData?.state || 'OK',
                    str: strFormat,
                    netMineralAcres: sectionData?.netMineralAcres || 0,
                    status: sectionData?.status || 'not_in_database',
                    plssSection: plss.section,
                    plssTownship: `${plss.townshipNumber}${plss.townshipDirection}`,
                    plssRange: `${plss.rangeNumber}${plss.rangeDirection}`,
                    inDatabase: existsInDatabase
                  },
                  popupTemplate: popupTemplate
                });

                // Add to batch instead of immediately adding to layer
                batchGraphics.push(polygonGraphic);
                totalGraphicsAdded++;

                if (existsInDatabase) {
                  sectionsInDbCount++;
                } else {
                  sectionsNotInDbCount++;
                }

                // Create text label for the section (centered in section)
                const labelCenter = new Point({
                  longitude: sectionLon,
                  latitude: sectionLat,
                  spatialReference: SpatialReference.WGS84
                });

                // Use a simpler font specification that ArcGIS supports
                // Labels will be shown/hidden based on zoom level via layer visibility
                // Font size will be responsive to zoom level
                const currentZoom = mapView.zoom || 10;
                const fontSize = Math.max(9, Math.min(14, 9 + (currentZoom - 10) * 0.5)); // Scale font size with zoom
                
                const labelSymbol = new TextSymbol({
                  text: plssLabel,
                  color: existsInDatabase 
                    ? [40, 30, 70, 1]      // Darker blue/purple text for sections in database (more visible)
                    : [100, 100, 100, 0.85], // Darker gray text for sections not in database (increased from 0.7)
                  font: {
                    size: fontSize,
                    weight: 'bold',  // Made bold for better visibility
                    style: 'normal'
                    // Don't specify family - ArcGIS will use default system font
                  },
                  haloColor: [255, 255, 255, 1], // White halo for better readability (increased opacity)
                  haloSize: 2.5 // Slightly larger halo for better contrast (increased from 2)
                });

                const labelGraphic = new Graphic({
                  geometry: labelCenter,
                  symbol: labelSymbol,
                  attributes: {
                    sectionId: sectionData?.id || `plss-${strFormat}`,
                    inDatabase: existsInDatabase
                  }
                });

                batchLabels.push(labelGraphic);
                processedCount++;

                // Process batch when it reaches the batch size
                if (processedCount % BATCH_SIZE === 0) {
                  await processBatch();
                  // Update progress every 5000 sections
                  if (processedCount % 5000 === 0) {
                    console.log(`Processed ${processedCount} sections...`);
                  }
                }
              }
            }
          }
        }
      }

      // Process any remaining items in the batch
      await processBatch();

      console.log(`PLSS Grid Complete: ${totalGraphicsAdded} total sections displayed`);
      console.log(`  - ${sectionsInDbCount} sections in database (purple/blue)`);
      console.log(`  - ${sectionsNotInDbCount} sections not in database (gray)`);
      
      // Verify layer has graphics
      if (layer.graphics.length === 0) {
        console.error('WARNING: Layer has no graphics after processing!');
      } else {
        console.log(`Layer contains ${layer.graphics.length} graphics`);
      }

      // Add label layer to map
      mapView.map.add(labelLayer);
      
      setIsLoading(false); // Hide loading indicator
      
      // Initially hide labels (they'll show when zoomed in)
      labelLayer.visible = mapView.zoom > 10;

      // Add zoom-based label visibility handler for better responsiveness
      const zoomWatchHandler = mapView.watch('zoom', (zoom: number) => {
        // Show labels only when zoomed in enough (zoom level > 10)
        // This prevents label clutter when viewing the entire state
        if (labelLayer) {
          const shouldShow = zoom > 10 && showLabels;
          labelLayer.visible = shouldShow;
          
          // Update label font sizes based on zoom level for better readability
          if (shouldShow) {
            labelLayer.graphics.forEach((graphic: any) => {
              if (graphic.symbol && graphic.symbol.font) {
                const fontSize = Math.max(9, Math.min(14, 9 + (zoom - 10) * 0.5));
                graphic.symbol.font.size = fontSize;
              }
            });
          }
        }
      });
      
      // Store zoom handler for cleanup
      (labelLayer as any)._zoomWatchHandler = zoomWatchHandler;

      console.log(`Total graphics added to layer: ${totalGraphicsAdded}`);

      // Add click handler to navigate to section detail page
      (window as any).navigateToSection = (sectionId: string) => {
        navigate(`/sections/${sectionId}`);
      };

      // Enable popups on the map view but we'll handle navigation on click
      mapView.popup.autoOpenEnabled = true;
      mapView.popup.dockEnabled = true;
      mapView.popup.dockOptions = {
        buttonEnabled: false,
        breakpoint: false
      };

      // Add click event listener on map view to handle section clicks
      const clickHandler = mapView.on('click', async (event: any) => {
        try {
          const hitTest = await mapView.hitTest(event);
          const sectionResult = hitTest.results.find((result: any) => 
            result.graphic && result.graphic.layer === layer
          );
          
          if (sectionResult && sectionResult.graphic && sectionResult.graphic.attributes) {
            const sectionId = sectionResult.graphic.attributes.id;
            if (sectionId) {
              console.log('Section clicked, navigating to:', sectionId);
              // Close popup if it opened
              setTimeout(() => {
                if (mapView.popup.visible) {
                  mapView.popup.close();
                }
              }, 50);
              // Navigate directly to the section detail page
              navigate(`/sections/${sectionId}`);
            }
          }
        } catch (error) {
          console.error('Error handling section click:', error);
        }
      });

      // Track currently highlighted graphic to restore it when mouse leaves
      let currentlyHighlightedGraphic: any = null;
      let originalHighlightedSymbol: any = null;
      
      // Add pointer-move event for hover tooltips with better interactivity
      const pointerMoveHandler = mapView.on('pointer-move', async (event: any) => {
        try {
          const hitTest = await mapView.hitTest(event);
          const sectionResult = hitTest.results.find((result: any) => 
            result.graphic && result.graphic.layer === layer
          );
          
          if (sectionResult && sectionResult.graphic && sectionResult.graphic.attributes) {
            // Change cursor to pointer
            mapView.container.style.cursor = 'pointer';
            
            // Highlight the section on hover
            const graphic = sectionResult.graphic;
            
            // If we're hovering over a different graphic, restore the previous one
            if (currentlyHighlightedGraphic && currentlyHighlightedGraphic !== graphic) {
              if (originalHighlightedSymbol) {
                currentlyHighlightedGraphic.symbol = originalHighlightedSymbol;
              }
            }
            
            // Only highlight if not already highlighted
            if (currentlyHighlightedGraphic !== graphic) {
              const originalSymbol = graphic.symbol;
              if (originalSymbol && originalSymbol.type === 'simple-fill') {
                // Store original symbol for restoration
                originalHighlightedSymbol = originalSymbol;
                currentlyHighlightedGraphic = graphic;
                
                // Temporarily highlight the section
                const highlightSymbol = new SimpleFillSymbol({
                  color: [173, 160, 200, 0.8], // More opaque on hover
                  outline: {
                    color: [50, 40, 80, 1], // Darker outline
                    width: 2
                  }
                });
                graphic.symbol = highlightSymbol;
              }
            }
            
            // Show hover info
            const sectionName = sectionResult.graphic.attributes.sectionName || 
                               sectionResult.graphic.attributes.str || 
                               'Section';
            const county = sectionResult.graphic.attributes.county || 'Unknown';
            const state = sectionResult.graphic.attributes.state || 'OK';
            const netAcres = sectionResult.graphic.attributes.netMineralAcres || 0;
            
            // Create or get tooltip element
            let tooltip = document.getElementById('section-hover-tooltip') as HTMLElement;
            if (!tooltip) {
              tooltip = document.createElement('div');
              tooltip.id = 'section-hover-tooltip';
              tooltip.style.cssText = `
                position: fixed;
                background: rgba(0, 0, 0, 0.9);
                color: white;
                padding: 10px 14px;
                border-radius: 8px;
                font-size: 13px;
                pointer-events: none;
                z-index: 10000;
                display: none;
                box-shadow: 0 4px 12px rgba(0,0,0,0.4);
                max-width: 280px;
                line-height: 1.5;
                border: 1px solid rgba(255,255,255,0.2);
              `;
              document.body.appendChild(tooltip);
            }
            
            tooltip.innerHTML = `
              <div style="font-weight: 600; margin-bottom: 6px; font-size: 14px;">${sectionName}</div>
              <div style="font-size: 12px; opacity: 0.9; margin-bottom: 2px;">${county} County, ${state}</div>
              ${netAcres > 0 ? `<div style="font-size: 11px; opacity: 0.8;">${netAcres.toFixed(2)} Net Mineral Acres</div>` : ''}
              <div style="font-size: 11px; opacity: 0.7; margin-top: 4px; font-style: italic;">Click to view details</div>
            `;
            tooltip.style.display = 'block';
            
            // Position tooltip near cursor, but keep it in viewport
            const tooltipWidth = tooltip.offsetWidth || 200;
            const tooltipHeight = tooltip.offsetHeight || 50;
            const x = event.x + 15;
            const y = event.y + 15;
            const maxX = window.innerWidth - tooltipWidth - 10;
            const maxY = window.innerHeight - tooltipHeight - 10;
            
            tooltip.style.left = `${Math.min(x, maxX)}px`;
            tooltip.style.top = `${Math.min(y, maxY)}px`;
          } else {
            // Reset cursor
            mapView.container.style.cursor = 'default';
            
            // Restore highlighted graphic when mouse leaves
            if (currentlyHighlightedGraphic && originalHighlightedSymbol) {
              currentlyHighlightedGraphic.symbol = originalHighlightedSymbol;
              currentlyHighlightedGraphic = null;
              originalHighlightedSymbol = null;
            }
            
            // Hide tooltip
            const tooltip = document.getElementById('section-hover-tooltip');
            if (tooltip) {
              tooltip.style.display = 'none';
            }
          }
        } catch (error) {
          // Silently handle errors during hover
        }
      });

      console.log(`Successfully added ${totalGraphicsAdded} section graphics to map`);
      console.log(`Sections layer added to map. Layer count: ${mapView.map.layers.length}`);
      console.log(`Layer graphics count: ${layer.graphics.length}`);
      
      // Zoom to show all sections if we have any
      let calculatedExtent: any = null;
      if (totalGraphicsAdded > 0 && layer.graphics.length > 0) {
        try {
          // Wait longer for the layer to calculate its extent properly
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Try to get extent from layer
          let extent = layer.fullExtent;
          
          // If fullExtent is not available, calculate from graphics
          if (!extent || extent.xmin === undefined || extent.ymin === undefined) {
            console.log('Calculating extent from graphics...');
            const geometryEngine = await import('@arcgis/core/geometry/geometryEngine');
            
            if (layer.graphics.length > 0) {
              const geometries = Array.from(layer.graphics)
                .map((g: any) => g.geometry)
                .filter((g: any) => g !== null && g !== undefined);
              
              if (geometries.length > 0) {
                try {
                  const union = geometryEngine.union(geometries as any);
                  if (union && union.extent) {
                    extent = union.extent;
                    console.log('Calculated extent from graphics:', extent);
                  }
                } catch (unionError) {
                  console.warn('Could not union geometries:', unionError);
                }
              }
            }
          }
          
          calculatedExtent = extent;
          
          if (extent && extent.xmin !== undefined && extent.ymin !== undefined) {
            console.log('Zooming to extent:', {
              xmin: extent.xmin,
              ymin: extent.ymin,
              xmax: extent.xmax,
              ymax: extent.ymax
            });
            await mapView.goTo(extent.expand(1.2), { duration: 1000 });
            console.log('Map zoomed to show all sections');
          } else {
            // Fallback: zoom to Oklahoma center if extent not available
            console.log('Extent not available, zooming to Oklahoma center');
            await mapView.goTo({
              center: [-97.5164, 35.4676], // Oklahoma City
              zoom: 8
            });
            console.log('Map zoomed to Oklahoma center (extent not available)');
          }
        } catch (extentError) {
          console.warn('Could not zoom to sections extent:', extentError);
          // Fallback zoom
          try {
            await mapView.goTo({
              center: [-97.5164, 35.4676],
              zoom: 8
            });
            console.log('Fallback zoom to Oklahoma center');
          } catch (e) {
            console.warn('Could not zoom to fallback location:', e);
          }
        }
      } else {
        console.warn('No sections to zoom to - totalGraphicsAdded:', totalGraphicsAdded, 'layer.graphics.length:', layer.graphics.length);
      }
      
      // Fetch and add wells within the visible sections (after extent is calculated)
      if (showWells) {
        await addWellsToMap(calculatedExtent, sectionsData);
      }
      
      // Handle popup opening to ensure we can navigate
      // Note: In newer ArcGIS API versions, popup.on() is not available
      // We handle navigation through click events instead
      let popupOpenHandler: any = null;
      if (mapView.popup && typeof mapView.popup.watch === 'function') {
        try {
          popupOpenHandler = mapView.popup.watch('visible', (visible: boolean) => {
            if (visible && mapView.popup.selectedFeature) {
              const graphic = mapView.popup.selectedFeature;
              if (graphic && graphic.attributes && graphic.attributes.id) {
                // Store the section ID for the popup action button
                (graphic as any)._sectionId = graphic.attributes.id;
              }
            }
          });
        } catch (error) {
          console.warn('Could not set up popup watch handler:', error);
        }
      }
      
      // Popup action handler - not available in newer ArcGIS API versions
      // Navigation is handled through click events instead
      const popupActionHandler = null;

      // Store handlers for cleanup
      (layer as any)._clickHandler = clickHandler;
      (layer as any)._pointerMoveHandler = pointerMoveHandler;
      (layer as any)._popupActionHandler = popupActionHandler;
      (layer as any)._popupOpenHandler = popupOpenHandler;

      // Zoom to show all sections if we have any
      if (totalGraphicsAdded > 0 && layer.graphics.length > 0) {
        try {
          const extent = layer.fullExtent;
          if (extent) {
            await mapView.goTo(extent.expand(1.2)); // Expand by 20% for padding
            console.log('Map zoomed to show sections');
          }
        } catch (extentError) {
          console.warn('Could not zoom to sections extent:', extentError);
        }
      }
    } catch (error) {
      console.error('Failed to add sections to map:', error);
      console.error('Error details:', error);
      setIsLoading(false); // Ensure loading state is cleared on error
    } finally {
      setIsLoading(false); // Always clear loading state
    }
  };

  const fetchAssets = async () => {
    try {
      const assetsData = await (api.fetchMapAssets as any)(filters);
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

  const handleShapefileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file extension - accept both .shp and .zip
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.shp') && !fileName.endsWith('.zip')) {
      setError('Please select a .zip file containing shapefile components (.shp, .shx, .dbf, etc.)');
      return;
    }

    if (!mapView || !arcgisLoaded) {
      setError('Map not initialized. Please wait for the map to load.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const layerName = file.name.replace(/\.(shp|zip)$/i, '');
      const layer = await loadShapefileToMap(file, mapView, {
        layerName: layerName,
        visible: true,
        opacity: 0.7,
        maxFeatures: 50000, // Increased limit to show more features (was 10000)
        enableSimplification: true, // Enable geometry simplification
        simplifyTolerance: 0.0001 // Simplification tolerance (adjust based on zoom level if needed)
      });

      setShapefileLayers(prev => [...prev, layer]);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error loading shapefile:', error);
      setError(`Failed to load shapefile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveShapefileLayer = (layerId: string) => {
    if (!mapView) return;

    try {
      const layer = shapefileLayers.find(l => l.id === layerId);
      if (layer) {
        mapView.map.remove(layer);
        setShapefileLayers(prev => prev.filter(l => l.id !== layerId));
      }
    } catch (error) {
      console.error('Error removing shapefile layer:', error);
      setError('Failed to remove shapefile layer');
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
            
            {/* Section Search */}
            {arcgisLoaded && !useFallbackMap && sections.length > 0 && (
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Search sections (e.g., 33-1N-5W)..."
                  value={sectionSearchTerm}
                  onChange={(e) => setSectionSearchTerm(e.target.value)}
                  onKeyDown={async (e) => {
                    if (e.key === 'Enter' && sectionSearchTerm.trim()) {
                      // Find and zoom to matching section
                      const matchingSection = sections.find(s => 
                        (s.str || s.sectionName || '').toLowerCase().includes(sectionSearchTerm.toLowerCase().trim())
                      );
                      if (matchingSection && mapView) {
                        // Find the graphic for this section and zoom to it
                        if (sectionsLayer) {
                          const graphic = Array.from(sectionsLayer.graphics).find((g: any) => 
                            g.attributes && g.attributes.id === matchingSection.id
                          ) as any;
                          if (graphic && graphic.geometry) {
                            const geometry = graphic.geometry as any;
                            await mapView.goTo(geometry, { zoom: 14, duration: 1000 });
                            setSectionSearchTerm(''); // Clear search after zooming
                          }
                        }
                      }
                    }
                  }}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  style={{ minWidth: '250px' }}
                />
                <button
                  onClick={() => setShowLabels(!showLabels)}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    showLabels ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-700'
                  }`}
                  title="Toggle section labels"
                >
                  {showLabels ? 'Hide' : 'Show'} Labels
                </button>
              </div>
            )}
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
                    {filterOptions?.assetTypes?.map((type: string) => (
                      <option key={type} value={type}>{type}</option>
                    )) || []}
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
                    {filterOptions?.counties?.map((county: string) => (
                      <option key={county} value={county}>{county}</option>
                    )) || []}
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
                    {filterOptions?.states?.map((state: string) => (
                      <option key={state} value={state}>{state}</option>
                    )) || []}
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
                    {filterOptions?.assignmentStatuses?.map((status: string) => (
                      <option key={status} value={status}>{status}</option>
                    )) || []}
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
                {overlays?.map(overlay => (
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

            {/* Zoom Controls */}
            {arcgisLoaded && !useFallbackMap && mapView && (
              <div className="flex items-center space-x-1 bg-white border border-gray-300 rounded-md p-1">
                <button
                  onClick={() => mapView.zoom = (mapView.zoom || 10) + 1}
                  className="px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded"
                  title="Zoom In"
                >
                  +
                </button>
                <button
                  onClick={() => mapView.zoom = (mapView.zoom || 10) - 1}
                  className="px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded"
                  title="Zoom Out"
                >
                  −
                </button>
                <button
                  onClick={async () => {
                    if (sectionsLayer && sectionsLayer.graphics.length > 0) {
                      try {
                        const extent = sectionsLayer.fullExtent;
                        if (extent) {
                          await mapView.goTo(extent.expand(1.2));
                        }
                      } catch (e) {
                        console.warn('Could not zoom to sections:', e);
                      }
                    }
                  }}
                  className="px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded"
                  title="Zoom to All Sections"
                >
                  Fit Sections
                </button>
                {shapefileLayers.length > 0 && (
                  <button
                    onClick={async () => {
                      try {
                        const geometryEngine = await import('@arcgis/core/geometry/geometryEngine');
                        
                        const allGeometries: any[] = [];
                        shapefileLayers.forEach((layer: any) => {
                          if (layer.graphics) {
                            Array.from(layer.graphics).forEach((g: any) => {
                              if (g.geometry) allGeometries.push(g.geometry);
                            });
                          }
                        });
                        
                        if (allGeometries.length > 0) {
                          const union = geometryEngine.union(allGeometries as any);
                          if (union && union.extent) {
                            await mapView.goTo(union.extent.expand(1.1), { duration: 1000 });
                          }
                        }
                      } catch (e) {
                        console.warn('Could not zoom to shapefiles:', e);
                      }
                    }}
                    className="px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded"
                    title="Zoom to All Shapefiles"
                  >
                    Fit Shapefiles
                  </button>
                )}
              </div>
            )}

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
              
              {/* Shapefile Upload */}
              {arcgisLoaded && !useFallbackMap && (
                <div className="relative">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-blue-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-600 flex items-center"
                    title="Upload Shapefile ZIP (.zip file containing .shp, .shx, .dbf, etc.)"
                  >
                    <MapIcon className="h-4 w-4 mr-2" />
                    Load Shapefile
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".zip,.shp"
                    onChange={handleShapefileUpload}
                    className="hidden"
                  />
                </div>
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
          <div className="flex-1 relative" style={{ minHeight: '500px', maxHeight: '800px' }}>
            <div 
              ref={mapRef} 
              className="w-full h-full" 
              style={{ 
                width: '100%', 
                height: '100%',
                minHeight: '500px',
                maxHeight: '800px',
                maxWidth: '100%'
              }}
            />
            
            {isLoading && (
              <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
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
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Mapping Dashboard Overview</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-white p-3 rounded shadow">
                    <div className="font-semibold text-blue-600">{assets.filter(a => a.assetType === 'Tract').length}</div>
                    <div className="text-gray-600">Tracts</div>
                  </div>
                  <div className="bg-white p-3 rounded shadow">
                    <div className="font-semibold text-purple-600">{assets.filter(a => a.assetType === 'Unit').length}</div>
                    <div className="text-gray-600">Units</div>
                  </div>
                  <div className="bg-white p-3 rounded shadow">
                    <div className="font-semibold text-green-600">{sections.length}</div>
                    <div className="text-gray-600">Sections</div>
                    {sections.length > 0 && (
                      <div className="text-xs text-gray-500 mt-1">
                        {sectionsLayer ? '✓ Loaded on map' : 'Loading...'}
                      </div>
                    )}
                  </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-4">
                    Configure REACT_APP_ARCGIS_API_KEY for full mapping features.
                  </p>
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && !useFallbackMap && (
              <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center">
                <div className="text-center text-red-600">
                  <MapIcon className="h-12 w-12 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Map Error</h3>
                  <p className="text-sm">{error}</p>
                  <button 
                    onClick={() => window.location.reload()} 
                    className="mt-4 bg-orange-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-orange-600"
                  >
                    Retry
                  </button>
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

            {/* PLSS Sections */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">PLSS Sections</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(173, 160, 200, 0.7)' }}></div>
                  <span className="text-sm text-gray-600">In Database</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(220, 220, 220, 0.4)' }}></div>
                  <span className="text-sm text-gray-600">Not in Database</span>
                </div>
              </div>
            </div>

            {/* Wells */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-700">Wells</h4>
                <button
                  onClick={() => {
                    setShowWells(!showWells);
                    if (wellsLayer) {
                      wellsLayer.visible = !showWells;
                    }
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  {showWells ? 'Hide' : 'Show'}
                </button>
              </div>
              {showWells && (
                <div className="space-y-3">
                  {/* Well Status Colors */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="text-sm text-gray-600">Producing</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                      <span className="text-sm text-gray-600">Drilling</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <span className="text-sm text-gray-600">Shut-in</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                      <span className="text-sm text-gray-600">Abandoned</span>
                    </div>
                  </div>
                  
                  {/* Well Type Filter */}
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-medium text-gray-700">
                        Filter by Well Type
                      </label>
                      {selectedWellTypes.length > 0 && (
                        <button
                          onClick={() => setSelectedWellTypes([])}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-md p-2 space-y-1">
                      {[
                        { value: 'OIL', label: 'OIL - Oil Well', count: 173120 },
                        { value: 'GAS', label: 'GAS - Gas Well', count: 73737 },
                        { value: 'DRY', label: 'DRY - Dry Hole', count: 82628 },
                        { value: 'NT', label: 'NT - Not Tested', count: 82230 },
                        { value: 'TM', label: 'TM - Test Mode', count: 8399 },
                        { value: '2RIn', label: '2RIn - Re-entry In Progress', count: 7256 },
                        { value: '2DNC', label: '2DNC - Drilling Not Complete', count: 3548 },
                        { value: 'INJ', label: 'INJ - Injection', count: 3166 },
                        { value: 'SWD', label: 'SWD - Salt Water Disposal', count: 1593 },
                        { value: 'WSW', label: 'WSW - Water Source Well', count: 1422 },
                        { value: 'OG', label: 'OG - Oil & Gas', count: 1251 },
                        { value: 'STFD', label: 'STFD - Shut-in Temporarily', count: 591 },
                        { value: '2DCm', label: '2DCm - Drilling Complete', count: 402 },
                        { value: 'GSW', label: 'GSW - Gas Storage Well', count: 325 },
                        { value: 'P&A', label: 'P&A - Plugged & Abandoned', count: 272 },
                        { value: 'SW', label: 'SW - Salt Water', count: 259 },
                        { value: 'TA', label: 'TA - Temporarily Abandoned', count: 240 },
                        { value: '2D', label: '2D - Drilling', count: 188 },
                        { value: '2R', label: '2R - Re-entry', count: 166 },
                        { value: '2RSI', label: '2RSI - Re-entry Shut-in', count: 61 },
                        { value: 'DUC', label: 'DUC - Drilled Uncompleted', count: 45 },
                        { value: 'LPSW', label: 'LPSW - Low Pressure Salt Water', count: 27 },
                        { value: 'PA', label: 'PA - Plugged & Abandoned', count: 26 },
                        { value: 'ND', label: 'ND - Not Drilled', count: 14 },
                        { value: 'OBS', label: 'OBS - Observation', count: 14 },
                        { value: 'WIW', label: 'WIW - Water Injection Well', count: 11 },
                        { value: 'SCO', label: 'SCO - Shut-in Complete', count: 7 },
                        { value: 'IEPA', label: 'IEPA - Injection EPA', count: 2 },
                        { value: '2EPA', label: '2EPA - EPA', count: 1 },
                      ].map((type) => (
                        <label key={type.value} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                          <input
                            type="checkbox"
                            checked={selectedWellTypes.includes(type.value)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedWellTypes([...selectedWellTypes, type.value]);
                              } else {
                                setSelectedWellTypes(selectedWellTypes.filter(t => t !== type.value));
                              }
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-xs text-gray-700 flex-1">
                            {type.label}
                          </span>
                          <span className="text-xs text-gray-500">
                            ({type.count.toLocaleString()})
                          </span>
                        </label>
                      ))}
                    </div>
                    {selectedWellTypes.length === 0 && (
                      <p className="text-xs text-gray-500 mt-2">
                        No filter applied - showing all well types
                      </p>
                    )}
                    {selectedWellTypes.length > 0 && (
                      <p className="text-xs text-blue-600 mt-2">
                        Showing {selectedWellTypes.length} well type{selectedWellTypes.length > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </div>
              )}
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
                <div className="flex items-center space-x-2">
                  <div className={`w-4 h-4 rounded-full ${sectionsLayer ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  <span className="text-sm text-gray-600">
                    Sections ({sections.length})
                    {sectionsLayer && sections.length > 0 && ' - Visible'}
                  </span>
                </div>
              </div>
            </div>

            {/* Overlay Legends */}
            {overlays?.filter(o => o.isVisible && o.legend)?.map(overlay => (
              <div key={overlay.id} className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">{overlay.legend!.title}</h4>
                <div className="space-y-2">
                  {overlay.legend?.items?.map((item, index) => (
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

            {/* Shapefile Layers */}
            {shapefileLayers.length > 0 && (
              <div className="mb-6 border-t border-gray-200 pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Shapefile Layers</h4>
                <div className="space-y-2">
                  {shapefileLayers.map(layer => (
                    <div key={layer.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 rounded border-2 border-blue-500 bg-blue-100"></div>
                        <span className="text-sm text-gray-600">{layer.title || layer.id}</span>
                      </div>
                      <button
                        onClick={() => handleRemoveShapefileLayer(layer.id)}
                        className="text-red-500 hover:text-red-700 text-xs font-bold"
                        title="Remove layer"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Selected Assets Summary */}
            {selectedAssets.length > 0 && (
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Selected Assets ({selectedAssets.length})</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedAssets?.map(asset => (
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

      {/* Error Display */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-lg z-50 max-w-md">
          <div className="flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-4 text-red-700 hover:text-red-900 font-bold"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MappingDashboard;
