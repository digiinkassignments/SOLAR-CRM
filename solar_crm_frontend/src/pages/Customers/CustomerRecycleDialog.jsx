import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import api from '../../api/axios';
import { dateLabel } from './customerHelpers';
export default function CustomerRecycleDialog({ onClose, onRestored }) {
  const [rows, setRows] = useState([]),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  const load = async () => {
    try {
      const r = await api.get('/customers/recycle-bin');
      setRows(r.data.data);
    } catch (e) {
      setError(e.response?.data?.message || 'Recycle bin could not load.');
    }
  };
  useEffect(() => {
    load();
  }, []);
  const restore = async (id) => {
    setBusy(true);
    setError('');
    try {
      await api.post(`/customers/${id}/restore`);
      await load();
      onRestored?.();
    } catch (e) {
      setError(e.response?.data?.message || 'Restore failed. Please retry.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog open fullWidth maxWidth="sm" onClose={() => !busy && onClose()}>
      <DialogTitle>Customer recycle bin</DialogTitle>
      <DialogContent dividers>
        <Alert severity="info" sx={{ mb: 2 }}>
          Restore within 30 days. Names and contact details are hidden here. After expiry, the
          background job permanently purges data and files.
        </Alert>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {!rows.length && <Typography>No customers available to restore.</Typography>}
        <Stack spacing={2}>
          {rows.map((row) => (
            <Paper variant="outlined" key={row.customer_id} sx={{ p: 2 }}>
              <Typography fontWeight={700}>Customer ID {row.customer_id}</Typography>
              <Typography variant="body2">
                Deleted {dateLabel(row.deleted_at)} · Restore before {dateLabel(row.purge_after)}
              </Typography>
              <Typography variant="caption">
                {row.counts.projects} projects · {row.counts.invoices} invoices · {row.counts.files}{' '}
                files
              </Typography>
              <Button
                fullWidth
                disabled={busy}
                onClick={() => restore(row.customer_id)}
                sx={{ mt: 1 }}
              >
                Restore customer and linked records
              </Button>
            </Paper>
          ))}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button disabled={busy} onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
