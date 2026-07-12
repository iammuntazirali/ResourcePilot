module.exports = (sequelize, DataTypes) => {
  const AuditItem = sequelize.define(
    'AuditItem',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      cycleId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'cycle_id' },
      assetId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'asset_id' },
      status: {
        type: DataTypes.ENUM('pending', 'verified', 'missing', 'damaged'),
        allowNull: false,
        defaultValue: 'pending',
      },
      notes: DataTypes.TEXT,
      checkedById: { type: DataTypes.BIGINT.UNSIGNED, field: 'checked_by_id' },
      checkedAt: { type: DataTypes.DATE, field: 'checked_at' },
    },
    { tableName: 'audit_items', paranoid: false }
  );

  AuditItem.associate = (models) => {
    AuditItem.belongsTo(models.AuditCycle, { foreignKey: 'cycleId', as: 'cycle' });
    AuditItem.belongsTo(models.Asset, { foreignKey: 'assetId', as: 'asset' });
    AuditItem.belongsTo(models.User, { foreignKey: 'checkedById', as: 'checkedBy' });
  };

  return AuditItem;
};
