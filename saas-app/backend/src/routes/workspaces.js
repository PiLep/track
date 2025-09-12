const express = require('express');
const db = require('../config/database');

const router = express.Router();

// GET /api/workspaces - Get user's workspaces
router.get('/', async (req, res) => {
  try {
    // Get user from JWT token
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

    // Get workspaces where user is a member
    const query = `
      SELECT
        w.*,
        wm.role as user_role,
        wm.joined_at as joined_at
      FROM workspaces w
      JOIN workspace_members wm ON w.id = wm.workspace_id
      WHERE wm.user_id = $1
      ORDER BY w.created_at DESC
    `;

    const result = await db.query(query, [userId]);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching workspaces:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch workspaces'
    });
  }
});

// PUT /api/workspaces/:id - Update workspace settings
router.put('/:id', async (req, res) => {
  try {
    const workspaceId = parseInt(req.params.id);
    const { name, description, domain_name, require_domain_membership } = req.body;

    // Get user from JWT token
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

    // Check if user has permission to update (owner or admin)
    const permissionQuery = `
      SELECT role FROM workspace_members
      WHERE workspace_id = $1 AND user_id = $2 AND role IN ('owner', 'admin')
    `;

    const permissionResult = await db.query(permissionQuery, [workspaceId, userId]);
    if (permissionResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions to update workspace'
      });
    }

    // Update workspace
    const updateQuery = `
      UPDATE workspaces
      SET name = $1, description = $2, domain_name = $3, require_domain_membership = $4, updated_at = $5
      WHERE id = $6
      RETURNING id, name, description, domain_name, require_domain_membership, owner_id, created_at, updated_at
    `;

    const values = [name, description, domain_name, require_domain_membership, new Date(), workspaceId];
    const result = await db.query(updateQuery, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Workspace not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating workspace:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update workspace'
    });
  }
});

// POST /api/workspaces - Create new workspace
router.post('/', async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Workspace name is required'
      });
    }

    // Get user from JWT token
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

    // Create workspace
    const workspaceQuery = `
      INSERT INTO workspaces (name, description, owner_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, description, owner_id, created_at
    `;

    const workspaceValues = [name, description, userId, new Date(), new Date()];
    const workspaceResult = await db.query(workspaceQuery, workspaceValues);
    const workspace = workspaceResult.rows[0];

    // Add creator as owner member
    const memberQuery = `
      INSERT INTO workspace_members (workspace_id, user_id, role, joined_at)
      VALUES ($1, $2, $3, $4)
    `;

    await db.query(memberQuery, [workspace.id, userId, 'owner', new Date()]);

    // Set as default workspace for user
    const updateUserQuery = `
      UPDATE users SET default_workspace_id = $1 WHERE id = $2
    `;
    await db.query(updateUserQuery, [workspace.id, userId]);

    res.status(201).json({
      success: true,
      data: {
        ...workspace,
        user_role: 'owner',
        joined_at: new Date()
      }
    });
  } catch (error) {
    console.error('Error creating workspace:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create workspace'
    });
  }
});

// POST /api/workspaces/:id/invite - Invite user to workspace
router.post('/:id/invite', async (req, res) => {
  try {
    const workspaceId = parseInt(req.params.id);
    const { email, role = 'member' } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    // Get user from JWT token
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

    // Check if user has permission to invite (owner or admin)
    const permissionQuery = `
      SELECT role FROM workspace_members
      WHERE workspace_id = $1 AND user_id = $2 AND role IN ('owner', 'admin')
    `;

    const permissionResult = await db.query(permissionQuery, [workspaceId, userId]);
    if (permissionResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions to invite users'
      });
    }

    // Check if invited user exists
    const invitedUserQuery = 'SELECT id, email FROM users WHERE email = $1';
    const invitedUserResult = await db.query(invitedUserQuery, [email]);

    if (invitedUserResult.rows.length === 0) {
      // User doesn't exist - in a real app, you'd send an email invitation
      // For now, we'll just return that an invitation was sent
      return res.json({
        success: true,
        data: {
          message: 'Invitation sent to new user',
          email: email,
          status: 'pending'
        }
      });
    }

    const invitedUser = invitedUserResult.rows[0];

    // Check if user is already a member
    const existingMemberQuery = `
      SELECT id FROM workspace_members WHERE workspace_id = $1 AND user_id = $2
    `;
    const existingMemberResult = await db.query(existingMemberQuery, [workspaceId, invitedUser.id]);

    if (existingMemberResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'User is already a member of this workspace'
      });
    }

    // Add user to workspace
    const memberQuery = `
      INSERT INTO workspace_members (workspace_id, user_id, role, joined_at)
      VALUES ($1, $2, $3, $4)
      RETURNING id, workspace_id, user_id, role, joined_at
    `;

    const memberResult = await db.query(memberQuery, [workspaceId, invitedUser.id, role, new Date()]);

    res.status(201).json({
      success: true,
      data: {
        ...memberResult.rows[0],
        user_email: invitedUser.email,
        message: 'User added to workspace'
      }
    });
  } catch (error) {
    console.error('Error inviting user to workspace:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to invite user'
    });
  }
});

// GET /api/workspaces/:id/members - Get workspace members
router.get('/:id/members', async (req, res) => {
  try {
    const workspaceId = parseInt(req.params.id);

    // Get user from JWT token
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

    // Check if user is a member of the workspace
    const memberCheckQuery = `
      SELECT role FROM workspace_members
      WHERE workspace_id = $1 AND user_id = $2
    `;

    const memberCheckResult = await db.query(memberCheckQuery, [workspaceId, userId]);
    if (memberCheckResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to workspace members'
      });
    }

    // Get workspace members with user details
    const membersQuery = `
      SELECT
        wm.id as membership_id,
        wm.role,
        wm.joined_at,
        u.id,
        u.email,
        u.username,
        u.full_name,
        u.avatar_url,
        u.created_at as user_created_at
      FROM workspace_members wm
      JOIN users u ON wm.user_id = u.id
      WHERE wm.workspace_id = $1
      ORDER BY wm.joined_at ASC
    `;

    const membersResult = await db.query(membersQuery, [workspaceId]);

    res.json({
      success: true,
      data: membersResult.rows
    });
  } catch (error) {
    console.error('Error fetching workspace members:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch workspace members'
    });
  }
});

module.exports = router;