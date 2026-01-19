# MANUAL DATABASE AUTHENTICATION FIX
# Run these commands step by step on your VM

echo "🔧 Manual Database Authentication Fix for VM"
echo "============================================"

# Step 1: SSH into your VM
echo ""
echo "Step 1: Connect to your VM"
echo "ssh -i ~/Downloads/hydraa-vm-key.pem hydraauser@hydraa-vm"

# Once connected, run these commands on the VM:

echo ""
echo "Step 2: Check PostgreSQL status"
echo "sudo systemctl status postgresql"

echo ""
echo "Step 3: Start PostgreSQL if not running"
echo "sudo systemctl start postgresql"

echo ""
echo "Step 4: Check if database exists"
echo "sudo -u postgres psql -l | grep hydraa"

echo ""
echo "Step 5: Create database if it doesn't exist"
echo "sudo -u postgres createdb hydraa"

echo ""
echo "Step 6: Check if user exists"
echo "sudo -u postgres psql -c 'SELECT rolname FROM pg_roles WHERE rolname='\''hydraa_user'\'';'"

echo ""
echo "Step 7: Create user if it doesn't exist"
echo "sudo -u postgres psql -c 'CREATE USER hydraa_user WITH PASSWORD '\''hydraa_password'\'';'"

echo ""
echo "Step 8: Grant permissions"
echo "sudo -u postgres psql -c 'GRANT ALL PRIVILEGES ON DATABASE hydraa TO hydraa_user;'"
echo "sudo -u postgres psql -d hydraa -c 'GRANT ALL ON SCHEMA public TO hydraa_user;'"
echo "sudo -u postgres psql -d hydraa -c 'GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO hydraa_user;'"
echo "sudo -u postgres psql -d hydraa -c 'GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO hydraa_user;'"

echo ""
echo "Step 9: Test connection"
echo "PGPASSWORD=hydraa_password psql -h localhost -U hydraa_user -d hydraa -c 'SELECT 1;'"

echo ""
echo "Step 10: Restart application"
echo "pm2 restart hydraa"

echo ""
echo "Step 11: Check application status"
echo "pm2 status"

echo ""
echo "🎉 Database authentication should now be fixed!"
echo ""
echo "Test your application at: https://hydraa.eastasia.cloudapp.azure.com/auth/signin"