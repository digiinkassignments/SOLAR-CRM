import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_typography.dart';
import '../../../models/stock_item_model.dart';
import '../../../providers/stock_provider.dart';

class StockOutSheet extends StatefulWidget {
  final StockItemModel? preSelectedItem;

  const StockOutSheet({super.key, this.preSelectedItem});

  static Future<bool?> show(BuildContext context, {StockItemModel? preSelectedItem}) {
    return showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StockOutSheet(preSelectedItem: preSelectedItem),
    );
  }

  @override
  State<StockOutSheet> createState() => _StockOutSheetState();
}

class _StockOutSheetState extends State<StockOutSheet> {
  final _formKey = GlobalKey<FormState>();

  StockItemModel? _selectedItem;
  final _quantityController = TextEditingController();
  final _referenceIdController = TextEditingController();
  final _notesController = TextEditingController();

  String _referenceType = "PROJECT";
  bool _isLoading = false;

  final List<Map<String, String>> _referenceTypes = [
    {"label": "Project Installation", "value": "PROJECT"},
    {"label": "Direct Site Dispatch", "value": "DISPATCH"},
    {"label": "Damaged / Defective", "value": "DAMAGED"},
    {"label": "Lost / Scrap Write-off", "value": "LOST"},
    {"label": "Internal Company Use", "value": "INTERNAL_USE"},
  ];

  @override
  void initState() {
    super.initState();
    _selectedItem = widget.preSelectedItem;
  }

  @override
  void dispose() {
    _quantityController.dispose();
    _referenceIdController.dispose();
    _notesController.dispose();
    super.dispose();
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
    if (qty > _selectedItem!.currentStock) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: AppColors.errorRed,
          content: Text("Cannot dispatch $qty ${_selectedItem!.unit}. Only ${_selectedItem!.currentStock} available!"),
        ),
      );
      return;
    }

    setState(() => _isLoading = true);

    final provider = Provider.of<StockProvider>(context, listen: false);
    final success = await provider.recordStockOut(
      itemId: _selectedItem!.id,
      quantity: qty,
      referenceType: _referenceType,
      referenceId: _referenceIdController.text.trim().isNotEmpty ? _referenceIdController.text.trim() : null,
      notes: _notesController.text.trim().isNotEmpty ? _notesController.text.trim() : null,
    );

    setState(() => _isLoading = false);

    if (mounted) {
      if (success) {
        Navigator.of(context).pop(true);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: AppColors.errorRed,
            content: Text("Stock OUT: $qty ${_selectedItem!.unit} dispatched from ${_selectedItem!.name}"),
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            backgroundColor: AppColors.errorRed,
            content: Text("Failed to record stock outward. Please try again."),
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
                      color: AppColors.errorRed.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.trending_down_rounded, color: AppColors.errorRed, size: 22),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          "Stock Outward (Stock OUT)",
                          style: AppTypography.headingSmall(color: textPrimary),
                        ),
                        Text(
                          "Dispatch hardware to project site or write-off",
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

              const SizedBox(height: 18),

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
                      Icon(Icons.inventory_2_outlined, color: AppColors.errorRed, size: 20),
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
                              "Available in Stock: ${_selectedItem!.currentStock} ${_selectedItem!.unit}",
                              style: AppTypography.caption(
                                color: _selectedItem!.currentStock > 0 ? AppColors.emeraldGreen : AppColors.errorRed,
                                fontWeight: FontWeight.w700,
                              ),
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
                    hintText: "Choose SKU to Dispatch",
                  ),
                  items: allItems.map((item) {
                    return DropdownMenuItem<int>(
                      value: item.id,
                      child: Text(
                        "${item.itemCode} - ${item.name} (Stock: ${item.currentStock})",
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: AppTypography.bodySmall(color: textPrimary),
                      ),
                    );
                  }).toList(),
                  onChanged: (id) {
                    if (id == null) return;
                    setState(() {
                      _selectedItem = allItems.firstWhere((i) => i.id == id);
                    });
                  },
                  validator: (v) => v == null ? "Please select an item" : null,
                ),

              const SizedBox(height: 14),

              // Quantity to Dispatch
              Text(
                "DISPATCH QUANTITY *",
                style: AppTypography.caption(fontWeight: FontWeight.w700, color: textSecondary),
              ),
              const SizedBox(height: 6),
              TextFormField(
                controller: _quantityController,
                keyboardType: TextInputType.number,
                decoration: InputDecoration(
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  hintText: _selectedItem != null ? "Max ${_selectedItem!.currentStock}" : "Enter quantity",
                  suffixText: _selectedItem?.unit ?? "Units",
                ),
                validator: (v) {
                  if (v == null || v.trim().isEmpty) return "Required";
                  final n = int.tryParse(v.trim());
                  if (n == null || n <= 0) return "Must be > 0";
                  if (_selectedItem != null && n > _selectedItem!.currentStock) {
                    return "Exceeds available stock (${_selectedItem!.currentStock})";
                  }
                  return null;
                },
              ),

              const SizedBox(height: 14),

              // Reference Type & Reference / Project ID
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          "PURPOSE / DESTINATION",
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
                                style: AppTypography.caption(color: textPrimary, fontWeight: FontWeight.w600),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            );
                          }).toList(),
                          onChanged: (v) {
                            if (v != null) setState(() => _referenceType = v);
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
                          "PROJECT / CHALAN #",
                          style: AppTypography.caption(fontWeight: FontWeight.w700, color: textSecondary),
                        ),
                        const SizedBox(height: 6),
                        TextFormField(
                          controller: _referenceIdController,
                          decoration: InputDecoration(
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                            hintText: "PRJ-1049",
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
                "DISPATCH NOTES",
                style: AppTypography.caption(fontWeight: FontWeight.w700, color: textSecondary),
              ),
              const SizedBox(height: 6),
              TextFormField(
                controller: _notesController,
                maxLines: 2,
                decoration: InputDecoration(
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                  contentPadding: const EdgeInsets.all(12),
                  hintText: "Installer name, site contact, transport vehicle #...",
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
                    backgroundColor: AppColors.errorRed,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  icon: _isLoading
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                        )
                      : const Icon(Icons.arrow_outward_rounded, size: 20),
                  label: Text(
                    _isLoading ? "Processing..." : "Confirm Stock OUT",
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
