import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import { incidentBadges, slaProgress, slaTone, timeLeft } from "../lib/format";
import { readCache, writeCache } from "../lib/cache";
import { InboxIcon } from "lucide-react";

export const Incidents: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [busyId, setBusyId] = useState<string>("");
  const [isCreating, setIsCreating] = useState(false);
  const [aiById, setAiById] = useState<Record<string, { summary: string; plan: string }>>({});
  const [info, setInfo] = useState("");

  const load = async () => {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    const q = searchParams.get("q") || "";
    if (q) params.set("q", q);
    const query = params.toString() ? `?${params.toString()}` : "";
    const cacheKey = `incidents:list:${params.toString() || "all"}`;

    const cached = readCache<{ items: any[] }>(cacheKey);
    if (cached?.items) {
      setItems(cached.items);
      return;
    }

    try {
      const data = await api<{ items: any[] }>(`/api/incidents${query}`);
      setItems(data.items || []);
      writeCache(cacheKey, data, 20_000);
    } catch (err: any) {
      setItems([]);
      setInfo(err?.message || "Failed to load incidents");
    }
  };

  useEffect(() => {
    load().catch(() => {
      setItems([]);
      setInfo("Failed to load incidents");
    });
  }, [statusFilter, searchParams]);

  const create = async () => {
    const nextTitle = title.trim();
    if (!nextTitle) return;
    setIsCreating(true);
    setInfo("");
    try {
      await api("/api/incidents", {
        method: "POST",
        body: JSON.stringify({ title: nextTitle, severity: "Medium", slaHours: 12 }),
      });
      setTitle("");
      await load();
      setInfo("Incident created successfully.");
    } catch (err: any) {
      setInfo(err?.message || "Failed to create incident");
    } finally {
      setIsCreating(false);
    }
  };

  const updateIncidentStatus = async (id: string, status: string) => {
    setBusyId(id);
    setInfo("");
    try {
      await api(`/api/incidents/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await load();
    } finally {
      setBusyId("");
    }
  };

  const generateAiBrief = async (id: string) => {
    setBusyId(id);
    setInfo("");
    try {
      const data = await api<{ summary: string; plan: string }>("/api/ai/incident-summary", {
        method: "POST",
        body: JSON.stringify({ incidentId: id }),
      });
      setAiById((prev) => ({ ...prev, [id]: data }));
    } finally {
      setBusyId("");
    }
  };

  const createAutoTasks = async (id: string) => {
    setBusyId(id);
    setInfo("");
    try {
      const data = await api<{ items: any[] }>(`/api/incidents/${id}/auto-tasks`, { method: "POST" });
      setInfo(`Created ${data.items?.length || 0} execution tasks for this incident.`);
    } finally {
      setBusyId("");
    }
  };

  return (
    <div className="page">
      <section className="card toolbar-shell">
        <div>
          <div className="section-title">Incident Intake</div>
          <h2 style={{ margin: "8px 0 0" }}>Active incident queue</h2>
          {searchParams.get("q") ? (
            <div className="muted" style={{ marginTop: 6 }}>Search: "{searchParams.get("q")}"</div>
          ) : null}
        </div>
        <div className="toolbar-controls">
          <select className="input compact" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All status</option>
            <option value="Open">Open</option>
            <option value="Investigating">Investigating</option>
            <option value="Mitigated">Mitigated</option>
            <option value="Resolved">Resolved</option>
          </select>
          <input
            className="input"
            placeholder="New incident title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <button className="btn primary" onClick={create} disabled={isCreating}>
            {isCreating ? "Creating..." : "Create"}
          </button>
        </div>
        {info ? <div className="muted">{info}</div> : null}
      </section>

      <section className="card table-shell">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Severity</th>
                <th>Priority</th>
                <th>SLA</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state empty-table-state">
                      <InboxIcon size={20} />
                      <div>
                        <strong>No incidents found</strong>
                        <p>Create a new incident or adjust search and filters.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : null}
              {items.map((i) => {
                const statusKey = i.status as keyof typeof incidentBadges;
                const badge = incidentBadges[statusKey] || { label: i.status, tone: "neutral" };
                const sla = slaProgress(i.dueAt, i.createdAt);
                const tone = slaTone(i.dueAt);
                return (
                  <React.Fragment key={i._id}>
                    <tr>
                      <td>
                        <div style={{ fontWeight: 600 }}>{i.title}</div>
                        <div className="muted" style={{ fontSize: 12 }}>
                          Owner: {i.owner ? "Assigned" : "Unassigned"}
                        </div>
                      </td>
                      <td><span className={`status-badge tone-${badge.tone}`}>{badge.label}</span></td>
                      <td>{i.severity}</td>
                      <td>
                        <div style={{ display: "grid", gap: 4 }}>
                          <span className="pill">{i.score?.label || "-"}</span>
                          <span className="muted" style={{ fontSize: 12 }}>Score: {i.score?.score ?? "--"}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "grid", gap: 6 }}>
                          <span className={`status-badge tone-${tone}`}>{timeLeft(i.dueAt)}</span>
                          <div className="sla-bar">
                            <span style={{ width: `${sla}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="muted">{new Date(i.createdAt).toLocaleString()}</td>
                      <td>
                        <div className="row-actions">
                          <select
                            className="input compact"
                            value={i.status}
                            disabled={busyId === i._id}
                            onChange={(e) => updateIncidentStatus(i._id, e.target.value)}
                          >
                            <option value="Open">Open</option>
                            <option value="Investigating">Investigating</option>
                            <option value="Mitigated">Mitigated</option>
                            <option value="Resolved">Resolved</option>
                          </select>
                          <button className="btn ghost" disabled={busyId === i._id} onClick={() => generateAiBrief(i._id)}>
                            AI brief
                          </button>
                          <button className="btn" disabled={busyId === i._id} onClick={() => createAutoTasks(i._id)}>
                            Auto tasks
                          </button>
                        </div>
                      </td>
                    </tr>
                    {aiById[i._id] ? (
                      <tr>
                        <td colSpan={7}>
                          <div className="ai-brief">
                            <div><strong>Summary:</strong> {aiById[i._id].summary}</div>
                            <div><strong>Plan:</strong> {aiById[i._id].plan}</div>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
