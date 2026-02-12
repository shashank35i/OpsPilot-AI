import React, { useEffect, useState } from "react";
import { API_BASE, api } from "../lib/api";

type SummaryResponse = {
  incidents: { open: number; investigating: number; mitigated: number; resolved: number };
  tasksOpen: number;
};

type HealthResponse = {
  ok: boolean;
  service?: string;
  version?: string;
  uptimeSeconds?: number;
};

export const Dashboard: React.FC = () => {
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const releaseTag = import.meta.env.VITE_APP_RELEASE || "prod";

  useEffect(() => {
    api<SummaryResponse>("/api/analytics/summary")
      .then(setSummary)
      .catch(() => setSummary(null));
    api<{ items: any[] }>("/api/activities")
      .then((d) => setActivities(d.items || []))
      .catch(() => setActivities([]));

    fetch(`${API_BASE}/api/health`)
      .then((res) => res.json())
      .then((d) => setHealth(d))
      .catch(() => setHealth(null));
  }, []);

  return (
    <div className="page">
      <section className="card hero-panel">
        <div>
          <div className="badge">Command Overview</div>
          <h1>Keep incidents aligned with SLAs and owners.</h1>
          <p className="muted">
            OpsPilot AI prioritizes workload using a local scoring model while your team executes with clear,
            audit-ready actions.
          </p>
        </div>
        <div className="kpi-grid">
          <div className="kpi-card">
            <span className="muted">Open incidents</span>
            <strong>{summary?.incidents?.open ?? "--"}</strong>
          </div>
          <div className="kpi-card">
            <span className="muted">Investigating</span>
            <strong>{summary?.incidents?.investigating ?? "--"}</strong>
          </div>
          <div className="kpi-card">
            <span className="muted">Tasks open</span>
            <strong>{summary?.tasksOpen ?? "--"}</strong>
          </div>
          <div className="kpi-card">
            <span className="muted">Resolved</span>
            <strong>{summary?.incidents?.resolved ?? "--"}</strong>
          </div>
        </div>
      </section>

      <section className="grid grid-2">
        <article className="card">
          <div className="section-title">Live Activity</div>
          <div className="timeline-list">
            {activities.length === 0 && <div className="muted">No recent activity.</div>}
            {activities.map((a) => (
              <div key={a._id} className="timeline-item">
                <div className="timeline-dot" />
                <div>
                  <div style={{ fontWeight: 600 }}>{a.message}</div>
                  <div className="muted" style={{ fontSize: 12 }}>
                    {new Date(a.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="card">
          <div className="section-title">Reliability Metrics</div>
          <div className="metric-stack">
            <div className="metric-row">
              <div>
                <div className="muted">SLA compliance</div>
                <strong>96%</strong>
              </div>
              <div className="sla-bar"><span style={{ width: "96%" }} /></div>
            </div>
            <div className="metric-row">
              <div className="muted">Mean time to mitigate</div>
              <strong>3h 12m</strong>
            </div>
            <div className="metric-row">
              <div className="muted">Escalations this week</div>
              <strong>4</strong>
            </div>
            <div className="metric-row">
              <div className="muted">Backend status</div>
              <strong>{health?.ok ? "Healthy" : "Unavailable"}</strong>
              <div className="muted" style={{ fontSize: 12 }}>
                {health?.version ? `Version ${health.version}` : "Version unknown"} · Release {releaseTag}
              </div>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
};
