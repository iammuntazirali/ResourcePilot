const { ASSET_STATUS } = require('../constants/assetStates');

module.exports = (sequelize, DataTypes) => {
  const Asset = sequelize.define(
    'Asset',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      assetTag: { type: DataTypes.STRING(50), allowNull: false, unique: true, field: 'asset_tag' },
      name: { type: DataTypes.STRING(200), allowNull: false },
      categoryId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'category_id' },
      serialNumber: { type: DataTypes.STRING(100), unique: true, field: 'serial_number' },
      model: DataTypes.STRING(150),
      manufacturer: DataTypes.STRING(150),
      status: {
        type: DataTypes.ENUM(...Object.values(ASSET_STATUS)),
        allowNull: false,
        defaultValue: ASSET_STATUS.DRAFT,
      },
      condition: {
        type: DataTypes.ENUM('excellent', 'good', 'fair', 'poor', 'damaged'),
        defaultValue: 'good',
      },
      departmentId: { type: DataTypes.BIGINT.UNSIGNED, field: 'department_id' },
      locationId: { type: DataTypes.BIGINT.UNSIGNED, field: 'location_id' },
      assignedToUserId: { type: DataTypes.BIGINT.UNSIGNED, field: 'assigned_to_user_id' },
      vendorId: { type: DataTypes.BIGINT.UNSIGNED, field: 'vendor_id' },
      purchaseDate: { type: DataTypes.DATEONLY, field: 'purchase_date' },
      purchaseCost: { type: DataTypes.DECIMAL(15, 2), field: 'purchase_cost' },
      warrantyExpiry: { type: DataTypes.DATEONLY, field: 'warranty_expiry' },
      currentValue: { type: DataTypes.DECIMAL(15, 2), field: 'current_value' },
      notes: DataTypes.TEXT,
      imageUrl: { type: DataTypes.STRING(500), field: 'image_url' },
      isConsumable: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_consumable' },
      quantity: { type: DataTypes.INTEGER, defaultValue: 1 },
      isBookable: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_bookable' },
      createdBy: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'created_by' },
    },
    { tableName: 'assets', paranoid: true }
  );

  Asset.associate = (models) => {
    Asset.belongsTo(models.AssetCategory, { foreignKey: 'categoryId', as: 'category' });
    Asset.belongsTo(models.Department, { foreignKey: 'departmentId', as: 'department' });
    Asset.belongsTo(models.Location, { foreignKey: 'locationId', as: 'location' });
    Asset.belongsTo(models.User, { foreignKey: 'assignedToUserId', as: 'assignedTo' });
    Asset.belongsTo(models.Vendor, { foreignKey: 'vendorId', as: 'vendor' });
    Asset.belongsTo(models.User, { foreignKey: 'createdBy', as: 'creator' });
    Asset.hasMany(models.AssetSpecification, { foreignKey: 'assetId', as: 'specifications' });
    Asset.hasMany(models.AssetDocument, { foreignKey: 'assetId', as: 'documents' });
    Asset.hasMany(models.AssetStatusHistory, { foreignKey: 'assetId', as: 'statusHistory' });
    Asset.hasMany(models.Assignment, { foreignKey: 'assetId', as: 'assignments' });
    Asset.hasMany(models.Booking, { foreignKey: 'assetId', as: 'bookings' });
    Asset.hasMany(models.Maintenance, { foreignKey: 'assetId', as: 'maintenances' });
    Asset.hasMany(models.AuditItem, { foreignKey: 'assetId', as: 'auditItems' });
  };

  return Asset;
};
