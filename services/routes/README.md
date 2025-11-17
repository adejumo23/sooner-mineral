# API Routes Structure

This directory contains all API route handlers, organized by domain.

## Structure

Each route file exports a function that creates and returns an Express Router:

```typescript
import { Router } from 'express';
import type { Pool } from 'mysql2/promise';
import { executeQuery } from '../utils/database.js';

export const createXxxRoutes = (dbPool: Pool | null) => {
  const router = Router();
  
  // Define routes
  router.get('/api/...', async (req, res) => {
    // Route handler
  });
  
  return router;
};
```

## Route Files

- `health.ts` - Health check and debug endpoints
- `auth.ts` - Authentication (login, logout)
- `users.ts` - User management (CRUD)
- `roles.ts` - Role management
- `assignments.ts` - Assignment management (TODO)
- `units.ts` - Unit management (TODO)
- `sections.ts` - Section management (TODO)
- `tracts.ts` - Tract management (TODO)
- `leads.ts` - Lead management (TODO)
- `contacts.ts` - Contact management (TODO)
- `dataImport.ts` - Data import endpoints (TODO)
- `mapping.ts` - Mapping and spatial data (TODO)
- `pricing.ts` - Pricing data (TODO)

## Migration Status

✅ Completed:
- Health check routes
- Authentication routes
- User management routes
- Role management routes

⏳ TODO:
- Extract remaining routes from `server-with-db.js`
- Update route index to import all routes
- Test all endpoints

## Migration Instructions

1. Identify routes in `server-with-db.js` by endpoint pattern
2. Create a new route file following the pattern in `auth.ts` or `users.ts`
3. Extract route handlers to the new file
4. Import and register in `index.ts`
5. Test the endpoints
6. Remove from `server-with-db.js` once verified

