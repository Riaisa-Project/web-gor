const db = require('../config/database');

class Court {
  static async findAll() {
    const result = await db.query(
      'SELECT * FROM courts ORDER BY id ASC'
    );
    return result.rows;
  }

  static async findById(id) {
    const result = await db.query(
      'SELECT * FROM courts WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  static async updatePrice(id, pricePerHour) {
    const result = await db.query(
      'UPDATE courts SET price_per_hour = $1 WHERE id = $2 RETURNING *',
      [pricePerHour, id]
    );
    return result.rows[0];
  }
}

module.exports = Court;