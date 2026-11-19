import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../models/installation_log_model.dart';
import '../../../models/project_model.dart';
import '../../../providers/project_provider.dart';
import '../../common/signature_capture_widget.dart';

class LogInstallationProgressSheet extends StatefulWidget {
  final ProjectModel project;
  final InstallationLogModel? existingLog;

  const LogInstallationProgressSheet({
    super.key,
    required this.project,
    this.existingLog,
  });

  static Future<void> show(
    BuildContext context, {
    required ProjectModel project,
    InstallationLogModel? existingLog,
  }) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => LogInstallationProgressSheet(
        project: project,
        existingLog: existingLog,
      ),
    );
  }

  @override
  State<LogInstallationProgressSheet> createState() => _LogInstallationProgressSheetState();
}

class _LogInstallationProgressSheetState extends State<LogInstallationProgressSheet> {
  final _formKey = GlobalKey<FormState>();

  // 5 standard phases
  static const List<Map<String, dynamic>> _phaseConfigs = [
    {
      'key': 'Structure',
      'label': '1. Mounting Structure & Civil Foundation',
      'shortName': 'Structure',
      'target': 20,
    },
    {
      'key': 'Panels',
      'label': '2. Module Placement & DC Cabling',
      'shortName': 'Panels',
      'target': 45,
    },
    {
      'key': 'Inverter & Electrical',
      'label': '3. Inverter Mounting & AC/DC DBs',
      'shortName': 'Inverter & Electrical',
      'target': 70,
    },
    {
      'key': 'Earthing & Protection',
      'label': '4. Chemical Earthing & Lightning Arrestor',
      'shortName': 'Earthing & Protection',
      'target': 85,
    },
    {
      'key': 'Testing',
      'label': '5. Pre-Commissioning Testing & Polarity',
      'shortName': 'Testing',
      'target': 100,
    },
  ];

  static const List<String> _weatherOptions = [
    'Sunny / Clear (Optimal)',
    'Partly Cloudy',
    'Overcast / Rainy',
    'High Winds',
    'Extreme Heat',
  ];

  static const List<String> _unitOptions = [
    'Nos',
    'Meters',
    'Kg',
    'Sets',
    'Bags',
    'Rolls',
    'Pcs',
    'Boxes',
    'Liters',
  ];

  static const List<String> _commonMaterials = [
    'Solar PV Modules (Mono PERC / TopCon)',
    'Solar Grid-Tie Inverter',
    'Module Mounting Structure (MMS) Legs & Purlins',
    'Anchor Fasteners & Bolts (SS304)',
    'DC Solar Cable (4 sq mm / 6 sq mm)',
    'AC Armoured Cable (4 Core)',
    'DC Combiner Box / DCDB',
    'AC Distribution Box / ACDB',
    'Chemical Earthing Electrodes (Copper Bonded)',
    'Earthing Compound / BFC (Bentonite)',
    'Lightning Arrestor (LA) Spike & Base',
    'GI Earthing Strip (25x3 mm)',
    'PVC / HDPE Flexible Conduit Pipes & Saddles',
    'MC4 Connectors (Male/Female pairs)',
    'Custom Item / Other',
  ];

  // Controllers & Form State
  late TextEditingController _logDateCtrl;
  late TextEditingController _expectedDateCtrl;
  late TextEditingController _workDoneCtrl;
  late TextEditingController _supervisorNameCtrl;
  late TextEditingController _workersCountCtrl;
  late TextEditingController _hoursWorkedCtrl;
  late TextEditingController _crewNamesCtrl;
  late TextEditingController _issuesCtrl;
  late TextEditingController _progressPercentCtrl;

  String _selectedPhase = 'Structure';
  String _selectedWeather = 'Sunny / Clear (Optimal)';
  bool _isPhaseCompleted = false;

  // Materials rows
  final List<_MaterialRowData> _materials = [];

  // Safety checklist
  bool _harness = true;
  bool _helmet = true;
  bool _shoes = true;
  bool _lifeline = true;

  // Signoff & Signature
  bool _supervisorSignoff = true;
  String? _signatureData;

  // Photos
  final List<File> _selectedPhotos = [];
  final ImagePicker _picker = ImagePicker();

  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    final log = widget.existingLog;
    final nowStr = DateFormat('yyyy-MM-dd').format(DateTime.now());

    _logDateCtrl = TextEditingController(text: log?.logDate ?? nowStr);
    _expectedDateCtrl = TextEditingController(
      text: widget.project.installationEndDate != null
          ? DateFormat('yyyy-MM-dd').format(widget.project.installationEndDate!)
          : '',
    );
    _workDoneCtrl = TextEditingController(text: log?.workDone ?? '');
    _supervisorNameCtrl = TextEditingController(
      text: log?.supervisorName ?? widget.project.assignedToName ?? '',
    );
    _workersCountCtrl = TextEditingController(
      text: log?.workersCount != null ? log!.workersCount.toString() : '4',
    );
    _hoursWorkedCtrl = TextEditingController(
      text: log?.hoursWorked != null ? log!.hoursWorked.toString() : '8',
    );
    _crewNamesCtrl = TextEditingController(text: log?.crewNames ?? '');
    _issuesCtrl = TextEditingController(text: log?.issuesFaced ?? '');

    if (log != null) {
      _selectedPhase = log.phase ?? 'Structure';
      _isPhaseCompleted = log.isPhaseCompleted;
      _selectedWeather = _weatherOptions.firstWhere(
        (w) => w.toLowerCase().contains((log.weather ?? '').toLowerCase()),
        orElse: () => _weatherOptions[0],
      );
      _progressPercentCtrl = TextEditingController(
        text: log.progressPercent != null ? log.progressPercent.toString() : '20',
      );

      final sc = log.safetyChecklist ?? {};
      _harness = sc['harness'] ?? true;
      _helmet = sc['helmet'] ?? true;
      _shoes = sc['shoes'] ?? true;
      _lifeline = sc['lifeline'] ?? true;

      _supervisorSignoff = log.supervisorSignoff;
      _signatureData = log.signatureData;

      if (log.materialsList.isNotEmpty) {
        for (var m in log.materialsList) {
          _materials.add(_MaterialRowData(
            itemCtrl: TextEditingController(text: m.item),
            quantityCtrl: TextEditingController(text: m.quantity?.toString() ?? '1'),
            unit: _unitOptions.contains(m.unit) ? m.unit : 'Nos',
          ));
        }
      }
    } else {
      _selectedPhase = _phaseConfigs[0]['key'] as String;
      _progressPercentCtrl = TextEditingController(text: '20');
      // 1 initial material row
      _materials.add(_MaterialRowData(
        itemCtrl: TextEditingController(text: _commonMaterials[0]),
        quantityCtrl: TextEditingController(text: '10'),
        unit: 'Nos',
      ));
    }
  }

  @override
  void dispose() {
    _logDateCtrl.dispose();
    _expectedDateCtrl.dispose();
    _workDoneCtrl.dispose();
    _supervisorNameCtrl.dispose();
    _workersCountCtrl.dispose();
    _hoursWorkedCtrl.dispose();
    _crewNamesCtrl.dispose();
    _issuesCtrl.dispose();
    _progressPercentCtrl.dispose();
    for (var m in _materials) {
      m.dispose();
    }
    super.dispose();
  }

  void _onPhaseChanged(String? newPhase) {
    if (newPhase == null) return;
    setState(() {
      _selectedPhase = newPhase;
      final cfg = _phaseConfigs.firstWhere((p) => p['key'] == newPhase, orElse: () => _phaseConfigs[0]);
      _progressPercentCtrl.text = (cfg['target'] as int).toString();
    });
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

  Future<void> _pickPhotos(ImageSource source) async {
    try {
      if (source == ImageSource.camera) {
        final photo = await _picker.pickImage(source: ImageSource.camera, imageQuality: 80);
        if (photo != null) {
          setState(() {
            _selectedPhotos.add(File(photo.path));
          });
        }
      } else {
        final photos = await _picker.pickMultiImage(imageQuality: 80);
        if (photos.isNotEmpty) {
          setState(() {
            final remaining = 10 - _selectedPhotos.length;
            final toAdd = photos.take(remaining).map((p) => File(p.path)).toList();
            _selectedPhotos.addAll(toAdd);
          });
        }
      }
    } catch (e) {
      debugPrint("Error picking photo: $e");
    }
  }

  Future<void> _saveLog() async {
    if (!_formKey.currentState!.validate()) return;

    if (_workDoneCtrl.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("Please describe the work done today."),
          backgroundColor: AppColors.errorRed,
        ),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      final cleanMaterials = _materials
          .where((m) => m.itemCtrl.text.trim().isNotEmpty)
          .map((m) => {
                'item': m.itemCtrl.text.trim(),
                'quantity': num.tryParse(m.quantityCtrl.text.trim()) ?? 1,
                'unit': m.unit,
                'is_custom': !_commonMaterials.contains(m.itemCtrl.text.trim()),
              })
          .toList();

      final payload = {
        'log_date': _logDateCtrl.text.trim(),
        'expected_completion_date': _expectedDateCtrl.text.trim(),
        'phase': _selectedPhase,
        'is_phase_completed': _isPhaseCompleted ? 1 : 0,
        'work_done': _workDoneCtrl.text.trim(),
        'workers_count': int.tryParse(_workersCountCtrl.text.trim()) ?? 0,
        'hours_worked': num.tryParse(_hoursWorkedCtrl.text.trim()) ?? 8,
        'supervisor_name': _supervisorNameCtrl.text.trim(),
        'crew_names': _crewNamesCtrl.text.trim(),
        'materials_list': cleanMaterials,
        'materials_used': cleanMaterials.map((m) => "${m['quantity']} ${m['unit']} ${m['item']}").join(', '),
        'issues_faced': _issuesCtrl.text.trim(),
        'progress_percent': int.tryParse(_progressPercentCtrl.text.trim()) ?? 20,
        'weather': _selectedWeather,
        'safety_checklist': {
          'harness': _harness,
          'helmet': _helmet,
          'shoes': _shoes,
          'lifeline': _lifeline,
        },
        'supervisor_signoff': _supervisorSignoff ? 1 : 0,
        'signature_data': _signatureData,
      };

      final provider = Provider.of<ProjectProvider>(context, listen: false);
      final res = await provider.saveInstallationLog(
        widget.project.id,
        payload,
        logId: widget.existingLog?.id,
        photos: _selectedPhotos,
      );

      if (mounted) {
        if (res['success'] == true) {
          Navigator.of(context).pop();
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(res['message'] ?? "Log saved successfully!"),
              backgroundColor: AppColors.emeraldGreen,
            ),
          );
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(res['message'] ?? "Failed to save daily log"),
              backgroundColor: AppColors.errorRed,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text("Error: $e"),
            backgroundColor: AppColors.errorRed,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? const Color(0xFF121212) : Colors.white;
    final surfaceBg = isDark ? const Color(0xFF000000) : const Color(0xFFF8FAFC);
    final borderColor = isDark ? const Color(0xFF262626) : const Color(0xFFE2E8F0);
    final textPrimary = isDark ? Colors.white : const Color(0xFF0F172A);
    final textSecondary = isDark ? const Color(0xFF94A3B8) : const Color(0xFF475569);

    final currentTarget = _phaseConfigs.firstWhere(
      (p) => p['key'] == _selectedPhase,
      orElse: () => _phaseConfigs[0],
    )['target'];

    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.92,
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
                          widget.existingLog != null
                              ? "Edit Installation Progress Log"
                              : "Log Daily Site Installation Progress",
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w800,
                            color: textPrimary,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 2),
                        Text(
                          "Project: ${widget.project.projectNumber} • System: ${widget.project.systemCapacityKw} kW",
                          style: TextStyle(
                            fontSize: 12,
                            color: textSecondary,
                            fontWeight: FontWeight.w500,
                          ),
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
                    // ==========================================
                    // 1. PHASE & TIMELINE CARD
                    // ==========================================
                    _buildSectionCard(
                      title: "PHASE & TIMELINE",
                      icon: Icons.calendar_today_rounded,
                      cardBg: cardBg,
                      borderColor: borderColor,
                      textPrimary: textPrimary,
                      textSecondary: textSecondary,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Expanded(
                                child: _buildDateField(
                                  label: "Log Date *",
                                  controller: _logDateCtrl,
                                  isDark: isDark,
                                  borderColor: borderColor,
                                  textPrimary: textPrimary,
                                  textSecondary: textSecondary,
                                  onTap: () => _pickDate(_logDateCtrl),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: _buildDateField(
                                  label: "Overall Target Date",
                                  controller: _expectedDateCtrl,
                                  isDark: isDark,
                                  borderColor: borderColor,
                                  textPrimary: textPrimary,
                                  textSecondary: textSecondary,
                                  onTap: () => _pickDate(_expectedDateCtrl),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text(
                            "Set overall rooftop / installation target date",
                            style: TextStyle(fontSize: 10.5, color: textSecondary),
                          ),
                          const SizedBox(height: 14),

                          // Phase Dropdown
                          Text(
                            "Installation Phase *",
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: textPrimary,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12),
                            decoration: BoxDecoration(
                              color: isDark ? const Color(0xFF1E1E1E) : Colors.white,
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: borderColor),
                            ),
                            child: DropdownButtonHideUnderline(
                              child: DropdownButton<String>(
                                value: _selectedPhase,
                                isExpanded: true,
                                dropdownColor: cardBg,
                                items: _phaseConfigs.map((p) {
                                  return DropdownMenuItem<String>(
                                    value: p['key'] as String,
                                    child: Text(
                                      p['label'] as String,
                                      style: TextStyle(
                                        fontSize: 13,
                                        fontWeight: FontWeight.w600,
                                        color: textPrimary,
                                      ),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  );
                                }).toList(),
                                onChanged: _onPhaseChanged,
                              ),
                            ),
                          ),
                          const SizedBox(height: 14),

                          // Weather Dropdown
                          Text(
                            "Site Weather",
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: textPrimary,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12),
                            decoration: BoxDecoration(
                              color: isDark ? const Color(0xFF1E1E1E) : Colors.white,
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: borderColor),
                            ),
                            child: DropdownButtonHideUnderline(
                              child: DropdownButton<String>(
                                value: _selectedWeather,
                                isExpanded: true,
                                dropdownColor: cardBg,
                                items: _weatherOptions.map((w) {
                                  return DropdownMenuItem<String>(
                                    value: w,
                                    child: Text(
                                      w,
                                      style: TextStyle(
                                        fontSize: 13,
                                        fontWeight: FontWeight.w600,
                                        color: textPrimary,
                                      ),
                                    ),
                                  );
                                }).toList(),
                                onChanged: (val) {
                                  if (val != null) setState(() => _selectedWeather = val);
                                },
                              ),
                            ),
                          ),
                          const SizedBox(height: 12),

                          // Mark Phase Completed Checkbox
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                            decoration: BoxDecoration(
                              color: isDark ? const Color(0xFF182218) : const Color(0xFFECFDF5),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(
                                color: isDark ? const Color(0xFF1A3E26) : const Color(0xFFA7F3D0),
                              ),
                            ),
                            child: Row(
                              children: [
                                Checkbox(
                                  value: _isPhaseCompleted,
                                  onChanged: (val) => setState(() => _isPhaseCompleted = val ?? false),
                                  activeColor: AppColors.emeraldGreen,
                                  materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        "Mark Phase as Completed Today",
                                        style: TextStyle(
                                          fontSize: 13,
                                          fontWeight: FontWeight.w700,
                                          color: isDark ? const Color(0xFF86EFAC) : const Color(0xFF065F46),
                                        ),
                                      ),
                                      Text(
                                        "Advances milestone stepper to the next stage",
                                        style: TextStyle(
                                          fontSize: 11,
                                          color: isDark ? const Color(0xFF6EE7B7) : const Color(0xFF047857),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 16),

                    // ==========================================
                    // 2. WORK DONE TODAY CARD
                    // ==========================================
                    _buildSectionCard(
                      title: "WORK DONE TODAY (DETAILED DESCRIPTION) *",
                      icon: Icons.edit_note_rounded,
                      cardBg: cardBg,
                      borderColor: borderColor,
                      textPrimary: textPrimary,
                      textSecondary: textSecondary,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          TextFormField(
                            controller: _workDoneCtrl,
                            maxLines: 4,
                            style: TextStyle(fontSize: 13, color: textPrimary),
                            decoration: InputDecoration(
                              hintText:
                                  "Describe exact rooftop tasks: number of structure legs grouted, torque tightness checked, panels bolted, DC stringing, conduit piping, earthing pit excavation...",
                              hintStyle: TextStyle(fontSize: 12, color: textSecondary.withValues(alpha: 0.7)),
                              filled: true,
                              fillColor: isDark ? const Color(0xFF1E1E1E) : Colors.white,
                              contentPadding: const EdgeInsets.all(12),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(8),
                                borderSide: BorderSide(color: borderColor),
                              ),
                              enabledBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(8),
                                borderSide: BorderSide(color: borderColor),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 16),

                    // ==========================================
                    // 3. FIELD PERSONNEL & ATTENDANCE
                    // ==========================================
                    _buildSectionCard(
                      title: "FIELD PERSONNEL & ATTENDANCE",
                      icon: Icons.groups_rounded,
                      cardBg: cardBg,
                      borderColor: borderColor,
                      textPrimary: textPrimary,
                      textSecondary: textSecondary,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _buildTextField(
                            label: "Site Supervisor Name",
                            hint: "e.g. Er. Vikram Singh",
                            controller: _supervisorNameCtrl,
                            isDark: isDark,
                            borderColor: borderColor,
                            textPrimary: textPrimary,
                            textSecondary: textSecondary,
                          ),
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              Expanded(
                                child: _buildTextField(
                                  label: "Workers on Site",
                                  hint: "e.g. 4",
                                  controller: _workersCountCtrl,
                                  isDark: isDark,
                                  borderColor: borderColor,
                                  textPrimary: textPrimary,
                                  textSecondary: textSecondary,
                                  keyboardType: TextInputType.number,
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: _buildTextField(
                                  label: "Hours Worked",
                                  hint: "e.g. 8",
                                  controller: _hoursWorkedCtrl,
                                  isDark: isDark,
                                  borderColor: borderColor,
                                  textPrimary: textPrimary,
                                  textSecondary: textSecondary,
                                  keyboardType: TextInputType.number,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          _buildTextField(
                            label: "Crew Members on Site",
                            hint: "e.g. Ramesh (Master Electrician), Suresh (Fabricator), Mohan & Anil (Technicians)",
                            controller: _crewNamesCtrl,
                            isDark: isDark,
                            borderColor: borderColor,
                            textPrimary: textPrimary,
                            textSecondary: textSecondary,
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 16),

                    // ==========================================
                    // 4. MATERIALS CONSUMED ON SITE TODAY
                    // ==========================================
                    _buildSectionCard(
                      title: "MATERIALS CONSUMED ON SITE TODAY",
                      icon: Icons.inventory_2_outlined,
                      cardBg: cardBg,
                      borderColor: borderColor,
                      textPrimary: textPrimary,
                      textSecondary: textSecondary,
                      trailing: TextButton.icon(
                        onPressed: () {
                          setState(() {
                            _materials.add(_MaterialRowData(
                              itemCtrl: TextEditingController(),
                              quantityCtrl: TextEditingController(text: '1'),
                              unit: 'Nos',
                            ));
                          });
                        },
                        icon: const Icon(Icons.add, size: 16, color: AppColors.brandPrimary),
                        label: const Text(
                          "Add Item",
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: AppColors.brandPrimary,
                          ),
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            "Structured items with quantities and units for inventory tracking",
                            style: TextStyle(fontSize: 11, color: textSecondary),
                          ),
                          const SizedBox(height: 12),
                          if (_materials.isEmpty)
                            Padding(
                              padding: const EdgeInsets.symmetric(vertical: 8),
                              child: Text(
                                "No materials recorded today.",
                                style: TextStyle(fontSize: 12, color: textSecondary, fontStyle: FontStyle.italic),
                              ),
                            )
                          else
                            ...List.generate(_materials.length, (idx) {
                              final item = _materials[idx];
                              return Padding(
                                padding: const EdgeInsets.only(bottom: 10),
                                child: Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    // Item Name / Dropdown or Autocomplete
                                    Expanded(
                                      flex: 5,
                                      child: _buildMaterialItemInput(
                                        item,
                                        isDark: isDark,
                                        borderColor: borderColor,
                                        textPrimary: textPrimary,
                                        textSecondary: textSecondary,
                                      ),
                                    ),
                                    const SizedBox(width: 8),

                                    // Quantity
                                    Expanded(
                                      flex: 2,
                                      child: TextFormField(
                                        controller: item.quantityCtrl,
                                        keyboardType: TextInputType.number,
                                        style: TextStyle(fontSize: 12, color: textPrimary),
                                        decoration: InputDecoration(
                                          hintText: "Qty",
                                          hintStyle: TextStyle(fontSize: 11, color: textSecondary),
                                          filled: true,
                                          fillColor: isDark ? const Color(0xFF1E1E1E) : Colors.white,
                                          contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 10),
                                          border: OutlineInputBorder(
                                            borderRadius: BorderRadius.circular(6),
                                            borderSide: BorderSide(color: borderColor),
                                          ),
                                          enabledBorder: OutlineInputBorder(
                                            borderRadius: BorderRadius.circular(6),
                                            borderSide: BorderSide(color: borderColor),
                                          ),
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 8),

                                    // Unit Dropdown
                                    Expanded(
                                      flex: 3,
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 6),
                                        decoration: BoxDecoration(
                                          color: isDark ? const Color(0xFF1E1E1E) : Colors.white,
                                          borderRadius: BorderRadius.circular(6),
                                          border: Border.all(color: borderColor),
                                        ),
                                        child: DropdownButtonHideUnderline(
                                          child: DropdownButton<String>(
                                            value: item.unit,
                                            isExpanded: true,
                                            dropdownColor: cardBg,
                                            items: _unitOptions.map((u) {
                                              return DropdownMenuItem<String>(
                                                value: u,
                                                child: Text(
                                                  u,
                                                  style: TextStyle(fontSize: 11, color: textPrimary),
                                                ),
                                              );
                                            }).toList(),
                                            onChanged: (val) {
                                              if (val != null) setState(() => item.unit = val);
                                            },
                                          ),
                                        ),
                                      ),
                                    ),

                                    // Delete Row
                                    IconButton(
                                      onPressed: () {
                                        setState(() {
                                          item.dispose();
                                          _materials.removeAt(idx);
                                        });
                                      },
                                      icon: const Icon(Icons.delete_outline_rounded, size: 18, color: AppColors.errorRed),
                                      splashRadius: 18,
                                      padding: const EdgeInsets.all(6),
                                    ),
                                  ],
                                ),
                              );
                            }),
                        ],
                      ),
                    ),

                    const SizedBox(height: 16),

                    // ==========================================
                    // 5. ROOFTOP SAFETY COMPLIANCE CHECKLIST
                    // ==========================================
                    _buildSectionCard(
                      title: "ROOFTOP SAFETY COMPLIANCE CHECKLIST",
                      icon: Icons.security_rounded,
                      cardBg: cardBg,
                      borderColor: borderColor,
                      textPrimary: textPrimary,
                      textSecondary: textSecondary,
                      child: Column(
                        children: [
                          _buildSafetyCheckbox(
                            "Full Body Safety Harness Worn",
                            _harness,
                            (val) => setState(() => _harness = val),
                            isDark: isDark,
                            textPrimary: textPrimary,
                          ),
                          _buildSafetyCheckbox(
                            "Safety Helmets (Hard Hats) Worn",
                            _helmet,
                            (val) => setState(() => _helmet = val),
                            isDark: isDark,
                            textPrimary: textPrimary,
                          ),
                          _buildSafetyCheckbox(
                            "Safety Shoes Worn",
                            _shoes,
                            (val) => setState(() => _shoes = val),
                            isDark: isDark,
                            textPrimary: textPrimary,
                          ),
                          _buildSafetyCheckbox(
                            "Rooftop Lifeline / Rope Anchor Secured",
                            _lifeline,
                            (val) => setState(() => _lifeline = val),
                            isDark: isDark,
                            textPrimary: textPrimary,
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 16),

                    // ==========================================
                    // 6. PROJECT PROGRESS & VERIFICATION
                    // ==========================================
                    _buildSectionCard(
                      title: "PROJECT PROGRESS & VERIFICATION",
                      icon: Icons.speed_rounded,
                      cardBg: cardBg,
                      borderColor: borderColor,
                      textPrimary: textPrimary,
                      textSecondary: textSecondary,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      "Overall Project Progress (%) *",
                                      style: TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.w700,
                                        color: textPrimary,
                                      ),
                                    ),
                                    const SizedBox(height: 6),
                                    TextFormField(
                                      controller: _progressPercentCtrl,
                                      keyboardType: TextInputType.number,
                                      style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: textPrimary),
                                      decoration: InputDecoration(
                                        hintText: "e.g. 20",
                                        suffixText: "%",
                                        suffixStyle: TextStyle(fontWeight: FontWeight.w800, color: textSecondary),
                                        filled: true,
                                        fillColor: isDark ? const Color(0xFF1E1E1E) : Colors.white,
                                        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                                        border: OutlineInputBorder(
                                          borderRadius: BorderRadius.circular(8),
                                          borderSide: BorderSide(color: borderColor),
                                        ),
                                        enabledBorder: OutlineInputBorder(
                                          borderRadius: BorderRadius.circular(8),
                                          borderSide: BorderSide(color: borderColor),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Text(
                            "Target milestone for $_selectedPhase is ~$currentTarget%",
                            style: TextStyle(fontSize: 11, color: textSecondary, fontStyle: FontStyle.italic),
                          ),
                          const SizedBox(height: 14),

                          // Supervisor Signoff Checkbox
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                            decoration: BoxDecoration(
                              color: isDark ? const Color(0xFF182218) : const Color(0xFFECFDF5),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(
                                color: isDark ? const Color(0xFF1A3E26) : const Color(0xFFA7F3D0),
                              ),
                            ),
                            child: Row(
                              children: [
                                Checkbox(
                                  value: _supervisorSignoff,
                                  onChanged: (val) => setState(() => _supervisorSignoff = val ?? false),
                                  activeColor: AppColors.emeraldGreen,
                                  materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        "Supervisor Sign-Off & Verification",
                                        style: TextStyle(
                                          fontSize: 13,
                                          fontWeight: FontWeight.w700,
                                          color: isDark ? const Color(0xFF86EFAC) : const Color(0xFF065F46),
                                        ),
                                      ),
                                      Text(
                                        "Confirms quality standards meet DISCOM norms",
                                        style: TextStyle(
                                          fontSize: 11,
                                          color: isDark ? const Color(0xFF6EE7B7) : const Color(0xFF047857),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 16),

                          // Supervisor Digital Signature Capture
                          SignatureCaptureWidget(
                            label: "Supervisor Digital Signature (Draw or Upload)",
                            helperText: "Sign digitally using touchscreen or upload signature image",
                            initialDataUrl: _signatureData,
                            onSignatureChanged: (dataUrl) {
                              _signatureData = dataUrl;
                            },
                            isDark: isDark,
                            cardBg: cardBg,
                            surfaceBg: surfaceBg,
                            borderColor: borderColor,
                            textPrimary: textPrimary,
                            textSecondary: textSecondary,
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 16),

                    // ==========================================
                    // 7. ISSUES FACED / FIELD ROADBLOCKS
                    // ==========================================
                    _buildSectionCard(
                      title: "ISSUES FACED / FIELD ROADBLOCKS",
                      icon: Icons.warning_amber_rounded,
                      cardBg: cardBg,
                      borderColor: borderColor,
                      textPrimary: textPrimary,
                      textSecondary: textSecondary,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          TextFormField(
                            controller: _issuesCtrl,
                            maxLines: 3,
                            style: TextStyle(fontSize: 13, color: textPrimary),
                            decoration: InputDecoration(
                              hintText: "Any issues encountered, e.g. broken tiles, shadow interference, material shortage...",
                              hintStyle: TextStyle(fontSize: 12, color: textSecondary.withValues(alpha: 0.7)),
                              filled: true,
                              fillColor: isDark ? const Color(0xFF1E1E1E) : Colors.white,
                              contentPadding: const EdgeInsets.all(12),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(8),
                                borderSide: BorderSide(color: borderColor),
                              ),
                              enabledBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(8),
                                borderSide: BorderSide(color: borderColor),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 16),

                    // ==========================================
                    // 8. SITE PHOTOS PICKER
                    // ==========================================
                    _buildSectionCard(
                      title: "SITE PHOTOS (UP TO 10)",
                      icon: Icons.photo_camera_rounded,
                      cardBg: cardBg,
                      borderColor: borderColor,
                      textPrimary: textPrimary,
                      textSecondary: textSecondary,
                      trailing: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          IconButton(
                            onPressed: () => _pickPhotos(ImageSource.camera),
                            icon: const Icon(Icons.camera_alt_rounded, size: 20, color: AppColors.brandPrimary),
                            splashRadius: 20,
                            tooltip: "Take Photo",
                          ),
                          IconButton(
                            onPressed: () => _pickPhotos(ImageSource.gallery),
                            icon: const Icon(Icons.photo_library_rounded, size: 20, color: AppColors.brandPrimary),
                            splashRadius: 20,
                            tooltip: "Pick from Gallery",
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          if (_selectedPhotos.isEmpty)
                            Padding(
                              padding: const EdgeInsets.symmetric(vertical: 8),
                              child: Text(
                                "No photos selected yet. Use camera or gallery buttons above to attach site work photos.",
                                style: TextStyle(fontSize: 12, color: textSecondary, fontStyle: FontStyle.italic),
                              ),
                            )
                          else
                            Wrap(
                              spacing: 10,
                              runSpacing: 10,
                              children: List.generate(_selectedPhotos.length, (idx) {
                                final photo = _selectedPhotos[idx];
                                return Stack(
                                  children: [
                                    ClipRRect(
                                      borderRadius: BorderRadius.circular(8),
                                      child: Image.file(
                                        photo,
                                        width: 80,
                                        height: 80,
                                        fit: BoxFit.cover,
                                      ),
                                    ),
                                    Positioned(
                                      top: 2,
                                      right: 2,
                                      child: GestureDetector(
                                        onTap: () {
                                          setState(() => _selectedPhotos.removeAt(idx));
                                        },
                                        child: Container(
                                          padding: const EdgeInsets.all(2),
                                          decoration: const BoxDecoration(
                                            color: Colors.black87,
                                            shape: BoxShape.circle,
                                          ),
                                          child: const Icon(Icons.close, size: 14, color: Colors.white),
                                        ),
                                      ),
                                    ),
                                  ],
                                );
                              }),
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
                      onPressed: _isSubmitting ? null : _saveLog,
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
                          : Text(
                              widget.existingLog != null ? "Update Daily Log" : "Save Daily Log",
                              style: const TextStyle(fontWeight: FontWeight.w800),
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
    required Color textSecondary,
    Widget? trailing,
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
              Icon(icon, size: 16, color: AppColors.brandPrimary),
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
              ?trailing,
            ],
          ),
          const SizedBox(height: 12),
          child,
        ],
      ),
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
        Text(
          label,
          style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700, color: textPrimary),
        ),
        const SizedBox(height: 6),
        InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(8),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
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
                    style: TextStyle(
                      fontSize: 12.5,
                      fontWeight: FontWeight.w600,
                      color: controller.text.isEmpty ? textSecondary : textPrimary,
                    ),
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

  Widget _buildTextField({
    required String label,
    required String hint,
    required TextEditingController controller,
    required bool isDark,
    required Color borderColor,
    required Color textPrimary,
    required Color textSecondary,
    TextInputType keyboardType = TextInputType.text,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: textPrimary),
        ),
        const SizedBox(height: 6),
        TextFormField(
          controller: controller,
          keyboardType: keyboardType,
          style: TextStyle(fontSize: 13, color: textPrimary),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: TextStyle(fontSize: 12, color: textSecondary.withValues(alpha: 0.7)),
            filled: true,
            fillColor: isDark ? const Color(0xFF1E1E1E) : Colors.white,
            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: BorderSide(color: borderColor),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: BorderSide(color: borderColor),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildMaterialItemInput(
    _MaterialRowData item, {
    required bool isDark,
    required Color borderColor,
    required Color textPrimary,
    required Color textSecondary,
  }) {
    return Autocomplete<String>(
      initialValue: TextEditingValue(text: item.itemCtrl.text),
      optionsBuilder: (TextEditingValue textEditingValue) {
        if (textEditingValue.text.isEmpty) {
          return _commonMaterials;
        }
        return _commonMaterials.where((option) {
          return option.toLowerCase().contains(textEditingValue.text.toLowerCase());
        });
      },
      onSelected: (String selection) {
        setState(() {
          if (selection == 'Custom Item / Other') {
            item.itemCtrl.text = '';
          } else {
            item.itemCtrl.text = selection;
          }
        });
      },
      fieldViewBuilder: (context, textEditingController, focusNode, onFieldSubmitted) {
        // Sync itemCtrl with textEditingController
        textEditingController.addListener(() {
          item.itemCtrl.text = textEditingController.text;
        });
        return TextFormField(
          controller: textEditingController,
          focusNode: focusNode,
          style: TextStyle(fontSize: 12, color: textPrimary),
          decoration: InputDecoration(
            hintText: "Material Item / Select...",
            hintStyle: TextStyle(fontSize: 11, color: textSecondary),
            filled: true,
            fillColor: isDark ? const Color(0xFF1E1E1E) : Colors.white,
            contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(6),
              borderSide: BorderSide(color: borderColor),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(6),
              borderSide: BorderSide(color: borderColor),
            ),
          ),
        );
      },
      optionsViewBuilder: (context, onSelected, options) {
        return Align(
          alignment: Alignment.topLeft,
          child: Material(
            elevation: 4,
            borderRadius: BorderRadius.circular(8),
            color: isDark ? const Color(0xFF1A1A1A) : Colors.white,
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxHeight: 200, maxWidth: 300),
              child: ListView.builder(
                padding: EdgeInsets.zero,
                shrinkWrap: true,
                itemCount: options.length,
                itemBuilder: (context, index) {
                  final option = options.elementAt(index);
                  return InkWell(
                    onTap: () => onSelected(option),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      child: Text(
                        option,
                        style: TextStyle(fontSize: 12, color: textPrimary),
                      ),
                    ),
                  );
                },
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildSafetyCheckbox(
    String label,
    bool value,
    ValueChanged<bool> onChanged, {
    required bool isDark,
    required Color textPrimary,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: InkWell(
        onTap: () => onChanged(!value),
        borderRadius: BorderRadius.circular(6),
        child: Row(
          children: [
            Checkbox(
              value: value,
              onChanged: (val) => onChanged(val ?? false),
              activeColor: AppColors.emeraldGreen,
              materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
            ),
            const SizedBox(width: 6),
            Expanded(
              child: Text(
                label,
                style: TextStyle(
                  fontSize: 12.5,
                  fontWeight: FontWeight.w600,
                  color: textPrimary,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _MaterialRowData {
  final TextEditingController itemCtrl;
  final TextEditingController quantityCtrl;
  String unit;

  _MaterialRowData({
    required this.itemCtrl,
    required this.quantityCtrl,
    this.unit = "Nos",
  });

  void dispose() {
    itemCtrl.dispose();
    quantityCtrl.dispose();
  }
}
