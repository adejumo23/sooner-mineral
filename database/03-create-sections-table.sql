-- Create sections table
CREATE TABLE IF NOT EXISTS sections (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  section_name VARCHAR(255) NOT NULL,
  state VARCHAR(2) NOT NULL,
  county VARCHAR(100) NOT NULL,
  section VARCHAR(10),
  township VARCHAR(10),
  range VARCHAR(10),
  str VARCHAR(50),
  gross_acres DECIMAL(10,2),
  net_mineral_acres DECIMAL(10,2),
  title_status VARCHAR(50),
  legal_description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert some sample data
INSERT INTO sections (id, section_name, state, county, section, township, range, str, gross_acres, net_mineral_acres, title_status, legal_description) VALUES
('s1', '10-08S-02E', 'OK', 'Caddo County', '10', '08S', '02E', '10-08S-02E', 640.00, 320.00, 'WORKING', 'Section 10, Township 08 South, Range 02 East'),
('s2', '15-09N-03W', 'OK', 'Grady County', '15', '09N', '03W', '15-09N-03W', 640.00, 480.00, 'WORKING', 'Section 15, Township 09 North, Range 03 West'),
('s3', 'data yet to be provided', 'OK', 'Harris County', '22', '12S', '05E', '22-12S-05E', 640.00, 640.00, 'NEW', 'Section 22, Township 12 South, Range 05 East'),
('s4', '25-07N-01W', 'OK', 'Oklahoma County', '25', '07N', '01W', '25-07N-01W', 640.00, 400.00, 'WORKING', 'Section 25, Township 07 North, Range 01 West'),
('s5', 'data yet to be provided', 'OK', 'Dallas County', '30', '14S', '08W', '30-14S-08W', 640.00, 640.00, 'NEW', 'Section 30, Township 14 South, Range 08 West');





