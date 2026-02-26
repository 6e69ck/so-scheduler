#!/bin/bash

# Exit on any error
set -e

# --- Configuration ---
ADMIN_PORT=3003
VIEWER_PORT=3004
ADMIN_NAME="so-admin"
VIEWER_NAME="so-viewer"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

ROOT_DIR=$(pwd)

echo -e "${BLUE}>>> Starting Soaring Eagles Deployment...${NC}"

# 1. Pull latest changes
echo -e "${BLUE}>>> Pulling latest changes from GitHub...${NC}"
git pull origin main

# 2. Setup so-scheduling (Admin)
echo -e "${BLUE}>>> Building Admin App (so-scheduling)...${NC}"
cd "$ROOT_DIR/so-scheduling"
pnpm install
pnpm build
if [ ! -d ".next" ]; then
    echo -e "${RED}>>> Admin .next directory not found! Build failed.${NC}"
    exit 1
fi

# 3. Setup so-scheduling-viewer (Viewer)
echo -e "${BLUE}>>> Building Viewer App (so-scheduling-viewer)...${NC}"
cd "$ROOT_DIR/so-scheduling-viewer"
pnpm install
pnpm build
if [ ! -d ".next" ]; then
    echo -e "${RED}>>> Viewer .next directory not found! Build failed.${NC}"
    exit 1
fi

# 4. Manage PM2 Processes
echo -e "${BLUE}>>> Updating PM2 processes...${NC}"

# Stop and delete existing to ensure clean state
pm2 delete $ADMIN_NAME 2>/dev/null || true
pm2 delete $VIEWER_NAME 2>/dev/null || true

# Start Admin
echo -e "${GREEN}>>> Starting $ADMIN_NAME on port $ADMIN_PORT...${NC}"
cd "$ROOT_DIR/so-scheduling"
PORT=$ADMIN_PORT pm2 start "npx next start -p $ADMIN_PORT" --name "$ADMIN_NAME"

# Start Viewer
echo -e "${GREEN}>>> Starting $VIEWER_NAME on port $VIEWER_PORT...${NC}"
cd "$ROOT_DIR/so-scheduling-viewer"
PORT=$VIEWER_PORT pm2 start "npx next start -p $VIEWER_PORT" --name "$VIEWER_NAME"

# 5. Save PM2 state
pm2 save

echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}   DEPLOYMENT COMPLETED SUCCESSFULLY      ${NC}"
echo -e "${GREEN}   Admin: http://localhost:$ADMIN_PORT    ${NC}"
echo -e "${GREEN}   Viewer: http://localhost:$VIEWER_PORT   ${NC}"
echo -e "${GREEN}=========================================${NC}"
