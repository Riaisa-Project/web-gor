const db = require('../config/database');
const { AppError } = require('../middleware/errorMiddleware');

const getTransactions = async (req, res, next) => {
  try {
    const query = `
      SELECT t.id, t.total_price as "totalVal", t.status, t.payment_method,
             b.booking_date as "dateStr", b.start_time as "startVal", 
             b.end_time as "endVal", b.type,
             c.id as court, u.name as "userName", u.phone
      FROM transactions t
      JOIN bookings b ON t.booking_id = b.id
      JOIN courts c ON b.court_id = c.id
      JOIN users u ON b.user_id = u.id
      ORDER BY t.created_at DESC
    `;
    const { rows } = await db.query(query);
    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    next(error);
  }
};

const updateTransactionStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    await db.query('BEGIN');
    
    const trxRes = await db.query(
      'UPDATE transactions SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    
    if (trxRes.rows.length === 0) {
      await db.query('ROLLBACK');
      throw new AppError('Transaksi tidak ditemukan', 404);
    }
    
    const trx = trxRes.rows[0];
    const bookingId = trx.booking_id;
    
    let bookingStatus = 'Pending';
    if (status === 'Lunas') bookingStatus = 'Confirmed';
    else if (status === 'Dibatalkan') bookingStatus = 'Cancelled';
    
    await db.query('UPDATE bookings SET status = $1 WHERE id = $2', [bookingStatus, bookingId]);
    
    await db.query('COMMIT');
    res.json({ success: true, status });
  } catch (error) {
    await db.query('ROLLBACK');
    next(error);
  }
};

module.exports = { getTransactions, updateTransactionStatus };