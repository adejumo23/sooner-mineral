-- Roles table
-- This table stores user roles with their descriptions

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