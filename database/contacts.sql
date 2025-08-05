-- ============================================================================
-- CONTACTS TABLE
-- ============================================================================

CREATE TABLE contacts (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    entity_type ENUM('Individual', 'Entity') DEFAULT 'Individual',
    legal_name VARCHAR(500), -- Full legal name for entities
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================================
-- CONTACT_TRACT_OWNERSHIP TABLE (Bridge table for ownership relationships)
-- ============================================================================

CREATE TABLE contact_tract_ownership (
    id VARCHAR(36) PRIMARY KEY,
    contact_id VARCHAR(36) NOT NULL,
    tract_id VARCHAR(36) NOT NULL,
    ownership_percentage DECIMAL(5,4) NOT NULL, -- e.g., 0.2500 for 25%
    royalty_percentage DECIMAL(5,4) NOT NULL, -- e.g., 0.2500 for 25%
    source_of_title VARCHAR(255), -- Instrument or document confirming ownership
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (tract_id) REFERENCES tracts(id) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY unique_contact_tract (contact_id, tract_id)
);

-- ============================================================================
-- CONTACT_NOTES TABLE
-- ============================================================================

CREATE TABLE contact_notes (
    id VARCHAR(36) PRIMARY KEY,
    contact_id VARCHAR(36) NOT NULL,
    tract_id VARCHAR(36) NOT NULL,
    note_text TEXT NOT NULL,
    note_type ENUM('Outreach', 'Follow-up', 'Meeting', 'Documentation', 'Other') DEFAULT 'Outreach',
    created_by VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (tract_id) REFERENCES tracts(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ============================================================================
-- LEADS TABLE
-- ============================================================================

CREATE TABLE leads (
    id VARCHAR(36) PRIMARY KEY,
    contact_id VARCHAR(36) NOT NULL,
    tract_id VARCHAR(36) NOT NULL,
    status ENUM('Open', 'In Progress', 'Qualified', 'Disqualified', 'Closed') DEFAULT 'Open',
    lead_type ENUM('Acquisition', 'Lease', 'Other') DEFAULT 'Acquisition',
    priority ENUM('Low', 'Medium', 'High', 'Urgent') DEFAULT 'Medium',
    assigned_to VARCHAR(36),
    notes TEXT,
    created_by VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (tract_id) REFERENCES tracts(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ============================================================================
-- SAMPLE DATA
-- ============================================================================

-- Insert sample contacts
INSERT INTO contacts (id, name, email, phone, address, entity_type, legal_name) VALUES
('c1', 'John Smith', 'john.smith@email.com', '(555) 123-4567', '123 Main St, Oklahoma City, OK 73101', 'Individual', 'John Smith'),
('c2', 'Sarah Johnson', 'sarah.j@email.com', '(555) 234-5678', '456 Oak Ave, Tulsa, OK 74101', 'Individual', 'Sarah Johnson'),
('c3', 'ABC Minerals LLC', 'contact@abcminerals.com', '(555) 345-6789', '789 Business Blvd, Oklahoma City, OK 73102', 'Entity', 'ABC Minerals LLC, a Delaware Limited Liability Company'),
('c4', 'Robert Wilson', 'rob.wilson@email.com', '(555) 456-7890', '321 Pine St, Edmond, OK 73034', 'Individual', 'Robert Wilson'),
('c5', 'XYZ Energy Corp', 'info@xyzenergy.com', '(555) 567-8901', '654 Corporate Dr, Oklahoma City, OK 73103', 'Entity', 'XYZ Energy Corporation, a Texas Corporation');

-- Insert sample contact-tract ownership relationships
INSERT INTO contact_tract_ownership (id, contact_id, tract_id, ownership_percentage, royalty_percentage, source_of_title) VALUES
('cto1', 'c1', 't1', 0.2500, 0.2500, 'Warranty Deed dated 2015-03-15'),
('cto2', 'c2', 't1', 0.5000, 0.2500, 'Mineral Deed dated 2018-07-22'),
('cto3', 'c3', 't1', 0.2500, 0.2500, 'Assignment dated 2020-11-10'),
('cto4', 'c4', 't2', 1.0000, 0.2500, 'Warranty Deed dated 2016-09-08'),
('cto5', 'c5', 't3', 0.7500, 0.2000, 'Mineral Deed dated 2019-04-12'),
('cto6', 'c1', 't3', 0.2500, 0.2000, 'Assignment dated 2021-02-28');

-- Insert sample contact notes
INSERT INTO contact_notes (id, contact_id, tract_id, note_text, note_type, created_by) VALUES
('cn1', 'c1', 't1', 'Initial outreach call made. Contact expressed interest in selling mineral rights.', 'Outreach', 'u1'),
('cn2', 'c2', 't1', 'Follow-up email sent with offer details. Awaiting response.', 'Follow-up', 'u2'),
('cn3', 'c3', 't1', 'Meeting scheduled for next week to discuss acquisition terms.', 'Meeting', 'u1'),
('cn4', 'c4', 't2', 'Contact requested additional documentation before proceeding.', 'Documentation', 'u2');

-- Insert sample leads
INSERT INTO leads (id, contact_id, tract_id, status, lead_type, priority, assigned_to, notes, created_by) VALUES
('l1', 'c1', 't1', 'In Progress', 'Acquisition', 'High', 'u2', 'High priority lead - contact has significant mineral acreage', 'u1'),
('l2', 'c2', 't1', 'Open', 'Acquisition', 'Medium', 'u2', 'Initial contact made, follow-up needed', 'u1'),
('l3', 'c3', 't1', 'Qualified', 'Acquisition', 'High', 'u1', 'Entity contact, complex ownership structure', 'u2'),
('l4', 'c4', 't2', 'Open', 'Lease', 'Low', 'u2', 'Contact interested in leasing options', 'u1');

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX idx_contacts_name ON contacts(name);
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contact_tract_ownership_contact ON contact_tract_ownership(contact_id);
CREATE INDEX idx_contact_tract_ownership_tract ON contact_tract_ownership(tract_id);
CREATE INDEX idx_contact_notes_contact ON contact_notes(contact_id);
CREATE INDEX idx_contact_notes_tract ON contact_notes(tract_id);
CREATE INDEX idx_contact_notes_created_at ON contact_notes(created_at);
CREATE INDEX idx_leads_contact ON leads(contact_id);
CREATE INDEX idx_leads_tract ON leads(tract_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_assigned_to ON leads(assigned_to); 