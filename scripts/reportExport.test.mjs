import test from 'node:test';
import assert from 'node:assert/strict';
import {serializeCsv,csvCell} from '../solar_crm_frontend/src/pages/Reports/reportExport.js';
test('CSV escapes quotes, commas and line breaks',()=>assert.equal(csvCell('Engineer "A",\nNorth'),'"Engineer ""A"",\nNorth"'));
test('CSV treats formula-like text as text while retaining numeric values',()=>{assert.equal(csvCell(' =1+1'),'"\' =1+1"');assert.equal(csvCell('-10'),'"\'-10"');assert.equal(csvCell(-10),'"-10"')});
test('CSV includes BOM, headers, complete rows and empty missing values',()=>assert.equal(serializeCsv(['Engineer','Logs'],[['Test',null]]),'\uFEFF"Engineer","Logs"\r\n"Test",""'));
