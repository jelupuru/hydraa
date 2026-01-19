# VM Database Import Verification Script (PowerShell)
# Run this after completing the import process to verify success

param(
    [string]$VMHost = "hydraa-vm",
    [string]$KeyPath = "$HOME/Downloads/hydraa-vm-key.pem"
)

Write-Host "🔍 Verifying VM Database Import..." -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

# Test SSH connection
Write-Host "`n1. Testing SSH connection..." -ForegroundColor Yellow
$testConnection = ssh -i $KeyPath -o StrictHostKeyChecking=no $VMHost "echo 'SSH connection successful'" 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ SSH connection successful" -ForegroundColor Green
} else {
    Write-Host "❌ SSH connection failed" -ForegroundColor Red
    Write-Host "Please check your SSH key path and VM hostname/IP" -ForegroundColor Red
    exit 1
}

# Test database connection
Write-Host "`n2. Testing database connection..." -ForegroundColor Yellow
$dbTest = ssh -i $KeyPath -o StrictHostKeyChecking=no $VMHost "sudo -u postgres psql -d hydraa -c 'SELECT 1;' 2>/dev/null" 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Database connection successful" -ForegroundColor Green
} else {
    Write-Host "❌ Database connection failed" -ForegroundColor Red
    Write-Host "Please check if PostgreSQL is running and database exists" -ForegroundColor Red
    exit 1
}

# Check table record counts
Write-Host "`n3. Checking table record counts..." -ForegroundColor Yellow

$tables = @("User", "complaints", "templates", "blogs", "settings")
$totalRecords = 0

foreach ($table in $tables) {
    if ($table -eq "User") {
        # Handle quoted table name
        $count = ssh -i $KeyPath -o StrictHostKeyChecking=no $VMHost "sudo -u postgres psql -d hydraa -t -c 'SELECT COUNT(*) FROM \"$table\";' 2>/dev/null" 2>$null
    } else {
        $count = ssh -i $KeyPath -o StrictHostKeyChecking=no $VMHost "sudo -u postgres psql -d hydraa -t -c 'SELECT COUNT(*) FROM $table;' 2>/dev/null" 2>$null
    }

    $count = $count.Trim()
    if ($count -and [int]$count -gt 0) {
        Write-Host "✅ $table`: $count records" -ForegroundColor Green
        $totalRecords += [int]$count
    } else {
        Write-Host "⚠️  $table`: No records found or table doesn't exist" -ForegroundColor Yellow
    }
}

# Check database size
Write-Host "`n4. Database size information..." -ForegroundColor Yellow
$dbSize = ssh -i $KeyPath -o StrictHostKeyChecking=no $VMHost "sudo -u postgres psql -d hydraa -t -c 'SELECT pg_size_pretty(pg_database_size(''hydraa''));' 2>/dev/null" 2>$null
Write-Host "Database size: $dbSize" -ForegroundColor Green

# Summary
Write-Host "`n🎉 Verification complete!" -ForegroundColor Cyan
Write-Host "" -ForegroundColor Cyan

if ($totalRecords -gt 0) {
    Write-Host "✅ Import appears successful! ($totalRecords total records found)" -ForegroundColor Green
    Write-Host "" -ForegroundColor Green
    Write-Host "Next steps:" -ForegroundColor White
    Write-Host "- Start your application: ssh -i $KeyPath $VMHost 'pm2 start ecosystem.config.js'" -ForegroundColor White
    Write-Host "- Test the application functionality" -ForegroundColor White
    Write-Host "- Monitor logs for any issues" -ForegroundColor White
} else {
    Write-Host "⚠️  No records found. Import may have failed." -ForegroundColor Yellow
    Write-Host "Check the import logs and try again." -ForegroundColor Yellow
}