#!/bin/bash
set -e

echo "=== [1. RUNNING MIGRATION 008 ACROSS ALL DATABASES] ==="
CLIENT_DBS=$(mysql db_digiink_master -sN -e "SELECT db_name FROM clients WHERE status != 'Deleted'" 2>/dev/null || echo "")

for db in solar_crm $CLIENT_DBS; do
  mysql $db -e "
    ALTER TABLE project_final_inspection 
      MODIFY COLUMN inspection_status VARCHAR(60) DEFAULT 'Pending',
      MODIFY COLUMN inspector_type VARCHAR(60) DEFAULT 'Internal QA / QC';
  " 2>/dev/null || true

  for col_sql in \
    "ADD COLUMN rework_status VARCHAR(50) DEFAULT 'Not Applicable' AFTER corrections_needed" \
    "ADD COLUMN reinspection_date DATE DEFAULT NULL AFTER rework_status" \
    "ADD COLUMN structure_checklist JSON DEFAULT NULL AFTER installation_quality" \
    "ADD COLUMN electrical_checklist JSON DEFAULT NULL AFTER safety_compliance" \
    "ADD COLUMN inverter_earthing_checklist JSON DEFAULT NULL AFTER electrical_checklist" \
    "ADD COLUMN documents_checklist JSON DEFAULT NULL AFTER document_verification" \
    "ADD COLUMN inspection_photos TEXT DEFAULT NULL AFTER remarks" \
    "ADD COLUMN customer_signature_name VARCHAR(100) DEFAULT NULL AFTER inspection_photos" \
    "ADD COLUMN customer_acknowledged TINYINT(1) DEFAULT 0 AFTER customer_signature_name" \
    "ADD COLUMN inspector_signoff TINYINT(1) DEFAULT 0 AFTER customer_acknowledged"
  do
    mysql $db -e "ALTER TABLE project_final_inspection $col_sql;" 2>/dev/null || true
  done
done

echo "=== [2. RESTARTING BACKEND PM2] ==="
pm2 restart solar-crm-backend

echo "=== [3. BUILDING FRONTEND ON VPS] ==="
cd /var/www/solar_crm/solar_crm_frontend
npm run build

echo "=== [4. VERIFYING PM2 STATUS] ==="
pm2 status solar-crm-backend
