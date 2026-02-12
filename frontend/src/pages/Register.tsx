import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../lib/api";

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await api<{ token: string; user: any }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password, role: "Manager" }),
      });
      localStorage.setItem("token", res.token);
      localStorage.setItem("user", JSON.stringify(res.user));
      navigate("/app");
    } catch (err: any) {
      setError(err.message || "Registration failed");
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 420, margin: "0 auto" }}>
      <div className="card">
        <h2>Create account</h2>
        <p className="muted">Launch your OpsPilot workspace.</p>
        {error && <div style={{ color: "var(--danger)" }}>{error}</div>}
        <form onSubmit={onSubmit} style={{ display: "grid", gap: 12, marginTop: 12 }}>
          <input className="input" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="input" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="input" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button className="btn primary" type="submit">Create account</button>
        </form>
        <div className="muted" style={{ marginTop: 12 }}>
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
};
