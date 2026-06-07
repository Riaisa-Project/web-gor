const QRCode = require('qrcode');
const db = require('../config/database');
const { AppError } = require('../middleware/errorMiddleware');

// Generate QRIS Payment
const generateQRIS = async (req, res, next) => {
    try {
        const { amount, transactionId, customerName } = req.body;
        
        // Generate QRIS string
        const qrisData = {
            merchantId: 'GOR123456',
            merchantName: 'GOR FUTSAL ARENA',
            amount: amount,
            transactionId: transactionId,
            customerName: customerName,
            timestamp: new Date().toISOString()
        };
        
        const qrString = JSON.stringify(qrisData);
        
        // Generate QR Code
        const qrCodeBuffer = await QRCode.toBuffer(qrString, {
            errorCorrectionLevel: 'H',
            margin: 2,
            width: 300
        });
        
        const qrCodeBase64 = qrCodeBuffer.toString('base64');
        const qrCodeUrl = `data:image/png;base64,${qrCodeBase64}`;
        
        // Save to database
        await db.query(
            `UPDATE transactions 
             SET payment_method = 'QRIS', 
                 payment_proof = $1,
                 status = 'Pending'
             WHERE id = $2`,
            [qrCodeUrl, transactionId]
        );
        
        res.json({
            success: true,
            data: {
                qrCode: qrCodeUrl,
                expiryTime: new Date(Date.now() + 30 * 60 * 1000)
            }
        });
    } catch (error) {
        next(error);
    }
};

// Check Payment Status
const checkPaymentStatus = async (req, res, next) => {
    try {
        const { transactionId } = req.params;
        
        const result = await db.query(
            `SELECT t.status, t.payment_method, t.created_at,
                    b.status as booking_status, b.id as booking_id
             FROM transactions t
             JOIN bookings b ON t.booking_id = b.id
             WHERE t.id = $1`,
            [transactionId]
        );
        
        if (result.rows.length === 0) {
            return res.json({ success: true, data: { status: 'Not Found' } });
        }
        
        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
};

// Upload Payment Proof (Manual Transfer)
const uploadPaymentProof = async (req, res, next) => {
    try {
        const { transactionId, bankAccount, proofImage } = req.body;
        
        await db.query(
            `UPDATE transactions 
             SET payment_method = $1, 
                 payment_proof = $2,
                 status = 'Pending'
             WHERE id = $3`,
            [`Bank Transfer - ${bankAccount}`, proofImage, transactionId]
        );
        
        res.json({
            success: true,
            message: 'Bukti pembayaran berhasil diupload, menunggu konfirmasi admin'
        });
    } catch (error) {
        next(error);
    }
};

// Get Bank Accounts
const getBankAccounts = async (req, res, next) => {
    try {
        const result = await db.query(
            `SELECT id, bank_name, account_number, account_name 
             FROM bank_accounts 
             WHERE is_active = true
             ORDER BY id`
        );
        
        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    generateQRIS,
    checkPaymentStatus,
    uploadPaymentProof,
    getBankAccounts
};