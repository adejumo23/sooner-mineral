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

-- ============================================================================
-- 5. CONTACTS TABLE
-- ============================================================================

CREATE TABLE contacts (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(2),
    zip_code VARCHAR(10),
    contact_type ENUM('Landowner', 'Broker', 'Attorney', 'Other') DEFAULT 'Landowner',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_contact_type (contact_type),
    INDEX idx_state (state)
);

-- Insert sample contacts
INSERT INTO contacts (id, name, email, phone, address, city, state, zip_code, contact_type, notes) VALUES
('c1', 'John Smith', 'john.smith@email.com', '(555) 123-4567', '123 Main St', 'Midland', 'TX', '79701', 'Landowner', 'Primary landowner contact'),
('c2', 'Sarah Johnson', 'sarah.j@email.com', '(555) 234-5678', '456 Oak Ave', 'Ardmore', 'OK', '73401', 'Landowner', 'Direct contact - motivated seller'),
('c3', 'Mike Wilson', 'mike.w@email.com', '(555) 345-6789', '789 Pine Rd', 'Oklahoma City', 'OK', '73101', 'Landowner', 'Premium unit landowner'),
('c4', 'Lisa Brown', 'lisa.b@email.com', '(555) 456-7890', '321 Elm St', 'Tulsa', 'OK', '74101', 'Landowner', 'Development opportunity contact');

-- Create indexes for better query performance
CREATE INDEX idx_tracts_state_county ON tracts(state, county);
CREATE INDEX idx_tracts_assigned_buyer ON tracts(assigned_buyer_id);
CREATE INDEX idx_tracts_title_status ON tracts(title_status);
CREATE INDEX idx_tracts_held_by_fund ON tracts(held_by_fund);

-- ============================================================================
-- 6. ASSIGNMENT & BUYER ROUTING MODULE TABLES
-- ============================================================================

CREATE TABLE assignments (
    id VARCHAR(36) PRIMARY KEY,
    asset_type ENUM('Tract', 'Unit') NOT NULL,
    asset_id VARCHAR(36) NOT NULL,
    assigned_buyer_id VARCHAR(36) NOT NULL,
    price_cap_usd DECIMAL(15,2) NOT NULL,
    price_cap_type ENUM('Per NRA', 'Per Acre') NOT NULL,
    source_channel ENUM('Broker', 'Inbound', 'Outbound') NOT NULL,
    priority_score INT NOT NULL CHECK (priority_score >= 0 AND priority_score <= 100),
    status ENUM('Active', 'Completed', 'Cancelled', 'Expired') DEFAULT 'Active',
    notes TEXT,
    assigned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by_id VARCHAR(36) NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_buyer_id) REFERENCES users(id),
    FOREIGN KEY (assigned_by_id) REFERENCES users(id),
    INDEX idx_asset (asset_type, asset_id),
    INDEX idx_buyer (assigned_buyer_id),
    INDEX idx_status (status),
    INDEX idx_assigned_date (assigned_date)
);

CREATE TABLE assignment_history (
    id VARCHAR(36) PRIMARY KEY,
    assignment_id VARCHAR(36) NOT NULL,
    action_type ENUM('Created', 'Updated', 'Reassigned', 'Cancelled', 'Completed') NOT NULL,
    action_details TEXT,
    action_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    action_by_id VARCHAR(36) NOT NULL,
    FOREIGN KEY (assignment_id) REFERENCES assignments(id),
    FOREIGN KEY (action_by_id) REFERENCES users(id),
    INDEX idx_assignment (assignment_id),
    INDEX idx_timestamp (action_timestamp)
);

-- Insert sample data for assignments
INSERT INTO assignments (id, asset_type, asset_id, assigned_buyer_id, price_cap_usd, price_cap_type, source_channel, priority_score, status, notes, assigned_by_id) VALUES
('assign1', 'Tract', 't1', 'u4', 15000.00, 'Per NRA', 'Broker', 85, 'Active', 'High priority - recent permitting activity in area', 'u1'),
('assign2', 'Tract', 't2', 'u4', 8000.00, 'Per Acre', 'Inbound', 70, 'Active', 'Direct landowner contact - ready to discuss', 'u2'),
('assign3', 'Unit', 'unit1', 'u4', 12000.00, 'Per NRA', 'Broker', 90, 'Active', 'Premium unit with proven production', 'u1'),
('assign4', 'Unit', 'unit2', 'u4', 6000.00, 'Per Acre', 'Outbound', 60, 'Active', 'Development opportunity - needs due diligence', 'u2');

-- Insert sample assignment history
INSERT INTO assignment_history (id, assignment_id, action_type, action_details, action_by_id) VALUES
('ah1', 'assign1', 'Created', 'Initial assignment for acquisition campaign', 'u1'),
('ah2', 'assign2', 'Created', 'Assignment for direct outreach', 'u2'),
('ah3', 'assign3', 'Created', 'Premium unit assignment', 'u1'),
('ah4', 'assign4', 'Created', 'Development opportunity assignment', 'u2');

-- ============================================================================
-- 7. LEAD MANAGEMENT MODULE TABLES
-- ============================================================================

CREATE TABLE leads (
    id VARCHAR(36) PRIMARY KEY,
    linked_contact_id VARCHAR(36) NOT NULL,
    linked_tract_ids TEXT, -- JSON array of tract IDs
    linked_unit_ids TEXT, -- JSON array of unit IDs
    buyer_id VARCHAR(36) NOT NULL,
    source_channel ENUM('Broker', 'Inbound', 'Outbound') NOT NULL,
    status ENUM('Uncontacted', 'Spoke', 'Interested', 'LOI Sent', 'Dead') DEFAULT 'Uncontacted',
    priority_score INT NOT NULL CHECK (priority_score >= 0 AND priority_score <= 100),
    last_contact_date DATE,
    next_follow_up_date DATE,
    notes TEXT,
    outreach_count INT DEFAULT 0,
    document_links TEXT, -- JSON array of document URLs
    assignment_id VARCHAR(36), -- Reference to the assignment that created this lead
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (buyer_id) REFERENCES users(id),
    FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE SET NULL,
    INDEX idx_contact (linked_contact_id),
    INDEX idx_buyer (buyer_id),
    INDEX idx_status (status),
    INDEX idx_priority (priority_score),
    INDEX idx_last_contact (last_contact_date),
    INDEX idx_next_follow_up (next_follow_up_date)
);

CREATE TABLE lead_call_logs (
    id VARCHAR(36) PRIMARY KEY,
    lead_id VARCHAR(36) NOT NULL,
    call_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    outcome ENUM('No Answer', 'Left Message', 'Spoke', 'Not Interested', 'Interested', 'Call Back Later', 'Wrong Number') NOT NULL,
    notes TEXT,
    next_steps TEXT,
    logged_by_id VARCHAR(36) NOT NULL,
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
    FOREIGN KEY (logged_by_id) REFERENCES users(id),
    INDEX idx_lead (lead_id),
    INDEX idx_call_date (call_date),
    INDEX idx_outcome (outcome)
);

CREATE TABLE lead_notes (
    id VARCHAR(36) PRIMARY KEY,
    lead_id VARCHAR(36) NOT NULL,
    note_text TEXT NOT NULL,
    note_type ENUM('General', 'Follow Up', 'Important', 'Internal') DEFAULT 'General',
    created_by_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by_id) REFERENCES users(id),
    INDEX idx_lead (lead_id),
    INDEX idx_created_at (created_at),
    INDEX idx_note_type (note_type)
);

-- Insert sample data for leads
INSERT INTO leads (id, linked_contact_id, linked_tract_ids, linked_unit_ids, buyer_id, source_channel, status, priority_score, last_contact_date, next_follow_up_date, notes, outreach_count, assignment_id) VALUES
('lead1', 'c1', '["t1"]', NULL, 'u4', 'Broker', 'Spoke', 85, '2024-01-15', '2024-01-22', 'Contacted landowner - interested in discussing mineral rights sale', 2, 'assign1'),
('lead2', 'c2', '["t2"]', NULL, 'u4', 'Inbound', 'Interested', 70, '2024-01-16', '2024-01-23', 'Landowner reached out directly - ready to move forward', 1, 'assign2'),
('lead3', 'c3', NULL, '["unit1"]', 'u4', 'Broker', 'Uncontacted', 90, NULL, '2024-01-20', 'Premium unit lead - needs initial outreach', 0, 'assign3'),
('lead4', 'c4', NULL, '["unit2"]', 'u4', 'Outbound', 'LOI Sent', 60, '2024-01-17', '2024-01-24', 'LOI sent - waiting for response', 3, 'assign4');

-- Insert sample call logs
INSERT INTO lead_call_logs (id, lead_id, call_date, outcome, notes, next_steps, logged_by_id) VALUES
('cl1', 'lead1', '2024-01-15 10:30:00', 'Spoke', 'Had good conversation about mineral rights', 'Follow up next week with offer details', 'u4'),
('cl2', 'lead2', '2024-01-16 14:15:00', 'Interested', 'Landowner is motivated seller', 'Send LOI within 48 hours', 'u4'),
('cl3', 'lead4', '2024-01-17 09:45:00', 'Spoke', 'Discussed terms and sent LOI', 'Wait for LOI response', 'u4');

-- Insert sample lead notes
INSERT INTO lead_notes (id, lead_id, note_text, note_type, created_by_id) VALUES
('ln1', 'lead1', 'Landowner has 160 net mineral acres in high-value area', 'Important', 'u4'),
('ln2', 'lead2', 'Direct contact - no broker fees involved', 'General', 'u4'),
('ln3', 'lead3', 'Premium unit with proven production history', 'Important', 'u4'),
('ln4', 'lead4', 'Development opportunity - needs due diligence', 'General', 'u4');

-- ============================================================================
-- DATABASE CREATION COMPLETE
-- ============================================================================

-- The database schema has been created with the following tables:
-- 1. roles - User roles and permissions
-- 2. users - User accounts with role assignments
-- 3. privileges - System privileges/permissions
-- 4. privilege_roles - Junction table linking privileges to roles
-- 5. tracts - Land tract information with buyer assignments
-- 6. contacts - Contact information for landowners and stakeholders
-- 7. assignments - Assignment & Buyer Routing module
-- 8. assignment_history - Assignment history tracking
-- 9. leads - Lead Management module
-- 10. lead_call_logs - Lead call tracking
-- 11. lead_notes - Lead notes and comments
--
-- Sample data has been inserted for all tables.
-- Foreign key relationships are properly established.
-- Indexes have been created for optimal query performance. 