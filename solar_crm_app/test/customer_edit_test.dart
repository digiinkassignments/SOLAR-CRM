import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:solar_crm_app/core/network/api_client.dart';
import 'package:solar_crm_app/models/customer_model.dart';
import 'package:solar_crm_app/providers/customer_provider.dart';
import 'package:solar_crm_app/views/admin/customers/edit_customer_sheet.dart';

class FakeCustomers extends CustomerProvider {
  FakeCustomers() : super(apiClient: ApiClient());
  @override
  Future<Customer360Detail?> fetchCustomerById(int id) async =>
      Customer360Detail.fromJson({
        'id': id,
        'customer_name': 'Current customer',
        'mobile_number': '9876543210',
        'solar_requirement': 'Residential',
        'status': 'Active',
        'opening_record': {
          'customer_id': id,
          'plant_size_kw': '5.45',
          'invoice_amount': '190000',
          'amount_paid': '136500',
          'payment_date': '2026-11-19',
          'payment_mode': 'Bank Transfer',
        },
      });
}

void main() {
  testWidgets(
    'mobile edit hydrates latest profile and opening payment fields',
    (tester) async {
      tester.view.physicalSize = const Size(390, 900);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);
      final provider = FakeCustomers();
      await tester.pumpWidget(
        ChangeNotifierProvider<CustomerProvider>.value(
          value: provider,
          child: MaterialApp(
            home: Scaffold(
              body: EditCustomerSheet(
                customer: CustomerModel(
                  id: 16,
                  customerCode: 'C1',
                  customerName: 'Stale',
                  mobileNumber: '9876543210',
                ),
              ),
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();
      expect(find.text('Current customer'), findsOneWidget);
      expect(find.text('190000.0'), findsOneWidget);
      expect(find.text('136500.0'), findsOneWidget);
      expect(find.text('2026-11-19'), findsOneWidget);
    },
  );
}
