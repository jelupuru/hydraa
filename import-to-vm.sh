# VM Database Import Script
# Run this on your local machine to transfer and import data

# Step 1: Transfer the filtered SQL file to VM
echo "Step 1: Transferring data file to VM..."
scp -i ~/Downloads/hydraa-vm-key.pem -o StrictHostKeyChecking=no C:\Users\Jayakumar\Downloads\hydraa_inserts_only.sql hydraauser@hydraa-vm:~/

if [ $? -eq 0 ]; then
    echo "✓ File transferred successfully"
else
    echo "✗ File transfer failed"
    echo "Please check:"
    echo "  - SSH key path: ~/Downloads/hydraa-vm-key.pem"
    echo "  - VM hostname/IP: hydraa-vm"
    echo "  - VM user: hydraauser"
    exit 1
fi

# Step 2: Import data on VM
echo "Step 2: Connecting to VM and importing data..."
ssh -i ~/Downloads/hydraa-vm-key.pem -o StrictHostKeyChecking=no hydraauser@hydraa-vm << 'EOF'
echo "Connected to VM. Starting database import..."

# Import the data
sudo -u postgres psql -d hydraa -f ~/hydraa_inserts_only.sql

if [ $? -eq 0 ]; then
    echo "✓ Database import completed successfully!"
    echo "Cleaning up..."
    rm ~/hydraa_inserts_only.sql
    echo "✓ Temporary file removed"
else
    echo "✗ Database import failed!"
    echo "Check the error messages above"
    exit 1
fi

echo "✓ Data import process completed!"
EOF