const db = require('../config/database');
require('dotenv').config();

// Migration functions
const migrations = {
  // Add invitations table and related indexes
  '001_add_invitations_table': async () => {
    console.log('📦 Creating invitations table...');
    
    // Check if table exists
    const tableExists = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'invitations'
      );
    `);
    
    if (tableExists.rows[0].exists) {
      console.log('⚠️  Invitations table already exists, skipping...');
      return;
    }

    // Create invitations table
    await db.query(`
      CREATE TABLE invitations (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        workspace_id INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        invited_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(50) DEFAULT 'member',
        token VARCHAR(255) UNIQUE NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        accepted_at TIMESTAMP WITH TIME ZONE
      );
    `);

    // Create indexes
    await db.query('CREATE INDEX idx_invitations_email ON invitations(email);');
    await db.query('CREATE INDEX idx_invitations_workspace_id ON invitations(workspace_id);');
    await db.query('CREATE INDEX idx_invitations_token ON invitations(token);');
    await db.query('CREATE INDEX idx_invitations_status ON invitations(status);');

    console.log('✅ Invitations table created successfully');
  },

  // Ensure workspace_members table exists
  '002_ensure_workspace_members_table': async () => {
    console.log('📦 Checking workspace_members table...');
    
    const tableExists = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'workspace_members'
      );
    `);
    
    if (tableExists.rows[0].exists) {
      console.log('✅ Workspace_members table exists');
      return;
    }

    console.log('📦 Creating workspace_members table...');
    await db.query(`
      CREATE TABLE workspace_members (
        id SERIAL PRIMARY KEY,
        workspace_id INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(50) DEFAULT 'member',
        joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(workspace_id, user_id)
      );
    `);

    await db.query('CREATE INDEX idx_workspace_members_workspace_id ON workspace_members(workspace_id);');
    await db.query('CREATE INDEX idx_workspace_members_user_id ON workspace_members(user_id);');

    console.log('✅ Workspace_members table created successfully');
  },

  // Add default_workspace_id to users if it doesn't exist
  '003_add_default_workspace_to_users': async () => {
    console.log('📦 Checking default_workspace_id column...');
    
    const columnExists = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'default_workspace_id'
      );
    `);
    
    if (columnExists.rows[0].exists) {
      console.log('✅ default_workspace_id column exists');
      return;
    }

    console.log('📦 Adding default_workspace_id column to users...');
    await db.query('ALTER TABLE users ADD COLUMN default_workspace_id INTEGER REFERENCES workspaces(id);');
    await db.query('CREATE INDEX idx_users_default_workspace ON users(default_workspace_id);');

    console.log('✅ default_workspace_id column added successfully');
  }
};

// Migration tracker table
async function createMigrationsTable() {
  const tableExists = await db.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'migrations'
    );
  `);
  
  if (!tableExists.rows[0].exists) {
    await db.query(`
      CREATE TABLE migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('📦 Migrations tracking table created');
  }
}

async function hasRunMigration(name) {
  const result = await db.query('SELECT id FROM migrations WHERE name = $1', [name]);
  return result.rows.length > 0;
}

async function recordMigration(name) {
  await db.query('INSERT INTO migrations (name) VALUES ($1)', [name]);
}

async function runMigrations() {
  try {
    console.log('🚀 Starting database migrations...');
    
    // Test database connection
    await db.query('SELECT 1');
    console.log('✅ Database connection established');
    
    // Create migrations table if it doesn't exist
    await createMigrationsTable();
    
    // Run each migration
    for (const [name, migrationFn] of Object.entries(migrations)) {
      if (await hasRunMigration(name)) {
        console.log(`⏭️  Skipping ${name} (already executed)`);
        continue;
      }
      
      console.log(`🔄 Running ${name}...`);
      await migrationFn();
      await recordMigration(name);
      console.log(`✅ ${name} completed`);
    }
    
    console.log('🎉 All migrations completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Database Migration Tool

Usage: node migrate.js [options]

Options:
  --help, -h   Show this help message

This will run all pending migrations to update your database schema.
    `);
    process.exit(0);
  }
  
  runMigrations().then(() => {
    process.exit(0);
  });
}

module.exports = { runMigrations };
