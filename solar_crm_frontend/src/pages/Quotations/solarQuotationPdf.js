import { jsPDF } from 'jspdf';
import { readTaxSummary } from '../../utils/solarTax';

const money = value => 'Rs. ' + Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const date = value => {
  if (!value) return 'Not specified';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? 'Not specified' : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};
const plain = value => String(value ?? '').replace(/[\u2018\u2019]/g, "'").replace(/[\u201c\u201d]/g, '"').replace(/[\u2013\u2014]/g, '-').replace(/[\u2022\u00b7]/g, ' / ').replace(/\u20b9/g, 'Rs. ').replace(/\u00a0/g, ' ');

// A dedicated document renderer: fixed A4 geometry, searchable text and real page boundaries.
// It never changes the quotation's persisted prices, GST, scope or acceptance state.
export function createSolarQuotationPdf({ quotation: q, company = {}, logoSrc, lineItems = [], totals: t, isAccepted, aiInsights }) {
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });
  const left = 16, right = 194, width = right - left, bottom = 278;
  const companyName = company?.company_name?.trim() || 'Solar Power Solutions';
  const reference = q.quotation_number || 'Solar quotation';
  const composite = q.gst_mode === 'solar_composite';
  let y = 16;
  pdf.setProperties({ title: `Quotation ${reference}`, subject: 'Solar system supply and installation proposal', author: companyName, creator: companyName });

  function font(size = 10, bold = false, grey = 35) {
    pdf.setFont('helvetica', bold ? 'bold' : 'normal'); pdf.setFontSize(size); pdf.setTextColor(grey, grey, grey);
  }
  function text(value, x, top, { size = 10, bold = false, grey = 35, align = 'left' } = {}) {
    const str = plain(value); font(size, bold, grey);
    if (!/[^\x20-\x7e\n\r\t\u00a0-\u00ff]/.test(str)) { pdf.text(str, x, top, { baseline: 'top', align }); return; }
    // Preserve names/addresses in Indian scripts without replacing unsupported glyphs.
    const canvas = document.createElement('canvas'), context = canvas.getContext('2d'), scale = 3;
    const px = size * 96 / 72; context.font = `${bold ? '700' : '400'} ${px}px Arial, sans-serif`;
    canvas.width = Math.max(1, Math.ceil(context.measureText(str).width * scale + 8)); canvas.height = Math.ceil(px * 1.7 * scale);
    context.scale(scale, scale); context.font = `${bold ? '700' : '400'} ${px}px Arial, sans-serif`; context.fillStyle = `rgb(${grey},${grey},${grey})`; context.textBaseline = 'top'; context.fillText(str, 0, px * .12);
    const w = canvas.width / scale * 25.4 / 96, h = canvas.height / scale * 25.4 / 96;
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', align === 'right' ? x - w : x, top, w, h);
  }
  function wrap(value, maxWidth, size = 10, bold = false) {
    const str=plain(value);
    if(/[^\x20-\x7e\n\r\t\u00a0-\u00ff]/.test(str)){
      const context=document.createElement('canvas').getContext('2d');context.font=`${bold?'700':'400'} ${size*96/72}px Arial, sans-serif`;
      const limit=maxWidth*96/25.4,out=[];let line='';
      for(const word of str.split(/\s+/)){const next=line?line+' '+word:word;if(line&&context.measureText(next).width>limit){out.push(line);line=word;}else line=next;}
      if(line)out.push(line);return out.length?out:[''];
    }
    font(size, bold); return pdf.splitTextToSize(str, maxWidth);
  }
  function lines(value, x, top, maxWidth, options = {}) {
    const leading = options.leading || 4.6;
    wrap(value, maxWidth, options.size || 10, options.bold).forEach((line, i) => text(line, x, top + i * leading, options));
    return top + wrap(value, maxWidth, options.size || 10, options.bold).length * leading;
  }
  function rule(top, dark = false) { pdf.setDrawColor(dark ? 25 : 215); pdf.setLineWidth(dark ? .5 : .2); pdf.line(left, top, right, top); }
  function newPage() {
    pdf.addPage();
    const label = wrap(companyName, 102, 9, true)[0];
    text(label, left, 12, {size:9,bold:true}); text(`${reference}  |  Continued`, right, 12, {size:8.5,align:'right',grey:95});
    rule(20); y = 27;
  }
  function ensure(height) { if (y + height > bottom) newPage(); }
  function section(title) { ensure(18); y += 3; text(title, left, y, {size:11,bold:true,grey:20}); y += 7; rule(y); y += 5; }
  function paragraph(value, options = {}) {
    const size = options.size || 9.5, leading = options.leading || 4.8;
    for (const raw of plain(value).split('\n')) {
      if (!raw.trim()) { y += 2.5; continue; }
      const parts = wrap(raw, width, size);
      for (const line of parts) { ensure(leading); text(line, left, y, {size,grey:options.grey || 55}); y += leading; }
    }
  }

  // Company identity and document metadata share a clear, consistent top baseline.
  let companyY = y;
  if (logoSrc) {
    const image = pdf.getImageProperties(logoSrc);
    const scale = Math.min(38 / image.width, 16 / image.height);
    const w = image.width * scale, h = image.height * scale;
    pdf.addImage(logoSrc, image.fileType, left, companyY, w, h);
    companyY += h + 4;
  }
  companyY = lines(companyName, left, companyY, 103, {size:16,bold:true,leading:6.5}) + 2;
  const address = [company?.address || company?.company_address, company?.city, company?.state, company?.pincode, company?.country].filter(Boolean).join(', ');
  for (const value of [address, company?.company_phone ? `Tel: ${company.company_phone}` : '', company?.company_email, company?.website, company?.gst_number ? `GSTIN: ${company.gst_number}` : '', company?.pan_number ? `PAN: ${company.pan_number}` : ''].filter(Boolean)) companyY = lines(value,left,companyY,103,{size:9,leading:4.3,grey:75});
  text('QUOTATION',right,16,{size:23,bold:true,align:'right',grey:15});
  let metaY = 31;
  for (const [label,value] of [['Quotation no.',reference],['Revision',`R${q.revision_number || 1}`],['Issue date',date(q.created_at)],['Valid until',date(q.valid_until)],['Status',q.status || 'Sent']]) {
    text(label,127,metaY,{size:8.5,grey:100});
    const valueLines = wrap(value, 43, 9, true);
    valueLines.forEach((line,i)=>text(line,right,metaY+i*4.3,{size:9,bold:true,align:'right'})); metaY += Math.max(6,valueLines.length*4.3+1.5);
  }
  y = Math.max(companyY,metaY)+6; rule(y,true); y += 7;
  const customerAddress = [q.customer_address,q.city,q.state,q.pincode].filter(Boolean).join(', ');
  text('PREPARED FOR',left,y,{size:8,bold:true,grey:100});text('PROJECT / INSTALLATION',110,y,{size:8,bold:true,grey:100});y+=6;
  let customerY=lines(q.customer_name || 'Customer',left,y,85,{size:12,bold:true,leading:5});
  for(const value of [customerAddress,q.customer_phone?`Phone: ${q.customer_phone}`:'',q.customer_email].filter(Boolean))customerY=lines(value,left,customerY+1,85,{size:9.5,leading:4.5,grey:65});
  let projectY=lines(`${q.system_capacity_kw || '-'} kW rooftop solar system`,110,y,84,{size:12,bold:true,leading:5});
  projectY=lines(`System type: ${q.system_type || 'To be confirmed'}`,110,projectY+2,84,{size:9.5,grey:65});
  projectY=lines(`Installation site: ${customerAddress || 'To be confirmed'}`,110,projectY+1,84,{size:9.5,grey:65});
  y=Math.max(customerY,projectY)+6;

  section('01  Supply & commercial offer');
  const rows=lineItems.length?lineItems:[{name:`Solar ${q.system_type || ''} system`,description:q.system_capacity_kw?`${q.system_capacity_kw} kW supply as specified below`:'Supply as specified below',quantity:1,unit:'System',unit_price:t.base},...(t.structure>0?[{name:'Structure & installation',quantity:1,unit:'Service',unit_price:t.structure}]:[])];
  const edges=[left,24,91,108,137,154,right];
  function tableHeader(continued=false) {
    if(continued){text('SUPPLY & COMMERCIAL OFFER - CONTINUED',left,y,{size:8,bold:true,grey:95});y+=6;}
    pdf.setFillColor(240,240,240);pdf.rect(left,y,width,9,'F');
    ['#','Description','Qty','Unit rate',composite?'GST*':'GST',composite || !lineItems.length?'Taxable value':'Amount'].forEach((label,i)=>text(label,i<2?edges[i]+2:edges[i+1]-2,y+2.5,{size:8,bold:true,align:i<2?'left':'right'}));y+=9;
  }
  tableHeader();
  rows.forEach((item,index)=>{
    const desc=[...wrap(item.name || 'Item / service',63,9.5,true).map(value=>({value,bold:true,size:9.5})),...(item.description?wrap(item.description,63,9).map(value=>({value,size:9,grey:80})):[]),...(item.hsn_code?[{value:`HSN/SAC: ${item.hsn_code}`,size:8,grey:100}]:[])];
    const minimum=16,height=Math.max(minimum,desc.length*4.3+6);
    if((height<=215 && y+height>bottom) || bottom-y<16){newPage();tableHeader(true);}
    let offset=0;
    do {
      let capacity=Math.floor((bottom-y-6)/4.3);
      if(capacity<1){newPage();tableHeader(true);capacity=Math.floor((bottom-y-6)/4.3);}
      const part=desc.slice(offset,offset+capacity),h=Math.max(minimum,part.length*4.3+6),first=offset===0;
      text(first?index+1:'cont.',left+2,y+3,{size:8.5,grey:80});
      part.forEach((line,i)=>text(line.value,edges[1]+2,y+3+i*4.3,{size:line.size,bold:line.bold,grey:line.grey||35}));
      if(first){
        text(Number(item.quantity || 0).toLocaleString('en-IN'),edges[3]-2,y+3,{size:9,align:'right'});
        wrap(item.unit || '',13,7.5).forEach((unit,i)=>text(unit,edges[3]-2,y+8+i*3.5,{size:7.5,grey:100,align:'right'}));
        text(money(item.unit_price),edges[4]-2,y+3,{size:8.5,align:'right'});
        text(composite?'Split*':`${Number(lineItems.length ? item.gst_rate || 0 : t.gstRate)}%`,edges[5]-2,y+3,{size:8.5,align:'right'});
        const taxable=Number(item.taxable_after_discount ?? (Number(item.quantity || 0)*Number(item.unit_price || 0)));
        const value=composite || !lineItems.length?taxable:Number(item.total_amount ?? (taxable+Number(item.gst_amount || 0)));
        text(money(value),right-2,y+3,{size:9,bold:true,align:'right'});
      }
      y+=h;rule(y);offset+=part.length;
      if(offset<desc.length){newPage();tableHeader(true);}
    }while(offset<desc.length);
  });
  y+=3;paragraph(composite?'* GST is calculated on the complete system using the 70:30 goods/services split shown below.':lineItems.length?'Item amounts include their recorded GST after any allocated discount.':'Item values exclude GST. The recorded discount and GST are shown in the commercial summary.',{size:8,leading:4,grey:100});

  // Tax explanation and totals use separate columns, rather than nested UI cards.
  ensure(t.subsidy>0?88:65);y+=5;const summaryTop=y;
  text('TAX SUMMARY',left,y,{size:8.5,bold:true,grey:90});let taxY=y+6;
  const tax=readTaxSummary(q);
  if(composite&&tax){
    taxY=lines(`Goods (70%): ${money(tax.goodsValue)}`,left,taxY,82,{size:9,leading:4.5});taxY=lines(`GST at 5%: ${money(tax.goodsTax)}`,left,taxY+1,82,{size:9,leading:4.5});
    taxY=lines(`Services (30%): ${money(tax.serviceValue)}`,left,taxY+3,82,{size:9,leading:4.5});taxY=lines(`GST at 18%: ${money(tax.serviceTax)}`,left,taxY+1,82,{size:9,leading:4.5});
    taxY=lines(`Effective GST: ${tax.effectiveRate ?? 8.9}%`,left,taxY+3,82,{size:9,bold:true,leading:4.5});
  }else taxY=lines(composite?'Complete-system composite GST. Refer to the recorded total tax.':lineItems.length?'Item-wise GST is included in the recorded line amounts.':`GST rate: ${t.gstRate}%`,left,taxY,80,{size:9,leading:4.5,grey:80});
  let totalY=summaryTop;
  for(const [label,value]of [['Subtotal',t.base+t.structure],...(t.discount>0?[['Discount',-t.discount]]:[]),['Taxable value',t.taxable],['Total GST',t.gst]]){text(label,110,totalY,{size:9.5,grey:65});text(money(value),right,totalY,{size:9.5,align:'right'});totalY+=6;}
  pdf.setDrawColor(30);pdf.setLineWidth(.35);pdf.line(110,totalY,right,totalY);totalY+=4;
  text('QUOTATION TOTAL',110,totalY,{size:9,bold:true});text(money(t.total),right,totalY+6,{size:16,bold:true,align:'right',grey:15});totalY+=16;
  if(t.subsidy>0){text('Estimated eligible subsidy',110,totalY,{size:8.5,grey:85});text(money(t.subsidy),right,totalY+5,{size:10,align:'right'});totalY+=12;text('Estimated cost after subsidy',110,totalY,{size:8.5,grey:85});text(money(t.net),right,totalY+5,{size:11,bold:true,align:'right'});totalY+=12;}
  y=Math.max(taxY,totalY)+4;
  if(t.subsidy>0)paragraph('Subsidy is subject to scheme eligibility and government approval. It is an estimate, not a confirmed receipt or installer discount.',{size:8.5,leading:4.2,grey:95});

  section('02  Proposed system specifications');
  for(const [label,value]of [['Solar modules',[q.panel_brand,q.panel_type,q.panel_count?`${q.panel_count} panels`:''].filter(Boolean).join(' / ')],['Inverter',[q.inverter_brand,q.inverter_capacity_kw?`${q.inverter_capacity_kw} kW`:''].filter(Boolean).join(' / ')],['Mounting structure',q.structure_type],...(q.battery_capacity_ah?[['Battery capacity',`${q.battery_capacity_ah} Ah`]]:[])]){
    const parts=wrap(value || 'To be confirmed',125,9.5),height=parts.length*4.7+5;ensure(height);text(label,left,y,{size:9.5,bold:true});parts.forEach((line,i)=>text(line,65,y+i*4.7,{size:9.5,grey:65}));y+=height;rule(y-2);
  }
  section('03  Terms, scope & validity');
  paragraph(q.terms_and_conditions || 'Payment schedule, delivery timeline and scope exclusions are to be confirmed in writing before order acceptance.');
  if(q.notes){ensure(15);y+=4;text('Additional notes / scope',left,y,{size:9.5,bold:true});y+=6;paragraph(q.notes);}
  y+=3;ensure(7);text(`Offer valid until: ${date(q.valid_until)}`,left,y,{size:9.5,bold:true});y+=8;

  const bank=[['Bank',company?.bank_name],['Account name',company?.account_name],['Account number',company?.account_number],['IFSC',company?.ifsc_code],['Branch',company?.branch_name],['UPI ID',company?.upi_id]].filter(([,value])=>value);
  if(bank.length){section('04  Payment details');for(let i=0;i<bank.length;i+=2){const pair=bank.slice(i,i+2),height=Math.max(...pair.map(([,value])=>wrap(value,82,9.5).length))*4.6+8;ensure(height);pair.forEach(([label,value],j)=>{const x=j?110:left;text(label.toUpperCase(),x,y,{size:8,grey:100});lines(value,x,y+5,82,{size:9.5,bold:true,leading:4.6});});y+=height;}paragraph(`Please mention quotation ${reference} in your payment reference.`,{size:8.5,grey:90});}

  const estimates=[['Annual generation',aiInsights?.financial_highlights?.annual_units_generated],['Annual savings',aiInsights?.financial_highlights?.annual_savings],['Estimated payback',aiInsights?.financial_highlights?.estimated_payback_years],['Estimated savings over 25 years',aiInsights?.financial_highlights?.lifetime_savings_25yr]].filter(([,v])=>v!==undefined&&v!==null&&v!=='');
  if(estimates.length){section('Indicative performance estimates');for(const[label,value]of estimates)paragraph(`${label}: ${value}`);paragraph('Estimates depend on site conditions, irradiation, shading and usage. These are not guaranteed generation or financial returns.',{size:8.5,grey:95});}
  const acceptance=isAccepted?`Accepted by ${q.customer_signature_name || q.customer_name}\nAccepted on ${date(q.accepted_at)}`:'';
  ensure(Math.max(38,wrap(acceptance,84,9).length*4.5+20));y+=5;rule(y);y+=6;
  const labelEnd=lines(`FOR ${companyName}`,left,y,84,{size:8,bold:true,grey:85,leading:4});text('CUSTOMER ACCEPTANCE',110,y,{size:8,bold:true,grey:85});y=Math.max(y+11,labelEnd+5);
  let acceptedEnd=y;if(acceptance)acceptedEnd=lines(acceptance,110,y,84,{size:9,leading:4.5});
  y=Math.max(y+8,acceptedEnd+3);text('Authorized signatory',left,y,{size:9.5,bold:true});if(!isAccepted)text('Signature / name / date',110,y,{size:9.5,grey:85});
  const pages=pdf.internal.getNumberOfPages();for(let page=1;page<=pages;page++){pdf.setPage(page);rule(284);text(wrap(companyName,94,7.5)[0],left,287,{size:7.5,grey:105});text(`${reference}  |  Page ${page} of ${pages}`,right,287,{size:7.5,align:'right',grey:105});}
  return pdf;
}

export async function downloadSolarQuotationPdf(options) {
  const pdf=createSolarQuotationPdf(options);
  await pdf.save(`Solar_Quotation_${String(options.quotation.quotation_number || 'Proposal').replace(/[^a-zA-Z0-9_-]/g,'_')}.pdf`,{returnPromise:true});
}
