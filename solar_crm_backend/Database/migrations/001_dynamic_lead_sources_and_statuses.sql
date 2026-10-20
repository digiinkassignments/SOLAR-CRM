-- Migration: 001_dynamic_lead_sources_and_statuses.sql
-- Automatically synced to all client tenant DBs

-- 1. Create table custom_lead_sources
CREATE TABLE IF NOT EXISTS `custom_lead_sources` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL UNIQUE,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `is_default` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Create table custom_lead_statuses (Pipeline Stages)
CREATE TABLE IF NOT EXISTS `custom_lead_statuses` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL UNIQUE,
  `color_code` VARCHAR(20) NOT NULL DEFAULT '#1A73E8',
  `stage_order` INT NOT NULL DEFAULT 0,
  `is_won` TINYINT(1) NOT NULL DEFAULT 0,
  `is_lost` TINYINT(1) NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `is_default` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Alter leads table to allow dynamic values (expand ENUM to VARCHAR)
ALTER TABLE `leads` MODIFY COLUMN `lead_source` VARCHAR(100) NOT NULL DEFAULT 'Other';
ALTER TABLE `leads` MODIFY COLUMN `status` VARCHAR(100) NOT NULL DEFAULT 'New Lead';

-- 4. Seed default lead sources if table is empty
INSERT IGNORE INTO `custom_lead_sources` (`name`, `is_active`, `is_default`) VALUES
('Website', 1, 1),
('Call', 1, 1),
('WhatsApp', 1, 1),
('Reference', 1, 1),
('Facebook', 1, 1),
('Google', 1, 1),
('Cold Call', 1, 1),
('Direct', 1, 1),
('Other', 1, 1);

-- 5. Seed default pipeline stages if table is empty
INSERT IGNORE INTO `custom_lead_statuses` (`name`, `color_code`, `stage_order`, `is_won`, `is_lost`, `is_active`, `is_default`) VALUES
('New Lead', '#1A73E8', 1, 0, 0, 1, 1),
('Contacted', '#0284C7', 2, 0, 0, 1, 1),
('Follow-up Pending', '#D97706', 3, 0, 0, 1, 1),
('Site Visit Scheduled', '#7C3AED', 4, 0, 0, 1, 1),
('Quotation Sent', '#EA580C', 5, 0, 0, 1, 1),
('Negotiation', '#2563EB', 6, 0, 0, 1, 1),
('Won', '#16A34A', 7, 1, 0, 1, 1),
('Lost', '#DC2626', 8, 0, 1, 1, 1),
('Not Interested', '#64748B', 9, 0, 1, 1, 1);
