import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'app_colors.dart';

/// Typography definitions matched with the Solar CRM Web Frontend:
/// Headings: 'Outfit', sans-serif
/// Body & Controls: 'Inter', sans-serif
class AppTypography {
  // Headings (Outfit)
  static TextStyle headingLarge({Color? color}) =>
      GoogleFonts.outfit(
        fontSize: 24,
        fontWeight: FontWeight.w700,
        color: color,
        letterSpacing: -0.5,
      );

  static TextStyle headingMedium({Color? color}) =>
      GoogleFonts.outfit(
        fontSize: 20,
        fontWeight: FontWeight.w600,
        color: color,
        letterSpacing: -0.3,
      );

  static TextStyle headingSmall({Color? color}) =>
      GoogleFonts.outfit(
        fontSize: 16,
        fontWeight: FontWeight.w600,
        color: color,
      );

  static TextStyle heading({double size = 20, Color? color, FontWeight fontWeight = FontWeight.w600}) =>
      GoogleFonts.outfit(
        fontSize: size,
        fontWeight: fontWeight,
        color: color,
        letterSpacing: -0.3,
      );

  static TextStyle subheading({Color? color}) =>
      GoogleFonts.outfit(
        fontSize: 16,
        fontWeight: FontWeight.w600,
        color: color,
      );

  // Subtitle / Labels (Inter)
  static TextStyle subtitle({Color? color}) =>
      GoogleFonts.inter(
        fontSize: 14,
        fontWeight: FontWeight.w500,
        color: color,
      );

  static TextStyle bodyMedium({Color? color, FontWeight fontWeight = FontWeight.w400}) =>
      GoogleFonts.inter(
        fontSize: 14,
        fontWeight: fontWeight,
        color: color,
        height: 1.4,
      );

  static TextStyle body({Color? color, FontWeight fontWeight = FontWeight.w400, double fontSize = 14}) =>
      GoogleFonts.inter(
        fontSize: fontSize,
        fontWeight: fontWeight,
        color: color,
        height: 1.4,
      );

  static TextStyle bodySmall({Color? color, FontWeight fontWeight = FontWeight.w400}) =>
      GoogleFonts.inter(
        fontSize: 12,
        fontWeight: fontWeight,
        color: color,
        height: 1.3,
      );

  static TextStyle caption({Color? color, FontWeight fontWeight = FontWeight.w500}) =>
      GoogleFonts.inter(
        fontSize: 11,
        fontWeight: fontWeight,
        color: color,
      );

  static TextStyle badge({Color color = AppColors.brandPrimary}) =>
      GoogleFonts.inter(
        fontSize: 11,
        fontWeight: FontWeight.w700,
        color: color,
        letterSpacing: 0.5,
      );

  static TextStyle button({Color color = Colors.white}) =>
      GoogleFonts.inter(
        fontSize: 14,
        fontWeight: FontWeight.w600,
        color: color,
        letterSpacing: 0.2,
      );
}
