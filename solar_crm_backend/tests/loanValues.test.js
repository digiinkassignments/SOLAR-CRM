const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

// Load the real model with an in-memory DB adapter: importing the production model
// normally creates a pool and runs schema checks. These tests never open a connection.
function fixture() {
  const inserts = [];
  const db = { query: async (sql, values) => {
    if (/INSERT INTO solar_loans/.test(sql)) {
      inserts.push({ sql, values });
      return [{ insertId: 1 }];
    }
    return [[]];
  } };
  const module = { exports: {} };
  const source = fs.readFileSync(path.join(__dirname, "../models/loanModel.js"), "utf8");
  vm.runInNewContext(source, { module, exports: module.exports, console, require: name => {
    if(name==="../utils/managerScope") return require("../utils/managerScope");
    assert.equal(name, "../config/db");
    return { db };
  } });
  return { model: module.exports, db, inserts };
}

test("backend EMI preserves zero interest and normal lender estimates", () => {
  const { model } = fixture();
  assert.equal(model.calculateMonthlyEMI(120000, 0, 12), 10000);
  assert.equal(model.calculateMonthlyEMI(100000, 12, 12), 8885);
});

test("creating a zero-subsidy, zero-interest loan does not substitute sample values", async () => {
  const { model, db, inserts } = fixture();
  await model.createLoan({ lead_id: 48, customer_name: "Synthetic test", bank_name: "Test lender", subsidy_expected: 0, interest_rate: 0, loan_amount_applied: 120000, tenure_months: 12 }, db);
  assert.equal(inserts.length, 1);
  const { sql, values } = inserts[0];
  const columns = sql.match(/INSERT INTO solar_loans\s*\(([\s\S]+?)\)\s*VALUES/)[1].split(",").map(value => value.trim());
  const value = field => values[columns.indexOf(field)];
  assert.equal(value("subsidy_expected"), 0);
  assert.equal(value("interest_rate"), 0);
  assert.equal(value("system_capacity_kw"), 0);
  assert.equal(value("monthly_emi"), 10000);
});
