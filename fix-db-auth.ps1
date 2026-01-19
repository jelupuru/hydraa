# Fix Database Authentication on VM
# This script diagnoses and fixes database connection issues

param(
    [string]$VMHost = "hydraa-vm",
    [string]$KeyPath = "$HOME/Downloads/hydraa-vm-key.pem"
)

Write-Host "🔍 Diagnosing database authentication issues..." -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan

# Test SSH connection first
Write-Host "`n1. Testing SSH connection..." -ForegroundColor Yellow
$sshTest = ssh -i $KeyPath -o StrictHostKeyChecking=no "hydraauser@${VMHost}" "echo 'SSH connection successful'" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ SSH connection failed. Check your key path and VM hostname." -ForegroundColor Red
    exit 1
}
Write-Host "✅ SSH connection successful" -ForegroundColor Green

# Check PostgreSQL status
Write-Host "`n2. Checking PostgreSQL status..." -ForegroundColor Yellow
$pgStatus = ssh -i $KeyPath -o StrictHostKeyChecking=no "hydraauser@${VMHost}" "sudo systemctl status postgresql --no-pager -l" 2>$null
if ($pgStatus -match "active \(running\)") {
    Write-Host "✅ PostgreSQL is running" -ForegroundColor Green
} else {
    Write-Host "❌ PostgreSQL is not running. Starting it..." -ForegroundColor Red
    ssh -i $KeyPath -o StrictHostKeyChecking=no "hydraauser@${VMHost}" "sudo systemctl start postgresql"
    Start-Sleep -Seconds 2
}

# Check if database exists
Write-Host "`n3. Checking if 'hydraa' database exists..." -ForegroundColor Yellow
$dbExists = ssh -i $KeyPath -o StrictHostKeyChecking=no "hydraauser@${VMHost}" "sudo -u postgres psql -lqt | cut -d\| -f1 | grep -qw hydraa && echo 'exists' || echo 'not found'" 2>$null
if ($dbExists -match "exists") {
    Write-Host "✅ Database 'hydraa' exists" -ForegroundColor Green
} else {
    Write-Host "❌ Database 'hydraa' not found. Creating it..." -ForegroundColor Red
    ssh -i $KeyPath -o StrictHostKeyChecking=no "hydraauser@${VMHost}" "sudo -u postgres createdb hydraa"
}

# Check if user exists
Write-Host "`n4. Checking if 'hydraa_user' exists..." -ForegroundColor Yellow
$userExists = ssh -i $KeyPath -o StrictHostKeyChecking=no "hydraauser@${VMHost}" "sudo -u postgres psql -tAc 'SELECT 1 FROM pg_roles WHERE rolname='\''hydraa_user'\'';' | grep -q 1 && echo 'exists' || echo 'not found'" 2>$null
if ($userExists -match "exists") {
    Write-Host "✅ User 'hydraa_user' exists" -ForegroundColor Green
} else {
    Write-Host "❌ User 'hydraa_user' not found. Creating it..." -ForegroundColor Red
    ssh -i $KeyPath -o StrictHostKeyChecking=no "hydraauser@${VMHost}" "sudo -u postgres psql -c 'CREATE USER hydraa_user WITH PASSWORD '\''hydraa_password'\'';'"
    ssh -i $KeyPath -o StrictHostKeyChecking=no "hydraauser@${VMHost}" "sudo -u postgres psql -c 'GRANT ALL PRIVILEGES ON DATABASE hydraa TO hydraa_user;'"
}

# Test database connection with the user
Write-Host "`n5. Testing database connection with hydraa_user..." -ForegroundColor Yellow
$connTest = ssh -i $KeyPath -o StrictHostKeyChecking=no "hydraauser@${VMHost}" "PGPASSWORD=hydraa_password psql -h localhost -U hydraa_user -d hydraa -c 'SELECT version();' 2>&1" 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Database connection successful with hydraa_user" -ForegroundColor Green
} else {
    Write-Host "❌ Database connection failed:" -ForegroundColor Red
    Write-Host $connTest -ForegroundColor Red
}

# Check current database content
Write-Host "`n6. Checking current database content..." -ForegroundColor Yellow
$tableCount = ssh -i $KeyPath -o StrictHostKeyChecking=no "hydraauser@${VMHost}" "sudo -u postgres psql -d hydraa -tAc 'SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='\''public'\'';' 2>/dev/null || echo '0'" 2>$null
Write-Host "Number of tables in database: $tableCount" -ForegroundColor Green

# Restart application
Write-Host "`n7. Restarting application..." -ForegroundColor Yellow
ssh -i $KeyPath -o StrictHostKeyChecking=no "hydraauser@${VMHost}" "pm2 restart hydraa 2>/dev/null || (pm2 stop hydraa 2>/dev/null; pm2 start ecosystem.config.js) || echo 'PM2 restart failed'" 2>$null

Write-Host "`n🎉 Database authentication fix complete!" -ForegroundColor Cyan
Write-Host "`nTest your application at: https://hydraa.eastasia.cloudapp.azure.com/auth/signin" -ForegroundColor White
Write-Host "`nIf issues persist, check application logs:" -ForegroundColor White
Write-Host "ssh -i $KeyPath hydraauser@${VMHost} 'pm2 logs hydraa --lines 20'" -ForegroundColor White