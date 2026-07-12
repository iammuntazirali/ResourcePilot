const { Asset, AssetCategory, Department, Booking, Maintenance, sequelize } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const { Op } = require('sequelize');

exports.getReports = asyncHandler(async (req, res) => {
  // 1. Asset Utilization (Status count)
  const utilization = await Asset.findAll({
    attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
    group: ['status'],
    raw: true,
  });

  // 2. Department-wise allocation summary
  const deptAllocations = await Asset.findAll({
    attributes: [
      'departmentId',
      [sequelize.fn('COUNT', sequelize.col('Asset.id')), 'count'],
    ],
    include: [{ model: Department, as: 'department', attributes: ['name', 'code'] }],
    group: ['departmentId', 'department.id'],
  });

  // 3. Maintenance frequency by category
  const maintenanceStats = await Maintenance.findAll({
    attributes: [
      [sequelize.col('asset->category.name'), 'categoryName'],
      [sequelize.fn('COUNT', sequelize.col('Maintenance.id')), 'count'],
    ],
    include: [
      {
        model: Asset,
        as: 'asset',
        attributes: [],
        include: [{ model: AssetCategory, as: 'category', attributes: [] }],
      },
    ],
    group: [sequelize.col('asset->category.id'), sequelize.col('asset->category.name')],
    raw: true,
  });

  // 4. Assets nearing retirement (e.g. depreciation_years elapsed or purchase date older than 3 years)
  // Let's get assets where purchaseDate + depreciation_years is in the past or close to it
  const nearingRetirement = await Asset.findAll({
    include: [{ model: AssetCategory, as: 'category', attributes: ['name', 'depreciationYears'] }],
    where: {
      purchaseDate: { [Op.ne]: null },
    },
    limit: 15,
  });

  // 5. Resource booking heatmap (bookings by hour of day)
  const bookingHeatmap = await Booking.findAll({
    attributes: [
      [sequelize.fn('HOUR', sequelize.col('start_time')), 'hour'],
      [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
    ],
    where: {
      status: { [Op.ne]: 'cancelled' },
    },
    group: [sequelize.fn('HOUR', sequelize.col('start_time'))],
    raw: true,
  });

  sendSuccess(res, {
    utilization,
    deptAllocations,
    maintenanceStats,
    nearingRetirement: nearingRetirement.map((asset) => {
      const purchaseYear = asset.purchaseDate ? new Date(asset.purchaseDate).getFullYear() : null;
      const depYears = asset.category?.depreciationYears || 3;
      const currentYear = new Date().getFullYear();
      const yearsUsed = purchaseYear ? currentYear - purchaseYear : 0;
      return {
        id: asset.id,
        name: asset.name,
        tag: asset.assetTag,
        category: asset.category?.name || 'Uncategorized',
        purchaseDate: asset.purchaseDate,
        yearsUsed,
        depreciationYears: depYears,
        nearingRetirement: yearsUsed >= depYears,
      };
    }),
    bookingHeatmap,
  });
});
