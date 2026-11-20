import 'dart:io';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/utils/geo_camera_helper.dart';
import '../../../core/utils/platform_permission_helper.dart';
import '../../../models/installation_log_model.dart';
import '../../../models/project_model.dart';
import '../../../providers/project_provider.dart';
import '../../common/signature_capture_widget.dart';

class LogInstallationProgressSheet extends StatefulWidget {
  final ProjectModel project;
  final InstallationLogModel? existingLog;

  const LogInstallationProgressSheet({
    super.key,
    required this.project,
    this.existingLog,
  });

  static Future<void> show(
    BuildContext context, {
    required ProjectModel project,
    InstallationLogModel? existingLog,
  }) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => LogInstallationProgressSheet(
        project: project,
        existingLog: existingLog,
      ),
    );
  }

  @override
  State<LogInstallationProgressSheet> createState() => _LogInstallationProgressSheetState();
}

class _LogInstallationProgressSheetState extends State<LogInstallationProgressSheet> {
  final _formKey = GlobalKey<FormState>();

  // 5 standard phases
  static const List<Map<String, dynamic>> _phaseConfigs = [
    {
      'key': 'Structure',
      'label': '1. Mounting Structure & Civil Foundation',
      'shortName': 'Structure',
      'target': 20,
    },
    {
      'key': 'Panels',
      'label': '2. Module Placement & DC Cabling',
      'shortName': 'Panels',
      'target': 45,
    },
    {
      'key': 'Inverter & Electrical',
      'label': '3. Inverter Mounting & AC/DC DBs',
      'shortName': 'Inverter & Electrical',
      'target': 70,
    },
    {
      'key': 'Earthing & Protection',
      'label': '4. Chemical Earthing & Lightning Arrestor',
      'shortName': 'Earthing & Protection',
      'target': 85,
    },
    {
      'key': 'Testing',
      'label': '5. Pre-Commissioning Testing & Polarity',
      'shortName': 'Testing',
      'target': 100,
    },
  ];

  static const List<String> _weatherOptions = [
    'Sunny / Clear (Optimal)',
    'Partly Cloudy',
    'Overcast / Rainy',
    'High Winds',
    'Extreme Heat',
  ];

  static const List<String> _unitOptions = [
    'Nos',
    'Meters',
    'Kg',
    'Sets',
    'Bags',
    'Rolls',
    'Pcs',
    'Boxes',
    'Liters',
  ];

  static const List<String> _commonMaterials = [
    'Solar PV Modules (Mono PERC / TopCon)',
    'Solar Grid-Tie Inverter',
    'Module Mounting Structure (MMS) Legs & Purlins',
    'Anchor Fasteners & Bolts (SS304)',
    'DC Solar Cable (4 sq mm / 6 sq mm)',
    'AC Armoured Cable (4 Core)',
    'DC Combiner Box / DCDB',
    'AC Distribution Box / ACDB',
    'Chemical Earthing Electrodes (Copper Bonded)',
    'Earthing Compound / BFC (Bentonite)',
    'Lightning Arrestor (LA) Spike & Base',
    'GI Earthing Strip (25x3 mm)',
    'PVC / HDPE Flexible Conduit Pipes & Saddles',
    'MC4 Connectors (Male/Female pairs)',
    'Custom Item / Other',
  ];

  // Controllers & Form State
  late TextEditingController _logDateCtrl;
  late TextEditingController _expectedDateCtrl;
  late TextEditingController _workDoneCtrl;
  late TextEditingController _supervisorNameCtrl;
  late TextEditingController _workersCountCtrl;
  late TextEditingController _hoursWorkedCtrl;
  late TextEditingController _crewNamesCtrl;
  late TextEditingController _issuesCtrl;
  late TextEditingController _progressPercentCtrl;

  String _selectedPhase = 'Structure';
  String _selectedWeather = 'Sunny / Clear (Optimal)';
  bool _isPhaseCompleted = false;

  // Materials rows
  final List<_MaterialRowData> _materials = [];

  // Safety checklist
  bool _harness = true;
  bool _helmet = true;
  bool _shoes = true;
  bool _lifeline = true;

  // Signoff & Signature
  bool _supervisorSignoff = true;
  String? _signatureData;

  // Photos with Geo-Tag, Before/After & Captions
  final List<_PhotoEntry> _photoEntries = [];
  final ImagePicker _picker = ImagePicker();
  bool _isCapturingGeoPhoto = false;

  bool _isSubmitting = false;
  String? _formErrorMessage;
  int? _savedLogId;
  bool _isRetryingPhotos = false;
  String? _photoUploadErrorMessage;

  @override
  void initState() {
    super.initState();
    final log = widget.existingLog;
    _savedLogId = widget.existingLog?.id;
    final nowStr = DateFormat('yyyy-MM-dd').format(DateTime.now());

    String cleanDate(String? s) {
      if (s == null || s.trim().isEmpty) return nowStr;
      final t = s.trim();
      if (t.contains('T')) return t.split('T')[0];
      if (t.length >= 10) return t.substring(0, 10);
      return t;
    }

    _logDateCtrl = TextEditingController(text: cleanDate(log?.logDate));
    _expectedDateCtrl = TextEditingController(
      text: widget.project.installationEndDate != null
          ? DateFormat('yyyy-MM-dd').format(widget.project.installationEndDate!)
          : '',
    );
    _workDoneCtrl = TextEditingController(text: log?.workDone ?? '');
    _supervisorNameCtrl = TextEditingController(
      text: log?.supervisorName ?? widget.project.assignedToName ?? '',
    );
    _workersCountCtrl = TextEditingController(
      text: log?.workersCount != null ? log!.workersCount.toString() : '4',
    );
    _hoursWorkedCtrl = TextEditingController(
      text: log?.hoursWorked != null ? log!.hoursWorked.toString() : '8',
    );
    _crewNamesCtrl = TextEditingController(text: log?.crewNames ?? '');
    _issuesCtrl = TextEditingController(text: log?.issuesFaced ?? '');

    if (log != null) {
      _selectedPhase = log.phase ?? 'Structure';
      _isPhaseCompleted = log.isPhaseCompleted;
      _selectedWeather = _weatherOptions.firstWhere(
        (w) => w.toLowerCase().contains((log.weather ?? '').toLowerCase()),
        orElse: () => _weatherOptions[0],
      );
      _progressPercentCtrl = TextEditingController(
        text: log.progressPercent != null ? log.progressPercent.toString() : '20',
      );

      final sc = log.safetyChecklist ?? {};
      _harness = sc['harness'] ?? true;
      _helmet = sc['helmet'] ?? true;
      _shoes = sc['shoes'] ?? true;
      _lifeline = sc['lifeline'] ?? true;

      _supervisorSignoff = log.supervisorSignoff;
      _signatureData = log.signatureData;

      if (log.materialsList.isNotEmpty) {
        for (var m in log.materialsList) {
          _materials.add(_MaterialRowData(
            itemCtrl: TextEditingController(text: m.item),
            quantityCtrl: TextEditingController(text: m.quantity?.toString() ?? '1'),
            unit: _unitOptions.contains(m.unit) ? m.unit : 'Nos',
          ));
        }
      }
    } else {
      _selectedPhase = _phaseConfigs[0]['key'] as String;
      _progressPercentCtrl = TextEditingController(text: '20');
      // 1 initial material row
      _materials.add(_MaterialRowData(
        itemCtrl: TextEditingController(text: _commonMaterials[0]),
        quantityCtrl: TextEditingController(text: '10'),
        unit: 'Nos',
      ));
    }
  }

  @override
  void dispose() {
    _logDateCtrl.dispose();
    _expectedDateCtrl.dispose();
    _workDoneCtrl.dispose();
    _supervisorNameCtrl.dispose();
    _workersCountCtrl.dispose();
    _hoursWorkedCtrl.dispose();
    _crewNamesCtrl.dispose();
    _issuesCtrl.dispose();
    _progressPercentCtrl.dispose();
    for (var m in _materials) {
      m.dispose();
    }
    for (var p in _photoEntries) {
      p.dispose();
    }
    super.dispose();
  }

  void _onPhaseChanged(String? newPhase) {
    if (newPhase == null) return;
    setState(() {
      _selectedPhase = newPhase;
      final cfg = _phaseConfigs.firstWhere((p) => p['key'] == newPhase, orElse: () => _phaseConfigs[0]);
      _progressPercentCtrl.text = (cfg['target'] as int).toString();
    });
  }

  Future<void> _pickDate(TextEditingController ctrl) async {
    DateTime initial = DateTime.now();
    if (ctrl.text.isNotEmpty) {
      final parsed = DateTime.tryParse(ctrl.text);
      if (parsed != null) initial = parsed;
    }
    final picked = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime(2020),
      lastDate: DateTime(2035),
    );
    if (picked != null) {
      setState(() {
        ctrl.text = DateFormat('yyyy-MM-dd').format(picked);
      });
    }
  }

  Future<void> _pickPhotos(ImageSource source) async {
    if (_photoEntries.length >= 10) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("Maximum 10 site photos allowed per daily log."),
          backgroundColor: AppColors.errorRed,
        ),
      );
      return;
    }

    try {
      if (source == ImageSource.camera) {
        setState(() => _isCapturingGeoPhoto = true);

        // 1. Acquire fresh, verified location for site geotagging
        LocationResult locResult = await GeoCameraHelper.getVerifiedLocation();

        if (!locResult.isFreshAndAccurate) {
          final resolvedResult = await _showGpsIssueDialog(locResult);
          if (resolvedResult == null) {
            // User cancelled capture
            return;
          }
          locResult = resolvedResult;
        }

        // 2. Open camera with normalized orientation & balanced resolution
        final photo = await _picker.pickImage(
          source: ImageSource.camera,
          maxWidth: 1920,
          maxHeight: 1920,
          imageQuality: 85,
        );

        // Preserve exact camera-return time as capture timestamp
        final cameraReturnTime = DateTime.now();

        if (photo != null) {
          final originalFile = File(photo.path);
          final isVerified = locResult.isFreshAndAccurate && locResult.position != null;

          // 3. Resolve human-readable address if location is verified
          String resolvedAddress = "";
          if (isVerified) {
            final geoAddress = await GeoCameraHelper.reverseGeocode(
              locResult.position!.latitude,
              locResult.position!.longitude,
            );
            if (geoAddress != null && geoAddress.trim().isNotEmpty) {
              resolvedAddress = geoAddress.trim();
            }
          }

          // 4. Apply watermark with structured error communication
          final watermarkResult = await GeoCameraHelper.watermarkGeoPhoto(
            imageFile: originalFile,
            position: isVerified ? locResult.position : null,
            projectNumber: widget.project.projectNumber,
            systemCapacity: widget.project.systemCapacityKw.toString(),
            locationAddress: resolvedAddress.isNotEmpty ? resolvedAddress : null,
            phase: _selectedPhase,
            capturedAt: cameraReturnTime,
            isLocationVerified: isVerified,
          );

          if (!watermarkResult.success && mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(
                  "Watermark notice: ${watermarkResult.errorMessage ?? 'Saved unwatermarked photo.'}",
                ),
                backgroundColor: AppColors.solarGold,
              ),
            );
          }

          final newEntry = _PhotoEntry(
            file: watermarkResult.file,
            captionCtrl: TextEditingController(),
            tag: 'During',
            isGeoTagged: watermarkResult.isGeoTagged,
            gpsInfo: isVerified ? resolvedAddress : "Unverified Location (No GPS)",
            latitude: isVerified ? locResult.position!.latitude : null,
            longitude: isVerified ? locResult.position!.longitude : null,
            accuracyMeters: isVerified ? locResult.position!.accuracy : null,
            capturedAt: cameraReturnTime,
            isVerified: isVerified,
            verificationNote: isVerified
                ? "Verified GPS lock (±${locResult.position!.accuracy.toInt()}m)"
                : (locResult.errorMessage ?? "Captured without verified GPS"),
            isGallery: false,
          );

          setState(() {
            _photoEntries.add(newEntry);
          });

          // 5. Open photo preview for instant verification
          if (mounted) {
            _showPhotoPreviewDialog(context, newEntry, _photoEntries.length - 1);
          }
        }
      } else {
        // Gallery selection: NEVER stamp current GPS or current time
        final photos = await _picker.pickMultiImage(
          maxWidth: 1920,
          maxHeight: 1920,
          imageQuality: 85,
        );
        if (photos.isNotEmpty) {
          setState(() {
            final remaining = 10 - _photoEntries.length;
            final toAdd = photos.take(remaining).map((p) {
              return _PhotoEntry(
                file: File(p.path),
                captionCtrl: TextEditingController(),
                tag: 'During',
                isGeoTagged: false,
                isVerified: false,
                gpsInfo: "Gallery Upload (Unverified Site & Time)",
                verificationNote: "Imported from gallery. Original location & capture time unverified.",
                isGallery: true,
              );
            }).toList();
            _photoEntries.addAll(toAdd);
          });
        }
      }
    } catch (e) {
      debugPrint("Error picking photo: $e");
      if (PlatformPermissionHelper.isPermissionDeniedError(e) && mounted) {
        PlatformPermissionHelper.showPermissionDialog(
          context,
          type: source == ImageSource.camera
              ? PlatformPermissionType.camera
              : PlatformPermissionType.photos,
        );
      } else if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text("Unable to open media: $e"),
            backgroundColor: AppColors.errorRed,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isCapturingGeoPhoto = false);
    }
  }

  Future<LocationResult?> _showGpsIssueDialog(LocationResult locResult) async {
    return showDialog<LocationResult?>(
      context: context,
      barrierDismissible: false,
      builder: (dialogCtx) {
        final isDark = Theme.of(dialogCtx).brightness == Brightness.dark;
        final cardBg = isDark ? const Color(0xFF1E1E1E) : Colors.white;
        final textPrimary = isDark ? Colors.white : const Color(0xFF0F172A);
        final textSecondary = isDark ? const Color(0xFF94A3B8) : const Color(0xFF475569);

        String title = "GPS Location Notice";
        String description;
        bool canOpenLocationSettings = false;
        bool canOpenAppSettings = false;

        switch (locResult.status) {
          case LocationStatus.serviceDisabled:
            title = "GPS Is Switched Off";
            description =
                "Location services (GPS) are disabled on your device. Please turn on GPS for verified site geotagging.";
            canOpenLocationSettings = true;
            break;
          case LocationStatus.permissionDenied:
            title = "Location Permission Denied";
            description =
                "The app needs location permission to stamp verified GPS coordinates on site installation photos.";
            break;
          case LocationStatus.permissionDeniedForever:
            title = "Location Permission Denied";
            description =
                "Location permission is permanently denied in settings. Please enable it in App Settings to verify site photos.";
            canOpenAppSettings = true;
            break;
          case LocationStatus.timeout:
            title = "GPS Satellite Timeout";
            description =
                "Could not get an accurate satellite lock within 8 seconds. Satellite signal may be obstructed indoors.";
            break;
          case LocationStatus.inaccurate:
            title = "Weak GPS Accuracy";
            description =
                "Current GPS accuracy is weak (±${locResult.position?.accuracy.toInt() ?? '>100'}m). Verified site geotagging requires accuracy within ±100m.";
            break;
          case LocationStatus.stale:
            title = "Stale GPS Coordinates";
            description =
                "The available GPS position is ${locResult.ageSeconds ?? 90}+ seconds old. A fresh site lock is required.";
            break;
          default:
            title = "GPS Unavailable";
            description = locResult.errorMessage ?? "Unable to acquire accurate GPS coordinates.";
            break;
        }

        bool isRetrying = false;

        return StatefulBuilder(
          builder: (context, setDialogState) {

            return AlertDialog(
              backgroundColor: cardBg,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              title: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppColors.solarGold.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(Icons.location_off_rounded, color: AppColors.solarGold, size: 22),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      title,
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: textPrimary),
                    ),
                  ),
                ],
              ),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    description,
                    style: TextStyle(fontSize: 13, color: textSecondary, height: 1.4),
                  ),
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF262626) : const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Icon(Icons.info_outline_rounded, size: 16, color: AppColors.skyBlue),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            "You can retry GPS lock or choose 'Take Normal Photo' (will be marked as Unverified Location).",
                            style: TextStyle(fontSize: 11, color: textSecondary, height: 1.3),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              actionsPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(dialogCtx).pop(null),
                  child: Text("Cancel", style: TextStyle(color: textSecondary, fontWeight: FontWeight.w600)),
                ),
                if (canOpenLocationSettings)
                  TextButton(
                    onPressed: () async {
                      await Geolocator.openLocationSettings();
                    },
                    child: const Text("Open Location Settings",
                        style: TextStyle(color: AppColors.skyBlue, fontWeight: FontWeight.w700)),
                  ),
                if (canOpenAppSettings)
                  TextButton(
                    onPressed: () async {
                      await Geolocator.openAppSettings();
                    },
                    child: const Text("Open App Settings",
                        style: TextStyle(color: AppColors.skyBlue, fontWeight: FontWeight.w700)),
                  ),
                OutlinedButton(
                  onPressed: () {
                    Navigator.of(dialogCtx).pop(
                      const LocationResult(
                        status: LocationStatus.error,
                        isFreshAndAccurate: false,
                        errorMessage: "Captured as standard photo without verified GPS",
                      ),
                    );
                  },
                  style: OutlinedButton.styleFrom(
                    foregroundColor: textPrimary,
                    side: BorderSide(color: textSecondary.withValues(alpha: 0.3)),
                  ),
                  child: const Text("Take Normal Photo", style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
                ),
                ElevatedButton.icon(
                  onPressed: isRetrying
                      ? null
                      : () async {
                          setDialogState(() => isRetrying = true);
                          final retryResult = await GeoCameraHelper.getVerifiedLocation();
                          if (dialogCtx.mounted) {
                            if (retryResult.isFreshAndAccurate) {
                              Navigator.of(dialogCtx).pop(retryResult);
                            } else {
                              setDialogState(() {
                                isRetrying = false;
                                locResult = retryResult;
                              });
                            }
                          }
                        },
                  icon: isRetrying
                      ? const SizedBox(
                          width: 14,
                          height: 14,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        )
                      : const Icon(Icons.refresh_rounded, size: 16),
                  label: Text(isRetrying ? "Checking..." : "Retry GPS",
                      style: const TextStyle(fontWeight: FontWeight.w700)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.emeraldGreen,
                    foregroundColor: Colors.white,
                  ),
                ),
              ],
            );
          },
        );
      },
    );
  }

  Future<void> _saveLog() async {
    setState(() {
      _formErrorMessage = null;
      _photoUploadErrorMessage = null;
    });

    if (!_formKey.currentState!.validate()) {
      setState(() => _formErrorMessage = "Please fill all required fields highlighted in red below.");
      return;
    }

    if (_workDoneCtrl.text.trim().isEmpty) {
      setState(() => _formErrorMessage = "Please describe the work done today.");
      return;
    }

    // If log was already saved in a previous attempt and only photos remain, route to retry directly
    if (_savedLogId != null && _photoEntries.any((p) => !p.isUploaded)) {
      await _retryFailedPhotos();
      return;
    }

    // Client-side photo validation
    final unuploadedPhotos = _photoEntries.where((p) => !p.isUploaded).toList();
    for (var i = 0; i < unuploadedPhotos.length; i++) {
      final f = unuploadedPhotos[i].file;
      if (!f.existsSync()) {
        setState(() => _formErrorMessage = "Photo #${i + 1} does not exist on device.");
        return;
      }
      if (f.lengthSync() > 10 * 1024 * 1024) {
        setState(() => _formErrorMessage = "Photo #${i + 1} exceeds server limit of 10MB.");
        return;
      }
    }

    setState(() => _isSubmitting = true);

    try {
      final cleanMaterials = _materials
          .where((m) => m.itemCtrl.text.trim().isNotEmpty)
          .map((m) => {
                'item': m.itemCtrl.text.trim(),
                'quantity': num.tryParse(m.quantityCtrl.text.trim()) ?? 1,
                'unit': m.unit,
                'is_custom': !_commonMaterials.contains(m.itemCtrl.text.trim()),
              })
          .toList();

      final cleanLogDate = _logDateCtrl.text.trim().contains('T')
          ? _logDateCtrl.text.trim().split('T')[0]
          : (_logDateCtrl.text.trim().length >= 10 ? _logDateCtrl.text.trim().substring(0, 10) : _logDateCtrl.text.trim());

      final cleanExpectedDate = _expectedDateCtrl.text.trim().isNotEmpty
          ? (_expectedDateCtrl.text.trim().contains('T')
              ? _expectedDateCtrl.text.trim().split('T')[0]
              : (_expectedDateCtrl.text.trim().length >= 10 ? _expectedDateCtrl.text.trim().substring(0, 10) : _expectedDateCtrl.text.trim()))
          : null;

      final payload = {
        'log_date': cleanLogDate,
        'expected_completion_date': cleanExpectedDate,
        'phase': _selectedPhase,
        'is_phase_completed': _isPhaseCompleted ? 1 : 0,
        'work_done': _workDoneCtrl.text.trim(),
        'workers_count': int.tryParse(_workersCountCtrl.text.trim()) ?? 0,
        'hours_worked': num.tryParse(_hoursWorkedCtrl.text.trim()) ?? 8,
        'supervisor_name': _supervisorNameCtrl.text.trim(),
        'crew_names': _crewNamesCtrl.text.trim(),
        'materials_list': cleanMaterials,
        'materials_used': cleanMaterials.map((m) => "${m['quantity']} ${m['unit']} ${m['item']}").join(', '),
        'issues_faced': _issuesCtrl.text.trim(),
        'progress_percent': int.tryParse(_progressPercentCtrl.text.trim()) ?? 20,
        'weather': _selectedWeather,
        'safety_checklist': {
          'harness': _harness,
          'helmet': _helmet,
          'shoes': _shoes,
          'lifeline': _lifeline,
        },
        'supervisor_signoff': _supervisorSignoff ? 1 : 0,
        'signature_data': _signatureData,
      };

      final photoCaptions = unuploadedPhotos.map((p) => {
        'caption': p.captionCtrl.text.trim(),
        'tag': p.tag,
        'latitude': p.latitude,
        'longitude': p.longitude,
        'accuracy_meters': p.accuracyMeters,
        'gps_address': p.gpsInfo,
        'captured_at': p.capturedAt?.toIso8601String(),
        'is_geo_tagged': p.isGeoTagged ? 1 : 0,
      }).toList();

      final provider = Provider.of<ProjectProvider>(context, listen: false);
      final res = await provider.saveInstallationLog(
        widget.project.id,
        payload,
        logId: widget.existingLog?.id,
        photos: unuploadedPhotos.map((p) => p.file).toList(),
        photoCaptions: photoCaptions,
      );

      if (mounted) {
        if (res['logSaved'] == true) {
          _savedLogId = res['logId'] as int?;

          if (res['photosUploaded'] == true) {
            for (final p in unuploadedPhotos) {
              p.isUploaded = true;
            }
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(res['message'] ?? "Log saved successfully!"),
                backgroundColor: AppColors.emeraldGreen,
              ),
            );
            Navigator.of(context).pop();
          } else {
            // Partial failure: Log was saved, photos upload failed!
            setState(() {
              _photoUploadErrorMessage = res['photoError'] ?? "Photos upload failed.";
            });
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text("Log saved, photos upload failed. Tap 'Retry Photo Upload' below."),
                backgroundColor: AppColors.solarGold,
                duration: Duration(seconds: 4),
              ),
            );
          }
        } else {
          setState(() {
            _formErrorMessage = res['message'] ?? "Failed to save daily log. Please verify details.";
          });
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _formErrorMessage = "Error saving log: $e";
        });
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  Future<void> _retryFailedPhotos() async {
    if (_savedLogId == null) return;
    final failed = _photoEntries.where((p) => !p.isUploaded).toList();
    if (failed.isEmpty) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text("All photos are already uploaded!"),
            backgroundColor: AppColors.emeraldGreen,
          ),
        );
      }
      return;
    }

    setState(() {
      _isRetryingPhotos = true;
      _photoUploadErrorMessage = null;
    });

    try {
      final photoCaptions = failed.map((p) => {
        'caption': p.captionCtrl.text.trim(),
        'tag': p.tag,
        'latitude': p.latitude,
        'longitude': p.longitude,
        'accuracy_meters': p.accuracyMeters,
        'gps_address': p.gpsInfo,
        'captured_at': p.capturedAt?.toIso8601String(),
        'is_geo_tagged': p.isGeoTagged ? 1 : 0,
      }).toList();

      final provider = Provider.of<ProjectProvider>(context, listen: false);
      final uploadRes = await provider.uploadInstallationLogPhotos(
        widget.project.id,
        _savedLogId!,
        photos: failed.map((p) => p.file).toList(),
        photoCaptions: photoCaptions,
      );

      if (mounted) {
        if (uploadRes['success'] == true) {
          for (final p in failed) {
            p.isUploaded = true;
          }
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(uploadRes['message'] ?? "Photos uploaded successfully!"),
              backgroundColor: AppColors.emeraldGreen,
            ),
          );
          Navigator.of(context).pop();
        } else {
          setState(() {
            _photoUploadErrorMessage = uploadRes['message'] ?? "Failed to upload photos.";
          });
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text("Photo upload failed: ${_photoUploadErrorMessage!}"),
              backgroundColor: AppColors.errorRed,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _photoUploadErrorMessage = "Error uploading photos: $e";
        });
      }
    } finally {
      if (mounted) setState(() => _isRetryingPhotos = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? const Color(0xFF121212) : Colors.white;
    final surfaceBg = isDark ? const Color(0xFF000000) : const Color(0xFFF8FAFC);
    final borderColor = isDark ? const Color(0xFF262626) : const Color(0xFFE2E8F0);
    final textPrimary = isDark ? Colors.white : const Color(0xFF0F172A);
    final textSecondary = isDark ? const Color(0xFF94A3B8) : const Color(0xFF475569);

    final currentTarget = _phaseConfigs.firstWhere(
      (p) => p['key'] == _selectedPhase,
      orElse: () => _phaseConfigs[0],
    )['target'];

    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.92,
      ),
      decoration: BoxDecoration(
        color: surfaceBg,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        border: Border(
          top: BorderSide(color: borderColor, width: 1.5),
        ),
      ),
      child: SafeArea(
        top: false,
        child: Column(
          children: [
            // Handle Bar
            Center(
              child: Container(
                margin: const EdgeInsets.only(top: 10, bottom: 8),
                width: 44,
                height: 4,
                decoration: BoxDecoration(
                  color: isDark ? Colors.white24 : Colors.grey.shade300,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),

            // Header Row
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          widget.existingLog != null
                              ? "Edit Installation Progress Log"
                              : "Log Daily Site Installation Progress",
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w800,
                            color: textPrimary,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 2),
                        Text(
                          "Project: ${widget.project.projectNumber} • System: ${widget.project.systemCapacityKw} kW",
                          style: TextStyle(
                            fontSize: 12,
                            color: textSecondary,
                            fontWeight: FontWeight.w500,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.of(context).pop(),
                    icon: Icon(Icons.close_rounded, color: textSecondary, size: 22),
                    splashRadius: 20,
                  ),
                ],
              ),
            ),
            Divider(height: 1, color: borderColor),

            // Form Body
            Expanded(
              child: Form(
                key: _formKey,
                child: ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    // Form Error Banner (Appears inside the form, not outside)
                    if (_formErrorMessage != null)
                      Container(
                        margin: const EdgeInsets.only(bottom: 14),
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                        decoration: BoxDecoration(
                          color: const Color(0xFF7F1D1D).withValues(alpha: 0.25),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: const Color(0xFFEF4444)),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.error_outline_rounded, color: Color(0xFFEF4444), size: 18),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                _formErrorMessage!,
                                style: const TextStyle(
                                  color: Color(0xFFFCA5A5),
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                            IconButton(
                              onPressed: () => setState(() => _formErrorMessage = null),
                              icon: const Icon(Icons.close, size: 16, color: Color(0xFFFCA5A5)),
                              padding: EdgeInsets.zero,
                              constraints: const BoxConstraints(),
                            ),
                          ],
                        ),
                      ),

                    // ==========================================
                    // 1. PHASE & TIMELINE CARD
                    // ==========================================
                    _buildSectionCard(
                      title: "PHASE & TIMELINE",
                      icon: Icons.calendar_today_rounded,
                      cardBg: cardBg,
                      borderColor: borderColor,
                      textPrimary: textPrimary,
                      textSecondary: textSecondary,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Expanded(
                                child: _buildDateField(
                                  label: "Log Date *",
                                  controller: _logDateCtrl,
                                  isDark: isDark,
                                  borderColor: borderColor,
                                  textPrimary: textPrimary,
                                  textSecondary: textSecondary,
                                  onTap: () => _pickDate(_logDateCtrl),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: _buildDateField(
                                  label: "Overall Target Date",
                                  controller: _expectedDateCtrl,
                                  isDark: isDark,
                                  borderColor: borderColor,
                                  textPrimary: textPrimary,
                                  textSecondary: textSecondary,
                                  onTap: () => _pickDate(_expectedDateCtrl),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text(
                            "Set overall rooftop / installation target date",
                            style: TextStyle(fontSize: 10.5, color: textSecondary),
                          ),
                          const SizedBox(height: 14),

                          // Phase Dropdown
                          Text(
                            "Installation Phase *",
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: textPrimary,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12),
                            decoration: BoxDecoration(
                              color: isDark ? const Color(0xFF1E1E1E) : Colors.white,
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: borderColor),
                            ),
                            child: DropdownButtonHideUnderline(
                              child: DropdownButton<String>(
                                value: _selectedPhase,
                                isExpanded: true,
                                dropdownColor: cardBg,
                                items: _phaseConfigs.map((p) {
                                  return DropdownMenuItem<String>(
                                    value: p['key'] as String,
                                    child: Text(
                                      p['label'] as String,
                                      style: TextStyle(
                                        fontSize: 13,
                                        fontWeight: FontWeight.w600,
                                        color: textPrimary,
                                      ),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  );
                                }).toList(),
                                onChanged: _onPhaseChanged,
                              ),
                            ),
                          ),
                          const SizedBox(height: 14),

                          // Weather Dropdown
                          Text(
                            "Site Weather",
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: textPrimary,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12),
                            decoration: BoxDecoration(
                              color: isDark ? const Color(0xFF1E1E1E) : Colors.white,
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: borderColor),
                            ),
                            child: DropdownButtonHideUnderline(
                              child: DropdownButton<String>(
                                value: _selectedWeather,
                                isExpanded: true,
                                dropdownColor: cardBg,
                                items: _weatherOptions.map((w) {
                                  return DropdownMenuItem<String>(
                                    value: w,
                                    child: Text(
                                      w,
                                      style: TextStyle(
                                        fontSize: 13,
                                        fontWeight: FontWeight.w600,
                                        color: textPrimary,
                                      ),
                                    ),
                                  );
                                }).toList(),
                                onChanged: (val) {
                                  if (val != null) setState(() => _selectedWeather = val);
                                },
                              ),
                            ),
                          ),
                          const SizedBox(height: 12),

                          // Mark Phase Completed Checkbox
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                            decoration: BoxDecoration(
                              color: isDark ? const Color(0xFF182218) : const Color(0xFFECFDF5),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(
                                color: isDark ? const Color(0xFF1A3E26) : const Color(0xFFA7F3D0),
                              ),
                            ),
                            child: Row(
                              children: [
                                Checkbox(
                                  value: _isPhaseCompleted,
                                  onChanged: (val) => setState(() => _isPhaseCompleted = val ?? false),
                                  activeColor: AppColors.emeraldGreen,
                                  materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        "Mark Phase as Completed Today",
                                        style: TextStyle(
                                          fontSize: 13,
                                          fontWeight: FontWeight.w700,
                                          color: isDark ? const Color(0xFF86EFAC) : const Color(0xFF065F46),
                                        ),
                                      ),
                                      Text(
                                        "Advances milestone stepper to the next stage",
                                        style: TextStyle(
                                          fontSize: 11,
                                          color: isDark ? const Color(0xFF6EE7B7) : const Color(0xFF047857),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 16),

                    // ==========================================
                    // 2. WORK DONE TODAY CARD
                    // ==========================================
                    _buildSectionCard(
                      title: "WORK DONE TODAY (DETAILED DESCRIPTION) *",
                      icon: Icons.edit_note_rounded,
                      cardBg: cardBg,
                      borderColor: borderColor,
                      textPrimary: textPrimary,
                      textSecondary: textSecondary,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          TextFormField(
                            controller: _workDoneCtrl,
                            maxLines: 4,
                            style: TextStyle(fontSize: 13, color: textPrimary),
                            validator: (val) {
                              if (val == null || val.trim().isEmpty) {
                                return "Work description is required";
                              }
                              return null;
                            },
                            decoration: InputDecoration(
                              hintText:
                                  "Describe exact rooftop tasks: number of structure legs grouted, torque tightness checked, panels bolted, DC stringing, conduit piping, earthing pit excavation...",
                              hintStyle: TextStyle(fontSize: 12, color: textSecondary.withValues(alpha: 0.7)),
                              filled: true,
                              fillColor: isDark ? const Color(0xFF1E1E1E) : Colors.white,
                              contentPadding: const EdgeInsets.all(12),
                              errorStyle: const TextStyle(fontSize: 11, color: AppColors.errorRed, fontWeight: FontWeight.w600),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(8),
                                borderSide: BorderSide(color: borderColor),
                              ),
                              enabledBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(8),
                                borderSide: BorderSide(color: borderColor),
                              ),
                              errorBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(8),
                                borderSide: const BorderSide(color: AppColors.errorRed),
                              ),
                              focusedErrorBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(8),
                                borderSide: const BorderSide(color: AppColors.errorRed, width: 1.5),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 16),

                    // ==========================================
                    // 3. FIELD PERSONNEL & ATTENDANCE
                    // ==========================================
                    _buildSectionCard(
                      title: "FIELD PERSONNEL & ATTENDANCE",
                      icon: Icons.groups_rounded,
                      cardBg: cardBg,
                      borderColor: borderColor,
                      textPrimary: textPrimary,
                      textSecondary: textSecondary,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _buildTextField(
                            label: "Site Supervisor Name",
                            hint: "e.g. Er. Vikram Singh",
                            controller: _supervisorNameCtrl,
                            isDark: isDark,
                            borderColor: borderColor,
                            textPrimary: textPrimary,
                            textSecondary: textSecondary,
                          ),
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              Expanded(
                                child: _buildTextField(
                                  label: "Workers on Site",
                                  hint: "e.g. 4",
                                  controller: _workersCountCtrl,
                                  isDark: isDark,
                                  borderColor: borderColor,
                                  textPrimary: textPrimary,
                                  textSecondary: textSecondary,
                                  keyboardType: TextInputType.number,
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: _buildTextField(
                                  label: "Hours Worked",
                                  hint: "e.g. 8",
                                  controller: _hoursWorkedCtrl,
                                  isDark: isDark,
                                  borderColor: borderColor,
                                  textPrimary: textPrimary,
                                  textSecondary: textSecondary,
                                  keyboardType: TextInputType.number,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          _buildTextField(
                            label: "Crew Members on Site",
                            hint: "e.g. Ramesh (Master Electrician), Suresh (Fabricator), Mohan & Anil (Technicians)",
                            controller: _crewNamesCtrl,
                            isDark: isDark,
                            borderColor: borderColor,
                            textPrimary: textPrimary,
                            textSecondary: textSecondary,
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 16),

                    // ==========================================
                    // 4. MATERIALS CONSUMED ON SITE TODAY
                    // ==========================================
                    _buildSectionCard(
                      title: "MATERIALS CONSUMED ON SITE TODAY",
                      icon: Icons.inventory_2_outlined,
                      cardBg: cardBg,
                      borderColor: borderColor,
                      textPrimary: textPrimary,
                      textSecondary: textSecondary,
                      trailing: TextButton.icon(
                        onPressed: () {
                          setState(() {
                            _materials.add(_MaterialRowData(
                              itemCtrl: TextEditingController(),
                              quantityCtrl: TextEditingController(text: '1'),
                              unit: 'Nos',
                            ));
                          });
                        },
                        icon: const Icon(Icons.add, size: 16, color: AppColors.brandPrimary),
                        label: const Text(
                          "Add Item",
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: AppColors.brandPrimary,
                          ),
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            "Structured items with quantities and units for inventory tracking",
                            style: TextStyle(fontSize: 11, color: textSecondary),
                          ),
                          const SizedBox(height: 12),
                          if (_materials.isEmpty)
                            Padding(
                              padding: const EdgeInsets.symmetric(vertical: 8),
                              child: Text(
                                "No materials recorded today.",
                                style: TextStyle(fontSize: 12, color: textSecondary, fontStyle: FontStyle.italic),
                              ),
                            )
                          else
                            ...List.generate(_materials.length, (idx) {
                              final item = _materials[idx];
                              return Padding(
                                padding: const EdgeInsets.only(bottom: 10),
                                child: Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    // Item Name / Dropdown or Autocomplete
                                    Expanded(
                                      flex: 5,
                                      child: _buildMaterialItemInput(
                                        item,
                                        isDark: isDark,
                                        borderColor: borderColor,
                                        textPrimary: textPrimary,
                                        textSecondary: textSecondary,
                                      ),
                                    ),
                                    const SizedBox(width: 8),

                                    // Quantity
                                    Expanded(
                                      flex: 2,
                                      child: TextFormField(
                                        controller: item.quantityCtrl,
                                        keyboardType: TextInputType.number,
                                        style: TextStyle(fontSize: 12, color: textPrimary),
                                        decoration: InputDecoration(
                                          hintText: "Qty",
                                          hintStyle: TextStyle(fontSize: 11, color: textSecondary),
                                          filled: true,
                                          fillColor: isDark ? const Color(0xFF1E1E1E) : Colors.white,
                                          contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 10),
                                          border: OutlineInputBorder(
                                            borderRadius: BorderRadius.circular(6),
                                            borderSide: BorderSide(color: borderColor),
                                          ),
                                          enabledBorder: OutlineInputBorder(
                                            borderRadius: BorderRadius.circular(6),
                                            borderSide: BorderSide(color: borderColor),
                                          ),
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 8),

                                    // Unit Dropdown
                                    Expanded(
                                      flex: 3,
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 6),
                                        decoration: BoxDecoration(
                                          color: isDark ? const Color(0xFF1E1E1E) : Colors.white,
                                          borderRadius: BorderRadius.circular(6),
                                          border: Border.all(color: borderColor),
                                        ),
                                        child: DropdownButtonHideUnderline(
                                          child: DropdownButton<String>(
                                            value: item.unit,
                                            isExpanded: true,
                                            dropdownColor: cardBg,
                                            items: _unitOptions.map((u) {
                                              return DropdownMenuItem<String>(
                                                value: u,
                                                child: Text(
                                                  u,
                                                  style: TextStyle(fontSize: 11, color: textPrimary),
                                                ),
                                              );
                                            }).toList(),
                                            onChanged: (val) {
                                              if (val != null) setState(() => item.unit = val);
                                            },
                                          ),
                                        ),
                                      ),
                                    ),

                                    // Delete Row
                                    IconButton(
                                      onPressed: () {
                                        setState(() {
                                          item.dispose();
                                          _materials.removeAt(idx);
                                        });
                                      },
                                      icon: const Icon(Icons.delete_outline_rounded, size: 18, color: AppColors.errorRed),
                                      splashRadius: 18,
                                      padding: const EdgeInsets.all(6),
                                    ),
                                  ],
                                ),
                              );
                            }),
                        ],
                      ),
                    ),

                    const SizedBox(height: 16),

                    // ==========================================
                    // 5. ROOFTOP SAFETY COMPLIANCE CHECKLIST
                    // ==========================================
                    _buildSectionCard(
                      title: "ROOFTOP SAFETY COMPLIANCE CHECKLIST",
                      icon: Icons.security_rounded,
                      cardBg: cardBg,
                      borderColor: borderColor,
                      textPrimary: textPrimary,
                      textSecondary: textSecondary,
                      child: Column(
                        children: [
                          _buildSafetyCheckbox(
                            "Full Body Safety Harness Worn",
                            _harness,
                            (val) => setState(() => _harness = val),
                            isDark: isDark,
                            textPrimary: textPrimary,
                          ),
                          _buildSafetyCheckbox(
                            "Safety Helmets (Hard Hats) Worn",
                            _helmet,
                            (val) => setState(() => _helmet = val),
                            isDark: isDark,
                            textPrimary: textPrimary,
                          ),
                          _buildSafetyCheckbox(
                            "Safety Shoes Worn",
                            _shoes,
                            (val) => setState(() => _shoes = val),
                            isDark: isDark,
                            textPrimary: textPrimary,
                          ),
                          _buildSafetyCheckbox(
                            "Rooftop Lifeline / Rope Anchor Secured",
                            _lifeline,
                            (val) => setState(() => _lifeline = val),
                            isDark: isDark,
                            textPrimary: textPrimary,
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 16),

                    // ==========================================
                    // 6. PROJECT PROGRESS & VERIFICATION
                    // ==========================================
                    _buildSectionCard(
                      title: "PROJECT PROGRESS & VERIFICATION",
                      icon: Icons.speed_rounded,
                      cardBg: cardBg,
                      borderColor: borderColor,
                      textPrimary: textPrimary,
                      textSecondary: textSecondary,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      "Overall Project Progress (%) *",
                                      style: TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.w700,
                                        color: textPrimary,
                                      ),
                                    ),
                                    const SizedBox(height: 6),
                                    TextFormField(
                                      controller: _progressPercentCtrl,
                                      keyboardType: TextInputType.number,
                                      style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: textPrimary),
                                      decoration: InputDecoration(
                                        hintText: "e.g. 20",
                                        suffixText: "%",
                                        suffixStyle: TextStyle(fontWeight: FontWeight.w800, color: textSecondary),
                                        filled: true,
                                        fillColor: isDark ? const Color(0xFF1E1E1E) : Colors.white,
                                        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                                        border: OutlineInputBorder(
                                          borderRadius: BorderRadius.circular(8),
                                          borderSide: BorderSide(color: borderColor),
                                        ),
                                        enabledBorder: OutlineInputBorder(
                                          borderRadius: BorderRadius.circular(8),
                                          borderSide: BorderSide(color: borderColor),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Text(
                            "Target milestone for $_selectedPhase is ~$currentTarget%",
                            style: TextStyle(fontSize: 11, color: textSecondary, fontStyle: FontStyle.italic),
                          ),
                          const SizedBox(height: 14),

                          // Supervisor Signoff Checkbox
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                            decoration: BoxDecoration(
                              color: isDark ? const Color(0xFF182218) : const Color(0xFFECFDF5),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(
                                color: isDark ? const Color(0xFF1A3E26) : const Color(0xFFA7F3D0),
                              ),
                            ),
                            child: Row(
                              children: [
                                Checkbox(
                                  value: _supervisorSignoff,
                                  onChanged: (val) => setState(() => _supervisorSignoff = val ?? false),
                                  activeColor: AppColors.emeraldGreen,
                                  materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        "Supervisor Sign-Off & Verification",
                                        style: TextStyle(
                                          fontSize: 13,
                                          fontWeight: FontWeight.w700,
                                          color: isDark ? const Color(0xFF86EFAC) : const Color(0xFF065F46),
                                        ),
                                      ),
                                      Text(
                                        "Confirms quality standards meet DISCOM norms",
                                        style: TextStyle(
                                          fontSize: 11,
                                          color: isDark ? const Color(0xFF6EE7B7) : const Color(0xFF047857),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 16),

                          // Supervisor Digital Signature Capture
                          SignatureCaptureWidget(
                            label: "Supervisor Digital Signature (Draw or Upload)",
                            helperText: "Sign digitally using touchscreen or upload signature image",
                            initialDataUrl: _signatureData,
                            onSignatureChanged: (dataUrl) {
                              _signatureData = dataUrl;
                            },
                            isDark: isDark,
                            cardBg: cardBg,
                            surfaceBg: surfaceBg,
                            borderColor: borderColor,
                            textPrimary: textPrimary,
                            textSecondary: textSecondary,
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 16),

                    // ==========================================
                    // 7. ISSUES FACED / FIELD ROADBLOCKS
                    // ==========================================
                    _buildSectionCard(
                      title: "ISSUES FACED / FIELD ROADBLOCKS",
                      icon: Icons.warning_amber_rounded,
                      cardBg: cardBg,
                      borderColor: borderColor,
                      textPrimary: textPrimary,
                      textSecondary: textSecondary,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          TextFormField(
                            controller: _issuesCtrl,
                            maxLines: 3,
                            style: TextStyle(fontSize: 13, color: textPrimary),
                            decoration: InputDecoration(
                              hintText: "Any issues encountered, e.g. broken tiles, shadow interference, material shortage...",
                              hintStyle: TextStyle(fontSize: 12, color: textSecondary.withValues(alpha: 0.7)),
                              filled: true,
                              fillColor: isDark ? const Color(0xFF1E1E1E) : Colors.white,
                              contentPadding: const EdgeInsets.all(12),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(8),
                                borderSide: BorderSide(color: borderColor),
                              ),
                              enabledBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(8),
                                borderSide: BorderSide(color: borderColor),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 16),

                    // ==========================================
                    // 8. SITE PHOTOS PICKER (UP TO 10 WITH BEFORE/AFTER CAPTIONS)
                    // ==========================================
                    _buildSectionCard(
                      title: "SITE PHOTOS (UP TO 10 WITH CAPTIONS)",
                      icon: Icons.photo_camera_rounded,
                      cardBg: cardBg,
                      borderColor: borderColor,
                      textPrimary: textPrimary,
                      textSecondary: textSecondary,
                      trailing: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          if (_isCapturingGeoPhoto)
                            const Padding(
                              padding: EdgeInsets.only(right: 8),
                              child: SizedBox(
                                width: 16,
                                height: 16,
                                child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.brandPrimary),
                              ),
                            ),
                          IconButton(
                            onPressed: _isCapturingGeoPhoto ? null : () => _pickPhotos(ImageSource.camera),
                            icon: const Icon(Icons.camera_alt_rounded, size: 20, color: AppColors.brandPrimary),
                            splashRadius: 20,
                            tooltip: "Geo Camera (GPS & Watermark)",
                          ),
                          IconButton(
                            onPressed: () => _pickPhotos(ImageSource.gallery),
                            icon: const Icon(Icons.photo_library_rounded, size: 20, color: AppColors.brandPrimary),
                            splashRadius: 20,
                            tooltip: "Pick from Gallery",
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          if (_photoUploadErrorMessage != null) ...[
                            Container(
                              margin: const EdgeInsets.only(bottom: 12),
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: AppColors.solarGold.withValues(alpha: 0.12),
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(color: AppColors.solarGold.withValues(alpha: 0.5)),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      const Icon(Icons.warning_amber_rounded, color: AppColors.solarGold, size: 20),
                                      const SizedBox(width: 8),
                                      Expanded(
                                        child: Text(
                                          "Log Saved, Photos Upload Failed",
                                          style: TextStyle(
                                            fontSize: 13,
                                            fontWeight: FontWeight.w800,
                                            color: textPrimary,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 6),
                                  Text(
                                    "Daily log text was saved (Log #$_savedLogId), but photo upload failed: $_photoUploadErrorMessage. Photos are retained below.",
                                    style: TextStyle(fontSize: 11.5, color: textSecondary, height: 1.3),
                                  ),
                                  const SizedBox(height: 10),
                                  SizedBox(
                                    width: double.infinity,
                                    child: ElevatedButton.icon(
                                      onPressed: _isRetryingPhotos ? null : _retryFailedPhotos,
                                      icon: _isRetryingPhotos
                                          ? const SizedBox(
                                              width: 14,
                                              height: 14,
                                              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black),
                                            )
                                          : const Icon(Icons.refresh_rounded, size: 16),
                                      label: Text(
                                        _isRetryingPhotos
                                            ? "Retrying Upload..."
                                            : "Retry Photo Upload (${_photoEntries.where((p) => !p.isUploaded).length} Remaining)",
                                        style: const TextStyle(fontWeight: FontWeight.w800),
                                      ),
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: AppColors.solarGold,
                                        foregroundColor: Colors.black,
                                        padding: const EdgeInsets.symmetric(vertical: 10),
                                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                            decoration: BoxDecoration(
                              color: isDark ? const Color(0xFF1E293B) : const Color(0xFFEFF6FF),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(
                                color: isDark ? const Color(0xFF334155) : const Color(0xFFBFDBFE),
                              ),
                            ),
                            child: Row(
                              children: [
                                const Icon(Icons.location_on_rounded, size: 16, color: Color(0xFF2563EB)),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    "Geo Camera: Camera photos are automatically watermarked with GPS coordinates, Date/Time & 'Powered by SolOps'.",
                                    style: TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w600,
                                      color: isDark ? const Color(0xFF93C5FD) : const Color(0xFF1E40AF),
                                      height: 1.3,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 12),

                          if (_photoEntries.isEmpty)
                            Padding(
                              padding: const EdgeInsets.symmetric(vertical: 12),
                              child: Center(
                                child: Column(
                                  children: [
                                    Icon(Icons.add_a_photo_outlined, size: 32, color: textSecondary.withValues(alpha: 0.6)),
                                    const SizedBox(height: 6),
                                    Text(
                                      "No photos added yet. Tap Camera for Geo-tagged photos or Gallery to upload.",
                                      style: TextStyle(fontSize: 12, color: textSecondary, fontStyle: FontStyle.italic),
                                      textAlign: TextAlign.center,
                                    ),
                                  ],
                                ),
                              ),
                            )
                          else
                            ...List.generate(_photoEntries.length, (idx) {
                              final entry = _photoEntries[idx];
                              return Container(
                                margin: const EdgeInsets.only(bottom: 12),
                                padding: const EdgeInsets.all(10),
                                decoration: BoxDecoration(
                                  color: isDark ? const Color(0xFF1A1A1A) : Colors.white,
                                  borderRadius: BorderRadius.circular(10),
                                  border: Border.all(color: borderColor),
                                ),
                                child: Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    // Image Thumbnail with Geo badge (Clickable to preview)
                                    InkWell(
                                      onTap: () => _showPhotoPreviewDialog(context, entry, idx),
                                      borderRadius: BorderRadius.circular(8),
                                      child: Stack(
                                        children: [
                                          ClipRRect(
                                            borderRadius: BorderRadius.circular(8),
                                            child: Image.file(
                                              entry.file,
                                              width: 76,
                                              height: 76,
                                              fit: BoxFit.cover,
                                            ),
                                          ),
                                          Positioned(
                                            bottom: 2,
                                            left: 2,
                                            right: 2,
                                            child: Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                                              decoration: BoxDecoration(
                                                color: entry.isVerified
                                                    ? const Color(0xFF065F46)
                                                    : (entry.isGallery
                                                        ? const Color(0xFF334155)
                                                        : const Color(0xFF78350F)),
                                                borderRadius: BorderRadius.circular(4),
                                              ),
                                              child: Row(
                                                mainAxisSize: MainAxisSize.min,
                                                mainAxisAlignment: MainAxisAlignment.center,
                                                children: [
                                                  Icon(
                                                    entry.isVerified
                                                        ? Icons.verified_rounded
                                                        : (entry.isGallery
                                                            ? Icons.photo_library_outlined
                                                            : Icons.location_off_rounded),
                                                    size: 9,
                                                    color: Colors.white,
                                                  ),
                                                  const SizedBox(width: 2),
                                                  Flexible(
                                                    child: Text(
                                                      entry.isVerified
                                                          ? "Verified"
                                                          : (entry.isGallery ? "Gallery" : "Unverified"),
                                                      style: const TextStyle(
                                                        fontSize: 8.5,
                                                        color: Colors.white,
                                                        fontWeight: FontWeight.bold,
                                                      ),
                                                      maxLines: 1,
                                                      overflow: TextOverflow.ellipsis,
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                    const SizedBox(width: 10),

                                    // Tag selector & Caption input
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          // Tag dropdown
                                          Row(
                                            children: [
                                              Container(
                                                height: 28,
                                                padding: const EdgeInsets.symmetric(horizontal: 8),
                                                decoration: BoxDecoration(
                                                  color: isDark ? const Color(0xFF242424) : const Color(0xFFF8FAFC),
                                                  borderRadius: BorderRadius.circular(6),
                                                  border: Border.all(color: borderColor),
                                                ),
                                                child: DropdownButtonHideUnderline(
                                                  child: DropdownButton<String>(
                                                    value: entry.tag,
                                                    style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: textPrimary),
                                                    dropdownColor: cardBg,
                                                    items: const [
                                                      DropdownMenuItem(value: 'Before', child: Text('Tag: Before')),
                                                      DropdownMenuItem(value: 'During', child: Text('Tag: During')),
                                                      DropdownMenuItem(value: 'After', child: Text('Tag: After')),
                                                      DropdownMenuItem(value: 'Structure', child: Text('Tag: Structure')),
                                                      DropdownMenuItem(value: 'Inverter', child: Text('Tag: Inverter')),
                                                      DropdownMenuItem(value: 'Earthing', child: Text('Tag: Earthing')),
                                                    ],
                                                    onChanged: (val) {
                                                      if (val != null) setState(() => entry.tag = val);
                                                    },
                                                  ),
                                                ),
                                              ),
                                              const Spacer(),
                                              // Remove photo
                                              IconButton(
                                                onPressed: () {
                                                  setState(() {
                                                    entry.dispose();
                                                    _photoEntries.removeAt(idx);
                                                  });
                                                },
                                                icon: const Icon(Icons.close_rounded, size: 16, color: AppColors.errorRed),
                                                padding: EdgeInsets.zero,
                                                constraints: const BoxConstraints(),
                                                splashRadius: 16,
                                              ),
                                            ],
                                          ),
                                          const SizedBox(height: 6),

                                          // Caption input
                                          TextFormField(
                                            controller: entry.captionCtrl,
                                            style: TextStyle(fontSize: 11.5, color: textPrimary),
                                            decoration: InputDecoration(
                                              hintText: "Caption (e.g. Before panel placement, Earthing pit...)",
                                              hintStyle: TextStyle(fontSize: 11, color: textSecondary.withValues(alpha: 0.7)),
                                              filled: true,
                                              fillColor: isDark ? const Color(0xFF242424) : const Color(0xFFF8FAFC),
                                              contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                                              isDense: true,
                                              border: OutlineInputBorder(
                                                borderRadius: BorderRadius.circular(6),
                                                borderSide: BorderSide(color: borderColor),
                                              ),
                                              enabledBorder: OutlineInputBorder(
                                                borderRadius: BorderRadius.circular(6),
                                                borderSide: BorderSide(color: borderColor),
                                              ),
                                            ),
                                          ),
                                          const SizedBox(height: 4),

                                          // Click to preview full photo
                                          InkWell(
                                            onTap: () => _showPhotoPreviewDialog(context, entry, idx),
                                            borderRadius: BorderRadius.circular(6),
                                            child: Container(
                                              margin: const EdgeInsets.only(top: 4),
                                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
                                              decoration: BoxDecoration(
                                                color: isDark ? const Color(0xFF1E293B) : const Color(0xFFEFF6FF),
                                                borderRadius: BorderRadius.circular(6),
                                                border: Border.all(color: const Color(0xFF3B82F6).withValues(alpha: 0.5)),
                                              ),
                                              child: Row(
                                                mainAxisSize: MainAxisSize.min,
                                                children: const [
                                                  Icon(Icons.zoom_in_rounded, size: 14, color: Color(0xFF38BDF8)),
                                                  SizedBox(width: 5),
                                                  Text(
                                                    "Preview Watermarked Photo",
                                                    style: TextStyle(
                                                      fontSize: 11,
                                                      fontWeight: FontWeight.w700,
                                                      color: Color(0xFF38BDF8),
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              );
                            }),
                        ],
                      ),
                    ),

                    const SizedBox(height: 24),
                  ],
                ),
              ),
            ),

            // Footer Actions
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: cardBg,
                border: Border(top: BorderSide(color: borderColor)),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: (_isSubmitting || _isRetryingPhotos) ? null : () => Navigator.of(context).pop(),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: textSecondary,
                        side: BorderSide(color: borderColor),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                      child: Text(
                        _savedLogId != null && _photoEntries.any((p) => !p.isUploaded) ? "Finish Later" : "Cancel",
                        style: const TextStyle(fontWeight: FontWeight.w600),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    flex: 2,
                    child: ElevatedButton(
                      onPressed: (_isSubmitting || _isRetryingPhotos) ? null : _saveLog,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _savedLogId != null && _photoEntries.any((p) => !p.isUploaded)
                            ? AppColors.solarGold
                            : const Color(0xFF005BAC),
                        foregroundColor: _savedLogId != null && _photoEntries.any((p) => !p.isUploaded)
                            ? Colors.black
                            : Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        elevation: 1,
                      ),
                      child: _isSubmitting || _isRetryingPhotos
                          ? SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: _savedLogId != null && _photoEntries.any((p) => !p.isUploaded)
                                    ? Colors.black
                                    : Colors.white,
                              ),
                            )
                          : Text(
                              _savedLogId != null && _photoEntries.any((p) => !p.isUploaded)
                                  ? "Retry Photo Upload (${_photoEntries.where((p) => !p.isUploaded).length})"
                                  : (widget.existingLog != null ? "Update Daily Log" : "Save Daily Log"),
                              style: const TextStyle(fontWeight: FontWeight.w800),
                            ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionCard({
    required String title,
    required IconData icon,
    required Color cardBg,
    required Color borderColor,
    required Color textPrimary,
    required Color textSecondary,
    Widget? trailing,
    required Widget child,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: borderColor),
      ),
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 16, color: AppColors.brandPrimary),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  title,
                  style: TextStyle(
                    fontSize: 11.5,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 0.5,
                    color: textPrimary,
                  ),
                ),
              ),
              ?trailing,
            ],
          ),
          const SizedBox(height: 12),
          child,
        ],
      ),
    );
  }

  Widget _buildDateField({
    required String label,
    required TextEditingController controller,
    required bool isDark,
    required Color borderColor,
    required Color textPrimary,
    required Color textSecondary,
    required VoidCallback onTap,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700, color: textPrimary),
        ),
        const SizedBox(height: 6),
        InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(8),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF1E1E1E) : Colors.white,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: borderColor),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    controller.text.isEmpty ? "Select date" : controller.text,
                    style: TextStyle(
                      fontSize: 12.5,
                      fontWeight: FontWeight.w600,
                      color: controller.text.isEmpty ? textSecondary : textPrimary,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                Icon(Icons.calendar_month_rounded, size: 16, color: textSecondary),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildTextField({
    required String label,
    required String hint,
    required TextEditingController controller,
    required bool isDark,
    required Color borderColor,
    required Color textPrimary,
    required Color textSecondary,
    TextInputType keyboardType = TextInputType.text,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: textPrimary),
        ),
        const SizedBox(height: 6),
        TextFormField(
          controller: controller,
          keyboardType: keyboardType,
          style: TextStyle(fontSize: 13, color: textPrimary),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: TextStyle(fontSize: 12, color: textSecondary.withValues(alpha: 0.7)),
            filled: true,
            fillColor: isDark ? const Color(0xFF1E1E1E) : Colors.white,
            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: BorderSide(color: borderColor),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: BorderSide(color: borderColor),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildMaterialItemInput(
    _MaterialRowData item, {
    required bool isDark,
    required Color borderColor,
    required Color textPrimary,
    required Color textSecondary,
  }) {
    return Autocomplete<String>(
      initialValue: TextEditingValue(text: item.itemCtrl.text),
      optionsBuilder: (TextEditingValue textEditingValue) {
        if (textEditingValue.text.isEmpty) {
          return _commonMaterials;
        }
        return _commonMaterials.where((option) {
          return option.toLowerCase().contains(textEditingValue.text.toLowerCase());
        });
      },
      onSelected: (String selection) {
        setState(() {
          if (selection == 'Custom Item / Other') {
            item.itemCtrl.text = '';
          } else {
            item.itemCtrl.text = selection;
          }
        });
      },
      fieldViewBuilder: (context, textEditingController, focusNode, onFieldSubmitted) {
        // Sync itemCtrl with textEditingController
        textEditingController.addListener(() {
          item.itemCtrl.text = textEditingController.text;
        });
        return TextFormField(
          controller: textEditingController,
          focusNode: focusNode,
          style: TextStyle(fontSize: 12, color: textPrimary),
          decoration: InputDecoration(
            hintText: "Material Item / Select...",
            hintStyle: TextStyle(fontSize: 11, color: textSecondary),
            filled: true,
            fillColor: isDark ? const Color(0xFF1E1E1E) : Colors.white,
            contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(6),
              borderSide: BorderSide(color: borderColor),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(6),
              borderSide: BorderSide(color: borderColor),
            ),
          ),
        );
      },
      optionsViewBuilder: (context, onSelected, options) {
        return Align(
          alignment: Alignment.topLeft,
          child: Material(
            elevation: 4,
            borderRadius: BorderRadius.circular(8),
            color: isDark ? const Color(0xFF1A1A1A) : Colors.white,
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxHeight: 200, maxWidth: 300),
              child: ListView.builder(
                padding: EdgeInsets.zero,
                shrinkWrap: true,
                itemCount: options.length,
                itemBuilder: (context, index) {
                  final option = options.elementAt(index);
                  return InkWell(
                    onTap: () => onSelected(option),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      child: Text(
                        option,
                        style: TextStyle(fontSize: 12, color: textPrimary),
                      ),
                    ),
                  );
                },
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildSafetyCheckbox(
    String label,
    bool value,
    ValueChanged<bool> onChanged, {
    required bool isDark,
    required Color textPrimary,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: InkWell(
        onTap: () => onChanged(!value),
        borderRadius: BorderRadius.circular(6),
        child: Row(
          children: [
            Checkbox(
              value: value,
              onChanged: (val) => onChanged(val ?? false),
              activeColor: AppColors.emeraldGreen,
              materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
            ),
            const SizedBox(width: 6),
            Expanded(
              child: Text(
                label,
                style: TextStyle(
                  fontSize: 12.5,
                  fontWeight: FontWeight.w600,
                  color: textPrimary,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showPhotoPreviewDialog(BuildContext context, _PhotoEntry entry, int index) {
    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => Dialog(
          backgroundColor: const Color(0xFF0F172A),
          insetPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 16),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          clipBehavior: Clip.antiAlias,
          child: ConstrainedBox(
            constraints: BoxConstraints(
              maxHeight: MediaQuery.of(context).size.height * 0.85,
            ),
            child: SingleChildScrollView(
              physics: const ClampingScrollPhysics(),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Header (clean, no emojis)
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: entry.isVerified
                                ? const Color(0xFF065F46)
                                : (entry.isGallery ? const Color(0xFF334155) : const Color(0xFF78350F)),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                entry.isVerified
                                    ? Icons.verified_rounded
                                    : (entry.isGallery ? Icons.photo_library_outlined : Icons.location_off_rounded),
                                size: 13,
                                color: entry.isVerified
                                    ? const Color(0xFF34D399)
                                    : (entry.isGallery ? const Color(0xFF94A3B8) : const Color(0xFFFCD34D)),
                              ),
                              const SizedBox(width: 4),
                              Text(
                                entry.isVerified
                                    ? "Verified Geotagged Photo"
                                    : (entry.isGallery
                                        ? "Gallery Photo (Unverified Location & Time)"
                                        : "Standard Photo (Unverified Location)"),
                                style: const TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const Spacer(),
                        IconButton(
                          onPressed: () => Navigator.of(ctx).pop(),
                          icon: const Icon(Icons.close, color: Colors.white70, size: 20),
                          padding: EdgeInsets.zero,
                          constraints: const BoxConstraints(),
                        ),
                      ],
                    ),
                  ),

                  // Image preview with zoom/pan & orientation-safe contain
                  ConstrainedBox(
                    constraints: BoxConstraints(
                      maxHeight: MediaQuery.of(context).size.height * 0.44,
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: InteractiveViewer(
                        minScale: 1.0,
                        maxScale: 5.0,
                        child: Image.file(
                          entry.file,
                          fit: BoxFit.contain,
                        ),
                      ),
                    ),
                  ),

                  // Metadata inspection card
                  Container(
                    margin: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: const Color(0xFF1E293B),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: const Color(0xFF334155)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Location row
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Icon(
                              entry.isVerified ? Icons.location_on : Icons.location_off_rounded,
                              size: 14,
                              color: entry.isVerified ? const Color(0xFFFACC15) : const Color(0xFF94A3B8),
                            ),
                            const SizedBox(width: 6),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    entry.gpsInfo ??
                                        (entry.isVerified ? "Verified Site Location" : "Location Unverified"),
                                    style: const TextStyle(
                                      fontSize: 11,
                                      color: Colors.white,
                                      fontWeight: FontWeight.w600,
                                      height: 1.25,
                                    ),
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  if (entry.latitude != null && entry.longitude != null) ...[
                                    const SizedBox(height: 2),
                                    Text(
                                      "Lat: ${entry.latitude!.toStringAsFixed(6)}°, Long: ${entry.longitude!.toStringAsFixed(6)}°${entry.accuracyMeters != null ? ' (±${entry.accuracyMeters!.toInt()}m)' : ''}",
                                      style: const TextStyle(
                                        fontSize: 10,
                                        color: Color(0xFFFACC15),
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        const Divider(color: Color(0xFF334155), height: 1),
                        const SizedBox(height: 6),

                        // Timestamp & Verification Note
                        Row(
                          children: [
                            const Icon(Icons.access_time_rounded, size: 13, color: Color(0xFF94A3B8)),
                            const SizedBox(width: 6),
                            Expanded(
                              child: Text(
                                entry.capturedAt != null
                                    ? "Captured: ${GeoCameraHelper.formatCaptureTime(entry.capturedAt!)}"
                                    : (entry.isGallery
                                        ? "Imported from device gallery"
                                        : "Timestamp not recorded"),
                                style: const TextStyle(
                                  fontSize: 10.5,
                                  color: Color(0xFFE2E8F0),
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ),
                          ],
                        ),
                        if (entry.verificationNote != null && entry.verificationNote!.isNotEmpty) ...[
                          const SizedBox(height: 4),
                          Text(
                            "Status: ${entry.verificationNote!}",
                            style: TextStyle(
                              fontSize: 10,
                              fontStyle: FontStyle.italic,
                              color: entry.isVerified ? const Color(0xFF34D399) : const Color(0xFFFCD34D),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),

                // Details & Caption area
                Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Text(
                            "Tag: ",
                            style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold),
                          ),
                          Container(
                            height: 28,
                            padding: const EdgeInsets.symmetric(horizontal: 8),
                            decoration: BoxDecoration(
                              color: const Color(0xFF1E293B),
                              borderRadius: BorderRadius.circular(6),
                              border: Border.all(color: const Color(0xFF334155)),
                            ),
                            child: DropdownButtonHideUnderline(
                              child: DropdownButton<String>(
                                value: entry.tag,
                                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Colors.white),
                                dropdownColor: const Color(0xFF1E293B),
                                items: const [
                                  DropdownMenuItem(value: 'Before', child: Text('Before')),
                                  DropdownMenuItem(value: 'During', child: Text('During')),
                                  DropdownMenuItem(value: 'After', child: Text('After')),
                                  DropdownMenuItem(value: 'Structure', child: Text('Structure')),
                                  DropdownMenuItem(value: 'Inverter', child: Text('Inverter')),
                                  DropdownMenuItem(value: 'Earthing', child: Text('Earthing')),
                                ],
                                onChanged: (val) {
                                  if (val != null) {
                                    setState(() => entry.tag = val);
                                    setDialogState(() {});
                                  }
                                },
                              ),
                            ),
                          ),
                          const Spacer(),
                          TextButton.icon(
                            onPressed: () {
                              setState(() {
                                entry.dispose();
                                _photoEntries.removeAt(index);
                              });
                              Navigator.of(ctx).pop();
                            },
                            icon: const Icon(Icons.delete_outline, size: 16, color: AppColors.errorRed),
                            label: const Text("Delete", style: TextStyle(color: AppColors.errorRed, fontSize: 12)),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      TextFormField(
                        controller: entry.captionCtrl,
                        style: const TextStyle(fontSize: 12, color: Colors.white),
                        decoration: InputDecoration(
                          hintText: "Add photo caption...",
                          hintStyle: const TextStyle(fontSize: 11, color: Colors.white38),
                          filled: true,
                          fillColor: const Color(0xFF1E293B),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                          isDense: true,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(6),
                            borderSide: const BorderSide(color: Color(0xFF334155)),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(6),
                            borderSide: const BorderSide(color: Color(0xFF334155)),
                          ),
                        ),
                        onChanged: (val) {
                          setState(() {});
                        },
                      ),
                      const SizedBox(height: 10),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: () => Navigator.of(ctx).pop(),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF005BAC),
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 10),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                          ),
                          child: const Text("Confirm & Use Photo", style: TextStyle(fontWeight: FontWeight.w800, fontSize: 12)),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    ),
  );
  }
}

class _MaterialRowData {
  final TextEditingController itemCtrl;
  final TextEditingController quantityCtrl;
  String unit;

  _MaterialRowData({
    required this.itemCtrl,
    required this.quantityCtrl,
    this.unit = "Nos",
  });

  void dispose() {
    itemCtrl.dispose();
    quantityCtrl.dispose();
  }
}

class _PhotoEntry {
  final File file;
  final TextEditingController captionCtrl;
  String tag;
  final bool isGeoTagged;
  final String? gpsInfo;
  final double? latitude;
  final double? longitude;
  final double? accuracyMeters;
  final DateTime? capturedAt;
  final bool isVerified;
  final String? verificationNote;
  final bool isGallery;
  bool isUploaded;

  _PhotoEntry({
    required this.file,
    required this.captionCtrl,
    this.tag = 'During',
    this.isGeoTagged = false,
    this.gpsInfo,
    this.latitude,
    this.longitude,
    this.accuracyMeters,
    this.capturedAt,
    this.isVerified = false,
    this.verificationNote,
    this.isGallery = false,
  }) : isUploaded = false;

  void dispose() {
    captionCtrl.dispose();
  }
}
