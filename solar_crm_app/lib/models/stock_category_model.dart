class StockCategoryModel {
  final int id;
  final String name;
  final String slug;
  final String? description;
  final String? icon;
  final int sortOrder;
  final bool isActive;

  StockCategoryModel({
    required this.id,
    required this.name,
    required this.slug,
    this.description,
    this.icon,
    this.sortOrder = 0,
    this.isActive = true,
  });

  factory StockCategoryModel.fromJson(Map<String, dynamic> json) {
    return StockCategoryModel(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id']?.toString() ?? '0') ?? 0,
      name: json['name']?.toString() ?? '',
      slug: json['slug']?.toString() ?? '',
      description: json['description']?.toString(),
      icon: json['icon']?.toString(),
      sortOrder: json['sort_order'] is int
          ? json['sort_order']
          : int.tryParse(json['sort_order']?.toString() ?? '0') ?? 0,
      isActive: json['is_active'] == 1 || json['is_active'] == true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'slug': slug,
      'description': description,
      'icon': icon,
      'sort_order': sortOrder,
      'is_active': isActive ? 1 : 0,
    };
  }
}

