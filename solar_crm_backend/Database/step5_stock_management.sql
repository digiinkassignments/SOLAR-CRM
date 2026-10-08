-- ============================================================
-- Solar CRM — Stock Management System
-- Step 5: Stock Management Tables
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- --------------------------------------------------------
-- 1. Stock Categories
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `stock_categories` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `slug` VARCHAR(100) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `icon` VARCHAR(50) DEFAULT NULL,
  `sort_order` INT(11) DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_category_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Default Categories
INSERT IGNORE INTO `stock_categories` (`name`, `slug`, `description`, `icon`, `sort_order`) VALUES
('Solar Panels', 'solar-panels', 'Mono PERC, Bifacial, Poly panels', 'solar_power', 1),
('Inverters', 'inverters', 'On-Grid, Off-Grid, Hybrid inverters', 'electric_meter', 2),
('Mounting Structure', 'mounting-structure', 'GI, Aluminium mounting structures', 'architecture', 3),
('DC Cables & Connectors', 'dc-cables', 'DC cables, MC4 connectors, junction boxes', 'cable', 4),
('AC Cables & Switchgear', 'ac-cables', 'AC cables, MCB, ACDB, DCDB panels', 'power', 5),
('Earthing & Lightning', 'earthing', 'Earthing kits, lightning arrestors', 'bolt', 6),
('Battery & Storage', 'battery', 'Lithium, Lead-acid batteries', 'battery_charging_full', 7),
('Tools & Consumables', 'tools', 'Installation tools, lugs, conduit pipes', 'build', 8),
('Monitoring & Others', 'monitoring', 'Data loggers, wi-fi dongles, others', 'monitoring', 9);

-- --------------------------------------------------------
-- 2. Stock Items (Product Catalog)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `stock_items` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `category_id` INT(11) NOT NULL,
  `item_code` VARCHAR(50) NOT NULL,
  `barcode` VARCHAR(100) DEFAULT NULL,
  `name` VARCHAR(200) NOT NULL,
  `brand` VARCHAR(100) DEFAULT NULL,
  `model` VARCHAR(100) DEFAULT NULL,
  `description` TEXT DEFAULT NULL,
  `specifications` JSON DEFAULT NULL,
  `image_url` VARCHAR(500) DEFAULT NULL,
  `unit` ENUM('Piece','Set','Meter','Kg','Litre','Roll','Pair','Box') NOT NULL DEFAULT 'Piece',
  `unit_price` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `gst_rate` DECIMAL(5,2) NOT NULL DEFAULT 18.00,
  `hsn_code` VARCHAR(20) DEFAULT NULL,
  `min_stock_level` INT(11) NOT NULL DEFAULT 5,
  `reorder_level` INT(11) NOT NULL DEFAULT 10,
  `current_stock` INT(11) NOT NULL DEFAULT 0,
  `reserved_stock` INT(11) NOT NULL DEFAULT 0,
  `available_stock` INT(11) GENERATED ALWAYS AS (`current_stock` - `reserved_stock`) STORED,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_by` INT(11) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_item_code` (`item_code`),
  KEY `idx_item_barcode` (`barcode`),
  KEY `idx_item_category` (`category_id`),
  KEY `idx_item_brand` (`brand`),
  KEY `idx_item_active` (`is_active`),
  CONSTRAINT `fk_item_category` FOREIGN KEY (`category_id`) REFERENCES `stock_categories` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_item_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 3. Stock Transactions (IN/OUT/TRANSFER/ADJUSTMENT)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `stock_transactions` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `transaction_number` VARCHAR(50) NOT NULL,
  `item_id` INT(11) NOT NULL,
  `transaction_type` ENUM('IN','OUT','ADJUSTMENT','RESERVED','RELEASED') NOT NULL,
  `quantity` INT(11) NOT NULL,
  `quantity_before` INT(11) NOT NULL DEFAULT 0,
  `quantity_after` INT(11) NOT NULL DEFAULT 0,
  `unit_price` DECIMAL(12,2) DEFAULT NULL,
  `total_value` DECIMAL(14,2) DEFAULT NULL,
  `reference_type` ENUM('PURCHASE','LEAD','PROJECT','ADJUSTMENT','RETURN','DAMAGE') DEFAULT NULL,
  `reference_id` INT(11) DEFAULT NULL,
  `reference_number` VARCHAR(100) DEFAULT NULL,
  `vendor_name` VARCHAR(200) DEFAULT NULL,
  `vendor_invoice` VARCHAR(100) DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `created_by` INT(11) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_transaction_number` (`transaction_number`),
  KEY `idx_txn_item` (`item_id`),
  KEY `idx_txn_type` (`transaction_type`),
  KEY `idx_txn_ref` (`reference_type`, `reference_id`),
  KEY `idx_txn_created_by` (`created_by`),
  CONSTRAINT `fk_txn_item` FOREIGN KEY (`item_id`) REFERENCES `stock_items` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_txn_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 4. Stock Alerts
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `stock_alerts` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `item_id` INT(11) NOT NULL,
  `alert_type` ENUM('LOW_STOCK','OUT_OF_STOCK','REORDER') NOT NULL,
  `current_stock` INT(11) NOT NULL,
  `min_stock_level` INT(11) NOT NULL,
  `is_resolved` TINYINT(1) NOT NULL DEFAULT 0,
  `resolved_at` DATETIME DEFAULT NULL,
  `resolved_by` INT(11) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_alert_item` (`item_id`),
  KEY `idx_alert_type` (`alert_type`),
  KEY `idx_alert_resolved` (`is_resolved`),
  CONSTRAINT `fk_alert_item` FOREIGN KEY (`item_id`) REFERENCES `stock_items` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
