const dayKey = value => {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(value);
  const key=String(value).slice(0,10);
  return /^\d{4}-\d{2}-\d{2}$/.test(key) && !Number.isNaN(Date.parse(key)) ? key : null;
};
const completed = project => Boolean(dayKey(project.completion_date)) || ['handover done','warranty period','completed'].includes(String(project.stage || '').trim().toLowerCase());
function buildEngineerReport({engineers,projects,logs=null,period='all',now=new Date()}) {
  const today=dayKey(now); const year=today.slice(0,4); const month=Number(today.slice(5,7));
  const start=period==='this_year'?`${year}-01-01`:period==='this_month'?`${year}-${String(month).padStart(2,'0')}-01`:period==='this_quarter'?`${year}-${String(Math.floor((month-1)/3)*3+1).padStart(2,'0')}-01`:null;
  const inRange=value=>!start || (dayKey(value)>=start && dayKey(value)<=today);
  const selectedProjects=projects.filter(project=>inRange(project.created_at));
  const selectedLogs=logs?.filter(log=>inRange(log.log_date || log.created_at));
  const enriched=selectedProjects.map(project=>({ ...project, completed:completed(project), overdue:!completed(project)&&Boolean(dayKey(project.installation_end_date))&&dayKey(project.installation_end_date)<today, stale:!completed(project)&&Boolean(dayKey(project.updated_at || project.created_at))&&(Date.parse(today)-Date.parse(dayKey(project.updated_at || project.created_at)))/86400000>30 }));
  const owners=new Set(engineers.map(engineer=>Number(engineer.id)));
  return {
    asOf:today, period, projectDateBasis:'created_at', logDateBasis:'log_date', logsAvailable:logs!==null,
    withoutEngineer:enriched.filter(project=>!owners.has(Number(project.assigned_to))).length,
    engineers:engineers.map(engineer=>{
      const assigned=enriched.filter(project=>Number(project.assigned_to)===Number(engineer.id));
      const authored=selectedLogs?.filter(log=>Number(log.created_by)===Number(engineer.id));
      return {id:engineer.id,name:engineer.full_name,email:engineer.email,status:engineer.status,total:assigned.length,active:assigned.filter(project=>!project.completed).length,completed:assigned.filter(project=>project.completed).length,overdue:assigned.filter(project=>project.overdue).length,stale:assigned.filter(project=>project.stale).length,capacityKw:assigned.reduce((sum,project)=>sum+(Number(project.system_capacity_kw)||0),0),workLogs:authored?.length??null,loggedHours:authored?.reduce((sum,log)=>sum+(Number(log.hours_worked)||0),0)??null,lastLog:authored?.map(log=>dayKey(log.log_date || log.created_at)).filter(Boolean).sort().at(-1) || null,projects:assigned};
    })
  };
}
module.exports={buildEngineerReport};
