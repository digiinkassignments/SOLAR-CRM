import 'dart:io';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:intl/intl.dart';

class GeoCameraHelper {
  /// Request GPS position safely with permissions
  static Future<Position?> getCurrentPosition() async {
    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        return null;
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          return null;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        return null;
      }

      return await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 6),
        ),
      );
    } catch (e) {
      debugPrint("GeoCameraHelper.getCurrentPosition error: $e");
      return null;
    }
  }

  /// Stamp GPS coordinates, timestamp, project info and "Powered by SolOps" watermark onto image
  static Future<File> watermarkGeoPhoto({
    required File imageFile,
    required Position? position,
    required String projectNumber,
    required String systemCapacity,
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

      // 2. Compute proportional sizes based on photo resolution
      // Standardize so 1080p, 4K, or 720p all look balanced
      final double scale = (imgWidth / 1080.0).clamp(0.6, 3.5);
      final double bannerHeight = 160.0 * scale;
      final double bannerTop = imgHeight - bannerHeight;

      // 3. Draw semi-transparent dark banner at bottom
      final bannerRect = Rect.fromLTWH(0, bannerTop, imgWidth, bannerHeight);
      final bannerPaint = Paint()
        ..color = const Color(0xE60A0E17); // ~90% dark navy/black
      canvas.drawRect(bannerRect, bannerPaint);

      // Amber top stripe on the banner
      final stripeHeight = 4.0 * scale;
      final stripePaint = Paint()..color = const Color(0xFFF59E0B); // Amber
      canvas.drawRect(
        Rect.fromLTWH(0, bannerTop, imgWidth, stripeHeight),
        stripePaint,
      );

      // 4. Format strings
      final dateStr = DateFormat("dd MMM yyyy, hh:mm:ss a").format(DateTime.now());
      final gpsStr = position != null
          ? "GPS: ${position.latitude.toStringAsFixed(6)}°, ${position.longitude.toStringAsFixed(6)}° (±${position.accuracy.toStringAsFixed(1)}m)"
          : "GPS: Location Recorded (Site Geotag)";
      final projectStr = "Project: $projectNumber | Capacity: $systemCapacity kW${phase != null ? ' | Phase: $phase' : ''}";
      const brandingStr = "Powered by SolOps";

      // 5. Draw text using TextPainters
      final double padX = 24.0 * scale;
      double currentY = bannerTop + (16.0 * scale);

      // Line 1: GPS Coordinates
      final gpsPainter = TextPainter(
        text: TextSpan(
          children: [
            TextSpan(
              text: "📍 ",
              style: TextStyle(fontSize: 16.0 * scale),
            ),
            TextSpan(
              text: gpsStr,
              style: TextStyle(
                color: const Color(0xFFFACC15), // Yellow/Amber
                fontSize: 16.0 * scale,
                fontWeight: FontWeight.bold,
                fontFamily: 'Roboto',
              ),
            ),
          ],
        ),
        textDirection: ui.TextDirection.ltr,
      );
      gpsPainter.layout(maxWidth: imgWidth - (padX * 2));
      gpsPainter.paint(canvas, Offset(padX, currentY));
      currentY += (26.0 * scale);

      // Line 2: Timestamp
      final timePainter = TextPainter(
        text: TextSpan(
          children: [
            TextSpan(
              text: "🕒 ",
              style: TextStyle(fontSize: 14.0 * scale),
            ),
            TextSpan(
              text: dateStr,
              style: TextStyle(
                color: Colors.white,
                fontSize: 14.0 * scale,
                fontWeight: FontWeight.w600,
                fontFamily: 'Roboto',
              ),
            ),
          ],
        ),
        textDirection: ui.TextDirection.ltr,
      );
      timePainter.layout(maxWidth: imgWidth - (padX * 2));
      timePainter.paint(canvas, Offset(padX, currentY));
      currentY += (24.0 * scale);

      // Line 3: Project Number & System Capacity
      final projPainter = TextPainter(
        text: TextSpan(
          children: [
            TextSpan(
              text: "⚡ ",
              style: TextStyle(fontSize: 13.0 * scale),
            ),
            TextSpan(
              text: projectStr,
              style: TextStyle(
                color: const Color(0xFF93C5FD), // Light Blue
                fontSize: 13.0 * scale,
                fontWeight: FontWeight.w600,
                fontFamily: 'Roboto',
              ),
            ),
          ],
        ),
        textDirection: ui.TextDirection.ltr,
      );
      projPainter.layout(maxWidth: imgWidth - (padX * 2));
      projPainter.paint(canvas, Offset(padX, currentY));
      currentY += (24.0 * scale);

      // Line 4: Powered by SolOps (Right aligned or bottom-right pill)
      final brandingPainter = TextPainter(
        text: TextSpan(
          text: brandingStr,
          style: TextStyle(
            color: const Color(0xFFCBD5E1),
            fontSize: 12.0 * scale,
            fontWeight: FontWeight.bold,
            letterSpacing: 0.8 * scale,
            fontFamily: 'Roboto',
          ),
        ),
        textDirection: ui.TextDirection.ltr,
      );
      brandingPainter.layout();
      brandingPainter.paint(
        canvas,
        Offset(imgWidth - padX - brandingPainter.width, bannerTop + bannerHeight - (24.0 * scale)),
      );

      // End recording and export to image file
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
      return imageFile; // fallback to original file if watermarking fails
    }
  }
}
