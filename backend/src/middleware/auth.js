const jwt = require('jsonwebtoken');
const db = require('../config/database');

const authenticate = async (req, res, next) => {
  console.log('🔐 Auth middleware called for:', req.method, req.path);
  
  try {
    const authHeader = req.header('Authorization');
    console.log('📋 Raw Authorization header:', authHeader);
    
    const token = authHeader?.replace('Bearer ', '');
    console.log('🎫 Extracted token:', token ? `${token.substring(0, 20)}...` : 'null');

    if (!token) {
      console.log('❌ No token provided');
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    console.log('🔍 Verifying token with JWT_SECRET:', process.env.JWT_SECRET ? 'present' : 'missing');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Token decoded successfully:', decoded);
    
    const userQuery = 'SELECT id, email, username, full_name, avatar_url, created_at, updated_at FROM users WHERE id = $1';
    const userResult = await db.query(userQuery, [decoded.userId]);
    console.log('👤 User query result:', userResult.rows.length > 0 ? 'found' : 'not found');

    if (userResult.rows.length === 0) {
      console.log('❌ User not found in database');
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }

    req.user = userResult.rows[0];
    console.log('✅ Authentication successful for user:', req.user.id);
    next();
  } catch (error) {
    console.error('❌ Auth middleware error:', error.message);
    console.error('Full error:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
};

module.exports = { authenticate };