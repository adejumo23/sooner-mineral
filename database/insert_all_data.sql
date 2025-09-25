-- Insert all data into the database
-- This script contains all INSERT statements for populating the database

USE soonermineraldb;

-- Insert states data
INSERT IGNORE INTO states (id, code, name) VALUES
('state_tx', 'TX', 'Texas'),
('state_ok', 'OK', 'Oklahoma'),
('state_nm', 'NM', 'New Mexico');

-- Insert basins data
INSERT IGNORE INTO basins (id, name, description) VALUES
('basin_midland', 'Midland', 'Midland Basin in West Texas'),
('basin_delaware', 'Delaware', 'Delaware Basin in West Texas'),
('basin_anadarko', 'Anadarko', 'Anadarko Basin in Oklahoma');

-- Insert counties data
INSERT IGNORE INTO counties (id, state_id, name, fip_id) VALUES
('county_upton', 'state_tx', 'Upton', '461'),
('county_howard', 'state_tx', 'Howard', '227'),
('county_mitchell', 'state_tx', 'Mitchell', '335'),
('county_reeves', 'state_tx', 'Reeves', '389'),
('county_kingfisher', 'state_ok', 'Kingfisher', NULL);

-- Insert survey companies data
INSERT IGNORE INTO survey_companies (id, name, description) VALUES
('survey_tp', 'T&P RR CO', 'Texas and Pacific Railway Company'),
('survey_hewt', 'HE&WT RR CO', 'Houston East & West Texas Railway Company'),
('survey_gcsf', 'GC&SF RR CO', 'Gulf, Colorado and Santa Fe Railway Company'),
('survey_psl', 'PSL', 'Public School Land');

-- Insert formations data
INSERT IGNORE INTO formations (id, name, description) VALUES
('formation_upper_spraberry', 'Upper Spraberry', 'Upper Spraberry formation'),
('formation_lower_spraberry', 'Lower Spraberry', 'Lower Spraberry formation'),
('formation_3rd_bone_spring', '3rd Bone Spring', 'Third Bone Spring formation'),
('formation_wolfcamp_a', 'Wolfcamp A', 'Wolfcamp A formation'),
('formation_wolfcamp_b', 'Wolfcamp B', 'Wolfcamp B formation');

-- Insert operators data
INSERT IGNORE INTO operators (id, name, description) VALUES
('op_clr', 'CLR', 'Continental Resources'),
('op_ovintiv', 'OVINTIV', 'Ovintiv Inc.'),
('op_marathon', 'MARATHON', 'Marathon Oil Corporation'),
('op_pioneer', 'PIONEER', 'Pioneer Natural Resources'),
('op_devon', 'DEVON', 'Devon Energy');

-- Insert well status types data
INSERT IGNORE INTO well_status_types (id, name, description) VALUES
('well_status_order', 'ORDER', 'Order status'),
('well_status_permitted', 'PERMITTED', 'Permitted status'),
('well_status_drilling', 'DRILLING', 'Drilling status'),
('well_status_application', 'APPLICATION', 'Application status'),
('well_status_duc', 'DUC', 'Drilled Uncompleted status');

-- Insert unit tiers data
INSERT IGNORE INTO unit_tiers (id, name, description, priority_order) VALUES
('tier_aoi', 'AOI', 'Area of Interest', 1),
('tier_aoi_tier2', 'AOI - Tier 2', 'Area of Interest Tier 2', 2),
('tier_ran_pot', 'RAN/POT', 'Ranch/Potential', 3);

-- Insert unit status types data
INSERT IGNORE INTO unit_status_types (id, name, description) VALUES
('unit_status_actively_working', 'ACTIVELY WORKING', 'Actively working status'),
('unit_status_worked_follow_up', 'WORKED/FOLLOW UP', 'Worked/Follow up status'),
('unit_status_next_to_assign', 'NEXT TO ASSIGN', 'Next to assign status'),
('unit_status_sending_mailers', 'SENDING MAILERS', 'Sending mailers status'),
('unit_status_tbd_waiting', 'TBD/WAITING ON $', 'To be determined/Waiting on money status');

-- Insert acquisition status types data
INSERT IGNORE INTO acquisition_status_types (id, name, description) VALUES
('acq_status_new', 'NEW', 'New acquisition target'),
('acq_status_working', 'WORKING', 'Currently working on acquisition'),
('acq_status_lvm_txt_email', 'LVM/TXT/EMAIL', 'Left voicemail/Text/Email status'),
('acq_status_wtl', 'WTL', 'Want to lease status'),
('acq_status_dropped', 'DROPPED', 'Dropped from acquisition');

-- Insert acquisition activities data
INSERT IGNORE INTO acquisition_activities (id, name, description) VALUES
('activity_closed', 'CLOSED', 'Closed activity'),
('activity_nego', 'NEGO', 'Negotiation activity'),
('activity_mailers', 'Mailers', 'Mailers activity'),
('activity_lvm_txt_email', 'LVM/TXT/EMAIL', 'Left voicemail/Text/Email activity'),
('activity_wtl', 'WTL', 'Want to lease activity');

-- Insert owner types data
INSERT IGNORE INTO owner_types (id, name, description) VALUES
('owner_type_individual', 'Individual', 'Individual owner'),
('owner_type_trust', 'Trust', 'Trust entity'),
('owner_type_llc', 'LLC', 'Limited Liability Company'),
('owner_type_corp', 'Corporation', 'Corporation'),
('owner_type_partnership', 'Partnership', 'Partnership');

-- Insert interest types data
INSERT IGNORE INTO interest_types (id, name, description) VALUES
('interest_type_minerals', 'MINERALS', 'Mineral rights interest'),
('interest_type_royalty', 'ROYALTY', 'Royalty interest'),
('interest_type_working', 'WORKING', 'Working interest');

-- Insert sample properties data
INSERT IGNORE INTO properties (id, county_id, section_id, abstract_id, survey_company_id, unique_id, legal_description, gross_acres, is_state_land) VALUES
('prop_001', 'county_upton', 'sec_001', 'abs_001', 'survey_tp', 'UPTON-001', 'Section 1, T1N R1E, Upton County, Texas', 640.00, 0),
('prop_002', 'county_howard', 'sec_002', 'abs_002', 'survey_hewt', 'HOWARD-002', 'Section 2, T1N R1E, Howard County, Texas', 320.00, 0);

-- Insert sample abstracts data
INSERT IGNORE INTO abstracts (id, county_id, abstract_number, description) VALUES
('abs_001', 'county_upton', 'A-123', 'Original patent from T&P RR CO'),
('abs_002', 'county_howard', 'B-456', 'Patent from HE&WT RR CO');

-- Insert sample sections data
INSERT IGNORE INTO sections (id, township, `range`, section_number, county_id) VALUES
('sec_001', 'T1N', 'R1E', '1', 'county_upton'),
('sec_002', 'T1N', 'R1E', '2', 'county_upton');

-- Insert sample owners data
INSERT IGNORE INTO owners (id, owner_type_id, legal_name, display_name, is_deceased) VALUES
('owner_001', 'owner_type_individual', 'John Smith', 'John Smith', 0),
('owner_002', 'owner_type_llc', 'Smith Family LLC', 'Smith Minerals', 0);

-- Insert sample contact information data
INSERT IGNORE INTO contact_information (id, owner_id, state_id, contact_type, street_address, city, zip_code, phone_primary, email, notes) VALUES
('contact_001', 'owner_001', 'state_tx', 'Primary', '123 Main St', 'Midland', '79701', '555-0101', 'john.smith@email.com', 'Primary contact for John Smith'),
('contact_002', 'owner_002', 'state_tx', 'Primary', '456 Oak Ave', 'Midland', '79701', '555-0102', 'jane.smith@email.com', 'Primary contact for Smith Family LLC');

-- Insert sample mineral interests data
INSERT IGNORE INTO mineral_interests (id, property_id, owner_id, interest_type_id, net_mineral_acres, royalty_percentage, net_revenue_interest, ownership_percentage, source_of_title) VALUES
('min_001', 'prop_001', 'owner_001', 'interest_type_minerals', 160.00, 0.1875, 0.1875, 25.00, 'Deed from T&P RR CO'),
('min_002', 'prop_002', 'owner_002', 'interest_type_royalty', 40.00, 0.1250, 0.1250, 12.50, 'Deed from HE&WT RR CO');

-- Insert sample formation pricing data
INSERT IGNORE INTO formation_pricing (id, property_id, formation_id, price_per_acre, is_available) VALUES
('fp_001', 'prop_001', 'formation_upper_spraberry', 15000.00, 1),
('fp_002', 'prop_002', 'formation_wolfcamp_a', 25000.00, 1);

-- Insert sample property pricing summary data
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

-- Insert sample tract spatial data
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

-- Note: mapping_units table was renamed to avoid conflict with normalized units table

-- Note: map_layer_preferences table may not exist in current schema
