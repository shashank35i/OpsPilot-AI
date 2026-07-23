import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import { displayName, formatDateTime, incidentBadges, slaProgress, slaTone, timeLeft } from "../lib/format";
import { readCache, writeCache } from "../lib/cache";
import { InboxIcon } from "lucide-react";

const PAGE_SIZE = 25;

export const Incidents = () => {
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("Medium");
  const [category, setCategory] = useState("Operations");
  const [reviewSeverityById, setReviewSeverityById] = useState({});
  const [statusFilter, setStatusFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [ownershipFilter, setOwnershipFilter] = useState("");
  const [slaFilter, setSlaFilter] = useState("");
  const [localSearch, setLocalSearch] = useState("");
  const [expandedId, setExpandedId] = useState("");
  const [page, setPage] = useState(1);
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
    const cacheKey = `incidents:list:${user.role || "Reporter"}:${user.id || "me"}:${params.toString() || "all"}`;

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
      setInfo(err?.message === "Failed to fetch" ? "Unable to reach the incident service. Please try again." : err?.message || "Failed to load incidents");
    }
  };

  useEffect(() => {
    setPage(1);
    load().catch(() => {
      setItems([]);
      setInfo("Failed to load incidents");
    });
  }, [statusFilter, searchParams]);

  const filteredItems = useMemo(() => {
    const query = localSearch.trim().toLowerCase();
    return items.filter((incident) => {
      if (severityFilter && incident.severity !== severityFilter) return false;
      if (ownershipFilter === "mine" && incident.assignee !== user.id) return false;
      if (ownershipFilter === "unassigned" && incident.assignee) return false;
      if (slaFilter === "risk" && !["warning", "danger"].includes(slaTone(incident.dueAt))) return false;
      if (query) {
        const haystack = [incident.title, incident.description, incident.category, incident.assigneeName, incident.ownerName].join(" ").toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [items, localSearch, severityFilter, ownershipFilter, slaFilter, user.id]);

  const pageCount = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const visibleItems = filteredItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const expandedIncident = filteredItems.find((incident) => incident._id === expandedId);

  const create = async () => {
    const nextTitle = title.trim();
    if (!nextTitle) return;
    setIsCreating(true);
    setInfo("");
    try {
      await api("/api/incidents", {
        method: "POST",
        body: JSON.stringify({ title: nextTitle, description, severity, category }),
      });
      clearIncidentCaches();
      setTitle("");
      setDescription("");
      setSeverity("Medium");
      setCategory("Operations");
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
      setExpandedId(id);
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

  const stopAction = (event) => event.stopPropagation();
  const renderIncidentDetail = (incident) => (
    <div className="incident-detail-panel">
      <div>
        <div className="section-title">Details</div>
        <p>{incident.description || "No description provided."}</p>
        <div className="detail-grid">
          <span>Owner</span><strong>{displayName(incident.ownerName, "Unknown")}</strong>
          <span>Created</span><strong>{formatDateTime(incident.createdAt)}</strong>
          <span>Priority</span><strong>{incident.score?.label || "Unknown"}</strong>
          <span>Score</span><strong>{incident.score?.score ?? "Unknown"}</strong>
        </div>
      </div>
      {canRespond && incident.severityReviewStatus === "NeedsReview" ? (
        <div className="review-panel" onClick={stopAction}>
          <div className="section-title">Severity review</div>
          <p className="muted">{incident.severityReviewReason || "Reporter severity differs from system assessment."}</p>
          <div className="row-actions">
            <select className="input compact" value={reviewSeverityById[incident._id] || incident.geminiSeverity || incident.severity} onChange={(e) => setReviewSeverityById((prev) => ({ ...prev, [incident._id]: e.target.value }))}>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
            <button className="btn" disabled={busyId === incident._id} onClick={() => reviewSeverity(incident._id)}>Review</button>
          </div>
        </div>
      ) : null}
      {aiById[incident._id] ? (
        <div className="ai-brief">
          <div><strong>Summary:</strong> {aiById[incident._id].summary}</div>
          <div><strong>Plan:</strong> {aiById[incident._id].plan}</div>
        </div>
      ) : null}
    </div>
  );

  return (
    <div className="page">
      <section className="card toolbar-shell">
        <div className="console-section-head">
          <div>
            <div className="section-title">Incidents</div>
            <h2>Active queue</h2>
          </div>
          {searchParams.get("q") ? <div className="search-context">Search: "{searchParams.get("q")}"</div> : null}
        </div>
        <div className="toolbar-controls incident-filter-row">
          <input className="input compact" placeholder="Filter loaded rows" value={localSearch} onChange={(e) => { setLocalSearch(e.target.value); setPage(1); }} />
          <select className="input compact" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All status</option>
            <option value="Open">Open</option>
            <option value="Acknowledged">Acknowledged</option>
            <option value="In Progress">In Progress</option>
            <option value="Investigating">Investigating</option>
            <option value="Mitigated">Mitigated</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>
          <select className="input compact" value={severityFilter} onChange={(e) => { setSeverityFilter(e.target.value); setPage(1); }}>
            <option value="">All severity</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
          <select className="input compact" value={ownershipFilter} onChange={(e) => { setOwnershipFilter(e.target.value); setPage(1); }}>
            <option value="">All ownership</option>
            <option value="mine">Assigned to me</option>
            <option value="unassigned">Unassigned</option>
          </select>
          <select className="input compact" value={slaFilter} onChange={(e) => { setSlaFilter(e.target.value); setPage(1); }}>
            <option value="">All SLA</option>
            <option value="risk">At risk</option>
          </select>
        </div>
        {canCreate ? (
          <div className="incident-create-grid">
            <input className="input incident-title-input" placeholder="New incident title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <textarea className="input incident-description-input" placeholder="Incident description" value={description} rows={3} onChange={(e) => setDescription(e.target.value)} />
            <select className="input compact" value={severity} onChange={(e) => setSeverity(e.target.value)}>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
            <select className="input compact" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="Operations">Operations</option>
              <option value="Payments">Payments</option>
              <option value="Mobile">Mobile</option>
              <option value="Inventory">Inventory</option>
              <option value="Security">Security</option>
              <option value="Infrastructure">Infrastructure</option>
            </select>
            <button className="btn primary incident-create-btn" onClick={create} disabled={isCreating}>{isCreating ? "Creating..." : "Create"}</button>
          </div>
        ) : null}
        {info ? <div className="console-info-line">{info}</div> : null}
      </section>

      <section className="card table-shell">
        <div className="table-wrap">
          <table className="table incident-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Severity</th>
                <th>Assignee</th>
                <th>SLA</th>
                <th>Last updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleItems.length === 0 ? (
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
              {visibleItems.map((incident) => {
                const badge = incidentBadges[incident.status] || { label: incident.status, tone: "neutral" };
                const sla = slaProgress(incident.dueAt, incident.createdAt);
                const tone = slaTone(incident.dueAt);
                const expanded = expandedId === incident._id;
                return (
                  <React.Fragment key={incident._id}>
                    <tr className="clickable-table-row" onClick={() => setExpandedId((current) => (current === incident._id ? "" : incident._id))}>
                      <td>
                        <div className="incident-cell-title">{incident.title}</div>
                        <div className="incident-cell-meta">{incident.category || "Operations"}</div>
                      </td>
                      <td><span className={`status-badge tone-${badge.tone}`}>{badge.label}</span></td>
                      <td>
                        <div className="cell-stack">
                          <span className={`status-badge severity-${String(incident.severity || "").toLowerCase()}`}>{incident.severity}</span>
                          {incident.severityReviewStatus === "NeedsReview" ? <span className="cell-note">Needs review</span> : null}
                        </div>
                      </td>
                      <td>{displayName(incident.assigneeName)}</td>
                      <td>
                        <div className="cell-stack sla-stack">
                          <span className={`status-badge tone-${tone}`}>{timeLeft(incident.dueAt)}</span>
                          <div className="sla-bar"><span style={{ width: `${sla}%` }} /></div>
                        </div>
                      </td>
                      <td className="date-cell">{formatDateTime(incident.updatedAt)}</td>
                      <td onClick={stopAction}>
                        <div className="row-actions incident-actions">
                          {canRespond ? (
                            <>
                              <select className="input compact" value={incident.status} disabled={busyId === incident._id} onChange={(e) => updateIncidentStatus(incident._id, e.target.value)}>
                                <option value="Open">Open</option>
                                <option value="Acknowledged">Acknowledged</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Investigating">Investigating</option>
                                <option value="Mitigated">Mitigated</option>
                                <option value="Resolved">Resolved</option>
                                <option value="Closed">Closed</option>
                              </select>
                              {!incident.assignee ? <button className="btn primary" disabled={busyId === incident._id} onClick={() => claimIncident(incident._id)}>Claim</button> : null}
                              <button className="btn ghost" disabled={busyId === incident._id} onClick={() => generateAiBrief(incident._id)}>Generate summary</button>
                              <button className="btn ghost" disabled={busyId === incident._id} onClick={() => createAutoTasks(incident._id)}>Suggest tasks</button>
                              {incident.status !== "Resolved" ? <button className="btn" disabled={busyId === incident._id} onClick={() => resolveIncident(incident._id)}>Resolve</button> : null}
                            </>
                          ) : <span className="muted">Reporter view</span>}
                        </div>
                      </td>
                    </tr>
                    {expanded ? (
                      <tr className="incident-detail-row">
                        <td colSpan={7}>
                          {renderIncidentDetail(incident)}
                        </td>
                      </tr>
                    ) : null}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        {expandedIncident ? (
          <div className="mobile-incident-detail">
            {renderIncidentDetail(expandedIncident)}
          </div>
        ) : null}
        {filteredItems.length > PAGE_SIZE ? (
          <div className="table-footer">
            <span className="muted">{filteredItems.length} incidents / page {page} of {pageCount}</span>
            <div className="row-actions">
              <button className="btn" disabled={page === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</button>
              <button className="btn" disabled={page === pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>Next</button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
};
