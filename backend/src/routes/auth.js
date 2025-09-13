const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../config/database');

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

    // Create workspace first (we'll update owner_id after creating user)
    const workspaceQuery = `
      INSERT INTO workspaces (name, description, owner_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `;

    const workspaceName = `${full_name || username}'s Workspace`;
    const workspaceValues = [workspaceName, `Personal workspace for ${full_name || username}`, null, new Date(), new Date()];
    const workspaceResult = await db.query(workspaceQuery, workspaceValues);
    const workspaceId = workspaceResult.rows[0].id;

    // Create user with default workspace
    const insertQuery = `
      INSERT INTO users (email, username, full_name, password_hash, avatar_url, default_workspace_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, email, username, full_name, avatar_url, default_workspace_id, created_at
    `;

    const values = [email, username, full_name || username, password_hash, avatar_url, workspaceId, new Date(), new Date()];
    const result = await db.query(insertQuery, values);

    const user = result.rows[0];

    // Update workspace owner_id
    const updateWorkspaceQuery = `
      UPDATE workspaces SET owner_id = $1 WHERE id = $2
    `;
    await db.query(updateWorkspaceQuery, [user.id, workspaceId]);

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

    res.status(201).json({
      success: true,
      data: { user, token }
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
    const { email, password } = req.body;

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

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
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
router.get('/me', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userQuery = 'SELECT id, email, username, full_name, avatar_url, created_at, updated_at FROM users WHERE id = $1';
    const userResult = await db.query(userQuery, [decoded.userId]);

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }

    res.json({
      success: true,
      data: { user: userResult.rows[0] }
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