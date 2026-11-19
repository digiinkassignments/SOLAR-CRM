import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_typography.dart';
import '../../../models/inspection_model.dart';
import '../../../models/project_model.dart';
import '../../../providers/project_provider.dart';
import '../../common/signature_capture_widget.dart';

class ReviewInspectionSheet extends StatefulWidget {
  final ProjectModel project;
  final PreInstallInspectionModel? initialData;

  const ReviewInspectionSheet({
    super.key,
    required this.project,
    this.initialData,
  });

  static Future<void> show(
    BuildContext context, {
    required ProjectModel project,
    PreInstallInspectionModel? initialData,
  }) async {
    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => ReviewInspectionSheet(
        project: project,
        initialData: initialData,
      ),
    );
  }

  @override
  State<ReviewInspectionSheet> createState() => _ReviewInspectionSheetState();
}

class _ReviewInspectionSheetState extends State<ReviewInspectionSheet> {
  final _formKey = GlobalKey<FormState>();

  // Section 1 Controllers
  String _roofCondition = 'Good';
  String _roofType = 'RCC Flat Roof';
  String _roofOrientation = 'South (Optimal Solar Yield)';
  final _tiltAngleCtrl = TextEditingController();
  final _roofAgeCtrl = TextEditingController();
  final _roofAreaCtrl = TextEditingController();
  final _shadowFreeAreaCtrl = TextEditingController();
  final _structuralConcernsCtrl = TextEditingController();

  // Section 2 Controllers
  String _meterType = 'Single Phase (Up to 5 kW)';
  final _sanctionedLoadCtrl = TextEditingController();
  final _consumerNumberCtrl = TextEditingController();
  final _existingLoadCtrl = TextEditingController();
  final _mainPanelCapacityCtrl = TextEditingController();
  String _earthingAvailable = 'No';
  final _electricalIssuesCtrl = TextEditingController();

  // Section 3 Controllers
  String _shadingIssues = 'None';
  final _shadingSourceCtrl = TextEditingController();
  String _waterAvailability = 'No';
  String _siteAccess = 'Easy';
  final _gpsCoordinatesCtrl = TextEditingController();
  final _sitePhotosCtrl = TextEditingController();
  final _additionalChallengesCtrl = TextEditingController();
  bool _isFetchingGps = false;

  // Section 4 Controllers
  String _overallStatus = 'Pending (Inspection In-Progress)';
  final _inspectorNameCtrl = TextEditingController();
  DateTime _inspectionDate = DateTime.now();
  final _customerSignOffCtrl = TextEditingController();
  DateTime? _signOffDate;
  final _remarksCtrl = TextEditingController();
  String? _signatureData;

  @override
  void initState() {
    super.initState();
    _populateInitialData();
  }

  void _populateInitialData() {
    final data = widget.initialData;
    final recommendedMeter = widget.project.systemCapacityKw > 5.0
        ? 'Three Phase (Above 5 kW)'
        : 'Single Phase (Up to 5 kW)';

    if (data != null) {
      _roofCondition = data.roofCondition.isNotEmpty ? data.roofCondition : 'Good';
      _roofType = (data.roofType != null && data.roofType!.isNotEmpty)
          ? (data.roofType == 'RCC Flat' ? 'RCC Flat Roof' : data.roofType!)
          : 'RCC Flat Roof';

      final ori = data.roofOrientation;
      if (ori.contains('South') && !ori.contains('Optimal')) {
        _roofOrientation = 'South (Optimal Solar Yield)';
      } else if (ori.isNotEmpty) {
        _roofOrientation = ori;
      }

      if (data.roofTiltAngle != null) _tiltAngleCtrl.text = data.roofTiltAngle.toString();
      if (data.roofAgeYears != null) _roofAgeCtrl.text = data.roofAgeYears.toString();
      if (data.roofAreaSqft != null) _roofAreaCtrl.text = data.roofAreaSqft.toString();
      if (data.shadowFreeAreaSqft != null) _shadowFreeAreaCtrl.text = data.shadowFreeAreaSqft.toString();
      if (data.structuralConcerns != null) _structuralConcernsCtrl.text = data.structuralConcerns!;

      // Section 2
      if (data.meterType != null && data.meterType!.isNotEmpty) {
        final mt = data.meterType!;
        if (mt.contains('Three')) {
          _meterType = 'Three Phase (Above 5 kW)';
        } else {
          _meterType = 'Single Phase (Up to 5 kW)';
        }
      } else {
        _meterType = recommendedMeter;
      }

      if (data.sanctionedLoadKw != null) _sanctionedLoadCtrl.text = data.sanctionedLoadKw.toString();
      if (data.consumerNumber != null) _consumerNumberCtrl.text = data.consumerNumber!;
      if (data.existingLoadKw != null) _existingLoadCtrl.text = data.existingLoadKw.toString();
      if (data.mainPanelCapacity != null) _mainPanelCapacityCtrl.text = data.mainPanelCapacity.toString();
      _earthingAvailable = data.earthingAvailable == 'Yes' ? 'Yes' : 'No';
      if (data.electricalIssues != null) _electricalIssuesCtrl.text = data.electricalIssues!;

      // Section 3
      _shadingIssues = data.shadingIssues.isNotEmpty ? data.shadingIssues : 'None';
      if (data.shadingSource != null) _shadingSourceCtrl.text = data.shadingSource!;
      _waterAvailability = data.waterAvailability == 'Yes' ? 'Yes' : 'No';
      _siteAccess = data.siteAccess.isNotEmpty ? data.siteAccess : 'Easy';
      if (data.gpsCoordinates != null) _gpsCoordinatesCtrl.text = data.gpsCoordinates!;
      if (data.sitePhotos != null) _sitePhotosCtrl.text = data.sitePhotos!;
      if (data.additionalChallenges != null) _additionalChallengesCtrl.text = data.additionalChallenges!;

      // Section 4
      final stat = data.overallStatus;
      if (stat == 'Approved' || stat.contains('Feasible (Recommended)')) {
        _overallStatus = 'Feasible (Recommended)';
      } else if (stat.contains('Conditional')) {
        _overallStatus = 'Conditionally Feasible';
      } else if (stat.contains('Rejected') || stat.contains('Not Feasible')) {
        _overallStatus = 'Not Feasible';
      } else {
        _overallStatus = 'Pending (Inspection In-Progress)';
      }

      if (data.inspectorName != null && data.inspectorName!.isNotEmpty) {
        _inspectorNameCtrl.text = data.inspectorName!;
      } else if (widget.project.assignedToName != null && widget.project.assignedToName!.isNotEmpty) {
        _inspectorNameCtrl.text = widget.project.assignedToName!;
      }

      if (data.inspectionDate != null) _inspectionDate = data.inspectionDate!;
      if (data.customerSignatureName != null) _customerSignOffCtrl.text = data.customerSignatureName!;
      if (data.signatureDate != null) _signOffDate = data.signatureDate!;
      if (data.signatureData != null && data.signatureData!.isNotEmpty) {
        _signatureData = data.signatureData!;
      }
      if (data.remarks != null) _remarksCtrl.text = data.remarks!;
    } else {
      _meterType = recommendedMeter;
      if (widget.project.assignedToName != null && widget.project.assignedToName!.isNotEmpty) {
        _inspectorNameCtrl.text = widget.project.assignedToName!;
      }
    }
  }

  @override
  void dispose() {
    _tiltAngleCtrl.dispose();
    _roofAgeCtrl.dispose();
    _roofAreaCtrl.dispose();
    _shadowFreeAreaCtrl.dispose();
    _structuralConcernsCtrl.dispose();
    _sanctionedLoadCtrl.dispose();
    _consumerNumberCtrl.dispose();
    _existingLoadCtrl.dispose();
    _mainPanelCapacityCtrl.dispose();
    _electricalIssuesCtrl.dispose();
    _shadingSourceCtrl.dispose();
    _gpsCoordinatesCtrl.dispose();
    _sitePhotosCtrl.dispose();
    _additionalChallengesCtrl.dispose();
    _inspectorNameCtrl.dispose();
    _customerSignOffCtrl.dispose();
    _remarksCtrl.dispose();
    super.dispose();
  }

  Future<void> _captureGps() async {
    setState(() => _isFetchingGps = true);
    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Please enable GPS / Location services on your device'),
              backgroundColor: AppColors.errorRed,
            ),
          );
        }
        return;
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Location permission was denied'),
                backgroundColor: AppColors.errorRed,
              ),
            );
          }
          return;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Location permissions are permanently denied. Please enable in Settings.'),
              backgroundColor: AppColors.errorRed,
            ),
          );
        }
        return;
      }

      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(accuracy: LocationAccuracy.high),
      );

      final coords = "${position.latitude.toStringAsFixed(6)}, ${position.longitude.toStringAsFixed(6)}";
      setState(() {
        _gpsCoordinatesCtrl.text = coords;
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Captured GPS: $coords'),
            backgroundColor: AppColors.emeraldGreen,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to fetch location: $e'),
            backgroundColor: AppColors.errorRed,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isFetchingGps = false);
    }
  }

  Future<void> _pickDate(BuildContext context, bool isSignOff) async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: isSignOff ? (_signOffDate ?? now) : _inspectionDate,
      firstDate: DateTime(2020),
      lastDate: DateTime(2035),
      builder: (context, child) {
        final isDark = Theme.of(context).brightness == Brightness.dark;
        return Theme(
          data: isDark
              ? ThemeData.dark().copyWith(
                  colorScheme: const ColorScheme.dark(
                    primary: AppColors.brandPrimary,
                    onPrimary: Colors.white,
                    surface: AppColors.darkSurfaceElevated,
                    onSurface: AppColors.textPrimaryDark,
                  ),
                )
              : ThemeData.light().copyWith(
                  colorScheme: const ColorScheme.light(
                    primary: AppColors.brandPrimary,
                    onPrimary: Colors.white,
                  ),
                ),
          child: child!,
        );
      },
    );

    if (picked != null) {
      setState(() {
        if (isSignOff) {
          _signOffDate = picked;
        } else {
          _inspectionDate = picked;
        }
      });
    }
  }

  Future<void> _handleSave() async {
    if (!_formKey.currentState!.validate()) return;

    if (_roofAreaCtrl.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter Total Roof Area (sqft)'), backgroundColor: AppColors.errorRed),
      );
      return;
    }

    if (_inspectorNameCtrl.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter Inspector Name'), backgroundColor: AppColors.errorRed),
      );
      return;
    }

    final provider = Provider.of<ProjectProvider>(context, listen: false);

    // Normalize meter type
    String cleanMeter = _meterType.contains('Three') ? 'Three Phase' : 'Single Phase';

    // Normalize roof type
    String cleanRoof = _roofType == 'RCC Flat Roof' ? 'RCC Flat' : _roofType;

    // Normalize orientation
    String cleanOri = _roofOrientation.contains('South (Optimal') ? 'South' : _roofOrientation;

    // Normalize overall status
    String cleanStatus = 'Pending';
    if (_overallStatus.contains('Feasible (Recommended)')) {
      cleanStatus = 'Approved';
    } else if (_overallStatus.contains('Conditionally')) {
      cleanStatus = 'Conditional Approval';
    } else if (_overallStatus.contains('Not Feasible')) {
      cleanStatus = 'Rejected';
    } else {
      cleanStatus = 'Pending';
    }

    final payload = {
      'roof_condition': _roofCondition,
      'roof_type': cleanRoof,
      'roof_orientation': cleanOri,
      'roof_tilt_angle': double.tryParse(_tiltAngleCtrl.text.trim()),
      'roof_area_sqft': double.tryParse(_roofAreaCtrl.text.trim()),
      'shadow_free_area_sqft': double.tryParse(_shadowFreeAreaCtrl.text.trim()),
      'roof_age_years': int.tryParse(_roofAgeCtrl.text.trim()),
      'structural_concerns': _structuralConcernsCtrl.text.trim(),
      'existing_load_kw': double.tryParse(_existingLoadCtrl.text.trim()),
      'sanctioned_load_kw': double.tryParse(_sanctionedLoadCtrl.text.trim()),
      'consumer_number': _consumerNumberCtrl.text.trim(),
      'meter_type': cleanMeter,
      'main_panel_capacity': int.tryParse(_mainPanelCapacityCtrl.text.trim()),
      'earthing_available': _earthingAvailable,
      'electrical_issues': _electricalIssuesCtrl.text.trim(),
      'shading_issues': _shadingIssues,
      'shading_source': _shadingIssues == 'None' ? '' : _shadingSourceCtrl.text.trim(),
      'water_availability': _waterAvailability,
      'site_access': _siteAccess,
      'gps_coordinates': _gpsCoordinatesCtrl.text.trim(),
      'additional_challenges': _additionalChallengesCtrl.text.trim(),
      'site_photos': _sitePhotosCtrl.text.trim(),
      'overall_status': cleanStatus,
      'inspector_name': _inspectorNameCtrl.text.trim(),
      'inspection_date': DateFormat('yyyy-MM-dd').format(_inspectionDate),
      'remarks': _remarksCtrl.text.trim(),
      'customer_signature_name': _customerSignOffCtrl.text.trim(),
      'signature_date': _signOffDate != null ? DateFormat('yyyy-MM-dd').format(_signOffDate!) : null,
      'signature_data': _signatureData ?? '',
    };

    final scaffold = ScaffoldMessenger.of(context);
    final nav = Navigator.of(context);

    final res = await provider.saveInspection(widget.project.id, payload);

    if (mounted) {
      scaffold.showSnackBar(
        SnackBar(
          content: Text(res['message'] ?? 'Inspection saved successfully!'),
          backgroundColor: res['success'] == true ? AppColors.emeraldGreen : AppColors.errorRed,
          behavior: SnackBarBehavior.floating,
        ),
      );
      if (res['success'] == true) {
        nav.pop();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? AppColors.darkCard : Colors.white;
    final surfaceBg = isDark ? const Color(0xFF161616) : const Color(0xFFF8FAFC);
    final borderColor = isDark ? AppColors.darkBorder : AppColors.lightBorder;
    final textPrimary = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final textSecondary = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;

    final provider = Provider.of<ProjectProvider>(context);
    final isSaving = provider.isSavingInspection;

    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.92,
      ),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkBackground : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        border: Border.all(color: borderColor),
      ),
      child: Column(
        children: [
          // Drag Handle
          Center(
            child: Container(
              margin: const EdgeInsets.only(top: 10, bottom: 6),
              width: 38,
              height: 4,
              decoration: BoxDecoration(
                color: textSecondary.withValues(alpha: 0.3),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),

          // Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        "Pre-Installation Technical Site Inspection",
                        style: AppTypography.heading(size: 16, color: textPrimary),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        "Project: ${widget.project.projectNumber} • System: ${widget.project.systemCapacityKw.toStringAsFixed(2)} kW",
                        style: TextStyle(fontSize: 11, color: textSecondary, fontWeight: FontWeight.w500),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  icon: Icon(Icons.close_rounded, color: textSecondary, size: 22),
                  onPressed: () => Navigator.of(context).pop(),
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
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                children: [
                  // SECTION 1: ROOF ASSESSMENT & GEOMETRY
                  _buildSectionHeader(
                    icon: Icons.home_repair_service_rounded,
                    iconColor: const Color(0xFFF59E0B),
                    title: "SECTION 1: ROOF ASSESSMENT & GEOMETRY",
                    textPrimary: textPrimary,
                  ),
                  const SizedBox(height: 12),
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
                        _buildLabel("Roof Condition", textSecondary),
                        const SizedBox(height: 6),
                        _buildRadioRow(
                          options: ['Good', 'Fair', 'Poor'],
                          selectedValue: _roofCondition,
                          onChanged: (v) => setState(() => _roofCondition = v),
                          isDark: isDark,
                          surfaceBg: surfaceBg,
                          borderColor: borderColor,
                          textPrimary: textPrimary,
                        ),
                        const SizedBox(height: 14),

                        _buildDropdownField(
                          label: "Roof Type",
                          value: _roofType,
                          items: const [
                            'RCC Flat Roof',
                            'Metal Sheet Shed',
                            'Tiled Roof',
                            'Asbestos Sheet',
                            'Other',
                          ],
                          onChanged: (v) {
                            if (v != null) setState(() => _roofType = v);
                          },
                          isDark: isDark,
                          surfaceBg: surfaceBg,
                          borderColor: borderColor,
                          textPrimary: textPrimary,
                        ),
                        const SizedBox(height: 14),

                        _buildDropdownField(
                          label: "Roof Orientation",
                          value: _roofOrientation,
                          items: const [
                            'South (Optimal Solar Yield)',
                            'South-East',
                            'South-West',
                            'East',
                            'West',
                            'North',
                          ],
                          onChanged: (v) {
                            if (v != null) setState(() => _roofOrientation = v);
                          },
                          isDark: isDark,
                          surfaceBg: surfaceBg,
                          borderColor: borderColor,
                          textPrimary: textPrimary,
                        ),
                        const SizedBox(height: 14),

                        Row(
                          children: [
                            Expanded(
                              child: _buildTextField(
                                controller: _tiltAngleCtrl,
                                label: "Tilt Angle (Degrees °)",
                                hint: "e.g. 20",
                                keyboardType: TextInputType.number,
                                isDark: isDark,
                                surfaceBg: surfaceBg,
                                borderColor: borderColor,
                                textPrimary: textPrimary,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: _buildTextField(
                                controller: _roofAgeCtrl,
                                label: "Roof Age (years)",
                                hint: "e.g. 5",
                                keyboardType: TextInputType.number,
                                isDark: isDark,
                                surfaceBg: surfaceBg,
                                borderColor: borderColor,
                                textPrimary: textPrimary,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 14),

                        Row(
                          children: [
                            Expanded(
                              child: _buildTextField(
                                controller: _roofAreaCtrl,
                                label: "Total Roof Area (sqft) *",
                                hint: "e.g. 480",
                                keyboardType: TextInputType.number,
                                helper: "Total physical footprint",
                                isDark: isDark,
                                surfaceBg: surfaceBg,
                                borderColor: borderColor,
                                textPrimary: textPrimary,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: _buildTextField(
                                controller: _shadowFreeAreaCtrl,
                                label: "Shadow-Free Usable Area (sqft)",
                                hint: "e.g. 480",
                                keyboardType: TextInputType.number,
                                helper: "Unobstructed sunlight (9am-4pm)",
                                isDark: isDark,
                                surfaceBg: surfaceBg,
                                borderColor: borderColor,
                                textPrimary: textPrimary,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 14),

                        _buildTextField(
                          controller: _structuralConcernsCtrl,
                          label: "Structural Concerns & Rooftop Observations",
                          hint: "Cracks, parapet height, water tank shading, NIL...",
                          maxLines: 2,
                          isDark: isDark,
                          surfaceBg: surfaceBg,
                          borderColor: borderColor,
                          textPrimary: textPrimary,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),

                  // SECTION 2: ELECTRICAL & DISCOM GRID CONNECTION
                  _buildSectionHeader(
                    icon: Icons.electric_bolt_rounded,
                    iconColor: const Color(0xFFF97316),
                    title: "SECTION 2: ELECTRICAL & DISCOM GRID CONNECTION",
                    textPrimary: textPrimary,
                  ),
                  const SizedBox(height: 12),
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
                        _buildDropdownField(
                          label: "Meter Type (Grid Phase) *",
                          value: _meterType,
                          items: const [
                            'Single Phase (Up to 5 kW)',
                            'Three Phase (Above 5 kW)',
                          ],
                          onChanged: (v) {
                            if (v != null) setState(() => _meterType = v);
                          },
                          helper: "Recommended based on system capacity",
                          isDark: isDark,
                          surfaceBg: surfaceBg,
                          borderColor: borderColor,
                          textPrimary: textPrimary,
                        ),
                        const SizedBox(height: 14),

                        Row(
                          children: [
                            Expanded(
                              child: _buildTextField(
                                controller: _sanctionedLoadCtrl,
                                label: "Sanctioned Load (kW)",
                                hint: "e.g. 4",
                                keyboardType: TextInputType.number,
                                helper: "From electricity bill",
                                isDark: isDark,
                                surfaceBg: surfaceBg,
                                borderColor: borderColor,
                                textPrimary: textPrimary,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: _buildTextField(
                                controller: _existingLoadCtrl,
                                label: "Running Load (kW)",
                                hint: "e.g. 4",
                                keyboardType: TextInputType.number,
                                isDark: isDark,
                                surfaceBg: surfaceBg,
                                borderColor: borderColor,
                                textPrimary: textPrimary,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 14),

                        _buildTextField(
                          controller: _consumerNumberCtrl,
                          label: "DISCOM Consumer / CA / K Number",
                          hint: "e.g. 1098765432",
                          helper: "Required for DISCOM net metering form",
                          isDark: isDark,
                          surfaceBg: surfaceBg,
                          borderColor: borderColor,
                          textPrimary: textPrimary,
                        ),
                        const SizedBox(height: 14),

                        _buildTextField(
                          controller: _mainPanelCapacityCtrl,
                          label: "Main Panel Capacity (Amps)",
                          hint: "e.g. 32 or 63",
                          keyboardType: TextInputType.number,
                          isDark: isDark,
                          surfaceBg: surfaceBg,
                          borderColor: borderColor,
                          textPrimary: textPrimary,
                        ),
                        const SizedBox(height: 14),

                        _buildLabel("Dedicated Earthing Available?", textSecondary),
                        const SizedBox(height: 6),
                        _buildRadioRow(
                          options: ['Yes', 'No'],
                          selectedValue: _earthingAvailable,
                          onChanged: (v) => setState(() => _earthingAvailable = v),
                          isDark: isDark,
                          surfaceBg: surfaceBg,
                          borderColor: borderColor,
                          textPrimary: textPrimary,
                        ),
                        const SizedBox(height: 14),

                        _buildTextField(
                          controller: _electricalIssuesCtrl,
                          label: "Electrical Issues & Grid Notes",
                          hint: "Voltage fluctuations, distance from LT pole/transformer, wiring quality...",
                          maxLines: 2,
                          isDark: isDark,
                          surfaceBg: surfaceBg,
                          borderColor: borderColor,
                          textPrimary: textPrimary,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),

                  // SECTION 3: SITE CONDITIONS & GEOLOCATION
                  _buildSectionHeader(
                    icon: Icons.wb_sunny_rounded,
                    iconColor: const Color(0xFFEAB308),
                    title: "SECTION 3: SITE CONDITIONS & GEOLOCATION",
                    textPrimary: textPrimary,
                  ),
                  const SizedBox(height: 12),
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
                        _buildLabel("Shading Obstacles", textSecondary),
                        const SizedBox(height: 6),
                        _buildRadioRow(
                          options: ['None', 'Partial', 'Severe'],
                          selectedValue: _shadingIssues,
                          onChanged: (v) => setState(() => _shadingIssues = v),
                          isDark: isDark,
                          surfaceBg: surfaceBg,
                          borderColor: borderColor,
                          textPrimary: textPrimary,
                        ),
                        if (_shadingIssues != 'None') ...[
                          const SizedBox(height: 14),
                          _buildTextField(
                            controller: _shadingSourceCtrl,
                            label: "Shading Source",
                            hint: "Specify object causing shadow (tree, mumty, adjacent building)",
                            isDark: isDark,
                            surfaceBg: surfaceBg,
                            borderColor: borderColor,
                            textPrimary: textPrimary,
                          ),
                        ],
                        const SizedBox(height: 14),

                        _buildLabel("Rooftop Water Tap Available? (For Panel Cleaning)", textSecondary),
                        const SizedBox(height: 6),
                        _buildRadioRow(
                          options: ['Yes', 'No'],
                          selectedValue: _waterAvailability,
                          onChanged: (v) => setState(() => _waterAvailability = v),
                          isDark: isDark,
                          surfaceBg: surfaceBg,
                          borderColor: borderColor,
                          textPrimary: textPrimary,
                        ),
                        const SizedBox(height: 14),

                        _buildLabel("Rooftop Accessibility", textSecondary),
                        const SizedBox(height: 6),
                        _buildRadioRow(
                          options: ['Easy', 'Moderate', 'Difficult'],
                          selectedValue: _siteAccess,
                          onChanged: (v) => setState(() => _siteAccess = v),
                          isDark: isDark,
                          surfaceBg: surfaceBg,
                          borderColor: borderColor,
                          textPrimary: textPrimary,
                        ),
                        const SizedBox(height: 14),

                        // GPS Coordinates with Capture Button
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(
                              child: _buildTextField(
                                controller: _gpsCoordinatesCtrl,
                                label: "GPS Coordinates (Lat, Long)",
                                hint: "e.g. 26.876072, 75.761321",
                                isDark: isDark,
                                surfaceBg: surfaceBg,
                                borderColor: borderColor,
                                textPrimary: textPrimary,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Padding(
                              padding: const EdgeInsets.only(top: 24),
                              child: Tooltip(
                                message: "Capture Current GPS",
                                child: InkWell(
                                  onTap: _isFetchingGps ? null : _captureGps,
                                  borderRadius: BorderRadius.circular(8),
                                  child: Container(
                                    padding: const EdgeInsets.all(12),
                                    decoration: BoxDecoration(
                                      color: AppColors.brandPrimary.withValues(alpha: 0.12),
                                      borderRadius: BorderRadius.circular(8),
                                      border: Border.all(color: AppColors.brandPrimary.withValues(alpha: 0.3)),
                                    ),
                                    child: _isFetchingGps
                                        ? const SizedBox(
                                            width: 20,
                                            height: 20,
                                            child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.brandPrimary),
                                          )
                                        : const Icon(Icons.my_location_rounded, size: 20, color: AppColors.brandPrimary),
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 14),

                        _buildTextField(
                          controller: _sitePhotosCtrl,
                          label: "Site Photos / Drive Links",
                          hint: "Paste Google Drive or Cloud folder URL...",
                          isDark: isDark,
                          surfaceBg: surfaceBg,
                          borderColor: borderColor,
                          textPrimary: textPrimary,
                        ),
                        const SizedBox(height: 14),

                        _buildTextField(
                          controller: _additionalChallengesCtrl,
                          label: "Additional Challenges & Logistics Notes",
                          hint: "Narrow staircase for lifting solar panels, crane required, high wind zone...",
                          maxLines: 2,
                          isDark: isDark,
                          surfaceBg: surfaceBg,
                          borderColor: borderColor,
                          textPrimary: textPrimary,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),

                  // SECTION 4: INSPECTION DECISION & CUSTOMER SIGN-OFF
                  _buildSectionHeader(
                    icon: Icons.assignment_turned_in_rounded,
                    iconColor: const Color(0xFF10B981),
                    title: "SECTION 4: INSPECTION DECISION & SIGN-OFF",
                    textPrimary: textPrimary,
                  ),
                  const SizedBox(height: 12),
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
                        _buildDropdownField(
                          label: "Overall Feasibility Status *",
                          value: _overallStatus,
                          items: const [
                            'Pending (Inspection In-Progress)',
                            'Feasible (Recommended)',
                            'Conditionally Feasible',
                            'Not Feasible',
                          ],
                          onChanged: (v) {
                            if (v != null) setState(() => _overallStatus = v);
                          },
                          isDark: isDark,
                          surfaceBg: surfaceBg,
                          borderColor: borderColor,
                          textPrimary: textPrimary,
                        ),
                        const SizedBox(height: 14),

                        Row(
                          children: [
                            Expanded(
                              child: _buildTextField(
                                controller: _inspectorNameCtrl,
                                label: "Lead Inspector Name *",
                                hint: "e.g. Er. Vikram Singh",
                                isDark: isDark,
                                surfaceBg: surfaceBg,
                                borderColor: borderColor,
                                textPrimary: textPrimary,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: InkWell(
                                onTap: () => _pickDate(context, false),
                                child: IgnorePointer(
                                  child: _buildTextField(
                                    controller: TextEditingController(
                                      text: DateFormat('dd/MM/yyyy').format(_inspectionDate),
                                    ),
                                    label: "Inspection Date *",
                                    hint: "Select date",
                                    suffixIcon: Icons.calendar_today_rounded,
                                    isDark: isDark,
                                    surfaceBg: surfaceBg,
                                    borderColor: borderColor,
                                    textPrimary: textPrimary,
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 14),

                        Row(
                          children: [
                            Expanded(
                              child: _buildTextField(
                                controller: _customerSignOffCtrl,
                                label: "Customer / Rep Present",
                                hint: "Name of homeowner/manager",
                                isDark: isDark,
                                surfaceBg: surfaceBg,
                                borderColor: borderColor,
                                textPrimary: textPrimary,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: InkWell(
                                onTap: () => _pickDate(context, true),
                                child: IgnorePointer(
                                  child: _buildTextField(
                                    controller: TextEditingController(
                                      text: _signOffDate != null
                                          ? DateFormat('dd/MM/yyyy').format(_signOffDate!)
                                          : '',
                                    ),
                                    label: "Sign-Off Date",
                                    hint: "dd/mm/yyyy",
                                    suffixIcon: Icons.calendar_today_rounded,
                                    isDark: isDark,
                                    surfaceBg: surfaceBg,
                                    borderColor: borderColor,
                                    textPrimary: textPrimary,
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),

                        SignatureCaptureWidget(
                          initialDataUrl: _signatureData,
                          onSignatureChanged: (val) {
                            setState(() {
                              _signatureData = val;
                            });
                          },
                          label: "Customer / Representative Signature",
                          helperText: "Sign digitally using touchscreen/finger or upload signature image",
                          isDark: isDark,
                          cardBg: cardBg,
                          surfaceBg: surfaceBg,
                          borderColor: borderColor,
                          textPrimary: textPrimary,
                          textSecondary: textSecondary,
                        ),
                        const SizedBox(height: 16),

                        _buildTextField(
                          controller: _remarksCtrl,
                          label: "Technical Remarks & Feasibility Recommendations",
                          hint: "Summary of feasibility findings, shadow remarks, earthing recommendations...",
                          maxLines: 3,
                          isDark: isDark,
                          surfaceBg: surfaceBg,
                          borderColor: borderColor,
                          textPrimary: textPrimary,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                ],
              ),
            ),
          ),

          // Footer Action Bar
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
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      side: BorderSide(color: borderColor),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                    onPressed: isSaving ? null : () => Navigator.of(context).pop(),
                    child: Text(
                      "Cancel",
                      style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: textPrimary),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF0F172A),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      elevation: 0,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                    icon: isSaving
                        ? const SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                          )
                        : const Icon(Icons.save_rounded, size: 16),
                    label: Text(
                      isSaving ? "Saving..." : "Save Inspection",
                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
                    ),
                    onPressed: isSaving ? null : _handleSave,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader({
    required IconData icon,
    required Color iconColor,
    required String title,
    required Color textPrimary,
  }) {
    return Row(
      children: [
        Icon(icon, size: 18, color: iconColor),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            title,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w800,
              color: textPrimary,
              letterSpacing: 0.3,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildLabel(String text, Color color) {
    return Text(
      text,
      style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: color),
    );
  }

  Widget _buildRadioRow({
    required List<String> options,
    required String selectedValue,
    required ValueChanged<String> onChanged,
    required bool isDark,
    required Color surfaceBg,
    required Color borderColor,
    required Color textPrimary,
  }) {
    return Row(
      children: options.map((opt) {
        final isSelected = selectedValue == opt;
        return Expanded(
          child: InkWell(
            onTap: () => onChanged(opt),
            borderRadius: BorderRadius.circular(8),
            child: Container(
              margin: const EdgeInsets.symmetric(horizontal: 4),
              padding: const EdgeInsets.symmetric(vertical: 8),
              decoration: BoxDecoration(
                color: isSelected ? AppColors.brandPrimary.withValues(alpha: 0.15) : surfaceBg,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: isSelected ? AppColors.brandPrimary : borderColor,
                  width: isSelected ? 1.5 : 1,
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    isSelected ? Icons.radio_button_checked_rounded : Icons.radio_button_off_rounded,
                    size: 14,
                    color: isSelected ? AppColors.brandPrimary : textPrimary.withValues(alpha: 0.6),
                  ),
                  const SizedBox(width: 5),
                  Flexible(
                    child: Text(
                      opt,
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                        color: isSelected ? AppColors.brandPrimary : textPrimary,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildDropdownField({
    required String label,
    required String value,
    required List<String> items,
    required ValueChanged<String?> onChanged,
    String? helper,
    required bool isDark,
    required Color surfaceBg,
    required Color borderColor,
    required Color textPrimary,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildLabel(label, textPrimary.withValues(alpha: 0.7)),
        const SizedBox(height: 5),
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
              value: items.contains(value) ? value : items.first,
              dropdownColor: isDark ? AppColors.darkCard : Colors.white,
              icon: Icon(Icons.arrow_drop_down_rounded, color: textPrimary),
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: textPrimary),
              items: items
                  .map((it) => DropdownMenuItem<String>(
                        value: it,
                        child: Text(it, overflow: TextOverflow.ellipsis),
                      ))
                  .toList(),
              onChanged: onChanged,
            ),
          ),
        ),
        if (helper != null) ...[
          const SizedBox(height: 3),
          Text(
            helper,
            style: TextStyle(fontSize: 10, color: textPrimary.withValues(alpha: 0.5)),
          ),
        ],
      ],
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required String hint,
    TextInputType keyboardType = TextInputType.text,
    int maxLines = 1,
    String? helper,
    IconData? suffixIcon,
    required bool isDark,
    required Color surfaceBg,
    required Color borderColor,
    required Color textPrimary,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildLabel(label, textPrimary.withValues(alpha: 0.7)),
        const SizedBox(height: 5),
        TextFormField(
          controller: controller,
          keyboardType: keyboardType,
          maxLines: maxLines,
          style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: textPrimary),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: TextStyle(fontSize: 12, color: textPrimary.withValues(alpha: 0.35)),
            filled: true,
            fillColor: surfaceBg,
            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            suffixIcon: suffixIcon != null ? Icon(suffixIcon, size: 16, color: textPrimary.withValues(alpha: 0.6)) : null,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: BorderSide(color: borderColor),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: BorderSide(color: borderColor),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(color: AppColors.brandPrimary, width: 1.5),
            ),
          ),
        ),
        if (helper != null) ...[
          const SizedBox(height: 3),
          Text(
            helper,
            style: TextStyle(fontSize: 10, color: textPrimary.withValues(alpha: 0.5)),
          ),
        ],
      ],
    );
  }
}
