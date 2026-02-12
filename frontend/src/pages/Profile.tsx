import React from "react";
import { useNavigate } from "react-router-dom";

export const Profile: React.FC = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}") || {};

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="card" style={{ maxWidth: 520 }}>
      <h2>Profile</h2>
      <div className="muted">{user.role || "Agent"}</div>
      <div style={{ marginTop: 12 }}>
        <strong>{user.name || "User"}</strong>
        <div className="muted">{user.email || ""}</div>
      </div>
      <button className="btn" style={{ marginTop: 16 }} onClick={logout}>Logout</button>
    </div>
  );
};
