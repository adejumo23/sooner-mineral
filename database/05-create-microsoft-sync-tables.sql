-- Microsoft 365 Integration Tables
-- This script creates the necessary tables for Microsoft 365 sync functionality

-- User Microsoft tokens table
CREATE TABLE `user_microsoft_tokens` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `access_token` text NOT NULL,
  `refresh_token` text,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_tokens` (`user_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_expires_at` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- User sync status table
CREATE TABLE `user_sync_status` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `sync_type` enum('emails','calendar','contacts','all') NOT NULL,
  `last_sync_time` timestamp NULL DEFAULT NULL,
  `sync_count` int DEFAULT 0,
  `error_count` int DEFAULT 0,
  `last_error` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_sync` (`user_id`, `sync_type`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_sync_type` (`sync_type`),
  KEY `idx_last_sync_time` (`last_sync_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Microsoft 365 contacts table
CREATE TABLE `microsoft_contacts` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `microsoft_id` varchar(255) NOT NULL,
  `display_name` varchar(255) NOT NULL,
  `email_address` varchar(255),
  `phone_number` varchar(50),
  `company` varchar(255),
  `job_title` varchar(255),
  `department` varchar(255),
  `office_location` varchar(255),
  `notes` text,
  `last_contacted` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_microsoft_contact` (`user_id`, `microsoft_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_microsoft_id` (`microsoft_id`),
  KEY `idx_email_address` (`email_address`),
  KEY `idx_display_name` (`display_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Microsoft 365 calendar events table
CREATE TABLE `microsoft_calendar_events` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `microsoft_id` varchar(255) NOT NULL,
  `subject` varchar(500) NOT NULL,
  `start_time` timestamp NOT NULL,
  `end_time` timestamp NOT NULL,
  `location` varchar(500),
  `attendees` json,
  `is_online_meeting` boolean DEFAULT FALSE,
  `online_meeting_provider` varchar(100),
  `meeting_url` varchar(500),
  `description` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_microsoft_event` (`user_id`, `microsoft_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_microsoft_id` (`microsoft_id`),
  KEY `idx_start_time` (`start_time`),
  KEY `idx_end_time` (`end_time`),
  KEY `idx_subject` (`subject`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Microsoft 365 email threads table
CREATE TABLE `microsoft_email_threads` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `thread_id` varchar(255) NOT NULL,
  `subject` varchar(500) NOT NULL,
  `participants` json,
  `message_count` int DEFAULT 1,
  `last_message_time` timestamp NULL DEFAULT NULL,
  `is_read` boolean DEFAULT FALSE,
  `importance` enum('Low','Normal','High') DEFAULT 'Normal',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_thread` (`user_id`, `thread_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_thread_id` (`thread_id`),
  KEY `idx_last_message_time` (`last_message_time`),
  KEY `idx_subject` (`subject`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Microsoft 365 sync logs table
CREATE TABLE `microsoft_sync_logs` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `sync_type` enum('emails','calendar','contacts','all') NOT NULL,
  `status` enum('success','error','partial') NOT NULL,
  `items_processed` int DEFAULT 0,
  `items_synced` int DEFAULT 0,
  `items_failed` int DEFAULT 0,
  `error_message` text,
  `sync_duration` int DEFAULT 0,
  `started_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `completed_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_sync_type` (`sync_type`),
  KEY `idx_status` (`status`),
  KEY `idx_started_at` (`started_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Add Microsoft 365 sync fields to communications table
ALTER TABLE `communications` 
ADD COLUMN `microsoft_id` varchar(255) NULL AFTER `id`,
ADD COLUMN `thread_id` varchar(255) NULL AFTER `microsoft_id`,
ADD COLUMN `is_synced` boolean DEFAULT FALSE AFTER `is_private`,
ADD COLUMN `sync_source` enum('manual','microsoft','outlook','calendar') DEFAULT 'manual' AFTER `is_synced`,
ADD INDEX `idx_microsoft_id` (`microsoft_id`),
ADD INDEX `idx_thread_id` (`thread_id`),
ADD INDEX `idx_is_synced` (`is_synced`),
ADD INDEX `idx_sync_source` (`sync_source`);

-- Add Microsoft 365 sync fields to email_campaigns table
ALTER TABLE `email_campaigns` 
ADD COLUMN `microsoft_sync_enabled` boolean DEFAULT FALSE AFTER `unsubscribed_count`,
ADD COLUMN `microsoft_folder_id` varchar(255) NULL AFTER `microsoft_sync_enabled`,
ADD COLUMN `last_microsoft_sync` timestamp NULL DEFAULT NULL AFTER `microsoft_folder_id`,
ADD INDEX `idx_microsoft_sync_enabled` (`microsoft_sync_enabled`),
ADD INDEX `idx_microsoft_folder_id` (`microsoft_folder_id`);

-- Create indexes for better performance
CREATE INDEX `idx_communications_user_sync` ON `communications` (`user_id`, `sync_source`, `is_synced`);
CREATE INDEX `idx_communications_microsoft_thread` ON `communications` (`microsoft_id`, `thread_id`);
CREATE INDEX `idx_calendar_events_user_time` ON `microsoft_calendar_events` (`user_id`, `start_time`, `end_time`);
CREATE INDEX `idx_email_threads_user_time` ON `microsoft_email_threads` (`user_id`, `last_message_time`);

-- Insert sample sync status for testing
INSERT INTO `user_sync_status` (`id`, `user_id`, `sync_type`, `last_sync_time`, `sync_count`, `error_count`) VALUES
('sync_1', 'user_1', 'emails', NOW(), 0, 0),
('sync_2', 'user_1', 'calendar', NOW(), 0, 0),
('sync_3', 'user_1', 'contacts', NOW(), 0, 0);

-- Create views for easier querying
CREATE VIEW `user_microsoft_sync_summary` AS
SELECT 
    u.id as user_id,
    u.name as user_name,
    u.email as user_email,
    t.access_token IS NOT NULL as is_authenticated,
    t.expires_at,
    s.last_sync_time,
    s.sync_count,
    s.error_count,
    s.last_error
FROM users u
LEFT JOIN user_microsoft_tokens t ON u.id = t.user_id
LEFT JOIN user_sync_status s ON u.id = s.user_id AND s.sync_type = 'all';

CREATE VIEW `microsoft_communications_summary` AS
SELECT 
    c.id,
    c.user_id,
    c.method,
    c.direction,
    c.subject,
    c.timestamp,
    c.sync_source,
    c.is_synced,
    c.microsoft_id,
    c.thread_id,
    u.name as user_name,
    u.email as user_email
FROM communications c
JOIN users u ON c.user_id = u.id
WHERE c.sync_source IN ('microsoft', 'outlook', 'calendar')
ORDER BY c.timestamp DESC;
