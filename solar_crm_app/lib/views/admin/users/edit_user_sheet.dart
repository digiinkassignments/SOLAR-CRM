import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_typography.dart';
import '../../../models/team_user_model.dart';
import '../../../providers/user_provider.dart';

class EditUserSheet extends StatefulWidget {
  final TeamUserModel user;

  const EditUserSheet({super.key, required this.user});

  @override
  State<EditUserSheet> createState() => _EditUserSheetState();
}

class _EditUserSheetState extends State<EditUserSheet> {
  final _formKey = GlobalKey<FormState>();

  late final TextEditingController _fullNameController;
  late final TextEditingController _usernameController;
  late final TextEditingController _emailController;
  late final TextEditingController _phoneController;

  late int _selectedRoleId;
  int? _selectedManagerId;
  bool _isLoading = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _fullNameController = TextEditingController(text: widget.user.fullName);
    _usernameController = TextEditingController(text: widget.user.username);
    _emailController = TextEditingController(text: widget.user.email);
    _phoneController = TextEditingController(text: widget.user.phone);
    _selectedRoleId = widget.user.roleId;
    _selectedManagerId = widget.user.managerId;
  }

  void _handleUpdate() async {
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
    final res = await provider.updateUser(
      id: widget.user.id,
      fullName: _fullNameController.text,
      username: _usernameController.text,
      email: _emailController.text,
      phone: _phoneController.text,
      roleId: _selectedRoleId,
      managerId: _selectedManagerId,
    );

    if (!mounted) return;
    setState(() => _isLoading = false);

    if (res['success'] == true) {
      Navigator.pop(context, true);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(res['message'] ?? "User details updated successfully!"),
          backgroundColor: AppColors.emeraldGreen,
        ),
      );
    } else {
      setState(() {
        _errorMessage = res['message'] ?? "Failed to update user.";
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final userProvider = Provider.of<UserProvider>(context);
    final managers = userProvider.managers.where((m) => m.id != widget.user.id).toList();
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

              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    "Edit Member Details",
                    style: AppTypography.heading(size: 20, color: textPrimary),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close_rounded, size: 20),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              Text(
                "Update profile details and role hierarchy.",
                style: AppTypography.caption(color: textSecondary),
              ),

              const SizedBox(height: 18),

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
                  prefixIcon: const Icon(Icons.person_outline_rounded, size: 20),
                ),
                validator: (val) => val == null || val.trim().isEmpty ? "Full name is required" : null,
              ),

              const SizedBox(height: 14),

              // Username
              Text("USERNAME *", style: AppTypography.badge(color: textSecondary)),
              const SizedBox(height: 6),
              TextFormField(
                controller: _usernameController,
                style: AppTypography.body(color: textPrimary),
                decoration: InputDecoration(
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
                  prefixIcon: const Icon(Icons.mail_outline_rounded, size: 20),
                ),
                validator: (val) {
                  if (val == null || val.trim().isEmpty) return "Email is required";
                  if (!val.contains("@")) return "Enter a valid email address";
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
                  prefixIcon: const Icon(Icons.phone_outlined, size: 20),
                ),
                validator: (val) {
                  if (val == null || val.trim().isEmpty) return "Phone number is required";
                  if (val.trim().length < 10) return "Enter valid 10-digit mobile number";
                  return null;
                },
              ),

              const SizedBox(height: 16),

              // Role
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

              // Reporting Manager
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
                        "Select Manager",
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

              const SizedBox(height: 24),

              ElevatedButton(
                onPressed: _isLoading ? null : _handleUpdate,
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
                        "Save Changes",
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

