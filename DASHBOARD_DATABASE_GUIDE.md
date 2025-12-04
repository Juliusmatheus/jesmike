# 📊 Dashboard Database Integration Guide

## ✅ Dashboard is Already Connected!

Your Dashboard component is **already configured** to pull data from the PostgreSQL database. Here's how it works:

## 🔄 Data Flow

```
User visits /dashboard
    ↓
Frontend (Dashboard.js) makes API calls
    ↓
Backend (server.js) queries PostgreSQL
    ↓
Data returned to frontend
    ↓
Dashboard displays real-time data
```

## 📡 API Endpoints Used by Dashboard

### 1. Platform Summary
```
GET /api/dashboard/summary
```

**Returns:**
```json
{
  "activeSMEs": 5,
  "totalInvestors": 3,
  "completedDeals": 3,
  "openOpportunities": 0
}
```

**Database Query:**
```sql
SELECT COUNT(*) FROM smes WHERE status = 'active';
SELECT COUNT(*) FROM investors WHERE status = 'active';
SELECT COUNT(*) FROM investment_deals WHERE status = 'completed';
SELECT COUNT(*) FROM investment_opportunities WHERE status = 'open';
```

### 2. User Dashboard
```
GET /api/dashboard/:userId
```

**Example:** `GET /api/dashboard/user@example.com`

**Returns:**
```json
{
  "registrationStatus": "Approved",
  "investmentOpportunities": 2,
  "messages": 0,
  "profileCompletion": 85,
  "businessName": "My Business",
  "registrationNumber": "SME001"
}
```

**Database Query:**
```sql
SELECT 
  business_name,
  registration_number,
  status,
  email
FROM smes
WHERE email = 'user@example.com';
```

### 3. User Activities
```
GET /api/activities/:userId
```

**Returns:**
```json
[
  {
    "type": "investment_deal",
    "title": "Investment Deal",
    "description": "Investment of NAD 150,000 received",
    "date": "2023-11-28",
    "icon": "💰"
  },
  {
    "type": "opportunity",
    "title": "Investment Opportunity",
    "description": "Posted opportunity: Expansion Funding",
    "date": "2023-11-27",
    "icon": "📈"
  }
]
```

**Database Query:**
```sql
SELECT 
  'investment_deal' as type,
  'Investment Deal' as title,
  'Investment of NAD ' || investment_amount || ' received' as description,
  deal_date as date,
  '💰' as icon
FROM investment_deals id
JOIN smes s ON id.sme_id = s.id
WHERE s.email = 'user@example.com'
AND id.status = 'completed'
ORDER BY date DESC
LIMIT 10;
```

## 🎯 What Dashboard Shows

### Platform Statistics Cards
- **Active SMEs** - Count from `smes` table where `status = 'active'`
- **JESMIKE Investors** - Count from `investors` table
- **Completed Deals** - Count from `investment_deals` table
- **Open Opportunities** - Count from `investment_opportunities` table

### User-Specific Data
- **Registration Status** - From `smes.status` (pending/active/rejected)
- **Business Name** - From `smes.business_name`
- **Registration Number** - From `smes.registration_number`
- **Profile Completion** - Calculated based on filled fields
- **Investment Opportunities** - Count of user's opportunities

### Activity Feed
- **Investment Deals** - Recent deals from database
- **Opportunities Posted** - User's posted opportunities
- **Profile Updates** - Recent profile changes

## 🧪 Test Dashboard Connection

### Step 1: Ensure Backend is Running
```bash
cd backend
npm run dev
```

**Expected output:**
```
Server running on port 5000
Connected to PostgreSQL database
```

### Step 2: Test API Endpoints

#### Test Platform Summary:
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/dashboard/summary"
```

**Expected:**
```json
{
  "activeSMEs": 5,
  "totalInvestors": 3,
  "completedDeals": 3,
  "openOpportunities": 0
}
```

#### Test User Dashboard:
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/dashboard/user@example.com"
```

#### Test Activities:
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/activities/user@example.com"
```

### Step 3: View Dashboard
1. Open: http://localhost:3000/dashboard
2. Should see real data from database
3. Platform statistics should show actual counts
4. Activity feed should load

## 🔧 Troubleshooting

### Issue: Dashboard shows "Loading..." forever

**Cause:** Backend not running or not connected to database

**Solution:**
```bash
# Check if backend is running
curl http://localhost:5000/api/dashboard/summary

# If not, start it
cd backend
npm run dev
```

### Issue: Dashboard shows fallback data

**Cause:** API calls failing, using fallback data

**Solution:**
1. Check browser console (F12) for errors
2. Verify backend is running on port 5000
3. Check backend console for database errors
4. Verify database credentials in `backend/.env`

### Issue: 500 Internal Server Error

**Cause:** Database query error

**Solution:**
```bash
# Check backend console for error details
# Common issues:
# 1. Column doesn't exist
# 2. Table doesn't exist
# 3. Permission denied

# Verify tables exist:
psql -U jsmike -d postgres -c "\dt"

# Verify data exists:
psql -U jsmike -d postgres -c "SELECT COUNT(*) FROM smes;"
```

### Issue: No user data showing

**Cause:** User email not in database

**Solution:**
```sql
-- Check if user exists
SELECT * FROM smes WHERE email = 'user@example.com';

-- If not, register through the form or insert manually:
INSERT INTO smes (
  business_name,
  owner_name,
  email,
  phone,
  region,
  industry_sector,
  established_date,
  status
) VALUES (
  'Demo Business',
  'Demo User',
  'user@example.com',
  '+264811234567',
  'Khomas',
  'Technology',
  '2020-01-01',
  'active'
);
```

## 📊 Database Queries Used

### Get Platform Summary:
```sql
-- Active SMEs
SELECT COUNT(*) as count FROM smes WHERE status = 'active';

-- Total Investors
SELECT COUNT(*) as count FROM investors WHERE status = 'active';

-- Completed Deals
SELECT COUNT(*) as count FROM investment_deals WHERE status = 'completed';

-- Open Opportunities
SELECT COUNT(*) as count FROM investment_opportunities WHERE status = 'open';
```

### Get User Dashboard:
```sql
SELECT 
  business_name,
  registration_number,
  status,
  email
FROM smes
WHERE email = $1
LIMIT 1;
```

### Get User Activities:
```sql
-- Investment Deals
SELECT 
  'investment_deal' as type,
  'Investment Deal' as title,
  'Investment of NAD ' || investment_amount || ' received' as description,
  deal_date as date,
  '💰' as icon
FROM investment_deals id
JOIN smes s ON id.sme_id = s.id
WHERE s.email = $1
AND id.status = 'completed'

UNION ALL

-- Opportunities
SELECT 
  'opportunity' as type,
  'Investment Opportunity' as title,
  'Posted opportunity: ' || title as description,
  created_at as date,
  '📈' as icon
FROM investment_opportunities io
JOIN smes s ON io.sme_id = s.id
WHERE s.email = $1

ORDER BY date DESC
LIMIT 10;
```

## 🎨 Dashboard Features

### Real-Time Data
- ✅ Platform statistics update from database
- ✅ User-specific data loads dynamically
- ✅ Activity feed shows recent actions
- ✅ Registration status reflects database state

### Fallback Mechanism
- ✅ If API fails, shows sample data
- ✅ User experience not broken
- ✅ Error logged to console
- ✅ Retry on page refresh

### Loading States
- ✅ Shows "Loading..." while fetching
- ✅ Smooth transition to data
- ✅ Loading indicators on cards

## 🔄 How to Update Dashboard Data

### Add New SME (Updates Platform Stats):
```sql
INSERT INTO smes (
  business_name,
  owner_name,
  email,
  phone,
  region,
  industry_sector,
  established_date,
  status
) VALUES (
  'New Business',
  'Owner Name',
  'new@business.com',
  '+264811234567',
  'Khomas',
  'Agriculture',
  '2020-01-01',
  'active'
);
```

Refresh dashboard → Active SMEs count increases

### Add Investment Deal (Updates Activity Feed):
```sql
INSERT INTO investment_deals (
  sme_id,
  investor_id,
  investment_amount,
  equity_percentage,
  deal_type,
  status,
  deal_date
) VALUES (
  1,
  1,
  500000.00,
  10.0,
  'equity',
  'completed',
  CURRENT_DATE
);
```

Refresh dashboard → New activity appears

### Change Registration Status:
```sql
UPDATE smes 
SET status = 'active' 
WHERE email = 'user@example.com';
```

Refresh dashboard → Status badge updates

## ✅ Verification Checklist

- [ ] Backend server is running
- [ ] Database is connected
- [ ] Can access: http://localhost:5000/api/dashboard/summary
- [ ] Dashboard page loads: http://localhost:3000/dashboard
- [ ] Platform statistics show numbers (not 0)
- [ ] No errors in browser console
- [ ] No errors in backend console

## 📝 Quick Reference

### Start Everything:
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
npm start
```

### Test Dashboard API:
```bash
curl http://localhost:5000/api/dashboard/summary
```

### Check Database:
```bash
psql -U jsmike -d postgres
SELECT COUNT(*) FROM smes WHERE status = 'active';
\q
```

### View Dashboard:
```
http://localhost:3000/dashboard
```

## 🎯 Summary

✅ **Dashboard Component**: Already connected to database  
✅ **API Endpoints**: 3 endpoints serving dashboard data  
✅ **Database Queries**: Optimized queries for performance  
✅ **Real-Time Data**: Updates from PostgreSQL  
✅ **Fallback Data**: Graceful error handling  
✅ **User-Specific**: Personalized dashboard per user  

**Your Dashboard is pulling data from the database!** 🎉

Just make sure:
1. Backend is running (`npm run dev` in backend folder)
2. Database is connected (check backend console)
3. Visit http://localhost:3000/dashboard

---

**Database**: jsmike/postgres@PostgreSQL 18  
**Status**: ✅ Connected  
**Last Updated**: November 28, 2025