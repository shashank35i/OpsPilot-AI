# OpsPilot AI

<div align="center">

### Enterprise Incident Command Platform

A full-stack operations command center for incident triage, SLA tracking, execution workflows, analytics, and audit visibility.

CI/CD status is validated on every push to `main`.

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
- [Live Deployment](#live-deployment)
- [Demo](#demo)
- [Core Features](#core-features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Database Schema](#database-schema)
- [Quick Start (One Command)](#quick-start-one-command)
- [Local Dev Setup](#local-dev-setup)
- [Seeded Accounts](#seeded-accounts)
- [Environment Variables](#environment-variables)
- [API Overview](#api-overview)
- [Postman Collection](#postman-collection)
- [Load Testing](#load-testing)
- [Design Decisions](#design-decisions)
- [Known Limitations](#known-limitations)
- [Future Improvements](#future-improvements)
- [Deployment](#deployment)
- [System Flow](#system-flow)
- [Troubleshooting](#troubleshooting)
- [Developer](#developer)
- [License](#license)

---

## What It Does
**OpsPilot AI** helps teams run incident operations end-to-end:
- Intake and prioritize incidents using severity, SLA, and priority scoring rules
- Track status with SLA countdowns and urgency signals
- Generate AI incident briefs and action plans
- Auto-create remediation tasks from incidents
- Monitor activity and analytics with role-based access

---

## Live Deployment

- Live application: https://d231036zukeq44.cloudfront.net/
- API base: https://d231036zukeq44.cloudfront.net/api/
- GitHub repository: https://github.com/shashank35i/OpsPilot-AI

Use the demo accounts below to explore Reporter, Responder, and Admin workflows.

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
- Cache read-reduction metrics exposed through the analytics metadata API
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

---

## Architecture

```text
React + CloudFront
        |
        v
Spring Boot on EC2
        |
        +--> MySQL / Amazon RDS
        +--> Redis cache + JWT revocation blacklist
        +--> WebSocket/STOMP alert delivery
        +--> Gemini API for severity review and response assistance
```

### Architecture Notes
- MySQL is the source of truth for users, incidents, tasks, SLA policy, sessions, and activity.
- Redis is used for cache-aside dashboard/analytics reads and immediate JWT revocation on logout.
- WebSocket/STOMP alerts deliver SLA, assignment, and incident-update notifications in real time.
- Scheduled jobs detect overdue, near-SLA, and stale unassigned incidents.
- Gemini assists severity validation, summaries, and troubleshooting suggestions; human review remains the control point for mismatches.

---

## Database Schema

Core tables:

| Table | Purpose |
|---|---|
| `users` | Stores account profile, email, BCrypt password hash, and role (`Reporter`, `Responder`, `Admin`). |
| `auth_sessions` | Tracks issued sessions and JWT IDs for hybrid JWT/session authentication. |
| `blacklisted_tokens` | Stores revoked JWT IDs until expiry for immediate logout enforcement. |
| `incidents` | Stores incident title, description, severity, status, owner, assignee, SLA timestamps, review state, and priority metadata. |
| `tasks` | Stores remediation tasks linked to incidents with status, priority, assignee, and due time. |
| `sla_policies` | Stores Admin-managed SLA thresholds by severity. |
| `activities` | Stores audit/activity feed entries for incident, task, and system events. |

Important indexes:

| Index | Why it exists |
|---|---|
| `idx_users_email` | Fast unique login lookup. |
| `idx_incidents_status_created` | Efficient status-filtered queue reads. |
| `idx_incidents_sla_due` | Scheduled SLA breach scans. |
| `idx_incidents_assignee_created` | Responder workload and assigned-queue reads. |
| `idx_incidents_owner_created` | Reporter dashboard reads. |
| `idx_incidents_review` | Manual severity review queue. |
| `idx_tasks_status` | Task board filtering. |

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

- Reporter: `reporter@opspilot.ai` / `Reporter@123`
- Responder: `responder@opspilot.ai` / `Responder@123`
- Admin: `admin@opspilot.ai` / `Admin@123`

---

## Environment Variables

### Backend (`backend/.env`)
| Variable | Required | Example |
|---|---|---|
| `PORT` | Yes | `8080` |
| `DATABASE_URL` | Yes | `jdbc:mysql://localhost:3306/opspilot?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC` |
| `DATABASE_USERNAME` | Yes | `opspilot` |
| `DATABASE_PASSWORD` | Yes | `opspilot` |
| `JPA_DDL_AUTO` | Optional | `update` |
| `REDIS_URL` | Optional | `redis://localhost:6379` |
| `CLIENT_ORIGIN` | Yes | `http://localhost:5173` |
| `JWT_SECRET` | Yes | `change_me` |
| `JWT_TTL_HOURS` | Optional | `8` |
| `SEED_ON_START` | Optional | `1` |
| `APP_VERSION` | Optional | `1.0.0` |
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
- `GET /api/dashboard`
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
- `GET /api/models/priority` - priority scoring metadata
- `GET /api/activities`
- `GET /api/health`

### Realtime Alerts
- STOMP endpoint: `/ws`
- Responder broadcast topic: `/topic/responders/alerts`
- Admin broadcast topic: `/topic/admin/alerts`
- Assigned responder queue: `/queue/users/{userId}/alerts`
- Frontend users see recent live alerts in the header alert tray.

---

## Postman Collection

A Postman collection should cover:

- Auth: register, login, logout, current user
- Dashboard: role-aware dashboard payload
- Incidents: list, create, update status, claim, review severity, resolve, suggest tasks, generate summary
- Tasks: list, create, update status/priority
- Analytics: summary and cache metrics
- Admin: SLA policy read/update

Recommended collection variables:

| Variable | Example |
|---|---|
| `base_url` | `https://d231036zukeq44.cloudfront.net/app/api` |
| `token` | JWT returned by `POST /api/auth/login` |

---

## Load Testing

Current measured performance work:

- Redis cache-aside is used for repeated dashboard and analytics reads.
- Cache metrics are exposed through `GET /api/analytics/cache-metrics`.
- Indexed MySQL queries support dashboard, queue, SLA, and scheduled-monitoring paths.

Recommended load-test scenarios:

| Scenario | Endpoint / workflow |
|---|---|
| Login burst | `POST /api/auth/login` |
| Dashboard repeated reads | `GET /api/dashboard` |
| Incident queue reads | `GET /api/incidents` |
| SLA scheduler impact | near-SLA and overdue incident scans |
| Task generation | `POST /api/incidents/:id/auto-tasks` |

Do not claim a specific throughput number unless it is produced from a repeatable run and committed with the test configuration.

---

## Design Decisions

| Decision | Reason |
|---|---|
| Spring Boot backend | Clear service boundaries, strong security support, scheduled jobs, JPA, WebSocket/STOMP support. |
| MySQL source of truth | Incident and workflow data is relational: users, assignments, SLA policy, tasks, and audit entries benefit from indexed joins/lookups. |
| Redis cache-aside | Dashboard and analytics reads repeat often; Redis reduces repeated database reads without replacing MySQL as durable storage. |
| Redis JWT revocation blacklist | Keeps JWT requests stateless while still allowing immediate logout/token invalidation. |
| Role-aware shared pages | Avoids duplicate Reporter/Responder/Admin pages while preserving distinct permissions and views. |
| Gemini as review support | AI supports severity validation, summaries, and troubleshooting, but manual review handles mismatches. |
| Scheduled SLA monitoring | SLA and unassigned checks must run even when no user is actively viewing the dashboard. |
| WebSocket/STOMP alerts | Responder/Admin queues benefit from real-time operational updates. |

---

## Known Limitations

- Public registration is intentionally limited to Reporter accounts.
- Responder/Admin accounts are seeded or managed administratively.
- The app currently uses shared role-aware pages instead of separate route trees per role.
- Postman and load-test artifacts should be kept in the repo when final benchmark runs are produced.
- API documentation is currently README-based; Swagger/OpenAPI can be added later if required.
- Local backend tests require Maven on PATH because no Maven wrapper is committed.

---

## Future Improvements

- Add a committed Postman collection under `docs/`.
- Add repeatable k6/JMeter load-test scripts and publish measured results.
- Add Swagger/OpenAPI generation for the Spring Boot API.
- Add a dedicated incident detail route if deeper timeline/comment workflows are expanded.
- Add Admin-managed user creation for Responder/Admin accounts.
- Add saved notification preferences backed by the API.

---

## Deployment

### AWS
- Backend: Dockerized Spring Boot service on EC2
- Database: Amazon RDS MySQL
- Frontend assets: S3
- CDN: CloudFront
- Cache / token blacklist: Redis-compatible cache endpoint
- CI/CD: GitHub Actions

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
9. Redis cache-aside storage is used for role-scoped dashboard reads and JWT blacklist checks. Cache hit-rate metrics are exposed as estimated database read reduction.

## Frontend Pages
- Public routes: landing, login, and registration.
- Authenticated routes: shared role-aware Dashboard, Incidents, Tasks, Analytics, and Profile pages.
- The application does not maintain separate Reporter, Responder, or Admin pages; each shared page renders role-specific sections and actions.

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
