-- ============================================================================
-- RECREATE PRODUCTION TABLES FROM NORMALIZED DATA
-- ============================================================================
-- These queries join the normalized 3NF tables to recreate the original
-- production table structures for comparison and validation

-- ============================================================================
-- 1. RECREATE TEXAS_PRICING TABLE
-- ============================================================================

SELECT 
    -- Location information
    c.name AS County,
    b.name AS Basin,
    sc.name AS `Survey Company`,
    
    -- Formation and pricing information
    f.name AS Formation,
    fp.price_per_acre AS `Price per Acre`,
    
    -- Property information
    p.legal_description AS `Legal Description`,
    p.gross_acres AS `Gross Acres`,
    
    -- Additional normalized data for reference
    fp.id AS formation_pricing_id,
    p.id AS property_id,
    c.id AS county_id,
    b.id AS basin_id,
    sc.id AS survey_company_id,
    f.id AS formation_id

FROM formation_pricing fp
-- Join to get property information
JOIN properties p ON fp.property_id = p.id
-- Join to get location information
JOIN counties c ON p.county_id = c.id
JOIN states st ON c.state_id = st.id
JOIN basins b ON p.basin_id = b.id
JOIN survey_companies sc ON p.survey_company_id = sc.id
-- Join to get formation information
JOIN formations f ON fp.formation_id = f.id
-- Filter for Texas counties (based on the original data)
WHERE st.code = 'TX'

ORDER BY 
    c.name,           -- County
    f.name,           -- Formation
    fp.price_per_acre DESC; -- Price (highest first)

-- ============================================================================
-- 2. RECREATE OKLAHOMA_PRICING TABLE
-- ============================================================================

SELECT 
    -- Location information
    c.name AS County,
    b.name AS Basin,
    sc.name AS `Survey Company`,
    
    -- Formation and pricing information
    f.name AS Formation,
    fp.price_per_acre AS `Price per Acre`,
    
    -- Property information
    p.legal_description AS `Legal Description`,
    p.gross_acres AS `Gross Acres`,
    
    -- Additional normalized data for reference
    fp.id AS formation_pricing_id,
    p.id AS property_id,
    c.id AS county_id,
    b.id AS basin_id,
    sc.id AS survey_company_id,
    f.id AS formation_id

FROM formation_pricing fp
-- Join to get property information
JOIN properties p ON fp.property_id = p.id
-- Join to get location information
JOIN counties c ON p.county_id = c.id
JOIN states st ON c.state_id = st.id
JOIN basins b ON p.basin_id = b.id
JOIN survey_companies sc ON p.survey_company_id = sc.id
-- Join to get formation information
JOIN formations f ON fp.formation_id = f.id
-- Filter for Oklahoma counties (based on the original data)
WHERE st.code = 'OK'

ORDER BY 
    c.name,           -- County
    f.name,           -- Formation
    fp.price_per_acre DESC; -- Price (highest first)

-- ============================================================================
-- 3. RECREATE UNIT_SUMMARY TABLE
-- ============================================================================

SELECT 
    -- Well information
    w.well_name AS `Well Name`,
    op.name AS Operator,
    wst.name AS `Well Status`,
    w.allocation_percentage AS `Allocation %`,
    
    -- Unit information
    u.id AS `Unit ID`,
    ut.name AS `Unit Tier`,
    ust.name AS `Unit Status`,
    u.tops_price_3_16th AS `Tops Price 3/16th`,
    u.number_of_owners AS `Number of Owners`,
    
    -- Property information
    p.legal_description AS `Legal Description`,
    c.name AS County,
    st.code AS State,
    
    -- Additional normalized data for reference
    w.id AS well_id,
    u.id AS unit_id,
    op.id AS operator_id,
    wst.id AS well_status_id,
    ut.id AS unit_tier_id,
    ust.id AS unit_status_id,
    p.id AS property_id

FROM wells w
-- Join to get unit information
JOIN units u ON w.unit_id = u.id
-- Join to get operator information
JOIN operators op ON w.operator_id = op.id
-- Join to get well status information
JOIN well_status_types wst ON w.well_status_id = wst.id
-- Join to get unit tier information
JOIN unit_tiers ut ON u.unit_tier_id = ut.id
-- Join to get unit status information
JOIN unit_status_types ust ON u.unit_status_id = ust.id
-- Join to get property information
JOIN properties p ON w.property_id = p.id
-- Join to get location information
JOIN counties c ON p.county_id = c.id
JOIN states st ON c.state_id = st.id

ORDER BY 
    op.name,          -- Operator
    w.well_name,      -- Well Name
    u.id;             -- Unit ID

-- ============================================================================
-- SUMMARY QUERIES: Compare original vs recreated data
-- ============================================================================

-- Count records in recreated tables
/*
SELECT 
    'Recreated Texas Pricing' AS source,
    COUNT(*) AS record_count,
    COUNT(DISTINCT c.name) AS unique_counties,
    COUNT(DISTINCT f.name) AS unique_formations,
    AVG(fp.price_per_acre) AS avg_price
FROM formation_pricing fp
JOIN properties p ON fp.property_id = p.id
JOIN counties c ON p.county_id = c.id
JOIN states st ON c.state_id = st.id
JOIN formations f ON fp.formation_id = f.id
WHERE st.code = 'TX'

UNION ALL

SELECT 
    'Recreated Oklahoma Pricing' AS source,
    COUNT(*) AS record_count,
    COUNT(DISTINCT c.name) AS unique_counties,
    COUNT(DISTINCT f.name) AS unique_formations,
    AVG(fp.price_per_acre) AS avg_price
FROM formation_pricing fp
JOIN properties p ON fp.property_id = p.id
JOIN counties c ON p.county_id = c.id
JOIN states st ON c.state_id = st.id
JOIN formations f ON fp.formation_id = f.id
WHERE st.code = 'OK'

UNION ALL

SELECT 
    'Recreated Unit Summary' AS source,
    COUNT(*) AS record_count,
    COUNT(DISTINCT op.name) AS unique_operators,
    COUNT(DISTINCT wst.name) AS unique_well_statuses,
    AVG(w.allocation_percentage) AS avg_allocation
FROM wells w
JOIN units u ON w.unit_id = u.id
JOIN operators op ON w.operator_id = op.id
JOIN well_status_types wst ON w.well_status_id = wst.id;
*/

-- ============================================================================
-- DATA VALIDATION QUERIES
-- ============================================================================

-- Check for missing data in recreated structures
/*
SELECT 
    'Missing Operators in Wells' AS issue,
    COUNT(*) AS count
FROM wells w
LEFT JOIN operators op ON w.operator_id = op.id
WHERE op.id IS NULL

UNION ALL

SELECT 
    'Missing Formations in Pricing' AS issue,
    COUNT(*) AS count
FROM formation_pricing fp
LEFT JOIN formations f ON fp.formation_id = f.id
WHERE f.id IS NULL

UNION ALL

SELECT 
    'Missing Counties in Properties' AS issue,
    COUNT(*) AS count
FROM properties p
LEFT JOIN counties c ON p.county_id = c.id
WHERE c.id IS NULL;
*/

-- ============================================================================
-- USAGE NOTES
-- ============================================================================

/*
These queries recreate the original production table structures from the 
normalized 3NF database. Key points:

1. **Texas Pricing Query**: Recreates the original Texas pricing table with
   county, basin, survey company, formation, and pricing information.

2. **Oklahoma Pricing Query**: Similar to Texas pricing but filtered for
   Oklahoma counties.

3. **Unit Summary Query**: Recreates the original unit summary table with
   well information, operator details, unit status, and allocation data.

4. **Data Mapping**:
   - County → counties.name
   - Basin → basins.name
   - Survey Company → survey_companies.name
   - Formation → formations.name
   - Price per Acre → formation_pricing.price_per_acre
   - Well Name → wells.well_name
   - Operator → operators.name
   - Well Status → well_status_types.name
   - Unit Tier → unit_tiers.name
   - Unit Status → unit_status_types.name

5. **Filtering**: The pricing queries are filtered by state code (TX/OK) to
   match the original table separation.

6. **Ordering**: Results are ordered logically for consistent output.

To use these queries:
1. Run individual queries to recreate specific production tables
2. Use summary queries to validate data completeness
3. Use validation queries to check for data integrity issues
4. Compare results with original production tables if available
*/
