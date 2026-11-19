import 'package:flutter/material.dart';
import 'package:geocoding/geocoding.dart';
import 'package:geolocator/geolocator.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_typography.dart';
import '../../core/utils/geo_camera_helper.dart';

class NavbarLocationPill extends StatefulWidget {
  const NavbarLocationPill({super.key});

  @override
  State<NavbarLocationPill> createState() => _NavbarLocationPillState();
}

class _NavbarLocationPillState extends State<NavbarLocationPill> {
  static String? _cachedShortLocation;
  static String? _cachedFullAddress;
  static Position? _cachedPosition;

  bool _isLoading = false;
  String _displayLocation = _cachedShortLocation ?? "Locating...";

  @override
  void initState() {
    super.initState();
    if (_cachedShortLocation == null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _fetchLocation();
      });
    } else {
      _displayLocation = _cachedShortLocation!;
    }
  }

  Future<void> _fetchLocation({bool userInitiated = false}) async {
    if (!mounted) return;
    setState(() {
      _isLoading = true;
      if (_cachedShortLocation == null) {
        _displayLocation = "Locating...";
      }
    });

    try {
      final pos = await GeoCameraHelper.getCurrentPosition();
      if (pos == null) {
        if (!mounted) return;
        setState(() {
          _isLoading = false;
          _displayLocation = _cachedShortLocation ?? "GPS Off";
        });
        if (userInitiated && mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text("Unable to acquire GPS location. Please check location permissions."),
              duration: Duration(seconds: 2),
            ),
          );
        }
        return;
      }

      _cachedPosition = pos;

      // Reverse geocode to extract clean short area / city
      String short = "";
      String? fullAddress;

      try {
        final geocoding = Geocoding();
        final placemarks = await geocoding.placemarkFromCoordinates(pos.latitude, pos.longitude);
        if (placemarks.isNotEmpty) {
          final p = placemarks.first;
          final locality = p.locality?.trim();
          final subLocality = p.subLocality?.trim();
          final subAdmin = p.subAdministrativeArea?.trim();
          final admin = p.administrativeArea?.trim();

          if (subLocality != null && subLocality.isNotEmpty && locality != null && locality.isNotEmpty && subLocality != locality) {
            short = "$subLocality, $locality";
          } else if (locality != null && locality.isNotEmpty) {
            short = locality;
          } else if (subAdmin != null && subAdmin.isNotEmpty) {
            short = subAdmin;
          } else if (admin != null && admin.isNotEmpty) {
            short = admin;
          }
        }
      } catch (e) {
        debugPrint("Native geocoding in NavbarLocationPill failed: $e");
      }

      // Fallback to OpenStreetMap reverse geocode
      if (short.isEmpty) {
        fullAddress = await GeoCameraHelper.reverseGeocode(pos.latitude, pos.longitude);
        if (fullAddress != null && fullAddress.isNotEmpty) {
          final tokens = fullAddress.split(',').map((s) => s.trim()).where((s) => s.isNotEmpty).toList();
          if (tokens.length >= 2) {
            short = "${tokens[tokens.length - 2]}, ${tokens.last}";
          } else {
            short = tokens.first;
          }
        } else {
          short = "${pos.latitude.toStringAsFixed(2)}, ${pos.longitude.toStringAsFixed(2)}";
        }
      } else {
        fullAddress = await GeoCameraHelper.reverseGeocode(pos.latitude, pos.longitude);
      }

      _cachedShortLocation = short;
      _cachedFullAddress = fullAddress ?? short;

      if (!mounted) return;
      setState(() {
        _displayLocation = short;
        _isLoading = false;
      });

      if (userInitiated && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: AppColors.emeraldGreen,
            content: Text("Location updated: $short"),
            duration: const Duration(seconds: 2),
          ),
        );
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isLoading = false;
        _displayLocation = _cachedShortLocation ?? "Location Off";
      });
    }
  }

  void _showLocationDetails() {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? AppColors.darkCard : AppColors.lightCard;
    final textPrimary = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final textSecondary = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;
    final borderColor = isDark ? AppColors.darkBorder : AppColors.lightBorder;

    showModalBottomSheet(
      context: context,
      backgroundColor: cardBg,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppColors.errorRed.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.location_on_rounded, color: AppColors.errorRed, size: 22),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          "Verified GPS Location",
                          style: AppTypography.heading(color: textPrimary, size: 16),
                        ),
                        Text(
                          _cachedPosition != null
                              ? "Lat: ${_cachedPosition!.latitude.toStringAsFixed(5)}, Long: ${_cachedPosition!.longitude.toStringAsFixed(5)}"
                              : "Coordinates pending",
                          style: AppTypography.caption(color: textSecondary),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF161616) : const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: borderColor),
                ),
                child: Text(
                  _cachedFullAddress ?? _displayLocation,
                  style: TextStyle(
                    fontSize: 13,
                    color: textPrimary,
                    height: 1.35,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              const SizedBox(height: 18),
              SizedBox(
                width: double.infinity,
                height: 44,
                child: ElevatedButton.icon(
                  onPressed: () {
                    Navigator.pop(ctx);
                    _fetchLocation(userInitiated: true);
                  },
                  icon: const Icon(Icons.refresh_rounded, size: 18),
                  label: const Text("Refresh Current Location", style: TextStyle(fontWeight: FontWeight.w700)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.brandPrimary,
                    foregroundColor: Colors.black,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryTextColor = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final borderColor = isDark ? AppColors.darkBorder : AppColors.lightBorder;
    final pillBg = isDark ? const Color(0xFF161616) : const Color(0xFFF1F5F9);

    return InkWell(
      onTap: _showLocationDetails,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
        decoration: BoxDecoration(
          color: pillBg,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: borderColor),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (_isLoading)
              const SizedBox(
                width: 12,
                height: 12,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  valueColor: AlwaysStoppedAnimation<Color>(AppColors.brandPrimary),
                ),
              )
            else
              const Icon(
                Icons.location_on_rounded,
                size: 14,
                color: Color(0xFFEF4444),
              ),
            const SizedBox(width: 4),
            ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 105),
              child: Text(
                _displayLocation,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  color: primaryTextColor,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

