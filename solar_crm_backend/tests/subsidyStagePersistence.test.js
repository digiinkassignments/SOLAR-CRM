const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const source = fs.readFileSync(path.resolve(__dirname,"../../solar_crm_frontend/src/pages/Admin/Subsidy/SubsidyDetail.jsx"),"utf8");
function setup(options={}) {
 let saved={portal_status:"registered",consumer_number:"123",expected_subsidy:"78000",amount_received:"0",sanctioned_capacity_kw:"",utr_number:"",credit_date:""}, displayed={...saved}, calls=0, reloads=0;
 const notices=[];
 const context={module:{exports:{}},canEdit:true,PORTAL_STAGES:["registered","feasibility_approved","vendor_selected","subsidy_credited"].map(id=>({id})),console:{error:()=>{}},formData:{...saved},leadId:"115",saveInFlight:{current:false},validateStageDocuments:()=>({allowed:!options.blocked,missing:[]}),setBlockerData:()=>{},setBlockerModalOpen:()=>{},setSaving:()=>{},toast:{success:value=>notices.push(value),error:value=>notices.push(value)},setFormData:value=>{displayed=value;},applySubsidy:async payload=>{calls++;if(options.wait)await options.wait;if(options.fail)throw Error("network failure");saved={...payload};return {success:true};},fetchData:async()=>{reloads++;displayed={...saved};}};
 const stage=source.slice(source.indexOf("  const handleStageClick ="),source.indexOf("  // Open Document Camera Capture"));
 const save=source.slice(source.indexOf("  const handleSaveApplication ="),source.indexOf("  // Verify or Reject Document"));
 vm.runInNewContext(save+"\n"+stage+"\nmodule.exports={handleStageClick,handleSaveApplication};",context);
 return {handlers:context.module.exports,context,get state(){return {saved,displayed,calls,reloads,notices};}};
}
test("click persists the milestone before success and reload retains it",async()=>{const x=setup();await x.handlers.handleStageClick({id:"feasibility_approved",label:"Feasibility Approved",expectedDays:3});assert.equal(x.state.calls,1);assert.equal(x.state.saved.portal_status,"feasibility_approved");assert.equal(x.state.displayed.portal_status,"feasibility_approved");assert.equal(x.state.saved.lead_id,"115");assert.equal(x.state.reloads,1);assert(x.state.notices.includes("Stage saved: Feasibility Approved"));});
test("failed save leaves previous displayed stage and does not report success",async()=>{const x=setup({fail:true});await x.handlers.handleStageClick({id:"feasibility_approved",label:"Feasibility Approved",expectedDays:3});assert.equal(x.state.displayed.portal_status,"registered");assert.equal(x.state.reloads,0);assert(!x.state.notices.some(value=>value.startsWith("Stage saved")));});
test("document gates and actual-credit checks remain enforced",async()=>{const x=setup({blocked:true});await x.handlers.handleStageClick({id:"feasibility_approved"});assert.equal(x.state.calls,0);const y=setup();await y.handlers.handleStageClick({id:"subsidy_credited"});assert.equal(y.state.calls,0);assert.equal(y.state.displayed.portal_status,"registered");});
test("rapid clicks cannot race competing stage saves",async()=>{let release;const wait=new Promise(resolve=>release=resolve);const x=setup({wait});const first=x.handlers.handleStageClick({id:"feasibility_approved",label:"Feasibility Approved",expectedDays:3});await x.handlers.handleStageClick({id:"feasibility_approved",label:"Feasibility",expectedDays:7});assert.equal(x.state.calls,1);release();await first;assert.equal(x.state.saved.portal_status,"feasibility_approved");assert.equal(x.context.saveInFlight.current,false);});
