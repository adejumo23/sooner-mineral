-- ============================================================================
-- TRACTS MODULE QUERIES FROM NORMALIZED TABLES
-- ============================================================================
-- This file contains queries to populate and manage the tracts module
-- using data from the normalized database structure

-- ============================================================================
-- 1. BASIC TRACT QUERIES
-- ============================================================================

-- Get all tracts with complete information
SELECT 
    p.id as tract_id,
    s.code as state,
    c.name as county,
    CONCAT(s.code, '-', c.name, '-', sec.section_number) as tract_name,
    p.legal_description,
    CONCAT(sec.section_number, '-', sec.township, '-', sec.range) as str,
    a.abstract_number,
    p.unique_id as anum,
    p.gross_acres,
    AVG(mi.royalty_percentage) as avg_royalty,
    SUM(mi.net_mineral_acres) as total_net_mineral_acres,
    SUM(mi.net_mineral_acres * mi.royalty_percentage / 0.125) as total_nra,
    AVG(mi.ownership_percentage) as avg_ownership_percentage,
    CASE 
        WHEN COUNT(DISTINCT mi.owner_id) = 1 THEN 'Verified'
        WHEN COUNT(DISTINCT mi.owner_id) > 1 THEN 'In Progress'
        ELSE 'Unmapped'
    END as title_status,
    at.buyer_id as assigned_buyer_id,
    pps.nra_price as nra_cap_usd,
    ast.name as source_channel,
    at.notes as routing_notes,
    FALSE as held_by_fund,
    FALSE as is_locked,
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
LEFT JOIN property_pricing_summary pps ON p.id = pps.property_id
GROUP BY p.id, s.code, c.name, p.legal_description, sec.section_number, 
         sec.township, sec.range, a.abstract_number, p.unique_id, p.gross_acres,
         at.buyer_id, pps.nra_price, ast.name, at.notes, p.created_at, p.updated_at;

-- ============================================================================
-- 2. TRACT DETAIL QUERIES
-- ============================================================================

-- Get detailed tract information by tract ID
SELECT 
    p.id as tract_id,
    s.code as state,
    c.name as county,
    CONCAT(s.code, '-', c.name, '-', sec.section_number) as tract_name,
    p.legal_description,
    CONCAT(sec.section_number, '-', sec.township, '-', sec.range) as str,
    a.abstract_number,
    p.unique_id as anum,
    p.gross_acres,
    p.is_state_land,
    -- Mineral interest summary
    COUNT(DISTINCT mi.owner_id) as number_of_owners,
    SUM(mi.net_mineral_acres) as total_net_mineral_acres,
    AVG(mi.royalty_percentage) as avg_royalty_percentage,
    SUM(mi.net_mineral_acres * mi.royalty_percentage / 0.125) as total_nra,
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
    at.notes as acquisition_notes,
    at.last_contact_date,
    at.next_follow_up_date,
    -- Well information
    w.well_name,
    op.name as operator,
    wst.name as well_status,
    w.first_production_date,
    w.completion_date,
    w.spud_date
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
WHERE p.id = ? -- Replace ? with specific tract ID
GROUP BY p.id, s.code, c.name, p.legal_description, sec.section_number, 
         sec.township, sec.range, a.abstract_number, p.unique_id, p.gross_acres,
         p.is_state_land, pps.number_of_zones, pps.output_price, pps.price_per_boe,
         pps.total_boe_per_acre, pps.letter_rank, pps.nra_price, ast.name, u.name,
         at.notes, at.last_contact_date, at.next_follow_up_date, w.well_name,
         op.name, wst.name, w.first_production_date, w.completion_date, w.spud_date;

-- ============================================================================
-- 3. TRACT OWNERSHIP QUERIES
-- ============================================================================

-- Get all owners for a specific tract
SELECT 
    p.id as tract_id,
    o.legal_name as owner_name,
    ot.name as owner_type,
    mi.net_mineral_acres,
    mi.royalty_percentage,
    mi.net_revenue_interest,
    mi.allocation_percentage,
    mi.ownership_percentage,
    mi.source_of_title,
    ci.street_address,
    ci.city,
    s.code as state,
    ci.zip_code,
    ci.phone_primary,
    ci.phone_secondary,
    ci.email,
    ci.notes as contact_notes,
    o.is_deceased
FROM properties p
JOIN mineral_interests mi ON p.id = mi.property_id
JOIN owners o ON mi.owner_id = o.id
JOIN owner_types ot ON o.owner_type_id = ot.id
LEFT JOIN contact_information ci ON o.id = ci.owner_id AND ci.is_active = TRUE
LEFT JOIN states s ON ci.state_id = s.id
WHERE p.id = ? -- Replace ? with specific tract ID
ORDER BY mi.net_mineral_acres DESC;

-- ============================================================================
-- 4. TRACT PRICING QUERIES
-- ============================================================================

-- Get formation pricing for a specific tract
SELECT 
    p.id as tract_id,
    f.name as formation_name,
    fp.price_per_acre,
    fp.is_available,
    b.name as basin_name,
    pps.output_price,
    pps.price_per_boe,
    pps.total_boe_per_acre,
    pps.letter_rank
FROM properties p
LEFT JOIN formation_pricing fp ON p.id = fp.property_id
LEFT JOIN formations f ON fp.formation_id = f.id
LEFT JOIN property_pricing_summary pps ON p.id = pps.property_id
LEFT JOIN basins b ON pps.basin_id = b.id
WHERE p.id = ? -- Replace ? with specific tract ID
ORDER BY fp.price_per_acre DESC;

-- ============================================================================
-- 5. TRACT SEARCH AND FILTER QUERIES
-- ============================================================================

-- Search tracts by county and state
SELECT 
    p.id as tract_id,
    s.code as state,
    c.name as county,
    CONCAT(s.code, '-', c.name, '-', sec.section_number) as tract_name,
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
LEFT JOIN acquisition_tracking at ON mi.id = at.mineral_interest_id
LEFT JOIN acquisition_status_types ast ON at.acquisition_status_id = ast.id
LEFT JOIN users u ON at.buyer_id = u.id
WHERE s.code = ? AND c.name = ? -- Replace ? with state and county
GROUP BY p.id, s.code, c.name, p.gross_acres, ast.name, u.name
ORDER BY p.gross_acres DESC;

-- Search tracts by acquisition status
SELECT 
    p.id as tract_id,
    s.code as state,
    c.name as county,
    CONCAT(s.code, '-', c.name, '-', sec.section_number) as tract_name,
    p.gross_acres,
    SUM(mi.net_mineral_acres) as total_net_mineral_acres,
    ast.name as acquisition_status,
    u.name as assigned_buyer,
    at.last_contact_date,
    at.next_follow_up_date
FROM properties p
JOIN counties c ON p.county_id = c.id
JOIN states s ON c.state_id = s.id
LEFT JOIN sections sec ON p.section_id = sec.id
LEFT JOIN mineral_interests mi ON p.id = mi.property_id
LEFT JOIN acquisition_tracking at ON mi.id = at.mineral_interest_id
LEFT JOIN acquisition_status_types ast ON at.acquisition_status_id = ast.id
LEFT JOIN users u ON at.buyer_id = u.id
WHERE ast.name = ? -- Replace ? with acquisition status (e.g., 'WORKING', 'DROPPED')
GROUP BY p.id, s.code, c.name, p.gross_acres, ast.name, u.name, at.last_contact_date, at.next_follow_up_date
ORDER BY at.last_contact_date DESC;

-- Search tracts by assigned buyer
SELECT 
    p.id as tract_id,
    s.code as state,
    c.name as county,
    CONCAT(s.code, '-', c.name, '-', sec.section_number) as tract_name,
    p.gross_acres,
    SUM(mi.net_mineral_acres) as total_net_mineral_acres,
    ast.name as acquisition_status,
    u.name as assigned_buyer,
    at.activity_count,
    at.last_contact_date
FROM properties p
JOIN counties c ON p.county_id = c.id
JOIN states s ON c.state_id = s.id
LEFT JOIN sections sec ON p.section_id = sec.id
LEFT JOIN mineral_interests mi ON p.id = mi.property_id
LEFT JOIN acquisition_tracking at ON mi.id = at.mineral_interest_id
LEFT JOIN acquisition_status_types ast ON at.acquisition_status_id = ast.id
LEFT JOIN users u ON at.buyer_id = u.id
WHERE u.id = ? -- Replace ? with buyer user ID
GROUP BY p.id, s.code, c.name, p.gross_acres, ast.name, u.name, at.activity_count, at.last_contact_date
ORDER BY at.last_contact_date DESC;

-- ============================================================================
-- 6. TRACT SUMMARY QUERIES
-- ============================================================================

-- Get tract summary statistics
SELECT 
    COUNT(DISTINCT p.id) as total_tracts,
    COUNT(DISTINCT c.id) as total_counties,
    COUNT(DISTINCT s.id) as total_states,
    SUM(p.gross_acres) as total_gross_acres,
    SUM(mi.net_mineral_acres) as total_net_mineral_acres,
    COUNT(DISTINCT mi.owner_id) as total_owners,
    COUNT(DISTINCT w.id) as total_wells,
    COUNT(DISTINCT op.id) as total_operators
FROM properties p
JOIN counties c ON p.county_id = c.id
JOIN states s ON c.state_id = s.id
LEFT JOIN mineral_interests mi ON p.id = mi.property_id
LEFT JOIN wells w ON p.id = w.property_id
LEFT JOIN operators op ON w.operator_id = op.id;

-- Get tract summary by state
SELECT 
    s.code as state,
    s.name as state_name,
    COUNT(DISTINCT p.id) as tract_count,
    COUNT(DISTINCT c.id) as county_count,
    SUM(p.gross_acres) as total_gross_acres,
    SUM(mi.net_mineral_acres) as total_net_mineral_acres,
    COUNT(DISTINCT mi.owner_id) as total_owners
FROM properties p
JOIN counties c ON p.county_id = c.id
JOIN states s ON c.state_id = s.id
LEFT JOIN mineral_interests mi ON p.id = mi.property_id
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
-- 7. TRACT ASSIGNMENT QUERIES
-- ============================================================================

-- Get tracts assigned to a specific buyer
SELECT 
    p.id as tract_id,
    s.code as state,
    c.name as county,
    CONCAT(s.code, '-', c.name, '-', sec.section_number) as tract_name,
    p.gross_acres,
    SUM(mi.net_mineral_acres) as total_net_mineral_acres,
    ast.name as acquisition_status,
    at.activity_count,
    at.last_contact_date,
    at.next_follow_up_date,
    at.notes as acquisition_notes
FROM properties p
JOIN counties c ON p.county_id = c.id
JOIN states s ON c.state_id = s.id
LEFT JOIN sections sec ON p.section_id = sec.id
LEFT JOIN mineral_interests mi ON p.id = mi.property_id
LEFT JOIN acquisition_tracking at ON mi.id = at.mineral_interest_id
LEFT JOIN acquisition_status_types ast ON at.acquisition_status_id = ast.id
WHERE at.buyer_id = ? -- Replace ? with buyer user ID
GROUP BY p.id, s.code, c.name, p.gross_acres, ast.name, at.activity_count, 
         at.last_contact_date, at.next_follow_up_date, at.notes
ORDER BY at.last_contact_date DESC;

-- Get unassigned tracts
SELECT 
    p.id as tract_id,
    s.code as state,
    c.name as county,
    CONCAT(s.code, '-', c.name, '-', sec.section_number) as tract_name,
    p.gross_acres,
    SUM(mi.net_mineral_acres) as total_net_mineral_acres,
    COUNT(DISTINCT mi.owner_id) as number_of_owners
FROM properties p
JOIN counties c ON p.county_id = c.id
JOIN states s ON c.state_id = s.id
LEFT JOIN sections sec ON p.section_id = sec.id
LEFT JOIN mineral_interests mi ON p.id = mi.property_id
LEFT JOIN acquisition_tracking at ON mi.id = at.mineral_interest_id
WHERE at.buyer_id IS NULL
GROUP BY p.id, s.code, c.name, p.gross_acres
ORDER BY p.gross_acres DESC;

-- ============================================================================
-- 8. TRACT ACTIVITY QUERIES
-- ============================================================================

-- Get tract activity history
SELECT 
    p.id as tract_id,
    CONCAT(s.code, '-', c.name, '-', sec.section_number) as tract_name,
    ast.name as status,
    aa.name as activity,
    at.activity_count,
    at.last_contact_date,
    at.next_follow_up_date,
    at.notes,
    u.name as buyer,
    at.created_at as activity_date
FROM properties p
JOIN counties c ON p.county_id = c.id
JOIN states s ON c.state_id = s.id
LEFT JOIN sections sec ON p.section_id = sec.id
LEFT JOIN mineral_interests mi ON p.id = mi.property_id
LEFT JOIN acquisition_tracking at ON mi.id = at.mineral_interest_id
LEFT JOIN acquisition_status_types ast ON at.acquisition_status_id = ast.id
LEFT JOIN acquisition_activities aa ON at.activity_id = aa.id
LEFT JOIN users u ON at.buyer_id = u.id
WHERE p.id = ? -- Replace ? with specific tract ID
ORDER BY at.created_at DESC;

-- ============================================================================
-- 9. TRACT WELL QUERIES
-- ============================================================================

-- Get wells associated with a tract
SELECT 
    p.id as tract_id,
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
WHERE p.id = ? -- Replace ? with specific tract ID
ORDER BY w.well_name;

-- ============================================================================
-- 10. TRACT EXPORT QUERIES
-- ============================================================================

-- Export tract data for reporting
SELECT 
    p.id as tract_id,
    s.code as state,
    c.name as county,
    CONCAT(s.code, '-', c.name, '-', sec.section_number) as tract_name,
    p.legal_description,
    CONCAT(sec.section_number, '-', sec.township, '-', sec.range) as str,
    a.abstract_number,
    p.unique_id as anum,
    p.gross_acres,
    p.is_state_land,
    -- Mineral interest summary
    COUNT(DISTINCT mi.owner_id) as number_of_owners,
    SUM(mi.net_mineral_acres) as total_net_mineral_acres,
    AVG(mi.royalty_percentage) as avg_royalty_percentage,
    SUM(mi.net_mineral_acres * mi.royalty_percentage / 0.125) as total_nra,
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
-- QUERY USAGE NOTES
-- ============================================================================
-- 1. Replace ? placeholders with actual values when using these queries
-- 2. Add appropriate WHERE clauses for filtering
-- 3. Use LIMIT and OFFSET for pagination
-- 4. Add ORDER BY clauses for sorting
-- 5. Consider adding indexes on frequently queried columns
-- 6. Use prepared statements for security when implementing in application code
