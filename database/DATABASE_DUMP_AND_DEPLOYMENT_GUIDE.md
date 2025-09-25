# Database Dump and Deployment Guide

## Overview

This guide provides comprehensive instructions for creating SQL dumps of the Sooner Mineral application database and deploying them to production environments.

## 📁 File Structure

```
database/
├── complete-database-dump.sql          # Generated complete database dump
├── complete-database-dump-summary.txt  # Generated summary of dump
├── production-config.json.template     # Template for production configuration
├── DATABASE_DUMP_AND_DEPLOYMENT_GUIDE.md # This documentation
└── deployment-logs/                    # Deployment logs (created automatically)

scripts/
├── create-database-dump.js            # Script to create database dump
└── deploy-to-production.js            # Script to deploy to production
```

## 🔧 Prerequisites

### Required Software
- Node.js (v16 or higher)
- MySQL Server (v8.0 or higher)
- Access to source database (development/staging)
- Access to target database (production)

### Required Permissions
- **Source Database**: SELECT permissions on all tables
- **Target Database**: CREATE, DROP, INSERT, UPDATE, DELETE permissions

## 📊 Creating a Database Dump

### Step 1: Prepare Environment

Ensure your `.env` file contains the correct database credentials:

```env
MYSQL_USER=soonermineral
MYSQL_PASSWORD=soonermineralpass
MYSQL_DATABASE=soonermineraldb
```

### Step 2: Run the Dump Script

```bash
# Create dump with default filename
node scripts/create-database-dump.js

# Create dump with custom filename
node scripts/create-database-dump.js database/my-custom-dump.sql
```

### Step 3: Verify the Dump

The script will create two files:
- `complete-database-dump.sql` - The complete SQL dump
- `complete-database-dump-summary.txt` - Summary of what was dumped

Check the summary file to ensure all expected tables are included.

## 🚀 Deploying to Production

### Step 1: Prepare Production Configuration

Copy the production configuration template:

```bash
cp database/production-config.json.template database/production-config.json
```

Edit `database/production-config.json` with your production database details:

```json
{
  "host": "your-production-host.com",
  "port": 3306,
  "user": "your-production-username",
  "password": "your-production-password",
  "database": "soonermineral_production",
  "ssl": {
    "rejectUnauthorized": false
  },
  "connectionLimit": 10,
  "acquireTimeout": 60000,
  "timeout": 60000
}
```

### Step 2: Deploy to Production

```bash
# Deploy using default dump file and config
node scripts/deploy-to-production.js

# Deploy using custom dump file and config
node scripts/deploy-to-production.js database/my-dump.sql database/production-config.json
```

### Step 3: Verify Deployment

The deployment script will:
1. ✅ Test connection to production database
2. 💾 Create backup of existing database (if exists)
3. 🔄 Execute all SQL statements from the dump
4. 🔍 Verify deployment by counting tables and records
5. 📄 Create deployment log

## 📋 What's Included in the Dump

### Database Schema
- Complete database structure
- All table definitions with constraints
- Indexes and foreign keys
- Character sets and collations

### Production Tables
- `prod_acreage_schedule` - Main acreage data
- `prod_unit_tracking` - Unit information (if exists)
- All other tables with `prod_` prefix

### Staging Tables
- All tables with `staging_` prefix
- Temporary import data
- Validation and processing tables

### System Tables
- `import_sessions` - Import session metadata
- `staging_tables` - Staging table metadata
- `production_tables` - Production table metadata
- `import_validation_rules` - Data validation rules

### Data Integrity
- All foreign key relationships
- Check constraints
- Unique constraints
- Default values

## 🔒 Security Considerations

### Before Deployment
1. **Review Production Credentials**: Ensure production database credentials are secure
2. **Network Security**: Use SSL/TLS connections for production
3. **Access Control**: Limit database access to necessary personnel
4. **Backup Verification**: Ensure production backups are current

### During Deployment
1. **Maintenance Window**: Schedule during low-traffic periods
2. **Monitor Resources**: Watch CPU, memory, and disk usage
3. **Connection Limits**: Be aware of connection limits during bulk operations
4. **Transaction Logs**: Monitor transaction log growth

### After Deployment
1. **Verify Data Integrity**: Run data validation queries
2. **Test Application**: Ensure application functions correctly
3. **Performance Monitoring**: Monitor query performance
4. **Cleanup**: Remove temporary files and logs

## 🚨 Troubleshooting

### Common Issues

#### Connection Errors
```
Error: connect ECONNREFUSED
```
**Solution**: Verify database host, port, and network connectivity

#### Authentication Errors
```
Error: Access denied for user 'username'@'host'
```
**Solution**: Check username, password, and user permissions

#### Memory Errors
```
Error: JavaScript heap out of memory
```
**Solution**: Increase Node.js memory limit:
```bash
node --max-old-space-size=8192 scripts/deploy-to-production.js
```

#### Large Dataset Issues
```
Error: MySQL server has gone away
```
**Solution**: Increase MySQL timeout settings in production config:
```json
{
  "acquireTimeout": 120000,
  "timeout": 120000
}
```

### Recovery Procedures

#### Failed Deployment
1. Check deployment log for specific errors
2. Restore from backup if available
3. Fix issues and retry deployment
4. Contact database administrator if needed

#### Data Corruption
1. Stop application services
2. Restore from latest backup
3. Verify data integrity
4. Restart application services

## 📈 Performance Optimization

### For Large Datasets

#### Dump Creation
- Run during off-peak hours
- Monitor system resources
- Consider splitting large tables

#### Deployment
- Use connection pooling
- Increase timeout values
- Monitor disk I/O
- Consider parallel processing for large datasets

### Monitoring Commands

```sql
-- Check table sizes
SELECT 
  table_name,
  ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Size (MB)'
FROM information_schema.tables
WHERE table_schema = 'soonermineral_production'
ORDER BY (data_length + index_length) DESC;

-- Check recent imports
SELECT * FROM import_sessions 
ORDER BY created_at DESC 
LIMIT 10;

-- Check staging table status
SELECT table_name, record_count, created_at 
FROM staging_tables 
ORDER BY created_at DESC;
```

## 🔄 Automation and Scheduling

### Automated Backups
Consider setting up automated daily dumps:

```bash
#!/bin/bash
# daily-backup.sh
cd /path/to/sooner-mineral
node scripts/create-database-dump.js database/daily-backup-$(date +%Y%m%d).sql
```

### CI/CD Integration
For automated deployments, integrate the deployment script into your CI/CD pipeline:

```yaml
# .github/workflows/deploy.yml
- name: Deploy to Production
  run: |
    node scripts/deploy-to-production.js
  env:
    PRODUCTION_DB_HOST: ${{ secrets.PROD_DB_HOST }}
    PRODUCTION_DB_USER: ${{ secrets.PROD_DB_USER }}
    PRODUCTION_DB_PASSWORD: ${{ secrets.PROD_DB_PASSWORD }}
```

## 📞 Support

For issues or questions regarding database dumps and deployments:

1. Check this documentation first
2. Review deployment logs
3. Check database server logs
4. Contact the development team

## 📝 Changelog

- **v1.0.0** - Initial release with complete dump and deployment functionality
- Includes schema, data, and metadata
- Supports production deployment with backup
- Comprehensive error handling and logging
