const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const bookingController = require('../controllers/booking.controller');

const router = express.Router();

router.use(authenticate);

router.post('/', bookingController.createBooking);
router.get('/', bookingController.listBookings);
router.put('/:id/cancel', bookingController.cancelBooking);

module.exports = router;
