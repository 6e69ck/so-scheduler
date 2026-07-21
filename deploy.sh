#!/bin/bash

# Exit on any error
set -e

# --- Configuration ---
ADMIN_PORT=3003
VIEWER_PORT=3004
HUB_PORT=3006

ADMIN_NAME="so-admin"
VIEWER_NAME="so-viewer"
HUB_NAME="so-hub"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Determine monorepo root directory dynamically
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$SCRIPT_DIR"

echo -e "${BLUE}>>> Starting Soaring Eagles Monorepo Deployment...${NC}"
echo -e "${BLUE}>>> Monorepo Root: $ROOT_DIR${NC}"

# 1. Pull latest changes
echo -e "${BLUE}>>> Pulling latest changes from GitHub...${NC}"
cd "$ROOT_DIR"
git pull origin main || true

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

# 4. Setup so-hub (Hub)
echo -e "${BLUE}>>> Building Hub App (so-hub)...${NC}"
cd "$ROOT_DIR/so-hub"
pnpm install
pnpm build
if [ ! -d ".next" ]; then
    echo -e "${RED}>>> Hub .next directory not found! Build failed.${NC}"
    exit 1
fi

# 5. Manage PM2 Processes
echo -e "${BLUE}>>> Updating PM2 processes...${NC}"

# Stop and delete existing to ensure clean state
pm2 delete $ADMIN_NAME 2>/dev/null || true
pm2 delete $VIEWER_NAME 2>/dev/null || true
pm2 delete $HUB_NAME 2>/dev/null || true

# Start Admin
echo -e "${GREEN}>>> Starting $ADMIN_NAME on port $ADMIN_PORT...${NC}"
cd "$ROOT_DIR/so-scheduling"
PORT=$ADMIN_PORT pm2 start "npx next start -p $ADMIN_PORT" --name "$ADMIN_NAME"

# Start Viewer
echo -e "${GREEN}>>> Starting $VIEWER_NAME on port $VIEWER_PORT...${NC}"
cd "$ROOT_DIR/so-scheduling-viewer"
PORT=$VIEWER_PORT pm2 start "npx next start -p $VIEWER_PORT" --name "$VIEWER_NAME"

# Start Hub
echo -e "${GREEN}>>> Starting $HUB_NAME on port $HUB_PORT...${NC}"
cd "$ROOT_DIR/so-hub"
PORT=$HUB_PORT pm2 start "npx next start -p $HUB_PORT" --name "$HUB_NAME"

# 6. Save PM2 state
pm2 save

echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}   DEPLOYMENT COMPLETED SUCCESSFULLY      ${NC}"
echo -e "${GREEN}   Admin:  http://localhost:$ADMIN_PORT    ${NC}"
echo -e "${GREEN}   Viewer: http://localhost:$VIEWER_PORT   ${NC}"
echo -e "${GREEN}   Hub:    http://localhost:$HUB_PORT   ${NC}"
echo -e "${GREEN}=========================================${NC}"
