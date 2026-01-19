# Simple Database Authentication Fix
# Step-by-step database setup on VM

param(
    [string]$VMHost = "hydraa-vm",
    [string]$KeyPath = "$HOME/Downloads/hydraa-vm-key.pem"
)

Write-Host "🔧 Setting up database authentication on VM..." -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan

# Function to run SSH command
function Invoke-SSHCommand {
    param([string]$Command)
    $result = ssh -i $KeyPath -o StrictHostKeyChecking=no "hydraauser@${VMHost}" $Command 2>&1
    return $result
}

# 1. Check PostgreSQL status
Write-Host "`n1. Checking PostgreSQL..." -ForegroundColor Yellow
$pgStatus = Invoke-SSHCommand "sudo systemctl status postgresql --no-pager | grep 'Active:'"
if ($pgStatus -match "running") {
    Write-Host "✅ PostgreSQL is running" -ForegroundColor Green
} else {
    Write-Host "❌ Starting PostgreSQL..." -ForegroundColor Red
    Invoke-SSHCommand "sudo systemctl start postgresql"
    Start-Sleep -Seconds 2
}

# 2. Create database if it doesn't exist
Write-Host "`n2. Ensuring database 'hydraa' exists..." -ForegroundColor Yellow
$dbCheck = Invoke-SSHCommand "sudo -u postgres psql -lqt | grep hydraa"
if ($dbCheck -match "hydraa") {
    Write-Host "✅ Database 'hydraa' exists" -ForegroundColor Green
} else {
    Write-Host "❌ Creating database 'hydraa'..." -ForegroundColor Red
    Invoke-SSHCommand "sudo -u postgres createdb hydraa"
}

# 3. Create user if it doesn't exist
Write-Host "`n3. Ensuring user 'hydraa_user' exists..." -ForegroundColor Yellow
$userCheck = Invoke-SSHCommand "sudo -u postgres psql -tAc 'SELECT 1 FROM pg_roles WHERE rolname=''hydraa_user'';'"
if ($userCheck -match "1") {
    Write-Host "✅ User 'hydraa_user' exists" -ForegroundColor Green
} else {
    Write-Host "❌ Creating user 'hydraa_user'..." -ForegroundColor Red
    Invoke-SSHCommand "sudo -u postgres psql -c 'CREATE USER hydraa_user WITH PASSWORD ''hydraa_password'';'"
}

# 4. Grant permissions
Write-Host "`n4. Granting permissions..." -ForegroundColor Yellow
Invoke-SSHCommand "sudo -u postgres psql -c 'GRANT ALL PRIVILEGES ON DATABASE hydraa TO hydraa_user;'"
Invoke-SSHCommand "sudo -u postgres psql -d hydraa -c 'GRANT ALL ON SCHEMA public TO hydraa_user;'"
Invoke-SSHCommand "sudo -u postgres psql -d hydraa -c 'GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO hydraa_user;'"
Invoke-SSHCommand "sudo -u postgres psql -d hydraa -c 'GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO hydraa_user;'"
Write-Host "✅ Permissions granted" -ForegroundColor Green

# 5. Test connection
Write-Host "`n5. Testing database connection..." -ForegroundColor Yellow
$testConn = Invoke-SSHCommand "PGPASSWORD=hydraa_password psql -h localhost -U hydraa_user -d hydraa -c 'SELECT 1;' 2>&1"
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Database connection successful!" -ForegroundColor Green
} else {
    Write-Host "❌ Connection test failed:" -ForegroundColor Red
    Write-Host $testConn -ForegroundColor Red
}

# 6. Restart application
Write-Host "`n6. Restarting application..." -ForegroundColor Yellow
Invoke-SSHCommand "pm2 restart hydraa 2>/dev/null || (pm2 stop hydraa 2>/dev/null; pm2 start ecosystem.config.js 2>/dev/null) || echo 'PM2 restart attempted'"

Write-Host "`n🎉 Database setup complete!" -ForegroundColor Cyan
Write-Host "`nTest your application at: https://hydraa.eastasia.cloudapp.azure.com/auth/signin" -ForegroundColor White
Write-Host "`nCheck application status:" -ForegroundColor White
Write-Host "ssh -i $KeyPath hydraauser@${VMHost} 'pm2 status'" -ForegroundColor White