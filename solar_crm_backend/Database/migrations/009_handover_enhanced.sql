-- Migration 009: Enhanced Customer Handover & Commercial Clearance Tracking
-- Supports Multi-Component Warranty (Panels 25y, Inverter 5y, EPC 5y, AMC 1y), Star Rating, Signed Docket, Handover Photo, App Access, Payment Guard

ALTER TABLE project_handover
  MODIFY COLUMN handover_status VARCHAR(60) DEFAULT 'Pending';

-- Columns added safely across tenant DBs via add_handover_cols.sh
