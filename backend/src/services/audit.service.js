const { AuditLog } = require('../models');

const createAuditLog = async ({
  userId,
  action,
  entityType,
  entityId,
  oldValues = null,
  newValues = null,
  req = null,
}) => {
  await AuditLog.create({
    userId,
    action,
    entityType,
    entityId,
    oldValues,
    newValues,
    ipAddress: req?.ip || null,
    userAgent: req?.headers?.['user-agent'] || null,
  });
};

const listAuditLogs = async () => {
  return AuditLog.findAll({
    include: [{ model: require('../models').User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] }],
    order: [['createdAt', 'DESC']],
    limit: 100,
  });
};

module.exports = { createAuditLog, listAuditLogs };
