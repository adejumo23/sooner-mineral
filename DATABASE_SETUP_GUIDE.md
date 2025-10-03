# Database Setup Guide

## 🚀 **Complete Database Integration Setup**

This guide will help you set up the complete database integration for the Sooner Mineral application.

## 📋 **Prerequisites**

1. **Docker** installed and running
2. **Node.js** and **npm** installed
3. **MySQL** client (optional, for direct database access)

## 🔧 **Step 1: Database Setup**

### **Option A: Using Docker (Recommended)**

1. **Start the database**:
```bash
docker-compose up -d db
```

2. **Wait for database to be ready** (about 30 seconds)

3. **Run the database setup script**:
```bash
docker exec -i soonermineral-db-1 mysql -u root -prootpassword < database/setup_database.sql
```

### **Option B: Manual Setup**

1. **Create the database**:
```sql
CREATE DATABASE soonermineraldb;
USE soonermineraldb;
```

2. **Run individual table scripts**:
```bash
# Run each table script in order
mysql -u root -p soonermineraldb < database/tables/01_roles.sql
mysql -u root -p soonermineraldb < database/tables/02_users.sql
mysql -u root -p soonermineraldb < database/tables/03_privileges.sql
# ... continue for all tables
```

## 📦 **Step 2: Install Dependencies**

```bash
npm install mysql2
npm install @types/mysql2 --save-dev
```

## 🔗 **Step 3: Environment Configuration**

The application will use the existing `.env` file with these settings:
- **DB_HOST**: sooner-mineral-db
- **DB_PORT**: 3359
- **DB_USER**: soonermineral
- **DB_PASSWORD**: soonermineralpass
- **DB_NAME**: soonermineraldb

## 🚀 **Step 4: Start the Application**

```bash
npm start
```

## 🧪 **Step 5: Test the Integration**

1. **Navigate to the test page**: `http://localhost:3050/test-normalized`
2. **Verify data is loading** from the database
3. **Check browser console** for any errors

## 📊 **Database Structure**

### **Core Tables**
- **roles** - User roles and permissions
- **users** - User accounts
- **privileges** - System privileges
- **privilege_roles** - Role-privilege relationships

### **Location Tables**
- **states** - State information
- **counties** - County information
- **basins** - Geological basins

### **Land Management Tables**
- **tracts** - Land tract information
- **contacts** - Contact information
- **units** - Unit information
- **contact_tract_ownership** - Ownership relationships

### **Business Process Tables**
- **leads** - Lead management
- **assignments** - Assignment tracking

## 🔍 **Verification Queries**

### **Check Database Connection**
```sql
SELECT 'Database Connected' as status;
```

### **Check Table Counts**
```sql
SELECT TABLE_NAME, TABLE_ROWS 
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'soonermineraldb' 
ORDER BY TABLE_NAME;
```

### **Check Sample Data**
```sql
-- Tracts
SELECT id, tract_name, state, county, title_status FROM tracts LIMIT 5;

-- Contacts
SELECT id, name, email, contact_type FROM contacts LIMIT 5;

-- Leads
SELECT l.id, l.lead_name, l.status, t.tract_name 
FROM leads l 
LEFT JOIN tracts t ON l.tract_id = t.id 
LIMIT 5;
```

## 🎯 **API Endpoints Available**

### **Tract Management**
- `fetchTracts(filters?)` - Get all tracts with filtering
- `fetchTract(id)` - Get specific tract
- `fetchTractOwners(tractId)` - Get tract owners
- `searchTracts(term, limit, offset)` - Search tracts
- `fetchTractDashboard()` - Get dashboard statistics

### **Contact Management**
- `fetchContacts(filters?)` - Get all contacts
- `fetchContact(id)` - Get specific contact

### **Lead Management**
- `fetchLeads(filters?)` - Get all leads
- `fetchLead(id)` - Get specific lead

### **Assignment Management**
- `fetchAssignments(filters?)` - Get all assignments
- `fetchAssignment(id)` - Get specific assignment

## 🐛 **Troubleshooting**

### **Database Connection Issues**
1. Check if Docker is running
2. Verify database container is up: `docker ps`
3. Check database logs: `docker logs soonermineral-db-1`

### **Application Issues**
1. Check browser console for errors
2. Verify environment variables in `.env`
3. Check if database tables exist

### **Data Issues**
1. Verify sample data was inserted
2. Check foreign key relationships
3. Run verification queries

## 📈 **Next Steps**

1. **Test all functionality** with the test component
2. **Update UI components** to use real database data
3. **Add more tables** as needed (pricing, formations, etc.)
4. **Implement CRUD operations** for all entities
5. **Add data validation** and error handling

## 🎉 **Success Indicators**

- ✅ Database connects successfully
- ✅ Test page loads with real data
- ✅ No console errors
- ✅ All API endpoints return data
- ✅ Foreign key relationships work
- ✅ Search and filtering work

The application is now fully integrated with the database! 🚀
