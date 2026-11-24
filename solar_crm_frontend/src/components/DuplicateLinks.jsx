import { Alert, Button, Stack } from '@mui/material';
import { recordUrl } from './DuplicateGuard';
export default function DuplicateLinks({ record }) {
  if (!record?.duplicate_links?.length) return null;
  return (
    <Alert severity="warning" sx={{ my: 2 }}>
      Possible duplicate. Review the original record before further action.
      <Stack direction="row" gap={1} flexWrap="wrap">
        {record.duplicate_links.map((link) => (
          <Button
            key={`${link.original_type}:${link.original_id}`}
            size="small"
            component="a"
            href={recordUrl({ kind: link.original_type, id: link.original_id })}
            target="_blank"
            rel="noopener noreferrer"
          >
            Original {link.original_type} #{link.original_id}
          </Button>
        ))}
      </Stack>
    </Alert>
  );
}
