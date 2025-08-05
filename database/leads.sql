-- ============================================================================
-- LEADS TABLE (Enhanced for Tract Detail Leads Tab)
-- ============================================================================

CREATE TABLE tract_leads (
    id VARCHAR(36) PRIMARY KEY,
    tract_id VARCHAR(36) NOT NULL,
    buyer_id VARCHAR(36) NOT NULL, -- User assigned as buyer
    status ENUM('In Progress', 'Closed', 'Converted') DEFAULT 'In Progress',
    lead_source ENUM('Inbound', 'Assignment', 'Referral', 'Cold Outreach', 'Other') DEFAULT 'Assignment',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tract_id) REFERENCES tracts(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ============================================================================
-- LEAD NOTES TABLE (Outreach Log)
-- ============================================================================

CREATE TABLE lead_notes (
    id VARCHAR(36) PRIMARY KEY,
    lead_id VARCHAR(36) NOT NULL,
    note_text TEXT NOT NULL,
    outreach_method ENUM('Phone Call', 'Email', 'Text', 'Meeting', 'Letter', 'Other') DEFAULT 'Phone Call',
    created_by VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lead_id) REFERENCES tract_leads(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ============================================================================
-- SAMPLE DATA
-- ============================================================================

-- Insert sample tract leads
INSERT INTO tract_leads (id, tract_id, buyer_id, status, lead_source) VALUES
('tl1', 't1', 'u4', 'In Progress', 'Assignment'),
('tl2', 't1', 'u2', 'Closed', 'Inbound'),
('tl3', 't1', 'u4', 'Converted', 'Referral'),
('tl4', 't2', 'u4', 'In Progress', 'Assignment'),
('tl5', 't2', 'u2', 'Closed', 'Cold Outreach'),
('tl6', 't3', 'u4', 'In Progress', 'Assignment');

-- Insert sample lead notes (outreach log)
INSERT INTO lead_notes (id, lead_id, note_text, outreach_method, created_by) VALUES
-- Lead 1 (In Progress) - David Buyer
('ln1', 'tl1', 'Initial contact made via phone. Contact expressed interest in selling mineral rights. Discussed basic terms and timeline.', 'Phone Call', 'u4'),
('ln2', 'tl1', 'Follow-up email sent with detailed offer package. Included NRA calculations and market analysis.', 'Email', 'u4'),
('ln3', 'tl1', 'Meeting scheduled for next week to discuss acquisition terms and due diligence process.', 'Meeting', 'u4'),
('ln4', 'tl1', 'Contact requested additional documentation before proceeding. Sent title chain summary and ownership verification.', 'Email', 'u4'),

-- Lead 2 (Closed) - Bob Manager
('ln5', 'tl2', 'Initial outreach call made. Contact was not interested in selling at this time.', 'Phone Call', 'u2'),
('ln6', 'tl2', 'Follow-up call to check if circumstances have changed. Still not interested.', 'Phone Call', 'u2'),

-- Lead 3 (Converted) - David Buyer
('ln7', 'tl3', 'Contact referred by existing client. High interest in selling mineral rights.', 'Phone Call', 'u4'),
('ln8', 'tl3', 'Deal terms agreed upon. Moving to contract phase.', 'Meeting', 'u4'),
('ln9', 'tl3', 'Contract signed and deal closed successfully.', 'Meeting', 'u4'),

-- Lead 4 (In Progress) - David Buyer
('ln10', 'tl4', 'Initial contact made. Contact is considering selling but needs more information.', 'Phone Call', 'u4'),
('ln11', 'tl4', 'Sent detailed property analysis and comparable sales data.', 'Email', 'u4'),

-- Lead 5 (Closed) - Bob Manager
('ln12', 'tl5', 'Cold outreach via phone. Contact was not interested in selling.', 'Phone Call', 'u2'),

-- Lead 6 (In Progress) - David Buyer
('ln13', 'tl6', 'Initial contact made. Contact is interested but needs to consult with family members.', 'Phone Call', 'u4'),
('ln14', 'tl6', 'Follow-up call scheduled for next month after family discussion.', 'Phone Call', 'u4');

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX idx_tract_leads_tract ON tract_leads(tract_id);
CREATE INDEX idx_tract_leads_buyer ON tract_leads(buyer_id);
CREATE INDEX idx_tract_leads_status ON tract_leads(status);
CREATE INDEX idx_tract_leads_created_at ON tract_leads(created_at);
CREATE INDEX idx_lead_notes_lead ON lead_notes(lead_id);
CREATE INDEX idx_lead_notes_created_at ON lead_notes(created_at);
CREATE INDEX idx_lead_notes_created_by ON lead_notes(created_by); 