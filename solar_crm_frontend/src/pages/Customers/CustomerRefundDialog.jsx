import { useState } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import api from '../../api/axios';
import { money } from './customerHelpers';
export default function CustomerRefundDialog({ customerId, due, onClose, onSaved }) {
  const [key] = useState(() => crypto.randomUUID());
  const [form, setForm] = useState({
    amount: '',
    refund_date: new Date().toLocaleDateString('en-CA'),
    refund_mode: 'Bank Transfer',
    refund_reference: '',
  });
  const [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const save = async () => {
    setBusy(true);
    setError('');
    try {
      await api.post(`/customers/${customerId}/refunds`, { ...form, request_key: key });
      onSaved();
    } catch (e) {
      setError(e.response?.data?.message || 'Refund was not confirmed. Retry with the same form.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog open fullWidth maxWidth="sm" onClose={() => !busy && onClose()}>
      <DialogTitle>Record refund paid</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Typography color="error" fontWeight={700}>
            Refund due {money(due)}
          </Typography>
          <Alert severity="info">
            Record money already returned to the customer. This does not transfer money or send an
            automatic message.
          </Alert>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            required
            label="Refund amount (Rs.)"
            type="number"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
          />
          <TextField
            required
            label="Refund date"
            type="date"
            value={form.refund_date}
            onChange={(e) => setForm({ ...form, refund_date: e.target.value })}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            required
            select
            label="Refund mode"
            value={form.refund_mode}
            onChange={(e) => setForm({ ...form, refund_mode: e.target.value })}
          >
            {['Bank Transfer', 'UPI', 'Cash', 'Cheque', 'Card', 'Other'].map((mode) => (
              <MenuItem key={mode} value={mode}>
                {mode}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Refund reference"
            value={form.refund_reference}
            onChange={(e) => setForm({ ...form, refund_reference: e.target.value })}
            slotProps={{ htmlInput: { maxLength: 100 } }}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button disabled={busy} onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="contained"
          disabled={
            busy || Number(form.amount) <= 0 || Number(form.amount) > due || !form.refund_date
          }
          onClick={save}
        >
          {busy ? 'Saving…' : 'Record refund'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
