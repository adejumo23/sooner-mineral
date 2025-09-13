# Normalized Database Table View

## Overview
This document provides a visual representation of the normalized database structure showing table relationships and key attributes.

## Table Structure Overview

### 1. LOCATION TABLES

| Table | Primary Key | Key Attributes | Foreign Keys |
|-------|-------------|----------------|--------------|
| **states** | `id` | `code`, `name` | - |
| **counties** | `id` | `name`, `fip_id` | `state_id` → states.id |
| **basins** | `id` | `name`, `description` | - |

### 2. PROPERTY/TRACT TABLES

| Table | Primary Key | Key Attributes | Foreign Keys |
|-------|-------------|----------------|--------------|
| **survey_companies** | `id` | `name`, `description` | - |
| **abstracts** | `id` | `abstract_number`, `description` | `county_id` → counties.id |
| **sections** | `id` | `section_number`, `township`, `range` | `county_id` → counties.id |
| **properties** | `id` | `unique_id`, `legal_description`, `gross_acres`, `is_state_land` | `county_id` → counties.id<br>`section_id` → sections.id<br>`abstract_id` → abstracts.id<br>`survey_company_id` → survey_companies.id |

### 3. OWNER/CONTACT TABLES

| Table | Primary Key | Key Attributes | Foreign Keys |
|-------|-------------|----------------|--------------|
| **owner_types** | `id` | `name`, `description` | - |
| **owners** | `id` | `legal_name`, `display_name`, `is_deceased` | `owner_type_id` → owner_types.id |
| **contact_information** | `id` | `contact_type`, `street_address`, `city`, `zip_code`, `phone_primary`, `email`, `notes` | `owner_id` → owners.id<br>`state_id` → states.id |

### 4. MINERAL INTEREST TABLES

| Table | Primary Key | Key Attributes | Foreign Keys |
|-------|-------------|----------------|--------------|
| **interest_types** | `id` | `name`, `description` | - |
| **mineral_interests** | `id` | `net_mineral_acres`, `royalty_percentage`, `net_revenue_interest`, `allocation_percentage`, `ownership_percentage`, `source_of_title` | `property_id` → properties.id<br>`owner_id` → owners.id<br>`interest_type_id` → interest_types.id |

### 5. FORMATION/PRICING TABLES

| Table | Primary Key | Key Attributes | Foreign Keys |
|-------|-------------|----------------|--------------|
| **formations** | `id` | `name`, `description`, `is_active` | - |
| **formation_pricing** | `id` | `price_per_acre`, `is_available` | `property_id` → properties.id<br>`formation_id` → formations.id |
| **property_pricing_summary** | `id` | `number_of_zones`, `output_price`, `price_per_boe`, `total_boe_per_acre`, `total_boe_per_anum`, `letter_rank`, `nra_price` | `property_id` → properties.id<br>`basin_id` → basins.id |

### 6. WELL/UNIT TABLES

| Table | Primary Key | Key Attributes | Foreign Keys |
|-------|-------------|----------------|--------------|
| **operators** | `id` | `name`, `description`, `is_active` | - |
| **well_status_types** | `id` | `name`, `description` | - |
| **wells** | `id` | `well_name`, `allocation_percentage`, `first_production_date`, `completion_date`, `spud_date` | `operator_id` → operators.id<br>`property_id` → properties.id<br>`well_status_id` → well_status_types.id |
| **unit_tiers** | `id` | `name`, `description`, `priority_order` | - |
| **unit_status_types** | `id` | `name`, `description` | - |
| **units** | `id` | `tops_price_3_16th`, `number_of_owners`, `internal_notes`, `occ_activity_notes` | `well_id` → wells.id<br>`tier_id` → unit_tiers.id<br>`unit_status_id` → unit_status_types.id |

### 7. ACQUISITION TRACKING TABLES

| Table | Primary Key | Key Attributes | Foreign Keys |
|-------|-------------|----------------|--------------|
| **acquisition_status_types** | `id` | `name`, `description`, `is_active` | - |
| **acquisition_activities** | `id` | `name`, `description` | - |
| **acquisition_tracking** | `id` | `activity_count`, `notes`, `last_contact_date`, `next_follow_up_date` | `mineral_interest_id` → mineral_interests.id<br>`buyer_id` → users.id<br>`acquisition_status_id` → acquisition_status_types.id<br>`activity_id` → acquisition_activities.id |

## Data Flow Relationships

### Core Data Flow
```
states → counties → properties → mineral_interests → acquisition_tracking
  ↓         ↓           ↓              ↓                    ↓
owners → contact_information    formations → formation_pricing
  ↓
wells → units
```

### Detailed Relationship Map

#### 1. Location Hierarchy
```
states (TX, OK, NM)
  ↓
counties (Upton, Howard, Kingfisher, etc.)
  ↓
sections (S-T-R data)
  ↓
properties (consolidated property info)
```

#### 2. Ownership Chain
```
owner_types (Individual, Trust, LLC, etc.)
  ↓
owners (legal entities)
  ↓
contact_information (addresses, phones, emails)
  ↓
mineral_interests (ownership details)
```

#### 3. Property Valuation
```
basins (Midland, Delaware, Anadarko)
  ↓
properties
  ↓
formations (Wolfcamp A, Spraberry, etc.)
  ↓
formation_pricing (price per acre by formation)
  ↓
property_pricing_summary (overall valuation)
```

#### 4. Operational Data
```
operators (CLR, Pioneer, Devon, etc.)
  ↓
wells (well names, status, dates)
  ↓
units (production units with tiers and status)
```

#### 5. Acquisition Workflow
```
mineral_interests
  ↓
acquisition_tracking
  ↓
acquisition_status_types (NEW, WORKING, DROPPED, etc.)
  ↓
acquisition_activities (LVM, NEGO, CLOSED, etc.)
```

## Sample Data Examples

### States Table
| id | code | name |
|----|------|------|
| state_tx | TX | Texas |
| state_ok | OK | Oklahoma |
| state_nm | NM | New Mexico |

### Counties Table
| id | state_id | name | fip_id |
|----|----------|------|--------|
| county_upton | state_tx | Upton | 461 |
| county_howard | state_tx | Howard | 227 |
| county_kingfisher | state_ok | Kingfisher | NULL |

### Properties Table
| id | county_id | section_id | unique_id | legal_description | gross_acres |
|----|-----------|------------|-----------|-------------------|-------------|
| prop_1 | county_upton | section_37_41_t4s | Upton-37-41T4S | Section 37, Block 41 T4S | 640.00 |
| prop_2 | county_howard | section_11_33_t2s | Howard-11-33T2S | Section 11, Block 33 T2S | 320.00 |

### Owners Table
| id | owner_type_id | legal_name | display_name | is_deceased |
|----|---------------|------------|--------------|-------------|
| owner_1 | owner_type_individual | John Smith | John Smith | FALSE |
| owner_2 | owner_type_trust | THE BARBARA J. FOREMAN REVOCABLE TRUST | Barbara Foreman Trust | FALSE |

### Mineral Interests Table
| id | property_id | owner_id | interest_type_id | net_mineral_acres | royalty_percentage |
|----|-------------|----------|------------------|-------------------|-------------------|
| mineral_1 | prop_1 | owner_1 | interest_type_minerals | 5.0000 | 0.2500 |
| mineral_2 | prop_1 | owner_2 | interest_type_minerals | 10.0000 | 0.1875 |

### Formations Table
| id | name | description | is_active |
|----|------|-------------|-----------|
| formation_wolfcamp_a | Wolfcamp A | Wolfcamp A formation | TRUE |
| formation_wolfcamp_b | Wolfcamp B | Wolfcamp B formation | TRUE |
| formation_upper_spraberry | Upper Spraberry | Upper Spraberry formation | TRUE |

### Formation Pricing Table
| id | property_id | formation_id | price_per_acre | is_available |
|----|-------------|--------------|----------------|--------------|
| fp_1 | prop_1 | formation_wolfcamp_a | 12000.00 | TRUE |
| fp_2 | prop_1 | formation_wolfcamp_b | 15000.00 | TRUE |

### Wells Table
| id | well_name | operator_id | property_id | well_status_id | allocation_percentage |
|----|-----------|-------------|-------------|----------------|----------------------|
| well_1 | CONDIT | op_clr | prop_1 | well_status_order | 0.4795 |
| well_2 | GALVIN | op_clr | prop_2 | well_status_permitted | 0.6250 |

### Units Table
| id | well_id | tier_id | unit_status_id | tops_price_3_16th | number_of_owners |
|----|---------|---------|----------------|------------------|------------------|
| unit_1 | well_1 | tier_aoi | unit_status_actively_working | 12000.00 | 3 |
| unit_2 | well_2 | tier_aoi_tier2 | unit_status_worked_follow_up | 11000.00 | 2 |

### Acquisition Tracking Table
| id | mineral_interest_id | buyer_id | acquisition_status_id | activity_id | notes |
|----|---------------------|----------|----------------------|-------------|-------|
| acq_1 | mineral_1 | u2 | acq_status_working | activity_lvm_txt_email | Contact made, waiting response |
| acq_2 | mineral_2 | u1 | acq_status_dropped | activity_dropped | Not interested in selling |

## Key Benefits of This Structure

1. **No Data Redundancy**: Each piece of information stored once
2. **Referential Integrity**: Foreign keys ensure data consistency
3. **Easy Updates**: Change county name in one place, updates everywhere
4. **Efficient Queries**: Join only the tables you need
5. **Scalable**: Easy to add new formations, operators, or status types
6. **Maintainable**: Clear separation of concerns

## Query Examples

### Find all mineral interests in Upton County
```sql
SELECT mi.*, o.legal_name, p.legal_description
FROM mineral_interests mi
JOIN owners o ON mi.owner_id = o.id
JOIN properties p ON mi.property_id = p.id
JOIN counties c ON p.county_id = c.id
WHERE c.name = 'Upton';
```

### Get Wolfcamp A pricing for all properties
```sql
SELECT p.unique_id, fp.price_per_acre, f.name as formation
FROM properties p
JOIN formation_pricing fp ON p.id = fp.property_id
JOIN formations f ON fp.formation_id = f.id
WHERE f.name = 'Wolfcamp A' AND fp.is_available = TRUE;
```

### Track acquisition progress by buyer
```sql
SELECT u.name as buyer, ast.name as status, COUNT(*) as count
FROM acquisition_tracking at
JOIN users u ON at.buyer_id = u.id
JOIN acquisition_status_types ast ON at.acquisition_status_id = ast.id
GROUP BY u.name, ast.name;
```

This normalized structure provides a clean, efficient, and maintainable database design that eliminates redundancy while preserving all the functionality of the original system.
