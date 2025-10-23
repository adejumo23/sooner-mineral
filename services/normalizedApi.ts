// ============================================================================
// NORMALIZED API SERVICE
// ============================================================================
// This service uses the normalized database structure to provide data to the application
// It replaces the mock data with real database queries

const apiDelay = 500;

// Database connection configuration
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'sooner_mineral_db'
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// Import database connection
import { db } from './database';

// Execute database query
const executeQuery = async (query: string, params: any[] = []): Promise<any[]> => {
  try {
    const [rows] = await db.execute(query, params);
    return rows;
  } catch (error) {
    console.error('Database query error:', error);
    return [];
  }
};

// ============================================================================
// NORMALIZED TRACT FUNCTIONS
// ============================================================================

// Get all sections using normalized database structure
export const fetchSections = async (filters?: {
  state?: string;
  county?: string;
  status?: string;
  buyer?: string;
  limit?: number;
  offset?: number;
}): Promise<any[]> => {
  const query = `
    SELECT 
      p.id as tract_id,
      s.code as state,
      c.name as county,
      CONCAT(s.code, '-', c.name, '-', COALESCE(sec.section_number, 'Unknown')) as tract_name,
      p.legal_description,
      CONCAT(COALESCE(sec.section_number, ''), '-', COALESCE(sec.township, ''), '-', COALESCE(sec.range, '')) as str,
      a.abstract_number,
      p.gross_acres,
      SUM(mi.net_mineral_acres) as total_net_mineral_acres,
      COUNT(DISTINCT mi.owner_id) as number_of_owners,
      ast.name as acquisition_status,
      u.name as assigned_buyer,
      at.last_contact_date,
      at.next_follow_up_date,
      p.created_at,
      p.updated_at
    FROM properties p
    JOIN counties c ON p.county_id = c.id
    JOIN states s ON c.state_id = s.id
    LEFT JOIN sections sec ON p.section_id = sec.id
    LEFT JOIN abstracts a ON p.abstract_id = a.id
    LEFT JOIN mineral_interests mi ON p.id = mi.property_id
    LEFT JOIN acquisition_tracking at ON mi.id = at.mineral_interest_id
    LEFT JOIN acquisition_status_types ast ON at.acquisition_status_id = ast.id
    LEFT JOIN users u ON at.buyer_id = u.id
    WHERE 1=1
      AND (? IS NULL OR s.code = ?)
      AND (? IS NULL OR c.name = ?)
      AND (? IS NULL OR ast.name = ?)
      AND (? IS NULL OR u.id = ?)
    GROUP BY p.id, s.code, c.name, p.legal_description, sec.section_number, 
             sec.township, sec.range, a.abstract_number, p.gross_acres,
             ast.name, u.name, at.last_contact_date, at.next_follow_up_date,
             p.created_at, p.updated_at
    ORDER BY p.updated_at DESC
    LIMIT ? OFFSET ?
  `;

  const params = [
    filters?.state || null, filters?.state || null,
    filters?.county || null, filters?.county || null,
    filters?.status || null, filters?.status || null,
    filters?.buyer || null, filters?.buyer || null,
    filters?.limit || 50,
    filters?.offset || 0
  ];

  const results = await executeQuery(query, params);
  
  // Transform the results to match the expected format
  return results.map(row => ({
    id: row.tract_id,
    state: row.state,
    county: row.county,
    tractName: row.tract_name,
    legalDescription: row.legal_description,
    str: row.str,
    abstractNumber: row.abstract_number,
    grossAcres: row.gross_acres,
    netMineralAcres: row.total_net_mineral_acres,
    numberOfOwners: row.number_of_owners,
    titleStatus: row.acquisition_status,
    assignedBuyerId: row.assigned_buyer,
    lastContactDate: row.last_contact_date,
    nextFollowUpDate: row.next_follow_up_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
};

// Get single tract details
export const fetchTract = async (id: string): Promise<any> => {
  const query = `
    SELECT 
      p.id as tract_id,
      s.code as state,
      c.name as county,
      CONCAT(s.code, '-', c.name, '-', COALESCE(sec.section_number, 'Unknown')) as tract_name,
      p.legal_description,
      CONCAT(COALESCE(sec.section_number, ''), '-', COALESCE(sec.township, ''), '-', COALESCE(sec.range, '')) as str,
      a.abstract_number,
      p.unique_id as anum,
      p.gross_acres,
      p.is_state_land,
      -- Mineral interest summary
      COUNT(DISTINCT mi.owner_id) as number_of_owners,
      SUM(mi.net_mineral_acres) as total_net_mineral_acres,
      AVG(mi.royalty_percentage) as avg_royalty_percentage,
      SUM(mi.net_mineral_acres * COALESCE(mi.royalty_percentage, 0) / 0.125) as total_nra,
      -- Pricing information
      pps.number_of_zones,
      pps.output_price,
      pps.price_per_boe,
      pps.total_boe_per_acre,
      pps.letter_rank,
      pps.nra_price,
      -- Acquisition status
      ast.name as acquisition_status,
      u.id as assigned_buyer_id,
      u.name as assigned_buyer,
      at.activity_count,
      at.last_contact_date,
      at.next_follow_up_date,
      at.notes as acquisition_notes,
      p.created_at,
      p.updated_at
    FROM properties p
    JOIN counties c ON p.county_id = c.id
    JOIN states s ON c.state_id = s.id
    LEFT JOIN sections sec ON p.section_id = sec.id
    LEFT JOIN abstracts a ON p.abstract_id = a.id
    LEFT JOIN mineral_interests mi ON p.id = mi.property_id
    LEFT JOIN acquisition_tracking at ON mi.id = at.mineral_interest_id
    LEFT JOIN acquisition_status_types ast ON at.acquisition_status_id = ast.id
    LEFT JOIN users u ON at.buyer_id = u.id
    LEFT JOIN property_pricing_summary pps ON p.id = pps.property_id
    WHERE p.id = ?
    GROUP BY p.id, s.code, c.name, p.legal_description, sec.section_number, 
             sec.township, sec.range, a.abstract_number, p.unique_id, p.gross_acres,
             p.is_state_land, pps.number_of_zones, pps.output_price, pps.price_per_boe,
             pps.total_boe_per_acre, pps.letter_rank, pps.nra_price, ast.name, u.id, u.name,
             at.activity_count, at.last_contact_date, at.next_follow_up_date, at.notes,
             p.created_at, p.updated_at
  `;

  const results = await executeQuery(query, [id]);
  
  if (results.length === 0) {
    throw new Error('Tract not found');
  }

  const row = results[0];
  return {
    id: row.tract_id,
    state: row.state,
    county: row.county,
    tractName: row.tract_name,
    legalDescription: row.legal_description,
    str: row.str,
    abstractNumber: row.abstract_number,
    anum: row.anum,
    grossAcres: row.gross_acres,
    isStateLand: row.is_state_land,
    numberOfOwners: row.number_of_owners,
    netMineralAcres: row.total_net_mineral_acres,
    royalty: row.avg_royalty_percentage,
    nra: row.total_nra,
    titleStatus: row.acquisition_status,
    assignedBuyerId: row.assigned_buyer_id,
    assignedBuyer: row.assigned_buyer,
    activityCount: row.activity_count,
    lastContactDate: row.last_contact_date,
    nextFollowUpDate: row.next_follow_up_date,
    acquisitionNotes: row.acquisition_notes,
    // Pricing information
    numberOfZones: row.number_of_zones,
    outputPrice: row.output_price,
    pricePerBoe: row.price_per_boe,
    totalBoePerAcre: row.total_boe_per_acre,
    letterRank: row.letter_rank,
    nraPrice: row.nra_price,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

// Get tract owners
export const fetchTractOwners = async (tractId: string): Promise<any[]> => {
  const query = `
    SELECT 
      o.id as owner_id,
      o.legal_name,
      o.display_name,
      ot.name as owner_type,
      o.is_deceased,
      mi.net_mineral_acres,
      mi.royalty_percentage,
      mi.net_revenue_interest,
      mi.allocation_percentage,
      mi.ownership_percentage,
      mi.source_of_title,
      ci.contact_type,
      ci.street_address,
      ci.city,
      s.code as state,
      ci.zip_code,
      ci.phone_primary,
      ci.phone_secondary,
      ci.email,
      ci.notes as contact_notes,
      ci.is_active as contact_active
    FROM properties p
    JOIN mineral_interests mi ON p.id = mi.property_id
    JOIN owners o ON mi.owner_id = o.id
    JOIN owner_types ot ON o.owner_type_id = ot.id
    LEFT JOIN contact_information ci ON o.id = ci.owner_id AND ci.is_active = TRUE
    LEFT JOIN states s ON ci.state_id = s.id
    WHERE p.id = ?
    ORDER BY mi.net_mineral_acres DESC
  `;

  const results = await executeQuery(query, [tractId]);
  
  return results.map(row => ({
    id: row.owner_id,
    legalName: row.legal_name,
    displayName: row.display_name,
    ownerType: row.owner_type,
    isDeceased: row.is_deceased,
    netMineralAcres: row.net_mineral_acres,
    royaltyPercentage: row.royalty_percentage,
    netRevenueInterest: row.net_revenue_interest,
    allocationPercentage: row.allocation_percentage,
    ownershipPercentage: row.ownership_percentage,
    sourceOfTitle: row.source_of_title,
    contactType: row.contact_type,
    streetAddress: row.street_address,
    city: row.city,
    state: row.state,
    zipCode: row.zip_code,
    phonePrimary: row.phone_primary,
    phoneSecondary: row.phone_secondary,
    email: row.email,
    contactNotes: row.contact_notes,
    contactActive: row.contact_active
  }));
};

// Get tract pricing information
export const fetchTractPricing = async (tractId: string): Promise<any[]> => {
  const query = `
    SELECT 
      f.id as formation_id,
      f.name as formation_name,
      f.description as formation_description,
      fp.price_per_acre,
      fp.is_available,
      b.name as basin_name,
      pps.output_price,
      pps.price_per_boe,
      pps.total_boe_per_acre,
      pps.letter_rank,
      pps.nra_price
    FROM properties p
    LEFT JOIN formation_pricing fp ON p.id = fp.property_id
    LEFT JOIN formations f ON fp.formation_id = f.id
    LEFT JOIN property_pricing_summary pps ON p.id = pps.property_id
    LEFT JOIN basins b ON pps.basin_id = b.id
    WHERE p.id = ?
    ORDER BY fp.price_per_acre DESC
  `;

  const results = await executeQuery(query, [tractId]);
  
  return results.map(row => ({
    formationId: row.formation_id,
    formationName: row.formation_name,
    formationDescription: row.formation_description,
    pricePerAcre: row.price_per_acre,
    isAvailable: row.is_available,
    basinName: row.basin_name,
    outputPrice: row.output_price,
    pricePerBoe: row.price_per_boe,
    totalBoePerAcre: row.total_boe_per_acre,
    letterRank: row.letter_rank,
    nraPrice: row.nra_price
  }));
};

// Search sections
export const searchSections = async (searchTerm: string, limit: number = 50, offset: number = 0): Promise<any[]> => {
  const query = `
    SELECT DISTINCT
      p.id as tract_id,
      s.code as state,
      c.name as county,
      CONCAT(s.code, '-', c.name, '-', COALESCE(sec.section_number, 'Unknown')) as tract_name,
      p.legal_description,
      p.gross_acres,
      SUM(mi.net_mineral_acres) as total_net_mineral_acres,
      COUNT(DISTINCT mi.owner_id) as number_of_owners,
      ast.name as acquisition_status,
      u.name as assigned_buyer
    FROM properties p
    JOIN counties c ON p.county_id = c.id
    JOIN states s ON c.state_id = s.id
    LEFT JOIN sections sec ON p.section_id = sec.id
    LEFT JOIN mineral_interests mi ON p.id = mi.property_id
    LEFT JOIN owners o ON mi.owner_id = o.id
    LEFT JOIN acquisition_tracking at ON mi.id = at.mineral_interest_id
    LEFT JOIN acquisition_status_types ast ON at.acquisition_status_id = ast.id
    LEFT JOIN users u ON at.buyer_id = u.id
    WHERE (
      CONCAT(s.code, '-', c.name, '-', COALESCE(sec.section_number, '')) LIKE CONCAT('%', ?, '%')
      OR p.legal_description LIKE CONCAT('%', ?, '%')
      OR o.legal_name LIKE CONCAT('%', ?, '%')
      OR o.display_name LIKE CONCAT('%', ?, '%')
    )
    GROUP BY p.id, s.code, c.name, p.legal_description, p.gross_acres,
             ast.name, u.name
    ORDER BY p.gross_acres DESC
    LIMIT ? OFFSET ?
  `;

  const results = await executeQuery(query, [searchTerm, searchTerm, searchTerm, searchTerm, limit, offset]);
  
  return results.map(row => ({
    id: row.tract_id,
    state: row.state,
    county: row.county,
    tractName: row.tract_name,
    legalDescription: row.legal_description,
    grossAcres: row.gross_acres,
    netMineralAcres: row.total_net_mineral_acres,
    numberOfOwners: row.number_of_owners,
    titleStatus: row.acquisition_status,
    assignedBuyer: row.assigned_buyer
  }));
};

// Get tract dashboard summary
export const fetchTractDashboard = async (): Promise<any> => {
  const query = `
    SELECT 
      COUNT(DISTINCT p.id) as total_sections,
      COUNT(DISTINCT CASE WHEN ast.name = 'WORKING' THEN p.id END) as working_sections,
      COUNT(DISTINCT CASE WHEN ast.name = 'DROPPED' THEN p.id END) as dropped_sections,
      COUNT(DISTINCT CASE WHEN ast.name = 'NEW' THEN p.id END) as new_sections,
      COUNT(DISTINCT CASE WHEN at.buyer_id IS NOT NULL THEN p.id END) as assigned_sections,
      COUNT(DISTINCT CASE WHEN at.buyer_id IS NULL THEN p.id END) as unassigned_sections,
      SUM(p.gross_acres) as total_gross_acres,
      SUM(mi.net_mineral_acres) as total_net_mineral_acres,
      COUNT(DISTINCT mi.owner_id) as total_owners,
      COUNT(DISTINCT w.id) as total_wells,
      AVG(pps.nra_price) as avg_nra_price
    FROM properties p
    LEFT JOIN mineral_interests mi ON p.id = mi.property_id
    LEFT JOIN acquisition_tracking at ON mi.id = at.mineral_interest_id
    LEFT JOIN acquisition_status_types ast ON at.acquisition_status_id = ast.id
    LEFT JOIN property_pricing_summary pps ON p.id = pps.property_id
    LEFT JOIN wells w ON p.id = w.property_id
  `;

  const results = await executeQuery(query);
  return results[0] || {};
};

// ============================================================================
// DATABASE INTEGRATION COMPLETE
// ============================================================================
// The normalized API now uses the database connection
// Mock data is provided through the database service for testing

// ============================================================================
// EXPORT ALL FUNCTIONS
// ============================================================================

export default {
  fetchSections,
  fetchTract,
  fetchTractOwners,
  fetchTractPricing,
  searchSections,
  fetchTractDashboard
};
