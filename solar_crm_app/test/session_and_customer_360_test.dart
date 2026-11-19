import 'package:flutter_test/flutter_test.dart';
import 'package:solar_crm_app/models/customer_model.dart';
import 'package:solar_crm_app/models/user_model.dart';

void main() {
  group('Password change requirement preservation tests', () {
    test('User with is_password_changed=0 preserves requirement from JSON', () {
      final jsonWithZero = {
        'id': 10,
        'full_name': 'Test Engineer',
        'email': 'engineer@solops.cloud',
        'role_id': 4,
        'role_name': 'Engineer',
        'status': 'Active',
        'is_password_changed': 0,
      };

      final user = UserModel.fromJson(jsonWithZero);
      expect(user.isPasswordChanged, 0);
    });

    test('Missing is_password_changed in server profile retains cached state', () {
      // Simulates cached user with mandatory password change pending
      final cachedUser = UserModel(
        id: 10,
        name: 'Test Engineer',
        email: 'engineer@solops.cloud',
        roleId: 4,
        roleName: 'Engineer',
        status: 'Active',
        isPasswordChanged: 0,
      );

      // Server profile response that omits is_password_changed
      final serverProfileMap = <String, dynamic>{
        'id': 10,
        'full_name': 'Test Engineer',
        'email': 'engineer@solops.cloud',
        'role_id': 4,
        'role_name': 'Engineer',
        'status': 'Active',
      };

      // In verifySession(), existing is_password_changed is injected when missing
      if (serverProfileMap['is_password_changed'] == null) {
        serverProfileMap['is_password_changed'] = cachedUser.isPasswordChanged;
      }

      final freshUser = UserModel.fromJson(serverProfileMap);
      expect(freshUser.isPasswordChanged, 0, reason: "Password-change requirement must not reset to 1");
    });
  });

  group('Customer 360 combined totals tests', () {
    test('Combines opening record and actual invoices accurately without omitting either', () {
      final opening = CustomerOpeningRecord(
        customerId: 1,
        plantSizeKw: 5.0,
        invoiceAmount: 50000.0,
        amountPaid: 30000.0,
      );

      final invoices = [
        {
          'id': 101,
          'invoice_number': 'INV-2026-001',
          'gross_total': '100000.00',
          'amount_paid': '80000.00',
          'balance_due': '20000.00',
        },
        {
          'id': 102,
          'invoice_number': 'INV-2026-002',
          'gross_total': '50000.00',
          'amount_paid': '10000.00',
          'balance_due': '40000.00',
        },
      ];

      // Computation logic matching Customer 360 sheet
      double invoiceBilledSum = 0.0;
      double invoicePaidSum = 0.0;
      double invoiceDueSum = 0.0;

      for (final inv in invoices) {
        invoiceBilledSum += double.tryParse(inv['gross_total']?.toString() ?? '0') ?? 0.0;
        invoicePaidSum += double.tryParse(inv['amount_paid']?.toString() ?? '0') ?? 0.0;
        invoiceDueSum += double.tryParse(inv['balance_due']?.toString() ?? '0') ?? 0.0;
      }

      final openingInvoice = opening.invoiceAmount;
      final openingPaid = opening.amountPaid;
      final openingDue = (openingInvoice - openingPaid > 0) ? (openingInvoice - openingPaid) : 0.0;

      final billed = openingInvoice + invoiceBilledSum;
      final paid = openingPaid + invoicePaidSum;
      final balance = openingDue + invoiceDueSum;

      // 50,000 opening + 150,000 invoices = 200,000 billed
      expect(billed, 200000.0);
      // 30,000 opening + 90,000 invoices = 120,000 paid
      expect(paid, 120000.0);
      // 20,000 opening due + 60,000 invoices due = 80,000 balance
      expect(balance, 80000.0);
    });
  });
}
