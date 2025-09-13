# Implementation Guide: Normalized Database

## Overview
This guide will help you implement the normalized database structure in your Sooner Mineral application. The normalized structure eliminates data redundancy and provides better data integrity.

## Step 1: Set Up the Normalized Database

### Option A: Using Docker (Recommended)
1. **Update your `docker-compose.yml`** to include the normalized database setup:
```yaml
services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: password
      MYSQL_DATABASE: sooner_mineral_db
    ports:
      - "3306:3306"
    volumes:
      - ./database:/docker-entrypoint-initdb.d
    command: --init-file /docker-entrypoint-initdb.d/setup_normalized_db.sql
```

2. **Run the database setup**:
```bash
docker-compose down
docker-compose up -d mysql
```

### Option B: Manual Setup
1. **Create the database**:
```sql
CREATE DATABASE sooner_mineral_db;
USE sooner_mineral_db;
```

2. **Run the setup script**:
```bash
mysql -u root -p sooner_mineral_db < database/setup_normalized_db.sql
```

## Step 2: Update Your Application

### 1. Install Database Dependencies
```bash
npm install mysql2
npm install @types/mysql2 --save-dev
```

### 2. Create Database Connection
Create `services/database.ts`:
```typescript
import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'sooner_mineral_db'
};

export const db = mysql.createPool(dbConfig);
```

### 3. Update Environment Variables
Create `.env` file:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password
DB_NAME=sooner_mineral_db
```

### 4. Replace Mock API with Real Database Queries
Update `services/api.ts` to use the normalized database:

```typescript
import { db } from './database';
import { fetchTracts, fetchTract, fetchTractOwners } from './normalizedApi';

// Replace the mock functions with real database calls
export const fetchTracts = async (filters?: any): Promise<any[]> => {
  return await fetchTracts(filters);
};

export const fetchTract = async (id: string): Promise<any> => {
  return await fetchTract(id);
};

export const fetchTractOwners = async (tractId: string): Promise<any[]> => {
  return await fetchTractOwners(tractId);
};
```

## Step 3: Update Components

### 1. Update Tract Components
The tract components should work with the new data structure. The normalized API returns data in the same format as the mock data.

### 2. Add New Features
You can now add new features that weren't possible with the denormalized structure:

#### Tract Owners Tab
```typescript
// In your tract detail component
const [owners, setOwners] = useState([]);

useEffect(() => {
  const loadOwners = async () => {
    const ownersData = await fetchTractOwners(tractId);
    setOwners(ownersData);
  };
  loadOwners();
}, [tractId]);
```

#### Formation Pricing Tab
```typescript
// In your tract detail component
const [pricing, setPricing] = useState([]);

useEffect(() => {
  const loadPricing = async () => {
    const pricingData = await fetchTractPricing(tractId);
    setPricing(pricingData);
  };
  loadPricing();
}, [tractId]);
```

## Step 4: Test the Implementation

### 1. Test Database Connection
```typescript
// Test in your application
const testConnection = async () => {
  try {
    const [rows] = await db.execute('SELECT COUNT(*) as count FROM properties');
    console.log('Database connected successfully:', rows);
  } catch (error) {
    console.error('Database connection failed:', error);
  }
};
```

### 2. Test API Endpoints
```typescript
// Test the normalized API
const testAPI = async () => {
  try {
    const tracts = await fetchTracts();
    console.log('Tracts loaded:', tracts);
    
    const tract = await fetchTract('prop_1');
    console.log('Tract details:', tract);
    
    const owners = await fetchTractOwners('prop_1');
    console.log('Tract owners:', owners);
  } catch (error) {
    console.error('API test failed:', error);
  }
};
```

## Step 5: Migrate Existing Data

### 1. Export Current Data
If you have existing data in the old format, export it first:
```sql
-- Export from old tables
SELECT * FROM acreage INTO OUTFILE '/tmp/acreage_export.csv';
SELECT * FROM pricing INTO OUTFILE '/tmp/pricing_export.csv';
SELECT * FROM unit_summary INTO OUTFILE '/tmp/unit_summary_export.csv';
```

### 2. Run Migration Script
Use the migration script to transform your data:
```bash
mysql -u root -p sooner_mineral_db < database/migration_to_normalized.sql
```

## Step 6: Verify Everything Works

### 1. Check Data Integrity
```sql
-- Verify relationships
SELECT 
  p.id as property_id,
  s.code as state,
  c.name as county,
  COUNT(mi.id) as mineral_interests,
  COUNT(w.id) as wells
FROM properties p
JOIN counties c ON p.county_id = c.id
JOIN states s ON c.state_id = s.id
LEFT JOIN mineral_interests mi ON p.id = mi.property_id
LEFT JOIN wells w ON p.id = w.property_id
GROUP BY p.id, s.code, c.name;
```

### 2. Test Application Features
- [ ] Tract listing loads correctly
- [ ] Tract details show all information
- [ ] Tract owners are displayed
- [ ] Formation pricing is shown
- [ ] Search functionality works
- [ ] Dashboard statistics are accurate

## Benefits You'll See

### 1. **Data Consistency**
- No duplicate county/state data
- Single source of truth for all entities
- Referential integrity maintained

### 2. **Better Performance**
- Optimized queries with proper indexing
- Reduced data redundancy
- Faster page loads

### 3. **Enhanced Features**
- Rich owner information with contact details
- Formation-specific pricing
- Detailed acquisition tracking
- Comprehensive well data

### 4. **Easier Maintenance**
- Changes made in one place
- Clear data relationships
- Better error handling

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check MySQL is running
   - Verify credentials in `.env`
   - Ensure database exists

2. **Queries Return Empty Results**
   - Check if data was migrated correctly
   - Verify table relationships
   - Run the setup script again

3. **Application Errors**
   - Check console for error messages
   - Verify API functions are imported correctly
   - Test database queries directly

### Getting Help

If you encounter issues:
1. Check the database logs
2. Verify the normalized schema is correct
3. Test individual queries
4. Check the application console for errors

## Next Steps

Once the normalized database is working:
1. Add more sophisticated queries
2. Implement caching for better performance
3. Add data validation
4. Create backup procedures
5. Add monitoring and logging

The normalized structure provides a solid foundation for future enhancements and ensures your data remains consistent and reliable.
