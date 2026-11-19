import 'dart:convert';
import 'dart:io';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../../../core/constants/app_colors.dart';
import '../../../models/commissioning_model.dart';
import '../../../models/project_model.dart';
import '../../../providers/project_provider.dart';

class CommissioningFormSheet extends StatefulWidget {
  final ProjectModel project;
  final CommissioningModel? existingCommissioning;

  const CommissioningFormSheet({
    super.key,
    required this.project,
    this.existingCommissioning,
  });

  static Future<void> show(
    BuildContext context, {
    required ProjectModel project,
    CommissioningModel? existingCommissioning,
  }) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => CommissioningFormSheet(
        project: project,
        existingCommissioning: existingCommissioning,
      ),
    );
  }

  @override
  State<CommissioningFormSheet> createState() => _CommissioningFormSheetState();
}

class _CommissioningFormSheetState extends State<CommissioningFormSheet> {
  final _formKey = GlobalKey<FormState>();

  // Section 1 Controllers
  late TextEditingController _panelVoltCtrl;
  late TextEditingController _dcCurrentCtrl;
  late TextEditingController _inverterOutputCtrl;
  late TextEditingController _acVoltCtrl;
  late TextEditingController _meterSerialCtrl;
  late TextEditingController _meterImportCtrl;
  late TextEditingController _meterExportCtrl;
  late TextEditingController _genMeterCtrl;

  String _inverterDisplayStatus = "Normal / Generating";

  // Section 2 Tests & Measurements
  String _antiIslanding = "Pass";
  String _safetyShutdowns = "Pass";
  String _groundingCheck = "Pass";
  late TextEditingController _earthResistanceCtrl;
  String _wiringInsulation = "Pass";
  late TextEditingController _insulationResistanceCtrl;
  String _earthLeakage = "Pass";

  // Section 3 Result & Sign-Off
  String _overallResult = "Passed & Synchronized";
  late TextEditingController _commissionDateCtrl;
  late TextEditingController _engineerNameCtrl;
  late TextEditingController _certNumberCtrl;
  late TextEditingController _customerNameCtrl;
  late TextEditingController _remarksCtrl;

  bool _customerWitnessed = true;
  bool _engineerComplies = true;

  // Digital Signature State
  String? _signatureData;
  final List<Offset?> _sigPoints = [];
  bool _isSignaturePadConfirmed = false;
  int _activeSigTab = 0; // 0: Draw, 1: Upload

  bool _isSubmitting = false;
  String? _formErrorMessage;

  static const List<String> _inverterStatusOptions = [
    "Normal / Generating",
    "Normal / Generating (Green LCD)",
    "Standby / Waiting (Yellow LCD)",
    "Fault / Alarm (Red LCD)",
    "Grid Off / Islanded",
  ];

  static const List<String> _overallResultOptions = [
    "Passed & Synchronized",
    "Conditional Pass",
    "Failed",
    "Pending",
  ];

  @override
  void initState() {
    super.initState();
    final c = widget.existingCommissioning;
    final proj = widget.project;
    final nowStr = DateFormat('yyyy-MM-dd').format(DateTime.now());

    String cleanDate(String? s) {
      if (s == null || s.trim().isEmpty) return nowStr;
      final t = s.trim();
      if (t.contains('T')) return t.split('T')[0];
      if (t.length >= 10) return t.substring(0, 10);
      return t;
    }

    final autoCert = () {
      final pNum = proj.projectNumber.replaceAll(RegExp(r'[^A-Za-z0-9]'), '');
      final yr = DateTime.now().year;
      return "COMM-$pNum-$yr";
    }();

    _panelVoltCtrl = TextEditingController(text: c?.panelOutputVoltage?.toString() ?? "396.00");
    _dcCurrentCtrl = TextEditingController(text: c?.dcCurrentAmps?.toString() ?? "");
    _inverterOutputCtrl = TextEditingController(text: c?.inverterOutputKw?.toString() ?? (proj.inverterKw ?? proj.systemCapacityKw).toString());
    _inverterDisplayStatus = c?.inverterDisplayStatus ?? "Normal / Generating";
    _acVoltCtrl = TextEditingController(text: c?.acOutputVoltage?.toString() ?? "230.00");

    _meterSerialCtrl = TextEditingController(text: c?.meterSerialNumber ?? "230 V / JVVNL-NM-442076");
    _meterImportCtrl = TextEditingController(text: c?.netMeterImportKwh?.toString() ?? "0.40");
    _meterExportCtrl = TextEditingController(text: c?.netMeterExportKwh?.toString() ?? "1.20");
    _genMeterCtrl = TextEditingController(text: c?.generationMeterKwh?.toString() ?? "2.10");

    _antiIslanding = c?.antiIslandingTest ?? "Pass";
    _safetyShutdowns = c?.safetyShutdowns ?? "Pass";
    _groundingCheck = c?.groundingCheck ?? "Pass";
    _earthResistanceCtrl = TextEditingController(text: c?.earthResistanceOhm?.toString() ?? "2.50");
    _wiringInsulation = c?.wiringInsulation ?? "Pass";
    _insulationResistanceCtrl = TextEditingController(text: c?.insulationResistanceMohm?.toString() ?? "55.00");
    _earthLeakage = c?.earthLeakage ?? "Pass";

    _overallResult = c?.overallResult ?? "Passed & Synchronized";
    _commissionDateCtrl = TextEditingController(text: cleanDate(c?.commissionDate));
    _engineerNameCtrl = TextEditingController(text: c?.commissioningEngineer ?? proj.assignedToName ?? "Rakesh Singh Shekhawat");
    _certNumberCtrl = TextEditingController(text: c?.certificateNumber ?? autoCert);
    _customerNameCtrl = TextEditingController(text: c?.customerSignatureName ?? proj.customerName);
    _remarksCtrl = TextEditingController(text: c?.remarks ?? "System running normally, polarity and readings within limits, net meter reading correctly.");

    _customerWitnessed = c?.customerAcknowledged ?? true;
    _engineerComplies = c?.engineerSignoff ?? true;
    _signatureData = c?.signatureData;
    if (_signatureData != null && _signatureData!.isNotEmpty) {
      _isSignaturePadConfirmed = true;
    }
  }

  @override
  void dispose() {
    _panelVoltCtrl.dispose();
    _dcCurrentCtrl.dispose();
    _inverterOutputCtrl.dispose();
    _acVoltCtrl.dispose();
    _meterSerialCtrl.dispose();
    _meterImportCtrl.dispose();
    _meterExportCtrl.dispose();
    _genMeterCtrl.dispose();
    _earthResistanceCtrl.dispose();
    _insulationResistanceCtrl.dispose();
    _commissionDateCtrl.dispose();
    _engineerNameCtrl.dispose();
    _certNumberCtrl.dispose();
    _customerNameCtrl.dispose();
    _remarksCtrl.dispose();
    super.dispose();
  }

  void _checkAutoFollowOverallResult() {
    final tests = [_antiIslanding, _safetyShutdowns, _groundingCheck, _wiringInsulation, _earthLeakage];
    if (tests.any((t) => t == "Fail")) {
      setState(() => _overallResult = "Failed");
    } else if (tests.every((t) => t == "Pass")) {
      setState(() => _overallResult = "Passed & Synchronized");
    }
  }

  Future<void> _pickDate(TextEditingController ctrl) async {
    DateTime initial = DateTime.now();
    if (ctrl.text.isNotEmpty) {
      final parsed = DateTime.tryParse(ctrl.text);
      if (parsed != null) initial = parsed;
    }
    final picked = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime(2020),
      lastDate: DateTime(2035),
    );
    if (picked != null) {
      setState(() {
        ctrl.text = DateFormat('yyyy-MM-dd').format(picked);
      });
    }
  }

  Future<void> _renderSignatureToData() async {
    if (_sigPoints.isEmpty) return;
    try {
      final recorder = ui.PictureRecorder();
      final canvas = Canvas(recorder, const Rect.fromLTWH(0, 0, 400, 160));
      final paint = Paint()
        ..color = const Color(0xFF0F172A)
        ..strokeCap = StrokeCap.round
        ..strokeWidth = 3.0;

      for (int i = 0; i < _sigPoints.length - 1; i++) {
        if (_sigPoints[i] != null && _sigPoints[i + 1] != null) {
          canvas.drawLine(_sigPoints[i]!, _sigPoints[i + 1]!, paint);
        }
      }

      final pic = recorder.endRecording();
      final img = await pic.toImage(400, 160);
      final byteData = await img.toByteData(format: ui.ImageByteFormat.png);
      if (byteData != null) {
        final b64 = base64Encode(byteData.buffer.asUint8List());
        setState(() {
          _signatureData = "data:image/png;base64,$b64";
          _isSignaturePadConfirmed = true;
        });
      }
    } catch (e) {
      debugPrint("Error rendering signature: $e");
    }
  }

  Future<void> _pickSignatureImage() async {
    try {
      final picker = ImagePicker();
      final img = await picker.pickImage(source: ImageSource.gallery, imageQuality: 75);
      if (img != null) {
        final bytes = await File(img.path).readAsBytes();
        final b64 = base64Encode(bytes);
        setState(() {
          _signatureData = "data:image/png;base64,$b64";
          _isSignaturePadConfirmed = true;
        });
      }
    } catch (e) {
      debugPrint("pickSignatureImage error: $e");
    }
  }

  Future<void> _saveCommissioning() async {
    setState(() => _formErrorMessage = null);

    if (!_formKey.currentState!.validate()) {
      setState(() => _formErrorMessage = "Please complete all required fields highlighted in red.");
      return;
    }

    if (_engineerNameCtrl.text.trim().isEmpty) {
      setState(() => _formErrorMessage = "Please enter the Testing Engineer's name.");
      return;
    }

    if (_certNumberCtrl.text.trim().isEmpty) {
      setState(() => _formErrorMessage = "Please enter Certificate Number.");
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      final cleanDate = _commissionDateCtrl.text.trim().contains('T')
          ? _commissionDateCtrl.text.trim().split('T')[0]
          : (_commissionDateCtrl.text.trim().length >= 10
              ? _commissionDateCtrl.text.trim().substring(0, 10)
              : _commissionDateCtrl.text.trim());

      final payload = {
        'panel_output_voltage': double.tryParse(_panelVoltCtrl.text.trim()),
        'dc_current_amps': double.tryParse(_dcCurrentCtrl.text.trim()),
        'inverter_output_kw': double.tryParse(_inverterOutputCtrl.text.trim()),
        'inverter_display_status': _inverterDisplayStatus,
        'ac_output_voltage': double.tryParse(_acVoltCtrl.text.trim()),

        'meter_serial_number': _meterSerialCtrl.text.trim(),
        'net_meter_import_kwh': double.tryParse(_meterImportCtrl.text.trim()),
        'net_meter_export_kwh': double.tryParse(_meterExportCtrl.text.trim()),
        'generation_meter_kwh': double.tryParse(_genMeterCtrl.text.trim()),
        'meter_reading_kwh': double.tryParse(_genMeterCtrl.text.trim()),

        'safety_shutdowns': _safetyShutdowns,
        'anti_islanding_test': _antiIslanding,
        'grounding_check': _groundingCheck,
        'earth_resistance_ohm': double.tryParse(_earthResistanceCtrl.text.trim()),
        'wiring_insulation': _wiringInsulation,
        'insulation_resistance_mohm': double.tryParse(_insulationResistanceCtrl.text.trim()),
        'earth_leakage': _earthLeakage,

        'overall_result': _overallResult,
        'commission_date': cleanDate,
        'commissioning_engineer': _engineerNameCtrl.text.trim(),
        'certificate_number': _certNumberCtrl.text.trim(),
        'remarks': _remarksCtrl.text.trim(),

        'customer_signature_name': _customerNameCtrl.text.trim(),
        'customer_acknowledged': _customerWitnessed ? 1 : 0,
        'engineer_signoff': _engineerComplies ? 1 : 0,
        'signature_data': _signatureData,
      };

      final provider = Provider.of<ProjectProvider>(context, listen: false);
      final isUpdate = widget.existingCommissioning != null && widget.existingCommissioning!.id != null;

      final res = await provider.saveCommissioning(
        widget.project.id,
        payload,
        isUpdate: isUpdate,
      );

      if (mounted) {
        if (res['success'] == true) {
          Navigator.of(context).pop();
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(res['message'] ?? "Commissioning certificate saved successfully!"),
              backgroundColor: AppColors.emeraldGreen,
            ),
          );
        } else {
          setState(() {
            _formErrorMessage = res['message'] ?? "Failed to save commissioning report.";
          });
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _formErrorMessage = "Error saving report: $e";
        });
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? const Color(0xFF141414) : Colors.white;
    final surfaceBg = isDark ? const Color(0xFF000000) : const Color(0xFFF8FAFC);
    final borderColor = isDark ? const Color(0xFF262626) : const Color(0xFFE2E8F0);
    final textPrimary = isDark ? const Color(0xFFF8FAFC) : const Color(0xFF0F172A);
    final textSecondary = isDark ? const Color(0xFF94A3B8) : const Color(0xFF475569);

    final inverterKw = widget.project.inverterKw ?? widget.project.systemCapacityKw;

    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.94,
      ),
      decoration: BoxDecoration(
        color: surfaceBg,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        border: Border(
          top: BorderSide(color: borderColor, width: 1.5),
        ),
      ),
      child: SafeArea(
        top: false,
        child: Column(
          children: [
            // Handle Bar
            Center(
              child: Container(
                margin: const EdgeInsets.only(top: 10, bottom: 8),
                width: 44,
                height: 4,
                decoration: BoxDecoration(
                  color: isDark ? Colors.white24 : Colors.grey.shade300,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),

            // Header Row
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          "Functional & Electrical Commissioning Form",
                          style: TextStyle(
                            fontSize: 15.5,
                            fontWeight: FontWeight.w800,
                            color: textPrimary,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 2),
                        Text(
                          "Project: ${widget.project.projectNumber} • System: ${widget.project.systemCapacityKw} kW • Inverter: $inverterKw kW",
                          style: TextStyle(fontSize: 11.5, color: textSecondary, fontWeight: FontWeight.w500),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.of(context).pop(),
                    icon: Icon(Icons.close_rounded, color: textSecondary, size: 22),
                    splashRadius: 20,
                  ),
                ],
              ),
            ),
            Divider(height: 1, color: borderColor),

            // Form Body
            Expanded(
              child: Form(
                key: _formKey,
                child: ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    // Form Error Banner (Appears inside the form)
                    if (_formErrorMessage != null)
                      Container(
                        margin: const EdgeInsets.only(bottom: 14),
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                        decoration: BoxDecoration(
                          color: const Color(0xFF7F1D1D).withValues(alpha: 0.25),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: const Color(0xFFEF4444)),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.error_outline_rounded, color: Color(0xFFEF4444), size: 18),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                _formErrorMessage!,
                                style: const TextStyle(
                                  color: Color(0xFFFCA5A5),
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                            IconButton(
                              onPressed: () => setState(() => _formErrorMessage = null),
                              icon: const Icon(Icons.close, size: 16, color: Color(0xFFFCA5A5)),
                              padding: EdgeInsets.zero,
                              constraints: const BoxConstraints(),
                            ),
                          ],
                        ),
                      ),

                    // ==========================================
                    // SECTION 1: DC/AC ELECTRICAL READINGS & NET METER
                    // ==========================================
                    _buildSectionCard(
                      title: "SECTION 1: DC/AC ELECTRICAL READINGS & NET METER",
                      icon: Icons.electric_bolt_rounded,
                      cardBg: cardBg,
                      borderColor: borderColor,
                      textPrimary: textPrimary,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Expanded(
                                child: _buildNumberInput(
                                  label: "DC String Voltage (V) *",
                                  hint: "e.g. 396.00",
                                  helper: "Total open-circuit voltage Voc of module strings",
                                  controller: _panelVoltCtrl,
                                  isDark: isDark,
                                  borderColor: borderColor,
                                  textPrimary: textPrimary,
                                  textSecondary: textSecondary,
                                  required: true,
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: _buildNumberInput(
                                  label: "Operating DC Current (A)",
                                  hint: "e.g. 11.0",
                                  helper: "Operating DC current during peak sunlight",
                                  controller: _dcCurrentCtrl,
                                  isDark: isDark,
                                  borderColor: borderColor,
                                  textPrimary: textPrimary,
                                  textSecondary: textSecondary,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 14),

                          Row(
                            children: [
                              Expanded(
                                child: _buildNumberInput(
                                  label: "Inverter Output Power (kW) *",
                                  hint: "e.g. 3.50",
                                  helper: "Inverter rating: $inverterKw kW",
                                  controller: _inverterOutputCtrl,
                                  isDark: isDark,
                                  borderColor: borderColor,
                                  textPrimary: textPrimary,
                                  textSecondary: textSecondary,
                                  required: true,
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text("Inverter Display Status", style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700, color: textPrimary)),
                                    const SizedBox(height: 6),
                                    Container(
                                      height: 48,
                                      padding: const EdgeInsets.symmetric(horizontal: 10),
                                      decoration: BoxDecoration(
                                        color: isDark ? const Color(0xFF1E1E1E) : Colors.white,
                                        borderRadius: BorderRadius.circular(8),
                                        border: Border.all(color: borderColor),
                                      ),
                                      child: DropdownButtonHideUnderline(
                                        child: DropdownButton<String>(
                                          value: _inverterStatusOptions.contains(_inverterDisplayStatus)
                                              ? _inverterDisplayStatus
                                              : _inverterStatusOptions[0],
                                          isExpanded: true,
                                          dropdownColor: cardBg,
                                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: textPrimary),
                                          items: _inverterStatusOptions.map((opt) {
                                            return DropdownMenuItem(value: opt, child: Text(opt, overflow: TextOverflow.ellipsis));
                                          }).toList(),
                                          onChanged: (val) {
                                            if (val != null) setState(() => _inverterDisplayStatus = val);
                                          },
                                        ),
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Text("LCD indicator status", style: TextStyle(fontSize: 10, color: textSecondary)),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 14),

                          Row(
                            children: [
                              Expanded(
                                child: _buildNumberInput(
                                  label: "AC Grid Output Voltage (V) *",
                                  hint: "e.g. 230.00",
                                  helper: "Normal: 210V - 245V (Single Phase)",
                                  controller: _acVoltCtrl,
                                  isDark: isDark,
                                  borderColor: borderColor,
                                  textPrimary: textPrimary,
                                  textSecondary: textSecondary,
                                  required: true,
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: _buildTextInput(
                                  label: "Net Meter Serial Number",
                                  hint: "e.g. 230 V / JVVNL-NM-442076",
                                  helper: "Serial printed on DISCOM net meter plate",
                                  controller: _meterSerialCtrl,
                                  isDark: isDark,
                                  borderColor: borderColor,
                                  textPrimary: textPrimary,
                                  textSecondary: textSecondary,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 14),

                          Row(
                            children: [
                              Expanded(
                                child: _buildNumberInput(
                                  label: "Net Meter Import (kWh)",
                                  hint: "0.40",
                                  helper: "Energy consumed from grid",
                                  controller: _meterImportCtrl,
                                  isDark: isDark,
                                  borderColor: borderColor,
                                  textPrimary: textPrimary,
                                  textSecondary: textSecondary,
                                ),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: _buildNumberInput(
                                  label: "Net Meter Export (kWh)",
                                  hint: "1.20",
                                  helper: "Solar energy sent to grid",
                                  controller: _meterExportCtrl,
                                  isDark: isDark,
                                  borderColor: borderColor,
                                  textPrimary: textPrimary,
                                  textSecondary: textSecondary,
                                ),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: _buildNumberInput(
                                  label: "Solar Generation Baseline",
                                  hint: "2.10",
                                  helper: "Cumulative solar generation",
                                  controller: _genMeterCtrl,
                                  isDark: isDark,
                                  borderColor: borderColor,
                                  textPrimary: textPrimary,
                                  textSecondary: textSecondary,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 16),

                    // ==========================================
                    // SECTION 2: ANTI-ISLANDING & SAFETY PROTECTION TESTS
                    // ==========================================
                    _buildSectionCard(
                      title: "SECTION 2: ANTI-ISLANDING & SAFETY PROTECTION TESTS",
                      icon: Icons.shield_outlined,
                      cardBg: cardBg,
                      borderColor: borderColor,
                      textPrimary: textPrimary,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            "Verify electrical cutoff thresholds and insulation readings. Tests default to unselected to prevent accidental approval.",
                            style: TextStyle(fontSize: 11, color: textSecondary, height: 1.3),
                          ),
                          const SizedBox(height: 12),

                          // Anti-Islanding Protection Test
                          _buildTestCard(
                            label: "Anti-Islanding Protection Test *",
                            helper: "Inverter switches off within 2 seconds upon grid power failure (IEEE 1547 / CEA)",
                            value: _antiIslanding,
                            isDark: isDark,
                            borderColor: borderColor,
                            textPrimary: textPrimary,
                            onChanged: (val) {
                              setState(() => _antiIslanding = val);
                              _checkAutoFollowOverallResult();
                            },
                          ),
                          const SizedBox(height: 10),

                          // Emergency AC/DC Isolator Trip Test
                          _buildTestCard(
                            label: "Emergency AC/DC Isolator Trip Test",
                            helper: "Manual rotary isolators trip and disconnect cleanly",
                            value: _safetyShutdowns,
                            isDark: isDark,
                            borderColor: borderColor,
                            textPrimary: textPrimary,
                            onChanged: (val) {
                              setState(() => _safetyShutdowns = val);
                              _checkAutoFollowOverallResult();
                            },
                          ),
                          const SizedBox(height: 10),

                          // Grounding Continuity & Earth Resistance
                          _buildMeasurementTestCard(
                            label: "Grounding Continuity & Earth Resistance",
                            testValue: _groundingCheck,
                            measurementLabel: "Earth Resistance (Ohms)",
                            measurementHelper: "Standard requirement: < 5.0 Ω",
                            controller: _earthResistanceCtrl,
                            isDark: isDark,
                            borderColor: borderColor,
                            textPrimary: textPrimary,
                            textSecondary: textSecondary,
                            onTestChanged: (val) {
                              setState(() => _groundingCheck = val);
                              _checkAutoFollowOverallResult();
                            },
                          ),
                          const SizedBox(height: 10),

                          // Wiring Insulation & Megger Resistance
                          _buildMeasurementTestCard(
                            label: "Wiring Insulation & Megger Resistance",
                            testValue: _wiringInsulation,
                            measurementLabel: "Insulation Resistance (MΩ)",
                            measurementHelper: "Standard requirement: > 1.0 MΩ (Megger test)",
                            controller: _insulationResistanceCtrl,
                            isDark: isDark,
                            borderColor: borderColor,
                            textPrimary: textPrimary,
                            textSecondary: textSecondary,
                            onTestChanged: (val) {
                              setState(() => _wiringInsulation = val);
                              _checkAutoFollowOverallResult();
                            },
                          ),
                          const SizedBox(height: 10),

                          // Earth Leakage / Residual Current (RCD)
                          _buildTestCard(
                            label: "Earth Leakage / Residual Current (RCD)",
                            helper: "RCD trips within 300ms on residual current leakage",
                            value: _earthLeakage,
                            isDark: isDark,
                            borderColor: borderColor,
                            textPrimary: textPrimary,
                            onChanged: (val) {
                              setState(() => _earthLeakage = val);
                              _checkAutoFollowOverallResult();
                            },
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 16),

                    // ==========================================
                    // SECTION 3: COMMISSIONING RESULT & ENGINEERING SIGN-OFF
                    // ==========================================
                    _buildSectionCard(
                      title: "SECTION 3: COMMISSIONING RESULT & ENGINEERING SIGN-OFF",
                      icon: Icons.assignment_turned_in_outlined,
                      cardBg: cardBg,
                      borderColor: borderColor,
                      textPrimary: textPrimary,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text("Overall Technical Result *", style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700, color: textPrimary)),
                                    const SizedBox(height: 6),
                                    Container(
                                      height: 48,
                                      padding: const EdgeInsets.symmetric(horizontal: 10),
                                      decoration: BoxDecoration(
                                        color: isDark ? const Color(0xFF1E1E1E) : Colors.white,
                                        borderRadius: BorderRadius.circular(8),
                                        border: Border.all(color: borderColor),
                                      ),
                                      child: DropdownButtonHideUnderline(
                                        child: DropdownButton<String>(
                                          value: _overallResultOptions.contains(_overallResult) ? _overallResult : _overallResultOptions[0],
                                          isExpanded: true,
                                          dropdownColor: cardBg,
                                          style: TextStyle(
                                            fontSize: 12.5,
                                            fontWeight: FontWeight.w800,
                                            color: _overallResult.contains("Passed")
                                                ? AppColors.emeraldGreen
                                                : (_overallResult == "Failed" ? AppColors.errorRed : const Color(0xFFF59E0B)),
                                          ),
                                          items: _overallResultOptions.map((opt) {
                                            return DropdownMenuItem(value: opt, child: Text(opt, overflow: TextOverflow.ellipsis));
                                          }).toList(),
                                          onChanged: (val) {
                                            if (val != null) setState(() => _overallResult = val);
                                          },
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: _buildDateField(
                                  label: "Commissioning Date *",
                                  controller: _commissionDateCtrl,
                                  isDark: isDark,
                                  borderColor: borderColor,
                                  textPrimary: textPrimary,
                                  textSecondary: textSecondary,
                                  onTap: () => _pickDate(_commissionDateCtrl),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 14),

                          Row(
                            children: [
                              Expanded(
                                child: _buildTextInput(
                                  label: "Commissioning Engineer Name *",
                                  hint: "e.g. Rakesh Singh Shekhawat",
                                  controller: _engineerNameCtrl,
                                  isDark: isDark,
                                  borderColor: borderColor,
                                  textPrimary: textPrimary,
                                  textSecondary: textSecondary,
                                  required: true,
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: _buildTextInput(
                                  label: "Certificate Number *",
                                  hint: "COMM-PROJ-2026",
                                  helper: "Auto-generated unique serial number",
                                  controller: _certNumberCtrl,
                                  isDark: isDark,
                                  borderColor: borderColor,
                                  textPrimary: textPrimary,
                                  textSecondary: textSecondary,
                                  required: true,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 14),

                          _buildTextInput(
                            label: "Customer / Representative Sign-Off",
                            hint: "Customer name or site representative",
                            controller: _customerNameCtrl,
                            isDark: isDark,
                            borderColor: borderColor,
                            textPrimary: textPrimary,
                            textSecondary: textSecondary,
                          ),
                          const SizedBox(height: 12),

                          // Verification Checkboxes
                          CheckboxListTile(
                            value: _customerWitnessed,
                            onChanged: (val) => setState(() => _customerWitnessed = val ?? true),
                            title: Text("Customer witnessed generation demonstration", style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: textPrimary)),
                            controlAffinity: ListTileControlAffinity.leading,
                            contentPadding: EdgeInsets.zero,
                            dense: true,
                            activeColor: AppColors.emeraldGreen,
                          ),
                          CheckboxListTile(
                            value: _engineerComplies,
                            onChanged: (val) => setState(() => _engineerComplies = val ?? true),
                            title: Text("Engineer verifies compliance with CEA / DISCOM rules", style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: textPrimary)),
                            controlAffinity: ListTileControlAffinity.leading,
                            contentPadding: EdgeInsets.zero,
                            dense: true,
                            activeColor: AppColors.emeraldGreen,
                          ),

                          const SizedBox(height: 14),

                          // Signature Box
                          Text("Customer / Representative Signature (Draw or Upload)", style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700, color: textPrimary)),
                          const SizedBox(height: 8),

                          // Tab bar for Draw vs Upload
                          Container(
                            decoration: BoxDecoration(
                              color: isDark ? const Color(0xFF1E1E1E) : const Color(0xFFF1F5F9),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            padding: const EdgeInsets.all(3),
                            child: Row(
                              children: [
                                Expanded(
                                  child: InkWell(
                                    onTap: () => setState(() => _activeSigTab = 0),
                                    borderRadius: BorderRadius.circular(6),
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(vertical: 7),
                                      decoration: BoxDecoration(
                                        color: _activeSigTab == 0 ? (isDark ? const Color(0xFF2E2E2E) : Colors.white) : Colors.transparent,
                                        borderRadius: BorderRadius.circular(6),
                                        boxShadow: _activeSigTab == 0 ? [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 2)] : null,
                                      ),
                                      alignment: Alignment.center,
                                      child: Row(
                                        mainAxisAlignment: MainAxisAlignment.center,
                                        children: [
                                          Icon(Icons.draw_rounded, size: 14, color: _activeSigTab == 0 ? AppColors.brandPrimary : textSecondary),
                                          const SizedBox(width: 6),
                                          Text("Sign on Screen (Pad)", style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700, color: _activeSigTab == 0 ? textPrimary : textSecondary)),
                                        ],
                                      ),
                                    ),
                                  ),
                                ),
                                Expanded(
                                  child: InkWell(
                                    onTap: () {
                                      setState(() => _activeSigTab = 1);
                                      _pickSignatureImage();
                                    },
                                    borderRadius: BorderRadius.circular(6),
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(vertical: 7),
                                      decoration: BoxDecoration(
                                        color: _activeSigTab == 1 ? (isDark ? const Color(0xFF2E2E2E) : Colors.white) : Colors.transparent,
                                        borderRadius: BorderRadius.circular(6),
                                        boxShadow: _activeSigTab == 1 ? [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 2)] : null,
                                      ),
                                      alignment: Alignment.center,
                                      child: Row(
                                        mainAxisAlignment: MainAxisAlignment.center,
                                        children: [
                                          Icon(Icons.upload_file_rounded, size: 14, color: _activeSigTab == 1 ? AppColors.brandPrimary : textSecondary),
                                          const SizedBox(width: 6),
                                          Text("Upload Signature Image", style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700, color: _activeSigTab == 1 ? textPrimary : textSecondary)),
                                        ],
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),

                          const SizedBox(height: 8),

                          // Signature canvas / preview card
                          Container(
                            height: 140,
                            width: double.infinity,
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(
                                color: _isSignaturePadConfirmed ? AppColors.emeraldGreen : borderColor,
                                width: _isSignaturePadConfirmed ? 1.5 : 1.0,
                              ),
                            ),
                            child: Stack(
                              children: [
                                if (_signatureData != null && _signatureData!.isNotEmpty)
                                  Center(
                                    child: Image.memory(
                                      base64Decode(_signatureData!.contains(',') ? _signatureData!.split(',')[1] : _signatureData!),
                                      fit: BoxFit.contain,
                                      height: 120,
                                    ),
                                  )
                                else
                                  GestureDetector(
                                    onPanUpdate: (details) {
                                      final localPos = details.localPosition;
                                      setState(() {
                                        _sigPoints.add(localPos);
                                      });
                                    },
                                    onPanEnd: (_) {
                                      setState(() {
                                        _sigPoints.add(null);
                                      });
                                    },
                                    child: CustomPaint(
                                      painter: _SignaturePainter(points: _sigPoints),
                                      size: Size.infinite,
                                      child: _sigPoints.isEmpty
                                          ? const Center(
                                              child: Text(
                                                "Tap & drag finger here to sign smoothly",
                                                style: TextStyle(color: Color(0xFF94A3B8), fontSize: 11, fontStyle: FontStyle.italic),
                                              ),
                                            )
                                          : null,
                                    ),
                                  ),

                                if (_isSignaturePadConfirmed)
                                  Positioned(
                                    top: 6,
                                    right: 6,
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFECFDF5),
                                        borderRadius: BorderRadius.circular(4),
                                        border: Border.all(color: const Color(0xFFA7F3D0)),
                                      ),
                                      child: const Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Icon(Icons.check_circle_rounded, size: 12, color: AppColors.emeraldGreen),
                                          SizedBox(width: 4),
                                          Text("Signature Verified", style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.emeraldGreen)),
                                        ],
                                      ),
                                    ),
                                  ),
                              ],
                            ),
                          ),

                          const SizedBox(height: 6),

                          Row(
                            children: [
                              TextButton.icon(
                                onPressed: () {
                                  setState(() {
                                    _sigPoints.clear();
                                    _signatureData = null;
                                    _isSignaturePadConfirmed = false;
                                  });
                                },
                                icon: const Icon(Icons.refresh_rounded, size: 14),
                                label: const Text("Clear Pad", style: TextStyle(fontSize: 11)),
                              ),
                              const Spacer(),
                              ElevatedButton.icon(
                                onPressed: _renderSignatureToData,
                                icon: const Icon(Icons.check_rounded, size: 14),
                                label: const Text("Confirm Signature", style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700)),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: const Color(0xFF005BAC),
                                  foregroundColor: Colors.white,
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                                ),
                              ),
                            ],
                          ),

                          const SizedBox(height: 14),

                          // Remarks
                          _buildTextInput(
                            label: "Commissioning Remarks & Engineering Observations",
                            hint: "Polarity check notes, inverter startup sequence, net meter verification...",
                            controller: _remarksCtrl,
                            isDark: isDark,
                            borderColor: borderColor,
                            textPrimary: textPrimary,
                            textSecondary: textSecondary,
                            maxLines: 3,
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 24),
                  ],
                ),
              ),
            ),

            // Footer Actions
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: cardBg,
                border: Border(top: BorderSide(color: borderColor)),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: _isSubmitting ? null : () => Navigator.of(context).pop(),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: textSecondary,
                        side: BorderSide(color: borderColor),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                      child: const Text("Cancel", style: TextStyle(fontWeight: FontWeight.w600)),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    flex: 2,
                    child: ElevatedButton(
                      onPressed: _isSubmitting ? null : _saveCommissioning,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF005BAC),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        elevation: 1,
                      ),
                      child: _isSubmitting
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                            )
                          : const Text(
                              "Save Commissioning",
                              style: TextStyle(fontWeight: FontWeight.w800),
                            ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionCard({
    required String title,
    required IconData icon,
    required Color cardBg,
    required Color borderColor,
    required Color textPrimary,
    required Widget child,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: borderColor),
      ),
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 16, color: const Color(0xFFF59E0B)),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  title,
                  style: TextStyle(
                    fontSize: 11.5,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 0.5,
                    color: textPrimary,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          child,
        ],
      ),
    );
  }

  Widget _buildNumberInput({
    required String label,
    required String hint,
    String? helper,
    required TextEditingController controller,
    required bool isDark,
    required Color borderColor,
    required Color textPrimary,
    required Color textSecondary,
    bool required = false,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700, color: textPrimary)),
        const SizedBox(height: 6),
        TextFormField(
          controller: controller,
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
          style: TextStyle(fontSize: 12.5, color: textPrimary),
          validator: required
              ? (val) => val == null || val.trim().isEmpty ? "Required" : null
              : null,
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: TextStyle(fontSize: 12, color: textSecondary.withValues(alpha: 0.6)),
            filled: true,
            fillColor: isDark ? const Color(0xFF1E1E1E) : Colors.white,
            contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: borderColor)),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: borderColor)),
          ),
        ),
        if (helper != null) ...[
          const SizedBox(height: 3),
          Text(helper, style: TextStyle(fontSize: 9.5, color: textSecondary), maxLines: 2, overflow: TextOverflow.ellipsis),
        ],
      ],
    );
  }

  Widget _buildTextInput({
    required String label,
    required String hint,
    String? helper,
    required TextEditingController controller,
    required bool isDark,
    required Color borderColor,
    required Color textPrimary,
    required Color textSecondary,
    bool required = false,
    int maxLines = 1,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700, color: textPrimary)),
        const SizedBox(height: 6),
        TextFormField(
          controller: controller,
          maxLines: maxLines,
          style: TextStyle(fontSize: 12.5, color: textPrimary),
          validator: required
              ? (val) => val == null || val.trim().isEmpty ? "Required" : null
              : null,
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: TextStyle(fontSize: 12, color: textSecondary.withValues(alpha: 0.6)),
            filled: true,
            fillColor: isDark ? const Color(0xFF1E1E1E) : Colors.white,
            contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: borderColor)),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: borderColor)),
          ),
        ),
        if (helper != null) ...[
          const SizedBox(height: 3),
          Text(helper, style: TextStyle(fontSize: 9.5, color: textSecondary), maxLines: 2, overflow: TextOverflow.ellipsis),
        ],
      ],
    );
  }

  Widget _buildDateField({
    required String label,
    required TextEditingController controller,
    required bool isDark,
    required Color borderColor,
    required Color textPrimary,
    required Color textSecondary,
    required VoidCallback onTap,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700, color: textPrimary)),
        const SizedBox(height: 6),
        InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(8),
          child: Container(
            height: 48,
            padding: const EdgeInsets.symmetric(horizontal: 10),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF1E1E1E) : Colors.white,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: borderColor),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    controller.text.isEmpty ? "Select date" : controller.text,
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: textPrimary),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
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

  Widget _buildTestCard({
    required String label,
    required String helper,
    required String value,
    required bool isDark,
    required Color borderColor,
    required Color textPrimary,
    required Function(String) onChanged,
  }) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1A1A1A) : const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: borderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(label, style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700, color: textPrimary)),
              ),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  _buildRadioButton(title: "Pass", selected: value == "Pass", isPass: true, onTap: () => onChanged("Pass")),
                  const SizedBox(width: 8),
                  _buildRadioButton(title: "Fail", selected: value == "Fail", isPass: false, onTap: () => onChanged("Fail")),
                ],
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(helper, style: TextStyle(fontSize: 9.5, color: const Color(0xFF94A3B8))),
        ],
      ),
    );
  }

  Widget _buildMeasurementTestCard({
    required String label,
    required String testValue,
    required String measurementLabel,
    required String measurementHelper,
    required TextEditingController controller,
    required bool isDark,
    required Color borderColor,
    required Color textPrimary,
    required Color textSecondary,
    required Function(String) onTestChanged,
  }) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1A1A1A) : const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: borderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(label, style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700, color: textPrimary)),
              ),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  _buildRadioButton(title: "Pass", selected: testValue == "Pass", isPass: true, onTap: () => onTestChanged("Pass")),
                  const SizedBox(width: 8),
                  _buildRadioButton(title: "Fail", selected: testValue == "Fail", isPass: false, onTap: () => onTestChanged("Fail")),
                ],
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(measurementLabel, style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w600, color: textPrimary)),
                    const SizedBox(height: 4),
                    TextFormField(
                      controller: controller,
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      style: TextStyle(fontSize: 12, color: textPrimary),
                      decoration: InputDecoration(
                        filled: true,
                        fillColor: isDark ? const Color(0xFF242424) : Colors.white,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                        isDense: true,
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(6), borderSide: BorderSide(color: borderColor)),
                        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(6), borderSide: BorderSide(color: borderColor)),
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(measurementHelper, style: TextStyle(fontSize: 9, color: textSecondary)),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildRadioButton({
    required String title,
    required bool selected,
    required bool isPass,
    required VoidCallback onTap,
  }) {
    final activeColor = isPass ? AppColors.emeraldGreen : AppColors.errorRed;
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(6),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(
          color: selected ? activeColor.withValues(alpha: 0.15) : Colors.transparent,
          borderRadius: BorderRadius.circular(6),
          border: Border.all(color: selected ? activeColor : const Color(0xFF64748B).withValues(alpha: 0.4)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              selected ? (isPass ? Icons.check_circle_rounded : Icons.cancel_rounded) : Icons.radio_button_unchecked,
              size: 13,
              color: selected ? activeColor : const Color(0xFF64748B),
            ),
            const SizedBox(width: 4),
            Text(
              title,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                color: selected ? activeColor : const Color(0xFF94A3B8),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SignaturePainter extends CustomPainter {
  final List<Offset?> points;
  _SignaturePainter({required this.points});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = const Color(0xFF0F172A)
      ..strokeCap = StrokeCap.round
      ..strokeWidth = 2.5;

    for (int i = 0; i < points.length - 1; i++) {
      if (points[i] != null && points[i + 1] != null) {
        canvas.drawLine(points[i]!, points[i + 1]!, paint);
      }
    }
  }

  @override
  bool shouldRepaint(_SignaturePainter oldDelegate) => true;
}
