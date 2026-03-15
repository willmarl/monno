#!/bin/bash

set -e

# Exit on Ctrl+C
trap 'echo "❌ Deployment cancelled!"; exit 1' INT

# Load environment variables
if [ ! -f "$(dirname "$0")/.env.deploy" ]; then
  echo "❌ .env.deploy file not found!"
  exit 1
fi

source "$(dirname "$0")/.env.deploy"

# Verify DEPLOY_PATH is set
if [ -z "$DEPLOY_PATH" ]; then
  echo "❌ DEPLOY_PATH not set in .env.deploy!"
  exit 1
fi

echo "🚀 Starting VM deployment at $(date)"
echo "📁 Working directory: $DEPLOY_PATH"

# Navigate to deployment directory
if [ ! -d "$DEPLOY_PATH" ]; then
  echo "❌ Deployment directory not found: $DEPLOY_PATH"
  exit 1
fi

cd "$DEPLOY_PATH"

# Pull latest code
echo ""
echo "📥 Pulling latest code..."
git pull origin main

# Update dependencies
echo ""
echo "📦 Installing production dependencies..."
pnpm install --prod

# Run database migrations if needed
echo ""
echo "🗄️  Running database migrations..."
cd apps/api
pnpm prisma migrate deploy
pnpm prisma generate
cd ../worker
pnpm prisma migrate deploy
pnpm prisma generate

# Build all apps
echo ""
echo "🔨 Building all apps..."
pnpm run build

# Restart services with PM2
echo ""
echo "🔄 Restarting services..."
pm2 restart ecosystem.config.js

# Show status
echo ""
echo "✅ Deployment complete!"
echo ""
pm2 status
echo ""
echo "📊 Check logs with:"
echo "   pm2 logs api --follow"
echo "   pm2 logs web --follow"
echo "   pm2 logs worker --follow"
echo ""
