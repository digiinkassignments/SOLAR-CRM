import 'dart:math';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_typography.dart';
import '../../../providers/user_provider.dart';

class CreateUserSheet extends StatefulWidget {
  const CreateUserSheet({super.key});

  @override
  State<CreateUserSheet> createState() => _CreateUserSheetState();
}

class _CreateUserSheetState extends State<CreateUserSheet> {
  final _formKey = GlobalKey<FormState>();

  final _fullNameController = TextEditingController();
  final _usernameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();

  int _selectedRoleId = 3; // Default: Sales Representative
  int? _selectedManagerId;
  bool _obscurePassword = true;
  bool _isLoading = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _generateRandomPassword();
  }

  void _generateRandomPassword() {
    const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789!@#";
    final rand = Random.secure();
    final pass = List.generate(10, (_) => chars[rand.nextInt(chars.length)]).join();
    _passwordController.text = pass;
  }

  void _autoGenerateUsername(String name) {
    if (name.trim().isEmpty) return;
    final clean = name.trim().toLowerCase().replaceAll(RegExp(r'[^a-z0-9]'), '.');
    final rand = Random().nextInt(900) + 100;
    _usernameController.text = "$clean$rand";
  }

  void _handleCreate() async {
    if (!_formKey.currentState!.validate()) return;

    if (_selectedRoleId == 3 && (_selectedManagerId == null || _selectedManagerId == 0)) {
      setState(() {
        _errorMessage = "Reporting Manager is required for Sales Representatives.";
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final provider = Provider.of<UserProvider>(context, listen: false);
    final res = await provider.createUser(
      fullName: _fullNameController.text,
      username: _usernameController.text,
      email: _emailController.text,
      phone: _phoneController.text,
      roleId: _selectedRoleId,
      managerId: _selectedManagerId,
      password: _passwordController.text,
    );

    if (!mounted) return;
    setState(() => _isLoading = false);

    if (res['success'] == true) {
      Navigator.pop(context, true);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(res['message'] ?? "Team member created successfully!"),
          backgroundColor: AppColors.emeraldGreen,
        ),
      );
    } else {
      setState(() {
        _errorMessage = res['message'] ?? "Failed to create user.";
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final userProvider = Provider.of<UserProvider>(context);
    final managers = userProvider.managers;
    final roles = userProvider.roles;

    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? AppColors.darkCard : AppColors.lightCard;
    final borderColor = isDark ? AppColors.darkBorder : AppColors.lightBorder;
    final textPrimary = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final textSecondary = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;
    final surfaceColor = isDark ? AppColors.darkSurface : AppColors.lightSurface;

    return Container(
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        border: Border(top: BorderSide(color: borderColor)),
      ),
      padding: EdgeInsets.only(
        top: 20,
        left: 20,
        right: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Drag handle
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: borderColor,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Title
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    "Add New Team Member",
                    style: AppTypography.heading(size: 20, color: textPrimary),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close_rounded, size: 20),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              Text(
                "Invite an employee to your solar CRM workspace.",
                style: AppTypography.caption(color: textSecondary),
              ),

              const SizedBox(height: 18),

              // Error Banner
              if (_errorMessage != null) ...[
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.errorRed.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: AppColors.errorRed.withValues(alpha: 0.3)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.error_outline_rounded, color: AppColors.errorRed, size: 18),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          _errorMessage!,
                          style: AppTypography.caption(color: AppColors.errorRed),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
              ],

              // Full Name
              Text("FULL NAME *", style: AppTypography.badge(color: textSecondary)),
              const SizedBox(height: 6),
              TextFormField(
                controller: _fullNameController,
                style: AppTypography.body(color: textPrimary),
                decoration: InputDecoration(
                  hintText: "e.g. Rahul Sharma",
                  prefixIcon: const Icon(Icons.person_outline_rounded, size: 20),
                ),
                onChanged: (val) {
                  if (_usernameController.text.isEmpty) {
                    _autoGenerateUsername(val);
                  }
                },
                validator: (val) => val == null || val.trim().isEmpty ? "Full name is required" : null,
              ),

              const SizedBox(height: 14),

              // Username + Auto button
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text("USERNAME *", style: AppTypography.badge(color: textSecondary)),
                  GestureDetector(
                    onTap: () => _autoGenerateUsername(_fullNameController.text),
                    child: Text(
                      "⚡ Auto Generate",
                      style: AppTypography.caption(color: AppColors.brandPrimary, fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              TextFormField(
                controller: _usernameController,
                style: AppTypography.body(color: textPrimary),
                decoration: InputDecoration(
                  hintText: "e.g. rahul.sharma101",
                  prefixIcon: const Icon(Icons.alternate_email_rounded, size: 20),
                ),
                validator: (val) => val == null || val.trim().isEmpty ? "Username is required" : null,
              ),

              const SizedBox(height: 14),

              // Email
              Text("EMAIL ADDRESS *", style: AppTypography.badge(color: textSecondary)),
              const SizedBox(height: 6),
              TextFormField(
                controller: _emailController,
                keyboardType: TextInputType.emailAddress,
                style: AppTypography.body(color: textPrimary),
                decoration: InputDecoration(
                  hintText: "rahul@digiinksolutions.com",
                  prefixIcon: const Icon(Icons.mail_outline_rounded, size: 20),
                ),
                validator: (val) {
                  if (val == null || val.trim().isEmpty) return "Email is required";
                  if (!val.contains("@") || !val.contains(".")) return "Enter a valid email address";
                  return null;
                },
              ),

              const SizedBox(height: 14),

              // Phone
              Text("PHONE NUMBER *", style: AppTypography.badge(color: textSecondary)),
              const SizedBox(height: 6),
              TextFormField(
                controller: _phoneController,
                keyboardType: TextInputType.phone,
                style: AppTypography.body(color: textPrimary),
                decoration: InputDecoration(
                  hintText: "9876543210",
                  prefixIcon: const Icon(Icons.phone_outlined, size: 20),
                ),
                validator: (val) {
                  if (val == null || val.trim().isEmpty) return "Phone number is required";
                  if (val.trim().length < 10) return "Enter valid 10-digit mobile number";
                  return null;
                },
              ),

              const SizedBox(height: 16),

              // Role Selection
              Text("ROLE *", style: AppTypography.badge(color: textSecondary)),
              const SizedBox(height: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                decoration: BoxDecoration(
                  color: surfaceColor,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: borderColor),
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<int>(
                    value: _selectedRoleId,
                    isExpanded: true,
                    dropdownColor: cardBg,
                    items: roles.map((r) {
                      return DropdownMenuItem<int>(
                        value: r.id,
                        child: Text(
                          r.roleName,
                          style: AppTypography.body(color: textPrimary, fontWeight: FontWeight.w500),
                        ),
                      );
                    }).toList(),
                    onChanged: (val) {
                      if (val != null) {
                        setState(() {
                          _selectedRoleId = val;
                          if (val != 3) _selectedManagerId = null;
                        });
                      }
                    },
                  ),
                ),
              ),

              // Reporting Manager (Only when Role is Sales Representative: ID 3)
              if (_selectedRoleId == 3) ...[
                const SizedBox(height: 14),
                Text("REPORTING MANAGER *", style: AppTypography.badge(color: AppColors.brandPrimary)),
                const SizedBox(height: 6),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  decoration: BoxDecoration(
                    color: surfaceColor,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: borderColor),
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<int>(
                      value: _selectedManagerId,
                      hint: Text(
                        managers.isEmpty ? "No managers found (Create a Manager first)" : "Select Manager",
                        style: AppTypography.caption(color: textSecondary),
                      ),
                      isExpanded: true,
                      dropdownColor: cardBg,
                      items: managers.map((m) {
                        return DropdownMenuItem<int>(
                          value: m.id,
                          child: Text(
                            "${m.fullName} (@${m.username})",
                            style: AppTypography.body(color: textPrimary),
                          ),
                        );
                      }).toList(),
                      onChanged: (val) {
                        setState(() => _selectedManagerId = val);
                      },
                    ),
                  ),
                ),
              ],

              const SizedBox(height: 14),

              // Password
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text("TEMPORARY PASSWORD *", style: AppTypography.badge(color: textSecondary)),
                  GestureDetector(
                    onTap: _generateRandomPassword,
                    child: Text(
                      "🎲 New Password",
                      style: AppTypography.caption(color: AppColors.brandPrimary, fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              TextFormField(
                controller: _passwordController,
                obscureText: _obscurePassword,
                style: AppTypography.body(color: textPrimary),
                decoration: InputDecoration(
                  hintText: "Password",
                  prefixIcon: const Icon(Icons.lock_outline_rounded, size: 20),
                  suffixIcon: IconButton(
                    icon: Icon(
                      _obscurePassword ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                      size: 20,
                    ),
                    onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                  ),
                ),
                validator: (val) => val == null || val.length < 6 ? "Minimum 6 characters required" : null,
              ),

              const SizedBox(height: 12),

              // Notice
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: surfaceColor,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: borderColor),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.mark_email_read_outlined, size: 18, color: AppColors.brandPrimary),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        "An automated welcome email with login credentials will be sent to the user upon creation.",
                        style: AppTypography.caption(color: textSecondary),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 20),

              // Submit Button
              ElevatedButton(
                onPressed: _isLoading ? null : _handleCreate,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.brandPrimary,
                  foregroundColor: Colors.black,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: _isLoading
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black),
                      )
                    : Text(
                        "Create Account & Send Invite",
                        style: AppTypography.button(color: Colors.black),
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

