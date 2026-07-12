const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendCreated } = require('../utils/response');
const { Department, Location, AssetCategory, Vendor, Notification, User, Role } = require('../models');

exports.listDepartments = asyncHandler(async (req, res) => {
  const departments = await Department.findAll({ order: [['name', 'ASC']] });
  sendSuccess(res, departments);
});

exports.createDepartment = asyncHandler(async (req, res) => {
  const department = await Department.create(req.body);
  sendCreated(res, department);
});

exports.listLocations = asyncHandler(async (req, res) => {
  const locations = await Location.findAll({
    include: [{ model: Location, as: 'children' }, { model: Location, as: 'parent' }],
    order: [['name', 'ASC']],
  });
  sendSuccess(res, locations);
});

exports.createLocation = asyncHandler(async (req, res) => {
  const location = await Location.create(req.body);
  sendCreated(res, location);
});

exports.listCategories = asyncHandler(async (req, res) => {
  const categories = await AssetCategory.findAll({
    include: [{ model: AssetCategory, as: 'children' }],
    order: [['name', 'ASC']],
  });
  sendSuccess(res, categories);
});

exports.createCategory = asyncHandler(async (req, res) => {
  const category = await AssetCategory.create(req.body);
  sendCreated(res, category);
});

exports.listVendors = asyncHandler(async (req, res) => {
  const vendors = await Vendor.findAll({ order: [['name', 'ASC']] });
  sendSuccess(res, vendors);
});

exports.createVendor = asyncHandler(async (req, res) => {
  const vendor = await Vendor.create(req.body);
  sendCreated(res, vendor);
});

exports.dashboard = asyncHandler(async (req, res) => {
  const { Op } = require('sequelize');
  const { Asset, Assignment, AssignmentRequest, Booking, Maintenance, Notification } = require('../models');

  const assetService = require('../services/asset.service');
  const stats = await assetService.getAssetStats();

  const assetsAvailable = await Asset.count({ where: { status: 'in_stock' } });
  const assetsAllocated = await Asset.count({ where: { status: 'assigned' } });

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const maintenanceToday = await Maintenance.count({
    where: { createdAt: { [Op.gte]: todayStart } },
  });

  const activeBookings = await Booking.count({ where: { status: 'upcoming' } });

  const pendingTransfers = await AssignmentRequest.count({
    where: { status: 'submitted' },
    include: [{ model: Asset, as: 'asset', where: { status: 'assigned' } }],
  });

  const upcomingReturns = await Assignment.count({
    where: {
      status: 'active',
      expectedReturnDate: { [Op.gt]: new Date() },
    },
  });

  const overdueReturns = await Assignment.count({
    where: {
      status: 'active',
      expectedReturnDate: { [Op.lt]: new Date() },
    },
  });

  const overdueList = await Assignment.findAll({
    where: {
      status: 'active',
      expectedReturnDate: { [Op.lt]: new Date() },
    },
    include: [
      { model: Asset, as: 'asset', attributes: ['id', 'assetTag', 'name'] },
      { model: User, as: 'custodian', attributes: ['id', 'firstName', 'lastName'] },
    ],
    limit: 5,
  });

  const upcomingList = await Assignment.findAll({
    where: {
      status: 'active',
      expectedReturnDate: { [Op.gt]: new Date() },
    },
    include: [
      { model: Asset, as: 'asset', attributes: ['id', 'assetTag', 'name'] },
      { model: User, as: 'custodian', attributes: ['id', 'firstName', 'lastName'] },
    ],
    limit: 5,
  });

  const pendingRequests = await AssignmentRequest.count({
    where: { status: 'submitted' },
  });

  const activeAssignments = await Assignment.count({
    where: { status: 'active' },
  });

  const unreadNotifications = await Notification.count({
    where: { userId: req.user.id, isRead: false },
  });

  sendSuccess(res, {
    ...stats,
    assetsAvailable,
    assetsAllocated,
    maintenanceToday,
    activeBookings,
    pendingTransfers,
    upcomingReturns,
    overdueReturns,
    overdueList,
    upcomingList,
    pendingRequests,
    activeAssignments,
    unreadNotifications,
  });
});

exports.listNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.findAll({
    where: { userId: req.user.id },
    order: [['createdAt', 'DESC']],
    limit: 50,
  });
  sendSuccess(res, notifications);
});

exports.markNotificationRead = asyncHandler(async (req, res) => {
  await Notification.update(
    { isRead: true, readAt: new Date() },
    { where: { id: req.params.id, userId: req.user.id } }
  );
  sendSuccess(res, null, null, 'Marked as read');
});

exports.listUsers = asyncHandler(async (req, res) => {
  const users = await User.findAll({
    include: [
      { model: Role, as: 'roles', attributes: ['id', 'name', 'displayName'] },
      { model: Department, as: 'department', attributes: ['id', 'name'] },
    ],
    order: [['firstName', 'ASC']],
  });
  sendSuccess(res, users);
});

exports.updateUserRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { roleName, departmentId } = req.body;
  const ApiError = require('../utils/ApiError');

  const user = await User.findByPk(id);
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  if (departmentId !== undefined) {
    await user.update({ departmentId: departmentId || null });
  }

  if (roleName) {
    const role = await Role.findOne({ where: { name: roleName } });
    if (!role) {
      throw ApiError.notFound('Role not found');
    }

    await require('../models').UserRole.destroy({ where: { userId: id } });
    await require('../models').UserRole.create({
      userId: id,
      roleId: role.id,
      assignedAt: new Date(),
    });
  }

  const updatedUser = await User.findByPk(id, {
    include: [
      { model: Role, as: 'roles', attributes: ['id', 'name', 'displayName'] },
      { model: Department, as: 'department', attributes: ['id', 'name'] },
    ],
  });

  sendSuccess(res, updatedUser, 'User profile updated successfully');
});

exports.listAuditLogs = asyncHandler(async (req, res) => {
  const auditService = require('../services/audit.service');
  const logs = await auditService.listAuditLogs();
  sendSuccess(res, logs);
});
