# Local Development Setup

This guide helps you run the Sooner Mineral application locally while using Docker only for database services.

## Quick Start

1. **Setup everything at once:**
   ```bash
   make setup
   ```

2. **Start development:**
   ```bash
   make dev
   ```

3. **Open your browser:**
   - Frontend: http://localhost:3050
   - Backend API: http://localhost:3051
   - Database Admin: http://localhost:3360

## Manual Setup

### 1. Install Dependencies
```bash
make install
```

### 2. Start Database Services
```bash
make db-up
```

### 3. Start Development Server
```bash
make dev
```

## Available Commands

### Database Commands
- `make db-up` - Start MySQL and phpMyAdmin containers
- `make db-down` - Stop database containers
- `make db-logs` - Show database container logs
- `make db-reset` - Reset database (removes all data)

### Development Commands
- `make install` - Install all dependencies
- `make dev` - Start development server (frontend + backend)
- `make build` - Build the application for production
- `make start` - Start production build locally

### Utility Commands
- `make stop` - Stop all running processes
- `make clean` - Clean up node_modules and build artifacts
- `make logs` - Show application logs
- `make help` - Show all available commands

## Environment Configuration

The application uses the following ports:
- **Frontend**: 3050 (Vite dev server)
- **Backend API**: 3051 (Express server)
- **MySQL**: 3359 (Docker container)
- **phpMyAdmin**: 3360 (Docker container)

## Database Access

- **MySQL**: `localhost:3359`
  - Username: `soonermineral`
  - Password: `soonermineralpass`
  - Database: `soonermineraldb`

- **phpMyAdmin**: http://localhost:3360
  - Username: `root`
  - Password: `rootpassword`

## Troubleshooting

### Port Already in Use
If you get port conflicts, run:
```bash
make stop
```

### Database Connection Issues
1. Make sure database containers are running: `make db-up`
2. Check database logs: `make db-logs`
3. Reset database if needed: `make db-reset`

### Build Issues
1. Clean everything: `make clean`
2. Reinstall dependencies: `make install`
3. Try building again: `make build`

## Development Workflow

1. **Start your day:**
   ```bash
   make db-up
   make dev
   ```

2. **End your day:**
   ```bash
   make stop
   ```

3. **Reset everything:**
   ```bash
   make clean
   make setup
   ```

## File Structure

- `docker-compose.db-only.yml` - Database services only
- `Makefile` - Development commands
- `.env` - Environment variables (update DB_HOST to localhost)
- `server-with-db.js` - Backend API server
- `vite.config.ts` - Frontend build configuration
