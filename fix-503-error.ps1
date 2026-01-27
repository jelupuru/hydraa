# Fix 503 Service Unavailable Error
# This script diagnoses and fixes the application service issues

param(
    [string]$VMHost = "hydraa-vm",
    [string]$KeyPath = "$HOME/Downloads/hydraa-vm-key.pem"
)

Write-Host "🚨 Diagnosing 503 Service Unavailable Error..." -ForegroundColor Red
Write-Host "==============================================" -ForegroundColor Red

function Invoke-SSHCommand {
    param([string]$Command)
    ssh -i $KeyPath -o StrictHostKeyChecking=no "hydraauser@${VMHost}" $Command 2>&1
}

# 1. Check if we can connect to VM
Write-Host "`n1. Testing VM connection..." -ForegroundColor Yellow
$vmTest = Invoke-SSHCommand "echo 'VM connection successful'"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Cannot connect to VM!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ VM connection successful" -ForegroundColor Green

# 2. Check nginx status
Write-Host "`n2. Checking nginx status..." -ForegroundColor Yellow
$nginxStatus = Invoke-SSHCommand "sudo systemctl status nginx --no-pager | grep 'Active:'"
if ($nginxStatus -match "running") {
    Write-Host "✅ Nginx is running" -ForegroundColor Green
} else {
    Write-Host "❌ Nginx is not running. Starting it..." -ForegroundColor Red
    Invoke-SSHCommand "sudo systemctl start nginx"
}

# 3. Check if port 3000 is occupied
Write-Host "`n3. Checking port 3000..." -ForegroundColor Yellow
$portCheck = Invoke-SSHCommand "ss -tlnp | grep ':3000'"
if ($portCheck) {
    Write-Host "✅ Port 3000 is in use: $portCheck" -ForegroundColor Green
} else {
    Write-Host "❌ Port 3000 is not occupied - application not running" -ForegroundColor Red
}

# 4. Check PM2 status
Write-Host "`n4. Checking PM2 status..." -ForegroundColor Yellow
$pm2Status = Invoke-SSHCommand "pm2 status"
Write-Host "PM2 Status:" -ForegroundColor Blue
Write-Host $pm2Status -ForegroundColor White

# 5. Check if hydraa app is running
$hydraaStatus = Invoke-SSHCommand "pm2 jlist | jq -r '.[] | select(.name==\"hydraa\") | .pm2_env.status' 2>/dev/null"
if ($hydraaStatus -match "online") {
    Write-Host "✅ Hydraa app is running" -ForegroundColor Green
} else {
    Write-Host "❌ Hydraa app status: $hydraaStatus" -ForegroundColor Red
}

# 6. Check recent logs
Write-Host "`n6. Checking recent application logs..." -ForegroundColor Yellow
$recentLogs = Invoke-SSHCommand "pm2 logs hydraa --lines 10 --nostream 2>/dev/null"
Write-Host "Recent logs:" -ForegroundColor Blue
Write-Host $recentLogs -ForegroundColor White

# 7. Check if application files exist
Write-Host "`n7. Checking application files..." -ForegroundColor Yellow
$fileCheck = Invoke-SSHCommand "ls -la /home/hydraauser/hydraa/package.json"
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Application files exist" -ForegroundColor Green
} else {
    Write-Host "❌ Application files missing!" -ForegroundColor Red
}

# 8. Database connection test
Write-Host "`n8. Testing database connection..." -ForegroundColor Yellow
$dbTest = Invoke-SSHCommand "PGPASSWORD=hydraa_password psql -h localhost -U hydraa_user -d hydraa -c 'SELECT 1;' 2>&1"
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Database connection successful" -ForegroundColor Green
} else {
    Write-Host "❌ Database connection failed:" -ForegroundColor Red
    Write-Host $dbTest -ForegroundColor Red
}

Write-Host "`n🔧 ATTEMPTING TO FIX..." -ForegroundColor Cyan

# 9. Stop and restart application
Write-Host "`n9. Restarting application..." -ForegroundColor Yellow
Invoke-SSHCommand "pm2 stop hydraa"
Invoke-SSHCommand "pm2 delete hydraa"

# Copy config files
Write-Host "`n10. Uploading latest configuration..." -ForegroundColor Yellow
scp -i $KeyPath -o StrictHostKeyChecking=no "c:/Users/Jayakumar/Documents/hydraa/hydraa/hydranew/hydraa/ecosystem.config.js" "hydraauser@${VMHost}:/home/hydraauser/hydraa/"

# Start application
Write-Host "`n11. Starting application..." -ForegroundColor Yellow
$startResult = Invoke-SSHCommand "cd /home/hydraauser/hydraa; pm2 start ecosystem.config.js"
Write-Host $startResult

# Wait for startup
Write-Host "`n12. Waiting for application to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Check final status
$finalStatus = Invoke-SSHCommand "pm2 status"
Write-Host "Final PM2 Status:" -ForegroundColor Blue
Write-Host $finalStatus

# Test port again
$finalPortCheck = Invoke-SSHCommand "ss -tlnp | grep ':3000'"
if ($finalPortCheck) {
    Write-Host "`n✅ Application is now running on port 3000!" -ForegroundColor Green
    Write-Host "🎉 503 error should be fixed!" -ForegroundColor Cyan
    Write-Host "`nTest your application at: https://hydraa.eastasia.cloudapp.azure.com" -ForegroundColor White
} else {
    Write-Host "`n❌ Application still not running on port 3000" -ForegroundColor Red
    Write-Host "Check the logs for more details:" -ForegroundColor Yellow
    $errorLogs = Invoke-SSHCommand "pm2 logs hydraa --lines 20 --nostream"
    Write-Host $errorLogs -ForegroundColor Red
}