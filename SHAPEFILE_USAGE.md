# Shapefile Usage Guide

This guide explains how to use shapefile (.shp) files in the mapping module of the Sooner Mineral application.

## Overview

The mapping module supports loading and displaying shapefiles directly in the ArcGIS map. Shapefiles are automatically parsed, converted to GeoJSON, and displayed as graphics layers on the map.

## Prerequisites

- ArcGIS API key configured (see `ARCGIS_INTEGRATION.md`)
- Shapefile (.shp) file ready for upload
- Map module initialized and loaded

## Supported Formats

- **Point shapefiles**: Displayed as markers
- **Line shapefiles**: Displayed as polylines
- **Polygon shapefiles**: Displayed as filled polygons

## Usage

### Method 1: Upload via UI (Recommended)

1. Navigate to the **Mapping** module
2. Wait for the map to fully load
3. Click the **"Load Shapefile"** button in the map controls
4. Select your `.zip` file containing all shapefile components (.shp, .shx, .dbf, etc.)
5. The shapefile will be automatically loaded and displayed on the map
6. The map will automatically zoom to show all features

**Note**: You must upload a ZIP file containing all shapefile components. Raw `.shp` files are not supported.

### Method 2: Programmatic Loading

You can also load shapefiles programmatically using the shapefile service:

```typescript
import { loadShapefileToMap } from '../services/shapefileService';

// Load from file
const file = // ... your File object
const layer = await loadShapefileToMap(file, mapView, {
  layerName: 'My Custom Layer',
  visible: true,
  opacity: 0.7
});

// Load from URL
import { loadShapefileFromUrl } from '../services/shapefileService';

const layer = await loadShapefileFromUrl(
  'https://example.com/data.shp',
  mapView,
  {
    layerName: 'Remote Shapefile',
    visible: true
  }
);
```

## Customization

### Custom Symbols

You can customize the appearance of shapefile features by providing custom symbols:

```typescript
import { SimpleFillSymbol, Color } from '@arcgis/core';

const customSymbol = new SimpleFillSymbol({
  color: new Color([255, 0, 0, 0.5]), // Red with 50% opacity
  outline: {
    color: new Color([255, 0, 0, 1]),
    width: 2
  }
});

const layer = await loadShapefileToMap(file, mapView, {
  layerName: 'Custom Styled Layer',
  symbol: customSymbol
});
```

### Layer Management

Loaded shapefile layers are automatically added to the map's layer list. You can:

- **Toggle visibility**: Use the layer controls in the map
- **Remove layers**: Click the × button next to the layer name in the legend
- **Adjust opacity**: Modify the layer properties programmatically

```typescript
// Toggle layer visibility
layer.visible = !layer.visible;

// Change opacity
layer.opacity = 0.5;

// Remove layer
mapView.map.remove(layer);
```

## File Requirements

### Required Files

A complete shapefile consists of multiple files. **You must provide a ZIP file containing all shapefile components:**

- **`.shp`** - Main shapefile (required)
- **`.shx`** - Index file (required)
- **`.dbf`** - Attribute data (required for attributes)
- **`.prj`** - Projection information (recommended)

**Important**: The application requires a **ZIP file** containing all shapefile components. Raw `.shp` files are not supported.

### How to Create a Shapefile ZIP

1. Select all shapefile components in your file explorer:
   - `yourfile.shp`
   - `yourfile.shx`
   - `yourfile.dbf`
   - `yourfile.prj` (if available)
2. Right-click and select "Compress" or "Send to > Compressed (zipped) folder"
3. Upload the resulting `.zip` file

### File Size Limitations

- Maximum file size: Limited by browser memory (typically 50-100MB)
- For large shapefiles, consider:
  - Simplifying geometries
  - Reducing the number of features
  - Using feature services instead

## Troubleshooting

### Common Issues

1. **"Map not initialized" error**
   - **Solution**: Wait for the map to fully load before uploading shapefiles

2. **"Failed to parse shapefile" or "but-unzip" error**
   - **Solution**: Ensure you're uploading a ZIP file containing all shapefile components (.shp, .shx, .dbf, etc.). Raw .shp files are not supported. Create a ZIP file by selecting all shapefile components and compressing them.

3. **Shapefile appears in wrong location**
   - **Solution**: Check if the shapefile has proper projection information. The system assumes WGS84 (EPSG:4326)

4. **Performance issues with large shapefiles**
   - **Solution**: 
     - Simplify geometries
     - Reduce feature count
     - Use server-side processing for very large datasets

### Debug Mode

Enable console logging to debug shapefile loading:

```typescript
// Check if shapefile was loaded
console.log('Loaded layers:', shapefileLayers);

// Check layer properties
layer.graphics.forEach((graphic, index) => {
  console.log(`Graphic ${index}:`, {
    geometry: graphic.geometry,
    attributes: graphic.attributes
  });
});
```

## API Reference

### `loadShapefileToMap(file, mapView, options)`

Loads a shapefile from a File object and adds it to the map.

**Parameters:**
- `file` (File): The .shp file to load
- `mapView` (MapView): ArcGIS MapView instance
- `options` (ShapefileLoadOptions): Configuration options
  - `layerId` (string, optional): Custom layer ID
  - `layerName` (string, optional): Display name for the layer
  - `symbol` (Symbol, optional): Custom symbol for features
  - `visible` (boolean, optional): Layer visibility (default: true)
  - `opacity` (number, optional): Layer opacity 0-1 (default: 1.0)

**Returns:** Promise<GraphicsLayer>

### `loadShapefileFromUrl(url, mapView, options)`

Loads a shapefile from a URL and adds it to the map.

**Parameters:**
- `url` (string): URL to the .shp file
- `mapView` (MapView): ArcGIS MapView instance
- `options` (ShapefileLoadOptions): Configuration options (same as above)

**Returns:** Promise<GraphicsLayer>

### `parseShapefile(file)`

Parses a shapefile and returns GeoJSON.

**Parameters:**
- `file` (File): The .shp file to parse

**Returns:** Promise<GeoJSON FeatureCollection>

## Examples

### Example 1: Load County Boundaries

```typescript
const countyFile = // ... file from file input
const layer = await loadShapefileToMap(countyFile, mapView, {
  layerName: 'County Boundaries',
  opacity: 0.6
});
```

### Example 2: Load Well Locations with Custom Symbol

```typescript
import { SimpleMarkerSymbol, Color } from '@arcgis/core';

const wellSymbol = new SimpleMarkerSymbol({
  color: new Color([0, 255, 0, 0.8]),
  size: 10,
  style: 'circle'
});

const layer = await loadShapefileToMap(wellFile, mapView, {
  layerName: 'Well Locations',
  symbol: wellSymbol
});
```

### Example 3: Load from Remote Server

```typescript
const layer = await loadShapefileFromUrl(
  'https://data.example.com/parcels.shp',
  mapView,
  {
    layerName: 'Property Parcels',
    visible: true,
    opacity: 0.5
  }
);
```

## Best Practices

1. **File Organization**: Keep related shapefile files (.shp, .shx, .dbf, .prj) together
2. **Naming**: Use descriptive names for shapefile layers
3. **Performance**: For frequently used shapefiles, consider converting to feature services
4. **Projection**: Ensure shapefiles use WGS84 (EPSG:4326) or provide projection information
5. **Cleanup**: Remove unused shapefile layers to improve map performance

## Limitations

- **ZIP files are required** - Raw `.shp` files are not supported. You must provide a ZIP file containing all shapefile components.
- Large shapefiles (>50MB) may cause performance issues
- Complex geometries may take longer to render
- All required components (.shp, .shx, .dbf) must be included in the ZIP file

## Future Enhancements

Potential improvements for shapefile support:

- Support for `.zip` files containing complete shapefile sets
- Automatic projection detection and transformation
- Clustering for point shapefiles with many features
- Server-side shapefile processing for large files
- Support for other GIS formats (GeoJSON, KML, etc.)

## Support

For issues or questions:
- Check the browser console for error messages
- Verify the shapefile is valid using GIS software
- Ensure the ArcGIS API key is properly configured
- Review the `ARCGIS_INTEGRATION.md` guide
