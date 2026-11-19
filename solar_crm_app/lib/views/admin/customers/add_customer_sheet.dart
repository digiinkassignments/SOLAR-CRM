import 'dart:math';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_typography.dart';
import '../../../providers/auth_provider.dart';
import '../../../providers/customer_provider.dart';
import '../../../providers/user_provider.dart';

class AddCustomerSheet extends StatefulWidget {
  const AddCustomerSheet({super.key});

  @override
  State<AddCustomerSheet> createState() => _AddCustomerSheetState();
}

class _AddCustomerSheetState extends State<AddCustomerSheet> {
  final _formKey = GlobalKey<FormState>();

  final _nameController = TextEditingController();
  final _mobileController = TextEditingController();
  final _altMobileController = TextEditingController();
  final _emailController = TextEditingController();
  final _addressController = TextEditingController();
  final _cityController = TextEditingController();
  final _stateController = TextEditingController();
  final _pincodeController = TextEditingController();
  final _consumerNumberController = TextEditingController();
  final _discomController = TextEditingController();
  final _sanctionedLoadController = TextEditingController();
  final _gstinController = TextEditingController();
  final _notesController = TextEditingController();

  // Opening project & financials
  final _plantSizeController = TextEditingController();
  final _finalAmountController = TextEditingController();
  final _paymentAmountController = TextEditingController();
  final _paymentRefController = TextEditingController();

  int? _assignedTo;
  String _solarRequirement = "Residential";
  String _leadSource = "Direct";
  String _paymentMode = "Bank Transfer";
  bool _showOpeningSection = false;
  bool _isLoading = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<UserProvider>(context, listen: false).fetchUsers();
    });
  }

  static const List<String> _leadSources = [
    "Direct",
    "Referral",
    "Website",
    "Social Media",
    "Cold Call",
    "Campaign",
    "Other",
  ];

  static const List<String> _paymentModes = [
    "Bank Transfer",
    "UPI",
    "Cash",
    "Cheque",
    "Card",
    "Other",
  ];

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
    _consumerNumberController.dispose();
    _discomController.dispose();
    _sanctionedLoadController.dispose();
    _gstinController.dispose();
    _notesController.dispose();
    _plantSizeController.dispose();
    _finalAmountController.dispose();
    _paymentAmountController.dispose();
    _paymentRefController.dispose();
    super.dispose();
  }

  void _handleSubmit() async {
    if (!_formKey.currentState!.validate()) return;

    final plantSizeText = _plantSizeController.text.trim();
    final invoiceAmtText = _finalAmountController.text.trim();
    final paymentAmtText = _paymentAmountController.text.trim();

    final plantSize = double.tryParse(plantSizeText);
    if (plantSizeText.isNotEmpty && (plantSize == null || plantSize <= 0)) {
      setState(() {
        _errorMessage = "Plant size must be a positive number in kW.";
      });
      return;
    }
    final invoiceAmt = double.tryParse(invoiceAmtText);
    final paymentAmt = double.tryParse(paymentAmtText);

    if (paymentAmt != null && invoiceAmt != null && paymentAmt > invoiceAmt) {
      setState(() {
        _errorMessage = "Payment received cannot exceed the final invoice amount.";
      });
      return;
    }

    final auth = Provider.of<AuthProvider>(context, listen: false);
    final currentUser = auth.user;
    if (currentUser?.isManager == true && _assignedTo == null) {
      setState(() {
        _errorMessage = "Assign this customer to a salesperson in your team.";
      });
      return;
    }

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
      'lead_source': _leadSource,
      if (_assignedTo != null) 'assigned_to': _assignedTo,
      'notes': _notesController.text.trim().isNotEmpty ? _notesController.text.trim() : null,
    };

    // Include Opening Record if any opening values were provided
    final hasOpeningRecord = plantSizeText.isNotEmpty || invoiceAmtText.isNotEmpty || paymentAmtText.isNotEmpty;
    if (hasOpeningRecord) {
      final key = "req-${DateTime.now().millisecondsSinceEpoch}-${Random().nextInt(999999).toString().padLeft(6, '0')}";
      data['request_key'] = key;
      if (plantSizeText.isNotEmpty) data['plant_size_kw'] = plantSizeText;
      if (invoiceAmtText.isNotEmpty) data['invoice_amount'] = invoiceAmtText;
      if (paymentAmtText.isNotEmpty) {
        data['payment_amount'] = paymentAmtText;
        data['payment_mode'] = _paymentMode;
        data['payment_date'] = DateTime.now().toIso8601String().split('T')[0];
        if (_paymentRefController.text.trim().isNotEmpty) {
          data['payment_reference'] = _paymentRefController.text.trim();
        }
      }
    }

    final provider = Provider.of<CustomerProvider>(context, listen: false);
    final res = await provider.createCustomer(data);

    if (!mounted) return;
    setState(() => _isLoading = false);

    if (res['success'] == true) {
      Navigator.pop(context, true);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(res['message'] ?? "Customer added successfully!"),
          backgroundColor: AppColors.emeraldGreen,
        ),
      );
    } else {
      setState(() {
        _errorMessage = res['message'] ?? "Failed to create customer.";
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

    final auth = Provider.of<AuthProvider>(context);
    final userProvider = Provider.of<UserProvider>(context);
    final currentUser = auth.user;

    List<dynamic> teamMembers = [];
    if (currentUser?.isManager == true) {
      teamMembers = userProvider.users
          .where((u) => u.isActive && (u.isSales || u.roleId == 3) && u.managerId == currentUser!.id)
          .toList();
    } else if (currentUser?.isAdmin == true) {
      teamMembers = userProvider.users
          .where((u) => u.isActive && (u.isSales || u.roleId == 3))
          .toList();
    }

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
              // Drag Handle
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
                    "Add New Solar Customer",
                    style: AppTypography.heading(size: 20, color: textPrimary),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close_rounded, size: 20),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              Text(
                "Create a customer profile for solar installation and billing.",
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
                  hintText: "e.g. Ramesh Chandra",
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

              // Email
              Text("EMAIL ADDRESS", style: AppTypography.badge(color: textSecondary)),
              const SizedBox(height: 6),
              TextFormField(
                controller: _emailController,
                keyboardType: TextInputType.emailAddress,
                style: AppTypography.body(color: textPrimary),
                decoration: InputDecoration(
                  hintText: "ramesh@example.com",
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

              // Lead Source
              Text("LEAD SOURCE", style: AppTypography.badge(color: textSecondary)),
              const SizedBox(height: 6),
              DropdownButtonFormField<String>(
                initialValue: _leadSource,
                items: _leadSources.map((source) {
                  return DropdownMenuItem(
                    value: source,
                    child: Text(source, style: AppTypography.body(color: textPrimary)),
                  );
                }).toList(),
                onChanged: (val) {
                  if (val != null) setState(() => _leadSource = val);
                },
                decoration: const InputDecoration(
                  prefixIcon: Icon(Icons.hub_outlined, size: 20),
                ),
              ),

              const SizedBox(height: 14),

              // Address, City, State, Pincode
              Text("INSTALLATION ADDRESS", style: AppTypography.badge(color: textSecondary)),
              const SizedBox(height: 6),
              TextFormField(
                controller: _addressController,
                style: AppTypography.body(color: textPrimary),
                decoration: InputDecoration(
                  hintText: "Street / Plot address",
                  prefixIcon: const Icon(Icons.home_outlined, size: 20),
                ),
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
                        Text("ELECTRICITY CA / CONSUMER #", style: AppTypography.badge(color: textSecondary)),
                        const SizedBox(height: 6),
                        TextFormField(
                          controller: _consumerNumberController,
                          style: AppTypography.body(color: textPrimary),
                          decoration: const InputDecoration(hintText: "e.g. 100234567"),
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
                          decoration: const InputDecoration(hintText: "e.g. JVVNL / Tata Power"),
                        ),
                      ],
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 14),

              // Sanctioned Load & GSTIN
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text("SANCTIONED LOAD (KW)", style: AppTypography.badge(color: textSecondary)),
                        const SizedBox(height: 6),
                        TextFormField(
                          controller: _sanctionedLoadController,
                          keyboardType: const TextInputType.numberWithOptions(decimal: true),
                          style: AppTypography.body(color: textPrimary),
                          decoration: const InputDecoration(hintText: "e.g. 5.0"),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text("CUSTOMER GSTIN", style: AppTypography.badge(color: textSecondary)),
                        const SizedBox(height: 6),
                        TextFormField(
                          controller: _gstinController,
                          style: AppTypography.body(color: textPrimary),
                          decoration: const InputDecoration(hintText: "Optional GST"),
                        ),
                      ],
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 14),

              // Opening Installation & Financials (Web Parity)
              Container(
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF141414) : const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: _showOpeningSection ? AppColors.brandPrimary.withValues(alpha: 0.4) : borderColor,
                  ),
                ),
                child: Column(
                  children: [
                    InkWell(
                      onTap: () => setState(() => _showOpeningSection = !_showOpeningSection),
                      borderRadius: BorderRadius.circular(12),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                        child: Row(
                          children: [
                            Icon(
                              Icons.solar_power_outlined,
                              size: 18,
                              color: _showOpeningSection ? AppColors.brandPrimary : textSecondary,
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                "OPENING SOLAR SYSTEM & FINANCIALS",
                                style: AppTypography.badge(
                                  color: _showOpeningSection ? AppColors.brandPrimary : textPrimary,
                                ),
                              ),
                            ),
                            Icon(
                              _showOpeningSection ? Icons.keyboard_arrow_up : Icons.keyboard_arrow_down,
                              color: textSecondary,
                            ),
                          ],
                        ),
                      ),
                    ),
                    if (_showOpeningSection) ...[
                      Padding(
                        padding: const EdgeInsets.fromLTRB(14, 0, 14, 14),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Divider(color: borderColor, height: 1),
                            const SizedBox(height: 12),
                            Text(
                              "Record pre-existing system capacity or initial contract figures for this customer.",
                              style: TextStyle(fontSize: 11, color: textSecondary),
                            ),
                            const SizedBox(height: 12),

                            // Plant Size (kW)
                            Text("SYSTEM CAPACITY (PLANT SIZE KW)", style: AppTypography.badge(color: textSecondary)),
                            const SizedBox(height: 6),
                            TextFormField(
                              controller: _plantSizeController,
                              keyboardType: const TextInputType.numberWithOptions(decimal: true),
                              style: AppTypography.body(color: textPrimary),
                              decoration: const InputDecoration(
                                hintText: "e.g. 5.45",
                                prefixIcon: Icon(Icons.bolt, size: 20),
                              ),
                            ),
                            const SizedBox(height: 12),

                            // Final Invoice Amount & Payment Received
                            Row(
                              children: [
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text("FINAL CONTRACT AMOUNT (₹)", style: AppTypography.badge(color: textSecondary)),
                                      const SizedBox(height: 6),
                                      TextFormField(
                                        controller: _finalAmountController,
                                        keyboardType: const TextInputType.numberWithOptions(decimal: true),
                                        style: AppTypography.body(color: textPrimary),
                                        decoration: const InputDecoration(
                                          hintText: "e.g. 250000",
                                          prefixIcon: Icon(Icons.receipt_long_outlined, size: 20),
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
                                      Text("PAYMENT RECEIVED (₹)", style: AppTypography.badge(color: textSecondary)),
                                      const SizedBox(height: 6),
                                      TextFormField(
                                        controller: _paymentAmountController,
                                        keyboardType: const TextInputType.numberWithOptions(decimal: true),
                                        style: AppTypography.body(color: textPrimary),
                                        decoration: const InputDecoration(
                                          hintText: "e.g. 50000",
                                          prefixIcon: Icon(Icons.currency_rupee, size: 20),
                                        ),
                                        onChanged: (_) => setState(() {}),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),

                            if (_paymentAmountController.text.trim().isNotEmpty &&
                                (double.tryParse(_paymentAmountController.text.trim()) ?? 0) > 0) ...[
                              const SizedBox(height: 12),
                              Row(
                                children: [
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text("PAYMENT MODE", style: AppTypography.badge(color: textSecondary)),
                                        const SizedBox(height: 6),
                                        DropdownButtonFormField<String>(
                                          initialValue: _paymentMode,
                                          items: _paymentModes.map((m) {
                                            return DropdownMenuItem(
                                              value: m,
                                              child: Text(m, style: AppTypography.caption(color: textPrimary)),
                                            );
                                          }).toList(),
                                          onChanged: (val) {
                                            if (val != null) setState(() => _paymentMode = val);
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
                                        Text("PAYMENT REF / UTR", style: AppTypography.badge(color: textSecondary)),
                                        const SizedBox(height: 6),
                                        TextFormField(
                                          controller: _paymentRefController,
                                          style: AppTypography.body(color: textPrimary),
                                          decoration: const InputDecoration(hintText: "Optional Ref"),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
              ),

              if (currentUser?.isManager == true || currentUser?.isAdmin == true) ...[
                const SizedBox(height: 14),
                Text(
                  currentUser?.isManager == true ? "ASSIGN SALESPERSON FROM YOUR TEAM *" : "ASSIGN SALESPERSON (OPTIONAL)",
                  style: AppTypography.badge(color: AppColors.brandPrimary),
                ),
                const SizedBox(height: 6),
                DropdownButtonFormField<int?>(
                  dropdownColor: cardBg,
                  initialValue: _assignedTo,
                  decoration: InputDecoration(
                    hintText: currentUser?.isManager == true ? "Select salesperson *" : "Unassigned",
                    prefixIcon: const Icon(Icons.person_pin_rounded, size: 20),
                  ),
                  items: [
                    if (currentUser?.isAdmin == true)
                      DropdownMenuItem<int?>(
                        value: null,
                        child: Text("Unassigned", style: AppTypography.caption(color: textPrimary)),
                      ),
                    ...teamMembers.map((m) {
                      return DropdownMenuItem<int?>(
                        value: m.id as int,
                        child: Text("${m.name} (${m.roleName})", style: AppTypography.caption(color: textPrimary)),
                      );
                    }),
                  ],
                  onChanged: (val) {
                    setState(() => _assignedTo = val);
                  },
                ),
              ],

              const SizedBox(height: 14),

              // Notes
              Text("SPECIAL NOTES", style: AppTypography.badge(color: textSecondary)),
              const SizedBox(height: 6),
              TextFormField(
                controller: _notesController,
                maxLines: 2,
                style: AppTypography.body(color: textPrimary),
                decoration: const InputDecoration(hintText: "Customer preferences, roof conditions..."),
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
                        "Create Customer Profile",
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

