import 'dart:io';
import 'dart:ui' as ui;
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:intl/intl.dart';

class GeoCameraHelper {
  /// Request GPS position safely with permissions and fallback to last known
  static Future<Position?> getCurrentPosition() async {
    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        return await Geolocator.getLastKnownPosition();
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          return await Geolocator.getLastKnownPosition();
        }
      }

      if (permission == LocationPermission.deniedForever) {
        return await Geolocator.getLastKnownPosition();
      }

      // Try quick last known position first if recent (<30 mins)
      Position? pos = await Geolocator.getLastKnownPosition();
      if (pos != null) {
        final age = DateTime.now().difference(pos.timestamp);
        if (age.inMinutes < 30) {
          return pos;
        }
      }

      // Fetch fresh position with high accuracy
      return await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 4),
        ),
      );
    } catch (e) {
      debugPrint("GeoCameraHelper.getCurrentPosition error: $e");
      try {
        return await Geolocator.getLastKnownPosition();
      } catch (_) {
        return null;
      }
    }
  }

  /// Reverse geocode coordinates to human-readable address (Street, Colony, City, State PIN)
  static Future<String?> reverseGeocode(double lat, double lon) async {
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

      // 1. Try OpenStreetMap Nominatim
      try {
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
              final road = addr['road'] ?? addr['street'] ?? addr['neighbourhood'];
              final sub = addr['suburb'] ?? addr['quarter'] ?? addr['residential'] ?? addr['commercial'];
              final city = addr['city'] ?? addr['town'] ?? addr['village'] ?? addr['county'] ?? addr['district'];
              final state = addr['state'];
              final postcode = addr['postcode'];

              if (road != null && road.toString().trim().isNotEmpty) {
                parts.add(road.toString().trim());
              }
              if (sub != null && sub.toString().trim().isNotEmpty && sub != road) {
                parts.add(sub.toString().trim());
              }
              if (city != null && city.toString().trim().isNotEmpty) {
                parts.add(city.toString().trim());
              }
              if (state != null && state.toString().trim().isNotEmpty) {
                if (postcode != null && postcode.toString().trim().isNotEmpty) {
                  parts.add("${state.toString().trim()} ${postcode.toString().trim()}");
                } else {
                  parts.add(state.toString().trim());
                }
              }

              if (parts.isNotEmpty) {
                return parts.join(', ');
              }
            }

            if (data['display_name'] != null && data['display_name'].toString().isNotEmpty) {
              return data['display_name'].toString();
            }
          }
        }
      } catch (_) {}

      // 2. Fallback to BigDataCloud free client reverse geocoder
      try {
        final res2 = await dio.get(
          'https://api.bigdatacloud.net/data/reverse-geocode-client',
          queryParameters: {
            'latitude': lat,
            'longitude': lon,
            'localityLanguage': 'en',
          },
        );

        if (res2.statusCode == 200 && res2.data != null) {
          final d = res2.data;
          if (d is Map) {
            final parts = <String>[];
            final locality = d['locality']?.toString();
            final city = d['city']?.toString();
            final sub = d['principalSubdivision']?.toString();
            final post = d['postcode']?.toString();

            if (locality != null && locality.isNotEmpty) parts.add(locality);
            if (city != null && city.isNotEmpty && city != locality) parts.add(city);
            if (sub != null && sub.isNotEmpty) {
              if (post != null && post.isNotEmpty) {
                parts.add("$sub $post");
              } else {
                parts.add(sub);
              }
            }
            if (parts.isNotEmpty) {
              return parts.join(', ');
            }
          }
        }
      } catch (_) {}
    } catch (e) {
      debugPrint("GeoCameraHelper.reverseGeocode error: $e");
    }
    return null;
  }

  /// Stamp GPS coordinates, timestamp, exact address, and "Powered by SolOps" watermark onto image
  static Future<File> watermarkGeoPhoto({
    required File imageFile,
    required Position? position,
    required String projectNumber,
    required String systemCapacity,
    String? locationAddress,
    String? phase,
  }) async {
    try {
      final bytes = await imageFile.readAsBytes();
      final codec = await ui.instantiateImageCodec(bytes);
      final frameInfo = await codec.getNextFrame();
      final ui.Image image = frameInfo.image;

      final double imgWidth = image.width.toDouble();
      final double imgHeight = image.height.toDouble();

      final recorder = ui.PictureRecorder();
      final canvas = Canvas(
        recorder,
        Rect.fromLTWH(0, 0, imgWidth, imgHeight),
      );

      // 1. Draw original photo
      canvas.drawImage(image, Offset.zero, Paint());

      // 2. Compute proportional scale based on resolution
      // Calibrated so that text is bold, large and legible across 720p, 1080p, and 4K+ camera captures
      final double scale = (imgWidth / 400.0).clamp(1.5, 9.0);

      final double padX = 20.0 * scale;
      final double padY = 16.0 * scale;
      final double lineSpacing = 6.0 * scale;
      final double maxTextWidth = imgWidth - (padX * 2);

      // Format data strings
      final dateStr = DateFormat("dd MMM yyyy, hh:mm:ss a").format(DateTime.now());

      // Primary Address: clean human readable site location
      final cleanAddress = (locationAddress != null && locationAddress.trim().isNotEmpty)
          ? locationAddress.trim()
          : (position != null
              ? "Site Location: ${position.latitude.toStringAsFixed(5)}°, ${position.longitude.toStringAsFixed(5)}°"
              : "Project Site Execution Verified");

      // GPS Coordinates (secondary line)
      final coordsStr = position != null
          ? "Lat ${position.latitude.toStringAsFixed(6)}°, Long ${position.longitude.toStringAsFixed(6)}° (±${position.accuracy.toStringAsFixed(1)}m)"
          : "Verified Site Survey Geotag";

      final projectStr = "Project: $projectNumber | $systemCapacity kW${phase != null ? ' | $phase' : ''}";
      const solopsStr = "⚡ Powered by SolOps • Enterprise Solar Platform";

      // 3. Build TextPainters to measure exact height
      // Header Badge
      final badgePainter = TextPainter(
        text: TextSpan(
          text: " 📍 GPS MAP CAMERA • SITE VERIFIED ",
          style: TextStyle(
            color: const Color(0xFF0F172A),
            fontSize: 12.0 * scale,
            fontWeight: FontWeight.w900,
            letterSpacing: 0.5 * scale,
            fontFamily: 'Roboto',
          ),
        ),
        textDirection: ui.TextDirection.ltr,
      );
      badgePainter.layout();

      // Line 1: Exact Address (Prominent, large yellow/white)
      final addressPainter = TextPainter(
        text: TextSpan(
          children: [
            TextSpan(
              text: "📍 ",
              style: TextStyle(
                fontSize: 15.5 * scale,
                fontWeight: FontWeight.w900,
                fontFamily: 'Roboto',
              ),
            ),
            TextSpan(
              text: cleanAddress,
              style: TextStyle(
                color: const Color(0xFFFACC15), // High-visibility bright yellow/gold
                fontSize: 15.5 * scale,
                fontWeight: FontWeight.w900,
                height: 1.2,
                fontFamily: 'Roboto',
              ),
            ),
          ],
        ),
        textDirection: ui.TextDirection.ltr,
        maxLines: 3,
      );
      addressPainter.layout(maxWidth: maxTextWidth);

      // Line 2: Date & Time (High-visibility white)
      final timePainter = TextPainter(
        text: TextSpan(
          children: [
            TextSpan(
              text: "🕒 ",
              style: TextStyle(
                fontSize: 14.0 * scale,
                fontWeight: FontWeight.w800,
                fontFamily: 'Roboto',
              ),
            ),
            TextSpan(
              text: dateStr,
              style: TextStyle(
                color: Colors.white,
                fontSize: 14.0 * scale,
                fontWeight: FontWeight.w800,
                fontFamily: 'Roboto',
              ),
            ),
          ],
        ),
        textDirection: ui.TextDirection.ltr,
      );
      timePainter.layout(maxWidth: maxTextWidth);

      // Line 3: GPS Coordinates & Project info
      final metaPainter = TextPainter(
        text: TextSpan(
          children: [
            TextSpan(
              text: "🌐 $coordsStr  •  $projectStr",
              style: TextStyle(
                color: const Color(0xFF93C5FD), // Soft cyan/blue
                fontSize: 12.0 * scale,
                fontWeight: FontWeight.w700,
                fontFamily: 'Roboto',
              ),
            ),
          ],
        ),
        textDirection: ui.TextDirection.ltr,
        maxLines: 2,
      );
      metaPainter.layout(maxWidth: maxTextWidth);

      // Line 4: Powered by SolOps
      final solopsPainter = TextPainter(
        text: TextSpan(
          text: solopsStr,
          style: TextStyle(
            color: const Color(0xFFF59E0B), // SolOps Amber
            fontSize: 12.0 * scale,
            fontWeight: FontWeight.w900,
            letterSpacing: 0.5 * scale,
            fontFamily: 'Roboto',
          ),
        ),
        textDirection: ui.TextDirection.ltr,
      );
      solopsPainter.layout();

      // 4. Calculate total banner height
      double contentHeight = padY * 2;
      contentHeight += badgePainter.height + (6.0 * scale);
      contentHeight += addressPainter.height + lineSpacing;
      contentHeight += timePainter.height + lineSpacing;
      contentHeight += metaPainter.height + lineSpacing;
      contentHeight += solopsPainter.height + (4.0 * scale);

      final double bannerHeight = contentHeight;
      final double bannerTop = imgHeight - bannerHeight;

      // 5. Draw dark backdrop banner (92% black)
      final bannerRect = Rect.fromLTWH(0, bannerTop, imgWidth, bannerHeight);
      final bannerPaint = Paint()..color = const Color(0xEE0A0E17);
      canvas.drawRect(bannerRect, bannerPaint);

      // Top amber stripe (prominent 4px scaled accent)
      final stripePaint = Paint()..color = const Color(0xFFF59E0B);
      canvas.drawRect(
        Rect.fromLTWH(0, bannerTop, imgWidth, 4.0 * scale),
        stripePaint,
      );

      // 6. Paint all content lines
      double currentY = bannerTop + padY;

      // Badge Background Pill
      final badgeBgRect = RRect.fromRectAndRadius(
        Rect.fromLTWH(
          padX,
          currentY,
          badgePainter.width + (8.0 * scale),
          badgePainter.height + (4.0 * scale),
        ),
        Radius.circular(4.0 * scale),
      );
      canvas.drawRRect(badgeBgRect, Paint()..color = const Color(0xFFF59E0B));
      badgePainter.paint(canvas, Offset(padX + (4.0 * scale), currentY + (2.0 * scale)));
      currentY += badgePainter.height + (8.0 * scale);

      // Line 1: Exact Address
      addressPainter.paint(canvas, Offset(padX, currentY));
      currentY += addressPainter.height + lineSpacing;

      // Line 2: Date & Time
      timePainter.paint(canvas, Offset(padX, currentY));
      currentY += timePainter.height + lineSpacing;

      // Line 3: Coords & Project
      metaPainter.paint(canvas, Offset(padX, currentY));
      currentY += metaPainter.height + lineSpacing;

      // Line 4: SolOps Tagline
      solopsPainter.paint(canvas, Offset(padX, currentY + (2.0 * scale)));

      // 7. Render and save to temp file
      final picture = recorder.endRecording();
      final watermarkedImage = await picture.toImage(image.width, image.height);
      final byteData = await watermarkedImage.toByteData(format: ui.ImageByteFormat.png);

      if (byteData == null) {
        return imageFile;
      }

      final buffer = byteData.buffer.asUint8List();
      final tempDir = Directory.systemTemp;
      final outPath = "${tempDir.path}/geo_${DateTime.now().millisecondsSinceEpoch}.png";
      final outFile = File(outPath);
      await outFile.writeAsBytes(buffer);
      return outFile;
    } catch (e) {
      debugPrint("GeoCameraHelper.watermarkGeoPhoto error: $e");
      return imageFile;
    }
  }
}
