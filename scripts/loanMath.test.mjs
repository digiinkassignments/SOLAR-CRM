import test from "node:test";
import assert from "node:assert/strict";
import { calculateEMI } from "../solar_crm_frontend/src/utils/loanMath.js";

test("standard reducing-balance EMI", () => assert.equal(calculateEMI(100000, 12, 12), 8885));
test("zero interest divides principal without substituting a default rate", () => assert.equal(calculateEMI(120000, 0, 12), 10000));
test("invalid principal, rate and duration do not produce misleading estimates", () => {
  for (const args of [[0, 7, 60], [-1, 7, 60], [100000, -1, 60], [100000, 7, 0], [100000, 7, 1.5], [Infinity, 7, 60]]) assert.equal(calculateEMI(...args), 0);
});
