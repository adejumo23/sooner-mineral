-- =====================================================
-- NORMALIZED DATA VIEWING QUERIES
-- =====================================================
-- These queries help explore the newly normalized data structure
-- Run these queries to understand how data flows through the 3NF structure

-- =====================================================
-- 1. OVERVIEW QUERIES - See what data exists
-- =====================================================

-- Count records in each normalized table
SELECT 'states' as table_name, COUNT(*) as record_count FROM states
UNION ALL
SELECT 'counties', COUNT(*) FROM counties
UNION ALL
SELECT 'basins', COUNT(*) FROM basins
UNION ALL
SELECT 'formations', COUNT(*) FROM formations
UNION ALL
SELECT 'survey_companies', COUNT(*) FROM survey_companies
UNION ALL
SELECT 'operators', COUNT(*) FROM operators
UNION ALL
SELECT 'properties', COUNT(*) FROM properties
UNION ALL
SELECT 'formation_pricing', COUNT(*) FROM formation_pricing
UNION ALL
SELECT 'owners', COUNT(*) FROM owners
UNION ALL
SELECT 'mineral_interests', COUNT(*) FROM mineral_interests
UNION ALL
SELECT 'wells', COUNT(*) FROM wells
UNION ALL
SELECT 'units', COUNT(*) FROM units
ORDER BY table_name;

-- =====================================================
-- 2. PRICING DATA QUERIES
-- =====================================================

-- View normalized pricing data (Texas)
SELECT 
    c.name as county,
    b.name as basin,
    f.name as formation,
    sc.name as survey_company,
    fp.price_per_acre,
    fp.created_at
FROM formation_pricing fp
JOIN properties p ON fp.property_id = p.id
JOIN counties c ON p.county_id = c.id
JOIN basins b ON p.basin_id = b.id
JOIN formations f ON fp.formation_id = f.id
JOIN survey_companies sc ON p.survey_company_id = sc.id
WHERE c.name LIKE '%Texas%' OR c.name IN ('Midland', 'Reeves', 'Loving', 'Ward', 'Culberson')
ORDER BY fp.price_per_acre DESC
LIMIT 20;

-- View normalized pricing data (Oklahoma)
SELECT 
    c.name as county,
    b.name as basin,
    f.name as formation,
    sc.name as survey_company,
    fp.price_per_acre,
    fp.created_at
FROM formation_pricing fp
JOIN properties p ON fp.property_id = p.id
JOIN counties c ON p.county_id = c.id
JOIN basins b ON p.basin_id = b.id
JOIN formations f ON fp.formation_id = f.id
JOIN survey_companies sc ON p.survey_company_id = sc.id
WHERE c.name LIKE '%Oklahoma%' OR c.name IN ('Kingfisher', 'Blaine', 'Caddo')
ORDER BY fp.price_per_acre DESC
LIMIT 20;

-- Pricing summary by formation
SELECT 
    f.name as formation,
    COUNT(*) as pricing_records,
    AVG(fp.price_per_acre) as avg_price,
    MIN(fp.price_per_acre) as min_price,
    MAX(fp.price_per_acre) as max_price
FROM formation_pricing fp
JOIN formations f ON fp.formation_id = f.id
GROUP BY f.name
ORDER BY avg_price DESC;

-- =====================================================
-- 3. ACREAGE DATA QUERIES
-- =====================================================

-- View normalized acreage/ownership data
SELECT 
    o.legal_name as owner,
    c.name as county,
    s.section_number,
    s.township,
    s.range,
    mi.net_mineral_acres,
    mi.interest_percentage,
    ast.name as acquisition_status,
    aa.name as acquisition_activity
FROM mineral_interests mi
JOIN owners o ON mi.owner_id = o.id
JOIN properties p ON mi.property_id = p.id
JOIN counties c ON p.county_id = c.id
JOIN sections s ON p.section_id = s.id
LEFT JOIN acquisition_tracking at ON mi.id = at.mineral_interest_id
LEFT JOIN acquisition_status_types ast ON at.acquisition_status_id = ast.id
LEFT JOIN acquisition_activities aa ON at.acquisition_activity_id = aa.id
ORDER BY mi.net_mineral_acres DESC
LIMIT 20;

-- Acreage summary by county
SELECT 
    c.name as county,
    COUNT(DISTINCT o.id) as unique_owners,
    COUNT(mi.id) as mineral_interests,
    SUM(mi.net_mineral_acres) as total_acres,
    AVG(mi.interest_percentage) as avg_interest
FROM mineral_interests mi
JOIN owners o ON mi.owner_id = o.id
JOIN properties p ON mi.property_id = p.id
JOIN counties c ON p.county_id = c.id
GROUP BY c.name
ORDER BY total_acres DESC;

-- =====================================================
-- 4. UNIT/WELL DATA QUERIES
-- =====================================================

-- View normalized well and unit data
SELECT 
    op.name as operator,
    w.well_name,
    wst.name as well_status,
    ut.name as unit_tier,
    ust.name as unit_status,
    u.unit_name,
    u.allocation_percentage,
    u.owner_count,
    u.pricing_per_acre
FROM wells w
JOIN operators op ON w.operator_id = op.id
JOIN well_status_types wst ON w.well_status_id = wst.id
JOIN units u ON w.unit_id = u.id
JOIN unit_tiers ut ON u.unit_tier_id = ut.id
JOIN unit_status_types ust ON u.unit_status_id = ust.id
ORDER BY u.pricing_per_acre DESC
LIMIT 20;

-- Unit summary by operator
SELECT 
    op.name as operator,
    COUNT(DISTINCT u.id) as total_units,
    COUNT(w.id) as total_wells,
    AVG(u.allocation_percentage) as avg_allocation,
    AVG(u.pricing_per_acre) as avg_pricing
FROM units u
JOIN wells w ON u.id = w.unit_id
JOIN operators op ON w.operator_id = op.id
GROUP BY op.name
ORDER BY total_units DESC;

-- =====================================================
-- 5. CROSS-REFERENCE QUERIES
-- =====================================================

-- Properties with both pricing and mineral interests
SELECT 
    c.name as county,
    s.section_number,
    COUNT(DISTINCT fp.id) as pricing_records,
    COUNT(DISTINCT mi.id) as mineral_interests,
    AVG(fp.price_per_acre) as avg_price,
    SUM(mi.net_mineral_acres) as total_acres
FROM properties p
JOIN counties c ON p.county_id = c.id
JOIN sections s ON p.section_id = s.id
LEFT JOIN formation_pricing fp ON p.id = fp.property_id
LEFT JOIN mineral_interests mi ON p.id = mi.property_id
GROUP BY c.name, s.section_number
HAVING pricing_records > 0 AND mineral_interests > 0
ORDER BY avg_price DESC
LIMIT 15;

-- =====================================================
-- 6. DATA QUALITY QUERIES
-- =====================================================

-- Check for orphaned records
SELECT 'formation_pricing without properties' as issue, COUNT(*) as count
FROM formation_pricing fp
LEFT JOIN properties p ON fp.property_id = p.id
WHERE p.id IS NULL

UNION ALL

SELECT 'mineral_interests without properties', COUNT(*)
FROM mineral_interests mi
LEFT JOIN properties p ON mi.property_id = p.id
WHERE p.id IS NULL

UNION ALL

SELECT 'wells without operators', COUNT(*)
FROM wells w
LEFT JOIN operators op ON w.operator_id = op.id
WHERE op.id IS NULL

UNION ALL

SELECT 'properties without counties', COUNT(*)
FROM properties p
LEFT JOIN counties c ON p.county_id = c.id
WHERE c.id IS NULL;

-- =====================================================
-- 7. COMPARISON QUERIES - Original vs Normalized
-- =====================================================

-- Compare original production data with normalized data
-- (These queries assume the original prod_ tables still exist)

-- Texas pricing comparison
SELECT 
    'Original' as source,
    COUNT(*) as record_count,
    AVG(CAST(price_per_acre AS DECIMAL(10,2))) as avg_price
FROM prod_texas_pricing
WHERE price_per_acre IS NOT NULL AND price_per_acre != ''

UNION ALL

SELECT 
    'Normalized',
    COUNT(*),
    AVG(fp.price_per_acre)
FROM formation_pricing fp
JOIN properties p ON fp.property_id = p.id
JOIN counties c ON p.county_id = c.id
WHERE c.name IN ('Midland', 'Reeves', 'Loving', 'Ward', 'Culberson');

-- =====================================================
-- 8. USEFUL LOOKUP QUERIES
-- =====================================================

-- All available formations
SELECT name, created_at FROM formations ORDER BY name;

-- All available operators
SELECT name, created_at FROM operators ORDER BY name;

-- All available counties with states
SELECT 
    c.name as county,
    s.name as state,
    c.fip_id
FROM counties c
JOIN states s ON c.state_id = s.id
ORDER BY s.name, c.name;

-- All available basins
SELECT name, created_at FROM basins ORDER BY name;

-- =====================================================
-- 9. PERFORMANCE QUERIES
-- =====================================================

-- Most expensive formations by average price
SELECT 
    f.name as formation,
    COUNT(*) as pricing_records,
    AVG(fp.price_per_acre) as avg_price,
    MAX(fp.price_per_acre) as max_price
FROM formation_pricing fp
JOIN formations f ON fp.formation_id = f.id
GROUP BY f.name
HAVING COUNT(*) >= 5  -- Only formations with 5+ pricing records
ORDER BY avg_price DESC
LIMIT 10;

-- Largest mineral interest holders
SELECT 
    o.legal_name as owner,
    COUNT(mi.id) as mineral_interests,
    SUM(mi.net_mineral_acres) as total_acres,
    AVG(mi.interest_percentage) as avg_interest
FROM owners o
JOIN mineral_interests mi ON o.id = mi.owner_id
GROUP BY o.legal_name
HAVING total_acres > 0
ORDER BY total_acres DESC
LIMIT 15;
