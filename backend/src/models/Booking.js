module.exports = (sequelize, DataTypes) => {
  const Booking = sequelize.define(
    'Booking',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      assetId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'asset_id' },
      userId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'user_id' },
      startTime: { type: DataTypes.DATE, allowNull: false, field: 'start_time' },
      endTime: { type: DataTypes.DATE, allowNull: false, field: 'end_time' },
      status: {
        type: DataTypes.ENUM('upcoming', 'ongoing', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'upcoming',
      },
    },
    { tableName: 'bookings', paranoid: false }
  );

  Booking.associate = (models) => {
    Booking.belongsTo(models.Asset, { foreignKey: 'assetId', as: 'asset' });
    Booking.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  };

  return Booking;
};
