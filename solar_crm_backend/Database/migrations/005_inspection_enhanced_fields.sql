-- Migration 005: Add Enhanced Engineering & DISCOM Fields to project_inspections table
-- Supports Roof Orientation/Tilt, Shadow-Free Area, Sanctioned Load, Consumer No, GPS Coordinates, Photos, Sign-Off

ALTER TABLE project_inspections
  MODIFY COLUMN overall_status VARCHAR(50) DEFAULT 'Pending';

ALTER TABLE project_inspections
  ADD COLUMN IF NOT EXISTS roof_orientation VARCHAR(50) DEFAULT 'South' AFTER roof_type,
  ADD COLUMN IF NOT EXISTS roof_tilt_angle DECIMAL(5,2) DEFAULT NULL AFTER roof_orientation,
  ADD COLUMN IF NOT EXISTS shadow_free_area_sqft DECIMAL(10,2) DEFAULT NULL AFTER roof_area_sqft,
  ADD COLUMN IF NOT EXISTS sanctioned_load_kw DECIMAL(10,2) DEFAULT NULL AFTER existing_load_kw,
  ADD COLUMN IF NOT EXISTS consumer_number VARCHAR(100) DEFAULT NULL AFTER sanctioned_load_kw,
  ADD COLUMN IF NOT EXISTS gps_coordinates VARCHAR(100) DEFAULT NULL AFTER site_access,
  ADD COLUMN IF NOT EXISTS site_photos TEXT DEFAULT NULL AFTER additional_challenges,
  ADD COLUMN IF NOT EXISTS customer_signature_name VARCHAR(100) DEFAULT NULL AFTER remarks,
  ADD COLUMN IF NOT EXISTS signature_date DATE DEFAULT NULL AFTER customer_signature_name;

