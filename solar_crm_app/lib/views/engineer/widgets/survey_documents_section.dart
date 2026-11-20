import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_typography.dart';
import '../../../core/utils/platform_permission_helper.dart';
import '../../../models/survey_model.dart';
import '../../../providers/survey_provider.dart';

class SurveyDocumentsSection extends StatefulWidget {
  final SurveyModel survey;
  final bool isEmbedded;

  const SurveyDocumentsSection({
    super.key,
    required this.survey,
    this.isEmbedded = false,
  });

  @override
  State<SurveyDocumentsSection> createState() => _SurveyDocumentsSectionState();
}

class _SurveyDocumentsSectionState extends State<SurveyDocumentsSection> {
  final ImagePicker _picker = ImagePicker();
  String? _lastFailedCategory;
  List<String> _pendingRetryPaths = [];

  static const List<Map<String, dynamic>> _categories = [
    {
      'key': 'aadhaar',
      'title': 'Aadhaar Card',
      'hint': 'Customer identity verification document',
      'icon': Icons.badge_outlined,
      'color': AppColors.skyBlue,
    },
    {
      'key': 'electricity_bill',
      'title': 'Electricity Bill',
      'hint': 'Consumer number & sanctioned load proof',
      'icon': Icons.electric_bolt_rounded,
      'color': AppColors.solarGold,
    },
    {
      'key': 'site_photo',
      'title': 'Site & Roof Photos',
      'hint': 'Roof area, meter box & shadow condition views',
      'icon': Icons.add_a_photo_outlined,
      'color': AppColors.emeraldGreen,
    },
    {
      'key': 'bank_passbook',
      'title': 'Bank Passbook / Cheque',
      'hint': 'Account holder & IFSC verification document',
      'icon': Icons.account_balance_outlined,
      'color': Colors.deepPurpleAccent,
    },
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<SurveyProvider>(context, listen: false).fetchSurveyDocuments(widget.survey.id);
    });
  }

  Future<void> _handleUpload(String category) async {
    final isSitePhoto = category == 'site_photo';

    final source = await showModalBottomSheet<String>(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        final isDark = Theme.of(ctx).brightness == Brightness.dark;
        final bg = isDark ? AppColors.darkCard : AppColors.lightCard;
        final txt = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;

        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
          decoration: BoxDecoration(
            color: bg,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                "Upload Document / Photo",
                style: AppTypography.headingSmall(color: txt),
              ),
              const SizedBox(height: 6),
              Text(
                "Choose photo from device gallery or capture on-site. JPG, PNG or WebP up to 8 MB.",
                style: AppTypography.caption(),
              ),
              const SizedBox(height: 16),
              ListTile(
                leading: const Icon(Icons.photo_library_outlined, color: AppColors.emeraldGreen),
                title: Text(isSitePhoto ? "Choose from Gallery (Multiple)" : "Choose from Gallery", style: AppTypography.body(color: txt)),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                onTap: () => Navigator.pop(ctx, isSitePhoto ? 'gallery_multi' : 'gallery_single'),
              ),
              ListTile(
                leading: const Icon(Icons.camera_alt_outlined, color: AppColors.skyBlue),
                title: Text("Take Photo with Camera", style: AppTypography.body(color: txt)),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                onTap: () => Navigator.pop(ctx, 'camera'),
              ),
            ],
          ),
        );
      },
    );

    if (source == null) return;

    List<String> filePaths = [];
    try {
      if (source == 'gallery_multi') {
        final picked = await _picker.pickMultiImage();
        filePaths = picked.map((e) => e.path).toList();
      } else if (source == 'gallery_single') {
        final picked = await _picker.pickImage(source: ImageSource.gallery);
        if (picked != null) filePaths = [picked.path];
      } else if (source == 'camera') {
        final picked = await _picker.pickImage(source: ImageSource.camera);
        if (picked != null) filePaths = [picked.path];
      }
    } catch (e) {
      if (PlatformPermissionHelper.isPermissionDeniedError(e)) {
        if (mounted) {
          PlatformPermissionHelper.showPermissionDialog(
            context,
            type: source == 'camera'
                ? PlatformPermissionType.camera
                : PlatformPermissionType.photos,
          );
        }
      } else if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("Could not open media: $e"), backgroundColor: AppColors.errorRed),
        );
      }
      return;
    }

    if (filePaths.isEmpty) return;
    await _executeUploadBatch(category, filePaths);
  }

  Future<void> _executeUploadBatch(String category, List<String> paths) async {
    final provider = Provider.of<SurveyProvider>(context, listen: false);
    final remaining = List<String>.from(paths);

    for (final path in paths) {
      final res = await provider.uploadSurveyDocument(
        surveyId: widget.survey.id,
        category: category,
        filePath: path,
      );

      if (res['success'] == true) {
        remaining.remove(path);
      } else {
        setState(() {
          _lastFailedCategory = category;
          _pendingRetryPaths = remaining;
        });
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(res['message'] ?? "Upload failed. Saved files remain attached; retry the remaining files."),
              backgroundColor: AppColors.errorRed,
              action: SnackBarAction(
                label: "Retry",
                textColor: Colors.white,
                onPressed: () => _executeUploadBatch(category, _pendingRetryPaths),
              ),
            ),
          );
        }
        return;
      }
    }

    setState(() {
      _lastFailedCategory = null;
      _pendingRetryPaths = [];
    });

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("Document saved and attached to survey!"),
          backgroundColor: AppColors.emeraldGreen,
        ),
      );
    }
  }

  void _previewDocument(SurveyDocumentModel doc) {
    showDialog(
      context: context,
      builder: (ctx) {
        return Dialog(
          backgroundColor: Colors.transparent,
          insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Align(
                alignment: Alignment.topRight,
                child: IconButton(
                  icon: const Icon(Icons.close_rounded, color: Colors.white, size: 26),
                  onPressed: () => Navigator.pop(ctx),
                ),
              ),
              ClipRRect(
                borderRadius: BorderRadius.circular(14),
                child: Container(
                  color: Colors.black,
                  constraints: BoxConstraints(
                    maxHeight: MediaQuery.of(context).size.height * 0.72,
                    minHeight: 180,
                    minWidth: double.infinity,
                  ),
                  child: FutureBuilder<Uint8List?>(
                    future: Provider.of<SurveyProvider>(context, listen: false)
                        .fetchDocumentBytes(widget.survey.id, doc.id),
                    builder: (context, snapshot) {
                      if (snapshot.connectionState == ConnectionState.waiting) {
                        return const Center(
                          child: Padding(
                            padding: EdgeInsets.all(40.0),
                            child: CircularProgressIndicator(color: AppColors.emeraldGreen),
                          ),
                        );
                      }
                      if (snapshot.hasError || snapshot.data == null) {
                        return Center(
                          child: Padding(
                            padding: const EdgeInsets.all(24.0),
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(Icons.broken_image_rounded, color: Colors.white54, size: 48),
                                const SizedBox(height: 10),
                                Text(
                                  "Could not preview this document.\nOriginal file is safely preserved on server.",
                                  style: AppTypography.body(color: Colors.white70),
                                  textAlign: TextAlign.center,
                                ),
                              ],
                            ),
                          ),
                        );
                      }
                      return InteractiveViewer(
                        panEnabled: true,
                        boundaryMargin: const EdgeInsets.all(20),
                        minScale: 0.8,
                        maxScale: 4.0,
                        child: Image.memory(
                          snapshot.data!,
                          fit: BoxFit.contain,
                        ),
                      );
                    },
                  ),
                ),
              ),
              const SizedBox(height: 10),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.6),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  "${doc.originalName} (${doc.formattedSize})",
                  style: const TextStyle(color: Colors.white, fontSize: 12),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textPrimary = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final textSecondary = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;
    final cardBg = isDark ? AppColors.darkCard : AppColors.lightCard;
    final borderColor = isDark ? AppColors.darkBorder : AppColors.lightBorder;
    final surfaceColor = isDark ? AppColors.darkSurface : AppColors.lightSurface;

    final provider = Provider.of<SurveyProvider>(context);
    final docs = provider.activeDocuments;
    final isUploading = provider.uploadingCategory != null;

    return Container(
      padding: EdgeInsets.all(widget.isEmbedded ? 0 : 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Section Header
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: AppColors.emeraldGreen.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.folder_shared_outlined, size: 18, color: AppColors.emeraldGreen),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  "SURVEY DOCUMENTS & PHOTOS",
                  style: AppTypography.badge(color: AppColors.emeraldGreen),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: AppColors.emeraldGreen.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(color: AppColors.emeraldGreen.withValues(alpha: 0.3)),
                ),
                child: Text(
                  "${docs.length} attached",
                  style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.emeraldGreen),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            "Upload photos from your gallery or camera. Aadhaar, electricity bill, site photos and bank passbook are saved immediately to this survey without compulsory geo-tagging.",
            style: AppTypography.caption(color: textSecondary),
          ),
          const SizedBox(height: 12),

          // Upload Failure Banner with Retry
          if (provider.documentErrorMessage != null) ...[
            Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.errorRed.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: AppColors.errorRed.withValues(alpha: 0.4)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.error_outline_rounded, color: AppColors.errorRed, size: 20),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      provider.documentErrorMessage!,
                      style: AppTypography.caption(color: AppColors.errorRed),
                    ),
                  ),
                  if (_pendingRetryPaths.isNotEmpty && _lastFailedCategory != null)
                    TextButton(
                      onPressed: isUploading
                          ? null
                          : () => _executeUploadBatch(_lastFailedCategory!, _pendingRetryPaths),
                      style: TextButton.styleFrom(
                        visualDensity: VisualDensity.compact,
                        foregroundColor: AppColors.errorRed,
                      ),
                      child: const Text("Retry", style: TextStyle(fontWeight: FontWeight.bold)),
                    ),
                ],
              ),
            ),
          ],

          if (provider.isLoadingDocuments && docs.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 20.0),
              child: Center(
                child: CircularProgressIndicator(color: AppColors.emeraldGreen, strokeWidth: 2),
              ),
            )
          else
            // 4 Category Cards
            Column(
              children: _categories.map((cat) {
                final key = cat['key'] as String;
                final title = cat['title'] as String;
                final hint = cat['hint'] as String;
                final icon = cat['icon'] as IconData;
                final color = cat['color'] as Color;

                final categoryDocs = docs.where((d) => d.category == key).toList();
                final isCategoryUploading = provider.uploadingCategory == key;

                return Container(
                  margin: const EdgeInsets.only(bottom: 10),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: surfaceColor,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: borderColor),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Header of category
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(6),
                            decoration: BoxDecoration(
                              color: color.withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Icon(icon, size: 16, color: color),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  title,
                                  style: AppTypography.bodySmall(color: textPrimary).copyWith(fontWeight: FontWeight.w700),
                                ),
                                Text(
                                  hint,
                                  style: AppTypography.caption(color: textSecondary).copyWith(fontSize: 10),
                                ),
                              ],
                            ),
                          ),
                          OutlinedButton.icon(
                            onPressed: isUploading ? null : () => _handleUpload(key),
                            icon: isCategoryUploading
                                ? const SizedBox(
                                    width: 12,
                                    height: 12,
                                    child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.emeraldGreen),
                                  )
                                : const Icon(Icons.upload_file_rounded, size: 14),
                            label: Text(
                              isCategoryUploading ? "Saving..." : "Upload",
                              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700),
                            ),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: color,
                              side: BorderSide(color: color.withValues(alpha: 0.5)),
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              visualDensity: VisualDensity.compact,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                            ),
                          ),
                        ],
                      ),

                      // List of attached files in this category
                      if (categoryDocs.isNotEmpty) ...[
                        const SizedBox(height: 8),
                        ...categoryDocs.map((doc) {
                          return Container(
                            margin: const EdgeInsets.only(top: 6),
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                            decoration: BoxDecoration(
                              color: cardBg,
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: borderColor.withValues(alpha: 0.6)),
                            ),
                            child: Row(
                              children: [
                                Icon(
                                  doc.isImage ? Icons.image_rounded : Icons.description_rounded,
                                  size: 16,
                                  color: color,
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        doc.originalName,
                                        style: AppTypography.caption(color: textPrimary).copyWith(fontWeight: FontWeight.w600),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                      Text(
                                        doc.formattedSize,
                                        style: AppTypography.caption(color: textSecondary).copyWith(fontSize: 9.5),
                                      ),
                                    ],
                                  ),
                                ),
                                IconButton(
                                  icon: const Icon(Icons.visibility_outlined, size: 16, color: AppColors.emeraldGreen),
                                  tooltip: "Preview document",
                                  padding: EdgeInsets.zero,
                                  constraints: const BoxConstraints(),
                                  onPressed: () => _previewDocument(doc),
                                ),
                              ],
                            ),
                          );
                        }),
                      ],
                    ],
                  ),
                );
              }).toList(),
            ),
        ],
      ),
    );
  }
}
