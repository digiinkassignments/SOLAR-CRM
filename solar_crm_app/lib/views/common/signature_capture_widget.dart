import 'dart:convert';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../../core/constants/app_colors.dart';

class SignatureCaptureWidget extends StatefulWidget {
  final String? initialDataUrl;
  final ValueChanged<String?> onSignatureChanged;
  final String label;
  final String helperText;
  final bool isDark;
  final Color cardBg;
  final Color surfaceBg;
  final Color borderColor;
  final Color textPrimary;
  final Color textSecondary;

  const SignatureCaptureWidget({
    super.key,
    this.initialDataUrl,
    required this.onSignatureChanged,
    this.label = "Customer / Representative Signature",
    this.helperText = "Sign digitally using touchscreen/stylus or upload signature image",
    required this.isDark,
    required this.cardBg,
    required this.surfaceBg,
    required this.borderColor,
    required this.textPrimary,
    required this.textSecondary,
  });

  @override
  State<SignatureCaptureWidget> createState() => _SignatureCaptureWidgetState();
}

class _SignatureCaptureWidgetState extends State<SignatureCaptureWidget> {
  int _selectedTab = 0; // 0 = Sign on Screen, 1 = Upload Signature Image
  final List<List<Offset>> _strokes = [];
  String? _currentSignatureUrl;
  bool _isExporting = false;

  @override
  void initState() {
    super.initState();
    _currentSignatureUrl = widget.initialDataUrl;
  }

  void _clearCanvas() {
    setState(() {
      _strokes.clear();
      _currentSignatureUrl = null;
    });
    widget.onSignatureChanged(null);
  }

  Future<void> _exportSignature() async {
    if (_strokes.isEmpty) return;

    setState(() => _isExporting = true);
    try {
      final recorder = ui.PictureRecorder();
      final canvas = ui.Canvas(recorder);

      const double width = 400;
      const double height = 160;

      // Transparent or subtle white background for contrast
      final bgPaint = Paint()..color = Colors.white;
      canvas.drawRect(const Rect.fromLTWH(0, 0, width, height), bgPaint);

      // Stroke paint
      final strokePaint = Paint()
        ..color = const Color(0xFF0F172A)
        ..strokeWidth = 3.0
        ..strokeCap = StrokeCap.round
        ..strokeJoin = StrokeJoin.round
        ..style = PaintingStyle.stroke;

      for (final stroke in _strokes) {
        if (stroke.length < 2) {
          if (stroke.isNotEmpty) {
            canvas.drawCircle(stroke.first, 1.5, strokePaint..style = PaintingStyle.fill);
            strokePaint.style = PaintingStyle.stroke;
          }
          continue;
        }

        final path = Path();
        path.moveTo(stroke[0].dx, stroke[0].dy);
        for (int i = 1; i < stroke.length; i++) {
          path.lineTo(stroke[i].dx, stroke[i].dy);
        }
        canvas.drawPath(path, strokePaint);
      }

      final picture = recorder.endRecording();
      final img = await picture.toImage(width.toInt(), height.toInt());
      final byteData = await img.toByteData(format: ui.ImageByteFormat.png);

      if (byteData != null) {
        final base64String = base64Encode(byteData.buffer.asUint8List());
        final dataUrl = "data:image/png;base64,$base64String";
        setState(() {
          _currentSignatureUrl = dataUrl;
        });
        widget.onSignatureChanged(dataUrl);

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text("Signature confirmed successfully!"),
              backgroundColor: AppColors.emeraldGreen,
              duration: Duration(seconds: 2),
            ),
          );
        }
      }
    } catch (e) {
      debugPrint("Error exporting signature: $e");
    } finally {
      if (mounted) setState(() => _isExporting = false);
    }
  }

  Future<void> _pickSignatureImage(ImageSource source) async {
    try {
      final picker = ImagePicker();
      final picked = await picker.pickImage(
        source: source,
        maxWidth: 800,
        maxHeight: 400,
        imageQuality: 85,
      );

      if (picked != null) {
        final bytes = await picked.readAsBytes();
        final base64String = base64Encode(bytes);
        final mime = picked.path.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
        final dataUrl = "data:$mime;base64,$base64String";

        setState(() {
          _currentSignatureUrl = dataUrl;
          _strokes.clear();
        });
        widget.onSignatureChanged(dataUrl);

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text("Signature image uploaded!"),
              backgroundColor: AppColors.emeraldGreen,
              duration: Duration(seconds: 2),
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text("Failed to pick image: $e"),
            backgroundColor: AppColors.errorRed,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Label
        Text(
          widget.label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w700,
            color: widget.textPrimary,
          ),
        ),
        const SizedBox(height: 8),

        // Tabs Row: Sign on Screen vs Upload Signature Image
        Container(
          decoration: BoxDecoration(
            color: widget.surfaceBg,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: widget.borderColor),
          ),
          child: Row(
            children: [
              Expanded(
                child: InkWell(
                  onTap: () => setState(() => _selectedTab = 0),
                  borderRadius: const BorderRadius.horizontal(left: Radius.circular(8)),
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    decoration: BoxDecoration(
                      color: _selectedTab == 0
                          ? AppColors.brandPrimary.withValues(alpha: 0.15)
                          : Colors.transparent,
                      borderRadius: const BorderRadius.horizontal(left: Radius.circular(8)),
                      border: _selectedTab == 0
                          ? const Border(bottom: BorderSide(color: AppColors.brandPrimary, width: 2))
                          : null,
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.draw_rounded,
                          size: 14,
                          color: _selectedTab == 0 ? AppColors.brandPrimary : widget.textSecondary,
                        ),
                        const SizedBox(width: 6),
                        Text(
                          "Sign on Screen (Pad / Touch)",
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: _selectedTab == 0 ? FontWeight.w700 : FontWeight.w500,
                            color: _selectedTab == 0 ? AppColors.brandPrimary : widget.textSecondary,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              Expanded(
                child: InkWell(
                  onTap: () => setState(() => _selectedTab = 1),
                  borderRadius: const BorderRadius.horizontal(right: Radius.circular(8)),
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    decoration: BoxDecoration(
                      color: _selectedTab == 1
                          ? AppColors.brandPrimary.withValues(alpha: 0.15)
                          : Colors.transparent,
                      borderRadius: const BorderRadius.horizontal(right: Radius.circular(8)),
                      border: _selectedTab == 1
                          ? const Border(bottom: BorderSide(color: AppColors.brandPrimary, width: 2))
                          : null,
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.cloud_upload_outlined,
                          size: 14,
                          color: _selectedTab == 1 ? AppColors.brandPrimary : widget.textSecondary,
                        ),
                        const SizedBox(width: 6),
                        Text(
                          "Upload Signature Image",
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: _selectedTab == 1 ? FontWeight.w700 : FontWeight.w500,
                            color: _selectedTab == 1 ? AppColors.brandPrimary : widget.textSecondary,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 10),

        // Verified Signature Preview if already exists
        if (_currentSignatureUrl != null && _currentSignatureUrl!.isNotEmpty) ...[
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: widget.isDark ? const Color(0xFF0F291E) : const Color(0xFFF0FDF4),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: const Color(0xFF10B981)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Row(
                      children: [
                        Icon(Icons.check_circle_rounded, size: 16, color: Color(0xFF10B981)),
                        SizedBox(width: 6),
                        Text(
                          "Signature Captured & Verified",
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: Color(0xFF10B981),
                          ),
                        ),
                      ],
                    ),
                    InkWell(
                      onTap: _clearCanvas,
                      borderRadius: BorderRadius.circular(4),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        child: Text(
                          "Change / Clear",
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: widget.textSecondary,
                            decoration: TextDecoration.underline,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Container(
                  width: double.infinity,
                  height: 85,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(color: const Color(0xFFCBD5E1)),
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(6),
                    child: _currentSignatureUrl!.startsWith('data:image')
                        ? Image.memory(
                            base64Decode(_currentSignatureUrl!.split(',').last),
                            fit: BoxFit.contain,
                          )
                        : Image.network(
                            _currentSignatureUrl!,
                            fit: BoxFit.contain,
                            errorBuilder: (context, error, stackTrace) => const Center(
                              child: Icon(Icons.broken_image_rounded, color: Colors.grey),
                            ),
                          ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 10),
        ] else if (_selectedTab == 0) ...[
          // Tab 0: Drawing Canvas
          Container(
            height: 160,
            width: double.infinity,
            decoration: BoxDecoration(
              color: widget.surfaceBg,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: widget.borderColor),
            ),
            child: Stack(
              children: [
                // Baseline guide line with cross
                Positioned(
                  left: 20,
                  right: 20,
                  bottom: 30,
                  child: Row(
                    children: [
                      Text(
                        "✕",
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: widget.textSecondary.withValues(alpha: 0.4),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Container(
                          height: 1,
                          color: widget.borderColor.withValues(alpha: 0.8),
                        ),
                      ),
                    ],
                  ),
                ),

                // Placeholder if no strokes
                if (_strokes.isEmpty)
                  Center(
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.touch_app_outlined, size: 16, color: widget.textSecondary.withValues(alpha: 0.5)),
                        const SizedBox(width: 6),
                        Text(
                          "Click / touch and drag here to sign smoothly",
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w500,
                            color: widget.textSecondary.withValues(alpha: 0.6),
                          ),
                        ),
                      ],
                    ),
                  ),

                // GestureDetector for painting
                GestureDetector(
                  onPanStart: (details) {
                    setState(() {
                      _strokes.add([details.localPosition]);
                    });
                  },
                  onPanUpdate: (details) {
                    setState(() {
                      if (_strokes.isNotEmpty) {
                        _strokes.last.add(details.localPosition);
                      }
                    });
                  },
                  child: CustomPaint(
                    size: Size.infinite,
                    painter: _SignaturePainter(
                      strokes: _strokes,
                      color: widget.isDark ? Colors.white : const Color(0xFF0F172A),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),

          // Action Buttons: Clear Pad & Confirm Signature
          Row(
            children: [
              OutlinedButton.icon(
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  side: BorderSide(color: widget.borderColor),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                ),
                icon: Icon(Icons.refresh_rounded, size: 14, color: widget.textSecondary),
                label: Text(
                  "Clear Pad",
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: widget.textSecondary),
                ),
                onPressed: _strokes.isEmpty ? null : _clearCanvas,
              ),
              const SizedBox(width: 10),
              ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.brandPrimary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                  elevation: 0,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                ),
                icon: _isExporting
                    ? const SizedBox(
                        width: 12,
                        height: 12,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : const Icon(Icons.check_circle_outline_rounded, size: 14),
                label: Text(
                  _isExporting ? "Confirming..." : "Confirm Signature",
                  style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700),
                ),
                onPressed: (_strokes.isEmpty || _isExporting) ? null : _exportSignature,
              ),
            ],
          ),
        ] else ...[
          // Tab 1: Upload Signature Image
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: widget.surfaceBg,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: widget.borderColor, style: BorderStyle.solid),
            ),
            child: Column(
              children: [
                Icon(Icons.cloud_upload_outlined, size: 36, color: widget.textSecondary.withValues(alpha: 0.6)),
                const SizedBox(height: 8),
                Text(
                  "Upload Photo of Physical Signature",
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: widget.textPrimary),
                ),
                const SizedBox(height: 4),
                Text(
                  "Take a photo of paper signature or pick from gallery",
                  style: TextStyle(fontSize: 10, color: widget.textSecondary),
                ),
                const SizedBox(height: 14),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    OutlinedButton.icon(
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        side: BorderSide(color: widget.borderColor),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                      ),
                      icon: const Icon(Icons.camera_alt_outlined, size: 14, color: AppColors.brandPrimary),
                      label: Text(
                        "Camera",
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: widget.textPrimary),
                      ),
                      onPressed: () => _pickSignatureImage(ImageSource.camera),
                    ),
                    const SizedBox(width: 12),
                    ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF0F172A),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                        elevation: 0,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                      ),
                      icon: const Icon(Icons.photo_library_outlined, size: 14),
                      label: const Text(
                        "Choose from Gallery",
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700),
                      ),
                      onPressed: () => _pickSignatureImage(ImageSource.gallery),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],

        // Helper text below
        const SizedBox(height: 6),
        Text(
          widget.helperText,
          style: TextStyle(
            fontSize: 10,
            color: widget.textSecondary.withValues(alpha: 0.6),
          ),
        ),
      ],
    );
  }
}

class _SignaturePainter extends CustomPainter {
  final List<List<Offset>> strokes;
  final Color color;

  _SignaturePainter({required this.strokes, required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = 2.5
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round
      ..style = PaintingStyle.stroke;

    for (final stroke in strokes) {
      if (stroke.length < 2) {
        if (stroke.isNotEmpty) {
          canvas.drawCircle(stroke.first, 1.25, paint..style = PaintingStyle.fill);
          paint.style = PaintingStyle.stroke;
        }
        continue;
      }

      final path = Path();
      path.moveTo(stroke[0].dx, stroke[0].dy);
      for (int i = 1; i < stroke.length; i++) {
        path.lineTo(stroke[i].dx, stroke[i].dy);
      }
      canvas.drawPath(path, paint);
    }
  }

  @override
  bool shouldRepaint(covariant _SignaturePainter oldDelegate) => true;
}
