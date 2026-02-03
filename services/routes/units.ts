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

      const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
      const limit = Math.min(1000, Math.max(1, parseInt(String(req.query.limit), 10) || 50));
      const offset = (page - 1) * limit;

      if (page < 1 || limit < 1 || limit > 1000) {
        return res.status(400).json({
          success: false,
          message: 'Invalid pagination parameters. Page must be >= 1, limit must be between 1 and 1000'
        });
      }

      const countQuery = `
        SELECT COUNT(*) as total
        FROM prod_acreage_schedule
        WHERE CURRENT_UNIT_NAME IS NOT NULL 
          AND CURRENT_UNIT_NAME != ''
      `;
      const countResult = await executeQuery(dbPool, countQuery);
      const totalCount = Number(countResult[0]?.total ?? 0);

      const query = `
        SELECT 
          id,
          CURRENT_UNIT_NAME,
          NEW_UNIT_NAME,
          S_T_R as str,
          \`New_ALLO_%\` as new_allo_pct,
          COUNTY as primary_county,
          STATE as state,
          STATUS as status,
          BUYER as assigned_buyer,
          NMA,
          \`$_NRA\` as total_nra_usd,
          NEW_OCC_TYPE as occ_type,
          created_at,
          updated_at,
          NOTE as notes
        FROM prod_acreage_schedule
        WHERE CURRENT_UNIT_NAME IS NOT NULL 
          AND CURRENT_UNIT_NAME != ''
        ORDER BY REGEXP_REPLACE(TRIM(REPLACE(REPLACE(CURRENT_UNIT_NAME, '\\r\\n', ' '), '\\n', ' ')), ' +', ' '), S_T_R
        LIMIT ? OFFSET ?
      `;

      // Pass as strings to avoid mysql2/MySQL 8.0.22+ stmt_execute argument issues
      const rows = await executeQuery(dbPool, query, [String(limit), String(offset)]);
      
      const parentUnitNames = [...new Set(rows.map((r: any) => {
        const raw = r.CURRENT_UNIT_NAME || '';
        return raw.replace(/\r\n/g, ' ').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
      }))];

      let metadataMap = new Map<string, any>();
      try {
        if (parentUnitNames.length > 0) {
          const placeholders = parentUnitNames.map(() => '?').join(',');
          const metadataQuery = `SELECT * FROM units_metadata WHERE unit_name IN (${placeholders})`;
          const metadataResults = await executeQuery(dbPool, metadataQuery, parentUnitNames);
          metadataResults.forEach((metadata: any) => {
            metadataMap.set(metadata.unit_name, metadata);
          });
        }
      } catch (metadataError: any) {
        console.log('Metadata table not available, using defaults:', (metadataError as Error).message);
      }

      const units: any[] = [];
      for (const row of rows) {
        const parentUnitName = (row.CURRENT_UNIT_NAME || '').replace(/\r\n/g, ' ').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
        const unitId = encodeURIComponent(parentUnitName);
        const currentUnitDisplayName = (String(row.CURRENT_UNIT_NAME || '').split(/\r?\n/)[0]?.trim()) || parentUnitName;

        const newUnitLines = (row.NEW_UNIT_NAME && String(row.NEW_UNIT_NAME).trim())
          ? String(row.NEW_UNIT_NAME).split(/\r?\n/).map((s: string) => s.trim()).filter(Boolean)
          : [currentUnitDisplayName];
        const strLines = (row.str && String(row.str).trim())
          ? String(row.str).split(/\r?\n/).map((s: string) => s.trim()).filter(Boolean)
          : [row.str || ''];
        const alloLines = (row.new_allo_pct != null && String(row.new_allo_pct).trim())
          ? String(row.new_allo_pct).split(/\r?\n/).map((s: string) => s.trim()).filter(Boolean)
          : [row.new_allo_pct ?? ''];

        const lineCount = Math.max(1, newUnitLines.length, strLines.length, alloLines.length);

        const metadata = metadataMap.get(parentUnitName);
        let operator = 'Unknown';
        let apiNumbers: string[] = [];
        let targetFormations: string[] = ['Hunton', 'Woodford', 'Mississippian'];
        let linkedSectionIds: string[] = [];
        let linkedContactIds: string[] = [];
        let heldByFund = false;
        let exitStrategy: 'Hold' | 'Flip' | 'LP Buyout' = 'Hold';
        let isLocked = false;
        let notes = row.notes || '';
        let spudDate: string | null = null;

        if (metadata) {
          operator = metadata.operator || 'Unknown';
          spudDate = metadata.spud_date || null;
          if (metadata.api_numbers) {
            try { apiNumbers = JSON.parse(metadata.api_numbers); } catch (e) { apiNumbers = []; }
          }
          if (metadata.target_formations) {
            try { targetFormations = JSON.parse(metadata.target_formations); } catch (e) {}
          }
          if (metadata.linked_section_ids) {
            try { linkedSectionIds = JSON.parse(metadata.linked_section_ids); } catch (e) {}
          }
          if (metadata.linked_contact_ids) {
            try { linkedContactIds = JSON.parse(metadata.linked_contact_ids); } catch (e) {}
          }
          heldByFund = Boolean(metadata.held_by_fund);
          exitStrategy = metadata.exit_strategy || 'Hold';
          isLocked = Boolean(metadata.is_locked);
          notes = metadata.notes || notes;
        }

        const nma = parseFloat(row.NMA) || 0;
        const nraCapUsd = row.total_nra_usd != null && row.total_nra_usd !== '' ? parseFloat(row.total_nra_usd) : null;

        for (let i = 0; i < lineCount; i++) {
          const displayUnitName = newUnitLines[i] ?? newUnitLines[0] ?? currentUnitDisplayName;
          const strVal = strLines[i] ?? strLines[0] ?? row.str ?? '';
          const alloVal = alloLines[i] ?? alloLines[0] ?? row.new_allo_pct;
          const allocationPct = alloVal != null && String(alloVal).trim() !== '' ? parseFloat(String(alloVal)) : undefined;

          units.push({
            id: unitId,
            scheduleRowId: row.id ? `${row.id}-${i}` : undefined,
            currentUnitName: currentUnitDisplayName,
            unitName: displayUnitName,
            operator,
            apiNumbers,
            targetFormations,
            status: (row.status === 'PRODUCING' ? 'Producing' : row.status === 'PERMITTED' ? 'Permitted' : 'Held by Production') as 'Permitted' | 'Producing' | 'Held by Production' | 'Plugged',
            estimatedGrossAcres: nma,
            estimatedNetAcres: nma,
            county: row.primary_county || 'Unknown',
            state: row.state || 'OK',
            linkedSectionIds,
            linkedContactIds,
            assignedBuyerId: null,
            assignedBuyer: row.assigned_buyer ? { name: row.assigned_buyer } : null,
            heldByFund,
            exitStrategy,
            isLocked,
            notes,
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
            totalNetMineralAcres: nma,
            averageRoyalty: 0,
            allocationPercentage: allocationPct,
            buyer: row.assigned_buyer,
            sectionCount: 1,
            linkedTractIds: [] as string[],
            str: strVal || undefined,
            occType: row.occ_type || undefined,
            occDate: row.created_at || null,
            nraCapUsd: nraCapUsd ?? null,
            spudDate
          });
        }
      }

      const totalPages = Math.ceil(totalCount / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      res.json({
        data: units,
        pagination: {
          page: page,
          limit: limit,
          total: totalCount,
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

  // Get unit names for a specific unit
  router.get('/api/units/:id/unit-names', async (req, res) => {
    try {
      if (!dbPool) {
        return res.status(500).json({ success: false, message: 'Database pool not initialized' });
      }

      const { id } = req.params;
      const unitName = decodeURIComponent(id).replace(/\s+/g, ' ').trim();
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
      const unitName = decodeURIComponent(id).replace(/\s+/g, ' ').trim();
      console.log('Looking for tracts for unit:', unitName);
      
      const query = `
        SELECT 
          id,
          COUNTY,
          S_T_R,
          CURRENT_UNIT_NAME,
          OWNER,
          NMA,
          ROY,
          \`CURRENT_ALLO_%\` AS ALLOCATION_PERCENT,
          STATUS,
          BUYER,
          NOTE,
          INTEREST_TYPE,
          LEGAL_DESCRIPTION,
          OWNER_STREET as street,
          OWNER_CITY as city,
          OWNER_ST as state,
          OWNER_ZIP as zip,
          PHONE_EMAIL,
          CONTACT,
          created_at,
          updated_at
        FROM prod_acreage_schedule
        WHERE TRIM(REPLACE(REPLACE(CURRENT_UNIT_NAME, '\r\n', ' '), '\n', ' ')) = ?
        ORDER BY COUNTY, S_T_R
      `;

      const rows = await executeQuery(dbPool, query, [unitName]);
      console.log('Found tracts (before deduplication):', rows.length);
      
      if (rows.length === 0) {
        return res.json([]);
      }

      // Deduplicate tracts by id (primary key)
      const tractsMap = new Map<number, any>();
      rows.forEach((row: any) => {
        if (row.id && !tractsMap.has(row.id)) {
          tractsMap.set(row.id, row);
        }
      });
      
      const uniqueRows = Array.from(tractsMap.values());
      console.log('Found tracts (after deduplication):', uniqueRows.length);

      const tracts = uniqueRows.map((row: any) => ({
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
        state: row.state || 'OK',
        heldByFund: false,
        isLocked: false,
        titleStatus: 'Unmapped',
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        createdBy: 'system',
        updatedBy: 'system',
        owner: row.OWNER,
        street: row.street,
        city: row.city,
        zip: row.zip,
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
      const unitName = decodeURIComponent(id).replace(/\s+/g, ' ').trim();
      console.log('Looking for enhanced tracts for unit:', unitName);
      
      const query = `
        SELECT 
          id,
          COUNTY,
          S_T_R,
          CURRENT_UNIT_NAME,
          OWNER,
          NMA,
          ROY,
          \`CURRENT_ALLO_%\` AS ALLOCATION_PERCENT,
          STATUS,
          BUYER,
          NOTE,
          INTEREST_TYPE,
          LEGAL_DESCRIPTION,
          OWNER_STREET as street,
          OWNER_CITY as city,
          OWNER_ST as state,
          OWNER_ZIP as zip,
          PHONE_EMAIL,
          CONTACT,
          created_at,
          updated_at
        FROM prod_acreage_schedule
        WHERE TRIM(REPLACE(REPLACE(CURRENT_UNIT_NAME, '\r\n', ' '), '\n', ' ')) = ?
        ORDER BY COUNTY, S_T_R
      `;

      const rows = await executeQuery(dbPool, query, [unitName]);
      console.log('Found tracts (before deduplication):', rows.length);
      
      if (rows.length === 0) {
        return res.json([]);
      }

      // Deduplicate tracts by id (primary key)
      const tractsMap = new Map<number, any>();
      rows.forEach((row: any) => {
        if (row.id && !tractsMap.has(row.id)) {
          tractsMap.set(row.id, row);
        }
      });
      
      const uniqueRows = Array.from(tractsMap.values());
      console.log('Found tracts (after deduplication):', uniqueRows.length);

      const tracts = uniqueRows.map((row: any) => ({
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
        state: row.state || 'OK',
        heldByFund: false,
        isLocked: false,
        titleStatus: 'Unmapped',
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        createdBy: 'system',
        updatedBy: 'system',
        owner: row.OWNER,
        street: row.street,
        city: row.city,
        zip: row.zip,
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
      const unitName = decodeURIComponent(id).replace(/\s+/g, ' ').trim();
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
      const unitName = decodeURIComponent(id).replace(/\s+/g, ' ').trim();
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
          \`CURRENT_ALLO_%\` AS ALLOCATION_PERCENT,
          STATUS,
          BUYER,
          NOTE,
          INTEREST_TYPE,
          LEGAL_DESCRIPTION,
          OWNER_STREET as street,
          OWNER_CITY as city,
          OWNER_ST as state,
          OWNER_ZIP as zip,
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
      
      // Get metadata for this unit before processing rows
      let operator = 'Unknown';
      let apiNumbers: string[] = [];
      let targetFormations: string[] = [];
      let linkedSectionIds: string[] = [];
      let linkedContactIds: string[] = [];
      let heldByFund = false;
      let exitStrategy: 'Hold' | 'Flip' | 'LP Buyout' = 'Hold';
      let isLocked = false;
      let metadataNotes = '';
      
      try {
        const metadataQuery = `SELECT * FROM units_metadata WHERE unit_name = ?`;
        const metadataResult = await executeQuery(dbPool, metadataQuery, [unitName]);
        if (metadataResult.length > 0) {
          const metadata = metadataResult[0];
          operator = metadata.operator || 'Unknown';
          if (metadata.api_numbers) {
            try {
              apiNumbers = JSON.parse(metadata.api_numbers);
            } catch (e) {
              apiNumbers = [];
            }
          }
          if (metadata.target_formations) {
            try {
              targetFormations = JSON.parse(metadata.target_formations);
            } catch (e) {
              targetFormations = ['Hunton', 'Woodford', 'Mississippian'];
            }
          }
          if (metadata.linked_section_ids) {
            try {
              linkedSectionIds = JSON.parse(metadata.linked_section_ids);
            } catch (e) {
              linkedSectionIds = [];
            }
          }
          if (metadata.linked_contact_ids) {
            try {
              linkedContactIds = JSON.parse(metadata.linked_contact_ids);
            } catch (e) {
              linkedContactIds = [];
            }
          }
          heldByFund = Boolean(metadata.held_by_fund);
          exitStrategy = metadata.exit_strategy || 'Hold';
          isLocked = Boolean(metadata.is_locked);
          metadataNotes = metadata.notes || '';
        }
      } catch (metadataError: any) {
        // If units_metadata table doesn't exist yet, use defaults
        console.log('Metadata table not available, using defaults:', metadataError.message);
      }
      
      rows.forEach((row: any) => {
        if (row.CURRENT_UNIT_NAME) {
          const fullUnitName = row.CURRENT_UNIT_NAME;
          const trimmedUnitName = fullUnitName.trim();
          
          if (!unitMap.has(trimmedUnitName)) {
            unitMap.set(trimmedUnitName, {
              id: row.id,
              unitName: trimmedUnitName.replace(/\s+(?=[A-Z]+\s+[A-Z]+\s+\d+)/g, '\n'),
              operator: operator,
              apiNumbers: apiNumbers,
              targetFormations: targetFormations.length > 0 ? targetFormations : ['Hunton', 'Woodford', 'Mississippian'],
              status: row.STATUS === 'PRODUCING' ? 'Producing' : 
                     row.STATUS === 'PERMITTED' ? 'Permitted' : 'Held by Production',
              estimatedGrossAcres: parseFloat(row.NMA) || 0,
              estimatedNetAcres: parseFloat(row.NMA) || 0,
              county: row.COUNTY,
              state: row.state || 'OK',
              linkedTractIds: [row.id],
              linkedSectionIds: linkedSectionIds,
              linkedContactIds: linkedContactIds,
              assignedBuyerId: null,
              assignedBuyer: null,
              heldByFund: heldByFund,
              exitStrategy: exitStrategy,
              isLocked: isLocked,
              notes: metadataNotes || row.NOTE || '',
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
              street: row.street,
              city: row.city,
              zip: row.zip,
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
      const unitName = decodeURIComponent(id).replace(/\s+/g, ' ').trim();
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
      const unitName = decodeURIComponent(id).replace(/\s+/g, ' ').trim();
      console.log('Looking for tracts for unit:', unitName);
      
      const query = `
        SELECT 
          id,
          COUNTY,
          S_T_R,
          CURRENT_UNIT_NAME,
          OWNER,
          NMA,
          ROY,
          \`CURRENT_ALLO_%\` AS ALLOCATION_PERCENT,
          STATUS,
          BUYER,
          NOTE,
          INTEREST_TYPE,
          LEGAL_DESCRIPTION,
          OWNER_STREET as street,
          OWNER_CITY as city,
          OWNER_ST as state,
          OWNER_ZIP as zip,
          PHONE_EMAIL,
          CONTACT,
          created_at,
          updated_at
        FROM prod_acreage_schedule
        WHERE TRIM(REPLACE(REPLACE(CURRENT_UNIT_NAME, '\r\n', ' '), '\n', ' ')) = ?
        ORDER BY COUNTY, S_T_R
      `;

      const rows = await executeQuery(dbPool, query, [unitName]);
      console.log('Found tracts (before deduplication):', rows.length);
      
      if (rows.length === 0) {
        return res.json([]);
      }

      // Deduplicate tracts by id (primary key)
      const tractsMap = new Map<number, any>();
      rows.forEach((row: any) => {
        if (row.id && !tractsMap.has(row.id)) {
          tractsMap.set(row.id, row);
        }
      });
      
      const uniqueRows = Array.from(tractsMap.values());
      console.log('Found tracts (after deduplication):', uniqueRows.length);

      const tracts = uniqueRows.map((row: any) => ({
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
        state: row.state || 'OK',
        heldByFund: false,
        isLocked: false,
        titleStatus: 'Unmapped',
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        createdBy: 'system',
        updatedBy: 'system',
        owner: row.OWNER,
        street: row.street,
        city: row.city,
        zip: row.zip,
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
      const unitName = decodeURIComponent(id).replace(/\s+/g, ' ').trim();
      console.log('Looking for enhanced tracts for unit:', unitName);
      
      const query = `
        SELECT 
          id,
          COUNTY,
          S_T_R,
          CURRENT_UNIT_NAME,
          OWNER,
          NMA,
          ROY,
          \`CURRENT_ALLO_%\` AS ALLOCATION_PERCENT,
          STATUS,
          BUYER,
          NOTE,
          INTEREST_TYPE,
          LEGAL_DESCRIPTION,
          OWNER_STREET as street,
          OWNER_CITY as city,
          OWNER_ST as state,
          OWNER_ZIP as zip,
          PHONE_EMAIL,
          CONTACT,
          created_at,
          updated_at
        FROM prod_acreage_schedule
        WHERE TRIM(REPLACE(REPLACE(CURRENT_UNIT_NAME, '\r\n', ' '), '\n', ' ')) = ?
        ORDER BY COUNTY, S_T_R
      `;

      const rows = await executeQuery(dbPool, query, [unitName]);
      console.log('Found tracts (before deduplication):', rows.length);
      
      if (rows.length === 0) {
        return res.json([]);
      }

      // Deduplicate tracts by id (primary key)
      const tractsMap = new Map<number, any>();
      rows.forEach((row: any) => {
        if (row.id && !tractsMap.has(row.id)) {
          tractsMap.set(row.id, row);
        }
      });
      
      const uniqueRows = Array.from(tractsMap.values());
      console.log('Found tracts (after deduplication):', uniqueRows.length);

      const tracts = uniqueRows.map((row: any) => ({
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
        state: row.state || 'OK',
        heldByFund: false,
        isLocked: false,
        titleStatus: 'Unmapped',
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        createdBy: 'system',
        updatedBy: 'system',
        owner: row.OWNER,
        street: row.street,
        city: row.city,
        zip: row.zip,
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
      const unitName = decodeURIComponent(id).replace(/\s+/g, ' ').trim();
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
      const unitName = decodeURIComponent(id).replace(/\s+/g, ' ').trim();
      console.log('GET /api/units/:id/notes - Looking for notes for unit:', unitName);
      
      // First verify the unit exists
      const unitCheckQuery = `
        SELECT COUNT(*) as count
        FROM prod_acreage_schedule
        WHERE TRIM(REPLACE(REPLACE(CURRENT_UNIT_NAME, '\r\n', ' '), '\n', ' ')) = ?
      `;
      const unitCheck = await executeQuery(dbPool, unitCheckQuery, [unitName]);
      
      if (unitCheck.length === 0 || unitCheck[0].count === 0) {
        console.log('Unit not found:', unitName);
        // Return empty array instead of 404, as the unit might exist but have no notes
        return res.json([]);
      }
      
      // Query notes from prod_acreage_schedule
      const query = `
        SELECT 
          id,
          NOTE,
          created_at,
          updated_at
        FROM prod_acreage_schedule
        WHERE TRIM(REPLACE(REPLACE(CURRENT_UNIT_NAME, '\r\n', ' '), '\n', ' ')) = ?
        ORDER BY created_at DESC
      `;

      const rows = await executeQuery(dbPool, query, [unitName]);
      console.log('GET /api/units/:id/notes - Found rows from prod_acreage_schedule:', rows.length);
      console.log('GET /api/units/:id/notes - Sample rows:', JSON.stringify(rows.slice(0, 3), null, 2));
      
      // Also check prod_unit_tracker for notes
      let trackerNotes: any[] = [];
      try {
        // Normalize unit name for matching
        const normalizedUnitName = unitName
          .replace(/\r\n/g, ' ')
          .replace(/\n/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        
        // Split unit name into individual well names
        const wellNamePattern = /(?<=\s)([A-Z]+(?:\s+[A-Z]+)*\s+[\d-]+[A-Z0-9]+)/g;
        const wellNames: string[] = [];
        const matches = normalizedUnitName.match(wellNamePattern);
        if (matches && matches.length > 0) {
          wellNames.push(...matches.map(m => m.trim()));
        } else {
          wellNames.push(normalizedUnitName);
        }
        
        const trackerQuery = `
          SELECT 
            id,
            Notes as NOTE,
            created_at,
            updated_at
          FROM prod_unit_tracker
          WHERE (TRIM(REPLACE(REPLACE(Unit, '\r\n', ' '), '\n', ' ')) LIKE ? 
             OR TRIM(REPLACE(REPLACE(Well_Name, '\r\n', ' '), '\n', ' ')) LIKE ?)
            AND Notes IS NOT NULL 
            AND Notes != ''
          ORDER BY created_at DESC
        `;
        
        const searchPattern = `%${normalizedUnitName}%`;
        trackerNotes = await executeQuery(dbPool, trackerQuery, [searchPattern, searchPattern]);
        console.log('GET /api/units/:id/notes - Found notes from prod_unit_tracker:', trackerNotes.length);
      } catch (trackerError: any) {
        console.log('GET /api/units/:id/notes - Error querying prod_unit_tracker:', trackerError.message);
      }
      
      // Combine notes from both sources
      const allRows = [...rows, ...trackerNotes];
      console.log('GET /api/units/:id/notes - Total rows (both sources):', allRows.length);
      
      // Transform notes to match UnitNote interface and remove duplicates by note text
      const notesMap = new Map<string, any>();
      let filteredCount = 0;
      allRows.forEach((row: any, index: number) => {
        const noteValue = row.NOTE;
        console.log(`GET /api/units/:id/notes - Row ${index}: NOTE value:`, noteValue, 'Type:', typeof noteValue, 'Is null:', noteValue === null, 'Is undefined:', noteValue === undefined);
        
        if (noteValue != null && String(noteValue).trim() !== '') {
          const noteText = String(noteValue).trim();
          // Use note text as key to deduplicate
          if (!notesMap.has(noteText)) {
            notesMap.set(noteText, {
              id: `note-${row.id}-${index}`,
              unitId: id, // Use the encoded unit name as unitId
              noteText: noteText,
              noteType: 'Internal' as const, // Default to Internal since NOTE field doesn't have type info
              createdBy: 'system',
              createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
              createdByUser: {
                id: 'system',
                name: 'System',
                email: 'system@company.com'
              }
            });
          } else {
            console.log(`GET /api/units/:id/notes - Skipping duplicate note: "${noteText.substring(0, 50)}..."`);
          }
        } else {
          filteredCount++;
        }
      });
      
      console.log(`GET /api/units/:id/notes - Filtered out ${filteredCount} empty/null notes`);
      const notes = Array.from(notesMap.values());
      console.log('GET /api/units/:id/notes - Returning notes count (after deduplication):', notes.length);
      console.log('GET /api/units/:id/notes - Notes:', JSON.stringify(notes, null, 2));
      res.json(notes);
    } catch (error: any) {
      console.error('Error fetching unit notes:', error);
      // Return empty array on error instead of 500, to prevent breaking the UI
      res.json([]);
    }
  });

  // Get unit contacts
  router.get('/api/units/:id/contacts', async (req, res) => {
    try {
      if (!dbPool) {
        return res.status(500).json({ success: false, message: 'Database pool not initialized' });
      }

      const { id } = req.params;
      const unitName = decodeURIComponent(id).replace(/\s+/g, ' ').trim();
      console.log('Looking for contacts for unit:', unitName);
      
      const query = `
        SELECT 
          id,
          OWNER,
          CONTACT,
          OWNER_STREET as street,
          OWNER_CITY as city,
          OWNER_ST as state,
          OWNER_ZIP as zip,
          PHONE_EMAIL,
          created_at,
          updated_at
        FROM prod_acreage_schedule
        WHERE TRIM(REPLACE(REPLACE(CURRENT_UNIT_NAME, '\r\n', ' '), '\n', ' ')) = ?
        ORDER BY OWNER
      `;

      const rows = await executeQuery(dbPool, query, [unitName]);
      console.log('Found contacts (before deduplication):', rows.length);
      
      // Deduplicate contacts by owner name, contact info, and address
      const contactsMap = new Map<string, any>();
      rows
        .filter((row: any) => row.OWNER && String(row.OWNER).trim() !== '')
        .forEach((row: any, index: number) => {
          const contactKey = `${String(row.OWNER).trim()}|${String(row.CONTACT || '').trim()}|${String(row.OWNER_STREET || row.street || '').trim()}|${String(row.OWNER_CITY || row.city || '').trim()}`;
          if (!contactsMap.has(contactKey)) {
            contactsMap.set(contactKey, {
              id: `contact-${row.id}-${index}`,
              name: row.OWNER,
              contact: row.CONTACT,
              street: row.street,
              city: row.city,
              state: row.state || row.OWNER_ST || 'OK',
              zip: row.zip,
              phoneEmail: row.PHONE_EMAIL,
              createdAt: row.created_at,
              updatedAt: row.updated_at
            });
          }
        });
      
      const contacts = Array.from(contactsMap.values());
      console.log('Returning contacts (after deduplication):', contacts.length);
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
      const unitName = decodeURIComponent(id).replace(/\s+/g, ' ').trim();
      console.log('Looking for aggregated contacts for unit:', unitName);
      
      const query = `
        SELECT 
          OWNER as owner,
          CONTACT as contact,
          OWNER_STREET as street,
          OWNER_CITY as city,
          OWNER_ST as state,
          OWNER_ZIP as zip,
          PHONE_EMAIL as phoneEmail,
          NMA as nma,
          ROY as royalty,
          \`CURRENT_ALLO_%\` as allocation,
          COUNT(*) as tractCount,
          SUM(CAST(NMA AS DECIMAL(10,2))) as totalNMA,
          AVG(CAST(ROY AS DECIMAL(5,2))) as avgRoyalty,
          AVG(CAST(\`CURRENT_ALLO_%\` AS DECIMAL(5,2))) as avgAllocation
        FROM prod_acreage_schedule
        WHERE TRIM(REPLACE(REPLACE(CURRENT_UNIT_NAME, '\r\n', ' '), '\n', ' ')) = ?
          AND OWNER IS NOT NULL AND OWNER != ''
        GROUP BY OWNER, CONTACT, OWNER_STREET, OWNER_CITY, OWNER_ST, OWNER_ZIP, PHONE_EMAIL, NMA, ROY, \`CURRENT_ALLO_%\`
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
      const normalizedUnitName = decodeURIComponent(id)
        .replace(/\r\n/g, ' ')
        .replace(/\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      console.log('Looking for sections for unit:', normalizedUnitName);
      
      const query = `
        SELECT 
          S_T_R as str,
          COUNTY as county,
          STATE as state,
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
          created_at as date_created,
          TITLE_SOURCE as title_source
        FROM prod_acreage_schedule 
        WHERE REGEXP_REPLACE(TRIM(REPLACE(REPLACE(CURRENT_UNIT_NAME, '\\r\\n', ' '), '\\n', ' ')), ' +', ' ') = ? AND S_T_R IS NOT NULL 
        ORDER BY S_T_R
      `;

      const rows = await executeQuery(dbPool, query, [normalizedUnitName]);
      console.log('Found sections (before deduplication):', rows.length);
      
      // Deduplicate sections by S_T_R (section-township-range)
      const sectionsMap = new Map<string, any>();
      rows.forEach((row: any) => {
        const strKey = String(row.str || '').trim();
        if (strKey && !sectionsMap.has(strKey)) {
          sectionsMap.set(strKey, row);
        }
      });
      
      const uniqueRows = Array.from(sectionsMap.values());
      console.log('Found sections (after deduplication):', uniqueRows.length);
      
      const sections = uniqueRows.map((row: any, index: number) => {
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
      const normalizedUnitName = decodeURIComponent(id)
        .replace(/\r\n/g, ' ')
        .replace(/\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      console.log('Looking for enhanced sections for unit:', normalizedUnitName);
      
      const query = `
        SELECT 
          S_T_R as str,
          MAX(COUNTY) as county,
          MAX(STATE) as state,
          MAX(STATUS) as title_status,
          MAX(LEGAL_DESCRIPTION) as legal_description,
          SUM(NMA) as net_mineral_acres,
          SUM(CALCULATED_ACREAGE) as calculated_acreage,
          MAX(BUYER) as assigned_buyer,
          COUNT(DISTINCT OWNER) as owner_count,
          MAX(\`CURRENT_ALLO_%\`) as current_allo_pct,
          MAX(\`New_ALLO_%\`) as new_allo_pct,
          MAX(\`$_NRA\`) as nra_cap_usd,
          GROUP_CONCAT(DISTINCT OWNER SEPARATOR '; ') as owner_name,
          GROUP_CONCAT(DISTINCT CONTACT SEPARATOR '; ') as contact_info,
          GROUP_CONCAT(DISTINCT PHONE_EMAIL SEPARATOR '; ') as phone_email,
          GROUP_CONCAT(DISTINCT NOTE SEPARATOR '; ') as notes,
          MAX(CURRENT_UNIT_NAME) as current_unit,
          MAX(NEW_UNIT_NAME) as new_unit,
          MAX(created_at) as date_created,
          MAX(TITLE_SOURCE) as title_source,
          GROUP_CONCAT(DISTINCT OWNER_STREET SEPARATOR '; ') as street,
          GROUP_CONCAT(DISTINCT OWNER_CITY SEPARATOR '; ') as city,
          GROUP_CONCAT(DISTINCT OWNER_ZIP SEPARATOR '; ') as zip,
          GROUP_CONCAT(DISTINCT INTEREST_TYPE SEPARATOR '; ') as interest_type
        FROM prod_acreage_schedule 
        WHERE REGEXP_REPLACE(TRIM(REPLACE(REPLACE(CURRENT_UNIT_NAME, '\\r\\n', ' '), '\\n', ' ')), ' +', ' ') = ? AND S_T_R IS NOT NULL 
        GROUP BY S_T_R
        ORDER BY S_T_R
      `;

      const rows = await executeQuery(dbPool, query, [normalizedUnitName]);
      console.log('Found enhanced sections:', rows.length);

      const normalizeStr = (v: any) => {
        if (v == null || String(v).trim() === '') return '';
        return String(v)
          .replace(/,/g, '')
          .replace(/\r\n/g, ' ')
          .replace(/\n/g, ' ')
          .replace(/\r/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
      };
      let strToSectionId: Map<string, string> = new Map();
      try {
        const allStrRows = await executeQuery(dbPool, `
          SELECT DISTINCT S_T_R as str
          FROM prod_acreage_schedule 
          WHERE S_T_R IS NOT NULL 
          ORDER BY S_T_R
        `);
        allStrRows.forEach((r: any, idx: number) => {
          const s = normalizeStr(r.str);
          if (s) strToSectionId.set(s, `s${idx + 1}`);
        });
      } catch (_e) {
        rows.forEach((r: any, idx: number) => {
          const s = normalizeStr(r.str);
          if (s) strToSectionId.set(s, `s${idx + 1}`);
        });
      }
      
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
        
        // Clean STR value: remove all commas and newlines
        const cleanStr = row.str 
          ? String(row.str)
              .replace(/,/g, '')
              .replace(/\r\n/g, ' ')
              .replace(/\n/g, ' ')
              .replace(/\r/g, ' ')
              .replace(/\s+/g, ' ')
              .trim()
          : `Section ${index + 1}`;

        const sectionId = strToSectionId.get(cleanStr) || strToSectionId.get(normalizeStr(row.str)) || `s${index + 1}`;
        
        const currentAllo = (row.current_allo_pct != null && row.current_allo_pct !== '') ? parseFloat(row.current_allo_pct) : undefined;
        const newAllo = (row.new_allo_pct != null && row.new_allo_pct !== '') ? parseFloat(row.new_allo_pct) : undefined;
        const allocationPct = currentAllo ?? newAllo;
        const nraCapUsd = (row.nra_cap_usd != null && row.nra_cap_usd !== '') ? parseFloat(row.nra_cap_usd) : null;
        const ownerCount = Number(row.owner_count) || 0;

        return {
          id: sectionId,
          sectionId,
          sectionName: cleanStr,
          section_name: cleanStr,
          state: row.state || 'OK',
          county: row.county || 'Unknown',
          sectionNumber: section,
          township: township,
          range: range,
          str: cleanStr,
          grossAcres: netAcres,
          netMineralAcres: netAcres,
          net_mineral_acres: netAcres,
          titleStatus: row.title_status || 'Unknown',
          legalDescription: row.legal_description || '',
          assignedBuyer: row.assigned_buyer || '',
          ownerCount,
          allocationPct,
          nraCapUsd,
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

  // Update unit - MUST be before GET /api/units/:id to avoid route conflicts
  router.put('/api/units/:id', async (req, res) => {
    console.log('=== PUT /api/units/:id ROUTE HANDLER CALLED ===');
    console.log('PUT /api/units/:id - Request method:', req.method);
    console.log('PUT /api/units/:id - Request params:', req.params);
    console.log('PUT /api/units/:id - Request URL:', req.url);
    console.log('PUT /api/units/:id - Request path:', req.path);
    
    try {
      if (!dbPool) {
        console.error('PUT /api/units/:id - Database pool not initialized');
        return res.status(500).json({ success: false, message: 'Database pool not initialized' });
      }

      const { id } = req.params;
      const unitName = decodeURIComponent(id).replace(/\s+/g, ' ').trim();
      const updateData = req.body;

      console.log('PUT /api/units/:id - Updating unit:', unitName);
      console.log('PUT /api/units/:id - Decoded unit name:', unitName);
      console.log('PUT /api/units/:id - Update data:', JSON.stringify(updateData, null, 2));

      // Create or update units_metadata table if it doesn't exist
      try {
        await executeQuery(dbPool, `
          CREATE TABLE IF NOT EXISTS units_metadata (
            unit_name VARCHAR(500) PRIMARY KEY,
            operator VARCHAR(255),
            api_numbers TEXT,
            target_formations TEXT,
            status VARCHAR(50),
            county VARCHAR(100),
            state VARCHAR(50),
            estimated_gross_acres DECIMAL(10,2),
            estimated_net_acres DECIMAL(10,2),
            held_by_fund BOOLEAN DEFAULT FALSE,
            exit_strategy VARCHAR(50),
            is_locked BOOLEAN DEFAULT FALSE,
            notes TEXT,
            assigned_buyer_id VARCHAR(255),
            linked_section_ids TEXT,
            linked_contact_ids TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
      } catch (createError: any) {
        // Table might already exist, continue
        console.log('Units metadata table check:', createError.message);
      }

      // Normalize unit name - replace newlines with spaces and trim
      const normalizedUnitName = (updateData.unitName || unitName)
        .replace(/\r\n/g, ' ')
        .replace(/\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      console.log('PUT /api/units/:id - Normalized unit name:', normalizedUnitName);

      // Prepare metadata for storage
      const metadataToStore = {
        unit_name: normalizedUnitName,
        operator: updateData.operator || null,
        api_numbers: updateData.apiNumbers ? JSON.stringify(updateData.apiNumbers) : null,
        target_formations: updateData.targetFormations ? JSON.stringify(updateData.targetFormations) : null,
        status: updateData.status || null,
        county: updateData.county || null,
        state: updateData.state || null,
        estimated_gross_acres: updateData.estimatedGrossAcres || null,
        estimated_net_acres: updateData.estimatedNetAcres || null,
        held_by_fund: updateData.heldByFund !== undefined ? updateData.heldByFund : null,
        exit_strategy: updateData.exitStrategy || null,
        is_locked: updateData.isLocked !== undefined ? updateData.isLocked : null,
        notes: updateData.notes || null,
        assigned_buyer_id: updateData.assignedBuyerId || null,
        linked_section_ids: updateData.linkedSectionIds ? JSON.stringify(updateData.linkedSectionIds) : null,
        linked_contact_ids: updateData.linkedContactIds ? JSON.stringify(updateData.linkedContactIds) : null
      };

      console.log('PUT /api/units/:id - Metadata to store:', JSON.stringify(metadataToStore, null, 2));

      // Use INSERT ... ON DUPLICATE KEY UPDATE to create or update
      const insertOrUpdateQuery = `
        INSERT INTO units_metadata (
          unit_name, operator, api_numbers, target_formations, status, county, state,
          estimated_gross_acres, estimated_net_acres, held_by_fund, exit_strategy,
          is_locked, notes, assigned_buyer_id, linked_section_ids, linked_contact_ids
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          operator = VALUES(operator),
          api_numbers = VALUES(api_numbers),
          target_formations = VALUES(target_formations),
          status = VALUES(status),
          county = VALUES(county),
          state = VALUES(state),
          estimated_gross_acres = VALUES(estimated_gross_acres),
          estimated_net_acres = VALUES(estimated_net_acres),
          held_by_fund = VALUES(held_by_fund),
          exit_strategy = VALUES(exit_strategy),
          is_locked = VALUES(is_locked),
          notes = VALUES(notes),
          assigned_buyer_id = VALUES(assigned_buyer_id),
          linked_section_ids = VALUES(linked_section_ids),
          linked_contact_ids = VALUES(linked_contact_ids),
          updated_at = NOW()
      `;

      console.log('PUT /api/units/:id - Executing INSERT/UPDATE query...');
      try {
        await executeQuery(dbPool, insertOrUpdateQuery, [
          metadataToStore.unit_name,
          metadataToStore.operator,
          metadataToStore.api_numbers,
          metadataToStore.target_formations,
          metadataToStore.status,
          metadataToStore.county,
          metadataToStore.state,
          metadataToStore.estimated_gross_acres,
          metadataToStore.estimated_net_acres,
          metadataToStore.held_by_fund,
          metadataToStore.exit_strategy,
          metadataToStore.is_locked,
          metadataToStore.notes,
          metadataToStore.assigned_buyer_id,
          metadataToStore.linked_section_ids,
          metadataToStore.linked_contact_ids
        ]);
        console.log('PUT /api/units/:id - INSERT/UPDATE query completed successfully');
      } catch (dbError: any) {
        console.error('PUT /api/units/:id - Database error during INSERT/UPDATE:', dbError);
        console.error('PUT /api/units/:id - Error message:', dbError.message);
        console.error('PUT /api/units/:id - Error code:', dbError.code);
        throw dbError;
      }

      // If unitName changed, update CURRENT_UNIT_NAME in prod_acreage_schedule
      const normalizedOriginalUnitName = unitName
        .replace(/\r\n/g, ' ')
        .replace(/\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (normalizedUnitName !== normalizedOriginalUnitName) {
        console.log('PUT /api/units/:id - Unit name changed, updating prod_acreage_schedule...');
        const updateUnitNameQuery = `
          UPDATE prod_acreage_schedule
          SET CURRENT_UNIT_NAME = ?,
              updated_at = NOW()
          WHERE TRIM(REPLACE(REPLACE(CURRENT_UNIT_NAME, '\r\n', ' '), '\n', ' ')) = ?
        `;
        await executeQuery(dbPool, updateUnitNameQuery, [normalizedUnitName, normalizedOriginalUnitName]);
        console.log('PUT /api/units/:id - Updated prod_acreage_schedule unit name');
      }

      // Fetch and return the updated unit
      const unitNameToFetch = normalizedUnitName;
      console.log('PUT /api/units/:id - Fetching updated unit with name:', unitNameToFetch);
      
      // Get metadata from units_metadata table
      const metadataQuery = `
        SELECT * FROM units_metadata WHERE unit_name = ?
      `;
      const metadataResult = await executeQuery(dbPool, metadataQuery, [unitNameToFetch]);
      
      // Get base data from prod_acreage_schedule
      const fetchQuery = `
        SELECT DISTINCT
          TRIM(REPLACE(REPLACE(CURRENT_UNIT_NAME, '\r\n', ' '), '\n', ' ')) as unit_name,
          MAX(COUNTY) as county,
          MAX(STATE) as state,
          MAX(STATUS) as status,
          SUM(NMA) as total_net_mineral_acres,
          MAX(BUYER) as assigned_buyer,
          MAX(NOTE) as notes
        FROM prod_acreage_schedule
        WHERE TRIM(REPLACE(REPLACE(CURRENT_UNIT_NAME, '\r\n', ' '), '\n', ' ')) = ?
        GROUP BY TRIM(REPLACE(REPLACE(CURRENT_UNIT_NAME, '\r\n', ' '), '\n', ' '))
      `;
      
      console.log('PUT /api/units/:id - Fetching unit data from prod_acreage_schedule...');
      const fetchResult = await executeQuery(dbPool, fetchQuery, [unitNameToFetch]);
      console.log('PUT /api/units/:id - Fetch result count:', fetchResult.length);
      
      if (fetchResult.length === 0) {
        console.error('PUT /api/units/:id - Unit not found in prod_acreage_schedule after update');
        console.error('PUT /api/units/:id - Searched for unit name:', unitNameToFetch);
        return res.status(404).json({ success: false, message: 'Unit not found after update' });
      }
      
      const row = fetchResult[0];
      const metadata = metadataResult.length > 0 ? metadataResult[0] : null;
      console.log('PUT /api/units/:id - Metadata found:', !!metadata);
      const unitId = encodeURIComponent(row.unit_name);
      
      // Parse arrays from metadata
      let apiNumbers: string[] = [];
      let targetFormations: string[] = [];
      let linkedSectionIds: string[] = [];
      let linkedContactIds: string[] = [];
      
      if (metadata) {
        try {
          if (metadata.api_numbers) apiNumbers = JSON.parse(metadata.api_numbers);
          if (metadata.target_formations) targetFormations = JSON.parse(metadata.target_formations);
          if (metadata.linked_section_ids) linkedSectionIds = JSON.parse(metadata.linked_section_ids);
          if (metadata.linked_contact_ids) linkedContactIds = JSON.parse(metadata.linked_contact_ids);
        } catch (e) {
          console.error('Error parsing metadata arrays:', e);
        }
      }
      
      const updatedUnit = {
        id: unitId,
        unitName: metadata?.unit_name || row.unit_name,
        operator: metadata?.operator || 'Unknown',
        apiNumbers: apiNumbers,
        targetFormations: targetFormations,
        status: (metadata?.status || row.status) === 'PRODUCING' ? 'Producing' : 
               (metadata?.status || row.status) === 'PERMITTED' ? 'Permitted' : 
               (metadata?.status || row.status) === 'Held by Production' ? 'Held by Production' : 'Permitted',
        estimatedGrossAcres: metadata?.estimated_gross_acres || parseFloat(row.total_net_mineral_acres) || 0,
        estimatedNetAcres: metadata?.estimated_net_acres || parseFloat(row.total_net_mineral_acres) || 0,
        county: metadata?.county || row.county || '',
        state: metadata?.state || row.state || 'OK',
        linkedSectionIds: linkedSectionIds,
        linkedContactIds: linkedContactIds,
        assignedBuyerId: metadata?.assigned_buyer_id || row.assigned_buyer || null,
        heldByFund: metadata?.held_by_fund !== null ? Boolean(metadata.held_by_fund) : false,
        exitStrategy: metadata?.exit_strategy || 'Hold',
        isLocked: metadata?.is_locked !== null ? Boolean(metadata.is_locked) : false,
        notes: metadata?.notes || row.notes || ''
      };
      
      console.log('PUT /api/units/:id - Successfully updated unit:', unitId);
      // Return the unit data in the format the frontend expects
      res.json({ success: true, data: updatedUnit });
    } catch (error: any) {
      console.error('PUT /api/units/:id - Error updating unit:', error);
      console.error('PUT /api/units/:id - Error stack:', error.stack);
      res.status(500).json({ 
        success: false, 
        message: 'Error updating unit', 
        error: error.message 
      });
    }
  });

  // Get single unit by ID (must be last to avoid matching more specific routes)
  router.get('/api/units/:id', async (req, res) => {
    try {
      if (!dbPool) {
        return res.status(500).json({ success: false, message: 'Database pool not initialized' });
      }

      const { id } = req.params;
      const unitName = decodeURIComponent(id).replace(/\s+/g, ' ').trim();
      console.log('GET /api/units/:id - Looking for unit name:', unitName);
      
      // Normalize unit name for matching
      const normalizedUnitName = unitName
        .replace(/\r\n/g, ' ')
        .replace(/\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      // Query prod_acreage_schedule for acreage data
      const query = `
        SELECT 
          id,
          COUNTY,
          STATE,
          S_T_R,
          CURRENT_UNIT_NAME,
          NEW_UNIT_NAME,
          OWNER,
          NMA,
          ROY,
          \`CURRENT_ALLO_%\` AS ALLOCATION_PERCENT,
          \`New_ALLO_%\` AS NEW_ALLO_PCT,
          \`$_NRA\` AS TOTAL_USD,
          STATUS,
          BUYER,
          NOTE,
          INTEREST_TYPE,
          LEGAL_DESCRIPTION,
          OWNER_STREET as street,
          OWNER_CITY as city,
          OWNER_ST as state,
          OWNER_ZIP as zip,
          PHONE_EMAIL,
          CONTACT,
          created_at,
          updated_at
        FROM prod_acreage_schedule
        WHERE REGEXP_REPLACE(TRIM(REPLACE(REPLACE(CURRENT_UNIT_NAME, '\\r\\n', ' '), '\\n', ' ')), ' +', ' ') = ?
        ORDER BY CURRENT_UNIT_NAME, COUNTY, S_T_R
      `;

      const rows = await executeQuery(dbPool, query, [normalizedUnitName]);
      
      // Query prod_unit_tracker for unit tracking data
      let unitTrackerData = null;
      try {
        // Split the unit name into individual well names
        // Pattern: Split on space before a well identifier (e.g., "CURLY BILL 2-27-34XHW CURLY BILL 6-27-34XHM")
        // This pattern looks for: space followed by capital letters (well name) followed by numbers and letters (well identifier)
        const wellNamePattern = /(?<=\s)([A-Z]+(?:\s+[A-Z]+)*\s+[\d-]+[A-Z0-9]+)/g;
        const wellNames: string[] = [];
        
        // Try to extract individual well names
        const matches = normalizedUnitName.match(wellNamePattern);
        if (matches && matches.length > 0) {
          wellNames.push(...matches.map(m => m.trim()));
        } else {
          // If pattern matching fails, try splitting on common patterns
          // Look for patterns like "CURLY BILL 2-27-34XHW" (name + numbers + letters)
          const parts = normalizedUnitName.split(/\s+(?=[A-Z]+(?:\s+[A-Z]+)*\s+[\d-]+[A-Z0-9]+)/);
          if (parts.length > 1) {
            wellNames.push(...parts.map(p => p.trim()).filter(p => p));
          } else {
            // If no split found, use the whole name
            wellNames.push(normalizedUnitName);
          }
        }
        
        console.log('GET /api/units/:id - Extracted well names:', wellNames);
        console.log('GET /api/units/:id - Normalized unit name:', normalizedUnitName);
        
        // First, let's see what's actually in the database
        console.log('GET /api/units/:id - Checking prod_unit_tracker table contents...');
        try {
          const checkTableQuery = `SELECT COUNT(*) as count FROM prod_unit_tracker`;
          const tableCount = await executeQuery(dbPool, checkTableQuery);
          console.log('GET /api/units/:id - Total records in prod_unit_tracker:', tableCount[0]?.count || 0);
          
          // Show sample records
          const sampleQuery = `SELECT Unit, Well_Name, Operator FROM prod_unit_tracker LIMIT 10`;
          const sampleResults = await executeQuery(dbPool, sampleQuery);
          console.log('GET /api/units/:id - Sample records from prod_unit_tracker:', JSON.stringify(sampleResults, null, 2));
        } catch (checkError: any) {
          console.log('GET /api/units/:id - Error checking table:', checkError.message);
        }
        
        // Try to match each individual well name
        const trackerQuery = `
          SELECT 
            id,
            Unit,
            Well_Name,
            API_NEW_,
            Operator,
            S,
            T,
            R,
            County,
            Status,
            Spud,
            Comp,
            \`1st_Prod\`,
            Target_Formation,
            Allo_,
            Allo_Status,
            Notes,
            Tops_NRA,
            created_at,
            updated_at
          FROM prod_unit_tracker
          WHERE TRIM(REPLACE(REPLACE(Unit, '\r\n', ' '), '\n', ' ')) = ?
             OR TRIM(REPLACE(REPLACE(Well_Name, '\r\n', ' '), '\n', ' ')) = ?
             OR TRIM(REPLACE(REPLACE(Unit, '\r\n', ' '), '\n', ' ')) LIKE ?
             OR TRIM(REPLACE(REPLACE(Well_Name, '\r\n', ' '), '\n', ' ')) LIKE ?
          LIMIT 1
        `;
        
        console.log('GET /api/units/:id - Using query:', trackerQuery);
        
        let trackerResults: any[] = [];
        
        // Try matching each individual well name
        // Use exact LIKE match (no wildcards) as user confirmed this works
        for (const wellName of wellNames) {
          console.log('GET /api/units/:id - Trying to match well name:', wellName);
          
          const results = await executeQuery(dbPool, trackerQuery, [
            wellName,
            wellName,
            wellName,  // Exact LIKE match (no wildcards) - works as user confirmed
            wellName   // Exact LIKE match (no wildcards)
          ]);
          
          console.log('GET /api/units/:id - Query returned', results.length, 'results for well name:', wellName);
          if (results.length > 0) {
            console.log('GET /api/units/:id - Match found! Data:', JSON.stringify(results[0], null, 2));
            trackerResults = results;
            console.log('GET /api/units/:id - Found match for well name:', wellName);
            break;
          }
        }
        
        // If no match found, let's see what's actually in the database
        if (trackerResults.length === 0) {
          console.log('GET /api/units/:id - No matches found. Checking database contents...');
          try {
            // Show all records with their Unit and Well_Name values
            const debugQuery = `SELECT Unit, Well_Name, Operator FROM prod_unit_tracker WHERE Unit IS NOT NULL OR Well_Name IS NOT NULL LIMIT 20`;
            const debugResults = await executeQuery(dbPool, debugQuery);
            console.log('GET /api/units/:id - All records in prod_unit_tracker (first 20):', JSON.stringify(debugResults, null, 2));
            
            // Also try a more flexible search - look for any record containing parts of our well names
            for (const wellName of wellNames) {
              const flexibleQuery = `
                SELECT Unit, Well_Name, Operator 
                FROM prod_unit_tracker 
                WHERE Unit LIKE ? 
                   OR Well_Name LIKE ?
                LIMIT 5
              `;
              const flexiblePattern = `%${wellName}%`;
              const flexibleResults = await executeQuery(dbPool, flexibleQuery, [flexiblePattern, flexiblePattern]);
              if (flexibleResults.length > 0) {
                console.log(`GET /api/units/:id - Found records containing "${wellName}":`, JSON.stringify(flexibleResults, null, 2));
              }
            }
          } catch (debugError: any) {
            console.log('GET /api/units/:id - Error in debug query:', debugError.message);
          }
        }
        
        // If no match by individual well names, try the full normalized name
        if (trackerResults.length === 0) {
          console.log('GET /api/units/:id - No match by individual well names, trying full unit name');
          trackerResults = await executeQuery(dbPool, trackerQuery, [
            normalizedUnitName,
            normalizedUnitName,
            normalizedUnitName,  // Exact LIKE match
            normalizedUnitName   // Exact LIKE match
          ]);
        }
        
        // If still no match, try matching by S-T-R (S, T, R are separate columns in prod_unit_tracker)
        if (trackerResults.length === 0 && rows.length > 0 && rows[0].S_T_R) {
          const sectionTownshipRange = rows[0].S_T_R;
          const strParts = sectionTownshipRange.split('-');
          if (strParts.length === 3) {
            const [section, township, range] = strParts;
            console.log('GET /api/units/:id - Trying to match by S-T-R (separate columns):', section, township, range);
            const strMatchQuery = `
              SELECT 
                id,
                Unit,
                Well_Name,
                API_NEW_,
                Operator,
                S,
                T,
                R,
                County,
                Status,
                Spud,
                Comp,
                \`1st_Prod\`,
                Target_Formation,
                Allo_,
                Allo_Status,
                Notes,
                Tops_NRA,
                created_at,
                updated_at
              FROM prod_unit_tracker
              WHERE TRIM(COALESCE(S, '')) = ?
                AND TRIM(COALESCE(T, '')) = ?
                AND TRIM(COALESCE(R, '')) = ?
              LIMIT 1
            `;
            trackerResults = await executeQuery(dbPool, strMatchQuery, [
              String(section).trim(),
              String(township).trim(),
              String(range).trim()
            ]);
            console.log('GET /api/units/:id - S-T-R match returned', trackerResults.length, 'results');
          }
        }
        
        if (trackerResults.length > 0) {
          unitTrackerData = trackerResults[0];
          console.log('GET /api/units/:id - Found unit tracker data:', JSON.stringify(unitTrackerData, null, 2));
          console.log('GET /api/units/:id - Operator from tracker:', unitTrackerData.Operator);
          console.log('GET /api/units/:id - Unit from tracker:', unitTrackerData.Unit);
          console.log('GET /api/units/:id - Well_Name from tracker:', unitTrackerData.Well_Name);
        } else {
          console.log('GET /api/units/:id - No matching record found in prod_unit_tracker');
          console.log('GET /api/units/:id - Searched for well names:', wellNames);
          console.log('GET /api/units/:id - Searched for full unit name:', normalizedUnitName);
          // Debug: Show what's in prod_unit_tracker
          try {
            const debugQuery = `SELECT Unit, Well_Name, Operator FROM prod_unit_tracker LIMIT 10`;
            const debugResults = await executeQuery(dbPool, debugQuery);
            console.log('GET /api/units/:id - Sample records from prod_unit_tracker:', JSON.stringify(debugResults, null, 2));
          } catch (debugError) {
            console.log('GET /api/units/:id - Could not fetch sample records:', debugError);
          }
        }
      } catch (trackerError: any) {
        console.log('GET /api/units/:id - Error querying prod_unit_tracker (table may not exist or be empty):', trackerError.message);
        // Continue without tracker data if table doesn't exist or query fails
      }
      
      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Unit not found' });
      }

      const unitMap = new Map();
      
      // Get metadata for this unit before processing rows
      let operator = 'Unknown';
      let apiNumbers: string[] = [];
      let targetFormations: string[] = [];
      let linkedSectionIds: string[] = [];
      let linkedContactIds: string[] = [];
      let heldByFund = false;
      let exitStrategy: 'Hold' | 'Flip' | 'LP Buyout' = 'Hold';
      let isLocked = false;
      let metadataNotes = '';
      let assignedBuyerIdFromMetadata: string | null = null;
      
      // Use prod_unit_tracker data if available (takes precedence over metadata)
      if (unitTrackerData) {
        const trackerOperator = unitTrackerData.Operator;
        console.log('GET /api/units/:id - Raw Operator from tracker:', trackerOperator);
        console.log('GET /api/units/:id - Operator type:', typeof trackerOperator);
        console.log('GET /api/units/:id - Operator is null?', trackerOperator === null);
        console.log('GET /api/units/:id - Operator is undefined?', trackerOperator === undefined);
        
        if (trackerOperator !== null && trackerOperator !== undefined) {
          const trimmedOperator = String(trackerOperator).trim();
          if (trimmedOperator !== '' && trimmedOperator !== 'null' && trimmedOperator.toLowerCase() !== 'unknown') {
            operator = trimmedOperator;
            console.log('GET /api/units/:id - Setting operator from tracker to:', operator);
          } else {
            console.log('GET /api/units/:id - Operator from tracker is empty or invalid, keeping:', operator);
          }
        } else {
          console.log('GET /api/units/:id - Operator from tracker is null/undefined, keeping:', operator);
        }
        
        if (unitTrackerData.API_NEW_) {
          apiNumbers = [unitTrackerData.API_NEW_].filter(Boolean);
        }
        if (unitTrackerData.Target_Formation) {
          targetFormations = [unitTrackerData.Target_Formation].filter(Boolean);
        }
        if (unitTrackerData.Notes) {
          metadataNotes = unitTrackerData.Notes;
        }
        // Map status from prod_unit_tracker
        if (unitTrackerData.Status) {
          const trackerStatus = unitTrackerData.Status.toUpperCase();
          if (trackerStatus.includes('ORDER') || trackerStatus.includes('PRODUCING')) {
            // Status will be set from prod_acreage_schedule, but we can use this as fallback
          }
        }
      } else {
        console.log('GET /api/units/:id - No unitTrackerData available, operator will use metadata or default');
      }
      
      console.log('GET /api/units/:id - Final operator value before metadata check:', operator);
      
      try {
        const metadataQuery = `SELECT * FROM units_metadata WHERE unit_name = ?`;
        const metadataResult = await executeQuery(dbPool, metadataQuery, [normalizedUnitName]);
        if (metadataResult.length > 0) {
          const metadata = metadataResult[0];
          // Only use metadata if prod_unit_tracker didn't provide the value
          if (!operator || operator === 'Unknown') {
            operator = metadata.operator || operator;
          }
          if (metadata.api_numbers && apiNumbers.length === 0) {
            try {
              apiNumbers = JSON.parse(metadata.api_numbers);
            } catch (e) {
              apiNumbers = [];
            }
          }
          if (metadata.target_formations && targetFormations.length === 0) {
            try {
              targetFormations = JSON.parse(metadata.target_formations);
            } catch (e) {
              targetFormations = ['Hunton', 'Woodford', 'Mississippian'];
            }
          }
          if (metadata.linked_section_ids) {
            try {
              linkedSectionIds = JSON.parse(metadata.linked_section_ids);
            } catch (e) {
              linkedSectionIds = [];
            }
          }
          if (metadata.linked_contact_ids) {
            try {
              linkedContactIds = JSON.parse(metadata.linked_contact_ids);
            } catch (e) {
              linkedContactIds = [];
            }
          }
          heldByFund = Boolean(metadata.held_by_fund);
          exitStrategy = metadata.exit_strategy || 'Hold';
          isLocked = Boolean(metadata.is_locked);
          if (!metadataNotes) {
            metadataNotes = metadata.notes || '';
          }
          // Get assigned_buyer_id from metadata
          assignedBuyerIdFromMetadata = metadata.assigned_buyer_id || null;
          console.log('GET /api/units/:id - Found assigned_buyer_id in metadata:', assignedBuyerIdFromMetadata);
        }
      } catch (metadataError: any) {
        console.log('Metadata table not available, using defaults:', metadataError.message);
      }
      
      rows.forEach((row: any) => {
        if (row.CURRENT_UNIT_NAME) {
          const fullUnitName = row.CURRENT_UNIT_NAME;
          const trimmedUnitName = fullUnitName.trim();
          
          if (!unitMap.has(trimmedUnitName)) {
            // Determine status - use prod_unit_tracker status if available, otherwise use prod_acreage_schedule
            let unitStatus = 'Permitted';
            if (unitTrackerData && unitTrackerData.Status) {
              const trackerStatus = unitTrackerData.Status.toUpperCase();
              if (trackerStatus.includes('ORDER') || trackerStatus.includes('PRODUCING')) {
                unitStatus = 'Producing';
              } else if (trackerStatus.includes('DUC')) {
                unitStatus = 'Held by Production';
              } else if (trackerStatus.includes('DRILLING') || trackerStatus.includes('APPLICATION')) {
                unitStatus = 'Permitted';
              }
            } else {
              unitStatus = row.STATUS === 'PRODUCING' ? 'Producing' : 
                          row.STATUS === 'PERMITTED' ? 'Permitted' : 'Held by Production';
            }
            
            // Use county from prod_unit_tracker if available, otherwise from prod_acreage_schedule
            const unitCounty = (unitTrackerData && unitTrackerData.County) || row.COUNTY;
            
            // Use allocation from prod_unit_tracker if available
            const allocation = unitTrackerData && unitTrackerData.Allo_ 
              ? parseFloat(unitTrackerData.Allo_) 
              : parseFloat(row.ALLOCATION_PERCENT) || 0;
            
            unitMap.set(trimmedUnitName, {
              id: row.id,
              unitName: trimmedUnitName.replace(/\s+(?=[A-Z]+\s+[A-Z]+\s+\d+)/g, '\n'),
              operator: operator,
              apiNumbers: apiNumbers.length > 0 ? apiNumbers : (unitTrackerData && unitTrackerData.API_NEW_ ? [unitTrackerData.API_NEW_] : []),
              targetFormations: targetFormations.length > 0 ? targetFormations : ['Hunton', 'Woodford', 'Mississippian'],
              status: unitStatus,
              estimatedGrossAcres: parseFloat(row.NMA) || 0,
              estimatedNetAcres: parseFloat(row.NMA) || 0,
              county: unitCounty,
              state: row.state || 'OK',
              linkedTractIds: [row.id],
              linkedSectionIds: linkedSectionIds,
              linkedContactIds: linkedContactIds,
              assignedBuyerId: assignedBuyerIdFromMetadata || null,
              assignedBuyer: null,
              heldByFund: heldByFund,
              exitStrategy: exitStrategy,
              isLocked: isLocked,
              notes: metadataNotes || row.NOTE || '',
              createdAt: unitTrackerData?.created_at || row.created_at,
              updatedAt: unitTrackerData?.updated_at || row.updated_at,
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
              allocationPercentage: allocation,
              buyer: row.BUYER,
              interestType: row.INTEREST_TYPE,
              legalDescription: row.LEGAL_DESCRIPTION,
              owner: row.OWNER,
              contact: row.CONTACT,
              street: row.street,
              city: row.city,
              zip: row.zip,
              phoneEmail: row.PHONE_EMAIL,
              // Additional fields from prod_unit_tracker
              wellName: unitTrackerData?.Well_Name || null,
              spudDate: unitTrackerData?.Spud || null,
              completion: unitTrackerData?.Comp || null,
              firstProduction: unitTrackerData?.['1st_Prod'] || null,
              allocationStatus: unitTrackerData?.Allo_Status || null,
              topsNRA: unitTrackerData?.Tops_NRA || null,
              section: unitTrackerData?.S || null,
              township: unitTrackerData?.T || null,
              range: unitTrackerData?.R || null
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

      const unit = units[0];
      unit.currentUnitName = (rows[0] && String(rows[0].CURRENT_UNIT_NAME || '').split(/\r?\n/)[0]?.trim()) || normalizedUnitName;
      unit.strList = [...new Set(rows.map((r: any) => r.S_T_R).filter((s: any) => s != null && String(s).trim() !== ''))];
      // One allocation and NRA per unique S-T-R (first row per STR) to avoid redundant repeated values
      const allocationByStr = new Map<string, number | undefined>();
      const nraByStr = new Map<string, number | null>();
      for (const r of rows) {
        const str = (r.S_T_R != null && String(r.S_T_R).trim() !== '') ? String(r.S_T_R).trim() : '';
        if (!str || allocationByStr.has(str)) continue;
        allocationByStr.set(str, (r.ALLOCATION_PERCENT != null && r.ALLOCATION_PERCENT !== '') ? parseFloat(r.ALLOCATION_PERCENT) : undefined);
        nraByStr.set(str, (r.TOTAL_USD != null && r.TOTAL_USD !== '') ? parseFloat(r.TOTAL_USD) : null);
      }
      unit.allocationList = (unit.strList || []).map((str: string) => allocationByStr.get(str));
      unit.nraCapUsdList = (unit.strList || []).map((str: string) => nraByStr.get(str) ?? null);
      unit.estimatedNetAcresList = rows.map((r: any) => parseFloat(r.NMA) || 0);
      const ownersByStr = new Map<string, Set<string>>();
      for (const r of rows) {
        const str = (r.S_T_R != null && String(r.S_T_R).trim() !== '') ? String(r.S_T_R).trim() : '';
        const owner = (r.OWNER != null && String(r.OWNER).trim() !== '') ? String(r.OWNER).trim() : '';
        if (!str) continue;
        if (!ownersByStr.has(str)) ownersByStr.set(str, new Set());
        if (owner) ownersByStr.get(str)!.add(owner);
      }
      unit.estimatedNumberOfOwnersList = (unit.strList || []).map((str: string) => ownersByStr.get(str)?.size ?? 0);
      if (rows[0] && rows[0].STATE) unit.state = rows[0].STATE;

      // First, check if assigned_buyer_id exists in metadata and look up the user
      if (assignedBuyerIdFromMetadata) {
        try {
          console.log('GET /api/units/:id - Looking up user by assigned_buyer_id:', assignedBuyerIdFromMetadata);
          const userQuery = `
            SELECT 
              u.id,
              u.name,
              u.email,
              u.created_at,
              u.updated_at,
              r.name as role_name,
              r.id as role_id
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            WHERE u.id = ?
          `;
          const userResult = await executeQuery(dbPool, userQuery, [assignedBuyerIdFromMetadata]);
          
          if (userResult.length > 0) {
            const userRow = userResult[0];
            unit.assignedBuyerId = assignedBuyerIdFromMetadata;
            unit.assignedBuyer = {
              id: userRow.id,
              name: userRow.name,
              email: userRow.email || '',
              role: {
                id: userRow.role_id,
                name: userRow.role_name || 'Buyer'
              }
            };
            console.log('GET /api/units/:id - Found buyer from metadata assigned_buyer_id:', unit.assignedBuyer.name);
          } else {
            console.log('GET /api/units/:id - User not found for assigned_buyer_id:', assignedBuyerIdFromMetadata);
          }
        } catch (userError: any) {
          console.log('GET /api/units/:id - Error looking up user from assigned_buyer_id:', userError.message);
        }
      }
      
      // If buyer not found from metadata, try to get buyer assignment from assignments
      if (!unit.assignedBuyer) {
        try {
          const allAssignments = await getCachedAssignments(dbPool);
          const matchingAssignments = allAssignments.filter((assignment: any) => {
            if (assignment.assetType !== 'Unit') return false;
            const assetId = assignment.assetId || assignment.asset?.id || '';
            const normalizedAssetId = assetId.replace(/\r\n/g, ' ').replace(/\n/g, ' ').trim();
            return normalizedAssetId === normalizedUnitName || 
                   normalizedAssetId.includes(normalizedUnitName) || 
                   normalizedUnitName.includes(normalizedAssetId) ||
                   (assignment.asset?.unitName && (
                     assignment.asset.unitName.replace(/\r\n/g, ' ').replace(/\n/g, ' ').trim() === normalizedUnitName
                   ));
          });
          
          // Get the most recent active assignment
          const activeAssignment = matchingAssignments
            .filter((a: any) => a.status === 'Active')
            .sort((a: any, b: any) => new Date(b.assignedDate || 0).getTime() - new Date(a.assignedDate || 0).getTime())[0];
          
          if (activeAssignment && activeAssignment.assignedBuyer) {
            unit.assignedBuyerId = activeAssignment.assignedBuyerId;
            unit.assignedBuyer = {
              id: activeAssignment.assignedBuyer.id,
              name: activeAssignment.assignedBuyer.name,
              email: activeAssignment.assignedBuyer.email || '',
              role: activeAssignment.assignedBuyer.role || { name: 'Buyer' }
            };
            console.log('GET /api/units/:id - Found buyer from assignments:', unit.assignedBuyer.name);
          } else if (unit.buyer) {
            // Fallback to BUYER field from prod_acreage_schedule
            unit.assignedBuyerId = null;
            unit.assignedBuyer = {
              id: `buyer_${String(unit.buyer).replace(/\s+/g, '_').toLowerCase()}`,
              name: String(unit.buyer),
              email: '',
              role: { name: 'Buyer' }
            };
            console.log('GET /api/units/:id - Using buyer from BUYER field:', unit.assignedBuyer.name);
          }
        } catch (assignmentError: any) {
          console.log('GET /api/units/:id - Error fetching assignments, using BUYER field:', assignmentError.message);
          // Fallback to BUYER field from prod_acreage_schedule
          if (unit.buyer) {
            unit.assignedBuyerId = null;
            unit.assignedBuyer = {
              id: `buyer_${String(unit.buyer).replace(/\s+/g, '_').toLowerCase()}`,
              name: String(unit.buyer),
              email: '',
              role: { name: 'Buyer' }
            };
            console.log('GET /api/units/:id - Using buyer from BUYER field (fallback):', unit.assignedBuyer.name);
          }
        }
      }

      res.json(unit);
    } catch (error: any) {
      console.error('Error fetching unit:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching unit',
        error: error.message 
      });
    }
  });

  // Get all acreage schedule records for a unit
  router.get('/api/units/:id/acreage-schedule', async (req, res) => {
    try {
      if (!dbPool) {
        return res.status(500).json({ success: false, message: 'Database pool not initialized' });
      }

      const { id } = req.params;
      const unitName = decodeURIComponent(id).replace(/\s+/g, ' ').trim();
      
      // Normalize unit name
      const normalizedUnitName = unitName
        .replace(/\r\n/g, ' ')
        .replace(/\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      // Get all acreage schedule records for this unit
      const query = `
        SELECT 
          id,
          COUNTY,
          S_T_R,
          LEGAL_DESCRIPTION,
          NMA,
          OWNER,
          OWNER_STREET as street,
          OWNER_CITY as city,
          OWNER_ST as state,
          OWNER_ZIP as zip,
          PHONE_EMAIL,
          ROY,
          STATUS,
          BUYER,
          NOTE,
          CURRENT_UNIT_NAME,
          NEW_UNIT_NAME,
          created_at,
          TITLE_SOURCE,
          CALCULATED_ACREAGE,
          CONTACT,
          INTEREST_TYPE,
          \`CURRENT_ALLO_%\` AS ALLO_,
          \`$_NRA\`,
          LAST_OGL,
          NEW_OCC_TYPE,
          created_at,
          updated_at
        FROM prod_acreage_schedule
        WHERE TRIM(REPLACE(REPLACE(CURRENT_UNIT_NAME, '\r\n', ' '), '\n', ' ')) = ?
        ORDER BY S_T_R, OWNER, id
      `;

      const rows = await executeQuery(dbPool, query, [normalizedUnitName]);
      console.log('Found acreage schedule records (before deduplication):', rows.length);
      
      // Deduplicate by id (primary key) - in case of any duplicates
      const recordsMap = new Map<number, any>();
      rows.forEach((row: any) => {
        if (row.id && !recordsMap.has(row.id)) {
          recordsMap.set(row.id, row);
        }
      });
      
      const uniqueRecords = Array.from(recordsMap.values());
      console.log('Returning acreage schedule records (after deduplication):', uniqueRecords.length);
      
      res.json(uniqueRecords);
    } catch (error: any) {
      console.error('Error fetching unit acreage schedule:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching unit acreage schedule', 
        error: error.message 
      });
    }
  });

  // Get all unit tracker records for a unit
  router.get('/api/units/:id/unit-tracker', async (req, res) => {
    try {
      if (!dbPool) {
        return res.status(500).json({ success: false, message: 'Database pool not initialized' });
      }

      const { id } = req.params;
      const unitName = decodeURIComponent(id).replace(/\s+/g, ' ').trim();
      
      // Normalize unit name
      const normalizedUnitName = unitName
        .replace(/\r\n/g, ' ')
        .replace(/\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      // Split unit name into individual well names
      const wellNamePattern = /(?<=\s)([A-Z]+(?:\s+[A-Z]+)*\s+[\d-]+[A-Z0-9]+)/g;
      const wellNames: string[] = [];
      const matches = normalizedUnitName.match(wellNamePattern);
      if (matches && matches.length > 0) {
        wellNames.push(...matches.map(m => m.trim()));
      } else {
        const parts = normalizedUnitName.split(/\s+(?=[A-Z]+(?:\s+[A-Z]+)*\s+[\d-]+[A-Z0-9]+)/);
        if (parts.length > 1) {
          wellNames.push(...parts.map(p => p.trim()).filter(p => p));
        } else {
          wellNames.push(normalizedUnitName);
        }
      }
      
      // Build query to match any of the well names
      const placeholders = wellNames.map(() => '?').join(',');
      const query = `
        SELECT 
          id,
          Unit,
          Well_Name,
          API_NEW_,
          Operator,
          S,
          T,
          R,
          County,
          Status,
          Spud,
          Comp,
          \`1st_Prod\`,
          Target_Formation,
          Allo_,
          Allo_Status,
          Notes,
          Tops_NRA,
          created_at,
          updated_at
        FROM prod_unit_tracker
        WHERE TRIM(REPLACE(REPLACE(Unit, '\r\n', ' '), '\n', ' ')) IN (${placeholders})
           OR TRIM(REPLACE(REPLACE(Well_Name, '\r\n', ' '), '\n', ' ')) IN (${placeholders})
           OR TRIM(REPLACE(REPLACE(Unit, '\r\n', ' '), '\n', ' ')) LIKE ?
           OR TRIM(REPLACE(REPLACE(Well_Name, '\r\n', ' '), '\n', ' ')) LIKE ?
        ORDER BY Well_Name, Unit, id
      `;
      
      const searchPattern = `%${normalizedUnitName}%`;
      const params = [...wellNames, ...wellNames, searchPattern, searchPattern];
      const rows = await executeQuery(dbPool, query, params);
      console.log('Found unit tracker records (before deduplication):', rows.length);
      
      // Deduplicate by id (primary key) - in case of any duplicates
      const recordsMap = new Map<number, any>();
      rows.forEach((row: any) => {
        if (row.id && !recordsMap.has(row.id)) {
          recordsMap.set(row.id, row);
        }
      });
      
      const uniqueRecords = Array.from(recordsMap.values());
      console.log('Returning unit tracker records (after deduplication):', uniqueRecords.length);
      
      res.json(uniqueRecords);
      
      res.json(rows);
    } catch (error: any) {
      console.error('Error fetching unit tracker records:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching unit tracker records', 
        error: error.message 
      });
    }
  });

  // Update a prod_unit_tracker record
  router.put('/api/unit-tracker/:id', async (req, res) => {
    try {
      if (!dbPool) {
        return res.status(500).json({ success: false, message: 'Database pool not initialized' });
      }

      const { id } = req.params;
      const updateData = req.body;

      // Build the update query dynamically based on provided fields
      const allowedFields = [
        'Unit', 'Well_Name', 'API_NEW_', 'Operator', 'S', 'T', 'R', 'County', 'Status',
        'Spud', 'Comp', '1st_Prod', 'Target_Formation', 'Allo_', 'Allo_Status', 'Notes', 'Tops_NRA'
      ];

      const updateFields: string[] = [];
      const updateValues: any[] = [];

      for (const field of allowedFields) {
        if (updateData.hasOwnProperty(field)) {
          // Handle the special case of '1st_Prod' field name
          const dbField = field === '1st_Prod' ? '`1st_Prod`' : field;
          updateFields.push(`${dbField} = ?`);
          updateValues.push(updateData[field]);
        }
      }

      if (updateFields.length === 0) {
        return res.status(400).json({ success: false, message: 'No valid fields to update' });
      }

      // Add updated_at timestamp
      updateFields.push('updated_at = NOW()');
      
      // Add id to the end for WHERE clause
      updateValues.push(id);

      const query = `
        UPDATE prod_unit_tracker
        SET ${updateFields.join(', ')}
        WHERE id = ?
      `;

      await executeQuery(dbPool, query, updateValues);

      // Fetch and return the updated record
      const updatedRecord = await executeQuery(dbPool, `
        SELECT * FROM prod_unit_tracker WHERE id = ?
      `, [id]);

      res.json({ success: true, data: updatedRecord[0] });
    } catch (error: any) {
      console.error('Error updating unit tracker record:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error updating unit tracker record', 
        error: error.message 
      });
    }
  });

  return router;
};

