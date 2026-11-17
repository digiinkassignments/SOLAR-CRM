import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_typography.dart';
import '../../../models/stock_item_model.dart';
import '../../../providers/stock_provider.dart';
import '../sheets/stock_out_sheet.dart';

class BarcodeScannerSheet extends StatefulWidget {
  const BarcodeScannerSheet({super.key});

  static Future<void> show(BuildContext context) {
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => const BarcodeScannerSheet(),
    );
  }

  @override
  State<BarcodeScannerSheet> createState() => _BarcodeScannerSheetState();
}

class _BarcodeScannerSheetState extends State<BarcodeScannerSheet> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final MobileScannerController _scannerController = MobileScannerController();
  final _manualCodeController = TextEditingController();

  bool _isSearching = false;
  StockItemModel? _lastScannedItem;
  String? _lastScannedCode;
  final List<Map<String, dynamic>> _sessionLogs = [];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _scannerController.dispose();
    _manualCodeController.dispose();
    super.dispose();
  }

  Future<void> _handleCodeDetected(String code) async {
    final clean = code.trim();
    if (clean.isEmpty || clean == _lastScannedCode && _isSearching) return;

    setState(() {
      _isSearching = true;
      _lastScannedCode = clean;
    });

    final provider = Provider.of<StockProvider>(context, listen: false);

    // 1. Look up item by code or barcode
    StockItemModel? item = await provider.getItemByBarcode(clean);

    // If not found by barcode API, look through local provider list
    if (item == null) {
      final upper = clean.toUpperCase();
      try {
        item = provider.items.firstWhere(
          (i) => (i.barcode?.toUpperCase() == upper) || (i.itemCode.toUpperCase() == upper),
        );
      } catch (_) {}
    }

    if (mounted) {
      if (item != null) {
        setState(() {
          _lastScannedItem = item;
          _sessionLogs.insert(0, {
            'item': item,
            'code': clean,
            'time': "${DateTime.now().hour.toString().padLeft(2, '0')}:${DateTime.now().minute.toString().padLeft(2, '0')}",
          });
        });

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: AppColors.emeraldGreen,
            duration: const Duration(seconds: 2),
            content: Text("Matched: ${item.name} (${item.itemCode})"),
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: AppColors.errorRed,
            duration: const Duration(seconds: 3),
            content: Text("Barcode \"$clean\" not found in inventory"),
          ),
        );
      }

      setState(() => _isSearching = false);
    }
  }

  Future<void> _handleQuickAdd(int qty) async {
    if (_lastScannedItem == null || _lastScannedCode == null) return;
    setState(() => _isSearching = true);

    final provider = Provider.of<StockProvider>(context, listen: false);
    final res = await provider.quickScanInByBarcode(
      code: _lastScannedCode!,
      quantity: qty,
      notes: "Quick Scanner entry (+$qty)",
    );

    if (mounted) {
      setState(() => _isSearching = false);
      if (res != null) {
        // Refresh local detail item
        final updated = await provider.fetchStockItemById(_lastScannedItem!.id);
        if (!mounted) return;
        if (updated != null) {
          setState(() => _lastScannedItem = updated);
        }
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: AppColors.emeraldGreen,
            content: Text("Quick Stock IN: +$qty ${_lastScannedItem!.unit} added!"),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? AppColors.darkCard : AppColors.lightCard;
    final borderColor = isDark ? AppColors.darkBorder : AppColors.lightBorder;
    final textPrimary = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final textSecondary = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;

    return Container(
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        border: Border.all(color: borderColor),
      ),
      padding: EdgeInsets.only(
        top: 16,
        left: 16,
        right: 16,
        bottom: MediaQuery.of(context).viewInsets.bottom + 16,
      ),
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.90,
      ),
      child: Column(
        children: [
          // Header
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppColors.brandPrimary.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.qr_code_scanner_rounded, color: AppColors.brandPrimary, size: 22),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      "Barcode & QR Code Scanner",
                      style: AppTypography.headingSmall(color: textPrimary),
                    ),
                    Text(
                      "Instant hardware lookup & quick stock inward",
                      style: AppTypography.caption(color: textSecondary),
                    ),
                  ],
                ),
              ),
              IconButton(
                icon: Icon(Icons.close_rounded, color: textSecondary),
                onPressed: () => Navigator.of(context).pop(),
              ),
            ],
          ),

          const SizedBox(height: 12),

          // Tabs: Camera Scanner vs Manual Keyboard Entry
          TabBar(
            controller: _tabController,
            indicatorColor: AppColors.brandPrimary,
            labelColor: AppColors.brandPrimary,
            unselectedLabelColor: textSecondary,
            labelStyle: AppTypography.bodySmall(fontWeight: FontWeight.w700),
            tabs: const [
              Tab(icon: Icon(Icons.camera_alt_outlined, size: 18), text: "Camera Scanner"),
              Tab(icon: Icon(Icons.keyboard_outlined, size: 18), text: "Manual Entry"),
            ],
          ),

          const SizedBox(height: 12),

          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                // TAB 1: Camera Scanner
                ClipRRect(
                  borderRadius: BorderRadius.circular(14),
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      MobileScanner(
                        controller: _scannerController,
                        onDetect: (capture) {
                          final List<Barcode> barcodes = capture.barcodes;
                          for (final barcode in barcodes) {
                            if (barcode.rawValue != null) {
                              _handleCodeDetected(barcode.rawValue!);
                              break;
                            }
                          }
                        },
                      ),

                      // Scanning Frame Overlay
                      Container(
                        width: 220,
                        height: 220,
                        decoration: BoxDecoration(
                          border: Border.all(color: AppColors.brandPrimary, width: 2),
                          borderRadius: BorderRadius.circular(16),
                        ),
                      ),

                      // Camera Controls (Torch & Flip)
                      Positioned(
                        top: 12,
                        right: 12,
                        child: Row(
                          children: [
                            IconButton(
                              style: IconButton.styleFrom(backgroundColor: Colors.black54),
                              icon: const Icon(Icons.flash_on_rounded, color: Colors.white, size: 20),
                              onPressed: () => _scannerController.toggleTorch(),
                            ),
                            const SizedBox(width: 8),
                            IconButton(
                              style: IconButton.styleFrom(backgroundColor: Colors.black54),
                              icon: const Icon(Icons.flip_camera_ios_rounded, color: Colors.white, size: 20),
                              onPressed: () => _scannerController.switchCamera(),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                // TAB 2: Manual Keyboard Entry
                SingleChildScrollView(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SizedBox(height: 16),
                      Text("ENTER BARCODE OR SKU", style: AppTypography.caption(fontWeight: FontWeight.w700, color: textSecondary)),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Expanded(
                            child: TextField(
                              controller: _manualCodeController,
                              decoration: InputDecoration(
                                hintText: "e.g. SP-540W or 890123456789",
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                                contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                              ),
                              onSubmitted: (val) => _handleCodeDetected(val),
                            ),
                          ),
                          const SizedBox(width: 10),
                          ElevatedButton(
                            onPressed: () => _handleCodeDetected(_manualCodeController.text),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.brandPrimary,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                            ),
                            child: const Text("Search"),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 12),

          // Scanned Item Result Card
          if (_lastScannedItem != null) ...[
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: isDark ? Colors.white10 : Colors.grey.shade50,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.emeraldGreen.withValues(alpha: 0.5)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: AppColors.emeraldGreen.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(5),
                        ),
                        child: Text(
                          _lastScannedItem!.itemCode,
                          style: AppTypography.badge(color: AppColors.emeraldGreen),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          _lastScannedItem!.name,
                          style: AppTypography.bodySmall(color: textPrimary, fontWeight: FontWeight.w700),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    "Current Stock: ${_lastScannedItem!.currentStock} ${_lastScannedItem!.unit} • Price: ₹${_lastScannedItem!.unitPrice.toStringAsFixed(0)}",
                    style: AppTypography.caption(color: textSecondary),
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      ElevatedButton.icon(
                        onPressed: _isSearching ? null : () => _handleQuickAdd(1),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.emeraldGreen,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        ),
                        icon: const Icon(Icons.add_rounded, size: 14),
                        label: const Text("+1 Inward"),
                      ),
                      const SizedBox(width: 8),
                      OutlinedButton.icon(
                        onPressed: _isSearching ? null : () => _handleQuickAdd(5),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppColors.emeraldGreen,
                          side: const BorderSide(color: AppColors.emeraldGreen),
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        ),
                        icon: const Icon(Icons.add_rounded, size: 14),
                        label: const Text("+5 Inward"),
                      ),
                      const Spacer(),
                      TextButton(
                        onPressed: () {
                          Navigator.of(context).pop();
                          StockOutSheet.show(context, preSelectedItem: _lastScannedItem);
                        },
                        child: Text("Stock OUT ➔", style: AppTypography.caption(color: AppColors.errorRed, fontWeight: FontWeight.w700)),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 8),
          ],

          // Session Scans Count
          if (_sessionLogs.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Text(
                "Scanned ${_sessionLogs.length} items in this session",
                style: AppTypography.caption(color: textSecondary),
              ),
            ),
        ],
      ),
    );
  }
}
