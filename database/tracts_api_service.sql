-- ============================================================================
-- TRACTS MODULE API SERVICE QUERIES
-- ============================================================================
-- This file contains optimized queries for the tracts module API endpoints
-- These queries are designed for use in the application service layer

-- ============================================================================
-- 1. TRACT LISTING API QUERIES
-- ============================================================================

-- Get paginated tract list with basic information
-- Parameters: limit, offset, state_filter, county_filter, status_filter, buyer_filter
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
    AND (? IS NULL OR s.code = ?)  -- state_filter
    AND (? IS NULL OR c.name = ?)  -- county_filter
    AND (? IS NULL OR ast.name = ?)  -- status_filter
    AND (? IS NULL OR u.id = ?)  -- buyer_filter
GROUP BY p.id, s.code, c.name, p.legal_description, sec.section_number, 
         sec.township, sec.range, a.abstract_number, p.gross_acres,
         ast.name, u.name, at.last_contact_date, at.next_follow_up_date,
         p.created_at, p.updated_at
ORDER BY p.updated_at DESC
LIMIT ? OFFSET ?;  -- limit, offset

-- Get tract count for pagination
SELECT COUNT(DISTINCT p.id) as total_count
FROM properties p
JOIN counties c ON p.county_id = c.id
JOIN states s ON c.state_id = s.id
LEFT JOIN mineral_interests mi ON p.id = mi.property_id
LEFT JOIN acquisition_tracking at ON mi.id = at.mineral_interest_id
LEFT JOIN acquisition_status_types ast ON at.acquisition_status_id = ast.id
LEFT JOIN users u ON at.buyer_id = u.id
WHERE 1=1
    AND (? IS NULL OR s.code = ?)  -- state_filter
    AND (? IS NULL OR c.name = ?)  -- county_filter
    AND (? IS NULL OR ast.name = ?)  -- status_filter
    AND (? IS NULL OR u.id = ?);  -- buyer_filter

-- ============================================================================
-- 2. TRACT DETAIL API QUERIES
-- ============================================================================

-- Get complete tract details by ID
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
    -- Well information
    w.well_name,
    op.name as operator,
    wst.name as well_status,
    w.first_production_date,
    w.completion_date,
    w.spud_date,
    -- Unit information
    ut.name as unit_tier,
    ust.name as unit_status,
    u_units.tops_price_3_16th,
    u_units.number_of_owners as unit_owners,
    u_units.internal_notes,
    u_units.occ_activity_notes,
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
LEFT JOIN wells w ON p.id = w.property_id
LEFT JOIN operators op ON w.operator_id = op.id
LEFT JOIN well_status_types wst ON w.well_status_id = wst.id
LEFT JOIN units u_units ON w.id = u_units.well_id
LEFT JOIN unit_tiers ut ON u_units.tier_id = ut.id
LEFT JOIN unit_status_types ust ON u_units.unit_status_id = ust.id
WHERE p.id = ?  -- tract_id parameter
GROUP BY p.id, s.code, c.name, p.legal_description, sec.section_number, 
         sec.township, sec.range, a.abstract_number, p.unique_id, p.gross_acres,
         p.is_state_land, pps.number_of_zones, pps.output_price, pps.price_per_boe,
         pps.total_boe_per_acre, pps.letter_rank, pps.nra_price, ast.name, u.id, u.name,
         at.activity_count, at.last_contact_date, at.next_follow_up_date, at.notes,
         w.well_name, op.name, wst.name, w.first_production_date, w.completion_date,
         w.spud_date, ut.name, ust.name, u_units.tops_price_3_16th, u_units.number_of_owners,
         u_units.internal_notes, u_units.occ_activity_notes, p.created_at, p.updated_at;

-- ============================================================================
-- 3. TRACT OWNERS API QUERIES
-- ============================================================================

-- Get all owners for a tract
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
WHERE p.id = ?  -- tract_id parameter
ORDER BY mi.net_mineral_acres DESC;

-- ============================================================================
-- 4. TRACT PRICING API QUERIES
-- ============================================================================

-- Get formation pricing for a tract
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
WHERE p.id = ?  -- tract_id parameter
ORDER BY fp.price_per_acre DESC;

-- ============================================================================
-- 5. TRACT SEARCH API QUERIES
-- ============================================================================

-- Search tracts by text (tract name, legal description, owner name)
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
    CONCAT(s.code, '-', c.name, '-', COALESCE(sec.section_number, '')) LIKE CONCAT('%', ?, '%')  -- search_term
    OR p.legal_description LIKE CONCAT('%', ?, '%')  -- search_term
    OR o.legal_name LIKE CONCAT('%', ?, '%')  -- search_term
    OR o.display_name LIKE CONCAT('%', ?, '%')  -- search_term
)
GROUP BY p.id, s.code, c.name, p.legal_description, p.gross_acres,
         ast.name, u.name
ORDER BY p.gross_acres DESC
LIMIT ? OFFSET ?;  -- limit, offset

-- ============================================================================
-- 6. TRACT DASHBOARD API QUERIES
-- ============================================================================

-- Get tract dashboard summary
SELECT 
    COUNT(DISTINCT p.id) as total_tracts,
    COUNT(DISTINCT CASE WHEN ast.name = 'WORKING' THEN p.id END) as working_tracts,
    COUNT(DISTINCT CASE WHEN ast.name = 'DROPPED' THEN p.id END) as dropped_tracts,
    COUNT(DISTINCT CASE WHEN ast.name = 'NEW' THEN p.id END) as new_tracts,
    COUNT(DISTINCT CASE WHEN at.buyer_id IS NOT NULL THEN p.id END) as assigned_tracts,
    COUNT(DISTINCT CASE WHEN at.buyer_id IS NULL THEN p.id END) as unassigned_tracts,
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
LEFT JOIN wells w ON p.id = w.property_id;

-- Get tract summary by state
SELECT 
    s.code as state,
    s.name as state_name,
    COUNT(DISTINCT p.id) as tract_count,
    COUNT(DISTINCT c.id) as county_count,
    SUM(p.gross_acres) as total_gross_acres,
    SUM(mi.net_mineral_acres) as total_net_mineral_acres,
    COUNT(DISTINCT mi.owner_id) as total_owners,
    AVG(pps.nra_price) as avg_nra_price
FROM properties p
JOIN counties c ON p.county_id = c.id
JOIN states s ON c.state_id = s.id
LEFT JOIN mineral_interests mi ON p.id = mi.property_id
LEFT JOIN property_pricing_summary pps ON p.id = pps.property_id
GROUP BY s.code, s.name
ORDER BY tract_count DESC;

-- Get tract summary by county
SELECT 
    s.code as state,
    c.name as county,
    COUNT(DISTINCT p.id) as tract_count,
    SUM(p.gross_acres) as total_gross_acres,
    SUM(mi.net_mineral_acres) as total_net_mineral_acres,
    COUNT(DISTINCT mi.owner_id) as total_owners,
    AVG(pps.nra_price) as avg_nra_price
FROM properties p
JOIN counties c ON p.county_id = c.id
JOIN states s ON c.state_id = s.id
LEFT JOIN mineral_interests mi ON p.id = mi.property_id
LEFT JOIN property_pricing_summary pps ON p.id = pps.property_id
GROUP BY s.code, c.name
ORDER BY tract_count DESC;

-- ============================================================================
-- 7. TRACT ASSIGNMENT API QUERIES
-- ============================================================================

-- Assign tract to buyer
UPDATE acquisition_tracking 
SET buyer_id = ?,  -- buyer_id parameter
    acquisition_status_id = (SELECT id FROM acquisition_status_types WHERE name = 'WORKING'),
    updated_at = CURRENT_TIMESTAMP
WHERE mineral_interest_id IN (
    SELECT mi.id 
    FROM mineral_interests mi 
    WHERE mi.property_id = ?  -- tract_id parameter
);

-- Unassign tract from buyer
UPDATE acquisition_tracking 
SET buyer_id = NULL,
    acquisition_status_id = (SELECT id FROM acquisition_status_types WHERE name = 'NEW'),
    updated_at = CURRENT_TIMESTAMP
WHERE mineral_interest_id IN (
    SELECT mi.id 
    FROM mineral_interests mi 
    WHERE mi.property_id = ?  -- tract_id parameter
);

-- ============================================================================
-- 8. TRACT ACTIVITY API QUERIES
-- ============================================================================

-- Update tract activity
UPDATE acquisition_tracking 
SET activity_id = (SELECT id FROM acquisition_activities WHERE name = ?),  -- activity_name parameter
    activity_count = activity_count + 1,
    last_contact_date = CURRENT_DATE,
    next_follow_up_date = DATE_ADD(CURRENT_DATE, INTERVAL ? DAY),  -- follow_up_days parameter
    notes = CONCAT(COALESCE(notes, ''), '\n', ?),  -- new_note parameter
    updated_at = CURRENT_TIMESTAMP
WHERE mineral_interest_id IN (
    SELECT mi.id 
    FROM mineral_interests mi 
    WHERE mi.property_id = ?  -- tract_id parameter
);

-- Get tract activity history
SELECT 
    ast.name as status,
    aa.name as activity,
    at.activity_count,
    at.last_contact_date,
    at.next_follow_up_date,
    at.notes,
    u.name as buyer,
    at.created_at as activity_date
FROM properties p
JOIN mineral_interests mi ON p.id = mi.property_id
JOIN acquisition_tracking at ON mi.id = at.mineral_interest_id
LEFT JOIN acquisition_status_types ast ON at.acquisition_status_id = ast.id
LEFT JOIN acquisition_activities aa ON at.activity_id = aa.id
LEFT JOIN users u ON at.buyer_id = u.id
WHERE p.id = ?  -- tract_id parameter
ORDER BY at.created_at DESC;

-- ============================================================================
-- 9. TRACT WELL API QUERIES
-- ============================================================================

-- Get wells for a tract
SELECT 
    w.id as well_id,
    w.well_name,
    op.name as operator,
    wst.name as well_status,
    w.allocation_percentage,
    w.first_production_date,
    w.completion_date,
    w.spud_date,
    ut.name as unit_tier,
    ust.name as unit_status,
    u.tops_price_3_16th,
    u.number_of_owners,
    u.internal_notes,
    u.occ_activity_notes
FROM properties p
LEFT JOIN wells w ON p.id = w.property_id
LEFT JOIN operators op ON w.operator_id = op.id
LEFT JOIN well_status_types wst ON w.well_status_id = wst.id
LEFT JOIN units u ON w.id = u.well_id
LEFT JOIN unit_tiers ut ON u.tier_id = ut.id
LEFT JOIN unit_status_types ust ON u.unit_status_id = ust.id
WHERE p.id = ?  -- tract_id parameter
ORDER BY w.well_name;

-- ============================================================================
-- 10. TRACT EXPORT API QUERIES
-- ============================================================================

-- Export tract data for CSV/Excel
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
    u.name as assigned_buyer,
    at.activity_count,
    at.last_contact_date,
    at.next_follow_up_date,
    -- Well information
    GROUP_CONCAT(DISTINCT w.well_name) as well_names,
    GROUP_CONCAT(DISTINCT op.name) as operators,
    -- Owner information
    GROUP_CONCAT(DISTINCT o.legal_name) as owner_names
FROM properties p
JOIN counties c ON p.county_id = c.id
JOIN states s ON c.state_id = s.id
LEFT JOIN sections sec ON p.section_id = sec.id
LEFT JOIN abstracts a ON p.abstract_id = a.id
LEFT JOIN mineral_interests mi ON p.id = mi.property_id
LEFT JOIN owners o ON mi.owner_id = o.id
LEFT JOIN acquisition_tracking at ON mi.id = at.mineral_interest_id
LEFT JOIN acquisition_status_types ast ON at.acquisition_status_id = ast.id
LEFT JOIN users u ON at.buyer_id = u.id
LEFT JOIN property_pricing_summary pps ON p.id = pps.property_id
LEFT JOIN wells w ON p.id = w.property_id
LEFT JOIN operators op ON w.operator_id = op.id
GROUP BY p.id, s.code, c.name, p.legal_description, sec.section_number, 
         sec.township, sec.range, a.abstract_number, p.unique_id, p.gross_acres,
         p.is_state_land, pps.number_of_zones, pps.output_price, pps.price_per_boe,
         pps.total_boe_per_acre, pps.letter_rank, pps.nra_price, ast.name, u.name,
         at.activity_count, at.last_contact_date, at.next_follow_up_date
ORDER BY s.code, c.name, p.gross_acres DESC;

-- ============================================================================
-- API IMPLEMENTATION NOTES
-- ============================================================================
-- 1. Use prepared statements for all queries to prevent SQL injection
-- 2. Implement proper error handling and logging
-- 3. Add appropriate indexes for performance optimization
-- 4. Consider caching for frequently accessed data
-- 5. Implement pagination for large result sets
-- 6. Add data validation before executing queries
-- 7. Use transactions for multi-table operations
-- 8. Implement proper authentication and authorization checks
