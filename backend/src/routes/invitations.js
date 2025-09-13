const express = require('express');
const jwt = require('jsonwebtoken');
const workspaceService = require('../services/workspaceService');

const router = express.Router();

// GET /api/invitations/:token - Get invitation details
router.get('/:token', async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token is required'
      });
    }

    const invitation = await workspaceService.getInvitationByToken(token);

    if (!invitation) {
      return res.status(404).json({
        success: false,
        error: 'Invalid or expired invitation'
      });
    }

    // Return invitation details without sensitive information
    res.json({
      success: true,
      data: {
        email: invitation.email,
        workspace_name: invitation.workspace_name,
        role: invitation.role,
        inviter_name: invitation.inviter_name || invitation.inviter_username,
        created_at: invitation.created_at,
        expires_at: invitation.expires_at
      }
    });
  } catch (error) {
    console.error('Error getting invitation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get invitation'
    });
  }
});

// POST /api/invitations/:token/accept - Accept invitation and create account
router.post('/:token/accept', async (req, res) => {
  try {
    const { token } = req.params;
    const { email, username, full_name, password } = req.body;

    // Validation
    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token is required'
      });
    }

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

    // Check if username is already taken
    const db = require('../config/database');
    const existingUserQuery = 'SELECT id FROM users WHERE username = $1';
    const existingUserResult = await db.query(existingUserQuery, [username]);

    if (existingUserResult.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Username already exists'
      });
    }

    const result = await workspaceService.acceptInvitation(token, {
      email,
      username, 
      full_name,
      password
    });

    // Generate JWT for the new user
    const jwtToken = jwt.sign(
      { userId: result.user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );

    res.status(201).json({
      success: true,
      data: {
        user: result.user,
        workspace: result.workspace,
        token: jwtToken
      }
    });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    
    if (error.message === 'Invalid or expired invitation token') {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    
    if (error.message === 'Email does not match invitation') {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to accept invitation'
    });
  }
});

module.exports = router;
