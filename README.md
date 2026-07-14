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
- [System Flow](#system-flow)
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
- Hybrid JWT + server-side session authentication with Redis token blacklist revocation
- Role-based access controls for `Reporter`, `Responder`, and `Admin`
- Incident queue with SLA bars, status badges, severity, and score
- Gemini severity validation with manual review routing for mismatches
- Scheduled SLA, near-deadline, and unassigned incident monitoring with WebSocket/STOMP alerts
- Incident actions: status transitions, AI brief, and auto task generation
- Task board with in-place status/priority updates
- Analytics summary (open/investigating/mitigated/resolved + tasks open)
- Activity feed for operational audit trail
- Redis-backed caching for hot read endpoints
- Cache read-reduction metrics exposed on the dashboard
- Mobile-first responsive UI with desktop fixed sidebar

---

## Tech Stack

### Frontend
- React 18
- Vite
- JavaScript
- React Router
- Lucide Icons

### Backend
- Java 17
- Spring Boot
- Spring Security
- Spring Data JPA
- MySQL
- Spring Data Redis
- WebSocket/STOMP
- Bean Validation
- Gemini API integration
- JUnit + Mockito
- Hybrid JWT + session auth with Redis blacklisted-token revocation

### Tooling
- Docker / Docker Compose
- Playwright (E2E)

---

## Architecture

```text
Browser (React/Vite UI)
        |
        v
Spring Boot API (JWT + sessions + Redis blacklist + Gemini + STOMP)
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
- Responder: `responder@opspilot.ai` / `Responder@123`
- Reporter: `reporter@opspilot.ai` / `Reporter@123`

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
| `SLA_NEAR_THRESHOLD_PERCENT` | Optional | `80` |
| `UNASSIGNED_ALERT_MINUTES` | Optional | `15` |
| `GEMINI_API_KEY` | Optional | `your_key` |
| `GEMINI_MODEL` | Optional | `gemini-1.5-flash` |

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
- `POST /api/incidents/:id/claim`
- `POST /api/incidents/:id/review-severity`
- `POST /api/incidents/:id/resolve`
- `POST /api/incidents/:id/auto-tasks`
- `POST /api/ai/incident-summary`

### Admin
- `GET /api/admin/sla-policies`
- `PUT /api/admin/sla-policies`

### Tasks
- `GET /api/tasks`
- `POST /api/tasks`
- `PATCH /api/tasks/:id`

### Analytics / Metadata
- `GET /api/analytics/summary`
- `GET /api/analytics/cache-metrics`
- `GET /api/models/priority`
- `GET /api/activities`
- `GET /api/health`

### Realtime Alerts
- STOMP endpoint: `/ws`
- Responder broadcast topic: `/topic/responders/alerts`
- Admin broadcast topic: `/topic/admin/alerts`
- Assigned responder queue: `/queue/users/{userId}/alerts`
- Frontend users see recent live alerts in the header alert tray.

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

### AWS
- Backend: Dockerized Spring Boot service on EC2
- Database: Amazon RDS MySQL
- Frontend assets: S3
- CDN: CloudFront
- Cache / token blacklist: Redis-compatible cache endpoint

---

## System Flow
1. Users authenticate with JWT. Logout writes the JWT ID to Redis blacklist storage, so revoked tokens are rejected immediately.
2. Roles enforce the core workflow: `Reporter` creates incidents, `Responder` claims/reviews/resolves, and `Admin` can perform responder actions plus manage SLA policies.
3. Reporter submits title, description, and severity.
4. Gemini evaluates the description and compares predicted severity with the reporter selection. Matching reports are auto-approved; mismatches become `NeedsReview`.
5. Once severity is locked, the incident inherits the Admin-managed SLA policy for that severity.
6. Responders claim unassigned incidents and move work through `Acknowledged`, `In Progress`, and `Resolved`.
7. Scheduled monitoring checks near-SLA, breached-SLA, and stale-unassigned incidents.
8. Alerts are sent over WebSocket/STOMP to responders or admins and are also recorded in the activity feed.
9. Redis cache-aside storage is used for hot dashboard reads and JWT blacklist checks. Cache hit-rate metrics are exposed as estimated database read reduction.

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
