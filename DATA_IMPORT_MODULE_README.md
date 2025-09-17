# Data Import Module

## Overview

The Data Import Module provides a comprehensive solution for uploading and processing CSV and Excel files into the database. It includes table validation, staging/production workflows, and 3NF normalization.

## Features

### ✅ **File Support**
- **CSV Files** (.csv)
- **Excel Files** (.xlsx, .xls)
- **File Size Limit**: 50MB for Excel, 10MB for CSV
- **Automatic Format Detection**

### ✅ **Table Management**
- **Automatic Table Name Extraction** from filename
- **Table Existence Checking** before import
- **Dynamic Table Creation** based on file columns
- **Staging and Production Table Separation**

### ✅ **Data Validation**
- **Column Name Validation** against existing database schema
- **Missing Column Detection** with detailed error messages
- **Extra Column Detection** with warnings
- **Data Type Validation** (basic)

### ✅ **Import Workflow**
1. **File Upload** → Extract table name from filename
2. **Table Check** → Verify table doesn't already exist
3. **Column Extraction** → Read file headers
4. **Table Creation** → Create staging and production tables
5. **Data Import** → Load data into staging table
6. **Review & Approve** → User reviews staging data
7. **Production Move** → Move approved data to production
8. **3NF Normalization** → Normalize data structure
9. **Cleanup** → Remove staging data

## File Structure

```
services/
├── dataImportService.ts    # Core import logic
├── importApi.ts           # API endpoints
└── databaseConnection.ts  # Database connection

components/
├── DataImportComponent.tsx    # React UI component
└── DataImportComponent.css    # Styling

routes/
└── importRoutes.ts        # Express routes

pages/
└── DataImportPage.tsx     # Main import page

server.js                  # Express server
```

## API Endpoints

### File Upload
```
POST /api/import/upload
Content-Type: multipart/form-data
Body: file (CSV/Excel)
```

### Validate File
```
POST /api/import/validate
Content-Type: application/json
Body: { filePath, targetTableName }
```

### Approve Import
```
POST /api/import/approve
Content-Type: application/json
Body: { stagingTableName, productionTableName }
```

### Get Staging Tables
```
GET /api/import/staging-tables
```

### Get Staging Data
```
GET /api/import/staging-data/:tableName?limit=100
```

### Delete Staging Table
```
DELETE /api/import/staging-table/:tableName
```

### Get Table Schema
```
GET /api/import/schema/:tableName
```

## Usage

### 1. Start the Server
```bash
# Start both frontend and backend
npm run dev:full

# Or start individually
npm run server    # Backend API server (port 3001)
npm run dev       # Frontend Vite server (port 5173)
```

### 2. Access the Import Interface
Navigate to `/data-import` in your application.

### 3. Upload a File
1. Click "Select File (CSV/Excel)"
2. Choose your file
3. Click "Upload File"
4. Review the results

### 4. Review Staging Data
1. View uploaded data in the staging tables section
2. Click "View Data" to preview
3. Click "Approve Import" to move to production
4. Click "Delete" to remove staging data

## File Naming Convention

The module extracts table names from filenames:
- `contacts.csv` → `contacts` table
- `tract_data.xlsx` → `tract_data` table
- `mineral_interests_2024.csv` → `mineral_interests_2024` table

## Database Tables Created

### Staging Tables
- **Prefix**: `staging_`
- **Example**: `staging_contacts`
- **Purpose**: Temporary storage before approval

### Production Tables
- **Prefix**: `prod_`
- **Example**: `prod_contacts`
- **Purpose**: Final data storage

### Table Structure
```sql
CREATE TABLE staging_table_name (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  column1 TEXT,
  column2 TEXT,
  -- ... other columns from file
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## Error Handling

### File Upload Errors
- **Unsupported Format**: Only CSV and Excel files allowed
- **File Too Large**: Exceeds size limits
- **Empty File**: No data rows found
- **Invalid Format**: Corrupted or malformed file

### Validation Errors
- **Missing Columns**: Required columns not found in file
- **Extra Columns**: Unexpected columns in file
- **Table Exists**: Table with same name already exists
- **Schema Mismatch**: Column types don't match

### Import Errors
- **Database Connection**: Unable to connect to database
- **Permission Denied**: Insufficient database permissions
- **Constraint Violation**: Data violates database constraints
- **Memory Issues**: Large files causing memory problems

## 3NF Normalization

After data is moved to production, the system performs basic 3NF normalization:

1. **Identify Redundant Data**: Look for repeated values
2. **Create Lookup Tables**: Extract common values
3. **Establish Relationships**: Link tables with foreign keys
4. **Update References**: Replace redundant data with IDs

*Note: This is a simplified implementation. Complex normalization may require manual intervention.*

## Security Considerations

- **File Type Validation**: Only allowed file types accepted
- **File Size Limits**: Prevents resource exhaustion
- **SQL Injection Prevention**: Parameterized queries used
- **Path Traversal Protection**: Secure file handling
- **Access Control**: Database user permissions enforced

## Performance Optimization

- **Batch Processing**: Records inserted in batches of 1000
- **Streaming**: Large files processed in chunks
- **Indexing**: Automatic index creation on key columns
- **Memory Management**: Efficient memory usage for large files

## Troubleshooting

### Common Issues

1. **"Table already exists" Error**
   - Solution: Rename your file or delete existing table

2. **"Missing columns" Error**
   - Solution: Ensure file has all required columns
   - Check column names match exactly (case-sensitive)

3. **"File too large" Error**
   - Solution: Split file into smaller chunks or increase server limits

4. **"Database connection failed" Error**
   - Solution: Check database server is running
   - Verify connection settings in `.env`

### Debug Mode

Enable debug logging by setting:
```javascript
process.env.DEBUG = 'import:*'
```

## Future Enhancements

- [ ] **Data Transformation Rules**: Custom field mappings
- [ ] **Incremental Updates**: Update existing records
- [ ] **Data Quality Checks**: Advanced validation rules
- [ ] **Scheduled Imports**: Automated file processing
- [ ] **Email Notifications**: Import status alerts
- [ ] **Audit Trail**: Complete import history
- [ ] **Rollback Functionality**: Undo imports
- [ ] **Data Preview**: Interactive data review
- [ ] **Column Mapping**: Drag-and-drop field mapping
- [ ] **Data Cleansing**: Automatic data cleaning

## Support

For issues or questions:
1. Check the error messages in the UI
2. Review server logs for detailed errors
3. Verify file format and column names
4. Ensure database connectivity
5. Check file permissions and size limits
