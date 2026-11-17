import 'package:flutter/foundation.dart';
import '../core/constants/api_constants.dart';
import '../core/network/api_client.dart';
import '../models/lead_model.dart';
import '../models/solar_calculator_model.dart';

class CalculatorProvider extends ChangeNotifier {
  final ApiClient apiClient;

  CalculatorProvider({required this.apiClient}) {
    _recalculate();
  }

  String _calcMode = "bill"; // "bill" | "units" | "roof"
  double _monthlyBill = 5000.0;
  double _monthlyUnits = 640.0;
  double _roofAreaSqft = 400.0;
  double _roofUsablePercent = 80.0;
  String _selectedState = "Rajasthan";
  double _tariffRate = 7.8;
  String _propertyType = "Residential";
  String _subsidyType = "PM Surya Ghar (DCR)";

  String _customerName = "";
  String _customerPhone = "";
  int? _leadId;

  bool _isSaving = false;
  String? _saveMessage;

  late SolarCalculationResult _result;

  // Getters
  String get calcMode => _calcMode;
  double get monthlyBill => _monthlyBill;
  double get monthlyUnits => _monthlyUnits;
  double get roofAreaSqft => _roofAreaSqft;
  double get roofUsablePercent => _roofUsablePercent;
  String get selectedState => _selectedState;
  double get tariffRate => _tariffRate;
  String get propertyType => _propertyType;
  String get subsidyType => _subsidyType;

  String get customerName => _customerName;
  String get customerPhone => _customerPhone;
  int? get leadId => _leadId;

  bool get isSaving => _isSaving;
  String? get saveMessage => _saveMessage;
  SolarCalculationResult get result => _result;

  void _recalculate() {
    _result = SolarCalculationResult.compute(
      calcMode: _calcMode,
      monthlyBill: _monthlyBill,
      monthlyUnits: _monthlyUnits,
      roofAreaSqft: _roofAreaSqft,
      roofUsablePercent: _roofUsablePercent,
      selectedState: _selectedState,
      tariffRate: _tariffRate,
      propertyType: _propertyType,
      subsidyType: _subsidyType,
    );
    notifyListeners();
  }

  void setCalcMode(String mode) {
    if (_calcMode == mode) return;
    _calcMode = mode;
    _recalculate();
  }

  void setMonthlyBill(double bill) {
    _monthlyBill = bill.clamp(500.0, 500000.0);
    _monthlyUnits = (_monthlyBill / (_tariffRate > 0 ? _tariffRate : 8.0)).roundToDouble();
    _recalculate();
  }

  void setMonthlyUnits(double units) {
    _monthlyUnits = units.clamp(50.0, 50000.0);
    _monthlyBill = (_monthlyUnits * (_tariffRate > 0 ? _tariffRate : 8.0)).roundToDouble();
    _recalculate();
  }

  void setRoofArea(double area) {
    _roofAreaSqft = area.clamp(50.0, 50000.0);
    _recalculate();
  }

  void setRoofUsablePercent(double pct) {
    _roofUsablePercent = pct.clamp(10.0, 100.0);
    _recalculate();
  }

  void setSelectedState(String stateName) {
    _selectedState = stateName;
    final info = IndianSolarData.getState(stateName);
    _tariffRate = info.tariffRate;
    _recalculate();
  }

  void setTariffRate(double rate) {
    _tariffRate = rate.clamp(1.0, 25.0);
    _recalculate();
  }

  void setPropertyType(String type) {
    _propertyType = type;
    if (type != "Residential") {
      _subsidyType = "Commercial (40% Depreciation)";
    } else {
      _subsidyType = "PM Surya Ghar (DCR)";
    }
    _recalculate();
  }

  void setSubsidyType(String subsidy) {
    _subsidyType = subsidy;
    _recalculate();
  }

  void setCustomerInfo({String? name, String? phone, int? leadId}) {
    if (name != null) _customerName = name;
    if (phone != null) _customerPhone = phone;
    if (leadId != null) _leadId = leadId;
    notifyListeners();
  }

  /// Pre-fill calculation directly from a CRM Lead
  void prefillFromLead(LeadModel lead) {
    _customerName = lead.customerName;
    _customerPhone = lead.mobileNumber;
    _leadId = lead.id;

    if (lead.state != null && lead.state!.isNotEmpty) {
      final match = IndianSolarData.states.where(
        (s) => s.name.toLowerCase() == lead.state!.toLowerCase(),
      );
      if (match.isNotEmpty) {
        _selectedState = match.first.name;
        _tariffRate = match.first.tariffRate;
      }
    }

    if (lead.monthlyConsumptionUnits != null && lead.monthlyConsumptionUnits! > 0) {
      _calcMode = "units";
      _monthlyUnits = lead.monthlyConsumptionUnits!.toDouble();
      _monthlyBill = (_monthlyUnits * _tariffRate).roundToDouble();
    } else if (lead.requiredKw > 0) {
      _calcMode = "bill";
      _monthlyUnits = (lead.requiredKw * 135.0).roundToDouble();
      _monthlyBill = (_monthlyUnits * _tariffRate).roundToDouble();
    }

    _propertyType = lead.solarRequirement.isNotEmpty ? lead.solarRequirement : "Residential";
    _recalculate();
  }

  /// Save calculation snapshot to CRM database
  Future<Map<String, dynamic>> saveCalculation() async {
    _isSaving = true;
    _saveMessage = null;
    notifyListeners();

    try {
      final payload = {
        'lead_id': _leadId,
        'customer_name': _customerName,
        'customer_phone': _customerPhone,
        'calc_mode': _calcMode,
        'monthly_bill': _result.monthlyBill,
        'monthly_units': _result.monthlyUnits,
        'property_type': _result.propertyType,
        'subsidy_type': _result.subsidyType,
        'connection_phase': _result.connectionPhase,
        'roof_area_sqft': _result.roofAreaSqft,
        'roof_usable_percent': _result.roofUsablePercent,
        'tariff_rate': _result.tariffRate,
        'recommended_kw': _result.recommendedKw,
        'panel_count': _result.panelCount,
        'panel_wattage': _result.panelWattage,
        'inverter_kw': _result.inverterKw,
        'required_area_sqft': _result.requiredAreaSqft,
        'gross_cost': _result.grossCost,
        'subsidy_amount': _result.subsidyAmount,
        'net_cost': _result.netCost,
        'annual_generation_kwh': _result.annualGenerationKwh,
        'annual_savings': _result.annualSavings,
        'payback_years': _result.paybackYears,
        'twenty_five_year_savings': _result.twentyFiveYearSavings,
        'co2_offset_tonnes': _result.co2OffsetTonnes,
      };

      final response = await apiClient.dio.post(
        ApiConstants.saveCalculation,
        data: payload,
      );

      final resData = response.data;
      if (resData['success'] == true) {
        _saveMessage = "Solar calculation saved successfully to CRM!";
        return {'success': true, 'message': _saveMessage};
      } else {
        _saveMessage = resData['message'] ?? "Failed to save calculation.";
        return {'success': false, 'message': _saveMessage};
      }
    } catch (e) {
      _saveMessage = "Error saving calculation: $e";
      return {'success': false, 'message': _saveMessage};
    } finally {
      _isSaving = false;
      notifyListeners();
    }
  }
}

