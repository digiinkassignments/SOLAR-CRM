const ensured=new WeakSet();
const CLOSED=['Won','Lost','Invalid','Not Interested'];
const OUTCOMES=['Connected','No answer','Busy','Call later','Wrong number','Meeting completed','Note only'];
async function ensure(db){if(ensured.has(db))return;
 await db.query(`CREATE TABLE IF NOT EXISTS crm_workflow_settings (id INT PRIMARY KEY, timezone VARCHAR(64) NOT NULL DEFAULT 'Asia/Kolkata', discount_limit_pct DECIMAL(5,2) NOT NULL DEFAULT 0)`);
 await db.query("INSERT IGNORE INTO crm_workflow_settings (id) VALUES (1)");
 for(const [table,col,type]of [['leads','next_action','VARCHAR(255) NULL'],['leads','next_follow_up_time','TIME NULL'],['lead_followups','call_outcome','VARCHAR(40) NULL'],['lead_followups','next_action','VARCHAR(255) NULL'],['lead_followups','next_follow_up_time','TIME NULL']]){const[rows]=await db.query(`SHOW COLUMNS FROM ${table} LIKE '${col}'`);if(!rows.length){try{await db.query(`ALTER TABLE ${table} ADD COLUMN ${col} ${type}`);}catch(e){if(e.code!=='ER_DUP_FIELDNAME')throw e;}}}
 try { await db.query("ALTER TABLE lead_followups MODIFY COLUMN status_after_followup VARCHAR(100) NULL"); } catch (e) {}
 await db.query(`CREATE TABLE IF NOT EXISTS crm_reminder_deliveries (dedupe_key VARCHAR(191) PRIMARY KEY,user_id INT NOT NULL,kind VARCHAR(40) NOT NULL,status VARCHAR(20) NOT NULL DEFAULT 'queued',created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
 ensured.add(db);
}
async function preferences(db){await ensure(db);const[rows]=await db.query('SELECT * FROM crm_workflow_settings WHERE id=1');return rows[0]||{timezone:'Asia/Kolkata',discount_limit_pct:0};}
function localClock(timezone,now=new Date()){const parts=new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(now);const p=Object.fromEntries(parts.map(v=>[v.type,v.value]));return {date:`${p.year}-${p.month}-${p.day}`,time:`${p.hour}:${p.minute}`};}
function validTask(data,status){if(CLOSED.includes(status))return null;if(!String(data.next_action||'').trim()||String(data.next_action).length>255||!/^\d{4}-\d{2}-\d{2}$/.test(data.next_follow_up_date||'')||!/^([01]\d|2[0-3]):[0-5]\d(?::00)?$/.test(data.next_follow_up_time||''))return 'Active leads require a next action, follow-up date and exact time.';const d=new Date(data.next_follow_up_date+'T00:00:00Z');if(Number.isNaN(d.getTime())||d.toISOString().slice(0,10)!==data.next_follow_up_date)return 'Enter a valid follow-up date.';return null;}
async function scopedLead(db,id,user,lock=false){let scope='';const params=[id];if(Number(user.role_id)===3){scope=' AND l.assigned_to=?';params.push(user.id);}else if(Number(user.role_id)===2){scope=' AND l.assigned_to IN (SELECT id FROM users WHERE manager_id=? AND role_id=3 AND is_deleted=0)';params.push(user.id);}else if(Number(user.role_id)!==1)return null;const[rows]=await db.query(`SELECT l.* FROM leads l WHERE l.id=? AND l.is_deleted=0${scope} LIMIT 1${lock?' FOR UPDATE':''}`,params);return rows[0]||null;}
module.exports={ensure,preferences,localClock,validTask,scopedLead,CLOSED,OUTCOMES};
