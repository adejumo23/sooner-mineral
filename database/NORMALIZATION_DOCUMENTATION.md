# Database Normalization Documentation

## Overview

This document describes the normalization of the Sooner Mineral database from the original denormalized structure to Third Normal Form (3NF). The normalization process eliminates data redundancy, ensures data integrity, and improves database performance and maintainability.

## Original Tables Analyzed

1. **`acreage`** - Mineral rights ownership and contact information
2. **`pricing`** - Formation pricing and property valuation data  
3. **`unit_summary`** - Well and unit operational data

## Normalization Process

### Problems with Original Structure

1. **Data Redundancy**: Repeated county, state, operator, and formation data
2. **Update Anomalies**: Changes required in multiple places
3. **Insert Anomalies**: Difficult to add new data without related records
4. **Delete Anomalies**: Risk of losing related data when deleting records
5. **Storage Inefficiency**: Wasted space due to repeated data
6. **Data Inconsistency**: Risk of conflicting information

### Normalized Structure (3NF)

The database has been restructured into the following normalized tables:

## 1. Location Tables

### `states`
- **Purpose**: Master list of states
- **Key**: `id` (VARCHAR(36))
- **Attributes**: `code`, `name`

### `counties`
- **Purpose**: Master list of counties with state relationships
- **Key**: `id` (VARCHAR(36))
- **Foreign Keys**: `state_id` → `states.id`
- **Attributes**: `name`, `fip_id`

### `basins`
- **Purpose**: Geological basins for pricing
- **Key**: `id` (VARCHAR(36))
- **Attributes**: `name`, `description`

## 2. Property/Tract Tables

### `survey_companies`
- **Purpose**: Survey company master data
- **Key**: `id` (VARCHAR(36))
- **Attributes**: `name`, `description`

### `abstracts`
- **Purpose**: Abstract numbers by county
- **Key**: `id` (VARCHAR(36))
- **Foreign Keys**: `county_id` → `counties.id`
- **Attributes**: `abstract_number`, `description`

### `sections`
- **Purpose**: Section/Township/Range data
- **Key**: `id` (VARCHAR(36))
- **Foreign Keys**: `county_id` → `counties.id`
- **Attributes**: `section_number`, `township`, `range`

### `properties`
- **Purpose**: Consolidated property information
- **Key**: `id` (VARCHAR(36))
- **Foreign Keys**: 
  - `county_id` → `counties.id`
  - `section_id` → `sections.id`
  - `abstract_id` → `abstracts.id`
  - `survey_company_id` → `survey_companies.id`
- **Attributes**: `unique_id`, `legal_description`, `gross_acres`, `is_state_land`

## 3. Owner/Contact Tables

### `owner_types`
- **Purpose**: Types of ownership entities
- **Key**: `id` (VARCHAR(36))
- **Attributes**: `name`, `description`

### `owners`
- **Purpose**: Owner master data
- **Key**: `id` (VARCHAR(36))
- **Foreign Keys**: `owner_type_id` → `owner_types.id`
- **Attributes**: `legal_name`, `display_name`, `is_deceased`

### `contact_information`
- **Purpose**: Contact details for owners
- **Key**: `id` (VARCHAR(36))
- **Foreign Keys**: 
  - `owner_id` → `owners.id`
  - `state_id` → `states.id`
- **Attributes**: `contact_type`, `street_address`, `city`, `zip_code`, `phone_primary`, `phone_secondary`, `email`, `notes`

## 4. Mineral Interest Tables

### `interest_types`
- **Purpose**: Types of mineral interests
- **Key**: `id` (VARCHAR(36))
- **Attributes**: `name`, `description`

### `mineral_interests`
- **Purpose**: Mineral ownership details
- **Key**: `id` (VARCHAR(36))
- **Foreign Keys**: 
  - `property_id` → `properties.id`
  - `owner_id` → `owners.id`
  - `interest_type_id` → `interest_types.id`
- **Attributes**: `net_mineral_acres`, `royalty_percentage`, `net_revenue_interest`, `allocation_percentage`, `ownership_percentage`, `source_of_title`

## 5. Formation/Pricing Tables

### `formations`
- **Purpose**: Geological formations
- **Key**: `id` (VARCHAR(36))
- **Attributes**: `name`, `description`, `is_active`

### `formation_pricing`
- **Purpose**: Pricing by formation and property
- **Key**: `id` (VARCHAR(36))
- **Foreign Keys**: 
  - `property_id` → `properties.id`
  - `formation_id` → `formations.id`
- **Attributes**: `price_per_acre`, `is_available`

### `property_pricing_summary`
- **Purpose**: Overall pricing summary for properties
- **Key**: `id` (VARCHAR(36))
- **Foreign Keys**: 
  - `property_id` → `properties.id`
  - `basin_id` → `basins.id`
- **Attributes**: `number_of_zones`, `output_price`, `price_per_boe`, `total_boe_per_acre`, `total_boe_per_anum`, `letter_rank`, `nra_price`

## 6. Well/Unit Tables

### `operators`
- **Purpose**: Oil and gas operators
- **Key**: `id` (VARCHAR(36))
- **Attributes**: `name`, `description`, `is_active`

### `well_status_types`
- **Purpose**: Well operational statuses
- **Key**: `id` (VARCHAR(36))
- **Attributes**: `name`, `description`

### `wells`
- **Purpose**: Well information
- **Key**: `id` (VARCHAR(36))
- **Foreign Keys**: 
  - `operator_id` → `operators.id`
  - `property_id` → `properties.id`
  - `well_status_id` → `well_status_types.id`
- **Attributes**: `well_name`, `allocation_percentage`, `first_production_date`, `completion_date`, `spud_date`

### `unit_tiers`
- **Purpose**: Unit priority tiers
- **Key**: `id` (VARCHAR(36))
- **Attributes**: `name`, `description`, `priority_order`

### `unit_status_types`
- **Purpose**: Unit operational statuses
- **Key**: `id` (VARCHAR(36))
- **Attributes**: `name`, `description`

### `units`
- **Purpose**: Production units
- **Key**: `id` (VARCHAR(36))
- **Foreign Keys**: 
  - `well_id` → `wells.id`
  - `tier_id` → `unit_tiers.id`
  - `unit_status_id` → `unit_status_types.id`
- **Attributes**: `tops_price_3_16th`, `number_of_owners`, `internal_notes`, `occ_activity_notes`

## 7. Acquisition Tracking Tables

### `acquisition_status_types`
- **Purpose**: Acquisition workflow statuses
- **Key**: `id` (VARCHAR(36))
- **Attributes**: `name`, `description`, `is_active`

### `acquisition_activities`
- **Purpose**: Acquisition activities
- **Key**: `id` (VARCHAR(36))
- **Attributes**: `name`, `description`

### `acquisition_tracking`
- **Purpose**: Track acquisition progress
- **Key**: `id` (VARCHAR(36))
- **Foreign Keys**: 
  - `mineral_interest_id` → `mineral_interests.id`
  - `buyer_id` → `users.id`
  - `acquisition_status_id` → `acquisition_status_types.id`
  - `activity_id` → `acquisition_activities.id`
- **Attributes**: `activity_count`, `notes`, `last_contact_date`, `next_follow_up_date`

## Benefits of Normalization

### 1. Data Integrity
- **Referential Integrity**: Foreign key constraints ensure data consistency
- **Domain Integrity**: Proper data types and constraints
- **Entity Integrity**: Primary keys ensure unique identification

### 2. Eliminated Redundancy
- **No Duplicate Data**: Each piece of information stored once
- **Reduced Storage**: Significant space savings
- **Consistent Updates**: Changes made in one place

### 3. Improved Performance
- **Optimized Indexes**: Strategic indexing for common queries
- **Reduced I/O**: Smaller tables mean faster queries
- **Better Query Plans**: Database optimizer can work more efficiently

### 4. Enhanced Maintainability
- **Modular Design**: Clear separation of concerns
- **Easy Updates**: Changes isolated to specific tables
- **Scalable Structure**: Easy to add new features

### 5. Data Consistency
- **Single Source of Truth**: Each entity has one authoritative record
- **Validation Rules**: Constraints prevent invalid data
- **Audit Trail**: Clear relationships for tracking changes

## Migration Process

The migration script (`migration_to_normalized.sql`) transforms existing data by:

1. **Extracting Master Data**: Creating lookup tables from repeated values
2. **Establishing Relationships**: Building foreign key connections
3. **Preserving Data**: Ensuring no information is lost
4. **Maintaining References**: Keeping track of original data relationships

## Query Examples

### Before Normalization (Complex)
```sql
SELECT a.OWNER, a.COUNTY, a.`S-T-R`, a.NMA, p.`Wolfcamp A`
FROM acreage a
LEFT JOIN pricing p ON a.COUNTY = p.County
WHERE a.STATUS = 'WORKING'
```

### After Normalization (Clean)
```sql
SELECT o.legal_name, c.name as county, s.section_number, mi.net_mineral_acres, fp.price_per_acre
FROM mineral_interests mi
JOIN owners o ON mi.owner_id = o.id
JOIN properties pr ON mi.property_id = pr.id
JOIN counties c ON pr.county_id = c.id
JOIN sections s ON pr.section_id = s.id
JOIN formation_pricing fp ON pr.id = fp.property_id
JOIN formations f ON fp.formation_id = f.id
JOIN acquisition_tracking at ON mi.id = at.mineral_interest_id
JOIN acquisition_status_types ast ON at.acquisition_status_id = ast.id
WHERE ast.name = 'WORKING' AND f.name = 'Wolfcamp A'
```

## Recently Normalized Tables (December 2024)

The following production tables have been successfully normalized and processed into the 3NF structure:

### 1. **prod_texas_pricing**
- **Source**: Texas pricing data with formation pricing information
- **Normalized To**: 
  - `counties` (Texas counties)
  - `basins` (Midland, Delaware, etc.)
  - `survey_companies` (T&P RR CO, HE&WT RR CO, etc.)
  - `formations` (Wolfcamp A, Spraberry, Bone Spring, etc.)
  - `properties` (consolidated property information)
  - `formation_pricing` (price per acre by formation)

### 2. **prod_oklahoma_pricing**
- **Source**: Oklahoma pricing data with formation pricing information
- **Normalized To**: 
  - `counties` (Oklahoma counties like Kingfisher)
  - `basins` (Anadarko Basin)
  - `survey_companies` (Oklahoma survey companies)
  - `formations` (Oklahoma-specific formations)
  - `properties` (Oklahoma property information)
  - `formation_pricing` (Oklahoma pricing data)

### 3. **prod_acreage_schedule**
- **Source**: Mineral rights ownership and acquisition tracking data
- **Normalized To**:
  - `counties` (Texas and Oklahoma counties)
  - `sections` (Section-Township-Range data)
  - `properties` (property information from S-T-R data)
  - `owners` (mineral rights owners)
  - `mineral_interests` (ownership details and acreage)
  - `acquisition_status_types` (DROPPED, WORKING, etc.)
  - `acquisition_activities` (acquisition activities)

### 4. **prod_unit_summary**
- **Source**: Well and unit operational data
- **Normalized To**:
  - `operators` (CLR, Pioneer, Devon, EOG, etc.)
  - `well_status_types` (ORDER, PERMITTED, DRILLING, DUC, etc.)
  - `unit_tiers` (AOI, RAN/POT, etc.)
  - `unit_status_types` (ACTIVELY WORKING, WORKED/FOLLOW UP, etc.)
  - `wells` (well information with allocation percentages)
  - `units` (production units with pricing and owner counts)
  - `properties` (well properties)

### Normalization Process

The normalization was performed using an automated process that:

1. **Analyzed** each production table structure
2. **Extracted** unique values for lookup tables
3. **Created** normalized records with proper relationships
4. **Mapped** data from denormalized to normalized structure
5. **Preserved** all original data while eliminating redundancy

### Data Quality Improvements

After normalization:
- **Eliminated** data redundancy across all tables
- **Ensured** referential integrity through foreign keys
- **Standardized** naming conventions and data formats
- **Created** proper indexes for optimal query performance
- **Established** single source of truth for all reference data

## Conclusion

The normalized database structure provides a solid foundation for the Sooner Mineral application with:

- **Data Integrity**: Robust constraints and relationships
- **Performance**: Optimized for common query patterns
- **Maintainability**: Clear, modular design
- **Scalability**: Easy to extend with new features
- **Consistency**: Single source of truth for all data

This structure eliminates the problems of the original denormalized tables while preserving all functionality and improving overall system performance and reliability.
