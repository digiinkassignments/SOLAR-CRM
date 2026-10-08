/**
 * PM Surya Ghar & MNRE Subsidy Calculation Engine
 * Strictly computes Central Financial Assistance (CFA) based on official government gazette rules.
 */

const calculateGovtSubsidy = ({
  recommendedKw = 1.0,
  propertyType = "Residential",
  subsidyType = "With Subsidy (DCR)",
}) => {
  let subsidyAmount = 0;
  let subsidyFormulaText = "No Subsidy";
  let isEligible = false;

  const isResidential = propertyType === "Residential";
  const isDcr = !subsidyType.includes("Non-DCR") && subsidyType !== "No Subsidy";

  if (isResidential && isDcr) {
    isEligible = true;
    subsidyFormulaText = "PM Surya Ghar (max 3 kW)";

    if (recommendedKw <= 2.0) {
      subsidyAmount = Math.round(recommendedKw * 30000);
    } else if (recommendedKw <= 3.0) {
      subsidyAmount = Math.round(60000 + (recommendedKw - 2.0) * 18000);
    } else {
      subsidyAmount = 78000; // Hard cap at 3 kW max = ₹78,000
    }
  } else {
    subsidyAmount = 0;
    if (!isResidential) {
      subsidyFormulaText = "Commercial / Industrial - No Subsidy";
    } else if (!isDcr) {
      subsidyFormulaText = "Non-DCR Panels - Ineligible for CFA Subsidy";
    }
  }

  return {
    subsidy_amount: subsidyAmount,
    subsidy_formula_text: subsidyFormulaText,
    is_eligible: isEligible,
    scheme_name: "PM Surya Ghar Muft Bijli Yojana",
    max_cfa_limit: 78000,
  };
};

module.exports = {
  calculateGovtSubsidy,
};
