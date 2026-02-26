#!/bin/bash

# --- Configuration ---
ADMIN_PORT=3002
VIEWER_PORT=3003
ADMIN_NAME="so-admin"
VIEWER_NAME="so-viewer"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}>>> Starting Soaring Eagles Deployment...${NC}"

# 1. Pull latest changes
echo -e "${BLUE}>>> Pulling latest changes from GitHub...${NC}"
git pull origin main

# 2. Setup so-scheduling (Admin)
echo -e "${BLUE}>>> Building Admin App (so-scheduling)...${NC}"
cd so-scheduling
pnpm install --frozen-lockfile
pnpm build
cd ..

# 3. Setup so-scheduling-viewer (Viewer)
echo -e "${BLUE}>>> Building Viewer App (so-scheduling-viewer)...${NC}"
cd so-scheduling-viewer
pnpm install --frozen-lockfile
pnpm build
cd ..

# 4. Manage PM2 Processes
echo -e "${BLUE}>>> Updating PM2 processes...${NC}"

# Stop and delete existing to ensure clean port binding
pm2 delete $ADMIN_NAME 2>/dev/null
pm2 delete $VIEWER_NAME 2>/dev/null

# Start Admin using direct next binary call for reliability
echo -e "${GREEN}>>> Starting $ADMIN_NAME on port $ADMIN_PORT...${NC}"
cd so-scheduling
pm2 start "npx next start -p $ADMIN_PORT" --name "$ADMIN_NAME"
cd ..

# Start Viewer using direct next binary call for reliability
echo -e "${GREEN}>>> Starting $VIEWER_NAME on port $VIEWER_PORT...${NC}"
cd so-scheduling-viewer
pm2 start "npx next start -p $VIEWER_PORT" --name "$VIEWER_NAME"
cd ..

# 5. Save PM2 state
pm2 save

echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}   DEPLOYMENT COMPLETED SUCCESSFULLY      ${NC}"
echo -e "${GREEN}   Admin: http://localhost:$ADMIN_PORT    ${NC}"
echo -e "${GREEN}   Viewer: http://localhost:$VIEWER_PORT   ${NC}"
echo -e "${GREEN}=========================================${NC}"
