#!/bin/bash
###############################################################################
# Database backup for the Docker production stack (monno-prod).
#
# Runs pg_dump inside the compose `db` service, gzips the dump, then applies
# GFS-style retention (same dump files — no separate weekly/monthly copies):
#   - keep all dumps from the last KEEP_DAILY_DAYS (default 7)
#   - then 1 dump per ISO week for KEEP_WEEKLY_WEEKS (default 4)
#   - then 1 dump per calendar month for KEEP_MONTHLY_MONTHS (default 3)
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
KEEP_DAILY_DAYS="${KEEP_DAILY_DAYS:-7}"
KEEP_WEEKLY_WEEKS="${KEEP_WEEKLY_WEEKS:-4}"
KEEP_MONTHLY_MONTHS="${KEEP_MONTHLY_MONTHS:-3}"

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

# GFS prune: keep recent dailies, then newest-per-week, then newest-per-month.
prune_backups() {
  local today daily_start weekly_start monthly_start
  today=$(date +%Y-%m-%d)
  daily_start=$(date -d "$today - ${KEEP_DAILY_DAYS} days" +%Y-%m-%d)
  weekly_start=$(date -d "$daily_start - $((KEEP_WEEKLY_WEEKS * 7)) days" +%Y-%m-%d)
  monthly_start=$(date -d "$(date -d "$weekly_start" +%Y-%m-01) - ${KEEP_MONTHLY_MONTHS} months" +%Y-%m-%d)

  log "Retention: daily>=${daily_start} (${KEEP_DAILY_DAYS}d), weekly>=${weekly_start} (${KEEP_WEEKLY_WEEKS}w), monthly>=${monthly_start} (${KEEP_MONTHLY_MONTHS}m)"

  declare -A keep=()
  declare -A weekly_best=()
  declare -A weekly_best_name=()
  declare -A monthly_best=()
  declare -A monthly_best_name=()

  shopt -s nullglob
  local file base file_date week_key month_key base_name
  for file in "$BACKUP_DIR"/backup-*.sql.gz; do
    base=$(basename "$file")
    if [[ ! "$base" =~ ^backup-([0-9]{4}-[0-9]{2}-[0-9]{2})_ ]]; then
      log "Skipping unrecognized backup name: $base"
      continue
    fi
    file_date="${BASH_REMATCH[1]}"

    if [[ "$file_date" > "$today" ]]; then
      keep["$file"]=1
      continue
    fi

    if [[ "$file_date" > "$daily_start" || "$file_date" == "$daily_start" ]]; then
      keep["$file"]=1
      continue
    fi

    if [[ "$file_date" > "$weekly_start" || "$file_date" == "$weekly_start" ]]; then
      week_key=$(date -d "$file_date" +%G-W%V)
      base_name="$base"
      if [[ -z "${weekly_best[$week_key]:-}" || "$base_name" > "${weekly_best_name[$week_key]}" ]]; then
        weekly_best["$week_key"]="$file"
        weekly_best_name["$week_key"]="$base_name"
      fi
      continue
    fi

    if [[ "$file_date" > "$monthly_start" || "$file_date" == "$monthly_start" ]]; then
      month_key=$(date -d "$file_date" +%Y-%m)
      base_name="$base"
      if [[ -z "${monthly_best[$month_key]:-}" || "$base_name" > "${monthly_best_name[$month_key]}" ]]; then
        monthly_best["$month_key"]="$file"
        monthly_best_name["$month_key"]="$base_name"
      fi
      continue
    fi
    # Older than monthly horizon — will be deleted unless somehow kept above
  done

  local key
  for key in "${!weekly_best[@]}"; do
    keep["${weekly_best[$key]}"]=1
  done
  for key in "${!monthly_best[@]}"; do
    keep["${monthly_best[$key]}"]=1
  done

  local deleted=0
  for file in "$BACKUP_DIR"/backup-*.sql.gz; do
    base=$(basename "$file")
    if [[ ! "$base" =~ ^backup-([0-9]{4}-[0-9]{2}-[0-9]{2})_ ]]; then
      continue
    fi
    if [[ -z "${keep[$file]:-}" ]]; then
      log "Deleting: $base"
      rm -f "$file"
      deleted=$((deleted + 1))
    fi
  done

  if [ "$deleted" -eq 0 ]; then
    log "No old backups to delete"
  else
    log "Deleted $deleted backup(s)"
  fi
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

log "Applying GFS retention..."
prune_backups

log "Current backups:"
ls -lh "$BACKUP_DIR"/backup-*.sql.gz 2>/dev/null | awk '{print "  " $9 " (" $5 ")"}' || true

log "=== Backup Complete ==="
