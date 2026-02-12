import React from "react";
import { Link } from "react-router-dom";
import {
  SparklesIcon,
  ShieldIcon,
  ClipboardListIcon,
  BarChart3Icon,
  ZapIcon,
} from "lucide-react";

export const Landing: React.FC = () => {
  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <div className="hero">
        <div className="card">
          <div className="badge">
            <SparklesIcon size={14} />
            AI Ops Copilot
          </div>
          <h1>OpsPilot AI keeps operational chaos under control.</h1>
          <p>
            A modern incident + task command center for teams. Track incidents,
            enforce SLAs, and let AI summarize and prioritize work.
          </p>
          <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
            <Link to="/login" className="btn primary">Sign in</Link>
            <Link to="/register" className="btn">Create account</Link>
          </div>
        </div>

        <div className="card">
          <div style={{ display: "flex", gap: 12, flexDirection: "column" }}>
            <div className="card" style={{ boxShadow: "none" }}>
              <strong>Live incident rooms</strong>
              <div className="muted">Auto summaries, owners, and SLA timers.</div>
            </div>
            <div className="card" style={{ boxShadow: "none" }}>
              <strong>Task intelligence</strong>
              <div className="muted">AI suggests next actions and assigns tasks.</div>
            </div>
            <div className="card" style={{ boxShadow: "none" }}>
              <strong>Leadership analytics</strong>
              <div className="muted">Resolution time, backlog, and risks.</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 24 }} className="grid grid-3">
        {[
          { title: "Incident Command", icon: ClipboardListIcon },
          { title: "SLA Analytics", icon: BarChart3Icon },
          { title: "AI Summaries", icon: ZapIcon },
        ].map((f) => (
          <div key={f.title} className="card">
            <f.icon size={18} />
            <h3 style={{ margin: "10px 0" }}>{f.title}</h3>
            <div className="muted">
              Built for teams that want clarity, speed, and accountability.
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 24 }} className="card">
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <ShieldIcon size={18} />
          <div>
            <strong>Enterprise-grade security</strong>
            <div className="muted">Role-based access and audit-ready logs.</div>
          </div>
        </div>
      </div>
    </div>
  );
};
