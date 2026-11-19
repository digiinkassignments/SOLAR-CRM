// lib/views/projects/sheets/warranty_amc_form_sheet.dart

import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../../models/project_model.dart';
import '../../../models/warranty_amc_model.dart';
import '../../../providers/project_provider.dart';

class WarrantyAmcFormSheet extends StatefulWidget {
  final ProjectModel project;
  final WarrantyAmcModel? existingWarranty;

  const WarrantyAmcFormSheet({
    super.key,
    required this.project,
    this.existingWarranty,
  });

  static Future<bool?> show(
    BuildContext context, {
    required ProjectModel project,
    WarrantyAmcModel? existingWarranty,
  }) {
    return showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => WarrantyAmcFormSheet(
        project: project,
        existingWarranty: existingWarranty,
      ),
    );
  }

  @override
  State<WarrantyAmcFormSheet> createState() => _WarrantyAmcFormSheetState();
}

class _WarrantyAmcFormSheetState extends State<WarrantyAmcFormSheet> {
  final _formKey = GlobalKey<FormState>();

  late TextEditingController _certNoController;
  late TextEditingController _warrantyStartDateController;
  late TextEditingController _freeServiceEndDateController;

  late TextEditingController _panelProductYrsController;
  late TextEditingController _panelProductEndController;
  late TextEditingController _panelPerformanceYrsController;
  late TextEditingController _panelPerformanceEndController;
  late TextEditingController _inverterYrsController;
  late TextEditingController _inverterEndController;
  late TextEditingController _workmanshipYrsController;
  late TextEditingController _workmanshipEndController;

  late TextEditingController _amcStartDateController;
  late TextEditingController _amcEndDateController;
  late TextEditingController _amcRenewalDateController;
  late TextEditingController _amcAmountController;

  late TextEditingController _panelSerialsController;
  late TextEditingController _inverterSerialController;
  late TextEditingController _monitoringUrlController;
  late TextEditingController _monitoringPlantIdController;
  late TextEditingController _monitoringUsernameController;

  int? _selectedPlanId;
  String? _selectedPlanName;
  Map<String, dynamic>? _selectedPlanSnapshot;
  String _visitFrequency = "Quarterly";
  String _amcPaymentStatus = "Pending";

  bool _isSaving = false;
  String? _validationError;

  final List<String> _frequencyOptions = ["Monthly", "Quarterly", "Half-yearly", "Annual"];
  final List<String> _paymentStatusOptions = ["Paid", "Pending", "Due"];

  @override
  void initState() {
    super.initState();
    final w = widget.existingWarranty;
    final p = widget.project;

    final defaultCert = w?.warrantyCertificateNo ??
        "WAR-${DateTime.now().year}-${p.id.toString().padLeft(4, '0')}";
    final defaultStart = w?.warrantyStartDate ??
        (p.completionDate != null
            ? DateFormat('yyyy-MM-dd').format(p.completionDate!)
            : DateFormat('yyyy-MM-dd').format(DateTime.now()));
    final defaultFreeEnd = w?.freeServiceEndDate ?? _addDaysToDate(defaultStart, 365);

    _certNoController = TextEditingController(text: defaultCert);
    _warrantyStartDateController = TextEditingController(text: defaultStart);
    _freeServiceEndDateController = TextEditingController(text: defaultFreeEnd);

    // Component durations
    final pProdYrs = w?.panelProductWarrantyYears?.toString() ?? "12";
    final pPerfYrs = w?.panelPerformanceWarrantyYears?.toString() ?? "25";
    final invYrs = w?.inverterWarrantyYears?.toString() ?? "5";
    final workYrs = w?.installationWarrantyYears?.toString() ?? "5";

    _panelProductYrsController = TextEditingController(text: pProdYrs);
    _panelProductEndController = TextEditingController(
      text: w?.panelProductWarrantyEnd ?? _addYearsToDate(defaultStart, int.tryParse(pProdYrs) ?? 12),
    );

    _panelPerformanceYrsController = TextEditingController(text: pPerfYrs);
    _panelPerformanceEndController = TextEditingController(
      text: w?.panelPerformanceWarrantyEnd ?? _addYearsToDate(defaultStart, int.tryParse(pPerfYrs) ?? 25),
    );

    _inverterYrsController = TextEditingController(text: invYrs);
    _inverterEndController = TextEditingController(
      text: w?.inverterWarrantyEnd ?? _addYearsToDate(defaultStart, int.tryParse(invYrs) ?? 5),
    );

    _workmanshipYrsController = TextEditingController(text: workYrs);
    _workmanshipEndController = TextEditingController(
      text: w?.installationWarrantyEnd ?? _addYearsToDate(defaultStart, int.tryParse(workYrs) ?? 5),
    );

    // AMC dates
    final amcStart = w?.amcStartDate ?? _addDaysToDate(defaultFreeEnd, 1);
    final amcEnd = w?.amcEndDate ?? _addYearsToDate(amcStart, 1);
    final amcRenewal = w?.amcRenewalDate ?? amcEnd;

    _amcStartDateController = TextEditingController(text: amcStart);
    _amcEndDateController = TextEditingController(text: amcEnd);
    _amcRenewalDateController = TextEditingController(text: amcRenewal);
    _amcAmountController = TextEditingController(text: w?.amcAmount != null ? w!.amcAmount!.toStringAsFixed(0) : "");

    _selectedPlanId = w?.amcPlanId;
    _selectedPlanName = w?.amcPlan;
    _selectedPlanSnapshot = w?.amcPlanSnapshot;
    _visitFrequency = w?.visitFrequency ?? "Quarterly";
    _amcPaymentStatus = w?.amcPaymentStatus ?? "Pending";

    // Serials & Monitoring
    _panelSerialsController = TextEditingController(text: w?.panelSerialNumbers ?? "");
    _inverterSerialController = TextEditingController(text: w?.inverterSerialNumber ?? "");
    _monitoringUrlController = TextEditingController(text: w?.monitoringPortalUrl ?? "");
    _monitoringPlantIdController = TextEditingController(text: w?.monitoringPlantId ?? "");
    _monitoringUsernameController = TextEditingController(text: w?.monitoringUsername ?? "");

    // Load company AMC plans
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ProjectProvider>().fetchCompanyAmcPlans();
    });
  }

  @override
  void dispose() {
    _certNoController.dispose();
    _warrantyStartDateController.dispose();
    _freeServiceEndDateController.dispose();

    _panelProductYrsController.dispose();
    _panelProductEndController.dispose();
    _panelPerformanceYrsController.dispose();
    _panelPerformanceEndController.dispose();
    _inverterYrsController.dispose();
    _inverterEndController.dispose();
    _workmanshipYrsController.dispose();
    _workmanshipEndController.dispose();

    _amcStartDateController.dispose();
    _amcEndDateController.dispose();
    _amcRenewalDateController.dispose();
    _amcAmountController.dispose();

    _panelSerialsController.dispose();
    _inverterSerialController.dispose();
    _monitoringUrlController.dispose();
    _monitoringPlantIdController.dispose();
    _monitoringUsernameController.dispose();
    super.dispose();
  }

  String _addYearsToDate(String baseDateStr, int years) {
    if (baseDateStr.isEmpty) return "";
    try {
      final d = DateTime.parse(baseDateStr);
      final newD = DateTime(d.year + years, d.month, d.day);
      return DateFormat('yyyy-MM-dd').format(newD);
    } catch (_) {
      return "";
    }
  }

  String _addDaysToDate(String baseDateStr, int days) {
    if (baseDateStr.isEmpty) return "";
    try {
      final d = DateTime.parse(baseDateStr);
      final newD = d.add(Duration(days: days));
      return DateFormat('yyyy-MM-dd').format(newD);
    } catch (_) {
      return "";
    }
  }

  void _onWarrantyStartDateChanged(String newStart) {
    setState(() {
      _warrantyStartDateController.text = newStart;
      final freeEnd = _addDaysToDate(newStart, 365);
      _freeServiceEndDateController.text = freeEnd;

      final prodYrs = int.tryParse(_panelProductYrsController.text) ?? 12;
      _panelProductEndController.text = _addYearsToDate(newStart, prodYrs);

      final perfYrs = int.tryParse(_panelPerformanceYrsController.text) ?? 25;
      _panelPerformanceEndController.text = _addYearsToDate(newStart, perfYrs);

      final invYrs = int.tryParse(_inverterYrsController.text) ?? 5;
      _inverterEndController.text = _addYearsToDate(newStart, invYrs);

      final workYrs = int.tryParse(_workmanshipYrsController.text) ?? 5;
      _workmanshipEndController.text = _addYearsToDate(newStart, workYrs);

      final amcStart = _addDaysToDate(freeEnd, 1);
      _amcStartDateController.text = amcStart;

      final months = _selectedPlanSnapshot?['term_months'] != null
          ? int.tryParse(_selectedPlanSnapshot!['term_months'].toString()) ?? 12
          : 12;
      final amcEnd = _addDaysToDate(amcStart, (months * 30.4).round());
      _amcEndDateController.text = amcEnd;
      _amcRenewalDateController.text = amcEnd;
    });
  }

  void _onSelectCompanyPlan(CompanyAmcPlanModel plan) {
    setState(() {
      _selectedPlanId = plan.id;
      _selectedPlanName = plan.name;
      _selectedPlanSnapshot = plan.toJson();
      _amcAmountController.text = plan.annualAmount.toStringAsFixed(0);
      _visitFrequency = plan.visitFrequency;

      final start = _amcStartDateController.text;
      if (start.isNotEmpty) {
        final end = _addDaysToDate(start, (plan.termMonths * 30.4).round());
        _amcEndDateController.text = end;
        _amcRenewalDateController.text = end;
      }
    });
  }

  Future<void> _pickDate(TextEditingController controller, {Function(String)? onChanged}) async {
    DateTime initial = DateTime.now();
    if (controller.text.isNotEmpty) {
      try {
        initial = DateTime.parse(controller.text);
      } catch (_) {}
    }

    final picked = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime(2020),
      lastDate: DateTime(2060),
    );

    if (picked != null) {
      final formatted = DateFormat('yyyy-MM-dd').format(picked);
      controller.text = formatted;
      if (onChanged != null) {
        onChanged(formatted);
      } else {
        setState(() {});
      }
    }
  }

  Future<void> _handleSave() async {
    setState(() => _validationError = null);

    if (_certNoController.text.trim().isEmpty) {
      setState(() => _validationError = "Warranty Certificate # is required.");
      return;
    }
    if (_warrantyStartDateController.text.trim().isEmpty) {
      setState(() => _validationError = "Warranty Start Date is required.");
      return;
    }
    if (_freeServiceEndDateController.text.trim().isEmpty) {
      setState(() => _validationError = "Free 1st-Year Service End Date is required.");
      return;
    }

    setState(() => _isSaving = true);

    try {
      final payload = {
        'warranty_certificate_no': _certNoController.text.trim(),
        'warranty_start_date': _warrantyStartDateController.text.trim(),
        'free_service_end_date': _freeServiceEndDateController.text.trim(),
        'panel_product_warranty_years': int.tryParse(_panelProductYrsController.text),
        'panel_product_warranty_end': _panelProductEndController.text.trim(),
        'panel_performance_warranty_years': int.tryParse(_panelPerformanceYrsController.text),
        'panel_performance_warranty_end': _panelPerformanceEndController.text.trim(),
        'inverter_warranty_years': int.tryParse(_inverterYrsController.text),
        'inverter_warranty_end': _inverterEndController.text.trim(),
        'installation_warranty_years': int.tryParse(_workmanshipYrsController.text),
        'installation_warranty_end': _workmanshipEndController.text.trim(),
        'amc_start_date': _amcStartDateController.text.trim(),
        'amc_end_date': _amcEndDateController.text.trim(),
        'amc_renewal_date': _amcRenewalDateController.text.trim(),
        'amc_plan': _selectedPlanName,
        'amc_plan_id': _selectedPlanId,
        'amc_plan_snapshot': _selectedPlanSnapshot,
        'amc_amount': _amcAmountController.text.trim().isNotEmpty ? double.tryParse(_amcAmountController.text.trim()) : null,
        'amc_payment_status': _amcPaymentStatus,
        'visit_frequency': _visitFrequency,
        'panel_serial_numbers': _panelSerialsController.text.trim(),
        'inverter_serial_number': _inverterSerialController.text.trim(),
        'monitoring_portal_url': _monitoringUrlController.text.trim(),
        'monitoring_plant_id': _monitoringPlantIdController.text.trim(),
        'monitoring_username': _monitoringUsernameController.text.trim(),
        'scheduled_visits': widget.existingWarranty?.scheduledVisits.map((e) => e.toJson()).toList() ?? [],
      };

      final provider = context.read<ProjectProvider>();
      final res = await provider.saveWarrantyAmc(widget.project.id, payload);

      if (mounted) {
        if (res['success'] == true) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(res['message'] ?? 'Warranty & AMC saved successfully!'),
              backgroundColor: const Color(0xFF10B981),
            ),
          );
          Navigator.of(context).pop(true);
        } else {
          setState(() {
            _validationError = res['message'] ?? 'Failed to save warranty details.';
          });
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _validationError = "Error: $e";
        });
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final cardBg = isDark ? const Color(0xFF141414) : Colors.white;
    final surfaceBg = isDark ? const Color(0xFF1E1E1E) : const Color(0xFFF8FAFC);
    final borderColor = isDark ? const Color(0xFF262626) : const Color(0xFFE2E8F0);
    final textPrimary = isDark ? const Color(0xFFF3F4F6) : const Color(0xFF0F172A);
    final textSecondary = isDark ? const Color(0xFF9CA3AF) : const Color(0xFF64748B);

    final provider = context.watch<ProjectProvider>();
    final companyPlans = provider.companyAmcPlans.where((p) => p.isActive).toList();

    return Container(
      height: MediaQuery.of(context).size.height * 0.92,
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF0A0A0A) : const Color(0xFFF1F5F9),
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        children: [
          // Drag handle
          Center(
            child: Container(
              margin: const EdgeInsets.symmetric(vertical: 10),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: borderColor,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),

          // Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF064E3B) : const Color(0xFFECFDF5),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(Icons.shield_rounded, color: Color(0xFF10B981), size: 20),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        "Update Warranty & AMC",
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: textPrimary),
                      ),
                      Text(
                        "${widget.project.projectNumber} • Multi-Component Lifecycle",
                        style: TextStyle(fontSize: 12, color: textSecondary),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  onPressed: () => Navigator.of(context).pop(),
                  icon: Icon(Icons.close_rounded, color: textSecondary),
                ),
              ],
            ),
          ),

          const Divider(height: 1),

          // Scrollable Form
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Inline Error Banner
                    if (_validationError != null) ...[
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFEF2F2),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: const Color(0xFFF87171)),
                        ),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Icon(Icons.error_outline_rounded, size: 18, color: Color(0xFFDC2626)),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                _validationError!,
                                style: const TextStyle(fontSize: 12, color: Color(0xFFDC2626), fontWeight: FontWeight.w600),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 14),
                    ],

                    // SECTION 1: WARRANTY CERTIFICATE & FREE SERVICE PERIOD
                    _buildSectionContainer(
                      title: "1. Warranty Certificate & Free Service Period",
                      icon: Icons.verified_outlined,
                      cardBg: cardBg,
                      borderColor: borderColor,
                      textPrimary: textPrimary,
                      children: [
                        _buildTextField(
                          controller: _certNoController,
                          label: "Warranty Certificate # *",
                          hint: "WAR-2026-0001",
                          surfaceBg: surfaceBg,
                          borderColor: borderColor,
                          textPrimary: textPrimary,
                          textSecondary: textSecondary,
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Expanded(
                              child: _buildDateField(
                                controller: _warrantyStartDateController,
                                label: "Warranty Start Date *",
                                surfaceBg: surfaceBg,
                                borderColor: borderColor,
                                textPrimary: textPrimary,
                                textSecondary: textSecondary,
                                onTap: () => _pickDate(
                                  _warrantyStartDateController,
                                  onChanged: _onWarrantyStartDateChanged,
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: _buildDateField(
                                controller: _freeServiceEndDateController,
                                label: "Free 1st-Yr Service Ends *",
                                surfaceBg: surfaceBg,
                                borderColor: borderColor,
                                textPrimary: textPrimary,
                                textSecondary: textSecondary,
                                onTap: () => _pickDate(_freeServiceEndDateController),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),

                    const SizedBox(height: 14),

                    // SECTION 2: MULTI-COMPONENT WARRANTY DURATIONS
                    _buildSectionContainer(
                      title: "2. Independent Component Warranties",
                      icon: Icons.view_compact_rounded,
                      cardBg: cardBg,
                      borderColor: borderColor,
                      textPrimary: textPrimary,
                      children: [
                        Text(
                          "Changing duration automatically recalculates valid until dates based on Warranty Start Date.",
                          style: TextStyle(fontSize: 11, color: textSecondary),
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Expanded(
                              child: _buildDurationField(
                                label: "Panel Product (Yrs)",
                                controller: _panelProductYrsController,
                                endController: _panelProductEndController,
                                surfaceBg: surfaceBg,
                                borderColor: borderColor,
                                textPrimary: textPrimary,
                                textSecondary: textSecondary,
                                accentColor: const Color(0xFF0284C7),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: _buildDurationField(
                                label: "Panel Power (Yrs)",
                                controller: _panelPerformanceYrsController,
                                endController: _panelPerformanceEndController,
                                surfaceBg: surfaceBg,
                                borderColor: borderColor,
                                textPrimary: textPrimary,
                                textSecondary: textSecondary,
                                accentColor: const Color(0xFF2563EB),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Expanded(
                              child: _buildDurationField(
                                label: "Inverter OEM (Yrs)",
                                controller: _inverterYrsController,
                                endController: _inverterEndController,
                                surfaceBg: surfaceBg,
                                borderColor: borderColor,
                                textPrimary: textPrimary,
                                textSecondary: textSecondary,
                                accentColor: const Color(0xFFD97706),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: _buildDurationField(
                                label: "EPC Workmanship (Yrs)",
                                controller: _workmanshipYrsController,
                                endController: _workmanshipEndController,
                                surfaceBg: surfaceBg,
                                borderColor: borderColor,
                                textPrimary: textPrimary,
                                textSecondary: textSecondary,
                                accentColor: const Color(0xFF059669),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),

                    const SizedBox(height: 14),

                    // SECTION 3: PAID AMC CONTRACT SETUP
                    _buildSectionContainer(
                      title: "3. Paid Annual Maintenance Contract (AMC) Setup",
                      icon: Icons.handshake_rounded,
                      cardBg: cardBg,
                      borderColor: borderColor,
                      textPrimary: textPrimary,
                      children: [
                        // Company AMC Plan Selector
                        Text(
                          "SELECT COMPANY AMC PLAN *",
                          style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: textSecondary),
                        ),
                        const SizedBox(height: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          decoration: BoxDecoration(
                            color: surfaceBg,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: borderColor),
                          ),
                          child: DropdownButtonHideUnderline(
                            child: DropdownButton<int>(
                              isExpanded: true,
                              value: companyPlans.any((p) => p.id == _selectedPlanId) ? _selectedPlanId : null,
                              hint: Text(
                                _selectedPlanName != null && _selectedPlanName!.isNotEmpty
                                    ? "$_selectedPlanName (Current)"
                                    : "Select company AMC plan",
                                style: TextStyle(fontSize: 13, color: textSecondary),
                              ),
                              dropdownColor: cardBg,
                              items: companyPlans.map((plan) {
                                return DropdownMenuItem<int>(
                                  value: plan.id,
                                  child: Text(
                                    "${plan.name} (₹${plan.annualAmount.toStringAsFixed(0)}/yr • ${plan.visitFrequency})",
                                    style: TextStyle(fontSize: 13, color: textPrimary),
                                  ),
                                );
                              }).toList(),
                              onChanged: (val) {
                                if (val != null) {
                                  final p = companyPlans.firstWhere((element) => element.id == val);
                                  _onSelectCompanyPlan(p);
                                }
                              },
                            ),
                          ),
                        ),

                        // Snapshot coverage banner
                        if (_selectedPlanSnapshot != null && _selectedPlanSnapshot!['coverage'] != null) ...[
                          const SizedBox(height: 10),
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: isDark ? const Color(0xFF0C1929) : const Color(0xFFEFF6FF),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: isDark ? const Color(0xFF1E3A8A) : const Color(0xFFBFDBFE)),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  _selectedPlanName ?? "Selected Plan",
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w800,
                                    color: isDark ? const Color(0xFF93C5FD) : const Color(0xFF1D4ED8),
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  _selectedPlanSnapshot!['coverage'].toString(),
                                  style: TextStyle(
                                    fontSize: 11,
                                    color: isDark ? const Color(0xFFBFDBFE) : const Color(0xFF1E40AF),
                                    height: 1.3,
                                  ),
                                ),
                                if (_selectedPlanSnapshot!['exclusions'] != null &&
                                    _selectedPlanSnapshot!['exclusions'].toString().isNotEmpty) ...[
                                  const SizedBox(height: 4),
                                  Text(
                                    "Exclusions: ${_selectedPlanSnapshot!['exclusions']}",
                                    style: TextStyle(
                                      fontSize: 10,
                                      fontStyle: FontStyle.italic,
                                      color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ),
                        ],

                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Expanded(
                              child: _buildDateField(
                                controller: _amcStartDateController,
                                label: "AMC Start Date *",
                                surfaceBg: surfaceBg,
                                borderColor: borderColor,
                                textPrimary: textPrimary,
                                textSecondary: textSecondary,
                                onTap: () => _pickDate(_amcStartDateController),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: _buildDateField(
                                controller: _amcEndDateController,
                                label: "AMC End Date *",
                                surfaceBg: surfaceBg,
                                borderColor: borderColor,
                                textPrimary: textPrimary,
                                textSecondary: textSecondary,
                                onTap: () => _pickDate(_amcEndDateController),
                              ),
                            ),
                          ],
                        ),

                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Expanded(
                              child: _buildDateField(
                                controller: _amcRenewalDateController,
                                label: "Renewal Date *",
                                surfaceBg: surfaceBg,
                                borderColor: borderColor,
                                textPrimary: textPrimary,
                                textSecondary: textSecondary,
                                onTap: () => _pickDate(_amcRenewalDateController),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: _buildDropdownField<String>(
                                label: "Service Frequency",
                                value: _visitFrequency,
                                items: _frequencyOptions,
                                surfaceBg: surfaceBg,
                                borderColor: borderColor,
                                cardBg: cardBg,
                                textPrimary: textPrimary,
                                textSecondary: textSecondary,
                                onChanged: (val) {
                                  if (val != null) setState(() => _visitFrequency = val);
                                },
                              ),
                            ),
                          ],
                        ),

                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Expanded(
                              child: _buildTextField(
                                controller: _amcAmountController,
                                label: "Annual Amount (₹) *",
                                hint: "e.g. 5000",
                                keyboardType: TextInputType.number,
                                surfaceBg: surfaceBg,
                                borderColor: borderColor,
                                textPrimary: textPrimary,
                                textSecondary: textSecondary,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: _buildDropdownField<String>(
                                label: "Payment Status",
                                value: _amcPaymentStatus,
                                items: _paymentStatusOptions,
                                surfaceBg: surfaceBg,
                                borderColor: borderColor,
                                cardBg: cardBg,
                                textPrimary: textPrimary,
                                textSecondary: textSecondary,
                                onChanged: (val) {
                                  if (val != null) setState(() => _amcPaymentStatus = val);
                                },
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),

                    const SizedBox(height: 14),

                    // SECTION 4: HARDWARE SERIALS & MONITORING CREDENTIALS
                    _buildSectionContainer(
                      title: "4. Component Serial Numbers & Monitoring Portal",
                      icon: Icons.memory_rounded,
                      cardBg: cardBg,
                      borderColor: borderColor,
                      textPrimary: textPrimary,
                      children: [
                        _buildTextField(
                          controller: _panelSerialsController,
                          label: "Solar Panel Serial Numbers",
                          hint: "Comma-separated or barcode IDs",
                          surfaceBg: surfaceBg,
                          borderColor: borderColor,
                          textPrimary: textPrimary,
                          textSecondary: textSecondary,
                        ),
                        const SizedBox(height: 12),
                        _buildTextField(
                          controller: _inverterSerialController,
                          label: "Inverter Serial Number",
                          hint: "e.g. INV-2026-99214",
                          surfaceBg: surfaceBg,
                          borderColor: borderColor,
                          textPrimary: textPrimary,
                          textSecondary: textSecondary,
                        ),
                        const SizedBox(height: 12),
                        _buildTextField(
                          controller: _monitoringUrlController,
                          label: "Monitoring Portal URL",
                          hint: "https://solarmanpv.com/...",
                          surfaceBg: surfaceBg,
                          borderColor: borderColor,
                          textPrimary: textPrimary,
                          textSecondary: textSecondary,
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Expanded(
                              child: _buildTextField(
                                controller: _monitoringPlantIdController,
                                label: "Plant ID",
                                hint: "e.g. 948123",
                                surfaceBg: surfaceBg,
                                borderColor: borderColor,
                                textPrimary: textPrimary,
                                textSecondary: textSecondary,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: _buildTextField(
                                controller: _monitoringUsernameController,
                                label: "Client Username",
                                hint: "e.g. mohit@gmail.com",
                                surfaceBg: surfaceBg,
                                borderColor: borderColor,
                                textPrimary: textPrimary,
                                textSecondary: textSecondary,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),

                    const SizedBox(height: 24),

                    // Save Button
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: _isSaving ? null : _handleSave,
                        icon: _isSaving
                            ? const SizedBox(
                                width: 18,
                                height: 18,
                                child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                              )
                            : const Icon(Icons.check_circle_rounded, size: 18),
                        label: Text(
                          _isSaving ? "Saving..." : "Save Warranty & AMC",
                          style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF0F172A),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                      ),
                    ),
                    const SizedBox(height: 30),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionContainer({
    required String title,
    required IconData icon,
    required Color cardBg,
    required Color borderColor,
    required Color textPrimary,
    required List<Widget> children,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: borderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 16, color: const Color(0xFFF59E0B)),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  title.toUpperCase(),
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w800,
                    color: textPrimary,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ...children,
        ],
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required String hint,
    required Color surfaceBg,
    required Color borderColor,
    required Color textPrimary,
    required Color textSecondary,
    TextInputType? keyboardType,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label.toUpperCase(),
          style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: textSecondary),
        ),
        const SizedBox(height: 6),
        Container(
          decoration: BoxDecoration(
            color: surfaceBg,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: borderColor),
          ),
          child: TextFormField(
            controller: controller,
            keyboardType: keyboardType,
            style: TextStyle(fontSize: 13, color: textPrimary, fontWeight: FontWeight.w600),
            decoration: InputDecoration(
              hintText: hint,
              hintStyle: TextStyle(fontSize: 12, color: textSecondary),
              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              border: InputBorder.none,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildDateField({
    required TextEditingController controller,
    required String label,
    required Color surfaceBg,
    required Color borderColor,
    required Color textPrimary,
    required Color textSecondary,
    required VoidCallback onTap,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label.toUpperCase(),
          style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: textSecondary),
        ),
        const SizedBox(height: 6),
        InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(8),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 11),
            decoration: BoxDecoration(
              color: surfaceBg,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: borderColor),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  controller.text.isNotEmpty ? controller.text : "YYYY-MM-DD",
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: controller.text.isNotEmpty ? textPrimary : textSecondary,
                  ),
                ),
                Icon(Icons.calendar_month_rounded, size: 16, color: textSecondary),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildDurationField({
    required String label,
    required TextEditingController controller,
    required TextEditingController endController,
    required Color surfaceBg,
    required Color borderColor,
    required Color textPrimary,
    required Color textSecondary,
    required Color accentColor,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label.toUpperCase(),
          style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: textSecondary),
        ),
        const SizedBox(height: 6),
        Container(
          decoration: BoxDecoration(
            color: surfaceBg,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: borderColor),
          ),
          child: TextFormField(
            controller: controller,
            keyboardType: TextInputType.number,
            style: TextStyle(fontSize: 13, color: textPrimary, fontWeight: FontWeight.w700),
            onChanged: (val) {
              final yrs = int.tryParse(val) ?? 0;
              final start = _warrantyStartDateController.text;
              if (start.isNotEmpty) {
                setState(() {
                  endController.text = _addYearsToDate(start, yrs);
                });
              }
            },
            decoration: const InputDecoration(
              contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              border: InputBorder.none,
            ),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          "Expires: ${endController.text.isNotEmpty ? endController.text : '—'}",
          style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: accentColor),
        ),
      ],
    );
  }

  Widget _buildDropdownField<T>({
    required String label,
    required T value,
    required List<T> items,
    required Color surfaceBg,
    required Color borderColor,
    required Color cardBg,
    required Color textPrimary,
    required Color textSecondary,
    required Function(T?) onChanged,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label.toUpperCase(),
          style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: textSecondary),
        ),
        const SizedBox(height: 6),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          decoration: BoxDecoration(
            color: surfaceBg,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: borderColor),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<T>(
              isExpanded: true,
              value: value,
              dropdownColor: cardBg,
              items: items.map((item) {
                return DropdownMenuItem<T>(
                  value: item,
                  child: Text(
                    item.toString(),
                    style: TextStyle(fontSize: 12, color: textPrimary, fontWeight: FontWeight.w600),
                  ),
                );
              }).toList(),
              onChanged: onChanged,
            ),
          ),
        ),
      ],
    );
  }
}

