exports.up = async (db) => {
  await require('../../services/customerWorkspace').ensure(db);
  await require('../../services/customerOpening').ensure(db);
  await require('../../services/customerLedger').ensure(db);
  await require('../../services/customerCollectionSchema').ensure(db);
  const [quotes] = await db.query("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='quotations'");
  if (quotes.length) await require('../../services/quotationPaymentSchedule').ensure(db);
};
