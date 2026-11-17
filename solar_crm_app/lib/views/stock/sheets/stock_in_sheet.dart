import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_typography.dart';
import '../../../core/utils/formatters.dart';
import '../../../models/stock_item_model.dart';
import '../../../providers/stock_provider.dart';

class StockInSheet extends StatefulWidget {
  final StockItemModel? preSelectedItem;

  const StockInSheet({super.key, this.preSelectedItem});

  static Future<bool?> show(BuildContext context, {StockItemModel? preSelectedItem}) {
    return showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StockInSheet(preSelectedItem: preSelectedItem),
    );
  }

  @override
  State<StockInSheet> createState() => _StockInSheetState();
}

class _StockInSheetState extends State<StockInSheet> {
  final _formKey = GlobalKey<FormState>();

  StockItemModel? _selectedItem;
  final _barcodeInputController = TextEditingController();
  final _quantityController = TextEditingController();
  final _unitPriceController = TextEditingController();
  final _vendorNameController = TextEditingController();
  final _vendorInvoiceController = TextEditingController();
  final _notesController = TextEditingController();

  String _referenceType = "PURCHASE";
  bool _isLoading = false;
  bool _isSearchingBarcode = false;

  final List<Map<String, String>> _referenceTypes = [
    {"label": "Purchase Order / Bill", "value": "PURCHASE"},
    {"label": "Customer / Site Return", "value": "RETURN"},
    {"label": "Inventory Adjustment (+)", "value": "ADJUSTMENT"},
  ];

  @override
  void initState() {
    super.initState();
    _selectedItem = widget.preSelectedItem;
    if (_selectedItem != null) {
      _unitPriceController.text = _selectedItem!.unitPrice > 0 ? _selectedItem!.unitPrice.toStringAsFixed(2) : "";
    }
  }

  @override
  void dispose() {
    _barcodeInputController.dispose();
    _quantityController.dispose();
    _unitPriceController.dispose();
    _vendorNameController.dispose();
    _vendorInvoiceController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  double get _calculatedTotal {
    final qty = int.tryParse(_quantityController.text) ?? 0;
    final price = double.tryParse(_unitPriceController.text) ?? 0.0;
    return qty * price;
  }

  Future<void> _handleBarcodeSearch() async {
    final code = _barcodeInputController.text.trim();
    if (code.isEmpty) return;

    setState(() => _isSearchingBarcode = true);
    final provider = Provider.of<StockProvider>(context, listen: false);
    final item = await provider.getItemByBarcode(code);

    if (mounted) {
      setState(() => _isSearchingBarcode = false);
      if (item != null) {
        setState(() {
          _selectedItem = item;
          if (_unitPriceController.text.isEmpty && item.unitPrice > 0) {
            _unitPriceController.text = item.unitPrice.toStringAsFixed(2);
          }
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: AppColors.emeraldGreen,
            content: Text("Found: ${item.name} (${item.itemCode})"),
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: AppColors.errorRed,
            content: Text("Barcode \"$code\" not found"),
          ),
        );
      }
    }
  }

  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedItem == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Please select a stock item")),
      );
      return;
    }

    final qty = int.tryParse(_quantityController.text.trim()) ?? 0;
    final price = double.tryParse(_unitPriceController.text.trim()) ?? _selectedItem!.unitPrice;

    setState(() => _isLoading = true);

    final provider = Provider.of<StockProvider>(context, listen: false);
    final success = await provider.recordStockIn(
      itemId: _selectedItem!.id,
      quantity: qty,
      unitPrice: price,
      referenceType: _referenceType,
      referenceNumber: _vendorInvoiceController.text.trim().isNotEmpty ? _vendorInvoiceController.text.trim() : null,
      vendorName: _vendorNameController.text.trim().isNotEmpty ? _vendorNameController.text.trim() : null,
      vendorInvoice: _vendorInvoiceController.text.trim().isNotEmpty ? _vendorInvoiceController.text.trim() : null,
      notes: _notesController.text.trim().isNotEmpty ? _notesController.text.trim() : null,
    );

    setState(() => _isLoading = false);

    if (mounted) {
      if (success) {
        Navigator.of(context).pop(true);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: AppColors.emeraldGreen,
            content: Text("Stock IN: +$qty ${_selectedItem!.unit} added to ${_selectedItem!.name}"),
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            backgroundColor: AppColors.errorRed,
            content: Text("Failed to record stock inward. Please try again."),
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

    final provider = Provider.of<StockProvider>(context);
    final allItems = provider.items;

    return Container(
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        border: Border.all(color: borderColor),
      ),
      padding: EdgeInsets.only(
        top: 20,
        left: 20,
        right: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.90,
      ),
      child: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppColors.emeraldGreen.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.trending_up_rounded, color: AppColors.emeraldGreen, size: 22),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          "Stock Inward (Stock IN)",
                          style: AppTypography.headingSmall(color: textPrimary),
                        ),
                        Text(
                          "Record inward purchase shipment or return",
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

              const SizedBox(height: 16),

              // Barcode / SKU quick lookup
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _barcodeInputController,
                      decoration: InputDecoration(
                        hintText: "Scan or enter barcode / SKU...",
                        prefixIcon: const Icon(Icons.qr_code_scanner_rounded, size: 20),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      ),
                      onSubmitted: (_) => _handleBarcodeSearch(),
                    ),
                  ),
                  const SizedBox(width: 8),
                  ElevatedButton(
                    onPressed: _isSearchingBarcode ? null : _handleBarcodeSearch,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.brandPrimary,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    ),
                    child: _isSearchingBarcode
                        ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                        : const Text("Find"),
                  ),
                ],
              ),

              const SizedBox(height: 14),

              // Item Selector
              Text(
                "SELECT STOCK ITEM *",
                style: AppTypography.caption(fontWeight: FontWeight.w700, color: textSecondary),
              ),
              const SizedBox(height: 6),
              if (widget.preSelectedItem != null)
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: isDark ? Colors.white10 : Colors.grey.shade50,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: borderColor),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.inventory_2_outlined, color: AppColors.brandPrimary, size: 20),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _selectedItem!.name,
                              style: AppTypography.bodySmall(color: textPrimary, fontWeight: FontWeight.w600),
                            ),
                            Text(
                              "Current: ${_selectedItem!.currentStock} ${_selectedItem!.unit} • Code: ${_selectedItem!.itemCode}",
                              style: AppTypography.caption(color: textSecondary),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                )
              else
                DropdownButtonFormField<int>(
                  initialValue: _selectedItem?.id,
                  isExpanded: true,
                  decoration: InputDecoration(
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    hintText: "Choose SKU / Product",
                  ),
                  items: allItems.map((item) {
                    return DropdownMenuItem<int>(
                      value: item.id,
                      child: Text(
                        "${item.itemCode} - ${item.name} (${item.brand ?? 'Generic'}) - Stock: ${item.currentStock} ${item.unit}",
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: AppTypography.bodySmall(color: textPrimary),
                      ),
                    );
                  }).toList(),
                  onChanged: (id) {
                    if (id == null) return;
                    final it = allItems.firstWhere((i) => i.id == id);
                    setState(() {
                      _selectedItem = it;
                      if (_unitPriceController.text.isEmpty && it.unitPrice > 0) {
                        _unitPriceController.text = it.unitPrice.toStringAsFixed(2);
                      }
                    });
                  },
                  validator: (v) => v == null ? "Please select an item" : null,
                ),

              const SizedBox(height: 14),

              // Quantity & Unit Price Row
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          "QUANTITY IN *",
                          style: AppTypography.caption(fontWeight: FontWeight.w700, color: textSecondary),
                        ),
                        const SizedBox(height: 6),
                        TextFormField(
                          controller: _quantityController,
                          keyboardType: TextInputType.number,
                          decoration: InputDecoration(
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                            hintText: "e.g. 50",
                            suffixText: _selectedItem?.unit ?? "Units",
                          ),
                          onChanged: (_) => setState(() {}),
                          validator: (v) {
                            if (v == null || v.trim().isEmpty) return "Required";
                            final n = int.tryParse(v.trim());
                            if (n == null || n <= 0) return "Must be > 0";
                            return null;
                          },
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          "PURCHASE PRICE (₹)",
                          style: AppTypography.caption(fontWeight: FontWeight.w700, color: textSecondary),
                        ),
                        const SizedBox(height: 6),
                        TextFormField(
                          controller: _unitPriceController,
                          keyboardType: const TextInputType.numberWithOptions(decimal: true),
                          decoration: InputDecoration(
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                            hintText: "e.g. 18500",
                            prefixText: "₹ ",
                          ),
                          onChanged: (_) => setState(() {}),
                        ),
                      ],
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 14),

              // Reference Type
              Text(
                "REFERENCE TYPE",
                style: AppTypography.caption(fontWeight: FontWeight.w700, color: textSecondary),
              ),
              const SizedBox(height: 6),
              DropdownButtonFormField<String>(
                initialValue: _referenceType,
                isExpanded: true,
                decoration: InputDecoration(
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                ),
                items: _referenceTypes.map((rt) {
                  return DropdownMenuItem<String>(
                    value: rt["value"],
                    child: Text(
                      rt["label"]!,
                      style: AppTypography.bodySmall(color: textPrimary, fontWeight: FontWeight.w600),
                    ),
                  );
                }).toList(),
                onChanged: (v) {
                  if (v != null) setState(() => _referenceType = v);
                },
              ),

              const SizedBox(height: 14),

              // Vendor Name & Vendor Invoice Bill No
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          "VENDOR / SUPPLIER NAME",
                          style: AppTypography.caption(fontWeight: FontWeight.w700, color: textSecondary),
                        ),
                        const SizedBox(height: 6),
                        TextFormField(
                          controller: _vendorNameController,
                          decoration: InputDecoration(
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                            hintText: "e.g. Waaree Energies",
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          "VENDOR INVOICE / BILL #",
                          style: AppTypography.caption(fontWeight: FontWeight.w700, color: textSecondary),
                        ),
                        const SizedBox(height: 6),
                        TextFormField(
                          controller: _vendorInvoiceController,
                          decoration: InputDecoration(
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                            hintText: "e.g. INV-9901",
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 14),

              // Notes
              Text(
                "REMARKS / NOTES",
                style: AppTypography.caption(fontWeight: FontWeight.w700, color: textSecondary),
              ),
              const SizedBox(height: 6),
              TextFormField(
                controller: _notesController,
                maxLines: 2,
                decoration: InputDecoration(
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                  contentPadding: const EdgeInsets.all(12),
                  hintText: "e.g. Received at warehouse in good condition...",
                ),
              ),

              const SizedBox(height: 16),

              // Total Value summary card
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.emeraldGreen.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: AppColors.emeraldGreen.withValues(alpha: 0.2)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      "Total Inward Value:",
                      style: AppTypography.bodySmall(color: textPrimary, fontWeight: FontWeight.w600),
                    ),
                    Text(
                      Formatters.formatCurrency(_calculatedTotal),
                      style: AppTypography.headingSmall(color: AppColors.emeraldGreen),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 20),

              // Submit Button
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton.icon(
                  onPressed: _isLoading ? null : _handleSubmit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.emeraldGreen,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  icon: _isLoading
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                        )
                      : const Icon(Icons.check_circle_outline_rounded, size: 20),
                  label: Text(
                    _isLoading ? "Processing..." : "Confirm Stock IN",
                    style: AppTypography.bodyMedium(color: Colors.white, fontWeight: FontWeight.w700),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
