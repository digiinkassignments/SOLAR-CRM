import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_typography.dart';
import '../../../providers/lead_provider.dart';
import '../../../providers/user_provider.dart';

class AddLeadSheet extends StatefulWidget {
  const AddLeadSheet({super.key});

  @override
  State<AddLeadSheet> createState() => _AddLeadSheetState();
}

class _AddLeadSheetState extends State<AddLeadSheet> {
  final _formKey = GlobalKey<FormState>();

  final _nameController = TextEditingController();
  final _mobileController = TextEditingController();
  final _altMobileController = TextEditingController();
  final _emailController = TextEditingController();
  final _addressController = TextEditingController();
  final _cityController = TextEditingController();
  final _stateController = TextEditingController();
  final _pincodeController = TextEditingController();
  final _capacityController = TextEditingController(text: "3.0");
  final _consumptionController = TextEditingController();
  final _quotationController = TextEditingController();
  final _remarkController = TextEditingController();

  String _solarRequirement = "Residential";
  String _interestStatus = "Interested";
  String _priority = "Medium";
  String _leadSource = "Website";
  String _roofType = "RCC Flat Roof";
  int? _assignedTo;

  bool _isLoading = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<UserProvider>(context, listen: false).fetchUsers();
    });
  }

  void _handleSubmit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final data = <String, dynamic>{
      'customer_name': _nameController.text.trim(),
      'mobile_number': _mobileController.text.trim(),
      'alternate_number': _altMobileController.text.trim().isNotEmpty ? _altMobileController.text.trim() : null,
      'email': _emailController.text.trim().isNotEmpty ? _emailController.text.trim() : null,
      'address': _addressController.text.trim().isNotEmpty ? _addressController.text.trim() : null,
      'city': _cityController.text.trim().isNotEmpty ? _cityController.text.trim() : null,
      'state': _stateController.text.trim().isNotEmpty ? _stateController.text.trim() : null,
      'pincode': _pincodeController.text.trim().isNotEmpty ? _pincodeController.text.trim() : null,
      'solar_requirement': _solarRequirement,
      'interest_status': _interestStatus,
      'required_kw': double.tryParse(_capacityController.text.trim()) ?? 3.0,
      'priority': _priority,
      'lead_source': _leadSource,
      'roof_type': _roofType,
      'monthly_consumption_units': _consumptionController.text.trim().isNotEmpty ? int.tryParse(_consumptionController.text.trim()) : null,
      'quotation_amount': _quotationController.text.trim().isNotEmpty ? double.tryParse(_quotationController.text.trim()) : null,
      'remark': _remarkController.text.trim().isNotEmpty ? _remarkController.text.trim() : null,
      'assigned_to': _assignedTo,
      'status': "New Lead",
    };

    final provider = Provider.of<LeadProvider>(context, listen: false);
    final res = await provider.createLead(data);

    if (!mounted) return;
    setState(() => _isLoading = false);

    if (res['success'] == true) {
      Navigator.pop(context, true);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(res['message'] ?? "Lead created successfully!"),
          backgroundColor: AppColors.emeraldGreen,
        ),
      );
    } else {
      setState(() {
        _errorMessage = res['message'] ?? "Failed to register lead.";
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final userProvider = Provider.of<UserProvider>(context);
    final teamMembers = userProvider.users.where((u) => u.isActive).toList();

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
                    "Capture New Solar Lead",
                    style: AppTypography.heading(size: 20, color: textPrimary),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close_rounded, size: 20),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              Text(
                "Register prospect for feasibility assessment & follow-ups.",
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

              // Customer Name
              Text("CUSTOMER NAME *", style: AppTypography.badge(color: textSecondary)),
              const SizedBox(height: 6),
              TextFormField(
                controller: _nameController,
                style: AppTypography.body(color: textPrimary),
                decoration: InputDecoration(
                  hintText: "e.g. Pooja Rathore",
                  prefixIcon: const Icon(Icons.person_outline_rounded, size: 20),
                ),
                validator: (val) => val == null || val.trim().isEmpty ? "Customer name is required" : null,
              ),

              const SizedBox(height: 14),

              // Mobile & Alternate Phone
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text("MOBILE NUMBER *", style: AppTypography.badge(color: textSecondary)),
                        const SizedBox(height: 6),
                        TextFormField(
                          controller: _mobileController,
                          keyboardType: TextInputType.phone,
                          style: AppTypography.body(color: textPrimary),
                          decoration: InputDecoration(
                            hintText: "9876543210",
                            prefixIcon: const Icon(Icons.phone_outlined, size: 20),
                          ),
                          validator: (val) {
                            if (val == null || val.trim().isEmpty) return "Required";
                            if (val.trim().length < 10) return "10 digits";
                            return null;
                          },
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text("ALTERNATE PHONE", style: AppTypography.badge(color: textSecondary)),
                        const SizedBox(height: 6),
                        TextFormField(
                          controller: _altMobileController,
                          keyboardType: TextInputType.phone,
                          style: AppTypography.body(color: textPrimary),
                          decoration: InputDecoration(
                            hintText: "Optional",
                            prefixIcon: const Icon(Icons.phone_iphone_rounded, size: 20),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 14),

              // Required Capacity kW & Monthly Units
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text("SOLAR CAPACITY (KW) *", style: AppTypography.badge(color: textSecondary)),
                        const SizedBox(height: 6),
                        TextFormField(
                          controller: _capacityController,
                          keyboardType: const TextInputType.numberWithOptions(decimal: true),
                          style: AppTypography.body(color: textPrimary),
                          decoration: InputDecoration(
                            hintText: "e.g. 4.36",
                            prefixIcon: const Icon(Icons.solar_power_rounded, size: 20),
                          ),
                          validator: (val) => val == null || val.trim().isEmpty ? "Required" : null,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text("MONTHLY UNITS", style: AppTypography.badge(color: textSecondary)),
                        const SizedBox(height: 6),
                        TextFormField(
                          controller: _consumptionController,
                          keyboardType: TextInputType.number,
                          style: AppTypography.body(color: textPrimary),
                          decoration: InputDecoration(
                            hintText: "e.g. 350",
                            prefixIcon: const Icon(Icons.electric_bolt_rounded, size: 20),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 14),

              // Solar Requirement & Priority
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text("REQUIREMENT", style: AppTypography.badge(color: textSecondary)),
                        const SizedBox(height: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          decoration: BoxDecoration(
                            color: surfaceColor,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: borderColor),
                          ),
                          child: DropdownButtonHideUnderline(
                            child: DropdownButton<String>(
                              value: _solarRequirement,
                              isExpanded: true,
                              dropdownColor: cardBg,
                              items: ["Residential", "Commercial", "Industrial"].map((s) {
                                return DropdownMenuItem<String>(
                                  value: s,
                                  child: Text(s, style: AppTypography.body(color: textPrimary)),
                                );
                              }).toList(),
                              onChanged: (val) {
                                if (val != null) setState(() => _solarRequirement = val);
                              },
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text("PRIORITY", style: AppTypography.badge(color: textSecondary)),
                        const SizedBox(height: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          decoration: BoxDecoration(
                            color: surfaceColor,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: borderColor),
                          ),
                          child: DropdownButtonHideUnderline(
                            child: DropdownButton<String>(
                              value: _priority,
                              isExpanded: true,
                              dropdownColor: cardBg,
                              items: ["High", "Medium", "Low"].map((p) {
                                return DropdownMenuItem<String>(
                                  value: p,
                                  child: Text(p, style: AppTypography.body(color: textPrimary)),
                                );
                              }).toList(),
                              onChanged: (val) {
                                if (val != null) setState(() => _priority = val);
                              },
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 14),

              // Roof Type & Initial Stage
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text("ROOF TYPE", style: AppTypography.badge(color: textSecondary)),
                        const SizedBox(height: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          decoration: BoxDecoration(
                            color: surfaceColor,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: borderColor),
                          ),
                          child: DropdownButtonHideUnderline(
                            child: DropdownButton<String>(
                              value: _roofType,
                              isExpanded: true,
                              dropdownColor: cardBg,
                              items: ["RCC Flat Roof", "Tin Shed", "Tile Roof", "Ground Mount", "Other"].map((s) {
                                return DropdownMenuItem<String>(
                                  value: s,
                                  child: Text(s, style: AppTypography.body(color: textPrimary)),
                                );
                              }).toList(),
                              onChanged: (val) {
                                if (val != null) setState(() => _roofType = val);
                              },
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text("INITIAL STAGE", style: AppTypography.badge(color: textSecondary)),
                        const SizedBox(height: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          decoration: BoxDecoration(
                            color: surfaceColor,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: borderColor),
                          ),
                          child: DropdownButtonHideUnderline(
                            child: DropdownButton<String>(
                              value: _interestStatus,
                              isExpanded: true,
                              dropdownColor: cardBg,
                              items: ["New Lead", "Contacted", "Interested"].map((p) {
                                return DropdownMenuItem<String>(
                                  value: p,
                                  child: Text(p, style: AppTypography.body(color: textPrimary)),
                                );
                              }).toList(),
                              onChanged: (val) {
                                if (val != null) setState(() => _interestStatus = val);
                              },
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 14),

              // Lead Source & Assign Rep
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text("LEAD SOURCE", style: AppTypography.badge(color: textSecondary)),
                        const SizedBox(height: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          decoration: BoxDecoration(
                            color: surfaceColor,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: borderColor),
                          ),
                          child: DropdownButtonHideUnderline(
                            child: DropdownButton<String>(
                              value: _leadSource,
                              isExpanded: true,
                              dropdownColor: cardBg,
                              items: ["Website", "Facebook", "Instagram", "Referral", "Field Survey", "Direct Call", "Other"].map((s) {
                                return DropdownMenuItem<String>(
                                  value: s,
                                  child: Text(s, style: AppTypography.body(color: textPrimary)),
                                );
                              }).toList(),
                              onChanged: (val) {
                                if (val != null) setState(() => _leadSource = val);
                              },
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text("ASSIGN SALES REP", style: AppTypography.badge(color: AppColors.brandPrimary)),
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
                              value: _assignedTo,
                              hint: Text("Select Rep", style: AppTypography.caption(color: textSecondary)),
                              isExpanded: true,
                              dropdownColor: cardBg,
                              items: teamMembers.map((m) {
                                return DropdownMenuItem<int>(
                                  value: m.id,
                                  child: Text(m.fullName, maxLines: 1, overflow: TextOverflow.ellipsis, style: AppTypography.body(color: textPrimary)),
                                );
                              }).toList(),
                              onChanged: (val) => setState(() => _assignedTo = val),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 14),

              // City, State, Address
              Text("SITE LOCATION", style: AppTypography.badge(color: textSecondary)),
              const SizedBox(height: 6),
              TextFormField(
                controller: _addressController,
                style: AppTypography.body(color: textPrimary),
                decoration: const InputDecoration(hintText: "Street address"),
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _cityController,
                      style: AppTypography.body(color: textPrimary),
                      decoration: const InputDecoration(hintText: "City"),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: TextFormField(
                      controller: _stateController,
                      style: AppTypography.body(color: textPrimary),
                      decoration: const InputDecoration(hintText: "State"),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: TextFormField(
                      controller: _pincodeController,
                      keyboardType: TextInputType.number,
                      style: AppTypography.body(color: textPrimary),
                      decoration: const InputDecoration(hintText: "Pincode"),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 14),

              // Remark
              Text("INITIAL CONVERSATION REMARK", style: AppTypography.badge(color: textSecondary)),
              const SizedBox(height: 6),
              TextFormField(
                controller: _remarkController,
                maxLines: 2,
                style: AppTypography.body(color: textPrimary),
                decoration: const InputDecoration(hintText: "Customer query, tariff rate, roof orientation..."),
              ),

              const SizedBox(height: 24),

              ElevatedButton(
                onPressed: _isLoading ? null : _handleSubmit,
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
                        "Register Lead",
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

