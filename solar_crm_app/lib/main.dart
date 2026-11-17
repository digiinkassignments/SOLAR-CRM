import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'core/theme/app_theme.dart';
import 'core/network/api_client.dart';
import 'providers/auth_provider.dart';
import 'providers/dashboard_provider.dart';
import 'providers/user_provider.dart';
import 'providers/customer_provider.dart';
import 'providers/lead_provider.dart';
import 'providers/calculator_provider.dart';
import 'providers/finance_provider.dart';
import 'providers/stock_provider.dart';
import 'views/splash/splash_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // System UI overlay adapts to system brightness
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      systemNavigationBarColor: Colors.transparent,
    ),
  );

  final apiClient = ApiClient();
  final authProvider = AuthProvider(apiClient: apiClient);
  await authProvider.init();

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider<AuthProvider>.value(value: authProvider),
        ChangeNotifierProvider<DashboardProvider>(
          create: (_) => DashboardProvider(apiClient: apiClient),
        ),
        ChangeNotifierProvider<UserProvider>(
          create: (_) => UserProvider(apiClient: apiClient),
        ),
        ChangeNotifierProvider<CustomerProvider>(
          create: (_) => CustomerProvider(apiClient: apiClient),
        ),
        ChangeNotifierProvider<LeadProvider>(
          create: (_) => LeadProvider(apiClient: apiClient),
        ),
        ChangeNotifierProvider<CalculatorProvider>(
          create: (_) => CalculatorProvider(apiClient: apiClient),
        ),
        ChangeNotifierProvider<FinanceProvider>(
          create: (_) => FinanceProvider(apiClient: apiClient),
        ),
        ChangeNotifierProvider<StockProvider>(
          create: (_) => StockProvider(apiClient: apiClient),
        ),
      ],
      child: const SolarCrmApp(),
    ),
  );
}

class SolarCrmApp extends StatelessWidget {
  const SolarCrmApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Solar CRM',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,       // Pure White Light Mode
      darkTheme: AppTheme.darkTheme,     // Pure Black Dark Mode
      themeMode: ThemeMode.system,      // Dynamically adapts with System Theme!
      home: const SplashScreen(),
    );
  }
}
