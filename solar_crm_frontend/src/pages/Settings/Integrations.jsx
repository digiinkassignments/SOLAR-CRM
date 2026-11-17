import { useCallback, useEffect, useState } from "react";
import { Alert, Box, Button, Checkbox, Chip, CircularProgress, FormControlLabel, Paper, Stack, Switch, Tab, Tabs, TextField, Typography } from "@mui/material";
import HubOutlinedIcon from "@mui/icons-material/HubOutlined";
import api from "../../api/axios";
import toast from "react-hot-toast";
const providers = {
 meta_ads: { title: "Meta Ads", description: "Import Facebook and Instagram instant-form leads into your CRM.", fields: [["page_id", "Facebook Page ID"]], docs: "https://developers.facebook.com/docs/graph-api/webhooks/getting-started/webhooks-for-leadgen", steps: "Add the callback URL and verify token in your Meta app's Page webhooks. Subscribe to leadgen, then subscribe your Page to the app. The Page token needs leads_retrieval and access to the Page/forms." },
 google_ads: { title: "Google Ads", description: "Receive Google Ads lead-form submissions automatically.", fields: [], docs: "https://developers.google.com/google-ads/webhook/docs/implementation", steps: "In your Google Ads lead form, add this webhook URL and key, then send test data. A valid test verifies delivery without creating a sample CRM lead. This connection imports lead forms; it does not change campaigns or ad budgets." },
 whatsapp: { title: "WhatsApp Business API", description: "Send approved Cloud API templates and track incoming/delivery events.", fields: [["waba_id", "WhatsApp Business Account ID"], ["phone_number_id", "Phone Number ID"]], docs: "https://developers.facebook.com/docs/whatsapp/cloud-api", steps: "Add this callback URL and verify token to your WhatsApp app webhooks and subscribe to messages. Use a system-user token with WhatsApp permissions. Sending requires an approved text-body template and an opted-in recipient. Incoming message content is not stored here; activity records message type and sender." },
};
export default function Integrations() {
 const [provider,setProvider]=useState("meta_ads"), [records,setRecords]=useState([]),[events,setEvents]=useState([]),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const [drafts,setDrafts]=useState({});
 const [message,setMessage]=useState({to:"",template:"",language:"en_US",parameters:"",consent:false});
 const refresh=useCallback(async()=>{try{const response=await api.get('/integrations');setRecords(response.data.data.integrations);setEvents(response.data.data.events);setError("");}catch(e){setError(e.response?.data?.message||"Integrations could not be loaded.");}finally{setLoading(false);}},[]);
 useEffect(()=>{const controller=new AbortController();api.get("/integrations",{signal:controller.signal}).then(response=>{setRecords(response.data.data.integrations);setEvents(response.data.data.events);setError("");}).catch(e=>{if(!controller.signal.aborted)setError(e.response?.data?.message||"Integrations could not be loaded.");}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});return ()=>controller.abort();},[]);
 const record=records.find(r=>r.provider===provider), details=providers[provider];
 const form=drafts[provider]||{config:{api_version:"v26.0",...(record?.config||{})},secrets:{webhook_key:record?.webhook_key||""},enabled:record?.enabled||false};
 const setForm=(updater)=>setDrafts(previous=>({...previous,[provider]:typeof updater==="function"?updater(previous[provider]||form):updater}));
 const update=(group,key,value)=>setForm(previous=>({...previous,[group]:{...previous[group],[key]:value}}));
 const perform=async(path,payload,method='post')=>{if(busy)return;setBusy(true);try{const response=await api[method](path,payload);toast.success(response.data.message||"Saved");await refresh();setDrafts({});}catch(e){toast.error(e.response?.data?.message||"Request failed. Please try again.");}finally{setBusy(false);}};
 const webhook=`${window.location.origin}/api/integrations/webhooks/${provider}`;
 const copy=async(value)=>{try{await navigator.clipboard.writeText(value);toast.success("Copied");}catch{toast.error("Could not copy. Select and copy the value manually.");}};
 return <Box sx={{minWidth:0}}>
  <Paper variant="outlined" sx={{p:2.5,mb:2,borderRadius:3,display:"flex",gap:1.5,alignItems:"center",flexWrap:"wrap"}}><HubOutlinedIcon sx={{color:'#0284C7'}}/><Box><Typography variant="h6" fontWeight={800}>Ads & Business integrations</Typography><Typography variant="body2" color="text.secondary">One workspace for lead capture and WhatsApp communication.</Typography></Box></Paper>
  {error&&<Alert severity="error" sx={{mb:2}} action={<Button color="inherit" onClick={refresh}>Retry</Button>}>{error}</Alert>}
  {loading?<CircularProgress size={28}/>:<>
  <Paper variant="outlined" sx={{borderRadius:3,overflow:'hidden'}}>
   <Tabs value={provider} onChange={(_,value)=>setProvider(value)} variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile aria-label="Integration providers">{Object.entries(providers).map(([key,info])=><Tab key={key} value={key} label={info.title}/>)}</Tabs>
   <Box sx={{p:{xs:2,sm:3}}}>
    <Stack direction="row" sx={{alignItems:'center',justifyContent:'space-between',gap:1,flexWrap:'wrap',mb:2}}><Box><Typography fontWeight={800}>{details.title}</Typography><Typography variant="body2" color="text.secondary" sx={{mt:0.5}}>{details.description}</Typography></Box><Chip size="small" color={record?.verified_at&&record.enabled?'success':'default'} label={!record?.enabled?'Not enabled':record.verified_at?'Credentials / delivery verified':'Setup pending'}/></Stack>
    <Alert severity="info" sx={{mb:3}}>{details.steps} <Box component="a" href={details.docs} target="_blank" rel="noopener noreferrer">Provider setup guide</Box></Alert>
    <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',md:'repeat(2,minmax(0,1fr))'},gap:2.5}}>
     <Box><Typography fontWeight={700} sx={{mb:2}}>Connection settings</Typography><Stack spacing={2}>
      {provider!=='google_ads'&&<TextField size="small" label="Meta Graph API version" value={form.config.api_version||''} onChange={e=>update('config','api_version',e.target.value)} helperText="Use the supported version configured in your Meta app."/>}
      {details.fields.map(([key,label])=><TextField key={key} size="small" label={label} value={form.config[key]||''} onChange={e=>update('config',key,e.target.value)}/>)}
      {provider!=='google_ads'&&['access_token','app_secret'].map(key=><TextField key={key} size="small" type="password" autoComplete="new-password" label={key==='access_token'?'Access token':'Meta app secret'} value={form.secrets[key]||''} onChange={e=>update('secrets',key,e.target.value)} helperText={record?.configured_secrets?.includes(key)?'Saved securely. Leave blank to keep it.':'Required to enable this connection.'}/>)}
      <FormControlLabel control={<Switch checked={form.enabled} onChange={e=>setForm(p=>({...p,enabled:e.target.checked}))}/>} label="Enable this integration"/>
      <Stack direction="row" sx={{gap:1,flexWrap:'wrap'}}><Button disabled={busy||Boolean(error)} variant="contained" onClick={()=>perform(`/integrations/${provider}`,form,'put')}>Save settings</Button><Button disabled={busy||!record?.enabled||Boolean(error)||Boolean(drafts[provider])} variant="outlined" onClick={()=>perform(`/integrations/${provider}/verify`,{})}>{provider==='google_ads'?'How to verify':'Verify credentials'}</Button></Stack>
     </Stack></Box>
     <Box><Typography fontWeight={700} sx={{mb:2}}>Webhook setup</Typography><Stack spacing={2}>
      <TextField label="Callback / webhook URL" size="small" value={webhook} slotProps={{input:{readOnly:true}}}/><Button variant="outlined" onClick={()=>copy(webhook)} sx={{alignSelf:'flex-start'}}>Copy callback URL</Button>
      <TextField size="small" label={provider==='google_ads'?'Google webhook key':'Webhook verify token'} value={form.secrets.webhook_key||''} onChange={e=>update('secrets','webhook_key',e.target.value)} helperText="Use the same value in your provider settings. Save after generating or changing it."/>
      <Stack direction="row" sx={{gap:1,flexWrap:'wrap'}}><Button variant="outlined" onClick={()=>update('secrets','webhook_key',crypto.randomUUID().replaceAll('-',''))}>Generate key</Button><Button disabled={!form.secrets.webhook_key} onClick={()=>copy(form.secrets.webhook_key)}>Copy key</Button></Stack>
      <Typography variant="caption" color="text.secondary">Last provider event: {record?.last_event_at?new Date(record.last_event_at).toLocaleString():'None received'}. Saving changes clears previous verification.</Typography>
     </Stack></Box>
    </Box>
    {provider==='whatsapp'&&<Box sx={{mt:3,pt:3,borderTop:'1px solid #E2E8F0'}}><Typography fontWeight={700} sx={{mb:2}}>Send an approved template</Typography><Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',sm:'repeat(2,minmax(0,1fr))'},gap:2}}>{[['to','Recipient phone with country code (no +)'],['template','Approved template name'],['language','Template language code']].map(([key,label])=><TextField key={key} size="small" label={label} value={message[key]} onChange={e=>setMessage(p=>({...p,[key]:e.target.value}))}/>)}<TextField size="small" multiline minRows={2} label="Body parameters (one per line, in order)" value={message.parameters} onChange={e=>setMessage(p=>({...p,parameters:e.target.value}))}/></Box><FormControlLabel control={<Checkbox checked={message.consent} onChange={e=>setMessage(p=>({...p,consent:e.target.checked}))}/>} label="This recipient has opted in to WhatsApp messages from our business."/><Box><Button variant="contained" disabled={busy||!message.consent||!record?.enabled||!record?.verified_at} onClick={()=>perform('/integrations/whatsapp/send-template',{...message,parameters:message.parameters?message.parameters.split('\n'):[]})}>Send template</Button></Box></Box>}
   </Box>
  </Paper>
  <Paper variant="outlined" sx={{p:2.5,mt:2,borderRadius:3}}><Stack direction="row" sx={{justifyContent:'space-between',alignItems:'center',mb:1}}><Typography fontWeight={700}>Recent integration activity</Typography><Button onClick={refresh} disabled={busy}>Refresh</Button></Stack>{events.length?events.map(event=><Box key={event.id} sx={{py:1.25,borderBottom:'1px solid #E2E8F0',overflowWrap:'anywhere'}}><Typography variant="body2" fontWeight={700}>{providers[event.provider]?.title} ? {event.event_type} ? {event.status}</Typography><Typography variant="caption" color="text.secondary">{new Date(event.created_at).toLocaleString()}{event.lead_id?` ? Lead #${event.lead_id}`:''}{event.detail?` ? ${event.detail}`:''}</Typography></Box>):<Typography variant="body2" color="text.secondary">No provider events yet. Configure a connection and send a provider webhook test.</Typography>}</Paper>
  </>}
 </Box>;
}
