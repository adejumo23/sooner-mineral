-- Ticketing system: issues by module, comments, and image attachments
-- Run this once to create tables (e.g. mysql -u user -p database < database/tickets-schema.sql)

CREATE TABLE IF NOT EXISTS tickets (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  module VARCHAR(100) NOT NULL COMMENT 'e.g. Leads, Sections, Pricing, Data Import',
  status ENUM('Open', 'In Progress', 'Resolved', 'Closed') NOT NULL DEFAULT 'Open',
  priority ENUM('Low', 'Medium', 'High') NOT NULL DEFAULT 'Medium',
  requester_id VARCHAR(36) NOT NULL,
  assignee_id VARCHAR(36) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_tickets_module (module),
  INDEX idx_tickets_status (status),
  INDEX idx_tickets_requester (requester_id),
  INDEX idx_tickets_assignee (assignee_id),
  INDEX idx_tickets_created (created_at)
);

CREATE TABLE IF NOT EXISTS ticket_comments (
  id VARCHAR(36) PRIMARY KEY,
  ticket_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ticket_comments_ticket (ticket_id),
  FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ticket_attachments (
  id VARCHAR(36) PRIMARY KEY,
  ticket_id VARCHAR(36) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(512) NOT NULL,
  mime_type VARCHAR(128) NOT NULL,
  uploaded_by VARCHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ticket_attachments_ticket (ticket_id),
  FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
);
