import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../lib/api";
import { ArrowLeftIcon, MoonIcon, SunIcon, SparklesIcon, ShieldCheckIcon, UserCheckIcon, LockKeyholeIcon } from "lucide-react";
import { getTheme, setTheme } from "../lib/theme";
import { BrandMark } from "../components/BrandMark";

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [theme, setThemeState] = useState<"dark" | "light">(getTheme());

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await api<{ token: string; user: any }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem("token", res.token);
      localStorage.setItem("user", JSON.stringify(res.user));
      navigate("/app");
    } catch (err: any) {
      setError(err.message || "Login failed");
    }
  };

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    setThemeState(next);
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
            <div className="badge">
              <SparklesIcon size={14} />
              Welcome back
            </div>
            <h1>Operate incidents with confidence and speed.</h1>
            <p className="muted">
              Access your command center to triage events, execute tasks, and keep every SLA under control.
            </p>
            <div className="auth-points">
              <div><ShieldCheckIcon size={14} /> Enterprise controls</div>
              <div><UserCheckIcon size={14} /> Role-based workflows</div>
              <div><LockKeyholeIcon size={14} /> Session and audit hardening</div>
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

            <div className="auth-actions">
              <p className="muted">New here? <Link to="/register">Create an account</Link></p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
