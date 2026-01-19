#!/bin/bash

# Simple database export script for Linux/Mac
# Usage: ./export-db-simple.sh [vm-host] [ssh-key-path]

VM_HOST=${1:-"hydraa-vm"}
SSH_KEY=${2:-"$HOME/Downloads/hydraa-vm-key.pem"}

echo "=== Simple Database Export to VM ==="
echo "VM Host: $VM_HOST"
echo "SSH Key: $SSH_KEY"
echo ""

# Export database
echo "Exporting local database..."
pg_dump -h localhost -p 5432 -U hydraa_user -d hydraa --no-owner --no-privileges > hydraa_export.sql

if [ $? -eq 0 ]; then
    echo "✓ Export successful"
else
    echo "✗ Export failed"
    exit 1
fi

# Compress
echo "Compressing..."
gzip hydraa_export.sql

# Transfer
echo "Transferring to VM..."
scp -i "$SSH_KEY" -o StrictHostKeyChecking=no hydraa_export.sql.gz hydraauser@$VM_HOST:~/

if [ $? -eq 0 ]; then
    echo "✓ Transfer successful"
else
    echo "✗ Transfer failed"
    rm -f hydraa_export.sql.gz
    exit 1
fi

# Import command for user to run manually on VM
echo ""
echo "=== Now run this on your VM ==="
echo "ssh -i $SSH_KEY hydraauser@$VM_HOST"
echo "cd ~"
echo "gunzip hydraa_export.sql.gz"
echo "sudo -u postgres psql -d hydraa -f hydraa_export.sql"
echo ""
echo "✓ Ready for manual import on VM"