# Database Migrations Guide

## 🚀 Quick Start

### Running Migrations

```bash
# Run all pending migrations
npm run migrate

# Or run directly
node src/scripts/migrate.js
```

## 📋 Migration Scenarios

### 1. **Fresh Installation** (No existing database)
```bash
# Start with fresh database using Docker
docker-compose up postgres -d

# Wait a few seconds, then create all tables
psql -h localhost -U user -d saas_app -f database/schema.sql

# Run any additional migrations
npm run migrate

# Seed with sample data (optional)
npm run seed
```

### 2. **Existing Database** (Add new features)
```bash
# Only run new migrations (existing data preserved)
npm run migrate
```

### 3. **Development Reset** (Start over with clean slate)
```bash
# ⚠️  WARNING: This deletes ALL data!
npm run fresh
```

## 🎯 Current Migrations

The migration system will automatically apply these changes to your database:

- **`001_add_invitations_table`** - Adds the `invitations` table for workspace invitations
- **`002_ensure_workspace_members_table`** - Ensures `workspace_members` table exists  
- **`003_add_default_workspace_to_users`** - Adds `default_workspace_id` column to users

## 🔍 Migration Status

Migrations are tracked in the `migrations` table. You can check what's been run:

```sql
SELECT * FROM migrations ORDER BY executed_at;
```

## 📝 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run migrate` | Run pending migrations only |
| `npm run reset --confirm` | ⚠️ Delete all data and reset sequences |
| `npm run seed` | Add sample data |
| `npm run fresh` | ⚠️ Reset + Migrate + Seed (complete fresh start) |

## 🆕 Adding New Migrations

To add a new migration:

1. **Edit `src/scripts/migrate.js`**
2. **Add new migration function:**

```javascript
const migrations = {
  // ... existing migrations ...
  
  '004_your_new_migration': async () => {
    console.log('📦 Running your migration...');
    
    // Check if already applied (optional)
    const exists = await db.query(`/* your check query */`);
    if (exists.rows[0].exists) {
      console.log('⚠️ Already applied, skipping...');
      return;
    }
    
    // Apply the migration
    await db.query(`/* your migration SQL */`);
    
    console.log('✅ Your migration completed');
  }
};
```

3. **Run the migration:**

```bash
npm run migrate
```

## 🚨 Important Notes

- **Migrations are safe** - They check if changes already exist before applying
- **Order matters** - Migrations run in alphabetical order by key name
- **One-time only** - Each migration runs only once per database
- **Production ready** - Safe to run on existing databases with data

## 🔧 Troubleshooting

### "Table already exists" errors
This is normal! Migrations check for existing tables and skip if already present.

### "Permission denied" errors  
Make sure your database user has CREATE permissions:

```sql
GRANT ALL PRIVILEGES ON DATABASE saas_app TO your_user;
```

### Starting completely over
If you want to start fresh (⚠️ deletes everything):

```bash
npm run reset --confirm
npm run fresh
```
