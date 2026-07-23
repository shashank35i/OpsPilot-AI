import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import { displayName, formatDateTime, taskBadges } from "../lib/format";
import { readCache, writeCache } from "../lib/cache";
import { InboxIcon } from "lucide-react";

export const Tasks = () => {
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState("");
  const [busyId, setBusyId] = useState("");

  const clearTaskCaches = () => {
    Object.keys(localStorage)
      .filter((key) => key.startsWith("tasks:list:") || key.startsWith("analytics:"))
      .forEach((key) => localStorage.removeItem(key));
  };

  const load = async () => {
    const q = searchParams.get("q") || "";
    const query = q ? `?q=${encodeURIComponent(q)}` : "";
    const cacheKey = `tasks:list:${q || "all"}`;

    const cached = readCache(cacheKey);
    if (cached?.items) {
      setItems(cached.items);
      return;
    }

    const d = await api(`/api/tasks${query}`);
    setItems(d.items || []);
    writeCache(cacheKey, d, 20_000);
  };

  useEffect(() => {
    load().catch(() => setItems([]));
  }, [searchParams]);

  const create = async () => {
    if (!title.trim()) return;
    await api("/api/tasks", { method: "POST", body: JSON.stringify({ title, priority: "Medium" }) });
    clearTaskCaches();
    setTitle("");
    load();
  };

  const updateTask = async (id, payload) => {
    setBusyId(id);
    try {
      await api(`/api/tasks/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      clearTaskCaches();
      await load();
    } finally {
      setBusyId("");
    }
  };

  return (
    <div className="page">
      <section className="card toolbar-shell">
        <div>
          <div className="section-title">Execution Board</div>
          <h2 style={{ margin: "8px 0 0" }}>Operational tasks</h2>
          {searchParams.get("q") ? (
            <div className="muted" style={{ marginTop: 6 }}>Search: "{searchParams.get("q")}"</div>
          ) : null}
        </div>
        <div className="toolbar-controls">
          <input className="input" placeholder="New task" value={title} onChange={(e) => setTitle(e.target.value)} />
          <button className="btn primary" onClick={create}>Add task</button>
        </div>
      </section>

      <section className="card table-shell">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Related incident</th>
                <th>Assignee</th>
                <th>Status</th>
                <th>Due time</th>
                <th>Priority</th>
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
                        <strong>No tasks found</strong>
                        <p>Add a task or update your search query.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : null}
              {items.map((i) => {
                const badge = taskBadges[i.status] || { label: i.status, tone: "neutral" };
                return (
                  <tr key={i._id}>
                    <td>
                      <div className="incident-cell-title">{i.title}</div>
                      <div className="incident-cell-meta">Updated {formatDateTime(i.updatedAt)}</div>
                    </td>
                    <td>{i.incidentTitle || "No incident linked"}</td>
                    <td>{displayName(i.assigneeName)}</td>
                    <td><span className={`status-badge tone-${badge.tone}`}>{badge.label}</span></td>
                    <td className="muted">{i.dueAt ? formatDateTime(i.dueAt) : "No due time"}</td>
                    <td><span className="pill">{i.priority}</span></td>
                    <td>
                      <div className="row-actions">
                        <select
                          className="input compact"
                          disabled={busyId === i._id}
                          value={i.status}
                          onChange={(e) => updateTask(i._id, { status: e.target.value })}
                        >
                          <option value="Todo">Todo</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Done">Done</option>
                        </select>
                        <select
                          className="input compact"
                          disabled={busyId === i._id}
                          value={i.priority}
                          onChange={(e) => updateTask(i._id, { priority: e.target.value })}
                        >
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
