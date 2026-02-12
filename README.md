# OpsPilot AI

Recruiter-grade full-stack MERN app: incident command center + enterprise ops copilot.

## Stack
- **Frontend**: React + Vite
- **Backend**: Node.js + Express + MongoDB (Mongoose)
- **Cache**: Redis (optional, Railway-ready) for hot endpoints
- **Auth**: JWT
- **Local Model**: Priority scoring + incident summaries (no external AI provider)

## Database Schema
This project uses **MongoDB**, so there is no SQL schema file. The data model is defined in Mongoose models:
- `backend/src/models/User.js`
- `backend/src/models/Incident.js`
- `backend/src/models/Task.js`
- `backend/src/models/Activity.js`

## Features
- Role-based auth (Admin / Manager / Agent)
- Incident management with SLA timers + status badges
- Task execution board
- Analytics dashboard + priority model metadata
- Activity log
- Redis-backed response caching for analytics/incidents/tasks/activities
- Mobile bottom navigation + desktop sidebar
- Seed data for quick local setup

## Local Setup

### Backend
```bash
cd backend
cp .env.example .env
# set MONGO_URL + JWT_SECRET (+ REDIS_URL optional)
npm install
npm run dev
```

### Frontend
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

### E2E Tests (Playwright)
```bash
cd frontend
npx playwright install chromium
npm run test:e2e
```

### Seeded Accounts
- **Admin**: `admin@opspilot.ai` / `Admin@123`
- **Manager**: `manager@opspilot.ai` / `Manager@123`
- **Agent**: `agent@opspilot.ai` / `Agent@123`

To auto-seed:
```bash
SEED_ON_START=1 npm run dev
```

## API Endpoints (high level)
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET/POST /api/incidents`
- `PATCH /api/incidents/:id`
- `GET/POST /api/tasks`
- `PATCH /api/tasks/:id`
- `GET /api/analytics/summary`
- `POST /api/ai/incident-summary`
- `GET /api/models/priority`

## Deployment (Railway)
1. Create **MongoDB** service.
2. Create **Backend** service from repo `/backend`.
3. Set env vars in backend (`MONGO_URL`, `JWT_SECRET`, `CLIENT_ORIGIN`).
4. (Optional, recommended) Add **Redis** service and set `REDIS_URL` in backend.
5. Deploy **Frontend** to Cloudflare Pages or Railway.

## Docker (Local)
```bash
docker compose up --build
```

---
Built by **Shashank Preetham**.
