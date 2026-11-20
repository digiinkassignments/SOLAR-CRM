import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_typography.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/utils/platform_permission_helper.dart';
import '../../../models/subsidy_model.dart';
import '../../../providers/financing_provider.dart';
import '../subsidy_detail_view.dart';

class SubsidyDetailSheet extends StatefulWidget {
  final int leadId;
  final String customerName;

  const SubsidyDetailSheet({
    super.key,
    required this.leadId,
    required this.customerName,
  });

  static Future<void> show(BuildContext context, {required int leadId, required String customerName, int initialTab = 0}) {
    return Navigator.push<void>(
      context,
      MaterialPageRoute(
        builder: (ctx) => SubsidyDetailView(
          leadId: leadId,
          customerName: customerName,
          initialTab: initialTab,
        ),
      ),
    );
  }

  @override
  State<SubsidyDetailSheet> createState() => _SubsidyDetailSheetState();
}

class _SubsidyDetailSheetState extends State<SubsidyDetailSheet> {
  final ImagePicker _picker = ImagePicker();

  final List<Map<String, dynamic>> _requiredDocs = [
    {
      'type': 'id_proof',
      'label': 'Aadhaar Card / Photo ID',
      'icon': Icons.badge_outlined,
      'color': Color(0xFF2563EB),
    },
    {
      'type': 'pan_card',
      'label': 'PAN Card',
      'icon': Icons.credit_card_outlined,
      'color': Color(0xFF4F46E5),
    },
    {
      'type': 'electricity_bill',
      'label': 'Latest Electricity Bill',
      'icon': Icons.electric_bolt_outlined,
      'color': Color(0xFFD97706),
    },
    {
      'type': 'bank_proof',
      'label': 'Bank Passbook / Cheque (DBT)',
      'icon': Icons.account_balance_outlined,
      'color': Color(0xFF059669),
    },
    {
      'type': 'site_photo',
      'label': 'Site Inspection Photo',
      'icon': Icons.camera_alt_outlined,
      'color': Color(0xFF0D9488),
    },
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<FinancingProvider>(context, listen: false).fetchSubsidyDetails(widget.leadId);
    });
  }

  Future<void> _pickAndUploadDocument(String docType, ImageSource source) async {
    try {
      final picked = await _picker.pickImage(
        source: source,
        maxWidth: 1280,
        maxHeight: 1280,
        imageQuality: 85,
      );
      if (picked == null) return;

      if (!mounted) return;
      final provider = Provider.of<FinancingProvider>(context, listen: false);
      final res = await provider.uploadSubsidyDocument(
        leadId: widget.leadId,
        docType: docType,
        filePath: picked.path,
      );

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: res['success'] == true ? AppColors.emeraldGreen : AppColors.errorRed,
          content: Text(res['message']?.toString() ?? "Document processed"),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      if (PlatformPermissionHelper.isPermissionDeniedError(e)) {
        PlatformPermissionHelper.showPermissionDialog(
          context,
          type: source == ImageSource.camera
              ? PlatformPermissionType.camera
              : PlatformPermissionType.photos,
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(backgroundColor: AppColors.errorRed, content: Text("Upload error: $e")),
        );
      }
    }
  }

  void _showUploadSourcePicker(String docType, String docLabel) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                  child: Row(
                    children: [
                      Text("Upload $docLabel", style: AppTypography.headingSmall()),
                      const Spacer(),
                      IconButton(icon: const Icon(Icons.close_rounded), onPressed: () => Navigator.of(ctx).pop()),
                    ],
                  ),
                ),
                const Divider(),
                ListTile(
                  leading: const Icon(Icons.camera_alt_outlined, color: AppColors.brandPrimary),
                  title: const Text("Capture with Camera"),
                  subtitle: const Text("Take a direct photo using phone camera"),
                  onTap: () {
                    Navigator.of(ctx).pop();
                    _pickAndUploadDocument(docType, ImageSource.camera);
                  },
                ),
                ListTile(
                  leading: const Icon(Icons.photo_library_outlined, color: AppColors.brandPrimary),
                  title: const Text("Select from Gallery"),
                  subtitle: const Text("Upload saved image or screenshot"),
                  onTap: () {
                    Navigator.of(ctx).pop();
                    _pickAndUploadDocument(docType, ImageSource.gallery);
                  },
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  void _showFullImageDialog(String fullUrl, String title) {
    showDialog(
      context: context,
      builder: (ctx) => Dialog(
        backgroundColor: Colors.transparent,
        insetPadding: const EdgeInsets.all(12),
        child: Stack(
          alignment: Alignment.center,
          children: [
            Container(
              decoration: BoxDecoration(color: Colors.black, borderRadius: BorderRadius.circular(16)),
              clipBehavior: Clip.antiAlias,
              child: InteractiveViewer(
                child: Image.network(
                  fullUrl,
                  fit: BoxFit.contain,
                  errorBuilder: (context, error, stackTrace) => const Padding(
                    padding: EdgeInsets.all(32),
                    child: Text("Could not preview image", style: TextStyle(color: Colors.white)),
                  ),
                ),
              ),
            ),
            Positioned(
              top: 10,
              right: 10,
              child: IconButton(
                style: IconButton.styleFrom(backgroundColor: Colors.black54),
                icon: const Icon(Icons.close_rounded, color: Colors.white),
                onPressed: () => Navigator.of(ctx).pop(),
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
    final cardBg = isDark ? AppColors.darkSurfaceElevated : AppColors.lightCard;
    final borderColor = isDark ? AppColors.darkBorder : AppColors.lightBorder;
    final textPrimary = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final textSecondary = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;

    final provider = Provider.of<FinancingProvider>(context);
    final subsidy = provider.activeSubsidy;
    final docs = provider.activeDocuments;
    final isLoading = provider.isLoadingDetails;

    return Container(
      height: MediaQuery.of(context).size.height * 0.88,
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        border: Border.all(color: borderColor),
      ),
      child: Column(
        children: [
          // Drag Handle
          Center(
            child: Container(
              margin: const EdgeInsets.only(top: 10, bottom: 6),
              width: 36,
              height: 4,
              decoration: BoxDecoration(
                color: borderColor,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),

          // Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: AppColors.brandPrimary.withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text("LEAD #${widget.leadId}", style: AppTypography.badge(color: AppColors.brandPrimary)),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              widget.customerName,
                              style: AppTypography.headingSmall(color: textPrimary),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 2),
                      Text("PM Surya Ghar National Portal & Document Vault", style: AppTypography.caption(color: textSecondary)),
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close_rounded),
                  onPressed: () => Navigator.of(context).pop(),
                ),
              ],
            ),
          ),

          const Divider(height: 1),

          Expanded(
            child: isLoading && subsidy == null
                ? const Center(child: CircularProgressIndicator())
                : SingleChildScrollView(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // 1. Current Portal Stage & Turnaround SLA
                        _buildStageBanner(subsidy, isDark, textPrimary, textSecondary),

                        const SizedBox(height: 16),

                        // 2. Application Key Details
                        _buildApplicationDetails(subsidy, cardBg, borderColor, textPrimary, textSecondary),

                        const SizedBox(height: 20),

                        // 3. Document Vault Header
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Row(
                              children: [
                                const Icon(Icons.folder_shared_outlined, size: 20, color: AppColors.brandPrimary),
                                const SizedBox(width: 8),
                                Text("Customer Document Vault", style: AppTypography.headingSmall(color: textPrimary)),
                              ],
                            ),
                            Text(
                              "${docs.where((d) => d.verificationStatus == 'Verified').length}/${_requiredDocs.length} Verified",
                              style: AppTypography.caption(color: AppColors.emeraldGreen, fontWeight: FontWeight.w700),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          "Upload clear photos/scans for DISCOM Feasibility & DBT transfer.",
                          style: AppTypography.caption(color: textSecondary),
                        ),

                        const SizedBox(height: 14),

                        // 4. Document Cards List
                        ...List.generate(_requiredDocs.length, (idx) {
                          final item = _requiredDocs[idx];
                          final type = item['type'] as String;
                          final label = item['label'] as String;
                          final icon = item['icon'] as IconData;
                          final color = item['color'] as Color;

                          final uploadedDoc = docs.cast<SubsidyDocumentModel?>().firstWhere(
                            (d) => d?.docType == type,
                            orElse: () => null,
                          );

                          return _buildDocCard(
                            type: type,
                            label: label,
                            icon: icon,
                            color: color,
                            doc: uploadedDoc,
                            provider: provider,
                            isDark: isDark,
                            borderColor: borderColor,
                            textPrimary: textPrimary,
                            textSecondary: textSecondary,
                          );
                        }),
                      ],
                    ),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildStageBanner(SubsidyItemModel? subsidy, bool isDark, Color textPrimary, Color textSecondary) {
    final info = subsidy?.stageInfo ?? SubsidyItemModel.stageMeta['registered']!;
    final color = info['color'] as Color;
    final label = info['label'] as String;
    final owner = info['owner'] as String;
    final days = info['expectedDays'] as int;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.15),
              shape: BoxShape.circle,
            ),
            child: Icon(Icons.bolt_rounded, color: color, size: 24),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(label, style: AppTypography.bodyMedium(color: color, fontWeight: FontWeight.w700)),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(4)),
                      child: Text("SLA: $days Days", style: const TextStyle(fontSize: 10, color: Colors.white, fontWeight: FontWeight.w700)),
                    ),
                  ],
                ),
                const SizedBox(height: 3),
                Text(
                  "Action Owner: $owner • National PM Surya Ghar Portal",
                  style: AppTypography.caption(color: textSecondary),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildApplicationDetails(
    SubsidyItemModel? subsidy,
    Color cardBg,
    Color borderColor,
    Color textPrimary,
    Color textSecondary,
  ) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: borderColor),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Expanded(
                child: _buildDetailPill(
                  "CONSUMER #",
                  subsidy?.consumerNumber ?? "Pending",
                  Icons.electric_meter_outlined,
                  textPrimary,
                  textSecondary,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _buildDetailPill(
                  "DISCOM",
                  subsidy?.discom ?? "JVVNL",
                  Icons.business_outlined,
                  textPrimary,
                  textSecondary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: _buildDetailPill(
                  "PLANT CAPACITY",
                  "${subsidy?.plantCapacity ?? 3.0} kW",
                  Icons.solar_power_outlined,
                  textPrimary,
                  textSecondary,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _buildDetailPill(
                  "CALCULATED SUBSIDY",
                  Formatters.formatCurrency(subsidy?.calculatedSubsidy ?? 78000.0),
                  Icons.currency_rupee_rounded,
                  AppColors.emeraldGreen,
                  textSecondary,
                ),
              ),
            ],
          ),
          if (subsidy?.portalAckNo != null && subsidy!.portalAckNo!.isNotEmpty) ...[
            const SizedBox(height: 10),
            _buildDetailPill(
              "PORTAL ACKNOWLEDGMENT #",
              subsidy.portalAckNo!,
              Icons.receipt_long_outlined,
              textPrimary,
              textSecondary,
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildDetailPill(String label, String value, IconData icon, Color textPrimary, Color textSecondary) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: Theme.of(context).brightness == Brightness.dark ? Colors.white10 : Colors.grey.shade50,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: AppTypography.badge(color: textSecondary)),
          const SizedBox(height: 2),
          Row(
            children: [
              Icon(icon, size: 14, color: AppColors.brandPrimary),
              const SizedBox(width: 4),
              Expanded(
                child: Text(
                  value,
                  style: AppTypography.bodySmall(color: textPrimary, fontWeight: FontWeight.w700),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildDocCard({
    required String type,
    required String label,
    required IconData icon,
    required Color color,
    required SubsidyDocumentModel? doc,
    required FinancingProvider provider,
    required bool isDark,
    required Color borderColor,
    required Color textPrimary,
    required Color textSecondary,
  }) {
    final bool isUploaded = doc != null && doc.fileUrl.isNotEmpty;
    final bool isVerified = doc?.verificationStatus == 'Verified';
    final bool isFlagged = doc?.verificationStatus == 'Rejected';

    Color statusColor = Colors.grey;
    String statusText = "Not Uploaded";
    if (isUploaded) {
      if (isVerified) {
        statusColor = AppColors.emeraldGreen;
        statusText = "Verified";
      } else if (isFlagged) {
        statusColor = AppColors.errorRed;
        statusText = "Flagged / Re-upload";
      } else {
        statusColor = AppColors.brandPrimary;
        statusText = "Pending Verification";
      }
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkSurface : Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isVerified ? AppColors.emeraldGreen.withValues(alpha: 0.4) : borderColor,
        ),
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
                child: Icon(icon, color: color, size: 18),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(label, style: AppTypography.bodySmall(color: textPrimary, fontWeight: FontWeight.w700)),
                    const SizedBox(height: 2),
                    Row(
                      children: [
                        Container(
                          width: 8,
                          height: 8,
                          decoration: BoxDecoration(color: statusColor, shape: BoxShape.circle),
                        ),
                        const SizedBox(width: 6),
                        Text(statusText, style: AppTypography.caption(color: statusColor, fontWeight: FontWeight.w600)),
                      ],
                    ),
                  ],
                ),
              ),
              // Upload Button with Camera & Gallery
              ElevatedButton.icon(
                onPressed: () => _showUploadSourcePicker(type, label),
                style: ElevatedButton.styleFrom(
                  backgroundColor: isUploaded ? (isDark ? Colors.white12 : Colors.grey.shade100) : AppColors.brandPrimary,
                  foregroundColor: isUploaded ? textPrimary : Colors.white,
                  elevation: 0,
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
                icon: Icon(isUploaded ? Icons.refresh_rounded : Icons.camera_alt_outlined, size: 14),
                label: Text(isUploaded ? "Replace" : "Upload", style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
              ),
            ],
          ),

          if (isUploaded) ...[
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                TextButton.icon(
                  onPressed: () {
                    final fullUrl = doc.getFullFileUrl(provider.baseApiUrl);
                    _showFullImageDialog(fullUrl, label);
                  },
                  icon: const Icon(Icons.visibility_outlined, size: 14),
                  label: const Text("View File", style: TextStyle(fontSize: 11)),
                ),
                const SizedBox(width: 8),
                if (!isVerified)
                  TextButton.icon(
                    onPressed: () async {
                      await provider.verifyDocument(
                        docId: doc.id,
                        leadId: widget.leadId,
                        status: 'Verified',
                      );
                    },
                    style: TextButton.styleFrom(foregroundColor: AppColors.emeraldGreen),
                    icon: const Icon(Icons.check_circle_outline_rounded, size: 14),
                    label: const Text("Mark Verified", style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700)),
                  ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}
