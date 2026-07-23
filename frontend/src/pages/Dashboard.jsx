import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangleIcon,
  BellIcon,
  CheckCircle2Icon,
  ClockIcon,
  CommandIcon,
  InboxIcon,
  PlusIcon,
  ShieldCheckIcon,
  UserCogIcon,
} from "lucide-react";
import { api } from "../lib/api";
import { readCache, writeCache } from "../lib/cache";
import { displayName, formatDateTime, incidentBadges, slaTone, timeLeft } from "../lib/format";

const Stat = ({ label, value, Icon = InboxIcon }) => (
  <div className="kpi-card">
    <span className="muted"><Icon size={14} /> {label}</span>
    <strong>{value ?? "--"}</strong>
  </div>
);

const GroupList = ({ title, items = {} }) => (
  <article className="card">
    <div className="section-title">{title}</div>
    <div className="metric-stack compact-stack">
      {Object.keys(items).length === 0 ? (
        <div className="muted">No data yet</div>
      ) : (
        Object.entries(items).map(([label, value]) => (
          <div className="metric-row" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))
      )}
    </div>
  </article>
);

const IncidentList = ({ title, items = [], empty = "No incidents in this queue." }) => (
  <article className="card">
    <div className="section-title">{title}</div>
    <div className="dashboard-list">
      {items.length === 0 ? (
        <div className="empty-state">
          <InboxIcon size={20} />
          <div>
            <strong>{empty}</strong>
            <p>New updates will appear here automatically after refresh or live alerts.</p>
          </div>
        </div>
      ) : (
        items.map((incident) => {
          const badge = incidentBadges[incident.status] || { label: incident.status, tone: "neutral" };
          return (
            <Link className="dashboard-row clickable-row" key={incident._id} to={`/app/incidents?q=${encodeURIComponent(incident.title || "")}`}>
              <div>
                <div className="row-title">{incident.title}</div>
                <div className="muted row-meta">
                  {incident.category || "Operations"} / {incident.severity} / {displayName(incident.assigneeName)}
                </div>
                <div className="muted row-meta">
                  SLA: <span className={`status-badge tone-${slaTone(incident.dueAt)}`}>{timeLeft(incident.dueAt)}</span>
                  <span> / Updated {formatDateTime(incident.updatedAt)}</span>
                </div>
              </div>
              <span className={`status-badge tone-${badge.tone}`}>{badge.label}</span>
            </Link>
          );
        })
      )}
    </div>
  </article>
);

const ActivityList = ({ title, items = [] }) => (
  <article className="card">
    <div className="section-title">{title}</div>
    <div className="timeline-list">
      {items.length === 0 ? (
        <div className="empty-state">
          <BellIcon size={20} />
          <div>
            <strong>No recent notifications</strong>
            <p>Status changes, SLA warnings, and review requests appear here.</p>
          </div>
        </div>
      ) : (
        items.map((item) => (
          <div key={item._id || `${item.type}-${item.createdAt}`} className="timeline-item">
            <div className="timeline-dot" />
            <div>
              <div style={{ fontWeight: 600 }}>{item.message}</div>
              <div className="muted" style={{ fontSize: 12 }}>
                {item.createdAt ? new Date(item.createdAt).toLocaleString() : item.type}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  </article>
);

const ReporterDashboard = ({ data }) => (
  <>
    <section className="card hero-panel dashboard-hero console-hero">
      <div>
        <div className="console-kicker"><CommandIcon size={14} /> reporter.dashboard</div>
        <h1>Your incidents, status, and SLA expectations.</h1>
        <p className="muted">Track your own tickets, responder assignment, current status, and latest updates.</p>
      </div>
      <Link className="btn primary" to="/app/incidents">
        <PlusIcon size={16} /> Create incident
      </Link>
    </section>

    <section className="kpi-grid">
      <Stat label="Total reported" value={data.summary?.total} Icon={InboxIcon} />
      <Stat label="Open" value={data.summary?.open} Icon={AlertTriangleIcon} />
      <Stat label="In progress" value={data.summary?.inProgress} Icon={ClockIcon} />
      <Stat label="Resolved" value={data.summary?.resolved} Icon={CheckCircle2Icon} />
      <Stat label="Closed" value={data.summary?.closed} Icon={ShieldCheckIcon} />
    </section>

    <section className="grid grid-2">
      <IncidentList title="My Incidents" items={data.incidents} empty="You have not reported incidents yet." />
      <ActivityList title="Latest Comments & Updates" items={data.latestUpdates} />
      <GroupList title="Incidents By Severity" items={data.bySeverity} />
      <GroupList title="Incidents By Category" items={data.byCategory} />
    </section>
  </>
);

const ResponderDashboard = ({ data }) => (
  <>
    <section className="card hero-panel dashboard-hero console-hero">
      <div>
        <div className="console-kicker"><CommandIcon size={14} /> responder.dashboard</div>
        <h1>Assigned work, unclaimed incidents, and SLA risk.</h1>
        <p className="muted">Use the incident queue for claim, update, comment, escalation, review, and resolution actions.</p>
      </div>
      <Link className="btn primary" to="/app/incidents">Open queue</Link>
    </section>

    <section className="kpi-grid">
      <Stat label="Assigned to me" value={data.summary?.assigned} Icon={UserCogIcon} />
      <Stat label="Open workload" value={data.summary?.open} Icon={AlertTriangleIcon} />
      <Stat label="Unassigned" value={data.summary?.unassignedAvailable} Icon={InboxIcon} />
      <Stat label="SLA at risk" value={data.summary?.slaAtRisk} Icon={ClockIcon} />
      <Stat label="Needs review" value={data.summary?.needsReview} Icon={ShieldCheckIcon} />
      <Stat label="Resolved" value={data.summary?.resolved} Icon={CheckCircle2Icon} />
    </section>

    <section className="grid grid-2">
      <IncidentList title="Assigned To Me" items={data.assigned} />
      <IncidentList title="Unassigned Pickup Queue" items={data.unassigned} />
      <IncidentList title="Nearing SLA" items={data.nearSla} />
      <IncidentList title="SLA Breached" items={data.slaBreached} />
      <IncidentList title="Manual Severity Review" items={data.severityReview} />
      <GroupList title="My Work By Severity" items={data.bySeverity} />
      <ActivityList title="Recent Notifications" items={data.notifications} />
    </section>
  </>
);

const AdminDashboard = ({ data }) => (
  <>
    <section className="card hero-panel dashboard-hero console-hero">
      <div>
        <div className="console-kicker"><CommandIcon size={14} /> admin.dashboard</div>
        <h1>System-wide incident control and responder workload.</h1>
        <p className="muted">Monitor all incidents, SLA pressure, trends, role distribution, and reassignment needs.</p>
      </div>
      <Link className="btn primary" to="/app/incidents">Manage incidents</Link>
    </section>

    <section className="kpi-grid">
      <Stat label="Total incidents" value={data.summary?.total} />
      <Stat label="Open" value={data.summary?.open} Icon={AlertTriangleIcon} />
      <Stat label="Assigned" value={data.summary?.assigned} Icon={UserCogIcon} />
      <Stat label="In progress" value={data.summary?.inProgress} Icon={ClockIcon} />
      <Stat label="Resolved" value={data.summary?.resolved} Icon={CheckCircle2Icon} />
      <Stat label="Closed" value={data.summary?.closed} Icon={ShieldCheckIcon} />
      <Stat label="Unassigned" value={data.summary?.unassigned} Icon={InboxIcon} />
      <Stat label="SLA breached" value={data.summary?.slaBreached} Icon={AlertTriangleIcon} />
    </section>

    <section className="grid grid-2">
      <IncidentList title="Unassigned Incidents" items={data.unassigned} />
      <IncidentList title="SLA Nearing" items={data.nearSla} />
      <IncidentList title="SLA Breached" items={data.slaBreached} />
      <article className="card">
        <div className="section-title">Responder Workloads</div>
        <div className="dashboard-list">
          {(data.responderWorkloads || []).map((row) => (
            <div className="dashboard-row" key={row.id}>
              <div>
                <div className="row-title">{row.name}</div>
                <div className="muted row-meta">Open {row.open} / Resolved {row.resolved}</div>
              </div>
              <span className="pill">{row.assigned} assigned</span>
            </div>
          ))}
        </div>
      </article>
      <GroupList title="Incidents By Severity" items={data.bySeverity} />
      <GroupList title="Incidents By Category" items={data.byCategory} />
      <GroupList title="Status Counts" items={data.statusCounts} />
      <article className="card">
        <div className="section-title">Trends & Users</div>
        <div className="metric-stack compact-stack">
          <div className="metric-row"><span>Average resolution</span><strong>{data.averageResolutionTime}</strong></div>
          <div className="metric-row"><span>Total users</span><strong>{data.users?.total ?? "--"}</strong></div>
          <div className="metric-row"><span>Reporters</span><strong>{data.users?.reporters ?? "--"}</strong></div>
          <div className="metric-row"><span>Responders</span><strong>{data.users?.responders ?? "--"}</strong></div>
          <div className="trend-strip">
            {(data.trends || []).map((row) => (
              <span key={row.date} style={{ height: `${Math.max(8, Math.min(100, row.count * 12))}%` }} title={`${row.date}: ${row.count}`} />
            ))}
          </div>
        </div>
      </article>
      <ActivityList title="Recent Notifications" items={data.notifications} />
    </section>
  </>
);

export const Dashboard = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const user = React.useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, []);

  useEffect(() => {
    const key = `dashboard:role:${user.role || "Reporter"}:${user.id || "me"}`;
    const cached = readCache(key);
    if (cached) setData(cached);

    api("/api/dashboard")
      .then((payload) => {
        setData(payload);
        writeCache(key, payload, 20_000);
      })
      .catch((err) => setError(err?.message || "Failed to load dashboard"));
  }, [user.id, user.role]);

  if (error) {
    return <div className="page"><section className="card empty-state">{error}</section></div>;
  }

  if (!data) {
    return <div className="page"><section className="card empty-state">Loading dashboard...</section></div>;
  }

  return (
    <div className="page dashboard-page">
      {data.role === "Admin" ? <AdminDashboard data={data} /> : null}
      {data.role === "Responder" ? <ResponderDashboard data={data} /> : null}
      {data.role === "Reporter" ? <ReporterDashboard data={data} /> : null}
    </div>
  );
};
