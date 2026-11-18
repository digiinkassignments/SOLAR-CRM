import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Box, Button, TextField, MenuItem, Typography, CircularProgress, IconButton, InputAdornment, Alert } from '@mui/material';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import CloseIcon from '@mui/icons-material/Close';
import {useAuth} from '../../context/AuthContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import {createCustomer} from '../../services/customerService';
const fresh=()=>({customer_name:'',mobile_number:'',alternate_number:'',email:'',address:'',city:'',state:'',pincode:'',electricity_consumer_number:'',discom_name:'',sanctioned_load_kw:'',customer_gstin:'',solar_requirement:'Residential',lead_source:'',notes:'',invoice_amount:'',invoice_reference:'',payment_amount:'',payment_date:new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata'}).format(new Date()),payment_mode:'Bank Transfer',payment_reference:'',request_key:crypto.randomUUID()});
const sections=[
 ['Customer information','Contact details and how this customer found you.',[['customer_name','Customer / business name',true],['mobile_number','Primary mobile number',true,'tel'],['alternate_number','Alternate phone',false,'tel'],['email','Email address',false,'email'],['solar_requirement','Customer type',false,'select',['Residential','Commercial','Industrial']],['customer_gstin','GSTIN'],['lead_source','Lead source']]],
 ['Installation address','The site where the solar system will be installed.',[['address','Site address',false,'multiline'],['city','City'],['state','State'],['pincode','PIN code']]],
 ['Electricity connection','Optional utility details for survey and application work.',[['electricity_consumer_number','CA / consumer number'],['discom_name','DISCOM provider'],['sanctioned_load_kw','Sanctioned load (kW)',false,'number']]],
];
const grid={display:'grid',gridTemplateColumns:{xs:'1fr',sm:'repeat(2,minmax(0,1fr))'},gap:2.5};
const card={p:{xs:2,sm:3},border:'1px solid #E2E8F0',borderRadius:2,bgcolor:'#fff'};
export default function AddCustomerModal({open,onClose,onCustomerCreated}){
 const {user}=useAuth(),managerMode=Number(user?.role_id)===2;
 const [data,setData]=useState(fresh),[team,setTeam]=useState([]),[saving,setSaving]=useState(false),[error,setError]=useState('');
 useEffect(()=>{if(open){setData(fresh());setError('');if(managerMode)api.get('/users/team').then(r=>setTeam(r.data.data||[])).catch(()=>setError('Sales team could not be loaded. Please reopen this form.'));}},[open,managerMode]);
 const change=e=>{setError('');setData(previous=>({...previous,[e.target.name]:e.target.value}));};
 const close=()=>{if(!saving)onClose();};
 const field=([name,label,required=false,type='text',options])=><TextField key={name} name={name} label={label} required={required} fullWidth size="small" value={data[name]??''} onChange={change} type={['number','date','email','tel'].includes(type)?type:'text'} select={type==='select'} multiline={type==='multiline'} minRows={type==='multiline'?2:undefined} slotProps={{inputLabel:type==='date'?{shrink:true}:undefined,htmlInput:type==='number'?{min:0,step:'0.01'}:{maxLength:name==='notes'?2000:name==='address'?2000:150}}} sx={{minWidth:0,gridColumn:type==='multiline'?'1 / -1':undefined}}>{options?.map(value=><MenuItem key={value} value={value}>{value}</MenuItem>)}</TextField>;
 const moneyField=(name,label)=><TextField name={name} label={label} value={data[name]} onChange={change} fullWidth size="small" type="number" slotProps={{htmlInput:{min:0,max:9999999999.99,step:'0.01'},input:{startAdornment:<InputAdornment position="start">Rs.</InputAdornment>}}}/>;
 const submit=async e=>{e.preventDefault();if(saving)return;const total=Number(data.invoice_amount||0),paid=Number(data.payment_amount||0);
 if(!data.customer_name.trim()||!data.mobile_number.trim())return setError('Customer name and primary mobile number are required.');
 if(managerMode&&!data.assigned_to)return setError('Choose a salesperson in your team.');
 if(!Number.isFinite(total)||!Number.isFinite(paid)||total<0||paid<0||paid>total)return setError('Enter valid amounts. Payment received cannot exceed the invoice amount.');
 if(paid>0&&!data.payment_date)return setError('Enter the payment date.');
 setSaving(true);setError('');try{const res=await createCustomer(data);if(!res?.success)throw Error(res?.message||'Could not create customer.');toast.success('Customer created successfully.');onCustomerCreated?.();onClose();}catch(err){setError(err.response?.data?.message||err.message||'Could not create customer. Retry safely.');}finally{setSaving(false);}};
 return <Dialog open={open} onClose={close} maxWidth="md" fullWidth aria-labelledby="add-customer-title" PaperProps={{sx:{borderRadius:3,m:{xs:1,sm:3},width:{xs:'calc(100% - 16px)',sm:'calc(100% - 48px)'},maxHeight:'calc(100dvh - 32px)',overflow:'hidden'}}}>
 <DialogTitle id="add-customer-title" component="div" sx={{px:{xs:2,sm:3},py:2.5,borderBottom:'1px solid #E2E8F0',display:'flex',alignItems:'center',gap:1.5}}><Box sx={{display:'flex',p:1.2,bgcolor:'#EFF6FF',color:'#0369A1',borderRadius:2}}><PersonAddOutlinedIcon/></Box><Box sx={{flex:1,minWidth:0}}><Typography component="h2" variant="h6" fontWeight={700}>Add customer</Typography><Typography variant="body2" color="text.secondary">Customer details, site information and opening payment record.</Typography></Box><IconButton aria-label="Close add customer" disabled={saving} onClick={close}><CloseIcon/></IconButton></DialogTitle>
 <Box component="form" onSubmit={submit} sx={{display:'flex',flexDirection:'column',minHeight:0,overflow:'hidden'}}>
 <DialogContent sx={{p:{xs:1.5,sm:3},bgcolor:'#F8FAFC',display:'flex',flexDirection:'column',gap:2.5,overflowY:'auto'}}>
 {error&&<Alert severity="error" role="alert">{error}</Alert>}
 {managerMode&&<Box sx={card}><TextField select required fullWidth size="small" label="Assigned salesperson" name="assigned_to" value={data.assigned_to||''} onChange={change}>{team.map(rep=><MenuItem key={rep.id} value={rep.id}>{rep.full_name}</MenuItem>)}</TextField></Box>}
 {sections.map(([title,description,fields])=><Box key={title} sx={card}><Typography component="h3" fontWeight={700} sx={{mb:.5}}>{title}</Typography><Typography variant="body2" color="text.secondary" sx={{mb:3}}>{description}</Typography><Box sx={grid}>{fields.map(field)}</Box></Box>)}
 <Box sx={card}><Typography component="h3" fontWeight={700} sx={{mb:.5}}>Invoice amount & payment record</Typography><Typography variant="body2" color="text.secondary" sx={{mb:3}}>Optional opening record for an existing invoice. Create new tax invoices from Invoices; do not enter the same invoice twice.</Typography><Box sx={grid}>{moneyField('invoice_amount','Invoice amount')}{field(['invoice_reference','Existing invoice number / reference'])}{moneyField('payment_amount','Payment received')}<Box sx={{borderRadius:1.5,bgcolor:'#F8FAFC',px:2,py:1,border:'1px solid #E2E8F0'}}><Typography variant="caption" color="text.secondary">Opening balance due</Typography><Typography fontWeight={700}>Rs. {Math.max(0,Number(data.invoice_amount||0)-Number(data.payment_amount||0)).toLocaleString('en-IN',{maximumFractionDigits:2})}</Typography></Box>{Number(data.payment_amount)>0&&<>{field(['payment_date','Payment date',true,'date'])}{field(['payment_mode','Payment mode',true,'select',['Bank Transfer','UPI','Cash','Cheque','Card','Other']])}{field(['payment_reference','Transaction / receipt reference'])}</>}</Box></Box>
 <Box sx={card}>{field(['notes','Notes / site instructions',false,'multiline'])}</Box>
 </DialogContent><DialogActions sx={{px:{xs:2,sm:3},py:2,borderTop:'1px solid #E2E8F0',gap:1,flexWrap:'wrap'}}><Button onClick={close} disabled={saving} sx={{color:'text.secondary'}}>Cancel</Button><Button type="submit" disabled={saving} variant="contained" startIcon={saving?<CircularProgress size={16} color="inherit"/>:<PersonAddOutlinedIcon/>} sx={{bgcolor:'#0F172A',px:3,'&:hover':{bgcolor:'#020617'}}}>{saving?'Saving customer…':'Save customer'}</Button></DialogActions>
 </Box></Dialog>;
}
