const QRCode = require('qrcode');
const db = require('../config/database');
const { AppError } = require('../middleware/errorMiddleware');

const generateQRIS = async (req, res, next) => {
  try {
    const { amount, transactionId } = req.body;
    
    const qrisData = {
      version: '01',
      merchantId: process.env.QRIS_MERCHANT_ID || 'GOR123456',
      merchantName: 'GOR Futsal Arena',
      merchantCity: 'Jakarta',
      amount: amount,
      transactionId: transactionId,
      timestamp: new Date().toISOString()
    };
    
    const qrString = JSON.stringify(qrisData);
    
    const qrCodeBuffer = await QRCode.toBuffer(qrString, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 300
    });
    
    const qrCodeBase64 = qrCodeBuffer.toString('base64');
    const qrCodeUrl = `data:image/png;base64,${qrCodeBase64}`;
    
    await db.query(
      `UPDATE transactions 
       SET payment_proof = $1, payment_method = 'QRIS'
       WHERE id = $2`,
      [qrCodeUrl, transactionId]
    );
    
    res.json({
      success: true,
      data: {
        qrCode: qrCodeUrl,
        qrString: qrString,
        expiryTime: new Date(Date.now() + 30 * 60 * 1000)
      }
    });
  } catch (error) {
    next(error);
  }
};

const checkPaymentStatus = async (req, res, next) => {
  try {
    const { transactionId } = req.params;
    
    const result = await db.query(
      `SELECT t.status, t.payment_method, t.created_at,
              b.status as booking_status
       FROM transactions t
       JOIN bookings b ON t.booking_id = b.id
       WHERE t.id = $1`,
      [transactionId]
    );
    
    if (result.rows.length === 0) {
      throw new AppError('Transaksi tidak ditemukan', 404);
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

const uploadPaymentProof = async (req, res, next) => {
  try {
    const { transactionId, bankAccount, proofImage } = req.body;
    
    await db.query(
      `UPDATE transactions 
       SET payment_method = $1, 
           payment_proof = $2,
           status = 'Pending'
       WHERE id = $3`,
      [bankAccount, proofImage, transactionId]
    );
    
    res.json({
      success: true,
      message: 'Bukti pembayaran berhasil diupload, menunggu konfirmasi admin'
    });
  } catch (error) {
    next(error);
  }
};

const getBankAccounts = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT bank_name, account_number, account_name 
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