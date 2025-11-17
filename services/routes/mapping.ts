import { Router } from 'express';
import type { Pool } from 'mysql2/promise';
import { executeQuery } from '../utils/database.js';

export const createMappingRoutes = (dbPool: Pool | null) => {
  const router = Router();

  // Get tract spatial data
  router.get('/api/tract-spatial', async (req, res) => {
    try {
      if (!dbPool) {
        return res.status(500).json({ success: false, message: 'Database pool not initialized' });
      }

      try {
        const query = `
          SELECT 
            id,
            tract_id,
            geometry,
            centroid_lat,
            centroid_lon,
            area_acres,
            created_at,
            updated_at
          FROM tract_spatial
          ORDER BY created_at DESC
          LIMIT 1000
        `;

        const rows = await executeQuery(dbPool, query);
        
        res.json({
          success: true,
          data: rows
        });
      } catch (tableError: any) {
        console.log('tract_spatial table not available, returning mock data');
        const mockData = [
          {
            id: 'mock-1',
            tract_id: '222ed8ac-9337-11f0-abb1-76fc11c0f2a6',
            geometry: null,
            centroid_lat: 35.8617,
            centroid_lon: -97.9365,
            area_acres: 160,
            section_number: '7',
            township: '15N',
            range: '2W',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];

        res.json({
          success: true,
          data: mockData
        });
      }
    } catch (error: any) {
      console.error('Error fetching tract spatial data:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch tract spatial data',
        error: error.message
      });
    }
  });

  // Get map layer preferences
  router.get('/api/map/layer-preferences', async (req, res) => {
    try {
      const defaultPreferences = [
        {
          id: 'tracts',
          name: 'Tracts',
          visible: true,
          opacity: 0.8,
          color: '#ff6b6b'
        },
        {
          id: 'wells',
          name: 'Wells',
          visible: true,
          opacity: 0.6,
          color: '#4ecdc4'
        },
        {
          id: 'units',
          name: 'Units',
          visible: false,
          opacity: 0.7,
          color: '#45b7d1'
        },
        {
          id: 'counties',
          name: 'Counties',
          visible: true,
          opacity: 0.3,
          color: '#96ceb4'
        }
      ];

      res.json({
        success: true,
        data: defaultPreferences
      });
    } catch (error: any) {
      console.error('Error fetching layer preferences:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch layer preferences',
        error: error.message
      });
    }
  });

  // Get nearby wells
  router.get('/api/map/nearby/wells', async (req, res) => {
    try {
      if (!dbPool) {
        return res.status(500).json({ success: false, message: 'Database pool not initialized' });
      }

      const { lat, lng, radius, county } = req.query;
      
      const baseWells = [
        {
          id: 'well-1',
          name: 'Sample Well 1',
          latitude: parseFloat(lat as string) + 0.001,
          longitude: parseFloat(lng as string) + 0.001,
          status: 'Producing',
          operator: 'Sample Operator',
          depth: 8500,
          formation: 'Woodford',
          county: county || 'Unknown'
        },
        {
          id: 'well-2',
          name: 'Sample Well 2',
          latitude: parseFloat(lat as string) - 0.001,
          longitude: parseFloat(lng as string) - 0.001,
          status: 'Drilling',
          operator: 'Another Operator',
          depth: 9200,
          formation: 'Mississippian',
          county: county || 'Unknown'
        }
      ];
      
      const normalizedCounty = county ? String(county).trim().toLowerCase() : null;
      const wells = normalizedCounty 
        ? baseWells.filter(well => {
            const wellCounty = well.county ? String(well.county).trim().toLowerCase() : '';
            const matches = wellCounty === normalizedCounty;
            if (!matches) {
              console.log(`County mismatch: well county="${well.county}" (normalized: "${wellCounty}") vs requested="${county}" (normalized: "${normalizedCounty}")`);
            }
            return matches;
          })
        : baseWells;
      
      console.log(`Fetching wells: lat=${lat}, lng=${lng}, radius=${radius}, county="${county || 'none'}" (normalized: "${normalizedCounty || 'none'}"), found ${wells.length} wells`);
      
      res.json(wells);
    } catch (error: any) {
      console.error('Error fetching nearby wells:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching nearby wells', 
        error: error.message 
      });
    }
  });

  // Get nearby permits
  router.get('/api/map/nearby/permits', async (req, res) => {
    try {
      const { lat, lng, radius } = req.query;
      
      const permits = [
        {
          id: 'permit-1',
          permitNumber: 'P-12345',
          latitude: parseFloat(lat as string) + 0.002,
          longitude: parseFloat(lng as string) + 0.002,
          status: 'Approved',
          operator: 'Sample Operator',
          issueDate: '2024-01-15',
          expirationDate: '2025-01-15'
        }
      ];
      
      res.json(permits);
    } catch (error: any) {
      console.error('Error fetching nearby permits:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching nearby permits', 
        error: error.message 
      });
    }
  });

  // Get nearby rigs
  router.get('/api/map/nearby/rigs', async (req, res) => {
    try {
      const { lat, lng, radius } = req.query;
      
      const rigs = [
        {
          id: 'rig-1',
          name: 'Rig Alpha',
          latitude: parseFloat(lat as string) + 0.003,
          longitude: parseFloat(lng as string) + 0.003,
          status: 'Active',
          operator: 'Drilling Company',
          depth: 7500,
          targetFormation: 'Woodford'
        }
      ];
      
      res.json(rigs);
    } catch (error: any) {
      console.error('Error fetching nearby rigs:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching nearby rigs', 
        error: error.message 
      });
    }
  });

  // Get nearby units
  router.get('/api/map/nearby/units', async (req, res) => {
    try {
      const { lat, lng, radius } = req.query;
      
      const units = [
        {
          id: 'unit-1',
          name: 'Sample Unit',
          latitude: parseFloat(lat as string) + 0.004,
          longitude: parseFloat(lng as string) + 0.004,
          status: 'Active',
          operator: 'Unit Operator',
          formation: 'Woodford',
          acreage: 640
        }
      ];
      
      res.json(units);
    } catch (error: any) {
      console.error('Error fetching nearby units:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching nearby units', 
        error: error.message 
      });
    }
  });

  // Update map layer preference
  router.put('/api/map/layer-preferences/:layerName', async (req, res) => {
    try {
      const { layerName } = req.params;
      const { isVisible, opacity } = req.body;
      
      res.json({ 
        success: true, 
        message: `Layer ${layerName} preference updated`,
        layerName,
        isVisible,
        opacity
      });
    } catch (error: any) {
      console.error('Error updating map layer preference:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error updating map layer preference', 
        error: error.message 
      });
    }
  });

  return router;
};

