export const csvCell = value => {
  let text=String(value ?? '');
  if(typeof value==='string' && /^[\s]*[=+@-]/.test(text))text="'"+text;
  return '"'+text.replaceAll('"','""')+'"';
};
export const serializeCsv=(headers,rows)=>'\uFEFF'+[headers,...rows].map(row=>row.map(csvCell).join(',')).join('\r\n');
export function downloadCsv(headers,rows,filename){
  const url=URL.createObjectURL(new Blob([serializeCsv(headers,rows)],{type:'text/csv;charset=utf-8;'}));
  const link=document.createElement('a');link.href=url;link.download=filename;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
