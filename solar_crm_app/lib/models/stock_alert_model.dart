class StockAlertModel {
  final int id;
  final int itemId;
  final String? itemName;
  final String? itemCode;
  final String? categoryName;
  final String? unit;
  final int currentStock;
  final int minStockLevel;
  final int reorderLevel;
  final String alertType; // LOW_STOCK, OUT_OF_STOCK, REORDER
  final String? message;
  final bool isResolved;
  final String? createdAt;
  final String? resolvedAt;

  StockAlertModel({
    required this.id,
    required this.itemId,
    this.itemName,
    this.itemCode,
    this.categoryName,
    this.unit = "Piece",
    required this.currentStock,
    this.minStockLevel = 5,
    this.reorderLevel = 10,
    required this.alertType,
    this.message,
    this.isResolved = false,
    this.createdAt,
    this.resolvedAt,
  });

  factory StockAlertModel.fromJson(Map<String, dynamic> json) {
    return StockAlertModel(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id']?.toString() ?? '0') ?? 0,
      itemId: json['item_id'] is int ? json['item_id'] : int.tryParse(json['item_id']?.toString() ?? '0') ?? 0,
      itemName: json['item_name']?.toString() ?? json['name']?.toString(),
      itemCode: json['item_code']?.toString(),
      categoryName: json['category_name']?.toString(),
      unit: json['unit']?.toString() ?? 'Piece',
      currentStock: json['current_stock'] is int
          ? json['current_stock']
          : int.tryParse(json['current_stock']?.toString() ?? '0') ?? 0,
      minStockLevel: json['min_stock_level'] is int
          ? json['min_stock_level']
          : int.tryParse(json['min_stock_level']?.toString() ?? '5') ?? 5,
      reorderLevel: json['reorder_level'] is int
          ? json['reorder_level']
          : int.tryParse(json['reorder_level']?.toString() ?? '10') ?? 10,
      alertType: (json['alert_type']?.toString() ?? 'LOW_STOCK').toUpperCase(),
      message: json['message']?.toString(),
      isResolved: json['is_resolved'] == 1 || json['is_resolved'] == true,
      createdAt: json['created_at']?.toString(),
      resolvedAt: json['resolved_at']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'item_id': itemId,
      'item_name': itemName,
      'item_code': itemCode,
      'category_name': categoryName,
      'unit': unit,
      'current_stock': currentStock,
      'min_stock_level': minStockLevel,
      'reorder_level': reorderLevel,
      'alert_type': alertType,
      'message': message,
      'is_resolved': isResolved ? 1 : 0,
      'created_at': createdAt,
      'resolved_at': resolvedAt,
    };
  }

  bool get isCritical => alertType == 'OUT_OF_STOCK';
}

