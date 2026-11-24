import { useAuth } from '../../context/AuthContext';
import { portalRole } from '../../utils/portalRoles';
import CustomerRefundDialog from './CustomerRefundDialog';
import { useCallback, useEffect, useState } from 'react';
import {
  AddOutlined,
  DeleteOutlineOutlined as DeleteOutline,
  EditOutlined,
  PaymentsOutlined,
} from '@mui/icons-material';
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
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import api from '../../api/axios';
import RecordPaymentModal from '../Invoices/RecordPaymentModal';
import { money, dateLabel } from './customerHelpers';

export default function CustomerPaymentPlans({ customerId, canEdit, onChanged }) {
  const { user } = useAuth();
  const canRecord = Number(user?.role_id) === 1 || portalRole(user) === 'finance';
  const [ledger, setLedger] = useState(null),
    [refunding, setRefunding] = useState(false);
  const [invoices, setInvoices] = useState([]),
    [selected, setSelected] = useState(''),
    [loading, setLoading] = useState(true),
    [error, setError] = useState('');
  const [editing, setEditing] = useState(false),
    [rows, setRows] = useState([]),
    [saving, setSaving] = useState(false),
    [saveError, setSaveError] = useState(''),
    [paymentOpen, setPaymentOpen] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const r = await api.get(`/customers/${customerId}/payment-plans`);
      setInvoices(r.data.data || []);
      const profile = await api.get(`/customers/${customerId}`);
      setLedger(profile.data.data.ledger);
    } catch (e) {
      setError(e.response?.data?.message || 'Payment milestones could not load.');
    } finally {
      setLoading(false);
    }
  }, [customerId]);
  useEffect(() => {
    setSelected('');
    load();
  }, [load]);
  const invoice = invoices.find((row) => String(row.id) === String(selected)) || invoices[0];
  const total = (invoice?.milestones || []).reduce((sum, row) => sum + Number(row.amount), 0);
  const draftTotal = rows.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
  const update = (index, key, value) =>
    setRows((old) => old.map((row, i) => (i === index ? { ...row, [key]: value } : row)));
  const edit = () => {
    setRows(
      invoice.milestones.length
        ? invoice.milestones.map((row) => ({
            title: row.title,
            amount: row.amount,
            due_date: row.due_date || '',
          }))
        : [{ title: '', amount: '', due_date: '' }]
    );
    setSaveError('');
    setEditing(true);
  };
  const save = async () => {
    setSaving(true);
    setSaveError('');
    try {
      await api.put(`/customers/${customerId}/payment-plans/${invoice.id}`, {
        version: invoice.version,
        rows,
      });
      setEditing(false);
      await load();
    } catch (e) {
      setSaveError(e.response?.data?.message || 'Could not save the payment plan.');
    } finally {
      setSaving(false);
    }
  };
  return (
    <Box sx={{ mt: 3 }}>
      {refunding && (
        <CustomerRefundDialog
          customerId={customerId}
          due={ledger?.refund_due || 0}
          onClose={() => setRefunding(false)}
          onSaved={() => {
            setRefunding(false);
            load();
            onChanged?.();
          }}
        />
      )}
      {canRecord && (
        <Button
          variant="outlined"
          color="error"
          disabled={!ledger?.refund_due}
          onClick={() => setRefunding(true)}
          sx={{ mb: 2 }}
        >
          Refund - record outgoing payment
        </Button>
      )}
      {ledger && (
        <Alert severity={ledger.refund_due > 0 ? 'error' : 'info'} sx={{ mb: 2 }}>
          Contract {money(ledger.contract_total)} / Received incl. loans{' '}
          {money(ledger.total_received)} / Refunds paid {money(ledger.refunds_paid)} /{' '}
          Outstanding {money(ledger.balance_due)} / Refund due {money(ledger.refund_due)}
          . Subsidy excluded.
        </Alert>
      )}
      {ledger?.opening_refund && (
        <Paper variant="outlined" sx={{ p: 2, mb: 1 }}>
          <Chip size="small" label="Refund" color="warning" />
          <Typography>
            Imported: {money(ledger.opening_refund.amount)} /{' '}
            {dateLabel(ledger.opening_refund.refund_date)} / {ledger.opening_refund.refund_mode}
          </Typography>
        </Paper>
      )}
      {(ledger?.refunds || []).map((r) => (
        <Paper variant="outlined" key={`refund-${r.id}`} sx={{ p: 2, mb: 1 }}>
          <Chip size="small" label="Refund" color="warning" />
          <Typography>
            {money(r.amount)} paid / {dateLabel(r.refund_date)} / {r.refund_mode} /{' '}
            {r.refund_reference || 'No reference'}
          </Typography>
        </Paper>
      ))}
      <Stack
        direction="row"
        useFlexGap
        sx={{
          gap: 1.5,
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          mb: 2,
        }}
      >
        <Box>
          <Typography component="h2" variant="h6" fontWeight={700}>
            Milestone payments
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Plan instalments against a linked invoice and track collection.
          </Typography>
        </Box>
        {canEdit && invoice && (
          <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
            <Button variant="outlined" startIcon={<EditOutlined />} onClick={edit}>
              {invoice.milestones.length ? 'Edit milestones' : 'Create payment plan'}
            </Button>
            <Button
              variant="contained"
              startIcon={<PaymentsOutlined />}
              disabled={!canRecord || Number(invoice.balance_due) <= 0}
              onClick={() => setPaymentOpen(true)}
            >
              Record invoice payment
            </Button>
          </Stack>
        )}
      </Stack>
      {error && (
        <Alert severity="error" action={<Button onClick={load}>Retry</Button>} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {loading ? (
        <CircularProgress size={24} />
      ) : !invoices.length ? (
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
          <Typography fontWeight={700}>No linked invoices yet</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Create and link an invoice before planning milestone payments. An unbilled customer has
            no invoice collection balance.
          </Typography>
        </Paper>
      ) : (
        invoice && (
          <>
            <TextField
              select
              fullWidth
              size="small"
              label="Linked invoice"
              value={String(invoice.id)}
              onChange={(e) => setSelected(e.target.value)}
              sx={{ mb: 2 }}
            >
              {invoices.map((row) => (
                <MenuItem key={row.id} value={String(row.id)}>
                  {row.invoice_number} — {money(row.net_payable_amount)} net payable
                </MenuItem>
              ))}
            </TextField>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: 'repeat(2,minmax(0,1fr))',
                  lg: 'repeat(4,minmax(0,1fr))',
                },
                gap: 2,
                mb: 2,
              }}
            >
              {[
                ['Invoice amount', invoice.gross_total],
                ['Net payable', invoice.net_payable_amount],
                ['Received', invoice.amount_paid],
                ['Balance due', invoice.balance_due],
              ].map(([label, value]) => (
                <Paper key={label} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    {label}
                  </Typography>
                  <Typography fontWeight={700} sx={{ mt: 0.5 }}>
                    {money(value)}
                  </Typography>
                </Paper>
              ))}
            </Box>
            <Alert severity="info" sx={{ mb: 2 }}>
              Received amounts are allocated in the milestone order below using recorded invoice
              receipts. Milestones are a collection plan; they do not create a second payment
              ledger.
            </Alert>
            {!invoice.milestones.length ? (
              <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                <Typography fontWeight={700}>Payment plan not recorded</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Add your agreed advance, delivery, installation or handover instalments with
                  amounts and optional due dates.
                </Typography>
              </Paper>
            ) : (
              <Stack spacing={1.5}>
                {invoice.milestones.map((row, index) => (
                  <Paper key={row.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Stack
                      direction="row"
                      useFlexGap
                      sx={{ justifyContent: 'space-between', gap: 1, flexWrap: 'wrap', mb: 1.5 }}
                    >
                      <Box>
                        <Typography fontWeight={700}>
                          {index + 1}. {row.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {row.due_date
                            ? `Due ${dateLabel(row.due_date)}`
                            : 'Due date not recorded'}
                        </Typography>
                      </Box>
                      <Chip
                        size="small"
                        label={row.status}
                        color={
                          row.status === 'Paid'
                            ? 'success'
                            : row.status === 'Overdue'
                              ? 'error'
                              : row.status === 'Partially paid'
                                ? 'warning'
                                : 'default'
                        }
                      />
                    </Stack>
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3,minmax(0,1fr))',
                        gap: 1,
                      }}
                    >
                      {[
                        ['Planned', row.amount],
                        ['Received allocation', row.received_amount],
                        ['Remaining', row.balance_amount],
                      ].map(([label, amount]) => (
                        <Box key={label}>
                          <Typography variant="caption" color="text.secondary">
                            {label}
                          </Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {money(amount)}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Paper>
                ))}
              </Stack>
            )}
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Planned: {money(total)} · Net payable not yet allocated:{' '}
              {money(Math.max(0, Number(invoice.net_payable_amount) - total))}
            </Typography>
          </>
        )
      )}
      <Dialog open={editing} onClose={() => !saving && setEditing(false)} fullWidth maxWidth="md">
        <DialogTitle>
          Payment milestones
          <Typography variant="body2" color="text.secondary">
            {invoice?.invoice_number} · Net payable {money(invoice?.net_payable_amount)}
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          {saveError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {saveError}
            </Alert>
          )}
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Set the agreed collection order. This edits the plan and does not change invoice amounts
            or recorded receipts.
          </Typography>
          <Stack spacing={2}>
            {rows.map((row, index) => (
              <Paper key={index} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Stack
                  direction="row"
                  sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}
                >
                  <Typography fontWeight={700}>Milestone {index + 1}</Typography>
                  <IconButton
                    aria-label={`Remove milestone ${index + 1}`}
                    disabled={saving || rows.length === 1}
                    onClick={() => setRows(rows.filter((_, i) => i !== index))}
                  >
                    <DeleteOutline />
                  </IconButton>
                </Stack>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr 1fr' },
                    gap: 2,
                  }}
                >
                  <TextField
                    required
                    label="Milestone name"
                    placeholder="e.g. Advance / material delivery"
                    value={row.title}
                    onChange={(e) => update(index, 'title', e.target.value)}
                  />
                  <TextField
                    required
                    label="Amount (Rs)"
                    type="number"
                    value={row.amount}
                    onChange={(e) => update(index, 'amount', e.target.value)}
                    slotProps={{ htmlInput: { min: 0.01, step: 0.01 } }}
                  />
                  <TextField
                    label="Due date"
                    type="date"
                    value={row.due_date}
                    onChange={(e) => update(index, 'due_date', e.target.value)}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                </Box>
              </Paper>
            ))}
          </Stack>
          <Button
            startIcon={<AddOutlined />}
            disabled={saving || rows.length >= 20}
            onClick={() => setRows([...rows, { title: '', amount: '', due_date: '' }])}
            sx={{ mt: 2 }}
          >
            Add milestone
          </Button>
          <Typography fontWeight={700} sx={{ mt: 2 }}>
            Plan total: {money(draftTotal)}
          </Typography>
          {draftTotal > Number(invoice?.net_payable_amount) && (
            <Alert severity="error" sx={{ mt: 1 }}>
              Plan total exceeds the invoice net payable amount.
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, flexWrap: 'wrap', gap: 1 }}>
          <Button disabled={saving} onClick={() => setEditing(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={
              saving ||
              rows.some((row) => !row.title.trim() || Number(row.amount) <= 0) ||
              draftTotal > Number(invoice?.net_payable_amount)
            }
            onClick={save}
          >
            {saving ? 'Saving…' : 'Save milestones'}
          </Button>
        </DialogActions>
      </Dialog>
      {paymentOpen && invoice && (
        <RecordPaymentModal
          open
          onClose={() => setPaymentOpen(false)}
          invoice={invoice}
          onPaymentRecorded={() => {
            load();
            onChanged?.();
          }}
        />
      )}
    </Box>
  );
}
