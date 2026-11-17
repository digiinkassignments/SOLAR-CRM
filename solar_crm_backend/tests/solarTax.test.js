const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
const { solarTax } = require("../utils/solarTax");
test("composite split, discount, standalone installation, zero rate and rounding", () => {
  const t = solarTax({ mode: "solar_composite", subtotal: 100000 });
  assert.equal(t.goodsValue, 70000); assert.equal(t.serviceValue, 30000);
  assert.equal(t.goodsTax, 3500); assert.equal(t.serviceTax, 5400); assert.equal(t.total, 108900);
  assert.equal(solarTax({ mode: "solar_composite", subtotal: 100000, discount: 10000 }).gst, 8010);
  assert.equal(solarTax({ subtotal: 10000, rate: 18 }).gst, 1800);
  assert.equal(solarTax({ subtotal: 10000, rate: 0 }).gst, 0);
  assert.equal(solarTax({ mode: "solar_composite", subtotal: 100, discount: 200 }).gst, 0);
  for (const amount of [0.01, 0.13, 1234.57, 999999.99]) {
    const v = solarTax({ mode: "solar_composite", subtotal: amount });
    assert.equal(Math.round((v.goodsValue + v.serviceValue)*100), Math.round(amount*100));
    assert.equal(Math.round(v.gst*100), Math.round((v.goodsTax+v.serviceTax)*100));
  }
});
function load(relative, db) {
  const filename = path.resolve(__dirname, relative);
  const context = { module: { exports: {} }, console, require: (name) => name === "../config/db" ? { db } : require(name.startsWith(".") ? path.resolve(path.dirname(filename), name) : name) };
  vm.runInNewContext(fs.readFileSync(filename, "utf8"), context, { filename });
  return context.module.exports;
}
function response() { return { code: 200, status(n) { this.code=n; return this; }, json(body) { this.body=body; return this; } }; }
test("quote create/edit/duplicate and invoice conversion preserve tax and SQL bindings", async () => {
  let current = {}, invoice;
  const db = { query: async (sql, values=[]) => {
    if (/SHOW COLUMNS/.test(sql)) return [[{ Field: "present" }]];
    if (/SELECT.*FROM quotations WHERE id/.test(sql)) return [[current]];
    if (/SELECT quotation_number/.test(sql)) return [[]];
    if (/INSERT INTO (quotations|invoices) \(/.test(sql)) {
      assert.equal((sql.match(/\?/g)||[]).length, values.length, sql);
      const cols=sql.match(/INSERT INTO \w+ \(([\s\S]*?)\) VALUES/)[1].split(",").map(s=>s.trim());
      const vals=[...values]; if(sql.includes("'Sent'")) vals.splice(cols.indexOf("status"),0,"Sent"); if(sql.includes("'Draft'")) vals.splice(cols.indexOf("status"),0,"Draft");
      const row=Object.fromEntries(cols.map((col,i)=>[col,vals[i]]));
      if(sql.includes("INSERT INTO quotations")) current={...row,id:1}; else invoice=row;
      return [{insertId:1}];
    }
    if (/UPDATE quotations SET/.test(sql)) { assert.equal((sql.match(/\?/g)||[]).length,values.length);const cols=sql.match(/SET([\s\S]*?)WHERE/)[1].split(",").map(s=>s.trim().split(" = ")[0]).filter(s=>s!=="updated_at");cols.forEach((col,i)=>{current[col]=values[i]});return [{affectedRows:1}]; }
    return [[]];
  }};
  const controller=load("../controllers/quotationController.js",db);
  const item={name:"System",quantity:1,unit_price:100000,gst_rate:18};
  let res=response(); await controller.createQuotation({db,user:{id:1},body:{customer_name:"Test",customer_phone:"9999999999",system_capacity_kw:3,gst_mode:"solar_composite",line_items:[item]}},res);
  assert.equal(res.code,201,JSON.stringify(res.body));assert.equal(current.gst_amount,8900);assert.equal(current.total_amount,108900);
  assert.equal(JSON.parse(current.line_items_json)[0].gst_amount,0);
  res=response();await controller.updateQuotation({db,params:{id:1},body:{gst_mode:"itemised",discount_amount:10000}},res);
  assert.equal(res.code,200);assert.equal(current.gst_amount,16200);assert.equal(current.total_amount,106200);
  res=response();await controller.updateQuotation({db,params:{id:1},body:{gst_mode:"solar_composite",discount_amount:10000}},res);
  assert.equal(current.gst_amount,8010);assert.equal(current.total_amount,98010);
  res=response();await controller.duplicateQuotation({db,user:{id:1},params:{id:1}},res);assert.equal(res.code,201);assert.equal(current.gst_mode,"solar_composite");assert.equal(JSON.parse(current.gst_summary_json).gst,8010);
  const model=load("../models/invoiceModel.js",db);
  await model.createInvoice({invoice_number:"TEST",customer_name:"Test",base_amount:100000,discount_amount:10000,gst_mode:current.gst_mode,line_items:JSON.parse(current.line_items_json)},1,db);
  assert.equal(invoice.gst_amount,current.gst_amount);assert.equal(invoice.gross_total,current.total_amount);assert.equal(invoice.cgst_amount+invoice.sgst_amount,invoice.gst_amount);
});

test("frontend and backend use the same arithmetic implementation", () => {
 const backend = fs.readFileSync(path.resolve(__dirname,"../utils/solarTax.js"),"utf8").split("module.exports")[0].trim();
 const frontend = fs.readFileSync(path.resolve(__dirname,"../../solar_crm_frontend/src/utils/solarTax.js"),"utf8").split("export { solarTax }")[0].trim();
 assert.equal(backend,frontend);
 const tax=solarTax({subtotal:100000,discount:10000,items:[{quantity:1,unit_price:70000,gst_rate:5},{quantity:1,unit_price:30000,gst_rate:18}]});
 assert.equal(tax.gst,8010); assert.equal(tax.total,98010);
});
