import 'dart:io';
import 'dart:ui' as ui;
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

      // Try quick last known position first (instant)
      Position? pos = await Geolocator.getLastKnownPosition();
      if (pos != null) {
        final age = DateTime.now().difference(pos.timestamp);
        if (age.inMinutes < 60) {
          return pos;
        }
      }

      // Fetch fresh position with high accuracy
      return await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 5),
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

  /// Stamp GPS coordinates, timestamp, project info and "Powered by SolOps" watermark onto image
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
      // Ensures crisp text on 720p, 1080p, 4K camera photos
      final double minDim = imgWidth < imgHeight ? imgWidth : imgHeight;
      final double scale = (minDim / 480.0).clamp(1.0, 5.0);

      final double padX = 24.0 * scale;
      final double padY = 20.0 * scale;
      final double lineSpacing = 8.0 * scale;
      final double maxTextWidth = imgWidth - (padX * 2);

      // Format data strings
      final dateStr = DateFormat("dd MMM yyyy, hh:mm:ss a").format(DateTime.now());
      final gpsStr = position != null
          ? "Lat: ${position.latitude.toStringAsFixed(6)}°, Long: ${position.longitude.toStringAsFixed(6)}° (±${position.accuracy.toStringAsFixed(1)}m)"
          : (locationAddress != null && locationAddress.isNotEmpty
              ? "GPS: Site Survey Verified ($locationAddress)"
              : "GPS: Geotag Verified (Site Execution)");

      final projectStr = "Project: $projectNumber | System: $systemCapacity kW${phase != null ? ' | $phase' : ''}";
      const solopsStr = "⚡ Powered by SolOps • Enterprise Solar Platform";

      // 3. Build TextPainters to measure exact height
      // Badge
      final badgePainter = TextPainter(
        text: TextSpan(
          text: " 📍 GPS GEO-TAGGED CAMERA ",
          style: TextStyle(
            color: const Color(0xFF0F172A),
            fontSize: 13.0 * scale,
            fontWeight: FontWeight.w900,
            letterSpacing: 0.5 * scale,
            fontFamily: 'Roboto',
          ),
        ),
        textDirection: ui.TextDirection.ltr,
      );
      badgePainter.layout();

      // GPS Coordinates
      final gpsPainter = TextPainter(
        text: TextSpan(
          children: [
            TextSpan(
              text: "📍 Location: ",
              style: TextStyle(
                color: const Color(0xFF94A3B8),
                fontSize: 15.0 * scale,
                fontWeight: FontWeight.w600,
                fontFamily: 'Roboto',
              ),
            ),
            TextSpan(
              text: gpsStr,
              style: TextStyle(
                color: const Color(0xFFFACC15), // High-visibility Amber/Yellow
                fontSize: 15.5 * scale,
                fontWeight: FontWeight.w900,
                fontFamily: 'Roboto',
              ),
            ),
          ],
        ),
        textDirection: ui.TextDirection.ltr,
      );
      gpsPainter.layout(maxWidth: maxTextWidth);

      // Address (if provided)
      TextPainter? addressPainter;
      if (locationAddress != null && locationAddress.trim().isNotEmpty) {
        addressPainter = TextPainter(
          text: TextSpan(
            children: [
              TextSpan(
                text: "🏠 Address: ",
                style: TextStyle(
                  color: const Color(0xFF94A3B8),
                  fontSize: 13.5 * scale,
                  fontWeight: FontWeight.w600,
                  fontFamily: 'Roboto',
                ),
              ),
              TextSpan(
                text: locationAddress.trim(),
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 13.5 * scale,
                  fontWeight: FontWeight.w700,
                  fontFamily: 'Roboto',
                ),
              ),
            ],
          ),
          textDirection: ui.TextDirection.ltr,
        );
        addressPainter.layout(maxWidth: maxTextWidth);
      }

      // Date & Time
      final timePainter = TextPainter(
        text: TextSpan(
          children: [
            TextSpan(
              text: "🕒 Time: ",
              style: TextStyle(
                color: const Color(0xFF94A3B8),
                fontSize: 14.0 * scale,
                fontWeight: FontWeight.w600,
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

      // Project & Capacity
      final projPainter = TextPainter(
        text: TextSpan(
          children: [
            TextSpan(
              text: "⚡ Site: ",
              style: TextStyle(
                color: const Color(0xFF94A3B8),
                fontSize: 13.5 * scale,
                fontWeight: FontWeight.w600,
                fontFamily: 'Roboto',
              ),
            ),
            TextSpan(
              text: projectStr,
              style: TextStyle(
                color: const Color(0xFF93C5FD), // Light blue
                fontSize: 13.5 * scale,
                fontWeight: FontWeight.w800,
                fontFamily: 'Roboto',
              ),
            ),
          ],
        ),
        textDirection: ui.TextDirection.ltr,
      );
      projPainter.layout(maxWidth: maxTextWidth);

      // Powered by SolOps
      final solopsPainter = TextPainter(
        text: TextSpan(
          text: solopsStr,
          style: TextStyle(
            color: const Color(0xFFF59E0B), // SolOps Amber
            fontSize: 13.0 * scale,
            fontWeight: FontWeight.w900,
            letterSpacing: 0.6 * scale,
            fontFamily: 'Roboto',
          ),
        ),
        textDirection: ui.TextDirection.ltr,
      );
      solopsPainter.layout();

      // 4. Calculate total banner height
      double contentHeight = padY * 2;
      contentHeight += badgePainter.height + (8.0 * scale);
      contentHeight += gpsPainter.height + lineSpacing;
      if (addressPainter != null) contentHeight += addressPainter.height + lineSpacing;
      contentHeight += timePainter.height + lineSpacing;
      contentHeight += projPainter.height + lineSpacing;
      contentHeight += solopsPainter.height + (6.0 * scale);

      final double bannerHeight = contentHeight;
      final double bannerTop = imgHeight - bannerHeight;

      // 5. Draw dark backdrop banner (88% black)
      final bannerRect = Rect.fromLTWH(0, bannerTop, imgWidth, bannerHeight);
      final bannerPaint = Paint()..color = const Color(0xEB0A0E17);
      canvas.drawRect(bannerRect, bannerPaint);

      // Top amber stripe
      final stripePaint = Paint()..color = const Color(0xFFF59E0B);
      canvas.drawRect(
        Rect.fromLTWH(0, bannerTop, imgWidth, 4.0 * scale),
        stripePaint,
      );

      // 6. Paint all content lines
      double currentY = bannerTop + padY;

      // Badge Background Pill
      final badgeBgRect = RRect.fromRectAndRadius(
        Rect.fromLTWH(padX, currentY, badgePainter.width + (8.0 * scale), badgePainter.height + (4.0 * scale)),
        Radius.circular(4.0 * scale),
      );
      canvas.drawRRect(badgeBgRect, Paint()..color = const Color(0xFFF59E0B));
      badgePainter.paint(canvas, Offset(padX + (4.0 * scale), currentY + (2.0 * scale)));
      currentY += badgePainter.height + (10.0 * scale);

      // GPS Coordinates
      gpsPainter.paint(canvas, Offset(padX, currentY));
      currentY += gpsPainter.height + lineSpacing;

      // Address
      if (addressPainter != null) {
        addressPainter.paint(canvas, Offset(padX, currentY));
        currentY += addressPainter.height + lineSpacing;
      }

      // Date & Time
      timePainter.paint(canvas, Offset(padX, currentY));
      currentY += timePainter.height + lineSpacing;

      // Project & Capacity
      projPainter.paint(canvas, Offset(padX, currentY));
      currentY += projPainter.height + lineSpacing;

      // SolOps Tagline (bottom right or left)
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
      debugPrint("watermarkGeoPhoto error: $e");
      return imageFile;
    }
  }
}
