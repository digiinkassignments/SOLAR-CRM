// models/inspectionModel.js

const ensureInspectionTable = async (db) => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS project_inspections (
      id INT AUTO_INCREMENT PRIMARY KEY,
      project_id INT NOT NULL,
      roof_condition ENUM('Good','Fair','Poor') DEFAULT 'Good',
      roof_type VARCHAR(50) DEFAULT NULL,
      roof_orientation VARCHAR(50) DEFAULT 'South',
      roof_tilt_angle DECIMAL(5,2) DEFAULT NULL,
      roof_area_sqft DECIMAL(10,2) DEFAULT NULL,
      shadow_free_area_sqft DECIMAL(10,2) DEFAULT NULL,
      roof_age_years INT DEFAULT NULL,
      structural_concerns TEXT DEFAULT NULL,
      existing_load_kw DECIMAL(10,2) DEFAULT NULL,
      sanctioned_load_kw DECIMAL(10,2) DEFAULT NULL,
      consumer_number VARCHAR(100) DEFAULT NULL,
      meter_type ENUM('Single Phase','Three Phase') DEFAULT NULL,
      main_panel_capacity INT DEFAULT NULL,
      earthing_available TINYINT(1) DEFAULT 1,
      electrical_issues TEXT DEFAULT NULL,
      shading_issues ENUM('None','Partial','Severe') DEFAULT 'None',
      shading_source VARCHAR(255) DEFAULT NULL,
      water_availability TINYINT(1) DEFAULT 1,
      site_access ENUM('Easy','Moderate','Difficult') DEFAULT 'Easy',
      gps_coordinates VARCHAR(100) DEFAULT NULL,
      additional_challenges TEXT DEFAULT NULL,
      site_photos TEXT DEFAULT NULL,
      overall_status VARCHAR(50) DEFAULT 'Pending',
      inspector_name VARCHAR(100) DEFAULT NULL,
      inspection_date DATE DEFAULT NULL,
      remarks TEXT DEFAULT NULL,
      customer_signature_name VARCHAR(100) DEFAULT NULL,
      signature_date DATE DEFAULT NULL,
      created_by INT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      is_deleted TINYINT(1) DEFAULT 0,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  try {
    const [cols] = await db.query(`SHOW COLUMNS FROM project_inspections`);
    const existingCols = new Set(cols.map((c) => c.Field));

    if (!existingCols.has('roof_orientation')) {
      await db.query(`ALTER TABLE project_inspections ADD COLUMN roof_orientation VARCHAR(50) DEFAULT 'South'`);
    }
    if (!existingCols.has('roof_tilt_angle')) {
      await db.query(`ALTER TABLE project_inspections ADD COLUMN roof_tilt_angle DECIMAL(5,2) DEFAULT NULL`);
    }
    if (!existingCols.has('shadow_free_area_sqft')) {
      await db.query(`ALTER TABLE project_inspections ADD COLUMN shadow_free_area_sqft DECIMAL(10,2) DEFAULT NULL`);
    }
    if (!existingCols.has('sanctioned_load_kw')) {
      await db.query(`ALTER TABLE project_inspections ADD COLUMN sanctioned_load_kw DECIMAL(10,2) DEFAULT NULL`);
    }
    if (!existingCols.has('consumer_number')) {
      await db.query(`ALTER TABLE project_inspections ADD COLUMN consumer_number VARCHAR(100) DEFAULT NULL`);
    }
    if (!existingCols.has('gps_coordinates')) {
      await db.query(`ALTER TABLE project_inspections ADD COLUMN gps_coordinates VARCHAR(100) DEFAULT NULL`);
    }
    if (!existingCols.has('site_photos')) {
      await db.query(`ALTER TABLE project_inspections ADD COLUMN site_photos TEXT DEFAULT NULL`);
    }
    if (!existingCols.has('customer_signature_name')) {
      await db.query(`ALTER TABLE project_inspections ADD COLUMN customer_signature_name VARCHAR(100) DEFAULT NULL`);
    }
    if (!existingCols.has('signature_date')) {
      await db.query(`ALTER TABLE project_inspections ADD COLUMN signature_date DATE DEFAULT NULL`);
    }
    if (!existingCols.has('signature_data')) {
      await db.query(`ALTER TABLE project_inspections ADD COLUMN signature_data LONGTEXT DEFAULT NULL`);
    }
    await db.query(`ALTER TABLE project_inspections MODIFY COLUMN overall_status VARCHAR(50) DEFAULT 'Pending'`);
  } catch (err) {
    // Ignore schema check errors
  }
};

const normalizeInspectionData = (row) => {
  if (!row) return null;
  return {
    ...row,
    earthing_available:
      row.earthing_available === 1 || row.earthing_available === 'Yes' || row.earthing_available === true
        ? 'Yes'
        : 'No',
    water_availability:
      row.water_availability === 1 || row.water_availability === 'Yes' || row.water_availability === true
        ? 'Yes'
        : 'No',
  };
};

const getInspectionByProject = async (db, projectId) => {
  const [rows] = await db.query(
    `SELECT * FROM project_inspections WHERE project_id = ? AND is_deleted = 0 LIMIT 1`,
    [projectId]
  );
  if (rows && rows.length > 0) {
    return normalizeInspectionData(rows[0]);
  }

  try {
    const [projects] = await db.query(
      `SELECT id, lead_id, system_capacity_kw FROM projects WHERE id = ? LIMIT 1`,
      [projectId]
    );
    if (!projects || projects.length === 0) return null;
    const project = projects[0];

    let surveyRow = null;
    if (project.lead_id) {
      const [surveys] = await db.query(
        `SELECT * FROM site_surveys WHERE lead_id = ? ORDER BY (CASE WHEN status='completed' THEN 1 ELSE 2 END), id DESC LIMIT 1`,
        [project.lead_id]
      );
      if (surveys && surveys.length > 0) {
        surveyRow = surveys[0];
      }
    }

    let fieldSurveyData = null;
    if (project.lead_id) {
      const [fEntries] = await db.query(
        `SELECT data_json FROM crm_field_entries WHERE (resource_type='survey' AND resource_id IN (SELECT id FROM site_surveys WHERE lead_id = ?)) OR (resource_type='project' AND resource_id = ?) ORDER BY id DESC LIMIT 1`,
        [project.lead_id, projectId]
      );
      if (fEntries && fEntries.length > 0 && fEntries[0].data_json) {
        try {
          fieldSurveyData = typeof fEntries[0].data_json === 'string' ? JSON.parse(fEntries[0].data_json) : fEntries[0].data_json;
        } catch (_) {}
      }
    }

    let leadConsumerNumber = null;
    if (project.lead_id) {
      const [leads] = await db.query(`SELECT consumer_number FROM leads WHERE id = ? LIMIT 1`, [project.lead_id]);
      if (leads && leads.length > 0) {
        leadConsumerNumber = leads[0].consumer_number;
      }
    }

    if (surveyRow || fieldSurveyData) {
      const roofType = fieldSurveyData?.roof_type || surveyRow?.roof_type || 'RCC Flat';
      const roofArea = Number(fieldSurveyData?.roof_area_sqft || surveyRow?.roof_area_sqft) || null;
      const roofOrient = fieldSurveyData?.roof_orientation || surveyRow?.roof_orientation || 'South';
      const roofTilt = Number(fieldSurveyData?.roof_tilt_angle || surveyRow?.roof_tilt_angle) || null;
      const cond = fieldSurveyData?.roof_condition || surveyRow?.roof_condition || '';
      const shading = fieldSurveyData?.shading || surveyRow?.shadow_conditions || surveyRow?.shading_details || '';
      const phase = fieldSurveyData?.electrical_phase || surveyRow?.electrical_phase || '';
      const sancLoad = Number(fieldSurveyData?.sanctioned_load_kw || surveyRow?.sanctioned_load_kw) || null;
      const cNum = fieldSurveyData?.consumer_number || surveyRow?.consumer_number || leadConsumerNumber || null;
      const lat = fieldSurveyData?.gps_latitude || surveyRow?.site_latitude;
      const lng = fieldSurveyData?.gps_longitude || surveyRow?.site_longitude;

      return normalizeInspectionData({
        project_id: projectId,
        is_prefilled: true,
        roof_condition: cond.toLowerCase().includes('poor') ? 'Poor' : (cond.toLowerCase().includes('fair') ? 'Fair' : 'Good'),
        roof_type: roofType,
        roof_orientation: roofOrient,
        roof_tilt_angle: roofTilt,
        roof_area_sqft: roofArea,
        shadow_free_area_sqft: roofArea,
        structural_concerns: cond || null,
        existing_load_kw: sancLoad,
        sanctioned_load_kw: sancLoad,
        consumer_number: cNum,
        meter_type: phase.toLowerCase().includes('three') ? 'Three Phase' : 'Single Phase',
        shading_issues: shading && shading.toLowerCase() !== 'none' && !shading.toLowerCase().includes('shadow-free') ? 'Partial' : 'None',
        shading_source: shading || null,
        gps_coordinates: (lat && lng) ? `${lat}, ${lng}` : null,
        overall_status: 'Pending',
        remarks: `Auto-prefilled from Site Survey #${surveyRow?.id || ''}`.trim()
      });
    }
  } catch (err) {
    console.warn('Error prefilling inspection from survey:', err.message);
  }

  return null;
};

const cleanDate = (d) => {
  if (!d) return null;
  const s = String(d).trim();
  if (s === '' || s.toLowerCase() === 'null') return null;
  return /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : null;
};

const createInspection = async (db, projectId, data, userId) => {
  const isEarthing = data.earthing_available === 'Yes' || data.earthing_available === 1 || data.earthing_available === true ? 1 : 0;
  const isWater = data.water_availability === 'Yes' || data.water_availability === 1 || data.water_availability === true ? 1 : 0;

  const fields = [
    'project_id', 'roof_condition', 'roof_type', 'roof_orientation', 'roof_tilt_angle',
    'roof_area_sqft', 'shadow_free_area_sqft', 'roof_age_years', 'structural_concerns',
    'existing_load_kw', 'sanctioned_load_kw', 'consumer_number', 'meter_type', 'main_panel_capacity',
    'earthing_available', 'electrical_issues', 'shading_issues', 'shading_source',
    'water_availability', 'site_access', 'gps_coordinates', 'additional_challenges', 'site_photos',
    'overall_status', 'inspector_name', 'inspection_date', 'remarks', 'customer_signature_name', 'signature_date', 'signature_data', 'created_by'
  ];

  const values = [
    projectId,
    data.roof_condition || 'Good',
    data.roof_type || 'RCC Flat',
    data.roof_orientation || 'South',
    data.roof_tilt_angle || null,
    data.roof_area_sqft || null,
    data.shadow_free_area_sqft || null,
    data.roof_age_years || null,
    data.structural_concerns || null,
    data.existing_load_kw || null,
    data.sanctioned_load_kw || null,
    data.consumer_number || null,
    data.meter_type || 'Single Phase',
    data.main_panel_capacity || null,
    isEarthing,
    data.electrical_issues || null,
    data.shading_issues || 'None',
    data.shading_issues === 'None' ? null : (data.shading_source || null),
    isWater,
    data.site_access || 'Easy',
    data.gps_coordinates || null,
    data.additional_challenges || null,
    typeof data.site_photos === 'object' ? JSON.stringify(data.site_photos) : (data.site_photos || null),
    data.overall_status || 'Pending',
    data.inspector_name || null,
    cleanDate(data.inspection_date),
    data.remarks || null,
    data.customer_signature_name || null,
    cleanDate(data.signature_date),
    data.signature_data || null,
    userId || null
  ];

  const [result] = await db.query(
    `INSERT INTO project_inspections (${fields.join(',')}) VALUES (${fields.map(() => '?').join(',')})`,
    values
  );
  return result.insertId;
};

const updateInspection = async (db, projectId, data) => {
  const isEarthing = data.earthing_available === 'Yes' || data.earthing_available === 1 || data.earthing_available === true ? 1 : 0;
  const isWater = data.water_availability === 'Yes' || data.water_availability === 1 || data.water_availability === true ? 1 : 0;

  await db.query(
    `UPDATE project_inspections SET
      roof_condition = ?,
      roof_type = ?,
      roof_orientation = ?,
      roof_tilt_angle = ?,
      roof_area_sqft = ?,
      shadow_free_area_sqft = ?,
      roof_age_years = ?,
      structural_concerns = ?,
      existing_load_kw = ?,
      sanctioned_load_kw = ?,
      consumer_number = ?,
      meter_type = ?,
      main_panel_capacity = ?,
      earthing_available = ?,
      electrical_issues = ?,
      shading_issues = ?,
      shading_source = ?,
      water_availability = ?,
      site_access = ?,
      gps_coordinates = ?,
      additional_challenges = ?,
      site_photos = ?,
      overall_status = ?,
      inspector_name = ?,
      inspection_date = ?,
      remarks = ?,
      customer_signature_name = ?,
      signature_date = ?,
      signature_data = ?
    WHERE project_id = ? AND is_deleted = 0`,
    [
      data.roof_condition || 'Good',
      data.roof_type || 'RCC Flat',
      data.roof_orientation || 'South',
      data.roof_tilt_angle || null,
      data.roof_area_sqft || null,
      data.shadow_free_area_sqft || null,
      data.roof_age_years || null,
      data.structural_concerns || null,
      data.existing_load_kw || null,
      data.sanctioned_load_kw || null,
      data.consumer_number || null,
      data.meter_type || 'Single Phase',
      data.main_panel_capacity || null,
      isEarthing,
      data.electrical_issues || null,
      data.shading_issues || 'None',
      data.shading_issues === 'None' ? null : (data.shading_source || null),
      isWater,
      data.site_access || 'Easy',
      data.gps_coordinates || null,
      data.additional_challenges || null,
      typeof data.site_photos === 'object' ? JSON.stringify(data.site_photos) : (data.site_photos || null),
      data.overall_status || 'Pending',
      data.inspector_name || null,
      cleanDate(data.inspection_date),
      data.remarks || null,
      data.customer_signature_name || null,
      cleanDate(data.signature_date),
      data.signature_data !== undefined ? data.signature_data : null,
      projectId
    ]
  );
};

module.exports = {
  ensureInspectionTable,
  getInspectionByProject,
  createInspection,
  updateInspection,
  normalizeInspectionData
};
