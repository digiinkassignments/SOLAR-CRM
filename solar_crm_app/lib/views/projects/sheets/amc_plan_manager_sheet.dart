import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../../../models/warranty_amc_model.dart';
import '../../../providers/project_provider.dart';

class AmcPlanManagerSheet extends StatefulWidget {
  const AmcPlanManagerSheet({super.key});

  static Future<void> show(BuildContext context) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => const AmcPlanManagerSheet(),
    );
  }

  @override
  State<AmcPlanManagerSheet> createState() => _AmcPlanManagerSheetState();
}

class _AmcPlanManagerSheetState extends State<AmcPlanManagerSheet> {
  final _formKey = GlobalKey<FormState>();

  bool _isEditing = false;
  CompanyAmcPlanModel? _selectedPlan;

  final TextEditingController _nameCtrl = TextEditingController();
  final TextEditingController _annualAmountCtrl = TextEditingController();
  final TextEditingController _termMonthsCtrl = TextEditingController(text: "12");
  final TextEditingController _coverageCtrl = TextEditingController();
  final TextEditingController _exclusionsCtrl = TextEditingController();

  String _visitFrequency = "Quarterly";
  bool _isActive = true;

  bool _isSaving = false;
  String? _errorMessage;

  static const List<String> _frequencies = [
    "Monthly",
    "Quarterly",
    "Half-yearly",
    "Annual",
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ProjectProvider>().fetchCompanyAmcPlans();
    });
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _annualAmountCtrl.dispose();
    _termMonthsCtrl.dispose();
    _coverageCtrl.dispose();
    _exclusionsCtrl.dispose();
    super.dispose();
  }

  void _startCreateNew() {
    setState(() {
      _isEditing = true;
      _selectedPlan = null;
      _nameCtrl.text = "";
      _annualAmountCtrl.text = "";
      _visitFrequency = "Quarterly";
      _termMonthsCtrl.text = "12";
      _coverageCtrl.text = "";
      _exclusionsCtrl.text = "";
      _isActive = true;
      _errorMessage = null;
    });
  }

  void _startEditPlan(CompanyAmcPlanModel plan) {
    setState(() {
      _isEditing = true;
      _selectedPlan = plan;
      _nameCtrl.text = plan.name;
      _annualAmountCtrl.text = plan.annualAmount.toStringAsFixed(2);
      _visitFrequency = plan.visitFrequency;
      _termMonthsCtrl.text = plan.termMonths.toString();
      _coverageCtrl.text = plan.coverage ?? "";
      _exclusionsCtrl.text = plan.exclusions ?? "";
      _isActive = plan.isActive;
      _errorMessage = null;
    });
  }

  void _cancelEdit() {
    setState(() {
      _isEditing = false;
      _selectedPlan = null;
      _errorMessage = null;
    });
  }

  Future<void> _submitPlan() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isSaving = true;
      _errorMessage = null;
    });

    final annualAmt = double.tryParse(_annualAmountCtrl.text.trim()) ?? 0.0;
    final term = int.tryParse(_termMonthsCtrl.text.trim()) ?? 12;

    final data = <String, dynamic>{
      'name': _nameCtrl.text.trim(),
      'annual_amount': annualAmt,
      'visit_frequency': _visitFrequency,
      'term_months': term,
      'coverage': _coverageCtrl.text.trim(),
      'exclusions': _exclusionsCtrl.text.trim(),
      'is_active': _isActive,
    };

    if (_selectedPlan != null) {
      data['version'] = _selectedPlan!.version;
    }

    final provider = context.read<ProjectProvider>();
    final result = await provider.saveCompanyAmcPlan(
      data: data,
      planId: _selectedPlan?.id,
    );

    if (!mounted) return;
    setState(() => _isSaving = false);

    if (result['success'] == true) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(_selectedPlan != null ? "Plan updated successfully!" : "Plan created successfully!"),
          backgroundColor: const Color(0xFF10B981),
        ),
      );
      setState(() {
        _isEditing = false;
        _selectedPlan = null;
      });
    } else {
      setState(() {
        _errorMessage = result['message'] ?? "Failed to save plan.";
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bg = isDark ? const Color(0xFF0F172A) : Colors.white;
    final cardBg = isDark ? const Color(0xFF1E293B) : const Color(0xFFF8FAFC);
    final borderColor = isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0);
    final textPrimary = isDark ? Colors.white : const Color(0xFF0F172A);
    final textSecondary = isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B);
    final inputBg = isDark ? const Color(0xFF1E293B) : Colors.white;

    final provider = context.watch<ProjectProvider>();
    final plans = provider.companyAmcPlans;
    final isLoading = provider.isLoadingAmcPlans;

    return Container(
      height: MediaQuery.of(context).size.height * 0.90,
      decoration: BoxDecoration(
        color: bg,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        children: [
          // Drag Handle
          Center(
            child: Container(
              width: 36,
              height: 4,
              margin: const EdgeInsets.only(top: 10, bottom: 6),
              decoration: BoxDecoration(
                color: borderColor,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),

          // Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: [
                const Icon(Icons.support_agent_rounded, color: Color(0xFF3B82F6), size: 24),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        "Company AMC plans",
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                          color: textPrimary,
                        ),
                      ),
                      Text(
                        _isEditing
                            ? (_selectedPlan != null ? "Edit selected plan" : "Create a new company plan")
                            : "Define company-wide paid maintenance plans & fees",
                        style: TextStyle(fontSize: 11, color: textSecondary),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  onPressed: () => Navigator.of(context).pop(),
                  icon: const Icon(Icons.close_rounded, size: 20),
                  color: textSecondary,
                ),
              ],
            ),
          ),
          Divider(color: borderColor, height: 1),

          // Body Content
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: _isEditing
                  ? _buildEditForm(inputBg, borderColor, textPrimary, textSecondary, cardBg)
                  : _buildPlansList(plans, isLoading, cardBg, borderColor, textPrimary, textSecondary, isDark),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPlansList(
    List<CompanyAmcPlanModel> plans,
    bool isLoading,
    Color cardBg,
    Color borderColor,
    Color textPrimary,
    Color textSecondary,
    bool isDark,
  ) {
    final currencyFormatter = NumberFormat.currency(locale: 'en_IN', symbol: 'Rs ', decimalDigits: 0);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Subtitle Alert
        Text(
          "Create the plans your company offers. No plan is selected automatically. Changes apply to future selections; saved project contracts retain their agreed terms.",
          style: TextStyle(fontSize: 12, color: textSecondary, height: 1.35),
        ),
        const SizedBox(height: 14),

        // Create Plan Button
        ElevatedButton.icon(
          onPressed: _startCreateNew,
          icon: const Icon(Icons.add_rounded, size: 18),
          label: const Text(
            "Create AMC plan",
            style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
          ),
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF0F172A),
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          ),
        ),
        const SizedBox(height: 16),

        if (isLoading) ...[
          const Center(
            child: Padding(
              padding: EdgeInsets.symmetric(vertical: 40),
              child: CircularProgressIndicator(),
            ),
          ),
        ] else if (plans.isEmpty) ...[
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF0C1929) : const Color(0xFFEFF6FF),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: isDark ? const Color(0xFF1E3A8A) : const Color(0xFFBFDBFE)),
            ),
            child: Row(
              children: [
                Icon(Icons.info_outline_rounded, size: 18, color: isDark ? const Color(0xFF60A5FA) : const Color(0xFF2563EB)),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    "No company AMC plans yet. Create your first plan to make it available in Warranty & AMC.",
                    style: TextStyle(
                      fontSize: 12,
                      color: isDark ? const Color(0xFF93C5FD) : const Color(0xFF1E40AF),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ] else ...[
          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: plans.length,
            separatorBuilder: (context, index) => const SizedBox(height: 12),
            itemBuilder: (ctx, idx) {
              final plan = plans[idx];
              return Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: cardBg,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: borderColor),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Wrap(
                      spacing: 8,
                      runSpacing: 4,
                      crossAxisAlignment: WrapCrossAlignment.center,
                      alignment: WrapAlignment.spaceBetween,
                      children: [
                        Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              plan.name,
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w800,
                                color: textPrimary,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                              decoration: BoxDecoration(
                                color: plan.isActive
                                    ? (isDark ? const Color(0xFF064E3B) : const Color(0xFFDEF7EC))
                                    : (isDark ? const Color(0xFF334155) : const Color(0xFFF1F5F9)),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                plan.isActive ? "Active" : "Archived",
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w800,
                                  color: plan.isActive
                                      ? (isDark ? const Color(0xFF34D399) : const Color(0xFF03543F))
                                      : textSecondary,
                                ),
                              ),
                            ),
                          ],
                        ),
                        TextButton.icon(
                          onPressed: () => _startEditPlan(plan),
                          icon: const Icon(Icons.edit_note_rounded, size: 16),
                          label: const Text(
                            "Edit plan",
                            style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
                          ),
                          style: TextButton.styleFrom(
                            foregroundColor: const Color(0xFF3B82F6),
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            minimumSize: Size.zero,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),

                    Text(
                      "${currencyFormatter.format(plan.annualAmount)} / year · ${plan.visitFrequency} · ${plan.termMonths} months",
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: textPrimary,
                      ),
                    ),
                    const SizedBox(height: 6),

                    if (plan.coverage != null && plan.coverage!.isNotEmpty) ...[
                      Text(
                        plan.coverage!,
                        style: TextStyle(fontSize: 11, color: textSecondary, height: 1.35),
                      ),
                      const SizedBox(height: 6),
                    ],

                    if (plan.exclusions != null && plan.exclusions!.isNotEmpty) ...[
                      Text(
                        "Exclusions: ${plan.exclusions!}",
                        style: TextStyle(fontSize: 11, color: textSecondary, height: 1.35),
                      ),
                    ],
                  ],
                ),
              );
            },
          ),
        ],

        const SizedBox(height: 20),
        SizedBox(
          width: double.infinity,
          child: OutlinedButton(
            onPressed: () => Navigator.of(context).pop(),
            style: OutlinedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 12),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            child: const Text("Close", style: TextStyle(fontWeight: FontWeight.w700)),
          ),
        ),
      ],
    );
  }

  Widget _buildEditForm(
    Color inputBg,
    Color borderColor,
    Color textPrimary,
    Color textSecondary,
    Color cardBg,
  ) {
    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (_errorMessage != null) ...[
            Container(
              padding: const EdgeInsets.all(10),
              margin: const EdgeInsets.only(bottom: 12),
              decoration: BoxDecoration(
                color: const Color(0xFFFEF2F2),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0xFFFCA5A5)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.error_outline_rounded, size: 16, color: Color(0xFFDC2626)),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      _errorMessage!,
                      style: const TextStyle(fontSize: 12, color: Color(0xFFDC2626)),
                    ),
                  ),
                ],
              ),
            ),
          ],

          // Plan Name
          TextFormField(
            controller: _nameCtrl,
            style: TextStyle(color: textPrimary, fontSize: 13),
            maxLength: 60,
            validator: (v) => (v == null || v.trim().isEmpty) ? "Plan name is required" : null,
            decoration: InputDecoration(
              labelText: "Plan name *",
              labelStyle: TextStyle(color: textSecondary, fontSize: 12),
              filled: true,
              fillColor: inputBg,
              counterText: "",
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: borderColor)),
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: borderColor)),
            ),
          ),
          const SizedBox(height: 12),

          // Annual Fee & Frequency
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: TextFormField(
                  controller: _annualAmountCtrl,
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  style: TextStyle(color: textPrimary, fontSize: 13),
                  validator: (v) {
                    if (v == null || v.trim().isEmpty) return "Annual fee required";
                    if (double.tryParse(v.trim()) == null) return "Invalid number";
                    return null;
                  },
                  decoration: InputDecoration(
                    labelText: "Annual fee (Rs) *",
                    labelStyle: TextStyle(color: textSecondary, fontSize: 12),
                    prefixText: "Rs ",
                    prefixStyle: TextStyle(color: textSecondary, fontSize: 12),
                    filled: true,
                    fillColor: inputBg,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: borderColor)),
                    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: borderColor)),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: DropdownButtonFormField<String>(
                  isExpanded: true,
                  initialValue: _visitFrequency,
                  style: TextStyle(color: textPrimary, fontSize: 13),
                  dropdownColor: inputBg,
                  decoration: InputDecoration(
                    labelText: "Service frequency",
                    labelStyle: TextStyle(color: textSecondary, fontSize: 12),
                    filled: true,
                    fillColor: inputBg,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: borderColor)),
                    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: borderColor)),
                  ),
                  items: _frequencies
                      .map((f) => DropdownMenuItem(value: f, child: Text(f, overflow: TextOverflow.ellipsis)))
                      .toList(),
                  onChanged: (val) {
                    if (val != null) setState(() => _visitFrequency = val);
                  },
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Contract Term Months
          TextFormField(
            controller: _termMonthsCtrl,
            keyboardType: TextInputType.number,
            style: TextStyle(color: textPrimary, fontSize: 13),
            validator: (v) {
              if (v == null || v.trim().isEmpty) return "Contract term required";
              final num = int.tryParse(v.trim());
              if (num == null || num < 1 || num > 120) return "Term 1-120 months";
              return null;
            },
            decoration: InputDecoration(
              labelText: "Contract term (months) *",
              labelStyle: TextStyle(color: textSecondary, fontSize: 12),
              filled: true,
              fillColor: inputBg,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: borderColor)),
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: borderColor)),
            ),
          ),
          const SizedBox(height: 12),

          // Included Services / Coverage
          TextFormField(
            controller: _coverageCtrl,
            maxLines: 4,
            maxLength: 4000,
            style: TextStyle(color: textPrimary, fontSize: 12),
            validator: (v) => (v == null || v.trim().isEmpty) ? "Included services / coverage required" : null,
            decoration: InputDecoration(
              labelText: "Included services / coverage *",
              labelStyle: TextStyle(color: textSecondary, fontSize: 12),
              alignLabelWithHint: true,
              filled: true,
              fillColor: inputBg,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: borderColor)),
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: borderColor)),
            ),
          ),
          const SizedBox(height: 10),

          // Exclusions / Additional Terms
          TextFormField(
            controller: _exclusionsCtrl,
            maxLines: 3,
            maxLength: 4000,
            style: TextStyle(color: textPrimary, fontSize: 12),
            decoration: InputDecoration(
              labelText: "Exclusions / additional terms",
              labelStyle: TextStyle(color: textSecondary, fontSize: 12),
              alignLabelWithHint: true,
              filled: true,
              fillColor: inputBg,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: borderColor)),
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: borderColor)),
            ),
          ),
          const SizedBox(height: 10),

          // Active Switch
          SwitchListTile(
            contentPadding: EdgeInsets.zero,
            value: _isActive,
            title: Text(
              "Active — available for new contracts",
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: textPrimary),
            ),
            activeThumbColor: const Color(0xFF10B981),
            onChanged: (val) => setState(() => _isActive = val),
          ),
          const SizedBox(height: 6),

          // Info Banner
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: const Color(0xFFEFF6FF),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: const Color(0xFFBFDBFE)),
            ),
            child: Row(
              children: const [
                Icon(Icons.info_outline_rounded, size: 16, color: Color(0xFF2563EB)),
                SizedBox(width: 8),
                Expanded(
                  child: Text(
                    "Archive by switching Active off. Existing contracts keep their saved plan, price and coverage.",
                    style: TextStyle(fontSize: 11, color: Color(0xFF1E40AF)),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Action Buttons
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: _isSaving ? null : _cancelEdit,
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                  child: const Text("Cancel edit", style: TextStyle(fontWeight: FontWeight.w700)),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton(
                  onPressed: _isSaving ? null : _submitPlan,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF0F172A),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                  child: _isSaving
                      ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : const Text("Save plan", style: TextStyle(fontWeight: FontWeight.w700)),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }
}
