-- ============================================================
-- Migration Script: Step 2 - Production Solar EPC Calculator Master Data & Schema Upgrade
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. DISCOM Tariff Master Table (Slab-wise tariffs)
CREATE TABLE IF NOT EXISTS `tariff_master` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `state` VARCHAR(100) NOT NULL,
  `discom` VARCHAR(150) NOT NULL,
  `consumer_category` ENUM('Residential', 'Commercial', 'Industrial', 'Agricultural') NOT NULL DEFAULT 'Residential',
  `phase` ENUM('Single Phase', '3 Phase', 'Both') NOT NULL DEFAULT 'Both',
  `slab_from_units` INT(11) NOT NULL DEFAULT 0,
  `slab_to_units` INT(11) NOT NULL DEFAULT 999999,
  `energy_rate` DECIMAL(8,2) NOT NULL,
  `fixed_charge` DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  `duty_percent` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `fuel_adjustment` DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  `other_charge` DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  `effective_from` DATE NOT NULL DEFAULT '2024-01-01',
  `effective_to` DATE DEFAULT NULL,
  `source` VARCHAR(255) DEFAULT 'Official DISCOM Tariff Order',
  `version` VARCHAR(20) NOT NULL DEFAULT '1.0.0',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `idx_tariff_state_discom` (`state`, `discom`, `consumer_category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed Tariff Data for Major States / DISCOMs
INSERT IGNORE INTO `tariff_master` (`id`, `state`, `discom`, `consumer_category`, `phase`, `slab_from_units`, `slab_to_units`, `energy_rate`, `fixed_charge`, `duty_percent`, `source`, `version`, `is_active`) VALUES
(1, 'Rajasthan', 'JVVNL / AVVNL / JdVVNL', 'Residential', 'Both', 0, 50, 4.75, 230.00, 0.40, 'Rajasthan SERC Tariff Order 2024', '1.0.0', 1),
(2, 'Rajasthan', 'JVVNL / AVVNL / JdVVNL', 'Residential', 'Both', 51, 150, 6.50, 230.00, 0.40, 'Rajasthan SERC Tariff Order 2024', '1.0.0', 1),
(3, 'Rajasthan', 'JVVNL / AVVNL / JdVVNL', 'Residential', 'Both', 151, 300, 7.35, 275.00, 0.40, 'Rajasthan SERC Tariff Order 2024', '1.0.0', 1),
(4, 'Rajasthan', 'JVVNL / AVVNL / JdVVNL', 'Residential', 'Both', 301, 500, 7.65, 340.00, 0.40, 'Rajasthan SERC Tariff Order 2024', '1.0.0', 1),
(5, 'Rajasthan', 'JVVNL / AVVNL / JdVVNL', 'Residential', 'Both', 501, 999999, 7.95, 400.00, 0.40, 'Rajasthan SERC Tariff Order 2024', '1.0.0', 1),
(6, 'Maharashtra', 'MSEDCL', 'Residential', 'Both', 0, 100, 5.88, 128.00, 16.00, 'MERC Tariff Order 2024', '1.0.0', 1),
(7, 'Maharashtra', 'MSEDCL', 'Residential', 'Both', 101, 300, 11.26, 128.00, 16.00, 'MERC Tariff Order 2024', '1.0.0', 1),
(8, 'Gujarat', 'DGVCL / MGVCL / PGVCL / UGVCL', 'Residential', 'Both', 0, 100, 3.20, 70.00, 15.00, 'GERC Tariff Order 2024', '1.0.0', 1),
(9, 'Delhi', 'TPDDL / BSES Yamuna / BSES Rajdhani', 'Residential', 'Both', 0, 200, 3.00, 40.00, 5.00, 'DERC Tariff Order 2024', '1.0.0', 1),
(10, 'Karnataka', 'BESCOM', 'Residential', 'Both', 0, 100, 4.75, 110.00, 9.00, 'KERC Tariff Order 2024', '1.0.0', 1);

-- 2. Solar Location Generation Profiles (Specific Yield & Monthly Distributions)
CREATE TABLE IF NOT EXISTS `solar_generation_profiles` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `state` VARCHAR(100) NOT NULL,
  `city` VARCHAR(100) DEFAULT NULL,
  `latitude` DECIMAL(8,4) DEFAULT NULL,
  `longitude` DECIMAL(8,4) DEFAULT NULL,
  `specific_yield_kwh_per_kw_year` DECIMAL(8,2) NOT NULL DEFAULT 1500.00,
  `monthly_generation_profile` JSON DEFAULT NULL,
  `performance_ratio` DECIMAL(5,2) NOT NULL DEFAULT 0.78,
  `effective_from` DATE NOT NULL DEFAULT '2024-01-01',
  `source` VARCHAR(255) DEFAULT 'MNRE / NISE Solar Resource Map Data',
  `version` VARCHAR(20) NOT NULL DEFAULT '1.0.0',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `idx_gen_state_city` (`state`, `city`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed Solar Location Generation Profiles
INSERT IGNORE INTO `solar_generation_profiles` (`id`, `state`, `city`, `latitude`, `longitude`, `specific_yield_kwh_per_kw_year`, `monthly_generation_profile`, `performance_ratio`, `source`, `version`, `is_active`) VALUES
(1, 'Rajasthan', 'Jaipur', 26.9124, 75.7873, 1650.00, '{"jan": 0.075, "feb": 0.082, "mar": 0.095, "apr": 0.098, "may": 0.102, "jun": 0.090, "jul": 0.072, "aug": 0.068, "sep": 0.082, "oct": 0.088, "nov": 0.078, "dec": 0.070}', 0.80, 'NISE Solar Irradiation Data', '1.0.0', 1),
(2, 'Gujarat', 'Ahmedabad', 23.0225, 72.5714, 1600.00, '{"jan": 0.076, "feb": 0.083, "mar": 0.094, "apr": 0.097, "may": 0.099, "jun": 0.088, "jul": 0.071, "aug": 0.069, "sep": 0.081, "oct": 0.087, "nov": 0.079, "dec": 0.076}', 0.79, 'NISE Solar Irradiation Data', '1.0.0', 1),
(3, 'Maharashtra', 'Mumbai', 19.0760, 72.8777, 1500.00, '{"jan": 0.082, "feb": 0.088, "mar": 0.098, "apr": 0.099, "may": 0.095, "jun": 0.065, "jul": 0.055, "aug": 0.058, "sep": 0.072, "oct": 0.090, "nov": 0.094, "dec": 0.084}', 0.78, 'NISE Solar Irradiation Data', '1.0.0', 1),
(4, 'Delhi', 'New Delhi', 28.6139, 77.2090, 1450.00, '{"jan": 0.068, "feb": 0.078, "mar": 0.092, "apr": 0.098, "may": 0.100, "jun": 0.092, "jul": 0.075, "aug": 0.072, "sep": 0.085, "oct": 0.088, "nov": 0.078, "dec": 0.074}', 0.77, 'NISE Solar Irradiation Data', '1.0.0', 1),
(5, 'Default', 'Generic India', 20.5937, 78.9629, 1484.35, '{"jan": 0.075, "feb": 0.080, "mar": 0.092, "apr": 0.096, "may": 0.098, "jun": 0.085, "jul": 0.070, "aug": 0.068, "sep": 0.080, "oct": 0.086, "nov": 0.082, "dec": 0.078}', 0.78, 'Waaree National Weighted Baseline', '1.0.0', 1);

-- 3. PM Surya Ghar & MNRE Government Subsidy Rules
CREATE TABLE IF NOT EXISTS `subsidy_rules` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `scheme_name` VARCHAR(150) NOT NULL DEFAULT 'PM Surya Ghar Muft Bijli Yojana',
  `consumer_category` ENUM('Residential', 'Commercial', 'Industrial', 'RWA') NOT NULL DEFAULT 'Residential',
  `property_type` VARCHAR(100) NOT NULL DEFAULT 'Residential',
  `capacity_from_kw` DECIMAL(6,2) NOT NULL DEFAULT 0.00,
  `capacity_to_kw` DECIMAL(6,2) NOT NULL DEFAULT 999.00,
  `rate_type` ENUM('FIXED', 'PER_KW', 'SLAB') NOT NULL DEFAULT 'SLAB',
  `rate_value` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `maximum_amount` DECIMAL(12,2) NOT NULL DEFAULT 78000.00,
  `eligibility_rules` JSON DEFAULT NULL,
  `effective_from` DATE NOT NULL DEFAULT '2024-02-13',
  `effective_to` DATE DEFAULT NULL,
  `source` VARCHAR(255) DEFAULT 'Official PM Surya Ghar Gazette Order 2024',
  `version` VARCHAR(20) NOT NULL DEFAULT '2.0.0',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed PM Surya Ghar Subsidy Rules
INSERT IGNORE INTO `subsidy_rules` (`id`, `scheme_name`, `consumer_category`, `property_type`, `capacity_from_kw`, `capacity_to_kw`, `rate_type`, `rate_value`, `maximum_amount`, `eligibility_rules`, `source`, `version`, `is_active`) VALUES
(1, 'PM Surya Ghar Muft Bijli Yojana', 'Residential', 'Residential', 0.00, 3.00, 'SLAB', 0.00, 78000.00, '{"slab_1_up_to_2kw_per_kw": 30000, "slab_2_2kw_to_3kw_per_kw": 18000, "cap_above_3kw": 78000, "requires_dcr": true}', 'Official MNRE PM Surya Ghar Notification 2024', '2.0.0', 1);

-- 4. Solar Module / Panel Product Catalog
CREATE TABLE IF NOT EXISTS `solar_panels` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `brand` VARCHAR(100) NOT NULL,
  `model` VARCHAR(150) NOT NULL,
  `wattage` INT(11) NOT NULL DEFAULT 550,
  `length_mm` INT(11) NOT NULL DEFAULT 2278,
  `width_mm` INT(11) NOT NULL DEFAULT 1134,
  `efficiency` DECIMAL(5,2) NOT NULL DEFAULT 21.30,
  `technology` VARCHAR(100) NOT NULL DEFAULT 'Mono PERC Half-Cut',
  `voc` DECIMAL(6,2) DEFAULT 49.80,
  `isc` DECIMAL(6,2) DEFAULT 14.00,
  `vmp` DECIMAL(6,2) DEFAULT 41.90,
  `imp` DECIMAL(6,2) DEFAULT 13.13,
  `temperature_coefficient` DECIMAL(5,3) DEFAULT -0.350,
  `warranty_years` INT(11) NOT NULL DEFAULT 25,
  `degradation_year_1` DECIMAL(4,2) NOT NULL DEFAULT 2.00,
  `annual_degradation` DECIMAL(4,2) NOT NULL DEFAULT 0.55,
  `is_dcr` TINYINT(1) NOT NULL DEFAULT 1,
  `is_almm_compliant` TINYINT(1) NOT NULL DEFAULT 1,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed Solar Panels
INSERT IGNORE INTO `solar_panels` (`id`, `brand`, `model`, `wattage`, `length_mm`, `width_mm`, `efficiency`, `technology`, `is_dcr`, `is_almm_compliant`, `is_active`) VALUES
(1, 'Waaree Solar', 'Arka Series 550W Mono PERC DCR', 550, 2278, 1134, 21.28, 'Mono PERC Half-Cut DCR', 1, 1, 1),
(2, 'Waaree Solar', 'Elite Series 580W TOPCon DCR', 580, 2278, 1134, 22.44, 'N-Type TOPCon DCR', 1, 1, 1),
(3, 'Adani Solar', 'Elan 540W Mono PERC Non-DCR', 540, 2256, 1133, 21.13, 'Mono PERC Non-DCR', 0, 1, 1);

-- 5. Solar Inverter Product Catalog
CREATE TABLE IF NOT EXISTS `solar_inverters` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `brand` VARCHAR(100) NOT NULL,
  `model` VARCHAR(150) NOT NULL,
  `rated_ac_kw` DECIMAL(6,2) NOT NULL,
  `max_dc_kw` DECIMAL(6,2) NOT NULL,
  `max_dc_voltage` INT(11) DEFAULT 1000,
  `mppt_count` INT(11) NOT NULL DEFAULT 2,
  `phase` ENUM('Single Phase', '3 Phase') NOT NULL DEFAULT 'Single Phase',
  `efficiency` DECIMAL(5,2) NOT NULL DEFAULT 98.00,
  `warranty` INT(11) NOT NULL DEFAULT 5,
  `grid_type` VARCHAR(50) NOT NULL DEFAULT 'On-Grid',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed Inverters
INSERT IGNORE INTO `solar_inverters` (`id`, `brand`, `model`, `rated_ac_kw`, `max_dc_kw`, `mppt_count`, `phase`, `efficiency`, `is_active`) VALUES
(1, 'Growatt / Solis', 'MIC 1-3kW Single Phase On-Grid', 3.00, 4.50, 1, 'Single Phase', 97.60, 1),
(2, 'Growatt / Solis', 'MIN 3-6kW Single Phase Dual MPPT', 5.00, 7.50, 2, 'Single Phase', 98.20, 1),
(3, 'Growatt / Solis / GoodWe', 'MOD 5-10kW 3 Phase Dual MPPT', 10.00, 15.00, 2, '3 Phase', 98.50, 1);

-- 6. EPC Pricing Master Table
CREATE TABLE IF NOT EXISTS `epc_pricing_master` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `system_type` VARCHAR(50) NOT NULL DEFAULT 'On-Grid',
  `subsidy_type` VARCHAR(100) NOT NULL DEFAULT 'With Subsidy (DCR)',
  `capacity_from_kw` DECIMAL(6,2) NOT NULL DEFAULT 0.00,
  `capacity_to_kw` DECIMAL(6,2) NOT NULL DEFAULT 999.00,
  `base_cost_per_kw` DECIMAL(10,2) NOT NULL,
  `gst_rate` DECIMAL(5,2) NOT NULL DEFAULT 13.80,
  `structure_cost_per_kw` DECIMAL(10,2) NOT NULL DEFAULT 4000.00,
  `installation_cost_per_kw` DECIMAL(10,2) NOT NULL DEFAULT 3500.00,
  `net_metering_charge` DECIMAL(10,2) NOT NULL DEFAULT 5000.00,
  `effective_from` DATE NOT NULL DEFAULT '2024-01-01',
  `version` VARCHAR(20) NOT NULL DEFAULT '1.0.0',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed Pricing Master
INSERT IGNORE INTO `epc_pricing_master` (`id`, `system_type`, `subsidy_type`, `capacity_from_kw`, `capacity_to_kw`, `base_cost_per_kw`, `gst_rate`, `version`, `is_active`) VALUES
(1, 'On-Grid', 'With Subsidy (DCR)', 1.00, 10.00, 56425.00, 13.80, '1.0.0', 1),
(2, 'On-Grid', 'No Subsidy (Non-DCR)', 1.00, 100.00, 48500.00, 13.80, '1.0.0', 1);

-- 7. System Loss Profiles
CREATE TABLE IF NOT EXISTS `system_loss_profiles` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `profile_name` VARCHAR(100) NOT NULL DEFAULT 'Standard Rooftop Loss Profile',
  `temperature_loss_percent` DECIMAL(4,2) NOT NULL DEFAULT 8.50,
  `soiling_loss_percent` DECIMAL(4,2) NOT NULL DEFAULT 3.00,
  `shading_loss_percent` DECIMAL(4,2) NOT NULL DEFAULT 2.00,
  `mismatch_loss_percent` DECIMAL(4,2) NOT NULL DEFAULT 1.50,
  `dc_cable_loss_percent` DECIMAL(4,2) NOT NULL DEFAULT 1.50,
  `ac_cable_loss_percent` DECIMAL(4,2) NOT NULL DEFAULT 1.00,
  `inverter_loss_percent` DECIMAL(4,2) NOT NULL DEFAULT 2.00,
  `availability_loss_percent` DECIMAL(4,2) NOT NULL DEFAULT 0.50,
  `is_default` TINYINT(1) NOT NULL DEFAULT 1,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `system_loss_profiles` (`id`, `profile_name`, `temperature_loss_percent`, `soiling_loss_percent`, `shading_loss_percent`, `mismatch_loss_percent`, `dc_cable_loss_percent`, `ac_cable_loss_percent`, `inverter_loss_percent`, `availability_loss_percent`, `is_default`, `is_active`) VALUES
(1, 'Standard Rooftop Loss Profile', 8.50, 3.00, 2.00, 1.50, 1.50, 1.00, 2.00, 0.50, 1, 1);

-- 8. Environmental Factors Master
CREATE TABLE IF NOT EXISTS `environmental_factors` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `grid_emission_factor_kg_co2_per_kwh` DECIMAL(6,4) NOT NULL DEFAULT 0.8200,
  `tree_co2_absorption_kg_per_year_equivalent` DECIMAL(6,2) NOT NULL DEFAULT 20.00,
  `source` VARCHAR(255) DEFAULT 'CEA Baseline Carbon Dioxide Emission Database v18',
  `version` VARCHAR(20) NOT NULL DEFAULT '1.0.0',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `environmental_factors` (`id`, `grid_emission_factor_kg_co2_per_kwh`, `tree_co2_absorption_kg_per_year_equivalent`, `source`, `version`, `is_active`) VALUES
(1, 0.8200, 20.00, 'Central Electricity Authority (CEA) Emission Database v18', '1.0.0', 1);

-- 9. Add Snapshots and Versioning Columns to `solar_calculations` Table
ALTER TABLE `solar_calculations`
  ADD COLUMN IF NOT EXISTS `calculator_version` VARCHAR(20) DEFAULT '2.0.0' AFTER `co2_offset_tonnes`,
  ADD COLUMN IF NOT EXISTS `tariff_version` VARCHAR(20) DEFAULT '1.0.0' AFTER `calculator_version`,
  ADD COLUMN IF NOT EXISTS `subsidy_version` VARCHAR(20) DEFAULT '2.0.0' AFTER `tariff_version`,
  ADD COLUMN IF NOT EXISTS `generation_version` VARCHAR(20) DEFAULT '1.0.0' AFTER `subsidy_version`,
  ADD COLUMN IF NOT EXISTS `pricing_version` VARCHAR(20) DEFAULT '1.0.0' AFTER `generation_version`,
  ADD COLUMN IF NOT EXISTS `input_snapshot` JSON DEFAULT NULL AFTER `pricing_version`,
  ADD COLUMN IF NOT EXISTS `result_snapshot` JSON DEFAULT NULL AFTER `input_snapshot`;

SET FOREIGN_KEY_CHECKS = 1;
