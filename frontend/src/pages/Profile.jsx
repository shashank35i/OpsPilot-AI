import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

export const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("user") || "{}") || {});
  const [prefs, setPrefs] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("notificationPreferences") || "") || { sla: true, assignments: true, summaries: false };
    } catch {
      return { sla: true, assignments: true, summaries: false };
    }
  });

  useEffect(() => {
    api("/api/auth/me")
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

  const togglePref = (key) => {
    setPrefs((current) => {
      const next = { ...current, [key]: !current[key] };
      localStorage.setItem("notificationPreferences", JSON.stringify(next));
      return next;
    });
  };

  return (
    <div className="page profile-page">
      <section className="grid grid-2">
        <article className="card">
          <div className="section-title">Account</div>
          <h2 style={{ marginTop: 8 }}>{user.name || "User"}</h2>
          <div className="list-lines" style={{ marginTop: 18 }}>
            <div><span>Email</span><strong>{user.email || "-"}</strong></div>
            <div><span>Role</span><strong>{user.role || "Reporter"}</strong></div>
          </div>
          <button className="btn" style={{ marginTop: 18 }} onClick={logout}>Logout</button>
        </article>

        <article className="card">
          <div className="section-title">Notification preferences</div>
          <div className="preference-list">
            <label><input type="checkbox" checked={prefs.sla} onChange={() => togglePref("sla")} /> SLA risk alerts</label>
            <label><input type="checkbox" checked={prefs.assignments} onChange={() => togglePref("assignments")} /> Assignment updates</label>
            <label><input type="checkbox" checked={prefs.summaries} onChange={() => togglePref("summaries")} /> Generated summaries</label>
          </div>
        </article>

        <article className="card">
          <div className="section-title">Password & security</div>
          <div className="empty-inline security-note">Authentication is managed by the current session. Use logout when leaving a shared device.</div>
        </article>
      </section>
    </div>
  );
};
