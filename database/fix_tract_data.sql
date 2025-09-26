-- ============================================================================
-- FIX TRACT DATA - ADD NORMALIZED TABLES AND COMPREHENSIVE TRACT DATA
-- ============================================================================
-- This script adds the missing normalized tables and populates them with
-- comprehensive tract data to make the recreate_acreage_schedule.sql work

USE soonermineraldb;

-- ============================================================================
-- 1. CREATE MISSING NORMALIZED TABLES
-- ============================================================================

-- States table
CREATE TABLE IF NOT EXISTS states (
    id VARCHAR(36) PRIMARY KEY,
    code VARCHAR(2) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Counties table
CREATE TABLE IF NOT EXISTS counties (
    id VARCHAR(36) PRIMARY KEY,
    state_id VARCHAR(36) NOT NULL,
    name VARCHAR(100) NOT NULL,
    fip_id VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (state_id) REFERENCES states(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    UNIQUE KEY unique_county_state (name, state_id)
);

-- Basins table
CREATE TABLE IF NOT EXISTS basins (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Survey companies table
CREATE TABLE IF NOT EXISTS survey_companies (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Abstracts table
CREATE TABLE IF NOT EXISTS abstracts (
    id VARCHAR(36) PRIMARY KEY,
    county_id VARCHAR(36) NOT NULL,
    abstract_number VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (county_id) REFERENCES counties(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    UNIQUE KEY unique_abstract_county (abstract_number, county_id)
);

-- Sections table
CREATE TABLE IF NOT EXISTS sections (
    id VARCHAR(36) PRIMARY KEY,
    county_id VARCHAR(36) NOT NULL,
    section_number VARCHAR(10) NOT NULL,
    township VARCHAR(20),
    `range` VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (county_id) REFERENCES counties(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    UNIQUE KEY unique_section_county (section_number, county_id)
);

-- Properties table (consolidated property information)
CREATE TABLE IF NOT EXISTS properties (
    id VARCHAR(36) PRIMARY KEY,
    county_id VARCHAR(36) NOT NULL,
    section_id VARCHAR(36),
    abstract_id VARCHAR(36),
    survey_company_id VARCHAR(36),
    unique_id VARCHAR(100) UNIQUE,
    legal_description TEXT,
    gross_acres DECIMAL(10,2),
    is_state_land BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (county_id) REFERENCES counties(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (abstract_id) REFERENCES abstracts(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (survey_company_id) REFERENCES survey_companies(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Owner types table
CREATE TABLE IF NOT EXISTS owner_types (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Owners table
CREATE TABLE IF NOT EXISTS owners (
    id VARCHAR(36) PRIMARY KEY,
    owner_type_id VARCHAR(36) NOT NULL,
    legal_name VARCHAR(500) NOT NULL,
    display_name VARCHAR(255),
    is_deceased BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_type_id) REFERENCES owner_types(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Contact information table
CREATE TABLE IF NOT EXISTS contact_information (
    id VARCHAR(36) PRIMARY KEY,
    owner_id VARCHAR(36) NOT NULL,
    contact_type ENUM('Primary', 'Secondary', 'Legal', 'Estate') DEFAULT 'Primary',
    street_address TEXT,
    city VARCHAR(100),
    state_id VARCHAR(36),
    zip_code VARCHAR(10),
    phone_primary VARCHAR(20),
    phone_secondary VARCHAR(20),
    email VARCHAR(255),
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (state_id) REFERENCES states(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Interest types table
CREATE TABLE IF NOT EXISTS interest_types (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Mineral interests table
CREATE TABLE IF NOT EXISTS mineral_interests (
    id VARCHAR(36) PRIMARY KEY,
    property_id VARCHAR(36) NOT NULL,
    owner_id VARCHAR(36) NOT NULL,
    interest_type_id VARCHAR(36) NOT NULL,
    net_mineral_acres DECIMAL(10,4),
    royalty_percentage DECIMAL(5,4),
    net_revenue_interest DECIMAL(5,4),
    allocation_percentage DECIMAL(5,4),
    ownership_percentage DECIMAL(5,4),
    source_of_title VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (interest_type_id) REFERENCES interest_types(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Acquisition status types table
CREATE TABLE IF NOT EXISTS acquisition_status_types (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Acquisition tracking table
CREATE TABLE IF NOT EXISTS acquisition_tracking (
    id VARCHAR(36) PRIMARY KEY,
    mineral_interest_id VARCHAR(36) NOT NULL,
    buyer_id VARCHAR(36) NOT NULL,
    acquisition_status_id VARCHAR(36) NOT NULL,
    activity_count INT DEFAULT 0,
    notes TEXT,
    last_contact_date DATE,
    next_follow_up_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (mineral_interest_id) REFERENCES mineral_interests(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (acquisition_status_id) REFERENCES acquisition_status_types(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ============================================================================
-- 2. INSERT REFERENCE DATA
-- ============================================================================

-- Insert states data
INSERT IGNORE INTO states (id, code, name) VALUES
('state_tx', 'TX', 'Texas'),
('state_ok', 'OK', 'Oklahoma'),
('state_nm', 'NM', 'New Mexico');

-- Insert basins data
INSERT IGNORE INTO basins (id, name, description) VALUES
('basin_midland', 'Midland', 'Midland Basin in West Texas'),
('basin_delaware', 'Delaware', 'Delaware Basin in West Texas'),
('basin_anadarko', 'Anadarko', 'Anadarko Basin in Oklahoma');

-- Insert counties data
INSERT IGNORE INTO counties (id, state_id, name, fip_id) VALUES
('county_midland', 'state_tx', 'Midland', '329'),
('county_upton', 'state_tx', 'Upton', '461'),
('county_howard', 'state_tx', 'Howard', '227'),
('county_mitchell', 'state_tx', 'Mitchell', '335'),
('county_reeves', 'state_tx', 'Reeves', '389'),
('county_love', 'state_ok', 'Love', '085'),
('county_kingfisher', 'state_ok', 'Kingfisher', '073'),
('county_oklahoma', 'state_ok', 'Oklahoma', '109'),
('county_tulsa', 'state_ok', 'Tulsa', '143');

-- Insert survey companies data
INSERT IGNORE INTO survey_companies (id, name, description) VALUES
('survey_tp', 'T&P RR CO', 'Texas and Pacific Railway Company'),
('survey_hewt', 'HE&WT RR CO', 'Houston East & West Texas Railway Company'),
('survey_gcsf', 'GC&SF RR CO', 'Gulf, Colorado and Santa Fe Railway Company'),
('survey_psl', 'PSL', 'Public School Land');

-- Insert owner types data
INSERT IGNORE INTO owner_types (id, name, description) VALUES
('owner_type_individual', 'Individual', 'Individual owner'),
('owner_type_trust', 'Trust', 'Trust entity'),
('owner_type_llc', 'LLC', 'Limited Liability Company'),
('owner_type_corp', 'Corporation', 'Corporation'),
('owner_type_partnership', 'Partnership', 'Partnership');

-- Insert interest types data
INSERT IGNORE INTO interest_types (id, name, description) VALUES
('interest_type_minerals', 'MINERALS', 'Mineral rights interest'),
('interest_type_royalty', 'ROYALTY', 'Royalty interest'),
('interest_type_working', 'WORKING', 'Working interest');

-- Insert acquisition status types data
INSERT IGNORE INTO acquisition_status_types (id, name, description) VALUES
('acq_status_new', 'NEW', 'New acquisition target'),
('acq_status_working', 'WORKING', 'Currently working on acquisition'),
('acq_status_lvm_txt_email', 'LVM/TXT/EMAIL', 'Left voicemail/Text/Email status'),
('acq_status_wtl', 'WTL', 'Want to lease status'),
('acq_status_dropped', 'DROPPED', 'Dropped from acquisition'),
('acq_status_closed', 'CLOSED', 'Closed acquisition');

-- ============================================================================
-- 3. INSERT COMPREHENSIVE TRACT DATA
-- ============================================================================

-- Insert sections data
INSERT IGNORE INTO sections (id, county_id, section_number, township, `range`) VALUES
('sec_midland_15', 'county_midland', '15', 'T2S', 'R32E'),
('sec_upton_1', 'county_upton', '1', 'T1N', 'R1E'),
('sec_upton_2', 'county_upton', '2', 'T1N', 'R1E'),
('sec_howard_10', 'county_howard', '10', 'T1N', 'R1E'),
('sec_mitchell_5', 'county_mitchell', '5', 'T1N', 'R1E'),
('sec_reeves_8', 'county_reeves', '8', 'T1N', 'R1E'),
('sec_love_10', 'county_love', '10', 'T8S', 'R2E'),
('sec_kingfisher_12', 'county_kingfisher', '12', 'T15N', 'R8W'),
('sec_oklahoma_20', 'county_oklahoma', '20', 'T12N', 'R3W'),
('sec_tulsa_25', 'county_tulsa', '25', 'T19N', 'R12E');

-- Insert abstracts data
INSERT IGNORE INTO abstracts (id, county_id, abstract_number, description) VALUES
('abs_midland_1234', 'county_midland', 'A-1234', 'Original patent from T&P RR CO'),
('abs_upton_001', 'county_upton', 'A-001', 'Patent from T&P RR CO'),
('abs_upton_002', 'county_upton', 'A-002', 'Patent from T&P RR CO'),
('abs_howard_456', 'county_howard', 'B-456', 'Patent from HE&WT RR CO'),
('abs_mitchell_789', 'county_mitchell', 'C-789', 'Patent from GC&SF RR CO'),
('abs_reeves_012', 'county_reeves', 'D-012', 'Patent from PSL'),
('abs_love_345', 'county_love', 'E-345', 'Patent from T&P RR CO'),
('abs_kingfisher_678', 'county_kingfisher', 'F-678', 'Patent from HE&WT RR CO'),
('abs_oklahoma_901', 'county_oklahoma', 'G-901', 'Patent from GC&SF RR CO'),
('abs_tulsa_234', 'county_tulsa', 'H-234', 'Patent from PSL');

-- Insert properties data
INSERT IGNORE INTO properties (id, county_id, section_id, abstract_id, survey_company_id, unique_id, legal_description, gross_acres, is_state_land) VALUES
('prop_midland_001', 'county_midland', 'sec_midland_15', 'abs_midland_1234', 'survey_tp', 'MIDLAND-001', 'Section 15, Block 2, T&P RR Co. Survey, Midland County, Texas', 640.00, 0),
('prop_upton_001', 'county_upton', 'sec_upton_1', 'abs_upton_001', 'survey_tp', 'UPTON-001', 'Section 1, T1N R1E, Upton County, Texas', 640.00, 0),
('prop_upton_002', 'county_upton', 'sec_upton_2', 'abs_upton_002', 'survey_tp', 'UPTON-002', 'Section 2, T1N R1E, Upton County, Texas', 320.00, 0),
('prop_howard_001', 'county_howard', 'sec_howard_10', 'abs_howard_456', 'survey_hewt', 'HOWARD-001', 'Section 10, T1N R1E, Howard County, Texas', 640.00, 0),
('prop_mitchell_001', 'county_mitchell', 'sec_mitchell_5', 'abs_mitchell_789', 'survey_gcsf', 'MITCHELL-001', 'Section 5, T1N R1E, Mitchell County, Texas', 640.00, 0),
('prop_reeves_001', 'county_reeves', 'sec_reeves_8', 'abs_reeves_012', 'survey_psl', 'REEVES-001', 'Section 8, T1N R1E, Reeves County, Texas', 640.00, 0),
('prop_love_001', 'county_love', 'sec_love_10', 'abs_love_345', 'survey_tp', 'LOVE-001', 'W/2 of the SW/4 of Section 10, Township 8 South, Range 2 East, Love County, Oklahoma', 80.00, 0),
('prop_kingfisher_001', 'county_kingfisher', 'sec_kingfisher_12', 'abs_kingfisher_678', 'survey_hewt', 'KINGFISHER-001', 'Section 12, T15N R8W, Kingfisher County, Oklahoma', 640.00, 0),
('prop_oklahoma_001', 'county_oklahoma', 'sec_oklahoma_20', 'abs_oklahoma_901', 'survey_gcsf', 'OKLAHOMA-001', 'Section 20, T12N R3W, Oklahoma County, Oklahoma', 640.00, 0),
('prop_tulsa_001', 'county_tulsa', 'sec_tulsa_25', 'abs_tulsa_234', 'survey_psl', 'TULSA-001', 'Section 25, T19N R12E, Tulsa County, Oklahoma', 640.00, 0);

-- Insert owners data
INSERT IGNORE INTO owners (id, owner_type_id, legal_name, display_name, is_deceased) VALUES
('owner_smith_john', 'owner_type_individual', 'John Smith', 'John Smith', 0),
('owner_smith_family', 'owner_type_llc', 'Smith Family LLC', 'Smith Minerals', 0),
('owner_johnson_sarah', 'owner_type_individual', 'Sarah Johnson', 'Sarah Johnson', 0),
('owner_wilson_mike', 'owner_type_individual', 'Mike Wilson', 'Mike Wilson', 0),
('owner_brown_lisa', 'owner_type_individual', 'Lisa Brown', 'Lisa Brown', 0),
('owner_davis_robert', 'owner_type_trust', 'Robert Davis Trust', 'Davis Family Trust', 0),
('owner_miller_jane', 'owner_type_corp', 'Miller Energy Corporation', 'Miller Energy Corp', 0),
('owner_taylor_david', 'owner_type_partnership', 'Taylor & Associates Partnership', 'Taylor Partners', 0),
('owner_anderson_mary', 'owner_type_individual', 'Mary Anderson', 'Mary Anderson', 0),
('owner_thomas_james', 'owner_type_llc', 'Thomas Minerals LLC', 'Thomas Minerals', 0);

-- Insert contact information data
INSERT IGNORE INTO contact_information (id, owner_id, state_id, contact_type, street_address, city, zip_code, phone_primary, email, notes) VALUES
('contact_smith_john', 'owner_smith_john', 'state_tx', 'Primary', '123 Main St', 'Midland', '79701', '555-0101', 'john.smith@email.com', 'Primary contact for John Smith'),
('contact_smith_family', 'owner_smith_family', 'state_tx', 'Primary', '456 Oak Ave', 'Midland', '79701', '555-0102', 'jane.smith@email.com', 'Primary contact for Smith Family LLC'),
('contact_johnson_sarah', 'owner_johnson_sarah', 'state_ok', 'Primary', '789 Pine Rd', 'Ardmore', '73401', '555-0103', 'sarah.j@email.com', 'Primary contact for Sarah Johnson'),
('contact_wilson_mike', 'owner_wilson_mike', 'state_ok', 'Primary', '321 Elm St', 'Oklahoma City', '73101', '555-0104', 'mike.w@email.com', 'Primary contact for Mike Wilson'),
('contact_brown_lisa', 'owner_brown_lisa', 'state_ok', 'Primary', '654 Maple Dr', 'Tulsa', '74101', '555-0105', 'lisa.b@email.com', 'Primary contact for Lisa Brown'),
('contact_davis_robert', 'owner_davis_robert', 'state_tx', 'Primary', '987 Cedar Ln', 'Midland', '79701', '555-0106', 'robert.d@email.com', 'Primary contact for Robert Davis Trust'),
('contact_miller_jane', 'owner_miller_jane', 'state_tx', 'Primary', '147 Birch St', 'Midland', '79701', '555-0107', 'jane.m@email.com', 'Primary contact for Miller Energy Corporation'),
('contact_taylor_david', 'owner_taylor_david', 'state_ok', 'Primary', '258 Spruce Ave', 'Oklahoma City', '73101', '555-0108', 'david.t@email.com', 'Primary contact for Taylor & Associates Partnership'),
('contact_anderson_mary', 'owner_anderson_mary', 'state_tx', 'Primary', '369 Willow Way', 'Midland', '79701', '555-0109', 'mary.a@email.com', 'Primary contact for Mary Anderson'),
('contact_thomas_james', 'owner_thomas_james', 'state_ok', 'Primary', '741 Poplar Pl', 'Tulsa', '74101', '555-0110', 'james.t@email.com', 'Primary contact for Thomas Minerals LLC');

-- Insert mineral interests data
INSERT IGNORE INTO mineral_interests (id, property_id, owner_id, interest_type_id, net_mineral_acres, royalty_percentage, net_revenue_interest, ownership_percentage, source_of_title) VALUES
('min_midland_001', 'prop_midland_001', 'owner_smith_john', 'interest_type_minerals', 160.00, 0.1875, 0.1875, 25.00, 'Deed from T&P RR CO'),
('min_upton_001', 'prop_upton_001', 'owner_smith_family', 'interest_type_minerals', 320.00, 0.25, 0.25, 50.00, 'Deed from T&P RR CO'),
('min_upton_002', 'prop_upton_002', 'owner_johnson_sarah', 'interest_type_royalty', 80.00, 0.125, 0.125, 25.00, 'Deed from T&P RR CO'),
('min_howard_001', 'prop_howard_001', 'owner_wilson_mike', 'interest_type_minerals', 160.00, 0.1875, 0.1875, 25.00, 'Deed from HE&WT RR CO'),
('min_mitchell_001', 'prop_mitchell_001', 'owner_brown_lisa', 'interest_type_minerals', 320.00, 0.25, 0.25, 50.00, 'Deed from GC&SF RR CO'),
('min_reeves_001', 'prop_reeves_001', 'owner_davis_robert', 'interest_type_royalty', 160.00, 0.125, 0.125, 25.00, 'Deed from PSL'),
('min_love_001', 'prop_love_001', 'owner_miller_jane', 'interest_type_minerals', 40.00, 0.1875, 0.1875, 50.00, 'Deed from T&P RR CO'),
('min_kingfisher_001', 'prop_kingfisher_001', 'owner_taylor_david', 'interest_type_minerals', 160.00, 0.25, 0.25, 25.00, 'Deed from HE&WT RR CO'),
('min_oklahoma_001', 'prop_oklahoma_001', 'owner_anderson_mary', 'interest_type_royalty', 320.00, 0.125, 0.125, 50.00, 'Deed from GC&SF RR CO'),
('min_tulsa_001', 'prop_tulsa_001', 'owner_thomas_james', 'interest_type_minerals', 160.00, 0.1875, 0.1875, 25.00, 'Deed from PSL');

-- Insert acquisition tracking data
INSERT IGNORE INTO acquisition_tracking (id, mineral_interest_id, buyer_id, acquisition_status_id, activity_count, last_contact_date, next_follow_up_date, notes) VALUES
('acq_midland_001', 'min_midland_001', 'u4', 'acq_status_working', 3, '2024-01-15', '2024-01-22', 'Currently negotiating with John Smith'),
('acq_upton_001', 'min_upton_001', 'u4', 'acq_status_lvm_txt_email', 1, '2024-01-20', '2024-01-27', 'Left voicemail with Smith Family LLC'),
('acq_upton_002', 'min_upton_002', 'u4', 'acq_status_wtl', 2, '2024-01-18', '2024-01-25', 'Sarah Johnson wants to lease'),
('acq_howard_001', 'min_howard_001', 'u4', 'acq_status_new', 0, NULL, '2024-01-30', 'New acquisition target'),
('acq_mitchell_001', 'min_mitchell_001', 'u4', 'acq_status_working', 1, '2024-01-19', '2024-01-26', 'Initial contact with Lisa Brown'),
('acq_reeves_001', 'min_reeves_001', 'u4', 'acq_status_dropped', 5, '2024-01-10', NULL, 'Dropped due to title issues'),
('acq_love_001', 'min_love_001', 'u4', 'acq_status_closed', 3, '2024-01-12', NULL, 'Successfully closed acquisition'),
('acq_kingfisher_001', 'min_kingfisher_001', 'u4', 'acq_status_working', 2, '2024-01-17', '2024-01-24', 'Negotiating with David Taylor'),
('acq_oklahoma_001', 'min_oklahoma_001', 'u4', 'acq_status_lvm_txt_email', 1, '2024-01-21', '2024-01-28', 'Left voicemail with Mary Anderson'),
('acq_tulsa_001', 'min_tulsa_001', 'u4', 'acq_status_new', 0, NULL, '2024-01-31', 'New acquisition target');

-- ============================================================================
-- 4. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- States indexes
CREATE INDEX idx_states_code ON states(code);

-- Counties indexes
CREATE INDEX idx_counties_state ON counties(state_id);
CREATE INDEX idx_counties_name ON counties(name);

-- Properties indexes
CREATE INDEX idx_properties_county ON properties(county_id);
CREATE INDEX idx_properties_section ON properties(section_id);
CREATE INDEX idx_properties_abstract ON properties(abstract_id);
CREATE INDEX idx_properties_unique_id ON properties(unique_id);

-- Owners indexes
CREATE INDEX idx_owners_type ON owners(owner_type_id);
CREATE INDEX idx_owners_legal_name ON owners(legal_name);

-- Contact information indexes
CREATE INDEX idx_contact_info_owner ON contact_information(owner_id);
CREATE INDEX idx_contact_info_phone ON contact_information(phone_primary);
CREATE INDEX idx_contact_info_email ON contact_information(email);

-- Mineral interests indexes
CREATE INDEX idx_mineral_interests_property ON mineral_interests(property_id);
CREATE INDEX idx_mineral_interests_owner ON mineral_interests(owner_id);
CREATE INDEX idx_mineral_interests_type ON mineral_interests(interest_type_id);

-- Acquisition tracking indexes
CREATE INDEX idx_acquisition_tracking_interest ON acquisition_tracking(mineral_interest_id);
CREATE INDEX idx_acquisition_tracking_buyer ON acquisition_tracking(buyer_id);
CREATE INDEX idx_acquisition_tracking_status ON acquisition_tracking(acquisition_status_id);

-- ============================================================================
-- 5. VERIFICATION QUERIES
-- ============================================================================

-- Count records in each table
SELECT 'States' AS table_name, COUNT(*) AS record_count FROM states
UNION ALL
SELECT 'Counties', COUNT(*) FROM counties
UNION ALL
SELECT 'Properties', COUNT(*) FROM properties
UNION ALL
SELECT 'Owners', COUNT(*) FROM owners
UNION ALL
SELECT 'Contact Information', COUNT(*) FROM contact_information
UNION ALL
SELECT 'Mineral Interests', COUNT(*) FROM mineral_interests
UNION ALL
SELECT 'Acquisition Tracking', COUNT(*) FROM acquisition_tracking;

-- ============================================================================
-- TRACT DATA FIX COMPLETE
-- ============================================================================
-- The database now has comprehensive tract data in normalized tables that
-- will work with the recreate_acreage_schedule.sql query.
