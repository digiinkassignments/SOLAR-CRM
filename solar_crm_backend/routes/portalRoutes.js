const router = require('express').Router();
const { verifyToken } = require('../middleware/authMiddleware');
router.get('/dashboard', verifyToken, async (req, res) => {
  if (!req.portalRole)
    return res.status(403).json({ success: false, message: 'Use your assigned dashboard.' });
  try {
    const db = req.db,
      finance = req.portalRole === 'finance';
    let metrics, attention, breakdown;
    let stuckByStage = [];
    if (finance) {
      const [[invoices]] = await db.query(
        'SELECT COUNT(*) AS total_invoices,COALESCE(SUM(net_payable_amount),0) AS invoiced,COALESCE(SUM(amount_paid),0) AS paid,COALESCE(SUM(balance_due),0) AS due FROM invoices'
      );
      const [[quotes]] = await db.query('SELECT COUNT(*) AS quotations FROM quotations');
      const [[customers]] = await db.query('SELECT COUNT(*) AS customers FROM customers');
      const [[stock]] = await db.query(
        'SELECT COUNT(*) AS stock_items,COALESCE(SUM(current_stock*unit_price),0) AS stock_value,COALESCE(SUM(current_stock<=min_stock_level),0) AS low_stock FROM stock_items WHERE is_active=1'
      );
      const [rows] = await db.query(
        'SELECT id,invoice_number AS reference,customer_name,balance_due AS amount,due_date AS date,payment_status AS status FROM invoices WHERE balance_due>0 ORDER BY due_date IS NULL,due_date,id LIMIT 8'
      );
      await require('../services/customerOpening').ensure(db);
      await require('../services/customerLedger').ensure(db);
      const [[opening]] = await db.query(
        'SELECT COALESCE(SUM(invoice_amount),0) AS contract,COALESCE(SUM(amount_paid),0) AS paid,COALESCE(SUM(loan_disbursed_amount),0) AS loans,COALESCE(SUM(refund_paid_amount),0) AS refunded FROM customer_opening_records'
      );
      const [[gross]] = await db.query(
        'SELECT COALESCE(SUM(gross_total),0) AS amount FROM invoices'
      );
      const [[refund]] = await db.query(
        'SELECT COALESCE(SUM(amount),0) AS amount FROM customer_refunds'
      );
      const [loanTables] = await db.query(
        "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='solar_loans'"
      );
      let loanReceived = 0;
      if (loanTables.length) {
        const [[loans]] = await db.query(
          'SELECT COALESCE(SUM(disbursed_amount),0) AS amount FROM solar_loans'
        );
        loanReceived = Number(loans.amount);
      }
      const ledger = require('../services/customerLedger').summary(
        Number(gross.amount) + Number(opening.contract),
        Number(invoices.paid) + Number(opening.paid),
        loanReceived + Number(opening.loans),
        Number(refund.amount) + Number(opening.refunded)
      );
      metrics = {
        ...invoices,
        ...quotes,
        ...customers,
        ...stock,
        invoiced: ledger.contract_total,
        paid: ledger.total_received,
        due: ledger.balance,
        refunds_paid: ledger.refunds_paid,
        refund_due: ledger.refund_due,
      };
      attention = rows;
      const [stages] = await db.query(
        'SELECT payment_status AS label,COUNT(*) AS count FROM invoices GROUP BY payment_status'
      );
      breakdown = stages;
    } else {
      await require('../services/subsidySync').prepare(db);
      const tracker = await require('../models/subsidyModel').getAllSubsidies({limit:1},db);
      const stats = tracker.stats;
      stuckByStage = tracker.stuck_by_stage || [];
      const subsidies = {applications:Number(stats.total_projects || 0),credited:Number(stats.count_credited || 0),
        rejected:Number(stats.count_rejected || 0),expected:Number(stats.total_expected_subsidy || 0),
        received:Number(stats.total_disbursed_subsidy || 0),pending_amount:Number(stats.pending_subsidy_amount || 0),
        pending_projects:Number(stats.pending_projects || 0),stuck_applications:Number(stats.stuck_applications || 0),
        credited_this_month:Number(stats.credited_this_month || 0)};
      const [[loans]] = await db.query(
        "SELECT COUNT(*) AS loans,COALESCE(SUM(side_status='Active' AND loan_stage<>'Disbursed'),0) AS active_loans,COALESCE(SUM(disbursed_amount),0) AS loan_disbursed FROM solar_loans"
      );
      const [rows] = await db.query(
        `SELECT COALESCE(CAST(s.lead_id AS CHAR),CONCAT('project-',p.id)) AS id,
          COALESCE(l.lead_code,p.project_number) AS reference,COALESCE(l.customer_name,p.customer_name) AS customer_name,
          s.expected_subsidy AS amount,s.updated_at AS date,s.portal_status AS status
          FROM subsidy_applications s LEFT JOIN leads l ON l.id=s.lead_id LEFT JOIN projects p ON p.id=s.project_id
          WHERE ((p.id IS NOT NULL AND p.is_deleted=0) OR (s.project_id IS NULL AND l.is_deleted=0))
          AND s.portal_status<>'subsidy_credited' ORDER BY s.updated_at,s.id LIMIT 8`
      );
      metrics = { ...subsidies, ...loans };
      attention = rows;
      const [stages] = await db.query(
        `SELECT s.portal_status AS label,COUNT(*) AS count FROM subsidy_applications s
          LEFT JOIN leads l ON l.id=s.lead_id LEFT JOIN projects p ON p.id=s.project_id
          WHERE ((p.id IS NOT NULL AND p.is_deleted=0) OR (s.project_id IS NULL AND l.is_deleted=0)) GROUP BY s.portal_status`
      );
      breakdown = stages;
    }
    res.json({
      success: true,
      data: {
        role: req.portalRole,
        metrics,
        attention,
        breakdown,
        stuck_by_stage: stuckByStage,
        updated_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Portal dashboard:', error.message);
    res
      .status(500)
      .json({ success: false, message: 'Dashboard data could not load. Please retry.' });
  }
});
module.exports = router;
