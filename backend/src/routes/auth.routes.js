const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/rbac.middleware');
const validate = require('../middleware/validate.middleware');
const { loginLimiter } = require('../middleware/rateLimit.middleware');
const { PERMISSIONS } = require('../constants/permissions');
const authController = require('../controllers/auth.controller');
const { loginValidator, changePasswordValidator, signupValidator } = require('../validators/auth.validator');

const router = express.Router();

router.post('/login', loginLimiter, loginValidator, validate, authController.login);
router.post('/signup', signupValidator, validate, authController.signup);
router.post('/refresh', authController.refresh);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.me);
router.patch('/password', authenticate, changePasswordValidator, validate, authController.changePassword);

module.exports = router;
