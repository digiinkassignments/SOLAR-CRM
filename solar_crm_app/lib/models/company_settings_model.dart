class CompanySettingsModel {
  final int id;
  final String companyName;
  final String companyEmail;
  final String companyPhone;
  final String? companyAddress;
  final String? companyWebsite;
  final String? companyLogo;
  final String? gstNumber;
  final String? panNumber;
  final String? bankName;
  final String? accountNumber;
  final String? ifscCode;
  final String? branchName;
  final String? quotationTemplate;
  final String? invoiceTemplate;
  final String? termsConditions;

  CompanySettingsModel({
    required this.id,
    required this.companyName,
    required this.companyEmail,
    required this.companyPhone,
    this.companyAddress,
    this.companyWebsite,
    this.companyLogo,
    this.gstNumber,
    this.panNumber,
    this.bankName,
    this.accountNumber,
    this.ifscCode,
    this.branchName,
    this.quotationTemplate,
    this.invoiceTemplate,
    this.termsConditions,
  });

  String? getFullLogoUrl(String baseApiUrl) {
    if (companyLogo == null || companyLogo!.trim().isEmpty || companyLogo == 'null') {
      return null;
    }
    final logo = companyLogo!.trim();
    if (logo.startsWith('http://') || logo.startsWith('https://')) {
      return logo;
    }
    String cleanPath = logo.startsWith('/') ? logo.substring(1) : logo;
    if (!cleanPath.startsWith('uploads/')) {
      cleanPath = 'uploads/$cleanPath';
    }
    final origin = baseApiUrl.replaceAll(RegExp(r'/api/?$'), '');
    return "$origin/$cleanPath";
  }

  factory CompanySettingsModel.fromJson(Map<String, dynamic> json) {
    return CompanySettingsModel(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id']?.toString() ?? '1') ?? 1,
      companyName: json['company_name']?.toString() ?? 'Solar CRM Partner',
      companyEmail: json['company_email']?.toString() ?? '',
      companyPhone: json['company_phone']?.toString() ?? '',
      companyAddress: json['company_address']?.toString(),
      companyWebsite: json['company_website']?.toString(),
      companyLogo: json['company_logo']?.toString(),
      gstNumber: json['gst_number']?.toString(),
      panNumber: json['pan_number']?.toString(),
      bankName: json['bank_name']?.toString(),
      accountNumber: json['account_number']?.toString(),
      ifscCode: json['ifsc_code']?.toString(),
      branchName: json['branch_name']?.toString(),
      quotationTemplate: json['quotation_template']?.toString(),
      invoiceTemplate: json['invoice_template']?.toString(),
      termsConditions: json['terms_conditions']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'company_name': companyName,
      'company_email': companyEmail,
      'company_phone': companyPhone,
      'company_address': companyAddress,
      'company_website': companyWebsite,
      'company_logo': companyLogo,
      'gst_number': gstNumber,
      'pan_number': panNumber,
      'bank_name': bankName,
      'account_number': accountNumber,
      'ifsc_code': ifscCode,
      'branch_name': branchName,
      'quotation_template': quotationTemplate,
      'invoice_template': invoiceTemplate,
      'terms_conditions': termsConditions,
    };
  }
}

