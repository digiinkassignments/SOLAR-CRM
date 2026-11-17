class TenantModel {
  final String businessName;
  final String subdomain;
  final String status;

  TenantModel({
    required this.businessName,
    required this.subdomain,
    required this.status,
  });

  factory TenantModel.fromJson(Map<String, dynamic> json) {
    return TenantModel(
      businessName: json['business_name'] ?? json['name'] ?? '',
      subdomain: json['subdomain'] ?? '',
      status: json['status'] ?? 'Active',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'business_name': businessName,
      'subdomain': subdomain,
      'status': status,
    };
  }
}

