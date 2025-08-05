-- Tracts table
-- This table stores land tract information with buyer assignments
-- Depends on: users.sql

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

-- Create index for better query performance
CREATE INDEX idx_tracts_state_county ON tracts(state, county);
CREATE INDEX idx_tracts_assigned_buyer ON tracts(assigned_buyer_id);
CREATE INDEX idx_tracts_title_status ON tracts(title_status);
CREATE INDEX idx_tracts_held_by_fund ON tracts(held_by_fund); 