-- Missing Normalized Tables for Sooner Mineral Database
-- This file contains the tables that were missing from the normalized schema

USE soonermineraldb;

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

-- Properties table (main tract/property table)
CREATE TABLE properties (
    id VARCHAR(36) PRIMARY KEY,
    county_id VARCHAR(36) NOT NULL,
    section_id VARCHAR(36),
    abstract_id VARCHAR(36),
    survey_company_id VARCHAR(36),
    unique_id VARCHAR(100) UNIQUE,
    legal_description TEXT,
    gross_acres DECIMAL(10,2) NOT NULL,
    is_state_land BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (county_id) REFERENCES counties(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (abstract_id) REFERENCES abstracts(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (survey_company_id) REFERENCES survey_companies(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Owner types table
CREATE TABLE owner_types (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Owners table
CREATE TABLE owners (
    id VARCHAR(36) PRIMARY KEY,
    owner_type_id VARCHAR(36) NOT NULL,
    legal_name VARCHAR(255) NOT NULL,
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
    state_id VARCHAR(36) NOT NULL,
    contact_type ENUM('Primary', 'Secondary', 'Legal', 'Financial') DEFAULT 'Primary',
    street_address VARCHAR(255),
    city VARCHAR(100),
    zip_code VARCHAR(10),
    phone_primary VARCHAR(20),
    phone_secondary VARCHAR(20),
    email VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (state_id) REFERENCES states(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Interest types table
CREATE TABLE interest_types (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Mineral interests table
CREATE TABLE mineral_interests (
    id VARCHAR(36) PRIMARY KEY,
    property_id VARCHAR(36) NOT NULL,
    owner_id VARCHAR(36) NOT NULL,
    interest_type_id VARCHAR(36) NOT NULL,
    net_mineral_acres DECIMAL(10,2) NOT NULL,
    royalty_percentage DECIMAL(5,4),
    net_revenue_interest DECIMAL(5,4),
    allocation_percentage DECIMAL(5,2),
    ownership_percentage DECIMAL(5,2),
    source_of_title VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (interest_type_id) REFERENCES interest_types(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

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
    operator_id VARCHAR(36) NOT NULL,
    property_id VARCHAR(36) NOT NULL,
    well_status_id VARCHAR(36) NOT NULL,
    well_name VARCHAR(255) NOT NULL,
    allocation_percentage DECIMAL(5,2),
    first_production_date DATE,
    completion_date DATE,
    spud_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (operator_id) REFERENCES operators(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (well_status_id) REFERENCES well_status_types(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Unit tiers table
CREATE TABLE unit_tiers (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
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
    tier_id VARCHAR(36) NOT NULL,
    unit_status_id VARCHAR(36) NOT NULL,
    tops_price_3_16th DECIMAL(12,2),
    number_of_owners INT DEFAULT 0,
    internal_notes TEXT,
    occ_activity_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (well_id) REFERENCES wells(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (tier_id) REFERENCES unit_tiers(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (unit_status_id) REFERENCES unit_status_types(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

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
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Acquisition tracking table
CREATE TABLE acquisition_tracking (
    id VARCHAR(36) PRIMARY KEY,
    mineral_interest_id VARCHAR(36) NOT NULL,
    acquisition_status_id VARCHAR(36) NOT NULL,
    buyer_id VARCHAR(36) NOT NULL,
    activity_count INT DEFAULT 0,
    last_contact_date DATE,
    next_follow_up_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (mineral_interest_id) REFERENCES mineral_interests(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (acquisition_status_id) REFERENCES acquisition_status_types(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE
);
