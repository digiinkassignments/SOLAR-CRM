import 'dart:io';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:solar_crm_app/core/utils/platform_permission_helper.dart';

void main() {
  group('Platform Permissions & Degradation Suite', () {
    test('isPermissionDeniedError correctly identifies platform permission errors', () {
      // 1. Camera access denied on iOS/Android
      expect(
        PlatformPermissionHelper.isPermissionDeniedError(
          PlatformException(code: 'camera_access_denied', message: 'User denied camera access'),
        ),
        isTrue,
      );

      // 2. Photo library access denied
      expect(
        PlatformPermissionHelper.isPermissionDeniedError(
          PlatformException(code: 'photo_access_denied', message: 'Photo access was not authorized'),
        ),
        isTrue,
      );

      // 3. Location permission denied
      expect(
        PlatformPermissionHelper.isPermissionDeniedError(
          PlatformException(code: 'PERMISSION_DENIED', message: 'User denied access to location'),
        ),
        isTrue,
      );

      // 4. iOS restricted / not authorized
      expect(
        PlatformPermissionHelper.isPermissionDeniedError(
          PlatformException(code: 'not_authorized', message: 'User restricted access to resource'),
        ),
        isTrue,
      );

      // 5. String format exceptions for permanent denials
      expect(
        PlatformPermissionHelper.isPermissionDeniedError('Location permission is permanently denied in settings.'),
        isTrue,
      );

      // 6. Regular unhandled network or parsing exceptions should return false
      expect(
        PlatformPermissionHelper.isPermissionDeniedError(
          PlatformException(code: 'network_error', message: 'Failed host lookup: api.solarcrm.com'),
        ),
        isFalse,
      );
      expect(
        PlatformPermissionHelper.isPermissionDeniedError(const FormatException('Invalid JSON payload')),
        isFalse,
      );
    });

    test('AndroidManifest.xml contains all required camera, location and modern storage permissions', () {
      final manifestFile = File('android/app/src/main/AndroidManifest.xml');
      expect(manifestFile.existsSync(), isTrue, reason: 'AndroidManifest.xml must exist');

      final content = manifestFile.readAsStringSync();

      // Camera permissions & features
      expect(content, contains('android.permission.CAMERA'));
      expect(content, contains('android.hardware.camera'));

      // Location permissions
      expect(content, contains('android.permission.ACCESS_FINE_LOCATION'));
      expect(content, contains('android.permission.ACCESS_COARSE_LOCATION'));

      // Storage permissions (Android 12 legacy + Android 13+ modern)
      expect(content, contains('android.permission.READ_EXTERNAL_STORAGE'));
      expect(content, contains('android.permission.READ_MEDIA_IMAGES'));
    });

    test('Info.plist contains required iOS usage descriptions and navigation schemes to prevent runtime crashes', () {
      final infoPlistFile = File('ios/Runner/Info.plist');
      expect(infoPlistFile.existsSync(), isTrue, reason: 'Info.plist must exist');

      final content = infoPlistFile.readAsStringSync();

      // Camera usage description
      expect(content, contains('<key>NSCameraUsageDescription</key>'));
      expect(content, contains('Solar CRM requires camera access'));

      // Photo library usage description
      expect(content, contains('<key>NSPhotoLibraryUsageDescription</key>'));
      expect(content, contains('Solar CRM requires access to your photo library'));

      // Location usage descriptions (when in use and always)
      expect(content, contains('<key>NSLocationWhenInUseUsageDescription</key>'));
      expect(content, contains('<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>'));
      expect(content, contains('Solar CRM requires your location'));

      // Application queries schemes (WhatsApp, telephone, https)
      expect(content, contains('<key>LSApplicationQueriesSchemes</key>'));
      expect(content, contains('<string>whatsapp</string>'));
      expect(content, contains('<string>tel</string>'));
      expect(content, contains('<string>https</string>'));
    });
  });
}
