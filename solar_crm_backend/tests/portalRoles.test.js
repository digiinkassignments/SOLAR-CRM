const test=require('node:test'),assert=require('node:assert/strict'),jwt=require('jsonwebtoken');
const policy=require('../services/portalRoles'),context=require('../middleware/portalContext');
process.env.JWT_SECRET='test-only-portal-policy-secret';
test('each portal permits its own modules and denies unrelated administration',()=>{
 for(const path of ['/api/stock/items','/api/quotations','/api/invoices/2/payments','/api/customers/3/payment-plans/2','/api/calculator/save'])assert.equal(policy.allowed('finance','POST',path),true,path);
 for(const path of ['/api/subsidy/apply','/api/loans/2/upload-doc'])assert.equal(policy.allowed('application-manager','POST',path),true,path);
 for(const role of ['finance','application-manager'])for(const path of ['/api/users','/api/roles','/api/settings','/api/projects','/api/leads/1/assign','/api/integrations','/api/sales-workflow/settings','/api/quotation-governance/1/approval'])assert.equal(policy.allowed(role,'POST',path),false,role+path);
 assert.equal(policy.allowed('finance','GET','/api/subsidy/list'),true);
 assert.equal(policy.allowed('finance','POST','/api/subsidy/apply'),false);
 assert.equal(policy.allowed('application-manager','GET','/api/invoices'),false);
 assert.equal(policy.allowed('application-manager','GET','/api/stock/items'),false);
 assert.equal(policy.allowed('finance','PUT','/api/leads/2'),false);
 assert.equal(policy.allowed('finance','GET','/api/leads/2'),true);
 assert.equal(policy.allowed('application-manager','GET','/api/leads/2/followups'),false);
});
test('roles seed with database-assigned IDs without overwriting existing roles',async()=>{
 const rows=[{id:9,role_name:'Custom Auditor',is_system:0}];let writes=0;
 const db={query:async(sql,args)=>{if(sql.startsWith('SELECT'))return [rows.filter(r=>r.role_name===args[0])];writes++;rows.push({id:rows.length+20,role_name:args[0],is_system:1});return [{insertId:rows.at(-1).id}];}};
 await policy.ensurePortalRoles(db);await policy.ensurePortalRoles(db);assert.equal(writes,2);assert.equal(rows[0].role_name,'Custom Auditor');assert.equal(rows[1].id,21);assert.equal(rows[2].id,22);
});
test('seed refuses to convert an existing custom role into a portal',async()=>{
 await assert.rejects(()=>policy.ensurePortalRoles({query:async()=>[[{id:7,is_system:0}]]}),/already used/);
});
async function request({role='Finance',path='/api/invoices',method='GET',client=10,claimClient=10,currentRoleId=8,claimRoleId=8,status='Active',portalClaim,deleted=0}={}){
 let next=false,code=200,body;
 const req={path,method,query:{},headers:{authorization:'Bearer '+jwt.sign({id:99,role_id:claimRoleId,client_id:claimClient,...(portalClaim?{portal_role:portalClaim}:{})},process.env.JWT_SECRET)},clientInfo:{id:client},db:{query:async sql=>sql.includes('JOIN roles')?[[{role_id:currentRoleId,role_name:role,status,is_deleted:deleted}]]:[[{id:1,customer_name:'Customer'}]]}};
 const res={status:n=>{code=n;return res},json:data=>{body=data;return res}};
 await context(req,res,()=>{next=true});return {req,next,code,body};
}
test('finance privilege is resolved from current tenant role, not arbitrary JWT permissions',async()=>{
 const r=await request();assert.equal(r.next,true);assert.equal(r.req.portalRole,'finance');
 assert.equal((await request({path:'/api/users'})).code,403);
 assert.equal((await request({path:'/api/subsidy/list'})).next,true); // Dedicated tracker guard provides masked read-only data.
});
test('application manager only reaches subsidy and loan operations',async()=>{
 assert.equal((await request({role:'Application Manager',path:'/api/subsidy/apply',method:'POST'})).next,true);
 assert.equal((await request({role:'Application Manager',path:'/api/loans'})).next,true);
 assert.equal((await request({role:'Application Manager',path:'/api/customers'})).code,403);
});
test('cross-tenant, revoked and deactivated portal sessions fail closed',async()=>{
 assert.equal((await request({claimClient:11})).code,403);
 assert.equal((await request({claimClient:null})).code,403);
 assert.equal((await request({claimRoleId:1})).code,401);
 assert.equal((await request({status:'Inactive'})).code,401);
 assert.equal((await request({deleted:1})).code,401);
 assert.equal((await request({role:'Sales',portalClaim:'finance'})).code,401);
});
test('lead selector is read-only and does not invoke sales-management handlers',async()=>{
 const r=await request({path:'/api/leads'});assert.equal(r.next,false);assert.equal(r.body.success,true);assert.equal(r.body.data.length,1);
 assert.equal((await request({path:'/api/leads/2',method:'PUT'})).code,403);
});
test('existing admin role keeps existing route handling',async()=>{
 const r=await request({role:'Super Admin',currentRoleId:1,claimRoleId:1,path:'/api/users'});assert.equal(r.next,true);assert.equal(r.req.portalRole,undefined);
});
