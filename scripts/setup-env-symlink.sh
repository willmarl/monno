#!/bin/bash

################################################################################
#                    Environment Symlink Setup Script                          #
#                                                                              #
#  Creates symlinks for .env files in all apps (api, web, worker)            #
#  so they all share the same source of truth from the root directory.        #
#                                                                              #
#  Usage: pnpm run setup:env:symlinks                                         #
################################################################################

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the root directory
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         Setting up environment file symlinks               ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to create symlinks for an app
setup_app_symlinks() {
  local app_name=$1
  local app_dir="$ROOT_DIR/apps/$app_name"
  
  if [ ! -d "$app_dir" ]; then
    echo -e "${YELLOW}⚠️  App directory not found: $app_dir${NC}"
    return 1
  fi
  
  echo -e "${BLUE}📁 Setting up symlinks for: $app_name${NC}"
  
  # .env
  if [ -f "$ROOT_DIR/.env" ]; then
    rm -f "$app_dir/.env"
    ln -s "../../.env" "$app_dir/.env"
    echo -e "${GREEN}  ✓ .env${NC}"
  else
    echo -e "${YELLOW}  ⚠️  Root .env not found${NC}"
  fi
  
  # .env.local
  if [ -f "$ROOT_DIR/.env.local" ]; then
    rm -f "$app_dir/.env.local"
    ln -s "../../.env.local" "$app_dir/.env.local"
    echo -e "${GREEN}  ✓ .env.local${NC}"
  else
    echo -e "${YELLOW}  ⚠️  Root .env.local not found${NC}"
  fi
  
  # .env.production
  if [ -f "$ROOT_DIR/.env.production" ]; then
    rm -f "$app_dir/.env.production"
    ln -s "../../.env.production" "$app_dir/.env.production"
    echo -e "${GREEN}  ✓ .env.production${NC}"
  else
    echo -e "${YELLOW}  ⚠️  Root .env.production not found${NC}"
  fi
  
  echo ""
}

# Setup each app
setup_app_symlinks "api"
setup_app_symlinks "web"
setup_app_symlinks "worker"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}✓ Environment symlinks setup complete!${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Summary:${NC}"
echo "  • All apps now share env files from root directory"
echo "  • Changes to root .env files will affect all apps"
echo "  • Symlinks: .env, .env.local, .env.production"
echo ""
