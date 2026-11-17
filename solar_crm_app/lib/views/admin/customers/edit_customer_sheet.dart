import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_typography.dart';
import '../../../models/customer_model.dart';
import '../../../providers/customer_provider.dart';

class EditCustomerSheet extends StatefulWidget {
  final CustomerModel customer;

  const EditCustomerSheet({super.key, required this.customer});

  @override
  State<EditCustomerSheet> createState() => _EditCustomerSheetState();
}

class _EditCustomerSheetState extends State<EditCustomerSheet> {
  final _formKey = GlobalKey<FormState>();

  late final TextEditingController _nameController;
  late final TextEditingController _mobileController;
  late final TextEditingController _altMobileController;
  late final TextEditingController _emailController;
  late final TextEditingController _addressController;
  late final TextEditingController _cityController;
  late final TextEditingController _stateController;
  late final TextEditingController _pincodeController;
  late final TextEditingController _consumerNumberController;
  late final TextEditingController _discomController;
  late final TextEditingController _sanctionedLoadController;
  late final TextEditingController _gstinController;
  late final TextEditingController _notesController;

  late String _solarRequirement;
  late String _status;
  bool _isLoading = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.customer.customerName);
    _mobileController = TextEditingController(text: widget.customer.mobileNumber);
    _altMobileController = TextEditingController(text: widget.customer.alternateNumber ?? "");
    _emailController = TextEditingController(text: widget.customer.email ?? "");
    _addressController = TextEditingController(text: widget.customer.address ?? "");
    _cityController = TextEditingController(text: widget.customer.city ?? "");
    _stateController = TextEditingController(text: widget.customer.state ?? "");
    _pincodeController = TextEditingController(text: widget.customer.pincode ?? "");
    _consumerNumberController = TextEditingController(text: widget.customer.electricityConsumerNumber ?? "");
    _discomController = TextEditingController(text: widget.customer.discomName ?? "");
    _sanctionedLoadController = TextEditingController(
      text: widget.customer.sanctionedLoadKw != null ? widget.customer.sanctionedLoadKw.toString() : "",
    );
    _gstinController = TextEditingController(text: widget.customer.customerGstin ?? "");
    _notesController = TextEditingController(text: widget.customer.notes ?? "");

    _solarRequirement = widget.customer.solarRequirement;
    _status = widget.customer.status;
  }

  void _handleUpdate() async {
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
      'electricity_consumer_number': _consumerNumberController.text.trim().isNotEmpty ? _consumerNumberController.text.trim() : null,
      'discom_name': _discomController.text.trim().isNotEmpty ? _discomController.text.trim() : null,
      'sanctioned_load_kw': _sanctionedLoadController.text.trim().isNotEmpty ? double.tryParse(_sanctionedLoadController.text.trim()) : null,
      'customer_gstin': _gstinController.text.trim().isNotEmpty ? _gstinController.text.trim() : null,
      'solar_requirement': _solarRequirement,
      'status': _status,
      'notes': _notesController.text.trim().isNotEmpty ? _notesController.text.trim() : null,
      'assigned_to': widget.customer.assignedTo,
    };

    final provider = Provider.of<CustomerProvider>(context, listen: false);
    final res = await provider.updateCustomer(widget.customer.id, data);

    if (!mounted) return;
    setState(() => _isLoading = false);

    if (res['success'] == true) {
      Navigator.pop(context, true);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(res['message'] ?? "Customer updated successfully!"),
          backgroundColor: AppColors.emeraldGreen,
        ),
      );
    } else {
      setState(() {
        _errorMessage = res['message'] ?? "Failed to update customer.";
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
                    "Edit Customer Details",
                    style: AppTypography.heading(size: 20, color: textPrimary),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close_rounded, size: 20),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              Text(
                "Update customer profile & electricity utility identifiers.",
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
                            prefixIcon: const Icon(Icons.phone_iphone_rounded, size: 20),
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
                decoration: InputDecoration(
                  prefixIcon: const Icon(Icons.mail_outline_rounded, size: 20),
                ),
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

              // Address, City, State, Pincode
              Text("INSTALLATION ADDRESS", style: AppTypography.badge(color: textSecondary)),
              const SizedBox(height: 6),
              TextFormField(
                controller: _addressController,
                style: AppTypography.body(color: textPrimary),
                decoration: const InputDecoration(hintText: "Street / Plot address"),
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

              // Technical & Utility (Consumer No & DISCOM)
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text("ELECTRICITY CONSUMER #", style: AppTypography.badge(color: textSecondary)),
                        const SizedBox(height: 6),
                        TextFormField(
                          controller: _consumerNumberController,
                          style: AppTypography.body(color: textPrimary),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text("DISCOM NAME", style: AppTypography.badge(color: textSecondary)),
                        const SizedBox(height: 6),
                        TextFormField(
                          controller: _discomController,
                          style: AppTypography.body(color: textPrimary),
                        ),
                      ],
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 14),

              // Status Dropdown
              Text("ACCOUNT STATUS", style: AppTypography.badge(color: textSecondary)),
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
                    value: _status,
                    isExpanded: true,
                    dropdownColor: cardBg,
                    items: ["Active", "Inactive"].map((s) {
                      return DropdownMenuItem<String>(
                        value: s,
                        child: Text(s, style: AppTypography.body(color: textPrimary)),
                      );
                    }).toList(),
                    onChanged: (val) {
                      if (val != null) setState(() => _status = val);
                    },
                  ),
                ),
              ),

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
                        "Save Customer Changes",
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

