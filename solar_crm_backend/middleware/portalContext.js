const jwt=require('jsonwebtoken');
const policy=require('../services/portalRoles');
module.exports=async(req,res,next)=>{
  if(!req.path.startsWith('/api/'))return next();
  const token=req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
  if(!token)return next();
  let decoded;try{decoded=jwt.verify(token,process.env.JWT_SECRET);}catch{return next();}
  if(decoded.role==='super_admin' && req.path.startsWith('/api/superadmin/'))return next();
  // Public customer links must remain usable even with an unrelated browser session.
  if(/^\/api\/(quotations|invoices)\/public\//.test(req.path) || /^\/api\/auth\/(login|forgot-password|reset-password|tenant-info)$/.test(req.path))return next();
  if(req.clientInfo?.id && decoded.client_id && Number(req.clientInfo.id)!==Number(decoded.client_id))return res.status(403).json({success:false,message:'Sign in to this company again.'});
  try{
    const [[current]]=await req.db.query('SELECT u.role_id,u.status,u.is_deleted,r.role_name FROM users u JOIN roles r ON r.id=u.role_id WHERE u.id=? LIMIT 1',[decoded.id]);
    const role=policy.portalRole(current?.role_name);
    if(!role && !decoded.portal_role)return next();
    if(!current || current.is_deleted || current.status!=='Active' || Number(current.role_id)!==Number(decoded.role_id) || !role)return res.status(401).json({success:false,message:'Your access changed. Sign in again.'});
    if((decoded.client_id && !req.clientInfo?.id) || (req.clientInfo?.id && Number(req.clientInfo.id)!==Number(decoded.client_id)))return res.status(403).json({success:false,message:'Sign in to this company again.'});
    if(!policy.allowed(role,req.method,req.path))return res.status(403).json({success:false,message:'This module is not available in your portal.'});
    req.portalRole=role;
    if(req.method==='GET' && req.path.replace(/\/+$/,'')==='/api/settings'){
      const [settings]=await require('../models/settingsModel').getSettings(req.db);
      const fields=['id','company_name','company_logo','company_email','company_phone','address','company_address','city','state','pincode','gst_number','website','quotation_template','bank_name','account_name','account_number','ifsc_code','branch_name','upi_id'];
      return res.json({success:true,data:Object.fromEntries(fields.filter(key=>Object.hasOwn(settings||{},key)).map(key=>[key,settings[key]]))});
    }
    // Lead data is only a selector/contact lookup here, never a sales-management API.
    if(req.method==='GET' && /^\/api\/leads(?:\/\d+)?\/?$/.test(req.path)){
      const id=req.path.match(/\/(\d+)\/?$/)?.[1];
      const limit=Math.min(500,Math.max(1,Number(req.query.limit)||150));
      const [rows]=await req.db.query('SELECT id,lead_code,customer_name,mobile_number,email,address,city,state,pincode,required_kw,quotation_amount,consumer_number,status FROM leads WHERE is_deleted=0'+(id?' AND id=?':'')+' ORDER BY id DESC LIMIT ?',id?[id,1]:[limit]);
      if(id&&!rows.length)return res.status(404).json({success:false,message:'Customer lookup not found.'});
      return res.json({success:true,data:id?rows[0]:rows});
    }
    next();
  }catch(error){console.error('Portal access check:',error.code||error.message);res.status(503).json({success:false,message:'Portal access check unavailable. Please retry.'});}
};
