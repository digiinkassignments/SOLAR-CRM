exports.up = async (db) => {
  await require('../../services/duplicateRecords').ensure(db);
};
