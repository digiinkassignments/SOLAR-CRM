import 'dart:io';
import 'package:flutter_test/flutter_test.dart';
import 'package:geolocator/geolocator.dart';
import 'package:solar_crm_app/core/utils/geo_camera_helper.dart';

void main() {
  group('GeoCameraHelper & Geotag Validation Tests', () {
    test('validatePosition accepts fresh and accurate location (age <= 90s, accuracy <= 100m)', () {
      final now = DateTime.now();
      final freshPos = Position(
        latitude: 26.8851,
        longitude: 75.7628,
        timestamp: now.subtract(const Duration(seconds: 15)),
        accuracy: 12.5,
        altitude: 400.0,
        altitudeAccuracy: 5.0,
        heading: 0.0,
        headingAccuracy: 0.0,
        speed: 0.0,
        speedAccuracy: 0.0,
      );

      final result = GeoCameraHelper.validatePosition(freshPos);

      expect(result.status, equals(LocationStatus.success));
      expect(result.isFreshAndAccurate, isTrue);
      expect(result.hasPosition, isTrue);
      expect(result.position?.latitude, equals(26.8851));
      expect(result.errorMessage, isNull);
    });

    test('validatePosition rejects stale location (> 90s old) and marks as stale/unverified', () {
      final now = DateTime.now();
      final stalePos = Position(
        latitude: 26.8851,
        longitude: 75.7628,
        timestamp: now.subtract(const Duration(minutes: 5)), // 5 mins old
        accuracy: 15.0,
        altitude: 400.0,
        altitudeAccuracy: 5.0,
        heading: 0.0,
        headingAccuracy: 0.0,
        speed: 0.0,
        speedAccuracy: 0.0,
      );

      final result = GeoCameraHelper.validatePosition(stalePos);

      expect(result.status, equals(LocationStatus.stale));
      expect(result.isFreshAndAccurate, isFalse);
      expect(result.hasPosition, isTrue);
      expect(result.errorMessage, contains('stale'));
    });

    test('validatePosition rejects inaccurate location (> 100m accuracy) and marks as inaccurate/unverified', () {
      final now = DateTime.now();
      final inaccuratePos = Position(
        latitude: 26.8851,
        longitude: 75.7628,
        timestamp: now.subtract(const Duration(seconds: 10)),
        accuracy: 250.0, // 250m accuracy is too poor for site geotagging
        altitude: 400.0,
        altitudeAccuracy: 5.0,
        heading: 0.0,
        headingAccuracy: 0.0,
        speed: 0.0,
        speedAccuracy: 0.0,
      );

      final result = GeoCameraHelper.validatePosition(inaccuratePos);

      expect(result.status, equals(LocationStatus.inaccurate));
      expect(result.isFreshAndAccurate, isFalse);
      expect(result.hasPosition, isTrue);
      expect(result.errorMessage, contains('accuracy is ±250m'));
    });

    test('validatePosition handles null position gracefully', () {
      final result = GeoCameraHelper.validatePosition(null);

      expect(result.status, equals(LocationStatus.error));
      expect(result.isFreshAndAccurate, isFalse);
      expect(result.hasPosition, isFalse);
      expect(result.errorMessage, contains('No GPS position acquired'));
    });

    test('formatCaptureTime produces date, time, and explicit timezone indicator', () {
      final testTime = DateTime(2026, 11, 20, 11, 45, 30);
      final formatted = GeoCameraHelper.formatCaptureTime(testTime);

      expect(formatted, contains('20 Nov 2026'));
      expect(formatted, contains('11:45:30'));
      expect(formatted, contains('UTC'));
    });

    test('WatermarkResult conveys structured status and does not pretend success on failure', () {
      final dummyFile = File('non_existent_photo.jpg');

      final failureResult = WatermarkResult(
        success: false,
        file: dummyFile,
        errorMessage: 'Image decoding failed: corrupt file',
        isGeoTagged: false,
        capturedAt: DateTime.now(),
      );

      expect(failureResult.success, isFalse);
      expect(failureResult.isGeoTagged, isFalse);
      expect(failureResult.errorMessage, equals('Image decoding failed: corrupt file'));

      final successResult = WatermarkResult(
        success: true,
        file: dummyFile,
        isGeoTagged: true,
        latitude: 26.8851,
        longitude: 75.7628,
        accuracyMeters: 8.0,
        capturedAt: DateTime.now(),
        formattedAddress: 'Jaipur, Rajasthan',
      );

      expect(successResult.success, isTrue);
      expect(successResult.isGeoTagged, isTrue);
      expect(successResult.latitude, equals(26.8851));
      expect(successResult.formattedAddress, equals('Jaipur, Rajasthan'));
      expect(successResult.errorMessage, isNull);
    });
  });
}
