import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import '../core/constants/api_constants.dart';
import '../core/network/api_client.dart';
import '../models/survey_model.dart';
import 'auth_provider.dart';

class SurveyProvider extends ChangeNotifier {
  final ApiClient apiClient;

  SurveyProvider({required this.apiClient}) {
    AuthProvider.registerResetCallback(reset);
  }

  void reset() {
    _surveys = [];
    _activeDocuments = [];
    _isLoading = false;
    _isSubmitting = false;
    _isLoadingDocuments = false;
    _errorMessage = null;
    _documentErrorMessage = null;
    _uploadingCategory = null;
    _selectedFilter = "all";
    _searchQuery = "";
    notifyListeners();
  }

  List<SurveyModel> _surveys = [];
  List<SurveyDocumentModel> _activeDocuments = [];
  bool _isLoading = false;
  bool _isSubmitting = false;
  bool _isLoadingDocuments = false;
  String? _errorMessage;
  String? _documentErrorMessage;
  String? _uploadingCategory;
  String _selectedFilter = "all";
  String _searchQuery = "";

  List<SurveyModel> get surveys => _surveys;
  List<SurveyDocumentModel> get activeDocuments => _activeDocuments;
  List<SurveyModel> get scheduledSurveys => _surveys.where((s) => s.isScheduled).toList();
  List<SurveyModel> get completedSurveys => _surveys.where((s) => s.isCompleted).toList();
  bool get isLoading => _isLoading;
  bool get isSubmitting => _isSubmitting;
  bool get isLoadingDocuments => _isLoadingDocuments;
  String? get errorMessage => _errorMessage;
  String? get documentErrorMessage => _documentErrorMessage;
  String? get uploadingCategory => _uploadingCategory;
  String get selectedFilter => _selectedFilter;
  String get searchQuery => _searchQuery;

  int get totalCount => _surveys.length;
  int get scheduledCount => _surveys.where((s) => s.isScheduled).length;
  int get completedCount => _surveys.where((s) => s.isCompleted).length;

  Future<void> fetchSurveys({
    String? filter,
    String? search,
    bool isRefresh = false,
  }) async {
    if (filter != null) _selectedFilter = filter;
    if (search != null) _searchQuery = search;

    if (!isRefresh && _surveys.isNotEmpty) {
      // Don't flash full screen spinner on warm reload
    } else {
      _isLoading = true;
      _errorMessage = null;
      notifyListeners();
    }

    try {
      final queryParams = <String, dynamic>{};
      if (_searchQuery.trim().isNotEmpty) {
        queryParams['search'] = _searchQuery.trim();
      }
      if (_selectedFilter == "scheduled" || _selectedFilter == "completed") {
        queryParams['status'] = _selectedFilter;
      }

      final response = await apiClient.dio.get(
        ApiConstants.surveys,
        queryParameters: queryParams,
      );

      final resData = response.data;
      if (resData['success'] == true && resData['data'] is List) {
        final list = resData['data'] as List;
        _surveys = list
            .map((e) => SurveyModel.fromJson(Map<String, dynamic>.from(e as Map)))
            .toList();
        _errorMessage = null;
      } else {
        _errorMessage = resData['message'] ?? 'Failed to load site surveys.';
      }
    } on DioException catch (e) {
      if (e.response?.data is Map && e.response?.data['message'] != null) {
        _errorMessage = e.response?.data['message'];
      } else {
        _errorMessage = 'Network error loading surveys. Pull down to refresh.';
      }
    } catch (e) {
      _errorMessage = 'An unexpected error occurred: $e';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // ── Survey Documents APIs ──

  Future<List<SurveyDocumentModel>> fetchSurveyDocuments(int surveyId) async {
    _isLoadingDocuments = true;
    _documentErrorMessage = null;
    notifyListeners();

    try {
      final response = await apiClient.dio.get(
        ApiConstants.surveyDocuments(surveyId),
      );

      final resData = response.data;
      if (resData != null && resData['success'] == true && resData['data'] is List) {
        final list = resData['data'] as List;
        _activeDocuments = list
            .map((e) => SurveyDocumentModel.fromJson(
                  Map<String, dynamic>.from(e as Map),
                  fallbackSurveyId: surveyId,
                ))
            .toList();
        _documentErrorMessage = null;
        return _activeDocuments;
      } else {
        _documentErrorMessage = resData?['message'] ?? 'Failed to load survey documents.';
        return [];
      }
    } on DioException catch (e) {
      _documentErrorMessage = e.response?.data is Map && e.response?.data['message'] != null
          ? e.response?.data['message']
          : 'Network error loading survey documents.';
      return [];
    } catch (e) {
      _documentErrorMessage = 'Error: $e';
      return [];
    } finally {
      _isLoadingDocuments = false;
      notifyListeners();
    }
  }

  Future<Map<String, dynamic>> uploadSurveyDocument({
    required int surveyId,
    required String category,
    required String filePath,
    String? fileName,
  }) async {
    _uploadingCategory = category;
    _documentErrorMessage = null;
    notifyListeners();

    try {
      final file = File(filePath);
      if (!await file.exists()) {
        const msg = 'Selected file does not exist on device.';
        _documentErrorMessage = msg;
        return {'success': false, 'message': msg};
      }

      final fileSize = await file.length();
      if (fileSize > 8 * 1024 * 1024) {
        const msg = 'Each file must be 8 MB or smaller.';
        _documentErrorMessage = msg;
        return {'success': false, 'message': msg};
      }

      final name = fileName ??
          (filePath.split(RegExp(r'[\\/]')).isNotEmpty
              ? filePath.split(RegExp(r'[\\/]')).last
              : 'document.jpg');
      final formData = FormData.fromMap({
        'category': category,
        'file': await MultipartFile.fromFile(
          filePath,
          filename: name,
        ),
      });

      final response = await apiClient.dio.post(
        ApiConstants.surveyDocuments(surveyId),
        data: formData,
      );

      final resData = response.data;
      if (resData != null && resData['success'] == true) {
        // Refresh documents list to reflect immediately
        await fetchSurveyDocuments(surveyId);
        return {
          'success': true,
          'message': resData['message'] ?? 'Document uploaded successfully.',
          'data': resData['data'],
        };
      } else {
        final msg = resData?['message'] ?? 'Document upload failed. Please retry.';
        _documentErrorMessage = msg;
        return {'success': false, 'message': msg};
      }
    } on DioException catch (e) {
      final msg = e.response?.data is Map && e.response?.data['message'] != null
          ? e.response?.data['message']
          : 'Network error uploading survey document. Please retry.';
      _documentErrorMessage = msg;
      return {'success': false, 'message': msg};
    } catch (e) {
      final msg = 'Unexpected upload error: $e';
      _documentErrorMessage = msg;
      return {'success': false, 'message': msg};
    } finally {
      _uploadingCategory = null;
      notifyListeners();
    }
  }

  Future<Uint8List?> fetchDocumentBytes(int surveyId, int documentId) async {
    try {
      final response = await apiClient.dio.get<List<int>>(
        ApiConstants.surveyDocument(surveyId, documentId),
        options: Options(responseType: ResponseType.bytes),
      );
      if (response.data != null) {
        return Uint8List.fromList(response.data!);
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  // ── Survey Completion API ──

  Future<Map<String, dynamic>> completeSurvey(int surveyId, Map<String, dynamic> data) async {
    _isSubmitting = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await apiClient.dio.put(
        "${ApiConstants.surveys}/$surveyId/complete",
        data: data,
      );

      final resData = response.data;
      if (resData['success'] == true) {
        // Refresh list in background
        await fetchSurveys(isRefresh: true);
        return {
          'success': true,
          'message': resData['message'] ?? 'Site survey feasibility completed successfully.',
          'data': resData['data'],
        };
      } else {
        return {
          'success': false,
          'message': resData['message'] ?? 'Failed to complete survey.',
        };
      }
    } on DioException catch (e) {
      final msg = e.response?.data is Map && e.response?.data['message'] != null
          ? e.response?.data['message']
          : 'Network error submitting survey feasibility.';
      return {'success': false, 'message': msg};
    } catch (e) {
      return {'success': false, 'message': 'Unexpected error: $e'};
    } finally {
      _isSubmitting = false;
      notifyListeners();
    }
  }
}
