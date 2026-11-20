import 'dart:io';
import 'dart:math';
import 'dart:typed_data';
import 'dart:ui' as ui;
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:geocoding/geocoding.dart';
import 'package:geolocator/geolocator.dart';
import 'package:intl/intl.dart';

/// Status of GPS acquisition and verification
enum LocationStatus {
  success,
  serviceDisabled,
  permissionDenied,
  permissionDeniedForever,
  timeout,
  stale,
  inaccurate,
  error,
}

/// Structured outcome of a location acquisition request
class LocationResult {
  final Position? position;
  final LocationStatus status;
  final String? errorMessage;
  final bool isFreshAndAccurate;
  final int? ageSeconds;

  const LocationResult({
    this.position,
    required this.status,
    this.errorMessage,
    this.isFreshAndAccurate = false,
    this.ageSeconds,
  });

  bool get hasPosition => position != null;

  @override
  String toString() =>
      'LocationResult(status: $status, isFreshAndAccurate: $isFreshAndAccurate, ageSeconds: $ageSeconds, err: $errorMessage)';
}

/// Structured result of watermark application
class WatermarkResult {
  final bool success;
  final File file;
  final String? errorMessage;
  final bool isGeoTagged;
  final double? latitude;
  final double? longitude;
  final double? accuracyMeters;
  final DateTime? capturedAt;
  final String? formattedAddress;

  const WatermarkResult({
    required this.success,
    required this.file,
    this.errorMessage,
    required this.isGeoTagged,
    this.latitude,
    this.longitude,
    this.accuracyMeters,
    this.capturedAt,
    this.formattedAddress,
  });

  @override
  String toString() =>
      'WatermarkResult(success: $success, isGeoTagged: $isGeoTagged, err: $errorMessage, file: ${file.path})';
}

class GeoCameraHelper {
  /// Validate whether a position is fresh and sufficiently accurate for site verification
  static LocationResult validatePosition(
    Position? position, {
    int maxAgeSeconds = 90,
    double maxAccuracyMeters = 100.0,
  }) {
    if (position == null) {
      return const LocationResult(
        status: LocationStatus.error,
        errorMessage: "No GPS position acquired.",
        isFreshAndAccurate: false,
      );
    }

    final age = DateTime.now().difference(position.timestamp).inSeconds;
    if (age > maxAgeSeconds) {
      return LocationResult(
        position: position,
        status: LocationStatus.stale,
        errorMessage: "GPS location is stale ($age seconds old). Fresh satellite lock required.",
        isFreshAndAccurate: false,
        ageSeconds: age,
      );
    }

    if (position.accuracy > maxAccuracyMeters) {
      return LocationResult(
        position: position,
        status: LocationStatus.inaccurate,
        errorMessage:
            "GPS accuracy is ±${position.accuracy.toInt()}m (must be within ±${maxAccuracyMeters.toInt()}m).",
        isFreshAndAccurate: false,
        ageSeconds: age,
      );
    }

    return LocationResult(
      position: position,
      status: LocationStatus.success,
      isFreshAndAccurate: true,
      ageSeconds: age,
    );
  }

  /// Format capture time with explicit timezone offset / name
  static String formatCaptureTime(DateTime dateTime) {
    final tzOffset = dateTime.timeZoneOffset;
    final sign = tzOffset.isNegative ? '-' : '+';
    final tzHours = tzOffset.inHours.abs().toString().padLeft(2, '0');
    final tzMins = (tzOffset.inMinutes.abs() % 60).toString().padLeft(2, '0');
    final offsetStr = "UTC$sign$tzHours:$tzMins";
    final tzName = dateTime.timeZoneName;
    final tzLabel = (tzName.isNotEmpty && tzName.length <= 5)
        ? "$tzName, $offsetStr"
        : offsetStr;
    final formattedDate = DateFormat("dd MMM yyyy, hh:mm:ss a").format(dateTime);
    return "$formattedDate ($tzLabel)";
  }

  /// Request verified, fresh GPS location around camera capture time
  static Future<LocationResult> getVerifiedLocation({
    Duration timeout = const Duration(seconds: 8),
    int maxAgeSeconds = 90,
    double maxAccuracyMeters = 100.0,
  }) async {
    try {
      final serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        return const LocationResult(
          status: LocationStatus.serviceDisabled,
          errorMessage: "Location services (GPS) are turned off on your device.",
          isFreshAndAccurate: false,
        );
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          return const LocationResult(
            status: LocationStatus.permissionDenied,
            errorMessage: "Location permission was denied.",
            isFreshAndAccurate: false,
          );
        }
      }

      if (permission == LocationPermission.deniedForever) {
        return const LocationResult(
          status: LocationStatus.permissionDeniedForever,
          errorMessage: "Location permission is permanently denied in settings.",
          isFreshAndAccurate: false,
        );
      }

      // Fetch fresh position with high accuracy
      Position? freshPos;
      try {
        freshPos = await Geolocator.getCurrentPosition(
          locationSettings: LocationSettings(
            accuracy: LocationAccuracy.high,
            timeLimit: timeout,
          ),
        );
      } catch (e) {
        debugPrint("Fresh GPS acquisition timed out or failed: $e");
      }

      if (freshPos != null) {
        return validatePosition(
          freshPos,
          maxAgeSeconds: maxAgeSeconds,
          maxAccuracyMeters: maxAccuracyMeters,
        );
      }

      // If fresh position timed out, check last known position
      Position? lastKnown;
      try {
        lastKnown = await Geolocator.getLastKnownPosition();
      } catch (_) {}

      if (lastKnown != null) {
        final validated = validatePosition(
          lastKnown,
          maxAgeSeconds: maxAgeSeconds,
          maxAccuracyMeters: maxAccuracyMeters,
        );
        if (validated.isFreshAndAccurate) {
          return validated;
        } else {
          return LocationResult(
            position: lastKnown,
            status: validated.status == LocationStatus.inaccurate
                ? LocationStatus.inaccurate
                : LocationStatus.stale,
            errorMessage: validated.errorMessage ?? "Cached GPS lock is not fresh.",
            isFreshAndAccurate: false,
            ageSeconds: validated.ageSeconds,
          );
        }
      }

      return const LocationResult(
        status: LocationStatus.timeout,
        errorMessage: "GPS satellite lock timed out. Please check signal or move outdoors.",
        isFreshAndAccurate: false,
      );
    } catch (e) {
      debugPrint("GeoCameraHelper.getVerifiedLocation exception: $e");
      return LocationResult(
        status: LocationStatus.error,
        errorMessage: "Error acquiring location: $e",
        isFreshAndAccurate: false,
      );
    }
  }

  /// Request GPS position safely for general callers (fresh lock, no 30m stale fallback)
  static Future<Position?> getCurrentPosition({int maxAgeSeconds = 60}) async {
    try {
      final loc = await getVerifiedLocation(maxAgeSeconds: maxAgeSeconds);
      if (loc.isFreshAndAccurate && loc.position != null) {
        return loc.position;
      }
      return loc.position;
    } catch (_) {
      return null;
    }
  }

  /// Reverse geocode coordinates to clean, human-readable address like Swiggy / Google Maps
  static Future<String?> reverseGeocode(double lat, double lon) async {
    // 1. Primary: Native Google Geocoder via Android/iOS Geocoder API
    try {
      final geocoding = Geocoding();
      final placemarks = await geocoding.placemarkFromCoordinates(lat, lon);
      if (placemarks.isNotEmpty) {
        final p = placemarks.first;
        final parts = <String>[];

        final street = p.street?.trim();
        final name = p.name?.trim();
        final subThoroughfare = p.subThoroughfare?.trim();
        final thoroughfare = p.thoroughfare?.trim();

        if (street != null &&
            street.isNotEmpty &&
            street != p.locality &&
            street != p.subLocality) {
          parts.add(street);
        } else if (name != null &&
            name.isNotEmpty &&
            name != p.locality &&
            name != p.subLocality) {
          parts.add(name);
        }

        if (thoroughfare != null &&
            thoroughfare.isNotEmpty &&
            !parts.contains(thoroughfare) &&
            thoroughfare != p.locality) {
          if (subThoroughfare != null &&
              subThoroughfare.isNotEmpty &&
              !parts.contains(subThoroughfare)) {
            parts.add("$subThoroughfare $thoroughfare");
          } else {
            parts.add(thoroughfare);
          }
        }

        final subLoc = p.subLocality?.trim();
        if (subLoc != null && subLoc.isNotEmpty && !parts.contains(subLoc)) {
          parts.add(subLoc);
        }

        final loc = p.locality?.trim();
        if (loc != null && loc.isNotEmpty) {
          final cleanCity = loc
              .replaceAll(
                RegExp(r'\s*(Municipal Corporation|Tehsil|District)\s*', caseSensitive: false),
                '',
              )
              .trim();
          if (cleanCity.isNotEmpty && !parts.contains(cleanCity)) {
            parts.add(cleanCity);
          }
        }

        final state = p.administrativeArea?.trim();
        final pin = p.postalCode?.trim();
        if (state != null && state.isNotEmpty) {
          if (pin != null && pin.isNotEmpty) {
            parts.add("$state $pin");
          } else {
            parts.add(state);
          }
        } else if (pin != null && pin.isNotEmpty) {
          parts.add(pin);
        }

        if (parts.isNotEmpty) {
          return parts.join(', ');
        }
      }
    } catch (e) {
      debugPrint("Native geocoding error: $e");
    }

    // 2. Fallback: OpenStreetMap Nominatim with clean formatting
    try {
      final dio = Dio(
        BaseOptions(
          connectTimeout: const Duration(milliseconds: 2500),
          receiveTimeout: const Duration(milliseconds: 2500),
          headers: {
            'User-Agent': 'SolOps-SolarCRM/1.0 (support@solops.cloud)',
            'Accept': 'application/json',
          },
        ),
      );

      final res = await dio.get(
        'https://nominatim.openstreetmap.org/reverse',
        queryParameters: {
          'lat': lat,
          'lon': lon,
          'format': 'json',
          'addressdetails': '1',
        },
      );

      if (res.statusCode == 200 && res.data != null) {
        final data = res.data;
        if (data is Map) {
          final addr = data['address'] as Map?;
          if (addr != null) {
            final parts = <String>[];
            final road = addr['road'] ?? addr['street'] ?? addr['house_number'];
            final colony =
                addr['neighbourhood'] ?? addr['suburb'] ?? addr['quarter'] ?? addr['residential'];
            final rawCity = addr['city'] ?? addr['town'] ?? addr['village'] ?? addr['county'];
            final state = addr['state']?.toString().trim();
            final postcode = addr['postcode']?.toString().trim();

            if (road != null && road.toString().trim().isNotEmpty) {
              parts.add(road.toString().trim());
            }
            if (colony != null &&
                colony.toString().trim().isNotEmpty &&
                !parts.contains(colony.toString().trim())) {
              parts.add(colony.toString().trim());
            }
            if (rawCity != null) {
              final cleanCity = rawCity
                  .toString()
                  .replaceAll(
                    RegExp(r'\s*(Municipal Corporation|Tehsil|District)\s*', caseSensitive: false),
                    '',
                  )
                  .trim();
              if (cleanCity.isNotEmpty && !parts.contains(cleanCity)) {
                parts.add(cleanCity);
              }
            }
            if (state != null && state.isNotEmpty) {
              if (postcode != null && postcode.isNotEmpty) {
                parts.add("$state $postcode");
              } else {
                parts.add(state);
              }
            } else if (postcode != null && postcode.isNotEmpty) {
              parts.add(postcode);
            }

            if (parts.isNotEmpty) {
              return parts.join(', ');
            }
          }
        }
      }
    } catch (_) {}

    return null;
  }

  /// Fetch mini map tile image for coordinates
  static Future<ui.Image?> fetchMapTile(double lat, double lon) async {
    try {
      const int zoom = 16;
      final int tileX = ((lon + 180.0) / 360.0 * (1 << zoom)).floor();
      final double latRad = lat * pi / 180.0;
      final int tileY =
          ((1.0 - log(tan(latRad) + 1.0 / cos(latRad)) / pi) / 2.0 * (1 << zoom)).floor();

      final dio = Dio(
        BaseOptions(
          connectTimeout: const Duration(seconds: 3),
          receiveTimeout: const Duration(seconds: 3),
          headers: {'User-Agent': 'SolOps-SolarCRM/1.0 (support@solops.cloud)'},
          responseType: ResponseType.bytes,
        ),
      );

      final res = await dio.get<List<int>>("https://tile.openstreetmap.org/$zoom/$tileX/$tileY.png");
      if (res.statusCode == 200 && res.data != null) {
        final codec = await ui.instantiateImageCodec(Uint8List.fromList(res.data!));
        final frame = await codec.getNextFrame();
        return frame.image;
      }
    } catch (e) {
      debugPrint("fetchMapTile error: $e");
    }
    return null;
  }

  /// Stamp GPS Map Camera watermark matching reference app
  /// Returns structured WatermarkResult so failure is communicated directly
  static Future<WatermarkResult> watermarkGeoPhoto({
    required File imageFile,
    required Position? position,
    required String projectNumber,
    required String systemCapacity,
    String? locationAddress,
    String? phase,
    DateTime? capturedAt,
    bool isLocationVerified = true,
  }) async {
    final effectiveCaptureTime = capturedAt ?? DateTime.now();

    try {
      final bytes = await imageFile.readAsBytes();
      final codec = await ui.instantiateImageCodec(bytes);
      final frameInfo = await codec.getNextFrame();
      final ui.Image image = frameInfo.image;

      final double imgWidth = image.width.toDouble();
      final double imgHeight = image.height.toDouble();

      final bool hasVerifiedLocation = position != null && isLocationVerified;

      // Try fetching map tile ONLY if coordinates are verified
      ui.Image? mapTile;
      if (hasVerifiedLocation) {
        mapTile = await fetchMapTile(position.latitude, position.longitude);
      }

      final recorder = ui.PictureRecorder();
      final canvas = Canvas(
        recorder,
        Rect.fromLTWH(0, 0, imgWidth, imgHeight),
      );

      // 1. Draw original photo
      canvas.drawImage(image, Offset.zero, Paint());

      // 2. Compute proportional scale based on resolution
      final double scale = (imgWidth / 420.0).clamp(1.5, 9.0);

      final double padX = 14.0 * scale;
      final double padY = 12.0 * scale;
      final double lineSpacing = 4.0 * scale;

      // Format location text and header
      final String fullAddr;
      if (hasVerifiedLocation) {
        fullAddr = (locationAddress != null && locationAddress.trim().isNotEmpty)
            ? locationAddress.trim()
            : "Lat ${position.latitude.toStringAsFixed(5)}, Long ${position.longitude.toStringAsFixed(5)}";
      } else {
        fullAddr = (locationAddress != null && locationAddress.trim().isNotEmpty)
            ? "$locationAddress (Unverified Location)"
            : "Site Photo (Unverified Location • No GPS Lock)";
      }

      final addrTokens = fullAddr.split(',').map((s) => s.trim()).where((s) => s.isNotEmpty).toList();
      String headerCityState;
      if (addrTokens.length >= 2) {
        headerCityState = "${addrTokens[addrTokens.length - 2]}, ${addrTokens.last}";
      } else {
        headerCityState = fullAddr;
      }

      final dateStr = formatCaptureTime(effectiveCaptureTime);
      final String latStr;
      final String longStr;

      if (hasVerifiedLocation) {
        latStr = "Lat ${position.latitude.toStringAsFixed(6)}°";
        longStr = "Long ${position.longitude.toStringAsFixed(6)}° (±${position.accuracy.toInt()}m)";
      } else if (position != null) {
        latStr = "Lat ${position.latitude.toStringAsFixed(6)}° (Unverified)";
        longStr = "Long ${position.longitude.toStringAsFixed(6)}° (Unverified)";
      } else {
        latStr = "GPS: Unverified Location";
        longStr = "Accuracy: N/A (No GPS Lock)";
      }

      final phaseText = (phase != null && phase.trim().isNotEmpty) ? " • Phase: $phase" : "";
      final metaStr = "Proj: $projectNumber (${systemCapacity}kW)$phaseText";
      final captureLine = "Captured: $dateStr";

      // Size of square map tile
      final double mapSize = 92.0 * scale;
      final double textStartX = padX + mapSize + (12.0 * scale);
      final double maxTextWidth = imgWidth - textStartX - padX;

      // 3. Prepare Text Painters
      // Line 1: Bold City/Region Header
      final headerPainter = TextPainter(
        text: TextSpan(
          text: headerCityState,
          style: TextStyle(
            color: Colors.white,
            fontSize: 13.5 * scale,
            fontWeight: FontWeight.w900,
            fontFamily: 'Roboto',
          ),
        ),
        textDirection: ui.TextDirection.ltr,
        maxLines: 1,
        ellipsis: '...',
      );
      headerPainter.layout(maxWidth: maxTextWidth);

      // Line 2: Full Address
      final addressPainter = TextPainter(
        text: TextSpan(
          text: fullAddr,
          style: TextStyle(
            color: const Color(0xFFF1F5F9), // Slate off-white
            fontSize: 11.0 * scale,
            fontWeight: FontWeight.w600,
            height: 1.25,
            fontFamily: 'Roboto',
          ),
        ),
        textDirection: ui.TextDirection.ltr,
        maxLines: 2,
        ellipsis: '...',
      );
      addressPainter.layout(maxWidth: maxTextWidth);

      // Line 3: Lat & Long Coordinates
      final coordsPainter = TextPainter(
        text: TextSpan(
          text: "$latStr   $longStr",
          style: TextStyle(
            color: hasVerifiedLocation ? const Color(0xFFFACC15) : const Color(0xFFFCD34D),
            fontSize: 11.5 * scale,
            fontWeight: FontWeight.w800,
            fontFamily: 'Roboto',
          ),
        ),
        textDirection: ui.TextDirection.ltr,
        maxLines: 1,
        ellipsis: '...',
      );
      coordsPainter.layout(maxWidth: maxTextWidth);

      // Line 4: Capture timestamp with Timezone
      final capturePainter = TextPainter(
        text: TextSpan(
          text: captureLine,
          style: TextStyle(
            color: const Color(0xFFE2E8F0),
            fontSize: 10.5 * scale,
            fontWeight: FontWeight.w700,
            fontFamily: 'Roboto',
          ),
        ),
        textDirection: ui.TextDirection.ltr,
        maxLines: 1,
      );
      capturePainter.layout(maxWidth: maxTextWidth);

      // Line 5: Project & Phase metadata
      final metaPainter = TextPainter(
        text: TextSpan(
          text: metaStr,
          style: TextStyle(
            color: const Color(0xFF94A3B8), // Soft slate
            fontSize: 10.5 * scale,
            fontWeight: FontWeight.w700,
            fontFamily: 'Roboto',
          ),
        ),
        textDirection: ui.TextDirection.ltr,
        maxLines: 1,
      );
      metaPainter.layout(maxWidth: maxTextWidth);

      // Calculate right-side text total height
      final double textTotalHeight = headerPainter.height +
          lineSpacing +
          addressPainter.height +
          lineSpacing +
          coordsPainter.height +
          lineSpacing +
          capturePainter.height +
          (lineSpacing * 0.8) +
          metaPainter.height;

      final double bannerContentHeight = max(mapSize, textTotalHeight);
      final double bannerHeight = bannerContentHeight + (padY * 2);
      final double bannerTop = imgHeight - bannerHeight;

      // 4. Draw Dark Backdrop Banner with Rounded Top
      final bannerRRect = RRect.fromRectAndCorners(
        Rect.fromLTWH(0, bannerTop, imgWidth, bannerHeight),
        topLeft: Radius.circular(16.0 * scale),
        topRight: Radius.circular(16.0 * scale),
      );
      canvas.drawRRect(
        bannerRRect,
        Paint()..color = const Color(0xF518181B), // 96% solid dark charcoal
      );

      // Accent line: Green if verified, Amber if unverified
      final accentColor = hasVerifiedLocation ? const Color(0xFF10B981) : const Color(0xFFF59E0B);
      canvas.drawRRect(
        RRect.fromRectAndCorners(
          Rect.fromLTWH(0, bannerTop, imgWidth, 3.0 * scale),
          topLeft: Radius.circular(16.0 * scale),
          topRight: Radius.circular(16.0 * scale),
        ),
        Paint()..color = accentColor,
      );

      // 5. Draw Top-Right Badge: Verified vs Unverified
      final badgeLabel = hasVerifiedLocation ? "GPS Map Camera • Verified Geotag" : "Site Camera • Unverified Location";
      final badgeTextPainter = TextPainter(
        text: TextSpan(
          text: badgeLabel,
          style: TextStyle(
            color: Colors.white,
            fontSize: 11.0 * scale,
            fontWeight: FontWeight.w800,
            fontFamily: 'Roboto',
          ),
        ),
        textDirection: ui.TextDirection.ltr,
      );
      badgeTextPainter.layout();

      final double badgeWidth = badgeTextPainter.width + (24.0 * scale);
      final double badgeHeight = badgeTextPainter.height + (10.0 * scale);
      final double badgeTop = bannerTop - badgeHeight - (6.0 * scale);
      final double badgeRight = imgWidth - (14.0 * scale);
      final double badgeLeft = badgeRight - badgeWidth;

      final badgeRect = RRect.fromRectAndRadius(
        Rect.fromLTWH(badgeLeft, badgeTop, badgeWidth, badgeHeight),
        Radius.circular(6.0 * scale),
      );
      canvas.drawRRect(badgeRect, Paint()..color = const Color(0xEE18181B));
      canvas.drawRRect(
        badgeRect,
        Paint()
          ..color = accentColor
          ..style = PaintingStyle.stroke
          ..strokeWidth = 1.0 * scale,
      );

      // Small indicator icon in badge
      final camSquare = RRect.fromRectAndRadius(
        Rect.fromLTWH(badgeLeft + (5.0 * scale), badgeTop + (4.0 * scale), 12.0 * scale, 12.0 * scale),
        Radius.circular(3.0 * scale),
      );
      canvas.drawRRect(camSquare, Paint()..color = accentColor);
      canvas.drawCircle(
        Offset(badgeLeft + (11.0 * scale), badgeTop + (10.0 * scale)),
        3.0 * scale,
        Paint()..color = Colors.white,
      );

      badgeTextPainter.paint(canvas, Offset(badgeLeft + (20.0 * scale), badgeTop + (5.0 * scale)));

      // 6. Draw Map or Unverified Placeholder on the Left
      final mapRect = Rect.fromLTWH(padX, bannerTop + padY, mapSize, mapSize);
      final mapRRect = RRect.fromRectAndRadius(mapRect, Radius.circular(8.0 * scale));

      canvas.save();
      canvas.clipRRect(mapRRect);

      if (hasVerifiedLocation) {
        if (mapTile != null) {
          // Draw real map tile scaled
          final src = Rect.fromLTWH(0, 0, mapTile.width.toDouble(), mapTile.height.toDouble());
          canvas.drawImageRect(mapTile, src, mapRect, Paint());
        } else {
          // Fallback clean vector map tile
          canvas.drawRect(mapRect, Paint()..color = const Color(0xFFCBD5E1));
          final roadPaint = Paint()
            ..color = Colors.white
            ..strokeWidth = 4.0 * scale;
          canvas.drawLine(
            Offset(mapRect.left, mapRect.top + mapSize * 0.4),
            Offset(mapRect.right, mapRect.top + mapSize * 0.4),
            roadPaint,
          );
          canvas.drawLine(
            Offset(mapRect.left + mapSize * 0.6, mapRect.top),
            Offset(mapRect.left + mapSize * 0.6, mapRect.bottom),
            roadPaint,
          );
        }

        // Draw Red Map Pin in Center of Map
        final pinCenter = Offset(mapRect.center.dx, mapRect.center.dy - (4.0 * scale));
        final double pinRadius = 9.0 * scale;

        // Shadow under pin
        canvas.drawOval(
          Rect.fromCenter(
            center: Offset(pinCenter.dx, pinCenter.dy + pinRadius * 1.0),
            width: pinRadius * 1.3,
            height: pinRadius * 0.5,
          ),
          Paint()
            ..color = Colors.black.withValues(alpha: 0.45)
            ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 2),
        );

        // Red teardrop pin body
        final pinPath = Path();
        pinPath.addArc(
          Rect.fromCircle(center: Offset(pinCenter.dx, pinCenter.dy - pinRadius * 0.4), radius: pinRadius),
          -pi * 0.15,
          pi * 1.3,
        );
        pinPath.lineTo(pinCenter.dx, pinCenter.dy + pinRadius * 0.95);
        pinPath.close();

        canvas.drawPath(pinPath, Paint()..color = const Color(0xFFEF4444));
        canvas.drawPath(
          pinPath,
          Paint()
            ..color = Colors.white
            ..style = PaintingStyle.stroke
            ..strokeWidth = 1.2 * scale,
        );

        // White center dot
        canvas.drawCircle(
          Offset(pinCenter.dx, pinCenter.dy - pinRadius * 0.4),
          pinRadius * 0.35,
          Paint()..color = Colors.white,
        );
      } else {
        // Unverified placeholder (No fake map or fake pin)
        canvas.drawRect(mapRect, Paint()..color = const Color(0xFF27272A));
        final borderPlaceholderPaint = Paint()
          ..color = const Color(0xFF3F3F46)
          ..style = PaintingStyle.stroke
          ..strokeWidth = 1.0 * scale;
        canvas.drawRect(mapRect, borderPlaceholderPaint);

        // Center location off icon text
        final unverifiedTextPainter = TextPainter(
          text: TextSpan(
            text: "NO GPS\nLOCK",
            style: TextStyle(
              color: const Color(0xFFA1A1AA),
              fontSize: 11.0 * scale,
              fontWeight: FontWeight.w900,
              fontFamily: 'Roboto',
              height: 1.2,
            ),
          ),
          textAlign: TextAlign.center,
          textDirection: ui.TextDirection.ltr,
        );
        unverifiedTextPainter.layout(maxWidth: mapSize);
        unverifiedTextPainter.paint(
          canvas,
          Offset(
            mapRect.center.dx - (unverifiedTextPainter.width / 2),
            mapRect.center.dy - (unverifiedTextPainter.height / 2),
          ),
        );
      }

      canvas.restore();

      // Border around map tile
      canvas.drawRRect(
        mapRRect,
        Paint()
          ..color = accentColor
          ..style = PaintingStyle.stroke
          ..strokeWidth = 1.5 * scale,
      );

      // 7. Paint Right-Side Text Content
      double currentY = bannerTop + padY;

      // Header City/State
      headerPainter.paint(canvas, Offset(textStartX, currentY));
      currentY += headerPainter.height + lineSpacing;

      // Full Address
      addressPainter.paint(canvas, Offset(textStartX, currentY));
      currentY += addressPainter.height + lineSpacing;

      // Coordinates
      coordsPainter.paint(canvas, Offset(textStartX, currentY));
      currentY += coordsPainter.height + lineSpacing;

      // Capture Date / Time with Timezone
      capturePainter.paint(canvas, Offset(textStartX, currentY));
      currentY += capturePainter.height + (lineSpacing * 0.8);

      // Date / Project / CRM Tagline
      metaPainter.paint(canvas, Offset(textStartX, currentY));

      // 8. Render and save to temporary file
      final picture = recorder.endRecording();
      final watermarkedImage = await picture.toImage(image.width, image.height);
      final byteData = await watermarkedImage.toByteData(format: ui.ImageByteFormat.png);

      if (byteData == null) {
        return WatermarkResult(
          success: false,
          file: imageFile,
          errorMessage: "Failed to encode watermarked image bytes.",
          isGeoTagged: false,
          capturedAt: effectiveCaptureTime,
        );
      }

      final buffer = byteData.buffer.asUint8List();
      final tempDir = Directory.systemTemp;
      final outPath = "${tempDir.path}/geo_${effectiveCaptureTime.millisecondsSinceEpoch}.png";
      final outFile = File(outPath);
      await outFile.writeAsBytes(buffer);

      return WatermarkResult(
        success: true,
        file: outFile,
        isGeoTagged: hasVerifiedLocation,
        latitude: hasVerifiedLocation ? position.latitude : null,
        longitude: hasVerifiedLocation ? position.longitude : null,
        accuracyMeters: hasVerifiedLocation ? position.accuracy : null,
        capturedAt: effectiveCaptureTime,
        formattedAddress: fullAddr,
      );
    } catch (e, stack) {
      debugPrint("GeoCameraHelper.watermarkGeoPhoto error: $e\n$stack");
      return WatermarkResult(
        success: false,
        file: imageFile,
        errorMessage: "Watermark stamping failed: $e",
        isGeoTagged: false,
        capturedAt: effectiveCaptureTime,
      );
    }
  }
}
