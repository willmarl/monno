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
echo "📦 Installing dependencies..."
pnpm install

# Run database migrations if needed
echo ""
echo "🗄️  Running database migrations..."
cd "$DEPLOY_PATH/apps/api"
pnpm prisma migrate deploy
pnpm prisma generate
cd "$DEPLOY_PATH/apps/worker"
pnpm prisma migrate deploy
pnpm prisma generate

# Build all apps
echo ""
echo "🔨 Building all apps..."
pnpm run build

# Verify builds completed
echo ""
echo "⏳ Verifying build artifacts..."
if [ ! -d "$DEPLOY_PATH/apps/api/dist" ]; then
  echo "❌ API build failed - dist folder missing"
  exit 1
fi
if [ ! -d "$DEPLOY_PATH/apps/web/.next" ]; then
  echo "❌ Web build failed - .next folder missing"
  exit 1
fi
if [ ! -d "$DEPLOY_PATH/apps/worker/dist" ]; then
  echo "❌ Worker build failed - dist folder missing"
  exit 1
fi
echo "✓ All builds verified successfully"

# Restart services with PM2
echo ""
echo "🔄 Restarting services..."
pm2 restart api --update-env
pm2 restart worker --update-env
pm2 restart web --update-env

# Show status
echo ""
echo "✅ Deployment complete!"
echo ""
sleep 3
pm2 status
echo ""
echo "⚠️  If web shows offline, check logs:"
echo "   pm2 logs web --lines 50"
echo ""
echo "📊 Check logs with:"
echo "   pm2 logs api --follow"
echo "   pm2 logs web --follow"
echo "   pm2 logs worker --follow"
echo ""
