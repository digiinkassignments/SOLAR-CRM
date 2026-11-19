// Only website-created trials use this exact-time expiry guard. Paid/manual clients are unchanged.
const {masterDb}=require('../config/masterDb');
let available=false;
module.exports=async(req,res,next)=>{
  if(!req.clientInfo || !req.path.startsWith('/api/')) return next();
  try{
    if(!available){const [tables]=await masterDb.query("SHOW TABLES LIKE 'public_trial_signups'");if(!tables.length)return next();available=true;}
    const [[trial]]=await masterDb.query(`SELECT t.trial_end_at,c.subscription_end,c.plan_id,c.status,
      (t.trial_end_at<=UTC_TIMESTAMP()) AS expired
      FROM public_trial_signups t JOIN clients c ON c.id=t.client_id
      WHERE t.client_id=? AND t.state='active' LIMIT 1`,[req.clientInfo.id]);
    if(!trial||!trial.expired||new Date(trial.subscription_end).toISOString().slice(0,10)>new Date(trial.trial_end_at).toISOString().slice(0,10)) return next();
    req.clientInfo={...req.clientInfo,status:'Locked'};
    if(req.path==='/api/subscription/status'){
      const json=res.json.bind(res);
      res.json=body=>{
        if(body.success && body.data){
          body.data.status='Locked';
          if(body.data.client) Object.assign(body.data.client,{status:'Locked',is_locked:true,days_left:0});
          if(body.data.banner) Object.assign(body.data.banner,{show:true,type:'error',message:'Your free trial has ended. Please renew to continue.'});
        }
        return json(body);
      };
    }
    if(req.path.startsWith('/api/subscription/')||req.path.startsWith('/api/auth/'))return next();
    return res.status(403).json({success:false,subscription_status:'Locked',message:'Your free trial has ended. Please renew to continue.'});
  }catch(e){console.error('Trial expiry check failed',e.code||e.name);return res.status(503).json({success:false,message:'Unable to verify subscription. Please retry.'});}
};
