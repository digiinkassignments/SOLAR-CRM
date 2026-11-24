import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Pagination,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  Typography,
} from '@mui/material';
import {
  Refresh,
  PersonAddOutlined,
  UploadFileOutlined,
  CallOutlined,
  WhatsApp,
  ContentCopyOutlined,
  AccountBalanceWalletOutlined,
  KeyboardReturnOutlined,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { portalRole, workspacePrefix } from '../../utils/portalRoles';
import CustomerWorkspace from './CustomerWorkspace';
import AddCustomerModal from './AddCustomerModal';
import ImportCustomersDialog from './ImportCustomersDialog';
import CustomerRecycleDialog from './CustomerRecycleDialog';
import CustomerCollectionsDrawer, { CollectionActionDialog } from './CustomerCollectionsDrawer';
import { currency } from './customerMoney';

const balances = [
  ['', 'All balances'],
  ['outstanding', 'Outstanding to receive'],
  ['refund', 'Refund due'],
  ['settled', 'Settled'],
];
const dueOptions = [
  ['', 'Any due date'],
  ['overdue', 'Overdue (excluding fully loan-awaited)'],
  ['today', 'Due today'],
  ['7', 'Due in 7 days'],
  ['15', 'Due within 15 days'],
  ['30', 'Due within 30 days'],
  ['custom', 'Custom date range'],
  ['none', 'No due date set'],
];
const defaultData = {
  rows: [],
  totals: {},
  cards: {},
  pages: 1,
  options: { owners: [], sources: [], stages: [] },
};
const labelFor = (key, value) =>
  ({
    search: `Search: ${value}`,
    requirement: value,
    balance: balances.find(([v]) => v === value)?.[1],
    due: dueOptions.find(([v]) => v === value)?.[1],
    age: `Overdue: ${value} days`,
    min: `Min: ${currency(Number(value))}`,
    max: `Max: ${currency(Number(value))}`,
    from: `From ${value}`,
    to: `To ${value}`,
    followup: value,
    loan: `Loan: ${value}`,
    owner: `Owner #${value}`,
    source: `Source: ${value}`,
    stage: value,
  })[key];
const download = (blob) => {
  const url = URL.createObjectURL(blob),
    a = document.createElement('a');
  a.href = url;
  a.download = 'customer-collections.csv';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
const whatsapp = (c) =>
  `https://wa.me/${String(c.mobile_number || '')
    .replace(/\D/g, '')
    .replace(
      /^(\d{10})$/,
      '91$1'
    )}?text=${encodeURIComponent(`Hello ${c.customer_name}, ${c.ledger.refund_due ? `your refund of ${currency(c.ledger.refund_due)} is pending. We will update you on its payment.` : `this is a reminder for your outstanding payment of ${currency(c.ledger.balance_due)}. Please share your payment update.`}`)}`;

export default function CustomersList() {
  const { user } = useAuth(),
    navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const query = params.toString(),
    filters = Object.fromEntries(params);
  const [data, setData] = useState(defaultData),
    [loading, setLoading] = useState(true),
    [error, setError] = useState('');
  const [search, setSearch] = useState(params.get('search') || ''),
    [selected, setSelected] = useState([]);
  const [view, setView] = useState('table');
  const [add, setAdd] = useState(false),
    [importing, setImporting] = useState(false),
    [recycle, setRecycle] = useState(false);
  const [drawer, setDrawer] = useState(null),
    [action, setAction] = useState(null),
    [bulkOwner, setBulkOwner] = useState(''),
    [reminders, setReminders] = useState(null),
    [busy, setBusy] = useState(false);
  const sequence = useRef(0);
  const role = Number(user?.role_id),
    canRecord = role === 1 || portalRole(user) === 'finance';
  const canEdit = [1, 2].includes(role) || portalRole(user) === 'finance';
  const setFilter = (key, value) =>
    setParams((old) => {
      const next = new URLSearchParams(old);
      value ? next.set(key, value) : next.delete(key);
      next.delete('page');
      return next;
    });
  useEffect(() => {
    setSearch(params.get('search') || '');
  }, [query]);
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== (params.get('search') || '')) setFilter('search', search.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [search, query]);
  const load = useCallback(async () => {
    const seq = ++sequence.current;
    setLoading(true);
    setError('');
    try {
      const r = await api.get('/customers/directory', {
        params: Object.fromEntries(new URLSearchParams(query)),
      });
      if (seq === sequence.current) setData(r.data.data);
    } catch (e) {
      if (seq === sequence.current)
        setError(e.response?.data?.message || 'Customer directory could not load.');
    } finally {
      if (seq === sequence.current) setLoading(false);
    }
  }, [query]);
  useEffect(() => {
    setSelected([]);
    load();
    return () => {
      sequence.current++;
    };
  }, [load]);
  const select = (key, label, options) => (
    <TextField
      select
      fullWidth
      size="small"
      label={label}
      value={filters[key] || ''}
      slotProps={{ inputLabel: { shrink: true }, select: { displayEmpty: true } }}
      onChange={(e) => setFilter(key, e.target.value)}
    >
      {options.map(([value, text]) => (
        <MenuItem key={value} value={value}>
          {text}
        </MenuItem>
      ))}
    </TextField>
  );
  const sort = (key) =>
    setParams((old) => {
      const next = new URLSearchParams(old);
      next.set('sort', key);
      next.set(
        'direction',
        old.get('sort') === key && old.get('direction') === 'desc' ? 'asc' : 'desc'
      );
      next.delete('page');
      return next;
    });
  const active = Object.entries(filters).filter(
    ([k, v]) => v && !['page', 'sort', 'direction'].includes(k)
  );
  const changed = () => {
    setAction(null);
    load();
  };
  const exportRows = async () => {
    setBusy(true);
    try {
      const r = selected.length
        ? await api.post(
            '/customers/directory/bulk',
            { ids: selected, action: 'export' },
            { responseType: 'blob' }
          )
        : await api.get('/customers/directory', {
            params: { ...filters, export: 'csv' },
            responseType: 'blob',
          });
      download(r.data);
    } catch {
      toast.error('Export failed. Please retry.');
    } finally {
      setBusy(false);
    }
  };
  const bulk = async (actionName) => {
    setBusy(true);
    try {
      const r = await api.post('/customers/directory/bulk', {
        ids: selected,
        action: actionName,
        owner_id: bulkOwner,
      });
      if (actionName === 'reminder') setReminders(r.data.data);
      else {
        toast.success('Collection owners updated');
        load();
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not complete the action.');
    } finally {
      setBusy(false);
    }
  };
  const card = (key, title, count, amount, colour, Icon) => (
    <Paper
      component="button"
      type="button"
      onClick={() => setFilter('balance', filters.balance === key ? '' : key)}
      aria-pressed={filters.balance === key}
      variant="outlined"
      sx={{
        p: 2.5,
        textAlign: 'left',
        cursor: 'pointer',
        color: 'inherit',
        bgcolor: filters.balance === key ? '#f1f5f9' : '#fff',
        borderRadius: 3,
        borderColor: filters.balance === key ? colour : '#e2e8f0',
        minWidth: 0,
        '&:hover': { borderColor: colour },
        '&:focus-visible': { outline: `3px solid ${colour}` },
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography color="text.secondary" fontWeight={600}>
          {title}
        </Typography>
        <Icon sx={{ color: colour }} />
      </Stack>
      <Typography variant="h4" fontWeight={700} sx={{ mt: 1, color: colour }}>
        {loading ? '—' : currency(amount || 0)}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        {count || 0} customers · Click to filter
      </Typography>
    </Paper>
  );
  return (
    <CustomerWorkspace>
      <Box sx={{ pb: 4 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
          spacing={2}
          sx={{ mb: 3 }}
        >
          <Box>
            <Typography variant="overline" color="text.secondary">
              CUSTOMERS & COLLECTIONS
            </Typography>
            <Typography variant="h4" component="h1" fontWeight={700}>
              Customer directory
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              Manage customer records, collect pending payments and follow up on refunds.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Button variant="outlined" startIcon={<Refresh />} disabled={loading} onClick={load}>
              Refresh
            </Button>
            {[1, 2].includes(role) && (
              <Button variant="outlined" onClick={() => setRecycle(true)}>
                Recycle bin
              </Button>
            )}
            {canEdit && (
              <>
                <Button
                  variant="outlined"
                  startIcon={<UploadFileOutlined />}
                  onClick={() => setImporting(true)}
                >
                  Bulk upload
                </Button>
                <Button
                  variant="contained"
                  startIcon={<PersonAddOutlined />}
                  onClick={() => setAdd(true)}
                >
                  Add customer
                </Button>
              </>
            )}
          </Stack>
        </Stack>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2,minmax(0,1fr))' },
            gap: 2,
            mb: 3,
          }}
        >
          {card(
            'outstanding',
            'Outstanding to receive',
            data.cards.outstanding_customers,
            data.cards.outstanding,
            '#b45309',
            AccountBalanceWalletOutlined
          )}
          {card(
            'refund',
            'Refund due · payable to customers',
            data.cards.refund_customers,
            data.cards.refund_due,
            '#7e22ce',
            KeyboardReturnOutlined
          )}
        </Box>
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, mb: 2 }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2,minmax(0,1fr))',
                lg: 'repeat(4,minmax(0,1fr))',
              },
              gap: 2,
            }}
          >
            <TextField
              fullWidth
              size="small"
              label="Search customers"
              placeholder="Name, code, phone, email or city"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {select('requirement', 'Customer type', [
              ['', 'All types'],
              ...['Residential', 'Commercial', 'Industrial'].map((v) => [v, v]),
            ])}
            {select('balance', 'Balance type', balances)}
            {select('due', 'Payment due', dueOptions)}
            {select('age', 'Overdue age', [
              ['', 'Any overdue age'],
              ...['1-15', '16-30', '31-60', '60+'].map((v) => [v, `${v} days`]),
            ])}
            {select('followup', 'Follow-up status', [
              ['', 'Any follow-up status'],
              ...['Not contacted', 'Contacted', 'Promised to pay', 'Promise broken'].map((v) => [
                v,
                v,
              ]),
            ])}
            {select('loan', 'Loan status', [
              ['', 'Any loan status'],
              ['awaited', 'Loan awaiting disbursement'],
              ['disbursed', 'Loan disbursed'],
              ['none', 'No loan'],
            ])}
            {select('owner', 'Collection owner', [
              ['', 'Any owner'],
              ...data.options.owners.map((o) => [String(o.id), o.full_name]),
            ])}
            {select('stage', 'Project stage', [
              ['', 'Any stage'],
              ...data.options.stages.map((s) => [s, s]),
            ])}
            {select('source', 'Lead source', [
              ['', 'All sources'],
              ...data.options.sources.map((s) => [s, s]),
            ])}
            {['min', 'max'].map((k) => (
              <TextField
                fullWidth
                key={k}
                size="small"
                label={`${k === 'min' ? 'Minimum' : 'Maximum'} balance (₹)`}
                value={filters[k] || ''}
                onChange={(e) => {
                  if (/^\d*(\.\d{0,2})?$/.test(e.target.value)) setFilter(k, e.target.value);
                }}
                slotProps={{ htmlInput: { inputMode: 'decimal' } }}
              />
            ))}
            {filters.due === 'custom' &&
              ['from', 'to'].map((k) => (
                <TextField
                  fullWidth
                  key={k}
                  size="small"
                  label={k === 'from' ? 'Due from' : 'Due until'}
                  type="date"
                  value={filters[k] || ''}
                  onChange={(e) => setFilter(k, e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              ))}
          </Box>
          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
            {active.map(([key, value]) => (
              <Chip
                key={key}
                label={
                  key === 'owner'
                    ? `Owner: ${data.options.owners.find((o) => String(o.id) === value)?.full_name || value}`
                    : labelFor(key, value)
                }
                onDelete={() => setFilter(key, '')}
              />
            ))}
            {active.length > 0 && (
              <Button
                size="small"
                onClick={() => {
                  setParams({});
                  setSearch('');
                }}
              >
                Clear all
              </Button>
            )}
            <Button
              size="small"
              startIcon={<ContentCopyOutlined />}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(window.location.href);
                  toast.success('Filtered view link copied');
                } catch {
                  toast.error('Could not copy link');
                }
              }}
            >
              Share view
            </Button>
            {canRecord && (
              <Button size="small" onClick={() => setAction({ type: 'settings' })}>
                Refund alert: {data.refund_alert_days || 7} days
              </Button>
            )}
          </Stack>
        </Paper>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          spacing={1}
          sx={{ mb: 2 }}
        >
          <Typography role="status" fontWeight={600}>
            {loading
              ? 'Loading customers…'
              : `${data.totals.customers || 0} customers · ${currency(data.totals.outstanding || 0)} outstanding · ${currency(data.totals.refund_due || 0)} refund due`}
          </Typography>
          <Button variant="outlined" disabled={busy || loading} onClick={exportRows}>
            {selected.length ? `Export ${selected.length} selected` : 'Export filtered CSV'}
          </Button>
        </Stack>
        {selected.length > 0 && (
          <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography fontWeight={700}>{selected.length} selected</Typography>
              <Button disabled={busy} onClick={() => bulk('reminder')}>
                Prepare WhatsApp reminders
              </Button>
              {role !== 3 && (
                <>
                  <TextField
                    size="small"
                    select
                    label="Assign owner"
                    value={bulkOwner}
                    onChange={(e) => setBulkOwner(e.target.value)}
                    sx={{ minWidth: 180 }}
                  >
                    {data.options.owners.map((o) => (
                      <MenuItem key={o.id} value={o.id}>
                        {o.full_name}
                      </MenuItem>
                    ))}
                  </TextField>
                  <Button disabled={busy || !bulkOwner} onClick={() => bulk('assign')}>
                    Assign
                  </Button>
                </>
              )}
              <Button onClick={() => setSelected([])}>Clear selection</Button>
            </Stack>
          </Paper>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} action={<Button onClick={load}>Retry</Button>}>
            {error}
          </Alert>
        )}
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <Button
            variant={view === 'table' ? 'contained' : 'outlined'}
            onClick={() => setView('table')}
          >
            Table view
          </Button>
          <Button
            variant={view === 'cards' ? 'contained' : 'outlined'}
            onClick={() => setView('cards')}
          >
            Card view
          </Button>
        </Stack>
        {view === 'cards' && (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: 'repeat(2,minmax(0,1fr))' },
              gap: 2,
            }}
          >
            {data.rows.map((c) => (
              <Paper key={c.id} variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
                <Button
                  sx={{ p: 0, fontWeight: 700 }}
                  onClick={() => navigate(`${workspacePrefix(user)}/customers/${c.id}`)}
                >
                  {c.customer_name}
                </Button>
                <Typography variant="body2" color="text.secondary">
                  {c.customer_code} · {c.mobile_number}
                </Typography>
                <Stack direction="row" spacing={1} sx={{ my: 2 }}>
                  <Chip color="warning" label={`Outstanding ${currency(c.ledger.balance_due)}`} />
                  <Chip color="secondary" label={`Refund due ${currency(c.ledger.refund_due)}`} />
                </Stack>
                <Typography variant="body2">
                  Next due:{' '}
                  {c.ledger.next_due_date || (c.ledger.balance_due ? 'No due date set' : '—')} ·{' '}
                  {c.followup_status}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Owner: {c.collection_owner_name}
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                  <Button variant="outlined" onClick={() => setDrawer(c)}>
                    Breakdown
                  </Button>
                  <Button onClick={() => setAction({ type: 'note', customer: c })}>Add note</Button>
                  <Button onClick={() => setAction({ type: 'promise', customer: c })}>
                    Promise date
                  </Button>
                  <Button component="a" href={`tel:${c.mobile_number}`}>
                    Call
                  </Button>
                  <Button
                    component="a"
                    href={whatsapp(c)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    WhatsApp
                  </Button>
                </Stack>
              </Paper>
            ))}
          </Box>
        )}
        <Paper
          variant="outlined"
          sx={{ borderRadius: 3, overflow: 'hidden', display: view === 'table' ? 'block' : 'none' }}
        >
          <TableContainer>
            <Table
              sx={{
                minWidth: 1500,
                '& th:first-of-type, & td:first-of-type': {
                  position: 'sticky',
                  left: 0,
                  bgcolor: 'background.paper',
                  zIndex: 2,
                },
                '& th:nth-of-type(2), & td:nth-of-type(2)': {
                  position: 'sticky',
                  left: 48,
                  bgcolor: 'background.paper',
                  zIndex: 2,
                  boxShadow: '2px 0 3px #e2e8f0',
                },
                '& th:nth-of-type(-n+2)': { bgcolor: '#0f172a' },
              }}
              aria-label="Customer collections"
            >
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      inputProps={{ 'aria-label': 'Select current page' }}
                      checked={
                        data.rows.length > 0 && data.rows.every((r) => selected.includes(r.id))
                      }
                      indeterminate={
                        data.rows.some((r) => selected.includes(r.id)) &&
                        !data.rows.every((r) => selected.includes(r.id))
                      }
                      onChange={(e) =>
                        setSelected(
                          e.target.checked
                            ? [...new Set([...selected, ...data.rows.map((r) => r.id)])]
                            : selected.filter((id) => !data.rows.some((r) => r.id === id))
                        )
                      }
                    />
                  </TableCell>
                  {[
                    ['name', 'Customer'],
                    ['outstanding', 'Outstanding to receive'],
                    ['refund', 'Refund due'],
                    ['due', 'Next due date'],
                    ['overdue', 'Days overdue'],
                    ['followup', 'Last follow-up'],
                    ['promised', 'Promised date'],
                  ].map(([key, label]) => (
                    <TableCell key={key}>
                      <TableSortLabel
                        active={filters.sort === key}
                        direction={filters.direction === 'asc' ? 'asc' : 'desc'}
                        onClick={() => sort(key)}
                      >
                        {label}
                      </TableSortLabel>
                    </TableCell>
                  ))}
                  <TableCell>Owner / status</TableCell>
                  <TableCell>Follow-up actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center">
                      <CircularProgress size={24} sx={{ my: 4 }} />
                    </TableCell>
                  </TableRow>
                ) : data.rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ py: 6 }}>
                      No customers match these filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.rows.map((c) => (
                    <TableRow hover key={c.id} sx={{ '& td': { verticalAlign: 'top', py: 2 } }}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selected.includes(c.id)}
                          inputProps={{ 'aria-label': `Select ${c.customer_name}` }}
                          onChange={(e) =>
                            setSelected(
                              e.target.checked
                                ? [...selected, c.id]
                                : selected.filter((id) => id !== c.id)
                            )
                          }
                        />
                      </TableCell>
                      <TableCell sx={{ minWidth: 210 }}>
                        <Button
                          sx={{
                            p: 0,
                            textAlign: 'left',
                            justifyContent: 'flex-start',
                            fontWeight: 700,
                          }}
                          onClick={() => navigate(`${workspacePrefix(user)}/customers/${c.id}`)}
                        >
                          {c.customer_name}
                        </Button>
                        <Typography variant="caption" display="block" color="text.secondary">
                          {c.customer_code}
                        </Typography>
                        <Typography variant="body2">{c.mobile_number}</Typography>
                        <Chip
                          size="small"
                          label={c.solar_requirement || 'Residential'}
                          sx={{ mt: 1 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          onClick={() => setDrawer(c)}
                          sx={{
                            p: 0,
                            color: c.ledger.days_overdue ? 'error.main' : '#b45309',
                            fontWeight: 700,
                          }}
                        >
                          {c.ledger.has_financial_record
                            ? c.ledger.balance_due
                              ? currency(c.ledger.balance_due)
                              : '—'
                            : 'No invoice'}
                        </Button>
                        {!c.ledger.invoice_count && c.ledger.has_financial_record && (
                          <Typography variant="caption" display="block">
                            Opening record · No tax invoice
                          </Typography>
                        )}
                        {c.ledger.loan_awaited > 0 && (
                          <Typography variant="caption" display="block" color="info.main">
                            Loan awaited {currency(c.ledger.loan_awaited)}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          onClick={() => setDrawer(c)}
                          sx={{ p: 0, color: '#7e22ce', fontWeight: 700 }}
                        >
                          {c.ledger.has_financial_record
                            ? c.ledger.refund_due
                              ? currency(c.ledger.refund_due)
                              : '—'
                            : 'No invoice'}
                        </Button>
                      </TableCell>
                      <TableCell>
                        {c.ledger.next_due_date || (c.ledger.balance_due ? 'No due date set' : '—')}
                        {c.ledger.no_due_date && c.ledger.next_due_date && (
                          <Typography variant="caption" display="block">
                            Some amounts have no due date
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell
                        sx={{
                          color: c.ledger.days_overdue ? 'error.main' : 'inherit',
                          fontWeight: 600,
                        }}
                      >
                        {c.ledger.days_overdue || '—'}
                      </TableCell>
                      <TableCell sx={{ minWidth: 190, maxWidth: 250 }}>
                        <Typography variant="body2">
                          {c.last_followup_at
                            ? new Date(c.last_followup_at).toLocaleDateString('en-IN')
                            : '—'}
                        </Typography>
                        <Typography variant="caption" sx={{ overflowWrap: 'anywhere' }}>
                          {c.last_note}
                        </Typography>
                      </TableCell>
                      <TableCell>{c.promised_date || '—'}</TableCell>
                      <TableCell>
                        <Typography variant="body2">{c.collection_owner_name}</Typography>
                        <Chip
                          size="small"
                          sx={{ mt: 1 }}
                          color={c.followup_status === 'Promise broken' ? 'error' : 'default'}
                          label={c.followup_status}
                        />
                      </TableCell>
                      <TableCell sx={{ minWidth: 235 }}>
                        <Stack direction="row" spacing={0.5}>
                          <IconButton
                            component="a"
                            href={`tel:${c.mobile_number}`}
                            aria-label={`Call ${c.customer_name}`}
                          >
                            <CallOutlined fontSize="small" />
                          </IconButton>
                          <IconButton
                            component="a"
                            href={whatsapp(c)}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`WhatsApp ${c.customer_name}`}
                            sx={{ color: '#15803d' }}
                          >
                            <WhatsApp fontSize="small" />
                          </IconButton>
                          <Button size="small" onClick={() => setDrawer(c)}>
                            Breakdown
                          </Button>
                        </Stack>
                        <Stack direction="row" spacing={0.5}>
                          <Button
                            size="small"
                            onClick={() => setAction({ type: 'note', customer: c })}
                          >
                            Add note
                          </Button>
                          <Button
                            size="small"
                            onClick={() => setAction({ type: 'promise', customer: c })}
                          >
                            Promise date
                          </Button>
                          <Button
                            size="small"
                            onClick={() => setAction({ type: 'done', customer: c })}
                          >
                            Done
                          </Button>
                        </Stack>
                        {canRecord && (c.ledger.balance_due > 0 || c.ledger.refund_due > 0) && (
                          <Button size="small" variant="outlined" onClick={() => setDrawer(c)}>
                            Record payment / refund
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            20 customers per page · Subsidy excluded from collections
          </Typography>
          <Pagination
            count={data.pages || 1}
            page={Math.min(Number(filters.page) || 1, data.pages || 1)}
            onChange={(_, p) =>
              setParams((old) => {
                const n = new URLSearchParams(old);
                n.set('page', p);
                return n;
              })
            }
          />
        </Stack>
        {add && <AddCustomerModal open onClose={() => setAdd(false)} onCustomerCreated={load} />}
        {importing && (
          <ImportCustomersDialog
            open
            onClose={() => setImporting(false)}
            onImported={load}
            manager={role === 2}
          />
        )}
        {recycle && <CustomerRecycleDialog onClose={() => setRecycle(false)} onRestored={load} />}
        {drawer && (
          <CustomerCollectionsDrawer
            customer={drawer}
            today={data.today}
            canRecord={canRecord}
            canPlan={canEdit}
            onClose={() => setDrawer(null)}
            onChanged={load}
          />
        )}
        {action && (
          <CollectionActionDialog
            key={`${action.type}-${action.customer?.id || ''}`}
            action={action.type}
            customer={action.customer}
            owners={data.options.owners}
            today={data.today}
            onClose={() => setAction(null)}
            onSaved={changed}
          />
        )}
        {reminders && (
          <Dialog open fullWidth maxWidth="sm" onClose={() => setReminders(null)}>
            <DialogTitle>WhatsApp reminders</DialogTitle>
            <DialogContent>
              <Alert severity="info" sx={{ mb: 2 }}>
                Review and send each prefilled message in WhatsApp. Messages are not sent
                automatically.
              </Alert>
              <Stack spacing={1}>
                {reminders.map((r) => (
                  <Button
                    key={r.id}
                    component="a"
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="outlined"
                  >
                    Open reminder · {r.customer_name}
                  </Button>
                ))}
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setReminders(null)}>Close</Button>
            </DialogActions>
          </Dialog>
        )}
      </Box>
    </CustomerWorkspace>
  );
}
