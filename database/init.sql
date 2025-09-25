-- MySQL Database Initialization Script for Sooner Mineral
-- This script will be executed when the MySQL container starts for the first time

-- Use the database
USE soonermineraldb;

-- Run the main database creation script (contains all core tables and data)
SOURCE /docker-entrypoint-initdb.d/create_database.sql;

-- Run the mapping and spatial data script (additional spatial tables)
SOURCE /docker-entrypoint-initdb.d/mapping.sql;

-- Additional SQL scripts will be executed in alphabetical order by MySQL
-- The files are already copied to /docker-entrypoint-initdb.d/ via volume mount 