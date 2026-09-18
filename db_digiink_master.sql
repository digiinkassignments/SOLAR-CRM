-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Sep 16, 2026 at 08:30 AM
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
-- Database: `db_digiink_master`
--

-- --------------------------------------------------------

--
-- Table structure for table `clients`
--

CREATE TABLE `clients` (
  `id` int(11) NOT NULL,
  `client_code` varchar(20) NOT NULL,
  `business_name` varchar(200) NOT NULL,
  `owner_name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `phone` varchar(15) NOT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `subdomain` varchar(100) NOT NULL,
  `db_name` varchar(100) NOT NULL,
  `plan_id` int(11) NOT NULL,
  `subscription_start` date NOT NULL,
  `subscription_end` date NOT NULL,
  `grace_end_date` date DEFAULT NULL,
  `lock_date` date DEFAULT NULL,
  `delete_date` date DEFAULT NULL,
  `status` enum('Active','Expiring Soon','Grace Period','Locked','Deleted') NOT NULL DEFAULT 'Active',
  `notes` text DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `email_logs`
--

CREATE TABLE `email_logs` (
  `id` int(11) NOT NULL,
  `client_id` int(11) NOT NULL,
  `email_type` enum('Welcome','Expiring Soon','Grace Period Started','Account Locked','Deletion Warning','Account Deleted','Payment Confirmed','Payment Rejected') NOT NULL,
  `sent_to` varchar(150) NOT NULL,
  `sent_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` enum('Sent','Failed') NOT NULL DEFAULT 'Sent',
  `error_msg` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `master_settings`
--

CREATE TABLE `master_settings` (
  `id` int(11) NOT NULL,
  `bank_account_name` varchar(200) DEFAULT NULL,
  `bank_account_number` varchar(50) DEFAULT NULL,
  `bank_ifsc` varchar(20) DEFAULT NULL,
  `bank_name` varchar(100) DEFAULT NULL,
  `bank_branch` varchar(100) DEFAULT NULL,
  `upi_id` varchar(100) DEFAULT NULL,
  `upi_qr_image` varchar(255) DEFAULT NULL,
  `support_phone` varchar(20) DEFAULT NULL,
  `support_email` varchar(150) DEFAULT NULL,
  `support_whatsapp` varchar(20) DEFAULT NULL,
  `company_name` varchar(200) DEFAULT 'Digiink Solutions',
  `company_logo` varchar(255) DEFAULT NULL,
  `company_website` varchar(255) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `master_settings`
--

INSERT INTO `master_settings` (`id`, `bank_account_name`, `bank_account_number`, `bank_ifsc`, `bank_name`, `bank_branch`, `upi_id`, `upi_qr_image`, `support_phone`, `support_email`, `support_whatsapp`, `company_name`, `company_logo`, `company_website`, `updated_at`) VALUES
(1, 'Digiink Solutions LLP', '69024154995', 'IDFB0042128', 'IDFC FIRST', 'JAIPUR-NEW SANGANER ROAD BRANCH', 'sethiaditya111@ybl', NULL, '9024154995', 'support@digiinksolutions.com', '9024154995', 'Digiink Solutions', NULL, 'digiinksolutions.com', '2026-08-24 13:39:07');

-- --------------------------------------------------------

--
-- Table structure for table `payment_requests`
--

CREATE TABLE `payment_requests` (
  `id` int(11) NOT NULL,
  `client_id` int(11) NOT NULL,
  `plan_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_note` varchar(500) DEFAULT NULL,
  `utr_number` varchar(100) DEFAULT NULL,
  `status` enum('Pending','Confirmed','Rejected') NOT NULL DEFAULT 'Pending',
  `requested_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `actioned_by` int(11) DEFAULT NULL,
  `actioned_at` datetime DEFAULT NULL,
  `rejection_note` varchar(500) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `plans`
--

CREATE TABLE `plans` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `price_monthly` decimal(10,2) NOT NULL,
  `max_users` int(11) NOT NULL DEFAULT 5,
  `max_leads_per_month` int(11) NOT NULL DEFAULT 500,
  `has_manager_role` tinyint(1) NOT NULL DEFAULT 0,
  `has_site_survey` tinyint(1) NOT NULL DEFAULT 0,
  `has_quotation_stages` tinyint(1) NOT NULL DEFAULT 0,
  `has_reports` tinyint(1) NOT NULL DEFAULT 0,
  `has_csv_import_export` tinyint(1) NOT NULL DEFAULT 0,
  `has_bulk_reassign` tinyint(1) NOT NULL DEFAULT 0,
  `has_advanced_reports` tinyint(1) NOT NULL DEFAULT 0,
  `has_activity_logs` tinyint(1) NOT NULL DEFAULT 0,
  `has_push_notifications` tinyint(1) NOT NULL DEFAULT 0,
  `has_android_apk` tinyint(1) NOT NULL DEFAULT 0,
  `has_ios_app` tinyint(1) NOT NULL DEFAULT 0,
  `has_multi_branch` tinyint(1) NOT NULL DEFAULT 0,
  `has_priority_support` tinyint(1) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `plans`
--

INSERT INTO `plans` (`id`, `name`, `price_monthly`, `max_users`, `max_leads_per_month`, `has_manager_role`, `has_site_survey`, `has_quotation_stages`, `has_reports`, `has_csv_import_export`, `has_bulk_reassign`, `has_advanced_reports`, `has_activity_logs`, `has_push_notifications`, `has_android_apk`, `has_ios_app`, `has_multi_branch`, `has_priority_support`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Starter', 2999.00, 5, 500, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, '2026-08-24 11:19:35', '2026-09-15 09:37:01'),
(2, 'Professional', 5999.00, 15, 2000, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, '2026-08-24 11:19:35', '2026-08-24 11:19:35'),
(3, 'Business', 9999.00, 50, 10000, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, '2026-08-24 11:19:35', '2026-08-24 11:19:35'),
(4, 'Enterprise', 14999.00, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, '2026-08-24 11:19:35', '2026-09-02 09:19:02');

-- --------------------------------------------------------

--
-- Table structure for table `subscription_history`
--

CREATE TABLE `subscription_history` (
  `id` int(11) NOT NULL,
  `client_id` int(11) NOT NULL,
  `plan_id` int(11) NOT NULL,
  `amount_paid` decimal(10,2) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `renewed_by` int(11) DEFAULT NULL,
  `notes` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `super_admins`
--

CREATE TABLE `super_admins` (
  `id` int(11) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password` varchar(255) NOT NULL,
  `last_login` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `super_admins`
--

INSERT INTO `super_admins` (`id`, `full_name`, `email`, `password`, `last_login`, `created_at`, `updated_at`) VALUES
(1, 'Digiink Admin', 'admin@digiink.in', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2026-09-16 11:39:52', '2026-08-24 11:19:35', '2026-09-16 06:09:52');

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_client_status_summary`
-- (See below for the actual view)
--
CREATE TABLE `v_client_status_summary` (
`status` enum('Active','Expiring Soon','Grace Period','Locked','Deleted')
,`total` bigint(21)
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_expiring_soon`
-- (See below for the actual view)
--
CREATE TABLE `v_expiring_soon` (
`id` int(11)
,`client_code` varchar(20)
,`business_name` varchar(200)
,`owner_name` varchar(100)
,`email` varchar(150)
,`phone` varchar(15)
,`subdomain` varchar(100)
,`plan_name` varchar(100)
,`price_monthly` decimal(10,2)
,`subscription_end` date
,`days_left` int(7)
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_pending_payments`
-- (See below for the actual view)
--
CREATE TABLE `v_pending_payments` (
`request_id` int(11)
,`client_code` varchar(20)
,`business_name` varchar(200)
,`owner_name` varchar(100)
,`email` varchar(150)
,`phone` varchar(15)
,`subdomain` varchar(100)
,`client_status` enum('Active','Expiring Soon','Grace Period','Locked','Deleted')
,`plan_name` varchar(100)
,`price_monthly` decimal(10,2)
,`amount` decimal(10,2)
,`utr_number` varchar(100)
,`payment_note` varchar(500)
,`requested_at` timestamp
);

-- --------------------------------------------------------

--
-- Structure for view `v_client_status_summary`
--
DROP TABLE IF EXISTS `v_client_status_summary`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_client_status_summary`  AS SELECT `clients`.`status` AS `status`, count(0) AS `total` FROM `clients` GROUP BY `clients`.`status` ;

-- --------------------------------------------------------

--
-- Structure for view `v_expiring_soon`
--
DROP TABLE IF EXISTS `v_expiring_soon`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_expiring_soon`  AS SELECT `c`.`id` AS `id`, `c`.`client_code` AS `client_code`, `c`.`business_name` AS `business_name`, `c`.`owner_name` AS `owner_name`, `c`.`email` AS `email`, `c`.`phone` AS `phone`, `c`.`subdomain` AS `subdomain`, `p`.`name` AS `plan_name`, `p`.`price_monthly` AS `price_monthly`, `c`.`subscription_end` AS `subscription_end`, to_days(`c`.`subscription_end`) - to_days(curdate()) AS `days_left` FROM (`clients` `c` join `plans` `p` on(`c`.`plan_id` = `p`.`id`)) WHERE `c`.`status` not in ('Deleted','Locked') AND to_days(`c`.`subscription_end`) - to_days(curdate()) between 0 and 7 ORDER BY `c`.`subscription_end` ASC ;

-- --------------------------------------------------------

--
-- Structure for view `v_pending_payments`
--
DROP TABLE IF EXISTS `v_pending_payments`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_pending_payments`  AS SELECT `pr`.`id` AS `request_id`, `c`.`client_code` AS `client_code`, `c`.`business_name` AS `business_name`, `c`.`owner_name` AS `owner_name`, `c`.`email` AS `email`, `c`.`phone` AS `phone`, `c`.`subdomain` AS `subdomain`, `c`.`status` AS `client_status`, `p`.`name` AS `plan_name`, `p`.`price_monthly` AS `price_monthly`, `pr`.`amount` AS `amount`, `pr`.`utr_number` AS `utr_number`, `pr`.`payment_note` AS `payment_note`, `pr`.`requested_at` AS `requested_at` FROM ((`payment_requests` `pr` join `clients` `c` on(`pr`.`client_id` = `c`.`id`)) join `plans` `p` on(`pr`.`plan_id` = `p`.`id`)) WHERE `pr`.`status` = 'Pending' ORDER BY `pr`.`requested_at` ASC ;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `clients`
--
ALTER TABLE `clients`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_client_code` (`client_code`),
  ADD UNIQUE KEY `uq_subdomain` (`subdomain`),
  ADD UNIQUE KEY `uq_db_name` (`db_name`),
  ADD UNIQUE KEY `uq_email` (`email`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_plan` (`plan_id`),
  ADD KEY `idx_expiry` (`subscription_end`);

--
-- Indexes for table `email_logs`
--
ALTER TABLE `email_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_el_client` (`client_id`),
  ADD KEY `idx_el_type` (`email_type`);

--
-- Indexes for table `master_settings`
--
ALTER TABLE `master_settings`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `payment_requests`
--
ALTER TABLE `payment_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_pr_client` (`client_id`),
  ADD KEY `idx_pr_status` (`status`),
  ADD KEY `fk_pr_plan` (`plan_id`);

--
-- Indexes for table `plans`
--
ALTER TABLE `plans`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `subscription_history`
--
ALTER TABLE `subscription_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_client` (`client_id`),
  ADD KEY `fk_sh_plan` (`plan_id`);

--
-- Indexes for table `super_admins`
--
ALTER TABLE `super_admins`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_sa_email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `clients`
--
ALTER TABLE `clients`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `email_logs`
--
ALTER TABLE `email_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `master_settings`
--
ALTER TABLE `master_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `payment_requests`
--
ALTER TABLE `payment_requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `plans`
--
ALTER TABLE `plans`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `subscription_history`
--
ALTER TABLE `subscription_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `super_admins`
--
ALTER TABLE `super_admins`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `clients`
--
ALTER TABLE `clients`
  ADD CONSTRAINT `fk_client_plan` FOREIGN KEY (`plan_id`) REFERENCES `plans` (`id`);

--
-- Constraints for table `payment_requests`
--
ALTER TABLE `payment_requests`
  ADD CONSTRAINT `fk_pr_client` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_pr_plan` FOREIGN KEY (`plan_id`) REFERENCES `plans` (`id`);

--
-- Constraints for table `subscription_history`
--
ALTER TABLE `subscription_history`
  ADD CONSTRAINT `fk_sh_client` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_sh_plan` FOREIGN KEY (`plan_id`) REFERENCES `plans` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
