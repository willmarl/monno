#!/bin/bash
# Build and/or push versioned application images from a capable local machine.
#
# Required:
#   GHCR_OWNER=your-github-user
#   NEXT_PUBLIC_API_URL=https://api.example.com  (build/publish only)
#
# Optional:
#   IMAGE_PREFIX=monno
#   IMAGE_TAG=<tag>        (defaults to current git short SHA)
#   PLATFORM=linux/amd64   (match the VM architecture)
#
# Usage:
#   bash scripts/docker-images.sh build
#   bash scripts/docker-images.sh push
#   bash scripts/docker-images.sh publish  # build then push

set -Eeuo pipefail

MODE="${1:-}"
case "$MODE" in
  build|push|publish) ;;
  *)
    echo "Usage: $0 {build|push|publish}" >&2
    exit 1
    ;;
esac

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

: "${GHCR_OWNER:?Set GHCR_OWNER to your GitHub username or organization}"

IMAGE_PREFIX="${IMAGE_PREFIX:-monno}"
IMAGE_TAG="${IMAGE_TAG:-$(git rev-parse --short HEAD)}"
PLATFORM="${PLATFORM:-linux/amd64}"
REGISTRY="ghcr.io/${GHCR_OWNER}/"

if [[ "$MODE" == "build" || "$MODE" == "publish" ]]; then
  : "${NEXT_PUBLIC_API_URL:?Set NEXT_PUBLIC_API_URL to the browser-visible production API URL}"
  case "$NEXT_PUBLIC_API_URL" in
    http://*|https://*) ;;
    *)
      echo "NEXT_PUBLIC_API_URL must start with http:// or https://" >&2
      exit 1
      ;;
  esac

  echo "Building ${REGISTRY}${IMAGE_PREFIX}-*:${IMAGE_TAG}"
  echo "Platform: ${PLATFORM}"
  echo "Web API URL: ${NEXT_PUBLIC_API_URL}"

  DOCKER_DEFAULT_PLATFORM="$PLATFORM" \
  REGISTRY="$REGISTRY" \
  IMAGE_PREFIX="$IMAGE_PREFIX" \
  IMAGE_TAG="$IMAGE_TAG" \
  NEXT_PUBLIC_API_URL="$NEXT_PUBLIC_API_URL" \
    docker compose -p monno-publish -f docker-compose.stack.yml build
fi

if [[ "$MODE" == "push" || "$MODE" == "publish" ]]; then
  echo "Pushing ${REGISTRY}${IMAGE_PREFIX}-*:${IMAGE_TAG}"
  echo "If this fails with 'denied', run: docker login ghcr.io"

  REGISTRY="$REGISTRY" \
  IMAGE_PREFIX="$IMAGE_PREFIX" \
  IMAGE_TAG="$IMAGE_TAG" \
    docker compose -p monno-publish -f docker-compose.stack.yml push
fi

echo
echo "Published tag: ${IMAGE_TAG}"
echo "Deploy on VM:"
echo "  bash scripts/deploy-images-vm.sh ${IMAGE_TAG}"
