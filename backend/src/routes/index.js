const express = require('express');
const authRoutes = require('./auth.routes');
const assetRoutes = require('./asset.routes');
const assignmentRoutes = require('./assignment.routes');
const bookingRoutes = require('./booking.routes');
const maintenanceRoutes = require('./maintenance.routes');
const auditRoutes = require('./audit.routes');
const reportRoutes = require('./report.routes');
const masterRoutes = require('./master.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/assets', assetRoutes);
router.use('/assignments', assignmentRoutes);
router.use('/bookings', bookingRoutes);
router.use('/maintenances', maintenanceRoutes);
router.use('/audits', auditRoutes);
router.use('/reports', reportRoutes);
router.use('/', masterRoutes);

module.exports = router;
