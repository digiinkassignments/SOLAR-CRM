import '../../models/user_model.dart';

/// Central permission helper aligning mobile UI actions with backend RBAC middleware:
/// - middleware/managerContext.js
/// - middleware/engineerContext.js
/// - middleware/portalContext.js
/// - routes/customerRoutes.js
/// - routes/warrantyRoutes.js
/// - routes/projectRoutes.js
/// - routes/leadRoutes.js
/// - services/portalRoles.js
class RolePermissions {
  // ==========================================
  // CUSTOMERS (routes/customerRoutes.js)
  // - View: Admin (1), Manager (2), Sales (3), Finance
  // - Create / Update: Admin (1), Manager (2), Finance
  // - Delete: Admin (1), Manager (2)
  // ==========================================
  static bool canViewCustomers(UserModel? user) {
    if (user == null) return false;
    return user.isAdmin || user.isManager || user.isSales || user.isFinance;
  }

  static bool canCreateCustomer(UserModel? user) {
    if (user == null) return false;
    return user.isAdmin || user.isManager || user.isFinance;
  }

  static bool canEditCustomer(UserModel? user) {
    if (user == null) return false;
    return user.isAdmin || user.isManager || user.isFinance;
  }

  static bool canDeleteCustomer(UserModel? user) {
    if (user == null) return false;
    return user.isAdmin || user.isManager;
  }

  // ==========================================
  // PROJECTS (routes/projectRoutes.js & engineerContext.js)
  // - View: Admin (1), Manager (2), Engineer (4) [assigned]
  // - Create: Admin (1), Manager (2) [Engineer explicitly blocked with 403]
  // - Stage / Edit: Admin (1), Manager (2), Engineer (4)
  // - Delete: Admin (1), Manager (2) [Engineer explicitly blocked with 403]
  // ==========================================
  static bool canCreateProject(UserModel? user) {
    if (user == null) return false;
    return user.isAdmin || user.isManager;
  }

  static bool canDeleteProject(UserModel? user) {
    if (user == null) return false;
    return user.isAdmin || user.isManager;
  }

  // ==========================================
  // COMMERCIAL & WARRANTY (warrantyRoutes.js & engineerContext.js)
  // - Warranty & AMC: Only Admin (1) and Manager (2)
  // - Commercial Payments & Terms: Only Admin (1) and Manager (2)
  // - Engineers get 403 on commercial/warranty endpoints
  // ==========================================
  static bool canAccessWarrantyAmc(UserModel? user) {
    if (user == null) return false;
    return user.isAdmin || user.isManager;
  }

  static bool canManageCommercial(UserModel? user) {
    if (user == null) return false;
    return user.isAdmin || user.isManager;
  }

  // ==========================================
  // LEADS (routes/leadRoutes.js)
  // - View: Admin, Manager, Sales
  // - Create: Admin, Manager, Sales
  // - Assign / Reassign: Admin, Manager
  // - Delete: Admin, Manager [Sales cannot delete leads]
  // ==========================================
  static bool canDeleteLead(UserModel? user) {
    if (user == null) return false;
    return user.isAdmin || user.isManager;
  }

  static bool canAssignLead(UserModel? user) {
    if (user == null) return false;
    return user.isAdmin || user.isManager;
  }
}
