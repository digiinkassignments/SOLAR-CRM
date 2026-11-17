const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const documents = require('../routes/surveyDocuments');
test('documents accept supported signatures and reject renamed executable/text files', () => {
  assert.deepEqual(documents.fileType(Buffer.from('%PDF-1.7')), ['pdf', 'application/pdf']);
  assert.deepEqual(documents.fileType(Buffer.from([255,216,255,0])), ['jpg', 'image/jpeg']);
  assert.deepEqual(documents.fileType(Buffer.from([137,80,78,71,13,10,26,10])), ['png', 'image/png']);
  assert.equal(documents.fileType(Buffer.from('<script>alert(1)</script>')), null);
});
test('an engineer cannot read documents from another engineer’s survey', async () => {
  let queriedDocuments = false;
  const app = express();
  app.use((req, res, next) => {
    req.user = { id: 4, role_id: 4, client_id: 1 }; req.clientInfo = { id: 1 };
    req.db = { query: async sql => {
      if (sql.includes('FROM site_surveys')) return [[{ id: 7, lead_id: 1, assigned_engineer_id: 9 }]];
      queriedDocuments = true; return [[]];
    } }; next();
  });
  app.use(documents);
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  try {
    const result = await fetch(`http://127.0.0.1:${server.address().port}/7/documents`);
    assert.equal(result.status, 404); assert.equal(queriedDocuments, false);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
