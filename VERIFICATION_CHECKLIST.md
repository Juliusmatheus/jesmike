# ✅ SME Platform - Verification Checklist

Use this checklist to verify that your database connection and all features are working correctly.

## 📋 Pre-Flight Checks

### 1. PostgreSQL Database
- [ ] PostgreSQL 18 is installed
- [ ] PostgreSQL service is running
- [ ] Can connect with: `psql -U jsmike -d postgres`
- [ ] Database schema is created (tables exist)
- [ ] Sample data is loaded

**Test Command:**
```bash
psql -U jsmike -d postgres -c "SELECT COUNT(*) FROM smes;"
```
**Expected**: Should return count (e.g., 5)

### 2. Backend Setup
- [ ] Node.js is installed
- [ ] Backend dependencies installed (`npm install`)
- [ ] `.env` file exists in `backend/` folder
- [ ] Database password is set in `.env`
- [ ] Backend server starts without errors

**Test Command:**
```bash
cd backend
npm run dev
```
**Expected**: "Server running on port 5000" and "Connected to PostgreSQL database"

### 3. Frontend Setup
- [ ] Frontend dependencies installed (`npm install`)
- [ ] `.env` file exists in root folder
- [ ] `REACT_APP_API_URL` is set to `http://localhost:5000`
- [ ] Frontend starts without errors

**Test Command:**
```bash
npm start
```
**Expected**: Opens browser at http://localhost:3000

## 🧪 Feature Testing

### Statistics Dashboard (`/statistics`)

#### Visual Checks
- [ ] Page loads without errors
- [ ] Summary cards show numbers (not 0 or "Loading...")
- [ ] Charts are visible and populated with data
- [ ] Regional distribution chart shows bars
- [ ] Growth trend line chart shows data
- [ ] Sector pie chart shows segments
- [ ] Gender distribution pie chart shows data
- [ ] Business size bar chart shows data
- [ ] Regional statistics table has rows

#### Functionality Checks
- [ ] Filter buttons work (All Regions, This Year, This Quarter)
- [ ] Clicking filters updates data
- [ ] No console errors in browser

#### Export Functionality
- [ ] "Export as CSV" button works
  - [ ] File downloads
  - [ ] File opens in Excel/text editor
  - [ ] Contains SME data
  
- [ ] "Export as Excel" button works
  - [ ] File downloads
  - [ ] File opens in Excel
  - [ ] Has multiple sheets (SME Directory, Statistics)
  - [ ] Data is formatted correctly
  
- [ ] "Export as PDF" button works
  - [ ] File downloads
  - [ ] File opens in PDF reader
  - [ ] Contains formatted report
  - [ ] Has statistics and charts

**API Test:**
```bash
curl http://localhost:5000/api/statistics/summary
```
**Expected**: JSON with totalSMEs, totalInvestors, etc.

### User Dashboard (`/dashboard`)

#### Visual Checks
- [ ] Welcome message displays
- [ ] Platform statistics cards show numbers
- [ ] Registration status badge shows
- [ ] Quick statistics display
- [ ] Profile completion bar shows percentage
- [ ] Recent activity list shows items

#### Functionality Checks
- [ ] All navigation links work
- [ ] Action cards are clickable
- [ ] No console errors

**API Test:**
```bash
curl http://localhost:5000/api/dashboard/user@example.com
```
**Expected**: JSON with user dashboard data

### Investment Opportunities (`/investments`)

#### Visual Checks
- [ ] Page loads with opportunities
- [ ] Opportunity cards display
- [ ] Images load (if available)
- [ ] Investment details show
- [ ] JESMIKE information section displays

#### Functionality Checks
- [ ] Search box filters opportunities
- [ ] Sector dropdown filters work
- [ ] Country dropdown filters work
- [ ] Stage dropdown filters work
- [ ] Results count updates with filters
- [ ] "Express Interest" buttons are clickable
- [ ] "View Details" buttons are clickable

**API Test:**
```bash
curl http://localhost:5000/api/investment-opportunities
```
**Expected**: JSON array of opportunities

## 🔍 Database Verification

### Check Tables Exist
```sql
psql -U jsmike -d postgres

\dt

-- Should show:
-- smes
-- investors
-- investment_deals
-- investment_opportunities
```

### Check Sample Data
```sql
-- Check SMEs
SELECT COUNT(*) FROM smes;
-- Expected: 5 or more

-- Check Investors
SELECT COUNT(*) FROM investors;
-- Expected: 3 or more

-- Check Deals
SELECT COUNT(*) FROM investment_deals;
-- Expected: 3 or more

-- Check Opportunities
SELECT COUNT(*) FROM investment_opportunities;
-- Expected: 0 or more

-- View sample SME
SELECT business_name, region, industry_sector FROM smes LIMIT 1;
```

### Check Relationships
```sql
-- Check SME with deals
SELECT 
  s.business_name,
  COUNT(id.id) as deal_count
FROM smes s
LEFT JOIN investment_deals id ON s.id = id.sme_id
GROUP BY s.business_name;
```

## 🌐 API Endpoint Testing

### Statistics Endpoints
```bash
# Summary
curl http://localhost:5000/api/statistics/summary
# Expected: JSON with platform stats

# Regions
curl http://localhost:5000/api/statistics/regions
# Expected: Array of regions with SME counts

# Sectors
curl http://localhost:5000/api/statistics/sectors
# Expected: Array of sectors with counts

# Growth
curl http://localhost:5000/api/statistics/growth
# Expected: Array of monthly data

# Gender
curl http://localhost:5000/api/statistics/gender
# Expected: Array of gender distribution

# Size
curl http://localhost:5000/api/statistics/size
# Expected: Array of business sizes
```

### Dashboard Endpoints
```bash
# User dashboard
curl http://localhost:5000/api/dashboard/user@example.com
# Expected: User dashboard data

# Activities
curl http://localhost:5000/api/activities/user@example.com
# Expected: Array of activities

# Summary
curl http://localhost:5000/api/dashboard/summary
# Expected: Platform summary stats
```

### Export Endpoints
```bash
# CSV (save to file)
curl http://localhost:5000/api/export/csv -o test.csv
# Check: test.csv file created

# Excel (save to file)
curl http://localhost:5000/api/export/excel -o test.xlsx
# Check: test.xlsx file created

# PDF (save to file)
curl http://localhost:5000/api/export/pdf -o test.pdf
# Check: test.pdf file created
```

## 🐛 Common Issues & Solutions

### Issue: Backend won't start
**Symptoms:**
- Error: "Cannot find module 'pg'"
- Error: "Port 5000 already in use"

**Solutions:**
```bash
# Install dependencies
cd backend
npm install

# Check if port is in use
netstat -ano | findstr :5000

# Kill process using port (if needed)
taskkill /PID <PID> /F
```

### Issue: Database connection fails
**Symptoms:**
- Error: "password authentication failed"
- Error: "database does not exist"

**Solutions:**
```bash
# Check PostgreSQL is running
pg_isready -U jsmike

# Verify credentials
psql -U jsmike -d postgres

# Check .env file
cat backend/.env
```

### Issue: Frontend can't connect to backend
**Symptoms:**
- Network errors in console
- "Loading..." never completes
- Export buttons don't work

**Solutions:**
```bash
# Check backend is running
curl http://localhost:5000/api/statistics/summary

# Check .env file
cat .env

# Should have:
# REACT_APP_API_URL=http://localhost:5000

# Restart frontend
npm start
```

### Issue: Export buttons don't work
**Symptoms:**
- Nothing happens when clicking
- Error in console

**Solutions:**
1. Ensure backend is running
2. Check browser console for errors
3. Try CSV export (has fallback)
4. Check backend logs for errors

### Issue: No data showing
**Symptoms:**
- Charts are empty
- Tables have no rows
- Counts show 0

**Solutions:**
```sql
-- Check if data exists
psql -U jsmike -d postgres
SELECT COUNT(*) FROM smes;

-- If 0, reload sample data
\i backend/database/schema.sql
```

## ✅ Final Verification

### All Systems Go Checklist
- [ ] PostgreSQL is running and accessible
- [ ] Backend server is running on port 5000
- [ ] Frontend is running on port 3000
- [ ] Statistics Dashboard shows real data
- [ ] User Dashboard displays correctly
- [ ] Investment Opportunities load
- [ ] CSV export works
- [ ] Excel export works
- [ ] PDF export works
- [ ] No errors in browser console
- [ ] No errors in backend console
- [ ] Database has sample data

### Performance Check
- [ ] Pages load in < 2 seconds
- [ ] API responses in < 500ms
- [ ] Charts render smoothly
- [ ] Exports complete in < 5 seconds

### Browser Compatibility
- [ ] Works in Chrome
- [ ] Works in Firefox
- [ ] Works in Edge
- [ ] Works in Safari (if available)

## 📊 Success Metrics

If you can check all these boxes, your system is fully operational:

✅ **Database**: Connected and populated  
✅ **Backend**: Running and responding  
✅ **Frontend**: Loading and displaying data  
✅ **Statistics**: Real-time data from database  
✅ **Dashboard**: User-specific information  
✅ **Opportunities**: Dynamic listings  
✅ **Exports**: All formats working  
✅ **Performance**: Fast and responsive  
✅ **Errors**: None in console  

## 🎉 Congratulations!

If all checks pass, your SME Platform is fully connected to the database and ready to use!

## 📞 Need Help?

If any checks fail:
1. Review the error messages
2. Check the troubleshooting section
3. Consult DATABASE_SETUP.md
4. Review QUICK_START.md
5. Check backend and frontend logs

---

**Verification Date**: _____________  
**Verified By**: _____________  
**Status**: ⬜ Pass  ⬜ Fail  
**Notes**: _____________