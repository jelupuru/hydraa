# Database Migration Guide

This guide explains how to export your local PostgreSQL database and import it to the Azure VM.

## Prerequisites

1. **PostgreSQL installed locally** with `pg_dump` available
2. **OpenSSH client** installed (comes with Git for Windows)
3. **SSH key** for VM access at `~/Downloads/hydraa-vm-key.pem`
4. **VM running** and accessible via SSH

## Quick Migration (Windows PowerShell)

### Option 1: PowerShell Script (Recommended)

1. **Update configuration** in `export-db-to-vm.ps1` if needed:
   - `$SSH_KEY_PATH`: Path to your SSH private key
   - `$PG_BIN_PATH`: Path to PostgreSQL bin directory
   - Database connection details

2. **Run the script**:
   ```powershell
   .\export-db-to-vm.ps1
   ```

### Option 2: Manual Commands

If you prefer to run commands manually:

1. **Export local database**:
   ```bash
   pg_dump -h localhost -p 5432 -U hydraa_user -d hydraa --no-owner --no-privileges > hydraa_db_export.sql
   ```

2. **Compress the export**:
   ```bash
   gzip hydraa_db_export.sql
   ```

3. **Transfer to VM**:
   ```bash
   scp -i ~/Downloads/hydraa-vm-key.pem hydraa_db_export.sql.gz hydraauser@hydraa-vm:~/
   ```

4. **Import on VM**:
   ```bash
   ssh -i ~/Downloads/hydraa-vm-key.pem hydraauser@hydraa-vm
   # On VM:
   gunzip hydraa_db_export.sql.gz
   sudo -u postgres psql -d hydraa -f hydraa_db_export.sql
   ```

## Troubleshooting

### PostgreSQL not found
- Install PostgreSQL or update `$PG_BIN_PATH` in the PowerShell script
- Or use the manual commands with full paths

### SSH key not found
- Update `$SSH_KEY_PATH` in the script
- Ensure the key has correct permissions (600)

### Connection issues
- Verify VM is running and accessible
- Check firewall rules on VM
- Ensure SSH key is correct

### Database import fails
- Check that VM database exists and is accessible
- Verify database credentials on VM
- Check import_log.txt on VM for detailed errors

## What the script does

1. **Exports** your local `hydraa` database using `pg_dump`
2. **Compresses** the export file with gzip
3. **Transfers** the compressed file to your VM via SCP
4. **Imports** the data into the VM's PostgreSQL database
5. **Cleans up** temporary files

## Security Notes

- The export includes data but excludes ownership and privileges
- Review the data before importing to production
- Ensure your SSH key is secure and not shared
- The script uses `--no-owner` and `--no-privileges` to avoid permission issues