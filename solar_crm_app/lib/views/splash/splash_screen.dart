import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_typography.dart';
import '../../providers/auth_provider.dart';
import '../auth/workspace_screen.dart';
import '../auth/login_screen.dart';
import '../auth/access_denied_screen.dart';
import '../auth/force_change_password_view.dart';
import '../sales/sales_shell.dart';
import '../engineer/engineer_shell.dart';
import '../manager/manager_shell.dart';
import '../admin/admin_shell.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _checkNavigation();
  }

  Future<void> _checkNavigation() async {
    await Future.delayed(const Duration(milliseconds: 1200));
    if (!mounted) return;

    final auth = Provider.of<AuthProvider>(context, listen: false);

    if (auth.workspace == null || auth.workspace!.isEmpty) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => const WorkspaceScreen()),
      );
      return;
    }

    if (!auth.isAuthenticated || auth.user == null) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => const LoginScreen()),
      );
      return;
    }

    // Role-based deny-by-default routing & initial password change enforcement
    final user = auth.user!;
    if (user.isPasswordChanged == 0) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => const ForceChangePasswordView()),
      );
      return;
    }

    Widget destination;
    if (user.isAdmin) {
      destination = const AdminShell();
    } else if (user.isManager) {
      destination = const ManagerShell();
    } else if (user.isSales) {
      destination = const SalesShell();
    } else if (user.isEngineer) {
      destination = const EngineerShell();
    } else {
      destination = const AccessDeniedScreen();
    }

    Navigator.pushReplacement(
      context,
      MaterialPageRoute(builder: (_) => destination),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryTextColor = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final bgColor = isDark ? AppColors.darkBackground : AppColors.lightBackground;

    return Scaffold(
      backgroundColor: bgColor,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 90,
              height: 90,
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF161616) : Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
                ),
                boxShadow: [
                  BoxShadow(
                    color: isDark ? Colors.black.withValues(alpha: 0.5) : Colors.black.withValues(alpha: 0.06),
                    blurRadius: 24,
                    spreadRadius: 4,
                  ),
                ],
              ),
              padding: const EdgeInsets.all(12),
              child: Image.asset(
                'assets/images/logo.png',
                fit: BoxFit.contain,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              "Solar CRM",
              style: AppTypography.headingLarge(color: primaryTextColor),
            ),
            const SizedBox(height: 4),
            Text(
              "ENTERPRISE MOBILE SUITE",
              style: AppTypography.badge(color: AppColors.brandPrimary),
            ),
            const SizedBox(height: 40),
            const SizedBox(
              width: 28,
              height: 28,
              child: CircularProgressIndicator(
                strokeWidth: 2.5,
                valueColor: AlwaysStoppedAnimation<Color>(AppColors.brandPrimary),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
