#!/usr/bin/env node

/**
 * Script to extract routes from server-with-db.js and generate TypeScript route files
 * This helps migrate from a monolithic server file to organized route modules
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serverFile = path.join(__dirname, '..', 'server-with-db.js');
const routesDir = path.join(__dirname, '..', 'services', 'routes');

// Route groups to extract
const routeGroups = {
  assignments: {
    patterns: ['/api/assignments'],
    file: 'assignments.ts'
  },
  units: {
    patterns: ['/api/units'],
    file: 'units.ts'
  },
  sections: {
    patterns: ['/api/sections'],
    file: 'sections.ts'
  },
  tracts: {
    patterns: ['/api/tracts'],
    file: 'tracts.ts'
  },
  leads: {
    patterns: ['/api/leads'],
    file: 'leads.ts'
  },
  contacts: {
    patterns: ['/api/contacts'],
    file: 'contacts.ts'
  },
  dataImport: {
    patterns: ['/api/import', '/api/normalized'],
    file: 'dataImport.ts'
  },
  mapping: {
    patterns: ['/api/map', '/api/tract-spatial', '/api/section-spatial'],
    file: 'mapping.ts'
  },
  pricing: {
    patterns: ['/api/pricing'],
    file: 'pricing.ts'
  }
};

console.log('Route extraction script');
console.log('This script helps identify routes that need to be extracted.');
console.log('For now, please manually extract routes following the pattern in:');
console.log('- services/routes/auth.ts');
console.log('- services/routes/users.ts');
console.log('- services/routes/roles.ts');
console.log('\nRoute groups to extract:');
Object.keys(routeGroups).forEach(key => {
  console.log(`  - ${key}: ${routeGroups[key].file}`);
});

