# SME Platform - Database Setup Guide

## Overview
This guide will help you connect your SME Platform to PostgreSQL database and enable all database-driven features.

## Database Connection Details
Based on your PostgreSQL setup:
- **Host**: localhost
- **Port**: 5432
- **Database**: postgres
- **User**: jsmike
- **Schema**: public.investors

## Prerequisites
- PostgreSQL 18 installed and running
- Node.js (v14 or higher)
- npm or yarn package manager

## Step-by-Step Setup

### 1. Configure Database Connection

Update the backend `.env` file with your database password:

```bash
cd backend
```

Edit `backend/.env`:
```env
DB_PASSWORD=your_actual_postgres_password
PORT=5000
NODE_ENV=development
```

### 2. Create Database Schema

Connect to your PostgreSQL database:
```bash
psql -U jsmike -d postgres
```

Run the schema file:
```sql
\i backend/database/schema.sql
```

Or manually execute:
```bash
psql -U jsmike -d postgres -f backend/database/schema.sql
```

### 3. Install Backend Dependencies

```bash
cd backend
npm install
```

This will install:
- express (API server)
- pg (PostgreSQL client)
- cors (Cross-origin requests)
- dotenv (Environment variables)
- exceljs (Excel export)
- pdfkit (PDF export)

### 4. Start the Backend Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will start on `http://localhost:5000`

### 5. Start the Frontend

In the main project directory:
```bash
npm start
```

The React app will start on `http://localhost:3000`

## Database Tables Created

### 1. **smes** - SME Business Information
- Business details (name, registration, owner)
- Contact information (email, phone, address)
- Business metrics (employees, turnover, sector)
- Status tracking

### 2. **investors** - Investor Information
- Investor details and type
- Investment focus and capacity
- Sectors of interest

### 3. **investment_deals** - Investment Transactions
- Deal information and amounts
- Equity percentages
- Deal status tracking

### 4. **investment_opportunities** - Open Opportunities
- Funding requirements
- Equity offered
- Expected ROI
- Investment timeline

## API Endpoints

### Statistics Dashboard
- `GET /api/statistics/summary` - Overall platform statistics
- `GET /api/statistics/regions` - Regional distribution
- `GET /api/statistics/sectors` - Sector breakdown
- `GET /api/statistics/growth` - Monthly growth trends
- `GET /api/statistics/gender` - Gender distribution
- `GET /api/statistics/size` - Business size distribution

### Dashboard
- `GET /api/dashboard/:userId` - User dashboard data
- `GET /api/activities/:userId` - User activity feed
- `GET /api/dashboard/summary` - Platform summary stats

### Investment Opportunities
- `GET /api/investment-opportunities` - List all opportunities
- `POST /api/investment-opportunities` - Create new opportunity

### Export Functions
- `GET /api/export/csv` - Export data as CSV
- `GET /api/export/excel` - Export data as Excel
- `GET /api/export/pdf` - Export data as PDF

## Features Connected to Database

### ✅ Statistics Dashboard
- Real-time platform statistics
- Regional and sector analytics
- Growth trends and charts
- Export functionality (CSV, Excel, PDF)

### ✅ User Dashboard
- User-specific statistics
- Activity feed
- Registration status
- Profile completion tracking

### ✅ Investment Opportunities
- Dynamic opportunity listings
- Filtering and search
- Real-time data from database

## Sample Data

The schema includes sample data for testing:
- 5 SME businesses across different sectors
- 3 investors (including JESMIKE)
- 3 investment deals
- Various regions and sectors

## Troubleshooting

### Connection Errors
```
Error: connect ECONNREFUSED
```
**Solution**: Ensure PostgreSQL is running
```bash
# Windows
net start postgresql-x64-18

# Check status
pg_isready -U jsmike
```

### Authentication Failed
```
Error: password authentication failed
```
**Solution**: Update password in `backend/.env` file

### Port Already in Use
```
Error: Port 5000 is already in use
```
**Solution**: Change port in `backend/.env` or stop the conflicting process

### Database Does Not Exist
```
Error: database "postgres" does not exist
```
**Solution**: Create the database
```bash
createdb -U jsmike postgres
```

## Testing the Connection

### Test Backend API
```bash
# Test if backend is running
curl http://localhost:5000/api/statistics/summary

# Should return JSON with statistics
```

### Test Database Connection
```bash
# Connect to database
psql -U jsmike -d postgres

# Check tables
\dt

# Check sample data
SELECT COUNT(*) FROM smes;
```

## Adding More Data

### Add SME
```sql
INSERT INTO smes (
  business_name, 
  registration_number, 
  owner_name, 
  owner_gender, 
  email, 
  phone, 
  region, 
  city, 
  industry_sector, 
  employees, 
  annual_turnover, 
  established_date
) VALUES (
  'Your Business Name',
  'SME007',
  'Owner Name',
  'M',
  'email@example.com',
  '+264811234567',
  'Khomas',
  'Windhoek',
  'Technology',
  10,
  500000.00,
  '2023-01-01'
);
```

### Add Investment Opportunity
```sql
INSERT INTO investment_opportunities (
  sme_id,
  title,
  description,
  funding_required,
  equity_offered,
  use_of_funds,
  expected_roi,
  investment_timeline
) VALUES (
  1,
  'Expansion Funding',
  'Seeking investment for business expansion',
  1000000.00,
  15.0,
  'Equipment purchase and hiring',
  25.0,
  '12-18 months'
);
```

## Security Considerations

1. **Never commit `.env` files** - Already in `.gitignore`
2. **Use strong passwords** for database
3. **Enable SSL** for production database connections
4. **Implement authentication** for API endpoints
5. **Validate all inputs** before database queries
6. **Use parameterized queries** (already implemented)

## Production Deployment

For production deployment:

1. Use environment variables for all sensitive data
2. Enable PostgreSQL SSL connections
3. Set up database backups
4. Use connection pooling (already configured)
5. Implement rate limiting on API endpoints
6. Add authentication middleware
7. Use HTTPS for all connections

## Support

If you encounter issues:
1. Check PostgreSQL logs
2. Check backend console for errors
3. Verify database credentials
4. Ensure all tables are created
5. Check network connectivity

## Next Steps

1. ✅ Database connected
2. ✅ Sample data loaded
3. ✅ API endpoints working
4. ✅ Frontend connected
5. ✅ Export functionality enabled

Now you can:
- View real-time statistics
- Export data in multiple formats
- Track user activities
- Manage investment opportunities
- Monitor platform growth

Happy coding! 🚀