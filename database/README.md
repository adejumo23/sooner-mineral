# Sooner Mineral Database

This directory contains all database-related files for the Sooner Mineral application, including schemas, dumps, deployment scripts, and documentation.

## 📁 Directory Structure

```
database/
├── README.md                              # This file
├── DATABASE_DUMP_AND_DEPLOYMENT_GUIDE.md # Comprehensive deployment guide
├── complete-database-dump.sql             # Complete database dump (generated)
├── complete-database-dump-summary.txt     # Dump summary (generated)
├── production-config.json.template        # Production config template
├── test-config.json                       # Test environment config
├── deployment-logs/                       # Deployment logs (auto-created)
│   └── deployment-log-YYYY-MM-DD.json    # Individual deployment logs
├── create_database.sql                    # Database creation script
├── normalized_schema.sql                  # Normalized database schema
├── mapping.sql                           # Spatial data mapping tables
├── recreate_production_tables.sql        # Production table recreation
├── fix_tract_data.sql                    # Tract data fixes
└── *.md                                  # Additional documentation files
```

## 🚀 Quick Start

### Create a Database Dump
```bash
# Create a complete dump of the current database
npm run dump:create

# Create a dump with custom filename
npm run dump:create database/my-custom-dump.sql
```

### Deploy to Production
```bash
# Deploy using default configuration
npm run dump:deploy

# Deploy with custom dump file and config
npm run dump:deploy database/my-dump.sql database/production-config.json

# Create dump and deploy in one command
npm run dump:full
```

## 📊 Database Overview

The Sooner Mineral database contains **77 tables** organized into several categories:

### 🏭 Production Tables (`prod_*`)
- **`prod_acreage_schedule`** - Main acreage data (1,144 records)
- **`prod_oklahoma_pricing`** - Oklahoma pricing data (3,617 records)
- **`prod_texas_pricing`** - Texas pricing data (20,436 records)
- **`prod_unit_summary`** - Unit summary data (5 records)
- **`prod_unit_tracker`** - Unit tracking (empty)

### 📋 Staging Tables (`staging_*`)
- **`staging_acreage_schedule`** - Staging for acreage data
- **`staging_oklahoma_pricing`** - Staging for Oklahoma pricing
- **`staging_texas_pricing`** - Staging for Texas pricing
- **`staging_unit_tracker`** - Staging for unit data (174 records)
- Multiple test staging tables

### 🗂️ System Tables
- **`import_sessions`** - Import session metadata (1 record)
- **`import_validation_rules`** - Data validation rules (3 records)
- **`staging_tables`** - Staging table metadata
- **`production_tables`** - Production table metadata

### 🏢 Core Business Tables
- **`abstracts`** - Abstract numbers (2 records)
- **`basins`** - Geological basins (5 records)
- **`counties`** - County data (3 records)
- **`contacts`** - Contact information (4 records)
- **`formations`** - Geological formations (8 records)
- **`operators`** - Well operators (5 records)
- **`owners`** - Property owners (2 records)
- **`properties`** - Property data (4 records)
- **`tracts`** - Tract information (2 records)
- **`units`** - Unit data (2 records)
- **`wells`** - Well information (2 records)

### 👥 User Management
- **`users`** - User accounts (4 records)
- **`roles`** - User roles (4 records)
- **`privileges`** - System privileges (5 records)
- **`privilege_roles`** - Role-privilege mappings (10 records)

### 📈 Business Operations
- **`leads`** - Lead tracking (4 records)
- **`assignments`** - Assignment data (4 records)
- **`acquisition_tracking`** - Acquisition tracking (1 record)
- **`permits`** - Permit data (2 records)
- **`producing_wells`** - Producing well data (2 records)

## 🔧 Configuration

### Environment Variables
The application uses the following environment variables for database connection:

```env
MYSQL_USER=soonermineral
MYSQL_PASSWORD=soonermineralpass
MYSQL_DATABASE=soonermineraldb
```

### Production Configuration
Copy `production-config.json.template` to `production-config.json` and customize:

```json
{
  "host": "your-production-host.com",
  "port": 3306,
  "user": "your-production-username",
  "password": "your-production-password",
  "database": "soonermineral_production",
  "ssl": {
    "rejectUnauthorized": false
  }
}
```

## 📋 Key Data Statistics

| Table Category | Tables | Total Records | Key Tables |
|---------------|--------|---------------|------------|
| Production Data | 8 | ~25,200 | `prod_acreage_schedule`, `prod_oklahoma_pricing`, `prod_texas_pricing` |
| Staging Data | 15 | ~200 | `staging_unit_tracker` |
| Core Business | 25 | ~50 | `contacts`, `properties`, `tracts`, `units` |
| System/Admin | 29 | ~40 | `users`, `import_sessions`, `validation_rules` |

## 🛠️ Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| Create Dump | `npm run dump:create` | Create complete database dump |
| Deploy | `npm run dump:deploy` | Deploy dump to production |
| Full Process | `npm run dump:full` | Create dump and deploy |

## 📖 Documentation

- **[DATABASE_DUMP_AND_DEPLOYMENT_GUIDE.md](./DATABASE_DUMP_AND_DEPLOYMENT_GUIDE.md)** - Comprehensive deployment guide
- **[NORMALIZATION_DOCUMENTATION.md](./NORMALIZATION_DOCUMENTATION.md)** - Database normalization details
- **[NORMALIZED_TABLE_VIEW.md](./NORMALIZED_TABLE_VIEW.md)** - Table relationships and structure

## 🔒 Security Notes

- Database dumps contain sensitive data - handle securely
- Production credentials should be stored securely
- Use SSL/TLS for production connections
- Regular backups are essential for data protection

## 📞 Support

For database-related issues:
1. Check the deployment logs in `deployment-logs/`
2. Review the comprehensive deployment guide
3. Verify database connectivity and permissions
4. Contact the development team

---

**Last Updated:** September 25, 2025  
**Database Version:** soonermineraldb  
**Total Tables:** 77  
**Total Records:** ~25,500