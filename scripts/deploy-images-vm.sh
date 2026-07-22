#!/bin/bash
# Pull and deploy an immutable image tag on the VM.
# This script never builds and does not require Node, pnpm, or source code.
#
# Usage:
#   bash scripts/deploy-images-vm.sh <image-tag>

set -Eeuo pipefail

IMAGE_TAG="${1:-}"
if [ -z "$IMAGE_TAG" ]; then
  echo "Usage: $0 <image-tag> (usually the git short SHA printed by images:publish)" >&2
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ ! -f ".env.prod" ]; then
  echo "Missing $ROOT/.env.prod (copy .env.prod.template and fill it in)." >&2
  exit 1
fi

for env_file in env/api.env env/worker.env; do
  if [ ! -f "$env_file" ]; then
    echo "Missing $ROOT/$env_file" >&2
    exit 1
  fi
done

COMPOSE=(
  docker compose
  -p monno-prod
  --env-file .env.prod
  -f docker-compose.prod.yml
)

echo "Pulling image tag: $IMAGE_TAG"
IMAGE_TAG="$IMAGE_TAG" "${COMPOSE[@]}" pull

echo "Deploying image tag: $IMAGE_TAG"
# --no-build guarantees a low-spec VM never starts a local image build.
IMAGE_TAG="$IMAGE_TAG" "${COMPOSE[@]}" up -d --no-build --remove-orphans

echo
IMAGE_TAG="$IMAGE_TAG" "${COMPOSE[@]}" ps
echo
echo "Migration output:"
IMAGE_TAG="$IMAGE_TAG" "${COMPOSE[@]}" logs migrate --tail 20
echo
echo "Deployed: $IMAGE_TAG"
