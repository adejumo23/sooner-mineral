import { Router } from 'express';
import type { Pool } from 'mysql2/promise';
import { executeQuery } from '../utils/database.js';

export const createSectionsRoutes = (dbPool: Pool | null) => {
  const router = Router();

  // Get all sections
  router.get('/api/sections', async (req, res) => {
    try {
      if (!dbPool) {
        return res.status(500).json({ success: false, message: 'Database pool not initialized' });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;

      if (page < 1 || limit < 1 || limit > 100000) {
        return res.status(400).json({
          success: false,
          message: 'Invalid pagination parameters. Page must be >= 1, limit must be between 1 and 100000'
        });
      }

      const countQuery = `
        SELECT COUNT(DISTINCT S_T_R) as total
        FROM prod_acreage_schedule 
        WHERE S_T_R IS NOT NULL
      `;
      const countResult = await executeQuery(dbPool, countQuery);
      const totalCount = countResult[0].total;

      const query = `
        SELECT 
          pas.S_T_R as str,
          MAX(pas.COUNTY) as county,
          MAX(pas.STATE) as state,
          GROUP_CONCAT(DISTINCT pas.STATUS ORDER BY pas.STATUS SEPARATOR ',\n') as statuses,
          GROUP_CONCAT(DISTINCT pas.LEGAL_DESCRIPTION ORDER BY pas.LEGAL_DESCRIPTION SEPARATOR ';\n') as legal_descriptions,
          SUM(CAST(pas.NMA AS DECIMAL(12,4))) as net_mineral_acres,
          AVG(pas.CALCULATED_ACREAGE) as calculated_acreage,
          GROUP_CONCAT(DISTINCT pas.BUYER ORDER BY pas.BUYER SEPARATOR ', ') as assigned_buyer,
          COUNT(DISTINCT pas.BUYER) as buyer_count,
          COUNT(DISTINCT pas.OWNER) as owner_count,
          MIN(pas.created_at) as date_created,
          GROUP_CONCAT(DISTINCT pas.TITLE_SOURCE ORDER BY pas.TITLE_SOURCE SEPARATOR ', ') as title_sources,
          GROUP_CONCAT(DISTINCT pas.CURRENT_UNIT_NAME ORDER BY pas.CURRENT_UNIT_NAME SEPARATOR ',\n') as current_unit,
          GROUP_CONCAT(DISTINCT pas.NEW_UNIT_NAME ORDER BY pas.NEW_UNIT_NAME SEPARATOR ',\n') as new_unit_name,
          GROUP_CONCAT(DISTINCT pas.NEW_OCC_TYPE ORDER BY pas.NEW_OCC_TYPE SEPARATOR ', ') as new_occ_type,
          COUNT(CASE WHEN UPPER(pas.STATUS) = 'CLOSED' THEN 1 END) as closed_deals_count,
          SUM(CASE WHEN UPPER(pas.STATUS) = 'CLOSED' THEN CAST(pas.NMA AS DECIMAL(12,4)) ELSE 0 END) as net_mineral_acres_acquired,
          AVG(CAST(pas.ROY AS DECIMAL(5,2))) as royalty_blended,
          SUM(CAST(pas.NMA AS DECIMAL(12,4)) * CAST(pas.ROY AS DECIMAL(5,2)) / 100) as net_royalty_acres,
          SUM(CASE WHEN UPPER(pas.STATUS) = 'CLOSED' THEN CAST(pas.NMA AS DECIMAL(12,4)) * CAST(pas.ROY AS DECIMAL(5,2)) / 100 ELSE 0 END) as net_royalty_acres_acquired
        FROM prod_acreage_schedule pas
        WHERE pas.S_T_R IS NOT NULL 
        GROUP BY pas.S_T_R
        ORDER BY pas.S_T_R
        LIMIT ${limit} OFFSET ${offset}
      `;

      const rows = await executeQuery(dbPool, query);
      
      const sections = rows.map((row: any, index: number) => {
        let section = null, township = null, range = null;
        if (row.str) {
          const parts = String(row.str).split('-');
          if (parts.length >= 3) {
            section = parts[0];
            township = parts[1];
            range = parts[2];
          }
        }
        
        const netAcres = parseFloat(row.net_mineral_acres) || 0;
        const netAcresAcquired = parseFloat(row.net_mineral_acres_acquired) || 0;
        const buyer = row.assigned_buyer ? String(row.assigned_buyer).trim() : '';
        const status = buyer ? 'assigned' : 'unassigned';
        const royaltyBlended = row.royalty_blended != null ? parseFloat(row.royalty_blended) : undefined;
        const netRoyaltyAcres = row.net_royalty_acres != null ? parseFloat(row.net_royalty_acres) : undefined;
        const netRoyaltyAcresAcquired = row.net_royalty_acres_acquired != null ? parseFloat(row.net_royalty_acres_acquired) : undefined;
        const ownershipPercentInSection = netAcres > 0 && netAcresAcquired > 0
          ? (netAcresAcquired / netAcres) * 100
          : undefined;
        
        return {
          id: `s${offset + index + 1}`,
          section_name: row.str || `Section ${offset + index + 1}`,
          state: row.state || 'OK',
          county: row.county || 'Unknown',
          sectionNumber: section,
          township: township,
          range: range,
          str: row.str,
          grossAcres: netAcres,
          netMineralAcres: netAcres,
          titleStatus: row.statuses || 'Unknown',
          status: status,
          legalDescription: row.legal_descriptions || 'No description available',
          assignedBuyer: row.assigned_buyer ? { name: row.assigned_buyer } : null,
          buyerCount: row.buyer_count || 0,
          ownerCount: row.owner_count || 0,
          date_created: row.date_created || new Date().toISOString(),
          title_source: row.title_sources || 'Unknown',
          current_unit: row.current_unit || 'Unknown',
          allo_percent: row.allo_percent || 'N/A',
          new_unit_name: row.new_unit_name || 'N/A',
          new_occ_type: row.new_occ_type || 'N/A',
          dollar_nra: row.dollar_nra || 'N/A',
          closedDealsCount: row.closed_deals_count || 0,
          netMineralAcresAcquired: netAcresAcquired,
          royalty: royaltyBlended,
          netRoyaltyAcres: netRoyaltyAcres,
          netRoyaltyAcresAcquired: netRoyaltyAcresAcquired,
          ownershipPercentInSection: ownershipPercentInSection,
          // Set nraCapUsd to the first value from $_NRA (if available and numeric)
          nraCapUsd: (() => {
            if (row.dollar_nra) {
              // Extract the first numeric value from the comma-separated string
              const firstValue = String(row.dollar_nra).split(',')[0].trim();
              const parsed = parseFloat(firstValue);
              return isNaN(parsed) ? undefined : parsed;
            }
            return undefined;
          })(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      });

      const totalPages = Math.ceil(totalCount / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      res.json({
        data: sections,
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
      console.error('Error fetching sections:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching sections', 
        error: error.message 
      });
    }
  });

  // Update section - MUST be before GET /api/sections/:id to avoid route conflicts
  router.put('/api/sections/:id', async (req, res) => {
    try {
      if (!dbPool) {
        return res.status(500).json({ success: false, message: 'Database pool not initialized' });
      }

      const { id } = req.params;
      const updateData = req.body;

      console.log(`PUT /api/sections/${id} - Update data:`, JSON.stringify(updateData, null, 2));

      // Get the section's S_T_R value from sectionId (e.g., "s1" -> get S_T_R from ordered list)
      const sectionsResponse = await executeQuery(dbPool, `
        SELECT DISTINCT S_T_R as str
        FROM prod_acreage_schedule 
        WHERE S_T_R IS NOT NULL 
        ORDER BY S_T_R
      `);
      
      const sectionNumber = parseInt(id.replace('s', ''));
      if (isNaN(sectionNumber) || sectionNumber < 1 || sectionNumber > sectionsResponse.length) {
        return res.status(404).json({ success: false, message: 'Section not found' });
      }
      
      const sectionStr = sectionsResponse[sectionNumber - 1].str;
      
      // Build update query based on provided fields
      const updateFields: string[] = [];
      const updateValues: any[] = [];

      // Map frontend field names to database column names
      if (updateData.county !== undefined) {
        updateFields.push('COUNTY = ?');
        updateValues.push(updateData.county);
      }

      if (updateData.state !== undefined) {
        updateFields.push('STATE = ?');
        updateValues.push(updateData.state);
      }

      if (updateData.legalDescription !== undefined) {
        updateFields.push('LEGAL_DESCRIPTION = ?');
        updateValues.push(updateData.legalDescription);
      }

      // Handle S_T_R update if sectionNumber, township, or range are provided
      if (updateData.sectionNumber || updateData.township || updateData.range) {
        const section = updateData.sectionNumber || sectionStr.split('-')[0];
        const township = updateData.township || sectionStr.split('-')[1];
        const range = updateData.range || sectionStr.split('-')[2];
        const newStr = `${section}-${township}-${range}`;
        updateFields.push('S_T_R = ?');
        updateValues.push(newStr);
      } else if (updateData.str) {
        updateFields.push('S_T_R = ?');
        updateValues.push(updateData.str);
      } else if (updateData.sectionName) {
        updateFields.push('S_T_R = ?');
        updateValues.push(updateData.sectionName);
      }

      // Handle netMineralAcres -> NMA
      if (updateData.netMineralAcres !== undefined) {
        updateFields.push('NMA = ?');
        updateValues.push(updateData.netMineralAcres);
      }

      // Handle grossAcres -> CALCULATED_ACREAGE
      if (updateData.grossAcres !== undefined) {
        updateFields.push('CALCULATED_ACREAGE = ?');
        updateValues.push(updateData.grossAcres);
      }

      // Handle royalty -> ROY
      if (updateData.royalty !== undefined) {
        updateFields.push('ROY = ?');
        updateValues.push(updateData.royalty);
      }

      // Handle ownershipPercentage -> CURRENT_ALLO_%
      if (updateData.ownershipPercentage !== undefined) {
        updateFields.push('`CURRENT_ALLO_%` = ?');
        updateValues.push(updateData.ownershipPercentage);
      }

      // Handle titleStatus -> STATUS
      if (updateData.titleStatus !== undefined) {
        updateFields.push('STATUS = ?');
        updateValues.push(updateData.titleStatus);
      }

      // Handle assignedBuyerId -> BUYER
      if (updateData.assignedBuyerId !== undefined) {
        const buyerValue = updateData.assignedBuyerId && updateData.assignedBuyerId !== '' 
          ? updateData.assignedBuyerId.toUpperCase() 
          : null;
        updateFields.push('BUYER = ?');
        updateValues.push(buyerValue);
      }

      // Handle routingNotes -> NOTE
      if (updateData.routingNotes !== undefined) {
        updateFields.push('NOTE = ?');
        updateValues.push(updateData.routingNotes);
      }

      if (updateFields.length === 0) {
        return res.status(400).json({ success: false, message: 'No valid fields to update' });
      }

      // Add updated_at timestamp
      updateFields.push('updated_at = NOW()');
      
      // Add S_T_R to the end for WHERE clause
      updateValues.push(sectionStr);

      const query = `
        UPDATE prod_acreage_schedule
        SET ${updateFields.join(', ')}
        WHERE S_T_R = ?
      `;

      console.log('Update query:', query);
      console.log('Update values:', updateValues);

      await executeQuery(dbPool, query, updateValues);

      // Fetch and return the updated section
      const updatedSectionQuery = `
        SELECT 
          S_T_R as str,
          MAX(COUNTY) as county,
          MAX(STATE) as state,
          GROUP_CONCAT(DISTINCT STATUS ORDER BY STATUS SEPARATOR ',\n') as statuses,
          GROUP_CONCAT(DISTINCT LEGAL_DESCRIPTION ORDER BY LEGAL_DESCRIPTION SEPARATOR ';\n') as legal_descriptions,
          SUM(NMA) as net_mineral_acres,
          AVG(CALCULATED_ACREAGE) as calculated_acreage,
          GROUP_CONCAT(DISTINCT BUYER ORDER BY BUYER SEPARATOR ', ') as assigned_buyer,
          COUNT(DISTINCT BUYER) as buyer_count,
          COUNT(DISTINCT OWNER) as owner_count,
          MIN(created_at) as date_created,
          GROUP_CONCAT(DISTINCT TITLE_SOURCE ORDER BY TITLE_SOURCE SEPARATOR ', ') as title_sources,
          GROUP_CONCAT(DISTINCT CURRENT_UNIT_NAME ORDER BY CURRENT_UNIT_NAME SEPARATOR ',\n') as current_unit
        FROM prod_acreage_schedule 
        WHERE S_T_R = ?
        GROUP BY S_T_R
      `;

      // Determine which S_T_R value to use for fetching the updated section
      let strToFetch = sectionStr;
      const strIndex = updateFields.findIndex(field => field === 'S_T_R = ?');
      if (strIndex !== -1) {
        strToFetch = updateValues[strIndex];
      }
      
      const updatedRows = await executeQuery(dbPool, updatedSectionQuery, [strToFetch]);
      
      if (updatedRows.length === 0) {
        return res.status(404).json({ success: false, message: 'Section not found after update' });
      }

      const row = updatedRows[0];
      let section = null, township = null, range = null;
      if (row.str) {
        const parts = String(row.str).split('-');
        if (parts.length >= 3) {
          section = parts[0];
          township = parts[1];
          range = parts[2];
        }
      }
      
      const netAcres = parseFloat(row.net_mineral_acres) || 0;
      const buyer = row.assigned_buyer ? String(row.assigned_buyer).trim() : '';
      const status = buyer ? 'assigned' : 'unassigned';
      
      const updatedSection = {
        id: id,
        section_name: row.str || `Section ${sectionNumber}`,
        state: row.state || 'OK',
        county: row.county || 'Unknown',
        sectionNumber: section,
        township: township,
        range: range,
        str: row.str,
        grossAcres: netAcres,
        netMineralAcres: netAcres,
        titleStatus: row.statuses || 'Unknown',
        status: status,
        legalDescription: row.legal_descriptions || 'No description available',
        assignedBuyer: row.assigned_buyer ? { name: row.assigned_buyer } : null,
        buyerCount: row.buyer_count || 0,
        ownerCount: row.owner_count || 0,
        date_created: row.date_created || new Date().toISOString(),
        title_source: row.title_sources || 'Unknown',
        current_unit: row.current_unit || 'Unknown',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      res.json({ success: true, data: updatedSection });
    } catch (error: any) {
      console.error('Error updating section:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error updating section',
        error: error.message 
      });
    }
  });

  // Find section by STR
  router.get('/api/sections/by-str', async (req, res) => {
    try {
      if (!dbPool) {
        return res.status(500).json({ success: false, message: 'Database pool not initialized' });
      }

      const str = req.query.str as string;
      if (!str) {
        return res.status(400).json({ success: false, message: 'STR query parameter is required' });
      }
      
      const decodedStr = decodeURIComponent(str);
      console.log('Looking for section with STR:', decodedStr);
      
      const allResults = await executeQuery(dbPool, `
        SELECT DISTINCT S_T_R as str
        FROM prod_acreage_schedule 
        WHERE S_T_R IS NOT NULL 
        ORDER BY S_T_R
      `);
      
      const index = allResults.findIndex((row: any) => row.str === decodedStr);
      
      if (index === -1) {
        return res.status(404).json({ success: false, message: 'Section not found', str: decodedStr });
      }
      
      const sectionId = `s${index + 1}`;
      console.log(`Found section ${sectionId} for STR ${decodedStr}`);
      res.json({ id: sectionId, str: decodedStr, index });
    } catch (error: any) {
      console.error('Error finding section by STR:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error finding section by STR',
        error: error.message 
      });
    }
  });

  // Get section contacts
  router.get('/api/sections/:id/contacts', async (req, res) => {
    try {
      if (!dbPool) {
        return res.status(500).json({ success: false, message: 'Database pool not initialized' });
      }

      const { id } = req.params;
      
      const query = `
        SELECT DISTINCT
          OWNER as name,
          CONTACT as contact,
          OWNER_STREET as street,
          OWNER_CITY as city,
          OWNER_ST as state,
          OWNER_ZIP as zip,
          PHONE_EMAIL as phoneEmail,
          CURRENT_UNIT_NAME as unitName,
          created_at,
          updated_at
        FROM prod_acreage_schedule
        WHERE OWNER IS NOT NULL AND OWNER != ''
        ORDER BY OWNER
        LIMIT 50
      `;

      const rows = await executeQuery(dbPool, query);
      
      const contacts = rows.map((row: any, index: number) => ({
        id: `contact-${index}`,
        name: row.name,
        contact: row.contact,
        street: row.street,
        city: row.city,
        state: row.state,
        zip: row.zip,
        phoneEmail: row.phoneEmail,
        unitName: row.unitName,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
      
      res.json(contacts);
    } catch (error: any) {
      console.error('Error fetching section contacts:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching section contacts', 
        error: error.message 
      });
    }
  });

  // Get section leads
  router.get('/api/sections/:id/leads', async (req, res) => {
    try {
      if (!dbPool) {
        return res.status(500).json({ success: false, message: 'Database pool not initialized' });
      }

      const { id } = req.params;
      
      // Get the section's S_T_R value from sectionId (e.g., "s1" -> get S_T_R from ordered list)
      const sectionsResponse = await executeQuery(dbPool, `
        SELECT DISTINCT S_T_R as str
        FROM prod_acreage_schedule 
        WHERE S_T_R IS NOT NULL 
        ORDER BY S_T_R
      `);
      
      const sectionNumber = parseInt(id.replace('s', ''));
      if (isNaN(sectionNumber) || sectionNumber < 1 || sectionNumber > sectionsResponse.length) {
        return res.status(404).json({ success: false, message: 'Section not found' });
      }
      
      const sectionStr = sectionsResponse[sectionNumber - 1].str;
      
      // Fetch all lead fields from prod_acreage_schedule for this section
      const query = `
        SELECT
          id,
          OWNER as name,
          CONTACT as contact,
          OWNER_STREET as street,
          OWNER_CITY as city,
          OWNER_ST as state,
          OWNER_ZIP as zip,
          PHONE_EMAIL as phoneEmail,
          CURRENT_UNIT_NAME as unitName,
          NEW_UNIT_NAME as newUnitName,
          S_T_R as str,
          NMA as grossAcres,
          NMA as netMineralAcres,
          ROY as royalty,
          BUYER as buyer,
          STATUS as status,
          NOTE as note,
          LEGAL_DESCRIPTION as legalDescription,
          \`CURRENT_ALLO_%\` as alloPercent,
          \`New_ALLO_%\` as alloPercentAl,
          \`TOTAL_\$\` as totalNraUsd,
          NEW_OCC_TYPE as occType,
          created_at as dateField,
          TITLE_SOURCE as titleSource,
          CALCULATED_ACREAGE as calculatedAcreage,
          created_at,
          updated_at
        FROM prod_acreage_schedule
        WHERE OWNER IS NOT NULL AND OWNER != ''
          AND S_T_R = ?
        ORDER BY OWNER, id
        LIMIT 500
      `;

      const rows = await executeQuery(dbPool, query, [sectionStr]);
      
      const leads = rows.map((row: any, index: number) => {
        // Map database status to the new status values
        let leadStatus: 'NEW' | 'Working to Locate' | 'LVM/TXT/EMAIL' | 'sent mailer' | 'Negotiating' | 'Offer Accepted' | 'Not Selling Now' | 'Unable to Locate' | 'Dropped' = 'NEW';
        const dbStatus = (row.status || '').trim();
        
        if (dbStatus === 'DROPPED') leadStatus = 'Dropped';
        else if (dbStatus === 'LVM/TXT/EMAIL') leadStatus = 'LVM/TXT/EMAIL';
        else if (dbStatus === 'NEW') leadStatus = 'NEW';
        else if (dbStatus === 'WTL' || dbStatus === 'Working to Locate') leadStatus = 'Working to Locate';
        else if (dbStatus === 'sent mailer' || dbStatus === 'SENT MAILER') leadStatus = 'sent mailer';
        else if (dbStatus === 'Negotiating' || dbStatus === 'NEGOTIATING') leadStatus = 'Negotiating';
        else if (dbStatus === 'Offer Accepted' || dbStatus === 'OFFER ACCEPTED') leadStatus = 'Offer Accepted';
        else if (dbStatus === 'Not Selling Now' || dbStatus === 'NOT SELLING NOW') leadStatus = 'Not Selling Now';
        else if (dbStatus === 'Unable to Locate' || dbStatus === 'UNABLE TO LOCATE') leadStatus = 'Unable to Locate';
        else if (dbStatus) leadStatus = dbStatus as any;
        
        const nma = parseFloat(row.grossAcres) || 0;
        const roy = parseFloat(row.royalty) || 0;
        const netRoyaltyAcres = nma * roy / 100;
        const nraCapUsd = row.totalNraUsd != null ? parseFloat(row.totalNraUsd) : undefined;
        // NRA/$ Offer (Converted) - if we have NMA and a cap, offer converted could be derived; use same as nraCapUsd if no separate column
        const nraOfferConverted = nraCapUsd;
        
        return {
          id: `lead-${id}-${index}`,
          acreageScheduleId: row.id,
          sectionId: id,
          buyerId: row.buyer?.toLowerCase() || 'unassigned',
          status: leadStatus,
          leadSource: 'Assignment',
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          lastActivity: row.updated_at,
          noteCount: 0,
          name: row.name,
          contact: row.contact,
          street: row.street,
          city: row.city,
          state: row.state,
          zip: row.zip,
          phoneEmail: row.phoneEmail,
          unitName: row.unitName,
          newUnitName: row.newUnitName,
          grossAcres: nma,
          netMineralAcres: nma,
          netRoyaltyAcres,
          royalty: roy,
          priority: 'Medium',
          note: row.note,
          legalDescription: row.legalDescription,
          alloPercent: row.alloPercent,
          alloPercentAl: row.alloPercentAl,
          occType: row.occType,
          occDate: null as string | null,
          spudDate: null as string | null,
          firstProduction: null as string | null,
          nraCapUsd,
          nmaOffer: null as number | null,
          totalNmaUsd: nraCapUsd,
          nraOfferConverted,
          titleSource: row.titleSource,
          dateField: row.dateField,
          buyer: {
            id: row.buyer?.toLowerCase() || 'unassigned',
            name: row.buyer || 'Unassigned',
            email: `${row.buyer?.toLowerCase()}@company.com` || 'unassigned@company.com'
          }
        };
      });
      
      res.json(leads);
    } catch (error: any) {
      console.error('Error fetching section leads:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching section leads', 
        error: error.message 
      });
    }
  });

  // Update section lead status
  router.put('/api/sections/:sectionId/leads/:leadId/status', async (req, res) => {
    try {
      if (!dbPool) {
        return res.status(500).json({ success: false, message: 'Database pool not initialized' });
      }

      const { sectionId, leadId } = req.params;
      const { status } = req.body;

      // Validate status
      const validStatuses = ['NEW', 'Working to Locate', 'LVM/TXT/EMAIL', 'sent mailer', 'Negotiating', 'Offer Accepted', 'Not Selling Now', 'Unable to Locate', 'Dropped'];
      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({ 
          success: false, 
          message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
        });
      }

      // Get the section's S_T_R value from sectionId (same as GET endpoint)
      const sectionsResponse = await executeQuery(dbPool, `
        SELECT DISTINCT S_T_R as str
        FROM prod_acreage_schedule 
        WHERE S_T_R IS NOT NULL 
        ORDER BY S_T_R
      `);
      
      const sectionNumber = parseInt(sectionId.replace('s', ''));
      if (isNaN(sectionNumber) || sectionNumber < 1 || sectionNumber > sectionsResponse.length) {
        return res.status(404).json({ success: false, message: 'Section not found' });
      }
      
      const sectionStr = sectionsResponse[sectionNumber - 1].str;
      
      // Parse leadId to get the index (format: lead-{sectionId}-{index})
      const leadIdParts = leadId.split('-');
      if (leadIdParts.length < 3 || leadIdParts[0] !== 'lead') {
        return res.status(400).json({ success: false, message: 'Invalid lead ID format' });
      }
      
      // Extract the index from the last part of the leadId
      const indexString = leadIdParts[leadIdParts.length - 1]?.trim();
      if (!indexString || indexString === '') {
        return res.status(400).json({ success: false, message: 'Lead ID missing index part' });
      }
      const leadIndex = parseInt(indexString, 10);
      if (isNaN(leadIndex) || leadIndex < 0) {
        return res.status(400).json({ success: false, message: `Invalid lead index: ${indexString}` });
      }

      // Fetch leads for this section (same query/order as GET endpoint so index matches)
      const leadsQuery = `
        SELECT id, OWNER as name
        FROM prod_acreage_schedule
        WHERE OWNER IS NOT NULL AND OWNER != ''
          AND S_T_R = ?
        ORDER BY OWNER, id
        LIMIT 500
      `;
      
      const allLeadsRows = await executeQuery(dbPool, leadsQuery, [sectionStr]);
      
      if (leadIndex >= allLeadsRows.length) {
        return res.status(404).json({ success: false, message: 'Lead not found' });
      }
      
      const leadRow = allLeadsRows[leadIndex];
      const ownerName = leadRow.name;
      
      // Use the section's S_T_R (we already validated it exists)

      // Map the new status to database status format
      let dbStatus = status;
      if (status === 'Working to Locate') dbStatus = 'WTL';
      else if (status === 'sent mailer') dbStatus = 'SENT MAILER';
      else if (status === 'Negotiating') dbStatus = 'NEGOTIATING';
      else if (status === 'Offer Accepted') dbStatus = 'OFFER ACCEPTED';
      else if (status === 'Not Selling Now') dbStatus = 'NOT SELLING NOW';
      else if (status === 'Unable to Locate') dbStatus = 'UNABLE TO LOCATE';
      else if (status === 'Dropped') dbStatus = 'DROPPED';
      
      // Update all rows for this owner and section
      const updateQuery = `
        UPDATE prod_acreage_schedule
        SET STATUS = ?, updated_at = NOW()
        WHERE OWNER = ? AND S_T_R = ?
      `;
      
      await executeQuery(dbPool, updateQuery, [dbStatus, ownerName, sectionStr]);
      
      res.json({ 
        success: true, 
        message: 'Lead status updated successfully',
        status: status
      });
    } catch (error: any) {
      console.error('Error updating section lead status:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error updating section lead status', 
        error: error.message 
      });
    }
  });

  // Get section spatial data
  router.get('/api/section-spatial', async (req, res) => {
    try {
      if (!dbPool) {
        return res.status(500).json({ success: false, message: 'Database pool not initialized' });
      }

      const spatialData = {
        id: 'spatial-1',
        sectionId: 's1',
        latitude: 35.4676,
        longitude: -97.5164,
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [-97.52, 35.46],
            [-97.51, 35.46],
            [-97.51, 35.47],
            [-97.52, 35.47],
            [-97.52, 35.46]
          ]]
        },
        area: 640,
        perimeter: 4.0
      };
      
      res.json(spatialData);
    } catch (error: any) {
      console.error('Error fetching section spatial data:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching section spatial data', 
        error: error.message 
      });
    }
  });

  // Get all acreage schedule records for a section by STR
  router.get('/api/sections/:id/acreage-schedule', async (req, res) => {
    try {
      if (!dbPool) {
        return res.status(500).json({ success: false, message: 'Database pool not initialized' });
      }

      const { id } = req.params;
      const str = req.query.str as string | undefined;
      
      let sectionStr: string | null = null;
      
      // If STR is provided as query parameter, use it directly
      if (str) {
        sectionStr = str;
      } else {
        // Otherwise, look it up by section ID
        const sectionsResponse = await executeQuery(dbPool, `
          SELECT DISTINCT S_T_R as str
          FROM prod_acreage_schedule 
          WHERE S_T_R IS NOT NULL 
          ORDER BY S_T_R
        `);
        
        const sectionNumber = parseInt(id.replace('s', ''));
        if (isNaN(sectionNumber) || sectionNumber < 1 || sectionNumber > sectionsResponse.length) {
          return res.status(404).json({ success: false, message: 'Section not found' });
        }
        
        sectionStr = sectionsResponse[sectionNumber - 1].str;
      }
      
      if (!sectionStr) {
        return res.status(404).json({ success: false, message: 'Section STR not found' });
      }
      
      // Get all acreage schedule records for this STR
      const query = `
        SELECT 
          id,
          COUNTY,
          S_T_R,
          LEGAL_DESCRIPTION,
          NMA,
          OWNER,
          OWNER_STREET,
          OWNER_CITY,
          OWNER_ST,
          OWNER_ZIP,
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
          \`TOTAL_\$\`,
          LAST_OGL,
          NEW_OCC_TYPE,
          created_at,
          updated_at
        FROM prod_acreage_schedule
        WHERE S_T_R = ?
        ORDER BY OWNER, id
      `;

      const rows = await executeQuery(dbPool, query, [sectionStr]);
      
      res.json(rows);
    } catch (error: any) {
      console.error('Error fetching section acreage schedule:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching section acreage schedule', 
        error: error.message 
      });
    }
  });

  // Update an individual acreage schedule record
  router.put('/api/acreage-schedule/:id', async (req, res) => {
    try {
      if (!dbPool) {
        return res.status(500).json({ success: false, message: 'Database pool not initialized' });
      }

      const { id } = req.params;
      const updateData = req.body;

      // Build the update query dynamically based on provided fields
      const allowedFields = [
        'COUNTY', 'S_T_R', 'LEGAL_DESCRIPTION', 'NMA', 'OWNER', 'OWNER_STREET', 'OWNER_CITY', 'OWNER_ST', 'OWNER_ZIP',
        'PHONE_EMAIL', 'ROY', 'STATUS', 'BUYER', 'NOTE', 'CURRENT_UNIT_NAME', 'NEW_UNIT_NAME',
        'created_at', 'TITLE_SOURCE', 'CALCULATED_ACREAGE', 'CONTACT', 'INTEREST_TYPE',
        'CURRENT_ALLO_%', 'TOTAL_$', 'LAST_OGL', 'NEW_OCC_TYPE'
      ];

      const updateFields: string[] = [];
      const updateValues: any[] = [];

      for (const field of allowedFields) {
        if (updateData.hasOwnProperty(field)) {
          // Handle special column names that need backticks
          const columnName = field === 'CURRENT_ALLO_%' ? '`CURRENT_ALLO_%`' : 
                           field === 'TOTAL_$' ? '`TOTAL_$`' : 
                           field;
          updateFields.push(`${columnName} = ?`);
          updateValues.push(updateData[field]);
        }
      }

      if (updateFields.length === 0) {
        return res.status(400).json({ success: false, message: 'No valid fields to update' });
      }

      // Add updated_at timestamp
      updateFields.push('updated_at = NOW()');
      
      // Add id to the end for WHERE clause
      updateValues.push(parseInt(id));

      const query = `
        UPDATE prod_acreage_schedule
        SET ${updateFields.join(', ')}
        WHERE id = ?
      `;

      await executeQuery(dbPool, query, updateValues);

      // Fetch and return the updated record
      const updatedRecord = await executeQuery(dbPool, `
        SELECT * FROM prod_acreage_schedule WHERE id = ?
      `, [id]);

      res.json({ success: true, data: updatedRecord[0] });
    } catch (error: any) {
      console.error('Error updating acreage schedule record:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error updating acreage schedule record', 
        error: error.message 
      });
    }
  });

  return router;
};

