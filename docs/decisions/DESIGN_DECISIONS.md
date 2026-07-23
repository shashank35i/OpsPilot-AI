# OpsPilot Design Decisions

## Spring Boot Modular Monolith

The backend is a single Spring Boot service with package-level boundaries for web controllers, repositories, services, security, configuration, and domain models. This keeps deployment simple while still making responsibilities visible.

## MySQL As Source Of Truth

Incidents, tasks, users, activity records, SLA policies, auth sessions, and token blacklist fallback records are persisted in MySQL through Spring Data JPA. Redis is used for cache and revocation speed, not as the source of truth.

## Logical IDs Instead Of JPA Relationships

The models store related entity IDs as string fields such as `incident.owner`, `incident.assignee`, `task.incident`, and `activity.actor`. The code resolves display names through repositories when needed. This avoids hidden lazy-loading behavior and keeps API DTO construction explicit.

## JWT With Revocation

Requests are authenticated with JWTs. On logout, the current token ID is written to Redis with the remaining TTL and also persisted as a database fallback record. This keeps request handling stateless while still supporting immediate logout.

## Redis Cache-Aside Dashboard Reads

Dashboard and analytics endpoints use cache-aside reads. Controllers check Redis first, compute the payload on miss, and cache the result with a short TTL. Incident, task, activity, and scheduler state changes invalidate affected keys.

## Role-Scoped Workflows

Reporter, Responder, and Admin behavior is enforced in backend guards and reflected in the frontend. Reporters create and track their own incidents. Responders claim, update, review, and resolve work. Admins manage policy-level controls and see global operational state.

## Gemini As Assisted Review

Gemini supports severity assessment, incident summaries, and troubleshooting recommendations. It does not silently replace operational decisions. Severity mismatches are routed into manual review.

## Scheduled SLA Monitoring

The scheduler checks for near-SLA, breached-SLA, and stale unassigned incidents. It persists only actual state changes, sends alerts, and invalidates affected dashboard caches instead of clearing all caches every run.

## WebSocket/STOMP Alerts

The backend uses Spring's in-app STOMP simple broker with `/topic` and `/queue` destinations. Alerts are sent to role-specific and user-specific destinations to update active users without polling.

## GitHub Actions Deployment

CI runs backend verification, frontend build, and backend Docker image validation. The deploy workflow runs only after successful CI on `main`, assumes an AWS role through OIDC, deploys the backend to EC2 through SSM, syncs the frontend to S3, and invalidates CloudFront.

## Known Tradeoffs

- Incident claiming is implemented as a read-check-save flow, not an atomic conditional update.
- The current STOMP setup uses Spring's simple broker, not an external message broker.
- Public registration creates Reporter accounts only; elevated roles are seeded or admin-managed.
- The committed benchmark is a smoke measurement, not a full capacity test.

