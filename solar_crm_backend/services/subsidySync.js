const schema = require('./subsidySyncSchema');
const rules = require('./subsidyRules');
const FIELDS = [
  'consumer_number',
  'application_number',
  'sanctioned_capacity_kw',
  'scheme_name',
  'portal_status',
  'submission_date',
  'approval_date',
  'subsidy_amount',
  'portal_notes',
  'discom_name',
  'discom_division',
  'bank_name',
  'bank_account_no',
  'bank_ifsc',
  'bank_account_holder',
  'panel_make_model',
  'panel_serial_numbers',
  'is_dcr_compliant',
  'inverter_make_model',
  'inverter_serial_number',
  'expected_subsidy',
  'amount_received',
  'credit_date',
  'utr_number',
  'customer_total_cost',
  'customer_amount_paid',
  'customer_balance',
  'sla_expected_days',
  'shortfall_remark',
];
async function companyTimeZone(db) {
  try {
    const [[settings]] = await db.query('SELECT timezone FROM settings LIMIT 1');
    if (settings?.timezone) {
      rules.today(settings.timezone);
      return settings.timezone;
    }
  } catch (error) {
    if (
      !['ER_NO_SUCH_TABLE', 'ER_BAD_FIELD_ERROR'].includes(error.code) &&
      !(error instanceof RangeError)
    )
      throw error;
  }
  return 'Asia/Kolkata';
}
async function stage(db, project, target, actor, trackerId, note) {
  if (project.stage === target) return;
  await db.query('UPDATE projects SET stage=?,stage_updated_at=NOW() WHERE id=?', [
    target,
    project.id,
  ]);
  await db.query(
    `INSERT INTO project_stage_logs(project_id,from_stage,to_stage,changed_by,notes)
    VALUES (?,?,?,?,?)`,
    [project.id, project.stage, target, actor || null, note]
  );
  await db.query(
    `INSERT INTO subsidy_sync_logs(tracker_id,project_id,actor_id,from_stage,to_stage,status)
    VALUES (?,?,?,?,?,'synced')`,
    [trackerId || null, project.id, actor || null, project.stage, target]
  );
  if (target === 'Subsidy Received') {
    await db.query(
      `INSERT INTO notifications(user_id,title,body,type,reference_id)
      SELECT DISTINCT u.id,'Subsidy credited',?,'subsidy_credited',? FROM users u
      WHERE u.status='Active' AND u.is_deleted=0 AND (u.id=?
        OR u.id IN (SELECT assigned_to FROM leads WHERE id=?)
        OR u.id IN (SELECT manager_id FROM users WHERE id IN (SELECT assigned_to FROM leads WHERE id=?)))`,
      [
        `Project ${project.project_number || project.id}: subsidy credit verified in the Subsidy Tracker.`,
        project.id,
        project.assigned_to,
        project.lead_id,
        project.lead_id,
      ]
    );
  }
  project.stage = target;
}
async function syncLocked(db, project, tracker, actor) {
  const [[handover]] = await db.query(
    `SELECT handover_status,handover_date FROM project_handover
    WHERE project_id=? AND is_deleted=0 LIMIT 1`,
    [project.id]
  );
  const handedOver = handover?.handover_status === 'Completed' && Boolean(handover.handover_date);
  let credited = tracker?.portal_status === 'subsidy_credited';
  if (credited) {
    const [[commissioning]] = await db.query(
      'SELECT commission_date FROM project_commissioning WHERE project_id=? AND is_deleted=0 LIMIT 1',
      [project.id]
    );
    try {
      rules.validateTransition(tracker, tracker, {
        commissioningDate: commissioning?.commission_date,
        timeZone: await companyTimeZone(db),
      });
    } catch (error) {
      if (!error.status) throw error;
      credited = false;
      await db.query('UPDATE projects SET subsidy_legacy_manual=1 WHERE id=?', [project.id]);
      await db.query(
        `INSERT INTO subsidy_sync_logs(tracker_id,project_id,actor_id,status,error_code)
        SELECT ?,?,?,'failed','LEGACY_CREDIT_REQUIRES_REVIEW'
        WHERE NOT EXISTS(SELECT 1 FROM subsidy_sync_logs WHERE tracker_id=? AND error_code='LEGACY_CREDIT_REQUIRES_REVIEW' AND created_at>=CURRENT_DATE())`,
        [tracker.id, project.id, actor || null, tracker.id]
      );
      tracker = { ...tracker, portal_status: 'bank_details_submitted' };
    }
  }
  await db.query(
    `UPDATE projects SET subsidy_pending_handover=?,subsidy_claim_pending_handover=?,subsidy_reopened=?,
    subsidy_received_amount=?,subsidy_credit_date=?,subsidy_utr_number=?,
    subsidy_credited_by=?,subsidy_credited_at=?,warranty_anchor_date=COALESCE(warranty_anchor_date,?)
    WHERE id=?`,
    [
      credited && !handedOver ? 1 : 0,
      tracker?.portal_status === 'bank_details_submitted' && !handedOver ? 1 : 0,
      tracker?.reopened || 0,
      credited ? tracker.amount_received : null,
      credited ? tracker.credit_date : null,
      credited ? tracker.utr_number : null,
      credited ? tracker.credited_by : null,
      credited ? tracker.credited_at : null,
      handedOver ? handover.handover_date : null,
      project.id,
    ]
  );
  if (!handedOver) return;
  // Handover is independent of the subsidy claim, but it never skips unfinished engineering work.
  if (rules.PROJECT_STAGES.indexOf(project.stage) < rules.PROJECT_STAGES.indexOf('Commissioning'))
    return;
  if (project.stage === 'Commissioning')
    await stage(db, project, 'Handover Done', actor, tracker?.id, 'Customer handover completed.');
  if (tracker?.reopened && !credited) {
    await stage(
      db,
      project,
      'Subsidy Applied',
      actor,
      tracker.id,
      'Subsidy reopened with Super Admin approval. Warranty dates retained.'
    );
    return;
  }
  for (const target of rules.plannedStages(
    project.stage,
    tracker,
    handedOver,
    Number(project.subsidy_applicable) !== 0
  ))
    await stage(db, project, target, actor, tracker?.id, 'Automatic update from Subsidy Tracker.');
}
const prepared = new WeakMap();
async function prepare(db) {
  if (prepared.has(db)) return prepared.get(db);
  const work = (async () => {
    // Schema changes must finish before starting a business transaction (MySQL DDL implicitly commits).
    await require('../models/projectModel').ensureProjectTables(db);
    await require('../models/handoverModel').ensureHandoverTable(db);
    await require('../models/commissioningModel').ensureCommissioningTable(db);
    await require('../models/finalInspectionModel').ensureFinalInspectionTable(db);
    await schema.ensure(db);
  })();
  prepared.set(db, work);
  try {
    await work;
  } catch (error) {
    prepared.delete(db);
    throw error;
  }
}
async function saveAttempt(db, input, actor, access) {
  if (!access?.can_edit)
    throw rules.invalid(
      'Only Application Manager and Super Admin can edit the Subsidy Tracker.',
      403
    );
  await prepare(db);
  const timeZone = await companyTimeZone(db);
  const connection = await db.getConnection();
  let projectId = null;
  try {
    await connection.beginTransaction();
    const directProject = /^project-\d+$/.test(String(input.lead_id || ''));
    const [projects] = await connection.query(
      `SELECT * FROM projects WHERE ${directProject ? 'id' : 'lead_id'}=? AND is_deleted=0
      ORDER BY id FOR UPDATE`,
      [directProject ? Number(input.lead_id.slice(8)) : input.lead_id]
    );
    if (projects.length > 1)
      throw rules.invalid(
        'Multiple projects share this lead. Resolve the project link before updating subsidy.',
        409
      );
    const project = projects[0];
    if (directProject && !project) throw rules.invalid('Project not found.', 404);
    projectId = project?.id || null;
    const [[currentActor]] = await connection.query(
      `SELECT u.role_id,u.status,u.is_deleted,r.role_name FROM users u
      JOIN roles r ON r.id=u.role_id WHERE u.id=? FOR UPDATE`,
      [actor]
    );
    if (
      !currentActor ||
      currentActor.status !== 'Active' ||
      currentActor.is_deleted ||
      !(Number(currentActor.role_id) === 1 || currentActor.role_name === 'Application Manager')
    )
      throw rules.invalid('Your current role cannot edit the Subsidy Tracker.', 403);
    access = { can_edit: true, is_admin: Number(currentActor.role_id) === 1 };
    const leadId = directProject ? project?.lead_id || null : input.lead_id;
    const [applications] = await connection.query(
      `SELECT * FROM subsidy_applications WHERE ${directProject ? 'project_id' : 'lead_id'}=? FOR UPDATE`,
      [directProject ? projectId : leadId]
    );
    if (applications.length > 1)
      throw rules.invalid('Duplicate Subsidy Trackers require administrator review.', 409);
    const previous = applications[0];
    if (previous?.project_id && previous.project_id !== projectId)
      throw rules.invalid('The tracker project link no longer matches this lead.', 409);
    const next = {
      consumer_number: '',
      portal_status: 'registered',
      expected_subsidy: 78000,
      amount_received: 0,
      ...previous,
    };
    for (const key of FIELDS)
      if (Object.hasOwn(input, key)) {
        if (input[key] !== null && typeof input[key] === 'object')
          throw rules.invalid(`${key} must be a scalar value.`);
        next[key] = input[key] === '' ? null : input[key];
      }
    next.portal_status ||= 'registered';
    next.consumer_number ||= '';
    const [[commissioning]] = project
      ? await connection.query(
          `SELECT commission_date FROM project_commissioning
      WHERE project_id=? AND is_deleted=0 LIMIT 1`,
          [projectId]
        )
      : [[]];
    rules.validateTransition(previous, next, {
      commissioningDate: commissioning?.commission_date,
      timeZone,
      isAdmin: access?.is_admin,
      reason: input.correction_reason,
    });
    const warnings = [];
    if (next.portal_status === 'subsidy_credited') {
      if (project && Number(project.subsidy_applicable) === 0)
        throw rules.invalid(
          'Subsidy is Not applicable for this project. Super Admin must review applicability first.'
        );
      if (!project)
        throw rules.invalid('Link this application to a project before recording subsidy credit.');
      const [duplicates] = await connection.query(
        `SELECT id FROM subsidy_applications WHERE UPPER(TRIM(utr_number))=UPPER(TRIM(?))
        AND id<>? AND portal_status='subsidy_credited' LIMIT 1`,
        [next.utr_number, previous?.id || 0]
      );
      if (duplicates.length)
        warnings.push('This UTR is already recorded against another subsidy application.');
    }
    const changed = previous?.portal_status !== next.portal_status;
    const reopening = previous?.portal_status === 'subsidy_credited' && changed;
    if (
      next.portal_status === 'rejected' &&
      !String(input.rejection_category || previous?.rejection_category || '').trim()
    )
      throw rules.invalid(
        'Use Log Rejection and record the reason and Application Manager fix task.'
      );
    const columns = FIELDS;
    const values = columns.map((key) => next[key] ?? null);
    let id = previous?.id;
    if (id) {
      await connection.query(
        `UPDATE subsidy_applications SET ${columns.map((key) => `${key}=?`).join(',')},
        project_id=?,stage_started_at=IF(?,NOW(),stage_started_at),
        last_completed_stage=?,reopened=?,correction_reason=COALESCE(?,correction_reason),
        credited_by=IF(?, ?,credited_by),credited_at=IF(?,NOW(),credited_at) WHERE id=?`,
        [
          ...values,
          projectId,
          changed ? 1 : 0,
          next.portal_status === 'rejected' ? previous.last_completed_stage : next.portal_status,
          reopening ? 1 : next.portal_status === 'subsidy_credited' ? 0 : previous.reopened || 0,
          String(input.correction_reason || '').trim() || null,
          next.portal_status === 'subsidy_credited' && changed ? 1 : 0,
          actor,
          next.portal_status === 'subsidy_credited' && changed ? 1 : 0,
          id,
        ]
      );
    } else {
      const [result] = await connection.query(
        `INSERT INTO subsidy_applications(lead_id,project_id,${columns.join(',')},last_completed_stage)
        VALUES (${Array(columns.length + 3)
          .fill('?')
          .join(',')})`,
        [leadId, projectId, ...values, next.portal_status]
      );
      id = result.insertId;
    }
    if (input.rejection_category) {
      if (!String(input.rejection_reason || '').trim() || !String(input.fix_task || '').trim())
        throw rules.invalid('Rejection reason and an Application Manager fix task are required.');
      await connection.query(
        `INSERT INTO subsidy_rejection_logs(subsidy_id,lead_id,stage_at_rejection,
        rejection_category,rejection_reason,fix_task) VALUES (?,?,?,?,?,?)`,
        [
          id,
          leadId,
          previous?.portal_status || 'registered',
          input.rejection_category,
          input.rejection_reason,
          input.fix_task,
        ]
      );
      await connection.query(
        'UPDATE subsidy_applications SET rejection_category=?,rejection_fix_task=? WHERE id=?',
        [input.rejection_category, input.fix_task, id]
      );
    }
    const [[saved]] = await connection.query('SELECT * FROM subsidy_applications WHERE id=?', [id]);
    if (project) await syncLocked(connection, project, saved, actor);
    await connection.query(
      'INSERT INTO subsidy_access_audit(actor_id,action,resource_id) VALUES (?,?,?)',
      [actor, reopening ? 'credited_subsidy_corrected' : 'tracker_saved', id]
    );
    await connection.query(`INSERT INTO subsidy_sync_logs(tracker_id,project_id,actor_id,from_stage,to_stage,status)
      VALUES (?,?,?,?,?,'tracker_saved')`,[id,projectId,actor,previous?.portal_status || null,next.portal_status]);
    await connection.commit();
    return { id, warnings };
  } catch (error) {
    await connection.rollback();
    if (!error.status) {
      try {
        await connection.query(
          `INSERT INTO subsidy_sync_logs(project_id,actor_id,status,error_code)
          VALUES (?,?,'failed',?)`,
          [projectId, actor, String(error.code || 'SYNC_FAILED').slice(0, 100)]
        );
        await connection.query(
          `INSERT INTO notifications(user_id,title,body,type,reference_id)
          SELECT u.id,'Subsidy sync failed','The tracker save was rolled back. Retry the update; review the sync report if it fails again.',
          'subsidy_sync',? FROM users u JOIN roles r ON r.id=u.role_id
          WHERE u.status='Active' AND u.is_deleted=0 AND (u.role_id=1 OR r.role_name='Application Manager')
          AND NOT EXISTS(SELECT 1 FROM notifications n WHERE n.user_id=u.id AND n.type='subsidy_sync'
            AND n.reference_id <=> ? AND n.created_at>=CURRENT_DATE())`,
          [projectId, projectId]
        );
      } catch (logError) {
        console.error('Subsidy failure audit unavailable:', logError.code || 'AUDIT_FAILED');
      }
    }
    throw error;
  } finally {
    connection.release();
  }
}
async function save(db, input, actor, access) {
  try {
    return await saveAttempt(db, input, actor, access);
  } catch (error) {
    if (error.status) throw error;
    // One bounded retry. All database effects are transactional and stage sync is idempotent.
    return saveAttempt(db, input, actor, access);
  }
}
async function syncProject(db, projectId, actor) {
  await prepare(db);
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [[project]] = await connection.query(
      'SELECT * FROM projects WHERE id=? AND is_deleted=0 FOR UPDATE',
      [projectId]
    );
    if (project) {
      const [[tracker]] = await connection.query(
        'SELECT * FROM subsidy_applications WHERE project_id=? FOR UPDATE',
        [project.id]
      );
      await syncLocked(connection, project, tracker, actor);
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
async function initializeProject(db, projectId) {
  // Survey conversion can create a project inside an existing transaction.
  // Tenant migrations provision the schema; never execute DDL on that transaction connection.
  if (typeof db.getConnection === 'function') await prepare(db);
  const [[project]] = await db.query(
    'SELECT id,lead_id,customer_id,subsidy_applicable FROM projects WHERE id=? AND is_deleted=0',
    [projectId]
  );
  if (!project) return;
  let applicable = Number(project.subsidy_applicable) !== 0;
  let category = null;
  if (project.customer_id) {
    const [[customer]] = await db.query('SELECT solar_requirement FROM customers WHERE id=?', [
      project.customer_id,
    ]);
    category = customer?.solar_requirement;
  }
  if (!category && project.lead_id) {
    const [[lead]] = await db.query('SELECT solar_requirement FROM leads WHERE id=?', [
      project.lead_id,
    ]);
    category = lead?.solar_requirement;
  }
  if (category && !/residential|home/i.test(category)) {
    await db.query('UPDATE projects SET subsidy_applicable=0 WHERE id=?', [projectId]);
    applicable = false;
  }
  if (project.lead_id) {
    const [[count]] = await db.query(
      'SELECT COUNT(*) AS n FROM projects WHERE lead_id=? AND is_deleted=0',
      [project.lead_id]
    );
    if (Number(count.n) !== 1) return;
    const [legacy] = await db.query(
      'SELECT id,project_id FROM subsidy_applications WHERE lead_id=?',
      [project.lead_id]
    );
    if (legacy.length > 1) return;
    if (legacy.length === 1) {
      if (!legacy[0].project_id)
        await db.query(
          'UPDATE subsidy_applications SET project_id=? WHERE id=? AND project_id IS NULL',
          [projectId, legacy[0].id]
        );
      return;
    }
  }
  if (!applicable) return;
  await db.query(
    `INSERT INTO subsidy_applications(project_id,lead_id,consumer_number,portal_status)
    SELECT ?,?, '', 'registered' WHERE NOT EXISTS (SELECT 1 FROM subsidy_applications WHERE project_id=?)`,
    [projectId, project.lead_id, projectId]
  );
}
async function assertHandover(db, projectId, draft) {
  await prepare(db);
  const [[project]] = await db.query(
    'SELECT stage,total_cost,amount_received FROM projects WHERE id=? AND is_deleted=0',
    [projectId]
  );
  if (!project || rules.PROJECT_STAGES.indexOf(project.stage) < 5)
    throw rules.invalid('Complete commissioning before customer handover.');
  const [[saved]] = await db.query(
    'SELECT * FROM project_handover WHERE project_id=? AND is_deleted=0 LIMIT 1',
    [projectId]
  );
  const handover = { ...saved, ...draft };
  if (!draft && handover.handover_status !== 'Completed')
    throw rules.invalid('Complete the customer handover record first.');
  const contract =
    draft?.contract_value != null ? Number(draft.contract_value) : Number(project.total_cost);
  const received =
    draft?.amount_paid != null ? Number(draft.amount_paid) : Number(project.amount_received);
  if (
    !Number.isFinite(contract) ||
    !Number.isFinite(received) ||
    !(contract > 0) ||
    received < contract
  )
    throw rules.invalid(
      'Handover requires a contract amount and cleared customer payment. Subsidy is excluded.'
    );
  if (
    !rules.dateOnly(handover.handover_date) ||
    handover.training_completed !== 'Completed' ||
    handover.app_demo_completed !== 'Completed' ||
    ![true, 1, '1'].includes(handover.customer_signature)
  )
    throw rules.invalid(
      'Complete customer training, app onboarding, signature and handover date first.'
    );
  const [[inspection]] = await db.query(
    'SELECT inspection_status FROM project_final_inspection WHERE project_id=? AND is_deleted=0 LIMIT 1',
    [projectId]
  );
  if (inspection?.inspection_status !== 'Approved')
    throw rules.invalid('Final inspection must be approved before handover.');
}
module.exports = {
  save,
  syncProject,
  syncLocked,
  prepare,
  initializeProject,
  assertHandover,
  companyTimeZone,
  markPreparedConnection: (db) => prepared.set(db, Promise.resolve()),
};
