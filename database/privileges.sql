-- Privileges table
-- This table stores system privileges/permissions

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