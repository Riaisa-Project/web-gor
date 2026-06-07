const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authMiddleware } = require('../middleware/authMiddleware');

// QRIS routes
router.post('/qris/generate', authMiddleware, paymentController.generateQRIS);

// Manual transfer routes
router.get('/bank-accounts', paymentController.getBankAccounts);
router.post('/upload-proof', authMiddleware, paymentController.uploadPaymentProof);

// Status check
router.get('/check-status/:transactionId', authMiddleware, paymentController.checkPaymentStatus);

module.exports = router;