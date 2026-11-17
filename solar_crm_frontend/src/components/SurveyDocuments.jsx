import { useCallback, useEffect, useState } from 'react';
import { Alert, Box, Button, Chip, CircularProgress, Paper, Stack, Typography } from '@mui/material';
import { DescriptionOutlined, DownloadOutlined, UploadFileOutlined } from '@mui/icons-material';
import api from '../api/axios';

const categories = [
  ['aadhaar', 'Aadhaar', 'Identity document'],
  ['electricity_bill', 'Electricity bill', 'Consumer and supply details'],
  ['site_photo', 'Site photos', 'Roof, meter and site views'],
  ['bank_passbook', 'Bank passbook', 'Bank account document'],
];
export default function SurveyDocuments({ surveyId }) {
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    if (!surveyId) return;
    setLoading(true);
    try { const result = await api.get(`/surveys/${surveyId}/documents`); setFiles(result.data.data || []); }
    catch (e) { setError(e.response?.data?.message || 'Documents could not load.'); }
    finally { setLoading(false); }
  }, [surveyId]);
  useEffect(() => { setFiles([]); setError(''); load(); }, [load]);
  const upload = async (category, event) => {
    const selected = Array.from(event.target.files || []);
    event.target.value = '';
    if (!selected.length) return;
    if (selected.some(file => file.size > 8 * 1024 * 1024)) { setError('Each file must be 8 MB or smaller.'); return; }
    setBusy(category); setError('');
    try {
      for (const file of selected) {
        const body = new FormData(); body.append('category', category); body.append('file', file);
        await api.post(`/surveys/${surveyId}/documents`, body, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
    } catch (e) { setError(e.response?.data?.message || 'Upload failed. Saved files remain attached; retry the remaining files.'); }
    finally { await load(); setBusy(''); }
  };
  const download = async file => {
    setError(''); setBusy(String(file.id));
    try {
      const result = await api.get(`/surveys/${surveyId}/documents/${file.id}`, { responseType: 'blob' });
      const url = URL.createObjectURL(result.data);
      const link = document.createElement('a'); link.href = url; link.download = file.original_name;
      link.click(); setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch { setError('Could not download this document. Please retry.'); }
    finally { setBusy(''); }
  };
  if (!surveyId) return null;
  return <Paper variant="outlined" sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 2, minWidth: 0 }}>
    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}><DescriptionOutlined color="primary" /><Typography fontWeight={800}>Survey documents</Typography><Chip size="small" label={`${files.length} attached`} /></Stack>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Upload photos from your gallery. JPG, PNG or WebP; documents also accept PDF. Up to 8 MB per file. Uploads save immediately to this survey.</Typography>
    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
    {loading && <CircularProgress size={20} aria-label="Loading survey documents" />}
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,minmax(0,1fr))' }, gap: 2 }}>
      {categories.map(([key, title, hint]) => <Box key={key} sx={{ border: '1px solid #E2E8F0', borderRadius: 2, p: 2, minWidth: 0, bgcolor: '#F8FAFC' }}>
        <Typography fontWeight={700}>{title}</Typography><Typography variant="caption" color="text.secondary">{hint}</Typography>
        <Stack spacing={1} sx={{ my: 1.5 }}>{files.filter(file => file.category === key).map(file => <Stack key={file.id} direction="row" spacing={1} alignItems="center"><Typography variant="body2" sx={{ flex: 1, minWidth: 0, overflowWrap: 'anywhere' }}>{file.original_name}</Typography><Button size="small" disabled={Boolean(busy)} onClick={() => download(file)} aria-label={`Download ${file.original_name}`} sx={{ minWidth: 36 }}><DownloadOutlined fontSize="small" /></Button></Stack>)}</Stack>
        <Button variant="outlined" component="label" size="small" disabled={Boolean(busy)} startIcon={busy === key ? <CircularProgress size={16} /> : <UploadFileOutlined />} sx={{ textTransform: 'none' }}>{busy === key ? 'Uploading…' : 'Upload'}<input hidden type="file" multiple accept={key === 'site_photo' ? 'image/jpeg,image/png,image/webp' : 'image/jpeg,image/png,image/webp,application/pdf'} onChange={event => upload(key, event)} /></Button>
      </Box>)}
    </Box>
  </Paper>;
}
