@echo off
echo ========================================
echo SME Platform - Database Initialization
echo ========================================
echo.

set /p DB_USER="Enter PostgreSQL username (default: jsmike): "
if "%DB_USER%"=="" set DB_USER=jsmike

set /p DB_NAME="Enter database name (default: postgres): "
if "%DB_NAME%"=="" set DB_NAME=postgres

echo.
echo Connecting to PostgreSQL and creating schema...
echo.

psql -U %DB_USER% -d %DB_NAME% -f schema.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo Database initialized successfully!
    echo ========================================
    echo.
    echo Tables created:
    echo - smes
    echo - investors
    echo - investment_deals
    echo - investment_opportunities
    echo.
    echo Sample data has been loaded.
    echo.
) else (
    echo.
    echo ========================================
    echo Error initializing database!
    echo ========================================
    echo.
    echo Please check:
    echo 1. PostgreSQL is running
    echo 2. Username and database name are correct
    echo 3. You have the correct permissions
    echo.
)

echo Press any key to exit...
pause > nul