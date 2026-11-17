import 'dart:math';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_typography.dart';
import '../../../models/loan_model.dart';
import '../../../providers/financing_provider.dart';

class LoanSheet extends StatefulWidget {
  final LoanItemModel? existingLoan;
  final int? preSelectedLeadId;
  final String? preSelectedCustomerName;
  final String? preSelectedCustomerPhone;

  const LoanSheet({
    super.key,
    this.existingLoan,
    this.preSelectedLeadId,
    this.preSelectedCustomerName,
    this.preSelectedCustomerPhone,
  });

  static Future<void> show(
    BuildContext context, {
    LoanItemModel? existingLoan,
    int? leadId,
    String? customerName,
    String? customerPhone,
  }) {
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => LoanSheet(
        existingLoan: existingLoan,
        preSelectedLeadId: leadId,
        preSelectedCustomerName: customerName,
        preSelectedCustomerPhone: customerPhone,
      ),
    );
  }

  @override
  State<LoanSheet> createState() => _LoanSheetState();
}

class _LoanSheetState extends State<LoanSheet> {
  final _formKey = GlobalKey<FormState>();

  late TextEditingController _leadIdController;
  late TextEditingController _customerNameController;
  late TextEditingController _customerPhoneController;
  late TextEditingController _totalCostController;
  late TextEditingController _appliedAmountController;
  late TextEditingController _sanctionedAmountController;
  late TextEditingController _disbursedAmountController;
  late TextEditingController _interestRateController;
  late TextEditingController _tenureController;
  late TextEditingController _emiController;
  late TextEditingController _applicationNoController;

  String _selectedBank = 'State Bank of India (SBI)';
  String _selectedStage = 'Eligibility & Docs';
  String _selectedSideStatus = 'Active';

  final ImagePicker _picker = ImagePicker();
  bool _isSaving = false;

  final List<String> _popularBanks = [
    'State Bank of India (SBI)',
    'Punjab National Bank (PNB)',
    'Canara Bank',
    'Bank of Baroda (BoB)',
    'Union Bank of India',
    'HDFC Bank',
    'ICICI Bank',
    'Ecofy (Solar NBFC)',
    'Metafin (Green FinTech)',
    'Credit Fair',
    'Other Local Bank / NBFC',
  ];

  final List<String> _stages = [
    'Eligibility & Docs',
    'Applied',
    'Under Review',
    'Sanctioned',
    'Disbursed',
  ];

  @override
  void initState() {
    super.initState();
    final l = widget.existingLoan;

    _leadIdController = TextEditingController(text: (l?.leadId ?? widget.preSelectedLeadId)?.toString() ?? "");
    _customerNameController = TextEditingController(text: l?.customerName ?? widget.preSelectedCustomerName ?? "");
    _customerPhoneController = TextEditingController(text: l?.customerPhone ?? widget.preSelectedCustomerPhone ?? "");
    _totalCostController = TextEditingController(text: l?.totalProjectCost != null && l!.totalProjectCost > 0 ? l.totalProjectCost.toStringAsFixed(0) : "250000");
    _appliedAmountController = TextEditingController(text: l?.loanAmountApplied != null && l!.loanAmountApplied > 0 ? l.loanAmountApplied.toStringAsFixed(0) : "180000");
    _sanctionedAmountController = TextEditingController(text: l?.sanctionedAmount != null && l!.sanctionedAmount > 0 ? l.sanctionedAmount.toStringAsFixed(0) : "0");
    _disbursedAmountController = TextEditingController(text: l?.disbursedAmount != null && l!.disbursedAmount > 0 ? l.disbursedAmount.toStringAsFixed(0) : "0");
    _interestRateController = TextEditingController(text: l?.interestRate != null ? l!.interestRate.toString() : "7.0");
    _tenureController = TextEditingController(text: l?.tenureMonths != null ? l!.tenureMonths.toString() : "60");
    _emiController = TextEditingController(text: l?.monthlyEmi != null && l!.monthlyEmi > 0 ? l.monthlyEmi.toStringAsFixed(0) : "");
    _applicationNoController = TextEditingController(text: l?.portalApplicationNo ?? "");

    if (l?.bankName != null && _popularBanks.contains(l!.bankName)) {
      _selectedBank = l.bankName;
    }
    if (l?.loanStage != null && _stages.contains(l!.loanStage)) {
      _selectedStage = l.loanStage;
    }
    if (l?.sideStatus != null) {
      _selectedSideStatus = l!.sideStatus;
    }

    _appliedAmountController.addListener(_recalcEmi);
    _sanctionedAmountController.addListener(_recalcEmi);
    _interestRateController.addListener(_recalcEmi);
    _tenureController.addListener(_recalcEmi);

    _recalcEmi();
  }

  @override
  void dispose() {
    _appliedAmountController.removeListener(_recalcEmi);
    _sanctionedAmountController.removeListener(_recalcEmi);
    _interestRateController.removeListener(_recalcEmi);
    _tenureController.removeListener(_recalcEmi);

    _leadIdController.dispose();
    _customerNameController.dispose();
    _customerPhoneController.dispose();
    _totalCostController.dispose();
    _appliedAmountController.dispose();
    _sanctionedAmountController.dispose();
    _disbursedAmountController.dispose();
    _interestRateController.dispose();
    _tenureController.dispose();
    _emiController.dispose();
    _applicationNoController.dispose();
    super.dispose();
  }

  void _recalcEmi() {
    double principal = double.tryParse(_sanctionedAmountController.text.trim()) ?? 0.0;
    if (principal <= 0) {
      principal = double.tryParse(_appliedAmountController.text.trim()) ?? 0.0;
    }
    final rate = double.tryParse(_interestRateController.text.trim()) ?? 7.0;
    final months = int.tryParse(_tenureController.text.trim()) ?? 60;

    if (principal <= 0 || months <= 0) {
      _emiController.text = "0";
      return;
    }

    final monthlyRate = rate / 1200;
    final emi = (principal * monthlyRate * pow(1 + monthlyRate, months)) / (pow(1 + monthlyRate, months) - 1);
    _emiController.text = emi.round().toString();
  }

  Future<void> _handleSave() async {
    if (!_formKey.currentState!.validate()) return;

    final leadId = int.tryParse(_leadIdController.text.trim());
    if (leadId == null || leadId <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(backgroundColor: AppColors.errorRed, content: Text("Valid Lead ID is required")),
      );
      return;
    }

    setState(() => _isSaving = true);
    final provider = Provider.of<FinancingProvider>(context, listen: false);

    final payload = {
      'lead_id': leadId,
      'customer_name': _customerNameController.text.trim(),
      'customer_phone': _customerPhoneController.text.trim(),
      'bank_name': _selectedBank,
      'loan_stage': _selectedStage,
      'side_status': _selectedSideStatus,
      'total_project_cost': double.tryParse(_totalCostController.text.trim()) ?? 0.0,
      'loan_amount_applied': double.tryParse(_appliedAmountController.text.trim()) ?? 0.0,
      'sanctioned_amount': double.tryParse(_sanctionedAmountController.text.trim()) ?? 0.0,
      'disbursed_amount': double.tryParse(_disbursedAmountController.text.trim()) ?? 0.0,
      'interest_rate': double.tryParse(_interestRateController.text.trim()) ?? 7.0,
      'tenure_months': int.tryParse(_tenureController.text.trim()) ?? 60,
      'monthly_emi': double.tryParse(_emiController.text.trim()) ?? 0.0,
      if (_applicationNoController.text.trim().isNotEmpty) 'portal_application_no': _applicationNoController.text.trim(),
    };

    Map<String, dynamic> res;
    if (widget.existingLoan != null) {
      res = await provider.updateLoan(widget.existingLoan!.id, payload);
    } else {
      res = await provider.createLoan(payload);
    }

    if (!mounted) return;
    setState(() => _isSaving = false);

    if (res['success'] == true) {
      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(backgroundColor: AppColors.emeraldGreen, content: Text(res['message']?.toString() ?? "Saved")),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(backgroundColor: AppColors.errorRed, content: Text(res['message']?.toString() ?? "Failed")),
      );
    }
  }

  void _showUploadSanctionLetter() {
    if (widget.existingLoan == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Please save the loan application first before uploading documents")),
      );
      return;
    }

    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                child: Row(
                  children: [
                    Text("Upload Sanction Letter", style: AppTypography.headingSmall()),
                    const Spacer(),
                    IconButton(icon: const Icon(Icons.close_rounded), onPressed: () => Navigator.of(ctx).pop()),
                  ],
                ),
              ),
              const Divider(),
              ListTile(
                leading: const Icon(Icons.camera_alt_outlined, color: AppColors.brandPrimary),
                title: const Text("Capture with Camera"),
                subtitle: const Text("Take direct photo of paper sanction letter"),
                onTap: () {
                  Navigator.of(ctx).pop();
                  _pickAndUploadDoc(ImageSource.camera);
                },
              ),
              ListTile(
                leading: const Icon(Icons.photo_library_outlined, color: AppColors.brandPrimary),
                title: const Text("Select from Gallery / Files"),
                subtitle: const Text("Upload image or scanned document"),
                onTap: () {
                  Navigator.of(ctx).pop();
                  _pickAndUploadDoc(ImageSource.gallery);
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _pickAndUploadDoc(ImageSource source) async {
    try {
      final picked = await _picker.pickImage(source: source, maxWidth: 1400, imageQuality: 85);
      if (picked == null) return;

      if (!mounted) return;
      final provider = Provider.of<FinancingProvider>(context, listen: false);
      final res = await provider.uploadLoanDocument(
        loanId: widget.existingLoan!.id,
        docType: 'sanction_letter',
        filePath: picked.path,
      );

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: res['success'] == true ? AppColors.emeraldGreen : AppColors.errorRed,
          content: Text(res['message']?.toString() ?? "Document uploaded"),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(backgroundColor: AppColors.errorRed, content: Text("Upload error: $e")),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? AppColors.darkSurfaceElevated : AppColors.lightCard;
    final borderColor = isDark ? AppColors.darkBorder : AppColors.lightBorder;
    final textPrimary = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final textSecondary = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;

    final isEdit = widget.existingLoan != null;

    return Container(
      padding: EdgeInsets.only(
        top: 20,
        left: 20,
        right: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        border: Border.all(color: borderColor),
      ),
      child: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
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
                          color: AppColors.skyBlue.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Icon(Icons.account_balance_rounded, color: AppColors.skyBlue, size: 20),
                      ),
                      const SizedBox(width: 10),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(isEdit ? "Edit Solar Loan #${widget.existingLoan!.id}" : "New Solar Loan Application", style: AppTypography.headingSmall(color: textPrimary)),
                          Text("Rooftop Financing & Bank Sanction Workflow", style: AppTypography.caption(color: textSecondary)),
                        ],
                      ),
                    ],
                  ),
                  IconButton(
                    icon: const Icon(Icons.close_rounded),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                ],
              ),

              const SizedBox(height: 14),
              const Divider(),
              const SizedBox(height: 10),

              // Lead ID & Customer
              Row(
                children: [
                  Expanded(
                    flex: 2,
                    child: TextFormField(
                      controller: _leadIdController,
                      keyboardType: TextInputType.number,
                      decoration: InputDecoration(
                        labelText: "Lead ID *",
                        hintText: "e.g. 102",
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      validator: (v) => v == null || v.trim().isEmpty ? "Required" : null,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    flex: 3,
                    child: TextFormField(
                      controller: _customerNameController,
                      decoration: InputDecoration(
                        labelText: "Customer Name *",
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      validator: (v) => v == null || v.trim().isEmpty ? "Required" : null,
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 12),

              // Phone & Bank Selector
              TextFormField(
                controller: _customerPhoneController,
                keyboardType: TextInputType.phone,
                decoration: InputDecoration(
                  labelText: "Customer Phone Number",
                  prefixIcon: const Icon(Icons.phone_outlined, size: 18),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                ),
              ),

              const SizedBox(height: 12),

              // Bank Name Dropdown
              DropdownButtonFormField<String>(
                initialValue: _selectedBank,
                isExpanded: true,
                decoration: InputDecoration(
                  labelText: "Lender / Bank Partner *",
                  prefixIcon: const Icon(Icons.account_balance_outlined, size: 18),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                ),
                items: _popularBanks.map((b) => DropdownMenuItem(value: b, child: Text(b, overflow: TextOverflow.ellipsis))).toList(),
                onChanged: (val) {
                  if (val != null) setState(() => _selectedBank = val);
                },
              ),

              const SizedBox(height: 12),

              // Total Project Cost & Applied Amount
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _totalCostController,
                      keyboardType: TextInputType.number,
                      decoration: InputDecoration(
                        labelText: "Project Cost (₹)",
                        prefixText: "₹ ",
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: TextFormField(
                      controller: _appliedAmountController,
                      keyboardType: TextInputType.number,
                      decoration: InputDecoration(
                        labelText: "Loan Applied (₹) *",
                        prefixText: "₹ ",
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      validator: (v) => v == null || v.trim().isEmpty ? "Required" : null,
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 12),

              // Sanctioned & Disbursed
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _sanctionedAmountController,
                      keyboardType: TextInputType.number,
                      decoration: InputDecoration(
                        labelText: "Sanctioned (₹)",
                        prefixText: "₹ ",
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: TextFormField(
                      controller: _disbursedAmountController,
                      keyboardType: TextInputType.number,
                      decoration: InputDecoration(
                        labelText: "Disbursed (₹)",
                        prefixText: "₹ ",
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 12),

              // Interest Rate & Tenure
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _interestRateController,
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      decoration: InputDecoration(
                        labelText: "Interest Rate (% p.a.)",
                        suffixText: "%",
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: TextFormField(
                      controller: _tenureController,
                      keyboardType: TextInputType.number,
                      decoration: InputDecoration(
                        labelText: "Tenure (Months)",
                        suffixText: "Mos",
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 12),

              // Live Monthly EMI Banner
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                decoration: BoxDecoration(
                  color: AppColors.emeraldGreen.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: AppColors.emeraldGreen.withValues(alpha: 0.3)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.calculate_outlined, color: AppColors.emeraldGreen, size: 20),
                    const SizedBox(width: 10),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text("ESTIMATED MONTHLY EMI", style: AppTypography.badge(color: AppColors.emeraldGreen)),
                        Text(
                          "₹ ${_emiController.text.isNotEmpty ? _emiController.text : '0'} / month",
                          style: AppTypography.headingSmall(color: AppColors.emeraldGreen),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 12),

              // Loan Stage & Side Status
              Row(
                children: [
                  Expanded(
                    flex: 3,
                    child: DropdownButtonFormField<String>(
                      initialValue: _selectedStage,
                      decoration: InputDecoration(
                        labelText: "Loan Stage",
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      items: _stages.map((s) => DropdownMenuItem(value: s, child: Text(s))).toList(),
                      onChanged: (val) {
                        if (val != null) setState(() => _selectedStage = val);
                      },
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    flex: 2,
                    child: DropdownButtonFormField<String>(
                      initialValue: _selectedSideStatus,
                      decoration: InputDecoration(
                        labelText: "Status",
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      items: const [
                        DropdownMenuItem(value: 'Active', child: Text('Active')),
                        DropdownMenuItem(value: 'Rejected', child: Text('Rejected')),
                        DropdownMenuItem(value: 'Withdrawn', child: Text('Withdrawn')),
                      ],
                      onChanged: (val) {
                        if (val != null) setState(() => _selectedSideStatus = val);
                      },
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 12),

              // Portal Application No
              TextFormField(
                controller: _applicationNoController,
                decoration: InputDecoration(
                  labelText: "Bank Loan Ref / Application #",
                  hintText: "e.g. SBI-SOLAR-2026-904",
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                ),
              ),

              const SizedBox(height: 16),

              // Sanction letter upload shortcut (if existing)
              if (isEdit) ...[
                OutlinedButton.icon(
                  onPressed: _showUploadSanctionLetter,
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    side: const BorderSide(color: AppColors.skyBlue),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  icon: const Icon(Icons.cloud_upload_outlined, color: AppColors.skyBlue, size: 18),
                  label: const Text("Upload Sanction Letter (Camera / Gallery)", style: TextStyle(color: AppColors.skyBlue, fontWeight: FontWeight.w700)),
                ),
                const SizedBox(height: 14),
              ],

              // Save Button
              SizedBox(
                width: double.infinity,
                height: 46,
                child: ElevatedButton.icon(
                  onPressed: _isSaving ? null : _handleSave,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.brandPrimary,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  icon: _isSaving
                      ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                      : const Icon(Icons.check_circle_outline_rounded, size: 20),
                  label: Text(_isSaving ? "Saving..." : (isEdit ? "Update Loan Application" : "Create Loan Application"), style: const TextStyle(fontWeight: FontWeight.w700)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
