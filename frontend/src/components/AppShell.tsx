import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  HomeIcon,
  AlertTriangleIcon,
  CheckSquareIcon,
  BarChart3Icon,
  UserIcon,
} from "lucide-react";

const navItems = [
  { to: "/app", label: "Home", Icon: HomeIcon },
  { to: "/app/incidents", label: "Incidents", Icon: AlertTriangleIcon },
  { to: "/app/tasks", label: "Tasks", Icon: CheckSquareIcon },
  { to: "/app/analytics", label: "Analytics", Icon: BarChart3Icon },
  { to: "/app/profile", label: "Profile", Icon: UserIcon },
];

export const AppShell: React.FC = () => {
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">OpsPilot AI</div>
        <div className="muted">AI Operations Copilot</div>

        <div className="nav-group">
          {navItems.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
              end={to === "/app"}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </div>
      </aside>

      <div className="content">
        <header className="header">
          <div>
            <div style={{ fontWeight: 700 }}>OpsPilot AI</div>
            <div className="muted" style={{ fontSize: 12 }}>
              Real-time incident command
            </div>
          </div>
          <div className="muted" style={{ fontSize: 12 }}>
            Production workspace
          </div>
        </header>

        <main className="main">
          <Outlet />
        </main>
      </div>

      <nav className="bottom-nav">
        {navItems.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => (isActive ? "active" : "")}
            end={to === "/app"}
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};
