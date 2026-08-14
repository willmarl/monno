#!/bin/bash
###############################################################################
# Database backup for the Docker production stack (monno-prod).
#
# Runs pg_dump inside the compose `db` service, gzips the dump, and prunes
# backups older than KEEP_DAYS.
#
# Usage (from deploy root, next to .env.prod):
#   bash scripts/backup-db.sh
#
# Cron example:
#   0 2 * * * bash /opt/apps/monno/scripts/backup-db.sh >> /opt/apps/monno/backups/backup.log 2>&1
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
KEEP_DAYS="${KEEP_DAYS:-7}"

COMPOSE=(
  docker compose
  -p monno-prod
  --env-file .env.prod
  -f docker-compose.prod.yml
)

mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +%Y-%m-%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup-$TIMESTAMP.sql"
BACKUP_FILE_GZ="$BACKUP_FILE.gz"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

log "=== Starting Database Backup ==="
log "Backup directory: $BACKUP_DIR"
log "Database: $DB_NAME (user: $DB_USER)"

if ! "${COMPOSE[@]}" ps --status running --services 2>/dev/null | grep -qx "db"; then
  log "ERROR: Compose service 'db' is not running (project monno-prod)."
  exit 1
fi

log "Creating backup..."
if "${COMPOSE[@]}" exec -T db pg_dump -U "$DB_USER" "$DB_NAME" > "$BACKUP_FILE"; then
  log "Backup created: $BACKUP_FILE"
else
  log "ERROR: Failed to create backup!"
  rm -f "$BACKUP_FILE"
  exit 1
fi

BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
log "Backup size: $BACKUP_SIZE"

log "Compressing backup..."
if gzip "$BACKUP_FILE"; then
  log "Compressed: $BACKUP_FILE_GZ"
  COMPRESSED_SIZE=$(du -h "$BACKUP_FILE_GZ" | cut -f1)
  log "Compressed size: $COMPRESSED_SIZE"
else
  log "ERROR: Failed to compress backup!"
  exit 1
fi

log "Cleaning up backups older than $KEEP_DAYS days..."
if find "$BACKUP_DIR" -name "backup-*.sql.gz" -mtime +"$KEEP_DAYS" -print -quit | grep -q .; then
  find "$BACKUP_DIR" -name "backup-*.sql.gz" -mtime +"$KEEP_DAYS" -delete
  log "Deleted old backups"
else
  log "No old backups to delete"
fi

log "Current backups:"
ls -lh "$BACKUP_DIR"/backup-*.sql.gz 2>/dev/null | awk '{print "  " $9 " (" $5 ")"}' || true

log "=== Backup Complete ==="
