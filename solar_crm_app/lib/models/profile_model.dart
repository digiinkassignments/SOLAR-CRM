class ProfileModel {
  final int id;
  final int roleId;
  final String roleName;
  final int? managerId;
  final String fullName;
  final String username;
  final String email;
  final String? phone;
  final String? profileImage;
  final dynamic status;
  final DateTime? lastLogin;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  ProfileModel({
    required this.id,
    required this.roleId,
    required this.roleName,
    this.managerId,
    required this.fullName,
    required this.username,
    required this.email,
    this.phone,
    this.profileImage,
    this.status = 'Active',
    this.lastLogin,
    this.createdAt,
    this.updatedAt,
  });

  String get initials {
    final clean = fullName.trim();
    if (clean.isEmpty) return "TS";
    final parts = clean.split(RegExp(r'\s+'));
    if (parts.length == 1) return parts[0][0].toUpperCase();
    return "${parts[0][0]}${parts[parts.length - 1][0]}".toUpperCase();
  }

  bool get isActive {
    if (status == null) return true;
    final st = status.toString().toLowerCase();
    return st == '1' || st == 'active' || st == 'true';
  }

  String? getFullImageUrl(String baseApiUrl) {
    if (profileImage == null || profileImage!.trim().isEmpty || profileImage == 'null') {
      return null;
    }
    final img = profileImage!.trim();
    if (img.startsWith('http://') || img.startsWith('https://')) {
      final cacheKey = updatedAt != null ? "?v=${updatedAt!.millisecondsSinceEpoch}" : "";
      return "$img$cacheKey";
    }

    // Clean leading slash
    String cleanPath = img.startsWith('/') ? img.substring(1) : img;

    if (!cleanPath.startsWith('uploads/profiles/')) {
      if (cleanPath.startsWith('uploads/')) {
        cleanPath = cleanPath.replaceFirst('uploads/', 'uploads/profiles/');
      } else {
        cleanPath = 'uploads/profiles/$cleanPath';
      }
    }

    // baseApiUrl is like "https://digiinksolutions.solops.cloud/api" -> remove "/api" for uploads
    final origin = baseApiUrl.replaceAll(RegExp(r'/api/?$'), '');
    final cacheKey = updatedAt != null ? "?v=${updatedAt!.millisecondsSinceEpoch}" : "";
    return "$origin/$cleanPath$cacheKey";
  }

  factory ProfileModel.fromJson(Map<String, dynamic> json) {
    DateTime? parseDate(dynamic d) {
      if (d == null) return null;
      try {
        return DateTime.parse(d.toString());
      } catch (_) {
        return null;
      }
    }

    return ProfileModel(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id']?.toString() ?? '0') ?? 0,
      roleId: json['role_id'] is int ? json['role_id'] : int.tryParse(json['role_id']?.toString() ?? '1') ?? 1,
      roleName: json['role_name']?.toString() ?? 'Super Admin',
      managerId: json['manager_id'] is int ? json['manager_id'] : int.tryParse(json['manager_id']?.toString() ?? ''),
      fullName: json['full_name']?.toString() ?? json['name']?.toString() ?? '',
      username: json['username']?.toString() ?? '',
      email: json['email']?.toString() ?? '',
      phone: json['phone']?.toString(),
      profileImage: json['profile_image']?.toString(),
      status: json['status'] ?? 'Active',
      lastLogin: parseDate(json['last_login']),
      createdAt: parseDate(json['created_at']),
      updatedAt: parseDate(json['updated_at']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'role_id': roleId,
      'role_name': roleName,
      'manager_id': managerId,
      'full_name': fullName,
      'username': username,
      'email': email,
      'phone': phone,
      'profile_image': profileImage,
      'status': status,
      'last_login': lastLogin?.toIso8601String(),
      'created_at': createdAt?.toIso8601String(),
      'updated_at': updatedAt?.toIso8601String(),
    };
  }

  ProfileModel copyWith({
    String? fullName,
    String? username,
    String? email,
    String? phone,
    String? profileImage,
    dynamic status,
    DateTime? updatedAt,
  }) {
    return ProfileModel(
      id: id,
      roleId: roleId,
      roleName: roleName,
      managerId: managerId,
      fullName: fullName ?? this.fullName,
      username: username ?? this.username,
      email: email ?? this.email,
      phone: phone ?? this.phone,
      profileImage: profileImage ?? this.profileImage,
      status: status ?? this.status,
      lastLogin: lastLogin,
      createdAt: createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}

