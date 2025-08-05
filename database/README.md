# Database Schema & API Endpoints

This directory contains the database schema for the Sooner Capital application, broken down into individual table-specific SQL files.

## Schema Files

Each file creates a single table and populates it with mock data. Due to foreign key dependencies, **these scripts must be executed in the following order**:

1.  `roles.sql`
2.  `users.sql` (depends on `roles`)
3.  `privileges.sql`
4.  `privilege_roles.sql` (depends on `privileges` and `roles`)
5.  `tracts.sql` (depends on `users`)

This modular structure allows for easier management and debugging of the database schema.

## Backend Interaction Scripts

The user requested "scripts to handle db interactions." In this frontend-focused project, these interactions are defined and simulated in `src/services/api.ts`.

This file acts as a **mock backend API** and a **contract** for what the real backend needs to implement. Each function in `api.ts` (e.g., `fetchTracts`, `createUser`) corresponds to a REST API endpoint that the frontend will call. The required endpoints, methods, and data shapes are documented in the comments within that file.
