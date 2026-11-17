const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const b=require('../services/surveyBooking');
const place={site_address:'42 Green Road, Jaipur',landmark:'Opposite city school',site_latitude:26.91,site_longitude:75.78};
test('survey booking validates site location and normalises legacy AM/PM slots',()=>{
  assert.equal(b.time('03:30 PM'),'15:30');assert.equal(b.time('15:30:00'),'15:30');assert.equal(b.time('12:00 AM'),'00:00');assert.equal(b.time('14:00 PM'),null);
  assert.equal(b.location(place).landmark,place.landmark);
  for(const bad of [{landmark:''},{site_address:''},{site_latitude:''},{site_latitude:91},{site_longitude:181}])assert.throws(()=>b.location({...place,...bad}),{status:400});
});
test('slot conflicts use only engineer/date and exclude self, retaining completed appointments',async()=>{
  let sql,params;const db={query:async(s,p)=>{sql=s;params=p;return [[{id:9,scheduled_time:'03:30 PM'}]];}};
  await assert.rejects(b.available(db,4,'2026-11-16','15:30',2),{status:409});
  assert.match(sql,/FOR UPDATE/);assert.match(sql,/'scheduled','completed'/);assert.deepEqual(params,[4,'2026-11-16',2]);
  await b.available(db,4,'2026-11-16','17:00',2);
});
test('simultaneous sales bookings serialize and only one can claim the same engineer slot',async()=>{
  const rows=[],updates=[];let locked=false,waiters=[],nextId=1;
  const pool={query:async()=>[[]],getConnection:async()=>{
    let owns=false,inserted=[];
    return {beginTransaction:async()=>{},release(){},commit:async()=>{if(owns){owns=false;locked=false;waiters.shift()?.();}},rollback:async()=>{for(const id of inserted){const i=rows.findIndex(r=>r.id===id);if(i>=0)rows.splice(i,1);}if(owns){owns=false;locked=false;waiters.shift()?.();}},query:async(sql,p=[])=>{
      assert.equal((sql.match(/\?/g)||[]).length,p.length,sql);
      if(sql.startsWith('SELECT id FROM users')){if(locked)await new Promise(r=>waiters.push(r));locked=true;owns=true;await new Promise(r=>setTimeout(r,10));return [[{id:p[0]}]];}
      if(sql.startsWith('SELECT id FROM leads'))return [[{id:p[0]}]];
      if(sql.startsWith('SELECT id,status'))return [rows.filter(r=>r.lead_id===p[0])];
      if(sql.startsWith('SELECT id,scheduled_time'))return [rows.filter(r=>r.engineer===p[0]&&r.date===p[1]&&r.id!==p[2])];
      if(sql.startsWith('INSERT INTO site_surveys')){const id=nextId++;rows.push({id,engineer:p[0],date:p[1],scheduled_time:p[2],lead_id:p[9],status:'scheduled'});inserted.push(id);return [{insertId:id}];}
      if(sql.startsWith('UPDATE leads')){updates.push(p[1]);return [{}];}
      assert.fail(sql);
    }};
  }};
  const filename=path.resolve(__dirname,'../models/surveyModel.js'),module={exports:{}};
  const defaultDb={query:async()=>[[]]};
  const context={module,exports:module.exports,console,require:n=>n==='../config/db'?{db:defaultDb}:n.startsWith('.')?require(path.resolve(path.dirname(filename),n)):require(n)};
  vm.runInNewContext(fs.readFileSync(filename,'utf8'),context);
  const model=module.exports;
  // Post-commit detail/activity queries do not alter the transactional assertions.
  pool.query=async(sql,p=[])=>sql.includes('SELECT s.*')?[[rows.find(r=>r.id===p[0])].filter(Boolean)]:sql.includes('SELECT full_name')?[[{full_name:'Engineer'}]]:[[]];
  const results=await Promise.allSettled([1,2].map(lead_id=>model.scheduleSurvey({...place,lead_id,assigned_engineer_id:4,scheduled_date:'2026-11-16',scheduled_time:'15:30'},lead_id,pool)));
  assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(results.find(r=>r.status==='rejected').reason.status,409);assert.equal(rows.length,1);assert.equal(updates.length,1);
});
test('the requested eleven pipeline stages are ordered and Invalid closes follow-up scheduling',()=>{
  const {names}=require('../services/leadStages');assert.deepEqual(names,['New Lead','Contacted','Qualified','Site Survey Scheduled','Site Survey Done','Quotation Sent','Negotiation','Won','On Hold','Lost','Invalid']);
  assert.equal(require('../services/salesWorkflow').validTask({},'Invalid'),null);
  assert(require('../services/salesWorkflow').validTask({},'On Hold'));
});
