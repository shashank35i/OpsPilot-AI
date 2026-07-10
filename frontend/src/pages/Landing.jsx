import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRightIcon,
  MoonIcon,
  SunIcon,
  SparklesIcon,
  ActivityIcon,
  ShieldCheckIcon,
  WorkflowIcon,
  DatabaseZapIcon,
  ChevronDownIcon,
} from "lucide-react";
import { getTheme, setTheme } from "../lib/theme";
import { BrandMark } from "../components/BrandMark";

const metrics = [
  { label: "Incidents triaged", value: "2,253,323" },
  { label: "Workflow runs", value: "6,848,758" },
  { label: "Escalation actions", value: "29,003,436" },
  { label: "Audit log events", value: "371,079,791,342" },
];

const logos = [
  "Tripadvisor",
  "Cognizant",
  "Mercado Libre",
  "G2X",
  "Reducto",
  "Automattic",
  "hud",
  "Bilt",
  "MGM Resorts",
  "Chatbase",
  "Switzerland",
  "Numeral",
];

const featureRows = [
  {
    tag: "Incident Command",
    title: "Own every alert from intake to mitigation",
    body:
      "Standardize triage, assignment, and escalation with SLA-aware workflows that keep teams accountable.",
    Icon: ActivityIcon,
  },
  {
    tag: "Local Intelligence",
    title: "Run priority scoring without external model lock-in",
    body:
      "A local scoring model predicts urgency and ownership so response teams can move immediately with explainable logic.",
    Icon: DatabaseZapIcon,
  },
  {
    tag: "Governance",
    title: "Keep decision trails audit-ready by default",
    body:
      "Every change is tracked with immutable activity records, role controls, and enterprise-ready reporting.",
    Icon: ShieldCheckIcon,
  },
];

const navInfo = [
  {
    key: "product",
    label: "Product",
    items: [
      "Incident intake with SLA-aware triage",
      "Role-scoped command center for ops teams",
      "AI brief generation from live incident context",
    ],
  },
  {
    key: "workflows",
    label: "Workflows",
    items: [
      "Auto-generate remediation tasks from incidents",
      "Track execution status with real-time activity feed",
      "Close-loop updates for audit and governance",
    ],
  },
  {
    key: "customers",
    label: "Customers",
    items: [
      "Platform and SRE teams operating production systems",
      "Support and operations managers enforcing SLA compliance",
      "Leadership teams monitoring MTTR and reliability KPIs",
    ],
  },
  {
    key: "architecture",
    label: "Architecture",
    items: [
      "React + Vite frontend with mobile-first navigation",
      "Spring Boot + MySQL APIs with hybrid JWT/session auth",
      "Redis optional cache for high-read endpoints",
    ],
  },
];

export const Landing = () => {
  const [theme, setThemeState] = React.useState(getTheme());
  const [activeMenu, setActiveMenu] = React.useState("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("is-visible");
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -10% 0px" }
    );

    document.querySelectorAll(".reveal-section").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    setThemeState(next);
  };

  return (
    <div className="landing railway-look">
      <div className="lp-nav-wrap">
        <header className="lp-nav">
          <Link to="/" className="lp-brand">
            <BrandMark />
            <span className="lp-brand-text">
              <strong>OpsPilot AI</strong>
              <span>Incident command platform</span>
            </span>
          </Link>

          <nav className="lp-links" onMouseLeave={() => setActiveMenu("")}>
            {navInfo.map((group) => (
              <div
                key={group.key}
                className="lp-menu"
                onMouseEnter={() => setActiveMenu(group.key)}
              >
                <button className="lp-menu-trigger" type="button" aria-expanded={activeMenu === group.key}>
                  {group.label} <ChevronDownIcon size={14} />
                </button>
                <div className={`lp-menu-panel ${activeMenu === group.key ? "is-open" : ""}`}>
                  <div className="lp-menu-title">{group.label}</div>
                  <ul>
                    {group.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </nav>

          <div className="lp-actions">
            <button className="theme-btn" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === "dark" ? <SunIcon size={16} /> : <MoonIcon size={16} />}
            </button>
            <Link className="btn ghost lp-btn" to="/login">Sign in</Link>
          </div>
        </header>
      </div>

      <main className="lp-main">
        <section className="lp-hero reveal-section is-visible" id="product">
          <div className="lp-hero-copy">
            <div className="badge">
              <SparklesIcon size={14} />
              Developer-first incident platform
            </div>
            <h1>Ship incident response workflows with enterprise precision.</h1>
            <p>
              OpsPilot AI unifies incident intake, SLA timers, ownership, and execution into one command surface
              designed for high-scale ops teams.
            </p>
            <div className="lp-cta">
              <Link to="/app" className="btn primary lp-btn-inline">
                Open workspace <ArrowRightIcon size={14} />
              </Link>
              <Link to="/register" className="btn lp-btn-inline">Create account</Link>
            </div>
          </div>

          <aside className="lp-hero-panel">
            <div className="lp-panel-head">
              <span className="section-title">Live Ops Board</span>
              <span className="pill">Production</span>
            </div>
            <div className="lp-metric-grid">
              <article className="lp-metric-card">
                <span>SLA Compliance</span>
                <strong>96%</strong>
              </article>
              <article className="lp-metric-card">
                <span>MTTR</span>
                <strong>4h 02m</strong>
              </article>
              <article className="lp-metric-card">
                <span>Open Incidents</span>
                <strong>12</strong>
              </article>
              <article className="lp-metric-card">
                <span>Escalations</span>
                <strong>4</strong>
              </article>
            </div>
          </aside>
        </section>

        <section className="lp-counter reveal-section" id="workflows">
          <h2>29M+ deploys per month (and counting)</h2>
          <p>Real-time operations telemetry from incidents, workflows, and audit pipelines.</p>
          <div className="lp-counter-grid">
            {metrics.map((item) => (
              <article className="lp-counter-row" key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </article>
            ))}
          </div>
        </section>

        <section className="lp-logos reveal-section" id="customers">
          {logos.map((logo) => (
            <div className="logo-cell" key={logo}>{logo}</div>
          ))}
        </section>

        <section className="lp-flow reveal-section" id="architecture">
          <div className="flow-rail">
            <div className="flow-node" />
            <div className="flow-line" />
            <div className="flow-node" />
          </div>
          <div className="lp-flow-stack">
            {featureRows.map(({ tag, title, body, Icon }) => (
              <article className="lp-flow-card" key={title}>
                <div className="lp-flow-tag">
                  <Icon size={15} />
                  {tag}
                </div>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
            <article className="lp-flow-card lp-flow-cta">
              <div className="lp-flow-tag">
                <WorkflowIcon size={15} />
                Build and Deploy
              </div>
              <h3>Launch full-stack ops software without boilerplate overhead</h3>
              <p>
                MySQL, Redis cache acceleration, role-based portals, and actionable incident workflows are
                production-ready
                for Railway deployments.
              </p>
              <div className="lp-cta">
                <Link className="btn primary lp-btn-inline" to="/register">Create workspace</Link>
                <Link className="btn lp-btn-inline" to="/login">Sign in</Link>
              </div>
            </article>
          </div>
        </section>
      </main>

      <div className="lp-mobile-actions">
        <Link className="btn primary lp-btn-inline" to="/app">Open</Link>
        <Link className="btn lp-btn-inline" to="/register">Create</Link>
        <Link className="btn ghost lp-btn-inline" to="/login">Sign in</Link>
      </div>
    </div>
  );
};
