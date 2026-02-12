import React, { useEffect, useState } from "react";
import { api } from "../lib/api";

const priorityColor: Record<string, string> = {
  Low: "#22c55e",
  Medium: "#f59e0b",
  High: "#ef4444",
};

export const Tasks: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [title, setTitle] = useState("");

  const load = () => api<{ items: any[] }>("/api/tasks").then((d) => setItems(d.items || []));

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    if (!title.trim()) return;
    await api("/api/tasks", { method: "POST", body: JSON.stringify({ title, priority: "Medium" }) });
    setTitle("");
    load();
  };

  return (
    <div className="grid" style={{ gap: 16 }}>
      <div className="card">
        <h2>Tasks</h2>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <input className="input" placeholder="New task" value={title} onChange={(e) => setTitle(e.target.value)} />
          <button className="btn primary" onClick={create}>Add</button>
        </div>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i._id}>
                <td>{i.title}</td>
                <td><span className="pill">{i.status}</span></td>
                <td><span className="pill" style={{ color: priorityColor[i.priority] || "#64748b" }}>{i.priority}</span></td>
                <td className="muted">{new Date(i.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
