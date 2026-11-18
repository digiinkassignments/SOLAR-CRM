const jwt=require('jsonwebtoken');
const scope=require('../utils/managerScope');
module.exports=async(req,res,next)=>{
  const token=req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
  if(!token)return next();
  let user;try{user=jwt.verify(token,process.env.JWT_SECRET);}catch{return next();}
  if(Number(user.role_id)!==2)return next();
  if(req.clientInfo?.id&&user?.client_id&&Number(user.client_id)!==Number(req.clientInfo.id))return res.status(403).json({success:false,message:'Sign out and sign in to this company again.'});
  const id=Number(user.id);if(!Number.isSafeInteger(id)||id<=0)return res.sendStatus(403);
  req.db=scope.facade(req.db,id);
  const parts=req.path.split('/').filter(Boolean);if(parts[0]!=='api')return next();
  const module=parts[1],key=parts[2],body=req.body||{};
  const allowedLead=async leadId=>{const[rows]=await req.db.query(`SELECT l.id FROM leads l WHERE l.id=? AND ${scope.leadFor(id)}`,[leadId]);return rows.length>0;};
  const allowedRep=async repId=>{const[rows]=await req.db.query(`SELECT id FROM users WHERE id=? AND manager_id=? AND role_id=3 AND is_deleted=0`,[repId,id]);return rows.length>0;};
  const deny=()=>res.status(404).json({success:false,message:'Record not found in your sales team.'});
  try{
    if(module==='leads'&&/^\d+$/.test(key||'')&&!await allowedLead(key))return deny();
    if(module==='surveys'&&key==='lead'&&!await allowedLead(parts[3]))return deny();
    if(module==='surveys'&&/^\d+$/.test(key||'')){
      const[rows]=await req.db.query('SELECT lead_id FROM site_surveys WHERE id=?',[key]);if(!rows[0]||!await allowedLead(rows[0].lead_id))return deny();
    }
    if(module==='procurement'&&key&&key!=='stats'){
      const[rows]=await req.db.query('SELECT p.lead_id FROM purchase_orders po JOIN projects p ON po.project_id=p.id WHERE po.id=?',[key]);if(!rows[0]||!await allowedLead(rows[0].lead_id))return deny();
    }
    if(['leads','customers'].includes(module)&&Object.hasOwn(body,'assigned_to')&&!await allowedRep(body.assigned_to))return res.status(403).json({success:false,message:'Choose a salesperson in your team.'});
    if(module==='leads'&&key==='bulk-import'){
      for(const row of body.leads||[])if(!await allowedRep(row.assigned_to))return res.status(400).json({success:false,message:'Every imported lead must be assigned to a salesperson in your team.'});
    }
    if(key==='bulk-delete'&&['leads','quotations','invoices'].includes(module)){
      if(!Array.isArray(body.ids)||!body.ids.length||body.ids.length>500)return res.sendStatus(400);
      for(const recordId of new Set(body.ids)){
        if(module==='leads'){if(!await allowedLead(recordId))return deny();}
        else{const[rows]=await req.db.query(`SELECT lead_id FROM ${module} WHERE id=?`,[recordId]);if(!rows[0]||!await allowedLead(rows[0].lead_id))return deny();}
      }
    }
    if(module==='users'&&key&& !['team','fcm-token'].includes(key))return res.sendStatus(403);
    if(['projects','customers','quotations','invoices','loans'].includes(module)&&key&&!(module==='customers'&&key==='bulk-import')&&!['public','stats','bulk-delete','lead','project'].includes(key)){
      const table={projects:'projects',customers:'customers',quotations:'quotations',invoices:'invoices',loans:'solar_loans'}[module];
      const where=module==='projects'?'(id=? OR project_uuid=? OR project_number=?)':'id=?';
      const values=module==='projects'?[Number(key)||0,key,key]:[key];
      const[rows]=await req.db.query(`SELECT lead_id${module==='customers'?',assigned_to':''} FROM ${table} WHERE ${where} LIMIT 1`,values);
      if(!rows[0]||!(await allowedLead(rows[0].lead_id)||(module==='customers'&&!rows[0].lead_id&&await allowedRep(rows[0].assigned_to))))return deny();
    }
    let leadId=body.lead_id;
    if(module==='subsidy'&&key&&/^\d+$/.test(key))leadId=key;
    if(module==='loans'&&key==='lead')leadId=parts[3];
    if(module==='loans'&&key==='project'){
      const[rows]=await req.db.query('SELECT lead_id FROM projects WHERE id=?',[parts[3]]);if(!rows[0])return deny();leadId=rows[0].lead_id;
    }
    if(module==='subsidy'&&key==='verify-doc'){
      const[rows]=await req.db.query('SELECT lead_id FROM customer_documents WHERE id=?',[parts[3]]);if(!rows[0])return deny();leadId=rows[0].lead_id;
    }
    if(module==='subsidy'&&key==='resolve-fix'){
      const[rows]=await req.db.query('SELECT lead_id FROM subsidy_rejection_logs WHERE id=?',[parts[3]]);if(!rows[0])return deny();leadId=rows[0].lead_id;
    }
    if(leadId&&!await allowedLead(leadId))return deny();
    for(const [field,table]of [['quotation_id','quotations'],['project_id','projects']]){
      if(!body[field])continue;
      const[rows]=await req.db.query(`SELECT lead_id FROM ${table} WHERE id=?`,[body[field]]);
      if(!rows[0]||!await allowedLead(rows[0].lead_id)||(leadId&&Number(rows[0].lead_id)!==Number(leadId)))return deny();
    }
    if(req.method==='POST'&&!key&&['projects','quotations','invoices','loans'].includes(module)&&!leadId)return res.status(400).json({success:false,message:'Select a lead assigned to a salesperson in your team.'});
    if(module==='customers'&&req.method==='POST'&&!key&&!await allowedRep(body.assigned_to))return res.status(400).json({success:false,message:'Assign this customer to a salesperson in your team.'});
    next();
  }catch(error){console.error('Manager scope check failed:',error.code||'SCOPE_FAILED');res.status(503).json({success:false,message:'Team access check unavailable.'});}
};
