import { useEffect, useState } from 'react';
import { Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { DownloadOutlined, UploadFileOutlined } from '@mui/icons-material';
import api from '../../api/axios';
import {importColumns as columns,importExample,normalizeImportRow} from './customerImport';
const download = (name, text) => {
  const url = URL.createObjectURL(new Blob(['\uFEFF' + text], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
};
export default function ImportCustomersDialog({ open, onClose, onImported, manager }) {
  const [rows, setRows] = useState([]), [filename, setFilename] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState(''), [result, setResult] = useState(null), [requestKey, setRequestKey] = useState('');
  const [team, setTeam] = useState([]), [assigned, setAssigned] = useState('');
  useEffect(() => {
    if (open) { setRows([]); setFilename(''); setResult(null); setError(''); setAssigned(''); setRequestKey(crypto.randomUUID()); }
    if (open && manager) api.get('/users/team').then(r => setTeam(r.data.data || [])).catch(() => setError('Your sales team could not load. Please reopen this dialog.'));
  }, [open, manager]);
  const parse = async event => {
    const file = event.target.files?.[0]; event.target.value = ''; if (!file) return;
    setError(''); setResult(null); setRows([]); setFilename(file.name); setBusy(true); setRequestKey(crypto.randomUUID());
    try {
      if (file.size > 2 * 1024 * 1024) throw Error('Choose a file up to 2 MB.');
      let raw;
      if (/\.csv$/i.test(file.name)) {
        const { default: Papa } = await import('papaparse');
        const parsed = Papa.parse(await file.text(), { header: true, skipEmptyLines: 'greedy', transformHeader: value => value.replace(/^\uFEFF/, '').trim() });
        if (parsed.errors.length) throw Error('CSV columns do not match the header. Download the template and check commas/quotes.');
        raw = parsed.data;
      } else if (/\.xlsx$/i.test(file.name)) {
        const XLSX = await import('xlsx'); const book = XLSX.read(await file.arrayBuffer(), { type: 'array' });
        raw = XLSX.utils.sheet_to_json(book.Sheets[book.SheetNames[0]], { defval: '', raw: false });
      } else throw Error('Choose a CSV or XLSX file.');
      if (!raw.length || raw.length > 100) throw Error('Use between 1 and 100 customer rows per file.');
      const normalized = raw.map(normalizeImportRow);
      if (!Object.hasOwn(normalized[0], 'customer_name') || !Object.hasOwn(normalized[0], 'mobile_number')) throw Error('customer_name and mobile_number columns are required.');
      if (new TextEncoder().encode(JSON.stringify(normalized)).length > 85000) throw Error('This file contains too much text. Split it into smaller batches.');
      setRows(normalized);
    } catch (e) { setError(e.message || 'Could not read this file.'); }
    finally { setBusy(false); }
  };
  const submit = async () => {
    if (manager && !assigned) { setError('Choose a salesperson from your team.'); return; }
    setError(''); setBusy(true);
    try {
      const response = await api.post('/customers/bulk-import', { request_key: requestKey, rows: rows.map(row => ({ ...row, ...(assigned ? { assigned_to: Number(assigned) } : {}) })) });
      setResult(response.data.data); onImported?.();
    } catch (e) { setError(e.response?.data?.message || 'Import could not finish. Retry with the same file; confirmed imports will not be duplicated.'); }
    finally { setBusy(false); }
  };
  return <Dialog open={open} onClose={() => !busy && onClose()} fullWidth maxWidth="lg">
    <DialogTitle>Bulk upload customers<Typography variant="body2" color="text.secondary" sx={{ mt: .5 }}>Preview CSV or Excel data before adding it to this company.</Typography></DialogTitle>
    <DialogContent dividers>
      <Alert severity="info" sx={{ mb: 2 }}>Customer name and mobile are required. Existing mobile numbers are skipped; existing customer details remain unchanged. Plant size is in kW. Final amount and Payment recieved are optional opening amounts in Rs.; payment cannot exceed the final amount. Leave blanks for unknown values. These records do not generate tax invoices.</Alert>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Stack direction="row" useFlexGap sx={{ gap: 1.5, flexWrap: 'wrap', mb: 2 }}>
        <Button variant="outlined" startIcon={<DownloadOutlined />} onClick={() => download('customer-import-template.csv', columns.join(',') + '\n' + importExample.join(',') + '\n')}>Download CSV template</Button>
        <Button variant="outlined" disabled={busy} startIcon={<DownloadOutlined />} onClick={async()=>{try{const XLSX=await import('xlsx');const book=XLSX.utils.book_new();const sheet=XLSX.utils.aoa_to_sheet([columns,importExample]);sheet['!cols']=columns.map((name)=>({wch:Math.max(18,name.length+3)}));XLSX.utils.book_append_sheet(book,sheet,'Customers');XLSX.writeFile(book,'customer-import-template.xlsx');}catch{setError('Could not download Excel template. Please retry.');}}}>Download Excel template</Button>
        <Button component="label" variant="contained" startIcon={<UploadFileOutlined />} disabled={busy}>Choose CSV / Excel<input hidden type="file" accept=".csv,.xlsx" onChange={parse} /></Button>
        {filename && <Chip label={filename} />}
      </Stack>
      <Typography variant="caption" color="text.secondary" sx={{display:"block",mb:2}}>CSV or XLSX - up to 100 rows and 2 MB per file. The first worksheet is used for Excel files.</Typography>
      {manager && <TextField select required fullWidth label="Assign imported customers to" value={assigned} onChange={e => { setAssigned(e.target.value); setRequestKey(crypto.randomUUID()); }} disabled={busy || Boolean(result)} sx={{ mb: 2 }}>{team.map(person => <MenuItem key={person.id} value={person.id}>{person.full_name}</MenuItem>)}</TextField>}
      {result ? <Box><Alert severity={result.errors.length ? 'warning' : 'success'}>{result.imported} customers imported · {result.skipped} duplicates skipped · {result.errors.length} invalid rows</Alert>
        {[...result.errors, ...result.duplicates].length > 0 && <Box sx={{ mt: 2 }}><Typography fontWeight={700}>Rows to review</Typography>{[...result.errors, ...result.duplicates].map((row, index) => <Typography key={index} variant="body2" sx={{ mt: .5 }}>Row {row.row}: {row.message}</Typography>)}<Button sx={{ mt: 1 }} onClick={() => download('customer-import-results.csv', 'row,message\n' + [...result.errors, ...result.duplicates].map(row => `${row.row},"${row.message.replaceAll('"', '""')}"`).join('\n'))}>Download result report</Button></Box>}
      </Box> : rows.length > 0 && <><Typography fontWeight={700} sx={{ mb: 1 }}>{rows.length} rows ready for validation · preview of first 10</Typography><TableContainer sx={{ maxHeight: 380 }}><Table size="small" aria-label="Customer import preview"><TableHead><TableRow>{['Row', 'Customer', 'Mobile', 'Type', 'Plant size (kW)', 'Final amount (Rs.)', 'Payment received (Rs.)', 'Lead source', 'City'].map(label => <TableCell key={label}>{label}</TableCell>)}</TableRow></TableHead><TableBody>{rows.slice(0, 10).map((row, index) => <TableRow key={index}><TableCell>{index + 2}</TableCell><TableCell>{row.customer_name || 'Missing name'}</TableCell><TableCell>{row.mobile_number || 'Missing mobile'}</TableCell><TableCell>{row.solar_requirement || 'Residential'}</TableCell><TableCell>{row.plant_size_kw || '-'}</TableCell><TableCell>{row.invoice_amount || '-'}</TableCell><TableCell>{row.payment_amount || '-'}</TableCell><TableCell>{row.lead_source || 'Not recorded'}</TableCell><TableCell>{row.city}</TableCell></TableRow>)}</TableBody></Table></TableContainer></>}
    </DialogContent>
    <DialogActions sx={{ p: 2, flexWrap: 'wrap', gap: 1 }}><Button disabled={busy} onClick={onClose}>{result ? 'Done' : 'Cancel'}</Button>{!result && <Button variant="contained" disabled={busy || !rows.length} onClick={submit}>{busy ? 'Processing…' : `Import ${rows.length || ''} customers`}</Button>}</DialogActions>
  </Dialog>;
}
