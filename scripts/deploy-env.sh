#!/bin/bash
# Upload environment files to the VM.
#
# Modes:
#   docker  (default) — pull-only Docker layout:
#             .env.prod, env/api.env, env/worker.env
#   bare              — PM2 / bare-metal layout:
#             apps/api/.env, apps/worker/.env, apps/web/.env.production
#
# Usage:
#   pnpm run deploy:env              # docker mode
#   pnpm run deploy:env -- docker
#   pnpm run deploy:env -- bare
#
# Requires scripts/.env.deploy with DEPLOY_HOST + DEPLOY_PATH.
# DEPLOY_USER is optional — omit it when DEPLOY_HOST is an SSH config Host
# alias that already sets User (e.g. Host deploytest → User ubuntu).

set -e

# Exit on Ctrl+C
trap 'echo "❌ Deployment cancelled!"; exit 1' INT

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT"

MODE="${1:-docker}"
case "$MODE" in
  docker|bare) ;;
  *)
    echo "Usage: $0 [docker|bare]"
    echo "  docker (default) — .env.prod + env/api.env + env/worker.env"
    echo "  bare             — apps/*/ .env files for PM2 deploy"
    exit 1
    ;;
esac

# Load environment variables from .env.deploy
if [ ! -f "$SCRIPT_DIR/.env.deploy" ]; then
  echo "❌ .env.deploy file not found!"
  echo "   Copy scripts/.env.deploy.template → scripts/.env.deploy and fill it in."
  exit 1
fi

# shellcheck source=/dev/null
source "$SCRIPT_DIR/.env.deploy"

if [ -z "$DEPLOY_HOST" ]; then
  echo "❌ DEPLOY_HOST not set in .env.deploy!"
  exit 1
fi

if [ -z "$DEPLOY_PATH" ]; then
  echo "❌ DEPLOY_PATH not set in .env.deploy!"
  exit 1
fi

# With User:  ubuntu@1.2.3.4  or  devuser@1.2.3.4
# Without:    deploytest      (SSH config Host alias that already has User)
if [ -n "${DEPLOY_USER:-}" ]; then
  REMOTE="${DEPLOY_USER}@${DEPLOY_HOST}"
else
  REMOTE="${DEPLOY_HOST}"
fi
uploaded=0
skipped=0

upload() {
  local src="$1"
  local dest="$2"
  local label="$3"

  if [ -f "$src" ]; then
    echo "📄 Uploading $label..."
    scp "$src" "${REMOTE}:${dest}"
    uploaded=$((uploaded + 1))
  else
    echo "⚠️  No $src found (skipping)"
    skipped=$((skipped + 1))
  fi
}

echo "🚀 Deploying env files ($MODE) → ${REMOTE}:${DEPLOY_PATH}"
echo ""

# Always ensure remote base + scripts dirs exist
ssh "$REMOTE" "mkdir -p '${DEPLOY_PATH}/scripts'"

# Always upload .env.deploy (used by other deploy scripts)
upload "scripts/.env.deploy" "${DEPLOY_PATH}/scripts/" "scripts/.env.deploy"

if [ "$MODE" = "docker" ]; then
  # Pull-only Docker layout — edit these on your PC, then run this script
  ssh "$REMOTE" "mkdir -p '${DEPLOY_PATH}/env'"

  upload ".env.prod" "${DEPLOY_PATH}/.env.prod" ".env.prod"
  upload "env/api.env" "${DEPLOY_PATH}/env/api.env" "env/api.env"
  upload "env/worker.env" "${DEPLOY_PATH}/env/worker.env" "env/worker.env"

  # Deployment bundle companions (not secrets, but needed next to the env files)
  upload "docker-compose.prod.yml" "${DEPLOY_PATH}/docker-compose.prod.yml" "docker-compose.prod.yml"
  upload "scripts/deploy-images-vm.sh" "${DEPLOY_PATH}/scripts/deploy-images-vm.sh" "scripts/deploy-images-vm.sh"
  upload "scripts/nginx.template" "${DEPLOY_PATH}/scripts/nginx.template" "scripts/nginx.template"

  # Make the VM update script executable after upload
  ssh "$REMOTE" "chmod +x '${DEPLOY_PATH}/scripts/deploy-images-vm.sh' 2>/dev/null || true"
else
  # Bare-metal / PM2 layout
  ssh "$REMOTE" "mkdir -p '${DEPLOY_PATH}/apps/api' '${DEPLOY_PATH}/apps/worker' '${DEPLOY_PATH}/apps/web'"

  upload ".env.docker" "${DEPLOY_PATH}/" ".env.docker"
  upload "apps/api/.env" "${DEPLOY_PATH}/apps/api/" "apps/api/.env"
  upload "apps/worker/.env" "${DEPLOY_PATH}/apps/worker/" "apps/worker/.env"
  # Next prefers .env.local over .env.production if both exist — don't upload .env.local
  upload "apps/web/.env.production" "${DEPLOY_PATH}/apps/web/" "apps/web/.env.production"
fi

echo ""
echo "✅ Done ($MODE): uploaded $uploaded file(s), skipped $skipped"
if [ "$MODE" = "docker" ]; then
  echo "   Next on VM: bash scripts/deploy-images-vm.sh <image-tag>"
fi
echo ""
