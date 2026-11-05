#!/bin/bash
CLIENT_DBS=$(mysql db_digiink_master -sN -e "SELECT db_name FROM clients WHERE status != 'Deleted'" 2>/dev/null || echo "")

for db in $CLIENT_DBS; do
  echo "Adding enhanced handover columns to $db..."
  mysql $db -e "
    ALTER TABLE project_handover 
      MODIFY COLUMN handover_status VARCHAR(60) DEFAULT 'Pending';
  " 2>/dev/null || true

  for col_sql in \
    "ADD COLUMN customer_rating INT DEFAULT 5 AFTER customer_feedback" \
    "ADD COLUMN signed_docket_url TEXT DEFAULT NULL AFTER customer_signature" \
    "ADD COLUMN handover_photo_url TEXT DEFAULT NULL AFTER signed_docket_url" \
    "ADD COLUMN monitoring_app_access_shared TINYINT(1) DEFAULT 0 AFTER app_demo_completed" \
    "ADD COLUMN first_service_due_date DATE DEFAULT NULL AFTER warranty_start_date" \
    "ADD COLUMN documents_pack_checklist JSON DEFAULT NULL AFTER inverter_manual" \
    "ADD COLUMN module_warranty_years INT DEFAULT 25 AFTER warranty_start_date" \
    "ADD COLUMN module_warranty_end DATE DEFAULT NULL AFTER module_warranty_years" \
    "ADD COLUMN inverter_warranty_years INT DEFAULT 5 AFTER module_warranty_end" \
    "ADD COLUMN inverter_warranty_end DATE DEFAULT NULL AFTER inverter_warranty_years" \
    "ADD COLUMN workmanship_warranty_years INT DEFAULT 5 AFTER inverter_warranty_end" \
    "ADD COLUMN workmanship_warranty_end DATE DEFAULT NULL AFTER workmanship_warranty_years" \
    "ADD COLUMN amc_warranty_years INT DEFAULT 1 AFTER workmanship_warranty_end" \
    "ADD COLUMN amc_warranty_end DATE DEFAULT NULL AFTER amc_warranty_years" \
    "ADD COLUMN signature_signatory_name VARCHAR(100) DEFAULT NULL AFTER signed_docket_url" \
    "ADD COLUMN signature_phone VARCHAR(20) DEFAULT NULL AFTER signature_signatory_name"
  do
    mysql $db -e "ALTER TABLE project_handover $col_sql;" 2>/dev/null || true
  done
done

echo "Done! Verifying db_client_003:"
mysql -e "DESCRIBE db_client_003.project_handover;"

