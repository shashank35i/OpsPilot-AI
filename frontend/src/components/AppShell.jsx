import React from "react";
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
} from "lucide-react";
import { getTheme, setTheme } from "../lib/theme";
import { BrandMark } from "./BrandMark";

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
            <div className="muted">Enterprise Command Suite</div>
          </div>
        </div>

        <div className="sidebar-badge">
          <SparklesIcon size={14} />
          <span>AI Scoring Online</span>
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
                Incident command and SLA intelligence
              </div>
            </div>
            <span className="pill hide-mobile">Production</span>
            <span className="pill hide-mobile">{user?.role || "Agent"}</span>
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
