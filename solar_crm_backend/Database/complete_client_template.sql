SET FOREIGN_KEY_CHECKS = 0;

-- === FILE: solar_crm.sql ===
-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Aug 17, 2026 at 10:06 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `solar_crm`
--

-- --------------------------------------------------------

--
-- Table structure for table `leads`
--

CREATE TABLE `leads` (
  `id` int(11) NOT NULL,
  `lead_code` varchar(20) NOT NULL,
  `customer_name` varchar(150) NOT NULL,
  `mobile_number` varchar(15) NOT NULL,
  `alternate_number` varchar(15) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `pincode` varchar(10) DEFAULT NULL,
  `solar_requirement` enum('Residential','Commercial') NOT NULL DEFAULT 'Residential',
  `interest_status` enum('Pending','Interested','Not Interested') NOT NULL DEFAULT 'Pending',
  `required_kw` decimal(6,2) DEFAULT NULL,
  `remark` varchar(500) DEFAULT NULL,
  `lead_source` enum('Website','Call','Reference','Facebook','Google','Other') NOT NULL DEFAULT 'Other',
  `priority` enum('Low','Medium','High') NOT NULL DEFAULT 'Medium',
  `status` enum('New Lead','Contacted','Follow-up Pending','Site Visit Scheduled','Quotation Sent','Negotiation','Won','Lost','Not Interested') NOT NULL DEFAULT 'New Lead',
  `assigned_to` int(11) DEFAULT NULL,
  `assigned_by` int(11) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `next_follow_up_date` date DEFAULT NULL,
  `site_visit_date` date DEFAULT NULL,
  `quotation_amount` decimal(12,2) DEFAULT NULL,
  `closed_at` datetime DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `lead_activity_logs`
--

CREATE TABLE `lead_activity_logs` (
  `id` int(11) NOT NULL,
  `lead_id` int(11) NOT NULL,
  `action_type` enum('Lead Created','Lead Updated','Lead Assigned','Lead Reassigned','Status Changed','Follow-up Added','Quotation Sent','Site Visit Scheduled','Lead Closed') NOT NULL,
  `old_value` varchar(255) DEFAULT NULL,
  `new_value` varchar(255) DEFAULT NULL,
  `remark` varchar(500) DEFAULT NULL,
  `performed_by` int(11) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `device` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `lead_assignments`
--

CREATE TABLE `lead_assignments` (
  `id` int(11) NOT NULL,
  `lead_id` int(11) NOT NULL,
  `assigned_to` int(11) NOT NULL,
  `assigned_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `lead_followups`
--

CREATE TABLE `lead_followups` (
  `id` int(11) NOT NULL,
  `lead_id` int(11) NOT NULL,
  `note` varchar(500) NOT NULL,
  `followup_type` enum('Call','WhatsApp','SMS','Meeting','Site Visit','Other') NOT NULL DEFAULT 'Call',
  `status_after_followup` enum('New Lead','Contacted','Follow-up Pending','Site Visit Scheduled','Quotation Sent','Negotiation','Won','Lost','Not Interested') DEFAULT NULL,
  `follow_up_date` date DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `body` text NOT NULL,
  `type` varchar(50) DEFAULT NULL,
  `reference_id` int(11) DEFAULT NULL,
  `is_read` tinyint(4) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `password_reset_otps`
--

CREATE TABLE `password_reset_otps` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `otp` varchar(255) NOT NULL,
  `expires_at` datetime NOT NULL,
  `is_verified` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `id` int(11) NOT NULL,
  `role_name` varchar(50) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`id`, `role_name`, `description`, `status`, `created_at`, `updated_at`) VALUES
(1, 'Super Admin', 'Complete System Access', 'Active', '2026-08-02 19:00:48', '2026-08-02 19:00:48'),
(2, 'Manager', 'Manage Team & Leads', 'Active', '2026-08-02 19:00:48', '2026-08-02 19:00:48'),
(3, 'Sales', 'Handle Assigned Leads', 'Active', '2026-08-02 19:00:48', '2026-08-06 04:45:48'),
(4, 'Site Engineer', 'Conduct site surveys, feasibility checks & technical visits', 'Active', '2026-08-02 19:00:48', '2026-08-06 04:45:48');

-- --------------------------------------------------------

--
-- Table structure for table `settings`
--

CREATE TABLE `settings` (
  `id` int(11) NOT NULL,
  `company_name` varchar(255) NOT NULL,
  `company_logo` varchar(255) DEFAULT NULL,
  `company_email` varchar(255) DEFAULT NULL,
  `company_phone` varchar(20) DEFAULT NULL,
  `website` varchar(255) DEFAULT NULL,
  `gst_number` varchar(50) DEFAULT NULL,
  `pan_number` varchar(50) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `country` varchar(100) DEFAULT NULL,
  `pincode` varchar(20) DEFAULT NULL,
  `currency` varchar(20) DEFAULT 'INR',
  `timezone` varchar(100) DEFAULT 'Asia/Kolkata',
  `date_format` varchar(30) DEFAULT 'DD/MM/YYYY',
  `smtp_host` varchar(255) DEFAULT NULL,
  `smtp_port` varchar(10) DEFAULT NULL,
  `smtp_username` varchar(255) DEFAULT NULL,
  `smtp_password` text DEFAULT NULL,
  `smtp_encryption` enum('SSL','TLS','None') DEFAULT 'TLS',
  `session_timeout` int(11) DEFAULT 30,
  `password_expiry_days` int(11) DEFAULT 90,
  `otp_length` int(11) DEFAULT 4,
  `enable_2fa` tinyint(1) DEFAULT 0,
  `strong_password` tinyint(1) DEFAULT 1,
  `email_notifications` tinyint(1) DEFAULT 1,
  `lead_notifications` tinyint(1) DEFAULT 1,
  `weekly_reports` tinyint(1) DEFAULT 0,
  `system_notifications` tinyint(1) DEFAULT 1,
  `backup_frequency` enum('Daily','Weekly','Monthly') DEFAULT 'Daily',
  `backup_retention_days` int(11) DEFAULT 30,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `role_id` int(11) NOT NULL,
  `manager_id` int(11) DEFAULT NULL,
  `full_name` varchar(100) NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(150) NOT NULL,
  `phone` varchar(15) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `profile_image` varchar(255) DEFAULT NULL,
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `is_deleted` tinyint(1) DEFAULT 0,
  `last_login` datetime DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `fcm_token` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `role_id`, `manager_id`, `full_name`, `username`, `email`, `phone`, `password`, `profile_image`, `status`, `is_deleted`, `last_login`, `created_by`, `created_at`, `updated_at`, `fcm_token`) VALUES
(1, 1, NULL, 'Toshak Sharma', 'admin', 'toshak10243@gmail.com', '8619544838', '$2b$10$1eOXKlkTHC81hQlVwqYht.1AMMl3lP3k1Q/hKStCy76xIJyXzNkOy', '1786619871374_177780153.webp', 'Active', 0, '2026-08-11 11:56:02', NULL, '2026-08-06 04:54:15', '2026-08-13 11:17:51', NULL),
(2, 2, NULL, 'Toshu', 'toshu', 'toshu10243@gmail.com', '8619544821', '$2b$10$3NLGyR9oChpOV5wI4vduYeUS0TlKA3EV3NXVjqpdbUBdtgZbE7CXS', '1786481844370_558103078.jpg', 'Active', 0, '2026-08-12 02:30:03', 1, '2026-08-09 08:35:34', '2026-08-11 21:00:03', NULL),
(3, 3, 2, 'Gagan', 'gagan', 'gagan123@gmail.com', '694455672', '$2b$10$ZCnV2yFSAj4Pijb4yHuL3u8uzC3yWeocH4n9IeU5WNiykV5p0qOhK', '1786427595613_18593511.png', 'Active', 0, '2026-08-11 10:49:07', 1, '2026-08-09 13:01:53', '2026-08-11 05:53:15', NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `leads`
--
ALTER TABLE `leads`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_leads_lead_code` (`lead_code`),
  ADD KEY `idx_leads_status` (`status`),
  ADD KEY `idx_leads_priority` (`priority`),
  ADD KEY `idx_leads_assigned_to` (`assigned_to`),
  ADD KEY `idx_leads_assigned_by` (`assigned_by`),
  ADD KEY `idx_leads_created_by` (`created_by`),
  ADD KEY `idx_leads_created_at` (`created_at`),
  ADD KEY `idx_leads_mobile` (`mobile_number`),
  ADD KEY `idx_leads_is_deleted` (`is_deleted`);

--
-- Indexes for table `lead_activity_logs`
--
ALTER TABLE `lead_activity_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_logs_performed_by` (`performed_by`),
  ADD KEY `idx_logs_lead` (`lead_id`),
  ADD KEY `idx_logs_action` (`action_type`),
  ADD KEY `idx_logs_created_at` (`created_at`);

--
-- Indexes for table `lead_assignments`
--
ALTER TABLE `lead_assignments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_assignments_lead` (`lead_id`),
  ADD KEY `idx_assignments_assigned_to` (`assigned_to`),
  ADD KEY `idx_assignments_assigned_by` (`assigned_by`),
  ADD KEY `idx_assignments_created_at` (`created_at`);

--
-- Indexes for table `lead_followups`
--
ALTER TABLE `lead_followups`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_followups_created_by` (`created_by`),
  ADD KEY `idx_followups_lead` (`lead_id`),
  ADD KEY `idx_followups_date` (`follow_up_date`),
  ADD KEY `idx_followups_type` (`followup_type`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `password_reset_otps`
--
ALTER TABLE `password_reset_otps`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `role_name` (`role_name`);

--
-- Indexes for table `settings`
--
ALTER TABLE `settings`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `phone` (`phone`),
  ADD KEY `fk_role` (`role_id`),
  ADD KEY `fk_manager` (`manager_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `leads`
--
ALTER TABLE `leads`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `lead_activity_logs`
--
ALTER TABLE `lead_activity_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=83;

--
-- AUTO_INCREMENT for table `lead_assignments`
--
ALTER TABLE `lead_assignments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `lead_followups`
--
ALTER TABLE `lead_followups`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `password_reset_otps`
--
ALTER TABLE `password_reset_otps`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `settings`
--
ALTER TABLE `settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `leads`
--
ALTER TABLE `leads`
  ADD CONSTRAINT `fk_leads_assigned_by` FOREIGN KEY (`assigned_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_leads_assigned_to` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_leads_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `lead_activity_logs`
--
ALTER TABLE `lead_activity_logs`
  ADD CONSTRAINT `fk_logs_lead` FOREIGN KEY (`lead_id`) REFERENCES `leads` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_logs_performed_by` FOREIGN KEY (`performed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `lead_assignments`
--
ALTER TABLE `lead_assignments`
  ADD CONSTRAINT `fk_assignments_assigned_by` FOREIGN KEY (`assigned_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_assignments_assigned_to` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `fk_assignments_lead` FOREIGN KEY (`lead_id`) REFERENCES `leads` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `lead_followups`
--
ALTER TABLE `lead_followups`
  ADD CONSTRAINT `fk_followups_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_followups_lead` FOREIGN KEY (`lead_id`) REFERENCES `leads` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `password_reset_otps`
--
ALTER TABLE `password_reset_otps`
  ADD CONSTRAINT `password_reset_otps_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `fk_manager` FOREIGN KEY (`manager_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `fk_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;


-- === FILE: step1_solar_calculator_and_quotations.sql ===
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


-- === FILE: step2_production_solar_epc_calculator.sql ===
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


-- === FILE: step3_site_survey_engine.sql ===
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


-- === FILE: step4_deals_and_subsidy.sql ===
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


-- === FILE: step5_stock_management.sql ===
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


-- === FILE: step6_invoices_and_billing.sql ===
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


-- === FILE: step7_projects_procurement.sql ===
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


SET FOREIGN_KEY_CHECKS = 1;
