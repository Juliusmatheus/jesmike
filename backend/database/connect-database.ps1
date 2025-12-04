# PostgreSQL Database Connection Script
# For: jsmike/postgres@PostgreSQL 18

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SME Platform - Database Connection" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# PostgreSQL connection details
$DB_USER = "jsmike"
$DB_NAME = "postgres"
$DB_HOST = "localhost"
$DB_PORT = "5432"

Write-Host "Database: $DB_NAME" -ForegroundColor Yellow
Write-Host "User: $DB_USER" -ForegroundColor Yellow
Write-Host "Host: $DB_HOST" -ForegroundColor Yellow
Write-Host "Port: $DB_PORT" -ForegroundColor Yellow
Write-Host ""

# Common PostgreSQL installation paths
$pgPaths = @(
    "C:\Program Files\PostgreSQL\18\bin\psql.exe",
    "C:\Program Files\PostgreSQL\17\bin\psql.exe",
    "C:\Program Files\PostgreSQL\16\bin\psql.exe",
    "C:\Program Files\PostgreSQL\15\bin\psql.exe",
    "C:\Program Files (x86)\PostgreSQL\18\bin\psql.exe",
    "C:\PostgreSQL\18\bin\psql.exe"
)

# Find psql.exe
$psqlPath = $null
foreach ($path in $pgPaths) {
    if (Test-Path $path) {
        $psqlPath = $path
        Write-Host "Found PostgreSQL at: $path" -ForegroundColor Green
        break
    }
}

if (-not $psqlPath) {
    Write-Host "PostgreSQL psql.exe not found in common locations." -ForegroundColor Red
    Write-Host ""
    Write-Host "Please provide the full path to psql.exe:" -ForegroundColor Yellow
    Write-Host "Example: C:\Program Files\PostgreSQL\18\bin\psql.exe" -ForegroundColor Gray
    Write-Host ""
    $psqlPath = Read-Host "Enter path to psql.exe"
    
    if (-not (Test-Path $psqlPath)) {
        Write-Host "Error: psql.exe not found at specified path!" -ForegroundColor Red
        Write-Host ""
        Write-Host "Alternative: Run this command manually in your PostgreSQL terminal:" -ForegroundColor Yellow
        Write-Host "psql -U jsmike -d postgres -f schema.sql" -ForegroundColor White
        pause
        exit 1
    }
}

Write-Host ""
Write-Host "Connecting to database..." -ForegroundColor Cyan

# Prompt for password
Write-Host ""
Write-Host "Enter password for user '$DB_USER':" -ForegroundColor Yellow
$password = Read-Host -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($password)
$plainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

# Set environment variable for password
$env:PGPASSWORD = $plainPassword

Write-Host ""
Write-Host "Testing connection..." -ForegroundColor Cyan

# Test connection
$testResult = & $psqlPath -U $DB_USER -d $DB_NAME -h $DB_HOST -p $DB_PORT -c "SELECT version();" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Connection successful!" -ForegroundColor Green
    Write-Host ""
    
    # Ask if user wants to run schema
    Write-Host "Do you want to create/update the database schema now? (Y/N)" -ForegroundColor Yellow
    $response = Read-Host
    
    if ($response -eq "Y" -or $response -eq "y") {
        Write-Host ""
        Write-Host "Running schema.sql..." -ForegroundColor Cyan
        
        $schemaPath = Join-Path $PSScriptRoot "schema.sql"
        
        if (Test-Path $schemaPath) {
            & $psqlPath -U $DB_USER -d $DB_NAME -h $DB_HOST -p $DB_PORT -f $schemaPath
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host ""
                Write-Host "✓ Schema created/updated successfully!" -ForegroundColor Green
                Write-Host ""
                
                # Check tables
                Write-Host "Checking created tables..." -ForegroundColor Cyan
                & $psqlPath -U $DB_USER -d $DB_NAME -h $DB_HOST -p $DB_PORT -c "\dt"
                
                Write-Host ""
                Write-Host "Checking sample data..." -ForegroundColor Cyan
                & $psqlPath -U $DB_USER -d $DB_NAME -h $DB_HOST -p $DB_PORT -c "SELECT COUNT(*) as sme_count FROM smes;"
                
            } else {
                Write-Host ""
                Write-Host "✗ Error running schema!" -ForegroundColor Red
            }
        } else {
            Write-Host "Error: schema.sql not found at $schemaPath" -ForegroundColor Red
        }
    }
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Database Setup Complete!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Update backend/.env with your database password" -ForegroundColor White
    Write-Host "2. Start the backend server: cd backend && npm run dev" -ForegroundColor White
    Write-Host "3. Start the frontend: npm start" -ForegroundColor White
    Write-Host ""
    
} else {
    Write-Host ""
    Write-Host "✗ Connection failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error details:" -ForegroundColor Yellow
    Write-Host $testResult -ForegroundColor Red
    Write-Host ""
    Write-Host "Please check:" -ForegroundColor Yellow
    Write-Host "1. PostgreSQL service is running" -ForegroundColor White
    Write-Host "2. Username and password are correct" -ForegroundColor White
    Write-Host "3. Database 'postgres' exists" -ForegroundColor White
}

# Clear password from environment
$env:PGPASSWORD = ""

Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")