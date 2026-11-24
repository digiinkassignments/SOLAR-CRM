import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  LinearProgress,
  Paper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import {
  AccountBalanceOutlined,
  ArrowForwardOutlined,
  CalculateOutlined,
  DescriptionOutlined,
  Inventory2Outlined,
  PeopleAltOutlined,
  PaymentsOutlined,
  ReceiptLongOutlined,
  RefreshOutlined,
} from '@mui/icons-material';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import useWorkspaceNavigate from '../../hooks/useWorkspaceNavigate';
import { portalRole } from '../../utils/portalRoles';
const currency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
const count = (value) => Number(value || 0).toLocaleString('en-IN');
const human = (value) =>
  String(value || 'Not recorded')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
const card = { borderRadius: 3, boxShadow: 'none', borderColor: '#E2E8F0' };
export default function PortalDashboard() {
  const { user } = useAuth(),
    navigate = useWorkspaceNavigate(),
    finance = portalRole(user) === 'finance';
  const [data, setData] = useState(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const r = await api.get('/portals/dashboard');
      setData(r.data.data);
    } catch (e) {
      setError(e.response?.data?.message || 'Dashboard could not load.');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  const m = data?.metrics || {},
    stages = data?.breakdown || [],
    total = stages.reduce((sum, s) => sum + Number(s.count || 0), 0);
  const metrics = finance
    ? [
        [
          'Contract total',
          currency(m.invoiced),
          'Invoices and opening contracts; subsidy excluded',
          ReceiptLongOutlined,
          '#0284C7',
          '/invoices',
        ],
        [
          'Payments received',
          currency(m.paid),
          'Includes actual loan disbursements',
          PaymentsOutlined,
          '#059669',
          '/invoices',
        ],
        [
          'Refunds paid',
          currency(m.refunds_paid),
          'Recorded outgoing customer refunds',
          PaymentsOutlined,
          '#DC2626',
          '/customers',
        ],
        [
          Number(m.due) < 0 ? 'Refund due' : 'Balance',
          currency(Math.abs(Number(m.due) || 0)),
          'Contract minus received plus refunds',
          ReceiptLongOutlined,
          '#DC2626',
          '/invoices',
        ],
        [
          'Stock valuation',
          currency(m.stock_value),
          `${count(m.low_stock)} items at or below minimum`,
          Inventory2Outlined,
          '#D97706',
          '/stock',
        ],
        [
          'Quotations',
          count(m.quotations),
          'Company proposal workspace',
          DescriptionOutlined,
          '#7C3AED',
          '/quotations',
        ],
        [
          'Customers',
          count(m.customers),
          'Company customer directory',
          PeopleAltOutlined,
          '#0284C7',
          '/customers',
        ],
      ]
    : [
        ['Subsidy pending',currency(m.pending_amount),`${count(m.pending_projects)} projects awaiting credit`,AccountBalanceOutlined,'#D97706','/subsidies'],
        ['Applications past target',count(m.stuck_applications),'Review stage-specific follow-up targets',DescriptionOutlined,'#DC2626','/subsidies'],
        ['Credited this month',currency(m.credited_this_month),'Actual tracker credit dates',PaymentsOutlined,'#059669','/subsidies'],
        [
          'Subsidy applications',
          count(m.applications),
          'Saved applications only',
          AccountBalanceOutlined,
          '#0284C7',
          '/subsidies',
        ],
        [
          'Subsidy credited',
          count(m.credited),
          'Applications marked credited',
          PaymentsOutlined,
          '#059669',
          '/subsidies',
        ],
        [
          'Recorded subsidy receipts',
          currency(m.received),
          'Separate from loan disbursement',
          PaymentsOutlined,
          '#059669',
          '/subsidies',
        ],
        [
          'Active loan applications',
          count(m.active_loans),
          `${count(m.loans)} total loan applications`,
          DescriptionOutlined,
          '#7C3AED',
          '/subsidies/loans',
        ],
        [
          'Loan disbursements',
          currency(m.loan_disbursed),
          'Recorded lender disbursements',
          PaymentsOutlined,
          '#0284C7',
          '/subsidies/loans',
        ],
        [
          'Subsidy rejections',
          count(m.rejected),
          'Review and resolve queries',
          AccountBalanceOutlined,
          '#DC2626',
          '/subsidies',
        ],
      ];
  const actions = finance
    ? [
        ['Customers', '/customers', PeopleAltOutlined],
        ['Quotations', '/quotations', DescriptionOutlined],
        ['Invoices & payments', '/invoices', ReceiptLongOutlined],
        ['Stock management', '/stock', Inventory2Outlined],
        ['Solar calculator', '/calculator', CalculateOutlined],
      ]
    : [
        ['Subsidy applications', '/subsidies', AccountBalanceOutlined],
        ['Solar loans', '/subsidies/loans', PaymentsOutlined],
      ];
  return (
    <Box sx={{ maxWidth: 1600, mx: 'auto', minWidth: 0, pb: 3 }}>
      <Paper variant="outlined" sx={{ ...card, p: { xs: 2.5, md: 3 }, mb: 3 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          sx={{ justifyContent: 'space-between', gap: 2, alignItems: { sm: 'center' } }}
        >
          <Box>
            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>
              COMPANY WORKSPACE
            </Typography>
            <Typography
              component="h1"
              variant="h4"
              sx={{ fontWeight: 700, fontSize: { xs: 26, md: 30 } }}
            >
              {finance ? 'Finance dashboard' : 'Application Manager dashboard'}
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              {finance
                ? 'Manage billing, customer accounts and inventory in one place.'
                : 'Track subsidy progress, lender approvals and recorded receipts.'}
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<RefreshOutlined />}
            onClick={load}
            disabled={loading}
            sx={{ alignSelf: { xs: 'flex-start', sm: 'center' }, flexShrink: 0 }}
          >
            Refresh
          </Button>
        </Stack>
      </Paper>
      {error ? (
        <Alert severity="error" sx={{ mb: 3 }} action={<Button onClick={load}>Retry</Button>}>
          {error}
        </Alert>
      ) : null}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2,minmax(0,1fr))',
            xl: 'repeat(3,minmax(0,1fr))',
          },
          gap: 2.5,
          mb: 3,
        }}
      >
        {metrics.map(([label, value, hint, Icon, color, path]) => (
          <Paper key={label} variant="outlined" sx={{ ...card, p: 2.5, minWidth: 0 }}>
            <Stack
              direction="row"
              sx={{ justifyContent: 'space-between', alignItems: 'center', gap: 1 }}
            >
              <Typography color="text.secondary" sx={{ fontWeight: 600 }}>
                {label}
              </Typography>
              <Box sx={{ p: 1, borderRadius: 2, color, bgcolor: `${color}12`, display: 'flex' }}>
                <Icon />
              </Box>
            </Stack>
            {loading ? (
              <Skeleton width="60%" height={52} />
            ) : (
              <Typography
                sx={{
                  fontSize: { xs: 28, md: 32 },
                  fontWeight: 700,
                  my: 1.5,
                  overflowWrap: 'anywhere',
                  color,
                }}
              >
                {error ? '—' : value}
              </Typography>
            )}
            <Typography variant="body2" color="text.secondary">
              {hint}
            </Typography>
            <Button
              size="small"
              onClick={() => navigate(path)}
              endIcon={<ArrowForwardOutlined />}
              sx={{ mt: 1, px: 0 }}
            >
              Open workspace
            </Button>
          </Paper>
        ))}
      </Box>
      {!finance && !!data?.stuck_by_stage?.length && <Paper variant="outlined" sx={{ ...card,p:2,mb:3 }}>
        <Typography fontWeight={700} sx={{ mb:1 }}>Applications past follow-up target by stage</Typography>
        <Stack direction="row" sx={{ gap:1,flexWrap:'wrap' }}>{data.stuck_by_stage.map(row=><Box key={row.label} sx={{ p:1,bgcolor:'#FFFBEB',borderRadius:1 }}><Typography variant="body2">{row.label.replaceAll('_',' ')}: <strong>{count(row.count)}</strong></Typography></Box>)}</Stack>
      </Paper>}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(0,2fr) minmax(280px,1fr)' },
          gap: 3,
        }}
      >
        <Paper variant="outlined" sx={{ ...card, overflow: 'hidden', minWidth: 0 }}>
          <Box sx={{ p: 2.5, borderBottom: '1px solid #E2E8F0' }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {finance ? 'Outstanding invoices' : 'Applications to follow up'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {finance
                ? 'Earliest due dates first; undated invoices follow.'
                : 'Oldest updated applications first. Open a record to continue.'}
            </Typography>
          </Box>
          {loading ? (
            <Skeleton height={280} sx={{ mx: 2 }} />
          ) : error ? (
            <Typography sx={{ p: 3 }} color="text.secondary">
              Refresh to load records.
            </Typography>
          ) : !data?.attention?.length ? (
            <Typography sx={{ p: 4 }} color="text.secondary">
              {finance ? 'No outstanding invoices.' : 'No pending saved subsidy applications.'}
            </Typography>
          ) : (
            <TableContainer>
              <Table
                sx={{ minWidth: 550 }}
                aria-label={finance ? 'Outstanding invoices' : 'Pending applications'}
              >
                <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                  <TableRow>
                    {[
                      'Customer / reference',
                      'Status',
                      finance ? 'Balance due' : 'Expected subsidy',
                      '',
                    ].map((s, i) => (
                      <TableCell key={i} sx={{ fontWeight: 700 }}>
                        {s}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.attention.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell>
                        <Typography fontWeight={600}>{row.customer_name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {row.reference || 'Reference not recorded'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip size="small" variant="outlined" label={human(row.status)} />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{currency(row.amount)}</TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          onClick={() => navigate(finance ? '/invoices' : `/subsidies/${row.id}`)}
                        >
                          Open
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
        <Stack sx={{ gap: 3, minWidth: 0 }}>
          <Paper variant="outlined" sx={{ ...card, p: 2.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              Quick access
            </Typography>
            <Stack sx={{ gap: 1 }}>
              {actions.map(([label, path, Icon]) => (
                <Button
                  key={path}
                  variant="outlined"
                  startIcon={<Icon />}
                  endIcon={<ArrowForwardOutlined />}
                  onClick={() => navigate(path)}
                  sx={{
                    justifyContent: 'flex-start',
                    py: 1.25,
                    '& .MuiButton-endIcon': { ml: 'auto' },
                  }}
                >
                  {label}
                </Button>
              ))}
            </Stack>
          </Paper>
          <Paper variant="outlined" sx={{ ...card, p: 2.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              {finance ? 'Invoice status' : 'Subsidy stages'}
            </Typography>
            {loading ? (
              <Skeleton height={80} />
            ) : !stages.length ? (
              <Typography variant="body2" color="text.secondary">
                No records to summarise yet.
              </Typography>
            ) : (
              stages.map((s) => (
                <Box key={s.label} sx={{ mb: 2 }}>
                  <Stack direction="row" sx={{ justifyContent: 'space-between', gap: 1, mb: 0.75 }}>
                    <Typography variant="body2">{human(s.label)}</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {count(s.count)}
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={total ? (Number(s.count) / total) * 100 : 0}
                    sx={{ height: 6, borderRadius: 2 }}
                  />
                </Box>
              ))
            )}
          </Paper>
        </Stack>
      </Box>
      {data?.updated_at && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
          Updated {new Date(data.updated_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}{' '}
          IST
        </Typography>
      )}
    </Box>
  );
}
