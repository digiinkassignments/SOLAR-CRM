import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/constants/app_typography.dart';
import '../../../../models/project_model.dart';
import '../../../../providers/project_provider.dart';

class NewProjectSheet extends StatefulWidget {
  const NewProjectSheet({super.key});

  static Future<void> show(BuildContext context) {
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => const NewProjectSheet(),
    );
  }

  @override
  State<NewProjectSheet> createState() => _NewProjectSheetState();
}

class _NewProjectSheetState extends State<NewProjectSheet> {
  final _formKey = GlobalKey<FormState>();

  String _linkSource = 'survey'; // 'survey' or 'manual'
  Map<String, dynamic>? _selectedSurvey;

  // Form Controllers
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _addressController = TextEditingController();
  final _cityController = TextEditingController();
  final _stateController = TextEditingController();
  final _pincodeController = TextEditingController();
  final _capacityController = TextEditingController(text: "3.0");
  final _panelCountController = TextEditingController();
  final _inverterKwController = TextEditingController();
  final _totalCostController = TextEditingController();
  final _amountReceivedController = TextEditingController();
  final _notesController = TextEditingController();

  String _selectedStage = 'Order Closed';
  int? _selectedEngineerId;
  int? _leadId;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final provider = Provider.of<ProjectProvider>(context, listen: false);
      provider.fetchEngineers();
      provider.fetchCompletedSurveys();
    });
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
    _totalCostController.dispose();
    _amountReceivedController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  void _onSurveySelected(Map<String, dynamic>? survey) {
    setState(() {
      _selectedSurvey = survey;
      if (survey != null) {
        _nameController.text = survey['customer_name']?.toString() ?? '';
        _phoneController.text = survey['mobile_number']?.toString() ?? '';
        _addressController.text = survey['address']?.toString() ?? '';
        _cityController.text = survey['city']?.toString() ?? '';
        _stateController.text = survey['state']?.toString() ?? '';
        _pincodeController.text = survey['pincode']?.toString() ?? '';
        _leadId = survey['lead_id'] is int ? survey['lead_id'] as int : int.tryParse(survey['lead_id']?.toString() ?? '');
        _capacityController.text = (survey['proposed_capacity_kw'] ?? survey['required_kw'] ?? '3.0').toString();
        _selectedStage = 'Pre-Install Inspection';
        if (survey['assigned_engineer_id'] != null) {
          _selectedEngineerId = survey['assigned_engineer_id'] is int
              ? survey['assigned_engineer_id'] as int
              : int.tryParse(survey['assigned_engineer_id'].toString());
        }
      }
    });
  }

  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate()) return;

    final provider = Provider.of<ProjectProvider>(context, listen: false);
    final messenger = ScaffoldMessenger.of(context);
    final nav = Navigator.of(context);

    final totalCost = double.tryParse(_totalCostController.text.trim()) ?? 0.0;
    final amountRec = double.tryParse(_amountReceivedController.text.trim()) ?? 0.0;
    final bal = totalCost > amountRec ? totalCost - amountRec : 0.0;

    final payload = <String, dynamic>{
      'customer_name': _nameController.text.trim(),
      'customer_phone': _phoneController.text.trim(),
      'customer_address': _addressController.text.trim(),
      'city': _cityController.text.trim(),
      'state': _stateController.text.trim(),
      'pincode': _pincodeController.text.trim(),
      'system_capacity_kw': double.tryParse(_capacityController.text.trim()) ?? 3.0,
      'panel_count': int.tryParse(_panelCountController.text.trim()),
      'inverter_kw': double.tryParse(_inverterKwController.text.trim()),
      'stage': _selectedStage,
      'total_cost': totalCost,
      'amount_received': amountRec,
      'payment_status': totalCost > 0 && bal == 0 ? 'Completed' : (amountRec > 0 ? 'Partial' : 'Pending'),
      if (_selectedEngineerId != null) 'assigned_to': _selectedEngineerId,
      if (_leadId != null) 'lead_id': _leadId,
      if (_notesController.text.trim().isNotEmpty) 'notes': _notesController.text.trim(),
    };

    final res = await provider.createProject(payload);

    if (res['success'] == true) {
      nav.pop();
      messenger.showSnackBar(
        SnackBar(
          backgroundColor: AppColors.emeraldGreen,
          content: Text(res['message']?.toString() ?? "Project created successfully!"),
        ),
      );
    } else {
      messenger.showSnackBar(
        SnackBar(
          backgroundColor: AppColors.errorRed,
          content: Text(res['message']?.toString() ?? "Failed to create project"),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? AppColors.darkCard : AppColors.lightCard;
    final textSecondary = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;

    final provider = Provider.of<ProjectProvider>(context);
    final engineers = provider.engineers;
    final surveys = provider.completedSurveys;

    final totalCost = double.tryParse(_totalCostController.text.trim()) ?? 0.0;
    final amountRec = double.tryParse(_amountReceivedController.text.trim()) ?? 0.0;
    final bal = totalCost > amountRec ? totalCost - amountRec : 0.0;

    return Container(
      height: MediaQuery.of(context).size.height * 0.90,
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkSurfaceElevated : AppColors.lightSurfaceElevated,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        children: [
          // Header Bar
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text("Create Solar Installation Project", style: AppTypography.headingSmall()),
                      const SizedBox(height: 2),
                      Text("PM Surya Ghar execution workflow", style: AppTypography.caption(color: textSecondary)),
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close_rounded),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
          ),
          const Divider(height: 1),

          // Scrollable Form
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // STEP 1: Link Source Toggle
                    _buildSectionHeader("STEP 1: LINK SOURCE & CUSTOMER", Icons.link_rounded),
                    const SizedBox(height: 10),
                    SegmentedButton<String>(
                      segments: const [
                        ButtonSegment(value: "survey", label: Text("From Completed Survey")),
                        ButtonSegment(value: "manual", label: Text("Manual Entry")),
                      ],
                      selected: {_linkSource},
                      onSelectionChanged: (val) => setState(() => _linkSource = val.first),
                    ),
                    const SizedBox(height: 12),

                    if (_linkSource == "survey") ...[
                      DropdownButtonFormField<Map<String, dynamic>>(
                        isExpanded: true,
                        decoration: const InputDecoration(
                          labelText: "Select Completed Site Survey *",
                          hintText: "Choose surveyed customer...",
                          border: OutlineInputBorder(),
                        ),
                        items: surveys.map((s) {
                          final cName = s['customer_name'] ?? 'Customer';
                          final cPhone = s['mobile_number'] ?? '';
                          final kw = s['proposed_capacity_kw'] ?? s['required_kw'] ?? 3.0;
                          return DropdownMenuItem<Map<String, dynamic>>(
                            value: s,
                            child: Text("$cName ($cPhone) • ${kw}kW", overflow: TextOverflow.ellipsis),
                          );
                        }).toList(),
                        onChanged: _onSurveySelected,
                        validator: (v) {
                          if (_linkSource == "survey" && _selectedSurvey == null) {
                            return "Please select a completed survey";
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 14),
                    ],

                    // STEP 2: Customer Site & Contact Info
                    _buildSectionHeader("STEP 2: CUSTOMER SITE & CONTACT INFO", Icons.location_on_outlined),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _nameController,
                      decoration: const InputDecoration(
                        labelText: "Customer Full Name *",
                        hintText: "e.g. Ramesh Kumar Sharma",
                        border: OutlineInputBorder(),
                      ),
                      validator: (v) => (v == null || v.trim().isEmpty) ? "Customer name is required" : null,
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _phoneController,
                      keyboardType: TextInputType.phone,
                      decoration: const InputDecoration(
                        labelText: "Customer Mobile Number *",
                        hintText: "e.g. 9876543210",
                        border: OutlineInputBorder(),
                      ),
                      validator: (v) => (v == null || v.trim().isEmpty) ? "Mobile number is required" : null,
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _addressController,
                      decoration: const InputDecoration(
                        labelText: "Installation Site Address",
                        hintText: "Plot 42, Sunrise Enclave, Sector 5",
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: TextFormField(
                            controller: _cityController,
                            decoration: const InputDecoration(labelText: "City", hintText: "Jaipur", border: OutlineInputBorder()),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: TextFormField(
                            controller: _stateController,
                            decoration: const InputDecoration(labelText: "State", hintText: "Rajasthan", border: OutlineInputBorder()),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: TextFormField(
                            controller: _pincodeController,
                            keyboardType: TextInputType.number,
                            decoration: const InputDecoration(labelText: "Pincode", hintText: "302021", border: OutlineInputBorder()),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),

                    // STEP 3: Solar Engineering Specs & Stage
                    _buildSectionHeader("STEP 3: SOLAR ENGINEERING SPECS", Icons.solar_power_outlined),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: TextFormField(
                            controller: _capacityController,
                            keyboardType: const TextInputType.numberWithOptions(decimal: true),
                            decoration: const InputDecoration(
                              labelText: "Capacity (kW) *",
                              hintText: "5.0",
                              border: OutlineInputBorder(),
                            ),
                            validator: (v) {
                              final d = double.tryParse(v ?? "");
                              if (d == null || d <= 0) return "Enter capacity";
                              return null;
                            },
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: TextFormField(
                            controller: _panelCountController,
                            keyboardType: TextInputType.number,
                            decoration: const InputDecoration(
                              labelText: "Panel Count",
                              hintText: "10 pcs",
                              border: OutlineInputBorder(),
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: TextFormField(
                            controller: _inverterKwController,
                            keyboardType: const TextInputType.numberWithOptions(decimal: true),
                            decoration: const InputDecoration(
                              labelText: "Inverter kW",
                              hintText: "5.0 kW",
                              border: OutlineInputBorder(),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<String>(
                      isExpanded: true,
                      initialValue: _selectedStage,
                      decoration: const InputDecoration(
                        labelText: "Initial Project Stage *",
                        border: OutlineInputBorder(),
                      ),
                      items: ProjectModel.stages.map((stg) {
                        return DropdownMenuItem(value: stg, child: Text(stg, overflow: TextOverflow.ellipsis));
                      }).toList(),
                      onChanged: (val) => setState(() => _selectedStage = val ?? 'Order Closed'),
                    ),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<int?>(
                      isExpanded: true,
                      initialValue: _selectedEngineerId,
                      decoration: const InputDecoration(
                        labelText: "Assign Site Engineer",
                        border: OutlineInputBorder(),
                      ),
                      items: [
                        const DropdownMenuItem<int?>(value: null, child: Text("Unassigned")),
                        ...engineers.map((e) {
                          final id = e['id'] is int ? e['id'] as int : int.tryParse(e['id'].toString()) ?? 0;
                          final name = e['full_name']?.toString() ?? 'Engineer';
                          return DropdownMenuItem<int?>(value: id, child: Text("$name (Site Engineer)", overflow: TextOverflow.ellipsis));
                        }),
                      ],
                      onChanged: (val) => setState(() => _selectedEngineerId = val),
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _notesController,
                      maxLines: 2,
                      decoration: const InputDecoration(
                        labelText: "Special Site Instructions / Notes",
                        hintText: "e.g. Structure elevated GI, shadow analysis verified...",
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 20),

                    // STEP 4: Commercial Contract & Payment Details
                    _buildSectionHeader("STEP 4: CONTRACT & PAYMENT", Icons.payments_outlined),
                    const SizedBox(height: 8),

                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: bal == 0 && totalCost > 0 ? const Color(0xFFDCFCE7) : const Color(0xFFFEF3C7),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            bal == 0 && totalCost > 0 ? Icons.check_circle_outline : Icons.info_outline,
                            color: bal == 0 && totalCost > 0 ? const Color(0xFF166534) : const Color(0xFF92400E),
                            size: 16,
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              totalCost == 0
                                  ? "Pending Valuation"
                                  : bal == 0
                                      ? "100% Paid (Eligible for Handover)"
                                      : "₹${bal.toStringAsFixed(0)} Pending Balance",
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                                color: bal == 0 && totalCost > 0 ? const Color(0xFF166534) : const Color(0xFF92400E),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),

                    Row(
                      children: [
                        Expanded(
                          child: TextFormField(
                            controller: _totalCostController,
                            keyboardType: TextInputType.number,
                            decoration: const InputDecoration(
                              labelText: "Total Cost (₹)",
                              prefixText: "₹ ",
                              border: OutlineInputBorder(),
                            ),
                            onChanged: (_) => setState(() {}),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: TextFormField(
                            controller: _amountReceivedController,
                            keyboardType: TextInputType.number,
                            decoration: const InputDecoration(
                              labelText: "Advance / Received (₹)",
                              prefixText: "₹ ",
                              border: OutlineInputBorder(),
                            ),
                            onChanged: (_) => setState(() {}),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 30),
                  ],
                ),
              ),
            ),
          ),

          // Bottom Submit Button
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: cardBg,
              border: Border(top: BorderSide(color: isDark ? Colors.grey[800]! : Colors.grey[200]!)),
            ),
            child: SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.brandPrimary,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                icon: provider.isSubmitting
                    ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : const Icon(Icons.add_task_rounded),
                label: Text(
                  provider.isSubmitting ? "Creating Project..." : "Create Solar Project",
                  style: AppTypography.button(),
                ),
                onPressed: provider.isSubmitting ? null : _handleSubmit,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title, IconData icon) {
    return Row(
      children: [
        Icon(icon, size: 16, color: AppColors.brandPrimary),
        const SizedBox(width: 6),
        Text(
          title,
          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w800, letterSpacing: 0.5),
        ),
      ],
    );
  }
}
