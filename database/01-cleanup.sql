-- MySQL Database Cleanup Script
-- This script re-enables constraints after the database dump is loaded

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Re-enable unique checks
SET UNIQUE_CHECKS = 1;

-- Re-enable autocommit
SET AUTOCOMMIT = 1;

-- Commit all changes
COMMIT;
