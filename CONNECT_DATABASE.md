# 🔌 Connect to PostgreSQL Database

## Your Database Connection

**Database**: `jsmike/postgres@PostgreSQL 18`
- **User**: jsmike
- **Database**: postgres
- **Host**: localhost
- **Port**: 5432
- **Version**: PostgreSQL 18

## 🚀 Quick Setup (3 Options)

### Option 1: PowerShell Script (Recommended)
```powershell
cd backend/database
.\connect-database.ps1
```

This interactive script will:
- Find your PostgreSQL installation
- Test the connection
- Create/update the database schema
- Load sample data
- Verify everything is working

### Option 2: Batch File
```cmd
cd backend\database
setup-database.bat
```

Simple batch file that runs the schema directly.

### Option 3: Manual Connection
```bash
# Open Command Prompt or PowerShell
cd backend/database

# Connect and run schema
psql -U jsmike -d postgres -f schema.sql

# Verify tables were created
psql -U jsmike -d postgres -c "\dt"

# Check sample data
psql -U jsmike -d postgres -c "SELECT COUNT(*) FROM smes;"
```

## 📋 Step-by-Step Manual Setup

### 1. Ensure PostgreSQL is Running

**Check if running:**
```powershell
# PowerShell
Get-Service -Name postgresql*

# Or Command Prompt
sc query postgresql-x64-18
```

**Start if not running:**
```powershell
# PowerShell (as Administrator)
Start-Service postgresql-x64-18

# Or Command Prompt (as Administrator)
net start postgresql-x64-18
```

### 2. Test Connection

```bash
psql -U jsmike -d postgres
```

If this works, you're connected! Type `\q` to exit.

### 3. Run the Schema

```bash
psql -U jsmike -d postgres -f backend/database/schema.sql
```

### 4. Verify Tables

```sql
-- Connect to database
psql -U jsmike -d postgres

-- List tables
\dt

-- Should show:
-- smes
-- investors
-- investment_deals
-- investment_opportunities

-- Check sample data
SELECT COUNT(*) FROM smes;
-- Should return: 5

-- View sample SME
SELECT business_name, owner_name, region FROM smes LIMIT 1;

-- Exit
\q
```

## 🔧 Configure Backend

### Update backend/.env

```env
DB_USER=jsmike
DB_HOST=localhost
DB_NAME=postgres
DB_PASSWORD=your_actual_password_here
DB_PORT=5432
PORT=5000
NODE_ENV=development
```

**Important**: Replace `your_actual_password_here` with your PostgreSQL password!

## ✅ Verify Connection

### Test Backend Connection

1. **Start the backend:**
```bash
cd backend
npm run dev
```

2. **Check console output:**
```
Server running on port 5000
Connected to PostgreSQL database
```

3. **Test API endpoint:**
```bash
# PowerShell
Invoke-WebRequest -Uri "http://localhost:5000/api/statistics/summary" -UseBasicParsing

# Or open in browser
http://localhost:5000/api/statistics/summary
```

Should return JSON with statistics.

### Test Registration

1. **Start frontend:**
```bash
npm start
```

2. **Navigate to:**
```
http://localhost:3000/register
```

3. **Fill in the form and submit**

4. **Check database:**
```sql
psql -U jsmike -d postgres

SELECT * FROM smes ORDER BY created_at DESC LIMIT 1;
```

Should show your newly registered SME!

## 🗄️ Database Schema

### Tables Created:

#### 1. smes (SME Registrations)
```sql
- id (Primary Key)
- business_name, trading_name
- registration_number (Unique)
- owner_name, owner_id, owner_passport
- owner_gender, owner_age, owner_address
- nationality, years_experience
- email (Unique), phone
- region, city, address
- industry_sector, sub_sector
- business_type
- employees, annual_turnover, annual_turnover_range
- established_date
- status (pending/active/rejected)
- documents_count
- created_at, updated_at
```

#### 2. investors
```sql
- id, name, type
- email, phone, region
- investment_focus
- min_investment, max_investment
- sectors_of_interest
- status, created_at, updated_at
```

#### 3. investment_deals
```sql
- id, sme_id, investor_id
- investment_amount, equity_percentage
- deal_type, status, deal_date
- terms, created_at, updated_at
```

#### 4. investment_opportunities
```sql
- id, sme_id, title, description
- funding_required, equity_offered
- use_of_funds, expected_roi
- investment_timeline, status
- created_at, updated_at
```

## 📊 Sample Data Included

### 5 SME Businesses:
1. **Namibian Craft Co.** - Manufacturing (Khomas)
2. **Desert Solar Solutions** - Renewable Energy (Erongo)
3. **Kalahari Organic Farms** - Agriculture (Omaheke)
4. **Windhoek Tech Hub** - IT (Khomas)
5. **Coastal Fishing Enterprise** - Fisheries (Erongo)

### 3 Investors:
1. **JESMIKE Investment Fund** - Institutional
2. **Namibia Development Corporation** - Government
3. **Private Equity Partners** - Institutional

### 3 Investment Deals:
- Various completed and approved deals

## 🐛 Troubleshooting

### Issue: "psql is not recognized"

**Solution 1**: Add PostgreSQL to PATH
```powershell
# Find PostgreSQL bin directory
# Usually: C:\Program Files\PostgreSQL\18\bin

# Add to PATH (PowerShell as Administrator)
$env:Path += ";C:\Program Files\PostgreSQL\18\bin"

# Make permanent
[Environment]::SetEnvironmentVariable("Path", $env:Path, [System.EnvironmentVariableTarget]::Machine)
```

**Solution 2**: Use full path
```bash
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U jsmike -d postgres -f schema.sql
```

### Issue: "password authentication failed"

**Solutions**:
1. Check password is correct
2. Check pg_hba.conf allows password authentication
3. Try resetting password:
```sql
-- As postgres superuser
ALTER USER jsmike WITH PASSWORD 'new_password';
```

### Issue: "database does not exist"

**Solution**: Create the database
```bash
# As postgres superuser
createdb -U postgres postgres

# Or in psql
CREATE DATABASE postgres;
```

### Issue: "role jsmike does not exist"

**Solution**: Create the user
```sql
-- As postgres superuser
CREATE USER jsmike WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE postgres TO jsmike;
```

### Issue: Backend can't connect

**Check**:
1. PostgreSQL service is running
2. backend/.env has correct password
3. Firewall allows port 5432
4. Database and tables exist

**Test connection:**
```javascript
// In backend directory
node -e "const { Pool } = require('pg'); const pool = new Pool({ user: 'jsmike', host: 'localhost', database: 'postgres', password: 'your_password', port: 5432 }); pool.query('SELECT NOW()', (err, res) => { console.log(err ? err : res.rows); pool.end(); });"
```

## 📝 Useful PostgreSQL Commands

### Connection:
```bash
# Connect to database
psql -U jsmike -d postgres

# Connect with host and port
psql -U jsmike -h localhost -p 5432 -d postgres
```

### Database Info:
```sql
-- List databases
\l

-- List tables
\dt

-- Describe table
\d smes

-- List users
\du

-- Current database
SELECT current_database();

-- PostgreSQL version
SELECT version();
```

### Data Queries:
```sql
-- Count SMEs
SELECT COUNT(*) FROM smes;

-- SMEs by region
SELECT region, COUNT(*) FROM smes GROUP BY region;

-- Recent registrations
SELECT business_name, email, created_at 
FROM smes 
ORDER BY created_at DESC 
LIMIT 10;

-- Pending registrations
SELECT business_name, owner_name, email 
FROM smes 
WHERE status = 'pending';
```

### Data Management:
```sql
-- Approve registration
UPDATE smes SET status = 'active' WHERE id = 6;

-- Delete test data
DELETE FROM smes WHERE email = 'test@example.com';

-- Reset auto-increment
ALTER SEQUENCE smes_id_seq RESTART WITH 1;

-- Backup table
CREATE TABLE smes_backup AS SELECT * FROM smes;
```

## 🔒 Security Checklist

- [ ] PostgreSQL password is strong
- [ ] Password is stored in .env (not in code)
- [ ] .env is in .gitignore
- [ ] PostgreSQL only accepts local connections (or secured)
- [ ] Regular backups are configured
- [ ] User has appropriate permissions (not superuser)

## 📦 Backup & Restore

### Backup Database:
```bash
# Full database backup
pg_dump -U jsmike -d postgres > backup.sql

# Specific table
pg_dump -U jsmike -d postgres -t smes > smes_backup.sql

# With timestamp
pg_dump -U jsmike -d postgres > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore Database:
```bash
# Restore full database
psql -U jsmike -d postgres < backup.sql

# Restore specific table
psql -U jsmike -d postgres < smes_backup.sql
```

## ✨ Success Checklist

- [ ] PostgreSQL 18 is installed and running
- [ ] Can connect with: `psql -U jsmike -d postgres`
- [ ] Schema is created (4 tables exist)
- [ ] Sample data is loaded (5 SMEs)
- [ ] backend/.env has correct password
- [ ] Backend server connects successfully
- [ ] API endpoints return data
- [ ] Registration form saves to database

## 🎯 Next Steps

Once connected:
1. ✅ Database is ready
2. ✅ Schema is created
3. ✅ Sample data is loaded
4. Start backend: `cd backend && npm run dev`
5. Start frontend: `npm start`
6. Test registration: http://localhost:3000/register
7. View statistics: http://localhost:3000/statistics

---

**Database**: jsmike/postgres@PostgreSQL 18  
**Status**: Ready to Connect  
**Last Updated**: November 28, 2025