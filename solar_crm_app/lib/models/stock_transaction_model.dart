class StockTransactionModel {
  final int id;
  final int itemId;
  final String? itemName;
  final String? itemCode;
  final String? unit;
  final String transactionType; // IN, OUT, ADJUSTMENT, RESERVE, RELEASE
  final int quantity;
  final double unitPrice;
  final double totalValue;
  final int? previousStock;
  final int? newStock;
  final String? referenceType; // PURCHASE_ORDER, SUPPLIER_INVOICE, RETURN_FROM_SITE, INITIAL_STOCK, PROJECT, DISPATCH, etc.
  final String? referenceId;
  final String? notes;
  final String? createdByName;
  final String? createdAt;

  StockTransactionModel({
    required this.id,
    required this.itemId,
    this.itemName,
    this.itemCode,
    this.unit = "Piece",
    required this.transactionType,
    required this.quantity,
    this.unitPrice = 0.0,
    this.totalValue = 0.0,
    this.previousStock,
    this.newStock,
    this.referenceType,
    this.referenceId,
    this.notes,
    this.createdByName,
    this.createdAt,
  });

  factory StockTransactionModel.fromJson(Map<String, dynamic> json) {
    return StockTransactionModel(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id']?.toString() ?? '0') ?? 0,
      itemId: json['item_id'] is int ? json['item_id'] : int.tryParse(json['item_id']?.toString() ?? '0') ?? 0,
      itemName: json['item_name']?.toString() ?? json['name']?.toString(),
      itemCode: json['item_code']?.toString(),
      unit: json['unit']?.toString() ?? 'Piece',
      transactionType: (json['transaction_type']?.toString() ?? 'IN').toUpperCase(),
      quantity: json['quantity'] is int ? json['quantity'] : int.tryParse(json['quantity']?.toString() ?? '0') ?? 0,
      unitPrice: json['unit_price'] is num
          ? (json['unit_price'] as num).toDouble()
          : double.tryParse(json['unit_price']?.toString() ?? '0') ?? 0.0,
      totalValue: json['total_value'] is num
          ? (json['total_value'] as num).toDouble()
          : double.tryParse(json['total_value']?.toString() ?? '0') ?? 0.0,
      previousStock: json['previous_stock'] is int ? json['previous_stock'] : int.tryParse(json['previous_stock']?.toString() ?? ''),
      newStock: json['new_stock'] is int ? json['new_stock'] : int.tryParse(json['new_stock']?.toString() ?? ''),
      referenceType: json['reference_type']?.toString(),
      referenceId: json['reference_id']?.toString(),
      notes: json['notes']?.toString(),
      createdByName: json['created_by_name']?.toString() ?? json['user_name']?.toString(),
      createdAt: json['created_at']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'item_id': itemId,
      'item_name': itemName,
      'item_code': itemCode,
      'unit': unit,
      'transaction_type': transactionType,
      'quantity': quantity,
      'unit_price': unitPrice,
      'total_value': totalValue,
      'previous_stock': previousStock,
      'new_stock': newStock,
      'reference_type': referenceType,
      'reference_id': referenceId,
      'notes': notes,
      'created_by_name': createdByName,
      'created_at': createdAt,
    };
  }

  bool get isInward => transactionType == 'IN';
  bool get isOutward => transactionType == 'OUT';
}
