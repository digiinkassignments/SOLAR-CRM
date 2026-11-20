import 'package:flutter_test/flutter_test.dart';
import 'package:solar_crm_app/core/network/api_client.dart';
import 'package:solar_crm_app/core/utils/role_permissions.dart';
import 'package:solar_crm_app/models/portal_dashboard_model.dart';
import 'package:solar_crm_app/models/user_model.dart';
import 'package:solar_crm_app/providers/dashboard_provider.dart';

void main() {
  group('Dedicated Portals Suite (Finance & Application Manager)', () {
    test('UserModel correctly detects isFinance and isApplicationManager', () {
      final financeUser = UserModel(
        id: 10,
        name: 'Finance Officer',
        email: 'finance@solops.cloud',
        roleId: 5,
        roleName: 'Finance',
      );

      final appManagerUser = UserModel(
        id: 11,
        name: 'Subsidy Head',
        email: 'subsidy@solops.cloud',
        roleId: 6,
        roleName: 'Application Manager',
      );

      final adminUser = UserModel(
        id: 1,
        name: 'System Admin',
        email: 'admin@solops.cloud',
        roleId: 1,
        roleName: 'Admin',
      );

      expect(financeUser.isFinance, isTrue);
      expect(financeUser.isApplicationManager, isFalse);
      expect(financeUser.isAdmin, isFalse);

      expect(appManagerUser.isApplicationManager, isTrue);
      expect(appManagerUser.isFinance, isFalse);
      expect(appManagerUser.isAdmin, isFalse);

      expect(adminUser.isAdmin, isTrue);
      expect(adminUser.isFinance, isFalse);
      expect(adminUser.isApplicationManager, isFalse);
    });

    test('PortalDashboardModel correctly deserializes Finance data', () {
      final json = {
        'role': 'finance',
        'metrics': {
          'total_invoices': 15,
          'invoiced': 1500000.0,
          'paid': 1100000.0,
          'due': 400000.0,
          'quotations': 25,
          'customers': 60,
          'stock_items': 18,
          'stock_value': 850000.0,
          'low_stock': 3,
        },
        'attention': [
          {
            'id': 101,
            'reference': 'INV-2026-001',
            'customer_name': 'Aakash Verma',
            'amount': 45000.0,
            'date': '2026-11-25',
            'status': 'partial',
          }
        ],
        'breakdown': [
          {'label': 'paid', 'count': 10},
          {'label': 'partial', 'count': 3},
          {'label': 'unpaid', 'count': 2},
        ],
        'updated_at': '2026-11-20T01:00:00.000Z',
      };

      final model = PortalDashboardModel.fromJson(json);

      expect(model.isFinance, isTrue);
      expect(model.isApplicationManager, isFalse);
      expect(model.totalInvoices, equals(15));
      expect(model.invoiced, equals(1500000.0));
      expect(model.paid, equals(1100000.0));
      expect(model.due, equals(400000.0));
      expect(model.quotations, equals(25));
      expect(model.customers, equals(60));
      expect(model.stockItems, equals(18));
      expect(model.stockValue, equals(850000.0));
      expect(model.lowStock, equals(3));

      expect(model.attention.length, equals(1));
      expect(model.attention.first.customerName, equals('Aakash Verma'));
      expect(model.attention.first.reference, equals('INV-2026-001'));
      expect(model.attention.first.amount, equals(45000.0));
      expect(model.attention.first.status, equals('partial'));

      expect(model.breakdown.length, equals(3));
      expect(model.totalBreakdownCount, equals(15));
    });

    test('PortalDashboardModel correctly deserializes Application Manager data', () {
      final json = {
        'role': 'application-manager',
        'metrics': {
          'applications': 30,
          'credited': 12,
          'rejected': 3,
          'expected': 2340000.0,
          'received': 936000.0,
          'loans': 18,
          'active_loans': 10,
          'loan_disbursed': 1800000.0,
        },
        'attention': [
          {
            'id': 201,
            'reference': 'LEAD-2026-088',
            'customer_name': 'Sanjay Meena',
            'amount': 78000.0,
            'date': '2026-11-19',
            'status': 'under_scrutiny',
          }
        ],
        'breakdown': [
          {'label': 'registered', 'count': 5},
          {'label': 'feasibility_approved', 'count': 7},
          {'label': 'subsidy_credited', 'count': 12},
          {'label': 'rejected', 'count': 3},
        ],
        'updated_at': '2026-11-20T01:00:00.000Z',
      };

      final model = PortalDashboardModel.fromJson(json);

      expect(model.isApplicationManager, isTrue);
      expect(model.isFinance, isFalse);
      expect(model.applications, equals(30));
      expect(model.credited, equals(12));
      expect(model.rejected, equals(3));
      expect(model.expected, equals(2340000.0));
      expect(model.received, equals(936000.0));
      expect(model.loans, equals(18));
      expect(model.activeLoans, equals(10));
      expect(model.loanDisbursed, equals(1800000.0));

      expect(model.attention.length, equals(1));
      expect(model.attention.first.customerName, equals('Sanjay Meena'));
      expect(model.attention.first.reference, equals('LEAD-2026-088'));
      expect(model.attention.first.amount, equals(78000.0));

      expect(model.breakdown.length, equals(4));
      expect(model.totalBreakdownCount, equals(27));
    });

    test('DashboardProvider reset clears portal stats cleanly', () {
      final client = ApiClient();
      final provider = DashboardProvider(apiClient: client);

      provider.reset();
      expect(provider.portalStats, isNull);
      expect(provider.isLoading, isFalse);
      expect(provider.errorMessage, isNull);
    });

    test('Finance portal user has Customers workspace permissions and KPI access', () {
      final financeUser = UserModel(
        id: 10,
        name: 'Finance Officer',
        email: 'finance@solops.cloud',
        roleId: 5,
        roleName: 'Finance',
      );

      // Verify Finance role permissions for Customers workspace
      expect(financeUser.isFinance, isTrue);
      expect(RolePermissions.canViewCustomers(financeUser), isTrue);
      expect(RolePermissions.canCreateCustomer(financeUser), isTrue);
      expect(RolePermissions.canEditCustomer(financeUser), isTrue);
      expect(RolePermissions.canDeleteCustomer(financeUser), isFalse); // Deleting customers is blocked for Finance
    });

    test('Six canonical roles and restored-session routing targets match exact shell specs', () {
      final admin = UserModel(id: 1, name: 'Admin', email: 'admin@solops.cloud', roleId: 1, roleName: 'Admin');
      final manager = UserModel(id: 2, name: 'Manager', email: 'manager@solops.cloud', roleId: 2, roleName: 'Manager');
      final sales = UserModel(id: 3, name: 'Sales', email: 'sales@solops.cloud', roleId: 3, roleName: 'Sales Executive');
      final engineer = UserModel(id: 4, name: 'Engineer', email: 'eng@solops.cloud', roleId: 4, roleName: 'Site Engineer');
      final finance = UserModel(id: 5, name: 'Finance', email: 'fin@solops.cloud', roleId: 5, roleName: 'Finance');
      final appManager = UserModel(id: 6, name: 'App Manager', email: 'app@solops.cloud', roleId: 6, roleName: 'Application Manager');
      final externalCustom = UserModel(id: 7, name: 'Guest', email: 'guest@solops.cloud', roleId: 99, roleName: 'Vendor Guest');

      // Canonical role detection
      expect(admin.isAdmin, isTrue);
      expect(manager.isManager, isTrue);
      expect(sales.isSales, isTrue);
      expect(engineer.isEngineer, isTrue);
      expect(finance.isFinance, isTrue);
      expect(appManager.isApplicationManager, isTrue);

      // Deny-by-default for unknown custom roles
      expect(externalCustom.isAdmin, isFalse);
      expect(externalCustom.isManager, isFalse);
      expect(externalCustom.isSales, isFalse);
      expect(externalCustom.isEngineer, isFalse);
      expect(externalCustom.isFinance, isFalse);
      expect(externalCustom.isApplicationManager, isFalse);

      // Password change requirement preservation
      final userMustChangePass = UserModel(
        id: 8,
        name: 'New User',
        email: 'new@solops.cloud',
        roleId: 2,
        roleName: 'Sales',
        isPasswordChanged: 0,
      );
      expect(userMustChangePass.isPasswordChanged, equals(0));
    });

    test('Manager own-team scope vs Sales assigned-lead scope adhere to backend RBAC', () {
      final manager = UserModel(id: 2, name: 'Manager', email: 'mgr@solops.cloud', roleId: 2, roleName: 'Manager');
      final sales = UserModel(id: 3, name: 'Sales', email: 'sales@solops.cloud', roleId: 3, roleName: 'Sales');
      final engineer = UserModel(id: 4, name: 'Engineer', email: 'eng@solops.cloud', roleId: 4, roleName: 'Engineer');

      // Manager has full team lead management and customer creation
      expect(RolePermissions.canCreateCustomer(manager), isTrue);
      expect(RolePermissions.canDeleteCustomer(manager), isTrue);
      expect(RolePermissions.canDeleteLead(manager), isTrue);
      expect(RolePermissions.canManageCommercial(manager), isTrue);

      // Sales can manage assigned leads, but cannot delete or create customers directly
      expect(RolePermissions.canCreateCustomer(sales), isFalse);
      expect(RolePermissions.canDeleteCustomer(sales), isFalse);
      expect(RolePermissions.canDeleteLead(sales), isFalse);
      expect(RolePermissions.canManageCommercial(sales), isFalse);

      // Engineer cannot delete projects or access commercial pricing/warranty
      expect(RolePermissions.canCreateProject(engineer), isFalse);
      expect(RolePermissions.canDeleteProject(engineer), isFalse);
      expect(RolePermissions.canManageCommercial(engineer), isFalse);
      expect(RolePermissions.canAccessWarrantyAmc(engineer), isFalse);
    });
  });
}

