const admin = require('firebase-admin');
const { db: defaultDb } = require('../config/db');

const serviceAccount = require('../config/serviceAccountKey.json');

try {
  if (!admin.apps || admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
} catch (e) {
  console.error('Firebase init error:', e.message);
}

const sendToUser = async (userId, { title, body, type, referenceId }, db = defaultDb) => {
  try {
    const [rows] = await db.query(
      "SELECT fcm_token FROM users WHERE id = ? AND fcm_token IS NOT NULL",
      [userId]
    );
    if (rows.length === 0 || !rows[0].fcm_token) {
      console.log(`No FCM token for user ${userId}`);
      return;
    }
    const token = rows[0].fcm_token;
    const message = {
      token,
      notification: { title, body },
      data: {
        type: type || '',
        reference_id: referenceId ? String(referenceId) : '',
      },
      android: {
        priority: 'high',
        notification: { channelId: 'solar_crm_channel', sound: 'default' },
      },
    };
    await admin.messaging().send(message);
    console.log(`Notification sent to user ${userId}: ${title}`);
    await db.query(
      'INSERT INTO notifications (user_id, title, body, type, reference_id) VALUES (?, ?, ?, ?, ?)',
      [userId, title, body, type || null, referenceId || null]
    );
  } catch (err) {
    console.error(`Notification failed for user ${userId}:`, err.message);
  }
};

const sendToRole = async (roleId, { title, body, type, referenceId }, db = defaultDb) => {
  try {
    const [users] = await db.query(
      "SELECT id FROM users WHERE role_id = ? AND status = 'Active'",
      [roleId]
    );
    await Promise.all(users.map(u => sendToUser(u.id, { title, body, type, referenceId }, db)));
  } catch (err) {
    console.error('Role notification failed:', err.message);
  }
};

const notifyLeadAssigned = async (leadId, assignedToUserId, leadCode, customerName, db = defaultDb) => {
  await sendToUser(assignedToUserId, {
    title: '📋 New Lead Assigned',
    body: `${customerName} (${leadCode}) has been assigned to you.`,
    type: 'lead_assigned',
    referenceId: leadId,
  }, db);
};

const notifyLeadWon = async (leadId, leadCode, customerName, managerId, db = defaultDb) => {
  await sendToRole(1, {
    title: '🎉 Deal Closed — Won!',
    body: `${customerName} (${leadCode}) has been marked as Won.`,
    type: 'lead_won',
    referenceId: leadId,
  }, db);
  if (managerId) {
    await sendToUser(managerId, {
      title: '🎉 Team Deal Won!',
      body: `${customerName} (${leadCode}) has been marked as Won.`,
      type: 'lead_won',
      referenceId: leadId,
    }, db);
  }
};

const notifyLeadLost = async (leadId, leadCode, customerName, managerId, db = defaultDb) => {
  await sendToRole(1, {
    title: '❌ Lead Lost',
    body: `${customerName} (${leadCode}) has been marked as Lost.`,
    type: 'lead_lost',
    referenceId: leadId,
  }, db);
  if (managerId) {
    await sendToUser(managerId, {
      title: '❌ Team Lead Lost',
      body: `${customerName} (${leadCode}) has been marked as Lost.`,
      type: 'lead_lost',
      referenceId: leadId,
    }, db);
  }
};

const notifyStatusChanged = async (leadId, leadCode, customerName, newStatus, managerId, db = defaultDb) => {
  if (!managerId) return;
  await sendToUser(managerId, {
    title: '📊 Lead Status Updated',
    body: `${customerName} (${leadCode}) moved to "${newStatus}".`,
    type: 'status_changed',
    referenceId: leadId,
  }, db);
};

const notifyBulkImport = async (adminId, imported, failed, db = defaultDb) => {
  await sendToUser(adminId, {
    title: '📥 Bulk Import Complete',
    body: `${imported} leads imported successfully${failed > 0 ? `, ${failed} failed` : ''}.`,
    type: 'bulk_import',
    referenceId: null,
  }, db);
};

const notifyFollowupAdded = async (leadId, leadCode, customerName, managerId, db = defaultDb) => {
  if (!managerId) return;
  await sendToUser(managerId, {
    title: '📞 Follow-up Logged',
    body: `Follow-up added for ${customerName} (${leadCode}).`,
    type: 'followup_added',
    referenceId: leadId,
  }, db);
};

const notifyLeadCreated = async (leadId, leadCode, customerName, createdByName, db = defaultDb) => {
  await sendToRole(1, {
    title: '🆕 New Lead Created',
    body: `${customerName} (${leadCode}) added by ${createdByName}.`,
    type: 'lead_created',
    referenceId: leadId,
  }, db);
};

module.exports = {
  sendToUser,
  sendToRole,
  notifyLeadAssigned,
  notifyLeadWon,
  notifyLeadLost,
  notifyStatusChanged,
  notifyBulkImport,
  notifyFollowupAdded,
  notifyLeadCreated,
};
