module.exports.up=async db=>require('../../services/portalRoles').ensurePortalRoles(db);
