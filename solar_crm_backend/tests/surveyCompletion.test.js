const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm'),path=require('path');
const {createRequire}=require('module');const backendRequire=createRequire(path.resolve(__dirname,'../package.json'));
const definitions=require('../services/field/definitions');
const data={roof_type:'RCC Flat Roof',roof_area_sqft:500,roof_condition:'Good',roof_orientation:'South-East',roof_ownership:'Self-Owned Freehold (No NOC required)',shading:'None',electrical_phase:'Single Phase',sanctioned_load_kw:5,consumer_number:'123456789',proposed_capacity_kw:5,feasibility_verdict:'Feasible'};
test('survey completion requires technical details but no checklist or private evidence',()=>{
 assert.equal(definitions.definitions.survey.evidence,false);assert.equal(definitions.definitions.survey.checks.length,0);
 assert.equal(definitions.validate('survey',data,true),null);
 assert.match(definitions.validate('survey',{...data,consumer_number:''},true),/Consumer number/);
 assert.match(definitions.validate('survey',{...data,feasibility_verdict:'Not feasible'},true),/Reason/);
});
for(const verdict of ['Feasible','Feasible with conditions','Not feasible'])test(`survey submit without files completes ${verdict} record`,async()=>{
 const d={...data,feasibility_verdict:verdict,not_feasible_reason:'Other technical / electrical constraints'};const writes=[];let committed=false,converted=false;
 const e={id:2,resource_type:'survey',resource_id:7,created_by:4,status:'Draft',version:1,kind:'survey',data_json:JSON.stringify(d)};
 const c={beginTransaction:async()=>{},commit:async()=>{committed=true},rollback:async()=>{},release:()=>{},query:async(sql,args)=>{
  if(sql.startsWith('SELECT * FROM crm_field_entries'))return [[e]];
  if(sql.includes('COUNT(*) AS total FROM crm_field_files'))return [[{total:0}]];
  if(sql.startsWith('SELECT lead_id FROM site_surveys'))return [[{lead_id:10}]];
  writes.push({sql,args});return [{affectedRows:1}];
 }};
 const w={...definitions,resource:async()=>({id:7,lead_id:10,status:'scheduled'}),event:async()=>{}};
 const module={exports:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../routes/fieldWorkRoutes.js'),'utf8'),{module,exports:module.exports,__dirname:path.join(__dirname,'../routes'),Buffer,console,require:name=>{
  if(name==='../services/field/workflow')return w;
  if(name==='../middleware/authMiddleware')return {verifyToken:()=>{}};
  if(name==='../services/salesWorkflow')return {preferences:async()=>({timezone:'Asia/Kolkata'}),localClock:()=>({date:'2026-11-18'})};
  if(name==='../services/surveyBooking')return {};
  if(name==='../services/surveyConversion')return {convertFeasibleSurvey:async()=>{converted=true;return verdict==='Feasible'?{customer_id:8,project_id:9}:null}};
  return backendRequire(name);
 }});
 const layer=module.exports.stack.find(l=>l.route?.path==='/entries/:entryId/submit');let status=200,body;
 const res={status:s=>{status=s;return res},json:b=>{body=b;return res}};
 await layer.route.stack[0].handle({db:{getConnection:async()=>c},user:{id:4,role_id:4},params:{entryId:2},body:{version:1}},res);
 assert.equal(status,200,JSON.stringify(body));assert.equal(body.success,true);assert.equal(committed,true);assert.equal(converted,true);
 const update=writes.find(q=>q.sql.startsWith('UPDATE crm_field_entries SET status='));assert.equal(update.args[0],'Completed');
 assert.equal(Boolean(body.data),verdict==='Feasible');
});
