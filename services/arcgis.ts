import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import SceneView from "@arcgis/core/views/SceneView";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Graphic from "@arcgis/core/Graphic";
import Point from "@arcgis/core/geometry/Point";
import Polygon from "@arcgis/core/geometry/Polygon";
import SimpleMarkerSymbol from "@arcgis/core/symbols/SimpleMarkerSymbol";
import SimpleLineSymbol from "@arcgis/core/symbols/SimpleLineSymbol";
import SimpleFillSymbol from "@arcgis/core/symbols/SimpleFillSymbol";
import TextSymbol from "@arcgis/core/symbols/TextSymbol";
import Color from "@arcgis/core/Color";
import PopupTemplate from "@arcgis/core/PopupTemplate";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import * as geometryEngine from "@arcgis/core/geometry/geometryEngine";
import SpatialReference from "@arcgis/core/geometry/SpatialReference";

// ArcGIS Configuration
export const ARCGIS_CONFIG = {
  // API key from environment variable
  apiKey: process.env.REACT_APP_ARCGIS_API_KEY || "",
  basemapId: "satellite",
  center: [-102.0776, 31.9686], // Default center (Midland, TX)
  zoom: 12,
  spatialReference: SpatialReference.WGS84
};

// Map Layer Configuration
export const LAYER_CONFIG = {
  tractBoundary: {
    id: "tract-boundary",
    title: "Tract Boundary",
    color: [255, 107, 53, 0.8], // Orange
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