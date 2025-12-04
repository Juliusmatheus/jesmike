# Database Setup Instructions

## Prerequisites
1. PostgreSQL 18 installed and running
2. Node.js installed
3. Access to your PostgreSQL database

## Setup Steps

### 1. Database Setup
```sql
-- Connect to your PostgreSQL database as user 'jsmike'
psql -U jsmike -d postgres

-- Run the schema file to create tables and sample data
\i backend/database/schema.sql
```

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Update the .env file with your actual database password
# Edit backend/.env and replace 'your_postgres_password' with your actual password

# Start the backend server
npm run dev
```

### 3. Frontend Setup
```bash
# In the main project directory
# Install any missing dependencies
npm install

# Start the React application
npm start
```

## Database Connection Details
- Host: localhost
- Port: 5432
- Database: postgres
- User: jsmike
- Schema: public.investors

## API Endpoints
The backend provides these endpoints for the StatisticsDashboard:

- `GET /api/statistics/summary` - Overall statistics
- `GET /api/statistics/regions` - SMEs by region
- `GET /api/statistics/sectors` - SMEs by industry sector
- `GET /api/statistics/growth` - Monthly growth trends
- `GET /api/statistics/gender` - Gender distribution
- `GET /api/statistics/size` - Business size distribution

## Troubleshooting
1. If you get connection errors, check your PostgreSQL service is running
2. Verify the database credentials in backend/.env
3. Make sure the database schema is created by running the SQL file
4. Check that both frontend (port 3000) and backend (port 5000) are running

## Export Functionality
The dashboard now supports exporting data in multiple formats:

### Export Features
- **CSV Export**: Complete SME directory with investment data
- **Excel Export**: Multi-sheet workbook with SME directory and statistics summary
- **PDF Export**: Formatted report with charts and statistics

### Export Endpoints
- `GET /api/export/csv` - Download CSV file
- `GET /api/export/excel` - Download Excel workbook
- `GET /api/export/pdf` - Download PDF report

### Export Dependencies
The backend requires additional packages for export functionality:
```bash
cd backend
npm install exceljs pdfkit
```

## Sample Data
The schema includes sample SME and investor data for testing. You can modify or add more data as needed.

## Export Data Structure
The exported files include:
- Business information (name, registration, owner details)
- Contact information (email, phone, address)
- Business metrics (employees, turnover, sector)
- Investment data (deals, amounts, investors)
- Regional and sector statistics