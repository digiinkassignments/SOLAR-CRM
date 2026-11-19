import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_typography.dart';
import '../../../providers/auth_provider.dart';
import '../../../providers/lead_provider.dart';
import '../../../providers/user_provider.dart';

class AddLeadSheet extends StatefulWidget {
  const AddLeadSheet({super.key});

  @override
  State<AddLeadSheet> createState() => _AddLeadSheetState();
}

class _AddLeadSheetState extends State<AddLeadSheet> {
  final _formKey = GlobalKey<FormState>();

  final _nameController = TextEditingController();
  final _mobileController = TextEditingController();
  final _altMobileController = TextEditingController();
  final _emailController = TextEditingController();
  final _addressController = TextEditingController();
  final _cityController = TextEditingController();
  final _stateController = TextEditingController();
  final _pincodeController = TextEditingController();
  final _capacityController = TextEditingController(text: "3.0");
  final _consumptionController = TextEditingController();
  final _quotationController = TextEditingController();
  final _remarkController = TextEditingController();
  final _nextActionController = TextEditingController(text: "Initial call & requirement discussion");

  DateTime? _nextFollowUpDate;
  TimeOfDay? _nextFollowUpTime;

  String _solarRequirement = "Residential";
  String _interestStatus = "Interested";
  String _status = "New Lead";
  String _priority = "Medium";
  String _leadSource = "Website";
  String _roofType = "RCC Flat Roof";
  int? _assignedTo;

  bool _isLoading = false;
  String? _errorMessage;

  static const List<String> _closedStatuses = ["Won", "Lost", "Invalid", "Not Interested"];

  bool get _isClosedStatus =>
      _closedStatuses.contains(_status) || _interestStatus == "Not Interested";

  @override
  void initState() {
    super.initState();
    // Default follow-up date = tomorrow at 11:00 AM
    _nextFollowUpDate = DateTime.now().add(const Duration(days: 1));
    _nextFollowUpTime = const TimeOfDay(hour: 11, minute: 0);

    WidgetsBinding.instance.addPostFrameCallback((_) {
      final auth = Provider.of<AuthProvider>(context, listen: false);
      if (auth.user?.isSales == true) {
        setState(() {
          _assignedTo = auth.user!.id;
          _status = "New Lead";
        });
      }
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

    final auth = Provider.of<AuthProvider>(context, listen: false);
    final user = auth.user;

    // Backend validation alignments
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

    // Manager must assign to their own team member
    if (user?.isManager == true && _assignedTo == null) {
      setState(() {
        _errorMessage = "Assign this lead to a salesperson in your team.";
      });
      return;
    }

    // Active leads require Next Action, Follow-up Date and Exact Time
    if (!_isClosedStatus) {
      if (_nextActionController.text.trim().isEmpty) {
        setState(() {
          _errorMessage = "Active leads require a next action, follow-up date and exact time.";
        });
        return;
      }
      if (_nextFollowUpDate == null) {
        setState(() {
          _errorMessage = "Follow-up date is required for active leads.";
        });
        return;
      }
      if (_nextFollowUpTime == null) {
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
        : null;

    final formattedTime = _nextFollowUpTime != null
        ? "${_nextFollowUpTime!.hour.toString().padLeft(2, '0')}:${_nextFollowUpTime!.minute.toString().padLeft(2, '0')}"
        : null;

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
      'required_kw': cap > 0 ? cap : 3.0,
      'priority': _priority,
      'lead_source': _leadSource,
      'roof_type': _roofType,
      'monthly_consumption_units': _consumptionController.text.trim().isNotEmpty ? int.tryParse(_consumptionController.text.trim()) : null,
      'quotation_amount': _quotationController.text.trim().isNotEmpty ? double.tryParse(_quotationController.text.trim()) : null,
      'remark': _remarkController.text.trim().isNotEmpty ? _remarkController.text.trim() : null,
      'status': user?.isSales == true ? "New Lead" : _status,
      'assigned_to': user?.isSales == true ? user!.id : _assignedTo,
      'next_action': _isClosedStatus ? null : _nextActionController.text.trim(),
      'next_follow_up_date': _isClosedStatus ? null : formattedDate,
      'next_follow_up_time': _isClosedStatus ? null : formattedTime,
    };

    final provider = Provider.of<LeadProvider>(context, listen: false);
    final res = await provider.createLead(data);

    if (!mounted) return;
    setState(() => _isLoading = false);

    if (res['success'] == true) {
      Navigator.pop(context, true);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(res['message'] ?? "Lead created successfully!"),
          backgroundColor: AppColors.emeraldGreen,
        ),
      );
    } else {
      setState(() {
        _errorMessage = res['message'] ?? "Failed to register lead.";
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final currentUser = auth.user;
    final userProvider = Provider.of<UserProvider>(context);

    // Filter assignable team members based on authenticated role
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
                  Text(
                    "Capture New Solar Lead",
                    style: AppTypography.heading(size: 20, color: textPrimary),
                  ),
                  IconButton(
                    icon: Icon(Icons.close, color: textSecondary),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const SizedBox(height: 12),

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

              // Customer Name
              Text("CUSTOMER NAME *", style: AppTypography.badge(color: textSecondary)),
              const SizedBox(height: 6),
              TextFormField(
                controller: _nameController,
                style: AppTypography.body(color: textPrimary),
                decoration: const InputDecoration(
                  hintText: "Enter full name",
                  prefixIcon: Icon(Icons.person_outline, size: 20),
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
                          style: AppTypography.body(color: textPrimary),
                          decoration: const InputDecoration(
                            hintText: "9876543210",
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

              // Required Capacity kW & Monthly Units
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text("SOLAR CAPACITY (KW) *", style: AppTypography.badge(color: textSecondary)),
                        const SizedBox(height: 6),
                        TextFormField(
                          controller: _capacityController,
                          keyboardType: const TextInputType.numberWithOptions(decimal: true),
                          style: AppTypography.body(color: textPrimary),
                          decoration: const InputDecoration(
                            hintText: "e.g. 4.36",
                            prefixIcon: Icon(Icons.solar_power_rounded, size: 20),
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
                        Text("MONTHLY UNITS", style: AppTypography.badge(color: textSecondary)),
                        const SizedBox(height: 6),
                        TextFormField(
                          controller: _consumptionController,
                          keyboardType: TextInputType.number,
                          style: AppTypography.body(color: textPrimary),
                          decoration: const InputDecoration(
                            hintText: "e.g. 350",
                            prefixIcon: Icon(Icons.electric_bolt_rounded, size: 20),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 14),

              // Solar Requirement & Priority
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text("REQUIREMENT", style: AppTypography.badge(color: textSecondary)),
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
                              value: _solarRequirement,
                              isExpanded: true,
                              dropdownColor: cardBg,
                              items: ["Residential", "Commercial", "Industrial"].map((s) {
                                return DropdownMenuItem<String>(
                                  value: s,
                                  child: Text(s, style: AppTypography.body(color: textPrimary)),
                                );
                              }).toList(),
                              onChanged: (val) {
                                if (val != null) setState(() => _solarRequirement = val);
                              },
                            ),
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
                        Text("PRIORITY", style: AppTypography.badge(color: textSecondary)),
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
                              value: _priority,
                              isExpanded: true,
                              dropdownColor: cardBg,
                              items: ["High", "Medium", "Low"].map((p) {
                                return DropdownMenuItem<String>(
                                  value: p,
                                  child: Text(p, style: AppTypography.body(color: textPrimary)),
                                );
                              }).toList(),
                              onChanged: (val) {
                                if (val != null) setState(() => _priority = val);
                              },
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 14),

              // Interest Status & Pipeline Stage
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text("INTEREST STATUS *", style: AppTypography.badge(color: textSecondary)),
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
                              value: _interestStatus,
                              isExpanded: true,
                              dropdownColor: cardBg,
                              items: ["Interested", "Pending", "Not Interested"].map((p) {
                                return DropdownMenuItem<String>(
                                  value: p,
                                  child: Text(p, style: AppTypography.body(color: textPrimary)),
                                );
                              }).toList(),
                              onChanged: (val) {
                                if (val != null) setState(() => _interestStatus = val);
                              },
                            ),
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
                        Text("PIPELINE STAGE", style: AppTypography.badge(color: textSecondary)),
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
                              value: currentUser?.isSales == true ? "New Lead" : _status,
                              isExpanded: true,
                              dropdownColor: cardBg,
                              items: (currentUser?.isSales == true
                                      ? ["New Lead"]
                                      : [
                                          "New Lead",
                                          "Contacted",
                                          "Qualified",
                                          "Site Survey Scheduled",
                                          "Site Survey Done",
                                          "Quotation Sent",
                                          "Won",
                                          "Lost",
                                          "Invalid",
                                        ])
                                  .map((s) {
                                return DropdownMenuItem<String>(
                                  value: s,
                                  child: Text(s, style: AppTypography.body(color: textPrimary)),
                                );
                              }).toList(),
                              onChanged: currentUser?.isSales == true
                                  ? null
                                  : (val) {
                                      if (val != null) setState(() => _status = val);
                                    },
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 14),

              // Roof Type & Lead Source
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text("ROOF TYPE", style: AppTypography.badge(color: textSecondary)),
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
                              value: _roofType,
                              isExpanded: true,
                              dropdownColor: cardBg,
                              items: ["RCC Flat Roof", "Tin Shed", "Tile Roof", "Ground Mount", "Other"].map((s) {
                                return DropdownMenuItem<String>(
                                  value: s,
                                  child: Text(s, style: AppTypography.body(color: textPrimary)),
                                );
                              }).toList(),
                              onChanged: (val) {
                                if (val != null) setState(() => _roofType = val);
                              },
                            ),
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
                        Text("LEAD SOURCE", style: AppTypography.badge(color: textSecondary)),
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
                              value: _leadSource,
                              isExpanded: true,
                              dropdownColor: cardBg,
                              items: ["Website", "Facebook", "Instagram", "Referral", "Field Survey", "Direct Call", "Other"].map((s) {
                                return DropdownMenuItem<String>(
                                  value: s,
                                  child: Text(s, style: AppTypography.body(color: textPrimary)),
                                );
                              }).toList(),
                              onChanged: (val) {
                                if (val != null) setState(() => _leadSource = val);
                              },
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 14),

              // Assign Sales Rep
              Text("ASSIGN SALES REP", style: AppTypography.badge(color: AppColors.brandPrimary)),
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
                        "${currentUser!.name} (Self-Assigned)",
                        style: AppTypography.body(color: textPrimary),
                      ),
                    ],
                  ),
                )
              else
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  decoration: BoxDecoration(
                    color: surfaceColor,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: borderColor),
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<int>(
                      value: _assignedTo,
                      hint: Text(
                        currentUser?.isManager == true ? "Select Team Member *" : "Select Rep (Optional)",
                        style: AppTypography.caption(color: textSecondary),
                      ),
                      isExpanded: true,
                      dropdownColor: cardBg,
                      items: teamMembers.map((m) {
                        return DropdownMenuItem<int>(
                          value: m.id,
                          child: Text(
                            "${m.fullName} (${m.roleName})",
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: AppTypography.body(color: textPrimary),
                          ),
                        );
                      }).toList(),
                      onChanged: (val) => setState(() => _assignedTo = val),
                    ),
                  ),
                ),

              const SizedBox(height: 16),

              // FOLLOW-UP & NEXT ACTION SECTION (Mandatory for Active Leads)
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

              const SizedBox(height: 14),

              // Site Location
              Text("SITE LOCATION", style: AppTypography.badge(color: textSecondary)),
              const SizedBox(height: 6),
              TextFormField(
                controller: _addressController,
                style: AppTypography.body(color: textPrimary),
                decoration: const InputDecoration(hintText: "Street address"),
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _cityController,
                      style: AppTypography.body(color: textPrimary),
                      decoration: const InputDecoration(hintText: "City"),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: TextFormField(
                      controller: _stateController,
                      style: AppTypography.body(color: textPrimary),
                      decoration: const InputDecoration(hintText: "State"),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: TextFormField(
                      controller: _pincodeController,
                      keyboardType: TextInputType.number,
                      style: AppTypography.body(color: textPrimary),
                      decoration: const InputDecoration(hintText: "Pincode"),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 14),

              // Remark
              Text("INITIAL CONVERSATION REMARK", style: AppTypography.badge(color: textSecondary)),
              const SizedBox(height: 6),
              TextFormField(
                controller: _remarkController,
                maxLines: 2,
                style: AppTypography.body(color: textPrimary),
                decoration: const InputDecoration(hintText: "Customer query, tariff rate, roof orientation..."),
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
                        "Register Lead",
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
