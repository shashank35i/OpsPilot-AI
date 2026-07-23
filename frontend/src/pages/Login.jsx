import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../lib/api";
import {
  ArrowLeftIcon,
  BellRingIcon,
  BriefcaseBusinessIcon,
  CheckCircle2Icon,
  MoonIcon,
  ShieldCheckIcon,
  SunIcon,
  TerminalSquareIcon,
  UserCheckIcon,
} from "lucide-react";
import { getTheme, setTheme } from "../lib/theme";
import { BrandMark } from "../components/BrandMark";

const rolePresets = [
  {
    role: "Reporter",
    email: "reporter@opspilot.ai",
    password: "Reporter@123",
    summary: "Create issues, track status, receive update requests.",
    Icon: UserCheckIcon,
  },
  {
    role: "Responder",
    email: "responder@opspilot.ai",
    password: "Responder@123",
    summary: "Claim work, update tickets, review severity, resolve incidents.",
    Icon: BriefcaseBusinessIcon,
  },
  {
    role: "Admin",
    email: "admin@opspilot.ai",
    password: "Admin@123",
    summary: "Manage queues, SLA policy, escalation, and system oversight.",
    Icon: ShieldCheckIcon,
  },
];

export const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [theme, setThemeState] = useState(getTheme());

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem("token", res.token);
      localStorage.setItem("user", JSON.stringify(res.user));
      navigate("/app");
    } catch (err) {
      setError(err.message || "Login failed");
    }
  };

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    setThemeState(next);
  };

  const applyPreset = (preset) => {
    setEmail(preset.email);
    setPassword(preset.password);
    setError("");
  };

  return (
    <div className="auth-page">
      <header className="auth-topbar">
        <Link to="/" className="back-link"><ArrowLeftIcon size={14} /> Back to home</Link>
        <Link to="/register" className="btn ghost lp-btn">Create account</Link>
      </header>

      <div className="auth-shell">
        <section className="auth-aside">
          <div className="auth-aside-inner">
            <div className="console-kicker">
              <TerminalSquareIcon size={14} />
              /auth/session/login
            </div>
            <h1>Access the incident command console.</h1>
            <p className="muted">
              Sign in as a seeded role to review the exact Reporter, Responder, and Admin workflows.
            </p>
            <div className="console-strip">
              <span>env</span>
              <strong>production</strong>
              <span>auth</span>
              <strong>jwt + session blacklist</strong>
            </div>
            <div className="auth-points command-list">
              <div><CheckCircle2Icon size={14} /> Role-scoped dashboard access</div>
              <div><BellRingIcon size={14} /> Live incident and SLA alerts</div>
              <div><ShieldCheckIcon size={14} /> Revoked-token enforcement</div>
            </div>
          </div>
        </section>

        <section className="auth-panel">
          <div className="auth-panel-inner">
            <div className="public-header">
              <div className="brand-stack">
                <BrandMark />
                <div>
                  <div className="brand">OpsPilot AI</div>
                  <div className="muted" style={{ fontSize: 13 }}>Sign in to workspace</div>
                </div>
              </div>
              <button className="theme-btn" onClick={toggleTheme} aria-label="Toggle theme">
                {theme === "dark" ? <SunIcon size={16} /> : <MoonIcon size={16} />}
              </button>
            </div>
            {error && <div className="error-box">{error}</div>}

            <form onSubmit={onSubmit} className="auth-form">
              <label className="field">
                <span>Email</span>
                <input className="input" placeholder="you@company.com" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </label>
              <label className="field">
                <span>Password</span>
                <input className="input" placeholder="Enter password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </label>
              <button className="btn primary" type="submit">Sign in</button>
            </form>

            <div className="role-presets" aria-label="Seeded role sign in options">
              <div className="section-title">Seeded role access</div>
              {rolePresets.map((preset) => (
                <button className="role-card" key={preset.role} type="button" onClick={() => applyPreset(preset)}>
                  <span className="role-icon"><preset.Icon size={16} /></span>
                  <span>
                    <strong>{preset.role}</strong>
                    <small>{preset.summary}</small>
                    <code>{preset.email}</code>
                  </span>
                </button>
              ))}
            </div>

            <div className="auth-actions">
              <p className="muted">New here? <Link to="/register">Create an account</Link></p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
