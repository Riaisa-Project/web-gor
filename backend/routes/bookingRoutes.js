const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { validate, bookingValidation } = require('../middleware/validationMiddleware');

router.get('/slots', bookingController.getAvailableSlots);
router.post('/', validate(bookingValidation), bookingController.createBooking);
router.get('/my-bookings', authMiddleware, bookingController.getUserBookings);

module.exports = router;