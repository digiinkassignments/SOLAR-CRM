import { useCallback, useEffect, useState } from "react";
import { Alert, Badge, Box, Button, IconButton, Popover, Typography } from "@mui/material";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import api from "../api/axios";
export default function ReminderInbox() {
  const [anchor,setAnchor]=useState(null),[items,setItems]=useState([]),[error,setError]=useState("");
  const refresh=useCallback(async()=>{try{const r=await api.get('/notifications');setItems(r.data.data||[]);setError('');}catch{setError('Reminders could not be loaded.');}},[]);
  useEffect(()=>{const load=()=>api.get('/notifications').then(r=>setItems(r.data.data||[])).catch(()=>{});load();const interval=setInterval(load,60000);return()=>clearInterval(interval);},[]);
  const markRead=async()=>{try{await api.patch('/notifications/mark-all-read');await refresh();}catch{setError('Could not mark reminders read.');}};
  return <><IconButton aria-label="Open reminders" onClick={e=>{setAnchor(e.currentTarget);refresh();}}><Badge badgeContent={items.filter(item=>!item.is_read).length} max={99} color="error"><NotificationsNoneIcon/></Badge></IconButton><Popover open={Boolean(anchor)} anchorEl={anchor} onClose={()=>setAnchor(null)} anchorOrigin={{vertical:'bottom',horizontal:'right'}} transformOrigin={{vertical:'top',horizontal:'right'}}><Box sx={{p:2,width:360,maxWidth:'90vw',maxHeight:'70vh',overflow:'auto'}}><Typography fontWeight={800}>Reminders & notifications</Typography><Button size="small" onClick={markRead}>Mark all read</Button>{error&&<Alert severity="error">{error}</Alert>}{!items.length&&<Typography variant="body2" color="text.secondary">No notifications yet.</Typography>}{items.map(item=><Box key={item.id} sx={{py:1.5,borderBottom:'1px solid #E2E8F0',opacity:item.is_read?0.65:1}}><Typography variant="body2" fontWeight={700}>{item.title}</Typography><Typography variant="body2">{item.body}</Typography><Typography variant="caption" color="text.secondary">{new Date(item.created_at).toLocaleString()}</Typography></Box>)}<Typography variant="caption" color="text.secondary">Latest 50 notifications. Updates every minute.</Typography></Box></Popover></>;
}
