#!/bin/bash
set -e

echo "=== [1. RUNNING MIGRATION 005 ON ALL TENANT DBS] ==="
CLIENT_DBS=$(mysql db_digiink_master -sN -e "SELECT db_name FROM clients WHERE status != 'Deleted'" 2>/dev/null || echo "")

for db in solar_crm $CLIENT_DBS; do
  echo "Migrating $db..."
  mysql $db < /var/www/solar_crm/solar_crm_backend/Database/migrations/005_inspection_enhanced_fields.sql 2>&1 || true
done

echo ""
echo "=== [2. VERIFYING COLUMNS IN db_client_003.project_inspections] ==="
mysql -e "DESCRIBE db_client_003.project_inspections;"

echo ""
echo "=== [3. RESTARTING PM2 BACKEND] ==="
pm2 restart solar-crm-backend

echo ""
echo "=== [4. BUILDING FRONTEND ON VPS] ==="
cd /var/www/solar_crm/solar_crm_frontend
npm run build

echo ""
echo "=== [DEPLOYMENT SUCCESSFUL] ==="
pm2 status solar-crm-backend

