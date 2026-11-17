import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_typography.dart';
import '../../../models/stock_item_model.dart';
import '../../../providers/stock_provider.dart';

class StockItemSheet extends StatefulWidget {
  final StockItemModel? editItem;

  const StockItemSheet({super.key, this.editItem});

  static Future<bool?> show(BuildContext context, {StockItemModel? editItem}) {
    return showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StockItemSheet(editItem: editItem),
    );
  }

  @override
  State<StockItemSheet> createState() => _StockItemSheetState();
}

class _StockItemSheetState extends State<StockItemSheet> {
  final _formKey = GlobalKey<FormState>();
  final _picker = ImagePicker();

  File? _imageFile;
  int? _selectedCategoryId;
  final _nameController = TextEditingController();
  final _brandController = TextEditingController();
  final _modelController = TextEditingController();
  final _itemCodeController = TextEditingController();
  final _barcodeController = TextEditingController();
  final _descriptionController = TextEditingController();

  String _unit = "Piece";
  final _unitPriceController = TextEditingController();
  final _gstRateController = TextEditingController(text: "18");
  final _hsnCodeController = TextEditingController();

  final _minStockController = TextEditingController(text: "5");
  final _reorderLevelController = TextEditingController(text: "10");
  final _initialStockController = TextEditingController(text: "0");

  // Specs
  final _wattageController = TextEditingController();
  String _panelType = "Mono PERC";
  final _efficiencyController = TextEditingController();
  final _warrantyController = TextEditingController(text: "25");

  final _capacityKwController = TextEditingController();
  String _inverterType = "On-Grid";
  String _phase = "3 Phase";

  String _structureType = "GI";
  String _cableType = "DC 6mm²";
  final _batteryCapacityController = TextEditingController();

  bool _isLoading = false;

  final List<String> _units = ["Piece", "Set", "Meter", "Kg", "Litre", "Roll", "Pair", "Box", "Pack"];
  final List<String> _panelTypes = ["Mono PERC", "Bifacial", "Polycrystalline", "TopCon", "Thin Film"];
  final List<String> _inverterTypes = ["On-Grid", "Off-Grid", "Hybrid", "Microinverter"];
  final List<String> _phases = ["Single Phase", "3 Phase"];
  final List<String> _structureTypes = ["GI (Galvanized Iron)", "Aluminium", "Tin Shed", "Elevated"];
  final List<String> _cableTypes = ["DC 4mm²", "DC 6mm²", "DC 10mm²", "AC 4 Core", "AC 2 Core"];

  @override
  void initState() {
    super.initState();
    if (widget.editItem != null) {
      final item = widget.editItem!;
      _selectedCategoryId = item.categoryId;
      _nameController.text = item.name;
      _brandController.text = item.brand ?? "";
      _modelController.text = item.model ?? "";
      _itemCodeController.text = item.itemCode;
      _barcodeController.text = item.barcode ?? "";
      _descriptionController.text = item.description ?? "";
      _unit = _units.contains(item.unit) ? item.unit : "Piece";
      _unitPriceController.text = item.unitPrice > 0 ? item.unitPrice.toStringAsFixed(2) : "";
      _gstRateController.text = item.gstRate.toStringAsFixed(0);
      _hsnCodeController.text = item.hsnCode ?? "";
      _minStockController.text = item.minStockLevel.toString();
      _reorderLevelController.text = item.reorderLevel.toString();
      _initialStockController.text = item.currentStock.toString();

      final specs = item.specifications;
      _wattageController.text = specs['wattage']?.toString() ?? "";
      if (specs['panel_type'] != null && _panelTypes.contains(specs['panel_type'])) {
        _panelType = specs['panel_type'].toString();
      }
      _efficiencyController.text = specs['efficiency']?.toString() ?? "";
      _warrantyController.text = specs['warranty_years']?.toString() ?? "25";

      _capacityKwController.text = specs['capacity_kw']?.toString() ?? "";
      if (specs['inverter_type'] != null && _inverterTypes.contains(specs['inverter_type'])) {
        _inverterType = specs['inverter_type'].toString();
      }
      if (specs['phase'] != null && _phases.contains(specs['phase'])) {
        _phase = specs['phase'].toString();
      }
      if (specs['structure_type'] != null && _structureTypes.contains(specs['structure_type'])) {
        _structureType = specs['structure_type'].toString();
      }
      if (specs['cable_type'] != null && _cableTypes.contains(specs['cable_type'])) {
        _cableType = specs['cable_type'].toString();
      }
      _batteryCapacityController.text = specs['battery_capacity']?.toString() ?? "";
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _brandController.dispose();
    _modelController.dispose();
    _itemCodeController.dispose();
    _barcodeController.dispose();
    _descriptionController.dispose();
    _unitPriceController.dispose();
    _gstRateController.dispose();
    _hsnCodeController.dispose();
    _minStockController.dispose();
    _reorderLevelController.dispose();
    _initialStockController.dispose();
    _wattageController.dispose();
    _efficiencyController.dispose();
    _warrantyController.dispose();
    _capacityKwController.dispose();
    _batteryCapacityController.dispose();
    super.dispose();
  }

  Future<void> _pickImage(ImageSource source) async {
    try {
      final picked = await _picker.pickImage(source: source, maxWidth: 1024, maxHeight: 1024, imageQuality: 85);
      if (picked != null) {
        setState(() => _imageFile = File(picked.path));
      }
    } catch (e) {
      debugPrint("Error picking image: $e");
    }
  }

  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedCategoryId == null || _selectedCategoryId! <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Please select a category")),
      );
      return;
    }

    final specs = {
      if (_wattageController.text.trim().isNotEmpty) 'wattage': _wattageController.text.trim(),
      'panel_type': _panelType,
      if (_efficiencyController.text.trim().isNotEmpty) 'efficiency': _efficiencyController.text.trim(),
      if (_warrantyController.text.trim().isNotEmpty) 'warranty_years': _warrantyController.text.trim(),
      if (_capacityKwController.text.trim().isNotEmpty) 'capacity_kw': _capacityKwController.text.trim(),
      'inverter_type': _inverterType,
      'phase': _phase,
      'structure_type': _structureType,
      'cable_type': _cableType,
      if (_batteryCapacityController.text.trim().isNotEmpty) 'battery_capacity': _batteryCapacityController.text.trim(),
    };

    final payload = {
      'category_id': _selectedCategoryId,
      'name': _nameController.text.trim(),
      'brand': _brandController.text.trim().isNotEmpty ? _brandController.text.trim() : null,
      'model': _modelController.text.trim().isNotEmpty ? _modelController.text.trim() : null,
      'item_code': _itemCodeController.text.trim(),
      'barcode': _barcodeController.text.trim().isNotEmpty ? _barcodeController.text.trim() : null,
      'description': _descriptionController.text.trim().isNotEmpty ? _descriptionController.text.trim() : null,
      'unit': _unit,
      'unit_price': double.tryParse(_unitPriceController.text.trim()) ?? 0.0,
      'gst_rate': double.tryParse(_gstRateController.text.trim()) ?? 18.0,
      'hsn_code': _hsnCodeController.text.trim().isNotEmpty ? _hsnCodeController.text.trim() : null,
      'min_stock_level': int.tryParse(_minStockController.text.trim()) ?? 5,
      'reorder_level': int.tryParse(_reorderLevelController.text.trim()) ?? 10,
      'specifications': specs,
    };

    if (widget.editItem == null) {
      payload['current_stock'] = int.tryParse(_initialStockController.text.trim()) ?? 0;
    }

    setState(() => _isLoading = true);

    final provider = Provider.of<StockProvider>(context, listen: false);
    bool success;
    if (widget.editItem != null) {
      success = await provider.updateStockItem(
        widget.editItem!.id,
        payload,
        imageFilePath: _imageFile?.path,
      );
    } else {
      success = await provider.createStockItem(
        payload,
        imageFilePath: _imageFile?.path,
      );
    }

    setState(() => _isLoading = false);

    if (mounted) {
      if (success) {
        Navigator.of(context).pop(true);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: AppColors.emeraldGreen,
            content: Text(widget.editItem != null ? "Stock item updated!" : "New stock item created!"),
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            backgroundColor: AppColors.errorRed,
            content: Text("Failed to save stock item. Please try again."),
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
    final categories = provider.categories;

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
                      color: AppColors.brandPrimary.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(
                      widget.editItem != null ? Icons.edit_outlined : Icons.add_box_rounded,
                      color: AppColors.brandPrimary,
                      size: 22,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          widget.editItem != null ? "Edit Stock Item" : "Add New Stock SKU",
                          style: AppTypography.headingSmall(color: textPrimary),
                        ),
                        Text(
                          "Solar hardware specs, pricing & reorder thresholds",
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

              // Photo Upload Section
              Center(
                child: Column(
                  children: [
                    Stack(
                      children: [
                        Container(
                          width: 80,
                          height: 80,
                          decoration: BoxDecoration(
                            color: isDark ? Colors.white10 : Colors.grey.shade100,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: borderColor, width: 1.5),
                            image: _imageFile != null
                                ? DecorationImage(image: FileImage(_imageFile!), fit: BoxFit.cover)
                                : widget.editItem?.imageUrl != null
                                    ? DecorationImage(
                                        image: NetworkImage(widget.editItem!.imageUrl!),
                                        fit: BoxFit.cover,
                                      )
                                    : null,
                          ),
                          child: (_imageFile == null && widget.editItem?.imageUrl == null)
                              ? Icon(Icons.solar_power_rounded, size: 36, color: textSecondary)
                              : null,
                        ),
                        Positioned(
                          bottom: 0,
                          right: 0,
                          child: GestureDetector(
                            onTap: () {
                              showModalBottomSheet(
                                context: context,
                                builder: (_) => SafeArea(
                                  child: Wrap(
                                    children: [
                                      ListTile(
                                        leading: const Icon(Icons.camera_alt_rounded),
                                        title: const Text("Take Photo (Camera)"),
                                        onTap: () {
                                          Navigator.pop(context);
                                          _pickImage(ImageSource.camera);
                                        },
                                      ),
                                      ListTile(
                                        leading: const Icon(Icons.photo_library_rounded),
                                        title: const Text("Choose from Gallery"),
                                        onTap: () {
                                          Navigator.pop(context);
                                          _pickImage(ImageSource.gallery);
                                        },
                                      ),
                                    ],
                                  ),
                                ),
                              );
                            },
                            child: Container(
                              padding: const EdgeInsets.all(6),
                              decoration: const BoxDecoration(
                                color: AppColors.brandPrimary,
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(Icons.camera_alt_rounded, color: Colors.white, size: 16),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text("Product Photo (Max 5MB)", style: AppTypography.caption(color: textSecondary)),
                  ],
                ),
              ),

              const SizedBox(height: 16),

              // Category Picker
              Text(
                "CATEGORY *",
                style: AppTypography.caption(fontWeight: FontWeight.w700, color: textSecondary),
              ),
              const SizedBox(height: 6),
              DropdownButtonFormField<int>(
                initialValue: _selectedCategoryId,
                isExpanded: true,
                decoration: InputDecoration(
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  hintText: "Select Hardware Category",
                ),
                items: categories.map((c) {
                  return DropdownMenuItem<int>(
                    value: c.id,
                    child: Text(
                      c.name,
                      style: AppTypography.bodySmall(color: textPrimary),
                    ),
                  );
                }).toList(),
                onChanged: (id) => setState(() => _selectedCategoryId = id),
                validator: (v) => v == null ? "Category is required" : null,
              ),

              const SizedBox(height: 14),

              // Item Name
              Text(
                "ITEM / PRODUCT NAME *",
                style: AppTypography.caption(fontWeight: FontWeight.w700, color: textSecondary),
              ),
              const SizedBox(height: 6),
              TextFormField(
                controller: _nameController,
                decoration: InputDecoration(
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  hintText: "e.g. 540W Mono PERC Half-Cut Panel",
                ),
                validator: (v) => v == null || v.trim().isEmpty ? "Item name is required" : null,
              ),

              const SizedBox(height: 14),

              // Brand & Model
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          "BRAND / MAKE",
                          style: AppTypography.caption(fontWeight: FontWeight.w700, color: textSecondary),
                        ),
                        const SizedBox(height: 6),
                        TextFormField(
                          controller: _brandController,
                          decoration: InputDecoration(
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                            hintText: "e.g. Waaree, Vikram",
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
                          "MODEL NUMBER",
                          style: AppTypography.caption(fontWeight: FontWeight.w700, color: textSecondary),
                        ),
                        const SizedBox(height: 6),
                        TextFormField(
                          controller: _modelController,
                          decoration: InputDecoration(
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                            hintText: "e.g. WSM-540",
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 14),

              // SKU Code & Barcode
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          "ITEM CODE / SKU *",
                          style: AppTypography.caption(fontWeight: FontWeight.w700, color: textSecondary),
                        ),
                        const SizedBox(height: 6),
                        TextFormField(
                          controller: _itemCodeController,
                          decoration: InputDecoration(
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                            hintText: "e.g. SP-540W-01",
                          ),
                          validator: (v) => v == null || v.trim().isEmpty ? "Code is required" : null,
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
                          "BARCODE / SERIAL",
                          style: AppTypography.caption(fontWeight: FontWeight.w700, color: textSecondary),
                        ),
                        const SizedBox(height: 6),
                        TextFormField(
                          controller: _barcodeController,
                          decoration: InputDecoration(
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                            hintText: "Scan or enter barcode",
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 14),

              // Unit, Unit Price, GST & HSN
              Row(
                children: [
                  Expanded(
                    flex: 4,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          "UNIT",
                          style: AppTypography.caption(fontWeight: FontWeight.w700, color: textSecondary),
                        ),
                        const SizedBox(height: 6),
                        DropdownButtonFormField<String>(
                          initialValue: _unit,
                          decoration: InputDecoration(
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
                          ),
                          items: _units.map((u) {
                            return DropdownMenuItem<String>(
                              value: u,
                              child: Text(u, style: AppTypography.caption(fontWeight: FontWeight.w600)),
                            );
                          }).toList(),
                          onChanged: (v) {
                            if (v != null) setState(() => _unit = v);
                          },
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    flex: 5,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          "PRICE (₹) *",
                          style: AppTypography.caption(fontWeight: FontWeight.w700, color: textSecondary),
                        ),
                        const SizedBox(height: 6),
                        TextFormField(
                          controller: _unitPriceController,
                          keyboardType: const TextInputType.numberWithOptions(decimal: true),
                          decoration: InputDecoration(
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                            prefixText: "₹ ",
                            hintText: "18500",
                          ),
                          validator: (v) => (v == null || v.trim().isEmpty) ? "Required" : null,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    flex: 3,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          "GST %",
                          style: AppTypography.caption(fontWeight: FontWeight.w700, color: textSecondary),
                        ),
                        const SizedBox(height: 6),
                        TextFormField(
                          controller: _gstRateController,
                          keyboardType: TextInputType.number,
                          decoration: InputDecoration(
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
                            suffixText: "%",
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 14),

              // HSN Code
              Text(
                "HSN CODE",
                style: AppTypography.caption(fontWeight: FontWeight.w700, color: textSecondary),
              ),
              const SizedBox(height: 6),
              TextFormField(
                controller: _hsnCodeController,
                decoration: InputDecoration(
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  hintText: "e.g. 8541",
                ),
              ),

              const SizedBox(height: 14),

              // Min Stock Level, Reorder Level & Initial Stock
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          "MIN ALERT LEVEL",
                          style: AppTypography.caption(fontWeight: FontWeight.w700, color: textSecondary),
                        ),
                        const SizedBox(height: 6),
                        TextFormField(
                          controller: _minStockController,
                          keyboardType: TextInputType.number,
                          decoration: InputDecoration(
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                            hintText: "5",
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          "REORDER LEVEL",
                          style: AppTypography.caption(fontWeight: FontWeight.w700, color: textSecondary),
                        ),
                        const SizedBox(height: 6),
                        TextFormField(
                          controller: _reorderLevelController,
                          keyboardType: TextInputType.number,
                          decoration: InputDecoration(
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                            hintText: "10",
                          ),
                        ),
                      ],
                    ),
                  ),
                  if (widget.editItem == null) ...[
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            "INITIAL QTY",
                            style: AppTypography.caption(fontWeight: FontWeight.w700, color: textSecondary),
                          ),
                          const SizedBox(height: 6),
                          TextFormField(
                            controller: _initialStockController,
                            keyboardType: TextInputType.number,
                            decoration: InputDecoration(
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                              hintText: "0",
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ],
              ),

              const SizedBox(height: 18),

              // Technical Specifications Section Header
              Container(
                padding: const EdgeInsets.symmetric(vertical: 8),
                child: Row(
                  children: [
                    const Icon(Icons.tune_rounded, size: 16, color: AppColors.brandPrimary),
                    const SizedBox(width: 6),
                    Text(
                      "TECHNICAL SPECIFICATIONS",
                      style: AppTypography.caption(
                        color: AppColors.brandPrimary,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ),

              // Panel Specifics: Wattage, Panel Type, Efficiency, Warranty
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text("WATTAGE (Wp)", style: AppTypography.caption(color: textSecondary)),
                        const SizedBox(height: 4),
                        TextFormField(
                          controller: _wattageController,
                          decoration: InputDecoration(
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                            hintText: "e.g. 540W",
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
                        Text("PANEL TYPE", style: AppTypography.caption(color: textSecondary)),
                        const SizedBox(height: 4),
                        DropdownButtonFormField<String>(
                          initialValue: _panelType,
                          decoration: InputDecoration(
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
                          ),
                          items: _panelTypes.map((t) => DropdownMenuItem(value: t, child: Text(t, style: AppTypography.caption(fontWeight: FontWeight.w600)))).toList(),
                          onChanged: (v) { if (v != null) setState(() => _panelType = v); },
                        ),
                      ],
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 10),

              // Inverter Specifics: Capacity kW, Inverter Type, Phase
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text("CAPACITY (kW)", style: AppTypography.caption(color: textSecondary)),
                        const SizedBox(height: 4),
                        TextFormField(
                          controller: _capacityKwController,
                          decoration: InputDecoration(
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                            hintText: "e.g. 5 kW",
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
                        Text("INVERTER TYPE", style: AppTypography.caption(color: textSecondary)),
                        const SizedBox(height: 4),
                        DropdownButtonFormField<String>(
                          initialValue: _inverterType,
                          decoration: InputDecoration(
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
                          ),
                          items: _inverterTypes.map((t) => DropdownMenuItem(value: t, child: Text(t, style: AppTypography.caption(fontWeight: FontWeight.w600)))).toList(),
                          onChanged: (v) { if (v != null) setState(() => _inverterType = v); },
                        ),
                      ],
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 10),

              // Warranty & Phase
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text("WARRANTY (YEARS)", style: AppTypography.caption(color: textSecondary)),
                        const SizedBox(height: 4),
                        TextFormField(
                          controller: _warrantyController,
                          decoration: InputDecoration(
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                            hintText: "25",
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
                        Text("PHASE", style: AppTypography.caption(color: textSecondary)),
                        const SizedBox(height: 4),
                        DropdownButtonFormField<String>(
                          initialValue: _phase,
                          decoration: InputDecoration(
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
                          ),
                          items: _phases.map((p) => DropdownMenuItem(value: p, child: Text(p, style: AppTypography.caption(fontWeight: FontWeight.w600)))).toList(),
                          onChanged: (v) { if (v != null) setState(() => _phase = v); },
                        ),
                      ],
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 14),

              // Description / Technical Notes
              Text(
                "DESCRIPTION / STORAGE NOTES",
                style: AppTypography.caption(fontWeight: FontWeight.w700, color: textSecondary),
              ),
              const SizedBox(height: 6),
              TextFormField(
                controller: _descriptionController,
                maxLines: 3,
                decoration: InputDecoration(
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                  contentPadding: const EdgeInsets.all(12),
                  hintText: "Write additional technical specs, batch details, or warehouse storage notes...",
                ),
              ),

              const SizedBox(height: 24),

              // Submit Button
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton.icon(
                  onPressed: _isLoading ? null : _handleSubmit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.brandPrimary,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  icon: _isLoading
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                        )
                      : const Icon(Icons.check_circle_rounded, size: 20),
                  label: Text(
                    _isLoading
                        ? "Saving..."
                        : (widget.editItem != null ? "Save Changes" : "Create Stock SKU"),
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
