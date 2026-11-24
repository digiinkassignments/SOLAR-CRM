const fs = require('fs/promises');
const path = require('path');
const root = path.resolve(__dirname, '..');
const cell = (value) =>
  '"' +
  String(value ?? '')
    .replace(/^[=+@\-]/, "'$&")
    .replaceAll('"', '""') +
  '"';
function csv(snapshot) {
  const rows = ['table,record_id,name,reference,amount,status,date,data'];
  for (const [table, records] of Object.entries(snapshot.rows))
    for (const row of records)
      rows.push(
        [
          table,
          row.id || row.customer_id || row.invoice_id,
          row.customer_name || row.title || row.document_type || '',
          row.invoice_number ||
            row.quotation_number ||
            row.project_number ||
            row.lead_code ||
            row.refund_reference ||
            row.reference_number ||
            '',
          row.amount ?? row.gross_total ?? row.disbursed_amount ?? row.invoice_amount ?? '',
          row.payment_status || row.status || row.loan_stage || row.portal_status || '',
          row.refund_date || row.payment_date || row.invoice_date || row.created_at || '',
          JSON.stringify(row),
        ]
          .map(cell)
          .join(',')
      );
  return '\uFEFF' + rows.join('\r\n');
}
function crc32(buffer) {
  let crc = 0xffffffff;
  for (const b of buffer) {
    crc ^= b;
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
// Standard uncompressed ZIP, no shell commands or external archive dependency.
function zip(files) {
  const parts = [],
    central = [];
  let offset = 0;
  for (const file of files) {
    const name = Buffer.from(file.name.replaceAll('\\', '/')),
      data = Buffer.from(file.data),
      crc = crc32(data);
    const header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50);
    header.writeUInt16LE(20, 4);
    header.writeUInt16LE(0x800, 6);
    header.writeUInt32LE(crc, 14);
    header.writeUInt32LE(data.length, 18);
    header.writeUInt32LE(data.length, 22);
    header.writeUInt16LE(name.length, 26);
    const entry = Buffer.alloc(46);
    entry.writeUInt32LE(0x02014b50);
    entry.writeUInt16LE(20, 4);
    entry.writeUInt16LE(20, 6);
    entry.writeUInt16LE(0x800, 8);
    entry.writeUInt32LE(crc, 16);
    entry.writeUInt32LE(data.length, 20);
    entry.writeUInt32LE(data.length, 24);
    entry.writeUInt16LE(name.length, 28);
    entry.writeUInt32LE(offset, 42);
    parts.push(header, name, data);
    central.push(entry, name);
    offset += header.length + name.length + data.length;
  }
  const directory = Buffer.concat(central),
    end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(directory.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...parts, directory, end]);
}
async function exportZip(snapshot) {
  const files = [{ name: 'records.csv', data: csv(snapshot) }];
  for (const [table, records] of Object.entries(snapshot.rows)) {
    const columns = [...new Set(records.flatMap((row) => Object.keys(row)))];
    const lines = [columns.map(cell).join(',')];
    for (const row of records)
      lines.push(
        columns
          .map((col) =>
            cell(
              typeof row[col] === 'object' && row[col] !== null
                ? JSON.stringify(row[col])
                : row[col]
            )
          )
          .join(',')
      );
    files.push({ name: `tables/${table}.csv`, data: '\uFEFF' + lines.join('\r\n') });
  }
  let size = files.reduce((sum, file) => sum + Buffer.byteLength(file.data), 0);
  for (const relative of snapshot.files) {
    const file = path.resolve(root, relative);
    if (!file.startsWith(root + path.sep)) throw Error('Invalid export file.');
    try {
      const stat = await fs.stat(file);
      size += stat.size;
      if (size > 100 * 1024 * 1024)
        throw Object.assign(
          Error(
            'ZIP exceeds 100 MB. Download CSV and contact your administrator for a storage export.'
          ),
          { status: 413 }
        );
      files.push({
        name: 'files/' + relative.replaceAll('\\', '/'),
        data: await fs.readFile(file),
      });
    } catch (e) {
      if (e.code !== 'ENOENT') throw e;
    }
  }
  return zip(files);
}
module.exports = { csv, zip, exportZip };
