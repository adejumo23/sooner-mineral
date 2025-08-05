-- Users table
-- This table stores user information with role assignments
-- Depends on: roles.sql

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