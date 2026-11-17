const STAGES = ["Eligibility & Docs", "Applied", "Under Review", "Sanctioned", "Disbursed"];
const aliases = {"Eligibility Check":"Eligibility & Docs", "Docs Pending":"Eligibility & Docs", "Applied / Logged":"Applied", "Bank FI & Verification":"Under Review", "Subsidy Adjusted":"Disbursed"};
const normalize = value => aliases[value] || value;
const validateStageTransition = (fromStage, toStage, loan = {}) => {
  const from = STAGES.indexOf(normalize(fromStage));
  const to = STAGES.indexOf(normalize(toStage));
  const fail = error => ({ok:false, missing:[], error});
  if (from < 0 || to < 0) return fail("Unknown loan stage.");
  if (to < from) return {ok:true, isBackward:true};
  const missing = [];
  const positive = field => Number.isFinite(Number(loan[field])) && Number(loan[field]) > 0;
  const text = field => typeof loan[field] === "string" && loan[field].trim();
  const date = field => {
    const value = String(loan[field] || "").slice(0,10);
    return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0,10) === value;
  };
  if (to >= 1) {
    if (!text("bank_name")) missing.push("Lender");
    if (!positive("loan_amount_applied")) missing.push("Requested amount");
    if (!date("applied_date")) missing.push("Valid application date");
    if (!text("portal_application_no")) missing.push("Lender / portal application reference");
  }
  if (to >= 3) {
    if (!positive("sanctioned_amount")) missing.push("Sanctioned amount");
    if (!date("sanction_date")) missing.push("Valid sanction date");
    if (!text("sanction_letter_url") && !loan.documents?.some(doc => /sanction/i.test(doc.doc_type || ""))) missing.push("Sanction letter");
  }
  if (to >= 4) {
    if (!positive("disbursed_amount")) missing.push("Actual disbursed amount");
    if (!date("disbursal_date")) missing.push("Valid disbursement date");
    if (Number(loan.disbursed_amount) > Number(loan.sanctioned_amount)) return fail("Disbursed amount cannot exceed sanctioned amount.");
  }
  if (missing.length) return {ok:false, missing, error:`Required before ${toStage}: ${missing.join(", ")}`};
  if (to >= 3 && String(loan.sanction_date).slice(0,10) < String(loan.applied_date).slice(0,10)) return fail("Sanction date cannot precede application date.");
  if (to >= 4 && String(loan.disbursal_date).slice(0,10) < String(loan.sanction_date).slice(0,10)) return fail("Disbursement date cannot precede sanction date.");
  return {ok:true, isBackward:false};
};
module.exports = { validateStageTransition };
