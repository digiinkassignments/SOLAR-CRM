import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_typography.dart';
import '../../core/utils/formatters.dart';
import '../../models/subsidy_model.dart';
import '../../providers/financing_provider.dart';

class SubsidyDetailView extends StatefulWidget {
  final int leadId;
  final String? customerName;
  final int initialTab;

  const SubsidyDetailView({
    super.key,
    required this.leadId,
    this.customerName,
    this.initialTab = 0,
  });

  @override
  State<SubsidyDetailView> createState() => _SubsidyDetailViewState();
}

class _SubsidyDetailViewState extends State<SubsidyDetailView> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final ImagePicker _picker = ImagePicker();

  // Form Controllers
  final _consumerNoController = TextEditingController();
  final _appNoController = TextEditingController();
  final _capacityController = TextEditingController();
  final _schemeNameController = TextEditingController();
  final _discomNameController = TextEditingController();
  final _discomDivisionController = TextEditingController();
  final _bankNameController = TextEditingController();
  final _accountNoController = TextEditingController();
  final _ifscController = TextEditingController();
  final _accountHolderController = TextEditingController();
  final _utrController = TextEditingController();
  final _panelModelController = TextEditingController();
  final _panelSerialsController = TextEditingController();
  final _inverterModelController = TextEditingController();
  final _inverterSerialController = TextEditingController();
  final _totalCostController = TextEditingController();
  final _paidAmountController = TextEditingController();
  final _balanceController = TextEditingController();
  final _expectedSubsidyController = TextEditingController();
  final _amountReceivedController = TextEditingController();
  final _notesController = TextEditingController();

  bool _isDcrCompliant = true;
  String _currentPortalStage = "registered";
  bool _isSaving = false;

  // 9 PM Surya Ghar Required Document Types (Matching Web SubsidyDetail.jsx exactly)
  final List<Map<String, dynamic>> _docDefinitions = [
    {
      'type': 'electricity_bill',
      'label': 'Electricity Bill (CA No.)',
      'desc': 'DISCOM consumer bill matching solar installation address & sanctioned load',
      'icon': Icons.electric_bolt_outlined,
      'color': Color(0xFFD97706),
      'stage': '1. Registered',
    },
    {
      'type': 'id_proof',
      'label': 'Aadhaar Card / Photo ID',
      'desc': 'Proof of applicant identity for PM Surya Ghar portal submission',
      'icon': Icons.badge_outlined,
      'color': Color(0xFF2563EB),
      'stage': '1. Registered',
    },
    {
      'type': 'bank_passbook',
      'label': 'Bank Passbook / Cheque (DBT)',
      'desc': 'Aadhaar-linked bank account proof for Direct Benefit Transfer (₹78,000)',
      'icon': Icons.account_balance_outlined,
      'color': Color(0xFF059669),
      'stage': '8. Bank Details',
    },
    {
      'type': 'signed_agreement',
      'label': 'Signed Model Agreement',
      'desc': 'Tripartite/Vendor agreement signed by consumer and EPC partner',
      'icon': Icons.description_outlined,
      'color': Color(0xFF4F46E5),
      'stage': '4. Agreement',
    },
    {
      'type': 'geo_tagged_photos',
      'label': 'Geo-tagged Site Photos',
      'desc': 'Clear photos of installed solar array, structure, inverter & earth pit',
      'icon': Icons.camera_alt_outlined,
      'color': Color(0xFF0D9488),
      'stage': '5. Work Uploaded',
    },
    {
      'type': 'dcr_undertaking',
      'label': 'DCR Undertaking Certificate',
      'desc': 'Domestic Content Requirement certificate matching module serial numbers',
      'icon': Icons.assignment_turned_in_outlined,
      'color': Color(0xFFE11D48),
      'stage': '5. Work Uploaded',
    },
    {
      'type': 'inspection_report',
      'label': 'Site Feasibility Inspection Report',
      'desc': 'Technical site feasibility report signed by installer and customer',
      'icon': Icons.fact_check_outlined,
      'color': Color(0xFF7C3AED),
      'stage': '2. Feasibility',
    },
    {
      'type': 'meter_installation_report',
      'label': 'Net Meter Installation Report',
      'desc': 'Bi-directional net meter installation and sealing certificate by DISCOM',
      'icon': Icons.electric_meter_outlined,
      'color': Color(0xFFEA580C),
      'stage': '6. Net Meter',
    },
    {
      'type': 'commissioning_certificate',
      'label': 'Joint Commissioning Certificate (JCC)',
      'desc': 'Official commissioning certificate issued jointly by DISCOM inspector and EPC',
      'icon': Icons.verified_outlined,
      'color': Color(0xFF16A34A),
      'stage': '7. Commissioning',
    },
  ];

  // 9 PM Surya Ghar Portal Stages (Exact Sequential Order)
  final List<Map<String, dynamic>> _portalStages = [
    {
      'id': 'registered',
      'step': 1,
      'label': '1. Registered',
      'owner': 'Your Team',
      'days': 2,
      'chase': 'Your Team (Complete National Portal registration)',
      'color': Color(0xFF2563EB),
    },
    {
      'id': 'feasibility_approved',
      'step': 2,
      'label': '2. Feasibility Approved',
      'owner': 'DISCOM',
      'days': 7,
      'chase': 'DISCOM Junior Engineer (JE) / Feasibility Desk',
      'color': Color(0xFF7C3AED),
    },
    {
      'id': 'vendor_selected',
      'step': 3,
      'label': '3. Vendor Selected',
      'owner': 'Customer',
      'days': 3,
      'chase': 'Customer (Log in to portal & confirm vendor selection)',
      'color': Color(0xFFD97706),
    },
    {
      'id': 'agreement_uploaded',
      'step': 4,
      'label': '4. Agreement Uploaded',
      'owner': 'Your Team',
      'days': 2,
      'chase': 'Your Team (Upload signed model agreement)',
      'color': Color(0xFF0284C7),
    },
    {
      'id': 'installed_docs_uploaded',
      'step': 5,
      'label': '5. Installed & Uploaded',
      'owner': 'Your Team',
      'days': 10,
      'chase': 'Your Team (Upload site photos & DCR undertaking)',
      'color': Color(0xFF0D9488),
    },
    {
      'id': 'net_meter_applied',
      'step': 6,
      'label': '6. Net Meter Applied',
      'owner': 'DISCOM',
      'days': 15,
      'chase': 'DISCOM M&P Wing / Sub-division Meter Lab',
      'color': Color(0xFFEA580C),
    },
    {
      'id': 'commissioning_issued',
      'step': 7,
      'label': '7. Commissioning Issued',
      'owner': 'DISCOM',
      'days': 7,
      'chase': 'DISCOM Assistant Engineer (AEN) / Technical Inspector',
      'color': Color(0xFF16A34A),
    },
    {
      'id': 'bank_details_submitted',
      'step': 8,
      'label': '8. Bank Details Submitted',
      'owner': 'Your Team',
      'days': 2,
      'chase': 'Your Team (Verify bank mandate & passbook for DBT)',
      'color': Color(0xFF059669),
    },
    {
      'id': 'subsidy_credited',
      'step': 9,
      'label': '9. Subsidy Credited',
      'owner': 'Government',
      'days': 30,
      'chase': 'Central DBT / PFMS (Direct Bank Transfer release)',
      'color': Color(0xFF047857),
    },
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this, initialIndex: widget.initialTab);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadDetails();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    _consumerNoController.dispose();
    _appNoController.dispose();
    _capacityController.dispose();
    _schemeNameController.dispose();
    _discomNameController.dispose();
    _discomDivisionController.dispose();
    _bankNameController.dispose();
    _accountNoController.dispose();
    _ifscController.dispose();
    _accountHolderController.dispose();
    _utrController.dispose();
    _panelModelController.dispose();
    _panelSerialsController.dispose();
    _inverterModelController.dispose();
    _inverterSerialController.dispose();
    _totalCostController.dispose();
    _paidAmountController.dispose();
    _balanceController.dispose();
    _expectedSubsidyController.dispose();
    _amountReceivedController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  void _loadDetails() async {
    final provider = Provider.of<FinancingProvider>(context, listen: false);
    await provider.fetchSubsidyDetails(widget.leadId);
    final active = provider.activeSubsidy;
    if (active != null) {
      _consumerNoController.text = active.consumerNumber ?? "";
      _appNoController.text = active.portalAckNo ?? "";
      _capacityController.text = active.plantCapacity.toString();
      _schemeNameController.text = "PM Surya Ghar Muft Bijli Yojana";
      _discomNameController.text = active.discom ?? "JVVNL";
      _discomDivisionController.text = active.discomDivision ?? "";
      _expectedSubsidyController.text = active.expectedSubsidy.toStringAsFixed(0);
      _amountReceivedController.text = active.amountReceived.toStringAsFixed(0);
      _currentPortalStage = active.stage;
      _isDcrCompliant = active.isDcrCompliant ?? true;
      setState(() {});
    }
  }

  void _copyPortalDataPack(SubsidyItemModel item) {
    final text = """=== PM SURYA GHAR PORTAL DATA PACK ===
Applicant: ${item.customerName}
Electricity Bill CA No.: ${_consumerNoController.text.isNotEmpty ? _consumerNoController.text : (item.consumerNumber ?? "N/A")}
PM Surya Ghar App No.: ${_appNoController.text.isNotEmpty ? _appNoController.text : (item.portalAckNo ?? "Pending")}
Address: ${[item.address, item.city, item.state, item.pincode].where((e) => e != null && e.isNotEmpty).join(", ")}
Capacity: ${_capacityController.text.isNotEmpty ? _capacityController.text : item.plantCapacity.toString()} kW
DISCOM: ${_discomNameController.text.isNotEmpty ? _discomNameController.text : (item.discom ?? "Not recorded")} (${_discomDivisionController.text.isNotEmpty ? _discomDivisionController.text : (item.discomDivision ?? item.city ?? "Circle Office")})
DCR Compliant: ${_isDcrCompliant ? "YES (Recorded Compliant)" : "Needs Verification"}
Expected Subsidy: ₹${_expectedSubsidyController.text.isNotEmpty ? _expectedSubsidyController.text : item.expectedSubsidy.toStringAsFixed(0)}
Current Portal Stage: $_currentPortalStage
======================================""";

    Clipboard.setData(ClipboardData(text: text));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text("Copied Portal Data Pack for ${item.customerName}!"),
        backgroundColor: AppColors.brandNavy,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  Future<void> _openNationalPortal() async {
    final uri = Uri.parse("https://pmsuryaghar.gov.in/");
    try {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } catch (_) {}
  }

  Future<void> _savePortalInformation() async {
    if (_isSaving) return;
    setState(() => _isSaving = true);
    final provider = Provider.of<FinancingProvider>(context, listen: false);

    final payload = {
      'lead_id': widget.leadId,
      'consumer_number': _consumerNoController.text.trim(),
      'application_number': _appNoController.text.trim(),
      'sanctioned_capacity_kw': double.tryParse(_capacityController.text.trim()) ?? 3.5,
      'scheme_name': _schemeNameController.text.trim().isNotEmpty ? _schemeNameController.text.trim() : "PM Surya Ghar Muft Bijli Yojana",
      'portal_status': _currentPortalStage,
      'discom_name': _discomNameController.text.trim().isNotEmpty ? _discomNameController.text.trim() : "JVVNL",
      'discom_division': _discomDivisionController.text.trim(),
      'bank_name': _bankNameController.text.trim(),
      'bank_account_no': _accountNoController.text.trim(),
      'bank_ifsc': _ifscController.text.trim(),
      'bank_account_holder': _accountHolderController.text.trim(),
      'utr_number': _utrController.text.trim(),
      'panel_make_model': _panelModelController.text.trim(),
      'panel_serial_numbers': _panelSerialsController.text.trim(),
      'is_dcr_compliant': _isDcrCompliant ? 1 : 0,
      'inverter_make_model': _inverterModelController.text.trim(),
      'inverter_serial_number': _inverterSerialController.text.trim(),
      'customer_total_cost': double.tryParse(_totalCostController.text.trim()) ?? 0,
      'customer_amount_paid': double.tryParse(_paidAmountController.text.trim()) ?? 0,
      'customer_balance': double.tryParse(_balanceController.text.trim()) ?? 0,
      'expected_subsidy': double.tryParse(_expectedSubsidyController.text.trim()) ?? 78000.0,
      'amount_received': double.tryParse(_amountReceivedController.text.trim()) ?? 0.0,
      'portal_notes': _notesController.text.trim(),
    };

    final res = await provider.applySubsidy(payload);
    setState(() => _isSaving = false);

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(res['message']?.toString() ?? "Saved"),
          backgroundColor: res['success'] == true ? AppColors.emeraldGreen : AppColors.errorRed,
        ),
      );
    }
  }

  Future<void> _advanceStage() async {
    final currentIdx = _portalStages.indexWhere((s) => s['id'] == _currentPortalStage);
    if (currentIdx >= _portalStages.length - 1) return;
    final next = _portalStages[currentIdx + 1];

    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text("Advance Portal Stage?"),
        content: Text("Advance this PM Surya Ghar application to:\n\n${next['label']}\n\nOwner: ${next['owner']}\nTarget SLA: ${next['days']} Days"),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text("Cancel")),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.brandPrimary, foregroundColor: Colors.white),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text("Confirm Advance"),
          ),
        ],
      ),
    );

    if (confirm == true) {
      setState(() => _currentPortalStage = next['id'] as String);
      await _savePortalInformation();
    }
  }

  Future<void> _pickAndUploadDocument(String docType, ImageSource source) async {
    try {
      final provider = Provider.of<FinancingProvider>(context, listen: false);
      final picked = await _picker.pickImage(
        source: source,
        maxWidth: 1600,
        maxHeight: 1600,
        imageQuality: 85,
      );
      if (picked == null) return;

      final res = await provider.uploadSubsidyDocument(
        leadId: widget.leadId,
        docType: docType,
        filePath: picked.path,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: res['success'] == true ? AppColors.emeraldGreen : AppColors.errorRed,
            content: Text(res['message']?.toString() ?? "Document processed"),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(backgroundColor: AppColors.errorRed, content: Text("Upload error: $e")),
        );
      }
    }
  }

  void _showImagePreviewDialog(SubsidyDocumentModel doc) {
    final provider = Provider.of<FinancingProvider>(context, listen: false);
    final fullUrl = doc.getFullFileUrl(provider.baseApiUrl);

    showDialog(
      context: context,
      builder: (ctx) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        clipBehavior: Clip.antiAlias,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            AppBar(
              elevation: 0,
              backgroundColor: Colors.black,
              foregroundColor: Colors.white,
              title: Text(doc.docType.replaceAll('_', ' ').toUpperCase(), style: const TextStyle(fontSize: 14)),
              actions: [
                IconButton(icon: const Icon(Icons.close_rounded), onPressed: () => Navigator.pop(ctx)),
              ],
            ),
            Container(
              constraints: const BoxConstraints(maxHeight: 400),
              color: Colors.black,
              child: Image.network(
                fullUrl,
                fit: BoxFit.contain,
                loadingBuilder: (c, child, progress) => progress == null
                    ? child
                    : const Center(child: CircularProgressIndicator(color: AppColors.brandPrimary)),
                errorBuilder: (c, e, s) => Container(
                  padding: const EdgeInsets.all(40),
                  child: const Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.broken_image_outlined, color: Colors.grey, size: 48),
                      SizedBox(height: 8),
                      Text("Preview not available", style: TextStyle(color: Colors.grey)),
                    ],
                  ),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  OutlinedButton.icon(
                    icon: const Icon(Icons.check_circle_outline, color: AppColors.emeraldGreen, size: 16),
                    label: const Text("Verify", style: TextStyle(color: AppColors.emeraldGreen)),
                    onPressed: () async {
                      Navigator.pop(ctx);
                      await provider.verifyDocument(docId: doc.id, leadId: widget.leadId, status: 'Verified');
                    },
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? AppColors.darkCard : AppColors.lightCard;
    final borderColor = isDark ? AppColors.darkBorder : AppColors.lightBorder;
    final textPrimary = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final textSecondary = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;

    final provider = Provider.of<FinancingProvider>(context);
    final active = provider.activeSubsidy;
    final docs = provider.activeDocuments;
    final isLoading = provider.isLoadingDetails;

    final currentStageIdx = _portalStages.indexWhere((s) => s['id'] == _currentPortalStage);
    final currentStageObj = currentStageIdx != -1 ? _portalStages[currentStageIdx] : _portalStages[0];
    final progressPct = ((currentStageIdx + 1) / _portalStages.length).clamp(0.1, 1.0);

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          onPressed: () => Navigator.pop(context),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              active?.customerName ?? widget.customerName ?? "Subsidy Application",
              style: AppTypography.headingSmall(color: textPrimary),
            ),
            Text(
              "PM Surya Ghar Portal • Lead #${widget.leadId}",
              style: AppTypography.caption(color: textSecondary),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.copy_rounded, size: 20),
            tooltip: "Copy Portal Data Pack",
            onPressed: active != null ? () => _copyPortalDataPack(active) : null,
          ),
          IconButton(
            icon: const Icon(Icons.open_in_new_rounded, size: 20),
            tooltip: "National Portal",
            onPressed: _openNationalPortal,
          ),
          IconButton(
            icon: const Icon(Icons.refresh_rounded, size: 20),
            tooltip: "Refresh",
            onPressed: _loadDetails,
          ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(48),
          child: Container(
            decoration: BoxDecoration(border: Border(bottom: BorderSide(color: borderColor))),
            child: TabBar(
              controller: _tabController,
              indicatorColor: AppColors.brandPrimary,
              labelColor: AppColors.brandPrimary,
              unselectedLabelColor: textSecondary,
              labelStyle: AppTypography.bodySmall(fontWeight: FontWeight.w700),
              tabs: const [
                Tab(icon: Icon(Icons.assignment_outlined, size: 16), text: "Portal Workflow"),
                Tab(icon: Icon(Icons.folder_shared_outlined, size: 16), text: "Document Vault (9)"),
                Tab(icon: Icon(Icons.tune_outlined, size: 16), text: "Edit Details"),
              ],
            ),
          ),
        ),
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.brandPrimary))
          : TabBarView(
              controller: _tabController,
              children: [
                // TAB 1: PORTAL WORKFLOW & STEPPER
                _buildWorkflowTab(active, currentStageObj, progressPct, currentStageIdx, isDark, cardBg, borderColor, textPrimary, textSecondary),

                // TAB 2: DOCUMENT VAULT (9 REQUIRED DOCUMENTS)
                _buildVaultTab(docs, isDark, cardBg, borderColor, textPrimary, textSecondary),

                // TAB 3: EDIT DETAILS FORM
                _buildEditFormTab(isDark, cardBg, borderColor, textPrimary, textSecondary),
              ],
            ),
    );
  }

  // ==========================================
  // TAB 1: WORKFLOW & STAGE STEPPER
  // ==========================================
  Widget _buildWorkflowTab(
    SubsidyItemModel? active,
    Map<String, dynamic> currentStageObj,
    double progressPct,
    int currentStageIdx,
    bool isDark,
    Color cardBg,
    Color borderColor,
    Color textPrimary,
    Color textSecondary,
  ) {
    final color = currentStageObj['color'] as Color;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 1. Applicant Header Card
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: cardBg,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: borderColor),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: AppColors.brandPrimary.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text("LEAD #${widget.leadId}", style: AppTypography.badge(color: AppColors.brandPrimary)),
                    ),
                    const SizedBox(width: 8),
                    if (_isDcrCompliant)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: AppColors.emeraldGreen.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text("DCR COMPLIANT", style: AppTypography.badge(color: AppColors.emeraldGreen)),
                      ),
                    const Spacer(),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: color.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(currentStageObj['label'] as String, style: AppTypography.badge(color: color)),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(active?.customerName ?? widget.customerName ?? "Solar Customer", style: AppTypography.headingMedium(color: textPrimary)),
                if (active?.customerPhone != null && active!.customerPhone!.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Icon(Icons.phone_outlined, size: 14, color: Colors.grey),
                      const SizedBox(width: 4),
                      Text(active.customerPhone!, style: AppTypography.caption(color: textSecondary)),
                      const SizedBox(width: 12),
                      InkWell(
                        onTap: () => launchUrl(Uri.parse("tel:${active.customerPhone}")),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(color: AppColors.emeraldGreen.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(4)),
                          child: const Text("Call", style: TextStyle(fontSize: 10, color: AppColors.emeraldGreen, fontWeight: FontWeight.w700)),
                        ),
                      ),
                    ],
                  ),
                ],
                const SizedBox(height: 10),
                const Divider(),
                const SizedBox(height: 6),
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text("Consumer CA No.", style: AppTypography.caption(color: textSecondary)),
                          Text(
                            _consumerNoController.text.isNotEmpty ? _consumerNoController.text : (active?.consumerNumber ?? "Pending"),
                            style: AppTypography.bodySmall(color: textPrimary, fontWeight: FontWeight.w700),
                          ),
                        ],
                      ),
                    ),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text("App Reference No.", style: AppTypography.caption(color: textSecondary)),
                          Text(
                            _appNoController.text.isNotEmpty ? _appNoController.text : (active?.portalAckNo ?? "Pending"),
                            style: AppTypography.bodySmall(color: textPrimary, fontWeight: FontWeight.w700),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text("DISCOM Name", style: AppTypography.caption(color: textSecondary)),
                          Text(
                            _discomNameController.text.isNotEmpty ? _discomNameController.text : (active?.discom ?? "JVVNL"),
                            style: AppTypography.bodySmall(color: textPrimary, fontWeight: FontWeight.w700),
                          ),
                        ],
                      ),
                    ),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text("Expected Subsidy", style: AppTypography.caption(color: textSecondary)),
                          Text(
                            Formatters.formatCurrency(active?.expectedSubsidy ?? 78000.0),
                            style: AppTypography.bodySmall(color: AppColors.emeraldGreen, fontWeight: FontWeight.w800),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // 2. Current Stage Action Banner
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: color.withValues(alpha: 0.3)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.flag_outlined, color: color, size: 20),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        "Current Stage: ${currentStageObj['label']}",
                        style: AppTypography.bodyMedium(color: color, fontWeight: FontWeight.w700),
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(4)),
                      child: Text(currentStageObj['owner'] as String, style: const TextStyle(fontSize: 10, color: Colors.white, fontWeight: FontWeight.w700)),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  "Chase Action: ${currentStageObj['chase']}",
                  style: AppTypography.caption(color: textPrimary),
                ),
                const SizedBox(height: 6),
                Text(
                  "Target SLA: ${currentStageObj['days']} Days",
                  style: AppTypography.caption(color: textSecondary),
                ),
                const SizedBox(height: 12),
                if (currentStageIdx < _portalStages.length - 1)
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: color,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      icon: const Icon(Icons.arrow_forward_rounded, size: 16),
                      label: Text("Advance to ${_portalStages[currentStageIdx + 1]['label']}"),
                      onPressed: _advanceStage,
                    ),
                  ),
              ],
            ),
          ),

          const SizedBox(height: 20),

          // 3. 9-Stage Visual Stepper Timeline
          Text("PM Surya Ghar 9 Lifecycle Stages", style: AppTypography.headingSmall(color: textPrimary)),
          const SizedBox(height: 10),

          ..._portalStages.map((stage) {
            final idx = _portalStages.indexOf(stage);
            final isCompleted = idx < currentStageIdx;
            final isCurrent = idx == currentStageIdx;
            final stageColor = stage['color'] as Color;

            return Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              decoration: BoxDecoration(
                color: isCurrent ? stageColor.withValues(alpha: 0.08) : cardBg,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                  color: isCurrent ? stageColor : (isCompleted ? AppColors.emeraldGreen.withValues(alpha: 0.4) : borderColor),
                  width: isCurrent ? 1.5 : 1.0,
                ),
              ),
              child: Row(
                children: [
                  Container(
                    width: 24,
                    height: 24,
                    decoration: BoxDecoration(
                      color: isCompleted ? AppColors.emeraldGreen : (isCurrent ? stageColor : Colors.grey.withValues(alpha: 0.2)),
                      shape: BoxShape.circle,
                    ),
                    child: Center(
                      child: isCompleted
                          ? const Icon(Icons.check, size: 14, color: Colors.white)
                          : Text("${stage['step']}", style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: isCurrent ? Colors.white : Colors.grey)),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          stage['label'] as String,
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: isCurrent ? FontWeight.w800 : FontWeight.w600,
                            color: isCurrent ? stageColor : textPrimary,
                          ),
                        ),
                        Text(
                          "Owner: ${stage['owner']} • Target SLA: ${stage['days']} Days",
                          style: AppTypography.caption(color: textSecondary),
                        ),
                      ],
                    ),
                  ),
                  if (isCurrent)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(color: stageColor, borderRadius: BorderRadius.circular(4)),
                      child: const Text("IN PROGRESS", style: TextStyle(fontSize: 9, color: Colors.white, fontWeight: FontWeight.w700)),
                    ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }

  // ==========================================
  // TAB 2: DOCUMENT VAULT (ALL 9 REQUIRED DOCS)
  // ==========================================
  Widget _buildVaultTab(
    List<SubsidyDocumentModel> uploadedDocs,
    bool isDark,
    Color cardBg,
    Color borderColor,
    Color textPrimary,
    Color textSecondary,
  ) {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _docDefinitions.length,
      itemBuilder: (ctx, idx) {
        final def = _docDefinitions[idx];
        final type = def['type'] as String;
        final label = def['label'] as String;
        final desc = def['desc'] as String;
        final icon = def['icon'] as IconData;
        final color = def['color'] as Color;
        final requiredStage = def['stage'] as String;

        // Find if document is already uploaded
        final uploaded = uploadedDocs.where((d) => d.docType.toLowerCase() == type.toLowerCase()).firstOrNull;

        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: cardBg,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: uploaded != null ? color.withValues(alpha: 0.5) : borderColor),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: color.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(icon, color: color, size: 20),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(label, style: AppTypography.bodyMedium(color: textPrimary, fontWeight: FontWeight.w700)),
                        Text("Mandatory for: $requiredStage", style: AppTypography.caption(color: textSecondary)),
                      ],
                    ),
                  ),
                  if (uploaded != null)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: uploaded.verificationStatus == 'Verified'
                            ? AppColors.emeraldGreen.withValues(alpha: 0.12)
                            : (uploaded.verificationStatus == 'Rejected' ? AppColors.errorRed.withValues(alpha: 0.12) : const Color(0xFFF59E0B).withValues(alpha: 0.12)),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        uploaded.verificationStatus.toUpperCase(),
                        style: AppTypography.badge(
                          color: uploaded.verificationStatus == 'Verified'
                              ? AppColors.emeraldGreen
                              : (uploaded.verificationStatus == 'Rejected' ? AppColors.errorRed : const Color(0xFFF59E0B)),
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 6),
              Text(desc, style: AppTypography.caption(color: textSecondary)),
              const SizedBox(height: 12),
              const Divider(),
              const SizedBox(height: 6),

              // Upload or View Buttons
              if (uploaded != null)
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    OutlinedButton.icon(
                      icon: const Icon(Icons.visibility_outlined, size: 14),
                      label: const Text("View File", style: TextStyle(fontSize: 12)),
                      onPressed: () => _showImagePreviewDialog(uploaded),
                    ),
                    Row(
                      children: [
                        IconButton(
                          icon: const Icon(Icons.camera_alt_outlined, size: 18),
                          tooltip: "Re-take Photo",
                          onPressed: () => _pickAndUploadDocument(type, ImageSource.camera),
                        ),
                        IconButton(
                          icon: const Icon(Icons.photo_library_outlined, size: 18),
                          tooltip: "Re-upload from Gallery",
                          onPressed: () => _pickAndUploadDocument(type, ImageSource.gallery),
                        ),
                      ],
                    ),
                  ],
                )
              else
                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.brandPrimary,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 8),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        ),
                        icon: const Icon(Icons.camera_alt_outlined, size: 16),
                        label: const Text("Capture Photo", style: TextStyle(fontSize: 12)),
                        onPressed: () => _pickAndUploadDocument(type, ImageSource.camera),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: OutlinedButton.icon(
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 8),
                          side: BorderSide(color: borderColor),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        ),
                        icon: const Icon(Icons.photo_library_outlined, size: 16),
                        label: const Text("Gallery", style: TextStyle(fontSize: 12)),
                        onPressed: () => _pickAndUploadDocument(type, ImageSource.gallery),
                      ),
                    ),
                  ],
                ),
            ],
          ),
        );
      },
    );
  }

  // ==========================================
  // TAB 3: EDIT DETAILS FORM (Matching Web Exactly)
  // ==========================================
  Widget _buildEditFormTab(
    bool isDark,
    Color cardBg,
    Color borderColor,
    Color textPrimary,
    Color textSecondary,
  ) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Section 1: DISCOM & Consumer Info
          Text("1. DISCOM & Consumer Information", style: AppTypography.headingSmall(color: textPrimary)),
          const SizedBox(height: 10),
          TextFormField(
            controller: _consumerNoController,
            decoration: InputDecoration(
              labelText: "Electricity Consumer CA Number *",
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
            ),
          ),
          const SizedBox(height: 10),
          TextFormField(
            controller: _appNoController,
            decoration: InputDecoration(
              labelText: "PM Surya Ghar Application Number",
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
            ),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: TextFormField(
                  controller: _capacityController,
                  keyboardType: TextInputType.number,
                  decoration: InputDecoration(
                    labelText: "Plant Capacity (kW)",
                    suffixText: "kW",
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: TextFormField(
                  controller: _discomNameController,
                  decoration: InputDecoration(
                    labelText: "DISCOM Name",
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          TextFormField(
            controller: _discomDivisionController,
            decoration: InputDecoration(
              labelText: "DISCOM Sub-Division / Circle",
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
            ),
          ),

          const SizedBox(height: 20),

          // Section 2: Bank DBT Account (₹78,000)
          Text("2. Bank DBT Account Details", style: AppTypography.headingSmall(color: textPrimary)),
          const SizedBox(height: 10),
          TextFormField(
            controller: _accountHolderController,
            decoration: InputDecoration(
              labelText: "Account Holder Name",
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
            ),
          ),
          const SizedBox(height: 10),
          TextFormField(
            controller: _bankNameController,
            decoration: InputDecoration(
              labelText: "Bank Name",
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
            ),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                flex: 3,
                child: TextFormField(
                  controller: _accountNoController,
                  decoration: InputDecoration(
                    labelText: "Account Number",
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                flex: 2,
                child: TextFormField(
                  controller: _ifscController,
                  decoration: InputDecoration(
                    labelText: "IFSC Code",
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 20),

          // Section 3: Hardware & DCR Undertaking
          Text("3. Solar Hardware & DCR Undertaking", style: AppTypography.headingSmall(color: textPrimary)),
          const SizedBox(height: 10),
          TextFormField(
            controller: _panelModelController,
            decoration: InputDecoration(
              labelText: "Solar Panel Make & Model",
              hintText: "e.g. Waaree 540W Mono PERC",
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
            ),
          ),
          const SizedBox(height: 10),
          TextFormField(
            controller: _panelSerialsController,
            decoration: InputDecoration(
              labelText: "Panel Serial Numbers",
              hintText: "Comma-separated serials",
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
            ),
          ),
          const SizedBox(height: 10),
          SwitchListTile(
            title: const Text("DCR Compliant Modules"),
            subtitle: const Text("Domestic Content Requirement certified"),
            value: _isDcrCompliant,
            activeThumbColor: AppColors.emeraldGreen,
            onChanged: (val) => setState(() => _isDcrCompliant = val),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: TextFormField(
                  controller: _inverterModelController,
                  decoration: InputDecoration(
                    labelText: "Inverter Model",
                    hintText: "e.g. Growatt 5kW",
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: TextFormField(
                  controller: _inverterSerialController,
                  decoration: InputDecoration(
                    labelText: "Inverter Serial #",
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 20),

          // Section 4: Subsidy & Financial Math
          Text("4. Subsidy & Financial Figures", style: AppTypography.headingSmall(color: textPrimary)),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: TextFormField(
                  controller: _expectedSubsidyController,
                  keyboardType: TextInputType.number,
                  decoration: InputDecoration(
                    labelText: "Expected Subsidy (₹)",
                    prefixText: "₹ ",
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: TextFormField(
                  controller: _amountReceivedController,
                  keyboardType: TextInputType.number,
                  decoration: InputDecoration(
                    labelText: "Credited Subsidy (₹)",
                    prefixText: "₹ ",
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          TextFormField(
            controller: _notesController,
            maxLines: 2,
            decoration: InputDecoration(
              labelText: "Portal Notes & Remarks",
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
            ),
          ),

          const SizedBox(height: 24),

          // Save Button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.brandPrimary,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              icon: _isSaving
                  ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                  : const Icon(Icons.save_outlined),
              label: Text(_isSaving ? "Saving Portal Info..." : "Save Portal Information", style: AppTypography.button()),
              onPressed: _isSaving ? null : _savePortalInformation,
            ),
          ),
          const SizedBox(height: 40),
        ],
      ),
    );
  }
}
