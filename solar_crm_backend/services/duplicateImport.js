const duplicates = require('./duplicateRecords');

async function preview(db, rows, user) {
  if (!Array.isArray(rows) || !rows.length || rows.length > 100)
    duplicates.fail('Choose 1–100 lead rows per import.');
  await duplicates.ensure(db);
  const seen = new Set();
  const data = [];
  for (let index = 0; index < rows.length; index++) {
    const row = rows[index];
    try {
      if (!String(row.customer_name || '').trim()) duplicates.fail('Customer name is required.');
      const phone = duplicates.normalize(row.mobile_number),
        alternate = duplicates.normalize(row.alternate_number, true);
      const matches = await duplicates.search(db, { phone, alternate }, user);
      const inFile = seen.has(phone) || (alternate && seen.has(alternate));
      seen.add(phone);
      if (alternate) seen.add(alternate);
      data.push({
        row: index + 1,
        duplicate: matches.total > 0 || Boolean(inFile),
        matches: matches.data,
        within_file: Boolean(inFile),
      });
    } catch (error) {
      data.push({
        row: index + 1,
        error: error.status ? error.message : 'Duplicate check unavailable.',
      });
    }
  }
  return { data, duplicate_count: data.filter((r) => r.duplicate).length };
}

async function run(db, rows, user, body) {
  if (!Array.isArray(rows) || !rows.length || rows.length > 100)
    duplicates.fail('Import 1–100 lead rows at a time.');
  const mode = body.duplicate_mode || 'skip';
  if (!['skip', 'update', 'create'].includes(mode))
    duplicates.fail('Choose Skip, Update existing or Create anyway.');
  const model = require('../models/leadModel');
  await model.ensureLeadEventColumns(db);
  const result = { imported: 0, updated: 0, skipped: 0, failed: 0, errors: [], duplicates: [] };
  for (let i = 0; i < rows.length; i++) {
    const data = { ...rows[i], status: 'New Lead' };
    try {
      if (!String(data.customer_name || '').trim()) duplicates.fail('Customer name is required.');
      if (Number(user.role_id) === 2) {
        const inTeam = await require('../models/userModel').isUserInManagerTeam(
          data.assigned_to,
          user.id,
          db
        );
        if (!inTeam) duplicates.fail('Assign imports to a salesperson in your own team.', 403);
      }
      const outcome = await duplicates.locked(db, data, async (connection) =>
        duplicates.transaction(connection, async () => {
          const matches = await duplicates.search(
            connection,
            { phone: data.mobile_number, alternate: data.alternate_number },
            user
          );
          if (matches.total) {
            if (mode === 'skip') return { type: 'skipped', duplicate: true };
            if (mode === 'update') {
              const target = matches.data.find((r) => r.lead_id && r.can_open);
              if (!target)
                duplicates.fail(
                  'No permitted existing lead can be updated. Open the linked customer/project instead.',
                  403
                );
              const [[existing]] = await connection.query(
                'SELECT * FROM leads WHERE id=? AND is_deleted=0 FOR UPDATE',
                [target.lead_id]
              );
              if (!existing) duplicates.fail('Existing lead is unavailable.');
              // Preserve assignment, financial amounts and pipeline status when updating an import.
              const fields = [
                'customer_name',
                'email',
                'address',
                'city',
                'state',
                'pincode',
                'solar_requirement',
                'required_kw',
                'remark',
                'lead_source',
              ];
              const updated = { ...existing };
              for (const key of fields)
                if (data[key] !== undefined && data[key] !== '') updated[key] = data[key];
              await model.updateLead(existing.id, updated, user.id, connection);
              return { type: 'updated', duplicate: true };
            }
            data.duplicate_override = true;
            data.duplicate_reason = body.duplicate_reason;
            data.duplicate_remarks = body.duplicate_remarks;
            await duplicates.check(connection, data, user, 'lead');
          }
          const created = await model.createLead(data, user.id, connection);
          if (matches.total)
            await duplicates.record(connection, 'lead', created.id, matches.data, data, user);
          return { type: 'imported', duplicate: matches.total > 0 };
        })
      );
      result[outcome.type]++;
      if (outcome.duplicate)
        result.duplicates.push({ row: i + 1, message: 'Normalized phone already exists.' });
    } catch (error) {
      result.failed++;
      result.errors.push({
        row: i + 1,
        reason: error.status ? error.message : 'Could not import row. No changes were saved.',
      });
    }
  }
  return result;
}
module.exports = { preview, run };
