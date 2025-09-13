-- ============================================================================
-- SETUP NORMALIZED DATABASE
-- ============================================================================
-- This script sets up the normalized database structure and populates it with data
-- Run this script to create the normalized tables and migrate existing data

-- ============================================================================
-- 1. CREATE NORMALIZED TABLES
-- ============================================================================

-- Run the normalized schema
SOURCE normalized_schema.sql;

-- ============================================================================
-- 2. POPULATE WITH SAMPLE DATA
-- ============================================================================

-- Insert sample states
INSERT INTO states (id, code, name) VALUES
('state_tx', 'TX', 'Texas'),
('state_ok', 'OK', 'Oklahoma'),
('state_nm', 'NM', 'New Mexico');

-- Insert sample counties
INSERT INTO counties (id, state_id, name, fip_id) VALUES
('county_midland', 'state_tx', 'Midland', '461'),
('county_love', 'state_ok', 'Love', NULL),
('county_kingfisher', 'state_ok', 'Kingfisher', NULL),
('county_upton', 'state_tx', 'Upton', '461'),
('county_howard', 'state_tx', 'Howard', '227');

-- Insert sample basins
INSERT INTO basins (id, name, description) VALUES
('basin_midland', 'Midland', 'Midland Basin in West Texas'),
('basin_delaware', 'Delaware', 'Delaware Basin in West Texas'),
('basin_anadarko', 'Anadarko', 'Anadarko Basin in Oklahoma');

-- Insert sample survey companies
INSERT INTO survey_companies (id, name, description) VALUES
('survey_tp', 'T&P RR CO', 'Texas and Pacific Railway Company'),
('survey_hewt', 'HE&WT RR CO', 'Houston East & West Texas Railway Company'),
('survey_gcsf', 'GC&SF RR CO', 'Gulf, Colorado and Santa Fe Railway Company');

-- Insert sample sections
INSERT INTO sections (id, county_id, section_number, township, range) VALUES
('section_15_02s_32e', 'county_midland', '15', '02S', '32E'),
('section_10_08s_02e', 'county_love', '10', '08S', '02E'),
('section_13_16n_07w', 'county_kingfisher', '13', '16N', '07W');

-- Insert sample abstracts
INSERT INTO abstracts (id, county_id, abstract_number, description) VALUES
('abstract_a1234', 'county_midland', 'A-1234', 'Abstract A-1234 in Midland County'),
('abstract_b5678', 'county_love', 'B-5678', 'Abstract B-5678 in Love County');

-- Insert sample properties
INSERT INTO properties (id, county_id, section_id, abstract_id, survey_company_id, unique_id, legal_description, gross_acres, is_state_land) VALUES
('prop_1', 'county_midland', 'section_15_02s_32e', 'abstract_a1234', 'survey_tp', 'TX-Midland-15', 'Section 15, Block 2, T&P RR Co. Survey', 640.00, FALSE),
('prop_2', 'county_love', 'section_10_08s_02e', NULL, NULL, 'OK-Love-10', 'W/2 of the SW/4 of Section 10, Township 8 South, Range 2 East', 80.00, FALSE),
('prop_3', 'county_kingfisher', 'section_13_16n_07w', NULL, NULL, 'OK-Kingfisher-13', 'N2 NW4, 80 ACRES, MOL', 80.00, FALSE);

-- Insert sample owner types
INSERT INTO owner_types (id, name, description) VALUES
('owner_type_individual', 'Individual', 'Individual owner'),
('owner_type_trust', 'Trust', 'Trust entity'),
('owner_type_llc', 'LLC', 'Limited Liability Company'),
('owner_type_corp', 'Corporation', 'Corporation');

-- Insert sample owners
INSERT INTO owners (id, owner_type_id, legal_name, display_name, is_deceased) VALUES
('owner_1', 'owner_type_individual', 'John Smith', 'John Smith', FALSE),
('owner_2', 'owner_type_trust', 'THE BARBARA J. FOREMAN REVOCABLE TRUST DATED 11/5/2003', 'Barbara Foreman Trust', FALSE),
('owner_3', 'owner_type_individual', 'Sarah Johnson', 'Sarah Johnson', FALSE),
('owner_4', 'owner_type_llc', 'L3 RESOURCES LLC', 'L3 Resources', FALSE);

-- Insert sample contact information
INSERT INTO contact_information (id, owner_id, contact_type, street_address, city, state_id, zip_code, phone_primary, email) VALUES
('contact_1', 'owner_1', 'Primary', '123 Main St', 'Midland', 'state_tx', '79701', '(555) 123-4567', 'john.smith@email.com'),
('contact_2', 'owner_2', 'Primary', 'PO BOX 1632', 'Norman', 'state_ok', '73070', '(480) 789-1087', 'barbara.foreman@email.com'),
('contact_3', 'owner_3', 'Primary', '456 Oak Ave', 'Ardmore', 'state_ok', '73401', '(555) 234-5678', 'sarah.j@email.com'),
('contact_4', 'owner_4', 'Primary', '789 Business Blvd', 'Oklahoma City', 'state_ok', '73101', '(555) 345-6789', 'contact@l3resources.com');

-- Insert sample interest types
INSERT INTO interest_types (id, name, description) VALUES
('interest_type_minerals', 'MINERALS', 'Mineral rights interest'),
('interest_type_royalty', 'ROYALTY', 'Royalty interest'),
('interest_type_working', 'WORKING', 'Working interest');

-- Insert sample mineral interests
INSERT INTO mineral_interests (id, property_id, owner_id, interest_type_id, net_mineral_acres, royalty_percentage, net_revenue_interest, allocation_percentage, ownership_percentage, source_of_title) VALUES
('mineral_1', 'prop_1', 'owner_1', 'interest_type_minerals', 80.0000, 0.2500, 0.2500, 0.5000, 0.5000, 'Warranty Deed dated 2015-03-15'),
('mineral_2', 'prop_1', 'owner_2', 'interest_type_minerals', 40.0000, 0.2500, 0.2500, 0.2500, 0.2500, 'Mineral Deed dated 2018-07-22'),
('mineral_3', 'prop_1', 'owner_4', 'interest_type_minerals', 40.0000, 0.2500, 0.2500, 0.2500, 0.2500, 'Assignment dated 2020-11-10'),
('mineral_4', 'prop_2', 'owner_3', 'interest_type_minerals', 80.0000, 0.1875, 0.1875, 1.0000, 1.0000, 'Warranty Deed dated 2016-09-08'),
('mineral_5', 'prop_3', 'owner_2', 'interest_type_minerals', 80.0000, 0.2500, 0.2500, 1.0000, 1.0000, '2006 OR');

-- Insert sample formations
INSERT INTO formations (id, name, description, is_active) VALUES
('formation_wolfcamp_a', 'Wolfcamp A', 'Wolfcamp A formation', TRUE),
('formation_wolfcamp_b', 'Wolfcamp B', 'Wolfcamp B formation', TRUE),
('formation_upper_spraberry', 'Upper Spraberry', 'Upper Spraberry formation', TRUE),
('formation_lower_spraberry', 'Lower Spraberry', 'Lower Spraberry formation', TRUE);

-- Insert sample formation pricing
INSERT INTO formation_pricing (id, property_id, formation_id, price_per_acre, is_available) VALUES
('fp_1', 'prop_1', 'formation_wolfcamp_a', 12000.00, TRUE),
('fp_2', 'prop_1', 'formation_wolfcamp_b', 15000.00, TRUE),
('fp_3', 'prop_2', 'formation_upper_spraberry', 8000.00, TRUE),
('fp_4', 'prop_3', 'formation_wolfcamp_a', 10000.00, TRUE);

-- Insert sample property pricing summary
INSERT INTO property_pricing_summary (id, property_id, basin_id, number_of_zones, output_price, price_per_boe, total_boe_per_acre, total_boe_per_anum, letter_rank, nra_price) VALUES
('pps_1', 'prop_1', 'basin_midland', 6, 34726.00, 5.00, 7133.00, 4683978.00, 'F', 17363.00),
('pps_2', 'prop_2', 'basin_anadarko', 4, 25000.00, 8.00, 5000.00, 400000.00, 'G', 12000.00),
('pps_3', 'prop_3', 'basin_anadarko', 3, 18000.00, 6.00, 3000.00, 240000.00, 'H', 9000.00);

-- Insert sample operators
INSERT INTO operators (id, name, description, is_active) VALUES
('op_pioneer', 'Pioneer Natural Resources', 'Pioneer Natural Resources Company', TRUE),
('op_devon', 'Devon Energy', 'Devon Energy Corporation', TRUE),
('op_eog', 'EOG Resources', 'EOG Resources Inc.', TRUE),
('op_clr', 'CLR', 'Continental Resources', TRUE);

-- Insert sample well status types
INSERT INTO well_status_types (id, name, description) VALUES
('well_status_producing', 'Producing', 'Well is currently producing'),
('well_status_drilling', 'Drilling', 'Well is currently being drilled'),
('well_status_permitting', 'Permitting', 'Well is in permitting phase'),
('well_status_duc', 'DUC', 'Drilled Uncompleted');

-- Insert sample wells
INSERT INTO wells (id, well_name, operator_id, property_id, well_status_id, allocation_percentage, first_production_date, completion_date, spud_date) VALUES
('well_1', 'Smith #1H', 'op_pioneer', 'prop_1', 'well_status_producing', 0.4795, '2023-03-20', '2023-03-20', '2023-01-15'),
('well_2', 'Johnson #1', 'op_devon', 'prop_2', 'well_status_producing', 0.6250, '2023-05-10', '2023-05-10', '2023-03-05'),
('well_3', 'Wilson #1H', 'op_eog', 'prop_3', 'well_status_drilling', 0.5000, NULL, NULL, '2024-01-20');

-- Insert sample unit tiers
INSERT INTO unit_tiers (id, name, description, priority_order) VALUES
('tier_aoi', 'AOI', 'Area of Interest', 1),
('tier_aoi_tier2', 'AOI - Tier 2', 'Area of Interest Tier 2', 2),
('tier_ran_pot', 'RAN/POT', 'Ranch/Potential', 3);

-- Insert sample unit status types
INSERT INTO unit_status_types (id, name, description) VALUES
('unit_status_actively_working', 'ACTIVELY WORKING', 'Actively working status'),
('unit_status_worked_follow_up', 'WORKED/FOLLOW UP', 'Worked/Follow up status'),
('unit_status_next_to_assign', 'NEXT TO ASSIGN', 'Next to assign status'),
('unit_status_sending_mailers', 'SENDING MAILERS', 'Sending mailers status');

-- Insert sample units
INSERT INTO units (id, well_id, tier_id, unit_status_id, tops_price_3_16th, number_of_owners, internal_notes, occ_activity_notes) VALUES
('unit_1', 'well_1', 'tier_aoi', 'unit_status_actively_working', 12000.00, 3, 'High-producing unit with excellent Wolfcamp A performance', 'Active drilling in progress'),
('unit_2', 'well_2', 'tier_aoi_tier2', 'unit_status_worked_follow_up', 11000.00, 1, 'Unit under due diligence - do not contact landowners', 'Permit approved, awaiting spud'),
('unit_3', 'well_3', 'tier_ran_pot', 'unit_status_next_to_assign', 10000.00, 1, 'Newly permitted unit targeting Eagle Ford formation', 'Application submitted');

-- Insert sample acquisition status types
INSERT INTO acquisition_status_types (id, name, description, is_active) VALUES
('acq_status_new', 'NEW', 'New acquisition target', TRUE),
('acq_status_working', 'WORKING', 'Currently working on acquisition', TRUE),
('acq_status_dropped', 'DROPPED', 'Dropped from acquisition', TRUE),
('acq_status_closed', 'CLOSED', 'Closed acquisition', TRUE);

-- Insert sample acquisition activities
INSERT INTO acquisition_activities (id, name, description) VALUES
('activity_lvm_txt_email', 'LVM/TXT/EMAIL', 'Left voicemail/Text/Email activity'),
('activity_working', 'WORKING', 'Working activity'),
('activity_dropped', 'DROPPED', 'Dropped activity'),
('activity_closed', 'CLOSED', 'Closed activity');

-- Insert sample acquisition tracking
INSERT INTO acquisition_tracking (id, mineral_interest_id, buyer_id, acquisition_status_id, activity_id, activity_count, notes, last_contact_date, next_follow_up_date) VALUES
('acq_1', 'mineral_1', 'u4', 'acq_status_working', 'activity_working', 2, 'Contact made, waiting response', '2024-01-15', '2024-01-22'),
('acq_2', 'mineral_2', 'u4', 'acq_status_working', 'activity_working', 1, 'Initial contact made', '2024-01-16', '2024-01-23'),
('acq_3', 'mineral_3', 'u4', 'acq_status_working', 'activity_working', 3, 'Follow-up needed', '2024-01-17', '2024-01-24'),
('acq_4', 'mineral_4', 'u2', 'acq_status_dropped', 'activity_dropped', 1, 'Not interested in selling', '2024-01-10', NULL),
('acq_5', 'mineral_5', 'u2', 'acq_status_dropped', 'activity_dropped', 1, 'Nathan said they are not interested in selling', '2024-02-15', NULL);

-- ============================================================================
-- 3. VERIFY DATA
-- ============================================================================

-- Check that all tables have data
SELECT 'States' as table_name, COUNT(*) as record_count FROM states
UNION ALL
SELECT 'Counties', COUNT(*) FROM counties
UNION ALL
SELECT 'Properties', COUNT(*) FROM properties
UNION ALL
SELECT 'Owners', COUNT(*) FROM owners
UNION ALL
SELECT 'Mineral Interests', COUNT(*) FROM mineral_interests
UNION ALL
SELECT 'Wells', COUNT(*) FROM wells
UNION ALL
SELECT 'Units', COUNT(*) FROM units
UNION ALL
SELECT 'Acquisition Tracking', COUNT(*) FROM acquisition_tracking;

-- ============================================================================
-- SETUP COMPLETE
-- ============================================================================
-- The normalized database has been created and populated with sample data
-- You can now use the normalized API service to access this data
