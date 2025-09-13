# Track Application

Track is built with React, Node.js, PostgreSQL, and Vercel.

## Project Structure

- `frontend/` - React application
- `backend/` - Node.js/Express API
- `database/` - Database schema and migrations
- `docs/` - Documentation

## Features

- Issue tracking
- Project management
- Boards and workflows
- User authentication
- Integrations (GitHub, Slack)

## Running with Docker Compose

1. Make sure you have Docker and Docker Compose installed
2. Copy `.env.example` to `.env` and configure your environment variables
3. Run the application:

```bash
docker-compose up --build
```

This will start:
- PostgreSQL database on port 5432
- Backend API on port 3001
- Frontend on port 5173

The database schema will be automatically initialized on first run.

## Development

For local development without Docker:

```bash
npm run install:all
npm run dev
```