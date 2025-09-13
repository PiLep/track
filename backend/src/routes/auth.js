const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, username, full_name, password } = req.body;

    if (!email || !username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email, username, and password are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long'
      });
    }

    // Check if user already exists
    const existingQuery = 'SELECT id FROM users WHERE email = $1 OR username = $2';
    const existingResult = await db.query(existingQuery, [email, username]);

    if (existingResult.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Email or username already exists'
      });
    }

    // Hash password
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Generate avatar URL
    const avatar_url = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${username}&size=80`;

    // Create user first (without default workspace initially)
    const insertQuery = `
      INSERT INTO users (email, username, full_name, password_hash, avatar_url, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, email, username, full_name, avatar_url, created_at
    `;

    const values = [email, username, full_name || username, password_hash, avatar_url, new Date(), new Date()];
    const result = await db.query(insertQuery, values);

    const user = result.rows[0];

    // Now create workspace with proper owner_id
    const workspaceQuery = `
      INSERT INTO workspaces (name, description, owner_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `;

    const workspaceName = `${full_name || username}'s Workspace`;
    const workspaceValues = [workspaceName, `Personal workspace for ${full_name || username}`, user.id, new Date(), new Date()];
    const workspaceResult = await db.query(workspaceQuery, workspaceValues);
    const workspaceId = workspaceResult.rows[0].id;

    // Update user with default workspace
    const updateUserQuery = `
      UPDATE users SET default_workspace_id = $1 WHERE id = $2
    `;
    await db.query(updateUserQuery, [workspaceId, user.id]);

    // Add user as owner member of workspace
    const memberQuery = `
      INSERT INTO workspace_members (workspace_id, user_id, role, joined_at)
      VALUES ($1, $2, $3, $4)
    `;
    await db.query(memberQuery, [workspaceId, user.id, 'owner', new Date()]);

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );

    // Include default_workspace_id in user object
    const userWithWorkspace = {
      ...user,
      default_workspace_id: workspaceId
    };

    res.status(201).json({
      success: true,
      data: { user: userWithWorkspace, token }
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register user'
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password, remember_me = false } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Find user
    const userQuery = 'SELECT * FROM users WHERE email = $1';
    const userResult = await db.query(userQuery, [email]);

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    const user = userResult.rows[0];

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Generate JWT with different expiration based on remember_me
    const expiresIn = remember_me 
      ? process.env.JWT_REMEMBER_EXPIRES_IN || '30d'  // Long-term token
      : process.env.JWT_EXPIRES_IN || '1h';           // Short-term token
    
    const token = jwt.sign(
      { 
        userId: user.id,
        remember_me: remember_me 
      },
      process.env.JWT_SECRET,
      { expiresIn }
    );

    // Return user data without password hash
    const userData = {
      id: user.id,
      email: user.email,
      username: user.username,
      full_name: user.full_name,
      avatar_url: user.avatar_url,
      created_at: user.created_at,
      updated_at: user.updated_at
    };

    res.json({
      success: true,
      data: { user: userData, token }
    });
  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to login'
    });
  }
});

// Get current user (protected route)
router.get('/me', authenticate, async (req, res) => {
  try {
    res.json({
      success: true,
      data: { user: req.user }
    });
  } catch (error) {
    console.error('Error getting current user:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
});

module.exports = router;