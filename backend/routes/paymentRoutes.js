const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.post('/generate-qris', authMiddleware, paymentController.generateQRIS);
router.get('/check-status/:transactionId', authMiddleware, paymentController.checkPaymentStatus);
router.post('/upload-proof', authMiddleware, paymentController.uploadPaymentProof);
router.get('/bank-accounts', paymentController.getBankAccounts);

module.exports = router;