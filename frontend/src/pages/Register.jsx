import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../lib/api";
import { ArrowLeftIcon, MoonIcon, SunIcon, SparklesIcon, UserCheckIcon, ShieldCheckIcon, WorkflowIcon } from "lucide-react";
import { getTheme, setTheme } from "../lib/theme";
import { BrandMark } from "../components/BrandMark";

export const Register = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [theme, setThemeState] = useState(getTheme());

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await api("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password, role: "Reporter" }),
      });
      localStorage.setItem("token", res.token);
      localStorage.setItem("user", JSON.stringify(res.user));
      navigate("/app");
    } catch (err) {
      setError(err.message || "Registration failed");
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
        <Link to="/login" className="btn ghost lp-btn">Sign in</Link>
      </header>

      <div className="auth-shell">
        <section className="auth-aside">
          <div className="auth-aside-inner">
            <div className="badge">
              <SparklesIcon size={14} />
              Set up your workspace
            </div>
            <h1>Create an operations command center in minutes.</h1>
            <p className="muted">
              Spin up your workspace and onboard teams into role-based incident management.
            </p>
            <div className="auth-points">
              <div><UserCheckIcon size={14} /> Team onboarding ready</div>
              <div><ShieldCheckIcon size={14} /> Secure by default</div>
              <div><WorkflowIcon size={14} /> Workflow templates included</div>
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
                  <div className="muted" style={{ fontSize: 13 }}>Create account</div>
                </div>
              </div>
              <button className="theme-btn" onClick={toggleTheme} aria-label="Toggle theme">
                {theme === "dark" ? <SunIcon size={16} /> : <MoonIcon size={16} />}
              </button>
            </div>
            {error && <div className="error-box">{error}</div>}

            <form onSubmit={onSubmit} className="auth-form">
              <label className="field">
                <span>Full name</span>
                <input className="input" placeholder="Shashank Preetham" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
              </label>
              <label className="field">
                <span>Email</span>
                <input className="input" placeholder="you@company.com" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </label>
              <label className="field">
                <span>Password</span>
                <input className="input" placeholder="Create password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </label>
              <button className="btn primary" type="submit">Create account</button>
            </form>

            <div className="auth-actions">
              <p className="muted">Already have an account? <Link to="/login">Sign in</Link></p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
