# Solar CRM file map

Prepared: 18 November 2026 (Asia/Calcutta).

This combines the feature areas discussed in this chat with files present in the current local workspace. The working tree also contains later user/other-session edits; Git status alone cannot identify who authored each edit. This is not a deployment manifest and does not confirm local/live synchronization.

## Module-wise navigation

### Shared UI, fonts, navigation

- [solar_crm_frontend/src/components/Admin/Navbar.jsx](solar_crm_frontend/src/components/Admin/Navbar.jsx)
- [solar_crm_frontend/src/components/Admin/Sidebar.jsx](solar_crm_frontend/src/components/Admin/Sidebar.jsx)
- [solar_crm_frontend/src/layouts/SalesNavbar.jsx](solar_crm_frontend/src/layouts/SalesNavbar.jsx)
- [solar_crm_frontend/src/layouts/SalesSidebar.jsx](solar_crm_frontend/src/layouts/SalesSidebar.jsx)
- [solar_crm_frontend/src/layouts/ManagerNavbar.jsx](solar_crm_frontend/src/layouts/ManagerNavbar.jsx)
- [solar_crm_frontend/src/layouts/ManagerSidebar.jsx](solar_crm_frontend/src/layouts/ManagerSidebar.jsx)
- [solar_crm_frontend/src/layouts/EngineerNavbar.jsx](solar_crm_frontend/src/layouts/EngineerNavbar.jsx)
- [solar_crm_frontend/src/layouts/EngineerSidebar.jsx](solar_crm_frontend/src/layouts/EngineerSidebar.jsx)
- [solar_crm_frontend/src/layouts/EngineerLayout.jsx](solar_crm_frontend/src/layouts/EngineerLayout.jsx)
- [solar_crm_frontend/src/theme/theme.js](solar_crm_frontend/src/theme/theme.js)
- [solar_crm_frontend/src/routes/AppRoutes.jsx](solar_crm_frontend/src/routes/AppRoutes.jsx)
- [solar_crm_frontend/src/routes/PrivateRoute.jsx](solar_crm_frontend/src/routes/PrivateRoute.jsx)

### Dashboard and Sales follow-ups

- [solar_crm_frontend/src/pages/Dashboard/Dashboard.jsx](solar_crm_frontend/src/pages/Dashboard/Dashboard.jsx)
- [solar_crm_frontend/src/pages/Sales/SalesDashboard.jsx](solar_crm_frontend/src/pages/Sales/SalesDashboard.jsx)
- [solar_crm_frontend/src/pages/Sales/SalesLeads.jsx](solar_crm_frontend/src/pages/Sales/SalesLeads.jsx)
- [solar_crm_frontend/src/pages/Leads/Leads.jsx](solar_crm_frontend/src/pages/Leads/Leads.jsx)
- [solar_crm_frontend/src/pages/Leads/TodayFollowups.jsx](solar_crm_frontend/src/pages/Leads/TodayFollowups.jsx)
- [solar_crm_frontend/src/pages/Leads/BirthdayEvents.jsx](solar_crm_frontend/src/pages/Leads/BirthdayEvents.jsx)
- [solar_crm_frontend/src/components/LeadActionDialog.jsx](solar_crm_frontend/src/components/LeadActionDialog.jsx)
- [solar_crm_frontend/src/components/MyNextActions.jsx](solar_crm_frontend/src/components/MyNextActions.jsx)
- [solar_crm_frontend/src/components/ReminderInbox.jsx](solar_crm_frontend/src/components/ReminderInbox.jsx)
- [solar_crm_frontend/src/utils/leadStages.js](solar_crm_frontend/src/utils/leadStages.js)
- [solar_crm_backend/models/dashboardModel.js](solar_crm_backend/models/dashboardModel.js)
- [solar_crm_backend/models/leadModel.js](solar_crm_backend/models/leadModel.js)
- [solar_crm_backend/controllers/leadController.js](solar_crm_backend/controllers/leadController.js)
- [solar_crm_backend/routes/salesWorkflowRoutes.js](solar_crm_backend/routes/salesWorkflowRoutes.js)
- [solar_crm_backend/services/salesWorkflow.js](solar_crm_backend/services/salesWorkflow.js)
- [solar_crm_backend/services/leadStages.js](solar_crm_backend/services/leadStages.js)
- [solar_crm_backend/services/scheduledNotifications.js](solar_crm_backend/services/scheduledNotifications.js)

### Manager team scope and screens

- [solar_crm_frontend/src/pages/Manager/ManagerDashboard.jsx](solar_crm_frontend/src/pages/Manager/ManagerDashboard.jsx)
- [solar_crm_frontend/src/pages/Manager/ManagerLeads.jsx](solar_crm_frontend/src/pages/Manager/ManagerLeads.jsx)
- [solar_crm_frontend/src/pages/Manager/ManagerReports.jsx](solar_crm_frontend/src/pages/Manager/ManagerReports.jsx)
- [solar_crm_frontend/src/pages/Manager/TeamFollowups.jsx](solar_crm_frontend/src/pages/Manager/TeamFollowups.jsx)
- [solar_crm_frontend/src/hooks/useWorkspaceNavigate.js](solar_crm_frontend/src/hooks/useWorkspaceNavigate.js)
- [solar_crm_backend/middleware/managerContext.js](solar_crm_backend/middleware/managerContext.js)
- [solar_crm_backend/utils/managerScope.js](solar_crm_backend/utils/managerScope.js)

### Site Engineer and survey scheduling

- [solar_crm_frontend/src/pages/Engineer/field/FieldWorkspace.jsx](solar_crm_frontend/src/pages/Engineer/field/FieldWorkspace.jsx)
- [solar_crm_frontend/src/components/ScheduleSurveyModal.jsx](solar_crm_frontend/src/components/ScheduleSurveyModal.jsx)
- [solar_crm_frontend/src/services/surveyService.js](solar_crm_frontend/src/services/surveyService.js)
- [solar_crm_backend/middleware/engineerContext.js](solar_crm_backend/middleware/engineerContext.js)
- [solar_crm_backend/routes/fieldWorkRoutes.js](solar_crm_backend/routes/fieldWorkRoutes.js)
- [solar_crm_backend/services/field/definitions.js](solar_crm_backend/services/field/definitions.js)
- [solar_crm_backend/services/field/workflow.js](solar_crm_backend/services/field/workflow.js)
- [solar_crm_backend/services/surveyBooking.js](solar_crm_backend/services/surveyBooking.js)
- [solar_crm_backend/controllers/surveyController.js](solar_crm_backend/controllers/surveyController.js)
- [solar_crm_backend/models/surveyModel.js](solar_crm_backend/models/surveyModel.js)
- [solar_crm_backend/routes/surveyRoutes.js](solar_crm_backend/routes/surveyRoutes.js)

### Projects, installation and handover

- [solar_crm_frontend/src/pages/Admin/Projects/ProjectWorkspace.jsx](solar_crm_frontend/src/pages/Admin/Projects/ProjectWorkspace.jsx)
- [solar_crm_frontend/src/pages/Admin/Projects/ProjectsList.jsx](solar_crm_frontend/src/pages/Admin/Projects/ProjectsList.jsx)
- [solar_crm_frontend/src/pages/Admin/Projects/ProjectDetail.jsx](solar_crm_frontend/src/pages/Admin/Projects/ProjectDetail.jsx)
- [solar_crm_frontend/src/pages/Admin/Projects/tabs/PreInstallInspection.jsx](solar_crm_frontend/src/pages/Admin/Projects/tabs/PreInstallInspection.jsx)
- [solar_crm_frontend/src/pages/Admin/Projects/tabs/InstallationProgress.jsx](solar_crm_frontend/src/pages/Admin/Projects/tabs/InstallationProgress.jsx)
- [solar_crm_frontend/src/pages/Admin/Projects/tabs/Commissioning.jsx](solar_crm_frontend/src/pages/Admin/Projects/tabs/Commissioning.jsx)
- [solar_crm_frontend/src/pages/Admin/Projects/tabs/FinalInspection.jsx](solar_crm_frontend/src/pages/Admin/Projects/tabs/FinalInspection.jsx)
- [solar_crm_frontend/src/pages/Admin/Projects/tabs/CustomerHandover.jsx](solar_crm_frontend/src/pages/Admin/Projects/tabs/CustomerHandover.jsx)
- [solar_crm_backend/models/projectModel.js](solar_crm_backend/models/projectModel.js)
- [solar_crm_backend/routes/projectRoutes.js](solar_crm_backend/routes/projectRoutes.js)

### Warranty and configurable AMC plans

- [solar_crm_frontend/src/pages/Admin/Projects/tabs/WarrantyAMC.jsx](solar_crm_frontend/src/pages/Admin/Projects/tabs/WarrantyAMC.jsx)
- [solar_crm_frontend/src/components/AmcPlanManager.jsx](solar_crm_frontend/src/components/AmcPlanManager.jsx)
- [solar_crm_frontend/src/utils/amcPlans.js](solar_crm_frontend/src/utils/amcPlans.js)
- [solar_crm_backend/services/amcPlans.js](solar_crm_backend/services/amcPlans.js)
- [solar_crm_backend/routes/amcPlanRoutes.js](solar_crm_backend/routes/amcPlanRoutes.js)
- [solar_crm_backend/models/warrantyModel.js](solar_crm_backend/models/warrantyModel.js)
- [solar_crm_backend/controllers/warrantyController.js](solar_crm_backend/controllers/warrantyController.js)
- [solar_crm_backend/routes/warrantyRoutes.js](solar_crm_backend/routes/warrantyRoutes.js)

### Customers and Users

- [solar_crm_frontend/src/pages/Customers/CustomersList.jsx](solar_crm_frontend/src/pages/Customers/CustomersList.jsx)
- [solar_crm_frontend/src/pages/Customers/CustomerDetail.jsx](solar_crm_frontend/src/pages/Customers/CustomerDetail.jsx)
- [solar_crm_frontend/src/pages/Customers/CustomerWorkspace.jsx](solar_crm_frontend/src/pages/Customers/CustomerWorkspace.jsx)
- [solar_crm_frontend/src/pages/Customers/customerHelpers.js](solar_crm_frontend/src/pages/Customers/customerHelpers.js)
- [solar_crm_frontend/src/pages/Customers/customerUi.jsx](solar_crm_frontend/src/pages/Customers/customerUi.jsx)
- [solar_crm_frontend/src/pages/Customers/AddCustomerModal.jsx](solar_crm_frontend/src/pages/Customers/AddCustomerModal.jsx)
- [solar_crm_frontend/src/pages/Users/Users.jsx](solar_crm_frontend/src/pages/Users/Users.jsx)
- [solar_crm_backend/models/customerModel.js](solar_crm_backend/models/customerModel.js)
- [solar_crm_backend/models/userModel.js](solar_crm_backend/models/userModel.js)
- [solar_crm_backend/controllers/userController.js](solar_crm_backend/controllers/userController.js)

### Quotations, PDF, GST and approvals

- [solar_crm_frontend/src/pages/Quotations/QuotationList.jsx](solar_crm_frontend/src/pages/Quotations/QuotationList.jsx)
- [solar_crm_frontend/src/pages/Quotations/CreateQuotationModal.jsx](solar_crm_frontend/src/pages/Quotations/CreateQuotationModal.jsx)
- [solar_crm_frontend/src/pages/Quotations/EditQuotationModal.jsx](solar_crm_frontend/src/pages/Quotations/EditQuotationModal.jsx)
- [solar_crm_frontend/src/pages/Quotations/DynamicWebQuotationView.jsx](solar_crm_frontend/src/pages/Quotations/DynamicWebQuotationView.jsx)
- [solar_crm_frontend/src/pages/Quotations/SolarQuotationDocument.jsx](solar_crm_frontend/src/pages/Quotations/SolarQuotationDocument.jsx)
- [solar_crm_frontend/src/components/SolarTaxSummary.jsx](solar_crm_frontend/src/components/SolarTaxSummary.jsx)
- [solar_crm_frontend/src/components/QuotationHistoryDialog.jsx](solar_crm_frontend/src/components/QuotationHistoryDialog.jsx)
- [solar_crm_frontend/src/utils/solarTax.js](solar_crm_frontend/src/utils/solarTax.js)
- [solar_crm_backend/utils/solarTax.js](solar_crm_backend/utils/solarTax.js)
- [solar_crm_backend/utils/ensureTaxColumns.js](solar_crm_backend/utils/ensureTaxColumns.js)
- [solar_crm_backend/controllers/quotationController.js](solar_crm_backend/controllers/quotationController.js)
- [solar_crm_backend/routes/quotationRoutes.js](solar_crm_backend/routes/quotationRoutes.js)
- [solar_crm_backend/services/quotationGovernance.js](solar_crm_backend/services/quotationGovernance.js)
- [solar_crm_backend/routes/quotationGovernanceRoutes.js](solar_crm_backend/routes/quotationGovernanceRoutes.js)

### Invoices, PDF and receipts

- [solar_crm_frontend/src/pages/Invoices/InvoiceList.jsx](solar_crm_frontend/src/pages/Invoices/InvoiceList.jsx)
- [solar_crm_frontend/src/pages/Invoices/ConvertInvoiceModal.jsx](solar_crm_frontend/src/pages/Invoices/ConvertInvoiceModal.jsx)
- [solar_crm_frontend/src/pages/Invoices/RecordPaymentModal.jsx](solar_crm_frontend/src/pages/Invoices/RecordPaymentModal.jsx)
- [solar_crm_frontend/src/pages/Invoices/DynamicInvoiceView.jsx](solar_crm_frontend/src/pages/Invoices/DynamicInvoiceView.jsx)
- [solar_crm_frontend/src/pages/Invoices/SolarInvoiceDocument.jsx](solar_crm_frontend/src/pages/Invoices/SolarInvoiceDocument.jsx)
- [solar_crm_frontend/src/pages/Invoices/invoiceDocumentHelpers.js](solar_crm_frontend/src/pages/Invoices/invoiceDocumentHelpers.js)
- [solar_crm_backend/controllers/invoiceController.js](solar_crm_backend/controllers/invoiceController.js)
- [solar_crm_backend/models/invoiceModel.js](solar_crm_backend/models/invoiceModel.js)
- [solar_crm_backend/routes/invoiceRoutes.js](solar_crm_backend/routes/invoiceRoutes.js)

### Subsidy and loans

- [solar_crm_frontend/src/pages/Admin/Subsidy/SubsidyTracker.jsx](solar_crm_frontend/src/pages/Admin/Subsidy/SubsidyTracker.jsx)
- [solar_crm_frontend/src/pages/Admin/Subsidy/SubsidyDetail.jsx](solar_crm_frontend/src/pages/Admin/Subsidy/SubsidyDetail.jsx)
- [solar_crm_frontend/src/components/SubsidyTrackerDrawer.jsx](solar_crm_frontend/src/components/SubsidyTrackerDrawer.jsx)
- [solar_crm_frontend/src/pages/Finance/FinanceWorkspace.jsx](solar_crm_frontend/src/pages/Finance/FinanceWorkspace.jsx)
- [solar_crm_frontend/src/pages/Finance/FinancingHub.jsx](solar_crm_frontend/src/pages/Finance/FinancingHub.jsx)
- [solar_crm_frontend/src/pages/Loans/LoansList.jsx](solar_crm_frontend/src/pages/Loans/LoansList.jsx)
- [solar_crm_frontend/src/services/loanService.js](solar_crm_frontend/src/services/loanService.js)
- [solar_crm_frontend/src/utils/loanMath.js](solar_crm_frontend/src/utils/loanMath.js)
- [solar_crm_frontend/src/utils/loanWorkflow.js](solar_crm_frontend/src/utils/loanWorkflow.js)
- [solar_crm_backend/controllers/subsidyController.js](solar_crm_backend/controllers/subsidyController.js)
- [solar_crm_backend/models/subsidyModel.js](solar_crm_backend/models/subsidyModel.js)
- [solar_crm_backend/controllers/loanController.js](solar_crm_backend/controllers/loanController.js)
- [solar_crm_backend/models/loanModel.js](solar_crm_backend/models/loanModel.js)
- [solar_crm_backend/utils/loanWorkflow.js](solar_crm_backend/utils/loanWorkflow.js)

### Stock, calculator and reports

- [solar_crm_frontend/src/pages/Calculator/SolarCalculator.jsx](solar_crm_frontend/src/pages/Calculator/SolarCalculator.jsx)
- [solar_crm_frontend/src/pages/Reports/EngineerReports.jsx](solar_crm_frontend/src/pages/Reports/EngineerReports.jsx)
- [solar_crm_frontend/src/pages/Reports/Reports.jsx](solar_crm_frontend/src/pages/Reports/Reports.jsx)
- [solar_crm_frontend/src/pages/Reports/ReportsWorkspace.jsx](solar_crm_frontend/src/pages/Reports/ReportsWorkspace.jsx)
- [solar_crm_frontend/src/pages/Reports/reportData.js](solar_crm_frontend/src/pages/Reports/reportData.js)
- [solar_crm_frontend/src/pages/Reports/reportExport.js](solar_crm_frontend/src/pages/Reports/reportExport.js)
- [solar_crm_frontend/src/pages/Stock/StockAlerts.jsx](solar_crm_frontend/src/pages/Stock/StockAlerts.jsx)
- [solar_crm_frontend/src/pages/Stock/StockDetail.jsx](solar_crm_frontend/src/pages/Stock/StockDetail.jsx)
- [solar_crm_frontend/src/pages/Stock/StockList.jsx](solar_crm_frontend/src/pages/Stock/StockList.jsx)
- [solar_crm_frontend/src/pages/Stock/StockTransactions.jsx](solar_crm_frontend/src/pages/Stock/StockTransactions.jsx)
- [solar_crm_frontend/src/pages/Stock/components/StockInModal.jsx](solar_crm_frontend/src/pages/Stock/components/StockInModal.jsx)
- [solar_crm_frontend/src/pages/Stock/components/StockItemModal.jsx](solar_crm_frontend/src/pages/Stock/components/StockItemModal.jsx)
- [solar_crm_frontend/src/pages/Stock/components/StockOutModal.jsx](solar_crm_frontend/src/pages/Stock/components/StockOutModal.jsx)
- [solar_crm_backend/controllers/calculatorController.js](solar_crm_backend/controllers/calculatorController.js)
- [solar_crm_backend/controllers/engineerReportController.js](solar_crm_backend/controllers/engineerReportController.js)
- [solar_crm_backend/utils/engineerReport.js](solar_crm_backend/utils/engineerReport.js)
- [solar_crm_backend/routes/reportRoutes.js](solar_crm_backend/routes/reportRoutes.js)

### Settings and integrations

- [solar_crm_frontend/src/pages/Settings/Settings.jsx](solar_crm_frontend/src/pages/Settings/Settings.jsx)
- [solar_crm_frontend/src/pages/Settings/Integrations.jsx](solar_crm_frontend/src/pages/Settings/Integrations.jsx)
- [solar_crm_frontend/src/pages/Settings/SalesWorkflowSettings.jsx](solar_crm_frontend/src/pages/Settings/SalesWorkflowSettings.jsx)
- [solar_crm_backend/routes/integrationRoutes.js](solar_crm_backend/routes/integrationRoutes.js)
- [solar_crm_backend/utils/integrationSecurity.js](solar_crm_backend/utils/integrationSecurity.js)

### Login, domain, provisioning and landing page

- [solar_crm_frontend/src/pages/Auth/Login.jsx](solar_crm_frontend/src/pages/Auth/Login.jsx)
- [solar_crm_frontend/src/services/authService.js](solar_crm_frontend/src/services/authService.js)
- [solar_crm_backend/app.js](solar_crm_backend/app.js)
- [solar_crm_backend/config/clientDb.js](solar_crm_backend/config/clientDb.js)
- [solar_crm_backend/controllers/authController.js](solar_crm_backend/controllers/authController.js)
- [solar_crm_backend/routes/authRoutes.js](solar_crm_backend/routes/authRoutes.js)
- [solar_crm_backend/routes/subscriptionRoutes.js](solar_crm_backend/routes/subscriptionRoutes.js)
- [solar_crm_backend/controllers/superAdminController.js](solar_crm_backend/controllers/superAdminController.js)
- [solar_crm_backend/services/clientProvisionService.js](solar_crm_backend/services/clientProvisionService.js)
- [solar_crm_backend/services/subscriptionEmailService.js](solar_crm_backend/services/subscriptionEmailService.js)
- [solar_crm_backend/services/userEmailService.js](solar_crm_backend/services/userEmailService.js)
- [solar_crm_backend/Database/solar_crm_master_template.sql](solar_crm_backend/Database/solar_crm_master_template.sql)
- [digiink_admin/src/pages/Clients.jsx](digiink_admin/src/pages/Clients.jsx)
- [digiink_admin/src/pages/CreateClient.jsx](digiink_admin/src/pages/CreateClient.jsx)
- [digiink_admin/src/pages/ClientDetail.jsx](digiink_admin/src/pages/ClientDetail.jsx)
- [solar_landing_page/index.html](solar_landing_page/index.html)
- [solar_landing_page/robots.txt](solar_landing_page/robots.txt)
- [solar_landing_page/sitemap.xml](solar_landing_page/sitemap.xml)

## Full current web/backend change inventory

191 modified or untracked files currently visible to Git under the web frontend, backend, master Admin and landing folders. Shared reference files in the map above need not themselves be modified.

`modified` means tracked changes versus HEAD; `untracked` means Git does not track the file yet. Neither label proves authorship. Temporary archives, builds, uploads, private evidence, environment files and the newer Flutter app are excluded.

### digiink_admin/src

- `modified` [digiink_admin/src/pages/ClientDetail.jsx](digiink_admin/src/pages/ClientDetail.jsx)
- `modified` [digiink_admin/src/pages/Clients.jsx](digiink_admin/src/pages/Clients.jsx)
- `modified` [digiink_admin/src/pages/CreateClient.jsx](digiink_admin/src/pages/CreateClient.jsx)

### solar_crm_backend/Database

- `modified` [solar_crm_backend/Database/autoMigrate.js](solar_crm_backend/Database/autoMigrate.js)
- `modified` [solar_crm_backend/Database/complete_client_template.sql](solar_crm_backend/Database/complete_client_template.sql)
- `untracked` [solar_crm_backend/Database/migrations/012_survey_feasibility_and_inspection_sync.js](solar_crm_backend/Database/migrations/012_survey_feasibility_and_inspection_sync.js)
- `untracked` [solar_crm_backend/Database/solar_crm_master_template.sql](solar_crm_backend/Database/solar_crm_master_template.sql)
- `modified` [solar_crm_backend/Database/step1_solar_calculator_and_quotations.sql](solar_crm_backend/Database/step1_solar_calculator_and_quotations.sql)

### solar_crm_backend/app.js

- `modified` [solar_crm_backend/app.js](solar_crm_backend/app.js)

### solar_crm_backend/config

- `modified` [solar_crm_backend/config/clientDb.js](solar_crm_backend/config/clientDb.js)

### solar_crm_backend/controllers

- `modified` [solar_crm_backend/controllers/authController.js](solar_crm_backend/controllers/authController.js)
- `modified` [solar_crm_backend/controllers/calculatorController.js](solar_crm_backend/controllers/calculatorController.js)
- `untracked` [solar_crm_backend/controllers/engineerReportController.js](solar_crm_backend/controllers/engineerReportController.js)
- `modified` [solar_crm_backend/controllers/invoiceController.js](solar_crm_backend/controllers/invoiceController.js)
- `modified` [solar_crm_backend/controllers/leadConfigController.js](solar_crm_backend/controllers/leadConfigController.js)
- `modified` [solar_crm_backend/controllers/leadController.js](solar_crm_backend/controllers/leadController.js)
- `modified` [solar_crm_backend/controllers/loanController.js](solar_crm_backend/controllers/loanController.js)
- `modified` [solar_crm_backend/controllers/projectController.js](solar_crm_backend/controllers/projectController.js)
- `modified` [solar_crm_backend/controllers/quotationController.js](solar_crm_backend/controllers/quotationController.js)
- `modified` [solar_crm_backend/controllers/subsidyController.js](solar_crm_backend/controllers/subsidyController.js)
- `modified` [solar_crm_backend/controllers/superAdminController.js](solar_crm_backend/controllers/superAdminController.js)
- `modified` [solar_crm_backend/controllers/surveyController.js](solar_crm_backend/controllers/surveyController.js)
- `modified` [solar_crm_backend/controllers/userController.js](solar_crm_backend/controllers/userController.js)
- `modified` [solar_crm_backend/controllers/warrantyController.js](solar_crm_backend/controllers/warrantyController.js)

### solar_crm_backend/middleware

- `modified` [solar_crm_backend/middleware/authMiddleware.js](solar_crm_backend/middleware/authMiddleware.js)
- `untracked` [solar_crm_backend/middleware/engineerContext.js](solar_crm_backend/middleware/engineerContext.js)
- `untracked` [solar_crm_backend/middleware/managerContext.js](solar_crm_backend/middleware/managerContext.js)

### solar_crm_backend/models

- `modified` [solar_crm_backend/models/customerModel.js](solar_crm_backend/models/customerModel.js)
- `modified` [solar_crm_backend/models/dashboardModel.js](solar_crm_backend/models/dashboardModel.js)
- `modified` [solar_crm_backend/models/invoiceModel.js](solar_crm_backend/models/invoiceModel.js)
- `modified` [solar_crm_backend/models/leadModel.js](solar_crm_backend/models/leadModel.js)
- `modified` [solar_crm_backend/models/loanModel.js](solar_crm_backend/models/loanModel.js)
- `modified` [solar_crm_backend/models/procurementModel.js](solar_crm_backend/models/procurementModel.js)
- `modified` [solar_crm_backend/models/projectModel.js](solar_crm_backend/models/projectModel.js)
- `modified` [solar_crm_backend/models/subsidyModel.js](solar_crm_backend/models/subsidyModel.js)
- `modified` [solar_crm_backend/models/surveyModel.js](solar_crm_backend/models/surveyModel.js)
- `modified` [solar_crm_backend/models/userModel.js](solar_crm_backend/models/userModel.js)
- `modified` [solar_crm_backend/models/warrantyModel.js](solar_crm_backend/models/warrantyModel.js)

### solar_crm_backend/routes

- `untracked` [solar_crm_backend/routes/amcPlanRoutes.js](solar_crm_backend/routes/amcPlanRoutes.js)
- `modified` [solar_crm_backend/routes/authRoutes.js](solar_crm_backend/routes/authRoutes.js)
- `modified` [solar_crm_backend/routes/customFieldRoutes.js](solar_crm_backend/routes/customFieldRoutes.js)
- `modified` [solar_crm_backend/routes/customerRoutes.js](solar_crm_backend/routes/customerRoutes.js)
- `modified` [solar_crm_backend/routes/dashboardRoutes.js](solar_crm_backend/routes/dashboardRoutes.js)
- `untracked` [solar_crm_backend/routes/fieldWorkRoutes.js](solar_crm_backend/routes/fieldWorkRoutes.js)
- `untracked` [solar_crm_backend/routes/integrationRoutes.js](solar_crm_backend/routes/integrationRoutes.js)
- `modified` [solar_crm_backend/routes/invoiceRoutes.js](solar_crm_backend/routes/invoiceRoutes.js)
- `modified` [solar_crm_backend/routes/leadRoutes.js](solar_crm_backend/routes/leadRoutes.js)
- `modified` [solar_crm_backend/routes/projectRoutes.js](solar_crm_backend/routes/projectRoutes.js)
- `untracked` [solar_crm_backend/routes/quotationGovernanceRoutes.js](solar_crm_backend/routes/quotationGovernanceRoutes.js)
- `modified` [solar_crm_backend/routes/quotationRoutes.js](solar_crm_backend/routes/quotationRoutes.js)
- `modified` [solar_crm_backend/routes/reportRoutes.js](solar_crm_backend/routes/reportRoutes.js)
- `untracked` [solar_crm_backend/routes/salesWorkflowRoutes.js](solar_crm_backend/routes/salesWorkflowRoutes.js)
- `modified` [solar_crm_backend/routes/surveyRoutes.js](solar_crm_backend/routes/surveyRoutes.js)
- `modified` [solar_crm_backend/routes/warrantyRoutes.js](solar_crm_backend/routes/warrantyRoutes.js)

### solar_crm_backend/scripts

- `untracked` [solar_crm_backend/scripts/add_survey_columns.js](solar_crm_backend/scripts/add_survey_columns.js)

### solar_crm_backend/services

- `untracked` [solar_crm_backend/services/amcPlans.js](solar_crm_backend/services/amcPlans.js)
- `modified` [solar_crm_backend/services/clientProvisionService.js](solar_crm_backend/services/clientProvisionService.js)
- `untracked` [solar_crm_backend/services/field/definitions.js](solar_crm_backend/services/field/definitions.js)
- `untracked` [solar_crm_backend/services/field/workflow.js](solar_crm_backend/services/field/workflow.js)
- `modified` [solar_crm_backend/services/geminiService.js](solar_crm_backend/services/geminiService.js)
- `untracked` [solar_crm_backend/services/leadStages.js](solar_crm_backend/services/leadStages.js)
- `modified` [solar_crm_backend/services/notificationService.js](solar_crm_backend/services/notificationService.js)
- `untracked` [solar_crm_backend/services/quotationGovernance.js](solar_crm_backend/services/quotationGovernance.js)
- `untracked` [solar_crm_backend/services/salesWorkflow.js](solar_crm_backend/services/salesWorkflow.js)
- `modified` [solar_crm_backend/services/scheduledNotifications.js](solar_crm_backend/services/scheduledNotifications.js)
- `modified` [solar_crm_backend/services/subscriptionEmailService.js](solar_crm_backend/services/subscriptionEmailService.js)
- `untracked` [solar_crm_backend/services/surveyBooking.js](solar_crm_backend/services/surveyBooking.js)
- `modified` [solar_crm_backend/services/userEmailService.js](solar_crm_backend/services/userEmailService.js)

### solar_crm_backend/tests

- `untracked` [solar_crm_backend/tests/amcPlans.test.js](solar_crm_backend/tests/amcPlans.test.js)
- `untracked` [solar_crm_backend/tests/engineerReport.test.js](solar_crm_backend/tests/engineerReport.test.js)
- `untracked` [solar_crm_backend/tests/fieldWorkflow.test.js](solar_crm_backend/tests/fieldWorkflow.test.js)
- `untracked` [solar_crm_backend/tests/integrations.test.js](solar_crm_backend/tests/integrations.test.js)
- `untracked` [solar_crm_backend/tests/loanValues.test.js](solar_crm_backend/tests/loanValues.test.js)
- `untracked` [solar_crm_backend/tests/loanWorkflow.test.js](solar_crm_backend/tests/loanWorkflow.test.js)
- `untracked` [solar_crm_backend/tests/managerScope.test.js](solar_crm_backend/tests/managerScope.test.js)
- `untracked` [solar_crm_backend/tests/salesLeadScope.test.js](solar_crm_backend/tests/salesLeadScope.test.js)
- `untracked` [solar_crm_backend/tests/salesWorkflow.test.js](solar_crm_backend/tests/salesWorkflow.test.js)
- `untracked` [solar_crm_backend/tests/solarTax.test.js](solar_crm_backend/tests/solarTax.test.js)
- `untracked` [solar_crm_backend/tests/subsidyStagePersistence.test.js](solar_crm_backend/tests/subsidyStagePersistence.test.js)
- `untracked` [solar_crm_backend/tests/surveyApprovalToProject.test.js](solar_crm_backend/tests/surveyApprovalToProject.test.js)
- `untracked` [solar_crm_backend/tests/surveyBooking.test.js](solar_crm_backend/tests/surveyBooking.test.js)

### solar_crm_backend/utils

- `untracked` [solar_crm_backend/utils/engineerReport.js](solar_crm_backend/utils/engineerReport.js)
- `untracked` [solar_crm_backend/utils/ensureTaxColumns.js](solar_crm_backend/utils/ensureTaxColumns.js)
- `untracked` [solar_crm_backend/utils/integrationSecurity.js](solar_crm_backend/utils/integrationSecurity.js)
- `untracked` [solar_crm_backend/utils/loanWorkflow.js](solar_crm_backend/utils/loanWorkflow.js)
- `untracked` [solar_crm_backend/utils/managerScope.js](solar_crm_backend/utils/managerScope.js)
- `untracked` [solar_crm_backend/utils/solarTax.js](solar_crm_backend/utils/solarTax.js)

### solar_crm_frontend/src

- `modified` [solar_crm_frontend/src/components/Admin/Navbar.jsx](solar_crm_frontend/src/components/Admin/Navbar.jsx)
- `modified` [solar_crm_frontend/src/components/Admin/Sidebar.jsx](solar_crm_frontend/src/components/Admin/Sidebar.jsx)
- `untracked` [solar_crm_frontend/src/components/AmcPlanManager.jsx](solar_crm_frontend/src/components/AmcPlanManager.jsx)
- `untracked` [solar_crm_frontend/src/components/ApproveSurveyModal.jsx](solar_crm_frontend/src/components/ApproveSurveyModal.jsx)
- `modified` [solar_crm_frontend/src/components/DealOrderModal.jsx](solar_crm_frontend/src/components/DealOrderModal.jsx)
- `modified` [solar_crm_frontend/src/components/ImportLeadsDialog.jsx](solar_crm_frontend/src/components/ImportLeadsDialog.jsx)
- `untracked` [solar_crm_frontend/src/components/LeadActionDialog.jsx](solar_crm_frontend/src/components/LeadActionDialog.jsx)
- `untracked` [solar_crm_frontend/src/components/MyNextActions.jsx](solar_crm_frontend/src/components/MyNextActions.jsx)
- `untracked` [solar_crm_frontend/src/components/QuotationHistoryDialog.jsx](solar_crm_frontend/src/components/QuotationHistoryDialog.jsx)
- `untracked` [solar_crm_frontend/src/components/ReminderInbox.jsx](solar_crm_frontend/src/components/ReminderInbox.jsx)
- `modified` [solar_crm_frontend/src/components/ScheduleSurveyModal.jsx](solar_crm_frontend/src/components/ScheduleSurveyModal.jsx)
- `untracked` [solar_crm_frontend/src/components/SolarTaxSummary.jsx](solar_crm_frontend/src/components/SolarTaxSummary.jsx)
- `modified` [solar_crm_frontend/src/components/SubsidyTrackerDrawer.jsx](solar_crm_frontend/src/components/SubsidyTrackerDrawer.jsx)
- `untracked` [solar_crm_frontend/src/hooks/useWorkspaceNavigate.js](solar_crm_frontend/src/hooks/useWorkspaceNavigate.js)
- `modified` [solar_crm_frontend/src/layouts/EngineerLayout.jsx](solar_crm_frontend/src/layouts/EngineerLayout.jsx)
- `modified` [solar_crm_frontend/src/layouts/EngineerNavbar.jsx](solar_crm_frontend/src/layouts/EngineerNavbar.jsx)
- `modified` [solar_crm_frontend/src/layouts/EngineerSidebar.jsx](solar_crm_frontend/src/layouts/EngineerSidebar.jsx)
- `modified` [solar_crm_frontend/src/layouts/ManagerNavbar.jsx](solar_crm_frontend/src/layouts/ManagerNavbar.jsx)
- `modified` [solar_crm_frontend/src/layouts/ManagerSidebar.jsx](solar_crm_frontend/src/layouts/ManagerSidebar.jsx)
- `modified` [solar_crm_frontend/src/layouts/SalesNavbar.jsx](solar_crm_frontend/src/layouts/SalesNavbar.jsx)
- `modified` [solar_crm_frontend/src/layouts/SalesSidebar.jsx](solar_crm_frontend/src/layouts/SalesSidebar.jsx)
- `modified` [solar_crm_frontend/src/pages/Admin/Projects/ProjectDetail.jsx](solar_crm_frontend/src/pages/Admin/Projects/ProjectDetail.jsx)
- `untracked` [solar_crm_frontend/src/pages/Admin/Projects/ProjectWorkspace.jsx](solar_crm_frontend/src/pages/Admin/Projects/ProjectWorkspace.jsx)
- `modified` [solar_crm_frontend/src/pages/Admin/Projects/ProjectsList.jsx](solar_crm_frontend/src/pages/Admin/Projects/ProjectsList.jsx)
- `modified` [solar_crm_frontend/src/pages/Admin/Projects/tabs/Commissioning.jsx](solar_crm_frontend/src/pages/Admin/Projects/tabs/Commissioning.jsx)
- `modified` [solar_crm_frontend/src/pages/Admin/Projects/tabs/CustomerHandover.jsx](solar_crm_frontend/src/pages/Admin/Projects/tabs/CustomerHandover.jsx)
- `modified` [solar_crm_frontend/src/pages/Admin/Projects/tabs/FinalInspection.jsx](solar_crm_frontend/src/pages/Admin/Projects/tabs/FinalInspection.jsx)
- `modified` [solar_crm_frontend/src/pages/Admin/Projects/tabs/InstallationProgress.jsx](solar_crm_frontend/src/pages/Admin/Projects/tabs/InstallationProgress.jsx)
- `modified` [solar_crm_frontend/src/pages/Admin/Projects/tabs/PreInstallInspection.jsx](solar_crm_frontend/src/pages/Admin/Projects/tabs/PreInstallInspection.jsx)
- `modified` [solar_crm_frontend/src/pages/Admin/Projects/tabs/ProjectLoanTab.jsx](solar_crm_frontend/src/pages/Admin/Projects/tabs/ProjectLoanTab.jsx)
- `modified` [solar_crm_frontend/src/pages/Admin/Projects/tabs/WarrantyAMC.jsx](solar_crm_frontend/src/pages/Admin/Projects/tabs/WarrantyAMC.jsx)
- `modified` [solar_crm_frontend/src/pages/Admin/Subsidy/SubsidyDetail.jsx](solar_crm_frontend/src/pages/Admin/Subsidy/SubsidyDetail.jsx)
- `modified` [solar_crm_frontend/src/pages/Admin/Subsidy/SubsidyTracker.jsx](solar_crm_frontend/src/pages/Admin/Subsidy/SubsidyTracker.jsx)
- `modified` [solar_crm_frontend/src/pages/Auth/Login.jsx](solar_crm_frontend/src/pages/Auth/Login.jsx)
- `modified` [solar_crm_frontend/src/pages/Calculator/SolarCalculator.jsx](solar_crm_frontend/src/pages/Calculator/SolarCalculator.jsx)
- `modified` [solar_crm_frontend/src/pages/Customers/AddCustomerModal.jsx](solar_crm_frontend/src/pages/Customers/AddCustomerModal.jsx)
- `modified` [solar_crm_frontend/src/pages/Customers/CustomerDetail.jsx](solar_crm_frontend/src/pages/Customers/CustomerDetail.jsx)
- `untracked` [solar_crm_frontend/src/pages/Customers/CustomerWorkspace.jsx](solar_crm_frontend/src/pages/Customers/CustomerWorkspace.jsx)
- `modified` [solar_crm_frontend/src/pages/Customers/CustomersList.jsx](solar_crm_frontend/src/pages/Customers/CustomersList.jsx)
- `untracked` [solar_crm_frontend/src/pages/Customers/customerHelpers.js](solar_crm_frontend/src/pages/Customers/customerHelpers.js)
- `untracked` [solar_crm_frontend/src/pages/Customers/customerUi.jsx](solar_crm_frontend/src/pages/Customers/customerUi.jsx)
- `modified` [solar_crm_frontend/src/pages/Dashboard/Dashboard.jsx](solar_crm_frontend/src/pages/Dashboard/Dashboard.jsx)
- `modified` [solar_crm_frontend/src/pages/Engineer/EngineerSurveys.jsx](solar_crm_frontend/src/pages/Engineer/EngineerSurveys.jsx)
- `untracked` [solar_crm_frontend/src/pages/Engineer/field/FieldWorkspace.jsx](solar_crm_frontend/src/pages/Engineer/field/FieldWorkspace.jsx)
- `untracked` [solar_crm_frontend/src/pages/Finance/FinanceWorkspace.jsx](solar_crm_frontend/src/pages/Finance/FinanceWorkspace.jsx)
- `untracked` [solar_crm_frontend/src/pages/Finance/FinancingHub.jsx](solar_crm_frontend/src/pages/Finance/FinancingHub.jsx)
- `modified` [solar_crm_frontend/src/pages/Invoices/ConvertInvoiceModal.jsx](solar_crm_frontend/src/pages/Invoices/ConvertInvoiceModal.jsx)
- `modified` [solar_crm_frontend/src/pages/Invoices/DynamicInvoiceView.jsx](solar_crm_frontend/src/pages/Invoices/DynamicInvoiceView.jsx)
- `modified` [solar_crm_frontend/src/pages/Invoices/InvoiceList.jsx](solar_crm_frontend/src/pages/Invoices/InvoiceList.jsx)
- `modified` [solar_crm_frontend/src/pages/Invoices/RecordPaymentModal.jsx](solar_crm_frontend/src/pages/Invoices/RecordPaymentModal.jsx)
- `untracked` [solar_crm_frontend/src/pages/Invoices/SolarInvoiceDocument.jsx](solar_crm_frontend/src/pages/Invoices/SolarInvoiceDocument.jsx)
- `untracked` [solar_crm_frontend/src/pages/Invoices/invoiceDocumentHelpers.js](solar_crm_frontend/src/pages/Invoices/invoiceDocumentHelpers.js)
- `modified` [solar_crm_frontend/src/pages/Leads/BirthdayEvents.jsx](solar_crm_frontend/src/pages/Leads/BirthdayEvents.jsx)
- `modified` [solar_crm_frontend/src/pages/Leads/Leads.jsx](solar_crm_frontend/src/pages/Leads/Leads.jsx)
- `modified` [solar_crm_frontend/src/pages/Leads/TodayFollowups.jsx](solar_crm_frontend/src/pages/Leads/TodayFollowups.jsx)
- `modified` [solar_crm_frontend/src/pages/Loans/LoansList.jsx](solar_crm_frontend/src/pages/Loans/LoansList.jsx)
- `modified` [solar_crm_frontend/src/pages/Manager/ManagerDashboard.jsx](solar_crm_frontend/src/pages/Manager/ManagerDashboard.jsx)
- `modified` [solar_crm_frontend/src/pages/Manager/ManagerLeads.jsx](solar_crm_frontend/src/pages/Manager/ManagerLeads.jsx)
- `modified` [solar_crm_frontend/src/pages/Manager/ManagerReports.jsx](solar_crm_frontend/src/pages/Manager/ManagerReports.jsx)
- `modified` [solar_crm_frontend/src/pages/Manager/TeamFollowups.jsx](solar_crm_frontend/src/pages/Manager/TeamFollowups.jsx)
- `modified` [solar_crm_frontend/src/pages/Quotations/CreateQuotationModal.jsx](solar_crm_frontend/src/pages/Quotations/CreateQuotationModal.jsx)
- `modified` [solar_crm_frontend/src/pages/Quotations/DynamicWebQuotationView.jsx](solar_crm_frontend/src/pages/Quotations/DynamicWebQuotationView.jsx)
- `modified` [solar_crm_frontend/src/pages/Quotations/EditQuotationModal.jsx](solar_crm_frontend/src/pages/Quotations/EditQuotationModal.jsx)
- `modified` [solar_crm_frontend/src/pages/Quotations/QuotationList.jsx](solar_crm_frontend/src/pages/Quotations/QuotationList.jsx)
- `untracked` [solar_crm_frontend/src/pages/Quotations/SolarQuotationDocument.jsx](solar_crm_frontend/src/pages/Quotations/SolarQuotationDocument.jsx)
- `untracked` [solar_crm_frontend/src/pages/Reports/EngineerReports.jsx](solar_crm_frontend/src/pages/Reports/EngineerReports.jsx)
- `modified` [solar_crm_frontend/src/pages/Reports/Reports.jsx](solar_crm_frontend/src/pages/Reports/Reports.jsx)
- `untracked` [solar_crm_frontend/src/pages/Reports/ReportsWorkspace.jsx](solar_crm_frontend/src/pages/Reports/ReportsWorkspace.jsx)
- `untracked` [solar_crm_frontend/src/pages/Reports/reportData.js](solar_crm_frontend/src/pages/Reports/reportData.js)
- `untracked` [solar_crm_frontend/src/pages/Reports/reportExport.js](solar_crm_frontend/src/pages/Reports/reportExport.js)
- `modified` [solar_crm_frontend/src/pages/Sales/SalesDashboard.jsx](solar_crm_frontend/src/pages/Sales/SalesDashboard.jsx)
- `modified` [solar_crm_frontend/src/pages/Sales/SalesLeads.jsx](solar_crm_frontend/src/pages/Sales/SalesLeads.jsx)
- `untracked` [solar_crm_frontend/src/pages/Settings/Integrations.jsx](solar_crm_frontend/src/pages/Settings/Integrations.jsx)
- `untracked` [solar_crm_frontend/src/pages/Settings/SalesWorkflowSettings.jsx](solar_crm_frontend/src/pages/Settings/SalesWorkflowSettings.jsx)
- `modified` [solar_crm_frontend/src/pages/Settings/Settings.jsx](solar_crm_frontend/src/pages/Settings/Settings.jsx)
- `modified` [solar_crm_frontend/src/pages/Stock/StockAlerts.jsx](solar_crm_frontend/src/pages/Stock/StockAlerts.jsx)
- `modified` [solar_crm_frontend/src/pages/Stock/StockDetail.jsx](solar_crm_frontend/src/pages/Stock/StockDetail.jsx)
- `modified` [solar_crm_frontend/src/pages/Stock/StockList.jsx](solar_crm_frontend/src/pages/Stock/StockList.jsx)
- `modified` [solar_crm_frontend/src/pages/Stock/StockTransactions.jsx](solar_crm_frontend/src/pages/Stock/StockTransactions.jsx)
- `modified` [solar_crm_frontend/src/pages/Stock/components/StockInModal.jsx](solar_crm_frontend/src/pages/Stock/components/StockInModal.jsx)
- `modified` [solar_crm_frontend/src/pages/Stock/components/StockItemModal.jsx](solar_crm_frontend/src/pages/Stock/components/StockItemModal.jsx)
- `modified` [solar_crm_frontend/src/pages/Stock/components/StockOutModal.jsx](solar_crm_frontend/src/pages/Stock/components/StockOutModal.jsx)
- `modified` [solar_crm_frontend/src/pages/Users/Users.jsx](solar_crm_frontend/src/pages/Users/Users.jsx)
- `modified` [solar_crm_frontend/src/routes/AppRoutes.jsx](solar_crm_frontend/src/routes/AppRoutes.jsx)
- `modified` [solar_crm_frontend/src/routes/PrivateRoute.jsx](solar_crm_frontend/src/routes/PrivateRoute.jsx)
- `modified` [solar_crm_frontend/src/services/authService.js](solar_crm_frontend/src/services/authService.js)
- `modified` [solar_crm_frontend/src/services/loanService.js](solar_crm_frontend/src/services/loanService.js)
- `modified` [solar_crm_frontend/src/services/surveyService.js](solar_crm_frontend/src/services/surveyService.js)
- `untracked` [solar_crm_frontend/src/utils/amcPlans.js](solar_crm_frontend/src/utils/amcPlans.js)
- `untracked` [solar_crm_frontend/src/utils/leadStages.js](solar_crm_frontend/src/utils/leadStages.js)
- `untracked` [solar_crm_frontend/src/utils/loanMath.js](solar_crm_frontend/src/utils/loanMath.js)
- `untracked` [solar_crm_frontend/src/utils/loanWorkflow.js](solar_crm_frontend/src/utils/loanWorkflow.js)
- `untracked` [solar_crm_frontend/src/utils/solarTax.js](solar_crm_frontend/src/utils/solarTax.js)

### solar_landing_page/assets

- `untracked` [solar_landing_page/assets/logo-full.svg](solar_landing_page/assets/logo-full.svg)
- `untracked` [solar_landing_page/assets/logo-icon.svg](solar_landing_page/assets/logo-icon.svg)
- `untracked` [solar_landing_page/assets/official-logo.png](solar_landing_page/assets/official-logo.png)

### solar_landing_page/how-it-works.html

- `untracked` [solar_landing_page/how-it-works.html](solar_landing_page/how-it-works.html)

### solar_landing_page/index.html

- `untracked` [solar_landing_page/index.html](solar_landing_page/index.html)

### solar_landing_page/privacy-policy.html

- `untracked` [solar_landing_page/privacy-policy.html](solar_landing_page/privacy-policy.html)

### solar_landing_page/privacy.html

- `untracked` [solar_landing_page/privacy.html](solar_landing_page/privacy.html)

### solar_landing_page/robots.txt

- `untracked` [solar_landing_page/robots.txt](solar_landing_page/robots.txt)

### solar_landing_page/sitemap.xml

- `untracked` [solar_landing_page/sitemap.xml](solar_landing_page/sitemap.xml)

### solar_landing_page/terms-and-conditions.html

- `untracked` [solar_landing_page/terms-and-conditions.html](solar_landing_page/terms-and-conditions.html)

### solar_landing_page/terms.html

- `untracked` [solar_landing_page/terms.html](solar_landing_page/terms.html)

## Release notes and audit documents

- [AMC_PLANS_RELEASE.md](AMC_PLANS_RELEASE.md)
- [CUSTOMERS_UI_RELEASE_2026-11-10.md](CUSTOMERS_UI_RELEASE_2026-11-10.md)
- [FINANCE_UI_RELEASE_2026-11-10.md](FINANCE_UI_RELEASE_2026-11-10.md)
- [INTEGRATIONS_SETUP.md](INTEGRATIONS_SETUP.md)
- [MANAGER_WORKSPACE_RELEASE.md](MANAGER_WORKSPACE_RELEASE.md)
- [PROJECTS_UI_RELEASE_2026-11-10.md](PROJECTS_UI_RELEASE_2026-11-10.md)
- [REPORTS_UI_RELEASE_2026-11-12.md](REPORTS_UI_RELEASE_2026-11-12.md)
- [SALES_LEADS_RELEASE.md](SALES_LEADS_RELEASE.md)
- [SALES_SURVEY_STATUS_RELEASE.md](SALES_SURVEY_STATUS_RELEASE.md)
- [SALES_WORKFLOW_RELEASE.md](SALES_WORKFLOW_RELEASE.md)
- [SITE_ENGINEER_RELEASE.md](SITE_ENGINEER_RELEASE.md)
- [SOLAR_CRM_AUDIT_2026-11-10.md](SOLAR_CRM_AUDIT_2026-11-10.md)
- [SOLAR_FINANCING_WORKFLOW.md](SOLAR_FINANCING_WORKFLOW.md)
- [SOLAR_GST_MODES.md](SOLAR_GST_MODES.md)
- [SOLAR_PROJECT_FEATURES.md](SOLAR_PROJECT_FEATURES.md)

## Later additions observed

The workspace now also contains `solar_crm_app/` (Flutter), survey approval components and extra migration files. Their presence is recorded here, but they are not being attributed to the earlier web UI work.

Generated `dist/` JavaScript bundles are deployment outputs. Editable React screens are under `solar_crm_frontend/src/`; the landing page is the separate `solar_landing_page/index.html`.
