module.exports = (sequelize, DataTypes) => {
  const AuditCycle = sequelize.define(
    'AuditCycle',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING(150), allowNull: false },
      scopeType: {
        type: DataTypes.ENUM('department', 'location', 'all'),
        allowNull: false,
        defaultValue: 'all',
        field: 'scope_type',
      },
      scopeId: { type: DataTypes.BIGINT.UNSIGNED, field: 'scope_id' },
      startDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'start_date' },
      endDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'end_date' },
      status: {
        type: DataTypes.ENUM('active', 'closed'),
        allowNull: false,
        defaultValue: 'active',
      },
      createdById: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'created_by_id' },
      closedAt: { type: DataTypes.DATE, field: 'closed_at' },
    },
    { tableName: 'audit_cycles', paranoid: false }
  );

  AuditCycle.associate = (models) => {
    AuditCycle.belongsTo(models.User, { foreignKey: 'createdById', as: 'creator' });
    AuditCycle.hasMany(models.AuditItem, { foreignKey: 'cycleId', as: 'items' });
  };

  return AuditCycle;
};
