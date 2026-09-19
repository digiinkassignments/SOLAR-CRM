const getCustomFields = async (req, res) => {
  try {
    const [fields] = await req.db.query(
      `SELECT * FROM custom_fields WHERE is_active = 1 ORDER BY sort_order ASC`
    );
    return res.status(200).json({ success: true, data: fields });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const createCustomField = async (req, res) => {
  try {
    const { field_name, field_type, is_required, options } = req.body;
    if (!field_name) return res.status(400).json({ success: false, message: "Field name required." });
    const [result] = await req.db.query(
      `INSERT INTO custom_fields (field_name, field_type, is_required, options) VALUES (?, ?, ?, ?)`,
      [field_name, field_type || "text", is_required || 0, options ? JSON.stringify(options) : null]
    );
    return res.status(201).json({ success: true, message: "Custom field created.", id: result.insertId });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const updateCustomField = async (req, res) => {
  try {
    const { id } = req.params;
    const { field_name, field_type, is_required, options, is_active, sort_order } = req.body;
    await req.db.query(
      `UPDATE custom_fields SET field_name=?, field_type=?, is_required=?, options=?, is_active=?, sort_order=? WHERE id=?`,
      [field_name, field_type, is_required, options ? JSON.stringify(options) : null, is_active, sort_order || 0, id]
    );
    return res.status(200).json({ success: true, message: "Custom field updated." });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const deleteCustomField = async (req, res) => {
  try {
    const { id } = req.params;
    await req.db.query(`UPDATE custom_fields SET is_active = 0 WHERE id = ?`, [id]);
    return res.status(200).json({ success: true, message: "Custom field deleted." });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getCustomFields, createCustomField, updateCustomField, deleteCustomField };
