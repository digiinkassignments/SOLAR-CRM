const managerScope=require("../utils/managerScope");
const { buildEngineerReport } = require('../utils/engineerReport');
const engineerReport = async (req,res) => {
  if(![1,2].includes(Number(req.user?.role_id)))return res.status(403).json({success:false,message:'Administrator access is required for engineer reports.'});
  const period=req.query.period || 'all';
  if(!['all','this_month','this_quarter','this_year'].includes(period))return res.status(400).json({success:false,message:'Invalid report period.'});
  if(!req.db)return res.status(503).json({success:false,message:'Reporting database is unavailable.'});
  try {
    const [engineers]=await req.db.query('SELECT id, full_name, email, status FROM users WHERE role_id = 4 AND is_deleted = 0 ORDER BY full_name, id');
    const [projects]=await req.db.query(`SELECT id, project_number, customer_name, assigned_to, system_capacity_kw, stage, installation_start_date, installation_end_date, completion_date, created_at, updated_at FROM projects WHERE is_deleted = 0${managerScope.linked(req.db,"projects.lead_id")} ORDER BY created_at DESC, id DESC`);
    let logs=null;
    try { [logs]=await req.db.query(`SELECT l.project_id, l.created_by, l.log_date, l.hours_worked, l.created_at FROM installation_logs l INNER JOIN projects p ON p.id=l.project_id AND p.is_deleted=0 WHERE l.is_deleted=0${managerScope.linked(req.db,"p.lead_id")}`); }
    catch(error) { if(!['ER_NO_SUCH_TABLE','ER_BAD_FIELD_ERROR'].includes(error.code))throw error; }
    return res.json({success:true,data:buildEngineerReport({engineers:managerScope.managerId(req.db)?engineers.filter(e=>projects.some(p=>Number(p.assigned_to)===Number(e.id))):engineers,projects,logs,period})});
  }catch(error){console.error('Engineer report error:',error.message);return res.status(500).json({success:false,message:'Unable to load engineer reports. Please retry.'});}
};
module.exports={engineerReport};
