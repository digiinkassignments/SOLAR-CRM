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
  String? _networkError;

  @override
  void initState() {
    super.initState();
    _checkNavigation();
  }

  Future<void> _checkNavigation() async {
    setState(() {
      _networkError = null;
    });

    await Future.delayed(const Duration(milliseconds: 1000));
    if (!mounted) return;

    final auth = Provider.of<AuthProvider>(context, listen: false);

    if (auth.workspace == null || auth.workspace!.isEmpty) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => const WorkspaceScreen()),
      );
      return;
    }

    if (!auth.isAuthenticated || auth.token == null) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => const LoginScreen()),
      );
      return;
    }

    // Live session verification with backend database
    final result = await auth.verifySession();
    if (!mounted) return;

    if (result.status == SessionStatus.expired) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => const LoginScreen()),
      );
      return;
    }

    if (result.status == SessionStatus.networkError) {
      setState(() {
        _networkError = result.message ?? "Unable to connect to server. Check your connection.";
      });
      return;
    }

    // Role-based deny-by-default routing & initial password change enforcement
    final user = result.user ?? auth.user!;
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
            const SizedBox(height: 32),
            if (_networkError != null) ...[
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 32),
                child: Column(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppColors.errorRed.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.errorRed.withValues(alpha: 0.3)),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.wifi_off_rounded, color: AppColors.errorRed, size: 20),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              _networkError!,
                              style: const TextStyle(fontSize: 12, color: AppColors.errorRed),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      height: 44,
                      child: ElevatedButton.icon(
                        onPressed: _checkNavigation,
                        icon: const Icon(Icons.refresh_rounded, size: 18),
                        label: const Text("Retry Connection", style: TextStyle(fontWeight: FontWeight.w700)),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.brandPrimary,
                          foregroundColor: Colors.black,
                          elevation: 0,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                      ),
                    ),
                    const SizedBox(height: 10),
                    TextButton(
                      onPressed: () async {
                        final auth = Provider.of<AuthProvider>(context, listen: false);
                        await auth.logout();
                        if (context.mounted) {
                          Navigator.pushReplacement(
                            context,
                            MaterialPageRoute(builder: (_) => const LoginScreen()),
                          );
                        }
                      },
                      child: Text(
                        "Sign Out to Login Screen",
                        style: TextStyle(
                          color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                          fontSize: 13,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ] else ...[
              const SizedBox(
                width: 28,
                height: 28,
                child: CircularProgressIndicator(
                  strokeWidth: 2.5,
                  valueColor: AlwaysStoppedAnimation<Color>(AppColors.brandPrimary),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
