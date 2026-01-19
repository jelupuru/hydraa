# Quick Database Verification Script

param(
    [string]$VMHost = "hydraa-vm",
    [string]$KeyPath = "$HOME/Downloads/hydraa-vm-key.pem"
)

Write-Host "🔍 Quick Database Verification" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan

# Function to run SSH command
function Invoke-SSHCommand {
    param([string]$Command)
    ssh -i $KeyPath -o StrictHostKeyChecking=no "hydraauser@${VMHost}" $Command 2>&1
}

Write-Host "`n1. Testing database connection..." -ForegroundColor Yellow
$testResult = Invoke-SSHCommand "PGPASSWORD=hydraa_password psql -h localhost -U hydraa_user -d hydraa -c 'SELECT 1 as connection_test;'"
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Database connection successful!" -ForegroundColor Green
} else {
    Write-Host "❌ Database connection failed" -ForegroundColor Red
    Write-Host "Error: $testResult" -ForegroundColor Red
    Write-Host "`nRun the manual fix steps in MANUAL_DB_FIX.md" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n2. Checking database content..." -ForegroundColor Yellow
$tableCount = Invoke-SSHCommand "sudo -u postgres psql -d hydraa -tAc 'SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=''public'';'"
Write-Host "Tables in database: $tableCount" -ForegroundColor Green

$userCount = Invoke-SSHCommand "PGPASSWORD=hydraa_password psql -h localhost -U hydraa_user -d hydraa -tAc 'SELECT COUNT(*) FROM \`"`"User\`"`";' 2>/dev/null"
if ($userCount -match '\d+') {
    Write-Host "Users in database: $userCount" -ForegroundColor Green
} else {
    Write-Host "Users in database: 0 (no data imported yet)" -ForegroundColor Yellow
}

Write-Host "`n3. Checking application status..." -ForegroundColor Yellow
$appStatus = Invoke-SSHCommand "pm2 jlist | jq -r '.[] | select(.name==`"hydraa`") | .pm2_env.status' 2>/dev/null"
if ($appStatus -match "online") {
    Write-Host "✅ Application is running" -ForegroundColor Green
} else {
    Write-Host "⚠️ Application status: $appStatus" -ForegroundColor Yellow
}

Write-Host "`n🎉 Verification complete!" -ForegroundColor Cyan
Write-Host "`nIf database connection is successful, try logging in at:" -ForegroundColor White
Write-Host 'https://hydraa.eastasia.cloudapp.azure.com/auth/signin' -ForegroundColor White