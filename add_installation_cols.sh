#!/bin/bash
CLIENT_DBS=$(mysql db_digiink_master -sN -e "SELECT db_name FROM clients WHERE status != 'Deleted'" 2>/dev/null || echo "")

for db in $CLIENT_DBS; do
  echo "Adding enhanced installation columns to $db..."
  mysql $db -e "ALTER TABLE installation_logs MODIFY COLUMN phase VARCHAR(80) NOT NULL;" 2>/dev/null || true

  for col_sql in \
    "ADD COLUMN is_phase_completed TINYINT(1) DEFAULT 0 AFTER phase" \
    "ADD COLUMN supervisor_name VARCHAR(100) DEFAULT NULL AFTER hours_worked" \
    "ADD COLUMN crew_names TEXT DEFAULT NULL AFTER supervisor_name" \
    "ADD COLUMN materials_json JSON DEFAULT NULL AFTER materials_used" \
    "ADD COLUMN weather VARCHAR(50) DEFAULT 'Sunny / Clear' AFTER progress_percent" \
    "ADD COLUMN safety_checklist JSON DEFAULT NULL AFTER weather" \
    "ADD COLUMN supervisor_signoff TINYINT(1) DEFAULT 0 AFTER safety_checklist" \
    "ADD COLUMN supervisor_signoff_time DATETIME DEFAULT NULL AFTER supervisor_signoff"
  do
    mysql $db -e "ALTER TABLE installation_logs $col_sql;" 2>/dev/null || true
  done

  for pcol_sql in \
    "ADD COLUMN caption VARCHAR(150) DEFAULT NULL AFTER photo_url" \
    "ADD COLUMN photo_tag VARCHAR(50) DEFAULT 'Work Progress' AFTER caption"
  do
    mysql $db -e "ALTER TABLE installation_log_photos $pcol_sql;" 2>/dev/null || true
  done
done

echo "Done! Verifying db_client_003:"
mysql -e "DESCRIBE db_client_003.installation_logs; DESCRIBE db_client_003.installation_log_photos;"

