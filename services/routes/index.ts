import { Router } from 'express';
import type { Pool } from 'mysql2/promise';
import type { Multer } from 'multer';
import { DataImportService } from '../dataImportService.js';

import { createHealthRoutes } from './health.js';
import { createAuthRoutes } from './auth.js';
import { createUsersRoutes } from './users.js';
import { createRolesRoutes } from './roles.js';
import { createAssignmentsRoutes } from './assignments.js';
import { createUnitsRoutes } from './units.js';
import { createSectionsRoutes } from './sections.js';
import { createTractsRoutes } from './tracts.js';
import { createLeadsRoutes } from './leads.js';
import { createContactsRoutes } from './contacts.js';
import { createMappingRoutes } from './mapping.js';
import { createPricingRoutes } from './pricing.js';
import { createDataImportRoutes } from './dataImport.js';
import { createReportsRoutes } from './reports.js';
import { createTicketsRoutes } from './tickets.js';

/**
 * Create and register all API routes
 */
export const createAllRoutes = (
  dbPool: Pool | null,
  upload: Multer,
  dataImportService: DataImportService | null
): Router => {
  const router = Router();

  // Register all route handlers
  router.use(createHealthRoutes(dbPool));
  router.use(createAuthRoutes(dbPool));
  router.use(createUsersRoutes(dbPool));
  router.use(createRolesRoutes(dbPool));
  router.use(createAssignmentsRoutes(dbPool));
  router.use(createUnitsRoutes(dbPool));
  router.use(createSectionsRoutes(dbPool));
  router.use(createTractsRoutes(dbPool));
  router.use(createLeadsRoutes(dbPool));
  router.use(createContactsRoutes(dbPool));
  router.use(createMappingRoutes(dbPool));
  router.use(createPricingRoutes(dbPool));
  router.use(createDataImportRoutes(dbPool, dataImportService, upload));
  router.use(createReportsRoutes(dbPool));
  router.use(createTicketsRoutes(dbPool));

  return router;
};

