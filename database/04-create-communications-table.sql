-- Communication Integration Module Database Schema
-- Creates tables for tracking all communications with landowners and stakeholders

-- Communications table - main table for all communication records
CREATE TABLE IF NOT EXISTS communications (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    contact_id VARCHAR(36),
    lead_id VARCHAR(36),
    deal_id VARCHAR(36),
    method ENUM('Email', 'Call', 'SMS', 'Mail') NOT NULL,
    direction ENUM('Inbound', 'Outbound') NOT NULL,
    subject VARCHAR(500),
    message_snippet TEXT,
    full_message TEXT,
    outcome ENUM('No Answer', 'Left Voicemail', 'Sent', 'Bounced', 'Replied', 'Delivered', 'Failed', 'Returned', 'Opened', 'Clicked') NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    duration_seconds INT DEFAULT NULL, -- for calls
    phone_number VARCHAR(20) DEFAULT NULL, -- for calls and SMS
    email_address VARCHAR(255) DEFAULT NULL, -- for emails
    campaign_id VARCHAR(36) DEFAULT NULL, -- for bulk campaigns
    sequence_step INT DEFAULT NULL, -- for email sequences
    attachment_count INT DEFAULT 0,
    is_private BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    INDEX idx_user_id (user_id),
    INDEX idx_contact_id (contact_id),
    INDEX idx_lead_id (lead_id),
    INDEX idx_deal_id (deal_id),
    INDEX idx_timestamp (timestamp),
    INDEX idx_method (method),
    INDEX idx_outcome (outcome),
    INDEX idx_campaign_id (campaign_id),
    
    -- Foreign key constraints
    CONSTRAINT fk_communications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_communications_contact FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL,
    CONSTRAINT fk_communications_lead FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL,
    CONSTRAINT fk_communications_deal FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Communication attachments table
CREATE TABLE IF NOT EXISTS communication_attachments (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    communication_id VARCHAR(36) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_communication_id (communication_id),
    CONSTRAINT fk_attachments_communication FOREIGN KEY (communication_id) REFERENCES communications(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Email campaigns table for bulk email sequences
CREATE TABLE IF NOT EXISTS email_campaigns (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_by VARCHAR(36) NOT NULL,
    status ENUM('Draft', 'Active', 'Paused', 'Completed', 'Cancelled') DEFAULT 'Draft',
    total_recipients INT DEFAULT 0,
    sent_count INT DEFAULT 0,
    opened_count INT DEFAULT 0,
    clicked_count INT DEFAULT 0,
    bounced_count INT DEFAULT 0,
    unsubscribed_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_created_by (created_by),
    INDEX idx_status (status),
    CONSTRAINT fk_campaigns_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Email sequence steps table
CREATE TABLE IF NOT EXISTS email_sequence_steps (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    campaign_id VARCHAR(36) NOT NULL,
    step_number INT NOT NULL,
    subject VARCHAR(500) NOT NULL,
    template_content TEXT NOT NULL,
    delay_days INT DEFAULT 0,
    delay_hours INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_campaign_id (campaign_id),
    INDEX idx_step_number (step_number),
    CONSTRAINT fk_sequence_steps_campaign FOREIGN KEY (campaign_id) REFERENCES email_campaigns(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Campaign recipients table
CREATE TABLE IF NOT EXISTS campaign_recipients (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    campaign_id VARCHAR(36) NOT NULL,
    contact_id VARCHAR(36) NOT NULL,
    lead_id VARCHAR(36),
    email_address VARCHAR(255) NOT NULL,
    status ENUM('Pending', 'Sent', 'Delivered', 'Opened', 'Clicked', 'Bounced', 'Unsubscribed', 'Failed') DEFAULT 'Pending',
    current_step INT DEFAULT 1,
    last_sent_at TIMESTAMP NULL,
    next_send_at TIMESTAMP NULL,
    unsubscribed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_campaign_id (campaign_id),
    INDEX idx_contact_id (contact_id),
    INDEX idx_lead_id (lead_id),
    INDEX idx_status (status),
    INDEX idx_next_send_at (next_send_at),
    CONSTRAINT fk_recipients_campaign FOREIGN KEY (campaign_id) REFERENCES email_campaigns(id) ON DELETE CASCADE,
    CONSTRAINT fk_recipients_contact FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
    CONSTRAINT fk_recipients_lead FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Direct mail logs table
CREATE TABLE IF NOT EXISTS direct_mail_logs (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    contact_id VARCHAR(36) NOT NULL,
    lead_id VARCHAR(36),
    mail_type ENUM('Letter', 'Postcard', 'Brochure', 'Contract', 'Other') NOT NULL,
    subject VARCHAR(500),
    content_summary TEXT,
    sent_by VARCHAR(36) NOT NULL,
    sent_date DATE NOT NULL,
    tracking_number VARCHAR(100),
    status ENUM('Sent', 'Delivered', 'Returned', 'Failed') DEFAULT 'Sent',
    return_reason VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_contact_id (contact_id),
    INDEX idx_lead_id (lead_id),
    INDEX idx_sent_by (sent_by),
    INDEX idx_sent_date (sent_date),
    INDEX idx_status (status),
    CONSTRAINT fk_mail_logs_contact FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
    CONSTRAINT fk_mail_logs_lead FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL,
    CONSTRAINT fk_mail_logs_sent_by FOREIGN KEY (sent_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Communication templates table
CREATE TABLE IF NOT EXISTS communication_templates (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type ENUM('Email', 'SMS', 'Call Script', 'Mail') NOT NULL,
    subject VARCHAR(500),
    content TEXT NOT NULL,
    variables JSON, -- for template variables like {{contact_name}}
    created_by VARCHAR(36) NOT NULL,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_type (type),
    INDEX idx_created_by (created_by),
    INDEX idx_is_public (is_public),
    CONSTRAINT fk_templates_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Insert sample data
INSERT INTO communication_templates (id, name, type, subject, content, created_by, is_public) VALUES
('template_1', 'Initial Outreach Email', 'Email', 'Mineral Rights Opportunity - {{contact_name}}', 'Dear {{contact_name}},\n\nI hope this message finds you well. I am reaching out regarding your mineral rights in {{county}}, {{state}}. We are actively acquiring mineral interests in your area and would like to discuss a potential offer.\n\nWould you be available for a brief conversation this week?\n\nBest regards,\n{{user_name}}', 'u1', TRUE),
('template_2', 'Follow-up Call Script', 'Call Script', NULL, 'Hello {{contact_name}}, this is {{user_name}} from Sooner State Energy Capital. I sent you an email about your mineral rights in {{county}}. Do you have a few minutes to discuss this opportunity?', 'u1', TRUE),
('template_3', 'SMS Follow-up', 'SMS', NULL, 'Hi {{contact_name}}, this is {{user_name}} from Sooner State Energy Capital. I sent you an email about your mineral rights. Please call me back at your convenience. Thank you!', 'u1', TRUE);

-- Insert sample communications
INSERT INTO communications (id, user_id, contact_id, lead_id, method, direction, subject, message_snippet, outcome, timestamp) VALUES
('comm_1', 'u4', 'c1', 'lead1', 'Email', 'Outbound', 'Mineral Rights Opportunity - John Smith', 'I hope this message finds you well. I am reaching out regarding your mineral rights...', 'Delivered', '2025-09-13 10:00:00'),
('comm_2', 'u4', 'c1', 'lead1', 'Call', 'Outbound', NULL, 'Left voicemail about mineral rights opportunity', 'Left Voicemail', '2025-09-13 14:30:00'),
('comm_3', 'u4', 'c2', 'lead2', 'Email', 'Outbound', 'Follow-up on Mineral Rights Discussion', 'Thank you for your time on our call yesterday...', 'Opened', '2025-09-14 09:15:00'),
('comm_4', 'u4', 'c3', 'lead3', 'SMS', 'Outbound', NULL, 'Hi Mike, this is David from Sooner State Energy Capital. I sent you an email about your mineral rights. Please call me back at your convenience.', 'Delivered', '2025-09-14 16:45:00');

-- Insert sample direct mail log
INSERT INTO direct_mail_logs (id, contact_id, lead_id, mail_type, subject, content_summary, sent_by, sent_date, status) VALUES
('mail_1', 'c1', 'lead1', 'Letter', 'Mineral Rights Acquisition Proposal', 'Formal offer letter with terms and conditions', 'u4', '2025-09-15', 'Sent'),
('mail_2', 'c2', 'lead2', 'Postcard', 'Thank You for Your Interest', 'Follow-up postcard after initial contact', 'u4', '2025-09-16', 'Delivered');
