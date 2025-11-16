import React, { useState, useEffect, useRef } from 'react';
import type { TractSpatial, ProducingWell, Permit, Rig, Unit, MapLayerPreference, MapLayer } from '../types';
import * as api from '../services/api';
import Button from './ui/Button';

interface MappingTabProps {
  tractId: string;
  tractName: string;
}

const MappingTab: React.FC<MappingTabProps> = ({ tractId, tractName }) => {
  const [tractSpatial, setTractSpatial] = useState<TractSpatial | null>(null);
  const [wells, setWells] = useState<ProducingWell[]>([]);
  const [permits, setPermits] = useState<Permit[]>([]);
  const [rigs, setRigs] = useState<Rig[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [layerPreferences, setLayerPreferences] = useState<MapLayerPreference[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFeature, setSelectedFeature] = useState<any>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([31.9686, -102.0776]);
  const [zoom, setZoom] = useState(12);
  const [basemapType, setBasemapType] = useState<'satellite' | 'streets'>('streets');
  const mapRef = useRef<HTMLDivElement>(null);

  // Define map layers
  const mapLayers: MapLayer[] = [
    { id: 'tract_boundary', name: 'tract_boundary', displayName: 'Tract Boundary', isVisible: true, opacity: 1.0, color: '#FF6B35', icon: '📍' },
    { id: 'producing_wells', name: 'producing_wells', displayName: 'Producing Wells', isVisible: true, opacity: 0.8, color: '#4CAF50', icon: '🛢️' },
    { id: 'permits', name: 'permits', displayName: 'Permits', isVisible: true, opacity: 0.7, color: '#FFC107', icon: '📋' },
    { id: 'rigs', name: 'rigs', displayName: 'Rigs', isVisible: true, opacity: 0.9, color: '#E91E63', icon: '🏗️' },
    { id: 'units', name: 'units', displayName: 'Units', isVisible: false, opacity: 0.6, color: '#9C27B0', icon: '🔲' },
    { id: 'nearby_tracts', name: 'nearby_tracts', displayName: 'Nearby Tracts', isVisible: true, opacity: 0.5, color: '#2196F3', icon: '🗺️' }
  ];

  useEffect(() => {
    fetchMapData();
  }, [tractId]);

  const fetchMapData = async () => {
    setIsLoading(true);
    try {
      const [spatial, preferences] = await Promise.all([
        api.fetchTractSpatial(tractId),
        api.fetchMapLayerPreferences()
      ]);
      
      setTractSpatial(spatial);
      setLayerPreferences(preferences);

      if (spatial?.latitude && spatial?.longitude) {
        setMapCenter([spatial.latitude, spatial.longitude]);
        
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
      }
    } catch (error) {
      console.error('Failed to fetch map data:', error);
    } finally {
      setIsLoading(false);
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

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'Producing':
      case 'Active':
        return '#4CAF50';
      case 'Drilling':
        return '#FF9800';
      case 'Shut-in':
      case 'Moving':
        return '#FFC107';
      case 'Abandoned':
      case 'Stacked':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  if (isLoading) {
    return <div className="text-center text-sc-slate">Loading map data...</div>;
  }

  if (!tractSpatial) {
    return <div className="text-center text-sc-slate">No spatial data available for this tract.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Map Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-white">Spatial View</h3>
          <p className="text-sc-slate text-sm">
            {tractName} • {tractSpatial.geometryType === 'STR' ? tractSpatial.geometryData?.str : 'Point Location'}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="secondary" 
            size="sm"
            onClick={() => setBasemapType(basemapType === 'satellite' ? 'streets' : 'satellite')}
          >
            {basemapType === 'satellite' ? '🗺️ Streets' : '🛰️ Satellite'}
          </Button>
          <Button 
            variant="secondary" 
            size="sm"
            onClick={() => setZoom(Math.min(zoom + 1, 18))}
          >
            🔍 Zoom In
          </Button>
          <Button 
            variant="secondary" 
            size="sm"
            onClick={() => setZoom(Math.max(zoom - 1, 8))}
          >
            🔍 Zoom Out
          </Button>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative">
        <div 
          ref={mapRef}
          className="w-full h-96 bg-sc-navy rounded-lg border border-sc-light-navy relative overflow-hidden"
          style={{
            background: basemapType === 'satellite' 
              ? 'linear-gradient(45deg, #2d3748 25%, transparent 25%), linear-gradient(-45deg, #2d3748 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #2d3748 75%), linear-gradient(-45deg, transparent 75%, #2d3748 75%)'
              : 'linear-gradient(45deg, #4a5568 25%, transparent 25%), linear-gradient(-45deg, #4a5568 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #4a5568 75%), linear-gradient(-45deg, transparent 75%, #4a5568 75%)',
            backgroundSize: '20px 20px',
            backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
          }}
        >
          {/* Tract Boundary */}
          {getLayerVisibility('tract_boundary') && tractSpatial && (
            <div 
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
              style={{
                left: '50%',
                top: '50%',
                width: '20px',
                height: '20px',
                backgroundColor: getLayerOpacity('tract_boundary') < 0.5 ? 'rgba(255, 107, 53, 0.3)' : '#FF6B35',
                border: '3px solid #FF6B35',
                borderRadius: '50%',
                zIndex: 10
              }}
              onClick={() => setSelectedFeature({ type: 'tract', data: tractSpatial })}
            >
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-sc-dark-navy text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                {tractName}
              </div>
            </div>
          )}

          {/* Producing Wells */}
          {getLayerVisibility('producing_wells') && wells.map((well, index) => {
            const distance = calculateDistance(
              tractSpatial.latitude!, tractSpatial.longitude!,
              well.latitude, well.longitude
            );
            const angle = (index * 45) % 360;
            const radius = Math.min(distance * 2, 80);
            const x = Math.cos(angle * Math.PI / 180) * radius;
            const y = Math.sin(angle * Math.PI / 180) * radius;
            
            return (
              <div
                key={well.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                style={{
                  left: `calc(50% + ${x}px)`,
                  top: `calc(50% + ${y}px)`,
                  width: '12px',
                  height: '12px',
                  backgroundColor: getStatusColor(well.status),
                  borderRadius: '50%',
                  zIndex: 5
                }}
                onClick={() => setSelectedFeature({ type: 'well', data: well })}
              >
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-sc-dark-navy text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity">
                  {well.wellName}
                </div>
              </div>
            );
          })}

          {/* Permits */}
          {getLayerVisibility('permits') && permits.map((permit, index) => {
            const distance = calculateDistance(
              tractSpatial.latitude!, tractSpatial.longitude!,
              permit.latitude, permit.longitude
            );
            const angle = (index * 60 + 30) % 360;
            const radius = Math.min(distance * 2, 100);
            const x = Math.cos(angle * Math.PI / 180) * radius;
            const y = Math.sin(angle * Math.PI / 180) * radius;
            
            return (
              <div
                key={permit.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                style={{
                  left: `calc(50% + ${x}px)`,
                  top: `calc(50% + ${y}px)`,
                  width: '10px',
                  height: '10px',
                  backgroundColor: getStatusColor(permit.status),
                  borderRadius: '2px',
                  zIndex: 4
                }}
                onClick={() => setSelectedFeature({ type: 'permit', data: permit })}
              >
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-sc-dark-navy text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity">
                  {permit.permitNumber}
                </div>
              </div>
            );
          })}

          {/* Rigs */}
          {getLayerVisibility('rigs') && rigs.map((rig, index) => {
            const distance = calculateDistance(
              tractSpatial.latitude!, tractSpatial.longitude!,
              rig.latitude, rig.longitude
            );
            const angle = (index * 90 + 45) % 360;
            const radius = Math.min(distance * 2, 120);
            const x = Math.cos(angle * Math.PI / 180) * radius;
            const y = Math.sin(angle * Math.PI / 180) * radius;
            
            return (
              <div
                key={rig.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                style={{
                  left: `calc(50% + ${x}px)`,
                  top: `calc(50% + ${y}px)`,
                  width: '16px',
                  height: '16px',
                  backgroundColor: getStatusColor(rig.status),
                  borderRadius: '2px',
                  zIndex: 6
                }}
                onClick={() => setSelectedFeature({ type: 'rig', data: rig })}
              >
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-sc-dark-navy text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity">
                  {rig.rigName}
                </div>
              </div>
            );
          })}

          {/* Units */}
          {getLayerVisibility('units') && units.map((unit, index) => {
            const distance = calculateDistance(
              tractSpatial.latitude!, tractSpatial.longitude!,
              unit.latitude, unit.longitude
            );
            const angle = (index * 120 + 60) % 360;
            const radius = Math.min(distance * 2, 140);
            const x = Math.cos(angle * Math.PI / 180) * radius;
            const y = Math.sin(angle * Math.PI / 180) * radius;
            
            return (
              <div
                key={unit.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                style={{
                  left: `calc(50% + ${x}px)`,
                  top: `calc(50% + ${y}px)`,
                  width: '14px',
                  height: '14px',
                  backgroundColor: getStatusColor(unit.status),
                  borderRadius: '3px',
                  zIndex: 3
                }}
                onClick={() => setSelectedFeature({ type: 'unit', data: unit })}
              >
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-sc-dark-navy text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity">
                  {unit.unitName}
                </div>
              </div>
            );
          })}

          {/* Map Controls Overlay */}
          <div className="absolute top-4 right-4 bg-sc-dark-navy p-2 rounded-lg text-white text-xs">
            <div>Zoom: {zoom}</div>
            <div>Center: {mapCenter[0].toFixed(4)}, {mapCenter[1].toFixed(4)}</div>
          </div>
        </div>
      </div>

      {/* Layer Controls */}
      <div className="bg-sc-light-navy p-4 rounded-lg">
        <h4 className="text-white font-semibold mb-3">Map Layers</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {mapLayers.map((layer) => (
            <div key={layer.id} className="flex items-center space-x-3">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={getLayerVisibility(layer.name)}
                  onChange={(e) => handleLayerToggle(layer.name, e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-sc-blue focus:ring-sc-blue"
                />
                <span className="text-sm text-sc-slate">{layer.icon} {layer.displayName}</span>
              </label>
              {getLayerVisibility(layer.name) && (
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={getLayerOpacity(layer.name)}
                  onChange={(e) => handleOpacityChange(layer.name, parseFloat(e.target.value))}
                  className="w-16 h-2 bg-sc-navy rounded-lg appearance-none cursor-pointer"
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
                {selectedFeature.data.geometryData?.str && (
                  <div><span className="text-sc-slate">STR:</span> <span className="text-white">{selectedFeature.data.geometryData.str}</span></div>
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

export default MappingTab; 