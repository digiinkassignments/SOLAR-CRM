import 'package:intl/intl.dart';

class PreInstallInspectionModel {
  final int? id;
  final int? projectId;
  final bool isPrefilled;

  // Section 1: Roof Assessment & Geometry
  final String roofCondition;
  final String? roofType;
  final String roofOrientation;
  final double? roofTiltAngle;
  final double? roofAreaSqft;
  final double? shadowFreeAreaSqft;
  final int? roofAgeYears;
  final String? structuralConcerns;

  // Section 2: Electrical & DISCOM Grid Connection
  final double? existingLoadKw;
  final double? sanctionedLoadKw;
  final String? consumerNumber;
  final String? meterType;
  final int? mainPanelCapacity;
  final String earthingAvailable;
  final String? electricalIssues;

  // Section 3: Site Conditions & Geolocation
  final String shadingIssues;
  final String? shadingSource;
  final String waterAvailability;
  final String siteAccess;
  final String? gpsCoordinates;
  final String? additionalChallenges;
  final String? sitePhotos;

  // Section 4: Inspection Decision & Customer Sign-Off
  final String overallStatus;
  final String? inspectorName;
  final DateTime? inspectionDate;
  final String? remarks;
  final String? customerSignatureName;
  final DateTime? signatureDate;
  final String? signatureData;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  PreInstallInspectionModel({
    this.id,
    this.projectId,
    this.isPrefilled = false,
    this.roofCondition = 'Good',
    this.roofType,
    this.roofOrientation = 'South (Optimal Solar Yield)',
    this.roofTiltAngle,
    this.roofAreaSqft,
    this.shadowFreeAreaSqft,
    this.roofAgeYears,
    this.structuralConcerns,
    this.existingLoadKw,
    this.sanctionedLoadKw,
    this.consumerNumber,
    this.meterType,
    this.mainPanelCapacity,
    this.earthingAvailable = 'Yes',
    this.electricalIssues,
    this.shadingIssues = 'None',
    this.shadingSource,
    this.waterAvailability = 'Yes',
    this.siteAccess = 'Easy',
    this.gpsCoordinates,
    this.additionalChallenges,
    this.sitePhotos,
    this.overallStatus = 'Pending',
    this.inspectorName,
    this.inspectionDate,
    this.remarks,
    this.customerSignatureName,
    this.signatureDate,
    this.signatureData,
    this.createdAt,
    this.updatedAt,
  });

  factory PreInstallInspectionModel.fromJson(Map<String, dynamic> json) {
    DateTime? parseDate(dynamic d) {
      if (d == null) return null;
      try {
        final str = d.toString().trim();
        final dt = DateTime.tryParse(str) ?? DateTime.tryParse(str.replaceAll(' ', 'T'));
        return dt?.toLocal();
      } catch (_) {
        return null;
      }
    }

    double? parseDouble(dynamic v) {
      if (v == null) return null;
      if (v is num) return v.toDouble();
      return double.tryParse(v.toString());
    }

    int? parseInt(dynamic v) {
      if (v == null) return null;
      if (v is int) return v;
      return int.tryParse(v.toString());
    }

    String normalizeBoolString(dynamic v, {String fallback = 'Yes'}) {
      if (v == null) return fallback;
      final str = v.toString().trim().toLowerCase();
      if (str == '1' || str == 'true' || str == 'yes') return 'Yes';
      if (str == '0' || str == 'false' || str == 'no') return 'No';
      return v.toString();
    }

    final rawRoofOrientation = json['roof_orientation']?.toString() ?? 'South';
    final normalizedRoofOrientation = rawRoofOrientation.contains('South') && !rawRoofOrientation.contains('Optimal')
        ? (rawRoofOrientation == 'South' ? 'South (Optimal Solar Yield)' : rawRoofOrientation)
        : rawRoofOrientation;

    final rawRoofType = json['roof_type']?.toString();
    final normalizedRoofType = rawRoofType == 'RCC Flat' ? 'RCC Flat Roof' : rawRoofType;

    return PreInstallInspectionModel(
      id: parseInt(json['id']),
      projectId: parseInt(json['project_id']),
      isPrefilled: json['is_prefilled'] == true || json['is_prefilled'] == 1,
      roofCondition: json['roof_condition']?.toString() ?? 'Good',
      roofType: normalizedRoofType,
      roofOrientation: normalizedRoofOrientation,
      roofTiltAngle: parseDouble(json['roof_tilt_angle']),
      roofAreaSqft: parseDouble(json['roof_area_sqft']),
      shadowFreeAreaSqft: parseDouble(json['shadow_free_area_sqft']),
      roofAgeYears: parseInt(json['roof_age_years']),
      structuralConcerns: json['structural_concerns']?.toString(),
      existingLoadKw: parseDouble(json['existing_load_kw']),
      sanctionedLoadKw: parseDouble(json['sanctioned_load_kw']),
      consumerNumber: json['consumer_number']?.toString(),
      meterType: json['meter_type']?.toString(),
      mainPanelCapacity: parseInt(json['main_panel_capacity']),
      earthingAvailable: normalizeBoolString(json['earthing_available'], fallback: 'No'),
      electricalIssues: json['electrical_issues']?.toString(),
      shadingIssues: json['shading_issues']?.toString() ?? 'None',
      shadingSource: json['shading_source']?.toString(),
      waterAvailability: normalizeBoolString(json['water_availability'], fallback: 'No'),
      siteAccess: json['site_access']?.toString() ?? 'Easy',
      gpsCoordinates: json['gps_coordinates']?.toString(),
      additionalChallenges: json['additional_challenges']?.toString(),
      sitePhotos: json['site_photos']?.toString(),
      overallStatus: json['overall_status']?.toString() ?? 'Pending',
      inspectorName: json['inspector_name']?.toString(),
      inspectionDate: parseDate(json['inspection_date']),
      remarks: json['remarks']?.toString(),
      customerSignatureName: json['customer_signature_name']?.toString(),
      signatureDate: parseDate(json['signature_date']),
      signatureData: json['signature_data']?.toString(),
      createdAt: parseDate(json['created_at']),
      updatedAt: parseDate(json['updated_at']),
    );
  }

  Map<String, dynamic> toJson() {
    String? formatDate(DateTime? d) {
      if (d == null) return null;
      return DateFormat('yyyy-MM-dd').format(d);
    }

    String cleanRoofType = roofType ?? '';
    if (cleanRoofType == 'RCC Flat Roof') cleanRoofType = 'RCC Flat';

    String cleanOrientation = roofOrientation;
    if (cleanOrientation == 'South (Optimal Solar Yield)') cleanOrientation = 'South';

    return {
      'roof_condition': roofCondition,
      'roof_type': cleanRoofType,
      'roof_orientation': cleanOrientation,
      'roof_tilt_angle': roofTiltAngle,
      'roof_area_sqft': roofAreaSqft,
      'shadow_free_area_sqft': shadowFreeAreaSqft,
      'roof_age_years': roofAgeYears,
      'structural_concerns': structuralConcerns ?? '',
      'existing_load_kw': existingLoadKw,
      'sanctioned_load_kw': sanctionedLoadKw,
      'consumer_number': consumerNumber ?? '',
      'meter_type': meterType,
      'main_panel_capacity': mainPanelCapacity,
      'earthing_available': earthingAvailable,
      'electrical_issues': electricalIssues ?? '',
      'shading_issues': shadingIssues,
      'shading_source': shadingIssues == 'None' ? '' : (shadingSource ?? ''),
      'water_availability': waterAvailability,
      'site_access': siteAccess,
      'gps_coordinates': gpsCoordinates ?? '',
      'additional_challenges': additionalChallenges ?? '',
      'site_photos': sitePhotos ?? '',
      'overall_status': overallStatus,
      'inspector_name': inspectorName ?? '',
      'inspection_date': formatDate(inspectionDate),
      'remarks': remarks ?? '',
      'customer_signature_name': customerSignatureName ?? '',
      'signature_date': formatDate(signatureDate),
      'signature_data': signatureData ?? '',
    };
  }
}
