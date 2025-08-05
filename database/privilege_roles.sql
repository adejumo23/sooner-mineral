-- Privilege_Roles junction table
-- This table links privileges to roles (many-to-many relationship)
-- Depends on: privileges.sql, roles.sql

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