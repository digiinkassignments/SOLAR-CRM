import 'dart:io';
import 'dart:math';
import 'dart:typed_data';
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

        final subLoc = p.subLocality?.trim();
        if (subLoc != null && subLoc.isNotEmpty && !parts.contains(subLoc)) {
          parts.add(subLoc);
        }

        final loc = p.locality?.trim();
        if (loc != null && loc.isNotEmpty) {
          final cleanCity = loc.replaceAll(RegExp(r'\s*(Municipal Corporation|Tehsil|District)\s*', caseSensitive: false), '').trim();
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

    return null;
  }

  /// Fetch mini map tile image for coordinates
  static Future<ui.Image?> fetchMapTile(double lat, double lon) async {
    try {
      const int zoom = 16;
      final int tileX = ((lon + 180.0) / 360.0 * (1 << zoom)).floor();
      final double latRad = lat * pi / 180.0;
      final int tileY = ((1.0 - log(tan(latRad) + 1.0 / cos(latRad)) / pi) / 2.0 * (1 << zoom)).floor();

      final dio = Dio(BaseOptions(
        connectTimeout: const Duration(seconds: 3),
        receiveTimeout: const Duration(seconds: 3),
        headers: {'User-Agent': 'SolOps-SolarCRM/1.0 (support@solops.cloud)'},
        responseType: ResponseType.bytes,
      ));

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
  /// (Left: Map with red pin; Right: City/State, full address, Lat, Long, Date/Time; Top badge: GPS Map Camera)
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

      // Try fetching map tile if coordinates are available
      ui.Image? mapTile;
      if (position != null) {
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

      // Extract City/State for Primary Bold Title (matching reference: "Visakhapatnam, Andhra Pradesh, India")
      final String fullAddr = (locationAddress != null && locationAddress.trim().isNotEmpty)
          ? locationAddress.trim()
          : (position != null
              ? "Lat ${position.latitude.toStringAsFixed(5)}, Long ${position.longitude.toStringAsFixed(5)}"
              : "Site Location Verified");

      final addrTokens = fullAddr.split(',').map((s) => s.trim()).where((s) => s.isNotEmpty).toList();
      String headerCityState;
      if (addrTokens.length >= 2) {
        headerCityState = "${addrTokens[addrTokens.length - 2]}, ${addrTokens.last}";
      } else {
        headerCityState = fullAddr;
      }

      final dateStr = DateFormat("dd MMM yyyy, hh:mm:ss a").format(DateTime.now());
      final latStr = position != null ? "Lat ${position.latitude.toStringAsFixed(6)}°" : "Lat --";
      final longStr = position != null ? "Long ${position.longitude.toStringAsFixed(6)}°" : "Long --";
      final metaStr = "$dateStr | Proj: $projectNumber (${systemCapacity}kW)";

      // Size of square map tile
      final double mapSize = 92.0 * scale;
      final double textStartX = padX + mapSize + (12.0 * scale);
      final double maxTextWidth = imgWidth - textStartX - padX;

      // 3. Prepare Text Painters (Strictly NO emojis)
      // Line 1: Bold City/Region Header
      final headerPainter = TextPainter(
        text: TextSpan(
          text: headerCityState,
          style: TextStyle(
            color: Colors.white,
            fontSize: 14.0 * scale,
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
            fontSize: 11.5 * scale,
            fontWeight: FontWeight.w600,
            height: 1.25,
            fontFamily: 'Roboto',
          ),
        ),
        textDirection: ui.TextDirection.ltr,
        maxLines: 3,
        ellipsis: '...',
      );
      addressPainter.layout(maxWidth: maxTextWidth);

      // Line 3: Lat
      final latPainter = TextPainter(
        text: TextSpan(
          text: latStr,
          style: TextStyle(
            color: const Color(0xFFFACC15), // Yellow/gold
            fontSize: 12.0 * scale,
            fontWeight: FontWeight.w800,
            fontFamily: 'Roboto',
          ),
        ),
        textDirection: ui.TextDirection.ltr,
      );
      latPainter.layout(maxWidth: maxTextWidth);

      // Line 4: Long
      final longPainter = TextPainter(
        text: TextSpan(
          text: longStr,
          style: TextStyle(
            color: const Color(0xFFFACC15), // Yellow/gold
            fontSize: 12.0 * scale,
            fontWeight: FontWeight.w800,
            fontFamily: 'Roboto',
          ),
        ),
        textDirection: ui.TextDirection.ltr,
      );
      longPainter.layout(maxWidth: maxTextWidth);

      // Line 5: Date, Time & Project
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
      double textTotalHeight = headerPainter.height + lineSpacing +
          addressPainter.height + lineSpacing +
          latPainter.height + (lineSpacing * 0.7) +
          longPainter.height + (lineSpacing * 0.7) +
          metaPainter.height;

      final double bannerContentHeight = max(mapSize, textTotalHeight);
      final double bannerHeight = bannerContentHeight + (padY * 2);
      final double bannerTop = imgHeight - bannerHeight;

      // 4. Draw Dark Backdrop Banner with Rounded Top (matching reference app)
      final bannerRRect = RRect.fromRectAndCorners(
        Rect.fromLTWH(0, bannerTop, imgWidth, bannerHeight),
        topLeft: Radius.circular(16.0 * scale),
        topRight: Radius.circular(16.0 * scale),
      );
      canvas.drawRRect(
        bannerRRect,
        Paint()..color = const Color(0xF218181B), // 95% solid dark charcoal
      );

      // Subtle top accent line
      canvas.drawRRect(
        RRect.fromRectAndCorners(
          Rect.fromLTWH(0, bannerTop, imgWidth, 3.0 * scale),
          topLeft: Radius.circular(16.0 * scale),
          topRight: Radius.circular(16.0 * scale),
        ),
        Paint()..color = const Color(0xFFF59E0B),
      );

      // 5. Draw Top-Right Badge: "GPS Map Camera" (matching reference app)
      final badgeTextPainter = TextPainter(
        text: TextSpan(
          text: "GPS Map Camera",
          style: TextStyle(
            color: Colors.white,
            fontSize: 11.5 * scale,
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
      canvas.drawRRect(badgeRect, Paint()..color = const Color(0xDD18181B));
      canvas.drawRRect(badgeRect, Paint()..color = const Color(0xFFF59E0B)..style = PaintingStyle.stroke..strokeWidth = 1.0 * scale);

      // Small camera icon square in badge
      final camSquare = RRect.fromRectAndRadius(
        Rect.fromLTWH(badgeLeft + (5.0 * scale), badgeTop + (4.0 * scale), 12.0 * scale, 12.0 * scale),
        Radius.circular(3.0 * scale),
      );
      canvas.drawRRect(camSquare, Paint()..color = const Color(0xFF3B82F6));
      canvas.drawCircle(Offset(badgeLeft + (11.0 * scale), badgeTop + (10.0 * scale)), 3.0 * scale, Paint()..color = Colors.white);

      badgeTextPainter.paint(canvas, Offset(badgeLeft + (20.0 * scale), badgeTop + (5.0 * scale)));

      // 6. Draw Map on the Left
      final mapRect = Rect.fromLTWH(padX, bannerTop + padY, mapSize, mapSize);
      final mapRRect = RRect.fromRectAndRadius(mapRect, Radius.circular(8.0 * scale));

      canvas.save();
      canvas.clipRRect(mapRRect);

      if (mapTile != null) {
        // Draw real map tile scaled
        final src = Rect.fromLTWH(0, 0, mapTile.width.toDouble(), mapTile.height.toDouble());
        canvas.drawImageRect(mapTile, src, mapRect, Paint());
      } else {
        // Fallback clean vector map tile
        canvas.drawRect(mapRect, Paint()..color = const Color(0xFFCBD5E1));
        final roadPaint = Paint()..color = Colors.white..strokeWidth = 4.0 * scale;
        canvas.drawLine(Offset(mapRect.left, mapRect.top + mapSize * 0.4), Offset(mapRect.right, mapRect.top + mapSize * 0.4), roadPaint);
        canvas.drawLine(Offset(mapRect.left + mapSize * 0.6, mapRect.top), Offset(mapRect.left + mapSize * 0.6, mapRect.bottom), roadPaint);
      }

      // Draw Red Map Pin in Center of Map (matching reference)
      final pinCenter = Offset(mapRect.center.dx, mapRect.center.dy - (4.0 * scale));
      final double pinRadius = 9.0 * scale;

      // Shadow under pin
      canvas.drawOval(
        Rect.fromCenter(center: Offset(pinCenter.dx, pinCenter.dy + pinRadius * 1.0), width: pinRadius * 1.3, height: pinRadius * 0.5),
        Paint()..color = Colors.black.withValues(alpha: 0.45)..maskFilter = const MaskFilter.blur(BlurStyle.normal, 2),
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
      canvas.drawPath(pinPath, Paint()..color = Colors.white..style = PaintingStyle.stroke..strokeWidth = 1.2 * scale);

      // White center dot
      canvas.drawCircle(Offset(pinCenter.dx, pinCenter.dy - pinRadius * 0.4), pinRadius * 0.35, Paint()..color = Colors.white);

      canvas.restore();

      // Border around map tile
      canvas.drawRRect(
        mapRRect,
        Paint()
          ..color = const Color(0xFFF59E0B)
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

      // Lat
      latPainter.paint(canvas, Offset(textStartX, currentY));
      currentY += latPainter.height + (lineSpacing * 0.7);

      // Long
      longPainter.paint(canvas, Offset(textStartX, currentY));
      currentY += longPainter.height + (lineSpacing * 0.7);

      // Date / Project / CRM Tagline
      metaPainter.paint(canvas, Offset(textStartX, currentY));

      // 8. Render and save to temporary file
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
