import React from "react";
import { Client } from "@stomp/stompjs";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  HomeIcon,
  AlertTriangleIcon,
  CheckSquareIcon,
  BarChart3Icon,
  UserIcon,
  MoonIcon,
  SunIcon,
  SparklesIcon,
  SearchIcon,
  BellIcon,
  CommandIcon,
  ServerIcon,
} from "lucide-react";
import { getTheme, setTheme } from "../lib/theme";
import { BrandMark } from "./BrandMark";
import { API_BASE } from "../lib/api";

const navItems = [
  { to: "/app", label: "Home", Icon: HomeIcon },
  { to: "/app/incidents", label: "Incidents", Icon: AlertTriangleIcon },
  { to: "/app/tasks", label: "Tasks", Icon: CheckSquareIcon },
  { to: "/app/analytics", label: "Analytics", Icon: BarChart3Icon },
  { to: "/app/profile", label: "Profile", Icon: UserIcon },
];

export const AppShell = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [theme, setThemeState] = React.useState(getTheme());
  const [search, setSearch] = React.useState("");
  const [alerts, setAlerts] = React.useState([]);
  const [showAlerts, setShowAlerts] = React.useState(false);
  const user = React.useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    setThemeState(next);
  };

  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    setSearch(params.get("q") || "");
  }, [location.search]);

  React.useEffect(() => {
    if (!user?.role) return undefined;
    const wsUrl = (import.meta.env.VITE_WS_URL || `${API_BASE}/ws`).replace(/^http/, "ws");
    const client = new Client({
      brokerURL: wsUrl,
      reconnectDelay: 5000,
      onConnect: () => {
        const addAlert = (message) => {
          try {
            const payload = JSON.parse(message.body);
            setAlerts((prev) => [payload, ...prev].slice(0, 8));
          } catch {
            // Ignore malformed alert payloads.
          }
        };

        if (user.id) client.subscribe(`/queue/users/${user.id}/alerts`, addAlert);
        if (user.role === "Responder" || user.role === "Admin") client.subscribe("/topic/responders/alerts", addAlert);
        if (user.role === "Admin") client.subscribe("/topic/admin/alerts", addAlert);
      },
    });
    client.activate();
    return () => client.deactivate();
  }, [user?.id, user?.role]);

  const onSearchSubmit = (e) => {
    e.preventDefault();
    const q = search.trim();
    if (!q) {
      navigate("/app/incidents");
      return;
    }
    navigate(`/app/incidents?q=${encodeURIComponent(q)}`);
  };

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand-stack">
          <BrandMark />
          <div>
            <div className="brand">OpsPilot AI</div>
            <div className="muted">Incident command console</div>
          </div>
        </div>

        <div className="sidebar-context">
          <div>
            <span>workspace</span>
            <strong>opspilot-prod</strong>
          </div>
          <div>
            <span>role</span>
            <strong>{user?.role || "Reporter"}</strong>
          </div>
        </div>

        <div className="sidebar-badge">
          <SparklesIcon size={14} />
          <span>Gemini severity online</span>
        </div>

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
          <div className="left">
            <div className="workspace">
              <div style={{ fontWeight: 700 }}>OpsPilot AI</div>
              <div className="muted" style={{ fontSize: 12 }}>
                Incident command / SLA operations
              </div>
            </div>
            <span className="pill hide-mobile"><ServerIcon size={12} /> Production</span>
            <span className="pill hide-mobile"><CommandIcon size={12} /> {user?.role || "Reporter"}</span>
          </div>

          <div className="right">
            <form className="app-search hide-mobile" onSubmit={onSearchSubmit}>
              <input
                className="input search"
                placeholder="Search incidents, tasks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button className="theme-btn" type="submit" aria-label="Search">
                <SearchIcon size={16} />
              </button>
            </form>
            <div style={{ position: "relative" }}>
              <button className="theme-btn" onClick={() => setShowAlerts((open) => !open)} aria-label="Alerts">
                <BellIcon size={16} />
                {alerts.length ? <span className="alert-dot" /> : null}
              </button>
              {showAlerts ? (
                <div className="alert-tray">
                  {alerts.length === 0 ? (
                    <div className="muted">No live alerts</div>
                  ) : (
                    alerts.map((alert, index) => (
                      <div className="alert-item" key={`${alert.type}-${alert.incidentId}-${index}`}>
                        <strong>{alert.type}</strong>
                        <span>{alert.message}</span>
                      </div>
                    ))
                  )}
                </div>
              ) : null}
            </div>
            <button className="theme-btn" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === "dark" ? <SunIcon size={16} /> : <MoonIcon size={16} />}
            </button>
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
