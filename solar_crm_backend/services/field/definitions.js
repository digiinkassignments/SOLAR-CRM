const field = (key, label, type = 'text', required = false, options = null, hint = '') => ({
  key,
  label,
  type,
  required,
  ...(options ? { options } : {}),
  ...(hint ? { hint } : {})
});
const definitions = {
  survey: {
    label: 'Site survey',
    resource: 'survey',
    evidence: false,
    fields: [
      field('roof_type', 'Roof type', 'select', true, [
        'RCC Flat Roof',
        'Tin / Metal Sheet Roof',
        'Tiled / Slanted Roof',
        'Asbestos Sheet Roof',
        'Ground Mount',
        'Elevated Super Structure'
      ]),
      field('roof_area_sqft', 'Usable roof area (sq ft)', 'number', true),
      field('roof_condition', 'Roof condition / structural observations', 'multiline', true),
      field('roof_orientation', 'Roof orientation', 'select', true, [
        'South (Optimal Solar Yield)',
        'South-East',
        'South-West',
        'East',
        'West',
        'North (Sub-optimal)'
      ]),
      field('roof_tilt_angle', 'Roof tilt / slope angle (degrees)', 'number', false),
      field('roof_ownership', 'Roof ownership & permission', 'select', true, [
        'Self-Owned Freehold (No NOC required)',
        'Rented / Tenant (Landlord NOC Required)',
        'Co-Owned / Joint Family (Consent Required)',
        'Society / Shared Apartment Roof (Society NOC Required)'
      ]),
      field('noc_status', 'NOC status', 'select', false, [
        'NOC Not Required',
        'NOC Already Obtained',
        'NOC Pending / In Process',
        'NOC Refused'
      ]),
      field('shading', 'Shading observations', 'multiline', true),
      field('electrical_phase', 'Supply phase', 'select', true, [
        'Single Phase',
        'Three Phase'
      ]),
      field('sanctioned_load_kw', 'Sanctioned load (kW)', 'number', true),
      field('consumer_number', 'Consumer number (DISCOM)', 'text', true),
      field('proposed_capacity_kw', 'Proposed capacity (kW)', 'number', true),
      field('feasibility_verdict', 'Feasibility verdict', 'select', true, [
        'Feasible',
        'Feasible with conditions',
        'Not feasible'
      ]),
      field('not_feasible_reason', 'Reason for not feasible', 'select', false, [
        'Weak roof structure / Unsafe for solar installation',
        'Severe shading from adjacent buildings / trees',
        'Tenant / Society refused NOC permission',
        'Overhead HT line / clearance hazard',
        'DISCOM transformer overloaded / grid constraints',
        'Inadequate roof area (< 100 sq ft)',
        'Other technical / electrical constraints'
      ]),
      field('lead_action_on_not_feasible', 'Action for lead if not feasible', 'select', false, [
        'Switch Lead to On Hold',
        'Close Lead as Lost / Not Feasible',
        'Keep Current Lead Status'
      ]),
      field('access_notes', 'Site access constraints', 'multiline'),
      field('gps_latitude', 'Latitude', 'number'),
      field('gps_longitude', 'Longitude', 'number')
    ],
    checks: []
  }
};
function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
  const d = new Date(value + 'T00:00:00Z');
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}
function validate(kind, data, submit = false) {
  const def = Object.hasOwn(definitions, kind) ? definitions[kind] : null;
  if (!def) return 'Unknown record type.';
  if (!data || typeof data !== 'object' || Array.isArray(data)) return 'Record details required.';
  if(Buffer.byteLength(JSON.stringify(data),'utf8')>80*1024)return 'Split this large record into separate field records.';
  for (const f of def.fields) {
    const v = data[f.key];
    if (submit && f.required && (v === undefined || v === null || String(v).trim() === '')) return `${f.label} is required.`;
    if (v !== undefined && v !== null && v !== '') {
      if (typeof v === 'object' || String(v).length > 6000) return `${f.label} is too long or invalid.`;
      if (f.type === 'number' && (!Number.isFinite(Number(v)) || !f.key.startsWith('gps_') && Number(v) < 0)) return `${f.label} must be a valid number.`;
      if (f.type === 'date' && !validDate(v)) return `${f.label} must be a real date.`;
    }
  }
  if (submit && kind === 'survey') {
    if (!Number(data.roof_area_sqft) || !Number(data.proposed_capacity_kw)) return 'Roof area and proposed capacity must be positive.';
    if (data.consumer_number) {
      const cStr = String(data.consumer_number).trim();
      if (cStr.length < 8 || cStr.length > 16) return 'Consumer number must be between 8 and 16 characters for DISCOM feasibility.';
    }
    if (data.feasibility_verdict === 'Not feasible' && (!data.not_feasible_reason || !String(data.not_feasible_reason).trim())) {
      return 'Reason is required when feasibility verdict is Not feasible.';
    }
  }
  if (Number(data.progress_percent) > 100) return 'Progress cannot exceed 100%.';
  if (Number(data.hours_worked) > 24) return 'Work hours cannot exceed 24.';
  if (data.gps_latitude !== undefined && Math.abs(Number(data.gps_latitude)) > 90) return 'Invalid latitude.';
  if (data.gps_longitude !== undefined && Math.abs(Number(data.gps_longitude)) > 180) return 'Invalid longitude.';
  if (submit && def.checks?.some(c => data.checks?.[c] !== true)) return 'Complete all required checklist items.';
  if (def.rows) {
    if (data.rows !== undefined && (!Array.isArray(data.rows) || data.rows.length > 200)) return 'Use up to 200 material/serial rows.';
    if (submit && !data.rows?.length) return 'Add material/serial rows.';
    const seen = new Set();
    for (const row of data.rows || []) {
      if (!row || typeof row !== 'object' || Object.values(row).some(v => typeof v === 'object' || String(v).length > 500)) return 'Invalid material/serial row.';
      if (!submit) continue;
      if (def.rows === 'materials') {
        if (!['Required', 'Received', 'Used', 'Return requested', 'Damaged', 'Shortage'].includes(row.movement) || !String(row.item || '').trim() || !Number.isFinite(Number(row.quantity)) || Number(row.quantity) <= 0 || !String(row.unit || '').trim()) return 'Material rows need item, movement, positive quantity and unit.';
      } else {
        if (!['Panel', 'Inverter', 'Other'].includes(row.component) || !String(row.brand || '').trim() || !String(row.serial || '').trim()) return 'Serial rows need component, brand and serial.';
        if (String(row.brand).length > 100 || String(row.model || '').length > 150 || String(row.serial).length > 150) return 'Brand/model/serial is too long.';
        const key = [row.component, row.brand, row.serial].map(v => String(v).trim().toLowerCase()).join(':');
        if (seen.has(key)) return 'Duplicate serial in this record.';
        seen.add(key);
      }
    }
  }
  return null;
}
function clean(kind, data) {
  const def = definitions[kind],
    out = {};
  for (const f of def.fields) if (data[f.key] !== undefined) out[f.key] = String(data[f.key]).trim();
  if (def.checks) out.checks = Object.fromEntries(def.checks.map(k => [k, data.checks?.[k] === true]));
  if (def.rows) out.rows = data.rows?.map(r => Object.fromEntries((def.rows === 'materials' ? ['item', 'movement', 'quantity', 'unit', 'stock_id'] : ['component', 'brand', 'model', 'serial']).map(k => [k, String(r[k] ?? '').trim()]))) || [];
  return out;
}
module.exports = {
  definitions,
  validate,
  clean,
  validDate
};
