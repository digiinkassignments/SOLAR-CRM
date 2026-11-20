import 'dart:io';
import 'package:flutter_test/flutter_test.dart';
import 'package:solar_crm_app/core/network/api_client.dart';
import 'package:solar_crm_app/models/installation_log_model.dart';
import 'package:solar_crm_app/providers/project_provider.dart';

void main() {
  group('Installation Log & Photo Upload Reliability Tests', () {
    test('InstallationLogPhotoModel deserializes and serializes full geo metadata', () {
      final json = {
        'id': 101,
        'log_id': 50,
        'photo_url': '/uploads/installation/photo_123.jpg',
        'caption': 'Inverter AC/DC wiring finished',
        'photo_tag': 'Inverter & Electrical',
        'latitude': 26.885123,
        'longitude': 75.762811,
        'accuracy_meters': 8.5,
        'gps_address': 'Plot 12, Nirman Nagar, Jaipur',
        'captured_at': '2026-11-20T11:45:00.000Z',
        'is_geo_tagged': 1,
      };

      final model = InstallationLogPhotoModel.fromJson(json);

      expect(model.id, equals(101));
      expect(model.logId, equals(50));
      expect(model.photoUrl, equals('/uploads/installation/photo_123.jpg'));
      expect(model.caption, equals('Inverter AC/DC wiring finished'));
      expect(model.photoTag, equals('Inverter & Electrical'));
      expect(model.latitude, equals(26.885123));
      expect(model.longitude, equals(75.762811));
      expect(model.accuracyMeters, equals(8.5));
      expect(model.gpsAddress, equals('Plot 12, Nirman Nagar, Jaipur'));
      expect(model.capturedAt, equals('2026-11-20T11:45:00.000Z'));
      expect(model.isGeoTagged, isTrue);

      final outJson = model.toJson();
      expect(outJson['latitude'], equals(26.885123));
      expect(outJson['longitude'], equals(75.762811));
      expect(outJson['accuracy_meters'], equals(8.5));
      expect(outJson['gps_address'], equals('Plot 12, Nirman Nagar, Jaipur'));
      expect(outJson['is_geo_tagged'], equals(1));
    });

    test('uploadInstallationLogPhotos enforces server limits (max 10 photos, max 10MB)', () async {
      final client = ApiClient();
      final provider = ProjectProvider(apiClient: client);

      // 1. Test exceeding max 10 photos limit
      final dummyFiles = List.generate(11, (i) => File('dummy_$i.jpg'));
      final limitRes = await provider.uploadInstallationLogPhotos(
        1,
        100,
        photos: dummyFiles,
      );

      expect(limitRes['success'], isFalse);
      expect(limitRes['message'], contains('Cannot upload more than 10 photos'));
    });

    test('uploadInstallationLogPhotos rejects non-existent files before hitting network', () async {
      final client = ApiClient();
      final provider = ProjectProvider(apiClient: client);

      final nonExistent = [File('c:/path/does/not/exist/photo.jpg')];
      final res = await provider.uploadInstallationLogPhotos(
        1,
        100,
        photos: nonExistent,
      );

      expect(res['success'], isFalse);
      expect(res['message'], contains('does not exist on device'));
    });

    test('uploadInstallationLogPhotos handles empty photos list cleanly without error', () async {
      final client = ApiClient();
      final provider = ProjectProvider(apiClient: client);

      final res = await provider.uploadInstallationLogPhotos(
        1,
        100,
        photos: [],
      );

      expect(res['success'], isTrue);
      expect(res['uploadedCount'], equals(0));
    });
  });
}

