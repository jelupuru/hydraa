# VM Database Import Verification Script

# This script verifies that the database import was successful
# Run this after completing the import process

#!/bin/bash

echo "🔍 Verifying VM Database Import..."
echo "=================================="

# Check if we can connect to the database
echo "1. Testing database connection..."
if sudo -u postgres psql -d hydraa -c "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ Database connection successful"
else
    echo "❌ Database connection failed"
    exit 1
fi

# Check table counts
echo ""
echo "2. Checking table record counts..."

TABLES=("User" "complaints" "templates" "blogs" "settings")

for table in "${TABLES[@]}"; do
    if [[ "$table" == "User" ]]; then
        # Handle quoted table name
        count=$(sudo -u postgres psql -d hydraa -t -c "SELECT COUNT(*) FROM \"$table\";" 2>/dev/null | tr -d ' ')
    else
        count=$(sudo -u postgres psql -d hydraa -t -c "SELECT COUNT(*) FROM $table;" 2>/dev/null | tr -d ' ')
    fi

    if [[ -n "$count" && "$count" -gt 0 ]]; then
        echo "✅ $table: $count records"
    else
        echo "⚠️  $table: No records found or table doesn't exist"
    fi
done

# Check database size
echo ""
echo "3. Database size information..."
sudo -u postgres psql -d hydraa -c "SELECT pg_size_pretty(pg_database_size('hydraa')) as database_size;"

# Check recent activity
echo ""
echo "4. Recent database activity..."
sudo -u postgres psql -d hydraa -c "SELECT schemaname, tablename, n_tup_ins, n_tup_upd, n_tup_del FROM pg_stat_user_tables WHERE n_tup_ins > 0;"

echo ""
echo "🎉 Verification complete!"
echo ""
echo "If all checks show ✅ and reasonable record counts,"
echo "your database import was successful!"
echo ""
echo "Next steps:"
echo "- Start your application: pm2 start ecosystem.config.js"
echo "- Test the application functionality"
echo "- Monitor logs for any issues"