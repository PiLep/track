const db = require('../config/database');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
require('dotenv').config();

// MD5 function for Gravatar
function md5(str) {
  return crypto.createHash('md5').update(str).digest('hex');
}

// Factory functions for generating test data
const dataFactory = {
  // Generate random workspaces
  generateWorkspaces: (count = 3) => {
    const workspaces = [];
    const workspaceNames = ['Acme Corp', 'TechStart Inc', 'Innovate Labs', 'Global Solutions', 'NextGen Systems'];
    const descriptions = [
      'Leading technology company focused on innovation',
      'Startup building the future of software',
      'Research and development laboratory',
      'Worldwide solutions provider',
      'Next generation technology systems'
    ];
    const domains = ['acme.com', 'techstart.io', 'innovatelabs.org', null, null]; // Some have domains

    for (let i = 0; i < count; i++) {
      const domain = domains[i] || null;
      const requireDomain = domain && Math.random() > 0.5; // 50% chance to require domain if domain exists

      workspaces.push({
        name: workspaceNames[i] || `Workspace ${i + 1}`,
        description: descriptions[i] || 'A collaborative workspace for teams',
        domain_name: domain,
        require_domain_membership: requireDomain,
        created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000), // Random within last year
        updated_at: new Date(),
      });
    }
    return workspaces;
  },

  // Generate random users
  generateUsers: async (count = 10) => {
    const users = [];
    const firstNames = ['John', 'Jane', 'Mike', 'Sarah', 'David', 'Emma', 'Chris', 'Lisa', 'Tom', 'Anna'];
    const lastNames = ['Doe', 'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez'];
    const domains = ['example.com', 'test.com', 'demo.com', 'acme.com', 'techstart.io', 'innovatelabs.org'];

    for (let i = 0; i < count; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const domain = domains[Math.floor(Math.random() * domains.length)];
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`;
      const username = `${firstName.toLowerCase()}${lastName.toLowerCase()}${i + 1}`;

      // Use DiceBear pixel-art for fun, consistent avatars
      // This API generates pixel art avatars based on a seed (username)
      const avatar_url = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${username}&size=80`;

      // Hash a default password
      const password_hash = await bcrypt.hash('password123', 10);

      users.push({
        email,
        username,
        full_name: `${firstName} ${lastName}`,
        password_hash,
        avatar_url,
        created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000), // Random date within last year
        updated_at: new Date(),
      });
    }
    return users;
  },

  // Generate random teams
  generateTeams: (workspaces, count = 5) => {
    const teams = [];
    const teamNames = ['Frontend Team', 'Backend Team', 'DevOps Team', 'QA Team', 'Product Team', 'Design Team'];
    const descriptions = [
      'Responsible for user interface development',
      'Handles server-side logic and APIs',
      'Manages infrastructure and deployments',
      'Ensures quality through testing',
      'Drives product vision and roadmap',
      'Creates beautiful user experiences'
    ];

    for (let i = 0; i < count; i++) {
      const workspace = workspaces[Math.floor(Math.random() * workspaces.length)];

      teams.push({
        name: teamNames[i] || `Team ${i + 1}`,
        description: descriptions[i] || 'A great team working together',
        workspace_id: workspace.id,
        created_at: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000), // Random within 6 months
        updated_at: new Date(),
      });
    }
    return teams;
  },

  // Generate projects
  generateProjects: (users, teams, workspaces, count = 8) => {
    const projects = [];
    const projectNames = [
      'E-commerce Platform', 'Task Management App', 'Analytics Dashboard', 'Mobile App v2',
      'API Gateway', 'User Portal', 'Admin Panel', 'Reporting System'
    ];
    const descriptions = [
      'Modern e-commerce solution with advanced features',
      'Collaborative task and project management tool',
      'Real-time analytics and reporting dashboard',
      'Next-generation mobile application',
      'Centralized API management and routing',
      'Customer-facing user portal and dashboard',
      'Administrative control panel for system management',
      'Comprehensive reporting and insights system'
    ];

    for (let i = 0; i < count; i++) {
      const createdBy = users[Math.floor(Math.random() * users.length)].id;
      const teamId = teams.length > 0 ? teams[Math.floor(Math.random() * teams.length)].id : null;
      const workspace = workspaces[Math.floor(Math.random() * workspaces.length)];

      projects.push({
        name: projectNames[i] || `Project ${i + 1}`,
        description: descriptions[i] || 'An exciting new project',
        workspace_id: workspace.id,
        team_id: teamId,
        created_by: createdBy,
        created_at: new Date(Date.now() - Math.random() * 120 * 24 * 60 * 60 * 1000), // Random within 4 months
        updated_at: new Date(),
      });
    }
    return projects;
  },

  // Generate issues
  generateIssues: (users, projects, workspaces, count = 25) => {
    const issues = [];
    const titles = [
      'Fix login validation bug', 'Add dark mode toggle', 'Optimize database queries',
      'Implement user notifications', 'Update API documentation', 'Fix responsive design issues',
      'Add unit tests for components', 'Implement caching layer', 'Fix memory leak in service',
      'Add error handling for edge cases', 'Implement search functionality', 'Add export feature',
      'Fix timezone handling', 'Implement real-time updates', 'Add bulk operations',
      'Fix accessibility issues', 'Implement pagination', 'Add data validation',
      'Fix performance bottleneck', 'Implement retry mechanism', 'Add logging system',
      'Fix CORS configuration', 'Implement rate limiting', 'Add monitoring dashboard',
      'Fix deployment pipeline'
    ];

    const descriptions = [
      'The login form needs better validation for email format and password strength',
      'Implement dark mode theme switching with smooth transitions',
      'Improve performance of user data fetching with optimized queries',
      'Add push notifications for task updates and mentions',
      'Create comprehensive API documentation for all endpoints',
      'Fix layout issues on mobile and tablet devices',
      'Write comprehensive unit tests for React components',
      'Implement Redis caching layer for frequently accessed data',
      'Identify and fix memory leak in background service',
      'Add proper error handling for unexpected user inputs',
      'Implement full-text search across all content types',
      'Add ability to export data in multiple formats',
      'Fix timezone conversion issues in date handling',
      'Implement WebSocket connections for real-time updates',
      'Add bulk operations for managing multiple items',
      'Fix accessibility issues for screen readers and keyboard navigation',
      'Implement pagination for large data sets',
      'Add comprehensive data validation on all forms',
      'Identify and resolve performance bottleneck in critical path',
      'Implement exponential backoff retry mechanism',
      'Add structured logging system with log levels',
      'Fix CORS configuration for cross-origin requests',
      'Implement rate limiting to prevent API abuse',
      'Create monitoring dashboard with key metrics',
      'Fix automated deployment pipeline issues'
    ];

    const statuses = ['open', 'in_progress', 'closed'];
    const priorities = ['low', 'medium', 'high', 'urgent'];

    for (let i = 0; i < count; i++) {
      const project = projects[Math.floor(Math.random() * projects.length)];
      const workspace = workspaces.find(w => w.id === project.workspace_id); // Get workspace for the project
      const reporter = users[Math.floor(Math.random() * users.length)];
      const assignee = Math.random() > 0.3 ? users[Math.floor(Math.random() * users.length)] : null; // 70% assigned

      issues.push({
        title: titles[i % titles.length] + (i >= titles.length ? ` ${i - titles.length + 1}` : ''),
        description: descriptions[i % descriptions.length],
        workspace_id: workspace.id,
        project_id: project.id,
        assignee_id: assignee ? assignee.id : null,
        reporter_id: reporter.id,
        workflow_state_id: null, // Will be set up later with workflows
        priority: priorities[Math.floor(Math.random() * priorities.length)],
        labels: Math.random() > 0.5 ? ['bug', 'enhancement', 'feature'][Math.floor(Math.random() * 3)] : null,
        due_date: Math.random() > 0.7 ? new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000) : null, // 30% have due dates
        created_at: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000), // Random within 3 months
        updated_at: new Date(),
      });
    }
    return issues;
  },
};

// Main seeding function
async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // Test database connection
    await db.query('SELECT 1');
    console.log('✅ Database connection established');

    // Generate and insert users
    console.log('👥 Creating users...');
    const users = await dataFactory.generateUsers(10);
    const createdUsers = [];

    for (const user of users) {
      const query = `
        INSERT INTO users (email, username, full_name, password_hash, avatar_url, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, email, username, full_name, avatar_url, created_at
      `;
      const values = [user.email, user.username, user.full_name, user.password_hash, user.avatar_url, user.created_at, user.updated_at];
      const result = await db.query(query, values);
      createdUsers.push(result.rows[0]);
    }
    console.log(`✅ Created ${createdUsers.length} users`);

    // Generate and insert workspaces
    console.log('🏢 Creating workspaces...');
    const workspaces = dataFactory.generateWorkspaces(3);
    const createdWorkspaces = [];

    for (const workspace of workspaces) {
      // Assign a random owner
      const owner = createdUsers[Math.floor(Math.random() * createdUsers.length)];

      const query = `
        INSERT INTO workspaces (name, description, domain_name, require_domain_membership, owner_id, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, name, description, domain_name, require_domain_membership, owner_id, created_at
      `;
      const values = [workspace.name, workspace.description, workspace.domain_name, workspace.require_domain_membership, owner.id, workspace.created_at, workspace.updated_at];
      const result = await db.query(query, values);
      createdWorkspaces.push(result.rows[0]);
    }
    console.log(`✅ Created ${createdWorkspaces.length} workspaces`);

    // Assign users to workspaces
    console.log('👥 Assigning users to workspaces...');
    const workspaceMembers = [];

    // First, ensure owners are assigned to their workspaces
    for (const workspace of createdWorkspaces) {
      const owner = createdUsers.find(u => u.id === workspace.owner_id);
      if (owner) {
        workspaceMembers.push({
          workspace_id: workspace.id,
          user_id: owner.id,
          role: 'owner',
          joined_at: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000),
        });
      }
    }

    // Then assign other users, preferring domain matches for workspaces that require it
    for (const user of createdUsers) {
      // Skip if already assigned as owner
      const alreadyAssigned = workspaceMembers.some(wm => wm.user_id === user.id);
      if (alreadyAssigned) continue;

      const numWorkspaces = Math.random() < 0.7 ? 1 : 2;
      const assignedWorkspaces = workspaceMembers.filter(wm => wm.user_id === user.id).map(wm => wm.workspace_id);

      for (let j = 0; j < numWorkspaces; j++) {
        let availableWorkspaces = createdWorkspaces.filter(w => !assignedWorkspaces.includes(w.id));

        // If workspace requires domain membership, prefer workspaces where user's email domain matches
        if (availableWorkspaces.some(w => w.require_domain_membership)) {
          const userDomain = user.email.split('@')[1];
          const matchingWorkspaces = availableWorkspaces.filter(w => w.require_domain_membership && w.domain_name === userDomain);
          if (matchingWorkspaces.length > 0) {
            availableWorkspaces = matchingWorkspaces;
          } else if (availableWorkspaces.some(w => w.require_domain_membership)) {
            // If no match but some require domain, skip assignment for this user to that workspace
            availableWorkspaces = availableWorkspaces.filter(w => !w.require_domain_membership);
          }
        }

        if (availableWorkspaces.length === 0) break;

        const workspace = availableWorkspaces[Math.floor(Math.random() * availableWorkspaces.length)];
        assignedWorkspaces.push(workspace.id);

        const role = Math.random() < 0.2 ? 'admin' : 'member';

        workspaceMembers.push({
          workspace_id: workspace.id,
          user_id: user.id,
          role: role,
          joined_at: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000), // Within last 6 months
        });
      }
    }

    // Insert workspace members
    for (const member of workspaceMembers) {
      const query = `
        INSERT INTO workspace_members (workspace_id, user_id, role, joined_at)
        VALUES ($1, $2, $3, $4)
      `;
      const values = [member.workspace_id, member.user_id, member.role, member.joined_at];
      await db.query(query, values);
    }

    // Update user emails to match workspace domains if required
    for (const member of workspaceMembers) {
      const workspace = createdWorkspaces.find(w => w.id === member.workspace_id);
      if (workspace && workspace.require_domain_membership && workspace.domain_name) {
        const user = createdUsers.find(u => u.id === member.user_id);
        if (user) {
          const currentDomain = user.email.split('@')[1];
          if (currentDomain !== workspace.domain_name) {
            // Update email to match domain
            const localPart = user.email.split('@')[0];
            const newEmail = `${localPart}@${workspace.domain_name}`;
            await db.query('UPDATE users SET email = $1 WHERE id = $2', [newEmail, user.id]);
            user.email = newEmail;
          }
        }
      }
    }

    console.log(`✅ Assigned ${workspaceMembers.length} workspace memberships`);

    // Generate and insert teams
    console.log('👨‍👩‍👧‍👦 Creating teams...');
    const teams = dataFactory.generateTeams(createdWorkspaces, 5);
    const createdTeams = [];

    for (const team of teams) {
      const query = `
        INSERT INTO teams (name, description, workspace_id, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, name, description, workspace_id, created_at
      `;
      const values = [team.name, team.description, team.workspace_id, team.created_at, team.updated_at];
      const result = await db.query(query, values);
      createdTeams.push(result.rows[0]);
    }
    console.log(`✅ Created ${createdTeams.length} teams`);

    // Assign users to teams (some users will remain unassigned)
    console.log('👥 Assigning users to teams...');
    const teamMembers = [];
    const roles = ['admin', 'member'];

    // Shuffle users array to randomize assignments
    const shuffledUsers = [...createdUsers].sort(() => Math.random() - 0.5);

    // Assign about 70% of users to teams (leaving 30% unassigned)
    const usersToAssign = Math.floor(shuffledUsers.length * 0.7);

    for (let i = 0; i < usersToAssign; i++) {
      const user = shuffledUsers[i];
      // Each user can be in 1-2 teams
      const numTeams = Math.random() < 0.7 ? 1 : 2;
      const assignedTeams = [];

      for (let j = 0; j < numTeams; j++) {
        const team = createdTeams[Math.floor(Math.random() * createdTeams.length)];
        // Avoid duplicate team assignments for the same user
        if (!assignedTeams.includes(team.id)) {
          assignedTeams.push(team.id);

          const role = Math.random() < 0.3 ? 'admin' : 'member'; // 30% chance of being admin
          const joinedAt = new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000); // Within last 6 months

          teamMembers.push({
            user_id: user.id,
            team_id: team.id,
            role: role,
            joined_at: joinedAt
          });
        }
      }
    }

    // Insert team members
    for (const member of teamMembers) {
      const query = `
        INSERT INTO team_members (user_id, team_id, role, joined_at)
        VALUES ($1, $2, $3, $4)
      `;
      const values = [member.user_id, member.team_id, member.role, member.joined_at];
      await db.query(query, values);
    }

    console.log(`✅ Assigned ${teamMembers.length} team memberships (${usersToAssign} users in teams, ${createdUsers.length - usersToAssign} users unassigned)`);

    // Generate and insert projects
    console.log('📁 Creating projects...');
    const projects = dataFactory.generateProjects(createdUsers, createdTeams, createdWorkspaces, 8);
    const createdProjects = [];

    for (const project of projects) {
      const query = `
        INSERT INTO projects (name, description, workspace_id, team_id, created_by, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, name, description, workspace_id, team_id, created_by, created_at
      `;
      const values = [project.name, project.description, project.workspace_id, project.team_id, project.created_by, project.created_at, project.updated_at];
      const result = await db.query(query, values);
      createdProjects.push(result.rows[0]);
    }
    console.log(`✅ Created ${createdProjects.length} projects`);

    // Generate and insert issues
    console.log('📋 Creating issues...');
    const issues = dataFactory.generateIssues(createdUsers, createdProjects, createdWorkspaces, 25);
    const createdIssues = [];

    for (const issue of issues) {
      const query = `
        INSERT INTO issues (title, description, workspace_id, project_id, assignee_id, reporter_id, priority, labels, due_date, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id, title, description, workspace_id, project_id, assignee_id, reporter_id, priority, labels, due_date, created_at
      `;
      const values = [
        issue.title,
        issue.description,
        issue.workspace_id,
        issue.project_id,
        issue.assignee_id,
        issue.reporter_id,
        issue.priority,
        issue.labels ? [issue.labels] : null,
        issue.due_date,
        issue.created_at,
        issue.updated_at
      ];
      const result = await db.query(query, values);
      createdIssues.push(result.rows[0]);
    }
    console.log(`✅ Created ${createdIssues.length} issues`);

    console.log('🎉 Database seeding completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - ${createdUsers.length} users`);
    console.log(`   - ${createdWorkspaces.length} workspaces`);
    console.log(`   - ${workspaceMembers.length} workspace memberships`);
    console.log(`   - ${createdTeams.length} teams`);
    console.log(`   - ${teamMembers.length} team memberships`);
    console.log(`   - ${createdProjects.length} projects`);
    console.log(`   - ${createdIssues.length} issues`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Database Seeding Tool

Usage: node seedDatabase.js [options]

Options:
  --users <number>     Number of users to create (default: 10)
  --teams <number>     Number of teams to create (default: 5)
  --projects <number>  Number of projects to create (default: 8)
  --issues <number>    Number of issues to create (default: 25)
  --help, -h          Show this help message

Examples:
  node seedDatabase.js
  node seedDatabase.js --users 20 --issues 50
    `);
    process.exit(0);
  }

  // Parse command line arguments
  const options = {};
  for (let i = 0; i < args.length; i += 2) {
    if (args[i].startsWith('--')) {
      const key = args[i].substring(2);
      const value = parseInt(args[i + 1]) || 10;
      options[key] = value;
    }
  }

  // Override default counts with CLI options
  if (options.users) dataFactory.generateUsers = ((original) => (count) => original(options.users))(dataFactory.generateUsers);
  if (options.teams) dataFactory.generateTeams = ((original) => (count) => original(options.teams))(dataFactory.generateTeams);
  if (options.projects) dataFactory.generateProjects = ((original) => (users, teams, count) => original(users, teams, options.projects))(dataFactory.generateProjects);
  if (options.issues) dataFactory.generateIssues = ((original) => (users, projects, count) => original(users, projects, options.issues))(dataFactory.generateIssues);

  seedDatabase();
}

module.exports = { seedDatabase, dataFactory };