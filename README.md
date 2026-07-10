# OpsPilot AI

<div align="center">

### Enterprise Incident Command Platform

A full-stack operations command center for incident triage, SLA tracking, execution workflows, analytics, and audit visibility.

![React](https://img.shields.io/badge/Frontend-React%2018-61DAFB?logo=react&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Backend-Spring%20Boot-6DB33F?logo=springboot&logoColor=white)
![MySQL](https://img.shields.io/badge/Database-MySQL-4479A1?logo=mysql&logoColor=white)
![Redis](https://img.shields.io/badge/Cache-Redis-DC382D?logo=redis&logoColor=white)
![Docker](https://img.shields.io/badge/Containerized-Docker-2496ED?logo=docker&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue.svg)

</div>

---

## Table of Contents
- [What It Does](#what-it-does)
- [Demo](#demo)
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

## Demo
![OpsPilot Demo](demos/opspilot_demo.gif)

---

## Core Features
- Hybrid JWT + server-side session authentication with token blacklist revocation
- Role-based access metadata (`Admin`, `Manager`, `Agent`)
- Incident queue with SLA bars, status badges, severity, and score
- Scheduled SLA overdue detection for unresolved incidents past due time
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
- Java 17
- Spring Boot
- Spring Security
- Spring Data JPA
- MySQL
- Spring Data Redis
- Bean Validation
- Hybrid JWT + session auth with blacklisted-token revocation

### Tooling
- Docker / Docker Compose
- Playwright (E2E)

---

## Architecture

```text
Browser (React/Vite UI)
        |
        v
Spring Boot API (JWT + sessions + blacklist + AI helpers)
        |                 \
        v                  v
   MySQL (source)      Redis (cache)
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
mvn spring-boot:run
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
| `DATABASE_URL` | Yes | `jdbc:mysql://localhost:3306/opspilot?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC` |
| `DATABASE_USERNAME` | Yes | `opspilot` |
| `DATABASE_PASSWORD` | Yes | `opspilot` |
| `JWT_SECRET` | Yes | `change_me` |
| `JWT_TTL_HOURS` | Optional | `8` |
| `CLIENT_ORIGIN` | Yes | `http://localhost:5173` |
| `REDIS_URL` | Optional | `redis://localhost:6379` |
| `SEED_ON_START` | Optional | `1` |
| `SLA_OVERDUE_SCHEDULER_ENABLED` | Optional | `true` |
| `SLA_OVERDUE_SCHEDULER_DELAY_MS` | Optional | `60000` |
| `SLA_OVERDUE_BATCH_SIZE` | Optional | `100` |

### Frontend (`frontend/.env`)
| Variable | Required | Example |
|---|---|---|
| `VITE_API_BASE_URL` | Yes | `http://localhost:8080` |

---

## API Overview

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
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
1. Create `MySQL` service
2. (Recommended) Create `Redis` service
3. Deploy backend service from `/backend`
4. Set backend env vars (`DATABASE_URL`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`, `JWT_SECRET`, `CLIENT_ORIGIN`, optional `REDIS_URL`, `JWT_TTL_HOURS`)
5. Deploy frontend service from `/frontend` (or Cloudflare Pages)

---

## Troubleshooting
- If backend cannot connect to the database, verify `DATABASE_URL`, `DATABASE_USERNAME`, and `DATABASE_PASSWORD`.
- If CORS fails, verify `CLIENT_ORIGIN` exactly matches frontend origin.
- If Docker healthchecks fail, wait for MySQL bootstrap to finish.
- Vite warns on Node `20.17.0`; recommended `20.19+` or `22.12+`.

---

## Developer
Built by **Shashank Preetham**.

---

## License
This project is licensed under the **MIT License**. See [LICENSE](./LICENSE).
