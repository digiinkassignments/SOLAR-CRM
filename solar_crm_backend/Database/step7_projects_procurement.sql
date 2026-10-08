-- ============================================================
-- Solar CRM — Projects & Procurement Management System
-- Step 7: Projects, Stage Logs, and Purchase Orders Tables
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- --------------------------------------------------------
-- Table structure for table `projects`
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `projects` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `project_number` VARCHAR(30) NOT NULL,
  `lead_id` INT(11) DEFAULT NULL,
  `quotation_id` INT(11) DEFAULT NULL,
  `customer_name` VARCHAR(150) NOT NULL,
  `customer_phone` VARCHAR(20) NOT NULL,
  `customer_address` TEXT DEFAULT NULL,
  `city` VARCHAR(100) DEFAULT NULL,
  `state` VARCHAR(100) DEFAULT NULL,
  `pincode` VARCHAR(20) DEFAULT NULL,
  `system_capacity_kw` DECIMAL(6,2) NOT NULL,
  `panel_count` INT(11) DEFAULT NULL,
  `inverter_kw` DECIMAL(6,2) DEFAULT NULL,
  `stage` ENUM(
    'Order Closed',
    'Procurement',
    'Pre-Install Inspection',
    'Installation In Progress',
    'Commissioning',
    'DISCOM Application',
    'Subsidy Applied',
    'Handover Done',
    'Warranty Period'
  ) NOT NULL DEFAULT 'Order Closed',
  `stage_updated_at` TIMESTAMP NULL DEFAULT NULL,
  `assigned_to` INT(11) DEFAULT NULL,
  `assigned_by` INT(11) DEFAULT NULL,
  `installation_start_date` DATE DEFAULT NULL,
  `installation_end_date` DATE DEFAULT NULL,
  `completion_date` DATE DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `is_deleted` TINYINT(1) NOT NULL DEFAULT 0,
  `created_by` INT(11) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_project_number` (`project_number`),
  KEY `idx_project_lead` (`lead_id`),
  KEY `idx_project_quotation` (`quotation_id`),
  KEY `idx_project_stage` (`stage`),
  KEY `idx_project_assigned_to` (`assigned_to`),
  KEY `idx_project_assigned_by` (`assigned_by`),
  KEY `idx_project_is_deleted` (`is_deleted`),
  KEY `idx_project_created_by` (`created_by`),
  CONSTRAINT `fk_project_lead` FOREIGN KEY (`lead_id`) REFERENCES `leads` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_project_quotation` FOREIGN KEY (`quotation_id`) REFERENCES `quotations` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_project_assigned_to` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_project_assigned_by` FOREIGN KEY (`assigned_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_project_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `project_stage_logs`
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `project_stage_logs` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `project_id` INT(11) NOT NULL,
  `from_stage` VARCHAR(60) DEFAULT NULL,
  `to_stage` VARCHAR(60) NOT NULL,
  `changed_by` INT(11) DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_stage_log_project` (`project_id`),
  KEY `idx_stage_log_changed_by` (`changed_by`),
  CONSTRAINT `fk_stage_log_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_stage_log_changed_by` FOREIGN KEY (`changed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `purchase_orders`
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `purchase_orders` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `po_number` VARCHAR(30) NOT NULL,
  `project_id` INT(11) DEFAULT NULL,
  `vendor_name` VARCHAR(150) NOT NULL,
  `vendor_phone` VARCHAR(20) DEFAULT NULL,
  `vendor_email` VARCHAR(150) DEFAULT NULL,
  `items` JSON NOT NULL,
  `total_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `status` ENUM(
    'Draft',
    'Sent',
    'Confirmed',
    'Partial Delivery',
    'Delivered',
    'Cancelled'
  ) NOT NULL DEFAULT 'Draft',
  `expected_delivery_date` DATE DEFAULT NULL,
  `actual_delivery_date` DATE DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `is_deleted` TINYINT(1) NOT NULL DEFAULT 0,
  `created_by` INT(11) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_po_number` (`po_number`),
  KEY `idx_po_project` (`project_id`),
  KEY `idx_po_status` (`status`),
  KEY `idx_po_is_deleted` (`is_deleted`),
  KEY `idx_po_created_by` (`created_by`),
  CONSTRAINT `fk_po_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_po_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
