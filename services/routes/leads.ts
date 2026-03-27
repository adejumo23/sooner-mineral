import { Router } from 'express';
import type { Pool } from 'mysql2/promise';
import { executeQuery } from '../utils/database.js';
import { netRoyaltyAcresFromNmaAndRoy } from '../../utils/nra.js';

/** Encode owner name as a URL-safe lead id so detail view always loads the correct lead. */
function leadIdFromOwnerName(ownerName: string): string {
  return 'lead-' + Buffer.from(ownerName, 'utf8').toString('base64url');
}

/** Resolve lead id to owner name: supports "lead-<base64url(ownerName)>" (stable) or legacy "lead-<number>" (offset). */
async function getOwnerNameFromLeadId(id: string, dbPool: Pool): Promise<string | null> {
  const rest = id.replace(/^lead-/, '');
  if (!rest) return null;
  const num = parseInt(rest, 10);
  if (!isNaN(num) && num >= 0 && String(num) === rest) {
    const offset = Math.min(num, 2147483647);
    const rows = await executeQuery(
      dbPool,
      `SELECT DISTINCT OWNER as name FROM prod_acreage_schedule WHERE OWNER IS NOT NULL AND OWNER != '' ORDER BY OWNER LIMIT 1 OFFSET ${offset}`,
      []
    );
    return (rows as any[])[0]?.name ?? null;
  }
  try {
    const decoded = Buffer.from(rest, 'base64url').toString('utf8');
    return decoded || null;
  } catch {
    return null;
  }
}

/** Encode owner name as a URL-safe lead id so detail view always loads the correct lead. */
function leadIdFromOwnerName(ownerName: string): string {
  return 'lead-' + Buffer.from(ownerName, 'utf8').toString('base64url');
}

/** Resolve lead id to owner name: supports "lead-<base64url(ownerName)>" (stable) or legacy "lead-<number>" (offset). */
async function getOwnerNameFromLeadId(id: string, dbPool: Pool): Promise<string | null> {
  const rest = id.replace(/^lead-/, '');
  if (!rest) return null;
  const num = parseInt(rest, 10);
  if (!isNaN(num) && num >= 0 && String(num) === rest) {
    const offset = Math.min(num, 2147483647);
    const rows = await executeQuery(
      dbPool,
      `SELECT DISTINCT OWNER as name FROM prod_acreage_schedule WHERE OWNER IS NOT NULL AND OWNER != '' ORDER BY OWNER LIMIT 1 OFFSET ${offset}`,
      []
    );
    return (rows as any[])[0]?.name ?? null;
  }
  try {
    const decoded = Buffer.from(rest, 'base64url').toString('utf8');
    return decoded || null;
  } catch {
    return null;
  }
}

export const createLeadsRoutes = (dbPool: Pool | null) => {
  const router = Router();

  // Get all leads - shows all owners in the database regardless of section.
  // Owner-related fields: name from OWNER, street from OWNER_STREET, city from OWNER_CITY, state from OWNER_ST, zip from OWNER_ZIP.
  router.get('/api/leads', async (req, res) => {
    try {
      if (!dbPool) {
        return res.status(500).json({ success: false, message: 'Database pool not initialized' });
      }

      const page = parseInt(req.query.page as string) || 1;
      // Default to a very high limit to show all owners, but allow override via query param
      const limit = parseInt(req.query.limit as string) || 10000;
      const offset = (page - 1) * limit;
      const search = (req.query.search as string) || '';

      if (page < 1 || limit < 1 || limit > 100000) {
        return res.status(400).json({
          success: false,
          message: 'Invalid pagination parameters. Page must be >= 1, limit must be between 1 and 100000'
        });
      }

      let searchConditions = '';
      let searchParams: string[] = [];
      
      if (search) {
        // Add wildcards for LIKE query
        const searchPattern = `%${search}%`;
        searchConditions = `
          AND (
            OWNER LIKE ? OR
            CONTACT LIKE ? OR
            CURRENT_UNIT_NAME LIKE ? OR
            PHONE_EMAIL LIKE ? OR
            BUYER LIKE ? OR
            STATUS LIKE ?
          )
        `;
        searchParams = [searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern];
      }

      const countQuery = `
        SELECT COUNT(DISTINCT OWNER) as total
        FROM prod_acreage_schedule
        WHERE OWNER IS NOT NULL AND OWNER != ''
        ${searchConditions}
      `;
      const countResult = await executeQuery(dbPool, countQuery, searchParams);
      const totalCount = countResult[0].total;

      const ownerQuery = `
        SELECT DISTINCT OWNER as name
        FROM prod_acreage_schedule
        WHERE OWNER IS NOT NULL AND OWNER != ''
        ${searchConditions}
        ORDER BY OWNER
        LIMIT ${limit} OFFSET ${offset}
      `;
      const ownerRows = await executeQuery(dbPool, ownerQuery, searchParams);
      const ownerNames = ownerRows.map((r: any) => r.name);
      
      if (ownerNames.length === 0) {
        return res.json({
          data: [],
          pagination: {
            page: page,
            limit: limit,
            total: totalCount,
            totalPages: Math.ceil(totalCount / limit),
            hasNextPage: false,
            hasPrevPage: false,
            nextPage: null,
            prevPage: null
          }
        });
      }
      
      const placeholders = ownerNames.map(() => '?').join(',');
      const query = `
        SELECT
          OWNER as name,
          CONTACT as contact,
          OWNER_STREET as street,
          OWNER_CITY as city,
          OWNER_ST as state,
          OWNER_ZIP as zip,
          PHONE_EMAIL as phoneEmail,
          CURRENT_UNIT_NAME as unitName,
          S_T_R as str,
          COUNTY as county,
          NMA as grossAcres,
          NMA as netMineralAcres,
          ROY as royalty,
          \`CURRENT_ALLO_%\` as allocation_pct,
          \`New_ALLO_%\` as new_allo_pct,
          \`$_NRA\` as nra_cap_usd,
          BUYER as buyer,
          STATUS as status,
          \`OCC_DATE\` as occ_date,
          NEW_OCC_TYPE as occ_type,
          created_at,
          updated_at
        FROM prod_acreage_schedule
        WHERE OWNER IN (${placeholders})
        ORDER BY OWNER, S_T_R, CURRENT_UNIT_NAME
      `;

      const rows = await executeQuery(dbPool, query, ownerNames);
      
      const ownerDataMap = new Map();
      
      rows.forEach((row: any) => {
        const ownerName = row.name;
        if (!ownerDataMap.has(ownerName)) {
          ownerDataMap.set(ownerName, {
            owner: row,
            sections: new Set(),
            units: new Set(),
            grossAcres: 0,
            netMineralAcres: 0,
            netRoyaltyAcres: 0,
            royalty: 0,
            allocationPct: undefined as number | undefined,
            nraCapUsd: null as number | null,
            occTypes: new Set<string>(),
          });
        }
        
        const ownerData = ownerDataMap.get(ownerName);
        if (row.str) {
          ownerData.sections.add(row.str);
        }
        if (row.unitName) {
          ownerData.units.add(row.unitName);
        }
        const nma = parseFloat(row.netMineralAcres) || 0;
        const roy = parseFloat(row.royalty) || 0;
        ownerData.grossAcres = Math.max(ownerData.grossAcres, parseFloat(row.grossAcres) || 0);
        ownerData.netMineralAcres = Math.max(ownerData.netMineralAcres, nma);
        ownerData.netRoyaltyAcres += netRoyaltyAcresFromNmaAndRoy(nma, roy);
        ownerData.royalty = Math.max(ownerData.royalty, roy);
        if (row.allocation_pct != null && row.allocation_pct !== '') {
          const v = parseFloat(row.allocation_pct);
          if (ownerData.allocationPct === undefined) ownerData.allocationPct = v;
          else ownerData.allocationPct = Math.max(ownerData.allocationPct, v);
        }
        if (row.new_allo_pct != null && row.new_allo_pct !== '' && ownerData.allocationPct === undefined) {
          ownerData.allocationPct = parseFloat(row.new_allo_pct);
        }
        if (row.nra_cap_usd != null && row.nra_cap_usd !== '') {
          const v = parseFloat(row.nra_cap_usd);
          if (ownerData.nraCapUsd === null || v > ownerData.nraCapUsd) ownerData.nraCapUsd = v;
        }
        if (row.occ_date != null && ownerData.occDate == null) ownerData.occDate = row.occ_date;
        if (row.occ_type != null && String(row.occ_type).trim() !== '') {
          ownerData.occTypes.add(String(row.occ_type).trim());
        }
      });
      
      const leads = Array.from(ownerDataMap.entries()).map(([ownerName, ownerData]: [string, any], index: number) => {
        const row = ownerData.owner;
        let leadStatus = 'Uncontacted';
        if (row.status === 'DROPPED') leadStatus = 'Dead';
        else if (row.status === 'LVM/TXT/EMAIL') leadStatus = 'Spoke';
        else if (row.status === 'NEW') leadStatus = 'Uncontacted';
        else if (row.status === 'WTL') leadStatus = 'Interested';
        
        const grossAcres = ownerData.grossAcres;
        const royalty = ownerData.royalty;
        const priorityScore = Math.min(100, Math.max(10, (grossAcres * 2) + (royalty * 2)));
        
        const uniqueSections = Array.from(ownerData.sections);
        const uniqueUnits = Array.from(ownerData.units);
        const firstUnitName = uniqueUnits.length > 0 ? uniqueUnits[0] : null;
        const firstStr = uniqueSections.length > 0 ? uniqueSections[0] : null;
        
        return {
          id: leadIdFromOwnerName(ownerName),
          linkedContactId: `contact-${encodeURIComponent(ownerName)}`,
          linkedSectionIds: uniqueSections.map((str: string) => `section-${str}`),
          linkedUnitIds: uniqueUnits.map((unitName: string) => `unit-${unitName}`),
          buyerId: row.buyer?.toLowerCase() || 'unassigned',
          sourceChannel: 'Broker',
          status: leadStatus,
          priorityScore: Math.round(priorityScore),
          lastContactDate: row.updated_at,
          nextFollowUpDate: null,
          notes: `Contact: ${row.contact || 'N/A'}, Phone/Email: ${row.phoneEmail || 'N/A'}`,
          outreachCount: 0,
          documentLinks: [],
          assignmentId: null,
          name: row.name,
          contact: row.contact,
          street: row.street,
          city: row.city,
          state: row.state,
          zip: row.zip,
          phoneEmail: row.phoneEmail,
          unitName: firstUnitName,
          grossAcres: grossAcres,
          netMineralAcres: ownerData.netMineralAcres,
          netRoyaltyAcres: ownerData.netRoyaltyAcres,
          royalty: royalty,
          allocationPct: ownerData.allocationPct,
          nraCapUsd: ownerData.nraCapUsd,
          occDate: ownerData.occDate ?? null,
          occType: ownerData.occType ?? null,
          str: firstStr,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          linkedContact: {
            id: `contact-${encodeURIComponent(ownerName)}`,
            name: row.contact || row.name,
            city: row.city,
            state: row.state,
            street: row.street,
            zip: row.zip,
            phoneEmail: row.phoneEmail
          },
          linkedSections: uniqueSections.map((str: string) => ({
            id: `section-${str}`,
            sectionName: str || 'Unknown Section',
            str: str,
            county: row.county || 'Unknown',
            state: row.state || 'OK'
          })),
          linkedUnits: uniqueUnits.map((unitName: string) => ({
            id: `unit-${unitName}`,
            unitName: unitName,
            county: row.county || 'Unknown',
            state: row.state || 'OK'
          })),
          buyer: {
            id: row.buyer?.toLowerCase() || 'unassigned',
            name: row.buyer || 'Unassigned',
            email: `${row.buyer?.toLowerCase()}@company.com` || 'unassigned@company.com'
          }
        };
      });

      const totalPages = Math.ceil(totalCount / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      res.json({
        data: leads,
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
      console.error('Error fetching leads:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching leads', 
        error: error.message 
      });
    }
  });

  // Get lead call logs - MUST be before /api/leads/:id route
  router.get('/api/leads/:id/call-logs', async (req, res) => {
    try {
      const { id } = req.params;
      console.log(`[LEADS] GET /api/leads/${id}/call-logs requested`);
      
      if (!dbPool) {
        console.log(`[LEADS] Database pool not initialized, returning empty array`);
        return res.json([]);
      }

      // For now, return empty array - call logs can be implemented later
      console.log(`[LEADS] Returning empty call logs array for lead ${id}`);
      res.json([]);
    } catch (error: any) {
      console.error('[LEADS] Error fetching lead call logs:', error);
      res.status(500).json({ error: 'Failed to fetch lead call logs' });
    }
  });

  // Get lead notes - MUST be before /api/leads/:id route
  router.get('/api/leads/:id/notes', async (req, res) => {
    try {
      const { id } = req.params;
      console.log(`[LEADS] GET /api/leads/${id}/notes requested`);
      
      if (!dbPool) {
        console.log(`[LEADS] Database pool not initialized, returning empty array`);
        return res.json([]);
      }

      // For now, return empty array - notes can be implemented later
      console.log(`[LEADS] Returning empty notes array for lead ${id}`);
      res.json([]);
    } catch (error: any) {
      console.error('[LEADS] Error fetching lead notes:', error);
      res.status(500).json({ error: 'Failed to fetch lead notes' });
    }
  });

  // Get sections assigned to a lead (by lead id) - MUST be before /api/leads/:id route
  router.get('/api/leads/:id/sections', async (req, res) => {
    try {
      if (!dbPool) {
        return res.status(500).json({ success: false, message: 'Database pool not initialized' });
      }
      const { id } = req.params;
      const ownerName = await getOwnerNameFromLeadId(id, dbPool);
      if (!ownerName) {
        return res.status(404).json({ success: false, message: 'Lead not found' });
      }

      const rowsQuery = `
        SELECT
          S_T_R as str,
          COUNTY as county,
          OWNER_ST as state,
          NMA as grossAcres,
          NMA as netMineralAcres,
          ROY as royalty,
          BUYER as buyer,
          STATUS as status,
          created_at,
          updated_at
        FROM prod_acreage_schedule
        WHERE OWNER = ?
        ORDER BY S_T_R, created_at
      `;
      const rows = await executeQuery(dbPool, rowsQuery, [ownerName]);

      const sectionMap = new Map<string, any>();
      for (const row of rows) {
        const str = row.str || 'Unknown';
        const key = str;
        if (!sectionMap.has(key)) {
          const status = row.status === 'DROPPED' ? 'Inactive' : (row.status === 'NEW' ? 'Pending' : (row.status === 'LVM/TXT/EMAIL' ? 'Active' : 'Under Review'));
          sectionMap.set(key, {
            id: `section-${key}-${sectionMap.size}`,
            sectionName: str,
            str,
            county: row.county || '',
            state: row.state || 'OK',
            legalDescription: str,
            grossAcres: parseFloat(row.grossAcres) || 0,
            netMineralAcres: parseFloat(row.netMineralAcres) || 0,
            royalty: parseFloat(row.royalty) || 0,
            status,
            assignedBuyerId: row.buyer ? String(row.buyer).toLowerCase().replace(/\s+/g, '-') : undefined,
            assignedBuyerName: row.buyer || 'Unassigned',
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            titleStatus: 'Unmapped',
            heldByFund: false,
            isLocked: false,
          });
        } else {
          const existing = sectionMap.get(key);
          existing.grossAcres = Math.max(existing.grossAcres, parseFloat(row.grossAcres) || 0);
          existing.netMineralAcres = Math.max(existing.netMineralAcres, parseFloat(row.netMineralAcres) || 0);
          if (row.updated_at && (!existing.updatedAt || new Date(row.updated_at) > new Date(existing.updatedAt))) {
            existing.updatedAt = row.updated_at;
          }
        }
      }

      const sections = Array.from(sectionMap.values());
      res.json(sections);
    } catch (error: any) {
      console.error('Error fetching lead sections:', error);
      res.status(500).json({ success: false, message: 'Error fetching lead sections', error: error.message });
    }
  });

  // Get single lead by ID - MUST be last (after all specific routes).
  // Lead id = lead-<base64url(ownerName)> (stable) or legacy lead-<number> (offset). Lookup by OWNER so View always shows the correct lead.
  router.get('/api/leads/:id', async (req, res) => {
    try {
      if (!dbPool) {
        return res.status(500).json({ success: false, message: 'Database pool not initialized' });
      }

      const { id } = req.params;
      const ownerName = await getOwnerNameFromLeadId(id, dbPool);
      if (!ownerName) {
        return res.status(404).json({ success: false, message: 'Lead not found' });
      }

      const query = `
        SELECT
          p.OWNER as name,
          p.CONTACT as contact,
          p.OWNER_STREET as street,
          p.OWNER_CITY as city,
          p.OWNER_ST as state,
          p.OWNER_ZIP as zip,
          p.PHONE_EMAIL as phoneEmail,
          p.CURRENT_UNIT_NAME as unitName,
          p.NEW_UNIT_NAME as newUnitName,
          p.S_T_R as str,
          p.COUNTY as county,
          p.NMA as grossAcres,
          p.NMA as netMineralAcres,
          p.ROY as royalty,
          p.\`CURRENT_ALLO_%\` as allocation_pct,
          p.\`New_ALLO_%\` as new_allo_pct,
          p.\`$_NRA\` as nra_cap_usd,
          p.BUYER as buyer,
          p.STATUS as status,
          p.\`OCC_DATE\` as occ_date,
          (
            SELECT GROUP_CONCAT(DISTINCT TRIM(p2.NEW_OCC_TYPE) ORDER BY TRIM(p2.NEW_OCC_TYPE) SEPARATOR ', ')
            FROM prod_acreage_schedule p2
            WHERE p2.OWNER = p.OWNER
              AND p2.NEW_OCC_TYPE IS NOT NULL
              AND TRIM(p2.NEW_OCC_TYPE) != ''
          ) as occ_type,
          p.created_at,
          p.updated_at
        FROM prod_acreage_schedule p
        WHERE p.OWNER = ?
        ORDER BY p.S_T_R, p.CURRENT_UNIT_NAME
        LIMIT 1
      `;
      const rows = await executeQuery(dbPool, query, [ownerName]);
      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Lead not found' });
      }

      const row = rows[0];
      
      let leadStatus = 'Uncontacted';
      if (row.status === 'DROPPED') leadStatus = 'Dead';
      else if (row.status === 'LVM/TXT/EMAIL') leadStatus = 'Spoke';
      else if (row.status === 'NEW') leadStatus = 'Uncontacted';
      else if (row.status === 'WTL') leadStatus = 'Interested';
      
      const grossAcres = parseFloat(row.grossAcres) || 0;
      const royalty = parseFloat(row.royalty) || 0;
      const priorityScore = Math.min(100, Math.max(10, (grossAcres * 2) + (royalty * 2)));
      
      const lead = {
        id: id,
        linkedContactId: `contact-${encodeURIComponent(ownerName)}`,
        linkedSectionIds: row.unitName ? [`section-${row.unitName}`] : [],
        linkedUnitIds: row.unitName ? [`unit-${row.unitName}`] : [],
        buyerId: row.buyer?.toLowerCase() || 'unassigned',
        sourceChannel: 'Broker',
        status: leadStatus,
        priorityScore: Math.round(priorityScore),
        lastContactDate: row.updated_at,
        nextFollowUpDate: null,
        notes: `Contact: ${row.contact || 'N/A'}, Phone/Email: ${row.phoneEmail || 'N/A'}`,
        outreachCount: 0,
        documentLinks: [],
        assignmentId: null,
        name: row.name,
        contact: row.contact,
        street: row.street,
        city: row.city,
        state: row.state,
        zip: row.zip,
        phoneEmail: row.phoneEmail,
        unitName: row.unitName,
        newUnitName: row.newUnitName ?? null,
        allocationPct: row.allocation_pct != null && row.allocation_pct !== '' ? parseFloat(row.allocation_pct) : null,
        newAlloPct: row.new_allo_pct != null && row.new_allo_pct !== '' ? parseFloat(row.new_allo_pct) : null,
        nraCapUsd: row.nra_cap_usd != null && row.nra_cap_usd !== '' ? parseFloat(row.nra_cap_usd) : null,
        occDate: row.occ_date ?? null,
        occType: row.occ_type ?? null,
        grossAcres: grossAcres,
        netMineralAcres: parseFloat(row.netMineralAcres) || 0,
        royalty: royalty,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        linkedContact: {
          id: `contact-${encodeURIComponent(ownerName)}`,
          name: row.contact || row.name,
          city: row.city,
          state: row.state,
          street: row.street,
          zip: row.zip,
          phoneEmail: row.phoneEmail
        },
        linkedSections: row.str ? [{
          id: `section-${row.str}`,
          sectionName: row.str || 'Unknown Section',
          str: row.str,
          county: row.county || 'Unknown',
          state: row.state || 'OK'
        }] : [],
        linkedUnits: row.unitName ? [{
          id: `unit-${row.unitName}`,
          unitName: row.unitName,
          county: row.county || 'Unknown',
          state: row.state || 'OK'
        }] : [],
        buyer: {
          id: row.buyer?.toLowerCase() || 'unassigned',
          name: row.buyer || 'Unassigned',
          email: `${row.buyer?.toLowerCase()}@company.com` || 'unassigned@company.com'
        }
      };
      
      res.json(lead);
    } catch (error: any) {
      console.error('Error fetching lead:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching lead', 
        error: error.message 
      });
    }
  });

  // Create lead email activity
  router.post('/api/leads/:id/email-activities', async (req, res) => {
    try {
      if (!dbPool) {
        return res.status(500).json({ success: false, message: 'Database pool not initialized' });
      }

      const { id } = req.params;
      const { direction, subject, body, recipientEmail, senderEmail, status, notes } = req.body;
      
      // Get current user from session/request (you may need to adjust this based on your auth setup)
      const userId = (req as any).user?.id || 'system';
      
      const emailActivityId = `email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Insert into communications table
      const insertQuery = `
        INSERT INTO communications (
          id, user_id, lead_id, method, direction, subject, 
          full_message, email_address, outcome, message_snippet, timestamp
        ) VALUES (?, ?, ?, 'Email', ?, ?, ?, ?, ?, ?, NOW())
      `;
      
      const emailAddress = direction === 'Sent' ? recipientEmail : senderEmail;
      const commDirection = direction === 'Sent' ? 'Outbound' : 'Inbound';
      const commStatus = status || (direction === 'Sent' ? 'Sent' : 'Delivered');
      
      await executeQuery(dbPool, insertQuery, [
        emailActivityId,
        userId,
        id,
        commDirection,
        subject || '',
        body || '',
        emailAddress,
        commStatus,
        notes || ''
      ]);
      
      // Fetch the created record
      const fetchQuery = `
        SELECT 
          c.id,
          c.lead_id as leadId,
          c.timestamp as emailDate,
          c.direction,
          c.subject,
          c.full_message as body,
          c.email_address as recipientEmail,
          c.outcome as status,
          c.message_snippet as notes,
          c.user_id as loggedById,
          u.name as logged_by_name,
          u.email as logged_by_email
        FROM communications c
        LEFT JOIN users u ON c.user_id = u.id
        WHERE c.id = ?
      `;
      
      const [createdRow] = await executeQuery(dbPool, fetchQuery, [emailActivityId]);
      
      const emailActivity = {
        id: createdRow.id,
        leadId: createdRow.leadId,
        emailDate: createdRow.emailDate,
        direction: createdRow.direction === 'Outbound' ? 'Sent' : 'Received',
        subject: createdRow.subject,
        body: createdRow.body,
        recipientEmail: createdRow.direction === 'Outbound' ? createdRow.recipientEmail : null,
        senderEmail: createdRow.direction === 'Inbound' ? createdRow.recipientEmail : null,
        status: createdRow.status,
        notes: createdRow.notes,
        loggedById: createdRow.loggedById,
        loggedBy: createdRow.logged_by_name ? {
          id: createdRow.loggedById,
          name: createdRow.logged_by_name,
          email: createdRow.logged_by_email
        } : undefined
      };
      
      res.json(emailActivity);
    } catch (error: any) {
      console.error('Error creating lead email activity:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error creating lead email activity', 
        error: error.message 
      });
    }
  });

  // Get lead email activities
  router.get('/api/leads/:id/email-activities', async (req, res) => {
    try {
      if (!dbPool) {
        return res.status(500).json({ success: false, message: 'Database pool not initialized' });
      }

      const { id } = req.params;
      
      // Query the communications table for email activities linked to this lead
      // Note: If communications table doesn't have data yet, return empty array
      const query = `
        SELECT 
          c.id,
          c.lead_id as leadId,
          c.timestamp as emailDate,
          c.direction,
          c.subject,
          c.full_message as body,
          c.email_address as recipientEmail,
          c.outcome as status,
          c.message_snippet as notes,
          c.user_id as loggedById,
          u.name as logged_by_name,
          u.email as logged_by_email
        FROM communications c
        LEFT JOIN users u ON c.user_id = u.id
        WHERE c.lead_id = ? 
          AND c.method = 'Email'
        ORDER BY c.timestamp DESC
      `;

      const rows = await executeQuery(dbPool, query, [id]).catch(() => []);
      
      const emailActivities = rows.map((row: any) => ({
        id: row.id,
        leadId: row.leadId,
        emailDate: row.emailDate,
        direction: row.direction === 'Outbound' ? 'Sent' : 'Received',
        subject: row.subject,
        body: row.body,
        recipientEmail: row.direction === 'Outbound' ? row.recipientEmail : null,
        senderEmail: row.direction === 'Inbound' ? row.recipientEmail : null,
        status: row.status,
        notes: row.notes,
        loggedById: row.loggedById,
        loggedBy: row.logged_by_name ? {
          id: row.loggedById,
          name: row.logged_by_name,
          email: row.logged_by_email
        } : undefined
      }));
      
      res.json(emailActivities);
    } catch (error: any) {
      console.error('Error fetching lead email activities:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching lead email activities', 
        error: error.message 
      });
    }
  });

  // Create lead email activity
  router.post('/api/leads/:id/email-activities', async (req, res) => {
    try {
      if (!dbPool) {
        return res.status(500).json({ success: false, message: 'Database pool not initialized' });
      }

      const { id } = req.params;
      const { direction, subject, body, recipientEmail, senderEmail, status, notes } = req.body;
      
      // Get current user from session/request (you may need to adjust this based on your auth setup)
      const userId = (req as any).user?.id || 'system';
      
      const emailActivityId = `email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Insert into communications table
      const insertQuery = `
        INSERT INTO communications (
          id, user_id, lead_id, method, direction, subject, 
          full_message, email_address, outcome, message_snippet, timestamp
        ) VALUES (?, ?, ?, 'Email', ?, ?, ?, ?, ?, ?, NOW())
      `;
      
      const emailAddress = direction === 'Sent' ? recipientEmail : senderEmail;
      const commDirection = direction === 'Sent' ? 'Outbound' : 'Inbound';
      const commStatus = status || (direction === 'Sent' ? 'Sent' : 'Delivered');
      
      await executeQuery(dbPool, insertQuery, [
        emailActivityId,
        userId,
        id,
        commDirection,
        subject || '',
        body || '',
        emailAddress,
        commStatus,
        notes || ''
      ]);
      
      // Fetch the created record
      const fetchQuery = `
        SELECT 
          c.id,
          c.lead_id as leadId,
          c.timestamp as emailDate,
          c.direction,
          c.subject,
          c.full_message as body,
          c.email_address as recipientEmail,
          c.outcome as status,
          c.message_snippet as notes,
          c.user_id as loggedById,
          u.name as logged_by_name,
          u.email as logged_by_email
        FROM communications c
        LEFT JOIN users u ON c.user_id = u.id
        WHERE c.id = ?
      `;
      
      const [createdRow] = await executeQuery(dbPool, fetchQuery, [emailActivityId]);
      
      const emailActivity = {
        id: createdRow.id,
        leadId: createdRow.leadId,
        emailDate: createdRow.emailDate,
        direction: createdRow.direction === 'Outbound' ? 'Sent' : 'Received',
        subject: createdRow.subject,
        body: createdRow.body,
        recipientEmail: createdRow.direction === 'Outbound' ? createdRow.recipientEmail : null,
        senderEmail: createdRow.direction === 'Inbound' ? createdRow.recipientEmail : null,
        status: createdRow.status,
        notes: createdRow.notes,
        loggedById: createdRow.loggedById,
        loggedBy: createdRow.logged_by_name ? {
          id: createdRow.loggedById,
          name: createdRow.logged_by_name,
          email: createdRow.logged_by_email
        } : undefined
      };
      
      res.json(emailActivity);
    } catch (error: any) {
      console.error('Error creating lead email activity:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error creating lead email activity', 
        error: error.message 
      });
    }
  });

  return router;
};

