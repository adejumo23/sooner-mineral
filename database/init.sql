-- MySQL Database Initialization Script for Sooner Mineral
-- This script will be executed when the MySQL container starts for the first time
-- This is a minimal init script - the main data comes from full-db-dump.sql

-- The full-db-dump.sql file will be executed automatically by MySQL Docker
-- because it's mounted in /docker-entrypoint-initdb.d/ and contains the complete
-- database schema and data including the CREATE DATABASE statement.

-- This file exists to ensure there's always an init.sql file present
-- The actual initialization is handled by full-db-dump.sql 