-- Migration Script: Step 1 - Solar Calculations & Quotations Tables
-- For VPS DB / Client Database execution

SET FOREIGN_KEY_CHECKS = 0;

-- --------------------------------------------------------
-- Table structure for table `solar_calculations`
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `solar_calculations` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `lead_id` INT(11) DEFAULT NULL,
  `monthly_bill` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `monthly_units` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `property_type` ENUM('Residential', 'Commercial', 'Industrial') NOT NULL DEFAULT 'Residential',
  `connection_phase` ENUM('Single Phase', '3 Phase') NOT NULL DEFAULT 'Single Phase',
  `roof_area_sqft` DECIMAL(10,2) DEFAULT NULL,
  `tariff_rate` DECIMAL(6,2) NOT NULL DEFAULT 8.00,
  `recommended_kw` DECIMAL(6,2) NOT NULL,
  `panel_count` INT(11) NOT NULL,
  `panel_wattage` INT(11) NOT NULL DEFAULT 550,
  `inverter_kw` DECIMAL(6,2) NOT NULL,
  `required_area_sqft` DECIMAL(10,2) NOT NULL,
  `gross_cost` DECIMAL(12,2) NOT NULL,
  `subsidy_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `net_cost` DECIMAL(12,2) NOT NULL,
  `annual_generation_kwh` DECIMAL(10,2) NOT NULL,
  `annual_savings` DECIMAL(12,2) NOT NULL,
  `payback_years` DECIMAL(4,2) NOT NULL,
  `twenty_five_year_savings` DECIMAL(14,2) NOT NULL,
  `co2_offset_tonnes` DECIMAL(8,2) NOT NULL,
  `created_by` INT(11) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_calc_lead` (`lead_id`),
  KEY `idx_calc_created_by` (`created_by`),
  CONSTRAINT `fk_calc_lead` FOREIGN KEY (`lead_id`) REFERENCES `leads` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_calc_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `quotations`
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `quotations` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `quotation_number` VARCHAR(50) NOT NULL,
  `public_token` VARCHAR(64) NOT NULL,
  `lead_id` INT(11) DEFAULT NULL,
  `calculation_id` INT(11) DEFAULT NULL,
  `customer_name` VARCHAR(150) NOT NULL,
  `customer_email` VARCHAR(150) DEFAULT NULL,
  `customer_phone` VARCHAR(20) NOT NULL,
  `customer_address` TEXT DEFAULT NULL,
  `city` VARCHAR(100) DEFAULT NULL,
  `state` VARCHAR(100) DEFAULT NULL,
  `pincode` VARCHAR(20) DEFAULT NULL,
  `system_capacity_kw` DECIMAL(6,2) NOT NULL,
  `system_type` ENUM('On-Grid', 'Off-Grid', 'Hybrid') NOT NULL DEFAULT 'On-Grid',
  `panel_brand` VARCHAR(100) NOT NULL DEFAULT 'Waaree Mono PERC',
  `panel_type` VARCHAR(100) NOT NULL DEFAULT 'Mono PERC 550W Half-Cut',
  `panel_count` INT(11) NOT NULL,
  `inverter_brand` VARCHAR(100) NOT NULL DEFAULT 'Growatt / Solis / GoodWe',
  `inverter_capacity_kw` DECIMAL(6,2) NOT NULL,
  `structure_type` VARCHAR(100) NOT NULL DEFAULT 'Elevated GI High-Grade Structure',
  `battery_capacity_ah` VARCHAR(50) DEFAULT NULL,
  `base_price` DECIMAL(12,2) NOT NULL,
  `structure_installation_cost` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `gst_rate` DECIMAL(5,2) NOT NULL DEFAULT 13.80,
  `gst_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `discount_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `total_amount` DECIMAL(12,2) NOT NULL,
  `subsidy_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `net_payable_amount` DECIMAL(12,2) NOT NULL,
  `annual_generation_kwh` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `annual_savings` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `payback_years` DECIMAL(4,2) NOT NULL DEFAULT 0.00,
  `twenty_five_year_savings` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `status` ENUM('Draft', 'Sent', 'Accepted', 'Rejected', 'Expired') NOT NULL DEFAULT 'Sent',
  `valid_until` DATE DEFAULT NULL,
  `terms_and_conditions` TEXT DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `viewed_at` DATETIME DEFAULT NULL,
  `accepted_at` DATETIME DEFAULT NULL,
  `customer_signature_name` VARCHAR(150) DEFAULT NULL,
  `created_by` INT(11) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_quotation_number` (`quotation_number`),
  UNIQUE KEY `uq_public_token` (`public_token`),
  KEY `idx_quo_lead` (`lead_id`),
  KEY `idx_quo_calc` (`calculation_id`),
  KEY `idx_quo_status` (`status`),
  KEY `idx_quo_created_by` (`created_by`),
  CONSTRAINT `fk_quo_lead` FOREIGN KEY (`lead_id`) REFERENCES `leads` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_quo_calc` FOREIGN KEY (`calculation_id`) REFERENCES `solar_calculations` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_quo_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
