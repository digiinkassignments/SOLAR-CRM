import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_typography.dart';
import '../../../providers/financing_provider.dart';

class ApplySubsidySheet extends StatefulWidget {
  final int? preSelectedLeadId;
  final String? preSelectedCustomerName;
  final String? preSelectedConsumerNo;
  final double? preSelectedCapacity;

  const ApplySubsidySheet({
    super.key,
    this.preSelectedLeadId,
    this.preSelectedCustomerName,
    this.preSelectedConsumerNo,
    this.preSelectedCapacity,
  });

  static Future<void> show(BuildContext context, {
    int? leadId,
    String? customerName,
    String? consumerNo,
    double? capacity,
  }) {
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => ApplySubsidySheet(
        preSelectedLeadId: leadId,
        preSelectedCustomerName: customerName,
        preSelectedConsumerNo: consumerNo,
        preSelectedCapacity: capacity,
      ),
    );
  }

  @override
  State<ApplySubsidySheet> createState() => _ApplySubsidySheetState();
}

class _ApplySubsidySheetState extends State<ApplySubsidySheet> {
  final _formKey = GlobalKey<FormState>();

  late TextEditingController _leadIdController;
  late TextEditingController _customerNameController;
  late TextEditingController _consumerNoController;
  late TextEditingController _capacityController;
  late TextEditingController _subsidyAmountController;
  late TextEditingController _ackNoController;

  String _selectedDiscom = 'JVVNL';
  String _selectedStage = 'registered';
  bool _isSaving = false;

  final List<String> _discoms = [
    'JVVNL',
    'AVVNL',
    'JdVVNL',
    'Tata Power',
    'BSES Rajdhani',
    'BSES Yamuna',
    'UPPCL',
    'DHBVN',
    'UHBVN',
    'Torrent Power',
    'MSEDCL',
    'Other DISCOM',
  ];

  final List<Map<String, String>> _stages = [
    {'id': 'registered', 'label': '1. Registered (National Portal)'},
    {'id': 'feasibility_approved', 'label': '2. Feasibility Approved (DISCOM)'},
    {'id': 'vendor_selected', 'label': '3. Vendor Selected (Customer)'},
    {'id': 'agreement_uploaded', 'label': '4. Agreement Uploaded (Model Agreement)'},
    {'id': 'installed_docs_uploaded', 'label': '5. Installed & Docs Uploaded'},
    {'id': 'net_meter_applied', 'label': '6. Net Meter Applied'},
    {'id': 'commissioning_issued', 'label': '7. Commissioning Issued'},
    {'id': 'bank_details_submitted', 'label': '8. Bank Details Submitted'},
    {'id': 'subsidy_credited', 'label': '9. Subsidy Credited'},
  ];

  @override
  void initState() {
    super.initState();
    _leadIdController = TextEditingController(text: widget.preSelectedLeadId?.toString() ?? "");
    _customerNameController = TextEditingController(text: widget.preSelectedCustomerName ?? "");
    _consumerNoController = TextEditingController(text: widget.preSelectedConsumerNo ?? "");
    _capacityController = TextEditingController(text: widget.preSelectedCapacity?.toString() ?? "3.0");
    _subsidyAmountController = TextEditingController(text: _calculateSubsidy(widget.preSelectedCapacity ?? 3.0).toStringAsFixed(0));
    _ackNoController = TextEditingController();

    _capacityController.addListener(_onCapacityChanged);
  }

  @override
  void dispose() {
    _capacityController.removeListener(_onCapacityChanged);
    _leadIdController.dispose();
    _customerNameController.dispose();
    _consumerNoController.dispose();
    _capacityController.dispose();
    _subsidyAmountController.dispose();
    _ackNoController.dispose();
    super.dispose();
  }

  double _calculateSubsidy(double capacityKw) {
    if (capacityKw <= 0) return 0.0;
    if (capacityKw <= 1.0) return 30000.0;
    if (capacityKw <= 2.0) return 60000.0;
    return 78000.0; // PM Surya Ghar cap is ₹78,000 for 3kW and above
  }

  void _onCapacityChanged() {
    final cap = double.tryParse(_capacityController.text.trim()) ?? 0.0;
    final sub = _calculateSubsidy(cap);
    _subsidyAmountController.text = sub.toStringAsFixed(0);
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
      'consumer_number': _consumerNoController.text.trim(),
      'discom': _selectedDiscom,
      'plant_capacity': double.tryParse(_capacityController.text.trim()) ?? 3.0,
      'calculated_subsidy': double.tryParse(_subsidyAmountController.text.trim()) ?? 78000.0,
      'stage': _selectedStage,
      if (_ackNoController.text.trim().isNotEmpty) 'portal_ack_no': _ackNoController.text.trim(),
    };

    final res = await provider.applySubsidy(payload);

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

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? AppColors.darkSurfaceElevated : AppColors.lightCard;
    final borderColor = isDark ? AppColors.darkBorder : AppColors.lightBorder;
    final textPrimary = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final textSecondary = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;

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
                          color: AppColors.brandPrimary.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Icon(Icons.solar_power_rounded, color: AppColors.brandPrimary, size: 20),
                      ),
                      const SizedBox(width: 10),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text("Apply for PM Surya Ghar", style: AppTypography.headingSmall(color: textPrimary)),
                          Text("National Portal Subsidy Application", style: AppTypography.caption(color: textSecondary)),
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

              const SizedBox(height: 16),
              const Divider(),
              const SizedBox(height: 12),

              // Lead ID & Consumer #
              Row(
                children: [
                  Expanded(
                    flex: 2,
                    child: TextFormField(
                      controller: _leadIdController,
                      keyboardType: TextInputType.number,
                      decoration: InputDecoration(
                        labelText: "Lead ID *",
                        hintText: "e.g. 104",
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      validator: (v) => v == null || v.trim().isEmpty ? "Required" : null,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    flex: 3,
                    child: TextFormField(
                      controller: _consumerNoController,
                      decoration: InputDecoration(
                        labelText: "Consumer # *",
                        hintText: "Electricity K-No",
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      validator: (v) => v == null || v.trim().isEmpty ? "Required" : null,
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 12),

              // DISCOM Dropdown
              DropdownButtonFormField<String>(
                initialValue: _selectedDiscom,
                decoration: InputDecoration(
                  labelText: "Electricity DISCOM",
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                ),
                items: _discoms.map((d) => DropdownMenuItem(value: d, child: Text(d))).toList(),
                onChanged: (val) {
                  if (val != null) setState(() => _selectedDiscom = val);
                },
              ),

              const SizedBox(height: 12),

              // Plant Capacity & Subsidy Amount
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _capacityController,
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      decoration: InputDecoration(
                        labelText: "Capacity (kW) *",
                        hintText: "3.0",
                        suffixText: "kW",
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      validator: (v) => v == null || v.trim().isEmpty ? "Required" : null,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: TextFormField(
                      controller: _subsidyAmountController,
                      keyboardType: TextInputType.number,
                      decoration: InputDecoration(
                        labelText: "Govt Subsidy (₹)",
                        prefixText: "₹ ",
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 12),

              // Portal Ack #
              TextFormField(
                controller: _ackNoController,
                decoration: InputDecoration(
                  labelText: "Portal Ack / Application # (Optional)",
                  hintText: "e.g. RJ-2026-SG-00129",
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                ),
              ),

              const SizedBox(height: 12),

              // Current Stage
              DropdownButtonFormField<String>(
                initialValue: _selectedStage,
                decoration: InputDecoration(
                  labelText: "Initial Portal Stage",
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                ),
                items: _stages.map((s) => DropdownMenuItem(value: s['id']!, child: Text(s['label']!))).toList(),
                onChanged: (val) {
                  if (val != null) setState(() => _selectedStage = val);
                },
              ),

              const SizedBox(height: 20),

              // Submit Button
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
                  label: Text(_isSaving ? "Saving..." : "Register Subsidy Application", style: const TextStyle(fontWeight: FontWeight.w700)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
