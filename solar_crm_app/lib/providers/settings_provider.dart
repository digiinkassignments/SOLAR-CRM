import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import '../core/constants/api_constants.dart';
import '../core/network/api_client.dart';
import '../models/company_settings_model.dart';
import '../models/profile_model.dart';

class SettingsProvider extends ChangeNotifier {
  final ApiClient apiClient;

  ProfileModel? _profile;
  CompanySettingsModel? _companySettings;

  bool _isLoading = false;
  bool _isSavingProfile = false;
  bool _isChangingPassword = false;
  bool _isUploadingPhoto = false;
  String? _errorMessage;

  SettingsProvider({required this.apiClient});

  // Getters
  ProfileModel? get profile => _profile;
  CompanySettingsModel? get companySettings => _companySettings;
  bool get isLoading => _isLoading;
  bool get isSavingProfile => _isSavingProfile;
  bool get isChangingPassword => _isChangingPassword;
  bool get isUploadingPhoto => _isUploadingPhoto;
  String? get errorMessage => _errorMessage;

  // Base API origin helper
  String get baseApiUrl => apiClient.dio.options.baseUrl;

  // API: Fetch My Profile
  Future<void> fetchProfile() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await apiClient.dio.get(ApiConstants.userProfile);
      if (response.data != null && response.data['success'] == true && response.data['data'] != null) {
        _profile = ProfileModel.fromJson(response.data['data'] as Map<String, dynamic>);
      }
    } catch (e) {
      debugPrint("Error fetching profile: $e");
      _errorMessage = "Failed to load profile details";
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // API: Update Profile Information
  Future<Map<String, dynamic>> updateProfile({
    required String fullName,
    required String username,
    required String email,
    required String phone,
  }) async {
    _isSavingProfile = true;
    notifyListeners();

    try {
      final response = await apiClient.dio.put(
        ApiConstants.userProfile,
        data: {
          'full_name': fullName.trim(),
          'username': username.trim(),
          'email': email.trim(),
          'phone': phone.trim(),
        },
      );

      final data = response.data;
      if (data != null && data['success'] == true) {
        // Refresh local model
        if (_profile != null) {
          _profile = _profile!.copyWith(
            fullName: fullName.trim(),
            username: username.trim(),
            email: email.trim(),
            phone: phone.trim(),
            updatedAt: DateTime.now(),
          );
        }
        return {'success': true, 'message': data['message'] ?? 'Profile updated successfully'};
      }
      return {'success': false, 'message': data?['message'] ?? 'Failed to update profile'};
    } on DioException catch (e) {
      final msg = e.response?.data?['message']?.toString() ?? e.message ?? "Network error";
      return {'success': false, 'message': msg};
    } catch (e) {
      return {'success': false, 'message': 'An unexpected error occurred'};
    } finally {
      _isSavingProfile = false;
      notifyListeners();
    }
  }

  // API: Change Password
  Future<Map<String, dynamic>> changePassword({
    required String currentPassword,
    required String newPassword,
    required String confirmPassword,
  }) async {
    _isChangingPassword = true;
    notifyListeners();

    try {
      final response = await apiClient.dio.put(
        ApiConstants.changePassword,
        data: {
          'current_password': currentPassword,
          'old_password': currentPassword,
          'new_password': newPassword,
          'confirm_password': confirmPassword,
        },
      );

      final data = response.data;
      if (data != null && data['success'] == true) {
        return {'success': true, 'message': data['message'] ?? 'Password changed successfully'};
      }
      return {'success': false, 'message': data?['message'] ?? 'Failed to change password'};
    } on DioException catch (e) {
      final msg = e.response?.data?['message']?.toString() ?? e.message ?? "Failed to change password";
      return {'success': false, 'message': msg};
    } catch (e) {
      return {'success': false, 'message': 'An unexpected error occurred'};
    } finally {
      _isChangingPassword = false;
      notifyListeners();
    }
  }

  // API: Upload Profile Photo
  Future<Map<String, dynamic>> uploadProfilePhoto(String filePath) async {
    _isUploadingPhoto = true;
    notifyListeners();

    try {
      final formData = FormData.fromMap({
        'profile_image': await MultipartFile.fromFile(
          filePath,
          filename: 'profile_${DateTime.now().millisecondsSinceEpoch}.jpg',
        ),
      });

      final response = await apiClient.dio.put(
        ApiConstants.profilePhoto,
        data: formData,
      );

      final data = response.data;
      if (data != null && data['success'] == true) {
        // Re-fetch updated profile to get new photo path
        await fetchProfile();
        return {'success': true, 'message': data['message'] ?? 'Photo uploaded successfully'};
      }
      return {'success': false, 'message': data?['message'] ?? 'Failed to upload photo'};
    } on DioException catch (e) {
      final msg = e.response?.data?['message']?.toString() ?? e.message ?? "Upload error";
      return {'success': false, 'message': msg};
    } catch (e) {
      return {'success': false, 'message': 'Failed to upload image'};
    } finally {
      _isUploadingPhoto = false;
      notifyListeners();
    }
  }

  // API: Remove Profile Photo
  Future<Map<String, dynamic>> removeProfilePhoto() async {
    _isUploadingPhoto = true;
    notifyListeners();

    try {
      final response = await apiClient.dio.delete(ApiConstants.profilePhoto);
      final data = response.data;
      if (data != null && data['success'] == true) {
        if (_profile != null) {
          _profile = _profile!.copyWith(profileImage: '');
        }
        return {'success': true, 'message': data['message'] ?? 'Photo removed successfully'};
      }
      return {'success': false, 'message': data?['message'] ?? 'Failed to remove photo'};
    } on DioException catch (e) {
      final msg = e.response?.data?['message']?.toString() ?? e.message ?? "Remove photo error";
      return {'success': false, 'message': msg};
    } catch (e) {
      return {'success': false, 'message': 'Failed to remove image'};
    } finally {
      _isUploadingPhoto = false;
      notifyListeners();
    }
  }

  // API: Fetch Company Settings
  Future<void> fetchCompanySettings() async {
    try {
      final response = await apiClient.dio.get(ApiConstants.companySettings);
      if (response.data != null && response.data['success'] == true && response.data['data'] != null) {
        final dynamic raw = response.data['data'];
        if (raw is List && raw.isNotEmpty) {
          _companySettings = CompanySettingsModel.fromJson(raw[0] as Map<String, dynamic>);
        } else if (raw is Map<String, dynamic>) {
          _companySettings = CompanySettingsModel.fromJson(raw);
        }
        notifyListeners();
      }
    } catch (e) {
      debugPrint("Error fetching company settings: $e");
    }
  }
}

