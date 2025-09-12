const express = require('express');
const db = require('../config/database');
const router = express.Router();

// GET /api/issues - Get all issues for current workspace
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

    const query = `
      SELECT
        i.*,
        p.name as project_name,
        u.full_name as assignee_name,
        u.email as assignee_email,
        r.full_name as reporter_name,
        r.email as reporter_email
      FROM issues i
      LEFT JOIN projects p ON i.project_id = p.id
      LEFT JOIN users u ON i.assignee_id = u.id
      LEFT JOIN users r ON i.reporter_id = r.id
      WHERE i.workspace_id = $1
      ORDER BY i.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await db.query(query, [workspaceId, parseInt(limit), parseInt(offset)]);

    // Transform the data to match expected format
    const issues = result.rows.map(issue => ({
      id: issue.id,
      title: issue.title,
      description: issue.description,
      status: issue.workflow_state_id ? 'in_progress' : 'open', // Simplified status mapping
      priority: issue.priority,
      assignee: issue.assignee_email,
      assignee_name: issue.assignee_name,
      reporter: issue.reporter_email,
      reporter_name: issue.reporter_name,
      project_name: issue.project_name,
      created_at: issue.created_at,
      updated_at: issue.updated_at
    }));

    res.json({
      success: true,
      data: issues,
      count: issues.length
    });
  } catch (error) {
    console.error('Error fetching issues:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch issues'
    });
  }
});

module.exports = router;
router.get('/:id', (req, res) => {
  try {
    const issueId = parseInt(req.params.id);
    const issue = mockIssues.find(issue => issue.id === issueId);

    if (!issue) {
      return res.status(404).json({
        success: false,
        error: 'Issue not found'
      });
    }

    res.json({
      success: true,
      data: issue
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch issue'
    });
  }
});

// POST /api/issues - Create new issue
router.post('/', (req, res) => {
  try {
    const { title, description, priority = 'medium', assignee } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        error: 'Title and description are required'
      });
    }

    const newIssue = {
      id: mockIssues.length + 1,
      title,
      description,
      status: 'open',
      priority,
      assignee,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    mockIssues.push(newIssue);

    res.status(201).json({
      success: true,
      data: newIssue
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create issue'
    });
  }
});

module.exports = router;