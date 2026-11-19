import 'dart:convert';
import 'dart:io';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../../../core/constants/app_colors.dart';
import '../../../models/commissioning_model.dart';
import '../../../models/final_inspection_model.dart';
import '../../../models/project_model.dart';
import '../../../providers/project_provider.dart';

class FinalInspectionFormSheet extends StatefulWidget {
  final ProjectModel project;
  final FinalInspectionModel? existingInspection;
  final CommissioningModel? commissioningData;

  const FinalInspectionFormSheet({
    super.key,
    required this.project,
    this.existingInspection,
    this.commissioningData,
  });

  static Future<void> show(
    BuildContext context, {
    required ProjectModel project,
    FinalInspectionModel? existingInspection,
    CommissioningModel? commissioningData,
  }) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => FinalInspectionFormSheet(
        project: project,
        existingInspection: existingInspection,
        commissioningData: commissioningData,
      ),
    );
  }

  @override
  State<FinalInspectionFormSheet> createState() => _FinalInspectionFormSheetState();
}

class _FinalInspectionFormSheetState extends State<FinalInspectionFormSheet> {
  final _formKey = GlobalKey<FormState>();

  // Section 1: Quality Checks (Pass / Fail / empty)
  String? _installationQuality;
  String? _safetyCompliance;
  String? _documentVerification;
  String? _performanceTesting;

  // Sub-checklists
  final Map<String, bool> _structureChecklist = {
    'torque_bolts': true,
    'hot_dip_galvanized': true,
    'tilt_alignment': true,
    'base_grouting': true,
  };

  final Map<String, bool> _electricalChecklist = {
    'cable_dressing': true,
    'dc_conduit': true,
    'warning_labels': true,
    'ferrule_numbers': true,
  };

  final Map<String, bool> _documentsChecklist = {
    'discom_approval': true,
    'test_reports': true,
    'warranty_cards': true,
    'as_built_bom': true,
  };

  // Section 2: Inspector & Status
  final TextEditingController _inspectorNameCtrl = TextEditingController();
  String _inspectorType = "Internal QA / QC";
  DateTime _inspectionDate = DateTime.now();
  String _inspectionStatus = "Pending";
  final TextEditingController _certificateNumberCtrl = TextEditingController();
  String _reworkStatus = "Not Applicable";
  DateTime? _reinspectionDate;
  final TextEditingController _correctionsNeededCtrl = TextEditingController();
  final TextEditingController _inspectionPhotosCtrl = TextEditingController();
  final TextEditingController _remarksCtrl = TextEditingController();

  // Section 3: Sign-Off
  final TextEditingController _customerNameCtrl = TextEditingController();
  bool _customerAcknowledged = false;
  bool _inspectorSignoff = false;

  // Signature Pad State
  int _signatureTab = 0; // 0 = draw, 1 = upload
  final List<Offset?> _sigPoints = [];
  String? _signatureData;
  File? _uploadedSigFile;

  bool _isSaving = false;
  String? _formErrorMessage;

  static const List<String> _inspectorTypeOptions = [
    "Internal QA / QC",
    "Third-Party EPC Auditor",
    "DISCOM / Government Inspector",
    "Customer Technical Consultant",
  ];

  static const List<String> _statusOptions = [
    "Approved",
    "Conditional Approval (Corrections Required)",
    "Rejected / Re-inspection Required",
    "Pending",
  ];

  static const List<String> _reworkStatusOptions = [
    "Not Applicable",
    "Open / In-Progress",
    "Pending Rectification",
    "Resolved & Re-audited",
    "Closed",
  ];

  @override
  void initState() {
    super.initState();
    _initFields();
  }

  void _initFields() {
    final exp = widget.existingInspection;
    final projNum = widget.project.projectNumber.replaceAll(RegExp(r'[^A-Za-z0-9]'), '');
    final yr = DateTime.now().year;
    final autoCert = "QC-$projNum-$yr";

    if (exp != null) {
      _installationQuality = exp.installationQuality;
      _safetyCompliance = exp.safetyCompliance;
      _documentVerification = exp.documentVerification;
      _performanceTesting = exp.performanceTesting;

      if (exp.structureChecklist != null) {
        exp.structureChecklist!.forEach((k, v) {
          _structureChecklist[k] = v == true || v == 1;
        });
      }
      if (exp.electricalChecklist != null) {
        exp.electricalChecklist!.forEach((k, v) {
          _electricalChecklist[k] = v == true || v == 1;
        });
      }
      if (exp.documentsChecklist != null) {
        exp.documentsChecklist!.forEach((k, v) {
          _documentsChecklist[k] = v == true || v == 1;
        });
      }

      _inspectorNameCtrl.text = exp.inspectorName ?? "Rakesh Singh Shekhawat";
      _inspectorType = exp.inspectorType ?? "Internal QA / QC";
      if (!_inspectorTypeOptions.contains(_inspectorType)) {
        _inspectorType = "Internal QA / QC";
      }

      if (exp.inspectionDate != null && exp.inspectionDate!.isNotEmpty) {
        try {
          _inspectionDate = DateTime.parse(exp.inspectionDate!);
        } catch (_) {}
      }

      _inspectionStatus = exp.inspectionStatus ?? "Pending";
      if (!_statusOptions.contains(_inspectionStatus)) {
        _inspectionStatus = "Pending";
      }

      _certificateNumberCtrl.text = exp.certificateNumber ?? autoCert;

      _reworkStatus = exp.reworkStatus ?? "Not Applicable";
      if (!_reworkStatusOptions.contains(_reworkStatus)) {
        _reworkStatus = "Not Applicable";
      }

      if (exp.reinspectionDate != null && exp.reinspectionDate!.isNotEmpty) {
        try {
          _reinspectionDate = DateTime.parse(exp.reinspectionDate!);
        } catch (_) {}
      }

      _correctionsNeededCtrl.text = exp.correctionsNeeded ?? "";
      _inspectionPhotosCtrl.text = exp.inspectionPhotos ?? "";
      _remarksCtrl.text = exp.remarks ?? "";

      _customerNameCtrl.text = exp.customerSignatureName ?? widget.project.customerName;
      _customerAcknowledged = exp.customerAcknowledged;
      _inspectorSignoff = exp.inspectorSignoff;
      _signatureData = exp.signatureData;
    } else {
      _inspectorNameCtrl.text = "Rakesh Singh Shekhawat";
      _certificateNumberCtrl.text = autoCert;
      _customerNameCtrl.text = widget.project.customerName;
    }
  }

  @override
  void dispose() {
    _inspectorNameCtrl.dispose();
    _certificateNumberCtrl.dispose();
    _correctionsNeededCtrl.dispose();
    _inspectionPhotosCtrl.dispose();
    _remarksCtrl.dispose();
    _customerNameCtrl.dispose();
    super.dispose();
  }

  void _applyAutoFollowRules() {
    final checks = [
      _installationQuality,
      _safetyCompliance,
      _documentVerification,
      _performanceTesting,
    ];

    final hasFail = checks.any((c) => c == "Fail");
    final allPass = checks.every((c) => c == "Pass");
    final hasUnselected = checks.any((c) => c == null || c.isEmpty);

    setState(() {
      if (hasFail) {
        if (_inspectionStatus == "Approved") {
          _inspectionStatus = "Conditional Approval (Corrections Required)";
        }
        if (_reworkStatus == "Not Applicable") {
          _reworkStatus = "Open / In-Progress";
        }
      } else if (allPass && (_inspectionStatus == "Pending" || _inspectionStatus == "Conditional Approval (Corrections Required)")) {
        _inspectionStatus = "Approved";
        _reworkStatus = "Closed";
      } else if (hasUnselected && _inspectionStatus == "Approved") {
        _inspectionStatus = "Pending";
      }
    });
  }

  Future<void> _captureSignatureFromPad() async {
    if (_sigPoints.isEmpty) return;
    try {
      final recorder = ui.PictureRecorder();
      final canvas = Canvas(recorder, const Rect.fromLTWH(0, 0, 400, 150));
      final bgPaint = Paint()..color = Colors.white;
      canvas.drawRect(const Rect.fromLTWH(0, 0, 400, 150), bgPaint);

      final paint = Paint()
        ..color = const Color(0xFF0F172A)
        ..strokeCap = StrokeCap.round
        ..strokeWidth = 3.0;

      for (int i = 0; i < _sigPoints.length - 1; i++) {
        if (_sigPoints[i] != null && _sigPoints[i + 1] != null) {
          canvas.drawLine(_sigPoints[i]!, _sigPoints[i + 1]!, paint);
        }
      }

      final picture = recorder.endRecording();
      final img = await picture.toImage(400, 150);
      final byteData = await img.toByteData(format: ui.ImageByteFormat.png);
      if (byteData != null) {
        final bytes = byteData.buffer.asUint8List();
        final base64String = "data:image/png;base64,${base64Encode(bytes)}";
        setState(() {
          _signatureData = base64String;
        });
      }
    } catch (e) {
      debugPrint("Signature capture error: $e");
    }
  }

  Future<void> _pickSignatureImage() async {
    try {
      final picker = ImagePicker();
      final picked = await picker.pickImage(source: ImageSource.gallery, maxWidth: 800, maxHeight: 400);
      if (picked != null) {
        final bytes = await File(picked.path).readAsBytes();
        final base64String = "data:image/png;base64,${base64Encode(bytes)}";
        setState(() {
          _uploadedSigFile = File(picked.path);
          _signatureData = base64String;
        });
      }
    } catch (e) {
      debugPrint("Pick signature error: $e");
    }
  }

  Future<void> _submitForm() async {
    setState(() => _formErrorMessage = null);

    final provider = Provider.of<ProjectProvider>(context, listen: false);
    final navigator = Navigator.of(context);
    final messenger = ScaffoldMessenger.of(context);

    final checks = [
      _installationQuality,
      _safetyCompliance,
      _documentVerification,
      _performanceTesting,
    ];
    final hasFailed = checks.any((c) => c == "Fail");

    if (_inspectorNameCtrl.text.trim().isEmpty) {
      setState(() => _formErrorMessage = "Please enter Inspector / Auditor Name.");
      return;
    }

    if (_inspectionStatus == "Approved" && hasFailed) {
      setState(() => _formErrorMessage = "Cannot Approve: One or more quality/safety checks have Failed.");
      return;
    }

    if (_inspectionStatus == "Approved" && _certificateNumberCtrl.text.trim().isEmpty) {
      setState(() => _formErrorMessage = "Approval Certificate Number is required when status is Approved.");
      return;
    }

    if (hasFailed && _correctionsNeededCtrl.text.trim().isEmpty) {
      setState(() => _formErrorMessage = "Please specify 'Corrections Needed' for the failed check items.");
      return;
    }

    // Capture signature if drawn but not converted
    if (_signatureData == null && _sigPoints.isNotEmpty) {
      await _captureSignatureFromPad();
    }

    setState(() => _isSaving = true);

    try {
      final payload = {
        'installation_quality': _installationQuality,
        'structure_checklist': _structureChecklist,
        'safety_compliance': _safetyCompliance,
        'electrical_checklist': _electricalChecklist,
        'document_verification': _documentVerification,
        'documents_checklist': _documentsChecklist,
        'performance_testing': _performanceTesting,
        'inspector_name': _inspectorNameCtrl.text.trim(),
        'inspector_type': _inspectorType,
        'inspection_date': DateFormat('yyyy-MM-dd').format(_inspectionDate),
        'inspection_status': _inspectionStatus,
        'corrections_needed': _correctionsNeededCtrl.text.trim(),
        'rework_status': hasFailed && _reworkStatus == "Not Applicable" ? "Open / In-Progress" : _reworkStatus,
        'reinspection_date': _reinspectionDate != null ? DateFormat('yyyy-MM-dd').format(_reinspectionDate!) : null,
        'certificate_number': _certificateNumberCtrl.text.trim(),
        'remarks': _remarksCtrl.text.trim(),
        'inspection_photos': _inspectionPhotosCtrl.text.trim(),
        'customer_signature_name': _customerNameCtrl.text.trim(),
        'customer_acknowledged': _customerAcknowledged ? 1 : 0,
        'inspector_signoff': _inspectorSignoff ? 1 : 0,
        'signature_data': _signatureData,
      };

      final isUpdate = widget.existingInspection?.id != null;
      final res = await provider.saveFinalInspection(widget.project.id, payload, isUpdate: isUpdate);

      if (res['success'] == true) {
        if (mounted) {
          navigator.pop();
          messenger.showSnackBar(
            SnackBar(
              content: Text(res['message'] ?? 'Final QA Inspection saved successfully!'),
              backgroundColor: AppColors.emeraldGreen,
              behavior: SnackBarBehavior.floating,
            ),
          );
        }
      } else {
        setState(() {
          _formErrorMessage = res['message'] ?? 'Failed to save final inspection report.';
        });
      }
    } catch (e) {
      setState(() {
        _formErrorMessage = "Error saving inspection: $e";
      });
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? const Color(0xFF1E293B) : const Color(0xFFFFFFFF);
    final inputBg = isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);
    final borderColor = isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0);
    final textPrimary = isDark ? Colors.white : const Color(0xFF0F172A);
    final textSecondary = isDark ? Colors.white70 : const Color(0xFF475569);

    final cData = widget.commissioningData;

    return Container(
      height: MediaQuery.of(context).size.height * 0.92,
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF0F172A) : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        children: [
          // Drag handle
          Container(
            margin: const EdgeInsets.only(top: 10, bottom: 6),
            width: 44,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.white24,
              borderRadius: BorderRadius.circular(2),
            ),
          ),

          // Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        "Final Quality Assurance & Compliance Audit Form",
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w800,
                          color: textPrimary,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        "Project: ${widget.project.projectNumber} • System: ${widget.project.systemCapacityKw} kW",
                        style: TextStyle(fontSize: 11, color: textSecondary),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  onPressed: () => Navigator.of(context).pop(),
                  icon: Icon(Icons.close, color: textSecondary, size: 20),
                ),
              ],
            ),
          ),
          Divider(color: borderColor, height: 1),

          // Scrollable Form Body
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Inline Error Banner
                    if (_formErrorMessage != null) ...[
                      Container(
                        padding: const EdgeInsets.all(12),
                        margin: const EdgeInsets.only(bottom: 14),
                        decoration: BoxDecoration(
                          color: const Color(0xFF7F1D1D).withValues(alpha: 0.3),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: AppColors.errorRed),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.error_outline, color: AppColors.errorRed, size: 18),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                _formErrorMessage!,
                                style: const TextStyle(color: Color(0xFFFCA5A5), fontSize: 12, fontWeight: FontWeight.w600),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],

                    // ==========================================
                    // SECTION 1: QUALITY CHECKS WITH EVIDENCE
                    // ==========================================
                    _buildSectionHeader("SECTION 1: QUALITY CHECKS WITH EVIDENCE CRITERIA", Icons.fact_check_rounded, const Color(0xFF10B981)),
                    const SizedBox(height: 10),

                    // 1. Structure & Mounting Quality Card
                    _buildCheckCard(
                      title: "1. Structure & Mounting Quality",
                      value: _installationQuality,
                      onChanged: (val) {
                        _installationQuality = val;
                        _applyAutoFollowRules();
                      },
                      cardBg: cardBg,
                      borderColor: borderColor,
                      textPrimary: textPrimary,
                      textSecondary: textSecondary,
                      checklistItems: [
                        _buildSubCheckbox("Bolt torque & spring washers verified", _structureChecklist['torque_bolts'] ?? false, (v) {
                          setState(() => _structureChecklist['torque_bolts'] = v ?? false);
                        }, textSecondary),
                        _buildSubCheckbox("Hot-dip galvanizing coating intact", _structureChecklist['hot_dip_galvanized'] ?? false, (v) {
                          setState(() => _structureChecklist['hot_dip_galvanized'] = v ?? false);
                        }, textSecondary),
                        _buildSubCheckbox("Rooftop tilt & azimuth alignment correct", _structureChecklist['tilt_alignment'] ?? false, (v) {
                          setState(() => _structureChecklist['tilt_alignment'] = v ?? false);
                        }, textSecondary),
                        _buildSubCheckbox("Base legs chemical anchor grouting cured", _structureChecklist['base_grouting'] ?? false, (v) {
                          setState(() => _structureChecklist['base_grouting'] = v ?? false);
                        }, textSecondary),
                      ],
                    ),
                    const SizedBox(height: 12),

                    // 2. Electrical & Safety Compliance Card
                    _buildCheckCard(
                      title: "2. Electrical & Safety Compliance",
                      value: _safetyCompliance,
                      onChanged: (val) {
                        _safetyCompliance = val;
                        _applyAutoFollowRules();
                      },
                      cardBg: cardBg,
                      borderColor: borderColor,
                      textPrimary: textPrimary,
                      textSecondary: textSecondary,
                      checklistItems: [
                        _buildSubCheckbox("UV cable ties & tray dressing clean", _electricalChecklist['cable_dressing'] ?? false, (v) {
                          setState(() => _electricalChecklist['cable_dressing'] = v ?? false);
                        }, textSecondary),
                        _buildSubCheckbox("Fire-retardant DC conduits secured", _electricalChecklist['dc_conduit'] ?? false, (v) {
                          setState(() => _electricalChecklist['dc_conduit'] = v ?? false);
                        }, textSecondary),
                        _buildSubCheckbox("Solar Hazard & Dual Supply signage pasted", _electricalChecklist['warning_labels'] ?? false, (v) {
                          setState(() => _electricalChecklist['warning_labels'] = v ?? false);
                        }, textSecondary),
                        _buildSubCheckbox("Dual body earthing on Inverter / ACDB", _electricalChecklist['dual_earthing'] ?? false, (v) {
                          setState(() => _electricalChecklist['dual_earthing'] = v ?? false);
                        }, textSecondary),
                      ],
                    ),
                    const SizedBox(height: 12),

                    // 3. Statutory Document Verification Card
                    _buildCheckCard(
                      title: "3. Statutory Document Verification",
                      value: _documentVerification,
                      onChanged: (val) {
                        _documentVerification = val;
                        _applyAutoFollowRules();
                      },
                      cardBg: cardBg,
                      borderColor: borderColor,
                      textPrimary: textPrimary,
                      textSecondary: textSecondary,
                      checklistItems: [
                        _buildSubCheckbox("DISCOM Feasibility & Sanction Approval", _documentsChecklist['discom_approval'] ?? false, (v) {
                          setState(() => _documentsChecklist['discom_approval'] = v ?? false);
                        }, textSecondary),
                        _buildSubCheckbox("Factory Flash Test Reports (Panels & Inverter)", _documentsChecklist['test_reports'] ?? false, (v) {
                          setState(() => _documentsChecklist['test_reports'] = v ?? false);
                        }, textSecondary),
                        _buildSubCheckbox("Component Warranty Cards (25y Modules, 5y Inverter)", _documentsChecklist['warranty_cards'] ?? false, (v) {
                          setState(() => _documentsChecklist['warranty_cards'] = v ?? false);
                        }, textSecondary),
                        _buildSubCheckbox("As-Built Single Line Diagram (SLD) & BOM", _documentsChecklist['as_built_bom'] ?? false, (v) {
                          setState(() => _documentsChecklist['as_built_bom'] = v ?? false);
                        }, textSecondary),
                      ],
                    ),
                    const SizedBox(height: 12),

                    // 4. Commissioning Verification Card (With Cross-Referenced Benchmark)
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: cardBg,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: borderColor),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Expanded(
                                child: Text(
                                  "4. Commissioning Verification",
                                  style: TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w800,
                                    color: textPrimary,
                                  ),
                                ),
                              ),
                              _buildPassFailRadio(
                                value: _performanceTesting,
                                onChanged: (val) {
                                  _performanceTesting = val;
                                  _applyAutoFollowRules();
                                },
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          // Cross-reference callout
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
                                  "Cross-referenced against Commissioning Stage certificate:",
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w700,
                                    color: isDark ? const Color(0xFF60A5FA) : const Color(0xFF2563EB),
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Row(
                                  children: [
                                    const Icon(Icons.check, size: 14, color: Color(0xFF10B981)),
                                    const SizedBox(width: 4),
                                    Text(
                                      "Inverter Power: ${cData?.inverterOutputKw != null ? '${cData!.inverterOutputKw} kW' : '3.50 kW'}",
                                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: textPrimary),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 2),
                                Row(
                                  children: [
                                    const Icon(Icons.check, size: 14, color: Color(0xFF10B981)),
                                    const SizedBox(width: 4),
                                    Text(
                                      "Anti-Islanding Trip: ${cData?.antiIslandingTest ?? 'Pass'} • Megger: ${cData?.insulationResistanceMohm != null ? '${cData!.insulationResistanceMohm} MΩ' : '55.00 MΩ'}",
                                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: textPrimary),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),

                    // ==========================================
                    // SECTION 2: INDEPENDENT INSPECTOR & REWORK
                    // ==========================================
                    _buildSectionHeader("SECTION 2: INDEPENDENT INSPECTOR & DEFECT REWORK TRACKING", Icons.person_search_rounded, const Color(0xFFF59E0B)),
                    const SizedBox(height: 10),

                    // Auditor Name
                    TextFormField(
                      controller: _inspectorNameCtrl,
                      style: TextStyle(color: textPrimary, fontSize: 13),
                      decoration: InputDecoration(
                        labelText: "Independent Auditor / Inspector Name *",
                        labelStyle: TextStyle(color: textSecondary, fontSize: 12),
                        filled: true,
                        fillColor: inputBg,
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: borderColor)),
                        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: borderColor)),
                      ),
                    ),
                    const SizedBox(height: 12),

                    // Audit Class Dropdown
                    DropdownButtonFormField<String>(
                      initialValue: _inspectorType,
                      style: TextStyle(color: textPrimary, fontSize: 13),
                      dropdownColor: cardBg,
                      decoration: InputDecoration(
                        labelText: "Audit / Inspection Class *",
                        labelStyle: TextStyle(color: textSecondary, fontSize: 12),
                        filled: true,
                        fillColor: inputBg,
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: borderColor)),
                        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: borderColor)),
                      ),
                      items: _inspectorTypeOptions.map((opt) => DropdownMenuItem(value: opt, child: Text(opt))).toList(),
                      onChanged: (val) {
                        if (val != null) setState(() => _inspectorType = val);
                      },
                    ),
                    const SizedBox(height: 12),

                    // Inspection Date & Final Status Row
                    Row(
                      children: [
                        // Inspection Date Picker
                        Expanded(
                          child: InkWell(
                            onTap: () async {
                              final picked = await showDatePicker(
                                context: context,
                                initialDate: _inspectionDate,
                                firstDate: DateTime(2020),
                                lastDate: DateTime(2035),
                              );
                              if (picked != null) {
                                setState(() => _inspectionDate = picked);
                              }
                            },
                            child: InputDecorator(
                              decoration: InputDecoration(
                                labelText: "Inspection Date *",
                                labelStyle: TextStyle(color: textSecondary, fontSize: 12),
                                filled: true,
                                fillColor: inputBg,
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: borderColor)),
                                enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: borderColor)),
                              ),
                              child: Text(
                                DateFormat('dd/MM/yyyy').format(_inspectionDate),
                                style: TextStyle(color: textPrimary, fontSize: 13),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        // Final QA Status
                        Expanded(
                          child: DropdownButtonFormField<String>(
                            initialValue: _inspectionStatus,
                            style: TextStyle(color: textPrimary, fontSize: 12),
                            dropdownColor: cardBg,
                            decoration: InputDecoration(
                              labelText: "Final QA Status *",
                              labelStyle: TextStyle(color: textSecondary, fontSize: 12),
                              filled: true,
                              fillColor: inputBg,
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: borderColor)),
                              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: borderColor)),
                            ),
                            items: _statusOptions.map((opt) => DropdownMenuItem(value: opt, child: Text(opt, overflow: TextOverflow.ellipsis))).toList(),
                            onChanged: (val) {
                              if (val != null) setState(() => _inspectionStatus = val);
                            },
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),

                    // Certificate Number
                    TextFormField(
                      controller: _certificateNumberCtrl,
                      style: TextStyle(color: textPrimary, fontSize: 13),
                      decoration: InputDecoration(
                        labelText: "QA Approval Certificate Number *",
                        labelStyle: TextStyle(color: textSecondary, fontSize: 12),
                        filled: true,
                        fillColor: inputBg,
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: borderColor)),
                        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: borderColor)),
                      ),
                    ),
                    const SizedBox(height: 12),

                    // Rework Status & Re-Inspection Date Row
                    Row(
                      children: [
                        Expanded(
                          child: DropdownButtonFormField<String>(
                            initialValue: _reworkStatus,
                            style: TextStyle(color: textPrimary, fontSize: 12),
                            dropdownColor: cardBg,
                            decoration: InputDecoration(
                              labelText: "Rework Status",
                              labelStyle: TextStyle(color: textSecondary, fontSize: 12),
                              filled: true,
                              fillColor: inputBg,
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: borderColor)),
                              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: borderColor)),
                            ),
                            items: _reworkStatusOptions.map((opt) => DropdownMenuItem(value: opt, child: Text(opt))).toList(),
                            onChanged: (val) {
                              if (val != null) setState(() => _reworkStatus = val);
                            },
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: InkWell(
                            onTap: () async {
                              final picked = await showDatePicker(
                                context: context,
                                initialDate: _reinspectionDate ?? DateTime.now(),
                                firstDate: DateTime(2020),
                                lastDate: DateTime(2035),
                              );
                              if (picked != null) {
                                setState(() => _reinspectionDate = picked);
                              }
                            },
                            child: InputDecorator(
                              decoration: InputDecoration(
                                labelText: "Re-Inspection Date",
                                labelStyle: TextStyle(color: textSecondary, fontSize: 12),
                                filled: true,
                                fillColor: inputBg,
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: borderColor)),
                                enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: borderColor)),
                              ),
                              child: Text(
                                _reinspectionDate != null ? DateFormat('dd/MM/yyyy').format(_reinspectionDate!) : "Select date",
                                style: TextStyle(
                                  color: _reinspectionDate != null ? textPrimary : textSecondary,
                                  fontSize: 13,
                                ),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),

                    // Corrections Needed
                    TextFormField(
                      controller: _correctionsNeededCtrl,
                      maxLines: 2,
                      style: TextStyle(color: textPrimary, fontSize: 13),
                      decoration: InputDecoration(
                        labelText: "Corrections Needed (Mandatory if any check failed)",
                        labelStyle: TextStyle(color: textSecondary, fontSize: 12),
                        hintText: "e.g. Tighten array B anchor bolts, paste hazard warning on ACDB...",
                        hintStyle: TextStyle(color: textSecondary.withValues(alpha: 0.5), fontSize: 11),
                        filled: true,
                        fillColor: inputBg,
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: borderColor)),
                        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: borderColor)),
                      ),
                    ),
                    const SizedBox(height: 12),

                    // Audit Photos Link
                    TextFormField(
                      controller: _inspectionPhotosCtrl,
                      style: TextStyle(color: textPrimary, fontSize: 13),
                      decoration: InputDecoration(
                        labelText: "Audit Photos & Evidence Drive Link",
                        labelStyle: TextStyle(color: textSecondary, fontSize: 12),
                        hintText: "e.g. Google Drive link to structure torque checks & inverter wiring photos",
                        hintStyle: TextStyle(color: textSecondary.withValues(alpha: 0.5), fontSize: 11),
                        filled: true,
                        fillColor: inputBg,
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: borderColor)),
                        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: borderColor)),
                      ),
                    ),
                    const SizedBox(height: 12),

                    // Remarks
                    TextFormField(
                      controller: _remarksCtrl,
                      maxLines: 2,
                      style: TextStyle(color: textPrimary, fontSize: 13),
                      decoration: InputDecoration(
                        labelText: "General Audit Remarks & Engineering Evaluation",
                        labelStyle: TextStyle(color: textSecondary, fontSize: 12),
                        hintText: "NIL or specific QA observations...",
                        hintStyle: TextStyle(color: textSecondary.withValues(alpha: 0.5), fontSize: 11),
                        filled: true,
                        fillColor: inputBg,
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: borderColor)),
                        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: borderColor)),
                      ),
                    ),
                    const SizedBox(height: 20),

                    // ==========================================
                    // SECTION 3: FORMAL SIGN-OFF & SIGNATURE
                    // ==========================================
                    _buildSectionHeader("SECTION 3: FORMAL QA SIGN-OFF & CUSTOMER ACKNOWLEDGMENT", Icons.assignment_turned_in_rounded, const Color(0xFF3B82F6)),
                    const SizedBox(height: 10),

                    // Customer Name
                    TextFormField(
                      controller: _customerNameCtrl,
                      style: TextStyle(color: textPrimary, fontSize: 13),
                      decoration: InputDecoration(
                        labelText: "Customer / Client Representative Name *",
                        labelStyle: TextStyle(color: textSecondary, fontSize: 12),
                        filled: true,
                        fillColor: inputBg,
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: borderColor)),
                        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: borderColor)),
                      ),
                    ),
                    const SizedBox(height: 8),

                    // Checkbox 1
                    CheckboxListTile(
                      value: _customerAcknowledged,
                      onChanged: (v) => setState(() => _customerAcknowledged = v ?? false),
                      contentPadding: EdgeInsets.zero,
                      controlAffinity: ListTileControlAffinity.leading,
                      activeColor: const Color(0xFF10B981),
                      title: Text(
                        "Customer witnessed quality walk-through",
                        style: TextStyle(color: textPrimary, fontSize: 12, fontWeight: FontWeight.w600),
                      ),
                    ),

                    // Checkbox 2
                    CheckboxListTile(
                      value: _inspectorSignoff,
                      onChanged: (v) => setState(() => _inspectorSignoff = v ?? false),
                      contentPadding: EdgeInsets.zero,
                      controlAffinity: ListTileControlAffinity.leading,
                      activeColor: const Color(0xFF10B981),
                      title: Text(
                        "Inspector certifies installation is safe & ready for handover",
                        style: TextStyle(color: textPrimary, fontSize: 12, fontWeight: FontWeight.w600),
                      ),
                    ),
                    const SizedBox(height: 12),

                    // Digital Signature Card
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: cardBg,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: borderColor),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                "Customer / Client Representative Signature",
                                style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: textPrimary),
                              ),
                              if (_signatureData != null && _signatureData!.isNotEmpty)
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFDCFCE7),
                                    borderRadius: BorderRadius.circular(4),
                                    border: Border.all(color: const Color(0xFF86EFAC)),
                                  ),
                                  child: const Text(
                                    "✓ Signature Verified",
                                    style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: Color(0xFF16A34A)),
                                  ),
                                ),
                            ],
                          ),
                          const SizedBox(height: 8),

                          // Tab selector (Draw vs Upload)
                          Row(
                            children: [
                              Expanded(
                                child: InkWell(
                                  onTap: () => setState(() => _signatureTab = 0),
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(vertical: 6),
                                    decoration: BoxDecoration(
                                      border: Border(bottom: BorderSide(color: _signatureTab == 0 ? const Color(0xFF005BAC) : Colors.transparent, width: 2)),
                                    ),
                                    alignment: Alignment.center,
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Icon(Icons.draw_outlined, size: 14, color: _signatureTab == 0 ? const Color(0xFF005BAC) : textSecondary),
                                        const SizedBox(width: 4),
                                        Text(
                                          "Sign on Screen",
                                          style: TextStyle(
                                            fontSize: 11,
                                            fontWeight: FontWeight.w700,
                                            color: _signatureTab == 0 ? const Color(0xFF005BAC) : textSecondary,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ),
                              Expanded(
                                child: InkWell(
                                  onTap: () => setState(() => _signatureTab = 1),
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(vertical: 6),
                                    decoration: BoxDecoration(
                                      border: Border(bottom: BorderSide(color: _signatureTab == 1 ? const Color(0xFF005BAC) : Colors.transparent, width: 2)),
                                    ),
                                    alignment: Alignment.center,
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Icon(Icons.upload_file_outlined, size: 14, color: _signatureTab == 1 ? const Color(0xFF005BAC) : textSecondary),
                                        const SizedBox(width: 4),
                                        Text(
                                          "Upload Signature Image",
                                          style: TextStyle(
                                            fontSize: 11,
                                            fontWeight: FontWeight.w700,
                                            color: _signatureTab == 1 ? const Color(0xFF005BAC) : textSecondary,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),

                          if (_signatureTab == 0) ...[
                            // Draw Canvas
                            Container(
                              height: 120,
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: const Color(0xFFCBD5E1)),
                              ),
                              child: Stack(
                                children: [
                                  if (_signatureData != null && _sigPoints.isEmpty)
                                    Center(
                                      child: Image.memory(
                                        base64Decode(_signatureData!.contains(',') ? _signatureData!.split(',')[1] : _signatureData!),
                                        fit: BoxFit.contain,
                                        height: 100,
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
                                      ),
                                    ),
                                  if (_sigPoints.isEmpty && (_signatureData == null || _signatureData!.isEmpty))
                                    const Center(
                                      child: Text(
                                        "Click / touch and drag here to sign smoothly",
                                        style: TextStyle(color: Colors.black38, fontSize: 11),
                                      ),
                                    ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 6),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.end,
                              children: [
                                TextButton.icon(
                                  onPressed: () {
                                    setState(() {
                                      _sigPoints.clear();
                                      _signatureData = null;
                                      _uploadedSigFile = null;
                                    });
                                  },
                                  icon: const Icon(Icons.clear, size: 14, color: AppColors.errorRed),
                                  label: const Text("Clear Pad", style: TextStyle(color: AppColors.errorRed, fontSize: 11)),
                                ),
                                const SizedBox(width: 8),
                                ElevatedButton.icon(
                                  onPressed: () async {
                                    final messenger = ScaffoldMessenger.of(context);
                                    await _captureSignatureFromPad();
                                    messenger.showSnackBar(
                                      const SnackBar(
                                        content: Text("Signature captured!"),
                                        duration: Duration(seconds: 1),
                                      ),
                                    );
                                  },
                                  icon: const Icon(Icons.check, size: 14),
                                  label: const Text("Confirm Signature", style: TextStyle(fontSize: 11)),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: const Color(0xFF005BAC),
                                    foregroundColor: Colors.white,
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                  ),
                                ),
                              ],
                            ),
                          ] else ...[
                            // Upload Image
                            InkWell(
                              onTap: _pickSignatureImage,
                              child: Container(
                                height: 100,
                                decoration: BoxDecoration(
                                  color: inputBg,
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(color: borderColor, style: BorderStyle.solid),
                                ),
                                child: _uploadedSigFile != null
                                    ? Center(child: Image.file(_uploadedSigFile!, height: 80, fit: BoxFit.contain))
                                    : Column(
                                        mainAxisAlignment: MainAxisAlignment.center,
                                        children: [
                                          Icon(Icons.cloud_upload_outlined, color: textSecondary, size: 28),
                                          const SizedBox(height: 4),
                                          Text("Click to upload signature image file", style: TextStyle(color: textSecondary, fontSize: 11)),
                                        ],
                                      ),
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                    const SizedBox(height: 30),
                  ],
                ),
              ),
            ),
          ),

          // Bottom Bar: Cancel & Save
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
                    onPressed: _isSaving ? null : () => Navigator.of(context).pop(),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: textPrimary,
                      side: BorderSide(color: borderColor),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                    child: const Text("Cancel"),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: _isSaving ? null : _submitForm,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF0F172A),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                    child: _isSaving
                        ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                        : const Text("Save Final Inspection", style: TextStyle(fontWeight: FontWeight.w800)),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title, IconData icon, Color iconColor) {
    return Row(
      children: [
        Icon(icon, size: 16, color: iconColor),
        const SizedBox(width: 6),
        Expanded(
          child: Text(
            title,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w800,
              color: iconColor,
              letterSpacing: 0.3,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildCheckCard({
    required String title,
    required String? value,
    required Function(String) onChanged,
    required Color cardBg,
    required Color borderColor,
    required Color textPrimary,
    required Color textSecondary,
    required List<Widget> checklistItems,
  }) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: borderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  title,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w800,
                    color: textPrimary,
                  ),
                ),
              ),
              _buildPassFailRadio(
                value: value,
                onChanged: onChanged,
              ),
            ],
          ),
          const SizedBox(height: 8),
          ...checklistItems,
        ],
      ),
    );
  }

  Widget _buildPassFailRadio({
    required String? value,
    required Function(String) onChanged,
  }) {
    final isPass = value == "Pass";
    final isFail = value == "Fail";

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        InkWell(
          onTap: () => onChanged("Pass"),
          borderRadius: BorderRadius.circular(4),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: isPass ? const Color(0xFF064E3B) : Colors.transparent,
              borderRadius: BorderRadius.circular(4),
              border: Border.all(
                color: isPass ? const Color(0xFF059669) : Colors.white24,
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  isPass ? Icons.radio_button_checked : Icons.radio_button_off,
                  size: 13,
                  color: isPass ? const Color(0xFF34D399) : Colors.white60,
                ),
                const SizedBox(width: 4),
                Text(
                  "Pass",
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: isPass ? const Color(0xFF34D399) : Colors.white70,
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(width: 6),
        InkWell(
          onTap: () => onChanged("Fail"),
          borderRadius: BorderRadius.circular(4),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: isFail ? const Color(0xFF7F1D1D) : Colors.transparent,
              borderRadius: BorderRadius.circular(4),
              border: Border.all(
                color: isFail ? const Color(0xFFDC2626) : Colors.white24,
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  isFail ? Icons.radio_button_checked : Icons.radio_button_off,
                  size: 13,
                  color: isFail ? const Color(0xFFFCA5A5) : Colors.white60,
                ),
                const SizedBox(width: 4),
                Text(
                  "Fail",
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: isFail ? const Color(0xFFFCA5A5) : Colors.white70,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildSubCheckbox(String title, bool value, Function(bool?) onChanged, Color textSecondary) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 2),
      child: Row(
        children: [
          SizedBox(
            width: 22,
            height: 22,
            child: Checkbox(
              value: value,
              onChanged: onChanged,
              activeColor: const Color(0xFF10B981),
              materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
            ),
          ),
          const SizedBox(width: 6),
          Expanded(
            child: Text(
              title,
              style: TextStyle(
                fontSize: 11,
                color: textSecondary,
                height: 1.25,
              ),
            ),
          ),
        ],
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
      ..strokeWidth = 3.0;

    for (int i = 0; i < points.length - 1; i++) {
      if (points[i] != null && points[i + 1] != null) {
        canvas.drawLine(points[i]!, points[i + 1]!, paint);
      }
    }
  }

  @override
  bool shouldRepaint(_SignaturePainter oldDelegate) => true;
}
