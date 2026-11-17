import { LEAD_STATUSES, CLOSED_LEAD_STATUSES } from '../utils/leadStages';
import { useEffect, useState } from "react";
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField, Typography } from "@mui/material";
import api from "../api/axios";
import toast from "react-hot-toast";
export default function LeadActionDialog({ open, lead, onClose, onSaved }) {
  return open && lead ? <ActionForm key={lead.id} lead={lead} onClose={onClose} onSaved={onSaved} /> : null;
}
function ActionForm({ lead, onClose, onSaved }) {
  const [form, setForm] = useState({ note: "", call_outcome: "", next_action: lead.next_action || "", next_follow_up_date: String(lead.next_follow_up_date || "").slice(0, 10), next_follow_up_time: String(lead.next_follow_up_time || "").slice(0, 5), followup_type: "Call", status_after_followup: lead.status || "New Lead" });
  const [statuses, setStatuses] = useState([...new Set([lead.status || "New Lead", ...LEAD_STATUSES])]);
  const closed = CLOSED_LEAD_STATUSES.includes(form.status_after_followup);
  const [busy, setBusy] = useState(false), [timezone, setTimezone] = useState("Asia/Kolkata");
  useEffect(() => { api.get("/lead-config/pipeline-statuses?include_inactive=false").then(r => { const list=r.data.data || []; setStatuses([...new Set([lead.status || "New Lead", ...list.map(item=>item.name)])]); }).catch(()=>{}); }, [lead.status]);
  useEffect(() => { api.get("/sales-workflow/settings").then(r => setTimezone(r.data.data.timezone)).catch(() => {}); }, []);
  const change = (key, value) => setForm(p => ({ ...p, [key]: value }));
  const save = async () => {
    if (busy) return;
    if (!form.note.trim() || !form.call_outcome || (!closed && (!form.next_action.trim() || !form.next_follow_up_date || !form.next_follow_up_time))) { toast.error("Complete outcome, note, next action, date and exact time."); return; }
    setBusy(true);
    try { const r = await api.post(`/sales-workflow/leads/${lead.id}/action`, form); toast.success(r.data.message); onSaved?.(); onClose(); }
    catch (e) { toast.error(e.response?.data?.message || "Action could not be saved."); }
    finally { setBusy(false); }
  };
  return <Dialog open onClose={() => { if (!busy) onClose(); }} maxWidth="sm" fullWidth>
    <DialogTitle sx={{ fontWeight: 800 }}>Log outcome &amp; next action<Typography variant="body2" color="text.secondary">{lead.customer_name} - {lead.lead_code}</Typography></DialogTitle>
    <DialogContent><Stack spacing={2} sx={{ pt: 1 }}>
      <Alert severity="info">Scheduling timezone: {timezone}. Calling a number does not mark it contacted; record the actual outcome.</Alert>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
        <TextField select size="small" label="Activity type" value={form.followup_type} onChange={e => change("followup_type", e.target.value)}>{["Call", "WhatsApp", "Meeting", "Site Visit", "Other"].map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}</TextField>
        <TextField select required size="small" label="Actual outcome" value={form.call_outcome} onChange={e => change("call_outcome", e.target.value)}>{["Connected", "No answer", "Busy", "Call later", "Wrong number", "Meeting completed", "Note only"].map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}</TextField>
      </Box>
      <TextField select size="small" label="Lead status after activity" value={form.status_after_followup} onChange={e=>change("status_after_followup",e.target.value)}>{statuses.map(value=><MenuItem key={value} value={value}>{value}</MenuItem>)}</TextField>
      <TextField required label="Discussion note" placeholder="e.g. Discussed 5kW system, customer requested quotation over WhatsApp" multiline minRows={3} value={form.note} onChange={e => change("note", e.target.value)} />
      <TextField disabled={closed} required={!closed} label="Next action" placeholder="e.g. Share quotation over WhatsApp & follow up tomorrow" value={form.next_action} onChange={e => change("next_action", e.target.value)} slotProps={{ htmlInput: { maxLength: 255 } }} />
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
        <TextField disabled={closed} required={!closed} type="date" label="Next follow-up date" value={form.next_follow_up_date} onChange={e => change("next_follow_up_date", e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
        <TextField disabled={closed} required={!closed} type="time" label="Exact time" value={form.next_follow_up_time} onChange={e => change("next_follow_up_time", e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
      </Box>
    </Stack></DialogContent>
    <DialogActions sx={{ p: 2 }}><Button disabled={busy} onClick={onClose}>Cancel</Button><Button disabled={busy} variant="contained" onClick={save}>{busy ? "Saving..." : "Save outcome & schedule"}</Button></DialogActions>
  </Dialog>;
}
