class TeamUserModel {
  final int id;
  final int roleId;
  final int? managerId;
  final String fullName;
  final String username;
  final String email;
  final String phone;
  final String? profileImage;
  final String status;
  final String? lastLogin;
  final String? createdAt;
  final String roleName;
  final String? managerName;

  TeamUserModel({
    required this.id,
    required this.roleId,
    this.managerId,
    required this.fullName,
    required this.username,
    required this.email,
    required this.phone,
    this.profileImage,
    required this.status,
    this.lastLogin,
    this.createdAt,
    required this.roleName,
    this.managerName,
  });

  bool get isActive => status.toLowerCase() == 'active';
  bool get isAdmin => roleId == 1 || roleName.toLowerCase().contains('admin');
  bool get isManager => roleId == 2 || roleName.toLowerCase().contains('manager');
  bool get isSales => roleId == 3 || roleName.toLowerCase().contains('sales');
  bool get isEngineer => roleId == 4 || roleName.toLowerCase().contains('engineer') || roleName.toLowerCase().contains('site');

  String get initials {
    if (fullName.trim().isEmpty) return "U";
    final parts = fullName.trim().split(" ");
    if (parts.length == 1) return parts[0][0].toUpperCase();
    return "${parts[0][0]}${parts[parts.length - 1][0]}".toUpperCase();
  }

  factory TeamUserModel.fromJson(Map<String, dynamic> json) {
    int parseInt(dynamic val, [int fallback = 0]) {
      if (val == null) return fallback;
      if (val is int) return val;
      return int.tryParse(val.toString()) ?? fallback;
    }

    return TeamUserModel(
      id: parseInt(json['id']),
      roleId: parseInt(json['role_id'], 3),
      managerId: json['manager_id'] != null ? parseInt(json['manager_id']) : null,
      fullName: json['full_name']?.toString() ?? json['name']?.toString() ?? '',
      username: json['username']?.toString() ?? '',
      email: json['email']?.toString() ?? '',
      phone: json['phone']?.toString() ?? '',
      profileImage: json['profile_image']?.toString(),
      status: json['status']?.toString() ?? 'Active',
      lastLogin: json['last_login']?.toString(),
      createdAt: json['created_at']?.toString(),
      roleName: json['role_name']?.toString() ?? 'User',
      managerName: json['manager_name']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'role_id': roleId,
      'manager_id': managerId,
      'full_name': fullName,
      'username': username,
      'email': email,
      'phone': phone,
      'profile_image': profileImage,
      'status': status,
      'last_login': lastLogin,
      'created_at': createdAt,
      'role_name': roleName,
      'manager_name': managerName,
    };
  }
}

class RoleItem {
  final int id;
  final String roleName;
  final String? description;

  RoleItem({
    required this.id,
    required this.roleName,
    this.description,
  });

  factory RoleItem.fromJson(Map<String, dynamic> json) {
    return RoleItem(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id']?.toString() ?? '0') ?? 0,
      roleName: json['role_name']?.toString() ?? '',
      description: json['description']?.toString(),
    );
  }
}

