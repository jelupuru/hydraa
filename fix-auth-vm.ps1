# Fix Authentication Issues on VM
# This script updates the VM with proper environment variables and restarts the app

#!/bin/bash

echo "🔧 Fixing authentication configuration on VM..."

# Configuration
VM_HOST="hydraa-vm"
KEY_PATH="$HOME/Downloads/hydraa-vm-key.pem"
LOCAL_DIR="c:/Users/Jayakumar/Documents/hydraa/hydraa/hydranew/hydraa"
REMOTE_DIR="/home/hydraauser/hydraa"

echo "1. Copying updated configuration files to VM..."

# Copy ecosystem config
scp -i "$KEY_PATH" -o StrictHostKeyChecking=no "$LOCAL_DIR/ecosystem.config.js" "hydraauser@${VM_HOST}:$REMOTE_DIR/"

# Copy environment file
scp -i "$KEY_PATH" -o StrictHostKeyChecking=no "$LOCAL_DIR/.env.production" "hydraauser@${VM_HOST}:$REMOTE_DIR/"

echo "2. Restarting application on VM..."

# SSH to VM and restart
$sshCommand = @"
cd /home/hydraauser/hydraa

echo "Stopping current application..."
pm2 stop hydraa || true
pm2 delete hydraa || true

echo "Starting application with new configuration..."
pm2 start ecosystem.config.js

echo "Checking application status..."
pm2 status
pm2 logs hydraa --lines 10

echo "Testing database connection..."
sudo -u postgres psql -d hydraa -c "SELECT COUNT(*) FROM \`"User\`";" || echo "Database connection test failed"
"@

ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no "hydraauser@${VM_HOST}" $sshCommand

echo "✅ Configuration updated and application restarted!"
echo ""
echo "Test the authentication now at: https://hydraa.eastasia.cloudapp.azure.com/auth/signin"
echo ""
echo "If you still get 401 errors, check the PM2 logs on VM:"
echo "ssh -i $KEY_PATH hydraauser@${VM_HOST} 'pm2 logs hydraa'"