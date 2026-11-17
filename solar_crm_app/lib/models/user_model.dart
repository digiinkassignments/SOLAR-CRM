class UserModel {
  final int id;
  final String name;
  final String email;
  final String? phone;
  final int roleId;
  final String roleName;
  final String status;
  final int isPasswordChanged;
  final List<String> permissions;

  UserModel({
    required this.id,
    required this.name,
    required this.email,
    this.phone,
    required this.roleId,
    required this.roleName,
    this.status = 'Active',
    this.isPasswordChanged = 1,
    this.permissions = const [],
  });

  bool get isAdmin =>
      roleId == 1 ||
      roleName.toLowerCase().contains("admin") ||
      roleName.toLowerCase().contains("super");

  bool get isManager =>
      roleId == 2 || roleName.toLowerCase().contains("manager");

  bool get isSales =>
      roleId == 3 || roleName.toLowerCase().contains("sales");

  bool get isEngineer =>
      roleId == 4 ||
      roleName.toLowerCase().contains("engineer") ||
      roleName.toLowerCase().contains("site");

  factory UserModel.fromJson(Map<String, dynamic> json) {
    List<String> perms = [];
    if (json['permissions'] != null) {
      if (json['permissions'] is List) {
        perms = (json['permissions'] as List).map((e) => e.toString()).toList();
      }
    }

    return UserModel(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id'].toString()) ?? 0,
      name: json['full_name'] ?? json['name'] ?? '',
      email: json['email'] ?? '',
      phone: json['phone']?.toString(),
      roleId: json['role_id'] is int
          ? json['role_id']
          : int.tryParse(json['role_id']?.toString() ?? '3') ?? 3,
      roleName: json['role_name'] ?? json['role'] ?? 'User',
      status: json['status'] ?? 'Active',
      isPasswordChanged: json['is_password_changed'] is int
          ? json['is_password_changed']
          : int.tryParse(json['is_password_changed']?.toString() ?? '1') ?? 1,
      permissions: perms,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'phone': phone,
      'role_id': roleId,
      'role_name': roleName,
      'status': status,
      'is_password_changed': isPasswordChanged,
      'permissions': permissions,
    };
  }
}
