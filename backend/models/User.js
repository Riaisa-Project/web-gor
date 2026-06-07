const db = require('../config/database');
const bcrypt = require('bcrypt');

class User {
  static async create(userData) {
    const { name, email, phone, password, isAdmin = false } = userData;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await db.query(
      `INSERT INTO users (name, email, phone, password, is_admin) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, name, email, phone, is_admin, created_at`,
      [name, email || null, phone, hashedPassword, isAdmin]
    );
    
    return result.rows[0];
  }

  static async findByEmail(email) {
    const result = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0];
  }

  static async findByPhone(phone) {
    const result = await db.query(
      'SELECT * FROM users WHERE phone = $1',
      [phone]
    );
    return result.rows[0];
  }

  static async findById(id) {
    const result = await db.query(
      'SELECT id, name, email, phone, is_admin, created_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  static async verifyPassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }
}

module.exports = User;