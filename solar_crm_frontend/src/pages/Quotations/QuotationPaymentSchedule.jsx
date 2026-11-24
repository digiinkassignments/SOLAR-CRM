import { Box, Button, IconButton, Stack, TextField, Typography } from '@mui/material';
import DeleteOutline from '@mui/icons-material/DeleteOutlineOutlined';

export function readPaymentSchedule(value) {
  try {
    return typeof value === 'string' ? JSON.parse(value) : value || [];
  } catch {
    return [];
  }
}
export default function QuotationPaymentSchedule({ value, onChange }) {
  const update = (index, key, v) =>
    onChange(value.map((r, i) => (i === index ? { ...r, [key]: v } : r)));
  return (
    <Box sx={{ my: 2 }}>
      <Typography fontWeight={700}>Dated payment schedule</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Optional. Percentages must total 100%. Dates carry over to invoice milestones for collection
        reminders; subsidy is excluded.
      </Typography>
      <Stack spacing={1}>
        {value.map((r, i) => (
          <Box
            key={i}
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'minmax(0,2fr) minmax(0,1fr) minmax(0,1.5fr) auto',
              },
              gap: 1,
            }}
          >
            <TextField
              size="small"
              label={`Milestone ${i + 1}`}
              value={r.title}
              onChange={(e) => update(i, 'title', e.target.value)}
            />
            <TextField
              size="small"
              label="Percent"
              value={r.percent}
              onChange={(e) => update(i, 'percent', e.target.value)}
              slotProps={{ htmlInput: { inputMode: 'decimal' } }}
            />
            <TextField
              size="small"
              type="date"
              label="Due date"
              value={r.due_date}
              onChange={(e) => update(i, 'due_date', e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <IconButton
              aria-label={`Remove milestone ${i + 1}`}
              onClick={() => onChange(value.filter((_, index) => i !== index))}
            >
              <DeleteOutline />
            </IconButton>
          </Box>
        ))}
      </Stack>
      <Button
        size="small"
        disabled={value.length >= 20}
        onClick={() => onChange([...value, { title: '', percent: '', due_date: '' }])}
      >
        Add dated milestone
      </Button>
      {value.length > 0 && (
        <Typography variant="body2">
          Total: {value.reduce((s, r) => s + Number(r.percent || 0), 0)}%
        </Typography>
      )}
    </Box>
  );
}
