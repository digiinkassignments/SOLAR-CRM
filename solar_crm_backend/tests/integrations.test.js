const test=require('node:test');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const http=require('node:http');
const express=require('express');
const jwt=require('jsonwebtoken');
process.env.INTEGRATION_ENCRYPTION_KEY='ab'.repeat(32);process.env.JWT_SECRET='integration-test-only-secret';
const security=require('../utils/integrationSecurity');
test('encrypted credentials bind to tenant/provider and signatures fail closed',()=>{const encrypted=security.encrypt({access_token:'private'},'5:meta_ads');assert(!encrypted.includes('private'));assert.equal(security.decrypt(encrypted,'5:meta_ads').access_token,'private');assert.throws(()=>security.decrypt(encrypted,'6:meta_ads'));const raw=Buffer.from('{"test":1}');const sig='sha256='+crypto.createHmac('sha256','secret').update(raw).digest('hex');assert(security.signature(raw,'secret',sig));assert(!security.signature(Buffer.from('{}'),'secret',sig));assert(!security.signature(null,'secret',sig));assert.equal(security.leadFields([{column_id:'FULL_NAME',string_value:'Test Lead'},{column_id:'PHONE_NUMBER',string_value:'+919999999999'}],true).mobile_number,'+919999999999');});
test('tenant admin configuration, Google deduplication, Meta signatures and WhatsApp dispatch use mocked providers',async()=>{
 const configs=new Map(),events=new Map();let leadCount=0,outbound=0;
 const db={getConnection:async()=>db,beginTransaction:async()=>{},commit:async()=>{},rollback:async()=>{},release:()=>{},query:async(sql,params=[])=>{
  if(sql.startsWith('CREATE'))return [[]];
  if(sql.startsWith('SELECT * FROM crm_integrations'))return [configs.has(params[0])?[configs.get(params[0])]:[]];
  if(sql.startsWith('SELECT id,provider'))return [[]];
  if(sql.startsWith('INSERT INTO crm_integrations')){configs.set(params[0],{provider:params[0],config_json:params[1],secrets_encrypted:params[2],enabled:params[3],verified_at:null});return [{affectedRows:1}];}
  if(sql.startsWith('INSERT INTO crm_integration_events')){const key=params[0]+':'+params[1];if(events.has(key)){const error=Error('duplicate');error.code='ER_DUP_ENTRY';throw error;}events.set(key,true);return [{insertId:1}];}
  if(sql.startsWith('INSERT INTO leads'))return [{insertId:++leadCount}];
  if(sql.startsWith('UPDATE crm_integrations SET verified_at')){configs.get(params[0]).verified_at=new Date();}
  return [{affectedRows:1}];
 }};
 const app=express();app.use(express.json({verify:(req,res,buffer)=>req.integrationRawBody=buffer}));app.use((req,res,next)=>{req.clientInfo={id:5};req.db=db;next();});app.use('/api/integrations',require('../routes/integrationRoutes'));
 const server=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});
 const originalFetch=global.fetch;global.fetch=async(url,options)=>{if(options?.method==='POST'){outbound++;return {ok:true,json:async()=>({messages:[{id:'msg-test'}]})};}return {ok:true,json:async()=>({id:'123',field_data:[{name:'full_name',values:['Meta Lead']},{name:'phone_number',values:['+919999999998']}]})};};
 const token=jwt.sign({id:1,role_id:1,client_id:5},process.env.JWT_SECRET);
 const request=(method,path,body,auth=token,headers={})=>new Promise((resolve,reject)=>{const data=body?JSON.stringify(body):'';const req=http.request({hostname:'127.0.0.1',port:server.address().port,path:'/api/integrations'+path,method,headers:{'Content-Type':'application/json',...(auth?{Authorization:'Bearer '+auth}:{}),...headers}},res=>{let text='';res.on('data',chunk=>text+=chunk);res.on('end',()=>resolve({status:res.statusCode,text}));});req.on('error',reject);req.end(data);});
 try{
  assert.equal((await request('GET','/',null,null)).status,401);
  assert.equal((await request('GET','/',null,jwt.sign({id:1,role_id:1,client_id:6},process.env.JWT_SECRET))).status,403);
  assert.equal((await request('PUT','/google_ads',{enabled:true})).status,400);
  assert.equal((await request('PUT','/google_ads',{enabled:true,secrets:{webhook_key:'google-key-123456789'}})).status,200);
  const google={google_key:'google-key-123456789',lead_id:'lead-1',user_column_data:[{column_id:'FULL_NAME',string_value:'Google Lead'},{column_id:'PHONE_NUMBER',string_value:'9999999999'}]};
  assert.equal((await request('POST','/webhooks/google_ads',{...google,google_key:'wrong'},null)).status,403);
  assert.equal((await request('POST','/webhooks/google_ads',{...google,is_test:true},null)).status,200);assert.equal(leadCount,0);
  assert.equal((await request('POST','/webhooks/google_ads',google,null)).status,200);
  assert.equal((await request('POST','/webhooks/google_ads',google,null)).status,200);assert.equal(leadCount,1);
  await request('PUT','/meta_ads',{enabled:true,config:{page_id:'123'},secrets:{webhook_key:'meta-key-123456789',app_secret:'meta-secret',access_token:'secret-access-token'}});
  const meta={object:'page',entry:[{id:'123',changes:[{field:'leadgen',value:{leadgen_id:'456'}}]}]};
  assert.equal((await request('POST','/webhooks/meta_ads',meta,null)).status,403);
  const sig='sha256='+crypto.createHmac('sha256','meta-secret').update(JSON.stringify(meta)).digest('hex');assert.equal((await request('POST','/webhooks/meta_ads',meta,null,{'x-hub-signature-256':sig})).status,200);assert.equal(leadCount,2);
  const list=await request('GET','/');assert(!list.text.includes('secret-access-token'));assert(!list.text.includes('meta-secret'));
  await request('PUT','/whatsapp',{enabled:true,config:{waba_id:'456',phone_number_id:'123'},secrets:{webhook_key:'whatsapp-key-123456',app_secret:'wa-secret',access_token:'wa-access'}});
  assert.equal((await request('POST','/whatsapp/verify',{})).status,200);
  const message={to:'919999999999',template:'hello_world',language:'en_US',parameters:[]};
  assert.equal((await request('POST','/whatsapp/send-template',message)).status,400);assert.equal(outbound,0);
  assert.equal((await request('POST','/whatsapp/send-template',{...message,consent:true})).status,200);assert.equal(outbound,1);
 }finally{global.fetch=originalFetch;await new Promise(resolve=>server.close(resolve));}
});
