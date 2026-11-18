const router=require('express').Router();const {verifyToken}=require('../middleware/authMiddleware');
router.get('/dashboard',verifyToken,async(req,res)=>{
  if(!req.portalRole)return res.status(403).json({success:false,message:'Use your assigned dashboard.'});
  try{
    const db=req.db,finance=req.portalRole==='finance';let metrics,attention,breakdown;
    if(finance){
      const [[invoices]]=await db.query('SELECT COUNT(*) AS total_invoices,COALESCE(SUM(net_payable_amount),0) AS invoiced,COALESCE(SUM(amount_paid),0) AS paid,COALESCE(SUM(balance_due),0) AS due FROM invoices');
      const [[quotes]]=await db.query('SELECT COUNT(*) AS quotations FROM quotations');
      const [[customers]]=await db.query('SELECT COUNT(*) AS customers FROM customers');
      const [[stock]]=await db.query('SELECT COUNT(*) AS stock_items,COALESCE(SUM(current_stock*unit_price),0) AS stock_value,COALESCE(SUM(current_stock<=min_stock_level),0) AS low_stock FROM stock_items WHERE is_active=1');
      const [rows]=await db.query("SELECT id,invoice_number AS reference,customer_name,balance_due AS amount,due_date AS date,payment_status AS status FROM invoices WHERE balance_due>0 ORDER BY due_date IS NULL,due_date,id LIMIT 8");
      metrics={...invoices,...quotes,...customers,...stock};attention=rows;
      const [stages]=await db.query('SELECT payment_status AS label,COUNT(*) AS count FROM invoices GROUP BY payment_status');breakdown=stages;
    }else{
      const [[subsidies]]=await db.query("SELECT COUNT(*) AS applications,COALESCE(SUM(portal_status IN ('subsidy_credited','disbursed')),0) AS credited,COALESCE(SUM(portal_status='rejected'),0) AS rejected,COALESCE(SUM(expected_subsidy),0) AS expected,COALESCE(SUM(amount_received),0) AS received FROM subsidy_applications s JOIN leads l ON s.lead_id=l.id WHERE l.is_deleted=0");
      const [[loans]]=await db.query("SELECT COUNT(*) AS loans,COALESCE(SUM(side_status='Active' AND loan_stage<>'Disbursed'),0) AS active_loans,COALESCE(SUM(disbursed_amount),0) AS loan_disbursed FROM solar_loans");
      const [rows]=await db.query("SELECT s.lead_id AS id,l.lead_code AS reference,l.customer_name,s.expected_subsidy AS amount,s.updated_at AS date,s.portal_status AS status FROM subsidy_applications s JOIN leads l ON l.id=s.lead_id WHERE l.is_deleted=0 AND s.portal_status NOT IN ('subsidy_credited','disbursed') ORDER BY s.updated_at,s.id LIMIT 8");
      metrics={...subsidies,...loans};attention=rows;
      const [stages]=await db.query('SELECT portal_status AS label,COUNT(*) AS count FROM subsidy_applications s JOIN leads l ON l.id=s.lead_id WHERE l.is_deleted=0 GROUP BY portal_status');breakdown=stages;
    }
    res.json({success:true,data:{role:req.portalRole,metrics,attention,breakdown,updated_at:new Date().toISOString()}});
  }catch(error){console.error('Portal dashboard:',error.message);res.status(500).json({success:false,message:'Dashboard data could not load. Please retry.'});}
});module.exports=router;
