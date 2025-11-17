import { Router } from 'express';
import type { Pool } from 'mysql2/promise';
import { executeQuery } from '../utils/database.js';
import { getCachedAssignments } from '../utils/cache.js';

// Request deduplication map (should be shared across routes)
const pendingRequests = new Map<string, Promise<any>>();

export const createUnitsRoutes = (dbPool: Pool | null) => {
  const router = Router();

  // Get all units
  router.get('/api/units', async (req, res) => {
    try {
      if (!dbPool) {
        return res.status(500).json({ success: false, message: 'Database pool not initialized' });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;

      if (page < 1 || limit < 1 || limit > 1000) {
        return res.status(400).json({
          success: false,
          message: 'Invalid pagination parameters. Page must be >= 1, limit must be between 1 and 1000'
        });
      }

      const countQuery = `
        SELECT COUNT(DISTINCT TRIM(REPLACE(REPLACE(CURRENT_UNIT_NAME, '\r\n', ' '), '\n', ' '))) as total
        FROM prod_acreage_schedule
        WHERE CURRENT_UNIT_NAME IS NOT NULL 
          AND CURRENT_UNIT_NAME != ''
      `;
      const countResult = await executeQuery(dbPool, countQuery);
      const totalCount = countResult[0].total;

      const uniqueUnitsQuery = `
        SELECT DISTINCT TRIM(REPLACE(REPLACE(CURRENT_UNIT_NAME, '\r\n', ' '), '\n', ' ')) as CURRENT_UNIT_NAME
        FROM prod_acreage_schedule
        WHERE CURRENT_UNIT_NAME IS NOT NULL 
          AND CURRENT_UNIT_NAME != ''
        ORDER BY TRIM(REPLACE(REPLACE(CURRENT_UNIT_NAME, '\r\n', ' '), '\n', ' '))
      `;
      
      const uniqueUnits = await executeQuery(dbPool, uniqueUnitsQuery);
      const totalUniqueUnits = uniqueUnits.length;
      
      const startIndex = offset;
      const endIndex = Math.min(offset + limit, totalUniqueUnits);
      const paginatedUnitNames = uniqueUnits.slice(startIndex, endIndex).map((u: any) => u.CURRENT_UNIT_NAME);
      
      if (paginatedUnitNames.length === 0) {
        return res.json({
          data: [],
          pagination: {
            page,
            limit,
            total: totalUniqueUnits,
            totalPages: Math.ceil(totalUniqueUnits / limit),
            hasNextPage: page < Math.ceil(totalUniqueUnits / limit),
            hasPrevPage: page > 1,
            nextPage: page < Math.ceil(totalUniqueUnits / limit) ? page + 1 : null,
            prevPage: page > 1 ? page - 1 : null
          }
        });
      }
      
      const placeholders = paginatedUnitNames.map(() => '?').join(',');
      const query = `
        SELECT 
          TRIM(REPLACE(REPLACE(CURRENT_UNIT_NAME, '\r\n', ' '), '\n', ' ')) as unit_name,
          COUNT(DISTINCT S_T_R) as section_count,
          SUM(NMA) as total_net_mineral_acres,
          AVG(ROY) as average_royalty,
          MAX(BUYER) as assigned_buyer,
          MAX(COUNTY) as primary_county,
          MAX(ST) as state,
          MAX(STATUS) as status,
          MAX(NOTE) as notes,
          MAX(created_at) as created_at,
          MAX(updated_at) as updated_at
        FROM prod_acreage_schedule
        WHERE TRIM(REPLACE(REPLACE(CURRENT_UNIT_NAME, '\r\n', ' '), '\n', ' ')) IN (${placeholders})
        GROUP BY TRIM(REPLACE(REPLACE(CURRENT_UNIT_NAME, '\r\n', ' '), '\n', ' '))
        ORDER BY TRIM(REPLACE(REPLACE(CURRENT_UNIT_NAME, '\r\n', ' '), '\n', ' '))
      `;

      const rows = await executeQuery(dbPool, query, paginatedUnitNames);
      
      const units = rows.map((row: any, index: number) => {
        const unitId = encodeURIComponent(row.unit_name);
        
        return {
          id: unitId,
          unitName: row.unit_name,
          operator: 'Unknown',
          apiNumbers: [],
          targetFormations: ['Hunton', 'Woodford', 'Mississippian'],
          status: row.status === 'PRODUCING' ? 'Producing' : 
                 row.status === 'PERMITTED' ? 'Permitted' : 'Held by Production',
          estimatedGrossAcres: parseFloat(row.total_net_mineral_acres) || 0,
          estimatedNetAcres: parseFloat(row.total_net_mineral_acres) || 0,
          county: row.primary_county || 'Unknown',
          state: row.state || 'OK',
          linkedSectionIds: [],
          linkedContactIds: [],
          assignedBuyerId: null,
          assignedBuyer: row.assigned_buyer ? { name: row.assigned_buyer } : null,
          heldByFund: false,
          exitStrategy: 'Hold',
          isLocked: false,
          notes: row.notes || '',
          createdAt: row.created_at || new Date().toISOString(),
          updatedAt: row.updated_at || new Date().toISOString(),
          createdBy: 'system',
          updatedBy: 'system',
          createdByUser: null,
          updatedByUser: null,
          esgProfileId: null,
          esgRiskLevel: null,
          carbonIntensity: null,
          operatorComplianceScore: null,
          regulatoryCompliance: null,
          hasRiskFlags: false,
          lastESGUpdate: null,
          totalNetMineralAcres: parseFloat(row.total_net_mineral_acres) || 0,
          averageRoyalty: parseFloat(row.average_royalty) || 0,
          allocationPercentage: 0,
          buyer: row.assigned_buyer,
          sectionCount: parseInt(row.section_count) || 0,
          linkedTractIds: Array.from({ length: parseInt(row.section_count) || 0 }, (_, i) => `section_${i + 1}`)
        };
      });

      const totalPages = Math.ceil(totalUniqueUnits / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      res.json({
        data: units,
        pagination: {
          page: page,
          limit: limit,
          total: totalUniqueUnits,
          totalPages: totalPages,
          hasNextPage: hasNextPage,
          hasPrevPage: hasPrevPage,
          nextPage: hasNextPage ? page + 1 : null,
          prevPage: hasPrevPage ? page - 1 : null
        }
      });
    } catch (error: any) {
      console.error('Error fetching units:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching units', 
        error: error.message 
      });
    }
  });

  // Get single unit by ID
  router.get('/api/units/:id', async (req, res) => {
    try {
      if (!dbPool) {
        return res.status(500).json({ success: false, message: 'Database pool not initialized' });
      }

      const { id } = req.params;
      const unitName = decodeURIComponent(id);
      console.log('Looking for unit name:', unitName);
      
      const query = `
        SELECT 
          id,
          COUNTY,
          S_T_R,
          CURRENT_UNIT_NAME,
          OWNER,
          NMA,
          ROY,
          ALLO_ AS ALLOCATION_PERCENT,
          STATUS,
          BUYER,
          NOTE,
          INTEREST_TYPE,
          LEGAL_DESCRIPTION,
          STREET,
          CITY,
          ST,
          ZIP,
          PHONE_EMAIL,
          CONTACT,
          created_at,
          updated_at
        FROM prod_acreage_schedule
        WHERE TRIM(REPLACE(REPLACE(CURRENT_UNIT_NAME, '\r\n', ' '), '\n', ' ')) = ?
        ORDER BY CURRENT_UNIT_NAME, COUNTY, S_T_R
      `;

      console.log('Querying for unit name:', unitName);
      const rows = await executeQuery(dbPool, query, [unitName]);
      console.log('Found rows:', rows.length);
      
      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Unit not found' });
      }

      const unitMap = new Map();
      
      rows.forEach((row: any) => {
        if (row.CURRENT_UNIT_NAME) {
          const fullUnitName = row.CURRENT_UNIT_NAME;
          const trimmedUnitName = fullUnitName.trim();
          
          if (!unitMap.has(trimmedUnitName)) {
            unitMap.set(trimmedUnitName, {
              id: row.id,
              unitName: trimmedUnitName.replace(/\s+(?=[A-Z]+\s+[A-Z]+\s+\d+)/g, '\n'),
              operator: 'Unknown',
              apiNumbers: [],
              targetFormations: ['Hunton', 'Woodford', 'Mississippian'],
              status: row.STATUS === 'PRODUCING' ? 'Producing' : 
                     row.STATUS === 'PERMITTED' ? 'Permitted' : 'Held by Production',
              estimatedGrossAcres: parseFloat(row.NMA) || 0,
              estimatedNetAcres: parseFloat(row.NMA) || 0,
              county: row.COUNTY,
              state: row.ST || 'OK',
              linkedTractIds: [row.id],
              linkedContactIds: [],
              assignedBuyerId: null,
              assignedBuyer: null,
              heldByFund: false,
              exitStrategy: 'Hold',
              isLocked: false,
              notes: row.NOTE || '',
              createdAt: row.created_at,
              updatedAt: row.updated_at,
              createdBy: 'system',
              updatedBy: 'system',
              createdByUser: null,
              updatedByUser: null,
              esgProfileId: null,
              esgRiskLevel: null,
              carbonIntensity: null,
              operatorComplianceScore: null,
              regulatoryCompliance: null,
              hasRiskFlags: false,
              lastESGUpdate: null,
              totalNetMineralAcres: parseFloat(row.NMA) || 0,
              averageRoyalty: parseFloat(row.ROY) || 0,
              allocationPercentage: parseFloat(row.ALLOCATION_PERCENT) || 0,
              buyer: row.BUYER,
              interestType: row.INTEREST_TYPE,
              legalDescription: row.LEGAL_DESCRIPTION,
              owner: row.OWNER,
              contact: row.CONTACT,
              street: row.STREET,
              city: row.CITY,
              zip: row.ZIP,
              phoneEmail: row.PHONE_EMAIL
            });
          } else {
            const existingUnit = unitMap.get(trimmedUnitName);
            existingUnit.linkedTractIds.push(row.id);
            existingUnit.estimatedGrossAcres += parseFloat(row.NMA) || 0;
            existingUnit.estimatedNetAcres += parseFloat(row.NMA) || 0;
            existingUnit.totalNetMineralAcres += parseFloat(row.NMA) || 0;
          }
        }
      });

      const units = Array.from(unitMap.values());
      
      if (units.length === 0) {
        return res.status(404).json({ success: false, message: 'Unit not found' });
      }

      res.json(units[0]);
    } catch (error: any) {
      console.error('Error fetching unit:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching unit',
        error: error.message 
      });
    }
  });

  // Get unit names for a specific unit
  router.get('/api/units/:id/unit-names', async (req, res) => {
    try {
      if (!dbPool) {
        return res.status(500).json({ success: false, message: 'Database pool not initialized' });
      }

      const { id } = req.params;
      const unitName = decodeURIComponent(id);
      console.log('Looking for unit names for:', unitName);
      
      const query = `
        SELECT DISTINCT 
          CURRENT_UNIT_NAME,
          NEW_UNIT_NAME
        FROM prod_acreage_schedule
        WHERE TRIM(REPLACE(REPLACE(CURRENT_UNIT_NAME, '\r\n', ' '), '\n', ' ')) = ?
        ORDER BY CURRENT_UNIT_NAME, NEW_UNIT_NAME
      `;
      
      const rows = await executeQuery(dbPool, query, [unitName]);
      console.log('Found unit name records:', rows.length);
      
      if (rows.length === 0) {
        return res.json({
          currentUnitNames: [],
          newUnitNames: [],
          totalRecords: 0
        });
      }
      
      const allUnitNames = new Set<string>();
      const allNewUnitNames = new Set<string>();
      
      rows.forEach((row: any) => {
        if (row.CURRENT_UNIT_NAME) {
          const unitNames = row.CURRENT_UNIT_NAME.split(/\r\n|\n/).filter((name: string) => name.trim() !== '');
          unitNames.forEach((name: string) => allUnitNames.add(name.trim()));
        }
        
        if (row.NEW_UNIT_NAME != null && row.NEW_UNIT_NAME !== '') {
          const trimmedNewName = String(row.NEW_UNIT_NAME).trim();
          if (trimmedNewName && trimmedNewName !== 'NULL' && trimmedNewName !== 'null') {
            if (trimmedNewName.includes('\n') || trimmedNewName.includes('\r\n')) {
              const newUnitNames = trimmedNewName.split(/\r\n|\n/).filter((name: string) => name.trim() !== '' && name.trim() !== 'NULL' && name.trim() !== 'null');
              newUnitNames.forEach((name: string) => allNewUnitNames.add(name.trim()));
            } else {
              allNewUnitNames.add(trimmedNewName);
            }
          }
        }
      });
      
      const currentUnitNames = Array.from(allUnitNames);
      const newUnitNames = Array.from(allNewUnitNames);
      
      console.log(`Extracted ${newUnitNames.length} new unit names:`, newUnitNames);
      
      res.json({
        currentUnitNames: currentUnitNames,
        newUnitNames: newUnitNames,
        totalRecords: currentUnitNames.length
      });
      
    } catch (error: any) {
      console.error('Error fetching unit names:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching unit names',
        error: error.message 
      });
    }
  });

  // Get unit tracts
  router.get('/api/units/:id/tracts', async (req, res) => {
    try {
      if (!dbPool) {
        return res.status(500).json({ success: false, message: 'Database pool not initialized' });
      }

      const { id } = req.params;
      const databaseId = id;
      
      const unitQuery = `
        SELECT DISTINCT CURRENT_UNIT_NAME
        FROM prod_acreage_schedule
        WHERE id = ?
      `;
      
      const unitRows = await executeQuery(dbPool, unitQuery, [databaseId]);
      
      if (unitRows.length === 0) {
        return res.status(404).json({ success: false, message: 'Unit not found' });
      }
      
      const unitName = unitRows[0].CURRENT_UNIT_NAME;
      
      const query = `
        SELECT 
          id,
          COUNTY,
          S_T_R,
          CURRENT_UNIT_NAME,
          OWNER,
          NMA,
          ROY,
          ALLO_ AS ALLOCATION_PERCENT,
          STATUS,
          BUYER,
          NOTE,
          INTEREST_TYPE,
          LEGAL_DESCRIPTION,
          STREET,
          CITY,
          ST,
          ZIP,
          PHONE_EMAIL,
          CONTACT,
          created_at,
          updated_at
        FROM prod_acreage_schedule
        WHERE CURRENT_UNIT_NAME = ?
        ORDER BY COUNTY, S_T_R
      `;

      const rows = await executeQuery(dbPool, query, [unitName]);
      
      if (rows.length === 0) {
        return res.json([]);
      }

      const tracts = rows.map((row: any) => ({
        id: row.id,
        tractName: `${row.COUNTY} - ${row.S_T_R}`,
        county: row.COUNTY,
        section: row.S_T_R,
        str: row.S_T_R,
        sectionNumber: null,
        township: null,
        range: null,
        legalDescription: row.LEGAL_DESCRIPTION,
        netMineralAcres: parseFloat(row.NMA) || 0,
        grossAcres: parseFloat(row.NMA) || 0,
        state: row.ST || 'OK',
        heldByFund: false,
        isLocked: false,
        titleStatus: 'Unmapped',
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        createdBy: 'system',
        updatedBy: 'system',
        owner: row.OWNER,
        street: row.STREET,
        city: row.CITY,
        zip: row.ZIP,
        phoneEmail: row.PHONE_EMAIL,
        royalty: parseFloat(row.ROY) || 0,
        allocationPercent: parseFloat(row.ALLOCATION_PERCENT) || 0,
        buyer: row.BUYER,
        interestType: row.INTEREST_TYPE,
        notes: row.NOTE,
        contact: row.CONTACT,
        status: row.STATUS,
        unitName: row.CURRENT_UNIT_NAME ? row.CURRENT_UNIT_NAME.split('\r\n')[0].trim() : null
      }));
      
      res.json(tracts);
    } catch (error: any) {
      console.error('Error fetching unit tracts:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching unit tracts', 
        error: error.message 
      });
    }
  });

  // Get unit tracts enhanced
  router.get('/api/units/:id/tracts/enhanced', async (req, res) => {
    try {
      if (!dbPool) {
        return res.status(500).json({ success: false, message: 'Database pool not initialized' });
      }

      const { id } = req.params;
      const databaseId = id;
      
      const unitQuery = `
        SELECT DISTINCT CURRENT_UNIT_NAME
        FROM prod_acreage_schedule
        WHERE id = ?
      `;
      
      const unitRows = await executeQuery(dbPool, unitQuery, [databaseId]);
      
      if (unitRows.length === 0) {
        return res.status(404).json({ success: false, message: 'Unit not found' });
      }
      
      const unitName = unitRows[0].CURRENT_UNIT_NAME;
      
      const query = `
        SELECT 
          id,
          COUNTY,
          S_T_R,
          CURRENT_UNIT_NAME,
          OWNER,
          NMA,
          ROY,
          ALLO_ AS ALLOCATION_PERCENT,
          STATUS,
          BUYER,
          NOTE,
          INTEREST_TYPE,
          LEGAL_DESCRIPTION,
          STREET,
          CITY,
          ST,
          ZIP,
          PHONE_EMAIL,
          CONTACT,
          created_at,
          updated_at
        FROM prod_acreage_schedule
        WHERE CURRENT_UNIT_NAME = ?
        ORDER BY COUNTY, S_T_R
      `;

      const rows = await executeQuery(dbPool, query, [unitName]);
      
      if (rows.length === 0) {
        return res.json([]);
      }

      const tracts = rows.map((row: any) => ({
        id: row.id,
        tractName: `${row.COUNTY} - ${row.S_T_R}`,
        county: row.COUNTY,
        section: row.S_T_R,
        str: row.S_T_R,
        sectionNumber: null,
        township: null,
        range: null,
        legalDescription: row.LEGAL_DESCRIPTION,
        netMineralAcres: parseFloat(row.NMA) || 0,
        grossAcres: parseFloat(row.NMA) || 0,
        state: row.ST || 'OK',
        heldByFund: false,
        isLocked: false,
        titleStatus: 'Unmapped',
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        createdBy: 'system',
        updatedBy: 'system',
        owner: row.OWNER,
        street: row.STREET,
        city: row.CITY,
        zip: row.ZIP,
        phoneEmail: row.PHONE_EMAIL,
        royalty: parseFloat(row.ROY) || 0,
        allocationPercent: parseFloat(row.ALLOCATION_PERCENT) || 0,
        buyer: row.BUYER,
        interestType: row.INTEREST_TYPE,
        notes: row.NOTE,
        contact: row.CONTACT,
        status: row.STATUS,
        unitName: row.CURRENT_UNIT_NAME ? row.CURRENT_UNIT_NAME.split('\r\n')[0].trim() : null
      }));
      
      res.json(tracts);
    } catch (error: any) {
      console.error('Error fetching unit tracts enhanced:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching unit tracts enhanced', 
        error: error.message 
      });
    }
  });

  // Get unit assignments
  router.get('/api/units/:id/assignments', async (req, res) => {
    try {
      if (!dbPool) {
        return res.status(500).json({ success: false, message: 'Database pool not initialized' });
      }

      const { id } = req.params;
      const unitName = decodeURIComponent(id);
      console.log('Looking for assignments for unit:', unitName);
      
      if (pendingRequests.has(unitName)) {
        console.log('🔄 Deduplicating request for unit:', unitName);
        const result = await pendingRequests.get(unitName);
        return res.json(result);
      }
      
      const requestPromise = (async () => {
        const allAssignments = await getCachedAssignments(dbPool);
        console.log('Retrieved assignments from cache, total:', allAssignments.length);
        
        const matchingAssignments = allAssignments.filter((assignment: any) => {
          if (assignment.assetType !== 'Unit') return false;
          
          const assetId = assignment.assetId || '';
          const normalizedAssetId = assetId.replace(/\r\n/g, ' ').replace(/\n/g, ' ').trim();
          const normalizedUnitName = unitName.replace(/\r\n/g, ' ').replace(/\n/g, ' ').trim();
          
          return normalizedAssetId === normalizedUnitName || 
                 normalizedAssetId.includes(normalizedUnitName) || 
                 normalizedUnitName.includes(normalizedAssetId);
        });
        
        const uniqueAssignments = matchingAssignments.reduce((unique: any[], assignment: any) => {
          const buyerName = assignment.assignedBuyer?.name || assignment.assignedBuyerId;
          if (!unique.find((item: any) => (item.assignedBuyer?.name || item.assignedBuyerId) === buyerName)) {
            unique.push(assignment);
          }
          return unique;
        }, []);
        
        console.log('Found assignments:', matchingAssignments.length);
        console.log('Unique assignments after deduplication:', uniqueAssignments.length);
        
        const transformedAssignments = uniqueAssignments.map((assignment: any) => ({
          id: assignment.id,
          unitId: assignment.assetId,
          buyerId: assignment.assignedBuyerId,
          buyer: assignment.assignedBuyer ? {
            id: assignment.assignedBuyer.id,
            name: assignment.assignedBuyer.name,
            email: assignment.assignedBuyer.email
          } : null,
          assignedBy: assignment.assignedById,
          assignedByUser: null,
          assignedAt: assignment.assignedDate,
          removedBy: assignment.status === 'Cancelled' ? assignment.assignedById : null,
          removedByUser: null,
          removedAt: assignment.status === 'Cancelled' ? assignment.updatedAt : null,
          status: assignment.status,
          notes: assignment.notes ? assignment.notes.replace(/^Contact:\s*/, '') : assignment.notes,
          priceCapUsd: assignment.priceCapUsd,
          priceCapType: assignment.priceCapType,
          sourceChannel: assignment.sourceChannel,
          priorityScore: assignment.priorityScore,
          asset: assignment.asset
        }));
        
        return transformedAssignments;
      })();
      
      pendingRequests.set(unitName, requestPromise);
      
      try {
        const result = await requestPromise;
        res.json(result);
      } finally {
        pendingRequests.delete(unitName);
      }
    } catch (error: any) {
      console.error('Error fetching unit assignments:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching unit assignments', 
        error: error.message 
      });
    }
  });

  // Get unit notes
  router.get('/api/units/:id/notes', async (req, res) => {
    try {
      if (!dbPool) {
        return res.status(500).json({ success: false, message: 'Database pool not initialized' });
      }

      const { id } = req.params;
      const databaseId = id;
      
      const unitQuery = `
        SELECT DISTINCT CURRENT_UNIT_NAME
        FROM prod_acreage_schedule
        WHERE id = ?
      `;
      
      const unitRows = await executeQuery(dbPool, unitQuery, [databaseId]);
      
      if (unitRows.length === 0) {
        return res.status(404).json({ success: false, message: 'Unit not found' });
      }
      
      const unitName = unitRows[0].CURRENT_UNIT_NAME;
      
      const query = `
        SELECT 
          id,
          NOTE,
          created_at,
          updated_at
        FROM prod_acreage_schedule
        WHERE CURRENT_UNIT_NAME = ?
        ORDER BY created_at DESC
      `;

      const rows = await executeQuery(dbPool, query, [unitName]);
      
      const notes = rows
        .filter((row: any) => row.NOTE && String(row.NOTE).trim() !== '')
        .map((row: any, index: number) => ({
          id: `note-${row.id}-${index}`,
          content: row.NOTE,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          createdBy: 'system',
          updatedBy: 'system'
        }));
      
      res.json(notes);
    } catch (error: any) {
      console.error('Error fetching unit notes:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching unit notes', 
        error: error.message 
      });
    }
  });

  // Get unit contacts
  router.get('/api/units/:id/contacts', async (req, res) => {
    try {
      if (!dbPool) {
        return res.status(500).json({ success: false, message: 'Database pool not initialized' });
      }

      const { id } = req.params;
      const unitName = decodeURIComponent(id);
      console.log('Looking for contacts for unit:', unitName);
      
      const query = `
        SELECT 
          id,
          OWNER,
          CONTACT,
          STREET,
          CITY,
          ST,
          ZIP,
          PHONE_EMAIL,
          created_at,
          updated_at
        FROM prod_acreage_schedule
        WHERE TRIM(REPLACE(REPLACE(CURRENT_UNIT_NAME, '\r\n', ' '), '\n', ' ')) = ?
        ORDER BY OWNER
      `;

      const rows = await executeQuery(dbPool, query, [unitName]);
      console.log('Found contacts:', rows.length);
      
      const contacts = rows
        .filter((row: any) => row.OWNER && String(row.OWNER).trim() !== '')
        .map((row: any, index: number) => ({
          id: `contact-${row.id}-${index}`,
          name: row.OWNER,
          contact: row.CONTACT,
          street: row.STREET,
          city: row.CITY,
          state: row.ST,
          zip: row.ZIP,
          phoneEmail: row.PHONE_EMAIL,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        }));
      
      res.json(contacts);
    } catch (error: any) {
      console.error('Error fetching unit contacts:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching unit contacts', 
        error: error.message 
      });
    }
  });

  // Get unit contacts aggregated
  router.get('/api/units/:id/contacts/aggregated', async (req, res) => {
    try {
      if (!dbPool) {
        return res.status(500).json({ success: false, message: 'Database pool not initialized' });
      }

      const { id } = req.params;
      const unitName = decodeURIComponent(id);
      console.log('Looking for aggregated contacts for unit:', unitName);
      
      const query = `
        SELECT 
          OWNER as owner,
          CONTACT as contact,
          STREET as street,
          CITY as city,
          ST as state,
          ZIP as zip,
          PHONE_EMAIL as phoneEmail,
          NMA as nma,
          ROY as royalty,
          ALLO_ as allocation,
          COUNT(*) as tractCount,
          SUM(CAST(NMA AS DECIMAL(10,2))) as totalNMA,
          AVG(CAST(ROY AS DECIMAL(5,2))) as avgRoyalty,
          AVG(CAST(ALLO_ AS DECIMAL(5,2))) as avgAllocation
        FROM prod_acreage_schedule
        WHERE TRIM(REPLACE(REPLACE(CURRENT_UNIT_NAME, '\r\n', ' '), '\n', ' ')) = ?
          AND OWNER IS NOT NULL AND OWNER != ''
        GROUP BY OWNER, CONTACT, STREET, CITY, ST, ZIP, PHONE_EMAIL, NMA, ROY, ALLO_
        ORDER BY OWNER
      `;

      const rows = await executeQuery(dbPool, query, [unitName]);
      
      const aggregatedContacts = rows.map((row: any, index: number) => {
        const totalNMA = parseFloat(row.totalNMA) || 0;
        const avgRoyalty = parseFloat(row.avgRoyalty) || 0;
        const totalNRA = avgRoyalty > 0 ? totalNMA * (avgRoyalty / 100) / 0.125 : 0;
        
        return {
          id: `contact-${index}`,
          unitId: id,
          contactId: `contact-${row.owner}-${index}`,
          contact: {
            id: `contact-${row.owner}-${index}`,
            name: row.owner,
            contact: row.contact,
            street: row.street,
            city: row.city,
            state: row.state,
            zip: row.zip,
            phoneEmail: row.phoneEmail,
            contactType: 'Landowner'
          },
          ownershipPercentageWeighted: parseFloat(row.avgAllocation) / 100 || 0,
          royaltyPercentageWeighted: parseFloat(row.avgRoyalty) / 100 || 0,
          totalNMA: totalNMA,
          totalNRA: totalNRA,
          tractsOwned: Array.from({ length: parseInt(row.tractCount) }, (_, i) => `tract-${i}`),
          lastOutreach: null,
          leadStatus: 'Unassigned',
          hasActiveLeads: false
        };
      });
      
      res.json(aggregatedContacts);
    } catch (error: any) {
      console.error('Error fetching unit contacts aggregated:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching unit contacts aggregated', 
        error: error.message 
      });
    }
  });

  // Get unit sections
  router.get('/api/units/:id/sections', async (req, res) => {
    try {
      if (!dbPool) {
        return res.status(500).json({ success: false, message: 'Database pool not initialized' });
      }

      const { id } = req.params;
      const unitName = decodeURIComponent(id);
      console.log('Looking for sections for unit:', unitName);
      
      const query = `
        SELECT DISTINCT
          S_T_R as str,
          COUNTY as county,
          ST as state,
          STATUS as title_status,
          LEGAL_DESCRIPTION as legal_description,
          NMA as net_mineral_acres,
          CALCULATED_ACREAGE as calculated_acreage,
          BUYER as assigned_buyer,
          OWNER as owner_name,
          CONTACT as contact_info,
          PHONE_EMAIL as phone_email,
          NOTE as notes,
          CURRENT_UNIT_NAME as current_unit,
          NEW_UNIT_NAME as new_unit,
          DATE as date_created,
          TITLE_SOURCE as title_source
        FROM prod_acreage_schedule 
        WHERE TRIM(REPLACE(REPLACE(CURRENT_UNIT_NAME, '\r\n', ' '), '\n', ' ')) = ? AND S_T_R IS NOT NULL 
        ORDER BY S_T_R
      `;

      const rows = await executeQuery(dbPool, query, [unitName]);
      console.log('Found sections:', rows.length);
      
      const sections = rows.map((row: any, index: number) => {
        let section = '';
        let township = '';
        let range = '';
        
        if (row.str) {
          const parts = String(row.str).split('-');
          if (parts.length >= 3) {
            section = parts[0];
            township = parts[1];
            range = parts[2];
          }
        }
        
        const netAcres = parseFloat(row.net_mineral_acres) || 0;
        
        return {
          id: `s${index + 1}`,
          section_name: row.str || `Section ${index + 1}`,
          state: row.state || 'OK',
          county: row.county || 'Unknown',
          sectionNumber: section,
          township: township,
          range: range,
          str: row.str,
          grossAcres: netAcres,
          netMineralAcres: netAcres,
          titleStatus: row.title_status || 'Unknown',
          legalDescription: row.legal_description || '',
          assignedBuyer: row.assigned_buyer || '',
          ownerName: row.owner_name || '',
          contactInfo: row.contact_info || '',
          phoneEmail: row.phone_email || '',
          notes: row.notes || '',
          currentUnit: row.current_unit || '',
          newUnit: row.new_unit || '',
          dateCreated: row.date_created || new Date().toISOString(),
          titleSource: row.title_source || ''
        };
      });
      
      res.json(sections);
    } catch (error: any) {
      console.error('Error fetching unit sections:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching unit sections', 
        error: error.message 
      });
    }
  });

  // Get unit sections enhanced
  router.get('/api/units/:id/sections/enhanced', async (req, res) => {
    try {
      if (!dbPool) {
        return res.status(500).json({ success: false, message: 'Database pool not initialized' });
      }

      const { id } = req.params;
      const unitName = decodeURIComponent(id);
      console.log('Looking for enhanced sections for unit:', unitName);
      
      const query = `
        SELECT 
          S_T_R as str,
          MAX(COUNTY) as county,
          MAX(ST) as state,
          MAX(STATUS) as title_status,
          MAX(LEGAL_DESCRIPTION) as legal_description,
          SUM(NMA) as net_mineral_acres,
          SUM(CALCULATED_ACREAGE) as calculated_acreage,
          MAX(BUYER) as assigned_buyer,
          GROUP_CONCAT(DISTINCT OWNER SEPARATOR '; ') as owner_name,
          GROUP_CONCAT(DISTINCT CONTACT SEPARATOR '; ') as contact_info,
          GROUP_CONCAT(DISTINCT PHONE_EMAIL SEPARATOR '; ') as phone_email,
          GROUP_CONCAT(DISTINCT NOTE SEPARATOR '; ') as notes,
          MAX(CURRENT_UNIT_NAME) as current_unit,
          MAX(NEW_UNIT_NAME) as new_unit,
          MAX(DATE) as date_created,
          MAX(TITLE_SOURCE) as title_source,
          GROUP_CONCAT(DISTINCT STREET SEPARATOR '; ') as street,
          GROUP_CONCAT(DISTINCT CITY SEPARATOR '; ') as city,
          GROUP_CONCAT(DISTINCT ZIP SEPARATOR '; ') as zip,
          GROUP_CONCAT(DISTINCT INTEREST_TYPE SEPARATOR '; ') as interest_type
        FROM prod_acreage_schedule 
        WHERE TRIM(REPLACE(REPLACE(CURRENT_UNIT_NAME, '\r\n', ' '), '\n', ' ')) = ? AND S_T_R IS NOT NULL 
        GROUP BY S_T_R
        ORDER BY S_T_R
      `;

      const rows = await executeQuery(dbPool, query, [unitName]);
      console.log('Found enhanced sections:', rows.length);
      
      const sections = rows.map((row: any, index: number) => {
        let section = '';
        let township = '';
        let range = '';
        
        if (row.str) {
          const parts = String(row.str).split('-');
          if (parts.length >= 3) {
            section = parts[0];
            township = parts[1];
            range = parts[2];
          }
        }
        
        const netAcres = parseFloat(row.net_mineral_acres) || 0;
        
        return {
          id: `s${index + 1}`,
          section_name: row.str || `Section ${index + 1}`,
          state: row.state || 'OK',
          county: row.county || 'Unknown',
          sectionNumber: section,
          township: township,
          range: range,
          str: row.str,
          grossAcres: netAcres,
          netMineralAcres: netAcres,
          titleStatus: row.title_status || 'Unknown',
          legalDescription: row.legal_description || '',
          assignedBuyer: row.assigned_buyer || '',
          ownerName: row.owner_name || '',
          contactInfo: row.contact_info || '',
          phoneEmail: row.phone_email || '',
          notes: row.notes || '',
          currentUnit: row.current_unit || '',
          newUnit: row.new_unit || '',
          dateCreated: row.date_created || new Date().toISOString(),
          titleSource: row.title_source || '',
          street: row.street || '',
          city: row.city || '',
          zip: row.zip || '',
          interestType: row.interest_type || ''
        };
      });
      
      res.json(sections);
    } catch (error: any) {
      console.error('Error fetching unit sections enhanced:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching unit sections enhanced', 
        error: error.message 
      });
    }
  });

  return router;
};

