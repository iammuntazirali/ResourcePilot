const {
  Assignment,
  AssignmentRequest,
  Asset,
  AssetCategory,
  Department,
  User,
  Notification,
  sequelize,
} = require('../models');
const { ASSET_STATUS, ASSIGNMENT_REQUEST_STATUS, ASSIGNMENT_STATUS } = require('../constants/assetStates');
const ApiError = require('../utils/ApiError');
const { generateDocumentNumber } = require('../utils/tokens');
const { createAuditLog } = require('./audit.service');

const listRequests = async (query, user) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, parseInt(query.limit, 10) || 20);
  const offset = (page - 1) * limit;
  const where = {};

  if (query.status) where.status = query.status;
  if (query.my === 'true') where.requesterId = user.id;
  if (query.departmentId) where.departmentId = query.departmentId;

  const { rows, count } = await AssignmentRequest.findAndCountAll({
    where,
    include: [
      { model: User, as: 'requester', attributes: ['id', 'firstName', 'lastName', 'email'] },
      { model: Asset, as: 'asset' },
      { model: AssetCategory, as: 'category' },
      { model: Department, as: 'department' },
    ],
    limit,
    offset,
    order: [['createdAt', 'DESC']],
  });

  return { requests: rows, meta: { page, limit, total: count } };
};

const createRequest = async (data, user, req) => {
  if (!data.assetId && !data.categoryId) {
    throw ApiError.badRequest('Either assetId or categoryId is required');
  }

  const request = await AssignmentRequest.create({
    ...data,
    requestNumber: generateDocumentNumber('AR'),
    requesterId: user.id,
    departmentId: data.departmentId || user.departmentId,
    status: data.submit ? ASSIGNMENT_REQUEST_STATUS.SUBMITTED : ASSIGNMENT_REQUEST_STATUS.DRAFT,
  });

  if (request.status === ASSIGNMENT_REQUEST_STATUS.SUBMITTED) {
    await Notification.create({
      userId: user.managerId || user.id,
      type: 'approval_pending',
      title: 'New assignment request',
      message: `${user.firstName} submitted assignment request ${request.requestNumber}`,
      entityType: 'assignment_request',
      entityId: request.id,
    });
  }

  await createAuditLog({
    userId: user.id,
    action: 'CREATE',
    entityType: 'assignment_request',
    entityId: request.id,
    newValues: request.toJSON(),
    req,
  });

  return request;
};

const approveRequest = async (requestId, approver, { assetId, expectedReturnDate }, req) => {
  return sequelize.transaction(async (t) => {
    const request = await AssignmentRequest.findByPk(requestId, { transaction: t, lock: t.LOCK.UPDATE });
    if (!request) throw ApiError.notFound('Request not found');
    if (request.status !== ASSIGNMENT_REQUEST_STATUS.SUBMITTED) {
      throw ApiError.badRequest('Only submitted requests can be approved');
    }

    const targetAssetId = assetId || request.assetId;
    if (!targetAssetId) throw ApiError.badRequest('Asset must be specified for approval');

    const asset = await Asset.findByPk(targetAssetId, { transaction: t, lock: t.LOCK.UPDATE });
    if (!asset) throw ApiError.notFound('Asset not found');
    if (asset.status !== ASSET_STATUS.IN_STOCK && asset.status !== ASSET_STATUS.ASSIGNED) {
      throw ApiError.badRequest('Asset is not available', 'ASSET_NOT_AVAILABLE');
    }

    const activeAssignment = await Assignment.findOne({
      where: { assetId: targetAssetId, status: ASSIGNMENT_STATUS.ACTIVE },
      transaction: t,
    });

    if (activeAssignment) {
      // Handle transfer workflow: complete the active assignment
      await activeAssignment.update(
        {
          status: ASSIGNMENT_STATUS.RETURNED,
          returnedAt: new Date(),
          returnedTo: approver.id,
          returnCondition: asset.condition,
          returnNotes: `Transferred to request ${request.requestNumber}`,
        },
        { transaction: t }
      );
    }

    await request.update(
      {
        status: ASSIGNMENT_REQUEST_STATUS.APPROVED,
        approverId: approver.id,
        approvedAt: new Date(),
        assetId: targetAssetId,
      },
      { transaction: t }
    );

    const assignment = await Assignment.create(
      {
        assignmentNumber: generateDocumentNumber('ASG'),
        assetId: targetAssetId,
        userId: request.requesterId,
        assignmentRequestId: request.id,
        assignedBy: approver.id,
        assignedAt: new Date(),
        expectedReturnDate: expectedReturnDate || request.neededUntil,
        status: ASSIGNMENT_STATUS.ACTIVE,
      },
      { transaction: t }
    );

    await asset.update(
      { status: ASSET_STATUS.ASSIGNED, assignedToUserId: request.requesterId },
      { transaction: t }
    );

    await Notification.create(
      {
        userId: request.requesterId,
        type: 'assignment_approved',
        title: 'Assignment approved',
        message: `Your request ${request.requestNumber} has been approved`,
        entityType: 'assignment',
        entityId: assignment.id,
      },
      { transaction: t }
    );

    await createAuditLog({
      userId: approver.id,
      action: 'APPROVE',
      entityType: 'assignment_request',
      entityId: request.id,
      newValues: { assignmentId: assignment.id },
      req,
    });

    return assignment;
  });
};

const rejectRequest = async (requestId, approver, rejectionReason, req) => {
  const request = await AssignmentRequest.findByPk(requestId);
  if (!request) throw ApiError.notFound('Request not found');
  if (request.status !== ASSIGNMENT_REQUEST_STATUS.SUBMITTED) {
    throw ApiError.badRequest('Only submitted requests can be rejected');
  }

  await request.update({
    status: ASSIGNMENT_REQUEST_STATUS.REJECTED,
    approverId: approver.id,
    approvedAt: new Date(),
    rejectionReason,
  });

  await Notification.create({
    userId: request.requesterId,
    type: 'assignment_rejected',
    title: 'Assignment request rejected',
    message: `Request ${request.requestNumber} was rejected: ${rejectionReason}`,
    entityType: 'assignment_request',
    entityId: request.id,
  });

  await createAuditLog({
    userId: approver.id,
    action: 'REJECT',
    entityType: 'assignment_request',
    entityId: request.id,
    newValues: { rejectionReason },
    req,
  });

  return request;
};

const returnAssignment = async (assignmentId, user, { returnCondition, returnNotes }, req) => {
  return sequelize.transaction(async (t) => {
    const assignment = await Assignment.findByPk(assignmentId, {
      include: [{ model: Asset, as: 'asset' }],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!assignment) throw ApiError.notFound('Assignment not found');
    if (assignment.status !== ASSIGNMENT_STATUS.ACTIVE) {
      throw ApiError.badRequest('Assignment is not active');
    }
    if (!returnCondition) {
      throw ApiError.badRequest('Return condition is required', 'RETURN_CONDITION_REQUIRED');
    }

    await assignment.update(
      {
        status: ASSIGNMENT_STATUS.RETURNED,
        returnedAt: new Date(),
        returnedTo: user.id,
        returnCondition,
        returnNotes,
      },
      { transaction: t }
    );

    const nextStatus =
      returnCondition === 'damaged' ? ASSET_STATUS.UNDER_MAINTENANCE : ASSET_STATUS.IN_STOCK;

    await assignment.asset.update(
      { status: nextStatus, assignedToUserId: null, condition: returnCondition },
      { transaction: t }
    );

    await createAuditLog({
      userId: user.id,
      action: 'RETURN',
      entityType: 'assignment',
      entityId: assignment.id,
      newValues: { returnCondition, returnNotes },
      req,
    });

    return assignment;
  });
};

const listAssignments = async (query) => {
  const where = {};
  if (query.status) where.status = query.status;
  if (query.userId) where.userId = query.userId;

  return Assignment.findAll({
    where,
    include: [
      { model: Asset, as: 'asset', include: ['category'] },
      { model: User, as: 'custodian', attributes: ['id', 'firstName', 'lastName', 'email'] },
    ],
    order: [['assignedAt', 'DESC']],
  });
};

module.exports = {
  listRequests,
  createRequest,
  approveRequest,
  rejectRequest,
  returnAssignment,
  listAssignments,
};
