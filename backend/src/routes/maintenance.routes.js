const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const maintenanceController = require('../controllers/maintenance.controller');

const router = express.Router();

router.use(authenticate);

router.post('/', maintenanceController.createMaintenance);
router.get('/', maintenanceController.listMaintenances);
router.put('/:id/approve', maintenanceController.approveMaintenance);
router.put('/:id/assign', maintenanceController.assignTechnician);
router.put('/:id/start', maintenanceController.startMaintenance);
router.put('/:id/resolve', maintenanceController.resolveMaintenance);

module.exports = router;
