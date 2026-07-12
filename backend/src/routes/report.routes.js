const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const reportController = require('../controllers/report.controller');

const router = express.Router();

router.use(authenticate);

router.get('/', reportController.getReports);

module.exports = router;
