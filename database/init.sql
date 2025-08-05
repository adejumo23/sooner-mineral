-- MySQL Database Initialization Script for Sooner Mineral
-- This script will be executed when the MySQL container starts for the first time

-- Use the database
USE soonermineraldb;

-- Run the main database creation script
SOURCE /docker-entrypoint-initdb.d/create_database.sql;

-- Run the contacts and related tables script
SOURCE /docker-entrypoint-initdb.d/contacts.sql;

-- Run the leads and lead notes script
SOURCE /docker-entrypoint-initdb.d/leads.sql;

-- Run the mapping and spatial data script
SOURCE /docker-entrypoint-initdb.d/mapping.sql;

-- Run additional SQL scripts if they exist
-- These will be executed in alphabetical order by MySQL
-- The files are already copied to /docker-entrypoint-initdb.d/ via volume mount 