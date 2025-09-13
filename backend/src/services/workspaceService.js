const db = require('../config/database');
const emailService = require('./emailService');
const crypto = require('crypto');

// Utility function to generate secure tokens
const generateInviteToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

class WorkspaceService {
  async inviteUserToWorkspace(workspaceId, inviterUserId, inviteEmail, role = 'member') {
    try {
      // Get inviter and workspace information
      const inviterWorkspaceQuery = `
        SELECT 
          w.name as workspace_name,
          u.full_name as inviter_name,
          u.username as inviter_username,
          wm.role as inviter_role
        FROM workspaces w
        JOIN workspace_members wm ON w.id = wm.workspace_id
        JOIN users u ON wm.user_id = u.id
        WHERE w.id = $1 AND u.id = $2 AND wm.role IN ('owner', 'admin')
      `;

      const inviterWorkspaceResult = await db.query(inviterWorkspaceQuery, [workspaceId, inviterUserId]);
      if (inviterWorkspaceResult.rows.length === 0) {
        throw new Error('Insufficient permissions to invite users');
      }

      const { workspace_name, inviter_name, inviter_username } = inviterWorkspaceResult.rows[0];
      const inviterDisplayName = inviter_name || inviter_username;

      // Check if invited user already exists
      const invitedUserQuery = 'SELECT id, email, full_name FROM users WHERE email = $1';
      const invitedUserResult = await db.query(invitedUserQuery, [inviteEmail]);

      if (invitedUserResult.rows.length > 0) {
        const invitedUser = invitedUserResult.rows[0];
        
        // Check if user is already a member
        const existingMemberQuery = `
          SELECT id FROM workspace_members WHERE workspace_id = $1 AND user_id = $2
        `;
        const existingMemberResult = await db.query(existingMemberQuery, [workspaceId, invitedUser.id]);

        if (existingMemberResult.rows.length > 0) {
          throw new Error('L\'utilisateur est déjà membre de ce workspace');
        }

        // Add existing user to workspace directly
        const memberQuery = `
          INSERT INTO workspace_members (workspace_id, user_id, role, joined_at)
          VALUES ($1, $2, $3, $4)
          RETURNING id, workspace_id, user_id, role, joined_at
        `;

        const memberResult = await db.query(memberQuery, [workspaceId, invitedUser.id, role, new Date()]);

        return {
          success: true,
          data: {
            ...memberResult.rows[0],
            user_email: invitedUser.email,
            user_name: invitedUser.full_name,
            message: 'Utilisateur ajouté au workspace'
          }
        };
      }

      // User doesn't exist - create invitation with token
      const inviteToken = generateInviteToken();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 72); // Token expires in 72 hours

      // Check if there's already a pending invitation
      const existingInviteQuery = `
        SELECT id FROM invitations 
        WHERE email = $1 AND workspace_id = $2 AND status = 'pending'
      `;
      const existingInviteResult = await db.query(existingInviteQuery, [inviteEmail, workspaceId]);

      if (existingInviteResult.rows.length > 0) {
        // Update existing invitation
        const updateInviteQuery = `
          UPDATE invitations 
          SET token = $1, expires_at = $2, role = $3, created_at = $4
          WHERE email = $5 AND workspace_id = $6 AND status = 'pending'
          RETURNING id, token
        `;
        const updateInviteResult = await db.query(updateInviteQuery, [
          inviteToken, expiresAt, role, new Date(), inviteEmail, workspaceId
        ]);
        
        // Send invitation email
        await emailService.sendWorkspaceInvitationEmail(
          inviteEmail, 
          inviterDisplayName, 
          workspace_name,
          inviteToken
        );

        return {
          success: true,
          message: 'Invitation mise à jour et envoyée par email',
          email: inviteEmail,
          status: 'pending_signup',
          workspace_name: workspace_name
        };
      } else {
        // Create new invitation
        const createInviteQuery = `
          INSERT INTO invitations (email, workspace_id, invited_by, role, token, expires_at, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id, token
        `;
        const createInviteResult = await db.query(createInviteQuery, [
          inviteEmail, workspaceId, inviterUserId, role, inviteToken, expiresAt, new Date()
        ]);

        // Send invitation email
        await emailService.sendWorkspaceInvitationEmail(
          inviteEmail, 
          inviterDisplayName, 
          workspace_name,
          inviteToken
        );

        return {
          success: true,
          message: 'Invitation envoyée par email',
          email: inviteEmail,
          status: 'pending_signup',
          workspace_name: workspace_name
        };
      }
    } catch (error) {
      console.error('Error in workspace invitation:', error);
      throw error;
    }
  }

  async getInvitationByToken(token) {
    try {
      const inviteQuery = `
        SELECT 
          i.*,
          w.name as workspace_name,
          u.full_name as inviter_name,
          u.username as inviter_username
        FROM invitations i
        JOIN workspaces w ON i.workspace_id = w.id
        JOIN users u ON i.invited_by = u.id
        WHERE i.token = $1 AND i.status = 'pending' AND i.expires_at > NOW()
      `;
      
      const result = await db.query(inviteQuery, [token]);
      
      if (result.rows.length === 0) {
        return null; // Invalid or expired token
      }
      
      return result.rows[0];
    } catch (error) {
      console.error('Error getting invitation by token:', error);
      throw error;
    }
  }

  async acceptInvitation(token, userData) {
    try {
      const invitation = await this.getInvitationByToken(token);
      
      if (!invitation) {
        throw new Error('Invalid or expired invitation token');
      }

      const { email, username, full_name, password } = userData;
      
      // Check if email matches invitation
      if (email !== invitation.email) {
        throw new Error('Email does not match invitation');
      }

      // Start transaction
      await db.query('BEGIN');

      try {
        // Create user account (same logic as in auth.js)
        const bcrypt = require('bcryptjs');
        const saltRounds = 12;
        const password_hash = await bcrypt.hash(password, saltRounds);
        const avatar_url = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${username}&size=80`;

        // Create user
        const insertUserQuery = `
          INSERT INTO users (email, username, full_name, password_hash, avatar_url, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id, email, username, full_name, avatar_url, created_at
        `;
        const userValues = [email, username, full_name, password_hash, avatar_url, new Date(), new Date()];
        const userResult = await db.query(insertUserQuery, userValues);
        const newUser = userResult.rows[0];

        // Add user to workspace
        const memberQuery = `
          INSERT INTO workspace_members (workspace_id, user_id, role, joined_at)
          VALUES ($1, $2, $3, $4)
          RETURNING id, workspace_id, user_id, role, joined_at
        `;
        const memberResult = await db.query(memberQuery, [
          invitation.workspace_id, newUser.id, invitation.role, new Date()
        ]);

        // Set workspace as default for user
        const updateUserQuery = `
          UPDATE users SET default_workspace_id = $1 WHERE id = $2
        `;
        await db.query(updateUserQuery, [invitation.workspace_id, newUser.id]);

        // Mark invitation as accepted
        const updateInviteQuery = `
          UPDATE invitations 
          SET status = 'accepted', accepted_at = $1 
          WHERE token = $2
        `;
        await db.query(updateInviteQuery, [new Date(), token]);

        // Send welcome email
        await emailService.sendWelcomeEmail(newUser);

        // Commit transaction
        await db.query('COMMIT');

        return {
          user: {
            ...newUser,
            default_workspace_id: invitation.workspace_id
          },
          workspace: {
            id: invitation.workspace_id,
            name: invitation.workspace_name
          },
          membership: memberResult.rows[0]
        };
      } catch (error) {
        await db.query('ROLLBACK');
        throw error;
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
      throw error;
    }
  }

  async getWorkspaceInvitations(workspaceId, requestingUserId) {
    try {
      // Check if user has permission to view invitations (owner or admin)
      const permissionQuery = `
        SELECT role FROM workspace_members
        WHERE workspace_id = $1 AND user_id = $2 AND role IN ('owner', 'admin')
      `;

      const permissionResult = await db.query(permissionQuery, [workspaceId, requestingUserId]);
      if (permissionResult.rows.length === 0) {
        throw new Error('Insufficient permissions to view invitations');
      }

      // Get pending invitations for the workspace
      const invitationsQuery = `
        SELECT 
          i.id,
          i.email,
          i.role,
          i.status,
          i.created_at,
          i.expires_at,
          i.token,
          u.full_name as inviter_name,
          u.username as inviter_username,
          u.email as inviter_email
        FROM invitations i
        JOIN users u ON i.invited_by = u.id
        WHERE i.workspace_id = $1 
        ORDER BY i.created_at DESC
      `;

      const result = await db.query(invitationsQuery, [workspaceId]);
      return result.rows;
    } catch (error) {
      console.error('Error fetching workspace invitations:', error);
      throw error;
    }
  }

  async cancelInvitation(invitationId, requestingUserId) {
    try {
      // Get invitation details with workspace info
      const invitationQuery = `
        SELECT 
          i.*,
          w.id as workspace_id
        FROM invitations i
        JOIN workspaces w ON i.workspace_id = w.id
        WHERE i.id = $1 AND i.status = 'pending'
      `;

      const invitationResult = await db.query(invitationQuery, [invitationId]);
      if (invitationResult.rows.length === 0) {
        throw new Error('Invitation not found or already processed');
      }

      const invitation = invitationResult.rows[0];

      // Check if user has permission to cancel invitations (owner or admin)
      const permissionQuery = `
        SELECT role FROM workspace_members
        WHERE workspace_id = $1 AND user_id = $2 AND role IN ('owner', 'admin')
      `;

      const permissionResult = await db.query(permissionQuery, [invitation.workspace_id, requestingUserId]);
      if (permissionResult.rows.length === 0) {
        throw new Error('Insufficient permissions to cancel invitations');
      }

      // Update invitation status to cancelled
      const cancelQuery = `
        UPDATE invitations 
        SET status = 'cancelled' 
        WHERE id = $1
        RETURNING *
      `;

      const result = await db.query(cancelQuery, [invitationId]);
      return result.rows[0];
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      throw error;
    }
  }

  async resendInvitation(invitationId, requestingUserId) {
    try {
      // Get invitation details
      const invitationQuery = `
        SELECT 
          i.*,
          w.name as workspace_name,
          u.full_name as inviter_name,
          u.username as inviter_username
        FROM invitations i
        JOIN workspaces w ON i.workspace_id = w.id
        JOIN users u ON i.invited_by = u.id
        WHERE i.id = $1 AND i.status = 'pending'
      `;

      const invitationResult = await db.query(invitationQuery, [invitationId]);
      if (invitationResult.rows.length === 0) {
        throw new Error('Invitation not found or already processed');
      }

      const invitation = invitationResult.rows[0];

      // Check if user has permission to resend invitations (owner or admin)
      const permissionQuery = `
        SELECT role FROM workspace_members
        WHERE workspace_id = $1 AND user_id = $2 AND role IN ('owner', 'admin')
      `;

      const permissionResult = await db.query(permissionQuery, [invitation.workspace_id, requestingUserId]);
      if (permissionResult.rows.length === 0) {
        throw new Error('Insufficient permissions to resend invitations');
      }

      // Generate new token and extend expiration
      const newToken = generateInviteToken();
      const newExpiresAt = new Date();
      newExpiresAt.setHours(newExpiresAt.getHours() + 72);

      // Update invitation with new token
      const updateQuery = `
        UPDATE invitations 
        SET token = $1, expires_at = $2, created_at = $3
        WHERE id = $4
        RETURNING *
      `;

      const result = await db.query(updateQuery, [newToken, newExpiresAt, new Date(), invitationId]);
      const updatedInvitation = result.rows[0];

      // Resend invitation email
      const inviterDisplayName = invitation.inviter_name || invitation.inviter_username;
      await emailService.sendWorkspaceInvitationEmail(
        invitation.email,
        inviterDisplayName,
        invitation.workspace_name,
        newToken
      );

      return updatedInvitation;
    } catch (error) {
      console.error('Error resending invitation:', error);
      throw error;
    }
  }

  async getWorkspaceMembers(workspaceId, requestingUserId) {
    try {
      // Check if user is a member of the workspace
      const memberCheckQuery = `
        SELECT role FROM workspace_members
        WHERE workspace_id = $1 AND user_id = $2
      `;

      const memberCheckResult = await db.query(memberCheckQuery, [workspaceId, requestingUserId]);
      if (memberCheckResult.rows.length === 0) {
        throw new Error('Access denied to workspace members');
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
      return membersResult.rows;
    } catch (error) {
      console.error('Error fetching workspace members:', error);
      throw error;
    }
  }

  async getUserWorkspaces(userId) {
    try {
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
      return result.rows;
    } catch (error) {
      console.error('Error fetching user workspaces:', error);
      throw error;
    }
  }

  async updateWorkspace(workspaceId, userId, workspaceData) {
    try {
      const { name, description, domain_name, require_domain_membership } = workspaceData;

      // Check if user has permission to update (owner or admin)
      const permissionQuery = `
        SELECT role FROM workspace_members
        WHERE workspace_id = $1 AND user_id = $2 AND role IN ('owner', 'admin')
      `;

      const permissionResult = await db.query(permissionQuery, [workspaceId, userId]);
      if (permissionResult.rows.length === 0) {
        throw new Error('Insufficient permissions to update workspace');
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
        throw new Error('Workspace not found');
      }

      return result.rows[0];
    } catch (error) {
      console.error('Error updating workspace:', error);
      throw error;
    }
  }

  async createWorkspace(userId, workspaceData) {
    try {
      const { name, description } = workspaceData;

      if (!name) {
        throw new Error('Workspace name is required');
      }

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

      return {
        ...workspace,
        user_role: 'owner',
        joined_at: new Date()
      };
    } catch (error) {
      console.error('Error creating workspace:', error);
      throw error;
    }
  }
}

module.exports = new WorkspaceService();
