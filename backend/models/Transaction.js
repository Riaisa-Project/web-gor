const db = require('../config/database');

class Transaction {
  static async create(transactionData) {
    const { id, bookingId, totalPrice, status, paymentMethod } = transactionData;
    
    const result = await db.query(
      `INSERT INTO transactions (id, booking_id, total_price, status, payment_method) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [id, bookingId, totalPrice, status || 'Pending', paymentMethod || null]
    );
    
    return result.rows[0];
  }

  static async findById(id) {
    const result = await db.query(
      `SELECT t.*, b.booking_date, b.start_time, b.end_time, c.name as court_name
       FROM transactions t
       JOIN bookings b ON t.booking_id = b.id
       JOIN courts c ON b.court_id = c.id
       WHERE t.id = $1`,
      [id]
    );
    return result.rows[0];
  }

  static async updateStatus(id, status) {
    const result = await db.query(
      'UPDATE transactions SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, id]
    );
    return result.rows[0];
  }

  static async getAll() {
    const result = await db.query(
      `SELECT t.*, b.booking_date, b.start_time, b.end_time, 
              c.name as court_name, u.name as user_name, u.phone
       FROM transactions t
       JOIN bookings b ON t.booking_id = b.id
       JOIN courts c ON b.court_id = c.id
       JOIN users u ON b.user_id = u.id
       ORDER BY t.created_at DESC`
    );
    return result.rows;
  }
}

module.exports = Transaction;