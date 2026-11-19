import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:solar_crm_app/core/network/api_client.dart';
import 'package:solar_crm_app/main.dart';
import 'package:solar_crm_app/providers/auth_provider.dart';

void main() {
  testWidgets('App smoke test', (WidgetTester tester) async {
    final apiClient = ApiClient();
    final authProvider = AuthProvider(apiClient: apiClient);

    await tester.pumpWidget(
      MultiProvider(
        providers: [
          ChangeNotifierProvider<AuthProvider>.value(value: authProvider),
        ],
        child: const SolarCrmApp(),
      ),
    );

    // Verify splash initial state
    expect(find.text('Solar CRM'), findsWidgets);

    // Advance the 1.2s timer in splash screen and settle navigation
    await tester.pump(const Duration(milliseconds: 1500));
    await tester.pumpAndSettle();
  });
}
