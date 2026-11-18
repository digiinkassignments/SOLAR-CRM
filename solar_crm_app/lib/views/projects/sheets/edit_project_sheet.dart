import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_typography.dart';
import '../../../models/project_model.dart';
import '../../../providers/project_provider.dart';

class EditProjectSheet extends StatefulWidget {
  final ProjectModel project;

  const EditProjectSheet({super.key, required this.project});

  static Future<void> show(BuildContext context, ProjectModel project) async {
    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => EditProjectSheet(project: project),
    );
  }

  @override
  State<EditProjectSheet> createState() => _EditProjectSheetState();
}

class _EditProjectSheetState extends State<EditProjectSheet> {
  final _formKey = GlobalKey<FormState>();

  late TextEditingController _nameController;
  late TextEditingController _phoneController;
  late TextEditingController _addressController;
  late TextEditingController _cityController;
  late TextEditingController _stateController;
  late TextEditingController _pincodeController;

  late TextEditingController _capacityController;
  late TextEditingController _panelCountController;
  late TextEditingController _inverterKwController;

  DateTime? _startDate;
  DateTime? _endDate;
  DateTime? _handoverDate;

  late TextEditingController _notesController;
  late TextEditingController _totalCostController;
  late TextEditingController _amountReceivedController;

  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    final p = widget.project;
    _nameController = TextEditingController(text: p.customerName);
    _phoneController = TextEditingController(text: p.customerPhone);
    _addressController = TextEditingController(text: p.customerAddress ?? '');
    _cityController = TextEditingController(text: p.city ?? '');
    _stateController = TextEditingController(text: p.state ?? '');
    _pincodeController = TextEditingController(text: p.pincode ?? '');

    _capacityController = TextEditingController(text: p.systemCapacityKw.toString());
    _panelCountController = TextEditingController(text: p.panelCount?.toString() ?? '');
    _inverterKwController = TextEditingController(text: p.inverterKw?.toString() ?? '');

    _startDate = p.installationStartDate;
    _endDate = p.installationEndDate;
    _handoverDate = p.completionDate;

    _notesController = TextEditingController(text: p.notes ?? '');
    _totalCostController = TextEditingController(text: p.totalCost > 0 ? p.totalCost.toStringAsFixed(0) : '0');
    _amountReceivedController = TextEditingController(text: p.amountReceived > 0 ? p.amountReceived.toStringAsFixed(0) : '0');
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    _cityController.dispose();
    _stateController.dispose();
    _pincodeController.dispose();
    _capacityController.dispose();
    _panelCountController.dispose();
    _inverterKwController.dispose();
    _notesController.dispose();
    _totalCostController.dispose();
    _amountReceivedController.dispose();
    super.dispose();
  }

  Future<void> _pickDate(String type) async {
    final initialDate = type == 'start'
        ? (_startDate ?? DateTime.now())
        : type == 'end'
            ? (_endDate ?? DateTime.now())
            : (_handoverDate ?? DateTime.now());

    final picked = await showDatePicker(
      context: context,
      initialDate: initialDate,
      firstDate: DateTime(2020),
      lastDate: DateTime(2035),
    );

    if (picked != null) {
      setState(() {
        if (type == 'start') _startDate = picked;
        if (type == 'end') _endDate = picked;
        if (type == 'handover') _handoverDate = picked;
      });
    }
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isSaving = true);

    final totalCost = double.tryParse(_totalCostController.text.trim()) ?? 0.0;
    final amountRec = double.tryParse(_amountReceivedController.text.trim()) ?? 0.0;

    final payload = {
      'customer_name': _nameController.text.trim(),
      'customer_phone': _phoneController.text.trim(),
      'customer_address': _addressController.text.trim().isNotEmpty ? _addressController.text.trim() : null,
      'city': _cityController.text.trim().isNotEmpty ? _cityController.text.trim() : null,
      'state': _stateController.text.trim().isNotEmpty ? _stateController.text.trim() : null,
      'pincode': _pincodeController.text.trim().isNotEmpty ? _pincodeController.text.trim() : null,
      'system_capacity_kw': double.tryParse(_capacityController.text.trim()) ?? 3.0,
      'panel_count': int.tryParse(_panelCountController.text.trim()),
      'inverter_kw': double.tryParse(_inverterKwController.text.trim()),
      'installation_start_date': _startDate?.toIso8601String().substring(0, 10),
      'installation_end_date': _endDate?.toIso8601String().substring(0, 10),
      'completion_date': _handoverDate?.toIso8601String().substring(0, 10),
      'notes': _notesController.text.trim().isNotEmpty ? _notesController.text.trim() : null,
      'total_cost': totalCost,
      'amount_received': amountRec,
      'payment_status': amountRec >= totalCost && totalCost > 0 ? 'Completed' : 'Pending',
    };

    final provider = Provider.of<ProjectProvider>(context, listen: false);
    final result = await provider.updateProject(widget.project.id, payload);

    if (mounted) {
      setState(() => _isSaving = false);
      Navigator.of(context).pop();

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(result['message'] ?? 'Project saved successfully'),
          backgroundColor: result['success'] == true ? AppColors.emeraldGreen : AppColors.errorRed,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? const Color(0xFF1E293B) : Colors.white;
    final borderColor = isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0);
    final textPrimary = isDark ? Colors.white : const Color(0xFF0F172A);
    final textSecondary = isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B);

    final totalCost = double.tryParse(_totalCostController.text.trim()) ?? 0.0;
    final amountRec = double.tryParse(_amountReceivedController.text.trim()) ?? 0.0;
    final balanceDue = totalCost > amountRec ? totalCost - amountRec : 0.0;

    return Container(
      height: MediaQuery.of(context).size.height * 0.92,
      decoration: BoxDecoration(
        color: Theme.of(context).scaffoldBackgroundColor,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        children: [
          // Header Bar
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
            decoration: BoxDecoration(
              border: Border(bottom: BorderSide(color: borderColor)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    const Icon(Icons.edit_note_rounded, color: AppColors.brandPrimary),
                    const SizedBox(width: 8),
                    Text(
                      "Edit Solar Project Details",
                      style: AppTypography.heading(size: 17, color: textPrimary),
                    ),
                  ],
                ),
                IconButton(
                  icon: const Icon(Icons.close_rounded, size: 20),
                  onPressed: () => Navigator.of(context).pop(),
                ),
              ],
            ),
          ),

          // Scrollable Form Body
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Section 1: Customer Profile
                    _buildSectionHeader("CUSTOMER & CONTACT INFORMATION", textSecondary),
                    const SizedBox(height: 10),
                    TextFormField(
                      controller: _nameController,
                      style: TextStyle(color: textPrimary, fontSize: 13),
                      decoration: const InputDecoration(
                        labelText: "Customer Full Name *",
                        border: OutlineInputBorder(),
                      ),
                      validator: (v) => (v == null || v.trim().isEmpty) ? "Required" : null,
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _phoneController,
                      keyboardType: TextInputType.phone,
                      style: TextStyle(color: textPrimary, fontSize: 13),
                      decoration: const InputDecoration(
                        labelText: "Customer Mobile Phone *",
                        border: OutlineInputBorder(),
                      ),
                      validator: (v) => (v == null || v.trim().isEmpty) ? "Required" : null,
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _addressController,
                      style: TextStyle(color: textPrimary, fontSize: 13),
                      decoration: const InputDecoration(
                        labelText: "Site Installation Address",
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: TextFormField(
                            controller: _cityController,
                            style: TextStyle(color: textPrimary, fontSize: 13),
                            decoration: const InputDecoration(
                              labelText: "City",
                              border: OutlineInputBorder(),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: TextFormField(
                            controller: _stateController,
                            style: TextStyle(color: textPrimary, fontSize: 13),
                            decoration: const InputDecoration(
                              labelText: "State",
                              border: OutlineInputBorder(),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: TextFormField(
                            controller: _pincodeController,
                            keyboardType: TextInputType.number,
                            style: TextStyle(color: textPrimary, fontSize: 13),
                            decoration: const InputDecoration(
                              labelText: "Pincode",
                              border: OutlineInputBorder(),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),

                    // Section 2: Technical Specifications
                    _buildSectionHeader("TECHNICAL SOLAR SYSTEM SPECIFICATIONS", textSecondary),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        Expanded(
                          child: TextFormField(
                            controller: _capacityController,
                            keyboardType: const TextInputType.numberWithOptions(decimal: true),
                            style: TextStyle(color: textPrimary, fontSize: 13),
                            decoration: const InputDecoration(
                              labelText: "Capacity (kW) *",
                              border: OutlineInputBorder(),
                            ),
                            validator: (v) => (v == null || v.trim().isEmpty) ? "Required" : null,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: TextFormField(
                            controller: _panelCountController,
                            keyboardType: TextInputType.number,
                            style: TextStyle(color: textPrimary, fontSize: 13),
                            decoration: const InputDecoration(
                              labelText: "Panel Count",
                              border: OutlineInputBorder(),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: TextFormField(
                            controller: _inverterKwController,
                            keyboardType: const TextInputType.numberWithOptions(decimal: true),
                            style: TextStyle(color: textPrimary, fontSize: 13),
                            decoration: const InputDecoration(
                              labelText: "Inverter kW",
                              border: OutlineInputBorder(),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),

                    // Section 3: Execution Schedule Dates
                    _buildSectionHeader("PROJECT EXECUTION SCHEDULE DATES", textSecondary),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        Expanded(
                          child: _buildDatePickerField(
                            label: "Install Start",
                            date: _startDate,
                            onTap: () => _pickDate('start'),
                            cardBg: cardBg,
                            borderColor: borderColor,
                            textPrimary: textPrimary,
                            textSecondary: textSecondary,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: _buildDatePickerField(
                            label: "Install End",
                            date: _endDate,
                            onTap: () => _pickDate('end'),
                            cardBg: cardBg,
                            borderColor: borderColor,
                            textPrimary: textPrimary,
                            textSecondary: textSecondary,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: _buildDatePickerField(
                            label: "Handover",
                            date: _handoverDate,
                            onTap: () => _pickDate('handover'),
                            cardBg: cardBg,
                            borderColor: borderColor,
                            textPrimary: textPrimary,
                            textSecondary: textSecondary,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),

                    // Section 4: Project Notes
                    _buildSectionHeader("PROJECT NOTES & SPECIAL INSTRUCTIONS", textSecondary),
                    const SizedBox(height: 10),
                    TextFormField(
                      controller: _notesController,
                      maxLines: 3,
                      style: TextStyle(color: textPrimary, fontSize: 13),
                      decoration: const InputDecoration(
                        hintText: "Special installation notes, civil guidelines, customer requests...",
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Section 5: Commercial Contract & Handover Payment Sync
                    _buildSectionHeader("COMMERCIAL CONTRACT & HANDOVER PAYMENT SYNC", textSecondary),
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: borderColor),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              const Icon(Icons.info_outline_rounded, size: 14, color: AppColors.brandPrimary),
                              const SizedBox(width: 6),
                              Expanded(
                                child: Text(
                                  "Handover Lock: If Balance Due > 0, customer handover dossiers cannot be released.",
                                  style: TextStyle(fontSize: 11, color: textSecondary),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              Expanded(
                                child: TextFormField(
                                  controller: _totalCostController,
                                  keyboardType: TextInputType.number,
                                  style: TextStyle(color: textPrimary, fontSize: 13),
                                  decoration: const InputDecoration(
                                    labelText: "Total Cost (₹)",
                                    border: OutlineInputBorder(),
                                  ),
                                  onChanged: (_) => setState(() {}),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: TextFormField(
                                  controller: _amountReceivedController,
                                  keyboardType: TextInputType.number,
                                  style: TextStyle(color: textPrimary, fontSize: 13),
                                  decoration: const InputDecoration(
                                    labelText: "Received (₹)",
                                    border: OutlineInputBorder(),
                                  ),
                                  onChanged: (_) => setState(() {}),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 10),
                                  decoration: BoxDecoration(
                                    color: balanceDue > 0
                                        ? AppColors.errorRed.withValues(alpha: 0.1)
                                        : AppColors.emeraldGreen.withValues(alpha: 0.1),
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(
                                      color: balanceDue > 0
                                          ? AppColors.errorRed.withValues(alpha: 0.3)
                                          : AppColors.emeraldGreen.withValues(alpha: 0.3),
                                    ),
                                  ),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Text(
                                        "Balance Due",
                                        style: TextStyle(
                                          fontSize: 10,
                                          fontWeight: FontWeight.w600,
                                          color: balanceDue > 0 ? AppColors.errorRed : AppColors.emeraldGreen,
                                        ),
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        "₹${balanceDue.toStringAsFixed(0)}",
                                        style: TextStyle(
                                          fontSize: 13,
                                          fontWeight: FontWeight.w800,
                                          color: balanceDue > 0 ? AppColors.errorRed : AppColors.emeraldGreen,
                                        ),
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),
                  ],
                ),
              ),
            ),
          ),

          // Action Buttons
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            decoration: BoxDecoration(
              color: cardBg,
              border: Border(top: BorderSide(color: borderColor)),
            ),
            child: Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.of(context).pop(),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                    child: const Text("Cancel"),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: _isSaving ? null : _save,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF0F172A),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                    child: _isSaving
                        ? const SizedBox(
                            height: 16,
                            width: 16,
                            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                          )
                        : const Text("Save Changes", style: TextStyle(fontWeight: FontWeight.w700)),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title, Color color) {
    return Text(
      title,
      style: TextStyle(
        fontSize: 11,
        fontWeight: FontWeight.w800,
        color: color,
        letterSpacing: 0.5,
      ),
    );
  }

  Widget _buildDatePickerField({
    required String label,
    required DateTime? date,
    required VoidCallback onTap,
    required Color cardBg,
    required Color borderColor,
    required Color textPrimary,
    required Color textSecondary,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
        decoration: BoxDecoration(
          color: cardBg,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: borderColor),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: TextStyle(fontSize: 10, color: textSecondary, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 2),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  date != null ? DateFormat('dd/MM/yyyy').format(date) : "dd/mm/yyyy",
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: date != null ? FontWeight.w700 : FontWeight.w400,
                    color: date != null ? textPrimary : textSecondary,
                  ),
                ),
                Icon(Icons.calendar_today_rounded, size: 12, color: textSecondary),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
