#!/bin/bash

set -e  # Exit on error

echo "Migrating apps/api..."
cd apps/api
pnpm prisma migrate deploy
pnpm prisma generate

echo "Migrating apps/worker..."
cd ../worker
pnpm prisma migrate deploy
pnpm prisma generate

echo "Done!"
