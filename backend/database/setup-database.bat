@echo off
echo ========================================
echo SME Platform - Database Setup
echo ========================================
echo.
echo Database: postgres
echo User: jsmike
echo Host: localhost
echo Port: 5432
echo.
echo This script will create/update the database schema.
echo.
pause

echo.
echo Connecting to PostgreSQL...
echo.

REM Try to run psql with schema file
psql -U jsmike -d postgres -f schema.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo SUCCESS! Database schema created/updated
    echo ========================================
    echo.
    echo Checking tables...
    psql -U jsmike -d postgres -c "\dt"
    echo.
    echo Checking sample data...
    psql -U jsmike -d postgres -c "SELECT COUNT(*) as sme_count FROM smes;"
    echo.
    echo ========================================
    echo Next Steps:
    echo ========================================
    echo 1. Update backend/.env with your database password
    echo 2. Start backend: cd backend ^&^& npm run dev
    echo 3. Start frontend: npm start
    echo.
) else (
    echo.
    echo ========================================
    echo ERROR: Failed to connect to database
    echo ========================================
    echo.
    echo Please check:
    echo 1. PostgreSQL service is running
    echo 2. Username 'jsmike' exists
    echo 3. Database 'postgres' exists
    echo 4. You have the correct password
    echo.
    echo You can also run this command manually:
    echo psql -U jsmike -d postgres -f schema.sql
    echo.
)

echo.
pause