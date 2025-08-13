# ArcGIS Integration Guide

This guide explains how to integrate ArcGIS services with the Sooner Mineral application for enhanced spatial visualization.

## Prerequisites

1. **ArcGIS Developer Account**: Sign up at [ArcGIS for Developers](https://developers.arcgis.com/)
2. **API Key**: Get your API key from the ArcGIS Developer dashboard
3. **Node.js**: Ensure you have Node.js installed for package management

## Installation

### 1. Install ArcGIS Dependencies

The ArcGIS JavaScript API has been added to `package.json`:

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```env
# ArcGIS API Configuration
REACT_APP_ARCGIS_API_KEY=your-arcgis-api-key-here

# Other environment variables
NODE_ENV=development
```

### 3. Get Your ArcGIS API Key

1. Go to [ArcGIS for Developers](https://developers.arcgis.com/)
2. Sign in or create an account
3. Navigate to your dashboard
4. Create a new project or use an existing one
5. Go to "API Keys" section
6. Create a new API key with the following scopes:
   - `basemaps`
   - `geocoding`
   - `routing`
   - `geoenrichment`

## Features

### Enhanced Mapping Capabilities

The ArcGIS integration provides:

- **Real-time basemaps**: Satellite, streets, and topographic maps
- **Interactive features**: Zoom, pan, and layer controls
- **Professional symbology**: Custom symbols for wells, permits, rigs, and units
- **Popup information**: Detailed feature information on click
- **Layer management**: Toggle visibility and adjust opacity
- **Spatial analysis**: Distance calculations and proximity filtering

### Map Layers

1. **Tract Boundary**: Subject tract with distinct orange border
2. **Producing Wells**: Green circles with well information
3. **Permits**: Yellow squares with permit details
4. **Rigs**: Pink diamonds with rig status
5. **Units**: Purple polygons with unit boundaries

## Usage

### Switching to ArcGIS Mapping

To use the ArcGIS-enhanced mapping, update your `TractDetailPage.tsx`:

```typescript
// Replace the import
import MappingTab from '../components/MappingTab';
// With
import ArcGISMappingTab from '../components/ArcGISMappingTab';

// And update the component usage
{activeTab === 'mapping' && (
  <ArcGISMappingTab tractId={tract.id} tractName={tract.tractName} />
)}
```

### Configuration Options

You can customize the ArcGIS integration in `services/arcgis.ts`:

```typescript
export const ARCGIS_CONFIG = {
  apiKey: process.env.REACT_APP_ARCGIS_API_KEY,
  basemapId: "satellite", // or "streets-vector", "topo-vector"
  center: [-102.0776, 31.9686], // Default center
  zoom: 12,
  spatialReference: SpatialReference.WGS84
};
```

### Layer Configuration

Customize layer appearance in `services/arcgis.ts`:

```typescript
export const LAYER_CONFIG = {
  tractBoundary: {
    id: "tract-boundary",
    title: "Tract Boundary",
    color: [255, 107, 53, 0.8], // Orange
    symbol: "polygon"
  },
  // ... other layers
};
```

## Advanced Features

### Custom Symbols

Create custom symbols for different feature types:

```typescript
const customSymbol = new SimpleMarkerSymbol({
  color: [255, 0, 0, 0.8], // Red
  size: 16,
  style: "diamond",
  outline: {
    color: [255, 255, 255, 0.8],
    width: 2
  }
});
```

### Spatial Queries

Perform spatial analysis:

```typescript
import * as geometryEngine from "@arcgis/core/geometry/geometryEngine";

// Buffer analysis
const buffer = geometryEngine.buffer(point, 1, "miles");

// Intersection analysis
const intersection = geometryEngine.intersect(polygon1, polygon2);
```

### Feature Services

Connect to ArcGIS Feature Services for real-time data:

```typescript
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";

const wellsLayer = new FeatureLayer({
  url: "https://services.arcgis.com/your-feature-service-url",
  outFields: ["*"],
  popupTemplate: createPopupTemplate("well")
});
```

## Troubleshooting

### Common Issues

1. **API Key Error**: Ensure your API key is valid and has the correct scopes
2. **CORS Issues**: ArcGIS handles CORS automatically, but check your network settings
3. **Performance**: For large datasets, consider clustering or feature reduction
4. **Loading Issues**: Check browser console for ArcGIS-specific errors

### Debug Mode

Enable debug mode for ArcGIS:

```typescript
import { config } from "@arcgis/core/config";

config.request.useIdentity = false;
config.request.timeout = 60000;
```

## Production Deployment

### Environment Variables

Ensure your production environment has the ArcGIS API key:

```env
REACT_APP_ARCGIS_API_KEY=your-production-api-key
```

### Build Optimization

The ArcGIS JavaScript API is large. Consider:

1. **Code splitting**: Load ArcGIS components dynamically
2. **CDN**: Use ArcGIS CDN for faster loading
3. **Caching**: Implement proper caching strategies

### Security

- Never expose your API key in client-side code
- Use environment variables for configuration
- Implement proper authentication for sensitive spatial data

## Additional Resources

- [ArcGIS JavaScript API Documentation](https://developers.arcgis.com/javascript/latest/)
- [ArcGIS for Developers](https://developers.arcgis.com/)
- [ArcGIS REST API](https://developers.arcgis.com/rest/)
- [Spatial Analysis Guide](https://developers.arcgis.com/javascript/latest/spatial-analysis/)

## Support

For ArcGIS-specific issues:
- [ArcGIS Developer Support](https://developers.arcgis.com/support/)
- [ArcGIS Community](https://community.esri.com/)

For application-specific issues:
- Check the application logs
- Review the browser console for errors
- Verify API key configuration 