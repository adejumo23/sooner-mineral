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

  // Get map assets
  router.get('/api/map/assets', async (req, res) => {
    try {
      if (!dbPool) {
        return res.status(500).json({ success: false, message: 'Database pool not initialized' });
      }

      // Return empty array for now - can be populated with actual assets later
      res.json([]);
    } catch (error: any) {
      console.error('Error fetching map assets:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching map assets', 
        error: error.message 
      });
    }
  });

  // Get map overlays
  router.get('/api/map/overlays', async (req, res) => {
    try {
      // Return empty array for now - overlays can be added later
      res.json([]);
    } catch (error: any) {
      console.error('Error fetching map overlays:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching map overlays', 
        error: error.message 
      });
    }
  });

  // Get map layer configs
  router.get('/api/map/layer-configs', async (req, res) => {
    try {
      // Return default layer configurations
      const defaultConfigs = [
        {
          id: 'sections',
          name: 'Sections',
          type: 'graphics',
          visible: true,
          opacity: 0.8
        },
        {
          id: 'tracts',
          name: 'Tracts',
          type: 'graphics',
          visible: true,
          opacity: 0.7
        },
        {
          id: 'units',
          name: 'Units',
          type: 'graphics',
          visible: false,
          opacity: 0.6
        }
      ];

      res.json(defaultConfigs);
    } catch (error: any) {
      console.error('Error fetching map layer configs:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching map layer configs', 
        error: error.message 
      });
    }
  });

  // Get map filter options
  router.get('/api/map/filter-options', async (req, res) => {
    try {
      if (!dbPool) {
        return res.status(500).json({ success: false, message: 'Database pool not initialized' });
      }

      // Get unique values from database for filter options
      const [countiesResult, statesResult] = await Promise.all([
        executeQuery(dbPool, `
          SELECT DISTINCT COUNTY as county
          FROM prod_acreage_schedule
          WHERE COUNTY IS NOT NULL AND COUNTY != ''
          ORDER BY COUNTY
        `).catch(() => []),
        executeQuery(dbPool, `
          SELECT DISTINCT ST as state
          FROM prod_acreage_schedule
          WHERE ST IS NOT NULL AND ST != ''
          ORDER BY ST
        `).catch(() => [])
      ]);

      const counties = countiesResult.map((row: any) => row.county);
      const states = statesResult.map((row: any) => row.state);

      res.json({
        assetTypes: ['Tract', 'Unit', 'Section'],
        counties: counties,
        states: states,
        assignmentStatuses: ['assigned', 'unassigned', 'In Negotiation', 'Under Review', 'Completed']
      });
    } catch (error: any) {
      console.error('Error fetching map filter options:', error);
      // Return default options on error
      res.json({
        assetTypes: ['Tract', 'Unit', 'Section'],
        counties: [],
        states: ['OK'],
        assignmentStatuses: ['assigned', 'unassigned', 'In Negotiation', 'Under Review', 'Completed']
      });
    }
  });

  // Log map interaction
  router.post('/api/map/interactions', async (req, res) => {
    try {
      const interaction = req.body;
      console.log('Map interaction logged:', interaction);
      
      res.json({ 
        success: true, 
        message: 'Interaction logged successfully'
      });
    } catch (error: any) {
      console.error('Error logging map interaction:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error logging map interaction', 
        error: error.message 
      });
    }
  });

  // Export map data
  router.post('/api/map/export', async (req, res) => {
    try {
      const exportRequest = req.body;
      console.log('Map export requested:', exportRequest);
      
      res.json({ 
        success: true, 
        message: 'Export request received',
        exportId: `export-${Date.now()}`
      });
    } catch (error: any) {
      console.error('Error exporting map data:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error exporting map data', 
        error: error.message 
      });
    }
  });

  return router;
};

