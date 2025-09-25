-- ============================================================================
-- NORMALIZED DATABASE SCHEMA (3NF) FOR SOONER MINERAL
-- ============================================================================
-- This file contains the normalized version of acreage, pricing, and unit_summary tables
-- Normalized to 3NF to eliminate redundancy and ensure data integrity

-- ============================================================================
-- 1. LOCATION TABLES
-- ============================================================================

-- States table
CREATE TABLE states (
    id VARCHAR(36) PRIMARY KEY,
    code VARCHAR(2) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Counties table
CREATE TABLE counties (
    id VARCHAR(36) PRIMARY KEY,
    state_id VARCHAR(36) NOT NULL,
    name VARCHAR(100) NOT NULL,
    fip_id VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (state_id) REFERENCES states(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    UNIQUE KEY unique_county_state (name, state_id)
);

-- Basins table
CREATE TABLE basins (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 2. PROPERTY/TRACT TABLES
-- ============================================================================

-- Survey companies table
CREATE TABLE survey_companies (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Abstracts table
CREATE TABLE abstracts (
    id VARCHAR(36) PRIMARY KEY,
    county_id VARCHAR(36) NOT NULL,
    abstract_number VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (county_id) REFERENCES counties(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    UNIQUE KEY unique_abstract_county (abstract_number, county_id)
);

-- Sections table
CREATE TABLE sections (
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
CREATE TABLE properties (
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

-- ============================================================================
-- 3. OWNER/CONTACT TABLES
-- ============================================================================

-- Owner types table
CREATE TABLE owner_types (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Owners table
CREATE TABLE owners (
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
CREATE TABLE contact_information (
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

-- ============================================================================
-- 4. MINERAL INTEREST TABLES
-- ============================================================================

-- Interest types table
CREATE TABLE interest_types (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Mineral interests table
CREATE TABLE mineral_interests (
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

-- ============================================================================
-- 5. FORMATION/PRICING TABLES
-- ============================================================================

-- Formations table
CREATE TABLE formations (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Formation pricing table
CREATE TABLE formation_pricing (
    id VARCHAR(36) PRIMARY KEY,
    property_id VARCHAR(36) NOT NULL,
    formation_id VARCHAR(36) NOT NULL,
    price_per_acre DECIMAL(12,2),
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (formation_id) REFERENCES formations(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    UNIQUE KEY unique_property_formation (property_id, formation_id)
);

-- Property pricing summary table
CREATE TABLE property_pricing_summary (
    id VARCHAR(36) PRIMARY KEY,
    property_id VARCHAR(36) NOT NULL,
    basin_id VARCHAR(36) NOT NULL,
    number_of_zones INT DEFAULT 0,
    output_price DECIMAL(12,2),
    price_per_boe DECIMAL(10,2),
    total_boe_per_acre DECIMAL(10,2),
    total_boe_per_anum DECIMAL(12,2),
    letter_rank VARCHAR(10),
    nra_price DECIMAL(12,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (basin_id) REFERENCES basins(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    UNIQUE KEY unique_property_pricing (property_id)
);

-- ============================================================================
-- 6. WELL/UNIT TABLES
-- ============================================================================

-- Operators table
CREATE TABLE operators (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Well status types table
CREATE TABLE well_status_types (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Wells table
CREATE TABLE wells (
    id VARCHAR(36) PRIMARY KEY,
    well_name VARCHAR(255) NOT NULL,
    operator_id VARCHAR(36) NOT NULL,
    property_id VARCHAR(36) NOT NULL,
    well_status_id VARCHAR(36) NOT NULL,
    allocation_percentage DECIMAL(5,4),
    first_production_date DATE,
    completion_date DATE,
    spud_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (operator_id) REFERENCES operators(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (well_status_id) REFERENCES well_status_types(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Unit tiers table
CREATE TABLE unit_tiers (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    priority_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Unit status types table
CREATE TABLE unit_status_types (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Units table
CREATE TABLE units (
    id VARCHAR(36) PRIMARY KEY,
    well_id VARCHAR(36) NOT NULL,
    tier_id VARCHAR(36),
    unit_status_id VARCHAR(36) NOT NULL,
    tops_price_3_16th DECIMAL(12,2),
    number_of_owners INT DEFAULT 0,
    internal_notes TEXT,
    occ_activity_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (well_id) REFERENCES wells(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (tier_id) REFERENCES unit_tiers(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (unit_status_id) REFERENCES unit_status_types(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ============================================================================
-- 7. ACQUISITION TRACKING TABLES
-- ============================================================================

-- Acquisition status types table
CREATE TABLE acquisition_status_types (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Acquisition activities table
CREATE TABLE acquisition_activities (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Acquisition tracking table
CREATE TABLE acquisition_tracking (
    id VARCHAR(36) PRIMARY KEY,
    mineral_interest_id VARCHAR(36) NOT NULL,
    buyer_id VARCHAR(36) NOT NULL,
    acquisition_status_id VARCHAR(36) NOT NULL,
    activity_id VARCHAR(36),
    activity_count INT DEFAULT 0,
    notes TEXT,
    last_contact_date DATE,
    next_follow_up_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (mineral_interest_id) REFERENCES mineral_interests(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (acquisition_status_id) REFERENCES acquisition_status_types(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (activity_id) REFERENCES acquisition_activities(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- ============================================================================
-- 8. INDEXES FOR PERFORMANCE
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

-- Formation pricing indexes
CREATE INDEX idx_formation_pricing_property ON formation_pricing(property_id);
CREATE INDEX idx_formation_pricing_formation ON formation_pricing(formation_id);

-- Wells indexes
CREATE INDEX idx_wells_operator ON wells(operator_id);
CREATE INDEX idx_wells_property ON wells(property_id);
CREATE INDEX idx_wells_status ON wells(well_status_id);
CREATE INDEX idx_wells_name ON wells(well_name);

-- Units indexes
CREATE INDEX idx_units_well ON units(well_id);
CREATE INDEX idx_units_tier ON units(tier_id);
CREATE INDEX idx_units_status ON units(unit_status_id);

-- Acquisition tracking indexes
CREATE INDEX idx_acquisition_tracking_interest ON acquisition_tracking(mineral_interest_id);
CREATE INDEX idx_acquisition_tracking_buyer ON acquisition_tracking(buyer_id);
CREATE INDEX idx_acquisition_tracking_status ON acquisition_tracking(acquisition_status_id);
CREATE INDEX idx_acquisition_tracking_activity ON acquisition_tracking(activity_id);

-- ============================================================================
-- 9. SAMPLE DATA INSERTION
-- ============================================================================

-- Insert sample states
INSERT INTO states (id, code, name) VALUES
('state_tx', 'TX', 'Texas'),
('state_ok', 'OK', 'Oklahoma'),
('state_nm', 'NM', 'New Mexico');

-- Insert sample basins
INSERT INTO basins (id, name, description) VALUES
('basin_midland', 'Midland', 'Midland Basin in West Texas'),
('basin_delaware', 'Delaware', 'Delaware Basin in West Texas'),
('basin_anadarko', 'Anadarko', 'Anadarko Basin in Oklahoma');

-- Insert sample counties
INSERT INTO counties (id, state_id, name, fip_id) VALUES
('county_upton', 'state_tx', 'Upton', '461'),
('county_howard', 'state_tx', 'Howard', '227'),
('county_mitchell', 'state_tx', 'Mitchell', '335'),
('county_reeves', 'state_tx', 'Reeves', '389'),
('county_kingfisher', 'state_ok', 'Kingfisher', NULL);

-- Insert sample survey companies
INSERT INTO survey_companies (id, name, description) VALUES
('survey_tp', 'T&P RR CO', 'Texas and Pacific Railway Company'),
('survey_hewt', 'HE&WT RR CO', 'Houston East & West Texas Railway Company'),
('survey_gcsf', 'GC&SF RR CO', 'Gulf, Colorado and Santa Fe Railway Company'),
('survey_psl', 'PSL', 'Public School Land');

-- Insert sample formations
INSERT INTO formations (id, name, description) VALUES
('formation_upper_spraberry', 'Upper Spraberry', 'Upper Spraberry formation'),
('formation_lower_spraberry', 'Lower Spraberry', 'Lower Spraberry formation'),
('formation_3rd_bone_spring', '3rd Bone Spring', 'Third Bone Spring formation'),
('formation_wolfcamp_a', 'Wolfcamp A', 'Wolfcamp A formation'),
('formation_wolfcamp_b', 'Wolfcamp B', 'Wolfcamp B formation'),
('formation_lower_wolfcamp_b', 'Lower Wolfcamp B', 'Lower Wolfcamp B formation'),
('formation_wolfcamp_d', 'Wolfcamp D (Cline)', 'Wolfcamp D (Cline) formation');

-- Insert sample operators
INSERT INTO operators (id, name, description) VALUES
('op_clr', 'CLR', 'Continental Resources'),
('op_ovintiv', 'OVINTIV', 'Ovintiv Inc.'),
('op_marathon', 'MARATHON', 'Marathon Oil Corporation'),
('op_pioneer', 'PIONEER', 'Pioneer Natural Resources'),
('op_devon', 'DEVON', 'Devon Energy'),
('op_eog', 'EOG', 'EOG Resources');

-- Insert sample well status types
INSERT INTO well_status_types (id, name, description) VALUES
('well_status_order', 'ORDER', 'Order status'),
('well_status_permitted', 'PERMITTED', 'Permitted status'),
('well_status_drilling', 'DRILLING', 'Drilling status'),
('well_status_application', 'APPLICATION', 'Application status'),
('well_status_duc', 'DUC', 'Drilled Uncompleted status');

-- Insert sample unit tiers
INSERT INTO unit_tiers (id, name, description, priority_order) VALUES
('tier_aoi', 'AOI', 'Area of Interest', 1),
('tier_aoi_tier2', 'AOI - Tier 2', 'Area of Interest Tier 2', 2),
('tier_ran_pot', 'RAN/POT', 'Ranch/Potential', 3);

-- Insert sample unit status types
INSERT INTO unit_status_types (id, name, description) VALUES
('unit_status_actively_working', 'ACTIVELY WORKING', 'Actively working status'),
('unit_status_worked_follow_up', 'WORKED/FOLLOW UP', 'Worked/Follow up status'),
('unit_status_next_to_assign', 'NEXT TO ASSIGN', 'Next to assign status'),
('unit_status_sending_mailers', 'SENDING MAILERS', 'Sending mailers status'),
('unit_status_tbd_waiting', 'TBD/WAITING ON $', 'To be determined/Waiting on money status');

-- Insert sample acquisition status types
INSERT INTO acquisition_status_types (id, name, description) VALUES
('acq_status_new', 'NEW', 'New acquisition target'),
('acq_status_working', 'WORKING', 'Currently working on acquisition'),
('acq_status_lvm_txt_email', 'LVM/TXT/EMAIL', 'Left voicemail/Text/Email status'),
('acq_status_wtl', 'WTL', 'Want to lease status'),
('acq_status_dropped', 'DROPPED', 'Dropped from acquisition'),
('acq_status_closed', 'CLOSED', 'Closed acquisition');

-- Insert sample acquisition activities
INSERT INTO acquisition_activities (id, name, description) VALUES
('activity_closed', 'CLOSED', 'Closed activity'),
('activity_nego', 'NEGO', 'Negotiation activity'),
('activity_mailers', 'Mailers', 'Mailers activity'),
('activity_lvm_txt_email', 'LVM/TXT/EMAIL', 'Left voicemail/Text/Email activity'),
('activity_wtl', 'WTL', 'Want to lease activity'),
('activity_dropped', 'Dropped', 'Dropped activity');

-- Insert sample owner types
INSERT INTO owner_types (id, name, description) VALUES
('owner_type_individual', 'Individual', 'Individual owner'),
('owner_type_trust', 'Trust', 'Trust entity'),
('owner_type_llc', 'LLC', 'Limited Liability Company'),
('owner_type_corp', 'Corporation', 'Corporation'),
('owner_type_partnership', 'Partnership', 'Partnership');

-- Insert sample interest types
INSERT INTO interest_types (id, name, description) VALUES
('interest_type_minerals', 'MINERALS', 'Mineral rights interest'),
('interest_type_royalty', 'ROYALTY', 'Royalty interest'),
('interest_type_working', 'WORKING', 'Working interest');

-- ============================================================================
-- NORMALIZATION COMPLETE
-- ============================================================================
-- The database has been normalized to 3NF with the following benefits:
-- 1. Eliminated data redundancy
-- 2. Ensured data integrity through proper foreign key relationships
-- 3. Improved query performance through proper indexing
-- 4. Made the database more maintainable and scalable
-- 5. Separated concerns into logical, focused tables
