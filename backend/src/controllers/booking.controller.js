const { Op } = require('sequelize');
const { Booking, Asset, User } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendCreated } = require('../utils/response');
const ApiError = require('../utils/ApiError');
const { createAuditLog } = require('../services/audit.service');

exports.createBooking = asyncHandler(async (req, res) => {
  const { assetId, startTime, endTime } = req.body;
  const userId = req.user.id;

  const asset = await Asset.findByPk(assetId);
  if (!asset) {
    throw ApiError.notFound('Asset not found');
  }

  if (!asset.isBookable) {
    throw ApiError.badRequest('This asset is not available for shared time-slot bookings');
  }

  const start = new Date(startTime);
  const end = new Date(endTime);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw ApiError.badRequest('Invalid start or end time format');
  }

  if (start >= end) {
    throw ApiError.badRequest('Start time must be before end time');
  }

  // Overlap check
  const overlap = await Booking.findOne({
    where: {
      assetId,
      status: { [Op.ne]: 'cancelled' },
      [Op.or]: [
        {
          startTime: { [Op.lt]: end },
          endTime: { [Op.gt]: start },
        },
      ],
    },
  });

  if (overlap) {
    throw ApiError.badRequest(
      `Time slot overlaps with an existing booking (from ${new Date(
        overlap.startTime
      ).toLocaleString()} to ${new Date(overlap.endTime).toLocaleString()})`
    );
  }

  const booking = await Booking.create({
    assetId,
    userId,
    startTime: start,
    endTime: end,
    status: 'upcoming',
  });

  await createAuditLog({
    userId,
    action: 'CREATE_BOOKING',
    entityType: 'booking',
    entityId: booking.id,
    newValues: booking.toJSON(),
    req,
  });

  sendCreated(res, booking, 'Booking created successfully');
});

exports.listBookings = asyncHandler(async (req, res) => {
  const { assetId, userId, status } = req.query;
  const where = {};

  if (assetId) where.assetId = assetId;
  if (userId) where.userId = userId;
  if (status) where.status = status;

  const bookings = await Booking.findAll({
    where,
    include: [
      { model: Asset, as: 'asset', attributes: ['id', 'name', 'assetTag', 'isBookable'] },
      { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] },
    ],
    order: [['startTime', 'ASC']],
  });

  sendSuccess(res, bookings);
});

exports.cancelBooking = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const userRoles = req.user.roles || [];

  const booking = await Booking.findByPk(id);
  if (!booking) {
    throw ApiError.notFound('Booking not found');
  }

  if (booking.status === 'cancelled') {
    throw ApiError.badRequest('Booking is already cancelled');
  }

  // Permission check: only the booker or Admin/Asset Manager can cancel
  const isAdminOrManager = userRoles.includes('super_admin') || userRoles.includes('asset_manager');
  if (booking.userId !== userId && !isAdminOrManager) {
    throw ApiError.forbidden('You do not have permission to cancel this booking');
  }

  const oldValues = booking.toJSON();
  await booking.update({ status: 'cancelled' });

  await createAuditLog({
    userId,
    action: 'CANCEL_BOOKING',
    entityType: 'booking',
    entityId: booking.id,
    oldValues,
    newValues: { status: 'cancelled' },
    req,
  });

  sendSuccess(res, booking, 'Booking cancelled successfully');
});
