import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import api from '../../api/axios';

export async function downloadCustomerExport(id, format) {
  const response = await api.get(`/customers/${id}/export`, {
    params: { format },
    responseType: 'blob',
  });
  const url = URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = url;
  link.download = `customer-${id}-export.${format}`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function CustomerDeleteDialog({ customer, onClose, onDeleted }) {
  const [preview, setPreview] = useState(null);
  const [name, setName] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const load = async () => {
    setError('');
    setPreview(null);
    try {
      const r = await api.get(`/customers/${customer.id}/delete-preview`);
      setPreview(r.data.data);
    } catch (e) {
      setError(e.response?.data?.message || 'Deletion preview could not load.');
    }
  };
  useEffect(() => {
    load();
  }, [customer.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const remove = async () => {
    setBusy(true);
    setError('');
    try {
      await api.delete(`/customers/${customer.id}`, {
        data: { confirm_name: name, reason, preview_token: preview.preview_token },
      });
      onDeleted();
    } catch (e) {
      setError(
        e.response?.data?.message ||
          'Deletion was not confirmed. Refresh the preview before retrying.'
      );
      if (e.response?.status === 409) setPreview(null);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog open onClose={() => !busy && onClose()} fullWidth maxWidth="sm">
      <DialogTitle>Delete customer</DialogTitle>
      <DialogContent dividers>
        <Alert severity="warning" sx={{ mb: 2 }}>
          The customer and linked records will leave all active workspaces. Restore is available for
          30 days. After that, records and uploaded files are permanently purged.
        </Alert>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {!preview ? (
          <Button disabled={busy} onClick={load}>
            Load / refresh preview
          </Button>
        ) : (
          <>
            <Typography fontWeight={700} sx={{ mb: 1 }}>
              {preview.customer_name}
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 2 }}>
              {Object.entries(preview.counts)
                .filter(([k]) => k !== 'other_records')
                .map(([label, value]) => (
                  <Box key={label} sx={{ p: 1, bgcolor: '#F8FAFC', borderRadius: 1 }}>
                    <Typography variant="caption" sx={{ textTransform: 'capitalize' }}>
                      {label.replaceAll('_', ' ')}
                    </Typography>
                    <Typography fontWeight={700}>{value}</Typography>
                  </Box>
                ))}
            </Box>
            {preview.financial_warning && (
              <Alert severity="error" sx={{ mb: 2 }}>
                Financial records deleted honge. Export your records before continuing.
              </Alert>
            )}
            <Stack direction="row" useFlexGap sx={{ gap: 1, flexWrap: 'wrap', mb: 2 }}>
              {['csv', 'zip'].map((format) => (
                <Button
                  key={format}
                  variant="outlined"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    try {
                      await downloadCustomerExport(customer.id, format);
                    } catch {
                      setError('Export failed. Retry before deleting.');
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  Export {format.toUpperCase()}
                </Button>
              ))}
            </Stack>
            <Alert severity="info" sx={{ mb: 2 }}>
              Stock quantities will stay unchanged. Existing stock transactions remain without
              customer links or personal details.
            </Alert>
            <TextField
              fullWidth
              required
              label={`Type customer name exactly: ${preview.customer_name}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              required
              multiline
              minRows={2}
              label="Reason for deletion"
              helperText="Do not include personal information. The reason is removed at permanent purge."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              slotProps={{ htmlInput: { maxLength: 1000 } }}
            />
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button disabled={busy} onClick={onClose}>
          Cancel
        </Button>
        <Button
          color="error"
          variant="contained"
          disabled={busy || !preview || name !== preview.customer_name || !reason.trim()}
          onClick={remove}
        >
          {busy ? 'Processing…' : 'Move to recycle bin'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
