#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/hydraauser/backups"
APP_DIR="/home/hydraauser/hydraa"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup application files (excluding node_modules and .next)
tar -czf "$BACKUP_DIR/app_backup_$DATE.tar.gz" \
  --exclude="$APP_DIR/node_modules" \
  --exclude="$APP_DIR/.next" \
  --exclude="$APP_DIR/logs" \
  $APP_DIR

echo "Application backup completed: app_backup_$DATE.tar.gz"</content>
<parameter name="filePath">c:\Users\Jayakumar\Documents\hydraa\hydraa\hydranew\hydraa\backup-app.sh