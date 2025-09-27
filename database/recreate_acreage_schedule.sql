-- ============================================================================
-- RECREATE ACREAGE_SCHEDULE FROM NORMALIZED DATA
-- ============================================================================
-- This query joins the normalized 3NF tables to recreate the original
-- acreage_schedule table structure for comparison and validation

-- ============================================================================
-- MAIN QUERY: Recreate acreage_schedule structure
-- ============================================================================

SELECT 
    -- Location information
    c.name AS COUNTY,
    CONCAT(s.section_number, '-', s.township, '-', s.range) AS `S-T-R`,
    p.legal_description AS `LEGAL DESCRIPTION`,
    
    -- Acreage information
    mi.net_mineral_acres AS NMA,
    
    -- Owner information
    o.legal_name AS OWNER,
    ci.street_address AS STREET,
    ci.city AS CITY,
    st.code AS ST,
    ci.zip_code AS ZIP,
    CONCAT(COALESCE(ci.phone_primary, ''), '\n', COALESCE(ci.email, '')) AS `PHONE/EMAIL`,
    
    -- Mineral interest details
    mi.royalty_percentage AS ROY,
    mi.allocation_percentage AS `ALLOCATION %`,
    mi.source_of_title AS `TITLE SOURCE`,
    
    -- Acquisition tracking
    COALESCE(ast.name, '') AS STATUS,
    COALESCE(u.name, '') AS BUYER,
    COALESCE(at.notes, '') AS NOTE,
    
    -- Additional normalized data for reference
    mi.id AS mineral_interest_id,
    p.id AS property_id,
    o.id AS owner_id,
    c.id AS county_id,
    s.id AS section_id,
    st.id AS state_id

FROM mineral_interests mi
-- Join to get property information
JOIN properties p ON mi.property_id = p.id
-- Join to get location information
JOIN counties c ON p.county_id = c.id
JOIN states st ON c.state_id = st.id
JOIN sections s ON p.section_id = s.id
-- Join to get owner information
JOIN owners o ON mi.owner_id = o.id
-- Join to get contact information (if available)
LEFT JOIN contact_information ci ON o.id = ci.owner_id AND ci.contact_type = 'Primary'
-- Join to get acquisition tracking information
LEFT JOIN acquisition_tracking at ON mi.id = at.mineral_interest_id
LEFT JOIN acquisition_status_types ast ON at.acquisition_status_id = ast.id
LEFT JOIN users u ON at.buyer_id = u.id

ORDER BY 
    c.name,           -- County
    s.section_number, -- Section
    o.legal_name;     -- Owner

-- ============================================================================
-- ALTERNATIVE QUERY: Simplified version without acquisition tracking
-- ============================================================================

/*
SELECT 
    c.name AS COUNTY,
    CONCAT(s.section_number, '-', s.township, '-', s.range) AS `S-T-R`,
    p.legal_description AS `LEGAL DESCRIPTION`,
    mi.net_mineral_acres AS NMA,
    o.legal_name AS OWNER,
    ci.street_address AS STREET,
    ci.city AS CITY,
    st.code AS ST,
    ci.zip_code AS ZIP,
    CONCAT(COALESCE(ci.phone_primary, ''), '\n', COALESCE(ci.email, '')) AS `PHONE/EMAIL`,
    mi.royalty_percentage AS ROY,
    mi.allocation_percentage AS `ALLOCATION %`,
    mi.source_of_title AS `TITLE SOURCE`

FROM mineral_interests mi
JOIN properties p ON mi.property_id = p.id
JOIN counties c ON p.county_id = c.id
JOIN states st ON c.state_id = st.id
JOIN sections s ON p.section_id = s.id
JOIN owners o ON mi.owner_id = o.id
LEFT JOIN contact_information ci ON o.id = ci.owner_id AND ci.contact_type = 'Primary'

ORDER BY c.name, s.section_number, o.legal_name;
*/

-- ============================================================================
-- SUMMARY QUERIES: Compare original vs recreated data
-- ============================================================================

-- Count records in recreated acreage_schedule
/*
SELECT 
    'Recreated Acreage Schedule' AS source,
    COUNT(*) AS record_count,
    COUNT(DISTINCT c.name) AS unique_counties,
    COUNT(DISTINCT o.legal_name) AS unique_owners,
    SUM(mi.net_mineral_acres) AS total_acres
FROM mineral_interests mi
JOIN properties p ON mi.property_id = p.id
JOIN counties c ON p.county_id = c.id
JOIN owners o ON mi.owner_id = o.id;
*/

-- Compare with original production table (if it still exists)
/*
SELECT 
    'Original Production Table' AS source,
    COUNT(*) AS record_count
FROM prod_acreage_schedule

UNION ALL

SELECT 
    'Recreated from Normalized' AS source,
    COUNT(*) AS record_count
FROM (
    SELECT mi.id
    FROM mineral_interests mi
    JOIN properties p ON mi.property_id = p.id
    JOIN counties c ON p.county_id = c.id
    JOIN owners o ON mi.owner_id = o.id
) AS recreated;
*/

-- ============================================================================
-- DATA VALIDATION QUERIES
-- ============================================================================

-- Check for missing data in recreated structure
/*
SELECT 
    'Missing Counties' AS issue,
    COUNT(*) AS count
FROM mineral_interests mi
JOIN properties p ON mi.property_id = p.id
LEFT JOIN counties c ON p.county_id = c.id
WHERE c.id IS NULL

UNION ALL

SELECT 
    'Missing Owners' AS issue,
    COUNT(*) AS count
FROM mineral_interests mi
LEFT JOIN owners o ON mi.owner_id = o.id
WHERE o.id IS NULL

UNION ALL

SELECT 
    'Missing Properties' AS issue,
    COUNT(*) AS count
FROM mineral_interests mi
LEFT JOIN properties p ON mi.property_id = p.id
WHERE p.id IS NULL;
*/

-- ============================================================================
-- USAGE NOTES
-- ============================================================================

/*
This query recreates the original acreage_schedule table structure from the 
normalized 3NF database. Key points:

1. **Main Query**: Joins all necessary normalized tables to recreate the 
   original acreage_schedule structure with all original columns.

2. **Data Mapping**:
   - COUNTY → counties.name
   - S-T-R → sections (section_number-township-range)
   - LEGAL DESCRIPTION → properties.legal_description
   - NMA → mineral_interests.net_mineral_acres
   - OWNER → owners.legal_name
   - STREET, CITY, ST, ZIP → contact_information
   - PHONE/EMAIL → concatenated contact_information
   - ROY → mineral_interests.royalty_percentage
   - ALLOCATION % → mineral_interests.allocation_percentage
   - TITLE SOURCE → mineral_interests.source_of_title
   - STATUS → acquisition_status_types.name
   - BUYER → users.display_name
   - NOTE → acquisition_tracking.notes

3. **Data Integrity**: The query includes LEFT JOINs for optional data like
   contact information and acquisition tracking to ensure all mineral interests
   are included even if some related data is missing.

4. **Ordering**: Results are ordered by county, section, and owner for
   consistent output similar to the original table.

5. **Additional Columns**: The query includes normalized table IDs for
   reference and debugging purposes.

To use this query:
1. Run the main query to get the recreated acreage_schedule
2. Use the summary queries to validate data completeness
3. Use the validation queries to check for data integrity issues
4. Compare results with the original production table if available
*/
