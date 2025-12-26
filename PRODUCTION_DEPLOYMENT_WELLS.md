# Production Deployment Guide - Well Data

## Overview
This guide covers deploying the well data feature to production, including the 441,033 wells that were imported locally.

## Pre-Deployment Checklist

### 1. Database Schema
The `producing_wells` table structure must exist in production. The import script will create it if it doesn't exist, but verify the schema matches:

```sql
CREATE TABLE IF NOT EXISTS producing_wells (
  id VARCHAR(255) PRIMARY KEY,
  api VARCHAR(50),
  well_name VARCHAR(255),
  well_num VARCHAR(50),
  operator VARCHAR(255),
  wellstatus VARCHAR(100),
  welltype VARCHAR(100),
  symbol_class VARCHAR(100),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  county VARCHAR(100),
  section VARCHAR(10),
  township VARCHAR(20),
  `range` VARCHAR(20),
  section_str VARCHAR(50),
  status VARCHAR(50) DEFAULT 'Producing',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_lat_lon (latitude, longitude),
  INDEX idx_api (api),
  INDEX idx_section_str (section_str),
  INDEX idx_county (county)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 2. Well Data Import

**Option A: Import via Script (Recommended for Production)**

1. **Download the latest OCC CSV file**:
   ```bash
   # The CSV file should be downloaded from:
   # https://oklahoma.gov/occ/divisions/oil-gas/oil-gas-data.html
   # Save it as: rbdms-wells.csv
   ```

2. **Run the import script on production server**:
   ```bash
   # SSH into production server
   cd /path/to/application
   npm run import:wells /path/to/rbdms-wells.csv
   ```

3. **Verify the import**:
   ```bash
   # Check record count
   npx tsx scripts/check-wells-table.ts
   ```

**Option B: Import via Database Dump**

If you've already imported the data locally, you can create a dump and restore it:

1. **Create a dump of the producing_wells table**:
   ```bash
   mysqldump -u [user] -p [database] producing_wells > producing_wells_dump.sql
   ```

2. **Restore on production**:
   ```bash
   mysql -u [user] -p [database] < producing_wells_dump.sql
   ```

**Option C: Include in Full Database Dump (Automatic)**

The `scripts/create-database-dump.js` script **automatically includes ALL tables**, including `producing_wells`. Simply run:

```bash
# Create dump (includes producing_wells if it exists)
node scripts/create-database-dump.js

# This will create: database/complete-database-dump.sql
# The dump includes ALL tables, so producing_wells will be included
```

Then restore on production:
```bash
mysql -u [user] -p [database] < database/complete-database-dump.sql
```

### 3. Code Changes

All code changes are backward compatible:
- ✅ API endpoints work with or without well data
- ✅ Frontend handles empty well arrays gracefully
- ✅ Table structure is created automatically if missing

### 4. Environment Variables

Ensure production `.env` has correct database credentials:
```env
DB_HOST=your_production_host
DB_PORT=3306
MYSQL_USER=your_production_user
MYSQL_PASSWORD=your_production_password
MYSQL_DATABASE=your_production_database
```

### 5. Performance Considerations

With 441,033 wells:
- **Query Performance**: Indexes on `latitude`, `longitude`, `section_str`, and `api` are critical
- **API Limits**: Current limit is 5,000 wells per request (sufficient for most map views)
- **Memory**: Large result sets may require server memory tuning

### 6. Verification Steps

After deployment:

1. **Check table exists**:
   ```sql
   SELECT COUNT(*) FROM producing_wells;
   -- Should return 441,033 (or current count)
   ```

2. **Test API endpoint**:
   ```bash
   curl "https://your-production-domain.com/api/map/wells/by-sections?minLat=33.0&maxLat=37.0&minLon=-103.0&maxLon=-94.0"
   ```

3. **Test well type filter**:
   ```bash
   curl "https://your-production-domain.com/api/map/wells/by-sections?minLat=33.0&maxLat=37.0&minLon=-103.0&maxLon=-94.0&wellTypes=OIL"
   ```

4. **Check mapping module**:
   - Open mapping module in production
   - Verify wells appear on map
   - Test well type filter
   - Verify wells are color-coded by status

## Deployment Steps

### Step 1: Create Database Dump (Local/Staging)
```bash
# This will include ALL tables, including producing_wells with 441,033 wells
node scripts/create-database-dump.js

# Output: database/complete-database-dump.sql
# This file will be large (likely 100MB+ with well data)
```

### Step 2: Deploy Code Changes
```bash
# Standard deployment process
git pull origin main
npm install
npm run build
# Restart server
```

### Step 3: Deploy Database (Choose One Method)

**Method A: Full Database Dump (Recommended)**
```bash
# Deploy complete dump (includes producing_wells)
node scripts/deploy-to-production.js database/complete-database-dump.sql

# OR manually:
mysql -u [user] -p [database] < database/complete-database-dump.sql
```

**Method B: Import Well Data Separately**
```bash
# If you only want to import wells (not full dump)
npm run import:wells /path/to/rbdms-wells.csv
```

### Step 4: Verify
- Check database record count:
  ```sql
  SELECT COUNT(*) FROM producing_wells; -- Should be ~441,033
  ```
- Test API endpoints
- Test mapping module UI
- Verify well type filter works

## Rollback Plan

If issues occur:

1. **Remove well data** (if causing problems):
   ```sql
   DROP TABLE IF EXISTS producing_wells;
   ```

2. **Code will continue to work** - API returns empty array if table doesn't exist

3. **Frontend handles gracefully** - Shows "No wells found" message

## Data Updates

OCC data is updated nightly. Consider:

1. **Scheduled Imports**: Set up a cron job to import new data periodically
2. **Incremental Updates**: Modify import script to only import new/updated wells
3. **Manual Updates**: Run import script when needed

## Notes

- The well data is **read-only** in the application (no editing)
- Well data doesn't affect other modules
- If well data is missing, the mapping module still works (just no wells displayed)
- The import script is idempotent (safe to run multiple times)

