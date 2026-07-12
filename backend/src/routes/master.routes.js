const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/rbac.middleware');
const validate = require('../middleware/validate.middleware');
const { PERMISSIONS } = require('../constants/permissions');
const masterController = require('../controllers/master.controller');
const {
  createDepartmentValidator,
  createLocationValidator,
  createCategoryValidator,
} = require('../validators/master.validator');

const router = express.Router();

router.get('/dashboard/overview', authenticate, masterController.dashboard);

router.get('/departments', authenticate, requirePermission(PERMISSIONS.DEPARTMENT_READ), masterController.listDepartments);
router.post('/departments', authenticate, requirePermission(PERMISSIONS.DEPARTMENT_CREATE), createDepartmentValidator, validate, masterController.createDepartment);

router.get('/locations', authenticate, requirePermission(PERMISSIONS.LOCATION_READ), masterController.listLocations);
router.post('/locations', authenticate, requirePermission(PERMISSIONS.LOCATION_CREATE), createLocationValidator, validate, masterController.createLocation);

router.get('/categories', authenticate, requirePermission(PERMISSIONS.CATEGORY_READ), masterController.listCategories);
router.post('/categories', authenticate, requirePermission(PERMISSIONS.CATEGORY_CREATE), createCategoryValidator, validate, masterController.createCategory);

router.get('/vendors', authenticate, requirePermission(PERMISSIONS.VENDOR_READ), masterController.listVendors);
router.post('/vendors', authenticate, requirePermission(PERMISSIONS.VENDOR_CREATE), masterController.createVendor);

router.get('/notifications', authenticate, masterController.listNotifications);
router.patch('/notifications/:id/read', authenticate, masterController.markNotificationRead);

router.get('/users', authenticate, masterController.listUsers);
router.patch('/users/:id/role', authenticate, masterController.updateUserRole);
router.get('/audit-logs', authenticate, masterController.listAuditLogs);

module.exports = router;
