-- ============================================================================
-- MAPPING TABLES FOR SPATIAL DATA AND GIS LAYERS
-- ============================================================================

-- Tract spatial data
CREATE TABLE tract_spatial (
    id VARCHAR(36) PRIMARY KEY,
    tract_id VARCHAR(36) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    geometry_type ENUM('Point', 'Polygon', 'STR') DEFAULT 'Point',
    geometry_data JSON, -- GeoJSON or STR data
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tract_id) REFERENCES tracts(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Producing wells data
CREATE TABLE producing_wells (
    id VARCHAR(36) PRIMARY KEY,
    api_number VARCHAR(20) UNIQUE,
    well_name VARCHAR(255),
    operator VARCHAR(255),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    status ENUM('Producing', 'Shut-in', 'Abandoned', 'Drilling') DEFAULT 'Producing',
    spud_date DATE,
    completion_date DATE,
    total_depth INTEGER,
    production_data JSON, -- Monthly production data
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Permits data
CREATE TABLE permits (
    id VARCHAR(36) PRIMARY KEY,
    permit_number VARCHAR(50),
    operator VARCHAR(255),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    permit_type ENUM('Drilling', 'Recompletion', 'Workover', 'Abandonment') DEFAULT 'Drilling',
    permit_date DATE,
    spud_date DATE,
    total_depth INTEGER,
    target_formation VARCHAR(100),
    status ENUM('Pending', 'Approved', 'Drilling', 'Completed', 'Abandoned') DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Rigs data
CREATE TABLE rigs (
    id VARCHAR(36) PRIMARY KEY,
    rig_name VARCHAR(255),
    operator VARCHAR(255),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    rig_type ENUM('Land', 'Offshore', 'Platform') DEFAULT 'Land',
    status ENUM('Active', 'Moving', 'Stacked', 'Retired') DEFAULT 'Active',
    spud_date DATE,
    target_completion DATE,
    total_depth INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Units data (mapping/spatial units)
CREATE TABLE mapping_units (
    id VARCHAR(36) PRIMARY KEY,
    unit_name VARCHAR(255),
    operator VARCHAR(255),
    unit_type ENUM('Spacing', 'Pooling', 'Drilling') DEFAULT 'Spacing',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    geometry_data JSON, -- Unit boundary GeoJSON
    formation VARCHAR(100),
    status ENUM('Proposed', 'Approved', 'Active', 'Abandoned') DEFAULT 'Proposed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Map layer preferences (user-specific)
CREATE TABLE map_layer_preferences (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    layer_name VARCHAR(50) NOT NULL,
    is_visible BOOLEAN DEFAULT TRUE,
    opacity DECIMAL(3, 2) DEFAULT 1.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY unique_user_layer (user_id, layer_name)
);

-- ============================================================================
-- SAMPLE DATA
-- ============================================================================

-- Insert sample tract spatial data
INSERT INTO tract_spatial (id, tract_id, latitude, longitude, geometry_type, geometry_data) VALUES
('ts1', 't1', 31.9686, -102.0776, 'STR', '{"str": "15-02S-32E", "section": "15", "township": "2S", "range": "32E"}'),
('ts2', 't2', 33.9137, -97.0965, 'STR', '{"str": "10-08S-02E", "section": "10", "township": "8S", "range": "2E"}'),
('ts3', 't3', 32.7767, -96.7970, 'Point', '{"type": "Point", "coordinates": [-96.7970, 32.7767]}');

-- Insert sample producing wells
INSERT INTO producing_wells (id, api_number, well_name, operator, latitude, longitude, status, spud_date, completion_date, total_depth, production_data) VALUES
('pw1', '42-335-12345', 'Smith #1H', 'Pioneer Natural Resources', 31.9686, -102.0776, 'Producing', '2023-01-15', '2023-03-20', 12000, '{"2024-01": {"oil": 150, "gas": 500, "water": 200}, "2024-02": {"oil": 145, "gas": 480, "water": 220}}'),
('pw2', '42-335-12346', 'Smith #2H', 'Pioneer Natural Resources', 31.9690, -102.0780, 'Producing', '2023-02-10', '2023-04-15', 12000, '{"2024-01": {"oil": 160, "gas": 520, "water": 180}, "2024-02": {"oil": 155, "gas": 500, "water": 200}}'),
('pw3', '40-439-78901', 'Johnson #1', 'Devon Energy', 33.9137, -97.0965, 'Producing', '2023-03-05', '2023-05-10', 11000, '{"2024-01": {"oil": 120, "gas": 400, "water": 150}, "2024-02": {"oil": 118, "gas": 390, "water": 160}}'),
('pw4', '40-439-78902', 'Johnson #2', 'Devon Energy', 33.9140, -97.0970, 'Drilling', '2024-01-20', NULL, 8000, NULL),
('pw5', '48-113-45678', 'Wilson #1H', 'EOG Resources', 32.7767, -96.7970, 'Producing', '2023-04-12', '2023-06-18', 13000, '{"2024-01": {"oil": 180, "gas": 600, "water": 250}, "2024-02": {"oil": 175, "gas": 580, "water": 270}}');

-- Insert sample permits
INSERT INTO permits (id, permit_number, operator, latitude, longitude, permit_type, permit_date, spud_date, total_depth, target_formation, status) VALUES
('p1', '42-335-12347', 'Pioneer Natural Resources', 31.9688, -102.0778, 'Drilling', '2024-01-15', '2024-02-01', 12000, 'Wolfcamp A', 'Drilling'),
('p2', '40-439-78903', 'Devon Energy', 33.9139, -97.0967, 'Drilling', '2024-01-20', '2024-02-05', 11000, 'Woodford', 'Approved'),
('p3', '48-113-45679', 'EOG Resources', 32.7769, -96.7972, 'Recompletion', '2024-01-25', NULL, 13000, 'Eagle Ford', 'Pending');

-- Insert sample rigs
INSERT INTO rigs (id, rig_name, operator, latitude, longitude, rig_type, status, spud_date, target_completion, total_depth) VALUES
('r1', 'Pioneer Rig #15', 'Pioneer Natural Resources', 31.9688, -102.0778, 'Land', 'Active', '2024-02-01', '2024-04-01', 12000),
('r2', 'Devon Rig #8', 'Devon Energy', 33.9139, -97.0967, 'Land', 'Active', '2024-02-05', '2024-04-05', 11000),
('r3', 'EOG Rig #22', 'EOG Resources', 32.7769, -96.7972, 'Land', 'Moving', '2024-02-10', '2024-04-10', 13000);

-- Insert sample units
INSERT INTO units (id, unit_name, operator, unit_type, latitude, longitude, geometry_data, formation, status) VALUES
('u1', 'Smith Unit', 'Pioneer Natural Resources', 'Spacing', 31.9686, -102.0776, '{"type": "Polygon", "coordinates": [[[-102.0776, 31.9686], [-102.0770, 31.9686], [-102.0770, 31.9690], [-102.0776, 31.9690], [-102.0776, 31.9686]]]}', 'Wolfcamp A', 'Active'),
('u2', 'Johnson Unit', 'Devon Energy', 'Pooling', 33.9137, -97.0965, '{"type": "Polygon", "coordinates": [[[-97.0965, 33.9137], [-97.0960, 33.9137], [-97.0960, 33.9140], [-97.0965, 33.9140], [-97.0965, 33.9137]]]}', 'Woodford', 'Active'),
('u3', 'Wilson Unit', 'EOG Resources', 'Drilling', 32.7767, -96.7970, '{"type": "Polygon", "coordinates": [[[-96.7970, 32.7767], [-96.7965, 32.7767], [-96.7965, 32.7770], [-96.7970, 32.7770], [-96.7970, 32.7767]]]}', 'Eagle Ford', 'Proposed');

-- Insert sample map layer preferences
INSERT INTO map_layer_preferences (id, user_id, layer_name, is_visible, opacity) VALUES
('mlp1', 'u1', 'tract_boundary', TRUE, 1.00),
('mlp2', 'u1', 'producing_wells', TRUE, 0.80),
('mlp3', 'u1', 'permits', TRUE, 0.70),
('mlp4', 'u1', 'rigs', TRUE, 0.90),
('mlp5', 'u1', 'units', FALSE, 0.60),
('mlp6', 'u1', 'nearby_tracts', TRUE, 0.50);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX idx_tract_spatial_tract ON tract_spatial(tract_id);
CREATE INDEX idx_tract_spatial_coords ON tract_spatial(latitude, longitude);
CREATE INDEX idx_producing_wells_coords ON producing_wells(latitude, longitude);
CREATE INDEX idx_producing_wells_status ON producing_wells(status);
CREATE INDEX idx_producing_wells_operator ON producing_wells(operator);
CREATE INDEX idx_permits_coords ON permits(latitude, longitude);
CREATE INDEX idx_permits_status ON permits(status);
CREATE INDEX idx_permits_date ON permits(permit_date);
CREATE INDEX idx_rigs_coords ON rigs(latitude, longitude);
CREATE INDEX idx_rigs_status ON rigs(status);
CREATE INDEX idx_units_coords ON units(latitude, longitude);
CREATE INDEX idx_units_status ON units(status);
CREATE INDEX idx_map_layer_preferences_user ON map_layer_preferences(user_id); 