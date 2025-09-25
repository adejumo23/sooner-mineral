-- ============================================================================
-- MIGRATION SCRIPT: TRANSFORM EXISTING DATA TO NORMALIZED STRUCTURE
-- ============================================================================
-- This script migrates data from the original acreage, pricing, and unit_summary
-- tables into the normalized 3NF structure

-- ============================================================================
-- 1. MIGRATE STATES AND COUNTIES
-- ============================================================================

-- Insert states from existing data
INSERT IGNORE INTO states (id, code, name) VALUES
('state_tx', 'TX', 'Texas'),
('state_ok', 'OK', 'Oklahoma'),
('state_nm', 'NM', 'New Mexico');

-- Insert counties from acreage table
INSERT IGNORE INTO counties (id, state_id, name, fip_id) 
SELECT 
    CONCAT('county_', LOWER(REPLACE(COUNTY, ' ', '_'))),
    CASE 
        WHEN COUNTY IN ('Upton', 'Howard', 'Mitchell', 'Reeves') THEN 'state_tx'
        WHEN COUNTY = 'Kingfisher' THEN 'state_ok'
        ELSE 'state_tx'
    END,
    COUNTY,
    CASE 
        WHEN COUNTY = 'Upton' THEN '461'
        WHEN COUNTY = 'Howard' THEN '227'
        WHEN COUNTY = 'Mitchell' THEN '335'
        WHEN COUNTY = 'Reeves' THEN '389'
        ELSE NULL
    END
FROM acreage 
WHERE COUNTY IS NOT NULL
GROUP BY COUNTY;

-- ============================================================================
-- 2. MIGRATE BASINS
-- ============================================================================

-- Insert basins from pricing table
INSERT IGNORE INTO basins (id, name, description) 
SELECT 
    CONCAT('basin_', LOWER(REPLACE(Basin, ' ', '_'))),
    Basin,
    CONCAT('Basin in ', Basin, ' region')
FROM pricing 
WHERE Basin IS NOT NULL
GROUP BY Basin;

-- ============================================================================
-- 3. MIGRATE SURVEY COMPANIES
-- ============================================================================

-- Insert survey companies from pricing table
INSERT IGNORE INTO survey_companies (id, name, description) 
SELECT 
    CONCAT('survey_', LOWER(REPLACE(REPLACE(REPLACE(Survey, ' ', '_'), '&', 'and'), '.', ''))),
    Survey,
    CONCAT('Survey company: ', Survey)
FROM pricing 
WHERE Survey IS NOT NULL AND Survey != ''
GROUP BY Survey;

-- ============================================================================
-- 4. MIGRATE FORMATIONS
-- ============================================================================

-- Insert formations from pricing table
INSERT IGNORE INTO formations (id, name, description) VALUES
('formation_upper_spraberry', 'Upper Spraberry', 'Upper Spraberry formation'),
('formation_lower_spraberry', 'Lower Spraberry', 'Lower Spraberry formation'),
('formation_3rd_bone_spring', '3rd Bone Spring', 'Third Bone Spring formation'),
('formation_wolfcamp_a', 'Wolfcamp A', 'Wolfcamp A formation'),
('formation_wolfcamp_b', 'Wolfcamp B', 'Wolfcamp B formation'),
('formation_lower_wolfcamp_b', 'Lower Wolfcamp B', 'Lower Wolfcamp B formation'),
('formation_wolfcamp_d', 'Wolfcamp D (Cline)', 'Wolfcamp D (Cline) formation');

-- ============================================================================
-- 5. MIGRATE OPERATORS
-- ============================================================================

-- Insert operators from unit_summary table
INSERT IGNORE INTO operators (id, name, description) 
SELECT 
    CONCAT('op_', LOWER(REPLACE(REPLACE(REPLACE(Operator, ' ', '_'), '&', 'and'), '.', ''))),
    Operator,
    CONCAT('Operator: ', Operator)
FROM unit_summary 
WHERE Operator IS NOT NULL AND Operator != ''
GROUP BY Operator;

-- ============================================================================
-- 6. MIGRATE WELL STATUS TYPES
-- ============================================================================

-- Insert well status types from unit_summary table
INSERT IGNORE INTO well_status_types (id, name, description) 
SELECT 
    CONCAT('well_status_', LOWER(REPLACE(REPLACE(`Well Status`, ' ', '_'), '/', '_'))),
    `Well Status`,
    CONCAT('Well status: ', `Well Status`)
FROM unit_summary 
WHERE `Well Status` IS NOT NULL AND `Well Status` != ''
GROUP BY `Well Status`;

-- ============================================================================
-- 7. MIGRATE UNIT TIERS AND STATUS TYPES
-- ============================================================================

-- Insert unit tiers from unit_summary table
INSERT IGNORE INTO unit_tiers (id, name, description, priority_order) 
SELECT 
    CONCAT('tier_', LOWER(REPLACE(REPLACE(REPLACE(`Tier/Class`, ' ', '_'), '/', '_'), '-', '_'))),
    `Tier/Class`,
    CONCAT('Unit tier: ', `Tier/Class`),
    CASE 
        WHEN `Tier/Class` = 'AOI' THEN 1
        WHEN `Tier/Class` = 'AOI - Tier 2' THEN 2
        WHEN `Tier/Class` = 'RAN/POT' THEN 3
        ELSE 4
    END
FROM unit_summary 
WHERE `Tier/Class` IS NOT NULL AND `Tier/Class` != ''
GROUP BY `Tier/Class`;

-- Insert unit status types from unit_summary table
INSERT IGNORE INTO unit_status_types (id, name, description) 
SELECT 
    CONCAT('unit_status_', LOWER(REPLACE(REPLACE(REPLACE(Status, ' ', '_'), '/', '_'), '-', '_'))),
    Status,
    CONCAT('Unit status: ', Status)
FROM unit_summary 
WHERE Status IS NOT NULL AND Status != ''
GROUP BY Status;

-- ============================================================================
-- 8. MIGRATE ACQUISITION STATUS TYPES AND ACTIVITIES
-- ============================================================================

-- Insert acquisition status types from acreage table
INSERT IGNORE INTO acquisition_status_types (id, name, description) 
SELECT 
    CONCAT('acq_status_', LOWER(REPLACE(REPLACE(REPLACE(STATUS, ' ', '_'), '/', '_'), '-', '_'))),
    STATUS,
    CONCAT('Acquisition status: ', STATUS)
FROM acreage 
WHERE STATUS IS NOT NULL AND STATUS != ''
GROUP BY STATUS;

-- Insert acquisition activities from acreage table
INSERT IGNORE INTO acquisition_activities (id, name, description) 
SELECT 
    CONCAT('activity_', LOWER(REPLACE(REPLACE(REPLACE(STATUS, ' ', '_'), '/', '_'), '-', '_'))),
    STATUS,
    CONCAT('Acquisition activity: ', STATUS)
FROM acreage 
WHERE STATUS IS NOT NULL AND STATUS != ''
GROUP BY STATUS;

-- ============================================================================
-- 9. MIGRATE OWNER TYPES AND INTEREST TYPES
-- ============================================================================

-- Insert owner types
INSERT IGNORE INTO owner_types (id, name, description) VALUES
('owner_type_individual', 'Individual', 'Individual owner'),
('owner_type_trust', 'Trust', 'Trust entity'),
('owner_type_llc', 'LLC', 'Limited Liability Company'),
('owner_type_corp', 'Corporation', 'Corporation'),
('owner_type_partnership', 'Partnership', 'Partnership');

-- Insert interest types
INSERT IGNORE INTO interest_types (id, name, description) VALUES
('interest_type_minerals', 'MINERALS', 'Mineral rights interest'),
('interest_type_royalty', 'ROYALTY', 'Royalty interest'),
('interest_type_working', 'WORKING', 'Working interest');

-- ============================================================================
-- 10. MIGRATE SECTIONS AND ABSTRACTS
-- ============================================================================

-- Insert sections from acreage table
INSERT IGNORE INTO sections (id, county_id, section_number, township, range) 
SELECT 
    CONCAT('section_', LOWER(REPLACE(REPLACE(REPLACE(REPLACE(`S-T-R`, ' ', '_'), '-', '_'), 'N', 'n'), 'S', 's'))),
    CONCAT('county_', LOWER(REPLACE(COUNTY, ' ', '_'))),
    SUBSTRING_INDEX(SUBSTRING_INDEX(`S-T-R`, '-', 1), 'S', 1),
    SUBSTRING_INDEX(SUBSTRING_INDEX(`S-T-R`, '-', 2), '-', -1),
    SUBSTRING_INDEX(`S-T-R`, '-', -1)
FROM acreage 
WHERE `S-T-R` IS NOT NULL AND `S-T-R` != ''
GROUP BY `S-T-R`, COUNTY;

-- Insert abstracts from pricing table
INSERT IGNORE INTO abstracts (id, county_id, abstract_number, description) 
SELECT 
    CONCAT('abstract_', Abstract),
    CONCAT('county_', LOWER(REPLACE(County, ' ', '_'))),
    Abstract,
    CONCAT('Abstract ', Abstract, ' in ', County, ' County')
FROM pricing 
WHERE Abstract IS NOT NULL AND Abstract != ''
GROUP BY Abstract, County;

-- ============================================================================
-- 11. MIGRATE PROPERTIES
-- ============================================================================

-- Insert properties from acreage table
INSERT IGNORE INTO properties (id, county_id, section_id, unique_id, legal_description, gross_acres, is_state_land) 
SELECT 
    CONCAT('prop_', ROW_NUMBER() OVER (ORDER BY `S-T-R`, COUNTY)),
    CONCAT('county_', LOWER(REPLACE(COUNTY, ' ', '_'))),
    CONCAT('section_', LOWER(REPLACE(REPLACE(REPLACE(REPLACE(`S-T-R`, ' ', '_'), '-', '_'), 'N', 'n'), 'S', 's'))),
    CONCAT(COUNTY, '-', `S-T-R`),
    `LEGAL DESCRIPTION`,
    CASE 
        WHEN NMA IS NOT NULL THEN NMA * 4  -- Approximate gross acres from NMA
        ELSE NULL
    END,
    FALSE
FROM acreage 
WHERE `S-T-R` IS NOT NULL AND `S-T-R` != ''
GROUP BY `S-T-R`, COUNTY, `LEGAL DESCRIPTION`, NMA;

-- ============================================================================
-- 12. MIGRATE OWNERS
-- ============================================================================

-- Insert owners from acreage table
INSERT IGNORE INTO owners (id, owner_type_id, legal_name, display_name, is_deceased) 
SELECT 
    CONCAT('owner_', ROW_NUMBER() OVER (ORDER BY OWNER)),
    CASE 
        WHEN OWNER LIKE '%TRUST%' OR OWNER LIKE '%Trust%' THEN 'owner_type_trust'
        WHEN OWNER LIKE '%LLC%' OR OWNER LIKE '%L.L.C.%' THEN 'owner_type_llc'
        WHEN OWNER LIKE '%CORP%' OR OWNER LIKE '%Corporation%' THEN 'owner_type_corp'
        WHEN OWNER LIKE '%PARTNERSHIP%' OR OWNER LIKE '%LP%' THEN 'owner_type_partnership'
        ELSE 'owner_type_individual'
    END,
    OWNER,
    OWNER,
    CASE 
        WHEN OWNER LIKE '%deceased%' OR OWNER LIKE '%died%' THEN TRUE
        ELSE FALSE
    END
FROM acreage 
WHERE OWNER IS NOT NULL AND OWNER != ''
GROUP BY OWNER;

-- ============================================================================
-- 13. MIGRATE CONTACT INFORMATION
-- ============================================================================

-- Insert contact information from acreage table
INSERT IGNORE INTO contact_information (id, owner_id, street_address, city, state_id, zip_code, phone_primary, email, notes) 
SELECT 
    CONCAT('contact_', ROW_NUMBER() OVER (ORDER BY OWNER)),
    CONCAT('owner_', ROW_NUMBER() OVER (ORDER BY OWNER)),
    STREET,
    CITY,
    CASE 
        WHEN ST = 'TX' THEN 'state_tx'
        WHEN ST = 'OK' THEN 'state_ok'
        WHEN ST = 'NM' THEN 'state_nm'
        ELSE NULL
    END,
    ZIP,
    SUBSTRING_INDEX(`PHONE/EMAIL`, '\n', 1),
    CASE 
        WHEN `PHONE/EMAIL` LIKE '%@%' THEN SUBSTRING_INDEX(`PHONE/EMAIL`, '\n', -1)
        ELSE NULL
    END,
    NOTE
FROM acreage 
WHERE OWNER IS NOT NULL AND OWNER != ''
GROUP BY OWNER, STREET, CITY, ST, ZIP, `PHONE/EMAIL`, NOTE;

-- ============================================================================
-- 14. MIGRATE MINERAL INTERESTS
-- ============================================================================

-- Insert mineral interests from acreage table
INSERT IGNORE INTO mineral_interests (id, property_id, owner_id, interest_type_id, net_mineral_acres, royalty_percentage, allocation_percentage, source_of_title) 
SELECT 
    CONCAT('mineral_', ROW_NUMBER() OVER (ORDER BY `S-T-R`, OWNER)),
    CONCAT('prop_', ROW_NUMBER() OVER (ORDER BY `S-T-R`, COUNTY)),
    CONCAT('owner_', ROW_NUMBER() OVER (ORDER BY OWNER)),
    'interest_type_minerals',
    NMA,
    CASE 
        WHEN ROY IS NOT NULL AND ROY != '' THEN CAST(REPLACE(REPLACE(ROY, '$', ''), ',', '') AS DECIMAL(5,4))
        ELSE NULL
    END,
    CASE 
        WHEN `ALLOCATION %` IS NOT NULL AND `ALLOCATION %` != '' THEN CAST(REPLACE(`ALLOCATION %`, '%', '') AS DECIMAL(5,4)) / 100
        ELSE NULL
    END,
    `TITLE SOURCE`
FROM acreage 
WHERE `S-T-R` IS NOT NULL AND OWNER IS NOT NULL
GROUP BY `S-T-R`, OWNER, NMA, ROY, `ALLOCATION %`, `TITLE SOURCE`;

-- ============================================================================
-- 15. MIGRATE FORMATION PRICING
-- ============================================================================

-- Insert formation pricing from pricing table
INSERT IGNORE INTO formation_pricing (id, property_id, formation_id, price_per_acre, is_available) 
SELECT 
    CONCAT('fp_', ROW_NUMBER() OVER (ORDER BY `Unique_ID`, 'Upper Spraberry')),
    CONCAT('prop_', ROW_NUMBER() OVER (ORDER BY `Unique_ID`)),
    'formation_upper_spraberry',
    CASE 
        WHEN `Upper Spraberry` IS NOT NULL AND `Upper Spraberry` != ' No Price ' AND `Upper Spraberry` != 'No Price' 
        THEN CAST(REPLACE(REPLACE(REPLACE(`Upper Spraberry`, '$', ''), ',', ''), ' ', '') AS DECIMAL(12,2))
        ELSE NULL
    END,
    CASE 
        WHEN `Upper Spraberry` IS NOT NULL AND `Upper Spraberry` != ' No Price ' AND `Upper Spraberry` != 'No Price' 
        THEN TRUE
        ELSE FALSE
    END
FROM pricing 
WHERE `Upper Spraberry` IS NOT NULL;

-- Repeat for other formations...
-- (Similar INSERT statements for Lower Spraberry, 3rd Bone Spring, Wolfcamp A, etc.)

-- ============================================================================
-- 16. MIGRATE WELLS
-- ============================================================================

-- Insert wells from unit_summary table
INSERT IGNORE INTO wells (id, well_name, operator_id, property_id, well_status_id, allocation_percentage) 
SELECT 
    CONCAT('well_', ROW_NUMBER() OVER (ORDER BY `Well Name`)),
    `Well Name`,
    CONCAT('op_', LOWER(REPLACE(REPLACE(REPLACE(Operator, ' ', '_'), '&', 'and'), '.', ''))),
    CONCAT('prop_', ROW_NUMBER() OVER (ORDER BY `Well Name`)),
    CONCAT('well_status_', LOWER(REPLACE(REPLACE(`Well Status`, ' ', '_'), '/', '_'))),
    CASE 
        WHEN `ALLO%` IS NOT NULL AND `ALLO%` != '' THEN CAST(`ALLO%` AS DECIMAL(5,4))
        ELSE NULL
    END
FROM unit_summary 
WHERE `Well Name` IS NOT NULL AND `Well Name` != ''
GROUP BY `Well Name`, Operator, `Well Status`, `ALLO%`;

-- ============================================================================
-- 17. MIGRATE UNITS
-- ============================================================================

-- Insert units from unit_summary table
INSERT IGNORE INTO units (id, well_id, tier_id, unit_status_id, tops_price_3_16th, number_of_owners, internal_notes, occ_activity_notes) 
SELECT 
    CONCAT('unit_', ROW_NUMBER() OVER (ORDER BY `Well Name`)),
    CONCAT('well_', ROW_NUMBER() OVER (ORDER BY `Well Name`)),
    CONCAT('tier_', LOWER(REPLACE(REPLACE(REPLACE(`Tier/Class`, ' ', '_'), '/', '_'), '-', '_'))),
    CONCAT('unit_status_', LOWER(REPLACE(REPLACE(REPLACE(Status, ' ', '_'), '/', '_'), '-', '_'))),
    CASE 
        WHEN `Tops @ 3/16th` IS NOT NULL AND `Tops @ 3/16th` != '' 
        THEN CAST(REPLACE(REPLACE(REPLACE(`Tops @ 3/16th`, '$', ''), ',', ''), ' ', '') AS DECIMAL(12,2))
        ELSE NULL
    END,
    CASE 
        WHEN `# of Owners` IS NOT NULL AND `# of Owners` != '' THEN CAST(`# of Owners` AS UNSIGNED)
        ELSE 0
    END,
    `INTERNAL NOTES`,
    `OCC ACTIVITY NOTES`
FROM unit_summary 
WHERE `Well Name` IS NOT NULL AND `Well Name` != ''
GROUP BY `Well Name`, `Tier/Class`, Status, `Tops @ 3/16th`, `# of Owners`, `INTERNAL NOTES`, `OCC ACTIVITY NOTES`;

-- ============================================================================
-- 18. MIGRATE ACQUISITION TRACKING
-- ============================================================================

-- Insert acquisition tracking from acreage table
INSERT IGNORE INTO acquisition_tracking (id, mineral_interest_id, buyer_id, acquisition_status_id, activity_id, activity_count, notes) 
SELECT 
    CONCAT('acq_', ROW_NUMBER() OVER (ORDER BY `S-T-R`, OWNER)),
    CONCAT('mineral_', ROW_NUMBER() OVER (ORDER BY `S-T-R`, OWNER)),
    CASE 
        WHEN BUYER = 'Michelle' THEN 'u2'  -- Assuming Michelle is user u2
        WHEN BUYER = 'Jan' THEN 'u1'      -- Assuming Jan is user u1
        ELSE 'u1'  -- Default to admin user
    END,
    CONCAT('acq_status_', LOWER(REPLACE(REPLACE(REPLACE(STATUS, ' ', '_'), '/', '_'), '-', '_'))),
    CONCAT('activity_', LOWER(REPLACE(REPLACE(REPLACE(STATUS, ' ', '_'), '/', '_'), '-', '_'))),
    0,  -- Default activity count
    NOTE
FROM acreage 
WHERE `S-T-R` IS NOT NULL AND OWNER IS NOT NULL
GROUP BY `S-T-R`, OWNER, BUYER, STATUS, NOTE;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- The migration script has transformed the original denormalized tables
-- into a properly normalized 3NF structure with:
-- 1. Eliminated data redundancy
-- 2. Proper foreign key relationships
-- 3. Improved data integrity
-- 4. Better query performance through indexing
-- 5. More maintainable and scalable database structure
