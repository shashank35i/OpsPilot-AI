# OpsPilot AI

<div align="center">

### Enterprise Incident Command Platform

A full-stack operations command center for incident triage, SLA tracking, execution workflows, analytics, and audit visibility.

![React](https://img.shields.io/badge/Frontend-React%2018-61DAFB?logo=react&logoColor=white)
![Node.js](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-339933?logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248?logo=mongodb&logoColor=white)
![Redis](https://img.shields.io/badge/Cache-Redis-DC382D?logo=redis&logoColor=white)
![Docker](https://img.shields.io/badge/Containerized-Docker-2496ED?logo=docker&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue.svg)

</div>

---

## Table of Contents
- [What It Does](#what-it-does)
- [Core Features](#core-features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Quick Start (One Command)](#quick-start-one-command)
- [Local Dev Setup](#local-dev-setup)
- [Seeded Accounts](#seeded-accounts)
- [Environment Variables](#environment-variables)
- [API Overview](#api-overview)
- [Testing](#testing)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Developer](#developer)
- [License](#license)

---

## What It Does
**OpsPilot AI** helps teams run incident operations end-to-end:
- Intake and prioritize incidents using a local scoring model
- Track status with SLA countdowns and urgency signals
- Generate AI incident briefs and action plans
- Auto-create remediation tasks from incidents
- Monitor activity and analytics with role-based access

---

## Core Features
- JWT authentication with role-based access (`Admin`, `Manager`, `Agent`)
- Incident queue with SLA bars, status badges, severity, and score
- Incident actions: status transitions, AI brief, and auto task generation
- Task board with in-place status/priority updates
- Analytics summary (open/investigating/mitigated/resolved + tasks open)
- Activity feed for operational audit trail
- Redis-backed caching for hot read endpoints
- Mobile-first responsive UI with desktop fixed sidebar

---

## Tech Stack

### Frontend
- React 18
- Vite
- TypeScript
- React Router
- Lucide Icons

### Backend
- Node.js
- Express
- MongoDB + Mongoose
- Redis (`ioredis`)
- Zod validation
- JWT auth

### Tooling
- Docker / Docker Compose
- Playwright (E2E)

---

## Architecture

```text
Browser (React/Vite UI)
        |
        v
Express API (JWT + RBAC + AI helpers)
        |                 \
        v                  v
   MongoDB (source)     Redis (cache)
```

---

## Quick Start (One Command)

### Prerequisites
- Docker Desktop running

### Run full stack
```bash
docker compose up --build
```

### App URLs
- Frontend: `http://localhost:5173`
- Backend health: `http://localhost:8080/api/health`

### Stop stack
```bash
docker compose down
```

### Stop + remove volumes
```bash
docker compose down -v
```

---

## Local Dev Setup

### Backend
```bash
cd backend
cp .env.example .env
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

---

## Seeded Accounts
(when `SEED_ON_START=1`)

- Admin: `admin@opspilot.ai` / `Admin@123`
- Manager: `manager@opspilot.ai` / `Manager@123`
- Agent: `agent@opspilot.ai` / `Agent@123`

---

## Environment Variables

### Backend (`backend/.env`)
| Variable | Required | Example |
|---|---|---|
| `PORT` | Yes | `8080` |
| `MONGO_URL` | Yes | `mongodb://localhost:27017/opspilot` |
| `JWT_SECRET` | Yes | `change_me` |
| `CLIENT_ORIGIN` | Yes | `http://localhost:5173` |
| `REDIS_URL` | Optional | `redis://localhost:6379` |
| `SEED_ON_START` | Optional | `1` |

### Frontend (`frontend/.env`)
| Variable | Required | Example |
|---|---|---|
| `VITE_API_BASE_URL` | Yes | `http://localhost:8080` |

---

## API Overview

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Incidents
- `GET /api/incidents`
- `POST /api/incidents`
- `PATCH /api/incidents/:id`
- `POST /api/incidents/:id/auto-tasks`
- `POST /api/ai/incident-summary`

### Tasks
- `GET /api/tasks`
- `POST /api/tasks`
- `PATCH /api/tasks/:id`

### Analytics / Metadata
- `GET /api/analytics/summary`
- `GET /api/models/priority`
- `GET /api/activities`
- `GET /api/health`

---

## Testing

### Frontend E2E
```bash
cd frontend
npx playwright install chromium
npm run test:e2e
```

---

## Deployment

### Railway (recommended)
1. Create `MongoDB` service
2. (Recommended) Create `Redis` service
3. Deploy backend service from `/backend`
4. Set backend env vars (`MONGO_URL`, `JWT_SECRET`, `CLIENT_ORIGIN`, optional `REDIS_URL`)
5. Deploy frontend service from `/frontend` (or Cloudflare Pages)

---

## Troubleshooting
- If backend exits with `Missing MONGO_URL`, set `MONGO_URL` in backend env.
- If CORS fails, verify `CLIENT_ORIGIN` exactly matches frontend origin.
- If Docker healthchecks fail, wait for MongoDB bootstrap to finish.
- Vite warns on Node `20.17.0`; recommended `20.19+` or `22.12+`.

---

## Developer
Built by **Shashank Preetham**.

---

## License
This project is licensed under the **MIT License**. See `LICENSE`.
