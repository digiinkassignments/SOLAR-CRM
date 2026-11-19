import 'dart:convert';
import 'dart:io';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/constants/app_colors.dart';
import '../../../models/customer_handover_model.dart';
import '../../../models/project_model.dart';
import '../../../providers/project_provider.dart';

class CustomerHandoverFormSheet extends StatefulWidget {
  final ProjectModel project;
  final CustomerHandoverModel? existingHandover;

  const CustomerHandoverFormSheet({
    super.key,
    required this.project,
    this.existingHandover,
  });

  static Future<void> show(
    BuildContext context, {
    required ProjectModel project,
    CustomerHandoverModel? existingHandover,
  }) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => CustomerHandoverFormSheet(
        project: project,
        existingHandover: existingHandover,
      ),
    );
  }

  @override
  State<CustomerHandoverFormSheet> createState() => _CustomerHandoverFormSheetState();
}

class _CustomerHandoverFormSheetState extends State<CustomerHandoverFormSheet> {
  final _formKey = GlobalKey<FormState>();

  // Section 1: Dates & Milestone
  DateTime _handoverDate = DateTime.now();
  DateTime _warrantyStartDate = DateTime.now();
  DateTime _firstServiceDueDate = DateTime.now().add(const Duration(days: 90));
  final TextEditingController _handoverManagerCtrl = TextEditingController();
  String _handoverStatus = "Pending";

  // Section 2: Operational Training & Mobile App
  String _trainingCompleted = "Pending";
  String _appDemoCompleted = "Pending";
  bool _monitoringAppAccessShared = false;
  bool _emergencyContactGiven = false;

  // Section 3: Granular Multi-Component Warranties
  int _moduleWarrantyYears = 25;
  int _inverterWarrantyYears = 5;
  int _workmanshipWarrantyYears = 5;
  int _amcWarrantyYears = 1;

  // Section 4: Statutory Document Pack Checklist
  final List<Map<String, dynamic>> _dossierChecklist = [
    {"id": "comm_cert", "label": "Commissioning & Grid Synchronisation Certificate", "checked": false},
    {"id": "qc_report", "label": "Final Quality & Safety Inspection Report", "checked": false},
    {"id": "discom_metering", "label": "DISCOM Net-Metering Feasibility & Bi-directional Meter Test Report", "checked": false},
    {"id": "subsidy_doc", "label": "PM Surya Ghar National Portal Subsidy Claim Submission Receipt", "checked": false},
    {"id": "gst_invoice", "label": "Final GST Commercial Tax Invoice & Zero-Balance Payment Receipt", "checked": false},
    {"id": "oem_warranty", "label": "OEM Warranty Certificates (25-Yr PV Modules & Inverter)", "checked": false},
    {"id": "om_manual", "label": "Customer Operation & Emergency Shutdown Safety Manual", "checked": false},
  ];

  // Section 5: Acceptance Signoff & Evidence
  String _signoffType = "Pending / Awaiting Signoff"; // "Pending / Awaiting Signoff", "Signed On-Screen (Digital)", "Physical Docket Uploaded"
  final TextEditingController _signatoryNameCtrl = TextEditingController();
  final TextEditingController _signatoryPhoneCtrl = TextEditingController();
  final TextEditingController _signedDocketUrlCtrl = TextEditingController();
  final TextEditingController _handoverPhotoUrlCtrl = TextEditingController();

  // Signature Pad State
  int _signatureTab = 0; // 0 = draw, 1 = upload
  final List<Offset?> _sigPoints = [];
  String? _signatureData;
  File? _uploadedSigFile;

  // Section 6: Review & Feedback
  String? _reviewToken;
  int _customerRating = 0;
  final TextEditingController _remarksCtrl = TextEditingController();

  bool _isSaving = false;
  String? _formErrorMessage;

  static const List<String> _statusOptions = [
    "Pending",
    "In Progress",
    "Completed & Handed Over",
  ];

  static const List<String> _trainingOptions = [
    "Pending",
    "In Progress",
    "Completed",
  ];

  static const List<String> _signoffOptions = [
    "Pending / Awaiting Signoff",
    "Signed On-Screen (Digital)",
    "Physical Docket Uploaded",
  ];

  @override
  void initState() {
    super.initState();
    _initFields();
  }

  void _initFields() {
    final exp = widget.existingHandover;
    if (exp != null) {
      if (exp.handoverDate != null && exp.handoverDate!.isNotEmpty) {
        try {
          _handoverDate = DateTime.parse(exp.handoverDate!);
        } catch (_) {}
      }
      if (exp.warrantyStartDate != null && exp.warrantyStartDate!.isNotEmpty) {
        try {
          _warrantyStartDate = DateTime.parse(exp.warrantyStartDate!);
        } catch (_) {}
      }
      if (exp.firstServiceDueDate != null && exp.firstServiceDueDate!.isNotEmpty) {
        try {
          _firstServiceDueDate = DateTime.parse(exp.firstServiceDueDate!);
        } catch (_) {}
      }

      _handoverManagerCtrl.text = exp.handoverManager ?? "";
      _handoverStatus = exp.handoverStatus ?? "Pending";
      if (!_statusOptions.contains(_handoverStatus)) {
        if (_handoverStatus.toLowerCase().contains("complete")) {
          _handoverStatus = "Completed & Handed Over";
        } else {
          _handoverStatus = "Pending";
        }
      }

      _trainingCompleted = exp.trainingCompleted ?? "Pending";
      if (!_trainingOptions.contains(_trainingCompleted)) _trainingCompleted = "Pending";

      _appDemoCompleted = exp.appDemoCompleted ?? "Pending";
      if (!_trainingOptions.contains(_appDemoCompleted)) _appDemoCompleted = "Pending";

      _monitoringAppAccessShared = exp.monitoringAppAccessShared;
      _emergencyContactGiven = exp.emergencyContactGiven;

      _moduleWarrantyYears = exp.moduleWarrantyYears;
      _inverterWarrantyYears = exp.inverterWarrantyYears;
      _workmanshipWarrantyYears = exp.workmanshipWarrantyYears;
      _amcWarrantyYears = exp.amcWarrantyYears;

      if (exp.documentsPackChecklist != null && exp.documentsPackChecklist!.isNotEmpty) {
        for (var item in exp.documentsPackChecklist!) {
          final id = item['id'];
          final checked = item['checked'] == true || item['checked'] == 1;
          final matchIdx = _dossierChecklist.indexWhere((d) => d['id'] == id);
          if (matchIdx != -1) {
            _dossierChecklist[matchIdx]['checked'] = checked;
          }
        }
      }

      _signatoryNameCtrl.text = exp.signatureSignatoryName ?? widget.project.customerName;
      _signatoryPhoneCtrl.text = exp.signaturePhone ?? widget.project.customerPhone;
      _signedDocketUrlCtrl.text = exp.signedDocketUrl ?? "";
      _handoverPhotoUrlCtrl.text = exp.handoverPhotoUrl ?? "";
      _signatureData = exp.signatureData;

      if (exp.customerSignature || (_signatureData != null && _signatureData!.isNotEmpty)) {
        _signoffType = "Signed On-Screen (Digital)";
      } else if (exp.signedDocketUrl != null && exp.signedDocketUrl!.isNotEmpty) {
        _signoffType = "Physical Docket Uploaded";
      } else {
        _signoffType = "Pending / Awaiting Signoff";
      }

      _reviewToken = exp.reviewToken ?? "rev-${widget.project.id}-${DateTime.now().millisecondsSinceEpoch.toRadixString(36)}";
      _customerRating = exp.customerRating;
      _remarksCtrl.text = exp.remarks ?? "";
    } else {
      _signatoryNameCtrl.text = widget.project.customerName;
      _signatoryPhoneCtrl.text = widget.project.customerPhone;
      _reviewToken = "rev-${widget.project.id}-${DateTime.now().millisecondsSinceEpoch.toRadixString(36)}";
    }
  }

  @override
  void dispose() {
    _handoverManagerCtrl.dispose();
    _signatoryNameCtrl.dispose();
    _signatoryPhoneCtrl.dispose();
    _signedDocketUrlCtrl.dispose();
    _handoverPhotoUrlCtrl.dispose();
    _remarksCtrl.dispose();
    super.dispose();
  }

  DateTime _addYears(DateTime base, int years) {
    return DateTime(base.year + years, base.month, base.day);
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
          _signoffType = "Signed On-Screen (Digital)";
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
          _signoffType = "Signed On-Screen (Digital)";
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

    // Validation checks
    final isCompletedSelected = _handoverStatus == "Completed & Handed Over";
    final isSigned = _signatureData != null && _signatureData!.isNotEmpty;
    final isDocketUploaded = _signedDocketUrlCtrl.text.trim().isNotEmpty;

    if (isCompletedSelected) {
      if (_trainingCompleted != "Completed") {
        setState(() => _formErrorMessage = "Cannot Mark Completed: System Operations Training must be marked Completed.");
        return;
      }
      if (_appDemoCompleted != "Completed") {
        setState(() => _formErrorMessage = "Cannot Mark Completed: Monitoring App Demo must be marked Completed.");
        return;
      }
      if (!isSigned && !isDocketUploaded) {
        setState(() => _formErrorMessage = "Cannot Mark Completed: Customer Sign-off signature or signed docket is required.");
        return;
      }
    }

    if (_signatureData == null && _sigPoints.isNotEmpty) {
      await _captureSignatureFromPad();
    }

    setState(() => _isSaving = true);

    try {
      final modEnd = _addYears(_warrantyStartDate, _moduleWarrantyYears);
      final invEnd = _addYears(_warrantyStartDate, _inverterWarrantyYears);
      final workEnd = _addYears(_warrantyStartDate, _workmanshipWarrantyYears);
      final amcEnd = _addYears(_warrantyStartDate, _amcWarrantyYears);

      final payload = {
        'handover_date': DateFormat('yyyy-MM-dd').format(_handoverDate),
        'handover_manager': _handoverManagerCtrl.text.trim(),
        'warranty_start_date': DateFormat('yyyy-MM-dd').format(_warrantyStartDate),
        'module_warranty_years': _moduleWarrantyYears,
        'module_warranty_end': DateFormat('yyyy-MM-dd').format(modEnd),
        'inverter_warranty_years': _inverterWarrantyYears,
        'inverter_warranty_end': DateFormat('yyyy-MM-dd').format(invEnd),
        'workmanship_warranty_years': _workmanshipWarrantyYears,
        'workmanship_warranty_end': DateFormat('yyyy-MM-dd').format(workEnd),
        'amc_warranty_years': _amcWarrantyYears,
        'amc_warranty_end': DateFormat('yyyy-MM-dd').format(amcEnd),
        'first_service_due_date': DateFormat('yyyy-MM-dd').format(_firstServiceDueDate),
        'training_completed': _trainingCompleted,
        'app_demo_completed': _appDemoCompleted,
        'monitoring_app_access_shared': _monitoringAppAccessShared ? 1 : 0,
        'emergency_contact_given': _emergencyContactGiven ? 1 : 0,
        'documents_pack_checklist': _dossierChecklist,
        'customer_signature': (isSigned || isDocketUploaded) ? 1 : 0,
        'signature_signatory_name': _signatoryNameCtrl.text.trim(),
        'signature_phone': _signatoryPhoneCtrl.text.trim(),
        'signed_docket_url': _signedDocketUrlCtrl.text.trim(),
        'handover_photo_url': _handoverPhotoUrlCtrl.text.trim(),
        'signature_data': _signatureData,
        'handover_status': _handoverStatus == "Completed & Handed Over" ? "Completed" : _handoverStatus,
        'remarks': _remarksCtrl.text.trim(),
      };

      final isUpdate = widget.existingHandover?.id != null;
      final res = await provider.saveCustomerHandover(widget.project.id, payload, isUpdate: isUpdate);

      if (res['success'] == true) {
        if (mounted) {
          navigator.pop();
          messenger.showSnackBar(
            SnackBar(
              content: Text(res['message'] ?? 'Customer Handover saved successfully!'),
              backgroundColor: AppColors.emeraldGreen,
              behavior: SnackBarBehavior.floating,
            ),
          );
        }
      } else {
        setState(() {
          _formErrorMessage = res['message'] ?? 'Failed to save customer handover.';
        });
      }
    } catch (e) {
      setState(() {
        _formErrorMessage = "Error saving handover: $e";
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

    final reviewUrl = "https://digiinksolutions.solops.cloud/review/${_reviewToken ?? widget.project.id}";

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
                        "Update Customer Handover Dossier & Warranties",
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
                    // 1. HANDOVER MILESTONE DATES & VERIFICATION
                    // ==========================================
                    _buildSectionTitle("1. HANDOVER MILESTONE DATES & VERIFICATION", Icons.event_available_rounded, const Color(0xFF005BAC)),
                    const SizedBox(height: 10),

                    // Handover Date & Warranty Start Date Row
                    Row(
                      children: [
                        Expanded(
                          child: InkWell(
                            onTap: () async {
                              final picked = await showDatePicker(
                                context: context,
                                initialDate: _handoverDate,
                                firstDate: DateTime(2020),
                                lastDate: DateTime(2035),
                              );
                              if (picked != null) {
                                setState(() {
                                  _handoverDate = picked;
                                  _warrantyStartDate = picked;
                                  _firstServiceDueDate = picked.add(const Duration(days: 90));
                                });
                              }
                            },
                            child: InputDecorator(
                              decoration: InputDecoration(
                                labelText: "Customer Handover Date *",
                                labelStyle: TextStyle(color: textSecondary, fontSize: 11),
                                filled: true,
                                fillColor: inputBg,
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: borderColor)),
                                enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: borderColor)),
                              ),
                              child: Text(
                                DateFormat('dd/MM/yyyy').format(_handoverDate),
                                style: TextStyle(color: textPrimary, fontSize: 13),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: InkWell(
                            onTap: () async {
                              final picked = await showDatePicker(
                                context: context,
                                initialDate: _warrantyStartDate,
                                firstDate: DateTime(2020),
                                lastDate: DateTime(2035),
                              );
                              if (picked != null) {
                                setState(() {
                                  _warrantyStartDate = picked;
                                });
                              }
                            },
                            child: InputDecorator(
                              decoration: InputDecoration(
                                labelText: "Warranty Start Date *",
                                labelStyle: TextStyle(color: textSecondary, fontSize: 11),
                                filled: true,
                                fillColor: inputBg,
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: borderColor)),
                                enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: borderColor)),
                              ),
                              child: Text(
                                DateFormat('dd/MM/yyyy').format(_warrantyStartDate),
                                style: TextStyle(color: textPrimary, fontSize: 13),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),

                    // 1st Routine Service Date & Handover Status Row
                    Row(
                      children: [
                        Expanded(
                          child: InkWell(
                            onTap: () async {
                              final picked = await showDatePicker(
                                context: context,
                                initialDate: _firstServiceDueDate,
                                firstDate: DateTime(2020),
                                lastDate: DateTime(2035),
                              );
                              if (picked != null) {
                                setState(() => _firstServiceDueDate = picked);
                              }
                            },
                            child: InputDecorator(
                              decoration: InputDecoration(
                                labelText: "1st Routine Service Date *",
                                labelStyle: TextStyle(color: textSecondary, fontSize: 11),
                                filled: true,
                                fillColor: inputBg,
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: borderColor)),
                                enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: borderColor)),
                              ),
                              child: Text(
                                DateFormat('dd/MM/yyyy').format(_firstServiceDueDate),
                                style: TextStyle(color: textPrimary, fontSize: 13),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: DropdownButtonFormField<String>(
                            initialValue: _handoverStatus,
                            style: TextStyle(color: textPrimary, fontSize: 12),
                            dropdownColor: cardBg,
                            decoration: InputDecoration(
                              labelText: "Overall Handover Status *",
                              labelStyle: TextStyle(color: textSecondary, fontSize: 11),
                              filled: true,
                              fillColor: inputBg,
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: borderColor)),
                              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: borderColor)),
                            ),
                            items: _statusOptions.map((opt) => DropdownMenuItem(value: opt, child: Text(opt, overflow: TextOverflow.ellipsis))).toList(),
                            onChanged: (val) {
                              if (val != null) setState(() => _handoverStatus = val);
                            },
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),

                    // Handover Manager
                    TextFormField(
                      controller: _handoverManagerCtrl,
                      style: TextStyle(color: textPrimary, fontSize: 13),
                      decoration: InputDecoration(
                        labelText: "Handover Manager *",
                        labelStyle: TextStyle(color: textSecondary, fontSize: 12),
                        hintText: "e.g. Er. Rajesh Meena",
                        hintStyle: TextStyle(color: textSecondary.withValues(alpha: 0.5), fontSize: 11),
                        filled: true,
                        fillColor: inputBg,
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: borderColor)),
                        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: borderColor)),
                      ),
                    ),
                    const SizedBox(height: 20),

                    // ==========================================
                    // 2. CUSTOMER OPERATIONAL TRAINING & MOBILE APP
                    // ==========================================
                    _buildSectionTitle("2. CUSTOMER OPERATIONAL TRAINING & MOBILE APP", Icons.school_rounded, const Color(0xFFF59E0B)),
                    const SizedBox(height: 10),

                    Row(
                      children: [
                        Expanded(
                          child: DropdownButtonFormField<String>(
                            initialValue: _trainingCompleted,
                            style: TextStyle(color: textPrimary, fontSize: 12),
                            dropdownColor: cardBg,
                            decoration: InputDecoration(
                              labelText: "System Operations Training",
                              labelStyle: TextStyle(color: textSecondary, fontSize: 11),
                              filled: true,
                              fillColor: inputBg,
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: borderColor)),
                              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: borderColor)),
                            ),
                            items: _trainingOptions.map((opt) => DropdownMenuItem(value: opt, child: Text(opt))).toList(),
                            onChanged: (val) {
                              if (val != null) setState(() => _trainingCompleted = val);
                            },
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: DropdownButtonFormField<String>(
                            initialValue: _appDemoCompleted,
                            style: TextStyle(color: textPrimary, fontSize: 12),
                            dropdownColor: cardBg,
                            decoration: InputDecoration(
                              labelText: "Monitoring App Demo",
                              labelStyle: TextStyle(color: textSecondary, fontSize: 11),
                              filled: true,
                              fillColor: inputBg,
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: borderColor)),
                              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: borderColor)),
                            ),
                            items: _trainingOptions.map((opt) => DropdownMenuItem(value: opt, child: Text(opt))).toList(),
                            onChanged: (val) {
                              if (val != null) setState(() => _appDemoCompleted = val);
                            },
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),

                    Row(
                      children: [
                        Expanded(
                          child: DropdownButtonFormField<bool>(
                            initialValue: _monitoringAppAccessShared,
                            style: TextStyle(color: textPrimary, fontSize: 12),
                            dropdownColor: cardBg,
                            decoration: InputDecoration(
                              labelText: "Monitoring App Login Shared?",
                              labelStyle: TextStyle(color: textSecondary, fontSize: 11),
                              filled: true,
                              fillColor: inputBg,
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: borderColor)),
                              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: borderColor)),
                            ),
                            items: const [
                              DropdownMenuItem(value: true, child: Text("Yes")),
                              DropdownMenuItem(value: false, child: Text("No (Pending setup)")),
                            ],
                            onChanged: (val) {
                              if (val != null) setState(() => _monitoringAppAccessShared = val);
                            },
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: DropdownButtonFormField<bool>(
                            initialValue: _emergencyContactGiven,
                            style: TextStyle(color: textPrimary, fontSize: 12),
                            dropdownColor: cardBg,
                            decoration: InputDecoration(
                              labelText: "Emergency Helpline Sticker Pasted?",
                              labelStyle: TextStyle(color: textSecondary, fontSize: 11),
                              filled: true,
                              fillColor: inputBg,
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: borderColor)),
                              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: borderColor)),
                            ),
                            items: const [
                              DropdownMenuItem(value: true, child: Text("Yes")),
                              DropdownMenuItem(value: false, child: Text("No")),
                            ],
                            onChanged: (val) {
                              if (val != null) setState(() => _emergencyContactGiven = val);
                            },
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),

                    // ==========================================
                    // 3. GRANULAR MULTI-COMPONENT WARRANTY END DATES
                    // ==========================================
                    _buildSectionTitle("3. GRANULAR MULTI-COMPONENT WARRANTY END DATES", Icons.security_rounded, const Color(0xFF10B981)),
                    const SizedBox(height: 10),

                    Row(
                      children: [
                        Expanded(
                          child: _buildWarrantyCard(
                            title: "Solar Modules",
                            years: _moduleWarrantyYears,
                            expiryDate: _addYears(_warrantyStartDate, _moduleWarrantyYears),
                            onChanged: (y) => setState(() => _moduleWarrantyYears = y),
                            inputBg: inputBg,
                            borderColor: borderColor,
                            textPrimary: textPrimary,
                            textSecondary: textSecondary,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: _buildWarrantyCard(
                            title: "Grid Inverter",
                            years: _inverterWarrantyYears,
                            expiryDate: _addYears(_warrantyStartDate, _inverterWarrantyYears),
                            onChanged: (y) => setState(() => _inverterWarrantyYears = y),
                            inputBg: inputBg,
                            borderColor: borderColor,
                            textPrimary: textPrimary,
                            textSecondary: textSecondary,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),

                    Row(
                      children: [
                        Expanded(
                          child: _buildWarrantyCard(
                            title: "Workmanship",
                            years: _workmanshipWarrantyYears,
                            expiryDate: _addYears(_warrantyStartDate, _workmanshipWarrantyYears),
                            onChanged: (y) => setState(() => _workmanshipWarrantyYears = y),
                            inputBg: inputBg,
                            borderColor: borderColor,
                            textPrimary: textPrimary,
                            textSecondary: textSecondary,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: _buildWarrantyCard(
                            title: "Free AMC",
                            years: _amcWarrantyYears,
                            expiryDate: _addYears(_warrantyStartDate, _amcWarrantyYears),
                            onChanged: (y) => setState(() => _amcWarrantyYears = y),
                            inputBg: inputBg,
                            borderColor: borderColor,
                            textPrimary: textPrimary,
                            textSecondary: textSecondary,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),

                    // ==========================================
                    // 4. STATUTORY DOCUMENT PACK CHECKLIST
                    // ==========================================
                    _buildSectionTitle("4. STATUTORY DOCUMENT PACK CHECKLIST", Icons.receipt_long_rounded, const Color(0xFFEF4444)),
                    const SizedBox(height: 10),

                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: cardBg,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: borderColor),
                      ),
                      child: Column(
                        children: _dossierChecklist.map((item) {
                          return Padding(
                            padding: const EdgeInsets.symmetric(vertical: 4),
                            child: Row(
                              children: [
                                SizedBox(
                                  width: 22,
                                  height: 22,
                                  child: Checkbox(
                                    value: item['checked'] ?? false,
                                    activeColor: const Color(0xFF10B981),
                                    onChanged: (v) {
                                      setState(() => item['checked'] = v ?? false);
                                    },
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    item['label'] ?? '',
                                    style: TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w600,
                                      color: textPrimary,
                                      height: 1.3,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          );
                        }).toList(),
                      ),
                    ),
                    const SizedBox(height: 20),

                    // ==========================================
                    // 5. CUSTOMER ACCEPTANCE SIGNOFF & PHOTO EVIDENCE
                    // ==========================================
                    _buildSectionTitle("5. CUSTOMER ACCEPTANCE SIGNOFF & PHOTO EVIDENCE", Icons.assignment_turned_in_rounded, const Color(0xFF8B5CF6)),
                    const SizedBox(height: 10),

                    DropdownButtonFormField<String>(
                      initialValue: _signoffType,
                      style: TextStyle(color: textPrimary, fontSize: 13),
                      dropdownColor: cardBg,
                      decoration: InputDecoration(
                        labelText: "Customer Signoff Status *",
                        labelStyle: TextStyle(color: textSecondary, fontSize: 12),
                        filled: true,
                        fillColor: inputBg,
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: borderColor)),
                        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: borderColor)),
                      ),
                      items: _signoffOptions.map((opt) => DropdownMenuItem(value: opt, child: Text(opt))).toList(),
                      onChanged: (val) {
                        if (val != null) setState(() => _signoffType = val);
                      },
                    ),
                    const SizedBox(height: 10),

                    Row(
                      children: [
                        Expanded(
                          child: TextFormField(
                            controller: _signatoryNameCtrl,
                            style: TextStyle(color: textPrimary, fontSize: 13),
                            decoration: InputDecoration(
                              labelText: "Signatory Customer Name",
                              labelStyle: TextStyle(color: textSecondary, fontSize: 11),
                              filled: true,
                              fillColor: inputBg,
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: borderColor)),
                              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: borderColor)),
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: TextFormField(
                            controller: _signatoryPhoneCtrl,
                            style: TextStyle(color: textPrimary, fontSize: 13),
                            keyboardType: TextInputType.phone,
                            decoration: InputDecoration(
                              labelText: "Signatory Mobile Phone",
                              labelStyle: TextStyle(color: textSecondary, fontSize: 11),
                              filled: true,
                              fillColor: inputBg,
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: borderColor)),
                              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: borderColor)),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),

                    // Scanned Docket & Photo Link
                    TextFormField(
                      controller: _signedDocketUrlCtrl,
                      style: TextStyle(color: textPrimary, fontSize: 13),
                      decoration: InputDecoration(
                        labelText: "Scanned Signed Docket URL",
                        labelStyle: TextStyle(color: textSecondary, fontSize: 11),
                        hintText: "https://.../signed-docket.pdf",
                        hintStyle: TextStyle(color: textSecondary.withValues(alpha: 0.5), fontSize: 11),
                        filled: true,
                        fillColor: inputBg,
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: borderColor)),
                        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: borderColor)),
                      ),
                    ),
                    const SizedBox(height: 10),

                    TextFormField(
                      controller: _handoverPhotoUrlCtrl,
                      style: TextStyle(color: textPrimary, fontSize: 13),
                      decoration: InputDecoration(
                        labelText: "Handover Site Photo URL (Customer + Plant)",
                        labelStyle: TextStyle(color: textSecondary, fontSize: 11),
                        hintText: "https://.../customer_handover.jpg",
                        hintStyle: TextStyle(color: textSecondary.withValues(alpha: 0.5), fontSize: 11),
                        filled: true,
                        fillColor: inputBg,
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: borderColor)),
                        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: borderColor)),
                      ),
                    ),
                    const SizedBox(height: 12),

                    // Digital Signature Canvas
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
                                "Customer Handover Signature (Draw or Upload)",
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

                          // Tab selector
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
                            InkWell(
                              onTap: _pickSignatureImage,
                              child: Container(
                                height: 100,
                                decoration: BoxDecoration(
                                  color: inputBg,
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(color: borderColor),
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
                    const SizedBox(height: 20),

                    // ==========================================
                    // 6. CUSTOMER SATISFACTION REVIEW (ONLINE LINK)
                    // ==========================================
                    _buildSectionTitle("6. CUSTOMER SATISFACTION REVIEW (ONLINE LINK & FEEDBACK)", Icons.star_rate_rounded, const Color(0xFFF59E0B)),
                    const SizedBox(height: 10),

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
                          Text(
                            "Customer Online Review Link (Copy & Share via WhatsApp)",
                            style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: textSecondary),
                          ),
                          const SizedBox(height: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                            decoration: BoxDecoration(
                              color: inputBg,
                              borderRadius: BorderRadius.circular(6),
                              border: Border.all(color: borderColor),
                            ),
                            child: Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    reviewUrl,
                                    style: TextStyle(fontSize: 11, color: textPrimary),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                                const SizedBox(width: 6),
                                OutlinedButton.icon(
                                  onPressed: () {
                                    Clipboard.setData(ClipboardData(text: reviewUrl));
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      const SnackBar(content: Text("Review link copied to clipboard!")),
                                    );
                                  },
                                  icon: const Icon(Icons.copy, size: 12),
                                  label: const Text("Copy", style: TextStyle(fontSize: 10)),
                                  style: OutlinedButton.styleFrom(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                    minimumSize: const Size(50, 26),
                                  ),
                                ),
                                const SizedBox(width: 6),
                                ElevatedButton.icon(
                                  onPressed: () async {
                                    final phone = widget.project.customerPhone.replaceAll(RegExp(r'\D'), '');
                                    final text = "Namaste ${widget.project.customerName} ji, please share your valuable review & rating for your solar rooftop installation:\n$reviewUrl";
                                    final url = "https://wa.me/${phone.length == 10 ? '91$phone' : phone}?text=${Uri.encodeComponent(text)}";
                                    final uri = Uri.parse(url);
                                    if (await canLaunchUrl(uri)) {
                                      await launchUrl(uri, mode: LaunchMode.externalApplication);
                                    }
                                  },
                                  icon: const Icon(Icons.send, size: 12),
                                  label: const Text("WhatsApp", style: TextStyle(fontSize: 10)),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: const Color(0xFF25D366),
                                    foregroundColor: Colors.white,
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                    minimumSize: const Size(60, 26),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 10),
                          Row(
                            children: [
                              Text(
                                "Customer Star Rating: ",
                                style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: textSecondary),
                              ),
                              Row(
                                children: List.generate(5, (index) {
                                  return Icon(
                                    index < _customerRating ? Icons.star : Icons.star_border,
                                    size: 16,
                                    color: const Color(0xFFF59E0B),
                                  );
                                }),
                              ),
                              const SizedBox(width: 6),
                              Text(
                                "($_customerRating / 5)",
                                style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: textPrimary),
                              ),
                            ],
                          ),
                          const SizedBox(height: 10),
                          TextFormField(
                            controller: _remarksCtrl,
                            maxLines: 2,
                            style: TextStyle(color: textPrimary, fontSize: 13),
                            decoration: InputDecoration(
                              labelText: "Supervisor Handover Remarks (Internal Team Notes)",
                              labelStyle: TextStyle(color: textSecondary, fontSize: 11),
                              hintText: "Internal audit notes, client special requests...",
                              hintStyle: TextStyle(color: textSecondary.withValues(alpha: 0.5), fontSize: 11),
                              filled: true,
                              fillColor: inputBg,
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: borderColor)),
                              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: borderColor)),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 30),
                  ],
                ),
              ),
            ),
          ),

          // Bottom Bar
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
                        : const Text("Save Handover Dossier", style: TextStyle(fontWeight: FontWeight.w800)),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title, IconData icon, Color color) {
    return Row(
      children: [
        Icon(icon, size: 16, color: color),
        const SizedBox(width: 6),
        Expanded(
          child: Text(
            title,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w800,
              color: color,
              letterSpacing: 0.3,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildWarrantyCard({
    required String title,
    required int years,
    required DateTime expiryDate,
    required Function(int) onChanged,
    required Color inputBg,
    required Color borderColor,
    required Color textPrimary,
    required Color textSecondary,
  }) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: inputBg,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: borderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            "$title (Yrs)",
            style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: textSecondary),
          ),
          const SizedBox(height: 4),
          DropdownButtonHideUnderline(
            child: DropdownButton<int>(
              value: years,
              isDense: true,
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: textPrimary),
              dropdownColor: inputBg,
              items: [1, 2, 3, 5, 7, 10, 12, 15, 20, 25, 30].map((y) {
                return DropdownMenuItem(value: y, child: Text("$y Yrs"));
              }).toList(),
              onChanged: (val) {
                if (val != null) onChanged(val);
              },
            ),
          ),
          const SizedBox(height: 4),
          Text(
            "Expires: ${DateFormat('dd MMM yyyy').format(expiryDate)}",
            style: TextStyle(fontSize: 9, color: textSecondary),
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

