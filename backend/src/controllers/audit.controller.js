const { AuditCycle, AuditItem, Asset, User, Department, Location } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendCreated } = require('../utils/response');
const ApiError = require('../utils/ApiError');
const { createAuditLog } = require('../services/audit.service');
const { transitionAsset } = require('../services/asset.service');
const { ASSET_STATUS } = require('../constants/assetStates');

exports.createCycle = asyncHandler(async (req, res) => {
  const { name, scopeType, scopeId, startDate, endDate } = req.body;
  const userId = req.user.id;

  const cycle = await AuditCycle.create({
    name,
    scopeType: scopeType || 'all',
    scopeId: scopeId || null,
    startDate,
    endDate,
    status: 'active',
    createdById: userId,
  });

  // Query assets in scope
  const where = {};
  if (scopeType === 'department' && scopeId) {
    where.departmentId = scopeId;
  } else if (scopeType === 'location' && scopeId) {
    where.locationId = scopeId;
  }

  const assets = await Asset.findAll({ where });

  if (assets.length) {
    const items = assets.map((asset) => ({
      cycleId: cycle.id,
      assetId: asset.id,
      status: 'pending',
    }));
    await AuditItem.bulkCreate(items);
  }

  await createAuditLog({
    userId,
    action: 'CREATE_AUDIT_CYCLE',
    entityType: 'audit_cycle',
    entityId: cycle.id,
    newValues: { cycle: cycle.toJSON(), itemsCount: assets.length },
    req,
  });

  sendCreated(res, cycle, 'Audit cycle created successfully');
});

exports.listCycles = asyncHandler(async (req, res) => {
  const cycles = await AuditCycle.findAll({
    include: [{ model: User, as: 'creator', attributes: ['id', 'firstName', 'lastName'] }],
    order: [['createdAt', 'DESC']],
  });
  sendSuccess(res, cycles);
});

exports.getCycle = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const cycle = await AuditCycle.findByPk(id, {
    include: [
      { model: User, as: 'creator', attributes: ['id', 'firstName', 'lastName'] },
      {
        model: AuditItem,
        as: 'items',
        include: [
          { model: Asset, as: 'asset', attributes: ['id', 'name', 'assetTag', 'serialNumber', 'status', 'condition'] },
          { model: User, as: 'checkedBy', attributes: ['id', 'firstName', 'lastName'] },
        ],
      },
    ],
  });

  if (!cycle) {
    throw ApiError.notFound('Audit cycle not found');
  }

  sendSuccess(res, cycle);
});

exports.checkItem = asyncHandler(async (req, res) => {
  const { id, itemId } = req.params;
  const { status, notes } = req.body;
  const userId = req.user.id;

  const cycle = await AuditCycle.findByPk(id);
  if (!cycle) {
    throw ApiError.notFound('Audit cycle not found');
  }

  if (cycle.status === 'closed') {
    throw ApiError.badRequest('Cannot audit items in a closed audit cycle');
  }

  const item = await AuditItem.findOne({
    where: { id: itemId, cycleId: id },
  });

  if (!item) {
    throw ApiError.notFound('Audit item not found');
  }

  const oldValues = item.toJSON();
  await item.update({
    status,
    notes,
    checkedById: userId,
    checkedAt: new Date(),
  });

  await createAuditLog({
    userId,
    action: 'AUDIT_ITEM_CHECK',
    entityType: 'audit_item',
    entityId: item.id,
    oldValues,
    newValues: item.toJSON(),
    req,
  });

  sendSuccess(res, item, 'Asset audited successfully');
});

exports.closeCycle = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const cycle = await AuditCycle.findByPk(id, {
    include: [{ model: AuditItem, as: 'items' }],
  });

  if (!cycle) {
    throw ApiError.notFound('Audit cycle not found');
  }

  if (cycle.status === 'closed') {
    throw ApiError.badRequest('Audit cycle is already closed');
  }

  const oldValues = cycle.toJSON();
  await cycle.update({
    status: 'closed',
    closedAt: new Date(),
  });

  // Discrepancy actions: mark all missing assets as 'lost'
  for (const item of cycle.items) {
    const asset = await Asset.findByPk(item.assetId);
    if (!asset) continue;

    if (item.status === 'missing') {
      await transitionAsset(asset.id, ASSET_STATUS.LOST, userId, `Audit Cycle "${cycle.name}" closed. Marked missing.`, req);
    } else if (item.status === 'damaged') {
      await asset.update({ condition: 'damaged' });
    }
  }

  await createAuditLog({
    userId,
    action: 'CLOSE_AUDIT_CYCLE',
    entityType: 'audit_cycle',
    entityId: cycle.id,
    oldValues,
    newValues: cycle.toJSON(),
    req,
  });

  sendSuccess(res, cycle, 'Audit cycle closed and locked successfully');
});
