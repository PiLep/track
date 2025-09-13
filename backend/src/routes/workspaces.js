const express = require('express');
const workspaceService = require('../services/workspaceService');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/workspaces - Get user's workspaces
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const workspaces = await workspaceService.getUserWorkspaces(userId);

    res.json({
      success: true,
      data: workspaces
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
router.put('/:id', authenticate, async (req, res) => {
  try {
    const workspaceId = parseInt(req.params.id);
    const userId = req.user.id;
    const workspaceData = req.body;

    const updatedWorkspace = await workspaceService.updateWorkspace(workspaceId, userId, workspaceData);

    res.json({
      success: true,
      data: updatedWorkspace
    });
  } catch (error) {
    console.error('Error updating workspace:', error);
    if (error.message === 'Insufficient permissions to update workspace') {
      return res.status(403).json({
        success: false,
        error: error.message
      });
    }
    if (error.message === 'Workspace not found') {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to update workspace'
    });
  }
});

// POST /api/workspaces - Create new workspace
router.post('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const workspaceData = req.body;

    const newWorkspace = await workspaceService.createWorkspace(userId, workspaceData);

    res.status(201).json({
      success: true,
      data: newWorkspace
    });
  } catch (error) {
    console.error('Error creating workspace:', error);
    if (error.message === 'Workspace name is required') {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to create workspace'
    });
  }
});

// POST /api/workspaces/:id/invite - Invite user to workspace
router.post('/:id/invite', authenticate, async (req, res) => {
  try {
    const workspaceId = parseInt(req.params.id);
    const { email, role = 'member' } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    const userId = req.user.id;
    const result = await workspaceService.inviteUserToWorkspace(workspaceId, userId, email, role);

    if (result.data) {
      res.status(201).json({
        success: true,
        data: result.data
      });
    } else {
      res.json({
        success: true,
        data: {
          message: result.message,
          email: result.email,
          status: result.status,
          workspace_name: result.workspace_name
        }
      });
    }
  } catch (error) {
    console.error('Error inviting user to workspace:', error);
    if (error.message === 'Insufficient permissions to invite users') {
      return res.status(403).json({
        success: false,
        error: error.message
      });
    }
    if (error.message === 'L\'utilisateur est déjà membre de ce workspace') {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to invite user'
    });
  }
});

// GET /api/workspaces/:id/members - Get workspace members
router.get('/:id/members', authenticate, async (req, res) => {
  try {
    const workspaceId = parseInt(req.params.id);
    const userId = req.user.id;

    const members = await workspaceService.getWorkspaceMembers(workspaceId, userId);

    res.json({
      success: true,
      data: members
    });
  } catch (error) {
    console.error('Error fetching workspace members:', error);
    if (error.message === 'Access denied to workspace members') {
      return res.status(403).json({
        success: false,
        error: error.message
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to fetch workspace members'
    });
  }
});

// GET /api/workspaces/:id/invitations - Get workspace invitations
router.get('/:id/invitations', authenticate, async (req, res) => {
  try {
    const workspaceId = parseInt(req.params.id);
    const userId = req.user.id;

    const invitations = await workspaceService.getWorkspaceInvitations(workspaceId, userId);

    res.json({
      success: true,
      data: invitations
    });
  } catch (error) {
    console.error('Error fetching workspace invitations:', error);
    if (error.message === 'Insufficient permissions to view invitations') {
      return res.status(403).json({
        success: false,
        error: error.message
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to fetch workspace invitations'
    });
  }
});

// DELETE /api/workspaces/invitations/:id - Cancel an invitation
router.delete('/invitations/:id', authenticate, async (req, res) => {
  try {
    const invitationId = parseInt(req.params.id);
    const userId = req.user.id;

    const cancelledInvitation = await workspaceService.cancelInvitation(invitationId, userId);

    res.json({
      success: true,
      data: cancelledInvitation,
      message: 'Invitation cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling invitation:', error);
    if (error.message === 'Insufficient permissions to cancel invitations') {
      return res.status(403).json({
        success: false,
        error: error.message
      });
    }
    if (error.message === 'Invitation not found or already processed') {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to cancel invitation'
    });
  }
});

// POST /api/workspaces/invitations/:id/resend - Resend an invitation
router.post('/invitations/:id/resend', authenticate, async (req, res) => {
  try {
    const invitationId = parseInt(req.params.id);
    const userId = req.user.id;

    const resentInvitation = await workspaceService.resendInvitation(invitationId, userId);

    res.json({
      success: true,
      data: resentInvitation,
      message: 'Invitation resent successfully'
    });
  } catch (error) {
    console.error('Error resending invitation:', error);
    if (error.message === 'Insufficient permissions to resend invitations') {
      return res.status(403).json({
        success: false,
        error: error.message
      });
    }
    if (error.message === 'Invitation not found or already processed') {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to resend invitation'
    });
  }
});

module.exports = router;