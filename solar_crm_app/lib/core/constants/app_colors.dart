import 'package:flutter/material.dart';

/// Pure Black & White Solar CRM Palette
/// Adapts dynamically with System Theme (Dark / Light)
class AppColors {
  // Brand Accents
  static const Color brandPrimary = Color(0xFFF59E0B);      // Solar Gold / Amber (#F59E0B)
  static const Color brandPrimaryHover = Color(0xFFD97706); // Amber 600
  static const Color brandPrimaryLight = Color(0xFFFEF3C7); // Amber 100
  static const Color brandNavy = Color(0xFF0F172A);         // Deep Slate Navy (#0F172A)
  static const Color amberDark = brandPrimaryHover;
  
  // Status Accents
  static const Color emeraldGreen = Color(0xFF10B981);      // Emerald Green (#10B981)
  static const Color emeraldLight = Color(0xFFD1FAE5);
  static const Color emerald = emeraldGreen;
  static const Color successGreen = emeraldGreen;
  static const Color skyBlue = Color(0xFF3B82F6);           // Info Blue
  static const Color skyBlueLight = Color(0xFFDBEAFE);
  static const Color purple = Color(0xFF8B5CF6);
  static const Color purpleLight = Color(0xFFEDE9FE);
  static const Color errorRed = Color(0xFFEF4444);          // Red / Danger
  static const Color errorLight = Color(0xFFFEE2E2);

  // --- PURE BLACK DARK MODE (System Dark) ---
  static const Color darkBackground = Color(0xFF000000);     // Pure True Black
  static const Color darkSurface = Color(0xFF121212);        // Subtle dark elevated surface
  static const Color darkSurfaceElevated = Color(0xFF1C1C1E);// Dialogs / Cards
  static const Color darkCard = Color(0xFF121212);
  static const Color darkBorder = Color(0xFF262626);         // Crisp Dark Border
  static const Color darkBorderMuted = Color(0xFF1F1F1F);
  static const Color textPrimaryDark = Color(0xFFFFFFFF);    // Pure White Text
  static const Color textSecondaryDark = Color(0xFFA1A1AA);  // Zinc 400
  static const Color textMutedDark = Color(0xFF71717A);      // Zinc 500

  // --- PURE WHITE LIGHT MODE (System Light) ---
  static const Color lightBackground = Color(0xFFFFFFFF);    // Pure White
  static const Color lightSurface = Color(0xFFF8FAFC);       // Soft surface
  static const Color lightSurfaceElevated = Color(0xFFFFFFFF);
  static const Color lightCard = Color(0xFFFFFFFF);
  static const Color lightBorder = Color(0xFFE4E4E7);        // Zinc 200 Border
  static const Color lightBorderMuted = Color(0xFFF4F4F5);
  static const Color textPrimaryLight = Color(0xFF09090B);   // Near Pure Black Text
  static const Color textSecondaryLight = Color(0xFF52525B); // Zinc 600
  static const Color textMutedLight = Color(0xFFA1A1AA);     // Zinc 400
}
