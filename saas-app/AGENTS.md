# AGENTS.md

This file documents agents, commands, and setup instructions for the SaaS application.

## Project Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Vercel CLI (for deployment)

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   cd saas-app
   npm install
   cd frontend && npm install
   cd ../backend && npm install
   ```

### Database Setup
1. Create a PostgreSQL database
2. Run the schema:
   ```bash
   psql -d your_database < database/schema.sql
   ```

### Environment Variables
Copy `.env.example` to `.env` and fill in the values.

### Running the Application
- Backend: `cd backend && npm run dev`
- Frontend: `cd frontend && npm run dev`

## Commands
- Lint: `npm run lint`
- Test: `npm run test`
- Build: `npm run build`
- Deploy: `vercel --prod`

## Agents
- General: For research and planning
- Code: For implementation tasks

## Notes
- Use this file to document any new commands or agents added to the project.