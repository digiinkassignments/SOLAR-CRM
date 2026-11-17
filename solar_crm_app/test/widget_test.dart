import 'package:flutter_test/flutter_test.dart';
import 'package:solar_crm_app/main.dart';

void main() {
  testWidgets('App smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const SolarCrmApp());
    expect(find.text('Solar CRM'), findsWidgets);
  });
}
