-- ============================================================
-- 004: Update Project Stages to 10 Real-world Solar EPC stages
-- Automatically synced across all tenant DBs by autoMigrateAllTenants()
-- ============================================================

-- 1. Modify stage column to VARCHAR(60) to support dynamic and refined 10 stages
ALTER TABLE `projects` MODIFY COLUMN `stage` VARCHAR(60) NOT NULL DEFAULT 'Order Closed';

-- 2. Update any legacy stage names if needed
UPDATE `projects` SET `stage` = 'Pre-Install Inspection' WHERE `stage` = 'Site Survey';
UPDATE `projects` SET `stage` = 'Commissioning' WHERE `stage` = 'Testing & Commissioning';
