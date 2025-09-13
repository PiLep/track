const db = require('../config/database');
require('dotenv').config();

async function resetDatabase() {
  try {
    console.log('🗑️  Resetting database...');

    // Test database connection
    await db.query('SELECT 1');
    console.log('✅ Database connection established');

    // Delete all data in reverse order of dependencies
    console.log('🧹 Clearing existing data...');

    await db.query('DELETE FROM comments');
    await db.query('DELETE FROM board_columns');
    await db.query('DELETE FROM boards');
    await db.query('DELETE FROM cycles');
    await db.query('DELETE FROM integrations');
    await db.query('DELETE FROM workflow_states');
    await db.query('DELETE FROM workflows');
    await db.query('DELETE FROM issues');
    await db.query('DELETE FROM projects');
    await db.query('DELETE FROM team_members');
    await db.query('DELETE FROM teams');
    await db.query('DELETE FROM invitations');
    await db.query('DELETE FROM workspace_members');
    await db.query('DELETE FROM workspaces');
    await db.query('DELETE FROM users');
    await db.query('DELETE FROM migrations');

    console.log('✅ All data cleared');

    // Reset sequences
    console.log('🔄 Resetting sequences...');
    await db.query('ALTER SEQUENCE users_id_seq RESTART WITH 1');
    await db.query('ALTER SEQUENCE workspaces_id_seq RESTART WITH 1');
    await db.query('ALTER SEQUENCE workspace_members_id_seq RESTART WITH 1');
    await db.query('ALTER SEQUENCE invitations_id_seq RESTART WITH 1');
    await db.query('ALTER SEQUENCE teams_id_seq RESTART WITH 1');
    await db.query('ALTER SEQUENCE team_members_id_seq RESTART WITH 1');
    await db.query('ALTER SEQUENCE projects_id_seq RESTART WITH 1');
    await db.query('ALTER SEQUENCE issues_id_seq RESTART WITH 1');
    await db.query('ALTER SEQUENCE comments_id_seq RESTART WITH 1');
    await db.query('ALTER SEQUENCE boards_id_seq RESTART WITH 1');
    await db.query('ALTER SEQUENCE board_columns_id_seq RESTART WITH 1');
    await db.query('ALTER SEQUENCE cycles_id_seq RESTART WITH 1');
    await db.query('ALTER SEQUENCE workflows_id_seq RESTART WITH 1');
    await db.query('ALTER SEQUENCE workflow_states_id_seq RESTART WITH 1');
    await db.query('ALTER SEQUENCE integrations_id_seq RESTART WITH 1');
    await db.query('ALTER SEQUENCE migrations_id_seq RESTART WITH 1');

    console.log('✅ Sequences reset');
    console.log('🎉 Database reset completed successfully!');

  } catch (error) {
    console.error('❌ Error resetting database:', error);
    process.exit(1);
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Database Reset Tool

WARNING: This will permanently delete ALL data in the database!

Usage: node resetDatabase.js [options]

Options:
  --confirm    Confirm that you want to delete all data
  --help, -h   Show this help message

Example:
  node resetDatabase.js --confirm
    `);
    process.exit(0);
  }

  if (!args.includes('--confirm')) {
    console.log('❌ Please use --confirm to acknowledge that you want to delete all data');
    process.exit(1);
  }

  resetDatabase();
}

module.exports = { resetDatabase };