import { Box, Typography } from "@mui/material";
export default function SolarTaxSummary({ tax }) {
  if (!tax || tax.mode !== "solar_composite") return null;
  const money = (n) => "Rs " + Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return <Box sx={{ my: 1.5, p: 1.5, border: "1px solid #CBD5E1", borderRadius: 1, color: "#111", bgcolor: "#fff" }}>
    <Typography sx={{ fontSize: 11, fontWeight: 800, mb: 0.75 }}>GST summary - Complete solar system (70:30)</Typography>
    {[["Goods: 70%", tax.goodsValue, "5%", tax.goodsTax], ["Services: 30%", tax.serviceValue, "18%", tax.serviceTax]].map(([label, value, rate, gst]) => <Box key={label} sx={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 1, fontSize: 11, py: 0.25 }}><span>{label}: {money(value)} at {rate}</span><strong>{money(gst)}</strong></Box>)}
    <Typography sx={{ fontSize: 11, fontWeight: 700, mt: 0.75 }}>Total GST: {money(tax.gst)} (effective 8.9%)</Typography>
  </Box>;
}
