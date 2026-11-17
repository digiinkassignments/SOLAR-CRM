import { useState } from 'react';
import { Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, MenuItem, Stack, Switch, TextField, Typography } from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import AddIcon from '@mui/icons-material/Add';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { AMC_FREQUENCIES } from '../utils/amcPlans';

const blank = () => ({ name: '', coverage: '', exclusions: '', annual_amount: '', visit_frequency: 'Quarterly', term_months: 12, is_active: true });

export default function AmcPlanManager({ onChanged }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false), [plans, setPlans] = useState([]), [form, setForm] = useState(null);
  const [loading, setLoading] = useState(false), [saving, setSaving] = useState(false), [error, setError] = useState('');
  const canEdit = Number(user?.role_id) === 1;
  async function load() {
    setLoading(true); setError('');
    try { const r = await api.get('/amc-plans'); setPlans(r.data.plans || []); }
    catch (e) { setError(e.response?.data?.message || 'Could not load company plans. Please retry.'); }
    finally { setLoading(false); }
  }
  async function save(e) {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const body = { ...form, annual_amount: Number(form.annual_amount), term_months: Number(form.term_months) };
      if (form.id) await api.put(`/amc-plans/${form.id}`, body); else await api.post('/amc-plans', body);
      setForm(null); await load(); onChanged?.();
    } catch (err) { setError(err.response?.data?.message || 'Could not save this plan. Your edits are still here.'); }
    finally { setSaving(false); }
  }
  const field = key => ({ value: form[key], onChange: e => setForm({ ...form, [key]: e.target.value }) });
  return <>
    <Button variant="outlined" startIcon={<EditOutlinedIcon />} onClick={() => { setOpen(true); setForm(null); load(); }} sx={{ textTransform: 'none', whiteSpace: 'normal', flexShrink: 0 }}>{canEdit ? 'Edit AMC Plans' : 'View AMC Plans'}</Button>
    <Dialog open={open} onClose={() => { if (!saving) setOpen(false); }} fullWidth maxWidth="md">
      <DialogTitle>Company AMC plans</DialogTitle>
      <DialogContent dividers>
        <Typography color="text.secondary" sx={{ mb: 2 }}>Create the plans your company offers. No plan is selected automatically. Changes apply to future selections; saved project contracts retain their agreed terms.</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error} {!form && <Button onClick={load}>Retry</Button>}</Alert>}
        {form ? <Box component="form" id="amc-plan-editor" onSubmit={save}>
          <Stack spacing={2}>
            <TextField label="Plan name" required inputProps={{ maxLength: 60 }} {...field('name')} />
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField label="Annual fee (Rs)" type="number" required inputProps={{ min: 0, max: 99999999.99, step: 0.01 }} {...field('annual_amount')} />
              <TextField select label="Service frequency" {...field('visit_frequency')}>{AMC_FREQUENCIES.map(f => <MenuItem value={f} key={f}>{f}</MenuItem>)}</TextField>
              <TextField label="Contract term (months)" type="number" required inputProps={{ min: 1, max: 120, step: 1 }} {...field('term_months')} />
            </Box>
            <TextField label="Included services / coverage" required multiline minRows={3} inputProps={{ maxLength: 4000 }} {...field('coverage')} />
            <TextField label="Exclusions / additional terms" multiline minRows={2} inputProps={{ maxLength: 4000 }} {...field('exclusions')} />
            <FormControlLabel control={<Switch checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} />} label="Active — available for new contracts" />
            <Alert severity="info">Archive by switching Active off. Existing contracts keep their saved plan, price and coverage.</Alert>
          </Stack>
        </Box> : loading ? <CircularProgress size={24} /> : <Stack spacing={1.5}>
          {canEdit && <Button startIcon={<AddIcon />} variant="contained" onClick={() => { setError(''); setForm(blank()); }} sx={{ alignSelf: 'flex-start' }}>Create AMC plan</Button>}
          {!plans.length && !error && <Alert severity="info">No company AMC plans yet. {canEdit ? 'Create your first plan to make it available in Warranty & AMC.' : 'Ask your company administrator to create plans.'}</Alert>}
          {plans.map(plan => <Box key={plan.id} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2 }}>
            <Stack direction="row" useFlexGap flexWrap="wrap" spacing={1} alignItems="center">
              <Typography fontWeight={700} sx={{ flex: 1, overflowWrap: 'anywhere' }}>{plan.name}</Typography>
              <Chip size="small" color={Number(plan.is_active) ? 'success' : 'default'} label={Number(plan.is_active) ? 'Active' : 'Archived'} />
              {canEdit && <Button onClick={() => { setError(''); setForm({ ...plan, exclusions: plan.exclusions || '', is_active: Boolean(Number(plan.is_active)) }); }}>Edit plan</Button>}
            </Stack>
            <Typography variant="body2" sx={{ my: 1 }}>Rs {Number(plan.annual_amount).toLocaleString('en-IN')} / year · {plan.visit_frequency} · {plan.term_months} months</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{plan.coverage}</Typography>
            {plan.exclusions && <Typography variant="body2" sx={{ mt: 1, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>Exclusions: {plan.exclusions}</Typography>}
          </Box>)}
        </Stack>}
      </DialogContent>
      <DialogActions sx={{ p: 2, flexWrap: 'wrap', gap: 1 }}>
        <Button disabled={saving} onClick={() => { if (form) { setForm(null); setError(''); } else setOpen(false); }}>{form ? 'Cancel edit' : 'Close'}</Button>
        {form && <Button disabled={saving} variant="contained" type="submit" form="amc-plan-editor">{saving ? 'Saving…' : 'Save plan'}</Button>}
      </DialogActions>
    </Dialog>
  </>;
}
