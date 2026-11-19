const router=require('express').Router();
const trial=require('../services/publicTrial');
const {masterDb}=require('../config/masterDb');
const {provisionNewClient}=require('../services/clientProvisionService');
router.use((req,res,next)=>{
  res.set('Cache-Control','no-store');
  const host=String(req.headers.host||'').split(':')[0];
  if(!['solops.cloud','www.solops.cloud','localhost','127.0.0.1'].includes(host)) return res.status(404).json({success:false,message:'Not found.'});
  if(req.headers.origin && !['https://solops.cloud','https://www.solops.cloud'].includes(req.headers.origin)) return res.status(403).json({success:false,message:'Use the SolOps website to register.'});
  next();
});
const run=fn=>async(req,res)=>{try{const ip=String(req.headers['x-real-ip']||req.socket.remoteAddress||'').slice(0,100);const data=await fn(req.body||{},ip);res.json({success:true,data});}catch(e){if(!e.status)console.error('Trial signup error',e.code||e.name);res.status(e.status||503).json({success:false,message:e.status?e.message:'Trial signup is temporarily unavailable. Please contact +91 90241 54995.'});}};
router.post('/request-code',run((body,ip)=>trial.requestCode(masterDb,body,ip)));
router.post('/complete',run((body,ip)=>trial.complete(masterDb,body,ip,provisionNewClient)));
module.exports=router;
