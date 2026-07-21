#!/bin/bash

set -e  # Exit on error

# api owns the canonical schema + migrations; worker gets a synced copy
echo "Syncing Prisma schema (api -> worker)..."
bash "$(dirname "$0")/sync-prisma-schema.sh"

echo "Migrating apps/api..."
cd apps/api
pnpm prisma migrate deploy
pnpm prisma generate

echo "Generating client for apps/worker..."
cd ../worker
pnpm prisma generate

echo "Done!"
