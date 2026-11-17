import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_typography.dart';
import '../../providers/auth_provider.dart';

class ForgotPasswordSheet extends StatefulWidget {
  final String? initialLogin;

  const ForgotPasswordSheet({super.key, this.initialLogin});

  @override
  State<ForgotPasswordSheet> createState() => _ForgotPasswordSheetState();
}

class _ForgotPasswordSheetState extends State<ForgotPasswordSheet> {
  int _currentStep = 1; // 1: Request OTP, 2: Enter OTP & New Password
  final _loginController = TextEditingController();
  final _otpController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  bool _isLoading = false;
  bool _obscurePassword = true;
  String? _statusMessage;
  bool _isSuccess = false;

  @override
  void initState() {
    super.initState();
    if (widget.initialLogin != null && widget.initialLogin!.isNotEmpty) {
      _loginController.text = widget.initialLogin!;
    }
  }

  void _handleSendOtp() async {
    final login = _loginController.text.trim();
    if (login.isEmpty) {
      setState(() {
        _statusMessage = "Please enter your Username, Email, or Phone.";
        _isSuccess = false;
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _statusMessage = null;
    });

    final auth = Provider.of<AuthProvider>(context, listen: false);
    final res = await auth.requestPasswordResetOtp(login);

    if (!mounted) return;
    setState(() {
      _isLoading = false;
      if (res['success'] == true) {
        _currentStep = 2;
        _isSuccess = true;
        _statusMessage = res['message'] ?? "OTP has been sent to your registered email.";
      } else {
        _isSuccess = false;
        _statusMessage = res['message'] ?? "Failed to send OTP.";
      }
    });
  }

  void _handleResetPassword() async {
    final login = _loginController.text.trim();
    final otp = _otpController.text.trim();
    final pass = _passwordController.text;
    final confirmPass = _confirmPasswordController.text;

    if (otp.isEmpty || pass.isEmpty || confirmPass.isEmpty) {
      setState(() {
        _statusMessage = "Please fill all fields.";
        _isSuccess = false;
      });
      return;
    }

    if (pass != confirmPass) {
      setState(() {
        _statusMessage = "Passwords do not match.";
        _isSuccess = false;
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _statusMessage = null;
    });

    final auth = Provider.of<AuthProvider>(context, listen: false);
    final res = await auth.confirmPasswordReset(
      loginIdentifier: login,
      otp: otp,
      newPassword: pass,
      confirmPassword: confirmPass,
    );

    if (!mounted) return;
    setState(() {
      _isLoading = false;
      if (res['success'] == true) {
        _isSuccess = true;
        _statusMessage = res['message'] ?? "Password reset successfully!";
        Future.delayed(const Duration(seconds: 2), () {
          if (mounted) Navigator.pop(context, true);
        });
      } else {
        _isSuccess = false;
        _statusMessage = res['message'] ?? "Reset failed.";
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryTextColor = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final secondaryTextColor = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;

    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
        left: 20,
        right: 20,
        top: 24,
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF333333) : const Color(0xFFD4D4D8),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 18),
            Row(
              children: [
                Icon(
                  _currentStep == 1 ? Icons.lock_reset_rounded : Icons.verified_user_rounded,
                  color: AppColors.brandPrimary,
                  size: 26,
                ),
                const SizedBox(width: 10),
                Text(
                  _currentStep == 1 ? "Reset Password" : "Enter Verification OTP",
                  style: AppTypography.headingMedium(color: primaryTextColor),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              _currentStep == 1
                  ? "Enter your account login identifier to receive a 6-digit verification code on your email."
                  : "Check your email for the 6-digit code and set your new account password.",
              style: AppTypography.bodySmall(color: secondaryTextColor),
            ),
            const SizedBox(height: 18),

            // Status Alert
            if (_statusMessage != null) ...[
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                decoration: BoxDecoration(
                  color: _isSuccess
                      ? AppColors.emeraldGreen.withValues(alpha: 0.12)
                      : AppColors.errorRed.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: _isSuccess ? AppColors.emeraldGreen : AppColors.errorRed,
                    width: 0.8,
                  ),
                ),
                child: Row(
                  children: [
                    Icon(
                      _isSuccess ? Icons.check_circle_outline : Icons.error_outline,
                      color: _isSuccess ? AppColors.emeraldGreen : AppColors.errorRed,
                      size: 18,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _statusMessage!,
                        style: AppTypography.bodySmall(
                          color: _isSuccess ? AppColors.emeraldGreen : AppColors.errorRed,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
            ],

            if (_currentStep == 1) ...[
              TextField(
                controller: _loginController,
                style: AppTypography.bodyMedium(color: primaryTextColor),
                decoration: const InputDecoration(
                  labelText: "Username, Email, or Phone",
                  prefixIcon: Icon(Icons.person_outline),
                ),
              ),
              const SizedBox(height: 20),
              ElevatedButton(
                onPressed: _isLoading ? null : _handleSendOtp,
                child: _isLoading
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : Text("Send Verification OTP", style: AppTypography.button()),
              ),
            ] else ...[
              // Step 2: OTP & New Password
              TextField(
                controller: _otpController,
                keyboardType: TextInputType.number,
                maxLength: 6,
                style: AppTypography.headingSmall(color: primaryTextColor),
                decoration: const InputDecoration(
                  labelText: "6-Digit OTP",
                  prefixIcon: Icon(Icons.pin_outlined),
                  counterText: "",
                ),
              ),
              const SizedBox(height: 14),
              TextField(
                controller: _passwordController,
                obscureText: _obscurePassword,
                style: AppTypography.bodyMedium(color: primaryTextColor),
                decoration: InputDecoration(
                  labelText: "New Password",
                  prefixIcon: const Icon(Icons.lock_outline),
                  suffixIcon: IconButton(
                    icon: Icon(_obscurePassword ? Icons.visibility_outlined : Icons.visibility_off_outlined),
                    onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                  ),
                ),
              ),
              const SizedBox(height: 14),
              TextField(
                controller: _confirmPasswordController,
                obscureText: _obscurePassword,
                style: AppTypography.bodyMedium(color: primaryTextColor),
                decoration: const InputDecoration(
                  labelText: "Confirm New Password",
                  prefixIcon: Icon(Icons.lock_clock_outlined),
                ),
              ),
              const SizedBox(height: 20),
              ElevatedButton(
                onPressed: _isLoading ? null : _handleResetPassword,
                child: _isLoading
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : Text("Set New Password & Return", style: AppTypography.button()),
              ),
              const SizedBox(height: 8),
              TextButton(
                onPressed: () => setState(() => _currentStep = 1),
                child: Text(
                  "Change Email / Resend OTP",
                  style: AppTypography.bodySmall(color: AppColors.brandPrimary),
                ),
              ),
            ],
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}
