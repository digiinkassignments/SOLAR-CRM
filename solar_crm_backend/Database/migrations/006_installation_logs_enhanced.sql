-- Migration 006: Enhanced Installation Progress Logs & Structured Execution Tracking
-- Supports 5 Solar Phases, Phase Completion Checkbox, Structured Materials, Supervisor & Crew, Weather, Safety Checklist, Captions for Photos

ALTER TABLE installation_logs
  MODIFY COLUMN phase VARCHAR(80) NOT NULL;

-- Safe column additions for MySQL 8 (executed via migration script)
