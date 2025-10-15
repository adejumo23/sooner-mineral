-- Migration script to rename tract to section
-- This script renames the tracts table to sections and updates related columns

-- Rename the tracts table to sections
RENAME TABLE tracts TO sections;

-- Rename the tract_name column to section_name
ALTER TABLE sections CHANGE COLUMN tract_name section_name VARCHAR(255) NOT NULL;

-- Rename the tract_id column to section_id in related tables
ALTER TABLE contact_tract_ownership CHANGE COLUMN tract_id section_id VARCHAR(36) NOT NULL;
RENAME TABLE contact_tract_ownership TO contact_section_ownership;

-- Update tract_spatial table
ALTER TABLE tract_spatial CHANGE COLUMN tract_id section_id VARCHAR(36) NOT NULL;
RENAME TABLE tract_spatial TO section_spatial;

-- Update any other tables that reference tract_id
-- Note: You may need to add more ALTER TABLE statements for other tables that reference tracts
-- This is a basic migration - you may need to update additional tables based on your schema

-- Update any foreign key constraints if they exist
-- ALTER TABLE contact_section_ownership ADD CONSTRAINT fk_contact_section_section_id 
--   FOREIGN KEY (section_id) REFERENCES sections(id);

-- ALTER TABLE section_spatial ADD CONSTRAINT fk_section_spatial_section_id 
--   FOREIGN KEY (section_id) REFERENCES sections(id);

