const crypto = require('crypto');
const {cents,validDate,validateImportFinancials}=require('./customerWorkspace');
const ready=new WeakMap();
const fail=message=>{throw Object.assign(new Error(message),{status:400});};
async function ensure(db){
 if(!ready.has(db))ready.set(db,(async()=>{await db.query(`CREATE TABLE IF NOT EXISTS customer_opening_records (
 customer_id INT PRIMARY KEY, request_key VARCHAR(80) NOT NULL UNIQUE, payload_hash CHAR(64) NOT NULL,
 invoice_amount DECIMAL(12,2) NOT NULL, amount_paid DECIMAL(12,2) NOT NULL,
 invoice_reference VARCHAR(100) NULL, payment_date DATE NULL, payment_mode VARCHAR(50) NULL,
 payment_reference VARCHAR(100) NULL, recorded_by INT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
 ) ENGINE=InnoDB`);
 const [columns]=await db.query("SHOW COLUMNS FROM customer_opening_records LIKE 'plant_size_kw'");
 if(!columns.length){try{await db.query("ALTER TABLE customer_opening_records ADD COLUMN plant_size_kw DECIMAL(10,3) NULL");}catch(e){if(e.code!=='ER_DUP_FIELDNAME')throw e;}}
 })().catch(e=>{ready.delete(db);throw e;}));
 await ready.get(db);
}
function validate(data){
 const financialError=validateImportFinancials(data);
 if(financialError)fail(financialError);
 const amount=cents(data.invoice_amount || '0'),paid=cents(data.payment_amount || '0');
 if(!Number.isSafeInteger(amount)||!Number.isSafeInteger(paid))fail('Use non-negative amounts with up to 2 decimal places.');
 if(paid>amount)fail('Payment received cannot exceed the invoice amount.');
 if(paid>0&&!validDate(data.payment_date))fail('Enter a valid payment date.');
 if(paid>0&&!['Bank Transfer','UPI','Cash','Cheque','Card','Other'].includes(data.payment_mode))fail('Select a payment mode.');
 for(const k of ['invoice_reference','payment_reference'])if(data[k]!=null&&(typeof data[k]!=='string'||data[k].length>100))fail('Invoice/payment references must be text up to 100 characters.');
 if(!/^[a-zA-Z0-9-]{16,80}$/.test(data.request_key||''))fail('Customer request ID is required. Refresh the form and retry.');
 return {amount:amount/100,paid:paid/100};
}
async function create(db,data,userId,insert){
 const values=validate(data);await ensure(db);const c=await db.getConnection();
 const hash=crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
 try{await c.beginTransaction();
 const [[old]]=await c.query('SELECT o.*,c.customer_code FROM customer_opening_records o JOIN customers c ON c.id=o.customer_id WHERE o.request_key=? FOR UPDATE',[data.request_key]);
 if(old){if(old.payload_hash!==hash||Number(old.recorded_by)!==Number(userId))fail('Request ID was already used for different customer data.');await c.commit();return {id:old.customer_id,customer_code:old.customer_code};}
 const customer=await insert(c);
 await c.query('INSERT INTO customer_opening_records(customer_id,request_key,payload_hash,invoice_amount,amount_paid,invoice_reference,payment_date,payment_mode,payment_reference,recorded_by,plant_size_kw) VALUES (?,?,?,?,?,?,?,?,?,?,?)',[customer.id,data.request_key,hash,values.amount,values.paid,data.invoice_reference||null,values.paid?data.payment_date:null,values.paid?data.payment_mode:null,values.paid?data.payment_reference||null:null,userId,data.plant_size_kw || null]);
 await c.commit();return customer;
 }catch(e){await c.rollback();throw e;}finally{c.release();}
}
async function records(db,ids){await ensure(db);if(!ids.length)return [];const [rows]=await db.query('SELECT customer_id,plant_size_kw,invoice_amount,amount_paid,invoice_reference,payment_date,payment_mode,payment_reference,created_at FROM customer_opening_records WHERE customer_id IN (?)',[ids]);return rows;}
module.exports={ensure,validate,create,records};
