// Dynamic imports for ArcGIS modules to avoid prototype errors
let Map: any;
let MapView: any;
let SceneView: any;
let GraphicsLayer: any;
let Graphic: any;
let Point: any;
let Polygon: any;
let SimpleMarkerSymbol: any;
let SimpleLineSymbol: any;
let SimpleFillSymbol: any;
let TextSymbol: any;
let Color: any;
let PopupTemplate: any;
let FeatureLayer: any;
let geometryEngine: any;
let SpatialReference: any;

// ArcGIS Configuration
export const ARCGIS_CONFIG = {
  // API key from environment variable
  apiKey: process.env.REACT_APP_ARCGIS_API_KEY || "",
  basemapId: "satellite",
  center: [-102.0776, 31.9686], // Default center (Midland, TX)
  zoom: 12,
  spatialReference: null // Will be set after modules are loaded
};

// Map Layer Configuration
export const LAYER_CONFIG = {
  tractBoundary: {
    id: "tract-boundary",
    title: "Tract Boundary",
    color: [255, 107, 53, 0.8], // Orange
    symbol: "polygon"
  },
  sections: {
    id: "sections",
    title: "Township Sections",
    color: [59, 130, 246, 0.7], // Blue
    symbol: "polygon"
  },
  producingWells: {
    id: "producing-wells",
    title: "Producing Wells",
    color: [76, 175, 80, 0.8], // Green
    symbol: "circle"
  },
  permits: {
    id: "permits",
    title: "Permits",
    color: [255, 193, 7, 0.8], // Yellow
    symbol: "square"
  },
  rigs: {
    id: "rigs",
    title: "Rigs",
    color: [233, 30, 99, 0.8], // Pink
    symbol: "diamond"
  },
  units: {
    id: "units",
    title: "Units",
    color: [156, 39, 176, 0.6], // Purple
    symbol: "polygon"
  }
};

// Utility functions for creating map symbols
export const createSymbol = (type: string, color: number[], size: number = 12) => {
  if (!Color) {
    throw new Error('ArcGIS modules not loaded. Call loadModules() first.');
  }
  const colorObj = new Color(color);
  
  switch (type) {
    case "circle":
      return new SimpleMarkerSymbol({
        color: colorObj,
        size: size,
        outline: {
          color: [255, 255, 255, 0.8],
          width: 1
        }
      });
    case "square":
      return new SimpleMarkerSymbol({
        color: colorObj,
        size: size,
        style: "square",
        outline: {
          color: [255, 255, 255, 0.8],
          width: 1
        }
      });
    case "diamond":
      return new SimpleMarkerSymbol({
        color: colorObj,
        size: size,
        style: "diamond",
        outline: {
          color: [255, 255, 255, 0.8],
          width: 1
        }
      });
    case "polygon":
      return new SimpleFillSymbol({
        color: [color[0], color[1], color[2], 0.3],
        outline: {
          color: colorObj,
          width: 2
        }
      });
    default:
      return new SimpleMarkerSymbol({
        color: colorObj,
        size: size
      });
  }
};

// Create popup template for features
export const createPopupTemplate = (type: string) => {
  if (!PopupTemplate) {
    throw new Error('ArcGIS modules not loaded. Call loadModules() first.');
  }
  
  const title = type === 'well' ? 'Well Information' :
                type === 'permit' ? 'Permit Information' :
                type === 'rig' ? 'Rig Information' :
                type === 'unit' ? 'Unit Information' :
                'Tract Information';

  return new PopupTemplate({
    title: title,
    content: [
      {
        type: "fields",
        fieldInfos: getFieldInfos(type)
      }
    ]
  });
};

const getFieldInfos = (type: string) => {
  switch (type) {
    case 'well':
      return [
        { fieldName: "wellName", label: "Well Name" },
        { fieldName: "apiNumber", label: "API Number" },
        { fieldName: "operator", label: "Operator" },
        { fieldName: "status", label: "Status" },
        { fieldName: "totalDepth", label: "Total Depth (ft)" },
        { fieldName: "spudDate", label: "Spud Date" },
        { fieldName: "completionDate", label: "Completion Date" }
      ];
    case 'permit':
      return [
        { fieldName: "permitNumber", label: "Permit Number" },
        { fieldName: "operator", label: "Operator" },
        { fieldName: "permitType", label: "Type" },
        { fieldName: "status", label: "Status" },
        { fieldName: "targetFormation", label: "Target Formation" },
        { fieldName: "totalDepth", label: "Total Depth (ft)" },
        { fieldName: "permitDate", label: "Permit Date" }
      ];
    case 'rig':
      return [
        { fieldName: "rigName", label: "Rig Name" },
        { fieldName: "operator", label: "Operator" },
        { fieldName: "rigType", label: "Type" },
        { fieldName: "status", label: "Status" },
        { fieldName: "totalDepth", label: "Total Depth (ft)" },
        { fieldName: "spudDate", label: "Spud Date" },
        { fieldName: "targetCompletion", label: "Target Completion" }
      ];
    case 'unit':
      return [
        { fieldName: "unitName", label: "Unit Name" },
        { fieldName: "operator", label: "Operator" },
        { fieldName: "unitType", label: "Type" },
        { fieldName: "status", label: "Status" },
        { fieldName: "formation", label: "Formation" }
      ];
    default:
      return [
        { fieldName: "name", label: "Name" },
        { fieldName: "geometryType", label: "Geometry Type" },
        { fieldName: "str", label: "STR" }
      ];
  }
};

// Create graphics from data
export const createGraphicsFromData = (data: any[], type: string, layerConfig: any) => {
  if (!Point || !Polygon || !Graphic || !SpatialReference) {
    throw new Error('ArcGIS modules not loaded. Call loadModules() first.');
  }
  
  return data.map(item => {
    let geometry;
    let attributes: any = {};

    switch (type) {
      case 'well':
        geometry = new Point({
          longitude: item.longitude,
          latitude: item.latitude,
          spatialReference: SpatialReference.WGS84
        });
        attributes = {
          wellName: item.wellName,
          apiNumber: item.apiNumber,
          operator: item.operator,
          status: item.status,
          totalDepth: item.totalDepth,
          spudDate: item.spudDate,
          completionDate: item.completionDate
        };
        break;
      case 'permit':
        geometry = new Point({
          longitude: item.longitude,
          latitude: item.latitude,
          spatialReference: SpatialReference.WGS84
        });
        attributes = {
          permitNumber: item.permitNumber,
          operator: item.operator,
          permitType: item.permitType,
          status: item.status,
          targetFormation: item.targetFormation,
          totalDepth: item.totalDepth,
          permitDate: item.permitDate
        };
        break;
      case 'rig':
        geometry = new Point({
          longitude: item.longitude,
          latitude: item.latitude,
          spatialReference: SpatialReference.WGS84
        });
        attributes = {
          rigName: item.rigName,
          operator: item.operator,
          rigType: item.rigType,
          status: item.status,
          totalDepth: item.totalDepth,
          spudDate: item.spudDate,
          targetCompletion: item.targetCompletion
        };
        break;
      case 'unit':
        // For units, we'll create a simple polygon around the center point
        const center = new Point({
          longitude: item.longitude,
          latitude: item.latitude,
          spatialReference: SpatialReference.WGS84
        });
        const radius = 0.01; // Roughly 1km
        geometry = createPolygonFromCenter(center, radius);
        attributes = {
          unitName: item.unitName,
          operator: item.operator,
          unitType: item.unitType,
          status: item.status,
          formation: item.formation
        };
        break;
      case 'tract':
        // For sections, create a section boundary polygon
        if (item.centroid_lat && item.centroid_lon) {
          const tractCenter = new Point({
            longitude: item.centroid_lon,
            latitude: item.centroid_lat,
            spatialReference: SpatialReference.WGS84
          });
          // Create a section-sized polygon (approximately 1 mile x 1 mile)
          const sectionRadius = 0.005; // Roughly 0.5 mile radius for a section
          geometry = createPolygonFromCenter(tractCenter, sectionRadius);
          attributes = {
            tractId: item.tract_id,
            areaAcres: item.area_acres,
            sectionNumber: item.section_number,
            township: item.township,
            range: item.range,
            str: `${item.section_number}-${item.township}-${item.range}`
          };
        } else {
          // Fallback to a point if no coordinates
          geometry = new Point({
            longitude: -102.0776, // Default Midland, TX coordinates
            latitude: 31.9686,
            spatialReference: SpatialReference.WGS84
          });
          attributes = {
            tractId: item.tract_id,
            areaAcres: item.area_acres,
            str: 'Unknown Location'
          };
        }
        break;
      default:
        geometry = new Point({
          longitude: item.longitude,
          latitude: item.latitude,
          spatialReference: SpatialReference.WGS84
        });
        attributes = {
          name: item.name,
          geometryType: item.geometryType,
          str: item.geometryData?.str
        };
    }

    const symbol = createSymbol(layerConfig.symbol, layerConfig.color);
    const popupTemplate = createPopupTemplate(type);

    return new Graphic({
      geometry,
      symbol,
      attributes,
      popupTemplate
    });
  });
};

// Helper function to create a simple polygon around a center point
const createPolygonFromCenter = (center: Point, radius: number) => {
  const rings = [
    [
      [center.longitude - radius, center.latitude - radius],
      [center.longitude + radius, center.latitude - radius],
      [center.longitude + radius, center.latitude + radius],
      [center.longitude - radius, center.latitude + radius],
      [center.longitude - radius, center.latitude - radius]
    ]
  ];

  return new Polygon({
    rings,
    spatialReference: SpatialReference.WGS84
  });
};

// Calculate distance between two points
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Filter features by distance from a center point
export const filterByDistance = (features: any[], centerLat: number, centerLon: number, maxDistance: number) => {
  return features.filter(feature => {
    const distance = calculateDistance(centerLat, centerLon, feature.latitude, feature.longitude);
    return distance <= maxDistance;
  });
};

// Load ArcGIS modules
export const loadModules = async () => {
  try {
    // Dynamically import ArcGIS modules to avoid prototype errors
    const [
      MapModule,
      MapViewModule,
      SceneViewModule,
      GraphicsLayerModule,
      GraphicModule,
      PointModule,
      PolygonModule,
      SimpleMarkerSymbolModule,
      SimpleLineSymbolModule,
      SimpleFillSymbolModule,
      TextSymbolModule,
      ColorModule,
      PopupTemplateModule,
      FeatureLayerModule,
      GeometryEngineModule,
      SpatialReferenceModule
    ] = await Promise.all([
      import("@arcgis/core/Map"),
      import("@arcgis/core/views/MapView"),
      import("@arcgis/core/views/SceneView"),
      import("@arcgis/core/layers/GraphicsLayer"),
      import("@arcgis/core/Graphic"),
      import("@arcgis/core/geometry/Point"),
      import("@arcgis/core/geometry/Polygon"),
      import("@arcgis/core/symbols/SimpleMarkerSymbol"),
      import("@arcgis/core/symbols/SimpleLineSymbol"),
      import("@arcgis/core/symbols/SimpleFillSymbol"),
      import("@arcgis/core/symbols/TextSymbol"),
      import("@arcgis/core/Color"),
      import("@arcgis/core/PopupTemplate"),
      import("@arcgis/core/layers/FeatureLayer"),
      import("@arcgis/core/geometry/geometryEngine"),
      import("@arcgis/core/geometry/SpatialReference")
    ]);

    // Assign the imported modules to our variables
    Map = MapModule.default;
    MapView = MapViewModule.default;
    SceneView = SceneViewModule.default;
    GraphicsLayer = GraphicsLayerModule.default;
    Graphic = GraphicModule.default;
    Point = PointModule.default;
    Polygon = PolygonModule.default;
    SimpleMarkerSymbol = SimpleMarkerSymbolModule.default;
    SimpleLineSymbol = SimpleLineSymbolModule.default;
    SimpleFillSymbol = SimpleFillSymbolModule.default;
    TextSymbol = TextSymbolModule.default;
    Color = ColorModule.default;
    PopupTemplate = PopupTemplateModule.default;
    FeatureLayer = FeatureLayerModule.default;
    geometryEngine = GeometryEngineModule;
    SpatialReference = SpatialReferenceModule.default;

    // Set the spatial reference in config
    ARCGIS_CONFIG.spatialReference = SpatialReference.WGS84;

    console.log('ArcGIS modules loaded successfully');
    return Promise.resolve();
  } catch (error) {
    console.error('Failed to load ArcGIS modules:', error);
    throw error;
  }
};

// Create contact map view
export const createContactMapView = async (
  container: HTMLElement, 
  contact: any, 
  sections: any[], 
  units: any[]
) => {
  if (!Map || !MapView) {
    throw new Error('ArcGIS modules not loaded. Call loadModules() first.');
  }
  
  // Create a new map
  const map = new Map({
    basemap: ARCGIS_CONFIG.basemapId,
    spatialReference: ARCGIS_CONFIG.spatialReference
  });

  // Create map view
  const view = new MapView({
    container,
    map,
    center: ARCGIS_CONFIG.center,
    zoom: ARCGIS_CONFIG.zoom,
    spatialReference: ARCGIS_CONFIG.spatialReference
  });

  return view;
};

// Create general map view for mapping dashboard
export const createMapView = async (container: HTMLElement) => {
  if (!Map || !MapView) {
    throw new Error('ArcGIS modules not loaded. Call loadModules() first.');
  }
  
  // Create a new map
  const map = new Map({
    basemap: ARCGIS_CONFIG.basemapId,
    spatialReference: ARCGIS_CONFIG.spatialReference
  });

  // Create map view
  const view = new MapView({
    container,
    map,
    center: ARCGIS_CONFIG.center,
    zoom: ARCGIS_CONFIG.zoom,
    spatialReference: ARCGIS_CONFIG.spatialReference
  });

  return view;
};

// Add layer to map view
export const addLayerToMap = async (view: any, layer: any) => {
  if (view && view.map && layer) {
    view.map.add(layer);
  }
};

// Create tract layer for mapping dashboard
export const createTractLayerForMap = async (tractAssets: any[]) => {
  if (!GraphicsLayer || !Polygon || !SimpleFillSymbol || !Graphic || !SpatialReference) {
    throw new Error('ArcGIS modules not loaded. Call loadModules() first.');
  }
  
  const layer = new GraphicsLayer({
    id: 'sections-map',
    title: 'Sections'
  });

  tractAssets.forEach(asset => {
    if (asset.geometry && asset.geometry.coordinates) {
      const geometry = new Polygon({
        rings: asset.geometry.coordinates,
        spatialReference: SpatialReference.WGS84
      });

      const symbol = new SimpleFillSymbol({
        color: [59, 130, 246, 0.7], // Blue
        outline: {
          color: [30, 64, 175, 1], // Darker blue
          width: 2
        }
      });

      const graphic = new Graphic({
        geometry,
        symbol,
        attributes: {
          tractId: asset.id,
          name: asset.asset.tractName || asset.asset.name,
          status: asset.status,
          assignedBuyer: asset.assignedBuyerId
        }
      });

      layer.add(graphic);
    }
  });

  return layer;
};

// Create unit layer for mapping dashboard
export const createUnitLayerForMap = async (unitAssets: any[]) => {
  if (!GraphicsLayer || !Polygon || !SimpleFillSymbol || !Graphic || !SpatialReference) {
    throw new Error('ArcGIS modules not loaded. Call loadModules() first.');
  }
  
  const layer = new GraphicsLayer({
    id: 'units-map',
    title: 'Units'
  });

  unitAssets.forEach(asset => {
    if (asset.geometry && asset.geometry.coordinates) {
      const geometry = new Polygon({
        rings: asset.geometry.coordinates,
        spatialReference: SpatialReference.WGS84
      });

      const symbol = new SimpleFillSymbol({
        color: [139, 92, 246, 0.6], // Purple
        outline: {
          color: [109, 40, 217, 1], // Darker purple
          width: 2
        }
      });

      const graphic = new Graphic({
        geometry,
        symbol,
        attributes: {
          unitId: asset.id,
          name: asset.asset.unitName || asset.asset.name,
          status: asset.status,
          assignedBuyer: asset.assignedBuyerId
        }
      });

      layer.add(graphic);
    }
  });

  return layer;
};

// Create tract layer
export const createSectionLayer = async (sectionSpatialData: any[], options: any = {}) => {
  if (!GraphicsLayer || !Polygon || !Point || !SimpleFillSymbol || !Graphic || !SpatialReference) {
    throw new Error('ArcGIS modules not loaded. Call loadModules() first.');
  }
  
  const layer = new GraphicsLayer({
    id: 'sections',
    title: 'Sections'
  });

  sectionSpatialData.forEach(section => {
    if (tract.geometryData) {
      let geometry;
      if (tract.geometryType === 'Polygon' && tract.geometryData.coordinates) {
        geometry = new Polygon({
          rings: tract.geometryData.coordinates,
          spatialReference: SpatialReference.WGS84
        });
      } else if (tract.geometryType === 'Point' && tract.geometryData.coordinates) {
        geometry = new Point({
          longitude: tract.geometryData.coordinates[0],
          latitude: tract.geometryData.coordinates[1],
          spatialReference: SpatialReference.WGS84
        });
      }

      if (geometry) {
        const symbol = new SimpleFillSymbol({
          color: [59, 130, 246, options.opacity || 0.7], // Blue
          outline: {
            color: [30, 64, 175, 1], // Darker blue
            width: 2
          }
        });

        const graphic = new Graphic({
          geometry,
          symbol,
          attributes: {
            tractId: tract.tractId,
            name: tract.tractName,
            status: tract.titleStatus,
            assignedBuyer: tract.assignedBuyerId
          }
        });

        layer.add(graphic);
      }
    }
  });

  return layer;
};

// Create unit layer
export const createUnitLayer = async (unitData: any[], options: any = {}) => {
  if (!GraphicsLayer || !Polygon || !SimpleFillSymbol || !Graphic || !SpatialReference) {
    throw new Error('ArcGIS modules not loaded. Call loadModules() first.');
  }
  
  const layer = new GraphicsLayer({
    id: 'units',
    title: 'Units'
  });

  unitData.forEach(unit => {
    if (unit.geometryData && unit.geometryData.coordinates) {
      const geometry = new Polygon({
        rings: unit.geometryData.coordinates,
        spatialReference: SpatialReference.WGS84
      });

      const symbol = new SimpleFillSymbol({
        color: [139, 92, 246, options.opacity || 0.6], // Purple
        outline: {
          color: [109, 40, 217, 1], // Darker purple
          width: 2
        }
      });

      const graphic = new Graphic({
        geometry,
        symbol,
        attributes: {
          unitId: unit.id,
          name: unit.unitName,
          status: unit.status,
          assignedBuyer: unit.assignedBuyer
        }
      });

      layer.add(graphic);
    }
  });

  return layer;
};

// Create wells layer
export const createWellsLayer = async (wells: any[]) => {
  if (!GraphicsLayer || !Point || !SimpleMarkerSymbol || !Graphic || !SpatialReference) {
    throw new Error('ArcGIS modules not loaded. Call loadModules() first.');
  }
  
  const layer = new GraphicsLayer({
    id: 'wells',
    title: 'Producing Wells'
  });

  wells.forEach(well => {
    const geometry = new Point({
      longitude: well.longitude,
      latitude: well.latitude,
      spatialReference: SpatialReference.WGS84
    });

    const symbol = new SimpleMarkerSymbol({
      color: [76, 175, 80, 0.8], // Green
      size: 8,
      outline: {
        color: [255, 255, 255, 0.8],
        width: 1
      }
    });

    const graphic = new Graphic({
      geometry,
      symbol,
      attributes: {
        name: well.wellName,
        operator: well.operator,
        status: well.status
      }
    });

    layer.add(graphic);
  });

  return layer;
};

// Create permits layer
export const createPermitsLayer = async (permits: any[]) => {
  if (!GraphicsLayer || !Point || !SimpleMarkerSymbol || !Graphic || !SpatialReference) {
    throw new Error('ArcGIS modules not loaded. Call loadModules() first.');
  }
  
  const layer = new GraphicsLayer({
    id: 'permits',
    title: 'Permits'
  });

  permits.forEach(permit => {
    const geometry = new Point({
      longitude: permit.longitude,
      latitude: permit.latitude,
      spatialReference: SpatialReference.WGS84
    });

    const symbol = new SimpleMarkerSymbol({
      color: [255, 193, 7, 0.8], // Yellow
      size: 10,
      style: 'square',
      outline: {
        color: [255, 255, 255, 0.8],
        width: 1
      }
    });

    const graphic = new Graphic({
      geometry,
      symbol,
      attributes: {
        name: permit.permitNumber,
        operator: permit.operator,
        status: permit.status
      }
    });

    layer.add(graphic);
  });

  return layer;
};

// Create rigs layer
export const createRigsLayer = async (rigs: any[]) => {
  if (!GraphicsLayer || !Point || !SimpleMarkerSymbol || !Graphic || !SpatialReference) {
    throw new Error('ArcGIS modules not loaded. Call loadModules() first.');
  }
  
  const layer = new GraphicsLayer({
    id: 'rigs',
    title: 'Rigs'
  });

  rigs.forEach(rig => {
    const geometry = new Point({
      longitude: rig.longitude,
      latitude: rig.latitude,
      spatialReference: SpatialReference.WGS84
    });

    const symbol = new SimpleMarkerSymbol({
      color: [233, 30, 99, 0.8], // Pink
      size: 12,
      style: 'diamond',
      outline: {
        color: [255, 255, 255, 0.8],
        width: 1
      }
    });

    const graphic = new Graphic({
      geometry,
      symbol,
      attributes: {
        name: rig.rigName,
        operator: rig.operator,
        status: rig.status
      }
    });

    layer.add(graphic);
  });

  return layer;
};

// Create distress signals layer
export const createDistressSignalsLayer = async (signals: any[], options: any = {}) => {
  if (!GraphicsLayer || !Point || !SimpleMarkerSymbol || !Graphic || !SpatialReference) {
    throw new Error('ArcGIS modules not loaded. Call loadModules() first.');
  }
  
  const layer = new GraphicsLayer({
    id: 'distressSignals',
    title: 'Distress Signals'
  });

  signals.forEach(signal => {
    // For distress signals, we'll place them at the contact's location
    // In a real implementation, you'd get the actual coordinates
    const geometry = new Point({
      longitude: -102.0776, // Default to Midland, TX
      latitude: 31.9686,
      spatialReference: SpatialReference.WGS84
    });

    const symbol = new SimpleMarkerSymbol({
      color: [239, 68, 68, 0.8], // Red
      size: options.size || 12,
      outline: {
        color: [255, 255, 255, 0.8],
        width: 2
      }
    });

    const graphic = new Graphic({
      geometry,
      symbol,
      attributes: {
        signalType: signal.signalType,
        riskLevel: signal.riskLevel,
        status: signal.signalStatus
      }
    });

    layer.add(graphic);
  });

  return layer;
}; 