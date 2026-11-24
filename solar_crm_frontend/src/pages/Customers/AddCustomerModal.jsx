import { currency, moneyInput, openingSummary } from './customerMoney';
import DuplicateGuard from '../../components/DuplicateGuard';
import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Button,
  TextField,
  MenuItem,
  Typography,
  CircularProgress,
  IconButton,
  InputAdornment,
  Alert,
} from '@mui/material';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import CloseIcon from '@mui/icons-material/Close';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { createCustomer, updateCustomer } from '../../services/customerService';
const fresh = () => ({
  customer_name: '',
  mobile_number: '',
  alternate_number: '',
  email: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  electricity_consumer_number: '',
  discom_name: '',
  sanctioned_load_kw: '',
  customer_gstin: '',
  solar_requirement: 'Residential',
  lead_source: '',
  notes: '',
  plant_size_kw: '',
  invoice_amount: '',
  invoice_reference: '',
  payment_amount: '',
  payment_date: new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date()),
  payment_mode: 'Bank Transfer',
  payment_reference: '',
  loan_sanctioned_amount: '',
  loan_disbursed_amount: '',
  refund_paid_amount: '',
  refund_date: '',
  refund_mode: 'Bank Transfer',
  refund_reference: '',
  request_key: crypto.randomUUID(),
});
const sections = [
  [
    'Customer information',
    'Contact details and how this customer found you.',
    [
      ['customer_name', 'Customer / business name', true],
      ['mobile_number', 'Primary mobile number', true, 'tel'],
      ['alternate_number', 'Alternate phone', false, 'tel'],
      ['email', 'Email address', false, 'email'],
      [
        'solar_requirement',
        'Customer type',
        false,
        'select',
        ['Residential', 'Commercial', 'Industrial'],
      ],
      ['plant_size_kw', 'Plant size (kW)', false, 'number'],
      ['customer_gstin', 'GSTIN'],
      ['lead_source', 'Lead source'],
    ],
  ],
  [
    'Installation address',
    'The site where the solar system will be installed.',
    [
      ['address', 'Site address', false, 'multiline'],
      ['city', 'City'],
      ['state', 'State'],
      ['pincode', 'PIN code'],
    ],
  ],
  [
    'Electricity connection',
    'Optional utility details for survey and application work.',
    [
      ['electricity_consumer_number', 'CA / consumer number'],
      ['discom_name', 'DISCOM provider'],
      ['sanctioned_load_kw', 'Sanctioned load (kW)', false, 'number'],
    ],
  ],
];
const grid = {
  display: 'grid',
  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,minmax(0,1fr))' },
  gap: 2.5,
};
const card = { p: { xs: 2, sm: 3 }, border: '1px solid #E2E8F0', borderRadius: 2, bgcolor: '#fff' };
export default function AddCustomerModal({ open, onClose, onCustomerCreated, customer }) {
  const duplicateGuard = useRef(null);
  const { user } = useAuth(),
    managerMode = Number(user?.role_id) === 2;
  const [data, setData] = useState(fresh),
    [team, setTeam] = useState([]),
    [saving, setSaving] = useState(false),
    [error, setError] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => {
      if (open) {
        const o = customer?.opening_record;
        setData(
          customer
            ? {
                ...fresh(),
                ...customer,
                plant_size_kw: o?.plant_size_kw ?? customer.plant_size_kw ?? '',
                invoice_amount: o?.invoice_amount ?? '',
                payment_amount: o?.amount_paid ?? '',
                invoice_reference: o?.invoice_reference ?? '',
                payment_date: o?.payment_date ? String(o.payment_date).slice(0, 10) : '',
                payment_mode: o?.payment_mode || 'Bank Transfer',
                payment_reference: o?.payment_reference ?? '',
                loan_sanctioned_amount: o?.loan_sanctioned_amount ?? '',
                loan_disbursed_amount: o?.loan_disbursed_amount ?? '',
                refund_paid_amount: o?.refund_paid_amount ?? '',
                refund_date: o?.refund_date ? String(o.refund_date).slice(0, 10) : '',
                refund_mode: o?.refund_mode || 'Bank Transfer',
                refund_reference: o?.refund_reference ?? '',
              }
            : fresh()
        );
        setError('');
        if (managerMode && !customer)
          api
            .get('/users/team')
            .then((r) => setTeam(r.data.data || []))
            .catch(() => setError('Sales team could not be loaded. Please reopen this form.'));
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [open, managerMode, customer]);
  const change = (e) => {
    setError('');
    setData((previous) => ({ ...previous, [e.target.name]: e.target.value }));
  };
  const close = () => {
    if (!saving) onClose();
  };
  const field = ([name, label, required = false, type = 'text', options]) => (
    <TextField
      key={name}
      name={name}
      label={label}
      required={required}
      fullWidth
      size="small"
      value={data[name] ?? ''}
      onChange={change}
      onBlur={
        ['mobile_number', 'alternate_number'].includes(name)
          ? () => duplicateGuard.current?.checkPhone()
          : undefined
      }
      type={['number', 'date', 'email', 'tel'].includes(type) ? type : 'text'}
      select={type === 'select'}
      multiline={type === 'multiline'}
      minRows={type === 'multiline' ? 2 : undefined}
      slotProps={{
        inputLabel: type === 'date' ? { shrink: true } : undefined,
        htmlInput:
          type === 'number'
            ? {
                min: name === 'plant_size_kw' ? 0.001 : 0,
                step: name === 'plant_size_kw' ? '0.001' : '0.01',
                max: name === 'plant_size_kw' ? 9999999.999 : undefined,
              }
            : { maxLength: name === 'notes' ? 2000 : name === 'address' ? 2000 : 150 },
      }}
      sx={{ minWidth: 0, gridColumn: type === 'multiline' ? '1 / -1' : undefined }}
    >
      {options?.map((value) => (
        <MenuItem key={value} value={value}>
          {value}
        </MenuItem>
      ))}
    </TextField>
  );
  const opening = openingSummary(data);
  const balanceLabel = opening.net < 0 ? 'Refund payable to buyer' : opening.net > 0 ? 'Balance due' : 'Settled';
  const balanceColor = opening.net < 0 ? 'error.main' : opening.net > 0 ? '#92400E' : 'success.main';
  const moneyField = (name, label) => (
    <TextField
      name={name}
      label={label}
      value={moneyInput(data[name])}
      onChange={(event) => {
        const input = event.target;
        const raw = input.value.replace(/[₹,\s]/g, '').replace(/^\./, '0.');
        if (!/^\d{0,10}(?:\.\d{0,2})?$/.test(raw)) return;
        const position = input.selectionStart ?? input.value.length;
        const meaningful = input.value.slice(0, position).replace(/[₹,\s]/g, '').length;
        setData((previous) => ({ ...previous, [name]: raw }));
        requestAnimationFrame(() => {
          if (document.activeElement !== input) return;
          let count = 0;
          let caret = 0;
          while (caret < input.value.length && count < meaningful) {
            if (input.value[caret] !== ',') count++;
            caret++;
          }
          input.setSelectionRange(caret, caret);
        });
      }}
      onBlur={() => setData((previous) => ({ ...previous, [name]: String(previous[name] ?? '').replace(/\.$/, '') }))}
      fullWidth
      size="small"
      type="text"
      slotProps={{
        htmlInput: { inputMode: 'decimal', maxLength: 18 },
        input: { startAdornment: <InputAdornment position="start">₹</InputAdornment> },
      }}
      sx={{ minWidth: 0 }}
    />
  );
  const submit = async (e) => {
    e.preventDefault();
    if (saving) return;
    const total = Number(data.invoice_amount || 0),
      paid = Number(data.payment_amount || 0),
      loanDisbursed = Number(data.loan_disbursed_amount || 0),
      refundPaid = Number(data.refund_paid_amount || 0),
      refundDue = Math.max(0, paid + loanDisbursed - total);
    if (!data.customer_name.trim() || !data.mobile_number.trim())
      return setError('Customer name and primary mobile number are required.');
    if (managerMode && !customer && !data.assigned_to)
      return setError('Choose a salesperson in your team.');
    if (!Number.isFinite(total) || !Number.isFinite(paid) || total < 0 || paid < 0)
      return setError('Enter valid non-negative amounts.');
    if ([data.loan_sanctioned_amount, data.loan_disbursed_amount, data.refund_paid_amount].some((v) => v !== '' && (!Number.isFinite(Number(v)) || Number(v) < 0)))
      return setError('Loan and refund amounts must be non-negative.');
    if (refundPaid > refundDue)
      return setError('Refund paid cannot exceed the current refund due.');
    if (refundPaid > 0 && (!data.refund_date || !data.refund_mode))
      return setError('Enter refund date and refund mode.');
    if (
      data.plant_size_kw !== '' &&
      (!/^\d+(\.\d{1,3})?$/.test(data.plant_size_kw) ||
        Number(data.plant_size_kw) <= 0 ||
        Number(data.plant_size_kw) > 9999999.999)
    )
      return setError('Enter a positive plant size in kW, with up to 3 decimal places.');
    if (paid > 0 && !data.payment_date) return setError('Enter the payment date.');
    setSaving(true);
    setError('');
    try {
      const approval = await duplicateGuard.current?.confirm();
      if (approval === null) return;
      const payload = { ...data, ...approval };
      const res = await (customer ? updateCustomer(customer.id, payload) : createCustomer(payload));
      if (!res?.success) throw Error(res?.message || 'Could not create customer.');
      toast.success(customer ? 'Customer updated successfully.' : 'Customer created successfully.');
      onCustomerCreated?.();
      onClose();
    } catch (err) {
      if (err.response?.data?.code === 'DUPLICATE_RECORD')
        duplicateGuard.current?.conflict(err.response.data.duplicates);
      setError(
        err.response?.data?.message || err.message || 'Could not create customer. Retry safely.'
      );
    } finally {
      setSaving(false);
    }
  };
  return (
    <Dialog
      open={open}
      onClose={close}
      maxWidth="md"
      fullWidth
      aria-labelledby="add-customer-title"
      PaperProps={{
        sx: {
          borderRadius: 3,
          m: { xs: 1, sm: 3 },
          width: { xs: 'calc(100% - 16px)', sm: 'calc(100% - 48px)' },
          maxHeight: 'calc(100dvh - 32px)',
          overflow: 'hidden',
        },
      }}
    >
      <DialogTitle
        id="add-customer-title"
        component="div"
        sx={{
          px: { xs: 2, sm: 3 },
          py: 2.5,
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <Box
          sx={{ display: 'flex', p: 1.2, bgcolor: '#EFF6FF', color: '#0369A1', borderRadius: 2 }}
        >
          <PersonAddOutlinedIcon />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography component="h2" variant="h6" fontWeight={700}>
            {customer ? 'Edit customer' : 'Add customer'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Customer details, plant size and opening payment record.
          </Typography>
        </Box>
        <IconButton aria-label="Close add customer" disabled={saving} onClick={close}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <Box
        component="form"
        onSubmit={submit}
        sx={{ display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}
      >
        <DialogContent
          sx={{
            p: { xs: 1.5, sm: 3 },
            bgcolor: '#F8FAFC',
            display: 'flex',
            flexDirection: 'column',
            gap: 2.5,
            overflowY: 'auto',
          }}
        >
          <DuplicateGuard
            ref={duplicateGuard}
            data={data}
            type="customer"
            id={customer?.id}
            enabled={open}
            checkPhones={
              !customer ||
              ['mobile_number', 'alternate_number'].some(
                (k) => String(data[k] || '') !== String(customer[k] || '')
              )
            }
          />
          {error && (
            <Alert severity="error" role="alert">
              {error}
            </Alert>
          )}
          {managerMode && !customer && (
            <Box sx={card}>
              <TextField
                select
                required
                fullWidth
                size="small"
                label="Assigned salesperson"
                name="assigned_to"
                value={data.assigned_to || ''}
                onChange={change}
              >
                {team.map((rep) => (
                  <MenuItem key={rep.id} value={rep.id}>
                    {rep.full_name}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
          )}
          {customer && (
            <Box sx={card}>
              {field(['status', 'Status', true, 'select', ['Active', 'Inactive']])}
            </Box>
          )}
          {sections.slice(0, 1).map(([title, description, fields]) => (
            <Box key={title} sx={card}>
              <Typography component="h3" fontWeight={700} sx={{ mb: 0.5 }}>
                {title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {description}
              </Typography>
              <Box sx={grid}>{fields.map(field)}</Box>
            </Box>
          ))}
          <Box sx={card}>
            <Typography component="h3" fontWeight={700} sx={{ mb: 0.5 }}>
              Final amount & payment record
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Optional opening record for an existing invoice. Create new tax invoices from
              Invoices; do not enter the same invoice twice.
            </Typography>
            <Box sx={{ ...grid, alignItems: 'start' }}>
              {moneyField('invoice_amount', 'Final amount')}
              {moneyField('payment_amount', 'Payment received')}
              {moneyField('loan_sanctioned_amount', 'Loan sanctioned')}
              {moneyField('loan_disbursed_amount', 'Loan disbursed')}
              <Box sx={{ gridColumn: '1 / -1' }}>{field(['invoice_reference', 'Existing invoice number / reference'])}</Box>
            </Box>
            {Number(data.payment_amount) > 0 && (
              <Box sx={{ ...grid, gridTemplateColumns: { xs: '1fr', md: 'repeat(3,minmax(0,1fr))' }, mt: 2.5 }}>
                {field(['payment_date', 'Payment date', true, 'date'])}
                {field(['payment_mode', 'Payment mode', true, 'select', ['Bank Transfer', 'UPI', 'Cash', 'Cheque', 'Card', 'Other']])}
                {field(['payment_reference', 'Transaction / receipt reference'])}
              </Box>
            )}
            <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
              <Typography fontWeight={600} sx={{ mb: 2.5 }}>Refund record</Typography>
              <Box sx={grid}>
                {moneyField('refund_paid_amount', 'Refund paid')}
                <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center' }}>Record money already returned to the buyer. Subsidy is excluded.</Typography>
              </Box>
              {Number(data.refund_paid_amount) > 0 && (
                <Box sx={{ ...grid, gridTemplateColumns: { xs: '1fr', md: 'repeat(3,minmax(0,1fr))' }, mt: 2.5 }}>
                  {field(['refund_date', 'Refund date', true, 'date'])}
                  {field(['refund_mode', 'Refund mode', true, 'select', ['Bank Transfer', 'UPI', 'Cash', 'Cheque', 'Card', 'Other']])}
                  {field(['refund_reference', 'Refund reference'])}
                </Box>
              )}
            </Box>
            <Box sx={{ ...grid, mt: 3, alignItems: 'stretch' }}>
              <Box sx={{ p: 2.5, bgcolor: '#F8FAFC', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="body2" color="text.secondary">Total received</Typography>
                <Typography variant="h6" fontWeight={700} sx={{ mt: 0.5 }}>{currency(opening.received)}</Typography>
                <Typography variant="caption" color="text.secondary">Payment received + loan disbursed</Typography>
              </Box>
              <Box role="status" aria-live="polite" sx={{ p: 2.5, bgcolor: '#F8FAFC', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="body2" color="text.secondary">Net balance</Typography>
                <Typography variant="h6" fontWeight={700} sx={{ mt: 0.5, color: balanceColor }}>{currency(opening.net)}</Typography>
                <Typography variant="caption" fontWeight={600} sx={{ color: balanceColor }}>{balanceLabel}</Typography>
              </Box>
            </Box>
          </Box>
          {sections.slice(1).map(([title, description, fields]) => (
            <Box key={title} sx={card}>
              <Typography component="h3" fontWeight={700} sx={{ mb: 0.5 }}>
                {title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {description}
              </Typography>
              <Box sx={grid}>{fields.map(field)}</Box>
            </Box>
          ))}
          <Box sx={card}>{field(['notes', 'Notes / site instructions', false, 'multiline'])}</Box>
        </DialogContent>
        <DialogActions
          sx={{
            px: { xs: 2, sm: 3 },
            py: 2,
            borderTop: '1px solid #E2E8F0',
            gap: 1,
            flexWrap: 'wrap',
          }}
        >
          <Button onClick={close} disabled={saving} sx={{ color: 'text.secondary' }}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={saving}
            variant="contained"
            startIcon={
              saving ? <CircularProgress size={16} color="inherit" /> : <PersonAddOutlinedIcon />
            }
            sx={{ bgcolor: '#0F172A', px: 3, '&:hover': { bgcolor: '#020617' } }}
          >
            {saving ? 'Saving customer…' : customer ? 'Save changes' : 'Save customer'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
