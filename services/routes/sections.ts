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

      if (page < 1 || limit < 1 || limit > 1000) {
        return res.status(400).json({
          success: false,
          message: 'Invalid pagination parameters. Page must be >= 1, limit must be between 1 and 1000'
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
          S_T_R as str,
          MAX(COUNTY) as county,
          MAX(ST) as state,
          GROUP_CONCAT(DISTINCT STATUS ORDER BY STATUS SEPARATOR ',\n') as statuses,
          GROUP_CONCAT(DISTINCT LEGAL_DESCRIPTION ORDER BY LEGAL_DESCRIPTION SEPARATOR ';\n') as legal_descriptions,
          SUM(NMA) as net_mineral_acres,
          AVG(CALCULATED_ACREAGE) as calculated_acreage,
          GROUP_CONCAT(DISTINCT BUYER ORDER BY BUYER SEPARATOR ', ') as assigned_buyer,
          COUNT(DISTINCT BUYER) as buyer_count,
          COUNT(DISTINCT OWNER) as owner_count,
          MIN(DATE) as date_created,
          GROUP_CONCAT(DISTINCT TITLE_SOURCE ORDER BY TITLE_SOURCE SEPARATOR ', ') as title_sources,
          GROUP_CONCAT(DISTINCT CURRENT_UNIT_NAME ORDER BY CURRENT_UNIT_NAME SEPARATOR ',\n') as current_unit
        FROM prod_acreage_schedule 
        WHERE S_T_R IS NOT NULL 
        GROUP BY S_T_R
        ORDER BY S_T_R
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
        const buyer = row.assigned_buyer ? String(row.assigned_buyer).trim() : '';
        const status = buyer ? 'assigned' : 'unassigned';
        
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
          STREET as street,
          CITY as city,
          ST as state,
          ZIP as zip,
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
      
      // Filter leads by the section's S_T_R value
      const query = `
        SELECT DISTINCT
          OWNER as name,
          CONTACT as contact,
          STREET as street,
          CITY as city,
          ST as state,
          ZIP as zip,
          PHONE_EMAIL as phoneEmail,
          CURRENT_UNIT_NAME as unitName,
          S_T_R as str,
          NMA as grossAcres,
          NMA as netMineralAcres,
          ROY as royalty,
          BUYER as buyer,
          STATUS as status,
          created_at,
          updated_at
        FROM prod_acreage_schedule
        WHERE OWNER IS NOT NULL AND OWNER != ''
          AND S_T_R = ?
        ORDER BY OWNER
        LIMIT 50
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
        else if (dbStatus) leadStatus = dbStatus as any; // Use the status as-is if it matches one of our values
        
        return {
          id: `lead-${id}-${index}`,
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
          grossAcres: parseFloat(row.grossAcres) || 0,
          netMineralAcres: parseFloat(row.netMineralAcres) || 0,
          royalty: parseFloat(row.royalty) || 0,
          priority: 'Medium',
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
    // #region agent log
    console.log('[DEBUG] PUT /api/sections/:sectionId/leads/:leadId/status - Entry', {
      sectionId: req.params.sectionId,
      leadId: req.params.leadId,
      body: req.body,
      bodyType: typeof req.body,
      status: req.body?.status,
      statusType: typeof req.body?.status,
      contentType: req.headers['content-type']
    });
    try {
      const fs = await import('fs');
      const logPath = 'c:\\devroot\\webpages\\sooner-mineral\\.cursor\\debug.log';
      const logEntry = JSON.stringify({location:'sections.ts:313',message:'PUT endpoint entry',data:{sectionId:req.params.sectionId,leadId:req.params.leadId,body:req.body,bodyType:typeof req.body,status:req.body?.status,statusType:typeof req.body?.status,headers:req.headers['content-type']},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1,H2,H3,H4'})+'\n';
      fs.appendFileSync(logPath, logEntry, 'utf8');
    } catch (logError) {
      console.error('[DEBUG] Failed to write log:', logError);
    }
    // #endregion
    try {
      if (!dbPool) {
        return res.status(500).json({ success: false, message: 'Database pool not initialized' });
      }

      const { sectionId, leadId } = req.params;
      const { status } = req.body;
      
      // #region agent log
      console.log('[DEBUG] After extracting params and body', {
        sectionId,
        leadId,
        status,
        statusType: typeof status,
        bodyKeys: Object.keys(req.body || {})
      });
      try {
        const fs = await import('fs');
        const logPath = 'c:\\devroot\\webpages\\sooner-mineral\\.cursor\\debug.log';
        const logEntry2 = JSON.stringify({location:'sections.ts:322',message:'After extracting params and body',data:{sectionId:sectionId,leadId:leadId,status:status,statusType:typeof status,bodyKeys:Object.keys(req.body || {})},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1,H4'})+'\n';
        fs.appendFileSync(logPath, logEntry2, 'utf8');
      } catch (logError) {
        console.error('[DEBUG] Failed to write log:', logError);
      }
      // #endregion

      // Validate status
      const validStatuses = ['NEW', 'Working to Locate', 'LVM/TXT/EMAIL', 'sent mailer', 'Negotiating', 'Offer Accepted', 'Not Selling Now', 'Unable to Locate', 'Dropped'];
      // #region agent log
      console.log('[DEBUG] Before status validation', {
        status,
        statusInValidList: validStatuses.includes(status),
        validStatuses
      });
      try {
        const fs = await import('fs');
        const logPath = 'c:\\devroot\\webpages\\sooner-mineral\\.cursor\\debug.log';
        const logEntry3 = JSON.stringify({location:'sections.ts:333',message:'Before status validation',data:{status:status,statusInValidList:validStatuses.includes(status),validStatuses:validStatuses},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})+'\n';
        fs.appendFileSync(logPath, logEntry3, 'utf8');
      } catch (logError) {
        console.error('[DEBUG] Failed to write log:', logError);
      }
      // #endregion
      if (!status || !validStatuses.includes(status)) {
        // #region agent log
        console.log('[DEBUG] Status validation failed - returning 400', {
          status,
          statusInValidList: validStatuses.includes(status),
          validStatuses
        });
        try {
          const fs = await import('fs');
          const logPath = 'c:\\devroot\\webpages\\sooner-mineral\\.cursor\\debug.log';
          const logEntry4 = JSON.stringify({location:'sections.ts:339',message:'Status validation failed - returning 400',data:{status:status,statusInValidList:validStatuses.includes(status),validStatuses:validStatuses},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})+'\n';
          fs.appendFileSync(logPath, logEntry4, 'utf8');
        } catch (logError) {
          console.error('[DEBUG] Failed to write log:', logError);
        }
        // #endregion
        return res.status(400).json({ 
          success: false, 
          message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
        });
      }

      // Parse leadId to extract owner name (format: lead-{sectionId}-{index})
      // We need to find the lead by matching the owner name from the leadId
      // Since we can't directly map leadId to a database record, we'll need to
      // get the lead first to find the owner name
      
      // Get section STR first
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
      // The leadId format is: lead-{sectionId}-{index}
      // Example: lead-s1-0 means section s1, index 0
      // But sectionId might contain dashes, so we need to handle that
      // We'll extract the last part as the index
      const leadIdParts = leadId.split('-');
      // #region agent log
      console.log('[DEBUG] After parsing leadId', {
        leadId,
        leadIdParts,
        partsLength: leadIdParts.length,
        firstPart: leadIdParts[0],
        lastPart: leadIdParts[leadIdParts.length - 1]
      });
      try {
        const fs = await import('fs');
        const logPath = 'c:\\devroot\\webpages\\sooner-mineral\\.cursor\\debug.log';
        const logEntry5 = JSON.stringify({location:'sections.ts:352',message:'After parsing leadId',data:{leadId:leadId,leadIdParts:leadIdParts,partsLength:leadIdParts.length,firstPart:leadIdParts[0],lastPart:leadIdParts[leadIdParts.length - 1]},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H2'})+'\n';
        fs.appendFileSync(logPath, logEntry5, 'utf8');
      } catch (logError) {
        console.error('[DEBUG] Failed to write log:', logError);
      }
      // #endregion
      if (leadIdParts.length < 3 || leadIdParts[0] !== 'lead') {
        // #region agent log
        console.log('[DEBUG] LeadId format validation failed - returning 400', {
          leadId,
          leadIdParts,
          partsLength: leadIdParts.length,
          firstPart: leadIdParts[0]
        });
        try {
          const fs = await import('fs');
          const logPath = 'c:\\devroot\\webpages\\sooner-mineral\\.cursor\\debug.log';
          const logEntry6 = JSON.stringify({location:'sections.ts:354',message:'LeadId format validation failed - returning 400',data:{leadId:leadId,leadIdParts:leadIdParts,partsLength:leadIdParts.length,firstPart:leadIdParts[0]},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H2'})+'\n';
          fs.appendFileSync(logPath, logEntry6, 'utf8');
        } catch (logError) {
          console.error('[DEBUG] Failed to write log:', logError);
        }
        // #endregion
        return res.status(400).json({ success: false, message: 'Invalid lead ID format' });
      }
      
      // Extract the index from the last part of the leadId
      // Format: lead-{sectionId}-{index}, so index is always the last part
      const indexString = leadIdParts[leadIdParts.length - 1]?.trim();
      if (!indexString || indexString === '') {
        return res.status(400).json({ success: false, message: 'Lead ID missing index part' });
      }
      const leadIndex = parseInt(indexString, 10);
      // #region agent log
      console.log('[DEBUG] After parsing leadIndex', {
        leadIndex,
        isNaN: isNaN(leadIndex),
        indexString,
        leadIdParts2: leadIdParts[2],
        allParts: leadIdParts
      });
      try {
        const fs = await import('fs');
        const logPath = 'c:\\devroot\\webpages\\sooner-mineral\\.cursor\\debug.log';
        const logEntry7 = JSON.stringify({location:'sections.ts:365',message:'After parsing leadIndex',data:{leadIndex:leadIndex,isNaN:isNaN(leadIndex),indexString:indexString,leadIdParts2:leadIdParts[2],allParts:leadIdParts},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H2'})+'\n';
        fs.appendFileSync(logPath, logEntry7, 'utf8');
      } catch (logError) {
        console.error('[DEBUG] Failed to write log:', logError);
      }
      // #endregion
      if (isNaN(leadIndex) || leadIndex < 0) {
        // #region agent log
        console.log('[DEBUG] LeadIndex is NaN or negative - returning 400', {
          leadIndex,
          indexString
        });
        try {
          const fs = await import('fs');
          const logPath = 'c:\\devroot\\webpages\\sooner-mineral\\.cursor\\debug.log';
          const logEntry8 = JSON.stringify({location:'sections.ts:375',message:'LeadIndex is NaN or negative - returning 400',data:{leadIndex:leadIndex,indexString:indexString},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H2'})+'\n';
          fs.appendFileSync(logPath, logEntry8, 'utf8');
        } catch (logError) {
          console.error('[DEBUG] Failed to write log:', logError);
        }
        // #endregion
        return res.status(400).json({ success: false, message: `Invalid lead index: ${indexString}` });
      }

      // Get the lead to find the owner name
      // IMPORTANT: Use the EXACT same query as the GET endpoint to ensure we get leads in the same order
      // #region agent log
      console.log('[DEBUG] Before querying for lead', {
        sectionId,
        leadIndex,
        offset: leadIndex,
        sectionIdForQuery: `%${sectionId}%`
      });
      // #endregion
      
      // Ensure leadIndex is a valid number
      if (typeof leadIndex !== 'number' || isNaN(leadIndex) || leadIndex < 0) {
        // #region agent log
        console.log('[DEBUG] leadIndex is not a valid number before query', {
          leadIndex,
          leadIndexType: typeof leadIndex
        });
        // #endregion
        return res.status(400).json({ 
          success: false, 
          message: `Invalid lead index: ${leadIndex}. LeadId: ${leadId}` 
        });
      }
      
      // Use the EXACT same query structure as GET /api/sections/:id/leads
      // Filter by the section's S_T_R value (sectionStr is already computed above)
      const leadsQuery = `
        SELECT DISTINCT
          OWNER as name,
          CONTACT as contact,
          STREET as street,
          CITY as city,
          ST as state,
          ZIP as zip,
          PHONE_EMAIL as phoneEmail,
          CURRENT_UNIT_NAME as unitName,
          S_T_R as str,
          NMA as grossAcres,
          NMA as netMineralAcres,
          ROY as royalty,
          BUYER as buyer,
          STATUS as status,
          created_at,
          updated_at
        FROM prod_acreage_schedule
        WHERE OWNER IS NOT NULL AND OWNER != ''
          AND S_T_R = ?
        ORDER BY OWNER
        LIMIT 50
      `;
      
      // #region agent log
      console.log('[DEBUG] Executing query to fetch all leads', {
        leadIndex,
        sectionStr,
        maxLeads: 50
      });
      // #endregion
      
      // Fetch all leads (same as GET endpoint, up to 50)
      const allLeadsRows = await executeQuery(dbPool, leadsQuery, [sectionStr]);
      
      // #region agent log
      console.log('[DEBUG] Fetched all leads', {
        totalLeads: allLeadsRows?.length || 0,
        requestedIndex: leadIndex
      });
      // #endregion
      
      // Select the lead at the specified index
      if (leadIndex >= allLeadsRows.length) {
        // #region agent log
        console.log('[DEBUG] Lead index out of range', {
          leadIndex,
          totalLeads: allLeadsRows.length
        });
        // #endregion
        return res.status(404).json({ success: false, message: 'Lead not found' });
      }
      
      const leadsRows = [allLeadsRows[leadIndex]];
      
      // #region agent log
      console.log('[DEBUG] Query result', {
        rowsReturned: leadsRows?.length || 0,
        firstRow: leadsRows?.[0] || null
      });
      // #endregion
      
      if (!leadsRows || leadsRows.length === 0) {
        // #region agent log
        console.log('[DEBUG] No leads found for index', {
          leadIndex,
          sectionId
        });
        // #endregion
        return res.status(404).json({ success: false, message: 'Lead not found' });
      }
      
      const ownerName = leadsRows[0].name;
      const unitName = leadsRows[0].unitName;
      // Use the actual S_T_R from the lead row, not from sectionId
      // This is critical because the lead might be in a different section than the one we're viewing
      const actualSectionStr = leadsRows[0].str || sectionStr;
      
      // #region agent log
      console.log('[DEBUG] Found owner name and unit name', {
        ownerName,
        unitName,
        leadIndex,
        sectionId,
        sectionStrFromSectionId: sectionStr,
        actualSectionStrFromLead: actualSectionStr,
        selectedRow: leadsRows[0]
      });
      // #endregion
      
      // Map the new status to database status format
      let dbStatus = status;
      if (status === 'Working to Locate') dbStatus = 'WTL';
      else if (status === 'sent mailer') dbStatus = 'SENT MAILER';
      else if (status === 'Negotiating') dbStatus = 'NEGOTIATING';
      else if (status === 'Offer Accepted') dbStatus = 'OFFER ACCEPTED';
      else if (status === 'Not Selling Now') dbStatus = 'NOT SELLING NOW';
      else if (status === 'Unable to Locate') dbStatus = 'UNABLE TO LOCATE';
      else if (status === 'Dropped') dbStatus = 'DROPPED';
      
      // #region agent log
      console.log('[DEBUG] Before UPDATE query', {
        dbStatus,
        ownerName,
        unitName,
        sectionStr,
        sectionIdParam: `%${sectionId}%`
      });
      // #endregion
      
      // First, check if rows exist for this owner and section
      // Use the actual section from the lead row, not from sectionId
      const checkQuery = `
        SELECT STATUS, CURRENT_UNIT_NAME, S_T_R
        FROM prod_acreage_schedule
        WHERE OWNER = ? AND S_T_R = ?
        LIMIT 5
      `;
      const checkRows = await executeQuery(dbPool, checkQuery, [ownerName, actualSectionStr]);
      
      // #region agent log
      console.log('[DEBUG] Pre-update check query', {
        matchingRows: checkRows.length,
        sampleRows: checkRows,
        ownerName,
        actualSectionStr
      });
      // #endregion
      
      if (checkRows.length === 0) {
        // Try to find rows with just OWNER to see what S_T_R values exist
        const ownerCheckQuery = `
          SELECT DISTINCT S_T_R, CURRENT_UNIT_NAME, STATUS
          FROM prod_acreage_schedule
          WHERE OWNER = ?
          LIMIT 10
        `;
        const ownerCheckRows = await executeQuery(dbPool, ownerCheckQuery, [ownerName]);
        
        // #region agent log
        console.log('[DEBUG] Owner check - no matching S_T_R found', {
          ownerName,
          requestedSectionStr: actualSectionStr,
          availableSections: ownerCheckRows.map((r: any) => ({
            s_t_r: r.S_T_R,
            unitName: r.CURRENT_UNIT_NAME,
            status: r.STATUS
          }))
        });
        // #endregion
        
        return res.status(404).json({ 
          success: false, 
          message: `No records found for owner "${ownerName}" in section "${actualSectionStr}"`,
          debug: {
            ownerName,
            sectionStr: actualSectionStr,
            availableSections: ownerCheckRows.map((r: any) => r.S_T_R)
          }
        });
      }
      
      // Update rows for this owner and section STR
      // Use the actual S_T_R from the lead row, not from sectionId
      const updateQuery = `
        UPDATE prod_acreage_schedule
        SET STATUS = ?, updated_at = NOW()
        WHERE OWNER = ? AND S_T_R = ?
      `;
      
      // #region agent log
      console.log('[DEBUG] Executing UPDATE query', {
        query: updateQuery,
        params: [dbStatus, ownerName, actualSectionStr],
        ownerName,
        actualSectionStr,
        dbStatus
      });
      // #endregion
      
      // Execute UPDATE and get affected rows
      let connection;
      try {
        connection = await dbPool!.getConnection();
        const [result] = await connection.execute(updateQuery, [dbStatus, ownerName, actualSectionStr]) as any;
        const affectedRows = result.affectedRows || 0;
        
        // #region agent log
        console.log('[DEBUG] UPDATE query result', {
          affectedRows,
          changedRows: result.changedRows || 0,
          ownerName,
          unitName,
          actualSectionStr,
          dbStatus
        });
        // #endregion
        
        if (affectedRows === 0) {
          console.warn('[DEBUG] UPDATE affected 0 rows - no matching records found', {
            ownerName,
            unitName,
            actualSectionStr,
            dbStatus,
            updateQuery,
            updateParams: [dbStatus, ownerName, actualSectionStr]
          });
        }
        
        connection.release();
      } catch (updateError: any) {
        if (connection) connection.release();
        throw updateError;
      }
      
      // Verify the update by querying the updated row
      const verifyQuery = `
        SELECT STATUS, OWNER, S_T_R
        FROM prod_acreage_schedule
        WHERE OWNER = ? AND S_T_R = ?
        LIMIT 1
      `;
      const verifyRows = await executeQuery(dbPool, verifyQuery, [ownerName, actualSectionStr]);
      
      // #region agent log
      console.log('[DEBUG] Verification query after UPDATE', {
        verifyRows: verifyRows.length,
        actualStatus: verifyRows[0]?.STATUS,
        expectedStatus: dbStatus,
        ownerName,
        actualSectionStr
      });
      // #endregion
      
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
          STREET,
          CITY,
          ST,
          ZIP,
          PHONE_EMAIL,
          ROY,
          STATUS,
          BUYER,
          NOTE,
          CURRENT_UNIT_NAME,
          NEW_UNIT_NAME,
          DATE,
          TITLE_SOURCE,
          CALCULATED_ACREAGE,
          CONTACT,
          INTEREST_TYPE,
          PAYSTUB_NRI,
          ALLO_,
          TOTAL_,
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
        'COUNTY', 'S_T_R', 'LEGAL_DESCRIPTION', 'NMA', 'OWNER', 'STREET', 'CITY', 'ST', 'ZIP',
        'PHONE_EMAIL', 'ROY', 'STATUS', 'BUYER', 'NOTE', 'CURRENT_UNIT_NAME', 'NEW_UNIT_NAME',
        'DATE', 'TITLE_SOURCE', 'CALCULATED_ACREAGE', 'CONTACT', 'INTEREST_TYPE', 'PAYSTUB_NRI',
        'ALLO_', 'TOTAL_', 'LAST_OGL', 'NEW_OCC_TYPE'
      ];

      const updateFields: string[] = [];
      const updateValues: any[] = [];

      for (const field of allowedFields) {
        if (updateData.hasOwnProperty(field)) {
          updateFields.push(`${field} = ?`);
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

