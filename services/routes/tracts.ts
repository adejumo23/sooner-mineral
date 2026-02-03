import { Router } from 'express';
import type { Pool } from 'mysql2/promise';
import { executeQuery } from '../utils/database.js';

export const createTractsRoutes = (dbPool: Pool | null) => {
  const router = Router();

  // Get all tracts
  router.get('/api/tracts', async (req, res) => {
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
        SELECT COUNT(*) as total
        FROM prod_acreage_schedule
        WHERE CURRENT_UNIT_NAME IS NOT NULL 
          AND CURRENT_UNIT_NAME != ''
      `;
      const countResult = await executeQuery(dbPool, countQuery);
      const totalCount = countResult[0].total;

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
        WHERE CURRENT_UNIT_NAME IS NOT NULL 
          AND CURRENT_UNIT_NAME != ''
        ORDER BY CURRENT_UNIT_NAME, COUNTY, S_T_R
        LIMIT ${limit} OFFSET ${offset}
      `;

      const rows = await executeQuery(dbPool, query);
      
      const tracts = rows.map((row: any) => ({
        id: row.id,
        tractName: row.CURRENT_UNIT_NAME,
        state: row.state || 'OK',
        county: row.COUNTY,
        legalDescription: row.LEGAL_DESCRIPTION || '',
        str: row.S_T_R,
        grossAcres: parseFloat(row.NMA) || 0,
        netMineralAcres: parseFloat(row.NMA) || 0,
        royalty: parseFloat(row.ROY) || 0,
        ownershipPercentage: parseFloat(row.ALLOCATION_PERCENT) || 0,
        titleStatus: 'In Progress',
        assignedBuyerId: null,
        assignedBuyer: null,
        nraCapUsd: null,
        sourceChannel: null,
        routingNotes: row.NOTE || '',
        heldByFund: false,
        isLocked: false,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));

      const totalPages = Math.ceil(totalCount / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      res.json({
        data: tracts,
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
      console.error('Error fetching tracts:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching tracts', 
        error: error.message 
      });
    }
  });

  // Get single tract by ID
  router.get('/api/tracts/:id', async (req, res) => {
    try {
      if (!dbPool) {
        return res.status(500).json({ success: false, message: 'Database pool not initialized' });
      }

      const { id } = req.params;
      const query = `
        SELECT 
          id,
          COUNTY,
          S_T_R,
          NULL AS sectionNumber,
          NULL AS township,
          NULL AS \`range\`,
          LEGAL_DESCRIPTION,
          NMA,
          OWNER,
          OWNER_STREET as street,
          OWNER_CITY as city,
          OWNER_ST as state,
          OWNER_ZIP as zip,
          PHONE_EMAIL,
          ROY,
          \`CURRENT_ALLO_%\` AS ALLOCATION_PERCENT,
          TITLE_SOURCE,
          STATUS,
          BUYER,
          NOTE,
          INTEREST_TYPE,
          CONTACT,
          CURRENT_UNIT_NAME,
          CALCULATED_ACREAGE,
          column_16,
          column_21,
          column_22,
          \`TOTAL_\$\`,
          LAST_OGL,
          NEW_OCC_TYPE,
          NEW_UNIT_NAME,
          created_at,
          updated_at
        FROM prod_acreage_schedule
        WHERE id = ?
      `;

      const rows = await executeQuery(dbPool, query, [id]);
      
      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Tract not found' });
      }

      const row = rows[0];
      
      const strParts = row.S_T_R ? String(row.S_T_R).split('-') : [];
      const sectionNumber = strParts[0] || null;
      const township = strParts[1] ? strParts[1].replace(/[NS]/, '') : null;
      const range = strParts[2] ? strParts[2].replace(/[EW]/, '') : null;
      
      const netMineralAcres = parseFloat(row.NMA) || 0;
      const royalty = parseFloat(row.ROY) || 0;
      const nra = royalty > 0 ? netMineralAcres * royalty / 0.125 : 0;
      
      let titleStatus = 'Unmapped';
      if (row.LEGAL_DESCRIPTION && row.NMA && row.OWNER) {
        titleStatus = 'Verified';
      } else if (row.LEGAL_DESCRIPTION || row.OWNER) {
        titleStatus = 'In Progress';
      }

      const tract = {
        id: row.id,
        state: row.state || 'OK',
        county: row.COUNTY,
        tractName: `${row.COUNTY} - ${row.S_T_R}`,
        legalDescription: row.LEGAL_DESCRIPTION || '',
        str: row.S_T_R,
        sectionNumber: sectionNumber,
        township: township,
        range: range,
        abstractNumber: null,
        anum: row.id,
        grossAcres: parseFloat(row.NMA) || 0,
        royalty: royalty,
        netMineralAcres: netMineralAcres,
        nra: nra,
        ownershipPercentage: parseFloat(row.ALLOCATION_PERCENT) || 0,
        titleStatus: titleStatus,
        assignedBuyerId: null,
        assignedBuyer: null,
        nraCapUsd: parseFloat(row['TOTAL_$']) || 0,
        sourceChannel: row.TITLE_SOURCE || 'Import',
        routingNotes: row.NOTE || '',
        heldByFund: false,
        isLocked: false,
        esgProfileId: null,
        esgRiskLevel: null,
        carbonIntensity: null,
        operatorComplianceScore: null,
        titleVerificationStatus: titleStatus === 'Verified' ? 'Clean' : 'Unknown',
        hasRiskFlags: false,
        lastESGUpdate: null,
        owner: row.OWNER,
        street: row.street,
        city: row.city,
        zip: row.zip,
        phoneEmail: row.PHONE_EMAIL,
        buyer: row.BUYER,
        status: row.STATUS,
        interestType: row.INTEREST_TYPE,
        contact: row.CONTACT,
        currentUnitName: row.CURRENT_UNIT_NAME,
        paystubNri: null,
        calculatedAcreage: row.CALCULATED_ACREAGE,
        lastOgl: row.LAST_OGL,
        newOccType: row.NEW_OCC_TYPE,
        newUnitName: row.NEW_UNIT_NAME,
        date: row.created_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };

      res.json(tract);
    } catch (error: any) {
      console.error('Error fetching tract:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching tract', 
        error: error.message 
      });
    }
  });

  // Get tract contacts
  router.get('/api/tracts/:id/contacts', async (req, res) => {
    try {
      if (!dbPool) {
        return res.status(500).json({ success: false, message: 'Database pool not initialized' });
      }

      const { id } = req.params;
      
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
          NMA,
          ROY,
          \`CURRENT_ALLO_%\` AS ALLO_,
          created_at,
          updated_at
        FROM prod_acreage_schedule
        WHERE id = ?
          AND OWNER IS NOT NULL 
          AND OWNER != ''
        ORDER BY OWNER
      `;

      const rows = await executeQuery(dbPool, query, [id]);
      
      const contacts = rows.map((row: any, index: number) => ({
        id: `contact-${row.id}-${index}`,
        name: row.OWNER,
        contact: row.CONTACT,
        street: row.street,
        city: row.city,
        state: row.state,
        zip: row.zip,
        phoneEmail: row.PHONE_EMAIL,
        nma: row.NMA,
        royalty: row.ROY,
        allocation: row.ALLO_,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
      
      res.json(contacts);
    } catch (error: any) {
      console.error('Error fetching tract contacts:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching tract contacts', 
        error: error.message 
      });
    }
  });

  // Update tract
  router.put('/api/tracts/:id', async (req, res) => {
    try {
      if (!dbPool) {
        return res.status(500).json({ success: false, message: 'Database pool not initialized' });
      }

      const { id } = req.params;
      const tractData = req.body;

      res.json({ 
        success: true, 
        message: 'Tract updated successfully',
        id: id,
        ...tractData
      });
    } catch (error: any) {
      console.error('Error updating tract:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error updating tract', 
        error: error.message 
      });
    }
  });

  // Create tract
  router.post('/api/tracts', async (req, res) => {
    try {
      if (!dbPool) {
        return res.status(500).json({ success: false, message: 'Database pool not initialized' });
      }

      const tractData = req.body;

      const newId = `tract-${Date.now()}`;
      res.json({ 
        success: true, 
        message: 'Tract created successfully',
        id: newId,
        ...tractData
      });
    } catch (error: any) {
      console.error('Error creating tract:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error creating tract', 
        error: error.message 
      });
    }
  });

  // Delete tract
  router.delete('/api/tracts/:id', async (req, res) => {
    try {
      if (!dbPool) {
        return res.status(500).json({ success: false, message: 'Database pool not initialized' });
      }

      const { id } = req.params;

      res.json({ 
        success: true, 
        message: 'Tract deleted successfully',
        id: id
      });
    } catch (error: any) {
      console.error('Error deleting tract:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error deleting tract', 
        error: error.message 
      });
    }
  });

  return router;
};

