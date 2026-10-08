const test = require("node:test");
const assert = require("node:assert/strict");

test("1. Quotation Controller Imports and Methods Check", () => {
  const {
    createQuotation,
    getQuotations,
    getQuotationById,
    getPublicQuotation,
    acceptPublicQuotation,
    updateQuotation,
    deleteQuotation,
  } = require("../controllers/quotationController");

  assert.equal(typeof createQuotation, "function");
  assert.equal(typeof getQuotations, "function");
  assert.equal(typeof getQuotationById, "function");
  assert.equal(typeof getPublicQuotation, "function");
  assert.equal(typeof acceptPublicQuotation, "function");
  assert.equal(typeof updateQuotation, "function");
  assert.equal(typeof deleteQuotation, "function");
});
