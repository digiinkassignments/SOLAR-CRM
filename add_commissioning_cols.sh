#!/bin/bash
CLIENT_DBS=$(mysql db_digiink_master -sN -e "SELECT db_name FROM clients WHERE status != 'Deleted'" 2>/dev/null || echo "")

for db in $CLIENT_DBS; do
  echo "Adding enhanced commissioning columns to $db..."
  mysql $db -e "ALTER TABLE project_commissioning MODIFY COLUMN overall_result VARCHAR(50) DEFAULT 'Pending';" 2>/dev/null || true

  for col_sql in \
    "ADD COLUMN anti_islanding_test VARCHAR(20) DEFAULT NULL AFTER safety_shutdowns" \
    "ADD COLUMN insulation_resistance_mohm DECIMAL(8,2) DEFAULT NULL AFTER wiring_insulation" \
    "ADD COLUMN earth_resistance_ohm DECIMAL(8,2) DEFAULT NULL AFTER grounding_check" \
    "ADD COLUMN dc_current_amps DECIMAL(8,2) DEFAULT NULL AFTER panel_output_voltage" \
    "ADD COLUMN inverter_display_status VARCHAR(100) DEFAULT NULL AFTER inverter_output_kw" \
    "ADD COLUMN meter_serial_number VARCHAR(100) DEFAULT NULL AFTER meter_reading_kwh" \
    "ADD COLUMN net_meter_import_kwh DECIMAL(10,2) DEFAULT NULL AFTER meter_serial_number" \
    "ADD COLUMN net_meter_export_kwh DECIMAL(10,2) DEFAULT NULL AFTER net_meter_import_kwh" \
    "ADD COLUMN generation_meter_kwh DECIMAL(10,2) DEFAULT NULL AFTER net_meter_export_kwh" \
    "ADD COLUMN meter_photo_url TEXT DEFAULT NULL AFTER remarks" \
    "ADD COLUMN inverter_photo_url TEXT DEFAULT NULL AFTER meter_photo_url" \
    "ADD COLUMN customer_signature_name VARCHAR(100) DEFAULT NULL AFTER inverter_photo_url" \
    "ADD COLUMN customer_acknowledged TINYINT(1) DEFAULT 0 AFTER customer_signature_name" \
    "ADD COLUMN engineer_signoff TINYINT(1) DEFAULT 0 AFTER customer_acknowledged"
  do
    mysql $db -e "ALTER TABLE project_commissioning $col_sql;" 2>/dev/null || true
  done
done

echo "Done! Verifying db_client_003:"
mysql -e "DESCRIBE db_client_003.project_commissioning;"

