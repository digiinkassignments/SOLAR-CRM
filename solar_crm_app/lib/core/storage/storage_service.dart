import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

class StorageService {
  static const _secureStorage = FlutterSecureStorage();
  
  static const String _keyToken = "auth_token";
  static const String _keyUserJson = "user_profile_json";
  static const String _keyTenantJson = "tenant_info_json";
  static const String _keyWorkspace = "workspace_subdomain";
  static const String _keySavedLogin = "saved_login_identifier";

  // Save Token
  static Future<void> saveToken(String token) async {
    await _secureStorage.write(key: _keyToken, value: token);
  }

  // Get Token
  static Future<String?> getToken() async {
    return await _secureStorage.read(key: _keyToken);
  }

  // Clear Session
  static Future<void> clearAuth() async {
    await _secureStorage.delete(key: _keyToken);
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_keyUserJson);
  }

  // Save Workspace Subdomain (e.g. "amprisiaenergies")
  static Future<void> saveWorkspace(String workspace) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyWorkspace, workspace.trim().toLowerCase());
  }

  // Get Workspace Subdomain
  static Future<String?> getWorkspace() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_keyWorkspace);
  }

  // Clear Workspace Subdomain
  static Future<void> clearWorkspace() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_keyWorkspace);
    await prefs.remove(_keyTenantJson);
  }

  // Save User JSON
  static Future<void> saveUserJson(String jsonStr) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyUserJson, jsonStr);
  }

  // Get User JSON
  static Future<String?> getUserJson() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_keyUserJson);
  }

  // Save Tenant JSON
  static Future<void> saveTenantJson(String jsonStr) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyTenantJson, jsonStr);
  }

  // Get Tenant JSON
  static Future<String?> getTenantJson() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_keyTenantJson);
  }

  // Saved login identifier (Remember me)
  static Future<void> saveLoginIdentifier(String identifier) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keySavedLogin, identifier);
  }

  static Future<String?> getSavedLoginIdentifier() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_keySavedLogin);
  }

  static Future<void> clearSavedLoginIdentifier() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_keySavedLogin);
  }
}
