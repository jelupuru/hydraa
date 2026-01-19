# Simple Authentication Fix for VM
# Run this step by step

$VM_HOST = "hydraa-vm"
$KEY_PATH = "$HOME/Downloads/hydraa-vm-key.pem"
$LOCAL_DIR = "c:/Users/Jayakumar/Documents/hydraa/hydraa/hydranew/hydraa"
$REMOTE_DIR = "/home/hydraauser/hydraa"

Write-Host "🔧 Fixing authentication configuration on VM..." -ForegroundColor Cyan

# Step 1: Copy files
Write-Host "`n1. Copying configuration files..." -ForegroundColor Yellow
scp -i $KEY_PATH -o StrictHostKeyChecking=no "$LOCAL_DIR/ecosystem.config.js" "hydraauser@${VM_HOST}:$REMOTE_DIR/"
if ($LASTEXITCODE -ne 0) { Write-Host "❌ Failed to copy ecosystem.config.js" -ForegroundColor Red; exit 1 }

scp -i $KEY_PATH -o StrictHostKeyChecking=no "$LOCAL_DIR/.env.production" "hydraauser@${VM_HOST}:$REMOTE_DIR/"
if ($LASTEXITCODE -ne 0) { Write-Host "❌ Failed to copy .env.production" -ForegroundColor Red; exit 1 }

Write-Host "✅ Files copied successfully" -ForegroundColor Green

# Step 2: Restart application
Write-Host "`n2. Restarting application..." -ForegroundColor Yellow

# Stop application
ssh -i $KEY_PATH -o StrictHostKeyChecking=no "hydraauser@${VM_HOST}" "pm2 stop hydraa"
ssh -i $KEY_PATH -o StrictHostKeyChecking=no "hydraauser@${VM_HOST}" "pm2 delete hydraa"

# Start application
ssh -i $KEY_PATH -o StrictHostKeyChecking=no "hydraauser@${VM_HOST}" "cd $REMOTE_DIR"
ssh -i $KEY_PATH -o StrictHostKeyChecking=no "hydraauser@${VM_HOST}" "pm2 start ecosystem.config.js"
if ($LASTEXITCODE -ne 0) { Write-Host "❌ Failed to start application" -ForegroundColor Red; exit 1 }

# Check status
ssh -i $KEY_PATH -o StrictHostKeyChecking=no "hydraauser@${VM_HOST}" "pm2 status"

Write-Host "`n✅ Application restarted successfully!" -ForegroundColor Green
Write-Host "`n🔍 Testing database connection..." -ForegroundColor Yellow

# Test database
$dbTest = ssh -i $KEY_PATH -o StrictHostKeyChecking=no "hydraauser@${VM_HOST}" "sudo -u postgres psql -d hydraa -c 'SELECT COUNT(*) FROM \`"`"User\`"`";'"
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Database connection successful" -ForegroundColor Green
    Write-Host "Database test result: $dbTest" -ForegroundColor Green
} else {
    Write-Host "⚠️ Database connection test failed - check if data was imported" -ForegroundColor Yellow
}

Write-Host "`n🎉 Authentication fix complete!" -ForegroundColor Cyan
Write-Host "`nTest your application at: https://hydraa.eastasia.cloudapp.azure.com/auth/signin" -ForegroundColor White
Write-Host "`nIf issues persist, check logs with:" -ForegroundColor White
Write-Host "ssh -i $KEY_PATH hydraauser@${VM_HOST} 'pm2 logs hydraa'" -ForegroundColor White