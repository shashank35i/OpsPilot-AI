import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import { incidentBadges, slaProgress, slaTone, timeLeft } from "../lib/format";
import { readCache, writeCache } from "../lib/cache";
import { InboxIcon } from "lucide-react";

export const Incidents = () => {
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("Medium");
  const [reviewSeverityById, setReviewSeverityById] = useState({});
  const [statusFilter, setStatusFilter] = useState("");
  const [busyId, setBusyId] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [aiById, setAiById] = useState({});
  const [info, setInfo] = useState("");
  const user = React.useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, []);
  const canCreate = user.role === "Reporter" || user.role === "Admin";
  const canRespond = user.role === "Responder" || user.role === "Admin";

  const clearIncidentCaches = () => {
    Object.keys(localStorage)
      .filter((key) => key.startsWith("incidents:list:") || key.startsWith("dashboard:") || key.startsWith("analytics:"))
      .forEach((key) => localStorage.removeItem(key));
  };

  const load = async () => {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    const q = searchParams.get("q") || "";
    if (q) params.set("q", q);
    const query = params.toString() ? `?${params.toString()}` : "";
    const cacheKey = `incidents:list:${params.toString() || "all"}`;

    const cached = readCache(cacheKey);
    if (cached?.items) {
      setItems(cached.items);
      return;
    }

    try {
      const data = await api(`/api/incidents${query}`);
      setItems(data.items || []);
      writeCache(cacheKey, data, 20_000);
    } catch (err) {
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
        body: JSON.stringify({ title: nextTitle, description, severity }),
      });
      clearIncidentCaches();
      setTitle("");
      setDescription("");
      setSeverity("Medium");
      await load();
      setInfo("Incident created successfully.");
    } catch (err) {
      setInfo(err?.message || "Failed to create incident");
    } finally {
      setIsCreating(false);
    }
  };

  const updateIncidentStatus = async (id, status) => {
    setBusyId(id);
    setInfo("");
    try {
      await api(`/api/incidents/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      clearIncidentCaches();
      await load();
    } finally {
      setBusyId("");
    }
  };

  const generateAiBrief = async (id) => {
    setBusyId(id);
    setInfo("");
    try {
      const data = await api("/api/ai/incident-summary", {
        method: "POST",
        body: JSON.stringify({ incidentId: id }),
      });
      setAiById((prev) => ({ ...prev, [id]: data }));
    } finally {
      setBusyId("");
    }
  };

  const createAutoTasks = async (id) => {
    setBusyId(id);
    setInfo("");
    try {
      const data = await api(`/api/incidents/${id}/auto-tasks`, { method: "POST" });
      clearIncidentCaches();
      setInfo(`Created ${data.items?.length || 0} execution tasks for this incident.`);
    } finally {
      setBusyId("");
    }
  };

  const claimIncident = async (id) => {
    setBusyId(id);
    setInfo("");
    try {
      await api(`/api/incidents/${id}/claim`, { method: "POST" });
      clearIncidentCaches();
      await load();
      setInfo("Incident claimed.");
    } catch (err) {
      setInfo(err?.message || "Failed to claim incident");
    } finally {
      setBusyId("");
    }
  };

  const reviewSeverity = async (id) => {
    const nextSeverity = reviewSeverityById[id] || "Medium";
    setBusyId(id);
    setInfo("");
    try {
      await api(`/api/incidents/${id}/review-severity`, {
        method: "POST",
        body: JSON.stringify({ severity: nextSeverity, note: "Reviewed from responder console." }),
      });
      clearIncidentCaches();
      await load();
      setInfo("Severity review saved.");
    } catch (err) {
      setInfo(err?.message || "Failed to review severity");
    } finally {
      setBusyId("");
    }
  };

  const resolveIncident = async (id) => {
    setBusyId(id);
    setInfo("");
    try {
      await api(`/api/incidents/${id}/resolve`, { method: "POST" });
      clearIncidentCaches();
      await load();
      setInfo("Incident resolved.");
    } catch (err) {
      setInfo(err?.message || "Failed to resolve incident");
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
            <option value="Acknowledged">Acknowledged</option>
            <option value="In Progress">In Progress</option>
            <option value="Investigating">Investigating</option>
            <option value="Mitigated">Mitigated</option>
            <option value="Resolved">Resolved</option>
          </select>
          {canCreate ? (
            <>
              <select className="input compact" value={severity} onChange={(e) => setSeverity(e.target.value)}>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
              <input
                className="input"
                placeholder="New incident title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <textarea
                className="input"
                placeholder="Incident description"
                value={description}
                rows={2}
                onChange={(e) => setDescription(e.target.value)}
              />
              <button className="btn primary" onClick={create} disabled={isCreating}>
                {isCreating ? "Creating..." : "Create"}
              </button>
            </>
          ) : null}
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
                const badge = incidentBadges[i.status] || { label: i.status, tone: "neutral" };
                const sla = slaProgress(i.dueAt, i.createdAt);
                const tone = slaTone(i.dueAt);
                return (
                  <React.Fragment key={i._id}>
                    <tr>
                      <td>
                        <div style={{ fontWeight: 600 }}>{i.title}</div>
                        <div className="muted" style={{ fontSize: 12 }}>
                          {i.assignee ? "Assigned" : "Unassigned"}
                          {i.severityReviewStatus === "NeedsReview" ? " · Severity review required" : ""}
                        </div>
                        {i.description ? <div className="muted" style={{ fontSize: 12 }}>{i.description}</div> : null}
                      </td>
                      <td><span className={`status-badge tone-${badge.tone}`}>{badge.label}</span></td>
                      <td>
                        <div style={{ display: "grid", gap: 4 }}>
                          <span>{i.severity}</span>
                          {i.reportedSeverity && i.reportedSeverity !== i.severity ? (
                            <span className="muted" style={{ fontSize: 12 }}>Reporter: {i.reportedSeverity}</span>
                          ) : null}
                          {i.geminiSeverity ? (
                            <span className="muted" style={{ fontSize: 12 }}>Gemini: {i.geminiSeverity}</span>
                          ) : null}
                        </div>
                      </td>
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
                          {canRespond ? (
                            <>
                              <select
                                className="input compact"
                                value={i.status}
                                disabled={busyId === i._id}
                                onChange={(e) => updateIncidentStatus(i._id, e.target.value)}
                              >
                                <option value="Open">Open</option>
                                <option value="Acknowledged">Acknowledged</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Investigating">Investigating</option>
                                <option value="Mitigated">Mitigated</option>
                                <option value="Resolved">Resolved</option>
                              </select>
                              {!i.assignee ? (
                                <button className="btn primary" disabled={busyId === i._id} onClick={() => claimIncident(i._id)}>
                                  Claim
                                </button>
                              ) : null}
                              {i.severityReviewStatus === "NeedsReview" ? (
                                <>
                                  <select
                                    className="input compact"
                                    value={reviewSeverityById[i._id] || i.geminiSeverity || i.severity}
                                    onChange={(e) => setReviewSeverityById((prev) => ({ ...prev, [i._id]: e.target.value }))}
                                  >
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                    <option value="Critical">Critical</option>
                                  </select>
                                  <button className="btn" disabled={busyId === i._id} onClick={() => reviewSeverity(i._id)}>
                                    Review
                                  </button>
                                </>
                              ) : null}
                              <button className="btn ghost" disabled={busyId === i._id} onClick={() => generateAiBrief(i._id)}>
                                AI brief
                              </button>
                              <button className="btn" disabled={busyId === i._id} onClick={() => createAutoTasks(i._id)}>
                                Auto tasks
                              </button>
                              {i.status !== "Resolved" ? (
                                <button className="btn" disabled={busyId === i._id} onClick={() => resolveIncident(i._id)}>
                                  Resolve
                                </button>
                              ) : null}
                            </>
                          ) : (
                            <span className="muted">Reporter view</span>
                          )}
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
