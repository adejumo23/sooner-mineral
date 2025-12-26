import { Router } from 'express';
import type { Pool } from 'mysql2/promise';
import { executeQuery } from '../utils/database.js';

export const createLeadsRoutes = (dbPool: Pool | null) => {
  const router = Router();

  // Get all leads - shows all owners in the database regardless of section
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
          STREET as street,
          CITY as city,
          ST as state,
          ZIP as zip,
          PHONE_EMAIL as phoneEmail,
          CURRENT_UNIT_NAME as unitName,
          S_T_R as str,
          COUNTY as county,
          NMA as grossAcres,
          NMA as netMineralAcres,
          ROY as royalty,
          BUYER as buyer,
          STATUS as status,
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
            royalty: 0
          });
        }
        
        const ownerData = ownerDataMap.get(ownerName);
        if (row.str) {
          ownerData.sections.add(row.str);
        }
        if (row.unitName) {
          ownerData.units.add(row.unitName);
        }
        ownerData.grossAcres = Math.max(ownerData.grossAcres, parseFloat(row.grossAcres) || 0);
        ownerData.netMineralAcres = Math.max(ownerData.netMineralAcres, parseFloat(row.netMineralAcres) || 0);
        ownerData.royalty = Math.max(ownerData.royalty, parseFloat(row.royalty) || 0);
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
        
        return {
          id: `lead-${offset + index}`,
          linkedContactId: `contact-${offset + index}`,
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
          royalty: royalty,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          linkedContact: {
            id: `contact-${offset + index}`,
            name: row.name,
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

  // Get single lead by ID
  router.get('/api/leads/:id', async (req, res) => {
    try {
      if (!dbPool) {
        return res.status(500).json({ success: false, message: 'Database pool not initialized' });
      }

      const { id } = req.params;
      const leadIndex = parseInt(id.replace('lead-', ''));
      
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
          COUNTY as county,
          NMA as grossAcres,
          NMA as netMineralAcres,
          ROY as royalty,
          BUYER as buyer,
          STATUS as status,
          created_at,
          updated_at
        FROM prod_acreage_schedule
        WHERE OWNER IS NOT NULL AND OWNER != ''
        ORDER BY OWNER
        LIMIT 1 OFFSET ${leadIndex}
      `;

      const rows = await executeQuery(dbPool, query);
      
      if (rows.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Lead not found' 
        });
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
        linkedContactId: `contact-${leadIndex}`,
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
        grossAcres: grossAcres,
        netMineralAcres: parseFloat(row.netMineralAcres) || 0,
        royalty: royalty,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        linkedContact: {
          id: `contact-${leadIndex}`,
          name: row.name,
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

  // Get lead sections
  router.get('/api/leads/:id/sections', async (req, res) => {
    try {
      if (!dbPool) {
        return res.status(500).json({ success: false, message: 'Database pool not initialized' });
      }

      const { id } = req.params;
      const leadIndex = parseInt(id.replace('lead-', ''));
      
      const leadQuery = `
        SELECT DISTINCT
          OWNER as name,
          CURRENT_UNIT_NAME as unitName,
          BUYER as buyer,
          STATUS as status,
          created_at,
          updated_at
        FROM prod_acreage_schedule
        WHERE OWNER IS NOT NULL AND OWNER != ''
        ORDER BY OWNER
        LIMIT 1 OFFSET ${leadIndex}
      `;

      const leadRows = await executeQuery(dbPool, leadQuery);
      
      if (leadRows.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Lead not found' 
        });
      }

      const leadRow = leadRows[0];
      
      const sectionsQuery = `
        SELECT DISTINCT
          CURRENT_UNIT_NAME as sectionName,
          COUNTY as county,
          ST as state,
          S_T_R as str,
          NMA as grossAcres,
          NMA as netMineralAcres,
          ROY as royalty,
          BUYER as assignedBuyerId,
          STATUS as status,
          created_at,
          updated_at
        FROM prod_acreage_schedule
        WHERE OWNER = ? 
          AND CURRENT_UNIT_NAME IS NOT NULL 
          AND CURRENT_UNIT_NAME != ''
        ORDER BY CURRENT_UNIT_NAME
      `;

      const sectionRows = await executeQuery(dbPool, sectionsQuery, [leadRow.name]);
      
      const sections = sectionRows.map((row: any, index: number) => ({
        id: `section-${leadIndex}-${index}`,
        sectionName: row.sectionName,
        county: row.county,
        state: row.state || 'OK',
        str: row.str,
        legalDescription: row.sectionName || '',
        grossAcres: parseFloat(row.grossAcres) || 0,
        netMineralAcres: parseFloat(row.netMineralAcres) || 0,
        royalty: parseFloat(row.royalty) || 0,
        assignedBuyerId: row.assignedBuyerId?.toLowerCase() || 'unassigned',
        assignedBuyerName: row.assignedBuyerId || 'Unassigned',
        titleStatus: 'Not Verified',
        heldByFund: false,
        isLocked: false,
        status: row.status === 'DROPPED' ? 'Inactive' : 
                row.status === 'LVM/TXT/EMAIL' ? 'Active' :
                row.status === 'NEW' ? 'Pending' :
                row.status === 'WTL' ? 'Under Review' : 'Pending',
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
      
      res.json(sections);
    } catch (error: any) {
      console.error('Error fetching lead sections:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching lead sections', 
        error: error.message 
      });
    }
  });

  // Get lead notes
  router.get('/api/leads/:id/notes', async (req, res) => {
    try {
      if (!dbPool) {
        return res.status(500).json({ success: false, message: 'Database pool not initialized' });
      }

      const { id } = req.params;
      const leadIndex = parseInt(id.replace('lead-', ''));
      
      const leadQuery = `
        SELECT DISTINCT
          OWNER as name,
          CURRENT_UNIT_NAME as unitName,
          BUYER as buyer,
          STATUS as status,
          created_at,
          updated_at
        FROM prod_acreage_schedule
        WHERE OWNER IS NOT NULL AND OWNER != ''
        ORDER BY OWNER
        LIMIT 1 OFFSET ${leadIndex}
      `;

      const leadRows = await executeQuery(dbPool, leadQuery);
      
      if (leadRows.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Lead not found' 
        });
      }

      const notesQuery = `
        SELECT 
          ln.id,
          ln.lead_id,
          ln.note_text,
          ln.note_type,
          ln.created_by_id,
          ln.created_at,
          u.name as created_by_name,
          u.email as created_by_email
        FROM lead_notes ln
        LEFT JOIN users u ON ln.created_by_id = u.id
        WHERE ln.lead_id = ?
        ORDER BY ln.created_at DESC
      `;

      const notesRows = await executeQuery(dbPool, notesQuery, [`lead${leadIndex + 1}`]);
      
      const notes = notesRows.map((row: any, index: number) => ({
        id: row.id,
        leadId: row.lead_id,
        noteText: row.note_text,
        noteType: row.note_type || 'General',
        createdBy: row.created_by_id,
        createdAt: row.created_at,
        createdByUser: {
          id: row.created_by_id,
          name: row.created_by_name || 'Unknown User',
          email: row.created_by_email || 'unknown@company.com'
        }
      }));
      
      res.json(notes);
    } catch (error: any) {
      console.error('Error fetching lead notes:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching lead notes', 
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

