-- Migration 007: Enhanced Solar Commissioning & Anti-Islanding Protection
-- Real electrical measurements: Megger Insulation, Earth Resistance, DC Current, Anti-Islanding, Net Meter readings, Auto-Cert, Sign-off

ALTER TABLE project_commissioning
  MODIFY COLUMN overall_result VARCHAR(50) DEFAULT 'Pending';

-- Columns added safely across tenant DBs
