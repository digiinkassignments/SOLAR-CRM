const ready = new WeakMap();
function time(value) {
  const s = String(value || '').trim();
  const m = s.match(/^(0?[1-9]|1[0-2]):([0-5]\d)\s*(AM|PM)$/i);
  if (m) return String(Number(m[1]) % 12 + (m[3].toUpperCase() === 'PM' ? 12 : 0)).padStart(2, '0') + ':' + m[2];
  return /^([01]\d|2[0-3]):[0-5]\d(?::00)?$/.test(s) ? s.slice(0, 5) : null;
}
function fail(message, status = 400) { throw Object.assign(new Error(message), { status }); }
async function ensure(db) {
  if (!ready.has(db)) ready.set(db, (async () => {
    for (const col of ['site_address TEXT NULL', 'landmark VARCHAR(255) NULL', 'site_latitude DECIMAL(10,7) NULL', 'site_longitude DECIMAL(10,7) NULL']) {
      try { await db.query(`ALTER TABLE site_surveys ADD COLUMN ${col}`); } catch (e) { if (e.code !== 'ER_DUP_FIELDNAME') throw e; }
    }
    try { await db.query('ALTER TABLE site_surveys ADD INDEX survey_engineer_day (assigned_engineer_id,scheduled_date,status)'); }
    catch (e) { if (e.code !== 'ER_DUP_KEYNAME') throw e; }
  })().catch(e => { ready.delete(db); throw e; }));
  return ready.get(db);
}
function location(body) {
  const address = typeof body.site_address === 'string' ? body.site_address.trim() : '';
  const landmark = typeof body.landmark === 'string' ? body.landmark.trim() : '';
  if (!address || address.length > 2000 || !landmark || landmark.length > 255) fail('Enter the complete site address and nearby landmark.');
  const lat = body.site_latitude, lng = body.site_longitude;
  if (lat === '' || lng === '' || lat == null || lng == null || !Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng)) || Math.abs(Number(lat)) > 90 || Math.abs(Number(lng)) > 180) fail('Enter valid site GPS latitude and longitude.');
  return { site_address: address, landmark, site_latitude: Number(lat), site_longitude: Number(lng) };
}
// Lock the engineer's row before reading bookings. Every booking writer uses this
// same transaction lock, including reschedules and coordinator reassignments.
async function lockEngineer(c, id) {
  const [rows] = await c.query("SELECT id FROM users WHERE id=? AND role_id=4 AND is_deleted=0 AND LOWER(status)='active' FOR UPDATE", [id]);
  if (!rows[0]) fail('Choose an active Site Engineer.');
}
async function available(c, engineer, date, slot, except = 0) {
  const exact = time(slot); if (!exact) fail('Enter an exact survey time.');
  const [rows] = await c.query("SELECT id,scheduled_time FROM site_surveys WHERE assigned_engineer_id=? AND scheduled_date=? AND status IN ('scheduled','completed') AND id<>? FOR UPDATE", [engineer, date, except]);
  if (rows.some(r => time(r.scheduled_time) === exact)) fail('Engineer is already booked at this date and time. Choose another slot or engineer.', 409);
}
module.exports = { ensure, time, location, lockEngineer, available, fail };
