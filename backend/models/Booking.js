const db = require('../config/database');

class Booking {
  static async create(bookingData) {
    const { userId, courtId, bookingDate, startTime, endTime, type, status } = bookingData;
    
    const result = await db.query(
      `INSERT INTO bookings (user_id, court_id, booking_date, start_time, end_time, type, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [userId, courtId, bookingDate, startTime, endTime, type, status || 'Pending']
    );
    
    return result.rows[0];
  }

  static async findByDateAndCourt(date, courtId) {
    const result = await db.query(
      `SELECT b.*, u.name as user_name, u.phone 
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       WHERE b.booking_date = $1 AND b.court_id = $2
       AND b.status IN ('Pending', 'Confirmed')`,
      [date, courtId]
    );
    return result.rows;
  }

  static async updateStatus(id, status) {
    const result = await db.query(
      'UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    return result.rows[0];
  }

  static async getUserBookings(userId) {
    const result = await db.query(
      `SELECT b.*, c.name as court_name, c.price_per_hour
       FROM bookings b
       JOIN courts c ON b.court_id = c.id
       WHERE b.user_id = $1
       ORDER BY b.created_at DESC`,
      [userId]
    );
    return result.rows;
  }
}

module.exports = Booking;