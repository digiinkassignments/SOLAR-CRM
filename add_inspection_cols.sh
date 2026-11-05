#!/bin/bash
CLIENT_DBS=$(mysql db_digiink_master -sN -e "SELECT db_name FROM clients WHERE status != 'Deleted'" 2>/dev/null || echo "")

for db in $CLIENT_DBS; do
  echo "Adding enhanced inspection columns to $db..."
  mysql $db -e "
    ALTER TABLE project_inspections MODIFY COLUMN overall_status VARCHAR(50) DEFAULT 'Pending';
  " 2>/dev/null || true

  for col_sql in \
    "ADD COLUMN roof_orientation VARCHAR(50) DEFAULT 'South' AFTER roof_type" \
    "ADD COLUMN roof_tilt_angle DECIMAL(5,2) DEFAULT NULL AFTER roof_orientation" \
    "ADD COLUMN shadow_free_area_sqft DECIMAL(10,2) DEFAULT NULL AFTER roof_area_sqft" \
    "ADD COLUMN sanctioned_load_kw DECIMAL(10,2) DEFAULT NULL AFTER existing_load_kw" \
    "ADD COLUMN consumer_number VARCHAR(100) DEFAULT NULL AFTER sanctioned_load_kw" \
    "ADD COLUMN gps_coordinates VARCHAR(100) DEFAULT NULL AFTER site_access" \
    "ADD COLUMN site_photos TEXT DEFAULT NULL AFTER additional_challenges" \
    "ADD COLUMN customer_signature_name VARCHAR(100) DEFAULT NULL AFTER remarks" \
    "ADD COLUMN signature_date DATE DEFAULT NULL AFTER customer_signature_name"
  do
    mysql $db -e "ALTER TABLE project_inspections $col_sql;" 2>/dev/null || true
  done
done

echo "Done! Verifying db_client_003:"
mysql -e "DESCRIBE db_client_003.project_inspections;"
