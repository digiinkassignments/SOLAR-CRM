class CommissioningModel {
  final int? id;
  final int? projectId;
  final double? panelOutputVoltage;
  final double? dcCurrentAmps;
  final double? inverterOutputKw;
  final String? inverterDisplayStatus;
  final double? acOutputVoltage;
  final double? meterReadingKwh;
  final String? meterSerialNumber;
  final double? netMeterImportKwh;
  final double? netMeterExportKwh;
  final double? generationMeterKwh;

  final String? safetyShutdowns;
  final String? antiIslandingTest;
  final String? groundingCheck;
  final double? earthResistanceOhm;
  final String? wiringInsulation;
  final double? insulationResistanceMohm;
  final String? earthLeakage;

  final String? overallResult;
  final String? commissionDate;
  final String? commissioningEngineer;
  final String? certificateNumber;
  final String? remarks;

  final String? meterPhotoUrl;
  final String? inverterPhotoUrl;
  final String? customerSignatureName;
  final bool customerAcknowledged;
  final bool engineerSignoff;
  final String? signatureData;

  CommissioningModel({
    this.id,
    this.projectId,
    this.panelOutputVoltage,
    this.dcCurrentAmps,
    this.inverterOutputKw,
    this.inverterDisplayStatus,
    this.acOutputVoltage,
    this.meterReadingKwh,
    this.meterSerialNumber,
    this.netMeterImportKwh,
    this.netMeterExportKwh,
    this.generationMeterKwh,
    this.safetyShutdowns,
    this.antiIslandingTest,
    this.groundingCheck,
    this.earthResistanceOhm,
    this.wiringInsulation,
    this.insulationResistanceMohm,
    this.earthLeakage,
    this.overallResult,
    this.commissionDate,
    this.commissioningEngineer,
    this.certificateNumber,
    this.remarks,
    this.meterPhotoUrl,
    this.inverterPhotoUrl,
    this.customerSignatureName,
    this.customerAcknowledged = false,
    this.engineerSignoff = false,
    this.signatureData,
  });

  factory CommissioningModel.fromJson(Map<String, dynamic> json) {
    double? parseDouble(dynamic v) {
      if (v == null) return null;
      if (v is num) return v.toDouble();
      return double.tryParse(v.toString());
    }

    bool parseBool(dynamic v) {
      if (v == null) return false;
      if (v is bool) return v;
      if (v is num) return v == 1;
      final str = v.toString().toLowerCase();
      return str == '1' || str == 'true';
    }

    return CommissioningModel(
      id: json['id'] is num ? (json['id'] as num).toInt() : int.tryParse(json['id']?.toString() ?? ''),
      projectId: json['project_id'] is num ? (json['project_id'] as num).toInt() : int.tryParse(json['project_id']?.toString() ?? ''),
      panelOutputVoltage: parseDouble(json['panel_output_voltage']),
      dcCurrentAmps: parseDouble(json['dc_current_amps']),
      inverterOutputKw: parseDouble(json['inverter_output_kw']),
      inverterDisplayStatus: json['inverter_display_status']?.toString(),
      acOutputVoltage: parseDouble(json['ac_output_voltage']),
      meterReadingKwh: parseDouble(json['meter_reading_kwh']),
      meterSerialNumber: json['meter_serial_number']?.toString(),
      netMeterImportKwh: parseDouble(json['net_meter_import_kwh']),
      netMeterExportKwh: parseDouble(json['net_meter_export_kwh']),
      generationMeterKwh: parseDouble(json['generation_meter_kwh'] ?? json['meter_reading_kwh']),
      safetyShutdowns: json['safety_shutdowns']?.toString(),
      antiIslandingTest: json['anti_islanding_test']?.toString(),
      groundingCheck: json['grounding_check']?.toString(),
      earthResistanceOhm: parseDouble(json['earth_resistance_ohm']),
      wiringInsulation: json['wiring_insulation']?.toString(),
      insulationResistanceMohm: parseDouble(json['insulation_resistance_mohm']),
      earthLeakage: json['earth_leakage']?.toString(),
      overallResult: json['overall_result']?.toString() ?? 'Pending',
      commissionDate: json['commission_date']?.toString(),
      commissioningEngineer: json['commissioning_engineer']?.toString(),
      certificateNumber: json['certificate_number']?.toString(),
      remarks: json['remarks']?.toString(),
      meterPhotoUrl: json['meter_photo_url']?.toString(),
      inverterPhotoUrl: json['inverter_photo_url']?.toString(),
      customerSignatureName: json['customer_signature_name']?.toString(),
      customerAcknowledged: parseBool(json['customer_acknowledged']),
      engineerSignoff: parseBool(json['engineer_signoff']),
      signatureData: json['signature_data']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'panel_output_voltage': panelOutputVoltage,
      'dc_current_amps': dcCurrentAmps,
      'inverter_output_kw': inverterOutputKw,
      'inverter_display_status': inverterDisplayStatus,
      'ac_output_voltage': acOutputVoltage,
      'meter_serial_number': meterSerialNumber,
      'net_meter_import_kwh': netMeterImportKwh,
      'net_meter_export_kwh': netMeterExportKwh,
      'generation_meter_kwh': generationMeterKwh,
      'meter_reading_kwh': generationMeterKwh,
      'safety_shutdowns': safetyShutdowns,
      'anti_islanding_test': antiIslandingTest,
      'grounding_check': groundingCheck,
      'earth_resistance_ohm': earthResistanceOhm,
      'wiring_insulation': wiringInsulation,
      'insulation_resistance_mohm': insulationResistanceMohm,
      'earth_leakage': earthLeakage,
      'overall_result': overallResult,
      'commission_date': commissionDate,
      'commissioning_engineer': commissioningEngineer,
      'certificate_number': certificateNumber,
      'remarks': remarks,
      'customer_signature_name': customerSignatureName,
      'customer_acknowledged': customerAcknowledged ? 1 : 0,
      'engineer_signoff': engineerSignoff ? 1 : 0,
      'signature_data': signatureData,
    };
  }
}
