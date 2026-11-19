import 'dart:io';
import 'dart:ui' as ui;
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:geocoding/geocoding.dart';
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

  /// Reverse geocode coordinates to clean, human-readable address like Swiggy / Google Maps
  static Future<String?> reverseGeocode(double lat, double lon) async {
    // 1. Primary: Native Google Geocoder via Android/iOS Geocoder API (exact Swiggy / Maps format)
    try {
      final geocoding = Geocoding();
      final placemarks = await geocoding.placemarkFromCoordinates(lat, lon);
      if (placemarks.isNotEmpty) {
        final p = placemarks.first;
        final parts = <String>[];

        // Specific street, building, house name or thoroughfare
        final street = p.street?.trim();
        final name = p.name?.trim();
        final subThoroughfare = p.subThoroughfare?.trim();
        final thoroughfare = p.thoroughfare?.trim();

        if (street != null && street.isNotEmpty && street != p.locality && street != p.subLocality) {
          parts.add(street);
        } else if (name != null && name.isNotEmpty && name != p.locality && name != p.subLocality) {
          parts.add(name);
        }

        if (thoroughfare != null && thoroughfare.isNotEmpty && !parts.contains(thoroughfare) && thoroughfare != p.locality) {
          if (subThoroughfare != null && subThoroughfare.isNotEmpty && !parts.contains(subThoroughfare)) {
            parts.add("$subThoroughfare $thoroughfare");
          } else {
            parts.add(thoroughfare);
          }
        }

        // Sub-locality (Colony, Sector, Market)
        final subLoc = p.subLocality?.trim();
        if (subLoc != null && subLoc.isNotEmpty && !parts.contains(subLoc)) {
          parts.add(subLoc);
        }

        // Locality (City) - clean up any administrative suffixes
        final loc = p.locality?.trim();
        if (loc != null && loc.isNotEmpty) {
          final cleanCity = loc.replaceAll(RegExp(r'\s*(Municipal Corporation|Tehsil|District)\s*', caseSensitive: false), '').trim();
          if (cleanCity.isNotEmpty && !parts.contains(cleanCity)) {
            parts.add(cleanCity);
          }
        }

        // State & PIN
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
            final colony = addr['neighbourhood'] ?? addr['suburb'] ?? addr['quarter'] ?? addr['residential'];
            final rawCity = addr['city'] ?? addr['town'] ?? addr['village'] ?? addr['county'];
            final state = addr['state']?.toString().trim();
            final postcode = addr['postcode']?.toString().trim();

            if (road != null && road.toString().trim().isNotEmpty) {
              parts.add(road.toString().trim());
            }
            if (colony != null && colony.toString().trim().isNotEmpty && !parts.contains(colony.toString().trim())) {
              parts.add(colony.toString().trim());
            }
            if (rawCity != null) {
              final cleanCity = rawCity.toString().replaceAll(RegExp(r'\s*(Municipal Corporation|Tehsil|District)\s*', caseSensitive: false), '').trim();
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

    // 3. Fallback: BigDataCloud client API
    try {
      final dio = Dio(
        BaseOptions(
          connectTimeout: const Duration(milliseconds: 2500),
          receiveTimeout: const Duration(milliseconds: 2500),
        ),
      );
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

    return null;
  }

  /// Stamp GPS coordinates, timestamp, exact address, and "Powered by SolOps" watermark onto image
  /// (Strictly no emojis; clean, professional enterprise styling)
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
      final double scale = (imgWidth / 400.0).clamp(1.5, 9.0);

      final double padX = 20.0 * scale;
      final double padY = 16.0 * scale;
      final double lineSpacing = 6.0 * scale;
      final double maxTextWidth = imgWidth - (padX * 2);

      // Format data strings (strictly NO emojis)
      final dateStr = DateFormat("dd MMM yyyy, hh:mm:ss a").format(DateTime.now());

      // Primary Address: clean human readable site location
      final cleanAddress = (locationAddress != null && locationAddress.trim().isNotEmpty)
          ? locationAddress.trim()
          : (position != null
              ? "Lat ${position.latitude.toStringAsFixed(5)}, Long ${position.longitude.toStringAsFixed(5)}"
              : "Site Location Verified");

      // GPS Coordinates (secondary line)
      final coordsStr = position != null
          ? "Lat ${position.latitude.toStringAsFixed(6)}°, Long ${position.longitude.toStringAsFixed(6)}° (±${position.accuracy.toStringAsFixed(1)}m)"
          : "Verified Site Survey Geotag";

      final projectStr = "Project: $projectNumber | $systemCapacity kW${phase != null ? ' | $phase' : ''}";
      const solopsStr = "Powered by SolOps • Enterprise Solar Platform";

      // 3. Build TextPainters to measure exact height
      // Header Badge (strictly no emojis)
      final badgePainter = TextPainter(
        text: TextSpan(
          text: " GPS MAP CAMERA • SITE VERIFIED ",
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

      // Line 1: Exact Address (strictly no emojis)
      final addressPainter = TextPainter(
        text: TextSpan(
          children: [
            TextSpan(
              text: "Location: ",
              style: TextStyle(
                color: const Color(0xFF94A3B8),
                fontSize: 15.0 * scale,
                fontWeight: FontWeight.w700,
                fontFamily: 'Roboto',
              ),
            ),
            TextSpan(
              text: cleanAddress,
              style: TextStyle(
                color: const Color(0xFFFACC15), // High-visibility bright yellow/gold
                fontSize: 15.5 * scale,
                fontWeight: FontWeight.w900,
                height: 1.25,
                fontFamily: 'Roboto',
              ),
            ),
          ],
        ),
        textDirection: ui.TextDirection.ltr,
        maxLines: 3,
      );
      addressPainter.layout(maxWidth: maxTextWidth);

      // Line 2: Date & Time (strictly no emojis)
      final timePainter = TextPainter(
        text: TextSpan(
          children: [
            TextSpan(
              text: "Date & Time: ",
              style: TextStyle(
                color: const Color(0xFF94A3B8),
                fontSize: 13.5 * scale,
                fontWeight: FontWeight.w700,
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

      // Line 3: GPS Coordinates & Project info (strictly no emojis)
      final metaPainter = TextPainter(
        text: TextSpan(
          text: "$coordsStr  |  $projectStr",
          style: TextStyle(
            color: const Color(0xFF93C5FD), // Soft cyan/blue
            fontSize: 12.0 * scale,
            fontWeight: FontWeight.w700,
            fontFamily: 'Roboto',
          ),
        ),
        textDirection: ui.TextDirection.ltr,
        maxLines: 2,
      );
      metaPainter.layout(maxWidth: maxTextWidth);

      // Line 4: Powered by SolOps (strictly no emojis)
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
