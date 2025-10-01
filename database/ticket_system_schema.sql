-- ============================================================================
-- TICKET SYSTEM DATABASE SCHEMA
-- ============================================================================
-- This file contains the database schema for the ticketing system module

-- ============================================================================
-- 1. TICKET CATEGORIES
-- ============================================================================

-- Ticket categories table
CREATE TABLE ticket_categories (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 2. TICKET PRIORITIES
-- ============================================================================

-- Ticket priorities table
CREATE TABLE ticket_priorities (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    priority_level INT NOT NULL UNIQUE,
    color_code VARCHAR(7) DEFAULT '#6B7280',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 3. TICKET STATUSES
-- ============================================================================

-- Ticket statuses table
CREATE TABLE ticket_statuses (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    is_closed BOOLEAN DEFAULT FALSE,
    color_code VARCHAR(7) DEFAULT '#6B7280',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 4. TICKETS
-- ============================================================================

-- Tickets table
CREATE TABLE tickets (
    id VARCHAR(36) PRIMARY KEY,
    ticket_number VARCHAR(20) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category_id VARCHAR(36) NOT NULL,
    priority_id VARCHAR(36) NOT NULL,
    status_id VARCHAR(36) NOT NULL,
    reporter_id VARCHAR(36) NOT NULL,
    assignee_id VARCHAR(36),
    module_name VARCHAR(100),
    page_url VARCHAR(500),
    browser_info TEXT,
    user_agent TEXT,
    screenshot_url VARCHAR(500),
    attachments JSON,
    resolution_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    FOREIGN KEY (category_id) REFERENCES ticket_categories(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (priority_id) REFERENCES ticket_priorities(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (status_id) REFERENCES ticket_statuses(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (assignee_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- ============================================================================
-- 5. TICKET COMMENTS
-- ============================================================================

-- Ticket comments table
CREATE TABLE ticket_comments (
    id VARCHAR(36) PRIMARY KEY,
    ticket_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    comment TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ============================================================================
-- 6. TICKET NOTIFICATIONS
-- ============================================================================

-- Ticket notifications table
CREATE TABLE ticket_notifications (
    id VARCHAR(36) PRIMARY KEY,
    ticket_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    notification_type ENUM('created', 'updated', 'assigned', 'resolved', 'commented') NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    email_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- ============================================================================
-- 7. INDEXES FOR PERFORMANCE
-- ============================================================================

-- Ticket indexes
CREATE INDEX idx_tickets_number ON tickets(ticket_number);
CREATE INDEX idx_tickets_reporter ON tickets(reporter_id);
CREATE INDEX idx_tickets_assignee ON tickets(assignee_id);
CREATE INDEX idx_tickets_status ON tickets(status_id);
CREATE INDEX idx_tickets_priority ON tickets(priority_id);
CREATE INDEX idx_tickets_category ON tickets(category_id);
CREATE INDEX idx_tickets_created ON tickets(created_at);
CREATE INDEX idx_tickets_module ON tickets(module_name);

-- Ticket comments indexes
CREATE INDEX idx_ticket_comments_ticket ON ticket_comments(ticket_id);
CREATE INDEX idx_ticket_comments_user ON ticket_comments(user_id);
CREATE INDEX idx_ticket_comments_created ON ticket_comments(created_at);

-- Ticket notifications indexes
CREATE INDEX idx_ticket_notifications_ticket ON ticket_notifications(ticket_id);
CREATE INDEX idx_ticket_notifications_user ON ticket_notifications(user_id);
CREATE INDEX idx_ticket_notifications_read ON ticket_notifications(is_read);
CREATE INDEX idx_ticket_notifications_type ON ticket_notifications(notification_type);

-- ============================================================================
-- 8. SAMPLE DATA INSERTION
-- ============================================================================

-- Insert sample ticket categories
INSERT INTO ticket_categories (id, name, description) VALUES
('cat_bug', 'Bug Report', 'Issues with functionality or errors in the system'),
('cat_feature', 'Feature Request', 'Requests for new features or enhancements'),
('cat_ui', 'User Interface', 'Issues with the user interface or user experience'),
('cat_performance', 'Performance', 'Performance issues or slow loading times'),
('cat_data', 'Data Issue', 'Problems with data accuracy or data import/export'),
('cat_integration', 'Integration', 'Issues with third-party integrations or APIs'),
('cat_security', 'Security', 'Security concerns or vulnerabilities'),
('cat_other', 'Other', 'Other issues not covered by the above categories');

-- Insert sample ticket priorities
INSERT INTO ticket_priorities (id, name, description, priority_level, color_code) VALUES
('pri_critical', 'Critical', 'System is down or major functionality is broken', 1, '#DC2626'),
('pri_high', 'High', 'Important functionality is affected', 2, '#EA580C'),
('pri_medium', 'Medium', 'Minor issues or workarounds available', 3, '#D97706'),
('pri_low', 'Low', 'Nice to have or cosmetic issues', 4, '#059669');

-- Insert sample ticket statuses
INSERT INTO ticket_statuses (id, name, description, is_closed, color_code) VALUES
('status_new', 'New', 'Newly created ticket', FALSE, '#3B82F6'),
('status_open', 'Open', 'Ticket is being investigated', FALSE, '#8B5CF6'),
('status_in_progress', 'In Progress', 'Ticket is being worked on', FALSE, '#F59E0B'),
('status_pending', 'Pending', 'Waiting for user response or external dependency', FALSE, '#6B7280'),
('status_resolved', 'Resolved', 'Issue has been fixed', TRUE, '#10B981'),
('status_closed', 'Closed', 'Ticket is closed', TRUE, '#6B7280'),
('status_rejected', 'Rejected', 'Ticket was rejected or not a valid issue', TRUE, '#EF4444');

-- ============================================================================
-- TICKET SYSTEM SCHEMA COMPLETE
-- ============================================================================
-- The ticket system includes:
-- 1. Ticket categories for organizing issues
-- 2. Priority levels for urgency management
-- 3. Status tracking for workflow management
-- 4. Full ticket lifecycle with comments and notifications
-- 5. Integration with existing user system
-- 6. Support for attachments and technical details
-- 7. Email notification system for administrators
