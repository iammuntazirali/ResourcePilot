const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const auditController = require('../controllers/audit.controller');

const router = express.Router();

router.use(authenticate);

router.post('/', auditController.createCycle);
router.get('/', auditController.listCycles);
router.get('/:id', auditController.getCycle);
router.put('/:id/items/:itemId', auditController.checkItem);
router.put('/:id/close', auditController.closeCycle);

module.exports = router;
