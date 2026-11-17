import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/constants/app_typography.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../models/quotation_model.dart';
import '../../../../providers/finance_provider.dart';

class ConvertInvoiceDialog extends StatefulWidget {
  final QuotationModel quotation;

  const ConvertInvoiceDialog({super.key, required this.quotation});

  @override
  State<ConvertInvoiceDialog> createState() => _ConvertInvoiceDialogState();
}

class _ConvertInvoiceDialogState extends State<ConvertInvoiceDialog> {
  final _amountPaidController = TextEditingController();
  final _refController = TextEditingController();
  final _notesController = TextEditingController();

  String _paymentMode = "Bank Transfer";
  late DateTime _dueDate;
  bool _isSubmitting = false;

  final List<String> _paymentModes = [
    "Bank Transfer",
    "UPI",
    "Cheque",
    "Cash",
    "Net Banking",
    "Card",
  ];

  @override
  void initState() {
    super.initState();
    _dueDate = DateTime.now().add(const Duration(days: 15));
    _notesController.text = "Converted from Proposal ${widget.quotation.quotationNumber}";
  }

  @override
  void dispose() {
    _amountPaidController.dispose();
    _refController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _pickDueDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _dueDate,
      firstDate: DateTime.now().subtract(const Duration(days: 30)),
      lastDate: DateTime.now().add(const Duration(days: 365)),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.dark(
              primary: AppColors.brandPrimary,
              onPrimary: Colors.white,
              surface: AppColors.darkCard,
              onSurface: AppColors.textPrimaryDark,
            ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null) {
      setState(() => _dueDate = picked);
    }
  }

  Future<void> _handleConvert() async {
    final paidText = _amountPaidController.text.trim();
    final amountPaid = paidText.isEmpty ? 0.0 : (double.tryParse(paidText) ?? 0.0);

    if (amountPaid < 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("Advance payment amount cannot be negative."),
          backgroundColor: AppColors.errorRed,
        ),
      );
      return;
    }

    if (amountPaid > widget.quotation.netPayableAmount) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text("Advance amount cannot exceed net payable ${Formatters.formatCurrency(widget.quotation.netPayableAmount)}."),
          backgroundColor: AppColors.errorRed,
        ),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    final finance = Provider.of<FinanceProvider>(context, listen: false);
    final res = await finance.convertQuotationToInvoice(
      quotation: widget.quotation,
      amountPaid: amountPaid,
      paymentMode: _paymentMode,
      paymentReference: _refController.text.trim().isEmpty ? null : _refController.text.trim(),
      dueDate: _dueDate.toIso8601String().split('T')[0],
      notes: _notesController.text.trim().isEmpty ? null : _notesController.text.trim(),
    );

    if (!mounted) return;
    setState(() => _isSubmitting = false);

    if (res['success'] == true) {
      Navigator.pop(context, true);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.check_circle_rounded, color: AppColors.emeraldGreen, size: 20),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  res['message'] ?? "Tax Invoice generated successfully!",
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
              ),
            ],
          ),
          backgroundColor: AppColors.darkCard,
          behavior: SnackBarBehavior.floating,
          duration: const Duration(seconds: 4),
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(res['message'] ?? "Failed to convert to invoice"),
          backgroundColor: AppColors.errorRed,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final surfaceColor = isDark ? AppColors.darkCard : AppColors.lightCard;
    final borderColor = isDark ? AppColors.darkBorder : AppColors.lightBorder;
    final textPrimary = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final textSecondary = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;
    final fieldBg = isDark ? AppColors.darkBackground : AppColors.lightSurface;

    return Dialog(
      backgroundColor: surfaceColor,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
      child: Container(
        constraints: const BoxConstraints(maxWidth: 480),
        child: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: AppColors.brandPrimary.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(Icons.receipt_long_rounded, color: AppColors.brandPrimary, size: 22),
                        ),
                        const SizedBox(width: 12),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              "Convert to Tax Invoice",
                              style: AppTypography.headingSmall(color: textPrimary),
                            ),
                            Text(
                              widget.quotation.quotationNumber,
                              style: AppTypography.caption(color: textSecondary),
                            ),
                          ],
                        ),
                      ],
                    ),
                    IconButton(
                      icon: const Icon(Icons.close_rounded, size: 20),
                      onPressed: () => Navigator.pop(context),
                      color: textSecondary,
                    ),
                  ],
                ),

                const SizedBox(height: 16),
                const Divider(height: 1),
                const SizedBox(height: 16),

                // Quotation Summary Card
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: AppColors.brandPrimary.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.brandPrimary.withValues(alpha: 0.2)),
                  ),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text("Customer", style: AppTypography.caption(color: textSecondary)),
                                Text(
                                  widget.quotation.customerName,
                                  style: AppTypography.bodySmall(color: textPrimary, fontWeight: FontWeight.bold),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                            ),
                          ),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text("System Capacity", style: AppTypography.caption(color: textSecondary)),
                              Text(
                                "${widget.quotation.systemCapacityKw.toStringAsFixed(1)} kW • ${widget.quotation.systemType}",
                                style: AppTypography.bodySmall(color: textPrimary, fontWeight: FontWeight.bold),
                              ),
                            ],
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      const Divider(height: 1),
                      const SizedBox(height: 10),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text("Net Payable Amount", style: AppTypography.caption(color: textSecondary)),
                              Text(
                                Formatters.formatCurrency(widget.quotation.netPayableAmount),
                                style: const TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.brandPrimary,
                                ),
                              ),
                            ],
                          ),
                          if (widget.quotation.subsidyAmount > 0)
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Text("DBT Subsidy", style: AppTypography.caption(color: textSecondary)),
                                Text(
                                  "-${Formatters.formatCurrency(widget.quotation.subsidyAmount)}",
                                  style: const TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.bold,
                                    color: AppColors.emeraldGreen,
                                  ),
                                ),
                              ],
                            ),
                        ],
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 18),

                // Advance Payment Received (Optional)
                Text(
                  "Initial Advance Payment (Optional)",
                  style: AppTypography.bodySmall(color: textPrimary, fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 6),
                TextField(
                  controller: _amountPaidController,
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  onChanged: (_) => setState(() {}),
                  decoration: InputDecoration(
                    prefixIcon: const Icon(Icons.currency_rupee_rounded, size: 18),
                    hintText: "Enter advance received (e.g. 50000)",
                    helperText: "Leave blank or 0 if payment will be collected later",
                    filled: true,
                    fillColor: fieldBg,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                ),

                // If advance paid > 0, show payment mode and reference
                if ((double.tryParse(_amountPaidController.text.trim()) ?? 0.0) > 0) ...[
                  const SizedBox(height: 14),
                  Text("Payment Mode", style: AppTypography.bodySmall(color: textPrimary, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 6),
                  DropdownButtonFormField<String>(
                    initialValue: _paymentMode,
                    dropdownColor: surfaceColor,
                    decoration: InputDecoration(
                      prefixIcon: const Icon(Icons.account_balance_wallet_outlined, size: 18),
                      filled: true,
                      fillColor: fieldBg,
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    items: _paymentModes
                        .map((mode) => DropdownMenuItem(value: mode, child: Text(mode)))
                        .toList(),
                    onChanged: (val) {
                      if (val != null) setState(() => _paymentMode = val);
                    },
                  ),
                  const SizedBox(height: 14),
                  Text("Reference / UTR / Cheque No.", style: AppTypography.bodySmall(color: textPrimary, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 6),
                  TextField(
                    controller: _refController,
                    decoration: InputDecoration(
                      prefixIcon: const Icon(Icons.receipt_outlined, size: 18),
                      hintText: "e.g. UPI/123456789 or CHQ-0012",
                      filled: true,
                      fillColor: fieldBg,
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                  ),
                ],

                const SizedBox(height: 14),

                // Due Date
                Text("Payment Due Date", style: AppTypography.bodySmall(color: textPrimary, fontWeight: FontWeight.w600)),
                const SizedBox(height: 6),
                InkWell(
                  onTap: _pickDueDate,
                  borderRadius: BorderRadius.circular(10),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                    decoration: BoxDecoration(
                      color: fieldBg,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: borderColor),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            const Icon(Icons.calendar_today_rounded, size: 18, color: AppColors.brandPrimary),
                            const SizedBox(width: 10),
                            Text(
                              Formatters.formatDate(_dueDate.toIso8601String()),
                              style: TextStyle(fontWeight: FontWeight.bold, color: textPrimary),
                            ),
                          ],
                        ),
                        Text("Change", style: AppTypography.caption(color: AppColors.brandPrimary)),
                      ],
                    ),
                  ),
                ),

                const SizedBox(height: 14),

                // Notes / Terms
                Text("Notes / Billing Remarks", style: AppTypography.bodySmall(color: textPrimary, fontWeight: FontWeight.w600)),
                const SizedBox(height: 6),
                TextField(
                  controller: _notesController,
                  maxLines: 2,
                  decoration: InputDecoration(
                    hintText: "Add any terms, billing conditions or remarks",
                    filled: true,
                    fillColor: fieldBg,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                ),

                const SizedBox(height: 24),

                // Action Buttons
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: _isSubmitting ? null : () => Navigator.pop(context),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                        child: const Text("Cancel"),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      flex: 2,
                      child: ElevatedButton.icon(
                        onPressed: _isSubmitting ? null : _handleConvert,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: widget.quotation.status.toLowerCase() == "accepted"
                              ? AppColors.emeraldGreen
                              : AppColors.brandPrimary,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                        icon: _isSubmitting
                            ? const SizedBox(
                                width: 16,
                                height: 16,
                                child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                              )
                            : const Icon(Icons.check_circle_outline_rounded, color: Colors.white, size: 18),
                        label: Text(
                          _isSubmitting ? "Converting..." : "Generate Tax Invoice",
                          style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
