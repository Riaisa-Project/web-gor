const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

router.get('/', authMiddleware, adminMiddleware, analyticsController.getAnalytics);

module.exports = router;