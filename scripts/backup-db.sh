#!/bin/bash

###############################################################################
# Database Backup Script for Monno (PostgreSQL in Docker)
# 
# This script:
# - Creates a compressed backup of the PostgreSQL database
# - Stores it with a timestamp
# - Automatically deletes backups older than 7 days
# - Logs the operation
#
# Setup: Add to crontab to run daily
# 0 2 * * * bash /opt/apps/monno/scripts/backup-db.sh >> /opt/apps/monno/backups/backup.log 2>&1
###############################################################################

set -e  # Exit on error

# Load .env.docker to get COMPOSE_PROJECT_NAME
if [ ! -f "$(dirname "$0")/../.env.docker" ]; then
    echo "❌ .env.docker file not found!"
    exit 1
fi

source "$(dirname "$0")/../.env.docker"

# Configuration
BACKUP_DIR="/opt/apps/monno/backups"
# Container name is derived from COMPOSE_PROJECT_NAME
CONTAINER_NAME="${COMPOSE_PROJECT_NAME}_db"
DB_USER="postgres"
DB_NAME="appdb"
KEEP_DAYS=7

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Generate timestamp
TIMESTAMP=$(date +%Y-%m-%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup-$TIMESTAMP.sql"
BACKUP_FILE_GZ="$BACKUP_FILE.gz"

# Log function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

log "=== Starting Database Backup ==="
log "Backup directory: $BACKUP_DIR"
log "Database: $DB_NAME"
log "Container: $CONTAINER_NAME"

# Check if container is running
if ! docker ps | grep -q "$CONTAINER_NAME"; then
    log "ERROR: Container '$CONTAINER_NAME' is not running!"
    exit 1
fi

# Perform backup
log "Creating backup..."
if docker exec "$CONTAINER_NAME" pg_dump -U "$DB_USER" "$DB_NAME" > "$BACKUP_FILE"; then
    log "Backup created: $BACKUP_FILE"
else
    log "ERROR: Failed to create backup!"
    exit 1
fi

# Get file size
BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
log "Backup size: $BACKUP_SIZE"

# Compress backup
log "Compressing backup..."
if gzip "$BACKUP_FILE"; then
    log "Compressed: $BACKUP_FILE_GZ"
    COMPRESSED_SIZE=$(du -h "$BACKUP_FILE_GZ" | cut -f1)
    log "Compressed size: $COMPRESSED_SIZE"
else
    log "ERROR: Failed to compress backup!"
    exit 1
fi

# Delete old backups
log "Cleaning up backups older than $KEEP_DAYS days..."
OLD_BACKUPS=$(find "$BACKUP_DIR" -name "backup-*.sql.gz" -mtime +$KEEP_DAYS)
if [ -n "$OLD_BACKUPS" ]; then
    find "$BACKUP_DIR" -name "backup-*.sql.gz" -mtime +$KEEP_DAYS -delete
    log "Deleted old backups"
else
    log "No old backups to delete"
fi

# List current backups
log "Current backups:"
ls -lh "$BACKUP_DIR"/backup-*.sql.gz 2>/dev/null | awk '{print "  " $9 " (" $5 ")"}'

log "=== Backup Complete ==="
log "Next backup scheduled for: $(date -d '+1 day' '+%Y-%m-%d 02:00:00')"
