#!/bin/bash
echo "=== Migrating Warranty & AMC columns across tenant DBs ==="

for db in db_client_003 db_client_004 db_client_005 db_client_007; do
  echo "Checking DB: $db"
  mysql -N -e "
    use $db;
    SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='$db' AND TABLE_NAME='project_warranty_amc' AND COLUMN_NAME='warranty_certificate_no'
  " | grep -q 1 || mysql $db -e "ALTER TABLE project_warranty_amc ADD COLUMN warranty_certificate_no VARCHAR(60) DEFAULT NULL;"

  mysql -N -e "
    use $db;
    SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='$db' AND TABLE_NAME='project_warranty_amc' AND COLUMN_NAME='panel_product_warranty_years'
  " | grep -q 1 || mysql $db -e "ALTER TABLE project_warranty_amc ADD COLUMN panel_product_warranty_years INT DEFAULT 12;"

  mysql -N -e "
    use $db;
    SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='$db' AND TABLE_NAME='project_warranty_amc' AND COLUMN_NAME='panel_product_warranty_end'
  " | grep -q 1 || mysql $db -e "ALTER TABLE project_warranty_amc ADD COLUMN panel_product_warranty_end DATE DEFAULT NULL;"

  mysql -N -e "
    use $db;
    SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='$db' AND TABLE_NAME='project_warranty_amc' AND COLUMN_NAME='panel_performance_warranty_years'
  " | grep -q 1 || mysql $db -e "ALTER TABLE project_warranty_amc ADD COLUMN panel_performance_warranty_years INT DEFAULT 25;"

  mysql -N -e "
    use $db;
    SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='$db' AND TABLE_NAME='project_warranty_amc' AND COLUMN_NAME='panel_performance_warranty_end'
  " | grep -q 1 || mysql $db -e "ALTER TABLE project_warranty_amc ADD COLUMN panel_performance_warranty_end DATE DEFAULT NULL;"

  mysql -N -e "
    use $db;
    SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='$db' AND TABLE_NAME='project_warranty_amc' AND COLUMN_NAME='inverter_warranty_end'
  " | grep -q 1 || mysql $db -e "ALTER TABLE project_warranty_amc ADD COLUMN inverter_warranty_end DATE DEFAULT NULL;"

  mysql -N -e "
    use $db;
    SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='$db' AND TABLE_NAME='project_warranty_amc' AND COLUMN_NAME='installation_warranty_end'
  " | grep -q 1 || mysql $db -e "ALTER TABLE project_warranty_amc ADD COLUMN installation_warranty_end DATE DEFAULT NULL;"

  mysql -N -e "
    use $db;
    SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='$db' AND TABLE_NAME='project_warranty_amc' AND COLUMN_NAME='free_service_end_date'
  " | grep -q 1 || mysql $db -e "ALTER TABLE project_warranty_amc ADD COLUMN free_service_end_date DATE DEFAULT NULL;"

  mysql -N -e "
    use $db;
    SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='$db' AND TABLE_NAME='project_warranty_amc' AND COLUMN_NAME='amc_payment_status'
  " | grep -q 1 || mysql $db -e "ALTER TABLE project_warranty_amc ADD COLUMN amc_payment_status VARCHAR(50) DEFAULT 'Paid';"

  mysql -N -e "
    use $db;
    SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='$db' AND TABLE_NAME='project_warranty_amc' AND COLUMN_NAME='amc_renewal_date'
  " | grep -q 1 || mysql $db -e "ALTER TABLE project_warranty_amc ADD COLUMN amc_renewal_date DATE DEFAULT NULL;"

  mysql -N -e "
    use $db;
    SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='$db' AND TABLE_NAME='project_warranty_amc' AND COLUMN_NAME='panel_serial_numbers'
  " | grep -q 1 || mysql $db -e "ALTER TABLE project_warranty_amc ADD COLUMN panel_serial_numbers TEXT DEFAULT NULL;"

  mysql -N -e "
    use $db;
    SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='$db' AND TABLE_NAME='project_warranty_amc' AND COLUMN_NAME='inverter_serial_number'
  " | grep -q 1 || mysql $db -e "ALTER TABLE project_warranty_amc ADD COLUMN inverter_serial_number VARCHAR(100) DEFAULT NULL;"

  mysql -N -e "
    use $db;
    SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='$db' AND TABLE_NAME='project_warranty_amc' AND COLUMN_NAME='monitoring_portal_url'
  " | grep -q 1 || mysql $db -e "ALTER TABLE project_warranty_amc ADD COLUMN monitoring_portal_url VARCHAR(255) DEFAULT 'https://monitoring.solaxcloud.com';"

  mysql -N -e "
    use $db;
    SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='$db' AND TABLE_NAME='project_warranty_amc' AND COLUMN_NAME='monitoring_plant_id'
  " | grep -q 1 || mysql $db -e "ALTER TABLE project_warranty_amc ADD COLUMN monitoring_plant_id VARCHAR(100) DEFAULT 'SOLAR-PLANT-004';"

  mysql -N -e "
    use $db;
    SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='$db' AND TABLE_NAME='project_warranty_amc' AND COLUMN_NAME='monitoring_username'
  " | grep -q 1 || mysql $db -e "ALTER TABLE project_warranty_amc ADD COLUMN monitoring_username VARCHAR(100) DEFAULT 'rajesh.sharma@solax';"

  mysql -N -e "
    use $db;
    SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='$db' AND TABLE_NAME='project_warranty_amc' AND COLUMN_NAME='warranty_docket_url'
  " | grep -q 1 || mysql $db -e "ALTER TABLE project_warranty_amc ADD COLUMN warranty_docket_url TEXT DEFAULT NULL;"

  mysql -N -e "
    use $db;
    SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='$db' AND TABLE_NAME='project_warranty_amc' AND COLUMN_NAME='scheduled_visits'
  " | grep -q 1 || mysql $db -e "ALTER TABLE project_warranty_amc ADD COLUMN scheduled_visits JSON DEFAULT NULL;"

done

echo "=== Migration Finished ==="
