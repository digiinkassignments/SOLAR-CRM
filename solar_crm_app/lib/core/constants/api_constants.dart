class ApiConstants {
  // Domain base
  static const String baseDomain = "solops.cloud";
  
  // Format dynamic workspace URL
  // e.g. "digiinksolutions" -> "https://digiinksolutions.solops.cloud/api"
  // e.g. "amprisiaenergies" -> "https://amprisiaenergies.solops.cloud/api"
  static String getBaseUrl(String workspace) {
    final cleanWorkspace = workspace.trim().toLowerCase();
    return "https://$cleanWorkspace.$baseDomain/api";
  }

  // Dynamic web origin (e.g. "https://digiinksolutions.solops.cloud")
  static String getWebOrigin(String? workspace) {
    final cleanWorkspace = (workspace ?? '').trim().toLowerCase();
    if (cleanWorkspace.isEmpty) return "https://$baseDomain";
    return "https://$cleanWorkspace.$baseDomain";
  }

  // Customer Review Link: https://<workspace>.solops.cloud/review/<tokenOrId>
  static String getReviewUrl(String? workspace, String tokenOrId) {
    final origin = getWebOrigin(workspace);
    return "$origin/review/$tokenOrId";
  }

  // Public/Web Invoice Link: https://<workspace>.solops.cloud/invoices/<id>/pdf
  static String getInvoicePdfUrl(String? workspace, int invoiceId) {
    final origin = getWebOrigin(workspace);
    return "$origin/invoices/$invoiceId/pdf";
  }

  // Public/Web Quotation Link: https://<workspace>.solops.cloud/quotations/<id>/pdf
  static String getQuotationPdfUrl(String? workspace, int quotationId) {
    final origin = getWebOrigin(workspace);
    return "$origin/quotations/$quotationId/pdf";
  }

  // Auth endpoints
  static const String login = "/auth/login";
  static const String profile = "/auth/profile";
  static const String tenantInfo = "/auth/tenant-info";
  static const String forgotPassword = "/auth/forgot-password";
  static const String resetPassword = "/auth/reset-password";

  // Profile & Settings endpoints (Matching https://digiinksolutions.solops.cloud/profile & /settings)
  static const String userProfile = "/profile";
  static const String changePassword = "/profile/change-password";
  static const String profilePhoto = "/profile/photo";
  static const String companySettings = "/settings";
  static const String companyLogo = "/settings/logo";

  // Dashboard endpoints
  static const String adminDashboard = "/dashboard/admin";
  static const String managerDashboard = "/dashboard/manager";
  static const String salesDashboard = "/dashboard/sales";
  static const String engineerDashboard = "/dashboard/engineer";
  static const String portalDashboard = "/portals/dashboard";

  // Users & Roles
  static const String users = "/users";
  static const String userStatus = "/users/status";
  static const String roles = "/roles";

  // Customers
  static const String customers = "/customers";

  // Leads endpoints
  static const String leads = "/leads";
  static const String followups = "/leads/followups";
  static const String followupStats = "/leads/followups/stats";
  static const String followupsCalendar = "/leads/followups/calendar";
  static const String logCall = "/leads/log-call";
  static const String aiCopilot = "/ai/lead-copilot";

  // Calculator
  static const String calculateSolar = "/calculator/calculate";
  static const String saveCalculation = "/calculator/save";
  static const String calculations = "/calculator";

  // Field Surveys & Work
  static const String surveys = "/surveys";
  static const String scheduleSurvey = "/surveys/schedule";
  static const String fieldWorkSurveyEntries = "/field-work/resources/survey";
  static const String fieldWorkFiles = "/field-work/entries";
  static const String fieldWorkSubmit = "/field-work/entries";
  static const String fieldWorkReview = "/field-work/entries";

  // Projects
  static const String projects = "/projects";
  static const String projectStats = "/projects/stats";
  static String projectDetails(dynamic id) => "/projects/$id";
  static String projectUpdateStage(dynamic id) => "/projects/$id/stage";
  static String projectInspection(dynamic id) => "/projects/$id/inspection";
  static const String projectCompletedSurveys = "/projects/completed-surveys";

  // Quotations & Invoices (Finance)
  static const String quotations = "/quotations";
  static String quotationDetails(int id) => "/quotations/$id";
  static String quotationStatus(int id) => "/quotations/$id/status";
  static String quotationDuplicate(int id) => "/quotations/$id/duplicate";
  static String quotationSendEmail(int id) => "/quotations/$id/send-email";
  static String quotationDelete(int id) => "/quotations/$id";

  static const String invoices = "/invoices";
  static String invoiceDetails(int id) => "/invoices/$id";
  static String invoicePayments(int id) => "/invoices/$id/payments";
  static String invoiceSendEmail(int id) => "/invoices/$id/send-email";
  static String invoiceDelete(int id) => "/invoices/$id";

  // Stock & Inventory
  static const String stockCategories = "/stock/categories";
  static const String stockItems = "/stock/items";
  static String stockItemDetails(int id) => "/stock/items/$id";
  static const String stockTransactions = "/stock/transactions";
  static const String stockAlerts = "/stock/alerts";
  static String resolveStockAlert(int id) => "/stock/alerts/$id/resolve";
  static const String stockReport = "/stock/report";
  static String stockItemByBarcode(String code) => "/stock/items/barcode/${Uri.encodeComponent(code)}";
  static const String stockQuickScanIn = "/stock/quick-scan-in";

  // Subsidies & PM Surya Ghar Hub (Matching backend /api/subsidy/*)
  static const String subsidiesList = "/subsidy/list";
  static const String applySubsidy = "/subsidy/apply";
  static String subsidyByLead(int leadId) => "/subsidy/$leadId";
  static const String subsidyUploadDoc = "/subsidy/upload-doc";
  static String subsidyVerifyDoc(int docId) => "/subsidy/verify-doc/$docId";
  static const String subsidyReject = "/subsidy/reject";
  static String subsidyResolveFix(int id) => "/subsidy/resolve-fix/$id";

  // Installation Progress & Daily Site Logs
  static String projectInstallationLogs(dynamic id) => "/projects/$id/installation-logs";
  static String projectInstallationLogDetail(dynamic id, dynamic logId) => "/projects/$id/installation-logs/$logId";
  static String projectInstallationLogPhotos(dynamic id, dynamic logId) => "/projects/$id/installation-logs/$logId/photos";

  // Project Commissioning & Functional Testing
  static String projectCommissioning(dynamic id) => "/projects/$id/commissioning";

  // Project Final QA & Pre-Handover Inspection
  static String projectFinalInspection(dynamic id) => "/projects/$id/final-inspection";

  // Project Customer Handover & Warranty Activation
  static String projectHandover(dynamic id) => "/projects/$id/handover";

  // Project Warranty & AMC Lifecycle
  static String projectWarranty(dynamic id) => "/projects/$id/warranty";
  static String projectWarrantyVisits(dynamic id) => "/projects/$id/warranty/visits";
  static String projectWarrantyVisitDetail(dynamic id, dynamic visitId) => "/projects/$id/warranty/visits/$visitId";
  static const String amcPlans = "/amc-plans";

  // Solar Loans & Financing Hub
  static const String loans = "/loans";
  static const String loanStats = "/loans/stats";
  static String loanDetails(int id) => "/loans/$id";
  static String loanByLead(int leadId) => "/loans/lead/$leadId";
  static String loanUploadDoc(int id) => "/loans/$id/upload-doc";
}
