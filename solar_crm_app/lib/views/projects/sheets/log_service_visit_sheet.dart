// lib/views/projects/sheets/log_service_visit_sheet.dart

import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../../models/project_model.dart';
import '../../../providers/project_provider.dart';

class LogServiceVisitSheet extends StatefulWidget {
  final ProjectModel project;

  const LogServiceVisitSheet({
    super.key,
    required this.project,
  });

  static Future<bool?> show(BuildContext context, {required ProjectModel project}) {
    return showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => LogServiceVisitSheet(project: project),
    );
  }

  @override
  State<LogServiceVisitSheet> createState() => _LogServiceVisitSheetState();
}

class _LogServiceVisitSheetState extends State<LogServiceVisitSheet> {
  final _formKey = GlobalKey<FormState>();

  late TextEditingController _visitDateController;
  late TextEditingController _technicianController;
  late TextEditingController _issueController;
  late TextEditingController _resolutionController;

  String _status = "Completed";
  bool _isSaving = false;
  String? _validationError;

  final List<String> _statusOptions = ["Completed", "Pending", "Escalated"];

  @override
  void initState() {
    super.initState();
    _visitDateController = TextEditingController(
      text: DateFormat('yyyy-MM-dd').format(DateTime.now()),
    );
    _technicianController = TextEditingController();
    _issueController = TextEditingController();
    _resolutionController = TextEditingController();
  }

  @override
  void dispose() {
    _visitDateController.dispose();
    _technicianController.dispose();
    _issueController.dispose();
    _resolutionController.dispose();
    super.dispose();
  }

  Future<void> _pickDate() async {
    DateTime initial = DateTime.now();
    try {
      if (_visitDateController.text.isNotEmpty) {
        initial = DateTime.parse(_visitDateController.text);
      }
    } catch (_) {}

    final picked = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime(2020),
      lastDate: DateTime(2035),
    );

    if (picked != null) {
      setState(() {
        _visitDateController.text = DateFormat('yyyy-MM-dd').format(picked);
      });
    }
  }

  Future<void> _handleSave() async {
    setState(() => _validationError = null);

    if (_visitDateController.text.trim().isEmpty) {
      setState(() => _validationError = "Visit date is required.");
      return;
    }
    if (_technicianController.text.trim().isEmpty) {
      setState(() => _validationError = "Technician / Engineer name is required.");
      return;
    }
    if (_issueController.text.trim().isEmpty) {
      setState(() => _validationError = "Please describe the issue or scope of work.");
      return;
    }

    setState(() => _isSaving = true);

    try {
      final payload = {
        'visit_date': _visitDateController.text.trim(),
        'technician': _technicianController.text.trim(),
        'issue_reported': _issueController.text.trim(),
        'resolution': _resolutionController.text.trim(),
        'status': _status,
      };

      final provider = context.read<ProjectProvider>();
      final res = await provider.addServiceVisit(widget.project.id, payload);

      if (mounted) {
        if (res['success'] == true) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(res['message'] ?? 'Service visit logged successfully!'),
              backgroundColor: const Color(0xFF10B981),
            ),
          );
          Navigator.of(context).pop(true);
        } else {
          setState(() {
            _validationError = res['message'] ?? 'Failed to log service visit.';
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

    return Container(
      height: MediaQuery.of(context).size.height * 0.80,
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
                    color: isDark ? const Color(0xFF3B2506) : const Color(0xFFFEF3C7),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(Icons.build_rounded, color: Color(0xFFD97706), size: 20),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        "Log Service / Maintenance Visit",
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: textPrimary),
                      ),
                      Text(
                        "${widget.project.projectNumber} • Field Visit Entry",
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
                    // Inline Error
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

                    Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: cardBg,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: borderColor),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Visit Date
                          Text(
                            "VISIT DATE *",
                            style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: textSecondary),
                          ),
                          const SizedBox(height: 6),
                          InkWell(
                            onTap: _pickDate,
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
                                    _visitDateController.text,
                                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: textPrimary),
                                  ),
                                  Icon(Icons.calendar_month_rounded, size: 16, color: textSecondary),
                                ],
                              ),
                            ),
                          ),

                          const SizedBox(height: 12),

                          // Attending Technician
                          Text(
                            "ATTENDING TECHNICIAN / ENGINEER *",
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
                              controller: _technicianController,
                              style: TextStyle(fontSize: 13, color: textPrimary, fontWeight: FontWeight.w600),
                              decoration: InputDecoration(
                                hintText: "e.g. Er. Mahesh Choudhary",
                                hintStyle: TextStyle(fontSize: 12, color: textSecondary),
                                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                                border: InputBorder.none,
                              ),
                            ),
                          ),

                          const SizedBox(height: 12),

                          // Issue Reported / Scope
                          Text(
                            "ISSUE REPORTED / SCOPE OF WORK *",
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
                              controller: _issueController,
                              maxLines: 3,
                              style: TextStyle(fontSize: 13, color: textPrimary, fontWeight: FontWeight.w600),
                              decoration: InputDecoration(
                                hintText: "Describe issue reported or preventive maintenance scope...",
                                hintStyle: TextStyle(fontSize: 12, color: textSecondary),
                                contentPadding: const EdgeInsets.all(12),
                                border: InputBorder.none,
                              ),
                            ),
                          ),

                          const SizedBox(height: 12),

                          // Resolution / Action Taken
                          Text(
                            "ACTION TAKEN / RESOLUTION",
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
                              controller: _resolutionController,
                              maxLines: 3,
                              style: TextStyle(fontSize: 13, color: textPrimary, fontWeight: FontWeight.w600),
                              decoration: InputDecoration(
                                hintText: "Describe rectifications performed, parts replaced or observations...",
                                hintStyle: TextStyle(fontSize: 12, color: textSecondary),
                                contentPadding: const EdgeInsets.all(12),
                                border: InputBorder.none,
                              ),
                            ),
                          ),

                          const SizedBox(height: 12),

                          // Visit Status
                          Text(
                            "VISIT STATUS *",
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
                              child: DropdownButton<String>(
                                isExpanded: true,
                                value: _status,
                                dropdownColor: cardBg,
                                items: _statusOptions.map((st) {
                                  return DropdownMenuItem<String>(
                                    value: st,
                                    child: Text(
                                      st,
                                      style: TextStyle(fontSize: 13, color: textPrimary, fontWeight: FontWeight.w600),
                                    ),
                                  );
                                }).toList(),
                                onChanged: (val) {
                                  if (val != null) setState(() => _status = val);
                                },
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 24),

                    // Submit Button
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
                          _isSaving ? "Saving..." : "Save Service Log",
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
}

