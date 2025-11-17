import { Router } from 'express';
import type { Pool } from 'mysql2/promise';
import { executeQuery } from '../utils/database.js';

export const createPricingRoutes = (dbPool: Pool | null) => {
  const router = Router();

  // Get Oklahoma pricing data
  router.get('/api/pricing/oklahoma', async (req, res) => {
    try {
      if (!dbPool) {
        return res.status(500).json({ success: false, message: 'Database pool not initialized' });
      }

      const query = `
        SELECT 
          id,
          County,
          SEC,
          TWN,
          RNG,
          T_R,
          S_T_R,
          SEC_2,
          TWN_2,
          RNG_3,
          STR,
          Play,
          WDFD_Curve,
          MRMC_Curve,
          SPGR_Curve,
          SYC_Curve,
          OSG_Curve,
          Acquisition_Area,
          Type_Curve_Price,
          Unit_Price,
          Play AS Basin,
          'Oklahoma Survey' AS Survey_Company,
          Play AS Formation,
          CAST(Unit_Price AS DECIMAL(10,2)) AS Price_Per_Acre,
          created_at,
          updated_at
        FROM prod_oklahoma_pricing
        WHERE Unit_Price IS NOT NULL AND Unit_Price != '' AND Unit_Price != '0'
        ORDER BY CAST(Unit_Price AS DECIMAL(10,2)) DESC
        LIMIT 500
      `;

      const rows = await executeQuery(dbPool, query);
      res.json({ success: true, data: rows });
    } catch (error: any) {
      console.error('Error fetching Oklahoma pricing:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching Oklahoma pricing data', 
        error: error.message 
      });
    }
  });

  // Get Texas pricing data
  router.get('/api/pricing/texas', async (req, res) => {
    try {
      if (!dbPool) {
        return res.status(500).json({ success: false, message: 'Database pool not initialized' });
      }

      const query = `
        SELECT 
          id,
          Unique_ID,
          Basin,
          County,
          FIP_ID,
          Abstract,
          Section,
          Block,
          Survey,
          ANUM,
          State_Land_,
          Upper_Spraberry,
          Lower_Spraberry,
          3rd_Bone_Spring,
          Wolfcamp_A,
          Wolfcamp_B,
          Lower_Wolfcamp_B,
          Wolfcamp_D_Cline_,
          column_17,
          Output_Price,
          column_19,
          Total_BOE_Acre,
          Total_BOE_per_ANUM,
          Letter_Rank_NEW_VALUES_,
          NRA_Price,
          Survey AS Survey_Company,
          'Texas Formation' AS Formation,
          CAST(Output_Price AS DECIMAL(10,2)) AS Price_Per_Acre,
          created_at,
          updated_at
        FROM prod_texas_pricing
        WHERE Output_Price IS NOT NULL AND Output_Price != '' AND Output_Price != '0'
        ORDER BY CAST(Output_Price AS DECIMAL(10,2)) DESC
        LIMIT 500
      `;

      const rows = await executeQuery(dbPool, query);
      res.json({ success: true, data: rows });
    } catch (error: any) {
      console.error('Error fetching Texas pricing:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching Texas pricing data', 
        error: error.message 
      });
    }
  });

  return router;
};

