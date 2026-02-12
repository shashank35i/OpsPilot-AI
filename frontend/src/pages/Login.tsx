import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../lib/api";

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

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

  const demo = async () => {
    setError("");
    try {
      const res = await api<{ token: string; user: any }>("/api/auth/demo", { method: "POST" });
      localStorage.setItem("token", res.token);
      localStorage.setItem("user", JSON.stringify(res.user));
      navigate("/app");
    } catch (err: any) {
      setError(err.message || "Demo login failed");
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 420, margin: "0 auto" }}>
      <div className="card">
        <h2>Sign in</h2>
        <p className="muted">Access your OpsPilot workspace.</p>
        {error && <div style={{ color: "var(--danger)" }}>{error}</div>}
        <form onSubmit={onSubmit} style={{ display: "grid", gap: 12, marginTop: 12 }}>
          <input className="input" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="input" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button className="btn primary" type="submit">Sign in</button>
        </form>
        <button className="btn" style={{ marginTop: 12 }} onClick={demo}>Demo login</button>
        <div className="muted" style={{ marginTop: 12 }}>
          New here? <Link to="/register">Create an account</Link>
        </div>
      </div>
    </div>
  );
};
