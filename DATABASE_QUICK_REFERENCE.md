# 🎯 Database Quick Reference Card

## Connection Details
```
Database: postgres
User: jsmike
Host: localhost
Port: 5432
Version: PostgreSQL 18
```

## 🚀 Quick Commands

### Connect to Database
```bash
psql -U jsmike -d postgres
```

### Run Schema
```bash
cd backend/database
psql -U jsmike -d postgres -f schema.sql
```

### Start Platform
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
npm start
```

## 📊 Quick Queries

### Check Tables
```sql
\dt
```

### Count SMEs
```sql
SELECT COUNT(*) FROM smes;
```

### Recent Registrations
```sql
SELECT business_name, email, status, created_at 
FROM smes 
ORDER BY created_at DESC 
LIMIT 5;
```

### Approve Registration
```sql
UPDATE smes SET status = 'active' WHERE id = 6;
```

## 🔧 Configuration

### backend/.env
```env
DB_USER=jsmike
DB_HOST=localhost
DB_NAME=postgres
DB_PASSWORD=your_password
DB_PORT=5432
PORT=5000
```

### .env (frontend)
```env
REACT_APP_API_URL=http://localhost:5000
```

## 🌐 API Endpoints

### Statistics
```
GET /api/statistics/summary
GET /api/statistics/regions
GET /api/statistics/sectors
```

### Registration
```
POST /api/sme/register
GET /api/sme/check/:email
PUT /api/sme/update/:id
GET /api/sme/all
```

### Dashboard
```
GET /api/dashboard/:userId
GET /api/activities/:userId
GET /api/dashboard/summary
```

### Export
```
GET /api/export/csv
GET /api/export/excel
GET /api/export/pdf
```

## 🧪 Test URLs

```
http://localhost:3000              - Frontend
http://localhost:3000/register     - Registration
http://localhost:3000/statistics   - Statistics
http://localhost:3000/dashboard    - Dashboard
http://localhost:5000/api/statistics/summary - API Test
```

## 🐛 Quick Fixes

### PostgreSQL not running
```powershell
Start-Service postgresql-x64-18
```

### Backend won't start
```bash
cd backend
npm install
npm run dev
```

### Can't connect to database
1. Check PostgreSQL is running
2. Verify password in backend/.env
3. Test: `psql -U jsmike -d postgres`

### No data showing
```sql
-- Check if tables exist
\dt

-- Check if data exists
SELECT COUNT(*) FROM smes;

-- Reload sample data
\i backend/database/schema.sql
```

## 📁 Important Files

```
backend/
├── server.js                    - API server
├── .env                         - Database credentials
├── database/
│   ├── schema.sql              - Database schema
│   ├── connect-database.ps1    - Connection script
│   └── setup-database.bat      - Setup script

src/components/
├── Registration/
│   └── RegisterSME.js          - Registration form
├── Statistics/
│   └── StatisticsDashboard.js  - Statistics
└── Dashboard/
    └── Dashboard.js            - User dashboard
```

## 📚 Documentation

- **[CONNECT_DATABASE.md](CONNECT_DATABASE.md)** - Full connection guide
- **[REGISTRATION_GUIDE.md](REGISTRATION_GUIDE.md)** - Registration details
- **[DATABASE_SETUP.md](DATABASE_SETUP.md)** - Complete setup
- **[QUICK_START.md](QUICK_START.md)** - Quick start guide

## ✅ Verification

```bash
# 1. Database connected
psql -U jsmike -d postgres -c "SELECT COUNT(*) FROM smes;"

# 2. Backend running
curl http://localhost:5000/api/statistics/summary

# 3. Frontend running
# Open: http://localhost:3000
```

---

**Quick Help**: See [CONNECT_DATABASE.md](CONNECT_DATABASE.md) for detailed instructions