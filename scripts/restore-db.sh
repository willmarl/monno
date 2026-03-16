#!/bin/bash

###############################################################################
# Database Restore Script for Monno (PostgreSQL in Docker)
#
# Usage: bash restore-db.sh <backup-file>
# Example: bash restore-db.sh /opt/apps/monno/backups/backup-2026-03-15_140000.sql.gz
#
# This script:
# - Drops the current database
# - Creates a fresh database
# - Restores from the specified backup file
# - Restarts the API and Worker apps
###############################################################################

set -e

# Configuration
CONTAINER_NAME="monno_db"
DB_USER="postgres"
DB_NAME="appdb"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" >&2
}

warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

# Validate arguments
if [ -z "$1" ]; then
    error "No backup file specified!"
    echo ""
    echo "Usage: bash restore-db.sh <backup-file>"
    echo "Example: bash restore-db.sh /opt/apps/monno/backups/backup-2026-03-15_140000.sql.gz"
    echo ""
    echo "Available backups:"
    ls -lh /opt/apps/monno/backups/backup-*.sql.gz 2>/dev/null | awk '{print "  " $9 " (" $5 ")"}'
    exit 1
fi

BACKUP_FILE="$1"

# Validate backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    error "Backup file not found: $BACKUP_FILE"
    exit 1
fi

# Check file extension to determine if it's compressed
if [[ "$BACKUP_FILE" == *.gz ]]; then
    TEMP_FILE="/tmp/restore_temp_$$.sql"
    log "Decompressing backup..."
    gunzip -c "$BACKUP_FILE" > "$TEMP_FILE"
    RESTORE_FILE="$TEMP_FILE"
else
    RESTORE_FILE="$BACKUP_FILE"
fi

log "Backup file: $BACKUP_FILE"
log "Backup size: $(du -h "$BACKUP_FILE" | cut -f1)"

# Confirm before proceeding
warning "This will DESTROY all current data and replace it with the backup!"
read -p "Are you sure you want to continue? (yes/no): " -r CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    log "Restore cancelled"
    [ -f "$TEMP_FILE" ] && rm "$TEMP_FILE"
    exit 0
fi

# Check if container is running
if ! docker ps | grep -q "$CONTAINER_NAME"; then
    error "Container '$CONTAINER_NAME' is not running!"
    exit 1
fi

log "Dropping current database..."
docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -c "DROP DATABASE IF EXISTS $DB_NAME;" || true

log "Creating fresh database..."
docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -c "CREATE DATABASE $DB_NAME;"

log "Restoring from backup..."
docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" "$DB_NAME" < "$RESTORE_FILE"

log "Verifying restore..."
USER_COUNT=$(docker exec "$CONTAINER_NAME" psql -U "$DB_USER" "$DB_NAME" -t -c "SELECT COUNT(*) FROM \"User\";")
log "Users in database: $USER_COUNT"

# Cleanup temp file if it was created
[ -f "$TEMP_FILE" ] && rm "$TEMP_FILE"

log "Restarting API and Worker apps..."
pm2 restart api worker

log "=== Restore Complete ==="
log "Database has been restored successfully"
log "Apps are restarting and should be online shortly"
