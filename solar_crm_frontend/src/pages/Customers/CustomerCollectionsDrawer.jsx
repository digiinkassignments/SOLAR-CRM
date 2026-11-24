import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import api from '../../api/axios';
import { currency, moneyInput } from './customerMoney';

export function CollectionActionDialog({
  action,
  customer,
  invoice,
  owners = [],
  onClose,
  onSaved,
  today,
}) {
  const [form, setForm] = useState({
    amount: '',
    note: '',
    promised_date: '',
    owner_id: '',
    date: today,
    mode: 'Bank Transfer',
    reference: '',
    refund_alert_days: '7',
  });
  const [key] = useState(() => crypto.randomUUID());
  const [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const financial = ['payment', 'refund', 'credit'].includes(action);
  const title = {
    note: 'Log payment follow-up',
    promise: 'Set promised payment date',
    done: 'Complete follow-up',
    assign: 'Assign collection owner',
    payment: 'Record payment received',
    refund: 'Record refund paid',
    credit: 'Record credit note',
    settings: 'Refund alert settings',
  }[action];
  const field = (name, label, extra = {}) => (
    <TextField
      fullWidth
      label={label}
      value={form[name]}
      onChange={(e) => setForm({ ...form, [name]: e.target.value })}
      {...extra}
    />
  );
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const id = customer?.id;
      if (action === 'payment')
        await api.post(`/customers/${id}/collection-payment`, {
          amount: form.amount,
          payment_date: form.date,
          payment_mode: form.mode,
          reference_number: form.reference,
          record_key: invoice.key,
          invoice_id: invoice.invoice_id,
          request_key: key,
        });
      else if (action === 'refund')
        await api.post(`/customers/${id}/refunds`, {
          amount: form.amount,
          refund_date: form.date,
          refund_mode: form.mode,
          refund_reference: form.reference,
          invoice_id: invoice.invoice_id,
          record_key: invoice.key,
          request_key: key,
        });
      else if (action === 'credit')
        await api.post(`/customers/${id}/credit-notes`, {
          amount: form.amount,
          credit_date: form.date,
          reference: form.reference,
          invoice_id: invoice.invoice_id,
          request_key: key,
        });
      else if (action === 'settings')
        await api.put('/customers/directory/settings', {
          refund_alert_days: Number(form.refund_alert_days),
        });
      else
        await api.post(`/customers/${id}/collections`, {
          action,
          note: form.note,
          promised_date: form.promised_date,
          owner_id: form.owner_id,
        });
      onSaved();
    } catch (e) {
      setError(e.response?.data?.message || 'Could not save. Please retry with this form.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog open fullWidth maxWidth="sm" onClose={() => !busy && onClose()}>
      <Box component="form" onSubmit={submit}>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            {customer && (
              <Typography fontWeight={700}>
                {customer.customer_name} {invoice && `· ${invoice.invoice_number}`}
              </Typography>
            )}
            {error && <Alert severity="error">{error}</Alert>}
            {financial && (
              <>
                <Alert severity="info">
                  Record an actual transaction. This does not transfer money or automatically
                  message the customer.
                </Alert>
                {action !== 'credit' && (
                  <Typography fontWeight={700}>
                    {action === 'refund' ? 'Refund due' : 'Outstanding'}:{' '}
                    {currency(action === 'refund' ? invoice.refund_due : invoice.balance_due)}
                  </Typography>
                )}
                <TextField
                  required
                  fullWidth
                  label="Amount (₹)"
                  value={moneyInput(form.amount)}
                  onChange={(e) => {
                    const v = e.target.value.replace(/,/g, '');
                    if (/^\d{0,10}(\.\d{0,2})?$/.test(v)) setForm({ ...form, amount: v });
                  }}
                  slotProps={{ htmlInput: { inputMode: 'decimal' } }}
                />
                {field('date', 'Transaction date', {
                  required: true,
                  type: 'date',
                  slotProps: { inputLabel: { shrink: true } },
                })}
                {action !== 'credit' &&
                  field('mode', 'Mode', {
                    select: true,
                    children: ['Bank Transfer', 'UPI', 'Cash', 'Cheque', 'Card', 'Other'].map(
                      (v) => (
                        <MenuItem value={v} key={v}>
                          {v}
                        </MenuItem>
                      )
                    ),
                  })}
                {field('reference', 'Reference', {
                  required: action === 'credit',
                  slotProps: { htmlInput: { maxLength: 100 } },
                })}
              </>
            )}
            {['note', 'promise'].includes(action) &&
              field('note', 'Discussion / follow-up note', {
                required: true,
                multiline: true,
                minRows: 3,
                slotProps: { htmlInput: { maxLength: 2000 } },
              })}
            {action === 'promise' &&
              field('promised_date', 'Promised payment date', {
                required: true,
                type: 'date',
                slotProps: { inputLabel: { shrink: true }, htmlInput: { min: today } },
              })}
            {action === 'done' && (
              <Typography>
                Mark the current follow-up task complete? This does not settle the customer’s
                balance.
              </Typography>
            )}
            {action === 'assign' &&
              field('owner_id', 'Collection owner', {
                required: true,
                select: true,
                children: owners.map((o) => (
                  <MenuItem value={o.id} key={o.id}>
                    {o.full_name}
                  </MenuItem>
                )),
              })}
            {action === 'settings' &&
              field('refund_alert_days', 'Alert after this many days (1–365)', {
                required: true,
                helperText: 'Refund reminders repeat every 7 days after this threshold.',
                slotProps: { htmlInput: { inputMode: 'numeric' } },
              })}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button disabled={busy} onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={busy}>
            {busy ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

export default function CustomerCollectionsDrawer({
  customer,
  canRecord,
  canPlan,
  today,
  onClose,
  onChanged,
}) {
  const [data, setData] = useState(null),
    [error, setError] = useState(''),
    [action, setAction] = useState(null),
    [dateEdit, setDateEdit] = useState(null);
  const load = useCallback(async () => {
    try {
      const r = await api.get(`/customers/${customer.id}/collections`);
      setData(r.data.data);
      setError('');
    } catch (e) {
      setError(e.response?.data?.message || 'Could not load invoice breakdown.');
    }
  }, [customer.id]);
  useEffect(() => {
    load();
  }, [load]);
  const saveDate = async () => {
    try {
      await api.put(`/customers/${customer.id}/collection-due-date`, dateEdit);
      setDateEdit(null);
      await load();
      onChanged();
    } catch (e) {
      setError(e.response?.data?.message || 'Could not save due date.');
    }
  };
  return (
    <Drawer
      anchor="right"
      open
      onClose={onClose}
      slotProps={{ paper: { sx: { width: { xs: '100%', md: 650 }, maxWidth: '100vw' } } }}
    >
      <Box sx={{ p: { xs: 2, md: 3 }, minWidth: 0 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight={700}>
            Invoice & payment breakdown
          </Typography>
          <IconButton aria-label="Close breakdown" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Stack>
        <Typography fontWeight={700} sx={{ mt: 1 }}>
          {customer.customer_name}
        </Typography>
        <Typography color="text.secondary" variant="body2">
          {customer.customer_code}
        </Typography>
        <Alert severity="info" sx={{ my: 2 }}>
          Balances are calculated per invoice. Outstanding and refunds on different invoices are
          shown separately. Subsidy is excluded. Lead-linked loans are allocated to the oldest
          linked unpaid invoice first.
        </Alert>
        {error && (
          <Alert severity="error" action={<Button onClick={load}>Retry</Button>}>
            {error}
          </Alert>
        )}
        {!data && !error && <CircularProgress sx={{ my: 4 }} />}
        {data?.ledger.invoices.map((i) => (
          <Paper key={i.key} variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 3 }}>
            <Typography fontWeight={700}>{i.invoice_number}</Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2,minmax(0,1fr))',
                gap: 1.5,
                my: 2,
              }}
            >
              {[
                ['Invoice / opening amount', i.amount],
                ['Credit notes', i.credit_notes],
                ['Final amount', i.final_amount],
                ['Customer payments', i.payments_received],
                ['Loan sanctioned', i.loan_sanctioned],
                ['Loan disbursed', i.loan_disbursed],
                ['Total received', i.total_received],
                ['Refunds paid', i.refunds_paid],
              ].map(([label, value]) => (
                <Box key={label}>
                  <Typography variant="caption" color="text.secondary">
                    {label}
                  </Typography>
                  <Typography fontWeight={600}>{currency(value)}</Typography>
                </Box>
              ))}
            </Box>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              <Chip
                label={`Outstanding ${currency(i.balance_due)}`}
                color={i.balance_due ? 'warning' : 'default'}
              />
              <Chip
                label={`Refund due ${currency(i.refund_due)}`}
                color={i.refund_due ? 'secondary' : 'default'}
              />
            </Stack>
            {i.loan_awaited > 0 && (
              <Typography color="info.main" sx={{ mt: 1 }}>
                Loan awaited {currency(i.loan_awaited)}
              </Typography>
            )}
            <Typography
              variant="body2"
              color={i.days_overdue ? 'error' : 'text.secondary'}
              sx={{ mt: 1.5 }}
            >
              Next due: {i.next_due_date || 'No due date set'}
              {i.days_overdue > 0 ? ` · ${i.days_overdue} days overdue` : ''}
            </Typography>
            {i.milestones.map((m) => (
              <Typography variant="body2" key={m.id} sx={{ mt: 0.5 }}>
                {m.title}: {currency(m.balance_amount)} · {m.due_date || 'No due date set'}
              </Typography>
            ))}
            <Stack direction="row" useFlexGap flexWrap="wrap" spacing={1} sx={{ mt: 2 }}>
              {canRecord && i.balance_due > 0 && i.key !== 'unallocated' && (
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => setAction({ type: 'payment', invoice: i })}
                >
                  Record payment
                </Button>
              )}
              {canRecord && i.refund_due > 0 && (
                <Button
                  variant="outlined"
                  color="secondary"
                  size="small"
                  onClick={() => setAction({ type: 'refund', invoice: i })}
                >
                  Record refund
                </Button>
              )}
              {canRecord && i.invoice_id && (
                <Button size="small" onClick={() => setAction({ type: 'credit', invoice: i })}>
                  Credit note
                </Button>
              )}
              {canPlan && (
                <Button
                  size="small"
                  onClick={() =>
                    setDateEdit({ record_key: i.key, due_date: i.next_due_date || '' })
                  }
                >
                  Set due date
                </Button>
              )}
            </Stack>
          </Paper>
        ))}
        {data && !data.ledger.invoices.length && (
          <Alert severity="info">No invoice or opening financial record.</Alert>
        )}
        <Divider sx={{ my: 2 }} />
        <Typography fontWeight={700}>Recent follow-up activity</Typography>
        {data?.activity.length === 0 && (
          <Typography color="text.secondary" sx={{ my: 2 }}>
            No collection follow-up logged yet.
          </Typography>
        )}
        {data?.activity.map((a) => (
          <Box key={a.id} sx={{ py: 1.5, borderBottom: '1px solid #e2e8f0' }}>
            <Typography fontWeight={600}>
              {a.action} · {a.performed_by_name || 'Staff'}
            </Typography>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
              {a.note}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {a.created_at && new Date(a.created_at).toLocaleString('en-IN')}
              {a.promised_date && ` · Promised ${String(a.promised_date).slice(0, 10)}`}
            </Typography>
          </Box>
        ))}
        {action && (
          <CollectionActionDialog
            action={action.type}
            invoice={action.invoice}
            customer={customer}
            today={today}
            onClose={() => setAction(null)}
            onSaved={() => {
              setAction(null);
              load();
              onChanged();
            }}
          />
        )}
        {dateEdit && (
          <Dialog open fullWidth maxWidth="xs" onClose={() => setDateEdit(null)}>
            <DialogTitle>Set payment due date</DialogTitle>
            <DialogContent>
              <TextField
                fullWidth
                label="Due date"
                type="date"
                value={dateEdit.due_date}
                sx={{ mt: 1 }}
                onChange={(e) => setDateEdit({ ...dateEdit, due_date: e.target.value })}
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <Typography variant="body2" sx={{ mt: 2 }}>
                For a milestone plan, this sets the date on all unpaid milestones. Use the customer
                profile to edit individual milestones.
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDateEdit(null)}>Cancel</Button>
              <Button variant="contained" disabled={!dateEdit.due_date} onClick={saveDate}>
                Save date
              </Button>
            </DialogActions>
          </Dialog>
        )}
      </Box>
    </Drawer>
  );
}
