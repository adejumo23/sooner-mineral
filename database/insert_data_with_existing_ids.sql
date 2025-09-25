-- Insert data using existing IDs from the database
-- This script works with the existing data structure

USE soonermineraldb;

-- Insert sample abstracts data using existing county IDs
INSERT IGNORE INTO abstracts (id, county_id, abstract_number, description) VALUES
('abs_001', 'c1', 'A-123', 'Original patent from T&P RR CO'),
('abs_002', 'c2', 'B-456', 'Patent from HE&WT RR CO');

-- Insert sample sections data using existing county IDs
INSERT IGNORE INTO sections (id, township, `range`, section_number, county_id) VALUES
('sec_001', 'T1N', 'R1E', '1', 'c1'),
('sec_002', 'T1N', 'R1E', '2', 'c2');

-- Insert sample properties data using existing IDs
INSERT IGNORE INTO properties (id, county_id, section_id, abstract_id, survey_company_id, unique_id, legal_description, gross_acres, is_state_land) VALUES
('prop_001', 'c1', 'sec_001', 'abs_001', 'survey_tp', 'UPTON-001', 'Section 1, T1N R1E, Midland County, Texas', 640.00, 0),
('prop_002', 'c2', 'sec_002', 'abs_002', 'survey_hewt', 'LOVE-002', 'Section 2, T1N R1E, Love County, Oklahoma', 320.00, 0);

-- Insert sample owners data
INSERT IGNORE INTO owners (id, owner_type_id, legal_name, display_name, is_deceased) VALUES
('owner_001', 'owner_type_individual', 'John Smith', 'John Smith', 0),
('owner_002', 'owner_type_llc', 'Smith Family LLC', 'Smith Minerals', 0);

-- Insert sample contact information data using existing state IDs
INSERT IGNORE INTO contact_information (id, owner_id, state_id, contact_type, street_address, city, zip_code, phone_primary, email, notes) VALUES
('contact_001', 'owner_001', 's1', 'Primary', '123 Main St', 'Midland', '79701', '555-0101', 'john.smith@email.com', 'Primary contact for John Smith'),
('contact_002', 'owner_002', 's1', 'Primary', '456 Oak Ave', 'Midland', '79701', '555-0102', 'jane.smith@email.com', 'Primary contact for Smith Family LLC');

-- Insert sample mineral interests data
INSERT IGNORE INTO mineral_interests (id, property_id, owner_id, interest_type_id, net_mineral_acres, royalty_percentage, net_revenue_interest, ownership_percentage, source_of_title) VALUES
('min_001', 'prop_001', 'owner_001', 'interest_type_minerals', 160.00, 0.1875, 0.1875, 25.00, 'Deed from T&P RR CO'),
('min_002', 'prop_002', 'owner_002', 'interest_type_royalty', 40.00, 0.1250, 0.1250, 12.50, 'Deed from HE&WT RR CO');

-- Insert sample formation pricing data
INSERT IGNORE INTO formation_pricing (id, property_id, formation_id, price_per_acre, is_available) VALUES
('fp_001', 'prop_001', 'formation_upper_spraberry', 15000.00, 1),
('fp_002', 'prop_002', 'formation_wolfcamp_a', 25000.00, 1);

-- Insert sample property pricing summary data using existing basin IDs
INSERT IGNORE INTO property_pricing_summary (id, property_id, basin_id, number_of_zones, output_price, price_per_boe, total_boe_per_acre, total_boe_per_anum, letter_rank, nra_price) VALUES
('pps_001', 'prop_001', 'basin_midland', 3, 15000.00, 50.00, 300.00, 192000.00, 'A', 15000.00),
('pps_002', 'prop_002', 'basin_midland', 2, 25000.00, 75.00, 333.33, 106666.67, 'A+', 25000.00);

-- Insert sample wells data
INSERT IGNORE INTO wells (id, operator_id, property_id, well_status_id, well_name, allocation_percentage, first_production_date, completion_date, spud_date) VALUES
('well_001', 'op_clr', 'prop_001', 'well_status_drilling', 'Smith #1H', 25.00, '2024-02-15', '2024-02-15', '2024-01-15'),
('well_002', 'op_pioneer', 'prop_002', 'well_status_drilling', 'Jones #2H', 12.50, NULL, NULL, '2024-02-01');

-- Insert sample units data
INSERT IGNORE INTO units (id, well_id, tier_id, unit_status_id, tops_price_3_16th, number_of_owners, internal_notes, occ_activity_notes) VALUES
('unit_001', 'well_001', 'tier_aoi', 'unit_status_actively_working', 15000.00, 5, 'Active spacing unit in Upper Spraberry', 'Currently drilling'),
('unit_002', 'well_002', 'tier_aoi_tier2', 'unit_status_worked_follow_up', 25000.00, 3, 'Pooling unit in Wolfcamp A', 'Follow up required');

-- Insert sample acquisition tracking data
INSERT IGNORE INTO acquisition_tracking (id, mineral_interest_id, acquisition_status_id, buyer_id, activity_count, last_contact_date, next_follow_up_date, notes) VALUES
('acq_001', 'min_001', 'acq_status_working', 'user_001', 3, '2024-01-15', '2024-01-22', 'Currently negotiating with John Smith'),
('acq_002', 'min_002', 'acq_status_lvm_txt_email', 'user_001', 1, '2024-01-20', '2024-01-27', 'Left voicemail with Smith Family LLC');

-- Insert sample tract spatial data using existing tract IDs
INSERT IGNORE INTO tract_spatial (id, tract_id, latitude, longitude, geometry_type, geometry_data) VALUES
('spatial_001', 'tract_001', 31.123456, -101.789012, 'Polygon', '{"type": "Polygon", "coordinates": [[[-101.789012, 31.123456], [-101.789012, 31.124456], [-101.788012, 31.124456], [-101.788012, 31.123456], [-101.789012, 31.123456]]]}'),
('spatial_002', 'tract_002', 32.234567, -101.890123, 'Polygon', '{"type": "Polygon", "coordinates": [[[-101.890123, 32.234567], [-101.890123, 32.235567], [-101.889123, 32.235567], [-101.889123, 32.234567], [-101.890123, 32.234567]]]}');

-- Insert sample producing wells data
INSERT IGNORE INTO producing_wells (id, api_number, well_name, operator, latitude, longitude, status, spud_date, completion_date, total_depth, production_data) VALUES
('prod_001', '42-469-12345-00-00', 'Smith #1H', 'CLR', 31.123456, -101.789012, 'Producing', '2024-01-15', '2024-02-15', 8500, '{"oil_bbls": 500, "gas_mcf": 2000, "water_bbls": 100}'),
('prod_002', '42-227-67890-00-00', 'Jones #2H', 'PIONEER', 32.234567, -101.890123, 'Producing', '2024-02-01', '2024-03-01', 9000, '{"oil_bbls": 750, "gas_mcf": 3000, "water_bbls": 150}');

-- Insert sample permits data
INSERT IGNORE INTO permits (id, permit_number, operator, latitude, longitude, permit_type, permit_date, spud_date, total_depth, target_formation, status) VALUES
('perm_001', 'P-2024-001', 'CLR', 31.123456, -101.789012, 'Drilling', '2024-01-01', '2024-01-15', 8500, 'Upper Spraberry', 'Active'),
('perm_002', 'P-2024-002', 'PIONEER', 32.234567, -101.890123, 'Drilling', '2024-01-15', '2024-02-01', 9000, 'Wolfcamp A', 'Active');

-- Insert sample rigs data
INSERT IGNORE INTO rigs (id, rig_name, operator, latitude, longitude, rig_type, status, spud_date, target_completion, total_depth) VALUES
('rig_001', 'Rig Alpha', 'CLR', 31.123456, -101.789012, 'Drilling', 'Active', '2024-01-15', '2024-02-15', 8500),
('rig_002', 'Rig Beta', 'PIONEER', 32.234567, -101.890123, 'Drilling', 'Active', '2024-02-01', '2024-03-01', 9000);
