const db = require('../config/database');

const getAnalytics = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT month_year, total_revenue, regular_bookings_count, membership_bookings_count 
       FROM analytics 
       ORDER BY month_year DESC`
    );
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAnalytics };