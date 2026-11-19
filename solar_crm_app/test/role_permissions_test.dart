import 'package:flutter_test/flutter_test.dart';
import 'package:solar_crm_app/core/utils/role_permissions.dart';
import 'package:solar_crm_app/models/user_model.dart';

void main() {
  group('Role-wise Permissions & Canonical RBAC Alignment Suite', () {
    final admin = UserModel(id: 1, name: 'Admin User', email: 'admin@solops.cloud', roleId: 1, roleName: 'Admin');
    final manager = UserModel(id: 2, name: 'Manager User', email: 'mgr@solops.cloud', roleId: 2, roleName: 'Manager');
    final sales = UserModel(id: 3, name: 'Sales Executive', email: 'sales@solops.cloud', roleId: 3, roleName: 'Sales');
    final engineer = UserModel(id: 4, name: 'Site Engineer', email: 'eng@solops.cloud', roleId: 4, roleName: 'Site Engineer');
    final finance = UserModel(id: 5, name: 'Finance User', email: 'fin@solops.cloud', roleId: 5, roleName: 'Finance');
    final appManager = UserModel(id: 6, name: 'App Manager', email: 'app@solops.cloud', roleId: 6, roleName: 'Application Manager');

    // Custom roles that contain substrings but are NOT canonical portal roles
    final appDeveloper = UserModel(id: 7, name: 'Dev', email: 'dev@solops.cloud', roleId: 7, roleName: 'Application Developer');
    final financeAuditor = UserModel(id: 8, name: 'Auditor', email: 'auditor@solops.cloud', roleId: 8, roleName: 'External Finance Auditor');
    final subsidyAnalyst = UserModel(id: 9, name: 'Analyst', email: 'analyst@solops.cloud', roleId: 9, roleName: 'Subsidy Analyst');

    test('Sales role permissions match customerRoutes.js & leadRoutes.js', () {
      // Sales CAN view customers
      expect(RolePermissions.canViewCustomers(sales), isTrue);

      // Sales CANNOT create, edit, or delete customers
      expect(RolePermissions.canCreateCustomer(sales), isFalse);
      expect(RolePermissions.canEditCustomer(sales), isFalse);
      expect(RolePermissions.canDeleteCustomer(sales), isFalse);

      // Sales CANNOT create or delete projects
      expect(RolePermissions.canCreateProject(sales), isFalse);
      expect(RolePermissions.canDeleteProject(sales), isFalse);

      // Sales CANNOT delete leads
      expect(RolePermissions.canDeleteLead(sales), isFalse);

      // Sales CANNOT access warranty/amc or commercial terms
      expect(RolePermissions.canAccessWarrantyAmc(sales), isFalse);
      expect(RolePermissions.canManageCommercial(sales), isFalse);
    });

    test('Site Engineer role permissions match engineerContext.js & projectRoutes.js', () {
      // Engineer CANNOT create or delete projects (blocked in engineerContext.js lines 40-52)
      expect(RolePermissions.canCreateProject(engineer), isFalse);
      expect(RolePermissions.canDeleteProject(engineer), isFalse);

      // Engineer CANNOT access commercial warranty/amc (blocked with 403 in engineerContext.js lines 79-82)
      expect(RolePermissions.canAccessWarrantyAmc(engineer), isFalse);
      expect(RolePermissions.canManageCommercial(engineer), isFalse);

      // Engineer CANNOT create, edit or delete customers
      expect(RolePermissions.canCreateCustomer(engineer), isFalse);
      expect(RolePermissions.canEditCustomer(engineer), isFalse);
      expect(RolePermissions.canDeleteCustomer(engineer), isFalse);
    });

    test('Manager & Admin have proper managerial operations access', () {
      // Manager customer actions
      expect(RolePermissions.canViewCustomers(manager), isTrue);
      expect(RolePermissions.canCreateCustomer(manager), isTrue);
      expect(RolePermissions.canEditCustomer(manager), isTrue);
      expect(RolePermissions.canDeleteCustomer(manager), isTrue);

      // Manager project actions
      expect(RolePermissions.canCreateProject(manager), isTrue);
      expect(RolePermissions.canDeleteProject(manager), isTrue);
      expect(RolePermissions.canAccessWarrantyAmc(manager), isTrue);
      expect(RolePermissions.canManageCommercial(manager), isTrue);

      // Manager lead actions
      expect(RolePermissions.canDeleteLead(manager), isTrue);
      expect(RolePermissions.canAssignLead(manager), isTrue);

      // Admin full actions
      expect(RolePermissions.canCreateCustomer(admin), isTrue);
      expect(RolePermissions.canDeleteCustomer(admin), isTrue);
      expect(RolePermissions.canCreateProject(admin), isTrue);
      expect(RolePermissions.canDeleteProject(admin), isTrue);
      expect(RolePermissions.canAccessWarrantyAmc(admin), isTrue);
      expect(RolePermissions.canDeleteLead(admin), isTrue);
    });

    test('Finance role permissions match portalRoles.js', () {
      expect(RolePermissions.canViewCustomers(finance), isTrue);
      expect(RolePermissions.canCreateCustomer(finance), isTrue);
      expect(RolePermissions.canEditCustomer(finance), isTrue);
      expect(RolePermissions.canDeleteCustomer(finance), isFalse); // Deleting customers is restricted
    });

    test('Canonical portal role matching prevents broad substring matching leak', () {
      // Canonical roles pass
      expect(finance.isFinance, isTrue);
      expect(finance.isApplicationManager, isFalse);

      expect(appManager.isApplicationManager, isTrue);
      expect(appManager.isFinance, isFalse);

      // Non-canonical roles with substring match must NOT be recognized as portal roles
      expect(appDeveloper.isApplicationManager, isFalse);
      expect(appDeveloper.isFinance, isFalse);

      expect(financeAuditor.isFinance, isFalse);
      expect(financeAuditor.isApplicationManager, isFalse);

      expect(subsidyAnalyst.isApplicationManager, isFalse);
      expect(subsidyAnalyst.isFinance, isFalse);
    });
  });
}
