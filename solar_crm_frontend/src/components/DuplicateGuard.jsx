import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export function normalizeMobile(value) {
  let digits = String(value || '').replace(/[\s()+.\-]/g, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return digits;
}
const reasons = ['Different city / property', 'Family member', 'Incorrect old record', 'Other'];
export function recordUrl(record) {
  const prefix =
    window.location.pathname.match(/^\/(manager|sales|finance|engineer)(?=\/)/)?.[0] || '';
  return record.kind === 'lead'
    ? `${prefix}/leads?view=${record.id}`
    : `${prefix}/${record.kind === 'customer' ? 'customers' : 'projects'}/${record.id}`;
}
const Record = ({ record }) => {
  const [reopen, setReopen] = useState(false),
    [nextAction, setNextAction] = useState(''),
    [date, setDate] = useState(''),
    [time, setTime] = useState('11:00'),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      await api.post(`/sales-workflow/leads/${record.id}/action`, {
        status_after_followup: 'New Lead',
        note: 'Lead reopened after a repeat enquiry.',
        call_outcome: 'Note only',
        followup_type: 'Call',
        next_action: nextAction,
        next_follow_up_date: date,
        next_follow_up_time: time,
      });
      setReopen(false);
      window.open(recordUrl(record), '_blank', 'noopener,noreferrer');
    } catch (e) {
      setError(e.response?.data?.message || 'Could not reopen lead.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <Box sx={{ border: '1px solid #E2E8F0', p: 1.5, borderRadius: 2, minWidth: 0 }}>
        <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap">
          <Typography fontWeight={700}>{record.name}</Typography>
          <Chip size="small" label={record.kind} />
          <Chip size="small" label={record.status} />
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ my: 1, overflowWrap: 'anywhere' }}>
          {record.phone} · {record.city || 'City not recorded'} · Owner: {record.owner} ·{' '}
          {record.created_at ? new Date(record.created_at).toLocaleDateString('en-IN') : ''} ·{' '}
          {record.contact_count} follow-ups
        </Typography>
        {['Lost', 'Not Interested'].includes(record.status) && (
          <Typography variant="body2">
            Previously {record.status}. Open the lead to reopen it and schedule the next action.
          </Typography>
        )}
        {record.can_open ? (
          <Button
            size="small"
            component="a"
            href={recordUrl(record)}
            target="_blank"
            rel="noopener noreferrer"
            variant="outlined"
          >
            {record.kind === 'customer'
              ? 'Open customer'
              : record.kind === 'project'
                ? 'Open project'
                : record.can_reopen
                  ? 'Open / reopen existing lead'
                  : 'Open existing lead'}
          </Button>
        ) : (
          <Typography variant="caption">
            Another team owns this record. Contact the owner for access.
          </Typography>
        )}
        {record.can_reopen && (
          <Button size="small" onClick={() => setReopen(true)} sx={{ ml: 1 }}>
            Reopen existing lead
          </Button>
        )}
      </Box>
      <Dialog open={reopen} onClose={() => !busy && setReopen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Reopen existing lead</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2">
            Schedule the next action for {record.name}. This updates the existing lead.
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
          <TextField
            fullWidth
            required
            label="Next action"
            value={nextAction}
            onChange={(e) => setNextAction(e.target.value)}
            sx={{ mt: 3 }}
            inputProps={{ maxLength: 255 }}
          />
          <Stack direction="row" gap={2} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              type="date"
              label="Follow-up date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              type="time"
              label="Exact time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button disabled={busy} onClick={() => setReopen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={busy || !nextAction.trim() || !date || !time}
            onClick={submit}
          >
            Reopen lead
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

const DuplicateGuard = forwardRef(function DuplicateGuard(
  { data, type = 'lead', id, enabled = true, checkPhones = true },
  ref
) {
  const { user } = useAuth();
  const [similar, setSimilar] = useState({ data: [], total: 0 });
  const [matches, setMatches] = useState(null);
  const [reason, setReason] = useState('');
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');
  const pending = useRef(null),
    accepted = useRef(null),
    sequence = useRef(0);
  const signature = `${data.mobile_number || ''}:${data.alternate_number || ''}:${id || ''}`;
  const currentSignature = useRef(signature);
  currentSignature.current = signature;
  const params = { exclude_type: type, ...(id ? { exclude_id: id } : {}) };
  useEffect(() => {
    const version = ++sequence.current;
    if (!enabled || String(data.customer_name || '').trim().length < 3) {
      setSimilar({ data: [], total: 0 });
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const result = await api.get('/duplicates/check', {
          params: { ...params, name: data.customer_name },
        });
        if (version === sequence.current) setSimilar(result.data);
      } catch {
        if (version === sequence.current) setSimilar({ data: [], total: 0 });
      }
    }, 300);
    return () => {
      clearTimeout(timer);
      sequence.current++;
    };
  }, [data.customer_name, enabled, id, type]);
  useEffect(() => {
    accepted.current = null;
    pending.current?.(null);
    pending.current = null;
    setReason('');
    setRemarks('');
    setMatches(null);
  }, [signature]);
  useEffect(
    () => () => {
      pending.current?.(null);
    },
    []
  );
  const finish = (value) => {
    setMatches(null);
    pending.current?.(value);
    pending.current = null;
  };
  const check = async (wait = false) => {
    if (!enabled || !checkPhones) return {};
    const phone = normalizeMobile(data.mobile_number),
      alternate = normalizeMobile(data.alternate_number);
    if (!/^[6-9]\d{9}$/.test(phone) || (alternate && !/^[6-9]\d{9}$/.test(alternate))) {
      if (wait) setError('Enter a valid Indian mobile number, starting with 6–9.');
      return null;
    }
    if (accepted.current?.signature === signature) return accepted.current.value;
    try {
      const result = await api.get('/duplicates/check', {
        params: { ...params, phone, alternate },
      });
      if (currentSignature.current !== signature) return null;
      if (!result.data.total) return {};
      setError('');
      setMatches(result.data);
      return wait
        ? new Promise((resolve) => {
            pending.current = resolve;
          })
        : null;
    } catch (e) {
      setError(e.response?.data?.message || 'Could not check duplicates. Please retry.');
      return null;
    }
  };
  useImperativeHandle(ref, () => ({
    confirm: () => check(true),
    checkPhone: () => check(false),
    conflict: (result) => {
      accepted.current = null;
      setMatches(result);
    },
  }));
  const allow = () => {
    const value = {
      duplicate_override: true,
      duplicate_reason: reason,
      duplicate_remarks: remarks,
    };
    accepted.current = { signature, value };
    finish(value);
  };
  return (
    <>
      {error && <Alert severity="error">{error}</Alert>}
      {similar.total > 0 && (
        <Box sx={{ p: 2, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 2, my: 1 }}>
          <Typography fontWeight={700} variant="body2">
            {similar.total} similar name{similar.total === 1 ? '' : 's'} found
          </Typography>
          <Typography variant="caption" color="text.secondary">
            A similar name does not prevent adding a new record. Existing records open in a new tab.
          </Typography>
          <Stack gap={1} sx={{ mt: 1 }}>
            {similar.data.map((r) => (
              <Record key={`${r.kind}:${r.id}`} record={r} />
            ))}
          </Stack>
        </Box>
      )}
      <Dialog open={Boolean(matches)} onClose={() => finish(null)} fullWidth maxWidth="sm">
        <DialogTitle>This number already exists</DialogTitle>
        <DialogContent dividers>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Open the existing record first. Create a separate enquiry only when it is needed.
          </Alert>
          <Stack gap={1}>
            {matches?.data?.map((r) => (
              <Record key={`${r.kind}:${r.id}`} record={r} />
            ))}
          </Stack>
          <TextField
            select
            fullWidth
            label={`Reason${Number(user?.role_id) === 1 ? ' (optional)' : ' *'}`}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            sx={{ mt: 3 }}
          >
            {reasons.map((r) => (
              <MenuItem key={r} value={r}>
                {r}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            multiline
            minRows={2}
            label={reason === 'Other' ? 'Remarks *' : 'Remarks (optional)'}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            inputProps={{ maxLength: 1000 }}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, flexWrap: 'wrap', gap: 1 }}>
          <Button onClick={() => finish(null)}>Cancel</Button>
          <Button
            onClick={allow}
            disabled={
              (Number(user?.role_id) !== 1 && !reason) || (reason === 'Other' && !remarks.trim())
            }
          >
            Add as new anyway
          </Button>
          {matches?.data?.find((r) => r.can_open) && (
            <Button
              variant="contained"
              component="a"
              href={recordUrl(matches.data.find((r) => r.can_open))}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => finish(null)}
            >
              Open existing
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
});
export default DuplicateGuard;
