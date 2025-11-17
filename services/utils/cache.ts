import type { Pool } from 'mysql2/promise';
import { executeQuery } from './database.js';

const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

let assignmentCache: any[] | null = null;
let cacheTimestamp: number | null = null;
let cacheLoading = false;

const simplifyContactName = (name: string): string => {
  if (!name) return 'Unknown Contact';
  
  let simplified = name.split('>')[0].split('a/k/a')[0].trim();
  simplified = simplified.replace(/\s*,\s*$/, '');
  simplified = simplified.replace(/\s+HEIRS:.*$/, '');
  simplified = simplified.replace(/\s+et\s+al.*$/, '');
  
  if (simplified.length > 50) {
    simplified = simplified.substring(0, 47) + '...';
  }
  
  return simplified;
};

export const loadAssignmentCache = async (dbPool: Pool | null) => {
  try {
    if (!dbPool) {
      throw new Error('Database pool not initialized');
    }

    console.log('🔄 Loading assignment cache...');
    
    const query = `
      SELECT DISTINCT
        OWNER as contactName,
        CURRENT_UNIT_NAME as unitName,
        NMA as grossAcres,
        NMA as netMineralAcres,
        ROY as royalty,
        NMA as nra,
        ALLO_ as ownershipPercentage,
        BUYER as buyer,
        STATUS as status,
        created_at,
        updated_at
      FROM prod_acreage_schedule
      WHERE OWNER IS NOT NULL AND OWNER != ''
        AND BUYER IS NOT NULL AND BUYER != ''
      ORDER BY 
        CASE 
          WHEN BUYER = 'MICHELLE' THEN 0
          WHEN BUYER = 'JOSH' THEN 1
          ELSE 2
        END,
        OWNER,
        CURRENT_UNIT_NAME
    `;

    const rows = await executeQuery(dbPool, query);
    
    assignmentCache = rows.map((row: any, index: number) => {
      const assetType = row.unitName ? 'Unit' : 'Tract';
      const assetId = row.unitName || `Tract-${row.contactName}-${index}`;
      
      const grossAcres = parseFloat(row.grossAcres) || 0;
      const royalty = parseFloat(row.royalty) || 0;
      const priorityScore = Math.min(100, Math.max(10, (grossAcres * 2) + (royalty * 2)));
      
      let assignmentStatus = 'Active';
      if (row.status === 'DROPPED') assignmentStatus = 'Cancelled';
      else if (row.status === 'LVM/TXT/EMAIL') assignmentStatus = 'Active';
      else if (row.status === 'NEW') assignmentStatus = 'Active';
      else if (row.status === 'WTL') assignmentStatus = 'Active';
      
      return {
        id: `assignment-${index}`,
        assetType: assetType,
        assetId: assetId,
        assignedBuyerId: row.buyer || 'unassigned',
        priceCapUsd: Math.round(grossAcres * 1000),
        priceCapType: 'Per Acre',
        sourceChannel: 'Broker',
        priorityScore: Math.round(priorityScore),
        status: assignmentStatus,
        notes: `Contact: ${simplifyContactName(row.contactName)}`,
        assignedDate: row.created_at,
        assignedById: 'system',
        updatedAt: row.updated_at,
        assignedBuyer: {
          id: row.buyer?.toLowerCase() || 'unassigned',
          name: row.buyer || 'Unassigned',
          email: `${row.buyer?.toLowerCase()}@company.com` || 'unassigned@company.com'
        },
        asset: {
          id: assetId,
          sectionName: row.unitName || `Section ${index + 1}`,
          unitName: row.unitName,
          grossAcres: grossAcres,
          netMineralAcres: parseFloat(row.netMineralAcres) || 0,
          royalty: royalty
        }
      };
    });

    cacheTimestamp = Date.now();
    console.log(`✅ Assignment cache loaded with ${assignmentCache.length} assignments`);
    
  } catch (error) {
    console.error('❌ Error loading assignment cache:', error);
    throw error;
  }
};

export const getCachedAssignments = async (dbPool: Pool | null) => {
  const now = Date.now();
  
  if (!assignmentCache || !cacheTimestamp || (now - cacheTimestamp) > CACHE_DURATION) {
    if (cacheLoading) {
      while (cacheLoading) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return assignmentCache;
    }
    
    cacheLoading = true;
    try {
      await loadAssignmentCache(dbPool);
    } finally {
      cacheLoading = false;
    }
  }
  
  return assignmentCache;
};

