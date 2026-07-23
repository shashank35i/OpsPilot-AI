# OpsPilot API Reference

Base URLs:

- Live: `https://d231036zukeq44.cloudfront.net/app/api`
- Local: `http://localhost:8080/api`

Authentication uses `Authorization: Bearer <jwt>` after login. Public registration always creates a `Reporter` account.

## Demo Accounts

| Role | Email | Password |
| --- | --- | --- |
| Reporter | `reporter@opspilot.ai` | `Reporter@123` |
| Responder | `responder@opspilot.ai` | `Responder@123` |
| Admin | `admin@opspilot.ai` | `Admin@123` |

## Auth

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `POST` | `/auth/register` | Public | Create a Reporter account. |
| `POST` | `/auth/login` | Public | Return JWT and public user profile. |
| `POST` | `/auth/logout` | JWT | Revoke current JWT ID and session. |
| `GET` | `/auth/me` | JWT | Return current user profile. |

Register body:

```json
{
  "name": "Demo Reporter",
  "email": "demo@example.com",
  "password": "Reporter@123",
  "role": "Reporter"
}
```

Login body:

```json
{
  "email": "reporter@opspilot.ai",
  "password": "Reporter@123"
}
```

## Dashboard And Analytics

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/dashboard` | JWT | Role-scoped dashboard payload. |
| `GET` | `/analytics/summary` | JWT | Operational analytics summary. |
| `GET` | `/analytics/cache-metrics` | JWT | Redis cache hit/miss counters. |
| `GET` | `/models/priority` | JWT | Priority scoring metadata. |
| `GET` | `/activities` | JWT | Latest activity feed. |

Dashboard caching keys are role scoped:

- `dashboard:reporter:{userId}`
- `dashboard:responder:{userId}`
- `dashboard:admin`

## Incidents

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/incidents?status=&q=` | JWT | List incidents. Reporters see their own incidents only. |
| `POST` | `/incidents` | Reporter | Create an incident and run severity assessment. |
| `PATCH` | `/incidents/{id}` | Responder/Admin | Update status, assignee, severity, category, description, or tags. |
| `POST` | `/incidents/{id}/claim` | Responder/Admin | Claim an unassigned incident. |
| `POST` | `/incidents/{id}/review-severity` | Responder/Admin | Approve or override severity after review. |
| `POST` | `/incidents/{id}/resolve` | Assigned Responder/Admin | Mark an incident resolved. |
| `POST` | `/incidents/{id}/auto-tasks` | Responder/Admin | Generate operational tasks for an incident. |
| `POST` | `/ai/incident-summary` | JWT | Generate summary, priority score, and troubleshooting plan. |

Create body:

```json
{
  "title": "Payment gateway latency spike",
  "description": "Checkout payments are timing out for US-East users.",
  "severity": "High",
  "category": "Payments",
  "tags": ["payments", "latency"]
}
```

Update body:

```json
{
  "status": "Investigating",
  "severity": "High",
  "category": "Payments",
  "description": "Updated incident notes",
  "tags": ["payments", "latency"]
}
```

Severity review body:

```json
{
  "severity": "Critical",
  "note": "Customer checkout path is blocked."
}
```

AI summary body:

```json
{
  "incidentId": "incident-uuid"
}
```

## Tasks

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/tasks?q=` | JWT | List tasks. |
| `POST` | `/tasks` | JWT | Create a task. |
| `PATCH` | `/tasks/{id}` | JWT | Update title, priority, or status. |

Create body:

```json
{
  "title": "Verify rollback path",
  "status": "Todo",
  "priority": "High",
  "incident": "incident-uuid"
}
```

Patch body:

```json
{
  "status": "In Progress",
  "priority": "High"
}
```

## Admin

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/admin/sla-policies` | Admin | List SLA thresholds. |
| `PUT` | `/admin/sla-policies` | Admin | Create or update an SLA threshold. |

SLA policy body:

```json
{
  "severity": "Critical",
  "thresholdMinutes": 15
}
```

## Health

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/health` | Public | Runtime health metadata. |

