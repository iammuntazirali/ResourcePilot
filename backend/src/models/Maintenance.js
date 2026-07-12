module.exports = (sequelize, DataTypes) => {
  const Maintenance = sequelize.define(
    'Maintenance',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      assetId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'asset_id' },
      issue: { type: DataTypes.TEXT, allowNull: false },
      priority: {
        type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
        allowNull: false,
        defaultValue: 'medium',
      },
      status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected', 'technician_assigned', 'in_progress', 'resolved'),
        allowNull: false,
        defaultValue: 'pending',
      },
      technicianId: { type: DataTypes.BIGINT.UNSIGNED, field: 'technician_id' },
      createdById: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'created_by_id' },
      approvedById: { type: DataTypes.BIGINT.UNSIGNED, field: 'approved_by_id' },
      resolutionNotes: { type: DataTypes.TEXT, field: 'resolution_notes' },
    },
    { tableName: 'maintenances', paranoid: false }
  );

  Maintenance.associate = (models) => {
    Maintenance.belongsTo(models.Asset, { foreignKey: 'assetId', as: 'asset' });
    Maintenance.belongsTo(models.User, { foreignKey: 'technicianId', as: 'technician' });
    Maintenance.belongsTo(models.User, { foreignKey: 'createdById', as: 'creator' });
    Maintenance.belongsTo(models.User, { foreignKey: 'approvedById', as: 'approver' });
  };

  return Maintenance;
};
