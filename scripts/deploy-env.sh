#!/bin/bash

set -e

# Exit on Ctrl+C
trap 'echo "❌ Deployment cancelled!"; exit 1' INT

# Change to project root
cd "$(dirname "$0")/.."

# Load environment variables from .env.deploy
if [ ! -f "$(dirname "$0")/.env.deploy" ]; then
  echo "❌ .env.deploy file not found!"
  exit 1
fi

source "$(dirname "$0")/.env.deploy"

# Verify all required variables are set
if [ -z "$DEPLOY_USER" ]; then
  echo "❌ DEPLOY_USER not set in .env.deploy!"
  exit 1
fi

if [ -z "$DEPLOY_HOST" ]; then
  echo "❌ DEPLOY_HOST not set in .env.deploy!"
  exit 1
fi

if [ -z "$DEPLOY_PATH" ]; then
  echo "❌ DEPLOY_PATH not set in .env.deploy!"
  exit 1
fi

echo "🚀 Deploying environment files to $DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_PATH"

# Deploy .env.deploy
if [ -f scripts/.env.deploy ]; then
  echo "📄 Uploading .env.deploy..."
  scp scripts/.env.deploy $DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_PATH/scripts/
else
  echo "⚠️  No scripts/.env.deploy found (skipping)"
fi

# Deploy API .env
if [ -f apps/api/.env ]; then
  echo "📄 Uploading API .env..."
  scp apps/api/.env $DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_PATH/apps/api/
else
  echo "⚠️  No apps/api/.env found (skipping)"
fi

# building with nextjs will use env local over production if env local is present
# # Deploy Web .env.local
# if [ -f apps/web/.env.local ]; then
#   echo "📄 Uploading Web .env.local..."
#   scp apps/web/.env.local $DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_PATH/apps/web/
# else
#   echo "⚠️  No apps/web/.env.local found (skipping)"
# fi

# Deploy Web .env.production
if [ -f apps/web/.env.production ]; then
  echo "📄 Uploading Web .env.production..."
  scp apps/web/.env.production $DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_PATH/apps/web/
else
  echo "⚠️  No apps/web/.env.production found (skipping)"
fi

# Deploy Worker .env
if [ -f apps/worker/.env ]; then
  echo "📄 Uploading Worker .env..."
  scp apps/worker/.env $DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_PATH/apps/worker/
else
  echo "⚠️  No apps/worker/.env found (skipping)"
fi

echo ""
echo "✅ Environment files updated!"
echo ""
