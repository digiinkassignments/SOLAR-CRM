const cron = require('node-cron');
let running = false;
async function run() {
  if (running) return;
  running = true;
  try {
    const { masterDb } = require('../config/masterDb');
    const [clients] = await masterDb.query(
      "SELECT id,db_name,status FROM clients WHERE status<>'Deleted'"
    );
    for (const client of clients) {
      if (!/^[\w]+$/.test(client.db_name || '')) continue;
      try {
        const pool = require('../config/clientDb').getClientPool(client.db_name);
        await require('./customerDeletion').recover(pool, client.id);
        await require('./customerDeletion').purge(pool);
        if (client.status === 'Active') await require('./customerCollectionReminders').processTenant(pool);
      } catch (e) {
        console.error('Customer purge needs retry:', client.id, e.code || 'PURGE_FAILED');
      }
    }
  } finally {
    running = false;
  }
}
function start() {
  cron.schedule(
    '17 * * * *',
    () => run().catch(() => console.error('Customer purge scheduler unavailable.')),
    { timezone: 'Asia/Kolkata' }
  );
}
module.exports = { start, run };
