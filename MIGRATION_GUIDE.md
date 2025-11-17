# Server Refactoring Migration Guide

## Overview

The monolithic `server-with-db.js` file has been split into organized TypeScript modules for better maintainability.

## New Structure

```
server.ts                          # Main server file
services/
  routes/
    index.ts                        # Route registry
    health.ts                       # Health check endpoints
    auth.ts                         # Authentication
    users.ts                        # User management
    roles.ts                        # Role management
    README.md                       # Route documentation
  utils/
    password.ts                     # Password hashing utilities
    database.ts                     # Database query helpers
    cache.ts                        # Assignment cache management
```

## Completed

✅ Core infrastructure:
- Main server file (`server.ts`)
- Route organization structure
- Shared utilities (password, database, cache)
- Health check routes
- Authentication routes
- User management routes
- Role management routes

## TODO: Extract Remaining Routes

The following routes still need to be extracted from `server-with-db.js`:

1. **Assignments** (`services/routes/assignments.ts`)
   - GET `/api/assignments`
   - GET `/api/assignments/:id`
   - GET `/api/assignments/:id/history`
   - GET `/api/units/:id/assignments`

2. **Units** (`services/routes/units.ts`)
   - GET `/api/units`
   - GET `/api/units/:id`
   - GET `/api/units/:id/unit-names`
   - GET `/api/units/:id/tracts`
   - GET `/api/units/:id/tracts/enhanced`
   - GET `/api/units/:id/notes`
   - GET `/api/units/:id/contacts`
   - GET `/api/units/:id/contacts/aggregated`
   - GET `/api/units/:id/sections`
   - GET `/api/units/:id/sections/enhanced`

3. **Sections** (`services/routes/sections.ts`)
   - GET `/api/sections`
   - GET `/api/sections/by-str`
   - GET `/api/sections/:id/contacts`
   - GET `/api/sections/:id/leads`

4. **Tracts** (`services/routes/tracts.ts`)
   - GET `/api/tracts`
   - GET `/api/tracts/:id`
   - GET `/api/tracts/:id/contacts`
   - PUT `/api/tracts/:id`
   - POST `/api/tracts`
   - DELETE `/api/tracts/:id`

5. **Leads** (`services/routes/leads.ts`)
   - GET `/api/leads`
   - GET `/api/leads/:id`
   - GET `/api/leads/:id/sections`
   - GET `/api/leads/:id/notes`

6. **Contacts** (`services/routes/contacts.ts`)
   - GET `/api/contacts`
   - GET `/api/contacts/:id`
   - GET `/api/contacts/:id/tract-ownership`
   - GET `/api/contacts/:id/units`
   - GET `/api/contacts/:id/leads`
   - GET `/api/contacts/:id/call-logs`
   - GET `/api/contacts/:id/documents`
   - GET `/api/contacts/:id/distress-signals`

7. **Data Import** (`services/routes/dataImport.ts`)
   - POST `/api/import/upload`
   - GET `/api/import/staging-tables`
   - GET `/api/import/production-tables`
   - GET `/api/import/staging-data/:tableName`
   - GET `/api/import/production-data/:tableName`
   - PUT `/api/import/staging-data/:tableName/:recordId`
   - DELETE `/api/import/staging-data/:tableName/:recordId`
   - POST `/api/import/approve`
   - DELETE `/api/import/staging-table/:tableName`
   - POST `/api/import/normalize-existing`
   - GET `/api/normalized/overview`
   - GET `/api/normalized/pricing-summary`
   - GET `/api/normalized/acreage-summary`
   - GET `/api/normalized/unit-summary`
   - GET `/api/normalized/recreate-acreage-schedule`
   - GET `/api/normalized/acreage-summary-stats`
   - GET `/api/normalized/acreage-status-breakdown`
   - GET `/api/normalized/acreage-county-breakdown`
   - GET `/api/test-acreage`
   - GET `/api/test-pricing-structure`

8. **Mapping** (`services/routes/mapping.ts`)
   - GET `/api/tract-spatial`
   - GET `/api/section-spatial`
   - GET `/api/map/layer-preferences`
   - PUT `/api/map/layer-preferences/:layerName`
   - GET `/api/map/nearby/wells`
   - GET `/api/map/nearby/permits`
   - GET `/api/map/nearby/rigs`
   - GET `/api/map/nearby/units`

9. **Pricing** (`services/routes/pricing.ts`)
   - GET `/api/pricing/oklahoma`
   - GET `/api/pricing/texas`

## Migration Steps

For each route group:

1. **Create the route file** following the pattern in `auth.ts` or `users.ts`:
   ```typescript
   import { Router } from 'express';
   import type { Pool } from 'mysql2/promise';
   import { executeQuery } from '../utils/database.js';

   export const createXxxRoutes = (dbPool: Pool | null) => {
     const router = Router();
     
     // Copy routes from server-with-db.js
     router.get('/api/...', async (req, res) => {
       // Route handler code
     });
     
     return router;
   };
   ```

2. **Update `services/routes/index.ts`**:
   - Import the new route handler
   - Register it in `createAllRoutes`

3. **Test the endpoints** to ensure they work

4. **Remove from `server-with-db.js`** once verified

## Running the Server

The server now runs TypeScript directly using `tsx`:

```bash
npm run server
# or
tsx server.ts
```

The Makefile has been updated to use the new server file.

## Old Files

- `server-with-db.js` - Keep until all routes are migrated
- `server.js` - Can be removed (not used in active code)

## Benefits

- ✅ Better organization and maintainability
- ✅ Easier to track changes (smaller, focused files)
- ✅ TypeScript for better type safety
- ✅ Easier to test individual route groups
- ✅ Clear separation of concerns

