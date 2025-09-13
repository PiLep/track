#!/usr/bin/env node

// Database cleanup utilities for tests
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const testDbConfig = {
  host: 'localhost',
  port: 5433, // Test database port
  user: 'user',
  password: 'password',
  database: 'saas_app_test'
};

async function cleanTestDatabase() {
  const client = new Client(testDbConfig);

  try {
    console.log('🧹 Cleaning test database...');
    await client.connect();

    // Disable foreign key constraints temporarily
    await client.query('SET session_replication_role = replica;');

    // Clear all tables in correct order (reverse of dependencies)
    const tables = [
      'invitations',
      'integrations',
      'cycles',
      'board_columns',
      'boards',
      'comments',
      'issues',
      'workflow_states',
      'workflows',
      'projects',
      'teams',
      'team_members',
      'workspace_members',
      'workspaces',
      'users'
    ];

    for (const table of tables) {
      try {
        await client.query(`DELETE FROM ${table}`);
        console.log(`✅ Cleared table: ${table}`);
      } catch (error) {
        console.log(`⚠️  Could not clear table ${table}:`, error.message);
      }
    }

    // Reset sequences
    await client.query(`
      SELECT setval(pg_get_serial_sequence('"users"', 'id'), 1, false);
      SELECT setval(pg_get_serial_sequence('"workspaces"', 'id'), 1, false);
      SELECT setval(pg_get_serial_sequence('"workspace_members"', 'id'), 1, false);
      SELECT setval(pg_get_serial_sequence('"teams"', 'id'), 1, false);
      SELECT setval(pg_get_serial_sequence('"team_members"', 'id'), 1, false);
      SELECT setval(pg_get_serial_sequence('"projects"', 'id'), 1, false);
      SELECT setval(pg_get_serial_sequence('"issues"', 'id'), 1, false);
      SELECT setval(pg_get_serial_sequence('"comments"', 'id'), 1, false);
      SELECT setval(pg_get_serial_sequence('"boards"', 'id'), 1, false);
      SELECT setval(pg_get_serial_sequence('"board_columns"', 'id'), 1, false);
      SELECT setval(pg_get_serial_sequence('"workflows"', 'id'), 1, false);
      SELECT setval(pg_get_serial_sequence('"workflow_states"', 'id'), 1, false);
      SELECT setval(pg_get_serial_sequence('"cycles"', 'id'), 1, false);
      SELECT setval(pg_get_serial_sequence('"integrations"', 'id'), 1, false);
      SELECT setval(pg_get_serial_sequence('"invitations"', 'id'), 1, false);
    `);

    // Re-enable foreign key constraints
    await client.query('SET session_replication_role = DEFAULT;');

    console.log('✅ Test database cleaned successfully');

  } catch (error) {
    console.error('❌ Error cleaning test database:', error);
    throw error;
  } finally {
    await client.end();
  }
}

async function initializeTestDatabase() {
  const client = new Client(testDbConfig);

  try {
    console.log('🚀 Initializing test database...');
    await client.connect();

    // Check if schema is already loaded
    const result = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'users'
      );
    `);

    if (!result.rows[0].exists) {
      console.log('📋 Loading schema...');
      const schemaPath = path.join(__dirname, '../../database/schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf8');

      await client.query(schema);
      console.log('✅ Schema loaded successfully');
    } else {
      console.log('✅ Schema already exists');
    }

  } catch (error) {
    console.error('❌ Error initializing test database:', error);
    throw error;
  } finally {
    await client.end();
  }
}

async function main() {
  const command = process.argv[2];

  try {
    switch (command) {
      case 'setup':
        await initializeTestDatabase();
        break;
      case 'cleanup':
        await cleanTestDatabase();
        break;
      default:
        console.log('Usage: node cleanup.js <setup|cleanup>');
        console.log('  setup   - Initialize test database with schema');
        console.log('  cleanup - Clean all data from test database');
        process.exit(1);
    }
  } catch (error) {
    console.error('Command failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  cleanTestDatabase,
  initializeTestDatabase,
  testDbConfig
};