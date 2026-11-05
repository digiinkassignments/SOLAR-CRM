#!/bin/bash
set -e

SERVER="root@200.234.46.234"
REMOTE_BACKEND="/var/www/solar_crm/solar_crm_backend"
REMOTE_FRONTEND="/var/www/solar_crm/solar_crm_frontend"

echo ">>> [1/4] Uploading Handover backend model to VPS..."
scp solar_crm_backend/models/handoverModel.js $SERVER:$REMOTE_BACKEND/models/handoverModel.js

echo ">>> [2/4] Uploading CustomerHandover.jsx to VPS..."
scp solar_crm_frontend/src/pages/Admin/Projects/tabs/CustomerHandover.jsx $SERVER:$REMOTE_FRONTEND/src/pages/Admin/Projects/tabs/CustomerHandover.jsx

echo ">>> [3/4] Restarting PM2 backend on VPS..."
ssh $SERVER "pm2 restart solar-crm-backend"

echo ">>> [4/4] Building production frontend on VPS..."
ssh $SERVER "cd $REMOTE_FRONTEND && npm run build"

echo "=========================================================="
echo "    CUSTOMER HANDOVER STAGE DEPLOYED SUCCESSFULLY!        "
echo "=========================================================="
