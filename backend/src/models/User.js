const db = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  // Create a new user
  static async create(userData) {
    const { email, username, fullName, password } = userData;
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const query = `
      INSERT INTO users (email, username, full_name, password_hash)
      VALUES ($1, $2, $3, $4)
      RETURNING id, email, username, full_name, created_at
    `;
    
    const values = [email, username, fullName, hashedPassword];
    const result = await db.query(query, values);
    return result.rows[0];
  }

  // Find user by email
  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await db.query(query, [email]);
    return result.rows[0];
  }

  // Find user by ID
  static async findById(id) {
    const query = 'SELECT id, email, username, full_name, avatar_url, created_at FROM users WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  // Compare password
  static async comparePassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}

module.exports = User;