import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import { taskBadges } from "../lib/format";
import { readCache, writeCache } from "../lib/cache";
import { InboxIcon } from "lucide-react";

export const Tasks: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [busyId, setBusyId] = useState("");

  const load = async () => {
    const q = searchParams.get("q") || "";
    const query = q ? `?q=${encodeURIComponent(q)}` : "";
    const cacheKey = `tasks:list:${q || "all"}`;

    const cached = readCache<{ items: any[] }>(cacheKey);
    if (cached?.items) setItems(cached.items);

    const d = await api<{ items: any[] }>(`/api/tasks${query}`);
    setItems(d.items || []);
    writeCache(cacheKey, d, 20_000);
  };

  useEffect(() => {
    load().catch(() => setItems([]));
  }, [searchParams]);

  const create = async () => {
    if (!title.trim()) return;
    await api("/api/tasks", { method: "POST", body: JSON.stringify({ title, priority: "Medium" }) });
    setTitle("");
    load();
  };

  const updateTask = async (id: string, payload: { status?: string; priority?: string }) => {
    setBusyId(id);
    try {
      await api(`/api/tasks/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
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
          <h2 style={{ margin: "8px 0 0" }}>Operational task stream</h2>
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
                <th>Status</th>
                <th>Priority</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5}>
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
                const statusKey = i.status as keyof typeof taskBadges;
                const badge = taskBadges[statusKey] || { label: i.status, tone: "neutral" };
                return (
                  <tr key={i._id}>
                    <td>{i.title}</td>
                    <td><span className={`status-badge tone-${badge.tone}`}>{badge.label}</span></td>
                    <td><span className="pill">{i.priority}</span></td>
                    <td className="muted">{new Date(i.createdAt).toLocaleString()}</td>
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
