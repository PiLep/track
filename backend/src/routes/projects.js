const express = require('express');
const db = require('../config/database');
const router = express.Router();

// GET /api/projects - Get all projects for current workspace
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
        p.*,
        t.name as team_name,
        u.full_name as creator_name,
        u.email as creator_email,
        COUNT(i.id) as issues_count
      FROM projects p
      LEFT JOIN teams t ON p.team_id = t.id
      LEFT JOIN users u ON p.created_by = u.id
      LEFT JOIN issues i ON p.id = i.project_id AND i.workspace_id = p.workspace_id
      WHERE p.workspace_id = $1
      GROUP BY p.id, t.name, u.full_name, u.email
    `;

    const params = [workspaceId];
    query += ` ORDER BY p.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.query(query, params);

    // Transform the data to match the expected format
    const projects = result.rows.map(project => ({
      id: project.id,
      name: project.name,
      description: project.description,
      team_name: project.team_name,
      creator_name: project.creator_name,
      creator_email: project.creator_email,
      issues_count: parseInt(project.issues_count),
      created_at: project.created_at,
      updated_at: project.updated_at
    }));

    res.json({
      success: true,
      data: projects,
      count: projects.length
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch projects'
    });
  }
});

// GET /api/projects/:id - Get single project with issues
router.get('/:id', async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);

    // Get project details
    const projectQuery = `
      SELECT
        p.*,
        t.name as team_name,
        u.full_name as creator_name,
        u.email as creator_email
      FROM projects p
      LEFT JOIN teams t ON p.team_id = t.id
      LEFT JOIN users u ON p.created_by = u.id
      WHERE p.id = $1
    `;

    const projectResult = await db.query(projectQuery, [projectId]);

    if (projectResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    const project = projectResult.rows[0];

    // Get project issues
    const issuesQuery = `
      SELECT
        i.*,
        u_assignee.email as assignee_email,
        u_reporter.email as reporter_email
      FROM issues i
      LEFT JOIN users u_assignee ON i.assignee_id = u_assignee.id
      LEFT JOIN users u_reporter ON i.reporter_id = u_reporter.id
      WHERE i.project_id = $1
      ORDER BY i.created_at DESC
    `;

    const issuesResult = await db.query(issuesQuery, [projectId]);

    const projectData = {
      id: project.id,
      name: project.name,
      description: project.description,
      team_name: project.team_name,
      creator_name: project.creator_name,
      creator_email: project.creator_email,
      created_at: project.created_at,
      updated_at: project.updated_at,
      issues: issuesResult.rows.map(issue => ({
        id: issue.id,
        title: issue.title,
        description: issue.description,
        status: issue.status,
        priority: issue.priority,
        assignee: issue.assignee_email,
        reporter: issue.reporter_email,
        labels: issue.labels,
        due_date: issue.due_date,
        created_at: issue.created_at,
        updated_at: issue.updated_at
      }))
    };

    res.json({
      success: true,
      data: projectData
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch project'
    });
  }
});

// POST /api/projects - Create new project
router.post('/', async (req, res) => {
  try {
    const { name, description, team_id, workspace_id } = req.body;

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

    // Get user ID from token
    const token = req.header('Authorization')?.replace('Bearer ', '');
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const query = `
      INSERT INTO projects (name, description, workspace_id, team_id, created_by, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, name, description, workspace_id, team_id, created_by, created_at
    `;

    const values = [name, description, targetWorkspaceId, team_id, userId, new Date(), new Date()];
    const result = await db.query(query, values);

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create project'
    });
  }
});

module.exports = router;