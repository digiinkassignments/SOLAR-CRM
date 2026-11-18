import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import '../core/constants/api_constants.dart';
import '../core/network/api_client.dart';
import '../models/subsidy_model.dart';
import '../models/loan_model.dart';

class FinancingProvider extends ChangeNotifier {
  final ApiClient apiClient;

  // --- Subsidies State ---
  List<SubsidyItemModel> _subsidies = [];
  int _totalSubsidies = 0;
  bool _isLoadingSubsidies = false;
  String? _subsidiesError;

  // Selected Subsidy Details & Documents
  SubsidyItemModel? _activeSubsidy;
  List<SubsidyDocumentModel> _activeDocuments = [];
  bool _isLoadingDetails = false;
  bool _isUploadingDoc = false;

  // --- Loans State ---
  List<LoanItemModel> _loans = [];
  int _totalLoans = 0;
  LoanStatsModel _loanStats = LoanStatsModel();
  bool _isLoadingLoans = false;
  String? _loansError;
  bool _isSubmittingLoan = false;

  FinancingProvider({required this.apiClient});

  // Getters - Subsidies
  List<SubsidyItemModel> get subsidies => _subsidies;
  int get totalSubsidies => _totalSubsidies;
  bool get isLoadingSubsidies => _isLoadingSubsidies;
  String? get subsidiesError => _subsidiesError;
  SubsidyItemModel? get activeSubsidy => _activeSubsidy;
  List<SubsidyDocumentModel> get activeDocuments => _activeDocuments;
  bool get isLoadingDetails => _isLoadingDetails;
  bool get isUploadingDoc => _isUploadingDoc;

  // Getters - Loans
  List<LoanItemModel> get loans => _loans;
  int get totalLoans => _totalLoans;
  LoanStatsModel get loanStats => _loanStats;
  bool get isLoadingLoans => _isLoadingLoans;
  String? get loansError => _loansError;
  bool get isSubmittingLoan => _isSubmittingLoan;

  String get baseApiUrl => apiClient.dio.options.baseUrl;

  // ==========================================
  // SUBSIDIES API METHODS
  // ==========================================

  // 1. Fetch Subsidies List
  Future<void> fetchSubsidies({String? search, String? status, int page = 1, int limit = 20}) async {
    _isLoadingSubsidies = true;
    _subsidiesError = null;
    notifyListeners();

    try {
      final query = <String, dynamic>{
        'page': page,
        'limit': limit,
      };
      if (search != null && search.trim().isNotEmpty) query['search'] = search.trim();
      if (status != null && status != 'All' && status.isNotEmpty) query['status'] = status;

      final response = await apiClient.dio.get(
        ApiConstants.subsidiesList,
        queryParameters: query,
      );

      if (response.data != null && response.data['success'] == true) {
        final data = response.data['data'];
        List rawList = [];
        if (data is Map && data['rows'] != null) {
          rawList = data['rows'] as List;
          _totalSubsidies = data['count'] is int ? data['count'] : int.tryParse(data['count']?.toString() ?? '0') ?? rawList.length;
        } else if (data is List) {
          rawList = data;
          _totalSubsidies = rawList.length;
        }

        _subsidies = rawList.map((j) => SubsidyItemModel.fromJson(j as Map<String, dynamic>)).toList();
      }
    } catch (e) {
      debugPrint("Error fetching subsidies: $e");
      _subsidiesError = "Failed to load subsidies list";
    } finally {
      _isLoadingSubsidies = false;
      notifyListeners();
    }
  }

  // 2. Fetch Subsidy Details & Documents by LeadId
  Future<void> fetchSubsidyDetails(int leadId) async {
    _isLoadingDetails = true;
    notifyListeners();

    try {
      final response = await apiClient.dio.get(ApiConstants.subsidyByLead(leadId));
      if (response.data != null && response.data['success'] == true && response.data['data'] != null) {
        final d = response.data['data'];
        if (d['subsidy'] != null && d['subsidy'] is Map) {
          _activeSubsidy = SubsidyItemModel.fromJson(d['subsidy'] as Map<String, dynamic>);
        }
        if (d['documents'] != null && d['documents'] is List) {
          _activeDocuments = (d['documents'] as List)
              .map((doc) => SubsidyDocumentModel.fromJson(doc as Map<String, dynamic>))
              .toList();
        } else {
          _activeDocuments = [];
        }
      }
    } catch (e) {
      debugPrint("Error fetching subsidy details: $e");
    } finally {
      _isLoadingDetails = false;
      notifyListeners();
    }
  }

  // 3. Apply or Update Subsidy Portal Details
  Future<Map<String, dynamic>> applySubsidy(Map<String, dynamic> payload) async {
    try {
      final response = await apiClient.dio.post(
        ApiConstants.applySubsidy,
        data: payload,
      );
      if (response.data != null && response.data['success'] == true) {
        if (payload['lead_id'] != null) {
          await fetchSubsidyDetails(payload['lead_id'] as int);
        }
        await fetchSubsidies();
        return {'success': true, 'message': response.data['message'] ?? 'Subsidy application saved'};
      }
      return {'success': false, 'message': response.data?['message'] ?? 'Failed to save'};
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
  }

  // 4. Upload Customer Subsidy Document (Camera / Gallery)
  Future<Map<String, dynamic>> uploadSubsidyDocument({
    required int leadId,
    required String docType,
    required String filePath,
  }) async {
    _isUploadingDoc = true;
    notifyListeners();

    try {
      final formData = FormData.fromMap({
        'lead_id': leadId,
        'document_type': docType,
        'document': await MultipartFile.fromFile(
          filePath,
          filename: '${docType}_${DateTime.now().millisecondsSinceEpoch}.jpg',
        ),
      });

      final response = await apiClient.dio.post(
        ApiConstants.subsidyUploadDoc,
        data: formData,
      );

      if (response.data != null && response.data['success'] == true) {
        await fetchSubsidyDetails(leadId);
        return {'success': true, 'message': response.data['message'] ?? 'Document uploaded successfully'};
      }
      return {'success': false, 'message': response.data?['message'] ?? 'Upload failed'};
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    } finally {
      _isUploadingDoc = false;
      notifyListeners();
    }
  }

  // 5. Verify Document
  Future<bool> verifyDocument({
    required int docId,
    required int leadId,
    required String status,
    String? reason,
  }) async {
    try {
      final response = await apiClient.dio.put(
        ApiConstants.subsidyVerifyDoc(docId),
        data: {
          'verification_status': status,
          if (reason != null && reason.isNotEmpty) 'rejection_reason': reason,
        },
      );
      if (response.data != null && response.data['success'] == true) {
        await fetchSubsidyDetails(leadId);
        return true;
      }
    } catch (e) {
      debugPrint("Error verifying document: $e");
    }
    return false;
  }

  // ==========================================
  // LOANS API METHODS
  // ==========================================

  // 1. Fetch Loans List
  Future<void> fetchLoans({String? search, String? stage, String? bank, int page = 1, int limit = 20}) async {
    _isLoadingLoans = true;
    _loansError = null;
    notifyListeners();

    try {
      final query = <String, dynamic>{
        'page': page,
        'limit': limit,
      };
      if (search != null && search.trim().isNotEmpty) query['search'] = search.trim();
      if (stage != null && stage != 'All' && stage.isNotEmpty) query['stage'] = stage;
      if (bank != null && bank != 'All' && bank.isNotEmpty) query['bank'] = bank;

      final response = await apiClient.dio.get(
        ApiConstants.loans,
        queryParameters: query,
      );

      if (response.data != null && response.data['success'] == true) {
        final data = response.data['data'];
        List rawList = [];
        if (data is Map && data['loans'] != null) {
          rawList = data['loans'] as List;
          _totalLoans = data['total'] is int ? data['total'] : int.tryParse(data['total']?.toString() ?? '0') ?? rawList.length;
        } else if (data is List) {
          rawList = data;
          _totalLoans = rawList.length;
        }

        _loans = rawList.map((j) => LoanItemModel.fromJson(j as Map<String, dynamic>)).toList();
      }
    } catch (e) {
      debugPrint("Error fetching loans: $e");
      _loansError = "Failed to load solar loans";
    } finally {
      _isLoadingLoans = false;
      notifyListeners();
    }
  }

  // 2. Fetch Loan Stats
  Future<void> fetchLoanStats() async {
    try {
      final response = await apiClient.dio.get(ApiConstants.loanStats);
      if (response.data != null && response.data['success'] == true && response.data['data'] != null) {
        _loanStats = LoanStatsModel.fromJson(response.data['data'] as Map<String, dynamic>);
        notifyListeners();
      }
    } catch (e) {
      debugPrint("Error fetching loan stats: $e");
    }
  }

  // 3. Create Loan
  Future<Map<String, dynamic>> createLoan(Map<String, dynamic> payload) async {
    _isSubmittingLoan = true;
    notifyListeners();

    try {
      final response = await apiClient.dio.post(
        ApiConstants.loans,
        data: payload,
      );
      if (response.data != null && response.data['success'] == true) {
        await fetchLoans();
        await fetchLoanStats();
        return {'success': true, 'message': response.data['message'] ?? 'Loan application created'};
      }
      return {'success': false, 'message': response.data?['message'] ?? 'Failed to create loan'};
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    } finally {
      _isSubmittingLoan = false;
      notifyListeners();
    }
  }

  // 4. Update Loan (Stage, Sanction, Disbursement, etc.)
  Future<Map<String, dynamic>> updateLoan(int loanId, Map<String, dynamic> payload) async {
    _isSubmittingLoan = true;
    notifyListeners();

    try {
      final response = await apiClient.dio.put(
        ApiConstants.loanDetails(loanId),
        data: payload,
      );
      if (response.data != null && response.data['success'] == true) {
        await fetchLoans();
        await fetchLoanStats();
        return {'success': true, 'message': response.data['message'] ?? 'Loan updated'};
      }
      return {'success': false, 'message': response.data?['message'] ?? 'Update failed'};
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    } finally {
      _isSubmittingLoan = false;
      notifyListeners();
    }
  }

  // 5. Upload Loan Document (Sanction letter, Aadhaar, PAN, Bank Statement)
  Future<Map<String, dynamic>> uploadLoanDocument({
    required int loanId,
    required String docType,
    required String filePath,
  }) async {
    _isUploadingDoc = true;
    notifyListeners();

    try {
      final formData = FormData.fromMap({
        'doc_type': docType,
        'file': await MultipartFile.fromFile(
          filePath,
          filename: 'loan_${docType}_${DateTime.now().millisecondsSinceEpoch}.jpg',
        ),
      });

      final response = await apiClient.dio.post(
        ApiConstants.loanUploadDoc(loanId),
        data: formData,
      );

      if (response.data != null && response.data['success'] == true) {
        await fetchLoans();
        return {'success': true, 'message': response.data['message'] ?? 'Loan document uploaded'};
      }
      return {'success': false, 'message': response.data?['message'] ?? 'Upload failed'};
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    } finally {
      _isUploadingDoc = false;
      notifyListeners();
    }
  }
}

