-- Migration: 002_custom_roles_and_permissions.sql
-- Enables Admin to create Custom Roles with dynamic feature permissions

-- 1. Add permissions (JSON) and is_system (TINYINT) to roles table
ALTER TABLE `roles` ADD COLUMN IF NOT EXISTS `permissions` JSON NULL AFTER `description`;
ALTER TABLE `roles` ADD COLUMN IF NOT EXISTS `is_system` TINYINT(1) NOT NULL DEFAULT 0 AFTER `status`;

-- 2. Set Super Admin, Manager, Sales, Site Engineer as system roles
UPDATE `roles` SET `is_system` = 1 WHERE `id` IN (1, 2, 3, 4);

-- 3. Super Admin gets complete full permissions
UPDATE `roles` 
SET `permissions` = JSON_ARRAY(
  'dashboard:view',
  'users:view', 'users:create', 'users:edit', 'users:delete',
  'roles:view', 'roles:create', 'roles:edit', 'roles:delete',
  'leads:view', 'leads:create', 'leads:edit', 'leads:delete', 'leads:export',
  'customers:view', 'customers:create', 'customers:edit',
  'quotations:view', 'quotations:create', 'quotations:edit', 'quotations:delete',
  'calculator:view', 'calculator:use',
  'invoices:view', 'invoices:create', 'invoices:edit', 'invoices:delete',
  'subsidies:view', 'subsidies:edit',
  'projects:view', 'projects:create', 'projects:edit', 'projects:delete',
  'stock:view', 'stock:create', 'stock:edit', 'stock:delete',
  'surveys:view', 'surveys:create', 'surveys:edit',
  'reports:view', 'reports:export',
  'settings:view', 'settings:edit',
  'ai_copilot:use'
)
WHERE `id` = 1;

-- 4. Manager permissions
UPDATE `roles` 
SET `permissions` = JSON_ARRAY(
  'dashboard:view',
  'users:view', 'users:create',
  'leads:view', 'leads:create', 'leads:edit', 'leads:export',
  'customers:view', 'customers:create', 'customers:edit',
  'quotations:view', 'quotations:create', 'quotations:edit',
  'calculator:view', 'calculator:use',
  'invoices:view', 'invoices:create',
  'subsidies:view',
  'projects:view', 'projects:edit',
  'stock:view',
  'surveys:view', 'surveys:create', 'surveys:edit',
  'reports:view',
  'ai_copilot:use'
)
WHERE `id` = 2;

-- 5. Sales permissions
UPDATE `roles` 
SET `permissions` = JSON_ARRAY(
  'dashboard:view',
  'leads:view', 'leads:create', 'leads:edit',
  'customers:view', 'customers:create',
  'quotations:view', 'quotations:create',
  'calculator:view', 'calculator:use',
  'invoices:view',
  'surveys:view', 'surveys:create',
  'ai_copilot:use'
)
WHERE `id` = 3;

-- 6. Site Engineer permissions
UPDATE `roles` 
SET `permissions` = JSON_ARRAY(
  'dashboard:view',
  'surveys:view', 'surveys:create', 'surveys:edit',
  'projects:view', 'projects:edit'
)
WHERE `id` = 4;
