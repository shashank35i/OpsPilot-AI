# OpsPilot AI

A recruiter-grade full-stack MERN app: incident command center + AI ops copilot.

## Stack
- **Frontend**: React + Vite
- **Backend**: Node.js + Express + MongoDB (Mongoose)
- **Auth**: JWT
- **AI**: incident summary mock (extensible)

## Features
- Role-based auth (Admin / Manager / Agent)
- Incident management with SLA tracking
- Task management
- Analytics dashboard
- Activity log
- Mobile bottom navigation + desktop sidebar

## Local Setup

### Backend
```bash
cd backend
cp .env.example .env
# set MONGO_URL + JWT_SECRET
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

## Deployment (Railway)
1. Create **MongoDB** service.
2. Create **Backend** service from repo `/backend`.
3. Set env vars in backend (`MONGO_URL`, `JWT_SECRET`, `CLIENT_ORIGIN`).
4. Deploy **Frontend** to Cloudflare Pages or Railway.

---
Built by **Shashank Preetham**.
