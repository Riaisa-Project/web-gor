const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

router.get('/', authMiddleware, transactionController.getTransactions);
router.put('/:id/status', authMiddleware, adminMiddleware, transactionController.updateTransactionStatus);

module.exports = router;