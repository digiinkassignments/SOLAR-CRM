-- Migration Script: Step 6 - Invoices and Billing Management
-- For VPS DB / Client Database execution

SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS `invoices` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `invoice_number` VARCHAR(50) NOT NULL UNIQUE,
  `public_token` VARCHAR(64) NOT NULL UNIQUE,
  `quotation_id` INT DEFAULT NULL,
  `lead_id` INT DEFAULT NULL,
  `customer_name` VARCHAR(150) NOT NULL,
  `customer_email` VARCHAR(150) DEFAULT NULL,
  `customer_phone` VARCHAR(20) NOT NULL,
  `customer_address` TEXT DEFAULT NULL,
  `city` VARCHAR(100) DEFAULT NULL,
  `state` VARCHAR(100) DEFAULT NULL,
  `pincode` VARCHAR(20) DEFAULT NULL,
  `customer_gstin` VARCHAR(50) DEFAULT NULL,
  
  `system_capacity_kw` DECIMAL(6,2) NOT NULL DEFAULT 1.00,
  `system_type` VARCHAR(50) DEFAULT 'On-Grid',
  `panel_specs` VARCHAR(255) DEFAULT 'Mono PERC 550W Half-Cut',
  `inverter_specs` VARCHAR(255) DEFAULT 'Solar Grid-Tied Inverter',
  `structure_type` VARCHAR(100) DEFAULT 'Elevated GI High-Grade Structure',
  
  `base_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `installation_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `discount_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `taxable_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `gst_rate` DECIMAL(5,2) NOT NULL DEFAULT 13.80,
  `cgst_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `sgst_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `igst_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `gst_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `gross_total` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `subsidy_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `net_payable_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  
  `amount_paid` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `balance_due` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `payment_status` ENUM('Paid', 'Partially Paid', 'Unpaid') NOT NULL DEFAULT 'Unpaid',
  `payment_mode` VARCHAR(50) DEFAULT 'Bank Transfer',
  `payment_reference` VARCHAR(100) DEFAULT NULL,
  `payment_date` DATE DEFAULT NULL,
  
  `invoice_date` DATE NOT NULL,
  `due_date` DATE DEFAULT NULL,
  `line_items` JSON DEFAULT NULL,
  `terms_and_conditions` TEXT DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'Issued',
  `created_by` INT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_inv_quotation` (`quotation_id`),
  KEY `idx_inv_lead` (`lead_id`),
  KEY `idx_inv_status` (`payment_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `invoice_payments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `invoice_id` INT NOT NULL,
  `amount` DECIMAL(12,2) NOT NULL,
  `payment_date` DATE NOT NULL,
  `payment_mode` VARCHAR(50) DEFAULT 'Bank Transfer',
  `reference_number` VARCHAR(100) DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `recorded_by` INT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_pay_invoice` (`invoice_id`),
  CONSTRAINT `fk_pay_invoice` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
