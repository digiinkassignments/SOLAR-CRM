import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_typography.dart';
import '../../../models/survey_model.dart';
import '../../../providers/survey_provider.dart';
import '../widgets/survey_documents_section.dart';

class CompleteSurveySheet extends StatefulWidget {
  final SurveyModel survey;

  const CompleteSurveySheet({super.key, required this.survey});

  static Future<bool?> show(BuildContext context, {required SurveyModel survey}) {
    return showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => CompleteSurveySheet(survey: survey),
    );
  }

  @override
  State<CompleteSurveySheet> createState() => _CompleteSurveySheetState();
}

class _CompleteSurveySheetState extends State<CompleteSurveySheet> {
  final _formKey = GlobalKey<FormState>();

  String _feasibilityVerdict = "Feasible";
  String _roofType = "RCC";
  String _shadowConditions = "Shadow-free";
  String _electricalPhase = "Single Phase";
  String _roofOrientation = "South";

  late TextEditingController _roofAreaController;
  late TextEditingController _sanctionedLoadController;
  late TextEditingController _proposedCapacityController;
  late TextEditingController _consumerNumberController;
  late TextEditingController _tiltAngleController;
  late TextEditingController _feasibilityNotesController;
  late TextEditingController _notFeasibleReasonController;
  late TextEditingController _latController;
  late TextEditingController _lngController;

  @override
  void initState() {
    super.initState();
    final s = widget.survey;
    _feasibilityVerdict = s.feasibilityVerdict ?? "Feasible";
    _roofType = s.roofType ?? "RCC";
    _shadowConditions = s.shadowConditions ?? "Shadow-free";
    _electricalPhase = s.electricalPhase ?? "Single Phase";
    _roofOrientation = s.roofOrientation ?? "South";

    _roofAreaController = TextEditingController(text: s.roofAreaSqft?.toString() ?? "");
    _sanctionedLoadController = TextEditingController(text: s.sanctionedLoadKw?.toString() ?? "");
    _proposedCapacityController = TextEditingController(
      text: s.proposedCapacityKw?.toString() ?? (s.requiredKw > 0 ? s.requiredKw.toString() : "3.0"),
    );
    _consumerNumberController = TextEditingController(text: s.consumerNumber ?? "");
    _tiltAngleController = TextEditingController(text: s.roofTiltAngle?.toString() ?? "15");
    _feasibilityNotesController = TextEditingController(text: s.feasibilityNotes ?? "");
    _notFeasibleReasonController = TextEditingController(text: s.notFeasibleReason ?? "");
    _latController = TextEditingController(text: s.siteLatitude?.toString() ?? "");
    _lngController = TextEditingController(text: s.siteLongitude?.toString() ?? "");
  }

  @override
  void dispose() {
    _roofAreaController.dispose();
    _sanctionedLoadController.dispose();
    _proposedCapacityController.dispose();
    _consumerNumberController.dispose();
    _tiltAngleController.dispose();
    _feasibilityNotesController.dispose();
    _notFeasibleReasonController.dispose();
    _latController.dispose();
    _lngController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    final proposedKw = double.tryParse(_proposedCapacityController.text.trim());
    if (_feasibilityVerdict == 'Feasible' && (proposedKw == null || proposedKw <= 0)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("Enter a positive proposed system capacity before marking the survey Feasible."),
          backgroundColor: AppColors.errorRed,
        ),
      );
      return;
    }

    final provider = Provider.of<SurveyProvider>(context, listen: false);

    final payload = <String, dynamic>{
      'feasibility_verdict': _feasibilityVerdict,
      'roof_type': _roofType,
      'roof_area_sqft': double.tryParse(_roofAreaController.text.trim()),
      'shadow_conditions': _shadowConditions,
      'electrical_phase': _electricalPhase,
      'sanctioned_load_kw': double.tryParse(_sanctionedLoadController.text.trim()),
      'proposed_capacity_kw': double.tryParse(_proposedCapacityController.text.trim()),
      'consumer_number': _consumerNumberController.text.trim(),
      'roof_orientation': _roofOrientation,
      'roof_tilt_angle': double.tryParse(_tiltAngleController.text.trim()),
      'feasibility_notes': _feasibilityNotesController.text.trim(),
      'not_feasible_reason': _feasibilityVerdict == 'Not feasible' ? _notFeasibleReasonController.text.trim() : null,
      'gps_latitude': double.tryParse(_latController.text.trim()),
      'gps_longitude': double.tryParse(_lngController.text.trim()),
    };

    final result = await provider.completeSurvey(widget.survey.id, payload);

    if (!mounted) return;

    if (result['success'] == true) {
      final resData = result['data'] is Map ? result['data'] as Map : null;
      final linkedProjectId = resData?['project_id'] ?? (widget.survey.hasProject ? widget.survey.projectId : null);
      final linkedProjectNumber = resData?['project_number'] ?? widget.survey.projectNumber;

      String displayMessage;
      Color snackColor;

      if (_feasibilityVerdict == 'Feasible') {
        if (linkedProjectId != null) {
          final pNum = linkedProjectNumber ?? "PRJ-$linkedProjectId";
          displayMessage = widget.survey.hasProject
              ? "Survey Feasible: Linked to existing project $pNum"
              : "Survey Feasible: Customer & project ($pNum) created automatically!";
        } else {
          displayMessage = result['message'] ?? "Site survey feasibility report saved!";
        }
        snackColor = AppColors.emeraldGreen;
      } else if (_feasibilityVerdict == 'Feasible with conditions') {
        displayMessage = "Feasibility with conditions saved. No project created; caveats logged for review.";
        snackColor = AppColors.solarGold;
      } else {
        displayMessage = "Survey marked Not Feasible. Non-feasibility constraints recorded.";
        snackColor = AppColors.errorRed;
      }

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(displayMessage),
          backgroundColor: snackColor,
        ),
      );
      Navigator.of(context).pop(true);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(result['message'] ?? "Error submitting feasibility report."),
          backgroundColor: AppColors.errorRed,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textPrimary = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final textSecondary = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;
    final cardBg = isDark ? AppColors.darkCard : AppColors.lightCard;
    final borderColor = isDark ? AppColors.darkBorder : AppColors.lightBorder;
    final provider = Provider.of<SurveyProvider>(context);

    return DraggableScrollableSheet(
      initialChildSize: 0.9,
      maxChildSize: 0.95,
      minChildSize: 0.6,
      builder: (_, scrollController) {
        return Container(
          decoration: BoxDecoration(
            color: cardBg,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
            border: Border.all(color: borderColor),
          ),
          child: Column(
            children: [
              // Sheet Header
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                decoration: BoxDecoration(
                  border: Border(bottom: BorderSide(color: borderColor)),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: AppColors.emeraldGreen.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(Icons.assignment_turned_in_rounded, color: AppColors.emeraldGreen, size: 20),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            "Site Feasibility Report",
                            style: AppTypography.headingSmall(color: textPrimary),
                          ),
                          Text(
                            "${widget.survey.customerName} • ${widget.survey.leadCode}",
                            style: AppTypography.caption(color: textSecondary),
                          ),
                          if (widget.survey.fullAddress.isNotEmpty && widget.survey.fullAddress != 'Address not recorded')
                            Text(
                              widget.survey.fullAddress,
                              style: TextStyle(fontSize: 10, color: textSecondary.withValues(alpha: 0.8)),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close_rounded, size: 20),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ],
                ),
              ),

              // Form Body
              Expanded(
                child: Form(
                  key: _formKey,
                  child: ListView(
                    controller: scrollController,
                    padding: const EdgeInsets.all(16),
                    children: [
                      if (widget.survey.hasProject) ...[
                        Container(
                          margin: const EdgeInsets.only(bottom: 14),
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: AppColors.skyBlue.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: AppColors.skyBlue.withValues(alpha: 0.35)),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.info_outline_rounded, color: AppColors.skyBlue, size: 20),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      "Linked Project: ${widget.survey.projectNumber ?? 'PRJ-${widget.survey.projectId}'}",
                                      style: TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.w700,
                                        color: textPrimary,
                                      ),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      "This survey is already connected to an active project. Saving will record technical specs without creating a duplicate customer or project.",
                                      style: TextStyle(fontSize: 11, color: textSecondary, height: 1.3),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],

                      // 1. Feasibility Verdict Pill Selector
                      Text(
                        "TECHNICAL FEASIBILITY VERDICT *",
                        style: AppTypography.caption(color: textSecondary),
                      ),
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          "Feasible",
                          "Feasible with conditions",
                          "Not feasible",
                        ].map((verdict) {
                          final isSelected = _feasibilityVerdict == verdict;
                          Color chipColor;
                          if (verdict == "Feasible") {
                            chipColor = AppColors.emeraldGreen;
                          } else if (verdict == "Feasible with conditions") {
                            chipColor = AppColors.solarGold;
                          } else {
                            chipColor = AppColors.errorRed;
                          }

                          return ChoiceChip(
                            label: Text(verdict),
                            selected: isSelected,
                            onSelected: (_) => setState(() => _feasibilityVerdict = verdict),
                            selectedColor: chipColor.withValues(alpha: 0.2),
                            backgroundColor: cardBg,
                            labelStyle: TextStyle(
                              fontSize: 12,
                              fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                              color: isSelected ? chipColor : textSecondary,
                            ),
                            side: BorderSide(
                              color: isSelected ? chipColor : borderColor,
                            ),
                          );
                        }).toList(),
                      ),

                      const SizedBox(height: 10),
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: (_feasibilityVerdict == 'Feasible'
                                  ? AppColors.emeraldGreen
                                  : (_feasibilityVerdict == 'Feasible with conditions'
                                      ? AppColors.solarGold
                                      : AppColors.errorRed))
                              .withValues(alpha: 0.08),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                            color: (_feasibilityVerdict == 'Feasible'
                                    ? AppColors.emeraldGreen
                                    : (_feasibilityVerdict == 'Feasible with conditions'
                                        ? AppColors.solarGold
                                        : AppColors.errorRed))
                                .withValues(alpha: 0.3),
                          ),
                        ),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Icon(
                              _feasibilityVerdict == 'Feasible'
                                  ? Icons.check_circle_outline_rounded
                                  : (_feasibilityVerdict == 'Feasible with conditions'
                                      ? Icons.warning_amber_rounded
                                      : Icons.cancel_outlined),
                              size: 16,
                              color: _feasibilityVerdict == 'Feasible'
                                  ? AppColors.emeraldGreen
                                  : (_feasibilityVerdict == 'Feasible with conditions'
                                      ? AppColors.solarGold
                                      : AppColors.errorRed),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                _feasibilityVerdict == 'Feasible'
                                    ? (widget.survey.hasProject
                                        ? "Feasible verdict links technical specs directly to existing project."
                                        : "Feasible verdict triggers automatic Customer & Project creation in the system.")
                                    : (_feasibilityVerdict == 'Feasible with conditions'
                                        ? "Feasible with Conditions logs technical caveats for review. No customer or project is created automatically."
                                        : "Not Feasible documents refusal constraints. No project or customer will be generated."),
                                style: TextStyle(
                                  fontSize: 11,
                                  color: textSecondary,
                                  fontWeight: FontWeight.w500,
                                  height: 1.3,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),

                      if (_feasibilityVerdict == "Not feasible") ...[
                        const SizedBox(height: 12),
                        TextFormField(
                          controller: _notFeasibleReasonController,
                          style: TextStyle(color: textPrimary),
                          decoration: InputDecoration(
                            labelText: "Reason for Non-Feasibility *",
                            hintText: "e.g. Excessive shading from adjacent tower, roof unstructurable",
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                          validator: (v) => (v == null || v.trim().isEmpty) ? "Please provide the reason" : null,
                        ),
                      ],

                      const SizedBox(height: 16),
                      const Divider(),
                      const SizedBox(height: 12),

                      // 2. Rooftop Specifications
                      Text(
                        "ROOFTOP & STRUCTURAL DETAILS",
                        style: AppTypography.caption(color: textSecondary),
                      ),
                      const SizedBox(height: 10),

                      Row(
                        children: [
                          Expanded(
                            child: DropdownButtonFormField<String>(
                              initialValue: _roofType,
                              dropdownColor: cardBg,
                              style: TextStyle(color: textPrimary, fontSize: 13),
                              decoration: InputDecoration(
                                labelText: "Roof Type *",
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                              ),
                              items: const [
                                DropdownMenuItem(value: "RCC", child: Text("RCC Flat Roof")),
                                DropdownMenuItem(value: "Metal Sheet", child: Text("Industrial Tin/Metal")),
                                DropdownMenuItem(value: "Sloped Tile", child: Text("Sloped Mangalore Tile")),
                                DropdownMenuItem(value: "Asbestos", child: Text("Asbestos Sheet")),
                                DropdownMenuItem(value: "Ground Mount", child: Text("Ground Mount Field")),
                              ],
                              onChanged: (v) => setState(() => _roofType = v ?? "RCC"),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: TextFormField(
                              controller: _roofAreaController,
                              keyboardType: TextInputType.number,
                              style: TextStyle(color: textPrimary),
                              decoration: InputDecoration(
                                labelText: "Roof Area (sq ft)",
                                hintText: "e.g. 750",
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                              ),
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 12),

                      Row(
                        children: [
                          Expanded(
                            child: DropdownButtonFormField<String>(
                              initialValue: _shadowConditions,
                              dropdownColor: cardBg,
                              style: TextStyle(color: textPrimary, fontSize: 13),
                              decoration: InputDecoration(
                                labelText: "Shadow Analysis *",
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                              ),
                              items: const [
                                DropdownMenuItem(value: "Shadow-free", child: Text("100% Shadow-free")),
                                DropdownMenuItem(value: "Partial morning/evening shadow", child: Text("Partial Shading")),
                                DropdownMenuItem(value: "Heavy shadow", child: Text("Heavy Obstruction")),
                              ],
                              onChanged: (v) => setState(() => _shadowConditions = v ?? "Shadow-free"),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: DropdownButtonFormField<String>(
                              initialValue: _roofOrientation,
                              dropdownColor: cardBg,
                              style: TextStyle(color: textPrimary, fontSize: 13),
                              decoration: InputDecoration(
                                labelText: "Roof Orientation",
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                              ),
                              items: const [
                                DropdownMenuItem(value: "South", child: Text("South Facing (Optimal)")),
                                DropdownMenuItem(value: "South-West", child: Text("South-West")),
                                DropdownMenuItem(value: "East-West", child: Text("East-West Split")),
                                DropdownMenuItem(value: "North", child: Text("North (Sub-optimal)")),
                              ],
                              onChanged: (v) => setState(() => _roofOrientation = v ?? "South"),
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 16),
                      const Divider(),
                      const SizedBox(height: 12),

                      // 3. Electrical & Grid Feasibility
                      Text(
                        "ELECTRICAL & GRID SPECIFICATIONS",
                        style: AppTypography.caption(color: textSecondary),
                      ),
                      const SizedBox(height: 10),

                      Row(
                        children: [
                          Expanded(
                            child: DropdownButtonFormField<String>(
                              initialValue: _electricalPhase,
                              dropdownColor: cardBg,
                              style: TextStyle(color: textPrimary, fontSize: 13),
                              decoration: InputDecoration(
                                labelText: "Grid Phase *",
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                              ),
                              items: const [
                                DropdownMenuItem(value: "Single Phase", child: Text("Single Phase (230V)")),
                                DropdownMenuItem(value: "3 Phase", child: Text("3 Phase (415V)")),
                              ],
                              onChanged: (v) => setState(() => _electricalPhase = v ?? "Single Phase"),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: TextFormField(
                              controller: _sanctionedLoadController,
                              keyboardType: TextInputType.number,
                              style: TextStyle(color: textPrimary),
                              decoration: InputDecoration(
                                labelText: "Sanctioned Load (kW)",
                                hintText: "e.g. 5.0",
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                              ),
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 12),

                      Row(
                        children: [
                          Expanded(
                            child: TextFormField(
                              controller: _proposedCapacityController,
                              keyboardType: TextInputType.number,
                              style: TextStyle(color: textPrimary),
                              decoration: InputDecoration(
                                labelText: "Proposed Solar kW *",
                                hintText: "e.g. 4.5",
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                              ),
                              validator: (v) => (v == null || v.trim().isEmpty) ? "Required" : null,
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: TextFormField(
                              controller: _consumerNumberController,
                              style: TextStyle(color: textPrimary),
                              decoration: InputDecoration(
                                labelText: "Discom K-No. / CA Number",
                                hintText: "e.g. 210145892",
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                              ),
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 16),
                      const Divider(),
                      const SizedBox(height: 12),

                      // 4. GPS & On-Site Notes
                      Text(
                        "SITE GPS COORDINATES & FIELD OBSERVATIONS",
                        style: AppTypography.caption(color: textSecondary),
                      ),
                      const SizedBox(height: 10),

                      Row(
                        children: [
                          Expanded(
                            child: TextFormField(
                              controller: _latController,
                              keyboardType: const TextInputType.numberWithOptions(decimal: true),
                              style: TextStyle(color: textPrimary),
                              decoration: InputDecoration(
                                labelText: "Latitude",
                                hintText: "e.g. 26.9124",
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                              ),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: TextFormField(
                              controller: _lngController,
                              keyboardType: const TextInputType.numberWithOptions(decimal: true),
                              style: TextStyle(color: textPrimary),
                              decoration: InputDecoration(
                                labelText: "Longitude",
                                hintText: "e.g. 75.7873",
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                              ),
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 12),

                      TextFormField(
                        controller: _feasibilityNotesController,
                        maxLines: 3,
                        style: TextStyle(color: textPrimary),
                        decoration: InputDecoration(
                          labelText: "Engineer Feasibility Observations",
                          hintText: "Enter cable length to meter, earthing pit location, roof accessibility, inverter placement...",
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                      ),

                      const SizedBox(height: 16),
                      const Divider(),
                      const SizedBox(height: 12),

                      // Survey Documents & Photos
                      SurveyDocumentsSection(
                        survey: widget.survey,
                        isEmbedded: true,
                      ),

                      const SizedBox(height: 24),

                      // Submit Button
                      ElevatedButton(
                        onPressed: provider.isSubmitting ? null : _submit,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.emeraldGreen,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        child: provider.isSubmitting
                            ? const SizedBox(
                                height: 20,
                                width: 20,
                                child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                              )
                            : const Text(
                                "Submit Site Feasibility Report",
                                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800),
                              ),
                      ),
                      const SizedBox(height: 20),
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
