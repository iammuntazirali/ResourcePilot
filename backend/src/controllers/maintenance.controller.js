const { Maintenance, Asset, User } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendCreated } = require('../utils/response');
const ApiError = require('../utils/ApiError');
const { createAuditLog } = require('../services/audit.service');
const { transitionAsset } = require('../services/asset.service');
const { ASSET_STATUS } = require('../constants/assetStates');

exports.createMaintenance = asyncHandler(async (req, res) => {
  const { assetId, issue, priority } = req.body;
  const userId = req.user.id;

  const asset = await Asset.findByPk(assetId);
  if (!asset) {
    throw ApiError.notFound('Asset not found');
  }

  const maintenance = await Maintenance.create({
    assetId,
    issue,
    priority: priority || 'medium',
    status: 'pending',
    createdById: userId,
  });

  await createAuditLog({
    userId,
    action: 'CREATE_MAINTENANCE',
    entityType: 'maintenance',
    entityId: maintenance.id,
    newValues: maintenance.toJSON(),
    req,
  });

  sendCreated(res, maintenance, 'Maintenance request submitted');
});

exports.listMaintenances = asyncHandler(async (req, res) => {
  const { assetId, technicianId, status } = req.query;
  const where = {};

  if (assetId) where.assetId = assetId;
  if (technicianId) where.technicianId = technicianId;
  if (status) where.status = status;

  const list = await Maintenance.findAll({
    where,
    include: [
      { model: Asset, as: 'asset', attributes: ['id', 'name', 'assetTag', 'status'] },
      { model: User, as: 'technician', attributes: ['id', 'firstName', 'lastName', 'email'] },
      { model: User, as: 'creator', attributes: ['id', 'firstName', 'lastName', 'email'] },
      { model: User, as: 'approver', attributes: ['id', 'firstName', 'lastName', 'email'] },
    ],
    order: [['createdAt', 'DESC']],
  });

  sendSuccess(res, list);
});

exports.approveMaintenance = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { approve, technicianId } = req.body;
  const userId = req.user.id;

  const maintenance = await Maintenance.findByPk(maintenance);
  const record = await Maintenance.findByPk(id);
  if (!record) {
    throw ApiError.notFound('Maintenance record not found');
  }

  if (record.status !== 'pending') {
    throw ApiError.badRequest('Only pending maintenance requests can be approved or rejected');
  }

  const oldValues = record.toJSON();
  const asset = await Asset.findByPk(record.assetId);

  if (approve) {
    const nextStatus = technicianId ? 'technician_assigned' : 'approved';
    await record.update({
      status: nextStatus,
      approvedById: userId,
      technicianId: technicianId || null,
    });

    // Flip asset to UNDER_MAINTENANCE
    if (asset && asset.status !== ASSET_STATUS.UNDER_MAINTENANCE) {
      await transitionAsset(asset.id, ASSET_STATUS.UNDER_MAINTENANCE, userId, 'Approved for maintenance', req);
    }
  } else {
    await record.update({
      status: 'rejected',
      approvedById: userId,
    });
  }

  await createAuditLog({
    userId,
    action: approve ? 'APPROVE_MAINTENANCE' : 'REJECT_MAINTENANCE',
    entityType: 'maintenance',
    entityId: record.id,
    oldValues,
    newValues: record.toJSON(),
    req,
  });

  sendSuccess(res, record, approve ? 'Maintenance request approved' : 'Maintenance request rejected');
});

exports.assignTechnician = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { technicianId } = req.body;
  const userId = req.user.id;

  const record = await Maintenance.findByPk(id);
  if (!record) {
    throw ApiError.notFound('Maintenance record not found');
  }

  const oldValues = record.toJSON();
  await record.update({
    status: 'technician_assigned',
    technicianId,
  });

  await createAuditLog({
    userId,
    action: 'ASSIGN_TECHNICIAN',
    entityType: 'maintenance',
    entityId: record.id,
    oldValues,
    newValues: record.toJSON(),
    req,
  });

  sendSuccess(res, record, 'Technician assigned successfully');
});

exports.startMaintenance = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const record = await Maintenance.findByPk(id);
  if (!record) {
    throw ApiError.notFound('Maintenance record not found');
  }

  if (!['approved', 'technician_assigned'].includes(record.status)) {
    throw ApiError.badRequest('Cannot start repair from current status');
  }

  const oldValues = record.toJSON();
  await record.update({ status: 'in_progress' });

  await createAuditLog({
    userId,
    action: 'START_MAINTENANCE',
    entityType: 'maintenance',
    entityId: record.id,
    oldValues,
    newValues: record.toJSON(),
    req,
  });

  sendSuccess(res, record, 'Repair started');
});

exports.resolveMaintenance = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { resolutionNotes } = req.body;
  const userId = req.user.id;

  const record = await Maintenance.findByPk(id);
  if (!record) {
    throw ApiError.notFound('Maintenance record not found');
  }

  if (record.status === 'resolved') {
    throw ApiError.badRequest('Maintenance is already resolved');
  }

  const oldValues = record.toJSON();
  await record.update({
    status: 'resolved',
    resolutionNotes,
  });

  // Flip asset back to IN_STOCK (available)
  const asset = await Asset.findByPk(record.assetId);
  if (asset && asset.status === ASSET_STATUS.UNDER_MAINTENANCE) {
    await transitionAsset(asset.id, ASSET_STATUS.IN_STOCK, userId, 'Maintenance resolved successfully', req);
  }

  await createAuditLog({
    userId,
    action: 'RESOLVE_MAINTENANCE',
    entityType: 'maintenance',
    entityId: record.id,
    oldValues,
    newValues: record.toJSON(),
    req,
  });

  sendSuccess(res, record, 'Maintenance resolved successfully');
});
