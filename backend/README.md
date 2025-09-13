# Backend API

## Database Management

### Seeding Test Data

To populate the database with test data, use the seeding script:

```bash
# Basic seeding (creates 10 users, 5 teams, 8 projects, 25 issues)
npm run seed

# Custom seeding with specific counts
npm run seed -- --users 20 --teams 8 --projects 15 --issues 50

# Or run directly with node
node src/scripts/seedDatabase.js --users 20 --issues 100
```

#### Seeding Options

- `--users <number>`: Number of test users to create (default: 10)
- `--teams <number>`: Number of test teams to create (default: 5)
- `--projects <number>`: Number of test projects to create (default: 8)
- `--issues <number>`: Number of test issues to create (default: 25)

#### What gets created

The seeding script generates realistic test data including:

- **Users**: Random names, emails, usernames, and avatar URLs
- **Teams**: Development teams with descriptions
- **Projects**: Software projects assigned to teams
- **Issues**: Bug reports and feature requests with priorities, assignees, and due dates

All data is randomly generated but follows realistic patterns for testing purposes.

### Resetting Database

To completely clear all data and reset sequences:

```bash
# WARNING: This will delete ALL data permanently!
npm run reset -- --confirm

# Or run directly
node src/scripts/resetDatabase.js --confirm
```

This is useful when you want to start fresh with test data.

### Quick Fresh Start

To reset and seed the database in one command:

```bash
npm run fresh
```

This runs `reset --confirm` followed by `seed` automatically.

## API Endpoints

### Issues
- `GET /api/issues` - Get all issues
- `GET /api/issues?status=open` - Filter issues by status
- `GET /api/issues/:id` - Get single issue
- `POST /api/issues` - Create new issue

### Authentication (Coming Soon)
- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/auth/me`