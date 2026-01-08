# Well Data Import Guide

## Overview
This guide explains how to import real Oklahoma oil and gas well data into the mapping module.

## Quick Start

### Option 1: Use the Import Script (Recommended)

1. **Download the OCC CSV file**:
   - Visit: https://oklahoma.gov/occ/divisions/oil-gas/oil-gas-data.html
   - Find the "RBDMS Well Data" section
   - Click the CSV download link
   - Save the file (e.g., `occ-well-data.csv`)

2. **Run the import script**:
   ```bash
   npm run import:wells ./occ-well-data.csv
   ```
   
   Or if you saved it in a different location:
   ```bash
   npm run import:wells "C:\path\to\occ-well-data.csv"
   ```

3. **Wait for completion** - The script will:
   - Create database tables (`producing_wells`, `operators`, `well_statuses`)
   - Parse the CSV file
   - Import all wells with valid coordinates
   - Show progress and final count

4. **View wells on the map**:
   - Open the Mapping module
   - Wells will automatically appear as colored markers
   - Toggle wells visibility using the legend

### Option 2: Manual Import via Data Import Module

1. Download the OCC CSV file (same as above)
2. Go to the Data Import module in the application
3. Upload the CSV file
4. Map columns to the `producing_wells` table structure
5. Approve the import

## Public Data Sources

### Oklahoma Corporation Commission (OCC)
The OCC provides free, public well data that is updated nightly:

**Website**: https://oklahoma.gov/occ/divisions/oil-gas/oil-gas-data.html

### Available Data Files

1. **RBDMS Well Data (CSV)**
   - Updated nightly
   - Comprehensive well information
   - Includes API numbers, locations, operators, status, etc.
   - Download: https://oklahoma.gov/occ/divisions/oil-gas/oil-gas-data.html

2. **RBDMS Wells Shapefile**
   - Updated nightly
   - GIS format with spatial coordinates
   - Perfect for mapping applications
   - Download: https://oklahoma.gov/occ/divisions/oil-gas/oil-gas-data.html

3. **Well Data Finder (Interactive)**
   - Search by well name, API number, county, legal location (section/township/range), operator
   - Access: https://oklahoma.gov/occ/divisions/oil-gas/database-search-imaged-documents/occ-well-data-finder.html

## Database Schema

The import script creates these tables:

### `operators`
- `id` - Unique operator identifier
- `operator_name` - Operator company name
- `operator_number` - OCC operator number (optional)

### `well_statuses`
- `id` - Unique status identifier
- `status_name` - Status name (e.g., "Producing", "Drilling", "Shut-in", "Abandoned")
- `description` - Status description (optional)

### `producing_wells`
- `id` - Unique well identifier
- `api_number` - API number (e.g., "35-123-45678")
- `well_name` - Well name
- `operator_id` - Reference to operators table
- `latitude` - Decimal latitude (required for mapping)
- `longitude` - Decimal longitude (required for mapping)
- `section_str` - PLSS section string (e.g., "33-01N-05W")
- `well_status_id` - Reference to well_statuses table
- `spud_date` - Date well was spudded
- `completion_date` - Date well was completed
- `total_depth` - Total depth in feet

## Column Mapping from OCC CSV

The import script automatically maps common OCC CSV columns:

| OCC Column | Database Column | Notes |
|------------|----------------|-------|
| `API_NUMBER` or `API` | `api_number` | Well API number |
| `WELL_NAME` or `WELL` | `well_name` | Well name |
| `OPERATOR_NAME` or `OPERATOR` | `operator_id` | Creates operator record |
| `LATITUDE` or `LAT` | `latitude` | Required for mapping |
| `LONGITUDE` or `LON` or `LNG` | `longitude` | Required for mapping |
| `SECTION_STR` or `LEGAL_LOCATION` | `section_str` | PLSS section string |
| `SECTION`, `TOWNSHIP`, `RANGE` | `section_str` | Combined into PLSS format |
| `WELL_STATUS` or `STATUS` | `well_status_id` | Creates status record |
| `SPUD_DATE` or `SPUD` | `spud_date` | Date well was spudded |
| `COMPLETION_DATE` or `COMPLETION` | `completion_date` | Date well was completed |
| `TOTAL_DEPTH` or `DEPTH` | `total_depth` | Total depth in feet |

## Import Script Features

The `import-occ-wells.ts` script:

- ✅ **Automatic table creation** - Creates all necessary tables if they don't exist
- ✅ **Smart column mapping** - Handles various OCC CSV column name variations
- ✅ **Data validation** - Skips wells without valid coordinates
- ✅ **Batch processing** - Imports in batches of 1000 for performance
- ✅ **Duplicate handling** - Uses `ON DUPLICATE KEY UPDATE` to handle duplicates
- ✅ **Progress tracking** - Shows progress during import
- ✅ **Error handling** - Continues processing even if individual records fail

## Troubleshooting

### Script fails to connect to database
- Check your `.env` file has correct database credentials
- Ensure MySQL is running
- Verify database name exists

### No wells appear on map
- Check that wells have valid latitude/longitude (not 0,0)
- Verify wells are within Oklahoma bounds (33-37°N, -103 to -94°W)
- Check browser console for errors
- Ensure wells layer is visible in legend

### Import is slow
- Large CSV files (100K+ wells) may take 10-30 minutes
- The script processes in batches - be patient
- Check database connection pool settings

### Missing columns in CSV
- The script handles common column name variations
- If your CSV uses different column names, you may need to modify the script
- Check the OCC data dictionary for column names

## Current Implementation

### Mock Well Generation
If the `producing_wells` table doesn't exist or is empty, the system automatically generates mock wells based on:
- Sections that exist in your `prod_acreage_schedule` table
- PLSS coordinates to place wells within sections
- Realistic well data (operators, statuses, depths, dates)

This allows you to see wells on the map immediately while you work on importing real data.

### Real Data Import Process

Once you import real OCC data:
- Mock wells are automatically replaced with real data
- Wells are color-coded by status:
  - 🟢 **Green** = Producing
  - 🟠 **Orange** = Drilling
  - 🔴 **Red** = Shut-in
  - ⚫ **Gray** = Abandoned
- Click on wells to see detailed information in popups

## Additional Resources

- **OCC Oil & Gas Data Files**: https://oklahoma.gov/occ/divisions/oil-gas/oil-gas-data.html
- **OCC GIS Data Portal**: https://oklahoma.gov/occ/divisions/oil-gas/gis-data-and-maps.html
- **Oklahoma Geological Survey**: https://www.ou.edu/ogs/data/oil-gas
- **RBDMS WellFinder Mobile App**: Available on App Store and Google Play (free)

## Notes

- OCC data is updated nightly, so you may want to set up a periodic import process
- The CSV files can be very large (100MB+), so consider filtering by county or date range if needed
- Shapefiles are better for GIS applications but require conversion for database import
- The mock well generation is temporary - replace with real data when available
