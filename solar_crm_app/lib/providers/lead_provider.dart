import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import '../core/constants/api_constants.dart';
import '../core/network/api_client.dart';
import '../models/lead_model.dart';

class LeadProvider extends ChangeNotifier {
  final ApiClient apiClient;

  LeadProvider({required this.apiClient});

  List<LeadModel> _leads = [];
  bool _isLoading = false;
  String? _errorMessage;

  int _currentPage = 1;
  int _totalPages = 1;
  int _totalRecords = 0;
  bool _isTodayFollowupsOnly = false;
  int _todaysFollowupsCount = 0;

  String _searchQuery = "";
  String _selectedStatus = "All";
  String _selectedPriority = "All";

  LeadModel? _selectedLead;
  AiCopilotModel? _aiCopilotData;
  bool _isLoadingAi = false;
  String? _aiError;

  List<LeadFollowupItem> _leadFollowups = [];
  bool _isLoadingFollowups = false;

  List<LeadModel> get leads => _leads;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  int get totalRecords => _totalRecords;
  int get currentPage => _currentPage;
  int get totalPages => _totalPages;
  bool get isTodayFollowupsOnly => _isTodayFollowupsOnly;
  int get todaysFollowupsCount => _todaysFollowupsCount;

  String get searchQuery => _searchQuery;
  String get selectedStatus => _selectedStatus;
  String get selectedPriority => _selectedPriority;

  LeadModel? get selectedLead => _selectedLead;
  AiCopilotModel? get aiCopilotData => _aiCopilotData;
  bool get isLoadingAi => _isLoadingAi;
  String? get aiError => _aiError;

  List<LeadFollowupItem> get leadFollowups => _leadFollowups;
  bool get isLoadingFollowups => _isLoadingFollowups;

  /// Toggle Today's Followups vs All Pipeline Leads
  Future<void> toggleTodayFollowups(bool isToday) async {
    if (_isTodayFollowupsOnly == isToday) return;
    _isTodayFollowupsOnly = isToday;
    _currentPage = 1;
    await fetchLeads(isRefresh: true);
  }

  /// Go to specific page (1, 2, 3...)
  Future<void> goToPage(int page) async {
    if (page < 1 || page > _totalPages || page == _currentPage) return;
    _currentPage = page;
    await fetchLeads(page: page);
  }

  /// Fetch leads with filters & 10-per-page pagination
  Future<void> fetchLeads({
    bool isRefresh = false,
    String? search,
    String? status,
    String? priority,
    int? page,
  }) async {
    if (search != null) _searchQuery = search;
    if (status != null) _selectedStatus = status;
    if (priority != null) _selectedPriority = priority;
    if (page != null) _currentPage = page;

    if (isRefresh) {
      _currentPage = 1;
    }

    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final queryParams = <String, dynamic>{
        'page': _currentPage,
        'limit': 10,
      };

      if (_searchQuery.trim().isNotEmpty) {
        queryParams['search'] = _searchQuery.trim();
      }
      if (_selectedStatus.isNotEmpty && _selectedStatus != "All") {
        queryParams['status'] = _selectedStatus;
      }
      if (_selectedPriority.isNotEmpty && _selectedPriority != "All") {
        queryParams['priority'] = _selectedPriority;
      }

      if (_isTodayFollowupsOnly) {
        queryParams['filter'] = 'today';
      }

      final endpoint = _isTodayFollowupsOnly
          ? ApiConstants.followupsCalendar
          : ApiConstants.leads;

      final response = await apiClient.dio.get(
        endpoint,
        queryParameters: queryParams,
      );

      final resData = response.data;
      if (resData['success'] == true) {
        final list = (resData['data'] as List? ?? [])
            .map((e) => LeadModel.fromJson(e as Map<String, dynamic>))
            .toList();

        // Exactly 10 items for the selected page
        _leads = list;

        int total = 0;
        if (resData['pagination'] != null && resData['pagination']['total'] != null) {
          total = resData['pagination']['total'];
        } else if (resData['total'] != null) {
          total = int.tryParse(resData['total'].toString()) ?? list.length;
        } else {
          total = list.length;
        }

        _totalRecords = total;
        _totalPages = (total / 10).ceil().clamp(1, 9999);

        if (_isTodayFollowupsOnly) {
          _todaysFollowupsCount = total;
        }

        _errorMessage = null;
      } else {
        _errorMessage = resData['message'] ?? 'Failed to load leads.';
      }
    } on DioException catch (e) {
      if (e.response?.data is Map && e.response?.data['message'] != null) {
        _errorMessage = e.response?.data['message'];
      } else {
        _errorMessage = "Network error. Pull down to refresh.";
      }
    } catch (e) {
      _errorMessage = "An unexpected error occurred: $e";
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Fetch AI Copilot deal advisory for lead with automatic resilience fallback
  Future<void> fetchAiCopilot(int leadId, [LeadModel? leadRef]) async {
    _isLoadingAi = true;
    _aiCopilotData = null;
    _aiError = null;
    notifyListeners();

    try {
      final response = await apiClient.dio.get(
        "${ApiConstants.aiCopilot}/$leadId",
        options: Options(
          receiveTimeout: const Duration(seconds: 15),
          sendTimeout: const Duration(seconds: 10),
        ),
      );
      final resData = response.data;
      if (resData['success'] == true && resData['data'] != null) {
        _aiCopilotData = AiCopilotModel.fromJson(resData['data']);
        _aiError = null;
      } else {
        _fallbackOrSetError(leadId, leadRef, resData['message']);
      }
    } catch (_) {
      _fallbackOrSetError(leadId, leadRef, "Live AI service unreachable.");
    } finally {
      _isLoadingAi = false;
      notifyListeners();
    }
  }

  void _fallbackOrSetError(int leadId, LeadModel? leadRef, String? serverMsg) {
    LeadModel? lead = leadRef;
    if (lead == null) {
      try {
        lead = _leads.firstWhere((l) => l.id == leadId);
      } catch (_) {
        lead = null;
      }
    }

    if (lead != null) {
      _aiCopilotData = _generateLocalHeuristicCopilot(lead);
      _aiError = null;
    } else {
      _aiError = serverMsg ?? "Could not connect to AI advisor. Pull down to retry.";
    }
  }

  AiCopilotModel _generateLocalHeuristicCopilot(LeadModel lead) {
    final kw = lead.requiredKw > 0 ? lead.requiredKw : 3.0;
    final bill = (lead.monthlyConsumptionUnits != null && lead.monthlyConsumptionUnits! > 0)
        ? (lead.monthlyConsumptionUnits! * 8.0)
        : (kw * 1200.0);
    final name = lead.customerName.isNotEmpty ? lead.customerName : "Customer";
    final city = lead.city != null && lead.city!.isNotEmpty ? "${lead.city}, " : "";
    final state = lead.state ?? "India";

    String subsidy = "₹78,000 (Maximum direct DBT subsidy)";
    if (kw <= 1) {
      subsidy = "₹33,000 direct DBT subsidy";
    } else if (kw <= 2) {
      subsidy = "₹66,000 direct DBT subsidy";
    }

    int winScore = 65;
    if (bill >= 4000) winScore += 15;
    if (lead.quotationAmount > 0) winScore += 10;
    if (lead.status == "Site Visit Scheduled" || lead.status == "Quotation Sent") winScore += 10;
    if (lead.priority == "High") winScore += 5;
    if (winScore > 95) winScore = 95;

    final dealHealth = winScore >= 80 ? "High Priority Deal" : winScore >= 60 ? "Moderate Interest" : "Nurturing Required";
    final unitsPerDayMin = (kw * 4).toStringAsFixed(0);
    final unitsPerDayMax = (kw * 4.5).toStringAsFixed(1);
    final savingsMonth = (bill * 0.9).round();
    final savingsYear = (savingsMonth * 12).round();

    return AiCopilotModel(
      winProbability: winScore,
      dealHealth: dealHealth,
      executiveAssessment:
          "$name has an estimated monthly electricity bill of ₹${bill.toInt()} and requires a ${kw.toStringAsFixed(1)}kW system. Eligible for direct DBT subsidy under PM Surya Ghar Muft Bijli Yojana with an estimated payback period of 3.2 years.",
      recommendedSystem: "${kw.toStringAsFixed(1)}kW On-Grid Rooftop Solar System (Generates ~$unitsPerDayMin-$unitsPerDayMax units/day)",
      estimatedSubsidy: subsidy,
      estimatedSavings: "Save approx ₹$savingsMonth/month (₹$savingsYear/year)",
      keyObjectionTips: "Customer upfront cost ya budget ka puche toh zero-downpayment / low-cost 5 year solar EMI (₹2,500 - ₹3,500/month) pitch karein.",
      talkingPoints: [
        "Namaste $name ji, Main Solar Advisor baat kar raha hoon aapki $city$state solar inquiry ke sandarbh mein.",
        "Aapka bijli bill lagbhag ₹${bill.toInt()}/month aata hai, jise on-grid solar system install karke 90% tak kam kiya ja sakta hai.",
        "PM Surya Ghar Muft Bijli Yojana ke tehat $subsidy direct aapke account mein transfer hoti hai.",
        "Kripya batayein, hamare technical engineer kal site inspection aur roof measurement ke liye kab visit kar sakte hain?",
      ],
      whatsappPitches: {
        "formal": "Dear $name ji,\n\nGreetings from Solar Advisory Team.\n\nRegarding your solar rooftop requirement of ${kw.toStringAsFixed(1)}kW at $city$state:\n\n- Reduce monthly bill of ~₹${bill.toInt()} by up to 90%\n- Central Government Subsidy: $subsidy via DBT\n- 25 Years Panel Performance Warranty\n\nMay we schedule a complimentary 15-minute site visit this week?\n\nWarm regards,\nSolar Advisory Team",
        "subsidy_focus": "Namaste $name ji,\n\nPM Surya Ghar Muft Bijli Yojana ke tehat aapke ghar par ${kw.toStringAsFixed(1)}kW Rooftop Solar lagwane par sarkar ki taraf se direct $subsidy uplabdh hai.\n\nCurrent Monthly Bill: ~₹${bill.toInt()}\nExpected Bill After Solar: ₹0 to ₹300 per month\n\nKya hum kal aapka complimentary technical site survey schedule karein?\n\nRegards,\nSolar Advisory Team",
        "urgent_followup": "Hello $name ji, Quick follow-up regarding your solar rooftop proposal. Customized quotation aur net-metering subsidy report ready hai. Kripya batayein call par kab connect kar sakte hain.",
      },
    );
  }

  /// Fetch Follow-up history for a lead
  Future<void> fetchFollowups(int leadId) async {
    _isLoadingFollowups = true;
    _leadFollowups = [];
    notifyListeners();

    try {
      final response = await apiClient.dio.get("${ApiConstants.leads}/$leadId/followups");
      final resData = response.data;
      if (resData['success'] == true && resData['data'] != null) {
        _leadFollowups = (resData['data'] as List)
            .map((e) => LeadFollowupItem.fromJson(e as Map<String, dynamic>))
            .toList();
      }
    } catch (e) {
      debugPrint("fetchFollowups error: $e");
    } finally {
      _isLoadingFollowups = false;
      notifyListeners();
    }
  }

  /// Log Call & Add Follow-up
  Future<Map<String, dynamic>> addFollowup({
    required int leadId,
    required String followupDate,
    required String followupTime,
    required String note,
    required String status,
    String followupType = "Call",
  }) async {
    try {
      final response = await apiClient.dio.post(
        "${ApiConstants.leads}/$leadId/followups",
        data: {
          'followup_date': followupDate,
          'followup_time': followupTime,
          'note': note,
          'status': status,
          'followup_type': followupType,
        },
      );

      final resData = response.data;
      if (resData['success'] == true) {
        await fetchLeads(isRefresh: true);
        return {'success': true, 'message': resData['message'] ?? 'Follow-up logged successfully.'};
      } else {
        return {'success': false, 'message': resData['message'] ?? 'Failed to log follow-up.'};
      }
    } on DioException catch (e) {
      final msg = e.response?.data is Map && e.response?.data['message'] != null
          ? e.response?.data['message']
          : 'Failed to record follow-up.';
      return {'success': false, 'message': msg};
    } catch (e) {
      return {'success': false, 'message': 'An error occurred: $e'};
    }
  }

  /// Update Lead Pipeline Status
  Future<Map<String, dynamic>> updateLeadStatus(int leadId, String status, {String? remarks}) async {
    try {
      final response = await apiClient.dio.patch(
        "${ApiConstants.leads}/$leadId/status",
        data: {
          'status': status,
          if (remarks != null && remarks.isNotEmpty) 'remarks': remarks,
        },
      );

      final resData = response.data;
      if (resData['success'] == true) {
        await fetchLeads(isRefresh: true);
        return {'success': true, 'message': resData['message'] ?? 'Status updated to $status.'};
      } else {
        return {'success': false, 'message': resData['message'] ?? 'Failed to update status.'};
      }
    } on DioException catch (e) {
      final msg = e.response?.data is Map && e.response?.data['message'] != null
          ? e.response?.data['message']
          : 'Failed to update lead status.';
      return {'success': false, 'message': msg};
    } catch (e) {
      return {'success': false, 'message': 'An error occurred: $e'};
    }
  }

  /// Create New Lead
  Future<Map<String, dynamic>> createLead(Map<String, dynamic> data) async {
    try {
      final response = await apiClient.dio.post(
        ApiConstants.leads,
        data: data,
      );

      final resData = response.data;
      if (resData['success'] == true) {
        await fetchLeads(isRefresh: true);
        return {'success': true, 'message': resData['message'] ?? 'Lead registered successfully.'};
      } else {
        return {'success': false, 'message': resData['message'] ?? 'Failed to register lead.'};
      }
    } on DioException catch (e) {
      final msg = e.response?.data is Map && e.response?.data['message'] != null
          ? e.response?.data['message']
          : 'Failed to create lead.';
      return {'success': false, 'message': msg};
    } catch (e) {
      return {'success': false, 'message': 'An error occurred: $e'};
    }
  }

  /// Update Lead
  Future<Map<String, dynamic>> updateLead(int leadId, Map<String, dynamic> data) async {
    try {
      final response = await apiClient.dio.put(
        "${ApiConstants.leads}/$leadId",
        data: data,
      );

      final resData = response.data;
      if (resData['success'] == true) {
        await fetchLeads(isRefresh: true);
        return {'success': true, 'message': resData['message'] ?? 'Lead updated successfully.'};
      } else {
        return {'success': false, 'message': resData['message'] ?? 'Failed to update lead.'};
      }
    } on DioException catch (e) {
      final msg = e.response?.data is Map && e.response?.data['message'] != null
          ? e.response?.data['message']
          : 'Failed to update lead.';
      return {'success': false, 'message': msg};
    } catch (e) {
      return {'success': false, 'message': 'An error occurred: $e'};
    }
  }

  /// Assign Lead to Rep
  Future<Map<String, dynamic>> assignLead(int leadId, int assigneeId) async {
    try {
      final response = await apiClient.dio.post(
        "${ApiConstants.leads}/$leadId/assign",
        data: {'assigned_to': assigneeId},
      );

      final resData = response.data;
      if (resData['success'] == true) {
        await fetchLeads(isRefresh: true);
        return {'success': true, 'message': resData['message'] ?? 'Lead assigned successfully.'};
      } else {
        return {'success': false, 'message': resData['message'] ?? 'Failed to assign lead.'};
      }
    } on DioException catch (e) {
      final msg = e.response?.data is Map && e.response?.data['message'] != null
          ? e.response?.data['message']
          : 'Failed to assign lead.';
      return {'success': false, 'message': msg};
    } catch (e) {
      return {'success': false, 'message': 'An error occurred: $e'};
    }
  }

  /// Delete Lead
  Future<Map<String, dynamic>> deleteLead(int leadId) async {
    try {
      final response = await apiClient.dio.delete("${ApiConstants.leads}/$leadId");
      final resData = response.data;
      if (resData['success'] == true) {
        _leads.removeWhere((l) => l.id == leadId);
        notifyListeners();
        return {'success': true, 'message': 'Lead deleted successfully.'};
      } else {
        return {'success': false, 'message': resData['message'] ?? 'Failed to delete lead.'};
      }
    } on DioException catch (e) {
      final msg = e.response?.data is Map && e.response?.data['message'] != null
          ? e.response?.data['message']
          : 'Failed to delete lead.';
      return {'success': false, 'message': msg};
    } catch (e) {
      return {'success': false, 'message': 'An error occurred: $e'};
    }
  }
}

