import { Avatar, Box, Chip, Paper, Typography, ToggleButtonGroup, ToggleButton, Tooltip, Button, Stack } from "@mui/material";
import GridViewOutlinedIcon from "@mui/icons-material/GridViewOutlined";
import ViewListOutlinedIcon from "@mui/icons-material/ViewListOutlined";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import { phoneNumber } from "./customerHelpers";

const customerTones = {
  Residential: { color: "#0369A1", soft: "#E0F2FE", border: "#BAE6FD" },
  Commercial: { color: "#B45309", soft: "#FEF3C7", border: "#FDE68A" },
  Industrial: { color: "#6D28D9", soft: "#EDE9FE", border: "#DDD6FE" },
  Default: { color: "#0F766E", soft: "#CCFBF1", border: "#99F6E4" },
};

export function customerTypeTone(type) {
  return customerTones[type] || customerTones.Default;
}

export function CustomerBadges({ type, status }) {
  const tone = customerTypeTone(type);
  const active = status !== "Inactive";
  return <Stack direction="row" sx={{ gap: 0.75, alignItems: "center", flexWrap: "wrap", minWidth: 0 }}>
    <Chip size="small" label={type || "Type not recorded"} sx={{ bgcolor: tone.soft, color: tone.color, border: `1px solid ${tone.border}`, fontWeight: 700 }} />
    <Chip size="small" label={active ? "Active" : "Inactive"} sx={{ bgcolor: active ? "#DCFCE7" : "#FEE2E2", color: active ? "#15803D" : "#B91C1C", fontWeight: 700 }} />
  </Stack>;
}

export function ViewToggle({value,onChange,label="Customer view"}) {
  return <ToggleButtonGroup size="small" exclusive value={value} onChange={(_,next)=>next&&onChange(next)} aria-label={label}>
    <Tooltip title="Cards"><ToggleButton value="cards" aria-label="Card view"><GridViewOutlinedIcon fontSize="small"/></ToggleButton></Tooltip>
    <Tooltip title="List"><ToggleButton value="list" aria-label="List view"><ViewListOutlinedIcon fontSize="small"/></ToggleButton></Tooltip>
  </ToggleButtonGroup>;
}
export function ContactActions({customer,compact=false}) {
  const phone=phoneNumber(customer.mobile_number);
  return <Stack direction="row" sx={{gap:1,flexWrap:"wrap"}}>
    <Button size="small" variant="outlined" color="success" component="a" href={phone?`tel:+${phone}`:undefined} disabled={!phone} startIcon={<PhoneOutlinedIcon/>}>{compact?"Call":"Call customer"}</Button>
    <Button size="small" variant="contained" component="a" href={phone?`https://wa.me/${phone}`:undefined} target="_blank" rel="noopener noreferrer" disabled={!phone} startIcon={<WhatsAppIcon/>} sx={{ bgcolor:"#15803D", color:"#fff", "&:hover":{bgcolor:"#166534"}, "&.Mui-disabled":{bgcolor:"#E2E8F0",color:"#94A3B8"} }}>WhatsApp</Button>
    {!compact&&customer.email&&<Button size="small" variant="outlined" color="info" component="a" href={`mailto:${customer.email}`} startIcon={<EmailOutlinedIcon/>}>Email</Button>}
  </Stack>;
}
export function Metric({label,value,hint,color="text.primary",icon:Icon,tone="blue"}) {
  const palette = {
    blue: { main:"#0369A1", soft:"#E0F2FE", border:"#BAE6FD" },
    green: { main:"#15803D", soft:"#DCFCE7", border:"#BBF7D0" },
    amber: { main:"#B45309", soft:"#FEF3C7", border:"#FDE68A" },
    violet: { main:"#6D28D9", soft:"#EDE9FE", border:"#DDD6FE" },
    red: { main:"#B91C1C", soft:"#FEE2E2", border:"#FECACA" },
  }[tone] || { main:"#0369A1", soft:"#E0F2FE", border:"#BAE6FD" };
  return <Paper variant="outlined" sx={{p:2.25,borderRadius:3,height:"100%",boxShadow:"none",position:"relative",overflow:"hidden",borderColor:"#E2E8F0",backgroundColor:"#FFFFFF"}}>
    <Stack direction="row" sx={{justifyContent:"space-between",alignItems:"center",gap:1}}>
      <Typography variant="body2" color="text.secondary" sx={{fontWeight:600}}>{label}</Typography>
      {Icon&&<Avatar sx={{width:34,height:34,bgcolor:palette.soft,color:palette.main,borderRadius:2}}><Icon fontSize="small"/></Avatar>}
    </Stack>
    <Typography variant="h5" sx={{fontWeight:700,mt:0.75,color:color==="text.primary"?"#1E293B":color,fontVariantNumeric:"tabular-nums"}}>{value}</Typography>
    {hint&&<Typography variant="caption" color="text.secondary" sx={{display:"block",mt:0.5}}>{hint}</Typography>}
  </Paper>;
}
export function Field({label,value,valueColor="text.primary"}) {
  return <Box sx={{minWidth:0}}><Typography variant="caption" color="text.secondary">{label}</Typography><Typography variant="body2" sx={{fontWeight:700,mt:0.25,whiteSpace:"pre-wrap",color:valueColor}}>{value ?? "Not recorded"}</Typography></Box>;
}
