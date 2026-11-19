import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_typography.dart';
import '../../../models/lead_model.dart';
import '../../../providers/lead_provider.dart';

class LogCallSheet extends StatefulWidget {
  final LeadModel lead;

  const LogCallSheet({super.key, required this.lead});

  @override
  State<LogCallSheet> createState() => _LogCallSheetState();
}

class _LogCallSheetState extends State<LogCallSheet> {
  final _formKey = GlobalKey<FormState>();
  final _noteController = TextEditingController();

  String _selectedStatus = "Contacted";
  DateTime _selectedDate = DateTime.now().add(const Duration(days: 1));
  TimeOfDay _selectedTime = const TimeOfDay(hour: 11, minute: 0);

  bool _isLoading = false;
  String? _errorMessage;

  final List<String> _callOutcomes = [
    "Contacted",
    "Qualified",
    "Site Survey Scheduled",
    "Quotation Sent",
    "Negotiation",
    "Won",
    "On Hold",
    "Lost",
    "Invalid",
  ];

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 90)),
    );
    if (picked != null) {
      setState(() => _selectedDate = picked);
    }
  }

  Future<void> _pickTime() async {
    final picked = await showTimePicker(
      context: context,
      initialTime: _selectedTime,
    );
    if (picked != null) {
      setState(() => _selectedTime = picked);
    }
  }

  void _handleSubmit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final formattedDate = DateFormat("yyyy-MM-dd").format(_selectedDate);
    final formattedTime = "${_selectedTime.hour.toString().padLeft(2, '0')}:${_selectedTime.minute.toString().padLeft(2, '0')}:00";

    final provider = Provider.of<LeadProvider>(context, listen: false);
    final res = await provider.addFollowup(
      leadId: widget.lead.id,
      followupDate: formattedDate,
      followupTime: formattedTime,
      note: _noteController.text.trim(),
      status: _selectedStatus,
      followupType: "Call",
    );

    if (!mounted) return;
    setState(() => _isLoading = false);

    if (res['success'] == true) {
      Navigator.pop(context, true);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(res['message'] ?? "Follow-up saved successfully!"),
          backgroundColor: AppColors.emeraldGreen,
        ),
      );
    } else {
      setState(() {
        _errorMessage = res['message'] ?? "Failed to save call log.";
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? AppColors.darkCard : AppColors.lightCard;
    final borderColor = isDark ? AppColors.darkBorder : AppColors.lightBorder;
    final textPrimary = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final textSecondary = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;
    final surfaceColor = isDark ? AppColors.darkSurface : AppColors.lightSurface;

    return Container(
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        border: Border(top: BorderSide(color: borderColor)),
      ),
      padding: EdgeInsets.only(
        top: 20,
        left: 20,
        right: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: borderColor,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 16),

              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.phone_in_talk_rounded, color: AppColors.emeraldGreen, size: 22),
                      const SizedBox(width: 8),
                      Text(
                        "Log Call Outcome",
                        style: AppTypography.heading(size: 20, color: textPrimary),
                      ),
                    ],
                  ),
                  IconButton(
                    icon: const Icon(Icons.close_rounded, size: 20),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              Text(
                "${widget.lead.customerName} (${widget.lead.mobileNumber})",
                style: AppTypography.caption(color: textSecondary),
              ),

              const SizedBox(height: 18),

              if (_errorMessage != null) ...[
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.errorRed.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: AppColors.errorRed.withValues(alpha: 0.3)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.error_outline_rounded, color: AppColors.errorRed, size: 18),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          _errorMessage!,
                          style: AppTypography.caption(color: AppColors.errorRed),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
              ],

              // Outcome Selection
              Text("CALL OUTCOME / PIPELINE STAGE *", style: AppTypography.badge(color: textSecondary)),
              const SizedBox(height: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                decoration: BoxDecoration(
                  color: surfaceColor,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: borderColor),
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: _selectedStatus,
                    isExpanded: true,
                    dropdownColor: cardBg,
                    items: _callOutcomes.map((st) {
                      return DropdownMenuItem<String>(
                        value: st,
                        child: Text(st, style: AppTypography.body(color: textPrimary, fontWeight: FontWeight.w500)),
                      );
                    }).toList(),
                    onChanged: (val) {
                      if (val != null) setState(() => _selectedStatus = val);
                    },
                  ),
                ),
              ),

              const SizedBox(height: 16),

              // Conversation Notes
              Text("CONVERSATION REMARKS *", style: AppTypography.badge(color: textSecondary)),
              const SizedBox(height: 6),
              TextFormField(
                controller: _noteController,
                maxLines: 3,
                style: AppTypography.body(color: textPrimary),
                decoration: const InputDecoration(
                  hintText: "What did the customer discuss? Any objections, roof questions, or quotation feedback...",
                ),
                validator: (val) => val == null || val.trim().isEmpty ? "Notes are required" : null,
              ),

              const SizedBox(height: 16),

              // Next Follow-up Date & Time
              Text("SCHEDULE NEXT FOLLOW-UP", style: AppTypography.badge(color: AppColors.brandPrimary)),
              const SizedBox(height: 6),
              Row(
                children: [
                  Expanded(
                    child: InkWell(
                      onTap: _pickDate,
                      borderRadius: BorderRadius.circular(12),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                        decoration: BoxDecoration(
                          color: surfaceColor,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: borderColor),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.calendar_month_outlined, size: 18, color: AppColors.brandPrimary),
                            const SizedBox(width: 8),
                            Text(
                              DateFormat("dd MMM yyyy").format(_selectedDate),
                              style: AppTypography.body(color: textPrimary, fontWeight: FontWeight.w600),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: InkWell(
                      onTap: _pickTime,
                      borderRadius: BorderRadius.circular(12),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                        decoration: BoxDecoration(
                          color: surfaceColor,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: borderColor),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.access_time_rounded, size: 18, color: AppColors.skyBlue),
                            const SizedBox(width: 8),
                            Text(
                              _selectedTime.format(context),
                              style: AppTypography.body(color: textPrimary, fontWeight: FontWeight.w600),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 24),

              ElevatedButton(
                onPressed: _isLoading ? null : _handleSubmit,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.brandPrimary,
                  foregroundColor: Colors.black,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: _isLoading
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black),
                      )
                    : Text(
                        "Save Call Log & Schedule Follow-up",
                        style: AppTypography.button(color: Colors.black),
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

