USE db_client_003;

CREATE TABLE IF NOT EXISTS subsidy_applications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_order_id INT DEFAULT NULL,
  lead_id INT NOT NULL,
  consumer_number VARCHAR(50) NOT NULL,
  application_number VARCHAR(50) DEFAULT NULL,
  scheme_name VARCHAR(100) DEFAULT 'PM Surya Ghar Muft Bijli Yojana',
  portal_status VARCHAR(50) DEFAULT 'registered',
  submission_date DATE DEFAULT NULL,
  approval_date DATE DEFAULT NULL,
  subsidy_amount DECIMAL(10, 2) DEFAULT 0,
  portal_notes TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
);

SET @dbname = DATABASE();

DROP PROCEDURE IF EXISTS AddSubsidyCols;
DELIMITER //
CREATE PROCEDURE AddSubsidyCols()
BEGIN
  IF NOT EXISTS (SELECT * FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'subsidy_applications' AND COLUMN_NAME = 'discom_name') THEN
    ALTER TABLE subsidy_applications ADD COLUMN discom_name VARCHAR(100) DEFAULT 'JVVNL';
  END IF;
  IF NOT EXISTS (SELECT * FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'subsidy_applications' AND COLUMN_NAME = 'discom_division') THEN
    ALTER TABLE subsidy_applications ADD COLUMN discom_division VARCHAR(100) DEFAULT NULL;
  END IF;
  IF NOT EXISTS (SELECT * FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'subsidy_applications' AND COLUMN_NAME = 'bank_name') THEN
    ALTER TABLE subsidy_applications ADD COLUMN bank_name VARCHAR(100) DEFAULT NULL;
  END IF;
  IF NOT EXISTS (SELECT * FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'subsidy_applications' AND COLUMN_NAME = 'bank_account_no') THEN
    ALTER TABLE subsidy_applications ADD COLUMN bank_account_no VARCHAR(50) DEFAULT NULL;
  END IF;
  IF NOT EXISTS (SELECT * FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'subsidy_applications' AND COLUMN_NAME = 'bank_ifsc') THEN
    ALTER TABLE subsidy_applications ADD COLUMN bank_ifsc VARCHAR(30) DEFAULT NULL;
  END IF;
  IF NOT EXISTS (SELECT * FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'subsidy_applications' AND COLUMN_NAME = 'bank_account_holder') THEN
    ALTER TABLE subsidy_applications ADD COLUMN bank_account_holder VARCHAR(150) DEFAULT NULL;
  END IF;
  IF NOT EXISTS (SELECT * FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'subsidy_applications' AND COLUMN_NAME = 'panel_make_model') THEN
    ALTER TABLE subsidy_applications ADD COLUMN panel_make_model VARCHAR(150) DEFAULT NULL;
  END IF;
  IF NOT EXISTS (SELECT * FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'subsidy_applications' AND COLUMN_NAME = 'panel_serial_numbers') THEN
    ALTER TABLE subsidy_applications ADD COLUMN panel_serial_numbers TEXT DEFAULT NULL;
  END IF;
  IF NOT EXISTS (SELECT * FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'subsidy_applications' AND COLUMN_NAME = 'is_dcr_compliant') THEN
    ALTER TABLE subsidy_applications ADD COLUMN is_dcr_compliant TINYINT(1) DEFAULT 1;
  END IF;
  IF NOT EXISTS (SELECT * FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'subsidy_applications' AND COLUMN_NAME = 'inverter_make_model') THEN
    ALTER TABLE subsidy_applications ADD COLUMN inverter_make_model VARCHAR(150) DEFAULT NULL;
  END IF;
  IF NOT EXISTS (SELECT * FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'subsidy_applications' AND COLUMN_NAME = 'inverter_serial_number') THEN
    ALTER TABLE subsidy_applications ADD COLUMN inverter_serial_number VARCHAR(100) DEFAULT NULL;
  END IF;
  IF NOT EXISTS (SELECT * FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'subsidy_applications' AND COLUMN_NAME = 'expected_subsidy') THEN
    ALTER TABLE subsidy_applications ADD COLUMN expected_subsidy DECIMAL(10,2) DEFAULT 78000.00;
  END IF;
  IF NOT EXISTS (SELECT * FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'subsidy_applications' AND COLUMN_NAME = 'amount_received') THEN
    ALTER TABLE subsidy_applications ADD COLUMN amount_received DECIMAL(10,2) DEFAULT 0.00;
  END IF;
  IF NOT EXISTS (SELECT * FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'subsidy_applications' AND COLUMN_NAME = 'credit_date') THEN
    ALTER TABLE subsidy_applications ADD COLUMN credit_date DATE DEFAULT NULL;
  END IF;
  IF NOT EXISTS (SELECT * FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'subsidy_applications' AND COLUMN_NAME = 'utr_number') THEN
    ALTER TABLE subsidy_applications ADD COLUMN utr_number VARCHAR(100) DEFAULT NULL;
  END IF;
  IF NOT EXISTS (SELECT * FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'subsidy_applications' AND COLUMN_NAME = 'customer_total_cost') THEN
    ALTER TABLE subsidy_applications ADD COLUMN customer_total_cost DECIMAL(10,2) DEFAULT 0.00;
  END IF;
  IF NOT EXISTS (SELECT * FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'subsidy_applications' AND COLUMN_NAME = 'customer_amount_paid') THEN
    ALTER TABLE subsidy_applications ADD COLUMN customer_amount_paid DECIMAL(10,2) DEFAULT 0.00;
  END IF;
  IF NOT EXISTS (SELECT * FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'subsidy_applications' AND COLUMN_NAME = 'customer_balance') THEN
    ALTER TABLE subsidy_applications ADD COLUMN customer_balance DECIMAL(10,2) DEFAULT 0.00;
  END IF;
  IF NOT EXISTS (SELECT * FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'subsidy_applications' AND COLUMN_NAME = 'sla_expected_days') THEN
    ALTER TABLE subsidy_applications ADD COLUMN sla_expected_days INT DEFAULT 15;
  END IF;
  IF NOT EXISTS (SELECT * FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'subsidy_applications' AND COLUMN_NAME = 'stage_started_at') THEN
    ALTER TABLE subsidy_applications ADD COLUMN stage_started_at DATETIME DEFAULT CURRENT_TIMESTAMP;
  END IF;
  IF NOT EXISTS (SELECT * FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'subsidy_applications' AND COLUMN_NAME = 'rejection_category') THEN
    ALTER TABLE subsidy_applications ADD COLUMN rejection_category VARCHAR(100) DEFAULT NULL;
  END IF;
  IF NOT EXISTS (SELECT * FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'subsidy_applications' AND COLUMN_NAME = 'rejection_fix_task') THEN
    ALTER TABLE subsidy_applications ADD COLUMN rejection_fix_task TEXT DEFAULT NULL;
  END IF;
END //
DELIMITER ;

CALL AddSubsidyCols();
DROP PROCEDURE IF EXISTS AddSubsidyCols;

CREATE TABLE IF NOT EXISTS subsidy_rejection_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  subsidy_id INT DEFAULT NULL,
  lead_id INT NOT NULL,
  stage_at_rejection VARCHAR(60) NOT NULL,
  rejection_category VARCHAR(100) NOT NULL,
  rejection_reason TEXT NOT NULL,
  fix_task TEXT NOT NULL,
  fix_status VARCHAR(50) DEFAULT 'pending',
  resolved_at DATETIME DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (lead_id)
);

