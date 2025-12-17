import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapIcon, FilterIcon, EyeIcon, EyeSlashIcon, DownloadIcon, UserGroupIcon, CubeIcon, MapPinIcon, ChevronDownIcon, ChevronUpIcon } from './icons/Icons';
import type { MapAsset, MapFilter, MapSelection, MapOverlay, MapLayerConfig, User, Section } from '../types';
import * as api from '../services/api';
import * as arcgis from '../services/arcgis';
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
        (api.fetchSections as any)(1, 1000) // Fetch all sections (up to 1000)
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

    try {
      // Load ArcGIS modules if needed
      await arcgis.loadModules();
      
      // Import ArcGIS modules dynamically
      const GraphicsLayerModule = await import('@arcgis/core/layers/GraphicsLayer');
      const GraphicModule = await import('@arcgis/core/Graphic');
      const PointModule = await import('@arcgis/core/geometry/Point');
      const SimpleMarkerSymbolModule = await import('@arcgis/core/symbols/SimpleMarkerSymbol');
      const SpatialReferenceModule = await import('@arcgis/core/geometry/SpatialReference');
      
      const GraphicsLayer = GraphicsLayerModule.default;
      const Graphic = GraphicModule.default;
      const Point = PointModule.default;
      const SimpleMarkerSymbol = SimpleMarkerSymbolModule.default;
      const SpatialReference = SpatialReferenceModule.default;

      // Remove existing sections layer if it exists
      if (sectionsLayer) {
        // Clean up event handlers
        if ((sectionsLayer as any)._clickHandler) {
          (sectionsLayer as any)._clickHandler.remove();
        }
        if ((sectionsLayer as any)._pointerMoveHandler) {
          (sectionsLayer as any)._pointerMoveHandler.remove();
        }
        if ((sectionsLayer as any)._popupActionHandler) {
          (sectionsLayer as any)._popupActionHandler.remove();
        }
        if ((sectionsLayer as any)._popupOpenHandler) {
          (sectionsLayer as any)._popupOpenHandler.remove();
        }
        mapView.map.remove(sectionsLayer);
      }

      // Create new sections layer
      const layer = new GraphicsLayer({
        id: 'sections-layer',
        title: 'Sections',
        listMode: 'show'
      });

      // Import PopupTemplate for proper popup (do this once before the loop)
      const PopupTemplateModule = await import('@arcgis/core/PopupTemplate');
      const PopupTemplate = PopupTemplateModule.default;

      // Group sections by county for better visualization
      const sectionsByCounty: { [key: string]: Section[] } = {};
      sectionsData.forEach(section => {
        const county = section.county || 'Unknown';
        if (!sectionsByCounty[county]) {
          sectionsByCounty[county] = [];
        }
        sectionsByCounty[county].push(section);
      });

      // Add sections to map
      let totalGraphicsAdded = 0;
      Object.entries(sectionsByCounty).forEach(([county, countySections], countyIndex) => {
        const countyCenter = getCountyCenter(county, countySections[0]?.state || 'OK');
        if (!countyCenter) {
          console.warn(`Could not find county center for ${county}, ${countySections[0]?.state || 'OK'}`);
          return;
        }

        const [lon, lat] = countyCenter;
        console.log(`Adding ${countySections.length} sections for county: ${county} at [${lon}, ${lat}]`);
        
        // Create a grid pattern for sections within the same county
        const cols = Math.ceil(Math.sqrt(countySections.length));
        const spacing = 0.05; // degrees spacing between sections
        const startLon = lon - (cols - 1) * spacing / 2;
        const startLat = lat + (cols - 1) * spacing / 2;

        countySections.forEach((section, index) => {
          const row = Math.floor(index / cols);
          const col = index % cols;
          const sectionLon = startLon + col * spacing;
          const sectionLat = startLat - row * spacing;

          // Create point geometry
          const point = new Point({
            longitude: sectionLon,
            latitude: sectionLat,
            spatialReference: SpatialReference.WGS84
          });

          // Create marker symbol - make it more visible
          const symbol = new SimpleMarkerSymbol({
            style: 'circle',
            color: [59, 130, 246, 1.0], // Blue, fully opaque
            size: 16, // Larger size for better visibility
            outline: {
              color: [255, 255, 255, 1], // White outline for contrast
              width: 2
            }
          });

          // Create popup template with proper structure and action
          const popupTemplate = new PopupTemplate({
            title: section.sectionName || section.str || 'Section',
            content: `
              <div style="padding: 10px;">
                <p><strong>Section:</strong> ${section.sectionName || section.str || 'N/A'}</p>
                <p><strong>County:</strong> ${section.county || 'N/A'}</p>
                <p><strong>State:</strong> ${section.state || 'N/A'}</p>
                <p><strong>STR:</strong> ${section.str || 'N/A'}</p>
                <p><strong>Net Mineral Acres:</strong> ${section.netMineralAcres?.toFixed(2) || '0'}</p>
                <p><strong>Status:</strong> ${section.status || 'unassigned'}</p>
              </div>
            `,
            actions: [
              {
                title: 'View Details',
                id: 'view-details',
                type: 'button' as const
              }
            ]
          });

          // Create graphic with cursor pointer style
          const graphic = new Graphic({
            geometry: point,
            symbol: symbol,
            attributes: {
              id: section.id,
              sectionName: section.sectionName || section.str || 'Unknown',
              county: section.county || 'Unknown',
              state: section.state || 'OK',
              str: section.str || '',
              netMineralAcres: section.netMineralAcres || 0,
              status: section.status || 'unassigned'
            },
            popupTemplate: popupTemplate
          });

          layer.add(graphic);
          totalGraphicsAdded++;
        });
      });

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

      // Add pointer-move event for hover tooltips
      const pointerMoveHandler = mapView.on('pointer-move', async (event: any) => {
        try {
          const hitTest = await mapView.hitTest(event);
          const sectionResult = hitTest.results.find((result: any) => 
            result.graphic && result.graphic.layer === layer
          );
          
          if (sectionResult && sectionResult.graphic && sectionResult.graphic.attributes) {
            // Change cursor to pointer
            mapView.container.style.cursor = 'pointer';
            
            // Show hover info
            const sectionName = sectionResult.graphic.attributes.sectionName || 
                               sectionResult.graphic.attributes.str || 
                               'Section';
            const county = sectionResult.graphic.attributes.county || 'Unknown';
            const state = sectionResult.graphic.attributes.state || 'OK';
            
            // Create or get tooltip element
            let tooltip = document.getElementById('section-hover-tooltip') as HTMLElement;
            if (!tooltip) {
              tooltip = document.createElement('div');
              tooltip.id = 'section-hover-tooltip';
              tooltip.style.cssText = `
                position: fixed;
                background: rgba(0, 0, 0, 0.85);
                color: white;
                padding: 8px 12px;
                border-radius: 6px;
                font-size: 13px;
                pointer-events: none;
                z-index: 10000;
                display: none;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                max-width: 250px;
                line-height: 1.4;
              `;
              document.body.appendChild(tooltip);
            }
            
            tooltip.innerHTML = `
              <div style="font-weight: 600; margin-bottom: 4px;">${sectionName}</div>
              <div style="font-size: 11px; opacity: 0.9;">${county} County, ${state}</div>
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

      // Add layer to map
      mapView.map.add(layer);
      setSectionsLayer(layer);

      console.log(`Successfully added ${totalGraphicsAdded} section graphics to map`);
      console.log(`Sections layer added to map. Layer count: ${mapView.map.layers.length}`);
      
      // Handle popup action clicks (backup navigation method)
      const popupActionHandler = mapView.popup.on('trigger-action', (event: any) => {
        if (event.action.id === 'view-details') {
          const graphic = mapView.popup.selectedFeature;
          if (graphic && graphic.attributes && graphic.attributes.id) {
            console.log('Popup action clicked, navigating to:', graphic.attributes.id);
            navigate(`/sections/${graphic.attributes.id}`);
          }
        }
      });

      // Also handle popup opening to ensure we can navigate
      const popupOpenHandler = mapView.popup.watch('visible', (visible: boolean) => {
        if (visible && mapView.popup.selectedFeature) {
          const graphic = mapView.popup.selectedFeature;
          if (graphic && graphic.attributes && graphic.attributes.id) {
            // Store the section ID for the popup action button
            (graphic as any)._sectionId = graphic.attributes.id;
          }
        }
      });

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
    </div>
  );
};

export default MappingDashboard;
