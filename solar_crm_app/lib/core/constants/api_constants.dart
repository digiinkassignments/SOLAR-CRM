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

  // Auth endpoints
  static const String login = "/auth/login";
  static const String profile = "/auth/profile";
  static const String tenantInfo = "/auth/tenant-info";
  static const String forgotPassword = "/auth/forgot-password";
  static const String resetPassword = "/auth/reset-password";

  // Dashboard endpoints
  static const String adminDashboard = "/dashboard/admin";
  static const String managerDashboard = "/dashboard/manager";
  static const String salesDashboard = "/dashboard/sales";
  static const String engineerDashboard = "/dashboard/engineer";

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
}
