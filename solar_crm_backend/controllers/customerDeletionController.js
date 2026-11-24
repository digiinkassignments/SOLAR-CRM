const deletion = require('../services/customerDeletion');
const wrap = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (e) {
    if (!e.status) console.error('Customer recycle operation failed:', e.code || 'INTERNAL');
    res.status(e.status || 500).json({
      success: false,
      message: e.status
        ? e.message
        : 'Customer operation failed. No success was confirmed; refresh and retry.',
    });
  }
};
const tenant = (req) => {
  const id = Number(req.clientInfo?.id || req.user?.client_id);
  if (!Number.isSafeInteger(id) || id <= 0)
    throw Object.assign(Error('Use your company workspace.'), { status: 403 });
  return id;
};
module.exports = {
  preview: wrap(async (req, res) =>
    res.json({
      success: true,
      data: await deletion.preview(req.db, req.params.id, req.user, tenant(req)),
    })
  ),
  archive: wrap(async (req, res) =>
    res.json({
      success: true,
      message: 'Customer moved to recycle bin for 30 days.',
      data: await deletion.archive(req.db, req.params.id, req.body, req.user, tenant(req)),
    })
  ),
  list: wrap(async (req, res) =>
    res.json({ success: true, data: await deletion.list(req.db, req.user) })
  ),
  restore: wrap(async (req, res) =>
    res.json({
      success: true,
      message: 'Customer and linked records restored.',
      data: await deletion.restore(req.db, req.params.id, req.user),
    })
  ),
  export: wrap(async (req, res) => {
    await require('../services/customerWorkspace').accessibleCustomer(
      req.db,
      req.params.id,
      req.user
    );
    if (![1, 2].includes(Number(req.user.role_id)) && req.user.portal_role !== 'finance')
      return res.sendStatus(403);
    const snap = await deletion.collect(req.db, req.params.id, tenant(req)),
      format = req.query.format === 'zip' ? 'zip' : 'csv',
      exporter = require('../services/customerExport');
    await deletion.checkScope(req.db, snap, req.user);
    res.set({
      'Cache-Control': 'private, no-store',
      'Content-Disposition': `attachment; filename="customer-${Number(req.params.id)}-export.${format}"`,
      'Content-Type': format === 'zip' ? 'application/zip' : 'text/csv; charset=utf-8',
    });
    res.send(format === 'zip' ? await exporter.exportZip(snap) : exporter.csv(snap));
  }),
};
