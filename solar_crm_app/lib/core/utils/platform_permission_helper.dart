import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:geolocator/geolocator.dart';
import 'package:image_picker/image_picker.dart';
import '../constants/app_colors.dart';
import '../constants/app_typography.dart';

enum PlatformPermissionType {
  camera,
  location,
  photos,
}

/// Helper class to handle platform permission checks, graceful degradation,
/// user guidance dialogs, and navigation to device settings without crashing.
class PlatformPermissionHelper {
  /// Checks whether an exception indicates a platform permission denial
  static bool isPermissionDeniedError(Object error) {
    if (error is PlatformException) {
      final code = error.code.toLowerCase();
      final msg = (error.message ?? '').toLowerCase();
      return code.contains('access_denied') ||
          code.contains('permission') ||
          msg.contains('permission') ||
          msg.contains('denied') ||
          msg.contains('restricted') ||
          msg.contains('not authorized');
    }
    final str = error.toString().toLowerCase();
    return str.contains('permission') && (str.contains('denied') || str.contains('permanently'));
  }

  /// Safely open device App Settings
  static Future<bool> openAppSettings() async {
    try {
      return await Geolocator.openAppSettings();
    } catch (e) {
      debugPrint("PlatformPermissionHelper: Unable to open app settings: $e");
      return false;
    }
  }

  /// Safely open device Location / GPS Settings
  static Future<bool> openLocationSettings() async {
    try {
      return await Geolocator.openLocationSettings();
    } catch (e) {
      debugPrint("PlatformPermissionHelper: Unable to open location settings: $e");
      return false;
    }
  }

  /// Displays a friendly permission dialog with Open Settings and Retry options
  static Future<bool?> showPermissionDialog(
    BuildContext context, {
    required PlatformPermissionType type,
    String? customTitle,
    String? customMessage,
    VoidCallback? onRetry,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? const Color(0xFF1E1E1E) : Colors.white;
    final textPrimary = isDark ? Colors.white : const Color(0xFF0F172A);
    final textSecondary = isDark ? const Color(0xFF94A3B8) : const Color(0xFF475569);

    IconData icon;
    String defaultTitle;
    String defaultMessage;

    switch (type) {
      case PlatformPermissionType.camera:
        icon = Icons.camera_alt_outlined;
        defaultTitle = "Camera Permission Required";
        defaultMessage =
            "Camera access is needed to capture site photos, progress logs, and scan equipment barcodes. Please grant permission in App Settings.";
        break;
      case PlatformPermissionType.location:
        icon = Icons.location_on_outlined;
        defaultTitle = "Location Permission Required";
        defaultMessage =
            "Location access is needed to verify site coordinates and watermark GPS metadata onto installation records. Please grant permission in App Settings.";
        break;
      case PlatformPermissionType.photos:
        icon = Icons.photo_library_outlined;
        defaultTitle = "Photo Library Access Required";
        defaultMessage =
            "Photo library access is needed to select and upload survey documents, customer bills, and project media. Please grant permission in App Settings.";
        break;
    }

    final title = customTitle ?? defaultTitle;
    final message = customMessage ?? defaultMessage;

    return showDialog<bool>(
      context: context,
      barrierDismissible: true,
      builder: (dialogCtx) => AlertDialog(
        backgroundColor: cardBg,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        titlePadding: const EdgeInsets.fromLTRB(20, 20, 20, 10),
        contentPadding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppColors.solarGold.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, color: AppColors.solarGold, size: 22),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                title,
                style: AppTypography.headingSmall(
                  color: textPrimary,
                ),
              ),
            ),
          ],
        ),
        content: Text(
          message,
          style: AppTypography.bodySmall(
            color: textSecondary,
          ),
        ),
        actionsPadding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogCtx).pop(false),
            child: Text(
              "Cancel",
              style: TextStyle(color: textSecondary, fontWeight: FontWeight.w600),
            ),
          ),
          if (onRetry != null)
            TextButton(
              onPressed: () {
                Navigator.of(dialogCtx).pop(null);
                onRetry();
              },
              child: const Text(
                "Retry",
                style: TextStyle(color: AppColors.skyBlue, fontWeight: FontWeight.w600),
              ),
            ),
          ElevatedButton(
            onPressed: () async {
              Navigator.of(dialogCtx).pop(true);
              await openAppSettings();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.solarGold,
              foregroundColor: Colors.black,
              elevation: 0,
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            child: const Text(
              "Open Settings",
              style: TextStyle(fontWeight: FontWeight.w700),
            ),
          ),
        ],
      ),
    );
  }

  /// Displays a SnackBar with an 'Open Settings' action button
  static void showPermissionSnackBar(
    BuildContext context, {
    required String message,
    VoidCallback? onRetry,
  }) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: AppColors.errorRed,
        duration: const Duration(seconds: 4),
        action: SnackBarAction(
          label: 'Settings',
          textColor: AppColors.solarGold,
          onPressed: () {
            openAppSettings();
          },
        ),
      ),
    );
  }

  /// Safe wrapper around [ImagePicker.pickImage] that catches permission denials,
  /// displays the guidance dialog, and prevents unhandled platform exceptions.
  static Future<XFile?> safePickImage({
    required BuildContext context,
    required ImagePicker picker,
    required ImageSource source,
    double? maxWidth,
    double? maxHeight,
    int? imageQuality,
    CameraDevice preferredCameraDevice = CameraDevice.rear,
  }) async {
    try {
      return await picker.pickImage(
        source: source,
        maxWidth: maxWidth,
        maxHeight: maxHeight,
        imageQuality: imageQuality,
        preferredCameraDevice: preferredCameraDevice,
      );
    } catch (e) {
      debugPrint("PlatformPermissionHelper.safePickImage error: $e");
      if (isPermissionDeniedError(e) && context.mounted) {
        final permType = source == ImageSource.camera
            ? PlatformPermissionType.camera
            : PlatformPermissionType.photos;
        await showPermissionDialog(context, type: permType);
      } else if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text("Unable to open media: $e"),
            backgroundColor: AppColors.errorRed,
          ),
        );
      }
      return null;
    }
  }

  /// Safe wrapper around [ImagePicker.pickMultiImage] that catches permission denials,
  /// displays the guidance dialog, and prevents unhandled platform exceptions.
  static Future<List<XFile>> safePickMultiImage({
    required BuildContext context,
    required ImagePicker picker,
    double? maxWidth,
    double? maxHeight,
    int? imageQuality,
  }) async {
    try {
      return await picker.pickMultiImage(
        maxWidth: maxWidth,
        maxHeight: maxHeight,
        imageQuality: imageQuality,
      );
    } catch (e) {
      debugPrint("PlatformPermissionHelper.safePickMultiImage error: $e");
      if (isPermissionDeniedError(e) && context.mounted) {
        await showPermissionDialog(context, type: PlatformPermissionType.photos);
      } else if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text("Unable to open photo library: $e"),
            backgroundColor: AppColors.errorRed,
          ),
        );
      }
      return const [];
    }
  }
}
