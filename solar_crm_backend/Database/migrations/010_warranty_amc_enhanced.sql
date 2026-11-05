-- 010_warranty_amc_enhanced.sql
-- Enhanced Warranty & AMC tracking with multi-tier warranties, AMC coverage, visits schedule, and portal credentials

ALTER TABLE project_warranty_amc 
  ADD COLUMN IF NOT EXISTS warranty_certificate_no VARCHAR(60) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS panel_product_warranty_years INT DEFAULT 12,
  ADD COLUMN IF NOT EXISTS panel_product_warranty_end DATE DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS panel_performance_warranty_years INT DEFAULT 25,
  ADD COLUMN IF NOT EXISTS panel_performance_warranty_end DATE DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS inverter_warranty_end DATE DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS installation_warranty_end DATE DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS free_service_end_date DATE DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS amc_payment_status VARCHAR(50) DEFAULT 'Paid',
  ADD COLUMN IF NOT EXISTS amc_renewal_date DATE DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS panel_serial_numbers TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS inverter_serial_number VARCHAR(100) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS monitoring_portal_url VARCHAR(255) DEFAULT 'https://monitoring.solaxcloud.com',
  ADD COLUMN IF NOT EXISTS monitoring_plant_id VARCHAR(100) DEFAULT 'SOLAR-PLANT-004',
  ADD COLUMN IF NOT EXISTS monitoring_username VARCHAR(100) DEFAULT 'rajesh.sharma@solax',
  ADD COLUMN IF NOT EXISTS warranty_docket_url TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS scheduled_visits JSON DEFAULT NULL;

