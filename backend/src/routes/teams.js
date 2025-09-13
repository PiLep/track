const express = require('express');
const db = require('../config/database');
const router = express.Router();

// GET /api/teams - Get all teams for current workspace
router.get('/', async (req, res) => {
  try {
    // Get workspace from query param or user's default workspace
    let workspaceId = req.query.workspace_id;

    if (!workspaceId) {
      // Get user's default workspace
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

      const userQuery = 'SELECT default_workspace_id FROM users WHERE id = $1';
      const userResult = await db.query(userQuery, [userId]);

      if (userResult.rows.length === 0 || !userResult.rows[0].default_workspace_id) {
        return res.status(400).json({
          success: false,
          error: 'No workspace found for user'
        });
      }

      workspaceId = userResult.rows[0].default_workspace_id;
    }

    const { limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT
        t.*,
        COUNT(DISTINCT tm.user_id) as member_count,
        COUNT(DISTINCT p.id) as project_count
      FROM teams t
      LEFT JOIN team_members tm ON t.id = tm.team_id
      LEFT JOIN projects p ON t.workspace_id = p.workspace_id AND t.id = p.team_id
      WHERE t.workspace_id = $1
      GROUP BY t.id
    `;

    const params = [workspaceId];
    query += ` ORDER BY t.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.query(query, params);

    // Transform the data to match the expected format
    const teams = result.rows.map(team => ({
      id: team.id,
      name: team.name,
      description: team.description,
      member_count: parseInt(team.member_count),
      project_count: parseInt(team.project_count),
      member_names: [], // For now, empty array since we removed the complex query
      created_at: team.created_at,
      updated_at: team.updated_at
    }));

    res.json({
      success: true,
      data: teams,
      count: teams.length
    });
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch teams'
    });
  }
});

// GET /api/teams/:id - Get single team with members and projects
router.get('/:id', async (req, res) => {
  try {
    const teamId = parseInt(req.params.id);

    // Get team details
    const teamQuery = `
      SELECT
        t.*,
        COUNT(DISTINCT tm.user_id) as member_count,
        COUNT(DISTINCT p.id) as project_count
      FROM teams t
      LEFT JOIN team_members tm ON t.id = tm.team_id
      LEFT JOIN projects p ON t.id = p.team_id
      WHERE t.id = $1
      GROUP BY t.id
    `;

    const teamResult = await db.query(teamQuery, [teamId]);

    if (teamResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Team not found'
      });
    }

    const team = teamResult.rows[0];

    // Get team members
    const membersQuery = `
      SELECT
        u.id,
        u.email,
        u.full_name,
        u.avatar_url,
        tm.role,
        tm.joined_at
      FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.team_id = $1
      ORDER BY tm.joined_at ASC
    `;

    const membersResult = await db.query(membersQuery, [teamId]);

    // Get team projects
    const projectsQuery = `
      SELECT
        p.*,
        COUNT(i.id) as issue_count
      FROM projects p
      LEFT JOIN issues i ON p.id = i.project_id
      WHERE p.team_id = $1
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `;

    const projectsResult = await db.query(projectsQuery, [teamId]);

    const teamData = {
      id: team.id,
      name: team.name,
      description: team.description,
      member_count: parseInt(team.member_count),
      project_count: parseInt(team.project_count),
      created_at: team.created_at,
      updated_at: team.updated_at,
      members: membersResult.rows.map(member => ({
        id: member.id,
        email: member.email,
        full_name: member.full_name,
        avatar_url: member.avatar_url,
        role: member.role,
        joined_at: member.joined_at
      })),
      projects: projectsResult.rows.map(project => ({
        id: project.id,
        name: project.name,
        description: project.description,
        issue_count: parseInt(project.issue_count),
        created_at: project.created_at,
        updated_at: project.updated_at
      }))
    };

    res.json({
      success: true,
      data: teamData
    });
  } catch (error) {
    console.error('Error fetching team:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch team'
    });
  }
});

// POST /api/teams - Create new team
router.post('/', async (req, res) => {
  try {
    const { name, description, workspace_id } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Name is required'
      });
    }

    // Get workspace from request or user's default
    let targetWorkspaceId = workspace_id;

    if (!targetWorkspaceId) {
      // Get user's default workspace
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

      const userQuery = 'SELECT default_workspace_id FROM users WHERE id = $1';
      const userResult = await db.query(userQuery, [userId]);

      if (userResult.rows.length === 0 || !userResult.rows[0].default_workspace_id) {
        return res.status(400).json({
          success: false,
          error: 'No workspace found for user'
        });
      }

      targetWorkspaceId = userResult.rows[0].default_workspace_id;
    }

    const query = `
      INSERT INTO teams (name, description, workspace_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, description, workspace_id, created_at
    `;

    const values = [name, description, targetWorkspaceId, new Date(), new Date()];
    const result = await db.query(query, values);

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating team:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create team'
    });
  }
});

// POST /api/teams/:id/members - Add member to team
router.post('/:id/members', async (req, res) => {
  try {
    const teamId = parseInt(req.params.id);
    const { user_id, role = 'member' } = req.body;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    // Check if team exists
    const teamQuery = 'SELECT id FROM teams WHERE id = $1';
    const teamResult = await db.query(teamQuery, [teamId]);

    if (teamResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Team not found'
      });
    }

    // Check if user exists
    const userQuery = 'SELECT id FROM users WHERE id = $1';
    const userResult = await db.query(userQuery, [user_id]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if user is already a member of this team
    const memberCheckQuery = 'SELECT id FROM team_members WHERE user_id = $1 AND team_id = $2';
    const memberCheckResult = await db.query(memberCheckQuery, [user_id, teamId]);

    if (memberCheckResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'User is already a member of this team'
      });
    }

    // Add user to team
    const insertQuery = `
      INSERT INTO team_members (user_id, team_id, role, joined_at)
      VALUES ($1, $2, $3, $4)
      RETURNING id, user_id, team_id, role, joined_at
    `;

    const values = [user_id, teamId, role, new Date()];
    const result = await db.query(insertQuery, values);

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error adding team member:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add team member'
    });
  }
});

module.exports = router;