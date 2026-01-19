#!/bin/bash

# Database Export and Transfer Script
# This script exports the local PostgreSQL database and transfers it to the VM

# Configuration
LOCAL_DB_NAME="hydraa"
LOCAL_DB_USER="hydraa_user"
LOCAL_DB_HOST="localhost"
LOCAL_DB_PORT="5432"

VM_USER="hydraauser"
VM_HOST="hydraa-vm"
VM_DB_NAME="hydraa"
VM_DB_USER="hydraa_user"

# SSH Key path (adjust if different)
SSH_KEY_PATH="$HOME/Downloads/hydraa-vm-key.pem"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Database Export and Transfer Script ===${NC}"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command_exists pg_dump; then
    echo -e "${RED}Error: pg_dump not found. Please install PostgreSQL client tools.${NC}"
    exit 1
fi

if ! command_exists scp; then
    echo -e "${RED}Error: scp not found. Please install OpenSSH client.${NC}"
    exit 1
fi

if [ ! -f "$SSH_KEY_PATH" ]; then
    echo -e "${RED}Error: SSH key not found at $SSH_KEY_PATH${NC}"
    echo -e "${YELLOW}Please update SSH_KEY_PATH in this script or ensure the key exists.${NC}"
    exit 1
fi

# Set SSH key permissions
chmod 600 "$SSH_KEY_PATH"

# Generate timestamp for backup file
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="hydraa_db_export_$TIMESTAMP.sql"

echo -e "${YELLOW}Exporting local database...${NC}"

# Export local database
if pg_dump -h "$LOCAL_DB_HOST" -p "$LOCAL_DB_PORT" -U "$LOCAL_DB_USER" -d "$LOCAL_DB_NAME" --no-owner --no-privileges > "$BACKUP_FILE"; then
    echo -e "${GREEN}✓ Local database exported successfully: $BACKUP_FILE${NC}"
else
    echo -e "${RED}✗ Failed to export local database${NC}"
    exit 1
fi

# Compress the backup
echo -e "${YELLOW}Compressing backup file...${NC}"
gzip "$BACKUP_FILE"

COMPRESSED_FILE="$BACKUP_FILE.gz"

if [ -f "$COMPRESSED_FILE" ]; then
    echo -e "${GREEN}✓ Backup compressed: $COMPRESSED_FILE${NC}"
else
    echo -e "${RED}✗ Failed to compress backup${NC}"
    exit 1
fi

# Transfer to VM
echo -e "${YELLOW}Transferring backup to VM...${NC}"

if scp -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no "$COMPRESSED_FILE" "$VM_USER@$VM_HOST:~/$COMPRESSED_FILE"; then
    echo -e "${GREEN}✓ Backup transferred to VM successfully${NC}"
else
    echo -e "${RED}✗ Failed to transfer backup to VM${NC}"
    rm -f "$COMPRESSED_FILE"
    exit 1
fi

# Import on VM
echo -e "${YELLOW}Importing database on VM...${NC}"

IMPORT_COMMAND="
echo 'Starting database import on VM...'
cd ~
gunzip $COMPRESSED_FILE
sudo -u postgres psql -d $VM_DB_NAME -f ${BACKUP_FILE} > import_log.txt 2>&1
if [ \$? -eq 0 ]; then
    echo '✓ Database import completed successfully'
    rm -f $BACKUP_FILE $COMPRESSED_FILE
    echo '✓ Cleanup completed'
else
    echo '✗ Database import failed. Check import_log.txt for details'
    exit 1
fi
"

if ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no "$VM_USER@$VM_HOST" "$IMPORT_COMMAND"; then
    echo -e "${GREEN}✓ Database import completed successfully on VM${NC}"
else
    echo -e "${RED}✗ Database import failed on VM${NC}"
    echo -e "${YELLOW}You may need to manually import the file on the VM${NC}"
    exit 1
fi

# Cleanup local files
echo -e "${YELLOW}Cleaning up local files...${NC}"
rm -f "$COMPRESSED_FILE"

echo -e "${GREEN}=== Database migration completed successfully! ===${NC}"
echo -e "${YELLOW}Summary:${NC}"
echo -e "  - Exported: $LOCAL_DB_NAME from local PostgreSQL"
echo -e "  - Transferred to: $VM_USER@$VM_HOST"
echo -e "  - Imported into: $VM_DB_NAME on VM"
echo -e "${GREEN}Your data has been successfully migrated to the VM!${NC}"