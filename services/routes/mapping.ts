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

  // Get wells within PLSS sections (by bounds or section STRs)
  router.get('/api/map/wells/by-sections', async (req, res) => {
    try {
      if (!dbPool) {
        return res.status(500).json({ success: false, message: 'Database pool not initialized' });
      }

      const { minLat, maxLat, minLon, maxLon, sectionStrs, wellTypes } = req.query;
      console.log('Wells API called with params:', { minLat, maxLat, minLon, maxLon, sectionStrs, wellTypes });
      console.log('wellTypes type:', typeof wellTypes, 'value:', wellTypes);

      // Try to fetch from producing_wells table if it exists
      let wells: any[] = [];
      try {
        let query = '';
        const params: any[] = [];

        // Query using the new table structure (api, operator, status are direct columns)
        // If section STRs are provided, try to match by section
        if (sectionStrs && typeof sectionStrs === 'string') {
          const sectionList = sectionStrs.split(',').map(s => s.trim()).filter(s => s);
          if (sectionList.length > 0) {
            // Database format: "1.00-01N-01E" (decimal section)
            // Search format: "06-01S-03W" (zero-padded integer)
            // We need to convert search format to match database format
            const conditions: string[] = [];
            const conditionParams: any[] = [];
            
            sectionList.forEach(sectionStr => {
              const parts = sectionStr.split('-');
              if (parts.length === 3) {
                const sectionNum = parseInt(parts[0]);
                const township = parts[1];
                const range = parts[2];
                
                if (!isNaN(sectionNum)) {
                  // Database stores as "1.00" format, so convert "06" -> "6.00"
                  const dbSectionFormat = `${sectionNum}.00`;
                  
                  // Try exact match with converted format
                  conditions.push('section_str = ?');
                  conditionParams.push(`${dbSectionFormat}-${township}-${range}`);
                  
                  // Try LIKE match (more flexible)
                  conditions.push('section_str LIKE ?');
                  conditionParams.push(`%${dbSectionFormat}-${township}-${range}%`);
                  
                  // Also try matching by individual components (more reliable)
                  conditions.push('(CAST(section AS DECIMAL(10,2)) = ? AND township = ? AND `range` = ?)');
                  conditionParams.push(sectionNum);
                  conditionParams.push(township);
                  conditionParams.push(range);
                  
                  // Try with leading zero format too (e.g., "06" -> try "6.00" and "06.00")
                  if (parts[0].length === 2 && parts[0].startsWith('0')) {
                    const numWithoutZero = parseInt(parts[0]);
                    conditions.push('(CAST(section AS DECIMAL(10,2)) = ? AND township = ? AND `range` = ?)');
                    conditionParams.push(numWithoutZero);
                    conditionParams.push(township);
                    conditionParams.push(range);
                  }
                }
              }
            });
            
            if (conditions.length > 0) {
              // Add well type filter if provided
              let wellTypeCondition = '';
              const wellTypeParams: any[] = [];
              if (wellTypes && typeof wellTypes === 'string') {
                const wellTypeList = wellTypes.split(',').map(t => t.trim()).filter(t => t);
                if (wellTypeList.length > 0) {
                  wellTypeCondition = ` AND welltype IN (${wellTypeList.map(() => '?').join(',')})`;
                  wellTypeParams.push(...wellTypeList);
                }
              }
              
              query = `
                SELECT DISTINCT
                  id,
                  api as apiNumber,
                  well_name as wellName,
                  COALESCE(operator, 'Unknown') as operator,
                  latitude,
                  longitude,
                  COALESCE(status, 'Unknown') as status,
                  welltype as wellType,
                  created_at as createdAt,
                  updated_at as updatedAt
                FROM producing_wells
                WHERE latitude IS NOT NULL 
                  AND longitude IS NOT NULL
                  AND (
                    ${conditions.join(' OR ')}
                  )
                  ${wellTypeCondition}
                LIMIT 5000
              `;
              // Push params in correct order: section condition params first, then well type params
              // The SQL has: (section conditions with ? placeholders) AND welltype IN (?, ?, ...)
              params.push(...conditionParams, ...wellTypeParams);
              console.log(`Querying wells with ${sectionList.length} section STRs, ${conditions.length} conditions${wellTypeCondition ? `, wellTypes: ${wellTypes}` : ''}, total params: ${params.length}`);
              console.log(`Query: ${query.substring(0, 300)}...`);
              console.log(`Section condition params count: ${conditionParams.length}, Well type params count: ${wellTypeParams.length}`);
              console.log(`Params sample (first 15):`, params.slice(0, 15));
              console.log(`Params sample (last 5):`, params.slice(-5));
              if (wellTypeParams.length > 0) {
                console.log(`Well type params should be at end:`, wellTypeParams);
                console.log(`Last ${wellTypeParams.length} params in array:`, params.slice(-wellTypeParams.length));
                // Verify the wellType params are actually in the params array
                const lastParams = params.slice(-wellTypeParams.length);
                const matches = wellTypeParams.every((wt, i) => lastParams[i] === wt);
                console.log(`Well type params match: ${matches}`, { expected: wellTypeParams, actual: lastParams });
              }
              console.log(`Full params array:`, params);
            }
          }
        }

        // If bounds are provided, use spatial query (but only if bounds are valid lat/lon)
        if (!query && minLat && maxLat && minLon && maxLon) {
          const minLatNum = parseFloat(minLat as string);
          const maxLatNum = parseFloat(maxLat as string);
          const minLonNum = parseFloat(minLon as string);
          const maxLonNum = parseFloat(maxLon as string);
          
          // Validate that bounds are reasonable lat/lon values (not Web Mercator)
          // Oklahoma is roughly: lat 33-37, lon -103 to -94
          const isValidBounds = 
            minLatNum >= -90 && maxLatNum <= 90 && 
            minLonNum >= -180 && maxLonNum <= 180 &&
            Math.abs(minLatNum) < 90 && Math.abs(maxLatNum) < 90 &&
            Math.abs(minLonNum) < 180 && Math.abs(maxLonNum) < 180;
          
          if (isValidBounds) {
            // Add well type filter if provided
            let wellTypeCondition = '';
            const wellTypeParams: any[] = [];
            if (wellTypes && typeof wellTypes === 'string') {
              const wellTypeList = wellTypes.split(',').map(t => t.trim()).filter(t => t);
              if (wellTypeList.length > 0) {
                wellTypeCondition = ` AND welltype IN (${wellTypeList.map(() => '?').join(',')})`;
                wellTypeParams.push(...wellTypeList);
              }
            }
            
            query = `
              SELECT DISTINCT
                id,
                api as apiNumber,
                well_name as wellName,
                COALESCE(operator, 'Unknown') as operator,
                latitude,
                longitude,
                COALESCE(status, 'Unknown') as status,
                welltype as wellType,
                created_at as createdAt,
                updated_at as updatedAt
              FROM producing_wells
              WHERE latitude IS NOT NULL 
                AND longitude IS NOT NULL
                AND latitude BETWEEN ? AND ?
                AND longitude BETWEEN ? AND ?
                ${wellTypeCondition}
              LIMIT 5000
            `;
            // Push params in correct order: bounds params first, then well type params
            params.push(
              Math.min(minLatNum, maxLatNum), // Ensure min < max
              Math.max(minLatNum, maxLatNum),
              Math.min(minLonNum, maxLonNum),
              Math.max(minLonNum, maxLonNum)
            );
            params.push(...wellTypeParams);
            console.log(`Querying wells by bounds with${wellTypeCondition ? ` wellTypes: ${wellTypes}` : ' no well type filter'}, total params: ${params.length}`);
            console.log(`Bounds query preview: ${query.substring(0, 300)}...`);
            console.log(`Bounds params:`, params);
          } else {
            console.warn('Invalid bounds provided (likely Web Mercator), ignoring bounds query:', { minLatNum, maxLatNum, minLonNum, maxLonNum });
          }
        }

        // Fallback: if no specific query, use bounds with default Oklahoma area
        if (!query) {
          // Add well type filter if provided
          let wellTypeCondition = '';
          const fallbackWellTypeParams: any[] = [];
          if (wellTypes && typeof wellTypes === 'string') {
            const wellTypeList = wellTypes.split(',').map(t => t.trim()).filter(t => t);
            if (wellTypeList.length > 0) {
              wellTypeCondition = ` AND welltype IN (${wellTypeList.map(() => '?').join(',')})`;
              fallbackWellTypeParams.push(...wellTypeList);
            }
          }
          
          query = `
            SELECT DISTINCT
              id,
              api as apiNumber,
              well_name as wellName,
              COALESCE(operator, 'Unknown') as operator,
              latitude,
              longitude,
              COALESCE(status, 'Unknown') as status,
              welltype as wellType,
              created_at as createdAt,
              updated_at as updatedAt
            FROM producing_wells
            WHERE latitude IS NOT NULL 
              AND longitude IS NOT NULL
              AND latitude BETWEEN 33.0 AND 37.0
              AND longitude BETWEEN -103.0 AND -94.0
              ${wellTypeCondition}
            LIMIT 5000
          `;
          params.push(...fallbackWellTypeParams);
          console.log(`Using fallback query with${wellTypeCondition ? ` wellTypes: ${wellTypes}` : ' no well type filter'}, params:`, params);
        }

        if (query) {
          console.log(`Executing query with ${params.length} parameters`);
          console.log(`Query preview: ${query.substring(0, 500)}...`);
          if (wellTypes) {
            console.log(`Well types filter: ${wellTypes}`);
            console.log(`Well types parsed:`, typeof wellTypes === 'string' ? wellTypes.split(',').map(t => t.trim()) : wellTypes);
          }
          console.log(`Params array (first 20):`, params.slice(0, 20));
          console.log(`Params array (last 5):`, params.slice(-5));
          console.log(`Params array length:`, params.length);
          
          // Count placeholders in query to verify param count matches
          const placeholderCount = (query.match(/\?/g) || []).length;
          console.log(`Query has ${placeholderCount} placeholders, params array has ${params.length} values`);
          if (placeholderCount !== params.length) {
            console.error(`MISMATCH: Query has ${placeholderCount} placeholders but ${params.length} params!`);
          }
          
          try {
            wells = await executeQuery(dbPool, query, params);
            console.log(`Fetched ${wells.length} real wells from producing_wells table`);
            if (wells.length === 0 && wellTypes) {
              console.warn(`No wells found with wellTypes=${wellTypes}. This might mean:`);
              console.warn(`  1. No wells of these types exist in the selected sections/bounds`);
              console.warn(`  2. The query parameters might be in the wrong order`);
              console.warn(`  3. The welltype values might not match exactly (case-sensitive)`);
            }
          } catch (queryError: any) {
            console.error('Query execution error:', queryError.message);
            console.error('Query was:', query.substring(0, 500));
            console.error('Params were:', params.slice(0, 20), '...', params.slice(-5));
            throw queryError;
          }
        } else {
          console.warn('No query was built - this should not happen');
        }
      } catch (tableError: any) {
        // If join fails, try querying just producing_wells table without joins
        console.warn('Query with joins failed, trying simple query:', tableError.message);
        try {
          let simpleQuery = '';
          const simpleParams: any[] = [];

          // Add well type filter if provided (for all simple query paths)
          let simpleWellTypeCondition = '';
          const simpleWellTypeParams: any[] = [];
          if (wellTypes && typeof wellTypes === 'string') {
            const wellTypeList = wellTypes.split(',').map(t => t.trim()).filter(t => t);
            if (wellTypeList.length > 0) {
              simpleWellTypeCondition = ` AND welltype IN (${wellTypeList.map(() => '?').join(',')})`;
              simpleWellTypeParams.push(...wellTypeList);
            }
          }

          // If section STRs are provided
          if (sectionStrs && typeof sectionStrs === 'string') {
            const sectionList = sectionStrs.split(',').map(s => s.trim()).filter(s => s);
            if (sectionList.length > 0) {
              simpleQuery = `
                SELECT DISTINCT
                  id,
                  api as apiNumber,
                  well_name as wellName,
                  COALESCE(operator, 'Unknown') as operator,
                  latitude,
                  longitude,
                  COALESCE(status, 'Unknown') as status,
                  welltype as wellType,
                  created_at as createdAt,
                  updated_at as updatedAt
                FROM producing_wells
                WHERE latitude IS NOT NULL 
                  AND longitude IS NOT NULL
                  AND (
                    ${sectionList.map(() => 'section_str LIKE ?').join(' OR ')}
                  )
                  ${simpleWellTypeCondition}
                LIMIT 5000
              `;
              simpleParams.push(...sectionList.map(s => `%${s}%`));
              simpleParams.push(...simpleWellTypeParams);
            }
          }

          // If bounds are provided
          if (!simpleQuery && minLat && maxLat && minLon && maxLon) {
            const minLatNum = parseFloat(minLat as string);
            const maxLatNum = parseFloat(maxLat as string);
            const minLonNum = parseFloat(minLon as string);
            const maxLonNum = parseFloat(maxLon as string);
            
            // Validate bounds
            const isValidBounds = 
              minLatNum >= -90 && maxLatNum <= 90 && 
              minLonNum >= -180 && maxLonNum <= 180 &&
              Math.abs(minLatNum) < 90 && Math.abs(maxLatNum) < 90 &&
              Math.abs(minLonNum) < 180 && Math.abs(maxLonNum) < 180;
            
            if (isValidBounds) {
              simpleQuery = `
                SELECT DISTINCT
                  id,
                  api as apiNumber,
                  well_name as wellName,
                  COALESCE(operator, 'Unknown') as operator,
                  latitude,
                  longitude,
                  COALESCE(status, 'Unknown') as status,
                  welltype as wellType,
                  created_at as createdAt,
                  updated_at as updatedAt
                FROM producing_wells
                WHERE latitude IS NOT NULL 
                  AND longitude IS NOT NULL
                  AND latitude BETWEEN ? AND ?
                  AND longitude BETWEEN ? AND ?
                  ${simpleWellTypeCondition}
                LIMIT 5000
              `;
              simpleParams.push(
                Math.min(minLatNum, maxLatNum),
                Math.max(minLatNum, maxLatNum),
                Math.min(minLonNum, maxLonNum),
                Math.max(minLonNum, maxLonNum)
              );
              simpleParams.push(...simpleWellTypeParams);
            }
          }

          // Fallback: default Oklahoma area
          if (!simpleQuery) {
            // Add well type filter if provided
            let wellTypeCondition = '';
            const fallbackParams: any[] = [];
            if (wellTypes && typeof wellTypes === 'string') {
              const wellTypeList = wellTypes.split(',').map(t => t.trim()).filter(t => t);
              if (wellTypeList.length > 0) {
                wellTypeCondition = ` AND welltype IN (${wellTypeList.map(() => '?').join(',')})`;
                fallbackParams.push(...wellTypeList);
              }
            }
            
            simpleQuery = `
              SELECT DISTINCT
                id,
                api as apiNumber,
                well_name as wellName,
                COALESCE(operator, 'Unknown') as operator,
                latitude,
                longitude,
                COALESCE(status, 'Unknown') as status,
                welltype as wellType,
                created_at as createdAt,
                updated_at as updatedAt
              FROM producing_wells
              WHERE latitude IS NOT NULL 
                AND longitude IS NOT NULL
                AND latitude BETWEEN 33.0 AND 37.0
                AND longitude BETWEEN -103.0 AND -94.0
                ${wellTypeCondition}
              LIMIT 5000
            `;
            simpleParams.push(...fallbackParams);
          }

          if (simpleQuery) {
            wells = await executeQuery(dbPool, simpleQuery, simpleParams);
            console.log(`Fetched ${wells.length} wells using simple query (without joins)`);
          }
        } catch (simpleError: any) {
          console.error('Error fetching wells with simple query:', simpleError.message);
          wells = [];
        }
      }
      
      const mappedWells = wells.map((well: any) => ({
        id: well.id || `well-${well.apiNumber || well.wellName}`,
        apiNumber: well.apiNumber || '',
        wellName: well.wellName || 'Unknown Well',
        operator: well.operator || 'Unknown',
        latitude: parseFloat(well.latitude) || 0,
        longitude: parseFloat(well.longitude) || 0,
        status: well.status || 'Unknown',
        wellType: well.wellType || well.welltype || null,
        spudDate: null, // Not in new table structure
        completionDate: null, // Not in new table structure
        totalDepth: null, // Not in new table structure
        createdAt: well.createdAt || new Date().toISOString(),
        updatedAt: well.updatedAt || new Date().toISOString()
      }));
      
      console.log(`Returning ${mappedWells.length} wells to client`);
      res.json({
        success: true,
        data: mappedWells
      });
    } catch (error: any) {
      console.error('Error fetching wells by sections:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching wells by sections', 
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

