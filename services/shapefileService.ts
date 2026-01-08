/**
 * Shapefile Service
 * 
 * Provides utilities for loading and parsing shapefiles (.shp) and converting them
 * to formats compatible with ArcGIS JavaScript API.
 */

import shpjs from 'shpjs';

export interface ShapefileLayer {
  id: string;
  name: string;
  geometry: any; // ArcGIS geometry
  attributes: Record<string, any>;
}

export interface ShapefileLoadOptions {
  layerId?: string;
  layerName?: string;
  symbol?: any; // ArcGIS symbol
  visible?: boolean;
  opacity?: number;
  maxFeatures?: number; // Maximum number of features to render (default: 10000)
  simplifyTolerance?: number; // Simplification tolerance in degrees (default: 0.0001)
  enableSimplification?: boolean; // Enable geometry simplification (default: true)
}

/**
 * Parse a shapefile from a File object
 * @param file - The .shp or .zip file to parse
 * @returns Promise resolving to GeoJSON FeatureCollection
 */
export const parseShapefile = async (file: File): Promise<any> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    // Check if file is a ZIP (shpjs expects ZIP files containing shapefile components)
    // ZIP files start with PK (0x50 0x4B)
    const isZip = arrayBuffer.byteLength >= 2 && 
                  new Uint8Array(arrayBuffer, 0, 2)[0] === 0x50 && 
                  new Uint8Array(arrayBuffer, 0, 2)[1] === 0x4B;
    
    if (!isZip && file.name.toLowerCase().endsWith('.shp')) {
      // Raw .shp file - shpjs requires a ZIP or object with multiple files
      throw new Error(
        'Raw .shp files are not supported. Please provide a ZIP file containing all shapefile components (.shp, .shx, .dbf, etc.). ' +
        'You can create a ZIP file by selecting all shapefile components (.shp, .shx, .dbf, .prj) and compressing them into a single .zip file.'
      );
    }
    
    const geojson = await shpjs(arrayBuffer);
    return geojson;
  } catch (error) {
    console.error('Error parsing shapefile:', error);
    
    // Provide more helpful error messages
    if (error instanceof Error) {
      if (error.message.includes('but-unzip') || error.message.includes('unzip')) {
        throw new Error(
          'Invalid shapefile format. Please provide a ZIP file containing all shapefile components (.shp, .shx, .dbf, etc.). ' +
          'Raw .shp files are not supported. Create a ZIP file by selecting all shapefile components and compressing them.'
        );
      }
      throw new Error(`Failed to parse shapefile: ${error.message}`);
    }
    throw new Error(`Failed to parse shapefile: Unknown error`);
  }
};

/**
 * Parse a shapefile from a URL
 * @param url - URL to the .shp file
 * @returns Promise resolving to GeoJSON FeatureCollection
 */
export const parseShapefileFromUrl = async (url: string): Promise<any> => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch shapefile: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const geojson = await shpjs(arrayBuffer);
    return geojson;
  } catch (error) {
    console.error('Error parsing shapefile from URL:', error);
    throw new Error(`Failed to parse shapefile from URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Simplify a coordinate array using Douglas-Peucker algorithm
 * @param coordinates - Array of [lon, lat] coordinates
 * @param tolerance - Simplification tolerance in degrees
 * @returns Simplified coordinate array
 */
const simplifyCoordinates = (coordinates: number[][], tolerance: number): number[][] => {
  if (coordinates.length <= 2) return coordinates;
  
  // Find the point with maximum distance from line between first and last point
  let maxDist = 0;
  let maxIndex = 0;
  const first = coordinates[0];
  const last = coordinates[coordinates.length - 1];
  
  for (let i = 1; i < coordinates.length - 1; i++) {
    const dist = pointToLineDistance(coordinates[i], first, last);
    if (dist > maxDist) {
      maxDist = dist;
      maxIndex = i;
    }
  }
  
  // If max distance is greater than tolerance, recursively simplify
  if (maxDist > tolerance) {
    const left = simplifyCoordinates(coordinates.slice(0, maxIndex + 1), tolerance);
    const right = simplifyCoordinates(coordinates.slice(maxIndex), tolerance);
    return [...left.slice(0, -1), ...right];
  } else {
    return [first, last];
  }
};

/**
 * Calculate distance from a point to a line segment
 */
const pointToLineDistance = (point: number[], lineStart: number[], lineEnd: number[]): number => {
  const [px, py] = point;
  const [x1, y1] = lineStart;
  const [x2, y2] = lineEnd;
  
  const A = px - x1;
  const B = py - y1;
  const C = x2 - x1;
  const D = y2 - y1;
  
  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;
  
  if (lenSq !== 0) param = dot / lenSq;
  
  let xx, yy;
  
  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }
  
  const dx = px - xx;
  const dy = py - yy;
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Simplify geometry coordinates
 */
const simplifyGeometry = (geoJsonGeometry: any, tolerance: number): any => {
  if (!tolerance || tolerance <= 0) return geoJsonGeometry;
  
  const { type, coordinates } = geoJsonGeometry;
  
  switch (type) {
    case 'Point':
      return geoJsonGeometry; // Points don't need simplification
      
    case 'LineString':
      return {
        type,
        coordinates: simplifyCoordinates(coordinates, tolerance)
      };
      
    case 'MultiLineString':
      return {
        type,
        coordinates: coordinates.map((line: number[][]) => 
          simplifyCoordinates(line, tolerance)
        )
      };
      
    case 'Polygon':
      return {
        type,
        coordinates: coordinates.map((ring: number[][]) => 
          simplifyCoordinates(ring, tolerance)
        )
      };
      
    case 'MultiPolygon':
      return {
        type,
        coordinates: coordinates.map((polygon: number[][][]) =>
          polygon.map((ring: number[][]) => 
            simplifyCoordinates(ring, tolerance)
          )
        )
      };
      
    default:
      return geoJsonGeometry;
  }
};

/**
 * Convert GeoJSON geometry to ArcGIS geometry
 * @param geoJsonGeometry - GeoJSON geometry object
 * @param Point - ArcGIS Point class
 * @param Polyline - ArcGIS Polyline class
 * @param Polygon - ArcGIS Polygon class
 * @param SpatialReference - ArcGIS SpatialReference class
 * @param simplifyTolerance - Optional simplification tolerance
 * @returns ArcGIS geometry object
 */
export const convertGeoJsonToArcGIS = (
  geoJsonGeometry: any,
  Point: any,
  Polyline: any,
  Polygon: any,
  SpatialReference: any,
  simplifyTolerance?: number
): any => {
  if (!SpatialReference || !Point || !Polyline || !Polygon) {
    throw new Error('ArcGIS modules not loaded');
  }

  // Simplify geometry if tolerance is provided
  const geometry = simplifyTolerance && simplifyTolerance > 0
    ? simplifyGeometry(geoJsonGeometry, simplifyTolerance)
    : geoJsonGeometry;

  const { type, coordinates } = geometry;

  switch (type) {
    case 'Point':
      return new Point({
        longitude: coordinates[0],
        latitude: coordinates[1],
        spatialReference: SpatialReference.WGS84
      });

    case 'LineString':
      return new Polyline({
        paths: [coordinates],
        spatialReference: SpatialReference.WGS84
      });

    case 'MultiLineString':
      return new Polyline({
        paths: coordinates,
        spatialReference: SpatialReference.WGS84
      });

    case 'Polygon':
      // Polygon coordinates are an array of rings (first is outer, rest are holes)
      return new Polygon({
        rings: coordinates,
        spatialReference: SpatialReference.WGS84
      });

    case 'MultiPolygon':
      // MultiPolygon is an array of Polygons - flatten to single polygon with all rings
      const allRings: number[][][] = [];
      coordinates.forEach((polygon: number[][][]) => {
        polygon.forEach((ring: number[][]) => {
          allRings.push(ring);
        });
      });
      return new Polygon({
        rings: allRings.length > 0 ? allRings : coordinates[0],
        spatialReference: SpatialReference.WGS84
      });

    default:
      throw new Error(`Unsupported geometry type: ${type}`);
  }
};

/**
 * Load shapefile and add to ArcGIS map
 * @param file - The .shp file to load
 * @param mapView - ArcGIS MapView instance
 * @param options - Configuration options
 * @returns Promise resolving to the created GraphicsLayer
 */
export const loadShapefileToMap = async (
  file: File,
  mapView: any,
  options: ShapefileLoadOptions = {}
): Promise<any> => {
  try {
    // Load ArcGIS modules
    const GraphicsLayerModule = await import('@arcgis/core/layers/GraphicsLayer');
    const GraphicModule = await import('@arcgis/core/Graphic');
    const PointModule = await import('@arcgis/core/geometry/Point');
    const PolylineModule = await import('@arcgis/core/geometry/Polyline');
    const PolygonModule = await import('@arcgis/core/geometry/Polygon');
    const SpatialReferenceModule = await import('@arcgis/core/geometry/SpatialReference');
    const SimpleFillSymbolModule = await import('@arcgis/core/symbols/SimpleFillSymbol');
    const SimpleLineSymbolModule = await import('@arcgis/core/symbols/SimpleLineSymbol');
    const SimpleMarkerSymbolModule = await import('@arcgis/core/symbols/SimpleMarkerSymbol');
    const ColorModule = await import('@arcgis/core/Color');

    const GraphicsLayer = GraphicsLayerModule.default;
    const Graphic = GraphicModule.default;
    const Point = PointModule.default;
    const Polyline = PolylineModule.default;
    const Polygon = PolygonModule.default;
    const SpatialReference = SpatialReferenceModule.default;
    const SimpleFillSymbol = SimpleFillSymbolModule.default;
    const SimpleLineSymbol = SimpleLineSymbolModule.default;
    const SimpleMarkerSymbol = SimpleMarkerSymbolModule.default;
    const Color = ColorModule.default;

    // Parse shapefile
    const geoJson = await parseShapefile(file);
    const totalFeatures = geoJson.features?.length || 0;
    console.log(`[Shapefile] Parsed ${totalFeatures} features from shapefile`);

    // Performance settings - increased default to show more features
    const maxFeatures = options.maxFeatures || 50000;
    const simplifyTolerance = options.enableSimplification !== false 
      ? (options.simplifyTolerance || 0.0001) 
      : 0;
    
    // Warn if too many features, but allow user to proceed
    if (totalFeatures > maxFeatures) {
      console.warn(
        `[Shapefile] Shapefile contains ${totalFeatures} features, but only ${maxFeatures} will be rendered for performance. ` +
        `To see all features, increase the maxFeatures option (currently ${maxFeatures}).`
      );
    } else {
      console.log(`[Shapefile] All ${totalFeatures} features will be rendered.`);
    }

    // Create graphics layer with performance optimizations
    const layerId = options.layerId || `shapefile-${Date.now()}`;
    const layerName = options.layerName || file.name.replace(/\.(shp|zip)$/i, '');
    
    const graphicsLayer = new GraphicsLayer({
      id: layerId,
      title: layerName,
      visible: options.visible !== false,
      opacity: options.opacity || 1.0,
      // Performance optimizations
      listMode: 'show', // Show in layer list
      effect: null // Disable effects for better performance
    });

    // Convert GeoJSON features to ArcGIS graphics
    const featuresToProcess = geoJson.features.slice(0, maxFeatures);
    
    // Process features in batches to avoid blocking the UI
    const batchSize = 1000;
    let totalProcessed = 0;
    
    for (let i = 0; i < featuresToProcess.length; i += batchSize) {
      const batch = featuresToProcess.slice(i, i + batchSize);
      const batchGraphics: any[] = [];
      
      batch.forEach((feature: any, batchIndex: number) => {
        try {
          const geometry = convertGeoJsonToArcGIS(
            feature.geometry,
            Point,
            Polyline,
            Polygon,
            SpatialReference,
            simplifyTolerance
          );
        
          // Determine symbol based on geometry type
          let symbol = options.symbol;
          if (!symbol) {
            if (geometry instanceof Point) {
              symbol = new SimpleMarkerSymbol({
                color: new Color([255, 0, 0, 0.8]),
                size: 8,
                outline: {
                  color: new Color([255, 255, 255, 0.8]),
                  width: 1
                }
              });
            } else if (geometry instanceof Polyline) {
              symbol = new SimpleLineSymbol({
                color: new Color([0, 0, 255, 0.8]),
                width: 2
              });
            } else if (geometry instanceof Polygon) {
              symbol = new SimpleFillSymbol({
                color: new Color([255, 165, 0, 0.5]),
                outline: {
                  color: new Color([255, 140, 0, 0.8]),
                  width: 2
                }
              });
            }
          }

          const graphic = new Graphic({
            geometry: geometry,
            attributes: feature.properties || {},
            symbol: symbol
          });

          batchGraphics.push(graphic);
        } catch (error) {
          console.warn(`Failed to convert feature ${i + batchIndex}:`, error);
        }
      });
      
      // Add batch to layer incrementally for better performance
      if (batchGraphics.length > 0) {
        graphicsLayer.addMany(batchGraphics);
        totalProcessed += batchGraphics.length;
        // Yield to browser to prevent blocking
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
    
    const renderedCount = Math.min(totalFeatures, maxFeatures);
    console.log(`[Shapefile] Added ${renderedCount} graphics to layer "${layerName}"${totalFeatures > maxFeatures ? ` (${totalFeatures - maxFeatures} features skipped for performance)` : ''}`);

    // Add layer to map
    mapView.map.add(graphicsLayer);
    console.log(`[Shapefile] Layer "${layerName}" added to map`);

    // Zoom to extent if graphics exist - ensure ALL features are visible
    if (totalProcessed > 0) {
      try {
        // Wait longer for the layer to calculate its extent properly
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Try multiple methods to get the extent
        let extent = graphicsLayer.fullExtent;
        
        // If fullExtent is not available, calculate from graphics
        if (!extent || extent.xmin === undefined || extent.ymin === undefined) {
          const GeometryEngineModule = await import('@arcgis/core/geometry/geometryEngine');
          const GeometryEngine = GeometryEngineModule;
          
          if (graphicsLayer.graphics.length > 0) {
            const geometries = Array.from(graphicsLayer.graphics)
              .map((g: any) => g.geometry)
              .filter((g: any) => g !== null && g !== undefined);
            
            if (geometries.length > 0) {
              extent = GeometryEngine.union(geometries as any).extent;
            }
          }
        }
        
        if (extent && extent.xmin !== undefined && extent.ymin !== undefined) {
          // Expand by 10% to ensure all features are visible with padding
          await mapView.goTo(extent.expand(1.1), { duration: 1000 });
          console.log(`[Shapefile] Map zoomed to shapefile extent (${totalProcessed} features visible)`);
        } else {
          console.warn(`[Shapefile] Could not get extent for layer, graphics may be outside current view`);
        }
      } catch (extentError) {
        console.warn(`[Shapefile] Error zooming to extent:`, extentError);
      }
    } else {
      console.warn(`[Shapefile] No graphics were created from shapefile`);
    }

    return graphicsLayer;
  } catch (error) {
    console.error('Error loading shapefile to map:', error);
    throw error;
  }
};

/**
 * Load shapefile from URL and add to ArcGIS map
 * @param url - URL to the .shp file
 * @param mapView - ArcGIS MapView instance
 * @param options - Configuration options
 * @returns Promise resolving to the created GraphicsLayer
 */
export const loadShapefileFromUrl = async (
  url: string,
  mapView: any,
  options: ShapefileLoadOptions = {}
): Promise<any> => {
  try {
    // Fetch and parse shapefile
    const geoJson = await parseShapefileFromUrl(url);
    const totalFeatures = geoJson.features?.length || 0;
    console.log(`[Shapefile] Parsed ${totalFeatures} features from shapefile`);

    // Performance settings - increased default to show more features
    const maxFeatures = options.maxFeatures || 50000;
    const simplifyTolerance = options.enableSimplification !== false 
      ? (options.simplifyTolerance || 0.0001) 
      : 0;
    
    // Warn if too many features, but allow user to proceed
    if (totalFeatures > maxFeatures) {
      console.warn(
        `[Shapefile] Shapefile contains ${totalFeatures} features, but only ${maxFeatures} will be rendered for performance. ` +
        `To see all features, increase the maxFeatures option (currently ${maxFeatures}).`
      );
    } else {
      console.log(`[Shapefile] All ${totalFeatures} features will be rendered.`);
    }

    // Load ArcGIS modules
    const GraphicsLayerModule = await import('@arcgis/core/layers/GraphicsLayer');
    const GraphicModule = await import('@arcgis/core/Graphic');
    const PointModule = await import('@arcgis/core/geometry/Point');
    const PolylineModule = await import('@arcgis/core/geometry/Polyline');
    const PolygonModule = await import('@arcgis/core/geometry/Polygon');
    const SpatialReferenceModule = await import('@arcgis/core/geometry/SpatialReference');
    const SimpleFillSymbolModule = await import('@arcgis/core/symbols/SimpleFillSymbol');
    const SimpleLineSymbolModule = await import('@arcgis/core/symbols/SimpleLineSymbol');
    const SimpleMarkerSymbolModule = await import('@arcgis/core/symbols/SimpleMarkerSymbol');
    const ColorModule = await import('@arcgis/core/Color');

    const GraphicsLayer = GraphicsLayerModule.default;
    const Graphic = GraphicModule.default;
    const Point = PointModule.default;
    const Polyline = PolylineModule.default;
    const Polygon = PolygonModule.default;
    const SpatialReference = SpatialReferenceModule.default;
    const SimpleFillSymbol = SimpleFillSymbolModule.default;
    const SimpleLineSymbol = SimpleLineSymbolModule.default;
    const SimpleMarkerSymbol = SimpleMarkerSymbolModule.default;
    const Color = ColorModule.default;

    // Create graphics layer with performance optimizations
    const layerId = options.layerId || `shapefile-${Date.now()}`;
    const layerName = options.layerName || url.split('/').pop()?.replace('.shp', '') || 'Shapefile Layer';
    
    const graphicsLayer = new GraphicsLayer({
      id: layerId,
      title: layerName,
      visible: options.visible !== false,
      opacity: options.opacity || 1.0,
      // Performance optimizations
      listMode: 'show',
      effect: null
    });

    // Convert GeoJSON features to ArcGIS graphics
    const featuresToProcess = geoJson.features.slice(0, maxFeatures);
    
    // Process features in batches to avoid blocking the UI
    const batchSize = 1000;
    let totalProcessed = 0;
    
    for (let i = 0; i < featuresToProcess.length; i += batchSize) {
      const batch = featuresToProcess.slice(i, i + batchSize);
      const batchGraphics: any[] = [];
      
      batch.forEach((feature: any, batchIndex: number) => {
        try {
          const geometry = convertGeoJsonToArcGIS(
            feature.geometry,
            Point,
            Polyline,
            Polygon,
            SpatialReference,
            simplifyTolerance
          );
        
          // Determine symbol based on geometry type
          let symbol = options.symbol;
          if (!symbol) {
            if (geometry instanceof Point) {
              symbol = new SimpleMarkerSymbol({
                color: new Color([255, 0, 0, 0.8]),
                size: 8,
                outline: {
                  color: new Color([255, 255, 255, 0.8]),
                  width: 1
                }
              });
            } else if (geometry instanceof Polyline) {
              symbol = new SimpleLineSymbol({
                color: new Color([0, 0, 255, 0.8]),
                width: 2
              });
            } else if (geometry instanceof Polygon) {
              symbol = new SimpleFillSymbol({
                color: new Color([255, 165, 0, 0.5]),
                outline: {
                  color: new Color([255, 140, 0, 0.8]),
                  width: 2
                }
              });
            }
          }

          const graphic = new Graphic({
            geometry: geometry,
            attributes: feature.properties || {},
            symbol: symbol
          });

          batchGraphics.push(graphic);
        } catch (error) {
          console.warn(`Failed to convert feature ${i + batchIndex}:`, error);
        }
      });
      
      // Add batch to layer incrementally for better performance
      if (batchGraphics.length > 0) {
        graphicsLayer.addMany(batchGraphics);
        totalProcessed += batchGraphics.length;
        // Yield to browser to prevent blocking
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
    
    const renderedCount = Math.min(totalFeatures, maxFeatures);
    console.log(`[Shapefile] Added ${renderedCount} graphics to layer "${layerName}"${totalFeatures > maxFeatures ? ` (${totalFeatures - maxFeatures} features skipped for performance)` : ''}`);

    // Add layer to map
    mapView.map.add(graphicsLayer);
    console.log(`[Shapefile] Layer "${layerName}" added to map`);

    // Zoom to extent if graphics exist - ensure ALL features are visible
    if (totalProcessed > 0) {
      try {
        // Wait longer for the layer to calculate its extent properly
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Try multiple methods to get the extent
        let extent = graphicsLayer.fullExtent;
        
        // If fullExtent is not available, calculate from graphics
        if (!extent || extent.xmin === undefined || extent.ymin === undefined) {
          const GeometryEngineModule = await import('@arcgis/core/geometry/geometryEngine');
          const GeometryEngine = GeometryEngineModule;
          
          if (graphicsLayer.graphics.length > 0) {
            const geometries = Array.from(graphicsLayer.graphics)
              .map((g: any) => g.geometry)
              .filter((g: any) => g !== null && g !== undefined);
            
            if (geometries.length > 0) {
              extent = GeometryEngine.union(geometries as any).extent;
            }
          }
        }
        
        if (extent && extent.xmin !== undefined && extent.ymin !== undefined) {
          // Expand by 10% to ensure all features are visible with padding
          await mapView.goTo(extent.expand(1.1), { duration: 1000 });
          console.log(`[Shapefile] Map zoomed to shapefile extent (${totalProcessed} features visible)`);
        } else {
          console.warn(`[Shapefile] Could not get extent for layer, graphics may be outside current view`);
        }
      } catch (extentError) {
        console.warn(`[Shapefile] Error zooming to extent:`, extentError);
      }
    } else {
      console.warn(`[Shapefile] No graphics were created from shapefile`);
    }

    return graphicsLayer;
  } catch (error) {
    console.error('Error loading shapefile from URL:', error);
    throw error;
  }
};
