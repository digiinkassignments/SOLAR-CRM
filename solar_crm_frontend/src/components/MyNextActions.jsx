import { useCallback, useEffect, useState } from "react";
import { Alert, Box, Button, Paper, Stack, Typography } from "@mui/material";
import api from "../api/axios";
import LeadActionDialog from "./LeadActionDialog";
export default function MyNextActions({ onChanged }) {
  const [data, setData] = useState(null), [error, setError] = useState(""), [lead, setLead] = useState(null);
  const refresh = useCallback(async () => { try { const r = await api.get("/sales-workflow/actions"); setData(r.data.data); setError(""); } catch { setError("Next actions could not be loaded."); } }, []);
  useEffect(() => { api.get("/sales-workflow/actions").then(r => setData(r.data.data)).catch(() => setError("Next actions could not be loaded.")); }, []);
  return <Paper variant="outlined" sx={{ p: 2.5, mb: 2, borderRadius: 3 }}>
    <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", gap: 1 }}><Box><Typography fontWeight={800}>My next actions</Typography><Typography variant="caption" color="text.secondary">Due work and leads missing a complete next action - {data?.timezone || "Loading timezone"}</Typography></Box><Button onClick={refresh}>Refresh</Button></Stack>
    {error && <Alert severity="error">{error}</Alert>}
    {data?.actions.map(row => <Box key={row.id} sx={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 1.5, py: 1.5, borderBottom: "1px solid #E2E8F0" }}><Box><Typography variant="body2" fontWeight={700}>{row.customer_name} - {row.lead_code}</Typography><Typography variant="body2">{row.next_action || "Next action missing"}</Typography><Typography variant="caption" color="text.secondary">{String(row.next_follow_up_date || "Date missing").slice(0, 10)} {String(row.next_follow_up_time || "Time missing").slice(0, 5)}</Typography></Box><Stack direction="row" sx={{ gap: 1, flexWrap: "wrap", alignItems: "center" }}><Button size="small" component="a" href={`tel:${String(row.mobile_number || "").replace(/[^+0-9]/g, "")}`}>Call</Button><Button size="small" variant="outlined" onClick={() => setLead(row)}>Log outcome / reschedule</Button></Stack></Box>)}
    {data && !data.actions.length && <Typography sx={{ py: 2 }} color="text.secondary">No due or incomplete next actions.</Typography>}
    <Typography variant="caption" color="text.secondary">Shows up to 50 actions; prioritises incomplete schedules, then oldest due dates.</Typography>
    <LeadActionDialog open={Boolean(lead)} lead={lead} onClose={() => setLead(null)} onSaved={() => { refresh(); onChanged?.(); }} />
  </Paper>;
}
