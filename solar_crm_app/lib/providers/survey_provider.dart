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
    _isLoading = false;
    _isSubmitting = false;
    _errorMessage = null;
    _selectedFilter = "all";
    _searchQuery = "";
    notifyListeners();
  }

  List<SurveyModel> _surveys = [];
  bool _isLoading = false;
  bool _isSubmitting = false;
  String? _errorMessage;
  String _selectedFilter = "all";
  String _searchQuery = "";

  List<SurveyModel> get surveys => _surveys;
  List<SurveyModel> get scheduledSurveys => _surveys.where((s) => s.isScheduled).toList();
  List<SurveyModel> get completedSurveys => _surveys.where((s) => s.isCompleted).toList();
  bool get isLoading => _isLoading;
  bool get isSubmitting => _isSubmitting;
  String? get errorMessage => _errorMessage;
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
