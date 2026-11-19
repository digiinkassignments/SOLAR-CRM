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

  bool get isSuperAdmin =>
      roleId == 1 ||
      roleName.toLowerCase() == "super admin" ||
      roleName.toLowerCase() == "superadmin";

  bool get isAdmin =>
      roleId == 1 ||
      roleName.toLowerCase() == "super admin" ||
      roleName.toLowerCase() == "superadmin" ||
      roleName.toLowerCase() == "admin" ||
      roleName.toLowerCase() == "administrator";

  bool get isManager =>
      roleId == 2 ||
      roleName.toLowerCase() == "manager" ||
      roleName.toLowerCase() == "operations manager" ||
      roleName.toLowerCase() == "project manager";

  bool get isSales =>
      roleId == 3 ||
      roleName.toLowerCase() == "sales" ||
      roleName.toLowerCase() == "sales executive" ||
      roleName.toLowerCase().startsWith("sales");

  bool get isEngineer =>
      roleId == 4 ||
      roleName.toLowerCase() == "site engineer" ||
      roleName.toLowerCase() == "engineer" ||
      roleName.toLowerCase() == "technical engineer";

  UserModel copyWith({
    int? id,
    String? name,
    String? email,
    String? phone,
    int? roleId,
    String? roleName,
    String? status,
    int? isPasswordChanged,
    List<String>? permissions,
  }) {
    return UserModel(
      id: id ?? this.id,
      name: name ?? this.name,
      email: email ?? this.email,
      phone: phone ?? this.phone,
      roleId: roleId ?? this.roleId,
      roleName: roleName ?? this.roleName,
      status: status ?? this.status,
      isPasswordChanged: isPasswordChanged ?? this.isPasswordChanged,
      permissions: permissions ?? this.permissions,
    );
  }

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
