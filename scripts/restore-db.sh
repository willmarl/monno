#!/bin/bash
###############################################################################
# Database restore for the Docker production stack (monno-prod).
#
# Stops api/worker, drops/recreates the DB, restores from a gzipped (or plain)
# SQL dump, then brings api/worker back up.
#
# Usage:
#   bash scripts/restore-db.sh /opt/apps/monno/backups/backup-2026-03-15_140000.sql.gz
###############################################################################

set -Eeuo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ ! -f ".env.prod" ]; then
  echo "Missing $ROOT/.env.prod" >&2
  exit 1
fi

if [ ! -f "docker-compose.prod.yml" ]; then
  echo "Missing $ROOT/docker-compose.prod.yml" >&2
  exit 1
fi

# shellcheck source=/dev/null
set -a
source ".env.prod"
set +a

BACKUP_DIR="${BACKUP_DIR:-$ROOT/backups}"
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-appdb}"

COMPOSE=(
  docker compose
  -p monno-prod
  --env-file .env.prod
  -f docker-compose.prod.yml
)

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
  echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
  echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" >&2
}

warning() {
  echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

TEMP_FILE=""
STARTED_APPS=0

cleanup() {
  if [ -n "$TEMP_FILE" ] && [ -f "$TEMP_FILE" ]; then
    rm -f "$TEMP_FILE"
  fi
  # If we stopped apps and then failed mid-restore, try to bring them back.
  if [ "$STARTED_APPS" = "1" ]; then
    warning "Restore interrupted — attempting to start api and worker..."
    "${COMPOSE[@]}" up -d --no-build api worker || true
  fi
}
trap cleanup EXIT

if [ -z "${1:-}" ]; then
  error "No backup file specified!"
  echo ""
  echo "Usage: bash scripts/restore-db.sh <backup-file>"
  echo "Example: bash scripts/restore-db.sh $BACKUP_DIR/backup-2026-03-15_140000.sql.gz"
  echo ""
  echo "Available backups:"
  ls -lh "$BACKUP_DIR"/backup-*.sql.gz 2>/dev/null | awk '{print "  " $9 " (" $5 ")"}' || echo "  (none found in $BACKUP_DIR)"
  exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
  error "Backup file not found: $BACKUP_FILE"
  exit 1
fi

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

warning "This will DESTROY all current data in '$DB_NAME' and replace it with the backup!"
read -r -p "Are you sure you want to continue? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
  log "Restore cancelled"
  exit 0
fi

if ! "${COMPOSE[@]}" ps --status running --services 2>/dev/null | grep -qx "db"; then
  error "Compose service 'db' is not running (project monno-prod)."
  exit 1
fi

log "Stopping api and worker (to release DB connections)..."
"${COMPOSE[@]}" stop api worker
STARTED_APPS=1

log "Terminating remaining sessions on $DB_NAME..."
"${COMPOSE[@]}" exec -T db psql -U "$DB_USER" -d postgres -v ON_ERROR_STOP=1 -c \
  "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();" \
  >/dev/null || true

log "Dropping current database..."
"${COMPOSE[@]}" exec -T db psql -U "$DB_USER" -d postgres -v ON_ERROR_STOP=1 -c \
  "DROP DATABASE IF EXISTS \"$DB_NAME\";"

log "Creating fresh database..."
"${COMPOSE[@]}" exec -T db psql -U "$DB_USER" -d postgres -v ON_ERROR_STOP=1 -c \
  "CREATE DATABASE \"$DB_NAME\";"

log "Restoring from backup..."
"${COMPOSE[@]}" exec -T db psql -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 < "$RESTORE_FILE"

log "Verifying restore..."
USER_COUNT=$("${COMPOSE[@]}" exec -T db psql -U "$DB_USER" -d "$DB_NAME" -t -A -c 'SELECT COUNT(*) FROM "User";')
log "Users in database: $USER_COUNT"

log "Starting api and worker..."
"${COMPOSE[@]}" up -d --no-build api worker
STARTED_APPS=0

log "=== Restore Complete ==="
log "Database has been restored successfully"
log "Api and worker are starting; check: docker compose -p monno-prod --env-file .env.prod -f docker-compose.prod.yml ps"
