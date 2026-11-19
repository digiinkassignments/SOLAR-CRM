import 'package:flutter/foundation.dart';
import '../core/constants/api_constants.dart';
import '../core/network/api_client.dart';
import '../models/invoice_model.dart';
import '../models/quotation_model.dart';
import 'auth_provider.dart';

class FinanceProvider extends ChangeNotifier {
  final ApiClient apiClient;

  FinanceProvider({required this.apiClient}) {
    AuthProvider.registerResetCallback(reset);
  }

  void reset() {
    _quotations = [];
    _isLoadingQuotations = false;
    _quotationsError = null;
    _quotationStatusFilter = "All";
    _quotationSearchQuery = "";
    _invoices = [];
    _isLoadingInvoices = false;
    _invoicesError = null;
    _invoiceStatusFilter = "All";
    _invoiceSearchQuery = "";
    notifyListeners();
  }

  // Quotations State
  List<QuotationModel> _quotations = [];
  bool _isLoadingQuotations = false;
  String? _quotationsError;
  String _quotationStatusFilter = "All";
  String _quotationSearchQuery = "";

  // Invoices State
  List<InvoiceModel> _invoices = [];
  bool _isLoadingInvoices = false;
  String? _invoicesError;
  String _invoiceStatusFilter = "All";
  String _invoiceSearchQuery = "";

  // Getters - Quotations
  List<QuotationModel> get quotations => _quotations;
  bool get isLoadingQuotations => _isLoadingQuotations;
  String? get quotationsError => _quotationsError;
  String get quotationStatusFilter => _quotationStatusFilter;
  String get quotationSearchQuery => _quotationSearchQuery;

  // Getters - Invoices
  List<InvoiceModel> get invoices => _invoices;
  bool get isLoadingInvoices => _isLoadingInvoices;
  String? get invoicesError => _invoicesError;
  String get invoiceStatusFilter => _invoiceStatusFilter;
  String get invoiceSearchQuery => _invoiceSearchQuery;

  // Quotation Metrics
  int get totalQuotationsCount => _quotations.length;
  double get totalQuotationsValue => _quotations.fold(0.0, (sum, q) => sum + q.netPayableAmount);
  int get acceptedQuotationsCount => _quotations.where((q) => q.status.toLowerCase() == "accepted").length;
  int get pendingQuotationsCount => _quotations.where((q) => q.status.toLowerCase() == "sent" || q.status.toLowerCase() == "draft").length;

  // Invoice Metrics
  double get totalInvoicedAmount => _invoices.fold(0.0, (sum, inv) => sum + inv.netPayableAmount);
  double get totalPaymentsReceived => _invoices.fold(0.0, (sum, inv) => sum + inv.amountPaid);
  double get totalBalanceDue => _invoices.fold(0.0, (sum, inv) => sum + inv.balanceDue);
  int get collectionRatePercent {
    if (totalInvoicedAmount <= 0) return 0;
    return ((totalPaymentsReceived / totalInvoicedAmount) * 100).round().clamp(0, 100);
  }

  // Setters for Quotation filters
  void setQuotationStatusFilter(String status) {
    if (_quotationStatusFilter == status) return;
    _quotationStatusFilter = status;
    fetchQuotations();
  }

  void setQuotationSearch(String query) {
    _quotationSearchQuery = query;
    fetchQuotations();
  }

  // Setters for Invoice filters
  void setInvoiceStatusFilter(String status) {
    if (_invoiceStatusFilter == status) return;
    _invoiceStatusFilter = status;
    fetchInvoices();
  }

  void setInvoiceSearch(String query) {
    _invoiceSearchQuery = query;
    fetchInvoices();
  }

  // --- FETCH QUOTATIONS ---
  Future<void> fetchQuotations({bool refresh = false}) async {
    if (!refresh && _isLoadingQuotations) return;
    _isLoadingQuotations = true;
    _quotationsError = null;
    notifyListeners();

    try {
      final queryParams = <String, dynamic>{};
      if (_quotationStatusFilter != "All") {
        queryParams['status'] = _quotationStatusFilter;
      }
      if (_quotationSearchQuery.trim().isNotEmpty) {
        queryParams['search'] = _quotationSearchQuery.trim();
      }

      final response = await apiClient.dio.get(
        ApiConstants.quotations,
        queryParameters: queryParams,
      );

      final resData = response.data;
      if (resData['success'] == true && resData['data'] is List) {
        _quotations = (resData['data'] as List)
            .map((q) => QuotationModel.fromJson(Map<String, dynamic>.from(q)))
            .toList();
      } else {
        _quotations = [];
      }
    } catch (e) {
      _quotationsError = "Failed to load quotations: $e";
      _quotations = [];
    } finally {
      _isLoadingQuotations = false;
      notifyListeners();
    }
  }

  // --- FETCH INVOICES ---
  Future<void> fetchInvoices({bool refresh = false}) async {
    if (!refresh && _isLoadingInvoices) return;
    _isLoadingInvoices = true;
    _invoicesError = null;
    notifyListeners();

    try {
      final queryParams = <String, dynamic>{};
      if (_invoiceStatusFilter != "All") {
        queryParams['payment_status'] = _invoiceStatusFilter;
      }
      if (_invoiceSearchQuery.trim().isNotEmpty) {
        queryParams['search'] = _invoiceSearchQuery.trim();
      }

      final response = await apiClient.dio.get(
        ApiConstants.invoices,
        queryParameters: queryParams,
      );

      final resData = response.data;
      if (resData['success'] == true && resData['data'] is List) {
        _invoices = (resData['data'] as List)
            .map((inv) => InvoiceModel.fromJson(Map<String, dynamic>.from(inv)))
            .toList();
      } else {
        _invoices = [];
      }
    } catch (e) {
      _invoicesError = "Failed to load invoices: $e";
      _invoices = [];
    } finally {
      _isLoadingInvoices = false;
      notifyListeners();
    }
  }

  // --- GET QUOTATION DETAILS (Includes Line Items) ---
  Future<QuotationModel?> getQuotationDetails(int id) async {
    try {
      final response = await apiClient.dio.get(ApiConstants.quotationDetails(id));
      final resData = response.data;
      if (resData['success'] == true && resData['data'] != null) {
        final updated = QuotationModel.fromJson(Map<String, dynamic>.from(resData['data']));
        final index = _quotations.indexWhere((q) => q.id == id);
        if (index != -1) {
          _quotations[index] = updated;
          notifyListeners();
        }
        return updated;
      }
    } catch (_) {}
    return null;
  }

  // --- GET INVOICE DETAILS (Includes Payments & Line Items) ---
  Future<InvoiceModel?> getInvoiceDetails(int id) async {
    try {
      final response = await apiClient.dio.get(ApiConstants.invoiceDetails(id));
      final resData = response.data;
      if (resData['success'] == true && resData['data'] != null) {
        final updated = InvoiceModel.fromJson(Map<String, dynamic>.from(resData['data']));
        final index = _invoices.indexWhere((inv) => inv.id == id);
        if (index != -1) {
          _invoices[index] = updated;
          notifyListeners();
        }
        return updated;
      }
    } catch (_) {}
    return null;
  }

  // --- UPDATE QUOTATION STATUS ---
  Future<bool> updateQuotationStatus(int id, String newStatus) async {
    try {
      final response = await apiClient.dio.patch(
        ApiConstants.quotationStatus(id),
        data: {'status': newStatus},
      );
      if (response.data['success'] == true) {
        await fetchQuotations(refresh: true);
        return true;
      }
    } catch (_) {}
    return false;
  }

  // --- DUPLICATE QUOTATION ---
  Future<bool> duplicateQuotation(int id) async {
    try {
      final response = await apiClient.dio.post(ApiConstants.quotationDuplicate(id));
      if (response.data['success'] == true) {
        await fetchQuotations(refresh: true);
        return true;
      }
    } catch (_) {}
    return false;
  }

  // --- DELETE QUOTATION ---
  Future<bool> deleteQuotation(int id) async {
    try {
      final response = await apiClient.dio.delete(ApiConstants.quotationDelete(id));
      if (response.data['success'] == true) {
        _quotations.removeWhere((q) => q.id == id);
        notifyListeners();
        return true;
      }
    } catch (_) {}
    return false;
  }

  // --- SEND QUOTATION EMAIL ---
  Future<Map<String, dynamic>> sendQuotationEmail(int id) async {
    try {
      final response = await apiClient.dio.post(ApiConstants.quotationSendEmail(id));
      return {
        'success': response.data['success'] == true,
        'message': response.data['message'] ?? "Quotation email sent successfully",
      };
    } catch (e) {
      return {'success': false, 'message': "Failed to send quotation email: $e"};
    }
  }

  // --- CONVERT QUOTATION TO TAX INVOICE ---
  Future<Map<String, dynamic>> convertQuotationToInvoice({
    required QuotationModel quotation,
    double amountPaid = 0.0,
    String paymentMode = "Bank Transfer",
    String? paymentReference,
    String? dueDate,
    String? notes,
  }) async {
    try {
      final lineItemsPayload = quotation.lineItems.map((item) => {
        'name': item.name,
        'description': item.description,
        'quantity': item.quantity,
        'unit': item.unit,
        'unit_price': item.unitPrice,
        'taxable_amount': item.taxableAmount,
        'gst_rate': item.gstRate,
        'gst_amount': item.gstAmount,
        'total_amount': item.totalAmount,
      }).toList();

      final payload = {
        'quotation_id': quotation.id,
        'lead_id': quotation.leadId,
        'customer_name': quotation.customerName,
        'customer_phone': quotation.customerPhone,
        'customer_email': quotation.customerEmail,
        'customer_address': quotation.customerAddress,
        'city': quotation.city,
        'state': quotation.state,
        'pincode': quotation.pincode,
        'system_capacity_kw': quotation.systemCapacityKw,
        'system_type': quotation.systemType,
        'panel_specs': quotation.panelBrand ?? "Tier-1 Mono PERC Modules",
        'inverter_specs': quotation.inverterBrand ?? "Solar Grid-Tied Inverter",
        'structure_type': quotation.structureType ?? "High-Grade Elevated GI Structure",
        'base_amount': quotation.basePrice,
        'installation_amount': quotation.structureInstallationCost,
        'discount_amount': quotation.discountAmount,
        'taxable_amount': quotation.basePrice + quotation.structureInstallationCost - quotation.discountAmount,
        'gst_mode': quotation.gstMode,
        if (quotation.gstSummaryJson != null) 'gst_summary_json': quotation.gstSummaryJson,
        if (quotation.revisionNumber != null) 'quotation_revision_number': quotation.revisionNumber,
        'gst_rate': quotation.gstRate,
        'gst_amount': quotation.gstAmount,
        'gross_total': quotation.totalAmount,
        'subsidy_amount': quotation.subsidyAmount,
        'net_payable_amount': quotation.netPayableAmount,
        'amount_paid': amountPaid,
        'payment_mode': paymentMode,
        'payment_reference': paymentReference,
        'invoice_date': DateTime.now().toIso8601String().split('T')[0],
        'due_date': dueDate ?? DateTime.now().add(const Duration(days: 15)).toIso8601String().split('T')[0],
        'notes': notes ?? "Converted from Quotation ${quotation.quotationNumber}",
        'line_items': lineItemsPayload.isNotEmpty ? lineItemsPayload : null,
      };

      final response = await apiClient.dio.post(
        ApiConstants.invoices,
        data: payload,
      );

      final resData = response.data;
      if (resData['success'] == true) {
        // Refresh both lists to keep entire app synced
        await fetchInvoices(refresh: true);
        await fetchQuotations(refresh: true);
        InvoiceModel? createdInvoice;
        if (resData['data'] != null && resData['data'] is Map) {
          try {
            createdInvoice = InvoiceModel.fromJson(Map<String, dynamic>.from(resData['data']));
          } catch (_) {}
        }
        return {
          'success': true,
          'message': resData['message'] ?? "Executive Tax Invoice created successfully!",
          'invoice': createdInvoice,
        };
      }
      return {
        'success': false,
        'message': resData['message'] ?? "Failed to convert to invoice",
      };
    } catch (e) {
      return {
        'success': false,
        'message': "Failed to convert quotation to invoice: $e",
      };
    }
  }

  // --- RECORD INVOICE PAYMENT ---
  Future<Map<String, dynamic>> recordInvoicePayment(
    int invoiceId, {
    required double amount,
    required String paymentMode,
    String? referenceNumber,
    String? notes,
    String? paymentDate,
  }) async {
    try {
      final payload = {
        'amount': amount,
        'payment_mode': paymentMode,
        'reference_number': referenceNumber,
        'notes': notes,
        'payment_date': paymentDate ?? DateTime.now().toIso8601String().split('T')[0],
      };
      final response = await apiClient.dio.post(
        ApiConstants.invoicePayments(invoiceId),
        data: payload,
      );
      if (response.data['success'] == true) {
        await fetchInvoices(refresh: true);
        return {
          'success': true,
          'message': response.data['message'] ?? "Payment recorded successfully",
        };
      }
      return {'success': false, 'message': response.data['message'] ?? "Payment failed"};
    } catch (e) {
      return {'success': false, 'message': "Failed to record payment: $e"};
    }
  }

  // --- DELETE INVOICE ---
  Future<bool> deleteInvoice(int id) async {
    try {
      final response = await apiClient.dio.delete(ApiConstants.invoiceDelete(id));
      if (response.data['success'] == true) {
        _invoices.removeWhere((inv) => inv.id == id);
        notifyListeners();
        return true;
      }
    } catch (_) {}
    return false;
  }

  // --- SEND INVOICE EMAIL ---
  Future<Map<String, dynamic>> sendInvoiceEmail(int id) async {
    try {
      final response = await apiClient.dio.post(ApiConstants.invoiceSendEmail(id));
      return {
        'success': response.data['success'] == true,
        'message': response.data['message'] ?? "Invoice email sent successfully",
      };
    } catch (e) {
      return {'success': false, 'message': "Failed to send invoice email: $e"};
    }
  }
}

