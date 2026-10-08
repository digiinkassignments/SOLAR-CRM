-- Migration Script: Step 4 - Deals, Orders & PM Surya Ghar Subsidy Hub (Stages 7 & 8)

-- 1. Project Orders Table (Stage 7: Deal Won & Token Payment)
CREATE TABLE IF NOT EXISTS `project_orders` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `lead_id` INT NOT NULL,
  `quotation_id` INT DEFAULT NULL,
  `order_number` VARCHAR(50) NOT NULL UNIQUE,
  `total_project_cost` DECIMAL(12, 2) NOT NULL,
  `advance_payment_amount` DECIMAL(12, 2) NOT NULL,
  `advance_payment_date` DATETIME NOT NULL,
  `payment_mode` VARCHAR(50) DEFAULT 'bank_transfer',
  `payment_reference` VARCHAR(100) DEFAULT NULL,
  `dealer_id` INT DEFAULT NULL,
  `dealer_commission` DECIMAL(10, 2) DEFAULT 0,
  `order_status` VARCHAR(50) DEFAULT 'booked',
  `contract_signed_at` DATETIME DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON DELETE CASCADE
);

-- 2. Subsidy Applications Table (Stage 8: PM Surya Ghar Hub)
CREATE TABLE IF NOT EXISTS `subsidy_applications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `project_order_id` INT DEFAULT NULL,
  `lead_id` INT NOT NULL,
  `consumer_number` VARCHAR(50) NOT NULL,
  `application_number` VARCHAR(50) DEFAULT NULL,
  `scheme_name` VARCHAR(100) DEFAULT 'PM Surya Ghar Muft Bijli Yojana',
  `portal_status` VARCHAR(50) DEFAULT 'docs_pending',
  `submission_date` DATE DEFAULT NULL,
  `approval_date` DATE DEFAULT NULL,
  `subsidy_amount` DECIMAL(10, 2) DEFAULT 0,
  `portal_notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON DELETE CASCADE
);

-- 3. Customer KYC Documents Table (Document Vault)
CREATE TABLE IF NOT EXISTS `customer_documents` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `lead_id` INT NOT NULL,
  `document_type` VARCHAR(50) NOT NULL,
  `file_name` VARCHAR(255) DEFAULT NULL,
  `file_url` VARCHAR(255) NOT NULL,
  `verification_status` VARCHAR(50) DEFAULT 'pending',
  `rejection_reason` VARCHAR(255) DEFAULT NULL,
  `uploaded_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON DELETE CASCADE
);
