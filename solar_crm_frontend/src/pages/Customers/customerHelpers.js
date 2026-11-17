import toast from "react-hot-toast";

export const money = value => value == null ? "Not recorded" : new Intl.NumberFormat("en-IN", {style:"currency",currency:"INR",maximumFractionDigits:0}).format(Number(value) || 0);
export const dateLabel = value => value && !Number.isNaN(Date.parse(value)) ? new Date(value).toLocaleDateString("en-IN", {day:"numeric",month:"short",year:"numeric"}) : "Not recorded";
export const initials = value => String(value || "Customer").trim().split(/\s+/).slice(0,2).map(word=>word[0]).join("").toUpperCase();
export function phoneNumber(value) {
  const digits=String(value || "").replace(/\D/g, "");
  if (!digits || /^0+$/.test(digits)) return "";
  if (digits.length===10) return `91${digits}`;
  if (digits.length===12 && digits.startsWith("91")) return digits;
  return "";
}
export async function copyValue(value, label="Value") {
  try { await navigator.clipboard.writeText(String(value)); toast.success(`${label} copied`); }
  catch { toast.error("Could not copy. Please select and copy the value."); }
}
