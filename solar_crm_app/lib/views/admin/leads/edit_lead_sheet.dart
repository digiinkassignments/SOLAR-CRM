import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_typography.dart';
import '../../../models/lead_model.dart';
import '../../../providers/lead_provider.dart';
import '../../../providers/user_provider.dart';

class EditLeadSheet extends StatefulWidget {
  final LeadModel lead;

  const EditLeadSheet({super.key, required this.lead});

  static Future<bool?> show(BuildContext context, {required LeadModel lead}) {
    return showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => EditLeadSheet(lead: lead),
    );
  }

  @override
  State<EditLeadSheet> createState() => _EditLeadSheetState();
}

class _EditLeadSheetState extends State<EditLeadSheet> {
  final _formKey = GlobalKey<FormState>();

  late TextEditingController _nameController;
  late TextEditingController _mobileController;
  late TextEditingController _altMobileController;
  late TextEditingController _emailController;
  late TextEditingController _addressController;
  late TextEditingController _cityController;
  late TextEditingController _stateController;
  late TextEditingController _pincodeController;
  late TextEditingController _capacityController;
  late TextEditingController _consumptionController;
  late TextEditingController _quotationController;
  late TextEditingController _remarkController;

  late String _solarRequirement;
  late String _priority;
  late String _leadSource;
  late String _roofType;
  late String _status;
  int? _assignedTo;

  bool _isLoading = false;
  String? _errorMessage;

  static const List<String> _canonicalStages = [
    "New Lead",
    "Contacted",
    "Qualified",
    "Site Survey Scheduled",
    "Site Survey Done",
    "Quotation Sent",
    "Negotiation",
    "Won",
    "On Hold",
    "Lost",
    "Invalid",
  ];

  static const List<String> _leadSources = [
    "Website",
    "Referral",
    "Social Media",
    "Direct",
    "Cold Call",
    "Campaign",
    "Other",
  ];

  @override
  void initState() {
    super.initState();
    final l = widget.lead;
    _nameController = TextEditingController(text: l.customerName);
    _mobileController = TextEditingController(text: l.mobileNumber);
    _altMobileController = TextEditingController(text: l.alternateNumber ?? "");
    _emailController = TextEditingController(text: l.email ?? "");
    _addressController = TextEditingController(text: l.address ?? "");
    _cityController = TextEditingController(text: l.city ?? "");
    _stateController = TextEditingController(text: l.state ?? "");
    _pincodeController = TextEditingController(text: l.pincode ?? "");
    _capacityController = TextEditingController(text: l.requiredKw.toString());
    _consumptionController = TextEditingController(
      text: l.monthlyConsumptionUnits != null ? l.monthlyConsumptionUnits.toString() : "",
    );
    _quotationController = TextEditingController(
      text: l.quotationAmount > 0 ? l.quotationAmount.toString() : "",
    );
    _remarkController = TextEditingController(text: l.remark ?? "");

    _solarRequirement = ["Residential", "Commercial", "Industrial"].contains(l.solarRequirement)
        ? l.solarRequirement
        : "Residential";
    _priority = ["High", "Medium", "Low"].contains(l.priority) ? l.priority : "Medium";
    _leadSource = _leadSources.contains(l.leadSource) ? l.leadSource : "Website";
    _roofType = l.roofType ?? "RCC Flat Roof";
    _status = _canonicalStages.contains(l.status) ? l.status : "New Lead";
    _assignedTo = l.assignedTo;

    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<UserProvider>(context, listen: false).fetchUsers();
    });
  }

  @override
  void dispose() {
    _nameController.dispose();
    _mobileController.dispose();
    _altMobileController.dispose();
    _emailController.dispose();
    _addressController.dispose();
    _cityController.dispose();
    _stateController.dispose();
    _pincodeController.dispose();
    _capacityController.dispose();
    _consumptionController.dispose();
    _quotationController.dispose();
    _remarkController.dispose();
    super.dispose();
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
      'required_kw': double.tryParse(_capacityController.text.trim()) ?? widget.lead.requiredKw,
      'priority': _priority,
      'lead_source': _leadSource,
      'roof_type': _roofType,
      'status': _status,
      'monthly_consumption_units': _consumptionController.text.trim().isNotEmpty ? int.tryParse(_consumptionController.text.trim()) : null,
      'quotation_amount': _quotationController.text.trim().isNotEmpty ? double.tryParse(_quotationController.text.trim()) : null,
      'remark': _remarkController.text.trim().isNotEmpty ? _remarkController.text.trim() : null,
      'assigned_to': _assignedTo,
    };

    final provider = Provider.of<LeadProvider>(context, listen: false);
    final res = await provider.updateLead(widget.lead.id, data);

    if (!mounted) return;
    setState(() => _isLoading = false);

    if (res['success'] == true) {
      Navigator.pop(context, true);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(res['message'] ?? "Lead updated successfully!"),
          backgroundColor: AppColors.emeraldGreen,
        ),
      );
    } else {
      setState(() {
        _errorMessage = res['message'] ?? "Failed to update lead.";
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? AppColors.darkCard : AppColors.lightCard;
    final borderColor = isDark ? AppColors.darkBorder : AppColors.lightBorder;
    final textPrimary = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final textSecondary = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;
    final surfaceColor = isDark ? AppColors.darkSurface : AppColors.lightSurface;
    final userProvider = Provider.of<UserProvider>(context);

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
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.90,
      ),
      child: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: AppColors.brandPrimary.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(Icons.edit_note_rounded, color: AppColors.brandPrimary, size: 22),
                      ),
                      const SizedBox(width: 12),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text("Edit Lead", style: AppTypography.headingMedium(color: textPrimary)),
                          Text(widget.lead.leadCode, style: AppTypography.caption(color: textSecondary)),
                        ],
                      ),
                    ],
                  ),
                  IconButton(
                    icon: Icon(Icons.close, color: textSecondary),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              if (_errorMessage != null) ...[
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.errorRed.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: AppColors.errorRed.withValues(alpha: 0.3)),
                  ),
                  child: Text(_errorMessage!, style: const TextStyle(color: AppColors.errorRed, fontSize: 13)),
                ),
                const SizedBox(height: 16),
              ],

              // Pipeline Stage (Canonical Vocabulary)
              Text("PIPELINE STAGE *", style: AppTypography.badge(color: textSecondary)),
              const SizedBox(height: 6),
              DropdownButtonFormField<String>(
                initialValue: _status,
                items: _canonicalStages.map((stage) {
                  return DropdownMenuItem(
                    value: stage,
                    child: Text(stage, style: AppTypography.body(color: textPrimary)),
                  );
                }).toList(),
                onChanged: (val) {
                  if (val != null) setState(() => _status = val);
                },
                decoration: const InputDecoration(
                  prefixIcon: Icon(Icons.trending_up_rounded, size: 20),
                ),
              ),

              const SizedBox(height: 14),

              // Customer Name
              Text("CUSTOMER NAME *", style: AppTypography.badge(color: textSecondary)),
              const SizedBox(height: 6),
              TextFormField(
                controller: _nameController,
                style: AppTypography.body(color: textPrimary),
                decoration: const InputDecoration(
                  hintText: "Enter full name",
                  prefixIcon: Icon(Icons.person_outline, size: 20),
                ),
                validator: (val) => val == null || val.trim().isEmpty ? "Name is required" : null,
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
                          decoration: const InputDecoration(
                            hintText: "10 digits",
                            prefixIcon: Icon(Icons.phone_outlined, size: 20),
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
                          decoration: const InputDecoration(
                            hintText: "Optional",
                            prefixIcon: Icon(Icons.phone_iphone_rounded, size: 20),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 14),

              // Email
              Text("EMAIL ADDRESS", style: AppTypography.badge(color: textSecondary)),
              const SizedBox(height: 6),
              TextFormField(
                controller: _emailController,
                keyboardType: TextInputType.emailAddress,
                style: AppTypography.body(color: textPrimary),
                decoration: const InputDecoration(
                  hintText: "email@example.com",
                  prefixIcon: Icon(Icons.mail_outline_rounded, size: 20),
                ),
              ),

              const SizedBox(height: 14),

              // Address
              Text("INSTALLATION ADDRESS", style: AppTypography.badge(color: textSecondary)),
              const SizedBox(height: 6),
              TextFormField(
                controller: _addressController,
                style: AppTypography.body(color: textPrimary),
                decoration: const InputDecoration(
                  hintText: "Plot / House, Street / Area",
                  prefixIcon: Icon(Icons.location_on_outlined, size: 20),
                ),
              ),

              const SizedBox(height: 14),

              // City, State & Pincode
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text("CITY", style: AppTypography.badge(color: textSecondary)),
                        const SizedBox(height: 6),
                        TextFormField(
                          controller: _cityController,
                          style: AppTypography.body(color: textPrimary),
                          decoration: const InputDecoration(hintText: "e.g. Jaipur"),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text("STATE", style: AppTypography.badge(color: textSecondary)),
                        const SizedBox(height: 6),
                        TextFormField(
                          controller: _stateController,
                          style: AppTypography.body(color: textPrimary),
                          decoration: const InputDecoration(hintText: "e.g. Rajasthan"),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text("PINCODE", style: AppTypography.badge(color: textSecondary)),
                        const SizedBox(height: 6),
                        TextFormField(
                          controller: _pincodeController,
                          keyboardType: TextInputType.number,
                          style: AppTypography.body(color: textPrimary),
                          decoration: const InputDecoration(hintText: "302020"),
                        ),
                      ],
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 14),

              // Priority & Lead Source
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text("PRIORITY", style: AppTypography.badge(color: textSecondary)),
                        const SizedBox(height: 6),
                        DropdownButtonFormField<String>(
                          initialValue: _priority,
                          items: ["High", "Medium", "Low"].map((p) {
                            return DropdownMenuItem(
                              value: p,
                              child: Text(p, style: AppTypography.body(color: textPrimary)),
                            );
                          }).toList(),
                          onChanged: (val) {
                            if (val != null) setState(() => _priority = val);
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
                        Text("LEAD SOURCE", style: AppTypography.badge(color: textSecondary)),
                        const SizedBox(height: 6),
                        DropdownButtonFormField<String>(
                          initialValue: _leadSource,
                          items: _leadSources.map((s) {
                            return DropdownMenuItem(
                              value: s,
                              child: Text(s, style: AppTypography.body(color: textPrimary)),
                            );
                          }).toList(),
                          onChanged: (val) {
                            if (val != null) setState(() => _leadSource = val);
                          },
                        ),
                      ],
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 14),

              // Solar Requirement
              Text("SOLAR REQUIREMENT *", style: AppTypography.badge(color: textSecondary)),
              const SizedBox(height: 6),
              Row(
                children: ["Residential", "Commercial", "Industrial"].map((req) {
                  final isSel = _solarRequirement == req;
                  return Expanded(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 4.0),
                      child: InkWell(
                        onTap: () => setState(() => _solarRequirement = req),
                        borderRadius: BorderRadius.circular(10),
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          decoration: BoxDecoration(
                            color: isSel
                                ? AppColors.brandPrimary.withValues(alpha: 0.15)
                                : surfaceColor,
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(
                              color: isSel ? AppColors.brandPrimary : borderColor,
                            ),
                          ),
                          child: Text(
                            req,
                            textAlign: TextAlign.center,
                            style: AppTypography.caption(
                              color: isSel ? AppColors.brandPrimary : textPrimary,
                              fontWeight: isSel ? FontWeight.bold : FontWeight.w500,
                            ),
                          ),
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),

              const SizedBox(height: 14),

              // System Capacity (kW) & Monthly Units
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text("REQUIRED CAPACITY (KW) *", style: AppTypography.badge(color: textSecondary)),
                        const SizedBox(height: 6),
                        TextFormField(
                          controller: _capacityController,
                          keyboardType: const TextInputType.numberWithOptions(decimal: true),
                          style: AppTypography.body(color: textPrimary),
                          decoration: const InputDecoration(
                            hintText: "e.g. 5.0",
                            prefixIcon: Icon(Icons.bolt, size: 20),
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
                        Text("MONTHLY UNITS (KWH)", style: AppTypography.badge(color: textSecondary)),
                        const SizedBox(height: 6),
                        TextFormField(
                          controller: _consumptionController,
                          keyboardType: TextInputType.number,
                          style: AppTypography.body(color: textPrimary),
                          decoration: const InputDecoration(
                            hintText: "e.g. 450",
                            prefixIcon: Icon(Icons.speed, size: 20),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 14),

              // Assign To Rep
              Text("ASSIGN TO SALES EXECUTIVE", style: AppTypography.badge(color: textSecondary)),
              const SizedBox(height: 6),
              DropdownButtonFormField<int?>(
                initialValue: _assignedTo,
                items: [
                  DropdownMenuItem<int?>(
                    value: null,
                    child: Text("Unassigned", style: AppTypography.body(color: textSecondary)),
                  ),
                  ...userProvider.users.map((u) {
                    return DropdownMenuItem<int?>(
                      value: u.id,
                      child: Text("${u.fullName} (${u.roleName})", style: AppTypography.body(color: textPrimary)),
                    );
                  }),
                ],
                onChanged: (val) => setState(() => _assignedTo = val),
                decoration: const InputDecoration(
                  prefixIcon: Icon(Icons.assignment_ind_outlined, size: 20),
                ),
              ),

              const SizedBox(height: 14),

              // Quotation Amount & Roof Type
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text("QUOTATION EST. (₹)", style: AppTypography.badge(color: textSecondary)),
                        const SizedBox(height: 6),
                        TextFormField(
                          controller: _quotationController,
                          keyboardType: const TextInputType.numberWithOptions(decimal: true),
                          style: AppTypography.body(color: textPrimary),
                          decoration: const InputDecoration(
                            hintText: "Optional",
                            prefixIcon: Icon(Icons.currency_rupee, size: 20),
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
                        Text("ROOF TYPE", style: AppTypography.badge(color: textSecondary)),
                        const SizedBox(height: 6),
                        TextFormField(
                          initialValue: _roofType,
                          style: AppTypography.body(color: textPrimary),
                          decoration: const InputDecoration(hintText: "e.g. RCC Flat Roof"),
                          onChanged: (val) => _roofType = val.trim(),
                        ),
                      ],
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 14),

              // Remarks
              Text("REMARKS / NOTES", style: AppTypography.badge(color: textSecondary)),
              const SizedBox(height: 6),
              TextFormField(
                controller: _remarkController,
                maxLines: 2,
                style: AppTypography.body(color: textPrimary),
                decoration: const InputDecoration(hintText: "Customer discussion notes..."),
              ),

              const SizedBox(height: 24),

              // Submit Button
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
                        "Update Lead Details",
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
