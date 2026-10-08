-- Migration Script: Step 3 - Site Surveys Table (Stages 3 & 4)

CREATE TABLE IF NOT EXISTS `site_surveys` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `lead_id` INT NOT NULL,
  `assigned_engineer_id` INT DEFAULT NULL,
  `scheduled_date` DATE NOT NULL,
  `scheduled_time` VARCHAR(20) NOT NULL,
  `status` ENUM('scheduled', 'completed', 'cancelled') DEFAULT 'scheduled',
  `roof_type` VARCHAR(50) DEFAULT 'RCC',
  `roof_area_sqft` DECIMAL(10, 2) DEFAULT NULL,
  `shadow_conditions` VARCHAR(100) DEFAULT NULL,
  `electrical_phase` VARCHAR(20) DEFAULT '1-Phase',
  `sanctioned_load_kw` DECIMAL(10, 2) DEFAULT NULL,
  `photos` JSON DEFAULT NULL,
  `site_notes` TEXT DEFAULT NULL,
  `gps_latitude` DECIMAL(10, 7) DEFAULT NULL,
  `gps_longitude` DECIMAL(10, 7) DEFAULT NULL,
  `completed_at` DATETIME DEFAULT NULL,
  `created_by` INT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON DELETE CASCADE
);
