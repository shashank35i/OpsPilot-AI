import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import { incidentBadges, timeLeft } from "../lib/format";

export const Incidents: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [title, setTitle] = useState("");

  const load = () => api<{ items: any[] }>("/api/incidents").then((d) => setItems(d.items || []));

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    if (!title.trim()) return;
    await api("/api/incidents", { method: "POST", body: JSON.stringify({ title, severity: "Medium", slaHours: 12 }) });
    setTitle("");
    load();
  };

  return (
    <div className="grid" style={{ gap: 16 }}>
      <div className="card">
        <h2>Incidents</h2>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <input className="input" placeholder="New incident title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <button className="btn primary" onClick={create}>Create</button>
        </div>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Severity</th>
              <th>Priority</th>
              <th>SLA</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => {
              const badge = incidentBadges[i.status] || { label: i.status, color: "#64748b" };
              return (
                <tr key={i._id}>
                  <td>{i.title}</td>
                  <td><span className="pill" style={{ color: badge.color }}>{badge.label}</span></td>
                  <td>{i.severity}</td>
                  <td><span className="pill">{i.score?.label || "-"}</span></td>
                  <td className="muted">{timeLeft(i.dueAt)}</td>
                  <td className="muted">{new Date(i.createdAt).toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
