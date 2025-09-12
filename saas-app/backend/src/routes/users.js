const express = require('express');
const db = require('../config/database');
const router = express.Router();

// GET /api/users - Get all users
router.get('/', async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    let query = 'SELECT id, email, username, full_name, avatar_url, created_at, updated_at FROM users';

    const params = [];
    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users'
    });
  }
});

// GET /api/users/profile - Get current user profile (mocked for now)
router.get('/profile', async (req, res) => {
  try {
    // For now, return a mock user profile
    // In a real app, you'd get this from authentication middleware
    const mockUser = {
      id: 1,
      email: 'demo@track.com',
      username: 'demotrack',
      full_name: 'Demo User',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demotrack',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    };

    res.json({
      success: true,
      data: mockUser
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user profile'
    });
  }
});

// GET /api/users/stats/:userId - Get user statistics
router.get('/stats/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;

    // Get user info
    const userQuery = 'SELECT * FROM users WHERE id = $1';
    const userResult = await db.query(userQuery, [userId]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const user = userResult.rows[0];

    // Get statistics
    const assignedQuery = 'SELECT COUNT(*) as count FROM issues WHERE assignee_id = $1';
    const reportedQuery = 'SELECT COUNT(*) as count FROM issues WHERE reporter_id = $1';
    const completedQuery = `
      SELECT COUNT(*) as count
      FROM issues i
      JOIN workflow_states ws ON i.workflow_state_id = ws.id
      WHERE i.assignee_id = $1 AND ws.is_done = true
    `;

    const [assignedResult, reportedResult, completedResult] = await Promise.all([
      db.query(assignedQuery, [userId]),
      db.query(reportedQuery, [userId]),
      db.query(completedQuery, [userId])
    ]);

    const stats = {
      assignedIssues: parseInt(assignedResult.rows[0].count),
      reportedIssues: parseInt(reportedResult.rows[0].count),
      completedIssues: parseInt(completedResult.rows[0].count)
    };

    res.json({
      success: true,
      data: {
        user,
        stats
      }
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user statistics'
    });
  }
});

// PUT /api/users/profile - Update current user profile
router.put('/profile', async (req, res) => {
  try {
    const { full_name, email, username } = req.body;

    // Get user ID from token
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const query = `
      UPDATE users
      SET full_name = $1, email = $2, username = $3, updated_at = $4
      WHERE id = $5
      RETURNING id, email, username, full_name, avatar_url, created_at, updated_at
    `;

    const values = [full_name, email, username, new Date(), userId];
    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    if (error.code === '23505') { // Unique constraint violation
      res.status(409).json({
        success: false,
        error: 'Email or username already exists'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to update user profile'
      });
    }
  }
});

// POST /api/users - Create new user
router.post('/', async (req, res) => {
  try {
    const { email, username, full_name, password, avatar_url } = req.body;

    if (!email || !username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email, username, and password are required'
      });
    }

    // Hash the password
    const bcrypt = require('bcryptjs');
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);

    const query = `
      INSERT INTO users (email, username, full_name, password_hash, avatar_url, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, email, username, full_name, avatar_url, created_at
    `;

    const values = [email, username, full_name, password_hash, avatar_url, new Date(), new Date()];
    const result = await db.query(query, values);

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating user:', error);
    if (error.code === '23505') { // Unique constraint violation
      res.status(409).json({
        success: false,
        error: 'Email or username already exists'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to create user'
      });
    }
  }
});

module.exports = router;