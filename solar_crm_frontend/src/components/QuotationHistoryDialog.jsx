import { useEffect, useState } from "react";
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from "@mui/material";
import api from "../api/axios";
export default function QuotationHistoryDialog({ quotation, onClose }) {
  return quotation ? <History key={quotation.id} quotation={quotation} onClose={onClose}/> : null;
}
function History({quotation,onClose}) {
  const [rows,setRows]=useState(null),[error,setError]=useState("");
  useEffect(()=>{api.get(`/quotation-governance/${quotation.id}/revisions`).then(r=>setRows(r.data.data)).catch(()=>setError("Revision history could not be loaded."));},[quotation.id]);
  return <Dialog open onClose={onClose} maxWidth="md" fullWidth><DialogTitle>Quotation revision history - {quotation.quotation_number}</DialogTitle><DialogContent>{error&&<Alert severity="error">{error}</Alert>}{rows&&!rows.length&&<Alert severity="info">Legacy quotation: revision snapshots start with the next edit.</Alert>}{rows?.map(row=><Box key={row.revision_number} sx={{py:2,borderBottom:"1px solid #E2E8F0"}}><Typography fontWeight={800}>Revision {row.revision_number} - {row.snapshot.status} - {row.snapshot.discount_approval||"Legacy"}</Typography><Typography variant="body2">Created: {new Date(row.created_at).toLocaleString()} | Total: Rs {Number(row.snapshot.total_amount).toLocaleString("en-IN")} | Discount: Rs {Number(row.snapshot.discount_amount).toLocaleString("en-IN")}</Typography>{row.snapshot.approval_note&&<Typography variant="body2">Review: {row.snapshot.approval_note}</Typography>}<Box component="details" sx={{mt:1}}><summary>Review saved details</summary><Box component="pre" sx={{fontSize:11,whiteSpace:"pre-wrap",overflowWrap:"anywhere",bgcolor:"#F8FAFC",p:2}}>{JSON.stringify(row.snapshot,null,2)}</Box></Box>{row.snapshot.public_token&&!['pending','rejected'].includes(row.snapshot.discount_approval)&&<Button component="a" href={`/quote/${row.snapshot.public_token}`} target="_blank" rel="noopener noreferrer">View saved document</Button>}</Box>)}</DialogContent><DialogActions><Button onClick={onClose}>Close</Button></DialogActions></Dialog>;
}
