import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_typography.dart';
import '../../../models/lead_model.dart';
import '../../../providers/auth_provider.dart';
import '../../../providers/dashboard_provider.dart';
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
  late TextEditingController _nextActionController;

  String _followupType = "Call";
  String _callOutcome = "Connected";
  late String _statusAfterFollowup;

  DateTime? _nextFollowUpDate;
  TimeOfDay? _nextFollowUpTime;

  bool _isLoading = false;
  String? _errorMessage;

  // Canonical outcomes matching solar_crm_backend/services/salesWorkflow.js OUTCOMES
  static const List<String> _callOutcomes = [
    "Connected",
    "No answer",
    "Busy",
    "Call later",
    "Wrong number",
    "Meeting completed",
    "Note only",
  ];

  static const List<String> _activityTypes = [
    "Call",
    "WhatsApp",
    "Meeting",
    "Site Visit",
    "Other",
  ];

  static const List<String> _pipelineStatuses = [
    "New Lead",
    "Contacted",
    "Qualified",
    "Site Survey Scheduled",
    "Site Survey Done",
    "Quotation Sent",
    "Negotiation",
    "Won",
    "On Hold",
    "Lost",
    "Invalid",
  ];

  static const List<String> _closedStatuses = ["Won", "Lost", "Invalid", "Not Interested"];

  bool get _isClosed => _closedStatuses.contains(_statusAfterFollowup);

  @override
  void initState() {
    super.initState();
    final l = widget.lead;
    _statusAfterFollowup = _pipelineStatuses.contains(l.status) ? l.status : "Contacted";
    _nextActionController = TextEditingController(text: l.nextAction ?? "");

    // Hydrate existing follow-up date or default to tomorrow
    if (l.nextFollowUpDate != null && l.nextFollowUpDate!.trim().isNotEmpty) {
      try {
        _nextFollowUpDate = DateTime.tryParse(l.nextFollowUpDate!.split('T')[0]);
      } catch (_) {}
    }
    _nextFollowUpDate ??= DateTime.now().add(const Duration(days: 1));

    // Hydrate existing follow-up time or default to 11:00 AM
    if (l.nextFollowUpTime != null && l.nextFollowUpTime!.trim().isNotEmpty) {
      final parts = l.nextFollowUpTime!.trim().split(':');
      if (parts.length >= 2) {
        final h = int.tryParse(parts[0]);
        final m = int.tryParse(parts[1]);
        if (h != null && m != null) {
          _nextFollowUpTime = TimeOfDay(hour: h, minute: m);
        }
      }
    }
    _nextFollowUpTime ??= const TimeOfDay(hour: 11, minute: 0);
  }

  @override
  void dispose() {
    _noteController.dispose();
    _nextActionController.dispose();
    super.dispose();
  }

  Future<void> _pickDate() async {
    final now = DateTime.now();
    final initial = _nextFollowUpDate ?? now.add(const Duration(days: 1));
    final picked = await showDatePicker(
      context: context,
      initialDate: initial.isBefore(now) ? now : initial,
      firstDate: now.subtract(const Duration(days: 1)),
      lastDate: now.add(const Duration(days: 365)),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: Theme.of(context).brightness == Brightness.dark
                ? const ColorScheme.dark(
                    primary: AppColors.brandPrimary,
                    onPrimary: Colors.black,
                    surface: AppColors.darkSurfaceElevated,
                    onSurface: AppColors.textPrimaryDark,
                  )
                : const ColorScheme.light(
                    primary: AppColors.brandPrimary,
                    onPrimary: Colors.white,
                    surface: Colors.white,
                    onSurface: AppColors.textPrimaryLight,
                  ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null) {
      setState(() => _nextFollowUpDate = picked);
    }
  }

  Future<void> _pickTime() async {
    final picked = await showTimePicker(
      context: context,
      initialTime: _nextFollowUpTime ?? const TimeOfDay(hour: 11, minute: 0),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: Theme.of(context).brightness == Brightness.dark
                ? const ColorScheme.dark(
                    primary: AppColors.brandPrimary,
                    onPrimary: Colors.black,
                    surface: AppColors.darkSurfaceElevated,
                    onSurface: AppColors.textPrimaryDark,
                  )
                : const ColorScheme.light(
                    primary: AppColors.brandPrimary,
                    onPrimary: Colors.white,
                    surface: Colors.white,
                    onSurface: AppColors.textPrimaryLight,
                  ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null) {
      setState(() => _nextFollowUpTime = picked);
    }
  }

  void _handleSubmit() async {
    if (!_formKey.currentState!.validate()) return;

    if (_noteController.text.trim().isEmpty) {
      setState(() => _errorMessage = "Discussion note is required.");
      return;
    }

    if (!_isClosed) {
      if (_nextActionController.text.trim().isEmpty) {
        setState(() => _errorMessage = "Next action is required for active leads.");
        return;
      }
      if (_nextFollowUpDate == null) {
        setState(() => _errorMessage = "Next follow-up date is required.");
        return;
      }
      if (_nextFollowUpTime == null) {
        setState(() => _errorMessage = "Exact follow-up time is required.");
        return;
      }
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final formattedDate = _nextFollowUpDate != null
        ? DateFormat('yyyy-MM-dd').format(_nextFollowUpDate!)
        : null;

    final formattedTime = _nextFollowUpTime != null
        ? "${_nextFollowUpTime!.hour.toString().padLeft(2, '0')}:${_nextFollowUpTime!.minute.toString().padLeft(2, '0')}"
        : null;

    final leadProvider = Provider.of<LeadProvider>(context, listen: false);

    // Call atomic sales workflow endpoint
    final res = await leadProvider.logCallAction(
      leadId: widget.lead.id,
      note: _noteController.text.trim(),
      callOutcome: _callOutcome,
      followupType: _followupType,
      statusAfterFollowup: _statusAfterFollowup,
      nextAction: _isClosed ? null : _nextActionController.text.trim(),
      nextFollowUpDate: _isClosed ? null : formattedDate,
      nextFollowUpTime: _isClosed ? null : formattedTime,
    );

    if (!mounted) return;

    if (res['success'] == true) {
      // Refresh dashboard counters dynamically
      final auth = Provider.of<AuthProvider>(context, listen: false);
      final dashboard = Provider.of<DashboardProvider>(context, listen: false);
      final u = auth.user;
      if (u != null) {
        if (u.isAdmin) dashboard.fetchAdminDashboard(isRefresh: true);
        if (u.isManager) dashboard.fetchManagerDashboard(isRefresh: true);
        if (u.isSales) dashboard.fetchSalesDashboard(isRefresh: true);
        if (u.isFinance || u.isApplicationManager) dashboard.fetchPortalDashboard(isRefresh: true);
      }

      Navigator.pop(context, true);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(res['message'] ?? "Outcome and next action saved successfully!"),
          backgroundColor: AppColors.emeraldGreen,
        ),
      );
    } else {
      setState(() {
        _isLoading = false;
        _errorMessage = res['message'] ?? "Failed to save outcome and schedule.";
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
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.90,
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
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: AppColors.emeraldGreen.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(Icons.phone_in_talk_rounded, color: AppColors.emeraldGreen, size: 22),
                      ),
                      const SizedBox(width: 10),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            "Log Outcome & Next Action",
                            style: AppTypography.heading(size: 18, color: textPrimary),
                          ),
                          Text(
                            "${widget.lead.customerName} • ${widget.lead.leadCode}",
                            style: AppTypography.caption(color: textSecondary),
                          ),
                        ],
                      ),
                    ],
                  ),
                  IconButton(
                    icon: const Icon(Icons.close_rounded, size: 20),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const SizedBox(height: 14),

              // Info note
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: AppColors.skyBlue.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: AppColors.skyBlue.withValues(alpha: 0.2)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.info_outline_rounded, size: 16, color: AppColors.skyBlue),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        "Calling a number does not mark it contacted; record the actual outcome & next scheduled action.",
                        style: AppTypography.caption(color: textSecondary).copyWith(fontSize: 11),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

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

              // Activity Type & Actual Outcome
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text("ACTIVITY TYPE", style: AppTypography.badge(color: textSecondary)),
                        const SizedBox(height: 6),
                        DropdownButtonFormField<String>(
                          initialValue: _followupType,
                          items: _activityTypes.map((type) {
                            return DropdownMenuItem(
                              value: type,
                              child: Text(type, style: AppTypography.body(color: textPrimary)),
                            );
                          }).toList(),
                          onChanged: (val) {
                            if (val != null) setState(() => _followupType = val);
                          },
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text("ACTUAL OUTCOME *", style: AppTypography.badge(color: AppColors.brandPrimary)),
                        const SizedBox(height: 6),
                        DropdownButtonFormField<String>(
                          initialValue: _callOutcome,
                          items: _callOutcomes.map((outcome) {
                            return DropdownMenuItem(
                              value: outcome,
                              child: Text(outcome, style: AppTypography.body(color: textPrimary)),
                            );
                          }).toList(),
                          onChanged: (val) {
                            if (val != null) setState(() => _callOutcome = val);
                          },
                        ),
                      ],
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 14),

              // Lead Pipeline Status After Activity
              Text("LEAD STATUS AFTER ACTIVITY *", style: AppTypography.badge(color: textSecondary)),
              const SizedBox(height: 6),
              DropdownButtonFormField<String>(
                initialValue: _statusAfterFollowup,
                items: _pipelineStatuses.map((st) {
                  return DropdownMenuItem(
                    value: st,
                    child: Text(st, style: AppTypography.body(color: textPrimary)),
                  );
                }).toList(),
                onChanged: (val) {
                  if (val != null) setState(() => _statusAfterFollowup = val);
                },
                decoration: const InputDecoration(
                  prefixIcon: Icon(Icons.trending_up_rounded, size: 20),
                ),
              ),

              const SizedBox(height: 14),

              // Discussion Remarks / Note
              Text("DISCUSSION NOTE *", style: AppTypography.badge(color: textSecondary)),
              const SizedBox(height: 6),
              TextFormField(
                controller: _noteController,
                maxLines: 3,
                style: AppTypography.body(color: textPrimary),
                decoration: const InputDecoration(
                  hintText: "e.g. Discussed 5kW system, customer requested quotation over WhatsApp...",
                ),
                validator: (val) => val == null || val.trim().isEmpty ? "Discussion note is required" : null,
              ),

              const SizedBox(height: 16),

              // FOLLOW-UP & NEXT ACTION
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: surfaceColor,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: _isClosed ? borderColor : AppColors.brandPrimary.withValues(alpha: 0.3),
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(
                          Icons.schedule_rounded,
                          size: 18,
                          color: _isClosed ? textSecondary : AppColors.brandPrimary,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          _isClosed ? "FOLLOW-UP SCHEDULE (CLOSED)" : "FOLLOW-UP SCHEDULE & NEXT ACTION *",
                          style: AppTypography.badge(
                            color: _isClosed ? textSecondary : AppColors.brandPrimary,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),

                    // Next Action
                    TextFormField(
                      controller: _nextActionController,
                      enabled: !_isClosed,
                      style: AppTypography.body(color: textPrimary),
                      maxLength: 255,
                      decoration: InputDecoration(
                        labelText: _isClosed ? "Next action (optional)" : "Next action *",
                        hintText: "e.g. Share quotation over WhatsApp & follow up tomorrow",
                        prefixIcon: const Icon(Icons.task_alt_rounded, size: 20),
                        counterText: "",
                      ),
                    ),

                    const SizedBox(height: 10),

                    Row(
                      children: [
                        // Date Picker
                        Expanded(
                          child: InkWell(
                            onTap: _isClosed ? null : _pickDate,
                            borderRadius: BorderRadius.circular(10),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                              decoration: BoxDecoration(
                                color: cardBg,
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(color: borderColor),
                              ),
                              child: Row(
                                children: [
                                  Icon(
                                    Icons.calendar_today_rounded,
                                    size: 18,
                                    color: _isClosed ? textSecondary : AppColors.brandPrimary,
                                  ),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      _nextFollowUpDate != null
                                          ? DateFormat('yyyy-MM-dd').format(_nextFollowUpDate!)
                                          : "Follow-up date",
                                      style: AppTypography.bodySmall(
                                        color: _nextFollowUpDate != null ? textPrimary : textSecondary,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),

                        // Time Picker
                        Expanded(
                          child: InkWell(
                            onTap: _isClosed ? null : _pickTime,
                            borderRadius: BorderRadius.circular(10),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                              decoration: BoxDecoration(
                                color: cardBg,
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(color: borderColor),
                              ),
                              child: Row(
                                children: [
                                  Icon(
                                    Icons.access_time_rounded,
                                    size: 18,
                                    color: _isClosed ? textSecondary : AppColors.brandPrimary,
                                  ),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      _nextFollowUpTime != null
                                          ? "${_nextFollowUpTime!.hour.toString().padLeft(2, '0')}:${_nextFollowUpTime!.minute.toString().padLeft(2, '0')}"
                                          : "Exact time",
                                      style: AppTypography.bodySmall(
                                        color: _nextFollowUpTime != null ? textPrimary : textSecondary,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
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
                        "Save Outcome & Schedule",
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
