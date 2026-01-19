# Database Import to VM - Complete Guide

## Overview
This guide explains how to import your filtered SQL data (containing only INSERT statements) into your Azure VM's PostgreSQL database.

## Prerequisites
- ✅ SSH access to your VM as `hydraauser`
- ✅ SSH private key at `~/Downloads/hydraa-vm-key.pem`
- ✅ PostgreSQL running on VM
- ✅ `hydraa` database created on VM
- ✅ Filtered SQL file: `C:\Users\Jayakumar\Downloads\hydraa_inserts_only.sql`

## Quick Import (Automated)

### Option 1: PowerShell Script (Recommended for Windows)
```powershell
# Update the configuration variables in import-to-vm.ps1 if needed, then run:
.\import-to-vm.ps1
```

### Option 2: Manual Step-by-Step

#### Step 1: Transfer File to VM
```bash
# From your local machine (PowerShell/Command Prompt)
scp -i ~/Downloads/hydraa-vm-key.pem -o StrictHostKeyChecking=no C:\Users\Jayakumar\Downloads\hydraa_inserts_only.sql hydraauser@hydraa-vm:~/
```

#### Step 2: Connect to VM
```bash
ssh -i ~/Downloads/hydraa-vm-key.pem hydraauser@hydraa-vm
```

#### Step 3: Import Data on VM
```bash
# On the VM, run:
sudo -u postgres psql -d hydraa -f ~/hydraa_inserts_only.sql

# Check if import was successful
echo $?
# Should return 0 for success
```

#### Step 4: Verify Import
```bash
# Check if data was imported
sudo -u postgres psql -d hydraa -c "SELECT COUNT(*) FROM complaints;"
sudo -u postgres psql -d hydraa -c "SELECT COUNT(*) FROM \"User\";"
```

#### Step 5: Clean Up
```bash
# Remove the temporary file
rm ~/hydraa_inserts_only.sql
```

## Troubleshooting

### Connection Issues
```bash
# Test SSH connection
ssh -i ~/Downloads/hydraa-vm-key.pem -o StrictHostKeyChecking=no hydraauser@hydraa-vm "echo 'Connection successful'"

# If connection fails, check:
# 1. VM is running
# 2. SSH key permissions: icacls ~/Downloads/hydraa-vm-key.pem
# 3. VM IP address/hostname
# 4. Firewall rules on VM
```

### Database Issues
```bash
# Check if PostgreSQL is running on VM
ssh hydraauser@hydraa-vm "sudo systemctl status postgresql"

# Check if database exists
ssh hydraauser@hydraa-vm "sudo -u postgres psql -l | grep hydraa"

# Check PostgreSQL logs
ssh hydraauser@hydraa-vm "sudo tail -f /var/log/postgresql/postgresql-*.log"
```

### Import Errors
```bash
# If import fails, check the SQL file for issues
ssh hydraauser@hydraa-vm "head -20 ~/hydraa_inserts_only.sql"

# Try importing with verbose output
ssh hydraauser@hydraa-vm "sudo -u postgres psql -d hydraa -f ~/hydraa_inserts_only.sql -v ON_ERROR_STOP=1"
```

### Permission Issues
```bash
# Ensure correct permissions on VM
ssh hydraauser@hydraa-vm "ls -la ~/hydraa_inserts_only.sql"

# Check PostgreSQL user permissions
ssh hydraauser@hydraa-vm "sudo -u postgres psql -d hydraa -c '\du'"
```

## Alternative Methods

### Using pg_restore (if you have a compressed dump)
```bash
# If you have a compressed dump instead
ssh hydraauser@hydraa-vm "sudo -u postgres pg_restore -d hydraa ~/dump.sql.gz"
```

### Using psql with compressed file
```bash
# Transfer compressed file
gzip C:\Users\Jayakumar\Downloads\hydraa_inserts_only.sql
scp -i ~/Downloads/hydraa-vm-key.pem hydraa_inserts_only.sql.gz hydraauser@hydraa-vm:~/

# Import on VM
ssh hydraauser@hydraa-vm "gunzip hydraa_inserts_only.sql.gz && sudo -u postgres psql -d hydraa -f hydraa_inserts_only.sql"
```

## Verification Commands

After successful import, verify your data:

```bash
# Connect to database and check tables
ssh hydraauser@hydraa-vm "sudo -u postgres psql -d hydraa -c '\dt'"

# Check record counts
ssh hydraauser@hydraa-vm "sudo -u postgres psql -d hydraa -c 'SELECT schemaname, tablename, n_tup_ins FROM pg_stat_user_tables;'"

# Check specific tables
ssh hydraauser@hydraa-vm "sudo -u postgres psql -d hydraa -c 'SELECT COUNT(*) FROM complaints;'"
ssh hydraauser@hydraa-vm "sudo -u postgres psql -d hydraa -c 'SELECT COUNT(*) FROM \"User\";'"
```

## Success Indicators

- ✅ Import command returns exit code 0
- ✅ No error messages during import
- ✅ Record counts match your expectations
- ✅ Application can connect and query data

## Emergency Recovery

If something goes wrong:

```bash
# Backup current database (on VM)
ssh hydraauser@hydraa-vm "sudo -u postgres pg_dump -d hydraa > ~/hydraa_backup_$(date +%Y%m%d_%H%M%S).sql"

# Drop and recreate database if needed
ssh hydraauser@hydraa-vm "sudo -u postgres psql -c 'DROP DATABASE IF EXISTS hydraa;'"
ssh hydraauser@hydraa-vm "sudo -u postgres psql -c 'CREATE DATABASE hydraa;'"
ssh hydraauser@hydraa-vm "sudo -u postgres psql -c 'GRANT ALL PRIVILEGES ON DATABASE hydraa TO hydraa_user;'"
```

## Next Steps

After successful import:
1. ✅ Test your application with the imported data
2. ✅ Update any configuration files if needed
3. ✅ Run your application migration scripts if any
4. ✅ Verify all features work with real data

Your database migration is now complete! 🎉