-- Migration 008: Enhanced Final QA/QC Inspection & Pre-Handover Rework Tracking
-- Supports Sub-checklists (Structure, Electrical, Inverter, Documents), Rework Status, Re-inspection Date, Sign-offs

ALTER TABLE project_final_inspection
  MODIFY COLUMN inspection_status VARCHAR(60) DEFAULT 'Pending',
  MODIFY COLUMN inspector_type VARCHAR(60) DEFAULT 'Internal QA / QC';

-- Columns added safely across tenant DBs via add_final_inspection_cols.sh
