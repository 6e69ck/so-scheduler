#!/bin/bash

# --- Configuration ---
ADMIN_PORT=3000
VIEWER_PORT=3001
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

# Check if Admin is running, if so restart, else start
if pm2 show $ADMIN_NAME > /dev/null; then
    echo -e "${GREEN}>>> Restarting $ADMIN_NAME...${NC}"
    pm2 restart $ADMIN_NAME
else
    echo -e "${GREEN}>>> Starting $ADMIN_NAME for the first time...${NC}"
    cd so-scheduling
    PORT=$ADMIN_PORT pm2 start pnpm --name "$ADMIN_NAME" -- start
    cd ..
fi

# Check if Viewer is running, if so restart, else start
if pm2 show $VIEWER_NAME > /dev/null; then
    echo -e "${GREEN}>>> Restarting $VIEWER_NAME...${NC}"
    pm2 restart $VIEWER_NAME
else
    echo -e "${GREEN}>>> Starting $VIEWER_NAME for the first time...${NC}"
    cd so-scheduling-viewer
    PORT=$VIEWER_PORT pm2 start pnpm --name "$VIEWER_NAME" -- start
    cd ..
fi

# 5. Save PM2 state
pm2 save

echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}   DEPLOYMENT COMPLETED SUCCESSFULLYFUL   ${NC}"
echo -e "${GREEN}   Admin: http://localhost:$ADMIN_PORT    ${NC}"
echo -e "${GREEN}   Viewer: http://localhost:$VIEWER_PORT   ${NC}"
echo -e "${GREEN}=========================================${NC}"
