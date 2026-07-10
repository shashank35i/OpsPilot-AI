import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

export const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(() => JSON.parse(localStorage.getItem("user") || "{}") || {});

  useEffect(() => {
    api<{ user: any }>("/api/auth/me")
      .then((d) => {
        setUser(d.user || {});
        localStorage.setItem("user", JSON.stringify(d.user || {}));
      })
      .catch(() => {});
  }, []);

  const logout = async () => {
    await api("/api/auth/logout", { method: "POST" }).catch(() => {});
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="page">
      <section className="grid grid-2">
        <article className="card">
          <div className="section-title">Account</div>
          <h2 style={{ marginTop: 8 }}>{user.name || "User"}</h2>
          <div className="muted">{user.role || "Agent"}</div>
          <div className="list-lines" style={{ marginTop: 18 }}>
            <div><span>Contact</span><strong>{user.email || "-"}</strong></div>
            <div><span>Workspace</span><strong>Production</strong></div>
            <div><span>Model Access</span><strong>Enabled</strong></div>
          </div>
          <button className="btn" style={{ marginTop: 18 }} onClick={logout}>Logout</button>
        </article>

        <article className="card">
          <div className="section-title">Usage Snapshot</div>
          <div className="metric-stack">
            <div className="metric-row">
              <div className="muted">Actions this week</div>
              <strong>37</strong>
            </div>
            <div className="metric-row">
              <div className="muted">Incident touchpoints</div>
              <strong>18</strong>
            </div>
            <div className="metric-row">
              <div className="muted">Task updates</div>
              <strong>26</strong>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
};
