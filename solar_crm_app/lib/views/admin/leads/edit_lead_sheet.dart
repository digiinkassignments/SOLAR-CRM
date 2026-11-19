import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_typography.dart';
import '../../../models/lead_model.dart';
import '../../../providers/auth_provider.dart';
import '../../../providers/lead_provider.dart';
import '../../../providers/user_provider.dart';

class EditLeadSheet extends StatefulWidget {
  final LeadModel lead;

  const EditLeadSheet({super.key, required this.lead});

  static Future<bool?> show(BuildContext context, {required LeadModel lead}) {
    return showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => EditLeadSheet(lead: lead),
    );
  }

  @override
  State<EditLeadSheet> createState() => _EditLeadSheetState();
}

class _EditLeadSheetState extends State<EditLeadSheet> {
  final _formKey = GlobalKey<FormState>();

  late TextEditingController _nameController;
  late TextEditingController _mobileController;
  late TextEditingController _altMobileController;
  late TextEditingController _emailController;
  late TextEditingController _addressController;
  late TextEditingController _cityController;
  late TextEditingController _stateController;
  late TextEditingController _pincodeController;
  late TextEditingController _capacityController;
  late TextEditingController _consumptionController;
  late TextEditingController _quotationController;
  late TextEditingController _remarkController;
  late TextEditingController _nextActionController;

  DateTime? _nextFollowUpDate;
  TimeOfDay? _nextFollowUpTime;

  late String _solarRequirement;
  late String _interestStatus;
  late String _priority;
  late String _leadSource;
  late String _roofType;
  late String _status;
  int? _assignedTo;

  bool _isLoading = false;
  String? _errorMessage;

  static const List<String> _canonicalStages = [
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

  static const List<String> _leadSources = [
    "Website",
    "Referral",
    "Social Media",
    "Direct",
    "Cold Call",
    "Campaign",
    "Other",
  ];

  static const List<String> _closedStatuses = ["Won", "Lost", "Invalid", "Not Interested"];

  bool get _isClosedStatus =>
      _closedStatuses.contains(_status) || _interestStatus == "Not Interested";

  @override
  void initState() {
    super.initState();
    final l = widget.lead;
    _nameController = TextEditingController(text: l.customerName);
    _mobileController = TextEditingController(text: l.mobileNumber);
    _altMobileController = TextEditingController(text: l.alternateNumber ?? "");
    _emailController = TextEditingController(text: l.email ?? "");
    _addressController = TextEditingController(text: l.address ?? "");
    _cityController = TextEditingController(text: l.city ?? "");
    _stateController = TextEditingController(text: l.state ?? "");
    _pincodeController = TextEditingController(text: l.pincode ?? "");
    _capacityController = TextEditingController(text: l.requiredKw.toString());
    _consumptionController = TextEditingController(
      text: l.monthlyConsumptionUnits != null ? l.monthlyConsumptionUnits.toString() : "",
    );
    _quotationController = TextEditingController(
      text: l.quotationAmount > 0 ? l.quotationAmount.toString() : "",
    );
    _remarkController = TextEditingController(text: l.remark ?? "");
    _nextActionController = TextEditingController(text: l.nextAction ?? "");

    _solarRequirement = ["Residential", "Commercial", "Industrial"].contains(l.solarRequirement)
        ? l.solarRequirement
        : "Residential";
    _interestStatus = ["Interested", "Pending", "Not Interested"].contains(l.interestStatus)
        ? l.interestStatus
        : "Interested";
    _priority = ["High", "Medium", "Low"].contains(l.priority) ? l.priority : "Medium";
    _leadSource = _leadSources.contains(l.leadSource) ? l.leadSource : "Website";
    _roofType = l.roofType ?? "RCC Flat Roof";
    _status = _canonicalStages.contains(l.status) ? l.status : "New Lead";
    _assignedTo = l.assignedTo;

    // Hydrate existing follow-up date
    if (l.nextFollowUpDate != null && l.nextFollowUpDate!.trim().isNotEmpty) {
      try {
        final cleanDate = l.nextFollowUpDate!.split('T')[0];
        _nextFollowUpDate = DateTime.tryParse(cleanDate);
      } catch (_) {}
    }

    // Hydrate existing follow-up time
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

    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<UserProvider>(context, listen: false).fetchUsers();
    });
  }

  @override
  void dispose() {
    _nameController.dispose();
    _mobileController.dispose();
    _altMobileController.dispose();
    _emailController.dispose();
    _addressController.dispose();
    _cityController.dispose();
    _stateController.dispose();
    _pincodeController.dispose();
    _capacityController.dispose();
    _consumptionController.dispose();
    _quotationController.dispose();
    _remarkController.dispose();
    _nextActionController.dispose();
    super.dispose();
  }

  Future<void> _pickDate() async {
    final now = DateTime.now();
    final initial = _nextFollowUpDate ?? now.add(const Duration(days: 1));
    final picked = await showDatePicker(
      context: context,
      initialDate: initial.isBefore(now) ? now : initial,
      firstDate: now.subtract(const Duration(days: 30)),
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

    final auth = Provider.of<AuthProvider>(context, listen: false);
    final user = auth.user;

    // Backend validations matching leadController.js
    final cap = double.tryParse(_capacityController.text.trim()) ?? 0.0;
    if (_interestStatus == "Interested" && cap <= 0) {
      setState(() {
        _errorMessage = "Required Solar Capacity in kW is mandatory when status is 'Interested'.";
      });
      return;
    }

    if (_interestStatus == "Not Interested" && _remarkController.text.trim().isEmpty) {
      setState(() {
        _errorMessage = "Remark is mandatory when status is 'Not Interested'.";
      });
      return;
    }

    // Manager own-team assignment restriction
    if (user?.isManager == true && _assignedTo != null && _assignedTo != widget.lead.assignedTo) {
      final userProvider = Provider.of<UserProvider>(context, listen: false);
      final inTeam = userProvider.users.any((u) => u.id == _assignedTo && u.managerId == user!.id);
      if (!inTeam) {
        setState(() {
          _errorMessage = "You can only assign leads to your own team members.";
        });
        return;
      }
    }

    // Active leads require Next Action, Follow-up Date and Exact Time
    if (!_isClosedStatus) {
      final nextActionVal = _nextActionController.text.trim().isNotEmpty
          ? _nextActionController.text.trim()
          : (widget.lead.nextAction ?? "");

      if (nextActionVal.isEmpty) {
        setState(() {
          _errorMessage = "Active leads require a next action, follow-up date and exact time.";
        });
        return;
      }

      if (_nextFollowUpDate == null && (widget.lead.nextFollowUpDate == null || widget.lead.nextFollowUpDate!.isEmpty)) {
        setState(() {
          _errorMessage = "Follow-up date is required for active leads.";
        });
        return;
      }

      if (_nextFollowUpTime == null && (widget.lead.nextFollowUpTime == null || widget.lead.nextFollowUpTime!.isEmpty)) {
        setState(() {
          _errorMessage = "Exact follow-up time is required for active leads.";
        });
        return;
      }
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final formattedDate = _nextFollowUpDate != null
        ? DateFormat('yyyy-MM-dd').format(_nextFollowUpDate!)
        : (widget.lead.nextFollowUpDate != null && widget.lead.nextFollowUpDate!.isNotEmpty
            ? widget.lead.nextFollowUpDate!.split('T')[0]
            : null);

    final formattedTime = _nextFollowUpTime != null
        ? "${_nextFollowUpTime!.hour.toString().padLeft(2, '0')}:${_nextFollowUpTime!.minute.toString().padLeft(2, '0')}"
        : (widget.lead.nextFollowUpTime != null && widget.lead.nextFollowUpTime!.isNotEmpty
            ? widget.lead.nextFollowUpTime!.substring(0, 5)
            : null);

    final nextAction = _nextActionController.text.trim().isNotEmpty
        ? _nextActionController.text.trim()
        : widget.lead.nextAction;

    final data = <String, dynamic>{
      'customer_name': _nameController.text.trim(),
      'mobile_number': _mobileController.text.trim(),
      'alternate_number': _altMobileController.text.trim().isNotEmpty ? _altMobileController.text.trim() : null,
      'email': _emailController.text.trim().isNotEmpty ? _emailController.text.trim() : null,
      'address': _addressController.text.trim().isNotEmpty ? _addressController.text.trim() : null,
      'city': _cityController.text.trim().isNotEmpty ? _cityController.text.trim() : null,
      'state': _stateController.text.trim().isNotEmpty ? _stateController.text.trim() : null,
      'pincode': _pincodeController.text.trim().isNotEmpty ? _pincodeController.text.trim() : null,
      'solar_requirement': _solarRequirement,
      'interest_status': _interestStatus,
      'required_kw': cap > 0 ? cap : widget.lead.requiredKw,
      'priority': _priority,
      'lead_source': _leadSource,
      'roof_type': _roofType,
      'status': _status,
      'monthly_consumption_units': _consumptionController.text.trim().isNotEmpty ? int.tryParse(_consumptionController.text.trim()) : null,
      'quotation_amount': _quotationController.text.trim().isNotEmpty ? double.tryParse(_quotationController.text.trim()) : null,
      'remark': _remarkController.text.trim().isNotEmpty ? _remarkController.text.trim() : null,
      'assigned_to': user?.isSales == true ? widget.lead.assignedTo : _assignedTo,
      // Retain schedule on unrelated edits or apply user updates
      'next_action': _isClosedStatus ? null : nextAction,
      'next_follow_up_date': _isClosedStatus ? null : formattedDate,
      'next_follow_up_time': _isClosedStatus ? null : formattedTime,
    };

    final provider = Provider.of<LeadProvider>(context, listen: false);
    final res = await provider.updateLead(widget.lead.id, data);

    if (!mounted) return;
    setState(() => _isLoading = false);

    if (res['success'] == true) {
      Navigator.pop(context, true);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(res['message'] ?? "Lead updated successfully!"),
          backgroundColor: AppColors.emeraldGreen,
        ),
      );
    } else {
      setState(() {
        _errorMessage = res['message'] ?? "Failed to update lead.";
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
    final auth = Provider.of<AuthProvider>(context);
    final currentUser = auth.user;
    final userProvider = Provider.of<UserProvider>(context);

    // Filter assignable team members based on role
    List<dynamic> teamMembers;
    if (currentUser?.isSales == true) {
      teamMembers = [];
    } else if (currentUser?.isManager == true) {
      teamMembers = userProvider.users
          .where((u) => u.isActive && u.managerId == currentUser!.id)
          .toList();
    } else {
      teamMembers = userProvider.users.where((u) => u.isActive).toList();
    }

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
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: AppColors.brandPrimary.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(Icons.edit_note_rounded, color: AppColors.brandPrimary, size: 22),
                      ),
                      const SizedBox(width: 12),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text("Edit Lead", style: AppTypography.headingMedium(color: textPrimary)),
                          Text(widget.lead.leadCode, style: AppTypography.caption(color: textSecondary)),
                        ],
                      ),
                    ],
                  ),
                  IconButton(
                    icon: Icon(Icons.close, color: textSecondary),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
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
                      const Icon(Icons.error_outline, color: AppColors.errorRed, size: 20),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          _errorMessage!,
                          style: const TextStyle(color: AppColors.errorRed, fontSize: 13),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
              ],

              // Pipeline Stage & Interest Status
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text("PIPELINE STAGE *", style: AppTypography.badge(color: textSecondary)),
                        const SizedBox(height: 6),
                        DropdownButtonFormField<String>(
                          initialValue: _status,
                          items: _canonicalStages.map((stage) {
                            return DropdownMenuItem(
                              value: stage,
                              child: Text(stage, style: AppTypography.body(color: textPrimary)),
                            );
                          }).toList(),
                          onChanged: (val) {
                            if (val != null) setState(() => _status = val);
                          },
                          decoration: const InputDecoration(
                            prefixIcon: Icon(Icons.trending_up_rounded, size: 20),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text("INTEREST STATUS *", style: AppTypography.badge(color: textSecondary)),
                        const SizedBox(height: 6),
                        DropdownButtonFormField<String>(
                          initialValue: _interestStatus,
                          items: ["Interested", "Pending", "Not Interested"].map((status) {
                            return DropdownMenuItem(
                              value: status,
                              child: Text(status, style: AppTypography.body(color: textPrimary)),
                            );
                          }).toList(),
                          onChanged: (val) {
                            if (val != null) setState(() => _interestStatus = val);
                          },
                          decoration: const InputDecoration(
                            prefixIcon: Icon(Icons.thumb_up_alt_outlined, size: 20),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 14),

              // Customer Name
              Text("CUSTOMER NAME *", style: AppTypography.badge(color: textSecondary)),
              const SizedBox(height: 6),
              TextFormField(
                controller: _nameController,
                style: AppTypography.body(color: textPrimary),
                enabled: currentUser?.isSales != true,
                decoration: InputDecoration(
                  hintText: "Enter full name",
                  prefixIcon: const Icon(Icons.person_outline, size: 20),
                  helperText: currentUser?.isSales == true ? "Customer identity managed by admin" : null,
                ),
                validator: (val) => val == null || val.trim().isEmpty ? "Name is required" : null,
              ),

              const SizedBox(height: 14),

              // Mobile & Alternate Phone
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text("MOBILE NUMBER *", style: AppTypography.badge(color: textSecondary)),
                        const SizedBox(height: 6),
                        TextFormField(
                          controller: _mobileController,
                          keyboardType: TextInputType.phone,
                          enabled: currentUser?.isSales != true,
                          style: AppTypography.body(color: textPrimary),
                          decoration: const InputDecoration(
                            hintText: "10 digits",
                            prefixIcon: Icon(Icons.phone_outlined, size: 20),
                          ),
                          validator: (val) {
                            if (val == null || val.trim().isEmpty) return "Required";
                            if (val.trim().length < 10) return "10 digits";
                            return null;
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
                        Text("ALTERNATE PHONE", style: AppTypography.badge(color: textSecondary)),
                        const SizedBox(height: 6),
                        TextFormField(
                          controller: _altMobileController,
                          keyboardType: TextInputType.phone,
                          enabled: currentUser?.isSales != true,
                          style: AppTypography.body(color: textPrimary),
                          decoration: const InputDecoration(
                            hintText: "Optional",
                            prefixIcon: Icon(Icons.phone_iphone_rounded, size: 20),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 14),

              // Email
              Text("EMAIL ADDRESS", style: AppTypography.badge(color: textSecondary)),
              const SizedBox(height: 6),
              TextFormField(
                controller: _emailController,
                keyboardType: TextInputType.emailAddress,
                enabled: currentUser?.isSales != true,
                style: AppTypography.body(color: textPrimary),
                decoration: const InputDecoration(
                  hintText: "email@example.com",
                  prefixIcon: Icon(Icons.mail_outline_rounded, size: 20),
                ),
              ),

              const SizedBox(height: 14),

              // Priority & Lead Source
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text("PRIORITY", style: AppTypography.badge(color: textSecondary)),
                        const SizedBox(height: 6),
                        DropdownButtonFormField<String>(
                          initialValue: _priority,
                          items: ["High", "Medium", "Low"].map((p) {
                            return DropdownMenuItem(
                              value: p,
                              child: Text(p, style: AppTypography.body(color: textPrimary)),
                            );
                          }).toList(),
                          onChanged: (val) {
                            if (val != null) setState(() => _priority = val);
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
                        Text("LEAD SOURCE", style: AppTypography.badge(color: textSecondary)),
                        const SizedBox(height: 6),
                        DropdownButtonFormField<String>(
                          initialValue: _leadSource,
                          items: _leadSources.map((s) {
                            return DropdownMenuItem(
                              value: s,
                              child: Text(s, style: AppTypography.body(color: textPrimary)),
                            );
                          }).toList(),
                          onChanged: currentUser?.isSales == true
                              ? null
                              : (val) {
                                  if (val != null) setState(() => _leadSource = val);
                                },
                        ),
                      ],
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 14),

              // Solar Requirement
              Text("SOLAR REQUIREMENT *", style: AppTypography.badge(color: textSecondary)),
              const SizedBox(height: 6),
              Row(
                children: ["Residential", "Commercial", "Industrial"].map((req) {
                  final isSel = _solarRequirement == req;
                  return Expanded(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 4.0),
                      child: InkWell(
                        onTap: () => setState(() => _solarRequirement = req),
                        borderRadius: BorderRadius.circular(10),
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          decoration: BoxDecoration(
                            color: isSel
                                ? AppColors.brandPrimary.withValues(alpha: 0.15)
                                : surfaceColor,
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(
                              color: isSel ? AppColors.brandPrimary : borderColor,
                            ),
                          ),
                          child: Text(
                            req,
                            textAlign: TextAlign.center,
                            style: AppTypography.caption(
                              color: isSel ? AppColors.brandPrimary : textPrimary,
                              fontWeight: isSel ? FontWeight.bold : FontWeight.w500,
                            ),
                          ),
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),

              const SizedBox(height: 14),

              // System Capacity (kW) & Monthly Units
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text("REQUIRED CAPACITY (KW) *", style: AppTypography.badge(color: textSecondary)),
                        const SizedBox(height: 6),
                        TextFormField(
                          controller: _capacityController,
                          keyboardType: const TextInputType.numberWithOptions(decimal: true),
                          style: AppTypography.body(color: textPrimary),
                          decoration: const InputDecoration(
                            hintText: "e.g. 5.0",
                            prefixIcon: Icon(Icons.bolt, size: 20),
                          ),
                          validator: (val) {
                            if (_interestStatus == "Interested") {
                              final d = double.tryParse(val ?? '');
                              if (d == null || d <= 0) return "Must be > 0";
                            }
                            return null;
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
                        Text("MONTHLY UNITS (KWH)", style: AppTypography.badge(color: textSecondary)),
                        const SizedBox(height: 6),
                        TextFormField(
                          controller: _consumptionController,
                          keyboardType: TextInputType.number,
                          style: AppTypography.body(color: textPrimary),
                          decoration: const InputDecoration(
                            hintText: "e.g. 450",
                            prefixIcon: Icon(Icons.speed, size: 20),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 14),

              // FOLLOW-UP & NEXT ACTION (Preserved on Unrelated Edit)
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: surfaceColor,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: _isClosedStatus ? borderColor : AppColors.brandPrimary.withValues(alpha: 0.3),
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
                          color: _isClosedStatus ? textSecondary : AppColors.brandPrimary,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          _isClosedStatus ? "FOLLOW-UP SCHEDULE (CLOSED)" : "FOLLOW-UP SCHEDULE & NEXT ACTION *",
                          style: AppTypography.badge(
                            color: _isClosedStatus ? textSecondary : AppColors.brandPrimary,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),

                    // Next Action
                    TextFormField(
                      controller: _nextActionController,
                      enabled: !_isClosedStatus,
                      style: AppTypography.body(color: textPrimary),
                      maxLength: 255,
                      decoration: InputDecoration(
                        labelText: _isClosedStatus ? "Next action (optional)" : "Next action *",
                        hintText: "e.g. Share quotation over WhatsApp & follow up",
                        prefixIcon: const Icon(Icons.task_alt_rounded, size: 20),
                        counterText: "",
                      ),
                    ),

                    const SizedBox(height: 10),

                    Row(
                      children: [
                        // Follow-up Date Picker
                        Expanded(
                          child: InkWell(
                            onTap: _isClosedStatus ? null : _pickDate,
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
                                    color: _isClosedStatus ? textSecondary : AppColors.brandPrimary,
                                  ),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      _nextFollowUpDate != null
                                          ? DateFormat('yyyy-MM-dd').format(_nextFollowUpDate!)
                                          : (widget.lead.nextFollowUpDate != null && widget.lead.nextFollowUpDate!.isNotEmpty
                                              ? widget.lead.nextFollowUpDate!.split('T')[0]
                                              : "Follow-up date"),
                                      style: AppTypography.bodySmall(
                                        color: (_nextFollowUpDate != null || widget.lead.nextFollowUpDate != null)
                                            ? textPrimary
                                            : textSecondary,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),

                        // Exact Time Picker
                        Expanded(
                          child: InkWell(
                            onTap: _isClosedStatus ? null : _pickTime,
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
                                    color: _isClosedStatus ? textSecondary : AppColors.brandPrimary,
                                  ),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      _nextFollowUpTime != null
                                          ? "${_nextFollowUpTime!.hour.toString().padLeft(2, '0')}:${_nextFollowUpTime!.minute.toString().padLeft(2, '0')}"
                                          : (widget.lead.nextFollowUpTime != null && widget.lead.nextFollowUpTime!.isNotEmpty
                                              ? widget.lead.nextFollowUpTime!.substring(0, 5)
                                              : "Exact time"),
                                      style: AppTypography.bodySmall(
                                        color: (_nextFollowUpTime != null || widget.lead.nextFollowUpTime != null)
                                            ? textPrimary
                                            : textSecondary,
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

              const SizedBox(height: 14),

              // Assign To Rep
              Text("ASSIGN TO SALES EXECUTIVE", style: AppTypography.badge(color: textSecondary)),
              const SizedBox(height: 6),
              if (currentUser?.isSales == true)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  decoration: BoxDecoration(
                    color: surfaceColor,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: borderColor),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.person_pin_rounded, size: 20, color: AppColors.brandPrimary),
                      const SizedBox(width: 10),
                      Text(
                        widget.lead.assignedToName?.isNotEmpty == true
                            ? "${widget.lead.assignedToName} (Assigned)"
                            : "${currentUser!.name} (Self-Assigned)",
                        style: AppTypography.body(color: textPrimary),
                      ),
                    ],
                  ),
                )
              else
                DropdownButtonFormField<int?>(
                  initialValue: _assignedTo,
                  items: [
                    DropdownMenuItem<int?>(
                      value: null,
                      child: Text(
                        currentUser?.isManager == true ? "Select Team Member *" : "Unassigned",
                        style: AppTypography.body(color: textSecondary),
                      ),
                    ),
                    ...teamMembers.map((u) {
                      return DropdownMenuItem<int?>(
                        value: u.id,
                        child: Text("${u.fullName} (${u.roleName})", style: AppTypography.body(color: textPrimary)),
                      );
                    }),
                  ],
                  onChanged: (val) => setState(() => _assignedTo = val),
                  decoration: const InputDecoration(
                    prefixIcon: Icon(Icons.assignment_ind_outlined, size: 20),
                  ),
                ),

              const SizedBox(height: 14),

              // Quotation Amount & Roof Type
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text("QUOTATION EST. (₹)", style: AppTypography.badge(color: textSecondary)),
                        const SizedBox(height: 6),
                        TextFormField(
                          controller: _quotationController,
                          keyboardType: const TextInputType.numberWithOptions(decimal: true),
                          style: AppTypography.body(color: textPrimary),
                          decoration: const InputDecoration(
                            hintText: "Optional",
                            prefixIcon: Icon(Icons.currency_rupee, size: 20),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text("ROOF TYPE", style: AppTypography.badge(color: textSecondary)),
                        const SizedBox(height: 6),
                        TextFormField(
                          initialValue: _roofType,
                          style: AppTypography.body(color: textPrimary),
                          decoration: const InputDecoration(hintText: "e.g. RCC Flat Roof"),
                          onChanged: (val) => _roofType = val.trim(),
                        ),
                      ],
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 14),

              // Remarks
              Text("REMARKS / NOTES", style: AppTypography.badge(color: textSecondary)),
              const SizedBox(height: 6),
              TextFormField(
                controller: _remarkController,
                maxLines: 2,
                style: AppTypography.body(color: textPrimary),
                decoration: const InputDecoration(hintText: "Customer discussion notes..."),
              ),

              const SizedBox(height: 24),

              // Submit Button
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
                        "Update Lead Details",
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
