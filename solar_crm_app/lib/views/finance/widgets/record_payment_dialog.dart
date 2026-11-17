import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/constants/app_typography.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../models/invoice_model.dart';
import '../../../../providers/finance_provider.dart';

class RecordPaymentDialog extends StatefulWidget {
  final InvoiceModel invoice;

  const RecordPaymentDialog({super.key, required this.invoice});

  @override
  State<RecordPaymentDialog> createState() => _RecordPaymentDialogState();
}

class _RecordPaymentDialogState extends State<RecordPaymentDialog> {
  final _amountController = TextEditingController();
  final _refController = TextEditingController();
  final _notesController = TextEditingController();

  String _paymentMode = "Bank Transfer";
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
    // Default to remaining balance
    _amountController.text = widget.invoice.balanceDue > 0
        ? widget.invoice.balanceDue.toStringAsFixed(0)
        : "";
  }

  @override
  void dispose() {
    _amountController.dispose();
    _refController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _submitPayment() async {
    final amountText = _amountController.text.trim();
    final amount = double.tryParse(amountText);

    if (amount == null || amount <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("Please enter a valid positive payment amount."),
          backgroundColor: AppColors.errorRed,
        ),
      );
      return;
    }

    if (amount > widget.invoice.balanceDue + 1) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text("Amount cannot exceed balance due (${Formatters.formatCurrency(widget.invoice.balanceDue)})."),
          backgroundColor: AppColors.errorRed,
        ),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    final finance = Provider.of<FinanceProvider>(context, listen: false);
    final result = await finance.recordInvoicePayment(
      widget.invoice.id,
      amount: amount,
      paymentMode: _paymentMode,
      referenceNumber: _refController.text.trim().isNotEmpty ? _refController.text.trim() : null,
      notes: _notesController.text.trim().isNotEmpty ? _notesController.text.trim() : null,
    );

    setState(() => _isSubmitting = false);

    if (mounted) {
      if (result['success'] == true) {
        Navigator.of(context).pop(true);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result['message'] ?? "Payment recorded successfully!"),
            backgroundColor: AppColors.emeraldGreen,
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result['message'] ?? "Failed to record payment"),
            backgroundColor: AppColors.errorRed,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? AppColors.darkCard : AppColors.lightCard;
    final borderColor = isDark ? AppColors.darkBorder : AppColors.lightBorder;
    final textPrimary = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final textSecondary = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;

    return AlertDialog(
      backgroundColor: cardBg,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: borderColor),
      ),
      title: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: AppColors.emeraldGreen.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Icon(Icons.payment_rounded, color: AppColors.emeraldGreen, size: 20),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text("Record Payment", style: AppTypography.headingSmall(color: textPrimary)),
                Text(widget.invoice.invoiceNumber, style: AppTypography.caption(color: textSecondary)),
              ],
            ),
          ),
        ],
      ),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Balance due info box
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: textSecondary.withValues(alpha: 0.06),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text("Customer", style: AppTypography.caption(color: textSecondary)),
                      Text(widget.invoice.customerName, style: AppTypography.bodySmall(color: textPrimary, fontWeight: FontWeight.bold)),
                    ],
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text("Balance Due", style: AppTypography.caption(color: textSecondary)),
                      Text(
                        Formatters.formatCurrency(widget.invoice.balanceDue),
                        style: AppTypography.bodySmall(color: AppColors.errorRed, fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 14),

            // Amount field
            TextField(
              controller: _amountController,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              style: AppTypography.bodySmall(color: textPrimary, fontWeight: FontWeight.bold),
              decoration: InputDecoration(
                labelText: "Payment Amount (₹) *",
                prefixText: "₹ ",
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
              ),
            ),

            const SizedBox(height: 12),

            // Payment Mode Dropdown
            Text("Payment Mode", style: AppTypography.caption(color: textSecondary)),
            const SizedBox(height: 4),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: borderColor),
              ),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<String>(
                  value: _paymentMode,
                  isExpanded: true,
                  items: _paymentModes.map((mode) {
                    return DropdownMenuItem(
                      value: mode,
                      child: Text(mode, style: AppTypography.bodySmall(color: textPrimary)),
                    );
                  }).toList(),
                  onChanged: (val) {
                    if (val != null) setState(() => _paymentMode = val);
                  },
                ),
              ),
            ),

            const SizedBox(height: 12),

            // Reference Number
            TextField(
              controller: _refController,
              style: AppTypography.bodySmall(color: textPrimary),
              decoration: InputDecoration(
                labelText: "Transaction Ref / UTR / Cheque No.",
                hintText: "e.g. UTR198472918",
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
              ),
            ),

            const SizedBox(height: 12),

            // Notes
            TextField(
              controller: _notesController,
              maxLines: 2,
              style: AppTypography.bodySmall(color: textPrimary),
              decoration: InputDecoration(
                labelText: "Notes / Remarks (Optional)",
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
              ),
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: _isSubmitting ? null : () => Navigator.pop(context),
          child: const Text("Cancel"),
        ),
        ElevatedButton(
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.emeraldGreen,
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          ),
          onPressed: _isSubmitting ? null : _submitPayment,
          child: _isSubmitting
              ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
              : const Text("Confirm Payment"),
        ),
      ],
    );
  }
}

