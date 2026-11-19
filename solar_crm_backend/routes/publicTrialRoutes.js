'use strict';
const router=require('express').Router();
const trial=require('../services/emailFirstTrial');
const protection=require('../services/trialProtection');
const {masterDb}=require('../config/masterDb');
const {provisionNewClient}=require('../services/clientProvisionService');
const cookieName='__Host-solops_trial';
const origins=['https://solops.cloud','https://www.solops.cloud'];
router.use((req,res,next)=>{
  res.set('Cache-Control','no-store');
  const host=String(req.headers.host||'').split(':')[0];
  if(!['solops.cloud','www.solops.cloud','localhost','127.0.0.1'].includes(host)) return res.status(404).json({success:false,message:'Not found.'});
  if(req.method!=='GET' && (!origins.includes(req.headers.origin)||!req.is('application/json'))) return res.status(403).json({success:false,message:'Use the SolOps website to register.'});
  if(req.headers.origin && !origins.includes(req.headers.origin)) return res.status(403).json({success:false,message:'Use the SolOps website to register.'});
  const raw=String(req.headers.cookie||'').split(';').map(v=>v.trim()).find(v=>v.startsWith(cookieName+'='));
  req.trialId=raw?.slice(cookieName.length+1);
  const peer=req.socket.remoteAddress;
  req.trialIp=String(['127.0.0.1','::1','::ffff:127.0.0.1'].includes(peer)?req.headers['x-real-ip']||peer:peer).slice(0,100);
  next();
});
const run=fn=>async(req,res)=>{try{const data=await fn(req,res);res.json({success:true,data});}catch(e){if(!e.status)console.error('Trial signup error',e.code||e.name);res.status(e.status||503).json({success:false,message:e.status?e.message:'Trial signup is temporarily unavailable. Please contact +91 90241 54995.'});}};
router.get('/config',run(async()=>{
  await protection.execute(r=>r.ping());
  const enabled=process.env.PUBLIC_TRIAL_TURNSTILE_ENABLED==='true';
  if(enabled&&(!process.env.TURNSTILE_SITE_KEY||!process.env.TURNSTILE_SECRET_KEY)) throw Object.assign(new Error('Signup verification is temporarily unavailable.'),{status:503});
  return {human_verification:enabled,site_key:enabled?process.env.TURNSTILE_SITE_KEY:null};
}));
router.get('/session',run(req=>trial.status(masterDb,req.trialId)));
router.post('/request-code',run(async(req,res)=>{
  const result=await trial.requestCode(masterDb,req.body||{},req.trialIp,req.trialId);
  res.cookie(cookieName,result.sid,{httpOnly:true,secure:true,sameSite:'strict',path:'/',maxAge:40*60*1000});
  const {sid,...publicResult}=result; return publicResult;
}));
router.post('/verify-code',run(req=>trial.verify(req.body||{},req.trialIp,req.trialId)));
router.post('/complete',run(req=>trial.complete(masterDb,req.body||{},req.trialIp,req.trialId,provisionNewClient)));
module.exports=router;
