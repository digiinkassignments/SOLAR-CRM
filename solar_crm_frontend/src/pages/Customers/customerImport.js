export const importColumns = ['customer_name','mobile_number','email','address','city','state','pincode','solar_requirement','Plant size','Final amount','Payment recieved','lead_source','notes'];
export const importExample = ['Example Customer','9876543210','customer@example.com','Site address','Jaipur','Rajasthan','302001','Residential','','','','Referral','Site instructions'];
const aliases={name:'customer_name',customer:'customer_name',phone:'mobile_number',mobile:'mobile_number',source:'lead_source',customer_type:'solar_requirement',type:'solar_requirement',plant_size:'plant_size_kw',plant_size_kw:'plant_size_kw',final_amount:'invoice_amount',invoice_amount:'invoice_amount',payment_recieved:'payment_amount',payment_received:'payment_amount',payment_amount:'payment_amount'};
const accepted=new Set(['customer_name','mobile_number','email','address','city','state','pincode','solar_requirement','plant_size_kw','invoice_amount','payment_amount','lead_source','notes']);
export function normalizeImportRow(row){
 const result={};
 for(const [key,value] of Object.entries(row)){
  const header=key.replace(/^\uFEFF/,'').trim().toLowerCase().replace(/[\s-]+/g,'_');const target=aliases[header]||header;
  if(!accepted.has(target))continue;
  if(Object.hasOwn(result,target))throw Error(`Duplicate column for ${target}. Keep only one matching column.`);
  result[target]=String(value??'').trim();
 }
 return result;
}
