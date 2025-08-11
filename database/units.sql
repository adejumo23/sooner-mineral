-- Units Table for Sooner Capital Unit Management Module
-- This table stores leasehold-based pooled acreage groups (production units, spacing units, drilling units)

CREATE TABLE units (
    id VARCHAR(36) PRIMARY KEY,
    unit_name VARCHAR(255) NOT NULL,
    operator VARCHAR(255) NOT NULL,
    api_numbers JSON, -- Array of API numbers (1 or more if multiple wells per unit)
    target_formations JSON, -- Array of target formations/zones
    status ENUM('Permitted', 'Producing', 'Held by Production', 'Plugged') NOT NULL,
    estimated_gross_acres DECIMAL(10,2) NOT NULL,
    estimated_net_acres DECIMAL(10,2), -- Linked from assigned tracts
    county VARCHAR(100) NOT NULL,
    state VARCHAR(2) NOT NULL,
    linked_tract_ids JSON, -- Array of tract IDs linked to this unit
    linked_contact_ids JSON, -- Array of contact IDs (landowners in unit footprint)
    assigned_buyer_id VARCHAR(36), -- User ID reference
    held_by_fund BOOLEAN DEFAULT FALSE,
    exit_strategy ENUM('Hold', 'Flip', 'LP Buyout') DEFAULT 'Hold',
    is_locked BOOLEAN DEFAULT FALSE, -- Prevents outreach while under diligence
    notes TEXT, -- Internal notes only
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(36) NOT NULL,
    updated_by VARCHAR(36) NOT NULL,
    FOREIGN KEY (assigned_buyer_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Unit Assignment History Table
CREATE TABLE unit_assignments (
    id VARCHAR(36) PRIMARY KEY,
    unit_id VARCHAR(36) NOT NULL,
    buyer_id VARCHAR(36) NOT NULL,
    assigned_by VARCHAR(36) NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    removed_by VARCHAR(36),
    removed_at TIMESTAMP NULL,
    notes TEXT,
    FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (removed_by) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Unit-Tract Junction Table for many-to-many relationship
CREATE TABLE unit_tracts (
    id VARCHAR(36) PRIMARY KEY,
    unit_id VARCHAR(36) NOT NULL,
    tract_id VARCHAR(36) NOT NULL,
    allocation_percentage DECIMAL(5,4), -- Allocation % for OK & take points for TX
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (tract_id) REFERENCES tracts(id) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY unique_unit_tract (unit_id, tract_id)
);

-- Unit-Contact Junction Table for many-to-many relationship
CREATE TABLE unit_contacts (
    id VARCHAR(36) PRIMARY KEY,
    unit_id VARCHAR(36) NOT NULL,
    contact_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY unique_unit_contact (unit_id, contact_id)
);

-- Unit Notes Table for internal notes and audit trail
CREATE TABLE unit_notes (
    id VARCHAR(36) PRIMARY KEY,
    unit_id VARCHAR(36) NOT NULL,
    note_text TEXT NOT NULL,
    note_type ENUM('Internal', 'Assignment', 'Status Change', 'Lock/Unlock', 'Other') NOT NULL,
    created_by VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX idx_units_operator ON units(operator);
CREATE INDEX idx_units_status ON units(status);
CREATE INDEX idx_units_county ON units(county);
CREATE INDEX idx_units_state ON units(state);
CREATE INDEX idx_units_assigned_buyer ON units(assigned_buyer_id);
CREATE INDEX idx_units_held_by_fund ON units(held_by_fund);
CREATE INDEX idx_units_is_locked ON units(is_locked);
CREATE INDEX idx_units_created_by ON units(created_by);
CREATE INDEX idx_units_updated_by ON units(updated_by);

CREATE INDEX idx_unit_assignments_unit_id ON unit_assignments(unit_id);
CREATE INDEX idx_unit_assignments_buyer_id ON unit_assignments(buyer_id);
CREATE INDEX idx_unit_assignments_assigned_by ON unit_assignments(assigned_by);

CREATE INDEX idx_unit_tracts_unit_id ON unit_tracts(unit_id);
CREATE INDEX idx_unit_tracts_tract_id ON unit_tracts(tract_id);

CREATE INDEX idx_unit_contacts_unit_id ON unit_contacts(unit_id);
CREATE INDEX idx_unit_contacts_contact_id ON unit_contacts(contact_id);

CREATE INDEX idx_unit_notes_unit_id ON unit_notes(unit_id);
CREATE INDEX idx_unit_notes_created_by ON unit_notes(created_by);

-- Insert sample units data
INSERT INTO units (
    id, unit_name, operator, api_numbers, target_formations, status, 
    estimated_gross_acres, estimated_net_acres, county, state, 
    linked_tract_ids, linked_contact_ids, assigned_buyer_id, 
    held_by_fund, exit_strategy, is_locked, notes, created_by, updated_by
) VALUES
(
    'unit1', 'Smith Unit #1', 'Pioneer Natural Resources',
    '["42-335-12345", "42-335-12346"]',
    '["Wolfcamp A", "Wolfcamp B"]',
    'Producing',
    1280.00, 960.00, 'Midland', 'TX',
    '["t1", "t2"]', '["c1", "c2", "c3"]',
    'u4', TRUE, 'Hold', FALSE,
    'High-producing unit with excellent Wolfcamp A performance',
    'u1', 'u1'
),
(
    'unit2', 'Johnson Unit #2', 'Devon Energy',
    '["40-439-78901", "40-439-78902"]',
    '["Woodford", "Hunton"]',
    'Producing',
    640.00, 480.00, 'Love', 'OK',
    '["t2"]', '["c4", "c5"]',
    'u4', FALSE, 'Flip', TRUE,
    'Unit under due diligence - do not contact landowners',
    'u2', 'u2'
),
(
    'unit3', 'Wilson Unit #3', 'EOG Resources',
    '["48-113-45678"]',
    '["Eagle Ford"]',
    'Permitted',
    320.00, 240.00, 'Dallas', 'TX',
    '["t3"]', '["c1", "c5"]',
    NULL, FALSE, 'Hold', FALSE,
    'Newly permitted unit targeting Eagle Ford formation',
    'u2', 'u2'
);

-- Insert sample unit-tract relationships
INSERT INTO unit_tracts (id, unit_id, tract_id, allocation_percentage) VALUES
('ut1', 'unit1', 't1', 0.75),
('ut2', 'unit1', 't2', 0.25),
('ut3', 'unit2', 't2', 1.00),
('ut4', 'unit3', 't3', 1.00);

-- Insert sample unit-contact relationships
INSERT INTO unit_contacts (id, unit_id, contact_id) VALUES
('uc1', 'unit1', 'c1'),
('uc2', 'unit1', 'c2'),
('uc3', 'unit1', 'c3'),
('uc4', 'unit2', 'c4'),
('uc5', 'unit2', 'c5'),
('uc6', 'unit3', 'c1'),
('uc7', 'unit3', 'c5');

-- Insert sample unit assignments
INSERT INTO unit_assignments (id, unit_id, buyer_id, assigned_by, notes) VALUES
('ua1', 'unit1', 'u4', 'u1', 'Initial assignment for acquisition campaign'),
('ua2', 'unit2', 'u4', 'u2', 'Assignment for due diligence review');

-- Insert sample unit notes
INSERT INTO unit_notes (id, unit_id, note_text, note_type, created_by) VALUES
('un1', 'unit1', 'Unit assigned to David Buyer for acquisition campaign', 'Assignment', 'u1'),
('un2', 'unit2', 'Unit locked for due diligence - no outreach until unlocked', 'Lock/Unlock', 'u2'),
('un3', 'unit3', 'New unit created - awaiting operator updates', 'Status Change', 'u2');
