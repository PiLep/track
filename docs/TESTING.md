# Testing Guide

This guide explains how to run tests with the dedicated test database to avoid polluting your production data.

## Overview

The application now includes a dedicated test database (`saas_app_test`) that runs on port 5433, separate from the production database on port 5432.

## Test Database Setup

### Automatic Setup (Recommended)

Use the provided script to automatically set up and run tests:

```bash
# Run all tests with automatic setup/cleanup
./test-setup.sh
```

This script will:
1. Start the test database
2. Initialize the schema
3. Run all e2e tests
4. Clean up the test database

### Manual Setup

If you prefer to set up manually:

```bash
# 1. Start test database
docker-compose --profile test up -d postgres-test

# 2. Wait for database to be ready (about 10 seconds)
sleep 10

# 3. Initialize test database schema
cd frontend && npm run test:setup

# 4. Run tests
npm run test:e2e

# 5. Clean up
npm run test:cleanup
docker-compose --profile test down
```

## Test Database Configuration

- **Host**: localhost
- **Port**: 5433 (different from production port 5432)
- **Database**: saas_app_test
- **User**: user
- **Password**: password

## Available Commands

### Frontend Commands

```bash
cd frontend

# Initialize test database
npm run test:setup

# Clean test database
npm run test:cleanup

# Run e2e tests (will use test database automatically)
npm run test:e2e

# Run tests with UI
npm run test:e2e:ui
```

### Docker Commands

```bash
# Start test database
docker-compose --profile test up -d postgres-test

# Stop test database
docker-compose --profile test down

# View test database logs
docker-compose --profile test logs postgres-test

# Connect to test database
docker-compose --profile test exec postgres-test psql -U user -d saas_app_test
```

## Test Isolation

Each test run:
1. **Starts** with a clean database (all tables empty)
2. **Creates** test data as needed
3. **Cleans up** automatically after completion
4. **Resets** auto-increment sequences

This ensures tests are completely isolated and don't interfere with each other.

## Database Schema

The test database uses the same schema as production:
- All tables and relationships are identical
- Foreign key constraints are maintained
- Indexes are preserved

## Troubleshooting

### Database Connection Issues

If tests fail with connection errors:

```bash
# Check if test database is running
docker-compose --profile test ps

# Check database logs
docker-compose --profile test logs postgres-test

# Restart test database
docker-compose --profile test restart postgres-test
```

### Schema Issues

If schema initialization fails:

```bash
# Reinitialize schema
cd frontend && npm run test:setup

# Or manually load schema
docker-compose --profile test exec -T postgres-test psql -U user -d saas_app_test -f /docker-entrypoint-initdb.d/schema.sql
```

### Port Conflicts

If port 5433 is already in use:

```bash
# Check what's using the port
lsof -i :5433

# Change port in docker-compose.yml if needed
# postgres-test:
#   ports:
#     - "5434:5432"  # Change to available port
```

## Best Practices

1. **Always use the test database** for automated tests
2. **Never run tests against production** database
3. **Use the automated script** for consistent setup
4. **Check test isolation** - each test should be independent
5. **Clean up after manual testing** to avoid data pollution

## CI/CD Integration

For CI/CD pipelines, use:

```yaml
# Example GitHub Actions
- name: Run E2E Tests
  run: |
    ./test-setup.sh
  env:
    CI: true
```

This ensures clean, isolated test runs in any environment.