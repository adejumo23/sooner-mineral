import { Router } from 'express';
import type { Pool } from 'mysql2/promise';
import { executeQuery } from '../utils/database.js';

export const createContactsRoutes = (dbPool: Pool | null) => {
  const router = Router();

  // Get all contacts
  router.get('/api/contacts', async (req, res) => {
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
        SELECT COUNT(DISTINCT OWNER) as total
        FROM prod_acreage_schedule
        WHERE OWNER IS NOT NULL AND OWNER != ''
      `;
      const countResult = await executeQuery(dbPool, countQuery);
      const totalCount = countResult[0].total;

      const query = `
        SELECT 
          OWNER as name,
          MAX(CONTACT) as contact,
          MAX(STREET) as street,
          MAX(CITY) as city,
          MAX(ST) as state,
          MAX(ZIP) as zip,
          MAX(PHONE_EMAIL) as phoneEmail,
          MAX(CURRENT_UNIT_NAME) as unitName,
          SUM(CAST(NMA AS DECIMAL(10,2))) as totalNMA,
          MAX(created_at) as created_at,
          MAX(updated_at) as updated_at
        FROM prod_acreage_schedule
        WHERE OWNER IS NOT NULL AND OWNER != ''
        GROUP BY OWNER
        ORDER BY OWNER
        LIMIT ${limit} OFFSET ${offset}
      `;

      const rows = await executeQuery(dbPool, query);
      
      const contacts = rows.map((row: any, index: number) => ({
        id: `contact-${offset + index}`,
        name: row.name,
        contact: row.contact,
        street: row.street,
        city: row.city,
        state: row.state,
        zip: row.zip,
        phoneEmail: row.phoneEmail,
        unitName: row.unitName,
        totalNMA: parseFloat(row.totalNMA) || 0,
        netMineralAcres: parseFloat(row.totalNMA) || 0,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));

      const totalPages = Math.ceil(totalCount / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      res.json({
        data: contacts,
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
      console.error('Error fetching contacts:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching contacts', 
        error: error.message 
      });
    }
  });

  // Contact sub-routes - MUST come before /api/contacts/:id to be matched first
  // Contact tract ownership endpoint
  router.get('/api/contacts/:id/tract-ownership', async (req, res) => {
    try {
      if (!dbPool) {
        return res.status(500).json({ success: false, message: 'Database pool not initialized' });
      }

      const { id } = req.params;
      console.log(`GET /api/contacts/${id}/tract-ownership requested`);
      
      let offset: number;
      if (id.startsWith('contact-')) {
        offset = parseInt(id.replace('contact-', ''));
      } else if (id.startsWith('c')) {
        const contactNumber = parseInt(id.replace('c', ''));
        offset = contactNumber - 1;
      } else {
        return res.status(404).json({ error: 'Invalid contact ID format' });
      }
      
      if (isNaN(offset) || offset < 0) {
        return res.status(404).json({ error: 'Invalid contact ID' });
      }
      
      const allContacts = await executeQuery(dbPool, `
        SELECT DISTINCT OWNER as owner_name
        FROM prod_acreage_schedule 
        WHERE (OWNER IS NOT NULL AND OWNER != '')
        ORDER BY OWNER
        LIMIT 10000
      `);
      
      if (offset >= allContacts.length) {
        return res.json([]);
      }
      
      const ownerName = allContacts[offset].owner_name;
      
      const results = await executeQuery(dbPool, `
        SELECT 
          S_T_R as str,
          MAX(COUNTY) as county,
          MAX(ST) as state,
          SUM(CAST(NMA AS DECIMAL(10,2))) as net_mineral_acres,
          AVG(CAST(ROY AS DECIMAL(5,2))) as royalty_percentage,
          AVG(CAST(ALLO_ AS DECIMAL(5,2))) as ownership_percentage
        FROM prod_acreage_schedule 
        WHERE OWNER = ?
        GROUP BY S_T_R
        ORDER BY S_T_R
      `, [ownerName]);
      
      const tractOwnership = results.map((row: any, index: number) => {
        const sectionId = `s${index + 1}`;
        const sectionName = row.str || 'Unknown Section';
        
        return {
          id: `to${index + 1}`,
          contactId: id,
          sectionId: sectionId,
          tractId: sectionId,
          section: {
            id: sectionId,
            str: row.str,
            county: row.county,
            state: row.state,
            sectionName: sectionName,
            tractName: sectionName
          },
          tract: {
            id: sectionId,
            tractId: sectionId,
            tractName: sectionName,
            str: row.str,
            county: row.county,
            state: row.state
          },
          ownershipPercentage: (parseFloat(row.ownership_percentage) || 0) / 100,
          royaltyPercentage: (parseFloat(row.royalty_percentage) || 0) / 100,
          nma: parseFloat(row.net_mineral_acres) || 0,
          nra: (parseFloat(row.net_mineral_acres) || 0) * ((parseFloat(row.royalty_percentage) || 0) / 100) / 0.125,
          hasActiveLead: false
        };
      });
      
      res.json(tractOwnership);
    } catch (error: any) {
      console.error('Error fetching contact tract ownership:', error);
      res.status(500).json({ error: 'Failed to fetch contact tract ownership' });
    }
  });

  // Contact units endpoint
  router.get('/api/contacts/:id/units', async (req, res) => {
    try {
      if (!dbPool) {
        return res.status(500).json({ success: false, message: 'Database pool not initialized' });
      }

      const { id } = req.params;
      console.log(`GET /api/contacts/${id}/units requested`);
      
      let offset: number;
      if (id.startsWith('contact-')) {
        offset = parseInt(id.replace('contact-', ''));
      } else if (id.startsWith('c')) {
        const contactNumber = parseInt(id.replace('c', ''));
        offset = contactNumber - 1;
      } else {
        return res.status(404).json({ error: 'Invalid contact ID format' });
      }
      
      if (isNaN(offset) || offset < 0) {
        return res.status(404).json({ error: 'Invalid contact ID' });
      }
      
      const allContacts = await executeQuery(dbPool, `
        SELECT DISTINCT OWNER as owner_name
        FROM prod_acreage_schedule 
        WHERE (OWNER IS NOT NULL AND OWNER != '')
        ORDER BY OWNER
        LIMIT 10000
      `);
      
      if (offset >= allContacts.length) {
        return res.json([]);
      }
      
      const ownerName = allContacts[offset].owner_name;
      
      const unitResults = await executeQuery(dbPool, `
        SELECT 
          TRIM(REPLACE(REPLACE(CURRENT_UNIT_NAME, '\r\n', ' '), '\n', ' ')) as unit_name,
          MAX(COUNTY) as county,
          MAX(ST) as state,
          MAX(BUYER) as assigned_buyer,
          SUM(CAST(NMA AS DECIMAL(10,2))) as total_nma,
          COUNT(DISTINCT S_T_R) as section_count
        FROM prod_acreage_schedule 
        WHERE OWNER = ?
          AND CURRENT_UNIT_NAME IS NOT NULL 
          AND CURRENT_UNIT_NAME != ''
          AND TRIM(REPLACE(REPLACE(CURRENT_UNIT_NAME, '\r\n', ' '), '\n', ' ')) != ''
        GROUP BY TRIM(REPLACE(REPLACE(CURRENT_UNIT_NAME, '\r\n', ' '), '\n', ' '))
        ORDER BY unit_name
      `, [ownerName]);
      
      const units = await Promise.all(unitResults.map(async (row: any, index: number) => {
        const unitName = row.unit_name;
        
        const sectionResults = await executeQuery(dbPool, `
          SELECT 
            S_T_R as str,
            MAX(COUNTY) as county,
            MAX(ST) as state,
            SUM(CAST(NMA AS DECIMAL(10,2))) as net_mineral_acres,
            AVG(CAST(ROY AS DECIMAL(5,2))) as royalty_percentage,
            AVG(CAST(ALLO_ AS DECIMAL(5,2))) as ownership_percentage,
            MAX(BUYER) as assigned_buyer
          FROM prod_acreage_schedule 
          WHERE OWNER = ?
            AND TRIM(REPLACE(REPLACE(CURRENT_UNIT_NAME, '\r\n', ' '), '\n', ' ')) = ?
          GROUP BY S_T_R
          ORDER BY S_T_R
        `, [ownerName, unitName]);
        
        const sections = sectionResults.map((sectionRow: any, sectionIndex: number) => {
          const sectionId = `s${sectionIndex + 1}`;
          const sectionName = sectionRow.str || 'Unknown Section';
          
          return {
            id: `tos${sectionIndex + 1}`,
            contactId: id,
            sectionId: sectionId,
            section: {
              id: sectionId,
              str: sectionRow.str,
              county: sectionRow.county,
              state: sectionRow.state,
              sectionName: sectionName,
              tractName: sectionName
            },
            ownershipPercentage: (parseFloat(sectionRow.ownership_percentage) || 0) / 100,
            royaltyPercentage: (parseFloat(sectionRow.royalty_percentage) || 0) / 100,
            nma: parseFloat(sectionRow.net_mineral_acres) || 0,
            nra: (parseFloat(sectionRow.net_mineral_acres) || 0) * ((parseFloat(sectionRow.royalty_percentage) || 0) / 100) / 0.125,
            hasActiveLead: false,
            status: sectionRow.assigned_buyer ? 'Assigned' : 'Unassigned',
            assignedBuyer: sectionRow.assigned_buyer ? { name: sectionRow.assigned_buyer } : null
          };
        });
        
        let unitStatus = 'Active';
        if (sections.some((s: any) => s.status === 'Assigned')) {
          unitStatus = 'Producing';
        }
        
        const totalNRA = sections.reduce((sum: number, s: any) => sum + (s.nra || 0), 0);
        
        return {
          id: `unit-${index + 1}`,
          unitId: `unit-${index + 1}`,
          unitName: unitName,
          operator: 'Unknown',
          county: row.county || 'Unknown',
          state: row.state || 'OK',
          formation: 'Unknown',
          totalNMA: parseFloat(row.total_nma) || 0,
          totalNRA: totalNRA,
          sectionCount: parseInt(row.section_count) || sections.length,
          sections: sections,
          hasActiveLead: false,
          assignedBuyer: row.assigned_buyer ? { name: row.assigned_buyer } : null,
          status: unitStatus
        };
      }));
      
      res.json(units);
    } catch (error: any) {
      console.error('Error fetching contact units:', error);
      res.status(500).json({ error: 'Failed to fetch contact units' });
    }
  });

  // Contact leads endpoint
  router.get('/api/contacts/:id/leads', async (req, res) => {
    try {
      const { id } = req.params;
      console.log(`GET /api/contacts/${id}/leads requested`);
      res.json([]);
    } catch (error: any) {
      console.error('Error fetching contact leads:', error);
      res.status(500).json({ error: 'Failed to fetch contact leads' });
    }
  });

  // Contact call logs endpoint
  router.get('/api/contacts/:id/call-logs', async (req, res) => {
    try {
      const { id } = req.params;
      console.log(`GET /api/contacts/${id}/call-logs requested`);
      res.json([]);
    } catch (error: any) {
      console.error('Error fetching contact call logs:', error);
      res.status(500).json({ error: 'Failed to fetch contact call logs' });
    }
  });

  // Contact documents endpoint
  router.get('/api/contacts/:id/documents', async (req, res) => {
    try {
      const { id } = req.params;
      console.log(`GET /api/contacts/${id}/documents requested`);
      res.json([]);
    } catch (error: any) {
      console.error('Error fetching contact documents:', error);
      res.status(500).json({ error: 'Failed to fetch contact documents' });
    }
  });

  // Contact distress signals endpoint
  router.get('/api/contacts/:id/distress-signals', async (req, res) => {
    try {
      const { id } = req.params;
      console.log(`GET /api/contacts/${id}/distress-signals requested`);
      res.json([]);
    } catch (error: any) {
      console.error('Error fetching contact distress signals:', error);
      res.status(500).json({ error: 'Failed to fetch contact distress signals' });
    }
  });

  // Contact detail endpoint - MUST come after all sub-routes
  router.get('/api/contacts/:id', async (req, res) => {
    try {
      if (!dbPool) {
        return res.status(500).json({ success: false, message: 'Database pool not initialized' });
      }

      const { id } = req.params;
      console.log(`GET /api/contacts/${id} requested`);
      
      let offset: number;
      if (id.startsWith('contact-')) {
        offset = parseInt(id.replace('contact-', ''));
      } else if (id.startsWith('c')) {
        const contactNumber = parseInt(id.replace('c', ''));
        offset = contactNumber - 1;
      } else {
        return res.status(404).json({ error: 'Invalid contact ID format' });
      }
      
      if (isNaN(offset) || offset < 0) {
        return res.status(404).json({ error: 'Invalid contact ID' });
      }
      
      const allResults = await executeQuery(dbPool, `
        SELECT 
          OWNER as owner_name,
          MAX(CONTACT) as contact_info,
          MAX(PHONE_EMAIL) as phone_email,
          MAX(STREET) as street,
          MAX(CITY) as city,
          MAX(ST) as state,
          MAX(ZIP) as zip,
          SUM(CAST(NMA AS DECIMAL(10,2))) as total_net_mineral_acres
        FROM prod_acreage_schedule 
        WHERE (OWNER IS NOT NULL AND OWNER != '')
        GROUP BY OWNER
        ORDER BY OWNER
        LIMIT 10000
      `);
      
      if (offset >= allResults.length) {
        return res.status(404).json({ error: 'Contact not found' });
      }
      
      const row = allResults[offset];
      
      let phone = '';
      let email = '';
      if (row.phone_email) {
        const parts = String(row.phone_email).split(' - ');
        if (parts.length >= 2) {
          phone = parts[0].trim();
          email = parts[1].trim();
        } else {
          phone = String(row.phone_email).trim();
        }
      }
      
      const contact = {
        id: id,
        name: row.owner_name || 'Unknown Owner',
        email: email || '',
        phone: phone || '',
        address: row.street || '',
        city: row.city || 'Unknown',
        state: row.state || 'Unknown',
        zipCode: row.zip || '',
        contactType: 'Landowner',
        netMineralAcres: parseFloat(row.total_net_mineral_acres) || 0,
        totalNMA: parseFloat(row.total_net_mineral_acres) || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      res.json(contact);
    } catch (error: any) {
      console.error('Error fetching contact:', error);
      res.status(500).json({ error: 'Failed to fetch contact' });
    }
  });

  return router;
};

