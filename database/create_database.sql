-- Sooner Capital Database Schema
-- This file creates the complete database schema for the Sooner Capital application
-- Execute this file to set up the entire database with sample data

-- ============================================================================
-- 1. ROLES TABLE
-- ============================================================================

CREATE TABLE roles (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert sample roles
INSERT INTO roles (id, name, description) VALUES
('1', 'Administrator', 'Has all permissions'),
('2', 'Land Manager', 'Can view and edit land tracts'),
('3', 'Viewer', 'Can only view data'),
('4', 'Buyer', 'Assigned to tracts for acquisition');

-- ============================================================================
-- 2. USERS TABLE
-- ============================================================================

CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Insert sample users
INSERT INTO users (id, name, email, password_hash, role_id) VALUES
('u1', 'Alice Admin', 'admin@sooner.cap', '$2b$10$hashed_password_here', '1'),
('u2', 'Bob Manager', 'manager@sooner.cap', '$2b$10$hashed_password_here', '2'),
('u3', 'Charlie Viewer', 'viewer@sooner.cap', '$2b$10$hashed_password_here', '3'),
('u4', 'David Buyer', 'buyer@sooner.cap', '$2b$10$hashed_password_here', '4');

-- ============================================================================
-- 3. PRIVILEGES TABLE
-- ============================================================================

CREATE TABLE privileges (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert sample privileges
INSERT INTO privileges (id, name, description) VALUES
('p1', 'Manage Users', 'Can create, edit, and delete users.'),
('p2', 'Manage Roles', 'Can create, edit, and delete roles.'),
('p3', 'Manage Land Tracts', 'Full control over land tract data.'),
('p4', 'View Financials', 'Can view financial reports.'),
('p5', 'View Land Tracts', 'Can only view land tract data.');

-- ============================================================================
-- 4. PRIVILEGE_ROLES JUNCTION TABLE
-- ============================================================================

CREATE TABLE privilege_roles (
    id VARCHAR(36) PRIMARY KEY,
    privilege_id VARCHAR(36) NOT NULL,
    role_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (privilege_id) REFERENCES privileges(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY unique_privilege_role (privilege_id, role_id)
);

-- Insert sample privilege-role assignments
INSERT INTO privilege_roles (id, privilege_id, role_id) VALUES
-- Administrator gets all privileges
('pr1', 'p1', '1'), -- Admin can manage users
('pr2', 'p2', '1'), -- Admin can manage roles
('pr3', 'p3', '1'), -- Admin can manage land tracts
('pr4', 'p4', '1'), -- Admin can view financials
('pr5', 'p5', '1'), -- Admin can view land tracts

-- Land Manager gets most privileges
('pr6', 'p3', '2'), -- Land Manager can manage land tracts
('pr7', 'p4', '2'), -- Land Manager can view financials
('pr8', 'p5', '2'), -- Land Manager can view land tracts

-- Viewer gets limited privileges
('pr9', 'p5', '3'), -- Viewer can only view land tracts

-- Buyer gets limited privileges
('pr10', 'p5', '4'); -- Buyer can only view land tracts

-- ============================================================================
-- 5. TRACTS TABLE
-- ============================================================================

CREATE TABLE tracts (
    id VARCHAR(36) PRIMARY KEY,
    state VARCHAR(2) NOT NULL,
    county VARCHAR(100) NOT NULL,
    tract_name VARCHAR(255) NOT NULL,
    legal_description TEXT,
    str VARCHAR(50), -- Section-Township-Range
    abstract_number VARCHAR(50),
    anum VARCHAR(50),
    gross_acres DECIMAL(10,2) NOT NULL,
    royalty DECIMAL(5,4), -- Stored as decimal (e.g., 0.25 for 25%)
    net_mineral_acres DECIMAL(10,2),
    nra DECIMAL(10,2), -- Net Royalty Acres (auto-calculated: NMA * Royalty / 0.125)
    ownership_percentage DECIMAL(5,2), -- Stored as decimal (e.g., 0.50 for 50%)
    title_status ENUM('Verified', 'In Progress', 'Failed', 'Verified with Curative Requirements', 'Unmapped') NOT NULL DEFAULT 'Unmapped',
    assigned_buyer_id VARCHAR(36),
    nra_cap_usd DECIMAL(12,2),
    source_channel VARCHAR(100),
    routing_notes TEXT,
    held_by_fund BOOLEAN DEFAULT FALSE,
    is_locked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_buyer_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Insert sample tracts
INSERT INTO tracts (
    id, state, county, tract_name, legal_description, str, abstract_number, 
    gross_acres, net_mineral_acres, royalty, nra, title_status, 
    assigned_buyer_id, nra_cap_usd, source_channel, held_by_fund, is_locked
) VALUES
(
    't1', 'TX', 'Midland', 'North Star Prospect',
    'Section 15, Block 2, T&P RR Co. Survey',
    '15-02S-32E', 'A-1234',
    640.00, 160.00, 0.25, 320.00, 'Verified',
    'u4', 15000.00, 'Broker', TRUE, FALSE
),
(
    't2', 'OK', 'Love', 'Red River Minerals',
    'W/2 of the SW/4 of Section 10, Township 8 South, Range 2 East',
    '10-08S-02E', NULL,
    80.00, 20.00, 0.1875, 30.00, 'In Progress',
    'u4', NULL, 'Inbound', FALSE, TRUE
);

-- Create indexes for better query performance
CREATE INDEX idx_tracts_state_county ON tracts(state, county);
CREATE INDEX idx_tracts_assigned_buyer ON tracts(assigned_buyer_id);
CREATE INDEX idx_tracts_title_status ON tracts(title_status);
CREATE INDEX idx_tracts_held_by_fund ON tracts(held_by_fund);

-- ============================================================================
-- DATABASE CREATION COMPLETE
-- ============================================================================

-- The database schema has been created with the following tables:
-- 1. roles - User roles and permissions
-- 2. users - User accounts with role assignments
-- 3. privileges - System privileges/permissions
-- 4. privilege_roles - Junction table linking privileges to roles
-- 5. tracts - Land tract information with buyer assignments
--
-- Sample data has been inserted for all tables.
-- Foreign key relationships are properly established.
-- Indexes have been created for optimal query performance. 