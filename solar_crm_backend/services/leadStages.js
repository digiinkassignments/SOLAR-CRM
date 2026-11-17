const names = ['New Lead','Contacted','Qualified','Site Survey Scheduled','Site Survey Done','Quotation Sent','Negotiation','Won','On Hold','Lost','Invalid'];
const ready = new WeakMap();
async function ensure(db) {
  if (!ready.has(db)) ready.set(db, (async()=>{
    await db.query('CREATE TABLE IF NOT EXISTS crm_schema_migrations (name VARCHAR(100) PRIMARY KEY,applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)');
    const c = await db.getConnection();
    try {
      await c.beginTransaction();
      await c.query("INSERT IGNORE INTO crm_schema_migrations(name) VALUES('lead_stages_20261113_lock')");
      await c.query("SELECT name FROM crm_schema_migrations WHERE name='lead_stages_20261113_lock' FOR UPDATE");
      const [done]=await c.query("SELECT name FROM crm_schema_migrations WHERE name='lead_stages_20261113_v2'");
      if(!done.length){
        await c.query('UPDATE custom_lead_statuses SET is_active=0 WHERE name NOT IN (?)',[names]);
        for(const [i,name] of names.entries())await c.query('INSERT INTO custom_lead_statuses(name,stage_order,is_won,is_lost,is_active,is_default) VALUES(?,?,?,?,1,1) ON DUPLICATE KEY UPDATE stage_order=VALUES(stage_order),is_won=VALUES(is_won),is_lost=VALUES(is_lost),is_active=1',[name,i+1,name==='Won',name==='Lost'||name==='Invalid']);
        // Only rename the unambiguous old scheduling label; preserve all other
        // historical status values and activity records.
        await c.query("UPDATE leads SET status='Site Survey Scheduled' WHERE status='Site Visit Scheduled'");
        await c.query("UPDATE leads SET status='Site Survey Done' WHERE status='Survey Completed'");
        await c.query("INSERT INTO crm_schema_migrations(name) VALUES('lead_stages_20261113_v2')");
      }
      await c.commit();
    }catch(e){await c.rollback();throw e;}finally{c.release();}
  })().catch(e=>{ready.delete(db);throw e;}));
  return ready.get(db);
}
module.exports={names,ensure};
