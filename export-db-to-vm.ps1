# Database Export and Transfer Script for Windows
# This script exports the local PostgreSQL database and transfers it to the VM

# Configuration
$LOCAL_DB_NAME = "hydraa"
$LOCAL_DB_USER = "hydraa_user"
$LOCAL_DB_HOST = "localhost"
$LOCAL_DB_PORT = "5432"

$VM_USER = "hydraauser"
$VM_HOST = "hydraa-vm"
$VM_DB_NAME = "hydraa"
$VM_DB_USER = "hydraa_user"

# SSH Key path (adjust if different)
$SSH_KEY_PATH = "$HOME/Downloads/hydraa-vm-key.pem"

# PostgreSQL bin path (adjust if different)
$PG_BIN_PATH = "C:\Program Files\PostgreSQL\16\bin"  # Adjust version as needed

Write-Host "=== Database Export and Transfer Script ===" -ForegroundColor Green

# Function to check if command exists
function Test-Command($cmdname) {
    return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
}

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow

if (-not (Test-Command "pg_dump")) {
    if (Test-Path "$PG_BIN_PATH\pg_dump.exe") {
        $env:Path += ";$PG_BIN_PATH"
        Write-Host "Added PostgreSQL bin to PATH" -ForegroundColor Green
    } else {
        Write-Host "Error: pg_dump not found. Please install PostgreSQL or update PG_BIN_PATH in this script." -ForegroundColor Red
        exit 1
    }
}

if (-not (Test-Command "scp")) {
    Write-Host "Error: scp not found. Please install OpenSSH client or Git Bash." -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $SSH_KEY_PATH)) {
    Write-Host "Error: SSH key not found at $SSH_KEY_PATH" -ForegroundColor Red
    Write-Host "Please update SSH_KEY_PATH in this script or ensure the key exists." -ForegroundColor Yellow
    exit 1
}

# Generate timestamp for backup file
$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"
$BACKUP_FILE = "hydraa_db_export_$TIMESTAMP.sql"

Write-Host "Exporting local database..." -ForegroundColor Yellow

# Export local database
try {
    & pg_dump -h $LOCAL_DB_HOST -p $LOCAL_DB_PORT -U $LOCAL_DB_USER -d $LOCAL_DB_NAME --no-owner --no-privileges -f $BACKUP_FILE
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Local database exported successfully: $BACKUP_FILE" -ForegroundColor Green
    } else {
        throw "pg_dump failed with exit code $LASTEXITCODE"
    }
} catch {
    Write-Host "✗ Failed to export local database: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Compress the backup
Write-Host "Compressing backup file..." -ForegroundColor Yellow
try {
    & gzip $BACKUP_FILE
    $COMPRESSED_FILE = "$BACKUP_FILE.gz"

    if (Test-Path $COMPRESSED_FILE) {
        Write-Host "✓ Backup compressed: $COMPRESSED_FILE" -ForegroundColor Green
    } else {
        throw "Compression failed"
    }
} catch {
    Write-Host "✗ Failed to compress backup: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Transfer to VM
Write-Host "Transferring backup to VM..." -ForegroundColor Yellow

try {
    & scp -i $SSH_KEY_PATH -o StrictHostKeyChecking=no $COMPRESSED_FILE "$VM_USER@$VM_HOST:~/$COMPRESSED_FILE"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Backup transferred to VM successfully" -ForegroundColor Green
    } else {
        throw "scp failed with exit code $LASTEXITCODE"
    }
} catch {
    Write-Host "✗ Failed to transfer backup to VM: $($_.Exception.Message)" -ForegroundColor Red
    Remove-Item $COMPRESSED_FILE -ErrorAction SilentlyContinue
    exit 1
}

# Import on VM
Write-Host "Importing database on VM..." -ForegroundColor Yellow

$IMPORT_COMMAND = @"
echo 'Starting database import on VM...'
cd ~
gunzip $COMPRESSED_FILE
sudo -u postgres psql -d $VM_DB_NAME -f ${BACKUP_FILE} > import_log.txt 2>&1
if [ `$? -eq 0 ]; then
    echo '✓ Database import completed successfully'
    rm -f $BACKUP_FILE $COMPRESSED_FILE
    echo '✓ Cleanup completed'
else
    echo '✗ Database import failed. Check import_log.txt for details'
    exit 1
fi
"@

try {
    $IMPORT_COMMAND | & ssh -i $SSH_KEY_PATH -o StrictHostKeyChecking=no "$VM_USER@$VM_HOST" /bin/bash
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Database import completed successfully on VM" -ForegroundColor Green
    } else {
        throw "SSH import command failed with exit code $LASTEXITCODE"
    }
} catch {
    Write-Host "✗ Database import failed on VM: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "You may need to manually import the file on the VM" -ForegroundColor Yellow
    exit 1
}

# Cleanup local files
Write-Host "Cleaning up local files..." -ForegroundColor Yellow
Remove-Item $COMPRESSED_FILE -ErrorAction SilentlyContinue

Write-Host "=== Database migration completed successfully! ===" -ForegroundColor Green
Write-Host "Summary:" -ForegroundColor Yellow
Write-Host "  - Exported: $LOCAL_DB_NAME from local PostgreSQL" -ForegroundColor White
Write-Host "  - Transferred to: $VM_USER@$VM_HOST" -ForegroundColor White
Write-Host "  - Imported into: $VM_DB_NAME on VM" -ForegroundColor White
Write-Host "Your data has been successfully migrated to the VM!" -ForegroundColor Green