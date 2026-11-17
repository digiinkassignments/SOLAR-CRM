class StockItemModel {
  final int id;
  final int categoryId;
  final String? categoryName;
  final String? categorySlug;
  final String? categoryIcon;
  final String itemCode;
  final String? barcode;
  final String name;
  final String? brand;
  final String? model;
  final String? description;
  final Map<String, dynamic> specifications;
  final String? imageUrl;
  final String unit;
  final double unitPrice;
  final double gstRate;
  final String? hsnCode;
  final int minStockLevel;
  final int reorderLevel;
  final int currentStock;
  final int reservedStock;
  final int availableStock;
  final bool isActive;
  final String? createdAt;
  final String? updatedAt;

  StockItemModel({
    required this.id,
    required this.categoryId,
    this.categoryName,
    this.categorySlug,
    this.categoryIcon,
    required this.itemCode,
    this.barcode,
    required this.name,
    this.brand,
    this.model,
    this.description,
    this.specifications = const {},
    this.imageUrl,
    this.unit = "Piece",
    this.unitPrice = 0.0,
    this.gstRate = 18.0,
    this.hsnCode,
    this.minStockLevel = 5,
    this.reorderLevel = 10,
    this.currentStock = 0,
    this.reservedStock = 0,
    this.availableStock = 0,
    this.isActive = true,
    this.createdAt,
    this.updatedAt,
  });

  factory StockItemModel.fromJson(Map<String, dynamic> json) {
    Map<String, dynamic> parsedSpecs = {};
    if (json['specifications'] != null) {
      if (json['specifications'] is Map) {
        parsedSpecs = Map<String, dynamic>.from(json['specifications']);
      }
    }

    final int curr = json['current_stock'] is int
        ? json['current_stock']
        : int.tryParse(json['current_stock']?.toString() ?? '0') ?? 0;
    final int res = json['reserved_stock'] is int
        ? json['reserved_stock']
        : int.tryParse(json['reserved_stock']?.toString() ?? '0') ?? 0;
    final int avail = json['available_stock'] is int
        ? json['available_stock']
        : int.tryParse(json['available_stock']?.toString() ?? '${curr - res}') ?? (curr - res);

    return StockItemModel(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id']?.toString() ?? '0') ?? 0,
      categoryId: json['category_id'] is int
          ? json['category_id']
          : int.tryParse(json['category_id']?.toString() ?? '0') ?? 0,
      categoryName: json['category_name']?.toString(),
      categorySlug: json['category_slug']?.toString(),
      categoryIcon: json['category_icon']?.toString(),
      itemCode: json['item_code']?.toString() ?? '',
      barcode: json['barcode']?.toString(),
      name: json['name']?.toString() ?? '',
      brand: json['brand']?.toString(),
      model: json['model']?.toString(),
      description: json['description']?.toString(),
      specifications: parsedSpecs,
      imageUrl: json['image_url']?.toString(),
      unit: json['unit']?.toString() ?? 'Piece',
      unitPrice: json['unit_price'] is num
          ? (json['unit_price'] as num).toDouble()
          : double.tryParse(json['unit_price']?.toString() ?? '0') ?? 0.0,
      gstRate: json['gst_rate'] is num
          ? (json['gst_rate'] as num).toDouble()
          : double.tryParse(json['gst_rate']?.toString() ?? '18') ?? 18.0,
      hsnCode: json['hsn_code']?.toString(),
      minStockLevel: json['min_stock_level'] is int
          ? json['min_stock_level']
          : int.tryParse(json['min_stock_level']?.toString() ?? '5') ?? 5,
      reorderLevel: json['reorder_level'] is int
          ? json['reorder_level']
          : int.tryParse(json['reorder_level']?.toString() ?? '10') ?? 10,
      currentStock: curr,
      reservedStock: res,
      availableStock: avail,
      isActive: json['is_active'] == 1 || json['is_active'] == true,
      createdAt: json['created_at']?.toString(),
      updatedAt: json['updated_at']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'category_id': categoryId,
      'category_name': categoryName,
      'category_slug': categorySlug,
      'category_icon': categoryIcon,
      'item_code': itemCode,
      'barcode': barcode,
      'name': name,
      'brand': brand,
      'model': model,
      'description': description,
      'specifications': specifications,
      'image_url': imageUrl,
      'unit': unit,
      'unit_price': unitPrice,
      'gst_rate': gstRate,
      'hsn_code': hsnCode,
      'min_stock_level': minStockLevel,
      'reorder_level': reorderLevel,
      'current_stock': currentStock,
      'reserved_stock': reservedStock,
      'available_stock': availableStock,
      'is_active': isActive ? 1 : 0,
      'created_at': createdAt,
      'updated_at': updatedAt,
    };
  }

  // Stock status calculations
  bool get isOutOfStock => currentStock <= 0;
  bool get isLowStock => currentStock > 0 && currentStock <= minStockLevel;
  bool get isReorderNeeded => currentStock > minStockLevel && currentStock <= reorderLevel;
  bool get isInStock => currentStock > reorderLevel;

  double get totalValuation => currentStock * unitPrice;

  String get stockStatusLabel {
    if (isOutOfStock) return "Out of Stock";
    if (isLowStock) return "Low Stock ($currentStock $unit)";
    if (isReorderNeeded) return "Reorder ($currentStock $unit)";
    return "In Stock ($currentStock $unit)";
  }

  double get stockRatio {
    if (reorderLevel <= 0) return 1.0;
    final r = currentStock / (reorderLevel * 2);
    return r.clamp(0.0, 1.0);
  }
}

