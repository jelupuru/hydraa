# VM Database Import Script for Windows PowerShell
# Run this script to transfer and import your filtered SQL data to the VM

# Configuration - Update these values as needed
$VM_HOST = "hydraa-vm"  # Replace with your VM's IP address or hostname
$VM_USER = "hydraauser"
$SSH_KEY_PATH = "$HOME/Downloads/hydraa-vm-key.pem"
$LOCAL_SQL_FILE = "C:\Users\Jayakumar\Downloads\hydraa_inserts_only.sql"

Write-Host "=== VM Database Import Script ===" -ForegroundColor Green
Write-Host "VM Host: $VM_HOST" -ForegroundColor White
Write-Host "VM User: $VM_USER" -ForegroundColor White
Write-Host "SSH Key: $SSH_KEY_PATH" -ForegroundColor White
Write-Host "SQL File: $LOCAL_SQL_FILE" -ForegroundColor White
Write-Host ""

# Check if files exist
if (-not (Test-Path $LOCAL_SQL_FILE)) {
    Write-Host "Error: SQL file not found at $LOCAL_SQL_FILE" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $SSH_KEY_PATH)) {
    Write-Host "Error: SSH key not found at $SSH_KEY_PATH" -ForegroundColor Red
    Write-Host "Please update the SSH_KEY_PATH variable with the correct path to your private key." -ForegroundColor Yellow
    exit 1
}

# Step 1: Transfer file to VM
Write-Host "Step 1: Transferring SQL file to VM..." -ForegroundColor Yellow
try {
    & scp -i $SSH_KEY_PATH -o StrictHostKeyChecking=no $LOCAL_SQL_FILE "${VM_USER}@${VM_HOST}:~/"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ File transferred successfully" -ForegroundColor Green
    } else {
        throw "SCP failed with exit code $LASTEXITCODE"
    }
} catch {
    Write-Host "✗ File transfer failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Please check:" -ForegroundColor Yellow
    Write-Host "  - SSH key path: $SSH_KEY_PATH" -ForegroundColor White
    Write-Host "  - VM hostname/IP: $VM_HOST" -ForegroundColor White
    Write-Host "  - VM user: $VM_USER" -ForegroundColor White
    Write-Host "  - Network connectivity" -ForegroundColor White
    exit 1
}

# Step 2: Import data on VM
Write-Host "Step 2: Connecting to VM and importing data..." -ForegroundColor Yellow

$IMPORT_COMMAND = @"
echo 'Connected to VM. Starting database import...'
echo 'Importing data into hydraa database...'

# Import the data
sudo -u postgres psql -d hydraa -f ~/hydraa_inserts_only.sql 2>&1

IMPORT_EXIT_CODE=`$?

if [ `$IMPORT_EXIT_CODE -eq 0 ]; then
    echo '✓ Database import completed successfully!'
    echo 'Cleaning up temporary file...'
    rm ~/hydraa_inserts_only.sql
    echo '✓ Temporary file removed'
    echo '✓ Data import process completed!'
else
    echo '✗ Database import failed with exit code:' `$IMPORT_EXIT_CODE
    echo 'Check the error messages above for details'
    exit `$IMPORT_EXIT_CODE
fi
"@

try {
    $IMPORT_COMMAND | & ssh -i $SSH_KEY_PATH -o StrictHostKeyChecking=no "${VM_USER}@${VM_HOST}" /bin/bash
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Database import completed successfully!" -ForegroundColor Green
    } else {
        throw "SSH import command failed with exit code $LASTEXITCODE"
    }
} catch {
    Write-Host "✗ Database import failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "The data file may still be on the VM at ~/hydraa_inserts_only.sql" -ForegroundColor Yellow
    Write-Host "You can manually import it by running on the VM:" -ForegroundColor Yellow
    Write-Host "  sudo -u postgres psql -d hydraa -f ~/hydraa_inserts_only.sql" -ForegroundColor White
    exit 1
}

Write-Host ""
Write-Host "=== Import Process Complete ===" -ForegroundColor Green
Write-Host "Your local database data has been successfully imported to the VM!" -ForegroundColor Green