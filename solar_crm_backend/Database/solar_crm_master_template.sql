-- MySQL dump 10.13  Distrib 8.4.13, for Linux (x86_64)
--
-- Host: localhost    Database: db_client_003
-- ------------------------------------------------------
-- Server version	8.4.13-0ubuntu0.26.04.2

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `company_amc_plans`
--

DROP TABLE IF EXISTS `company_amc_plans`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `company_amc_plans` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(60) NOT NULL,
  `coverage` text NOT NULL,
  `exclusions` text,
  `annual_amount` decimal(10,2) NOT NULL,
  `visit_frequency` varchar(30) NOT NULL,
  `term_months` int NOT NULL DEFAULT '12',
  `is_active` tinyint NOT NULL DEFAULT '1',
  `version` int NOT NULL DEFAULT '1',
  `created_by` int NOT NULL,
  `updated_by` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `crm_field_entries`
--

DROP TABLE IF EXISTS `crm_field_entries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `crm_field_entries` (
  `id` int NOT NULL AUTO_INCREMENT,
  `resource_type` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `resource_id` int NOT NULL,
  `kind` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Draft',
  `data_json` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_by` int NOT NULL,
  `request_key` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `version` int NOT NULL DEFAULT '1',
  `reviewed_by` int DEFAULT NULL,
  `review_note` text COLLATE utf8mb4_unicode_ci,
  `legacy_log_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `field_entry_request` (`created_by`,`request_key`),
  KEY `field_entry_resource` (`resource_type`,`resource_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `crm_field_events`
--

DROP TABLE IF EXISTS `crm_field_events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `crm_field_events` (
  `id` int NOT NULL AUTO_INCREMENT,
  `resource_type` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `resource_id` int NOT NULL,
  `event_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reference_id` int DEFAULT NULL,
  `note` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `performed_by` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `field_event_resource` (`resource_type`,`resource_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `crm_field_files`
--

DROP TABLE IF EXISTS `crm_field_files`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `crm_field_files` (
  `id` int NOT NULL AUTO_INCREMENT,
  `entry_id` int NOT NULL,
  `stored_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `original_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mime` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `size_bytes` int NOT NULL,
  `uploaded_by` int NOT NULL,
  `sha256` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `field_file_hash` (`entry_id`,`sha256`),
  KEY `field_file_entry` (`entry_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `crm_field_serials`
--

DROP TABLE IF EXISTS `crm_field_serials`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `crm_field_serials` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `entry_id` int NOT NULL,
  `component` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `brand` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `model` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `serial` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `installed_serial` (`component`,`brand`,`serial`),
  KEY `field_serial_project` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `crm_field_tasks`
--

DROP TABLE IF EXISTS `crm_field_tasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `crm_field_tasks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `resource_type` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `resource_id` int NOT NULL,
  `assigned_to` int NOT NULL,
  `kind` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `priority` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Medium',
  `due_date` date NOT NULL,
  `due_time` time NOT NULL,
  `next_action` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(25) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Open',
  `note` text COLLATE utf8mb4_unicode_ci,
  `created_by` int NOT NULL,
  `version` int NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `field_task_assignment` (`assigned_to`,`status`,`due_date`),
  KEY `field_task_resource` (`resource_type`,`resource_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `crm_integration_events`
--

DROP TABLE IF EXISTS `crm_integration_events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `crm_integration_events` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `provider` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `external_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `event_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `lead_id` int DEFAULT NULL,
  `detail` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `provider_external` (`provider`,`external_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `crm_integrations`
--

DROP TABLE IF EXISTS `crm_integrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `crm_integrations` (
  `provider` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `config_json` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `secrets_encrypted` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `enabled` tinyint DEFAULT '0',
  `verified_at` datetime DEFAULT NULL,
  `last_event_at` datetime DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`provider`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `crm_reminder_deliveries`
--

DROP TABLE IF EXISTS `crm_reminder_deliveries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `crm_reminder_deliveries` (
  `dedupe_key` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` int NOT NULL,
  `kind` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'queued',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`dedupe_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `crm_schema_migrations`
--

DROP TABLE IF EXISTS `crm_schema_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `crm_schema_migrations` (
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `applied_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `crm_workflow_settings`
--

DROP TABLE IF EXISTS `crm_workflow_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `crm_workflow_settings` (
  `id` int NOT NULL,
  `timezone` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Asia/Kolkata',
  `discount_limit_pct` decimal(5,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `custom_fields`
--

DROP TABLE IF EXISTS `custom_fields`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `custom_fields` (
  `id` int NOT NULL AUTO_INCREMENT,
  `field_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `field_type` enum('text','number','dropdown','date') COLLATE utf8mb4_unicode_ci DEFAULT 'text',
  `is_required` tinyint(1) DEFAULT '0',
  `options` text COLLATE utf8mb4_unicode_ci,
  `is_active` tinyint(1) DEFAULT '1',
  `sort_order` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `custom_lead_sources`
--

DROP TABLE IF EXISTS `custom_lead_sources`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `custom_lead_sources` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `is_default` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `custom_lead_statuses`
--

DROP TABLE IF EXISTS `custom_lead_statuses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `custom_lead_statuses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `color_code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '#1A73E8',
  `stage_order` int NOT NULL DEFAULT '0',
  `is_won` tinyint(1) NOT NULL DEFAULT '0',
  `is_lost` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `is_default` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `customer_documents`
--

DROP TABLE IF EXISTS `customer_documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer_documents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `lead_id` int NOT NULL,
  `document_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_url` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `verification_status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `rejection_reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `uploaded_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `lead_id` (`lead_id`),
  CONSTRAINT `customer_documents_ibfk_1` FOREIGN KEY (`lead_id`) REFERENCES `leads` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `customers`
--

DROP TABLE IF EXISTS `customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `customer_code` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `lead_id` int DEFAULT NULL,
  `customer_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mobile_number` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `alternate_number` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `city` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `state` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pincode` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `electricity_consumer_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `discom_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sanctioned_load_kw` decimal(8,2) DEFAULT NULL,
  `customer_gstin` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `solar_requirement` enum('Residential','Commercial','Industrial') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Residential',
  `status` enum('Active','Inactive') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Active',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `assigned_to` int DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `customer_code` (`customer_code`),
  KEY `idx_cust_phone` (`mobile_number`),
  KEY `idx_cust_code` (`customer_code`),
  KEY `idx_cust_lead` (`lead_id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `environmental_factors`
--

DROP TABLE IF EXISTS `environmental_factors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `environmental_factors` (
  `id` int NOT NULL AUTO_INCREMENT,
  `grid_emission_factor_kg_co2_per_kwh` decimal(6,4) NOT NULL DEFAULT '0.8200',
  `tree_co2_absorption_kg_per_year_equivalent` decimal(6,2) NOT NULL DEFAULT '20.00',
  `source` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT 'CEA Baseline Carbon Dioxide Emission Database v18',
  `version` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '1.0.0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `epc_pricing_master`
--

DROP TABLE IF EXISTS `epc_pricing_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `epc_pricing_master` (
  `id` int NOT NULL AUTO_INCREMENT,
  `system_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'On-Grid',
  `subsidy_type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'With Subsidy (DCR)',
  `capacity_from_kw` decimal(6,2) NOT NULL DEFAULT '0.00',
  `capacity_to_kw` decimal(6,2) NOT NULL DEFAULT '999.00',
  `base_cost_per_kw` decimal(10,2) NOT NULL,
  `gst_rate` decimal(5,2) NOT NULL DEFAULT '13.80',
  `structure_cost_per_kw` decimal(10,2) NOT NULL DEFAULT '4000.00',
  `installation_cost_per_kw` decimal(10,2) NOT NULL DEFAULT '3500.00',
  `net_metering_charge` decimal(10,2) NOT NULL DEFAULT '5000.00',
  `effective_from` date NOT NULL DEFAULT '2024-01-01',
  `version` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '1.0.0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `installation_log_photos`
--

DROP TABLE IF EXISTS `installation_log_photos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `installation_log_photos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `log_id` int NOT NULL,
  `photo_url` varchar(255) NOT NULL,
  `caption` varchar(150) DEFAULT NULL,
  `photo_tag` varchar(50) DEFAULT 'Work Progress',
  `file_name` varchar(255) DEFAULT NULL,
  `file_size` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `is_deleted` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `log_id` (`log_id`),
  CONSTRAINT `installation_log_photos_ibfk_1` FOREIGN KEY (`log_id`) REFERENCES `installation_logs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `installation_logs`
--

DROP TABLE IF EXISTS `installation_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `installation_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `log_date` date NOT NULL,
  `phase` varchar(80) NOT NULL,
  `is_phase_completed` tinyint(1) DEFAULT '0',
  `work_done` text NOT NULL,
  `workers_count` int DEFAULT '0',
  `hours_worked` decimal(5,2) DEFAULT '0.00',
  `supervisor_name` varchar(100) DEFAULT NULL,
  `crew_names` text,
  `materials_used` text,
  `materials_json` json DEFAULT NULL,
  `issues_faced` text,
  `progress_percent` int DEFAULT '0',
  `weather` varchar(50) DEFAULT 'Sunny / Clear',
  `safety_checklist` json DEFAULT NULL,
  `supervisor_signoff` tinyint(1) DEFAULT '0',
  `supervisor_signoff_time` datetime DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted` tinyint(1) DEFAULT '0',
  `signature_data` longtext,
  PRIMARY KEY (`id`),
  KEY `project_id` (`project_id`),
  CONSTRAINT `installation_logs_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `invoice_payments`
--

DROP TABLE IF EXISTS `invoice_payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoice_payments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `invoice_id` int NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `payment_date` date NOT NULL,
  `payment_mode` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'Bank Transfer',
  `reference_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `recorded_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_pay_invoice` (`invoice_id`),
  CONSTRAINT `fk_pay_invoice` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `invoices`
--

DROP TABLE IF EXISTS `invoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoices` (
  `id` int NOT NULL AUTO_INCREMENT,
  `invoice_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `public_token` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quotation_id` int DEFAULT NULL,
  `lead_id` int DEFAULT NULL,
  `customer_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_email` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customer_phone` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_address` text COLLATE utf8mb4_unicode_ci,
  `city` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `state` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pincode` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customer_gstin` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `system_capacity_kw` decimal(6,2) NOT NULL DEFAULT '1.00',
  `system_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'On-Grid',
  `panel_specs` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT 'Mono PERC 550W Half-Cut',
  `inverter_specs` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT 'Solar Grid-Tied Inverter',
  `structure_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'Elevated GI High-Grade Structure',
  `base_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `installation_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `discount_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `taxable_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `gst_rate` decimal(5,2) NOT NULL DEFAULT '13.80',
  `cgst_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `sgst_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `igst_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `gst_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `gross_total` decimal(12,2) NOT NULL DEFAULT '0.00',
  `subsidy_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `net_payable_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `amount_paid` decimal(12,2) NOT NULL DEFAULT '0.00',
  `balance_due` decimal(12,2) NOT NULL DEFAULT '0.00',
  `payment_status` enum('Paid','Partially Paid','Unpaid') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Unpaid',
  `payment_mode` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'Bank Transfer',
  `payment_reference` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_date` date DEFAULT NULL,
  `invoice_date` date NOT NULL,
  `due_date` date DEFAULT NULL,
  `line_items` json DEFAULT NULL,
  `terms_and_conditions` text COLLATE utf8mb4_unicode_ci,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Issued',
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `customer_id` int DEFAULT NULL,
  `gst_mode` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gst_summary_json` longtext COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  UNIQUE KEY `invoice_number` (`invoice_number`),
  UNIQUE KEY `public_token` (`public_token`),
  KEY `idx_inv_quotation` (`quotation_id`),
  KEY `idx_inv_lead` (`lead_id`),
  KEY `idx_inv_status` (`payment_status`),
  KEY `idx_invoices_lead` (`lead_id`),
  KEY `idx_invoices_status` (`payment_status`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `lead_activity_logs`
--

DROP TABLE IF EXISTS `lead_activity_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lead_activity_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `lead_id` int NOT NULL,
  `action_type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Status Changed',
  `old_value` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `new_value` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `remark` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `performed_by` int DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `device` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_logs_lead` (`lead_id`),
  KEY `idx_logs_action` (`action_type`),
  KEY `idx_logs_created_at` (`created_at`),
  KEY `fk_logs_performed_by` (`performed_by`),
  CONSTRAINT `fk_logs_lead` FOREIGN KEY (`lead_id`) REFERENCES `leads` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_logs_performed_by` FOREIGN KEY (`performed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=391 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `lead_assignments`
--

DROP TABLE IF EXISTS `lead_assignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lead_assignments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `lead_id` int NOT NULL,
  `assigned_to` int NOT NULL,
  `assigned_by` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_assignments_lead` (`lead_id`),
  KEY `idx_assignments_assigned_to` (`assigned_to`),
  KEY `fk_assignments_assigned_by` (`assigned_by`),
  CONSTRAINT `fk_assignments_assigned_by` FOREIGN KEY (`assigned_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_assignments_assigned_to` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_assignments_lead` FOREIGN KEY (`lead_id`) REFERENCES `leads` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `lead_custom_values`
--

DROP TABLE IF EXISTS `lead_custom_values`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lead_custom_values` (
  `id` int NOT NULL AUTO_INCREMENT,
  `lead_id` int NOT NULL,
  `field_id` int NOT NULL,
  `value` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_lead_field` (`lead_id`,`field_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `lead_followups`
--

DROP TABLE IF EXISTS `lead_followups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lead_followups` (
  `id` int NOT NULL AUTO_INCREMENT,
  `lead_id` int NOT NULL,
  `note` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `followup_type` enum('Call','WhatsApp','SMS','Meeting','Site Visit','Other') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Call',
  `status_after_followup` enum('New Lead','Contacted','Follow-up Pending','Site Visit Scheduled','Quotation Sent','Negotiation','Won','Lost','Not Interested') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `follow_up_date` date DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `call_outcome` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `next_action` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `next_follow_up_time` time DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_followups_lead` (`lead_id`),
  KEY `idx_followups_date` (`follow_up_date`),
  KEY `idx_followups_lead_date` (`lead_id`,`follow_up_date`),
  KEY `fk_followups_created_by` (`created_by`),
  CONSTRAINT `fk_followups_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_followups_lead` FOREIGN KEY (`lead_id`) REFERENCES `leads` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `leads`
--

DROP TABLE IF EXISTS `leads`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `leads` (
  `id` int NOT NULL AUTO_INCREMENT,
  `lead_code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mobile_number` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL,
  `alternate_number` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dob` date DEFAULT NULL,
  `anniversary_date` date DEFAULT NULL,
  `address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `state` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pincode` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `solar_requirement` enum('Residential','Commercial') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Residential',
  `interest_status` enum('Pending','Interested','Not Interested') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Pending',
  `required_kw` decimal(6,2) DEFAULT NULL,
  `remark` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `lead_source` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Other',
  `priority` enum('Low','Medium','High') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Medium',
  `status` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'New Lead',
  `assigned_to` int DEFAULT NULL,
  `assigned_by` int DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `next_follow_up_date` date DEFAULT NULL,
  `site_visit_date` date DEFAULT NULL,
  `quotation_amount` decimal(12,2) DEFAULT NULL,
  `closed_at` datetime DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `customer_id` int DEFAULT NULL,
  `next_action` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `next_follow_up_time` time DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_leads_lead_code` (`lead_code`),
  KEY `idx_leads_status` (`status`),
  KEY `idx_leads_assigned_to` (`assigned_to`),
  KEY `idx_leads_created_at` (`created_at`),
  KEY `idx_leads_mobile` (`mobile_number`),
  KEY `idx_leads_is_deleted` (`is_deleted`),
  KEY `idx_leads_dob` (`dob`),
  KEY `idx_leads_assigned_status` (`assigned_to`,`status`),
  KEY `idx_leads_created` (`created_at`),
  KEY `fk_leads_assigned_by` (`assigned_by`),
  KEY `fk_leads_created_by` (`created_by`),
  CONSTRAINT `fk_leads_assigned_by` FOREIGN KEY (`assigned_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_leads_assigned_to` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_leads_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=117 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `loan_documents`
--

DROP TABLE IF EXISTS `loan_documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `loan_documents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `loan_id` int NOT NULL,
  `lead_id` int NOT NULL,
  `doc_type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_url` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `verification_status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'Pending',
  `uploaded_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `loan_id` (`loan_id`),
  CONSTRAINT `loan_documents_ibfk_1` FOREIGN KEY (`loan_id`) REFERENCES `solar_loans` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `body` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reference_id` int DEFAULT NULL,
  `is_read` tinyint DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `idx_notif_user_read` (`user_id`,`is_read`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `password_reset_otps`
--

DROP TABLE IF EXISTS `password_reset_otps`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_reset_otps` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `otp` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` datetime NOT NULL,
  `is_verified` tinyint(1) DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `password_reset_otps_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `project_commissioning`
--

DROP TABLE IF EXISTS `project_commissioning`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_commissioning` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `panel_output_voltage` decimal(8,2) DEFAULT NULL,
  `dc_current_amps` decimal(8,2) DEFAULT NULL,
  `inverter_output_kw` decimal(8,2) DEFAULT NULL,
  `inverter_display_status` varchar(100) DEFAULT NULL,
  `ac_output_voltage` decimal(8,2) DEFAULT NULL,
  `meter_reading_kwh` decimal(10,2) DEFAULT NULL,
  `meter_serial_number` varchar(100) DEFAULT NULL,
  `net_meter_import_kwh` decimal(10,2) DEFAULT NULL,
  `net_meter_export_kwh` decimal(10,2) DEFAULT NULL,
  `generation_meter_kwh` decimal(10,2) DEFAULT NULL,
  `safety_shutdowns` enum('Pass','Fail') DEFAULT NULL,
  `anti_islanding_test` varchar(20) DEFAULT NULL,
  `grounding_check` enum('Pass','Fail') DEFAULT NULL,
  `earth_resistance_ohm` decimal(8,2) DEFAULT NULL,
  `wiring_insulation` enum('Pass','Fail') DEFAULT NULL,
  `insulation_resistance_mohm` decimal(8,2) DEFAULT NULL,
  `earth_leakage` enum('Pass','Fail') DEFAULT NULL,
  `overall_result` varchar(50) DEFAULT 'Pending',
  `commission_date` date DEFAULT NULL,
  `commissioning_engineer` varchar(100) DEFAULT NULL,
  `certificate_number` varchar(100) DEFAULT NULL,
  `remarks` text,
  `meter_photo_url` text,
  `inverter_photo_url` text,
  `customer_signature_name` varchar(100) DEFAULT NULL,
  `customer_acknowledged` tinyint(1) DEFAULT '0',
  `engineer_signoff` tinyint(1) DEFAULT '0',
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted` tinyint(1) DEFAULT '0',
  `signature_data` longtext,
  PRIMARY KEY (`id`),
  KEY `project_id` (`project_id`),
  CONSTRAINT `project_commissioning_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `project_final_inspection`
--

DROP TABLE IF EXISTS `project_final_inspection`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_final_inspection` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `installation_quality` enum('Pass','Fail') DEFAULT NULL,
  `structure_checklist` json DEFAULT NULL,
  `safety_compliance` enum('Pass','Fail') DEFAULT NULL,
  `electrical_checklist` json DEFAULT NULL,
  `inverter_earthing_checklist` json DEFAULT NULL,
  `document_verification` enum('Pass','Fail') DEFAULT NULL,
  `documents_checklist` json DEFAULT NULL,
  `performance_testing` enum('Pass','Fail') DEFAULT NULL,
  `inspector_name` varchar(100) DEFAULT NULL,
  `inspector_type` varchar(60) DEFAULT 'Internal QA / QC',
  `inspection_date` date DEFAULT NULL,
  `inspection_status` varchar(60) DEFAULT 'Pending',
  `corrections_needed` text,
  `rework_status` varchar(50) DEFAULT 'Not Applicable',
  `reinspection_date` date DEFAULT NULL,
  `certificate_number` varchar(100) DEFAULT NULL,
  `remarks` text,
  `inspection_photos` text,
  `customer_signature_name` varchar(100) DEFAULT NULL,
  `customer_acknowledged` tinyint(1) DEFAULT '0',
  `inspector_signoff` tinyint(1) DEFAULT '0',
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted` tinyint(1) DEFAULT '0',
  `signature_data` longtext,
  PRIMARY KEY (`id`),
  KEY `project_id` (`project_id`),
  CONSTRAINT `project_final_inspection_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `project_handover`
--

DROP TABLE IF EXISTS `project_handover`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_handover` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `training_completed` varchar(30) DEFAULT NULL,
  `app_demo_completed` varchar(30) DEFAULT NULL,
  `monitoring_app_access_shared` tinyint(1) DEFAULT '0',
  `emergency_contact_given` tinyint(1) DEFAULT NULL,
  `operation_manual` tinyint(1) DEFAULT NULL,
  `warranty_card` tinyint(1) DEFAULT NULL,
  `maintenance_schedule` tinyint(1) DEFAULT NULL,
  `inverter_manual` tinyint(1) DEFAULT NULL,
  `documents_pack_checklist` json DEFAULT NULL,
  `handover_date` date DEFAULT NULL,
  `handover_manager` varchar(100) DEFAULT NULL,
  `warranty_start_date` date DEFAULT NULL,
  `module_warranty_years` int DEFAULT '25',
  `module_warranty_end` date DEFAULT NULL,
  `inverter_warranty_years` int DEFAULT '5',
  `inverter_warranty_end` date DEFAULT NULL,
  `workmanship_warranty_years` int DEFAULT '5',
  `workmanship_warranty_end` date DEFAULT NULL,
  `amc_warranty_years` int DEFAULT '1',
  `amc_warranty_end` date DEFAULT NULL,
  `first_service_due_date` date DEFAULT NULL,
  `customer_signature` tinyint(1) DEFAULT NULL,
  `signed_docket_url` text,
  `signature_signatory_name` varchar(100) DEFAULT NULL,
  `signature_phone` varchar(20) DEFAULT NULL,
  `handover_photo_url` text,
  `customer_feedback` text,
  `customer_rating` int DEFAULT '5',
  `handover_status` varchar(60) DEFAULT 'Pending',
  `remarks` text,
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted` tinyint(1) DEFAULT '0',
  `review_token` varchar(100) DEFAULT NULL,
  `review_status` varchar(30) DEFAULT 'pending',
  `review_submitted_at` datetime DEFAULT NULL,
  `customer_reviewer_name` varchar(150) DEFAULT NULL,
  `signature_data` longtext,
  `contract_value` decimal(12,2) DEFAULT NULL,
  `amount_paid` decimal(12,2) DEFAULT NULL,
  `balance_due` decimal(12,2) DEFAULT NULL,
  `payment_status` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `project_id` (`project_id`),
  CONSTRAINT `project_handover_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `project_inspections`
--

DROP TABLE IF EXISTS `project_inspections`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_inspections` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `roof_condition` enum('Good','Fair','Poor') DEFAULT 'Good',
  `roof_type` varchar(50) DEFAULT NULL,
  `roof_orientation` varchar(50) DEFAULT 'South',
  `roof_tilt_angle` decimal(5,2) DEFAULT NULL,
  `roof_area_sqft` decimal(10,2) DEFAULT NULL,
  `shadow_free_area_sqft` decimal(10,2) DEFAULT NULL,
  `roof_age_years` int DEFAULT NULL,
  `structural_concerns` text,
  `existing_load_kw` decimal(10,2) DEFAULT NULL,
  `sanctioned_load_kw` decimal(10,2) DEFAULT NULL,
  `consumer_number` varchar(100) DEFAULT NULL,
  `meter_type` enum('Single Phase','Three Phase') DEFAULT NULL,
  `main_panel_capacity` int DEFAULT NULL,
  `earthing_available` tinyint(1) DEFAULT NULL,
  `electrical_issues` text,
  `shading_issues` enum('None','Partial','Severe') DEFAULT 'None',
  `shading_source` varchar(255) DEFAULT NULL,
  `water_availability` tinyint(1) DEFAULT NULL,
  `site_access` enum('Easy','Moderate','Difficult') DEFAULT 'Easy',
  `gps_coordinates` varchar(100) DEFAULT NULL,
  `additional_challenges` text,
  `site_photos` text,
  `overall_status` varchar(50) DEFAULT 'Pending',
  `inspector_name` varchar(100) DEFAULT NULL,
  `inspection_date` date DEFAULT NULL,
  `remarks` text,
  `customer_signature_name` varchar(100) DEFAULT NULL,
  `signature_date` date DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted` tinyint(1) DEFAULT '0',
  `signature_data` longtext,
  PRIMARY KEY (`id`),
  KEY `project_id` (`project_id`),
  CONSTRAINT `project_inspections_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `project_orders`
--

DROP TABLE IF EXISTS `project_orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `lead_id` int NOT NULL,
  `quotation_id` int DEFAULT NULL,
  `order_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_project_cost` decimal(12,2) NOT NULL,
  `advance_payment_amount` decimal(12,2) NOT NULL,
  `advance_payment_date` datetime NOT NULL,
  `payment_mode` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'bank_transfer',
  `payment_reference` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dealer_id` int DEFAULT NULL,
  `dealer_commission` decimal(10,2) DEFAULT '0.00',
  `order_status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'booked',
  `contract_signed_at` datetime DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_number` (`order_number`),
  KEY `lead_id` (`lead_id`),
  CONSTRAINT `project_orders_ibfk_1` FOREIGN KEY (`lead_id`) REFERENCES `leads` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `project_service_visits`
--

DROP TABLE IF EXISTS `project_service_visits`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_service_visits` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `visit_date` date NOT NULL,
  `technician` varchar(100) DEFAULT NULL,
  `issue_reported` text,
  `resolution` text,
  `status` enum('Completed','Pending','Escalated') DEFAULT 'Completed',
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `project_id` (`project_id`),
  CONSTRAINT `project_service_visits_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `project_stage_logs`
--

DROP TABLE IF EXISTS `project_stage_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_stage_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `from_stage` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `to_stage` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `changed_by` int DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_stage_log_project` (`project_id`),
  KEY `idx_stage_log_changed_by` (`changed_by`),
  CONSTRAINT `fk_stage_log_changed_by` FOREIGN KEY (`changed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_stage_log_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `project_warranty_amc`
--

DROP TABLE IF EXISTS `project_warranty_amc`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_warranty_amc` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `panel_warranty_years` int DEFAULT NULL,
  `inverter_warranty_years` int DEFAULT NULL,
  `installation_warranty_years` int DEFAULT NULL,
  `warranty_start_date` date DEFAULT NULL,
  `warranty_end_date` date DEFAULT NULL,
  `amc_start_date` date DEFAULT NULL,
  `amc_end_date` date DEFAULT NULL,
  `amc_plan` enum('Basic','Standard','Premium') DEFAULT NULL,
  `amc_amount` decimal(10,2) DEFAULT NULL,
  `visit_frequency` enum('Monthly','Quarterly','Half-Yearly','Yearly') DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted` tinyint(1) DEFAULT '0',
  `warranty_certificate_no` varchar(60) DEFAULT NULL,
  `panel_product_warranty_years` int DEFAULT '12',
  `panel_product_warranty_end` date DEFAULT NULL,
  `panel_performance_warranty_years` int DEFAULT '25',
  `panel_performance_warranty_end` date DEFAULT NULL,
  `inverter_warranty_end` date DEFAULT NULL,
  `installation_warranty_end` date DEFAULT NULL,
  `free_service_end_date` date DEFAULT NULL,
  `amc_payment_status` varchar(50) DEFAULT 'Paid',
  `amc_renewal_date` date DEFAULT NULL,
  `panel_serial_numbers` text,
  `inverter_serial_number` varchar(100) DEFAULT NULL,
  `monitoring_portal_url` varchar(255) DEFAULT 'https://monitoring.solaxcloud.com',
  `monitoring_plant_id` varchar(100) DEFAULT 'SOLAR-PLANT-004',
  `monitoring_username` varchar(100) DEFAULT 'rajesh.sharma@solax',
  `warranty_docket_url` text,
  `scheduled_visits` json DEFAULT NULL,
  `amc_plan_id` int DEFAULT NULL,
  `amc_plan_snapshot` json DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `project_id` (`project_id`),
  CONSTRAINT `project_warranty_amc_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `projects`
--

DROP TABLE IF EXISTS `projects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `projects` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_number` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `project_uuid` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `lead_id` int DEFAULT NULL,
  `quotation_id` int DEFAULT NULL,
  `customer_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_phone` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_address` text COLLATE utf8mb4_unicode_ci,
  `city` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `state` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pincode` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `system_capacity_kw` decimal(6,2) NOT NULL,
  `panel_count` int DEFAULT NULL,
  `inverter_kw` decimal(6,2) DEFAULT NULL,
  `stage` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Order Closed',
  `stage_updated_at` timestamp NULL DEFAULT NULL,
  `assigned_to` int DEFAULT NULL,
  `assigned_by` int DEFAULT NULL,
  `installation_start_date` date DEFAULT NULL,
  `installation_end_date` date DEFAULT NULL,
  `completion_date` date DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `customer_id` int DEFAULT NULL,
  `total_cost` decimal(12,2) DEFAULT '0.00',
  `amount_received` decimal(12,2) DEFAULT '0.00',
  `payment_status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'Pending',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_project_number` (`project_number`),
  UNIQUE KEY `project_uuid` (`project_uuid`),
  KEY `idx_project_lead` (`lead_id`),
  KEY `idx_project_quotation` (`quotation_id`),
  KEY `idx_project_stage` (`stage`),
  KEY `idx_project_assigned_to` (`assigned_to`),
  KEY `idx_project_assigned_by` (`assigned_by`),
  KEY `idx_project_is_deleted` (`is_deleted`),
  KEY `idx_project_created_by` (`created_by`),
  CONSTRAINT `fk_project_assigned_by` FOREIGN KEY (`assigned_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_project_assigned_to` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_project_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_project_lead` FOREIGN KEY (`lead_id`) REFERENCES `leads` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_project_quotation` FOREIGN KEY (`quotation_id`) REFERENCES `quotations` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `purchase_orders`
--

DROP TABLE IF EXISTS `purchase_orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchase_orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `po_number` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `project_id` int DEFAULT NULL,
  `vendor_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `vendor_phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `vendor_email` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `items` json NOT NULL,
  `total_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `status` enum('Draft','Sent','Confirmed','Partial Delivery','Delivered','Cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Draft',
  `expected_delivery_date` date DEFAULT NULL,
  `actual_delivery_date` date DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_po_number` (`po_number`),
  KEY `idx_po_project` (`project_id`),
  KEY `idx_po_status` (`status`),
  KEY `idx_po_is_deleted` (`is_deleted`),
  KEY `idx_po_created_by` (`created_by`),
  CONSTRAINT `fk_po_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_po_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `quotation_revisions`
--

DROP TABLE IF EXISTS `quotation_revisions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `quotation_revisions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `quotation_id` int NOT NULL,
  `revision_number` int NOT NULL,
  `public_token` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `snapshot_json` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `quote_revision` (`quotation_id`,`revision_number`),
  UNIQUE KEY `revision_token` (`public_token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `quotations`
--

DROP TABLE IF EXISTS `quotations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `quotations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `quotation_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `public_token` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `lead_id` int DEFAULT NULL,
  `calculation_id` int DEFAULT NULL,
  `customer_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_email` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customer_phone` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_address` text COLLATE utf8mb4_unicode_ci,
  `city` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `state` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pincode` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `system_capacity_kw` decimal(6,2) NOT NULL,
  `system_type` enum('On-Grid','Off-Grid','Hybrid') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'On-Grid',
  `panel_brand` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Waaree Mono PERC',
  `panel_type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Mono PERC 550W Half-Cut',
  `panel_count` int NOT NULL,
  `inverter_brand` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Growatt / Solis / GoodWe',
  `inverter_capacity_kw` decimal(6,2) NOT NULL,
  `structure_type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Elevated GI High-Grade Structure',
  `battery_capacity_ah` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `base_price` decimal(12,2) NOT NULL,
  `structure_installation_cost` decimal(12,2) NOT NULL DEFAULT '0.00',
  `gst_rate` decimal(5,2) NOT NULL DEFAULT '13.80',
  `gst_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `discount_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `total_amount` decimal(12,2) NOT NULL,
  `subsidy_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `net_payable_amount` decimal(12,2) NOT NULL,
  `annual_generation_kwh` decimal(10,2) NOT NULL DEFAULT '0.00',
  `annual_savings` decimal(12,2) NOT NULL DEFAULT '0.00',
  `payback_years` decimal(4,2) NOT NULL DEFAULT '0.00',
  `twenty_five_year_savings` decimal(14,2) NOT NULL DEFAULT '0.00',
  `status` enum('Draft','Sent','Accepted','Rejected','Expired') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Sent',
  `valid_until` date DEFAULT NULL,
  `terms_and_conditions` text COLLATE utf8mb4_unicode_ci,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `line_items_json` longtext COLLATE utf8mb4_unicode_ci,
  `viewed_at` datetime DEFAULT NULL,
  `accepted_at` datetime DEFAULT NULL,
  `customer_signature_name` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `customer_id` int DEFAULT NULL,
  `gst_mode` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gst_summary_json` longtext COLLATE utf8mb4_unicode_ci,
  `revision_number` int NOT NULL DEFAULT '1',
  `discount_approval` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `approval_by` int DEFAULT NULL,
  `approval_note` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_quotation_number` (`quotation_number`),
  UNIQUE KEY `uq_public_token` (`public_token`),
  KEY `idx_quo_lead` (`lead_id`),
  KEY `idx_quo_calc` (`calculation_id`),
  KEY `idx_quo_status` (`status`),
  KEY `idx_quo_created_by` (`created_by`),
  KEY `idx_quotations_lead` (`lead_id`),
  KEY `idx_quotations_status` (`status`),
  CONSTRAINT `fk_quo_calc` FOREIGN KEY (`calculation_id`) REFERENCES `solar_calculations` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_quo_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_quo_lead` FOREIGN KEY (`lead_id`) REFERENCES `leads` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `role_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `permissions` json DEFAULT NULL,
  `status` enum('Active','Inactive') COLLATE utf8mb4_unicode_ci DEFAULT 'Active',
  `is_system` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `role_name` (`role_name`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `schema_migrations`
--

DROP TABLE IF EXISTS `schema_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `schema_migrations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `migration_name` varchar(255) NOT NULL,
  `applied_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `migration_name` (`migration_name`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `settings`
--

DROP TABLE IF EXISTS `settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `company_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `company_logo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `company_email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `company_phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `website` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gst_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `currency` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'INR',
  `timezone` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'Asia/Kolkata',
  `smtp_host` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `smtp_port` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `smtp_username` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `smtp_password` text COLLATE utf8mb4_unicode_ci,
  `email_notifications` tinyint(1) DEFAULT '1',
  `lead_notifications` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `quotation_template` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'template1',
  `bank_name` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `account_name` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `account_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ifsc_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `branch_name` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `upi_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `site_surveys`
--

DROP TABLE IF EXISTS `site_surveys`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `site_surveys` (
  `id` int NOT NULL AUTO_INCREMENT,
  `lead_id` int NOT NULL,
  `assigned_engineer_id` int DEFAULT NULL,
  `scheduled_date` date NOT NULL,
  `scheduled_time` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('scheduled','completed','cancelled') COLLATE utf8mb4_unicode_ci DEFAULT 'scheduled',
  `roof_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'RCC',
  `roof_area_sqft` decimal(10,2) DEFAULT NULL,
  `shadow_conditions` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `electrical_phase` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT '1-Phase',
  `sanctioned_load_kw` decimal(10,2) DEFAULT NULL,
  `photos` json DEFAULT NULL,
  `site_notes` text COLLATE utf8mb4_unicode_ci,
  `gps_latitude` decimal(10,7) DEFAULT NULL,
  `gps_longitude` decimal(10,7) DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `site_address` text COLLATE utf8mb4_unicode_ci,
  `landmark` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `site_latitude` decimal(10,7) DEFAULT NULL,
  `site_longitude` decimal(10,7) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `lead_id` (`lead_id`),
  KEY `survey_engineer_day` (`assigned_engineer_id`,`scheduled_date`,`status`),
  CONSTRAINT `site_surveys_ibfk_1` FOREIGN KEY (`lead_id`) REFERENCES `leads` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `solar_calculations`
--

DROP TABLE IF EXISTS `solar_calculations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `solar_calculations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `lead_id` int DEFAULT NULL,
  `monthly_bill` decimal(10,2) NOT NULL DEFAULT '0.00',
  `monthly_units` decimal(10,2) NOT NULL DEFAULT '0.00',
  `property_type` enum('Residential','Commercial','Industrial') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Residential',
  `connection_phase` enum('Single Phase','3 Phase') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Single Phase',
  `roof_area_sqft` decimal(10,2) DEFAULT NULL,
  `tariff_rate` decimal(6,2) NOT NULL DEFAULT '8.00',
  `recommended_kw` decimal(6,2) NOT NULL,
  `panel_count` int NOT NULL,
  `panel_wattage` int NOT NULL DEFAULT '550',
  `inverter_kw` decimal(6,2) NOT NULL,
  `required_area_sqft` decimal(10,2) NOT NULL,
  `gross_cost` decimal(12,2) NOT NULL,
  `subsidy_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `net_cost` decimal(12,2) NOT NULL,
  `annual_generation_kwh` decimal(10,2) NOT NULL,
  `annual_savings` decimal(12,2) NOT NULL,
  `payback_years` decimal(4,2) NOT NULL,
  `twenty_five_year_savings` decimal(14,2) NOT NULL,
  `co2_offset_tonnes` decimal(8,2) NOT NULL,
  `calculator_version` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT '2.0.0',
  `tariff_version` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT '1.0.0',
  `subsidy_version` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT '2.0.0',
  `generation_version` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT '1.0.0',
  `pricing_version` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT '1.0.0',
  `input_snapshot` json DEFAULT NULL,
  `result_snapshot` json DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_calc_lead` (`lead_id`),
  KEY `idx_calc_created_by` (`created_by`),
  CONSTRAINT `fk_calc_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_calc_lead` FOREIGN KEY (`lead_id`) REFERENCES `leads` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `solar_generation_profiles`
--

DROP TABLE IF EXISTS `solar_generation_profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `solar_generation_profiles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `state` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `city` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `latitude` decimal(8,4) DEFAULT NULL,
  `longitude` decimal(8,4) DEFAULT NULL,
  `specific_yield_kwh_per_kw_year` decimal(8,2) NOT NULL DEFAULT '1500.00',
  `monthly_generation_profile` json DEFAULT NULL,
  `performance_ratio` decimal(5,2) NOT NULL DEFAULT '0.78',
  `effective_from` date NOT NULL DEFAULT '2024-01-01',
  `source` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT 'MNRE / NISE Solar Resource Map Data',
  `version` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '1.0.0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `idx_gen_state_city` (`state`,`city`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `solar_inverters`
--

DROP TABLE IF EXISTS `solar_inverters`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `solar_inverters` (
  `id` int NOT NULL AUTO_INCREMENT,
  `brand` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `model` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `rated_ac_kw` decimal(6,2) NOT NULL,
  `max_dc_kw` decimal(6,2) NOT NULL,
  `max_dc_voltage` int DEFAULT '1000',
  `mppt_count` int NOT NULL DEFAULT '2',
  `phase` enum('Single Phase','3 Phase') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Single Phase',
  `efficiency` decimal(5,2) NOT NULL DEFAULT '98.00',
  `warranty` int NOT NULL DEFAULT '5',
  `grid_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'On-Grid',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `solar_loans`
--

DROP TABLE IF EXISTS `solar_loans`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `solar_loans` (
  `id` int NOT NULL AUTO_INCREMENT,
  `lead_id` int NOT NULL,
  `project_id` int DEFAULT NULL,
  `customer_name` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customer_phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customer_email` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `state` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'State Bank of India (SBI)',
  `bank_branch` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank_ifsc` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank_dsa_name` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank_dsa_phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `portal_application_no` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `loan_stage` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Applied / Logged',
  `system_capacity_kw` decimal(8,2) DEFAULT '3.00',
  `total_project_cost` decimal(12,2) DEFAULT '0.00',
  `subsidy_expected` decimal(12,2) DEFAULT '78000.00',
  `down_payment_amount` decimal(12,2) DEFAULT '0.00',
  `loan_amount_applied` decimal(12,2) DEFAULT '0.00',
  `sanctioned_amount` decimal(12,2) DEFAULT '0.00',
  `disbursed_amount` decimal(12,2) DEFAULT '0.00',
  `interest_rate` decimal(5,2) DEFAULT '7.00',
  `tenure_months` int DEFAULT '60',
  `monthly_emi` decimal(10,2) DEFAULT '0.00',
  `cibil_score` int DEFAULT NULL,
  `electricity_consumer_no` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `co_applicant_name` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `co_applicant_relation` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `applied_date` date DEFAULT NULL,
  `sanction_date` date DEFAULT NULL,
  `disbursal_date` date DEFAULT NULL,
  `first_emi_date` date DEFAULT NULL,
  `bank_query_remarks` text COLLATE utf8mb4_unicode_ci,
  `internal_notes` text COLLATE utf8mb4_unicode_ci,
  `sanction_letter_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `side_status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Active',
  `rejection_reason` text COLLATE utf8mb4_unicode_ci,
  `stopped_at_stage` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subsidy_credited_to_loan` tinyint(1) DEFAULT '0',
  `backward_reason` text COLLATE utf8mb4_unicode_ci,
  `loan_synced_to_project` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `lead_id` (`lead_id`),
  CONSTRAINT `solar_loans_ibfk_1` FOREIGN KEY (`lead_id`) REFERENCES `leads` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `solar_panels`
--

DROP TABLE IF EXISTS `solar_panels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `solar_panels` (
  `id` int NOT NULL AUTO_INCREMENT,
  `brand` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `model` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `wattage` int NOT NULL DEFAULT '550',
  `length_mm` int NOT NULL DEFAULT '2278',
  `width_mm` int NOT NULL DEFAULT '1134',
  `efficiency` decimal(5,2) NOT NULL DEFAULT '21.30',
  `technology` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Mono PERC Half-Cut',
  `voc` decimal(6,2) DEFAULT '49.80',
  `isc` decimal(6,2) DEFAULT '14.00',
  `vmp` decimal(6,2) DEFAULT '41.90',
  `imp` decimal(6,2) DEFAULT '13.13',
  `temperature_coefficient` decimal(5,3) DEFAULT '-0.350',
  `warranty_years` int NOT NULL DEFAULT '25',
  `degradation_year_1` decimal(4,2) NOT NULL DEFAULT '2.00',
  `annual_degradation` decimal(4,2) NOT NULL DEFAULT '0.55',
  `is_dcr` tinyint(1) NOT NULL DEFAULT '1',
  `is_almm_compliant` tinyint(1) NOT NULL DEFAULT '1',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `stock_alerts`
--

DROP TABLE IF EXISTS `stock_alerts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock_alerts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `item_id` int NOT NULL,
  `alert_type` enum('LOW_STOCK','OUT_OF_STOCK','REORDER') COLLATE utf8mb4_unicode_ci NOT NULL,
  `current_stock` int NOT NULL,
  `min_stock_level` int NOT NULL,
  `is_resolved` tinyint(1) NOT NULL DEFAULT '0',
  `resolved_at` datetime DEFAULT NULL,
  `resolved_by` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_alert_item` (`item_id`),
  KEY `idx_alert_type` (`alert_type`),
  KEY `idx_alert_resolved` (`is_resolved`),
  CONSTRAINT `fk_alert_item` FOREIGN KEY (`item_id`) REFERENCES `stock_items` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=131 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `stock_categories`
--

DROP TABLE IF EXISTS `stock_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock_categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `icon` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sort_order` int DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_category_slug` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=11750 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `stock_items`
--

DROP TABLE IF EXISTS `stock_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `category_id` int NOT NULL,
  `item_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `barcode` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `brand` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `model` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `specifications` json DEFAULT NULL,
  `image_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `unit` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Piece',
  `unit_price` decimal(12,2) NOT NULL DEFAULT '0.00',
  `gst_rate` decimal(5,2) NOT NULL DEFAULT '18.00',
  `hsn_code` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `min_stock_level` int NOT NULL DEFAULT '5',
  `reorder_level` int NOT NULL DEFAULT '10',
  `current_stock` int NOT NULL DEFAULT '0',
  `reserved_stock` int NOT NULL DEFAULT '0',
  `available_stock` int GENERATED ALWAYS AS ((`current_stock` - `reserved_stock`)) STORED,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_item_code` (`item_code`),
  KEY `idx_item_category` (`category_id`),
  KEY `idx_item_brand` (`brand`),
  KEY `idx_item_active` (`is_active`),
  KEY `fk_item_created_by` (`created_by`),
  KEY `idx_item_barcode` (`barcode`),
  CONSTRAINT `fk_item_category` FOREIGN KEY (`category_id`) REFERENCES `stock_categories` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_item_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=426 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `stock_transactions`
--

DROP TABLE IF EXISTS `stock_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock_transactions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `transaction_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `item_id` int NOT NULL,
  `transaction_type` enum('IN','OUT','ADJUSTMENT','RESERVED','RELEASED') COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` int NOT NULL,
  `quantity_before` int NOT NULL DEFAULT '0',
  `quantity_after` int NOT NULL DEFAULT '0',
  `unit_price` decimal(12,2) DEFAULT NULL,
  `total_value` decimal(14,2) DEFAULT NULL,
  `reference_type` enum('PURCHASE','LEAD','PROJECT','ADJUSTMENT','RETURN','DAMAGE') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reference_id` int DEFAULT NULL,
  `reference_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `vendor_name` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `vendor_invoice` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_transaction_number` (`transaction_number`),
  KEY `idx_txn_item` (`item_id`),
  KEY `idx_txn_type` (`transaction_type`),
  KEY `idx_txn_ref` (`reference_type`,`reference_id`),
  KEY `idx_txn_created_by` (`created_by`),
  CONSTRAINT `fk_txn_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_txn_item` FOREIGN KEY (`item_id`) REFERENCES `stock_items` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=417 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `subsidy_applications`
--

DROP TABLE IF EXISTS `subsidy_applications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subsidy_applications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_order_id` int DEFAULT NULL,
  `lead_id` int NOT NULL,
  `consumer_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `application_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `scheme_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'PM Surya Ghar Muft Bijli Yojana',
  `portal_status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'docs_pending',
  `submission_date` date DEFAULT NULL,
  `approval_date` date DEFAULT NULL,
  `subsidy_amount` decimal(10,2) DEFAULT '0.00',
  `portal_notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `discom_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'JVVNL',
  `discom_division` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank_account_no` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank_ifsc` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank_account_holder` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `panel_make_model` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `panel_serial_numbers` text COLLATE utf8mb4_unicode_ci,
  `is_dcr_compliant` tinyint(1) DEFAULT '1',
  `inverter_make_model` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `inverter_serial_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `expected_subsidy` decimal(10,2) DEFAULT '78000.00',
  `amount_received` decimal(10,2) DEFAULT '0.00',
  `credit_date` date DEFAULT NULL,
  `utr_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customer_total_cost` decimal(10,2) DEFAULT '0.00',
  `customer_amount_paid` decimal(10,2) DEFAULT '0.00',
  `customer_balance` decimal(10,2) DEFAULT '0.00',
  `sla_expected_days` int DEFAULT '15',
  `stage_started_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `rejection_category` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rejection_fix_task` text COLLATE utf8mb4_unicode_ci,
  `sanctioned_capacity_kw` decimal(10,3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `lead_id` (`lead_id`),
  CONSTRAINT `subsidy_applications_ibfk_1` FOREIGN KEY (`lead_id`) REFERENCES `leads` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `subsidy_rejection_logs`
--

DROP TABLE IF EXISTS `subsidy_rejection_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subsidy_rejection_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `subsidy_id` int DEFAULT NULL,
  `lead_id` int NOT NULL,
  `stage_at_rejection` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `rejection_category` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `rejection_reason` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `fix_task` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `fix_status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `resolved_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `lead_id` (`lead_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `subsidy_rules`
--

DROP TABLE IF EXISTS `subsidy_rules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subsidy_rules` (
  `id` int NOT NULL AUTO_INCREMENT,
  `scheme_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PM Surya Ghar Muft Bijli Yojana',
  `consumer_category` enum('Residential','Commercial','Industrial','RWA') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Residential',
  `property_type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Residential',
  `capacity_from_kw` decimal(6,2) NOT NULL DEFAULT '0.00',
  `capacity_to_kw` decimal(6,2) NOT NULL DEFAULT '999.00',
  `rate_type` enum('FIXED','PER_KW','SLAB') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'SLAB',
  `rate_value` decimal(10,2) NOT NULL DEFAULT '0.00',
  `maximum_amount` decimal(12,2) NOT NULL DEFAULT '78000.00',
  `eligibility_rules` json DEFAULT NULL,
  `effective_from` date NOT NULL DEFAULT '2024-02-13',
  `effective_to` date DEFAULT NULL,
  `source` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT 'Official PM Surya Ghar Gazette Order 2024',
  `version` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '2.0.0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `system_loss_profiles`
--

DROP TABLE IF EXISTS `system_loss_profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `system_loss_profiles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `profile_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Standard Rooftop Loss Profile',
  `temperature_loss_percent` decimal(4,2) NOT NULL DEFAULT '8.50',
  `soiling_loss_percent` decimal(4,2) NOT NULL DEFAULT '3.00',
  `shading_loss_percent` decimal(4,2) NOT NULL DEFAULT '2.00',
  `mismatch_loss_percent` decimal(4,2) NOT NULL DEFAULT '1.50',
  `dc_cable_loss_percent` decimal(4,2) NOT NULL DEFAULT '1.50',
  `ac_cable_loss_percent` decimal(4,2) NOT NULL DEFAULT '1.00',
  `inverter_loss_percent` decimal(4,2) NOT NULL DEFAULT '2.00',
  `availability_loss_percent` decimal(4,2) NOT NULL DEFAULT '0.50',
  `is_default` tinyint(1) NOT NULL DEFAULT '1',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tariff_master`
--

DROP TABLE IF EXISTS `tariff_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tariff_master` (
  `id` int NOT NULL AUTO_INCREMENT,
  `state` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `discom` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `consumer_category` enum('Residential','Commercial','Industrial','Agricultural') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Residential',
  `phase` enum('Single Phase','3 Phase','Both') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Both',
  `slab_from_units` int NOT NULL DEFAULT '0',
  `slab_to_units` int NOT NULL DEFAULT '999999',
  `energy_rate` decimal(8,2) NOT NULL,
  `fixed_charge` decimal(8,2) NOT NULL DEFAULT '0.00',
  `duty_percent` decimal(5,2) NOT NULL DEFAULT '0.00',
  `fuel_adjustment` decimal(8,2) NOT NULL DEFAULT '0.00',
  `other_charge` decimal(8,2) NOT NULL DEFAULT '0.00',
  `effective_from` date NOT NULL DEFAULT '2024-01-01',
  `effective_to` date DEFAULT NULL,
  `source` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT 'Official DISCOM Tariff Order',
  `version` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '1.0.0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `idx_tariff_state_discom` (`state`,`discom`,`consumer_category`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tax_invoices`
--

DROP TABLE IF EXISTS `tax_invoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tax_invoices` (
  `id` int NOT NULL AUTO_INCREMENT,
  `invoice_number` varchar(30) NOT NULL,
  `project_id` int DEFAULT NULL,
  `customer_id` int DEFAULT NULL,
  `customer_name` varchar(150) DEFAULT NULL,
  `total_amount` decimal(12,2) DEFAULT '0.00',
  `paid_amount` decimal(12,2) DEFAULT '0.00',
  `payment_status` varchar(50) DEFAULT 'Unpaid',
  `created_by` int DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `invoice_number` (`invoice_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `role_id` int NOT NULL,
  `manager_id` int DEFAULT NULL,
  `full_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `profile_image` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('Active','Inactive') COLLATE utf8mb4_unicode_ci DEFAULT 'Active',
  `is_password_changed` tinyint(1) NOT NULL DEFAULT '0',
  `is_deleted` tinyint(1) DEFAULT '0',
  `last_login` datetime DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `fcm_token` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `username` (`username`),
  KEY `fk_role` (`role_id`),
  KEY `fk_manager` (`manager_id`),
  KEY `idx_users_role_status` (`role_id`,`status`),
  CONSTRAINT `fk_manager` FOREIGN KEY (`manager_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=56 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-13 21:15:46
-- MySQL dump 10.13  Distrib 8.4.13, for Linux (x86_64)
--
-- Host: localhost    Database: db_client_003
-- ------------------------------------------------------
-- Server version	8.4.13-0ubuntu0.26.04.2

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'Super Admin','Complete System Access',NULL,'Active',1,'2026-09-19 12:46:46','2026-10-20 12:38:28'),(2,'Manager','Manage Team & Leads',NULL,'Active',1,'2026-09-19 12:46:46','2026-10-20 12:38:28'),(3,'Sales','Handle Assigned Leads',NULL,'Active',1,'2026-09-19 12:46:46','2026-10-20 12:38:28'),(4,'Site Engineer','Conduct site surveys, feasibility checks & technical visits',NULL,'Active',1,'2026-10-17 09:22:45','2026-10-20 12:38:28');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `custom_lead_sources`
--

LOCK TABLES `custom_lead_sources` WRITE;
/*!40000 ALTER TABLE `custom_lead_sources` DISABLE KEYS */;
INSERT INTO `custom_lead_sources` VALUES (1,'Website',1,1,'2026-10-18 06:49:36','2026-10-18 06:49:36'),(2,'Call',1,1,'2026-10-18 06:49:36','2026-10-18 06:49:36'),(3,'WhatsApp',1,1,'2026-10-18 06:49:36','2026-10-18 06:49:36'),(4,'Reference',1,1,'2026-10-18 06:49:36','2026-10-18 06:49:36'),(5,'Facebook',1,1,'2026-10-18 06:49:36','2026-10-18 06:49:36'),(6,'Google',1,1,'2026-10-18 06:49:36','2026-10-18 06:49:36'),(7,'Cold Call',1,1,'2026-10-18 06:49:36','2026-10-18 06:49:36'),(8,'Direct',1,1,'2026-10-18 06:49:36','2026-10-18 06:49:36'),(9,'Other',1,1,'2026-10-18 06:49:36','2026-10-18 06:49:36');
/*!40000 ALTER TABLE `custom_lead_sources` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `custom_lead_statuses`
--

LOCK TABLES `custom_lead_statuses` WRITE;
/*!40000 ALTER TABLE `custom_lead_statuses` DISABLE KEYS */;
INSERT INTO `custom_lead_statuses` VALUES (1,'New Lead','#1A73E8',1,0,0,1,1,'2026-10-18 06:49:36','2026-10-18 06:49:36'),(2,'Contacted','#0284C7',2,0,0,1,1,'2026-10-18 06:49:36','2026-10-18 06:49:36'),(3,'Follow-up Pending','#D97706',3,0,0,0,1,'2026-10-18 06:49:36','2026-11-13 18:35:08'),(4,'Site Visit Scheduled','#7C3AED',4,0,0,0,1,'2026-10-18 06:49:36','2026-11-13 18:35:08'),(5,'Quotation Sent','#EA580C',6,0,0,1,1,'2026-10-18 06:49:36','2026-11-13 18:35:08'),(6,'Negotiation','#2563EB',7,0,0,1,1,'2026-10-18 06:49:36','2026-11-13 18:35:08'),(7,'Won','#16A34A',8,1,0,1,1,'2026-10-18 06:49:36','2026-11-13 18:35:08'),(8,'Lost','#DC2626',10,0,1,1,1,'2026-10-18 06:49:36','2026-11-13 18:35:08'),(9,'Not Interested','#64748B',9,0,1,0,1,'2026-10-18 06:49:36','2026-11-13 18:35:08'),(10,'SOLAR SETUP DONE','#853838',10,0,0,0,0,'2026-10-26 07:36:49','2026-11-13 18:35:08'),(13,'Qualified','#1A73E8',3,0,0,1,1,'2026-11-13 18:35:08','2026-11-13 18:35:08'),(14,'Site Survey Scheduled','#1A73E8',4,0,0,1,1,'2026-11-13 18:35:08','2026-11-13 18:35:08'),(15,'Site Survey Done','#1A73E8',5,0,0,1,1,'2026-11-13 18:35:08','2026-11-13 18:35:08'),(19,'On Hold','#1A73E8',9,0,0,1,1,'2026-11-13 18:35:08','2026-11-13 18:35:08'),(21,'Invalid','#1A73E8',11,0,1,1,1,'2026-11-13 18:35:08','2026-11-13 18:35:08');
/*!40000 ALTER TABLE `custom_lead_statuses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `environmental_factors`
--

LOCK TABLES `environmental_factors` WRITE;
/*!40000 ALTER TABLE `environmental_factors` DISABLE KEYS */;
INSERT INTO `environmental_factors` VALUES (1,0.8200,20.00,'Central Electricity Authority (CEA) Emission Database v18','1.0.0',1);
/*!40000 ALTER TABLE `environmental_factors` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `epc_pricing_master`
--

LOCK TABLES `epc_pricing_master` WRITE;
/*!40000 ALTER TABLE `epc_pricing_master` DISABLE KEYS */;
INSERT INTO `epc_pricing_master` VALUES (1,'On-Grid','With Subsidy (DCR)',1.00,10.00,56425.00,13.80,4000.00,3500.00,5000.00,'2024-01-01','1.0.0',1),(2,'On-Grid','No Subsidy (Non-DCR)',1.00,100.00,48500.00,13.80,4000.00,3500.00,5000.00,'2024-01-01','1.0.0',1);
/*!40000 ALTER TABLE `epc_pricing_master` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `solar_generation_profiles`
--

LOCK TABLES `solar_generation_profiles` WRITE;
/*!40000 ALTER TABLE `solar_generation_profiles` DISABLE KEYS */;
INSERT INTO `solar_generation_profiles` VALUES (1,'Rajasthan','Jaipur',26.9124,75.7873,1650.00,'{\"apr\": 0.098, \"aug\": 0.068, \"dec\": 0.07, \"feb\": 0.082, \"jan\": 0.075, \"jul\": 0.072, \"jun\": 0.09, \"mar\": 0.095, \"may\": 0.102, \"nov\": 0.078, \"oct\": 0.088, \"sep\": 0.082}',0.80,'2024-01-01','NISE Solar Irradiation Data','1.0.0',1),(2,'Gujarat','Ahmedabad',23.0225,72.5714,1600.00,'{\"apr\": 0.097, \"aug\": 0.069, \"dec\": 0.076, \"feb\": 0.083, \"jan\": 0.076, \"jul\": 0.071, \"jun\": 0.088, \"mar\": 0.094, \"may\": 0.099, \"nov\": 0.079, \"oct\": 0.087, \"sep\": 0.081}',0.79,'2024-01-01','NISE Solar Irradiation Data','1.0.0',1),(3,'Maharashtra','Mumbai',19.0760,72.8777,1500.00,'{\"apr\": 0.099, \"aug\": 0.058, \"dec\": 0.084, \"feb\": 0.088, \"jan\": 0.082, \"jul\": 0.055, \"jun\": 0.065, \"mar\": 0.098, \"may\": 0.095, \"nov\": 0.094, \"oct\": 0.09, \"sep\": 0.072}',0.78,'2024-01-01','NISE Solar Irradiation Data','1.0.0',1),(4,'Delhi','New Delhi',28.6139,77.2090,1450.00,'{\"apr\": 0.098, \"aug\": 0.072, \"dec\": 0.074, \"feb\": 0.078, \"jan\": 0.068, \"jul\": 0.075, \"jun\": 0.092, \"mar\": 0.092, \"may\": 0.1, \"nov\": 0.078, \"oct\": 0.088, \"sep\": 0.085}',0.77,'2024-01-01','NISE Solar Irradiation Data','1.0.0',1),(5,'Default','Generic India',20.5937,78.9629,1484.35,'{\"apr\": 0.096, \"aug\": 0.068, \"dec\": 0.078, \"feb\": 0.08, \"jan\": 0.075, \"jul\": 0.07, \"jun\": 0.085, \"mar\": 0.092, \"may\": 0.098, \"nov\": 0.082, \"oct\": 0.086, \"sep\": 0.08}',0.78,'2024-01-01','Waaree National Weighted Baseline','1.0.0',1);
/*!40000 ALTER TABLE `solar_generation_profiles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `solar_inverters`
--

LOCK TABLES `solar_inverters` WRITE;
/*!40000 ALTER TABLE `solar_inverters` DISABLE KEYS */;
INSERT INTO `solar_inverters` VALUES (1,'Growatt / Solis','MIC 1-3kW Single Phase On-Grid',3.00,4.50,1000,1,'Single Phase',97.60,5,'On-Grid',1),(2,'Growatt / Solis','MIN 3-6kW Single Phase Dual MPPT',5.00,7.50,1000,2,'Single Phase',98.20,5,'On-Grid',1),(3,'Growatt / Solis / GoodWe','MOD 5-10kW 3 Phase Dual MPPT',10.00,15.00,1000,2,'3 Phase',98.50,5,'On-Grid',1);
/*!40000 ALTER TABLE `solar_inverters` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `solar_panels`
--

LOCK TABLES `solar_panels` WRITE;
/*!40000 ALTER TABLE `solar_panels` DISABLE KEYS */;
INSERT INTO `solar_panels` VALUES (1,'Waaree Solar','Arka Series 550W Mono PERC DCR',550,2278,1134,21.28,'Mono PERC Half-Cut DCR',49.80,14.00,41.90,13.13,-0.350,25,2.00,0.55,1,1,1),(2,'Waaree Solar','Elite Series 580W TOPCon DCR',580,2278,1134,22.44,'N-Type TOPCon DCR',49.80,14.00,41.90,13.13,-0.350,25,2.00,0.55,1,1,1),(3,'Adani Solar','Elan 540W Mono PERC Non-DCR',540,2256,1133,21.13,'Mono PERC Non-DCR',49.80,14.00,41.90,13.13,-0.350,25,2.00,0.55,0,1,1);
/*!40000 ALTER TABLE `solar_panels` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `subsidy_rules`
--

LOCK TABLES `subsidy_rules` WRITE;
/*!40000 ALTER TABLE `subsidy_rules` DISABLE KEYS */;
INSERT INTO `subsidy_rules` VALUES (1,'PM Surya Ghar Muft Bijli Yojana','Residential','Residential',0.00,3.00,'SLAB',0.00,78000.00,'{\"requires_dcr\": true, \"cap_above_3kw\": 78000, \"slab_1_up_to_2kw_per_kw\": 30000, \"slab_2_2kw_to_3kw_per_kw\": 18000}','2024-02-13',NULL,'Official MNRE PM Surya Ghar Notification 2024','2.0.0',1);
/*!40000 ALTER TABLE `subsidy_rules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `system_loss_profiles`
--

LOCK TABLES `system_loss_profiles` WRITE;
/*!40000 ALTER TABLE `system_loss_profiles` DISABLE KEYS */;
INSERT INTO `system_loss_profiles` VALUES (1,'Standard Rooftop Loss Profile',8.50,3.00,2.00,1.50,1.50,1.00,2.00,0.50,1,1);
/*!40000 ALTER TABLE `system_loss_profiles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `tariff_master`
--

LOCK TABLES `tariff_master` WRITE;
/*!40000 ALTER TABLE `tariff_master` DISABLE KEYS */;
INSERT INTO `tariff_master` VALUES (1,'Rajasthan','JVVNL / AVVNL / JdVVNL','Residential','Both',0,50,4.75,230.00,0.40,0.00,0.00,'2024-01-01',NULL,'Rajasthan SERC Tariff Order 2024','1.0.0',1),(2,'Rajasthan','JVVNL / AVVNL / JdVVNL','Residential','Both',51,150,6.50,230.00,0.40,0.00,0.00,'2024-01-01',NULL,'Rajasthan SERC Tariff Order 2024','1.0.0',1),(3,'Rajasthan','JVVNL / AVVNL / JdVVNL','Residential','Both',151,300,7.35,275.00,0.40,0.00,0.00,'2024-01-01',NULL,'Rajasthan SERC Tariff Order 2024','1.0.0',1),(4,'Rajasthan','JVVNL / AVVNL / JdVVNL','Residential','Both',301,500,7.65,340.00,0.40,0.00,0.00,'2024-01-01',NULL,'Rajasthan SERC Tariff Order 2024','1.0.0',1),(5,'Rajasthan','JVVNL / AVVNL / JdVVNL','Residential','Both',501,999999,7.95,400.00,0.40,0.00,0.00,'2024-01-01',NULL,'Rajasthan SERC Tariff Order 2024','1.0.0',1),(6,'Maharashtra','MSEDCL','Residential','Both',0,100,5.88,128.00,16.00,0.00,0.00,'2024-01-01',NULL,'MERC Tariff Order 2024','1.0.0',1),(7,'Maharashtra','MSEDCL','Residential','Both',101,300,11.26,128.00,16.00,0.00,0.00,'2024-01-01',NULL,'MERC Tariff Order 2024','1.0.0',1),(8,'Gujarat','DGVCL / MGVCL / PGVCL / UGVCL','Residential','Both',0,100,3.20,70.00,15.00,0.00,0.00,'2024-01-01',NULL,'GERC Tariff Order 2024','1.0.0',1),(9,'Delhi','TPDDL / BSES Yamuna / BSES Rajdhani','Residential','Both',0,200,3.00,40.00,5.00,0.00,0.00,'2024-01-01',NULL,'DERC Tariff Order 2024','1.0.0',1),(10,'Karnataka','BESCOM','Residential','Both',0,100,4.75,110.00,9.00,0.00,0.00,'2024-01-01',NULL,'KERC Tariff Order 2024','1.0.0',1);
/*!40000 ALTER TABLE `tariff_master` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `company_amc_plans`
--

LOCK TABLES `company_amc_plans` WRITE;
/*!40000 ALTER TABLE `company_amc_plans` DISABLE KEYS */;
/*!40000 ALTER TABLE `company_amc_plans` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-13 21:15:52
