import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRightIcon,
  BellRingIcon,
  BrainCircuitIcon,
  CheckCircle2Icon,
  Clock3Icon,
  DatabaseIcon,
  ExternalLinkIcon,
  FileTextIcon,
  GitBranchIcon,
  GitPullRequestIcon,
  LockKeyholeIcon,
  MoonIcon,
  RadioTowerIcon,
  ServerIcon,
  ShieldCheckIcon,
  SunIcon,
  TerminalSquareIcon,
  UsersRoundIcon,
} from "lucide-react";
import { BrandMark } from "../components/BrandMark";
import { getTheme, setTheme } from "../lib/theme";

const statusRows = [
  ["Platform", "AWS production", "live"],
  ["Alerts", "WebSocket/STOMP", "connected"],
  ["Cache", "Redis", "ready"],
  ["Data", "MySQL", "online"],
  ["AI", "Gemini review", "enabled"],
];

const valuePoints = [
  "Role-scoped incident workflows",
  "Real-time SLA and incident alerts",
  "AI-assisted review with human approval",
];

const features = [
  {
    title: "Incident ownership",
    body: "Create, claim, assign, escalate, and resolve incidents through clear role-scoped workflows.",
    Icon: GitPullRequestIcon,
  },
  {
    title: "Real-time operations",
    body: "WebSocket alerts keep active users updated as incident status, ownership, and severity change.",
    Icon: RadioTowerIcon,
  },
  {
    title: "SLA monitoring",
    body: "Scheduled checks identify overdue and unassigned incidents before they are missed.",
    Icon: Clock3Icon,
  },
  {
    title: "Controlled access",
    body: "Reporter, Responder, and Admin permissions keep operational actions properly scoped.",
    Icon: LockKeyholeIcon,
  },
];

const aiCapabilities = [
  ["Severity validation", BrainCircuitIcon],
  ["Incident summaries", FileTextIcon],
  ["Troubleshooting recommendations", ShieldCheckIcon],
];

const engineeringPoints = [
  ["MySQL remains the source of truth", DatabaseIcon],
  ["Redis cache-aside reduces repeated dashboard reads", DatabaseIcon],
  ["Redis revocation enables immediate JWT logout", LockKeyholeIcon],
  ["Scheduled monitoring supports overdue and unassigned workflows", BellRingIcon],
];

const roles = [
  ["Reporter", "create and track incidents", UsersRoundIcon],
  ["Responder", "claim, investigate, and resolve", RadioTowerIcon],
  ["Admin", "assign work, review severity, and manage policies", ShieldCheckIcon],
];

const projectLinks = [
  ["Open live demo", "/login", false],
  ["View API docs", "https://github.com/shashank35i/OpsPilot-AI#api-overview", true],
  ["View architecture", "https://github.com/shashank35i/OpsPilot-AI#architecture", true],
  ["View GitHub", "https://github.com/shashank35i/OpsPilot-AI", true],
];

const evidence = [
  ["CI/CD", "GitHub Actions", GitBranchIcon],
  ["Tests", "JUnit + Mockito", CheckCircle2Icon],
  ["Backend", "Docker + EC2", ServerIcon],
  ["Frontend", "S3 + CloudFront", TerminalSquareIcon],
  ["Database", "Amazon RDS", DatabaseIcon],
];

const externalProps = {
  target: "_blank",
  rel: "noreferrer",
};

export const Landing = () => {
  const [theme, setThemeState] = React.useState(getTheme());

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    setThemeState(next);
  };

  return (
    <div className="landing landing-docs">
      <div className="lp-nav-wrap">
        <header className="lp-nav">
          <Link to="/" className="lp-brand" aria-label="OpsPilot AI home">
            <BrandMark />
            <span className="lp-brand-text">
              <strong>OpsPilot AI</strong>
              <span>Incident workflow platform</span>
            </span>
          </Link>

          <nav className="lp-links" aria-label="Landing navigation">
            <a href="#features">Features</a>
            <a href="#ai">AI</a>
            <a href="#architecture">Architecture</a>
            <a href="#project">Project</a>
          </nav>

          <div className="lp-actions">
            <button className="theme-btn" type="button" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === "dark" ? <SunIcon size={16} /> : <MoonIcon size={16} />}
            </button>
            <Link className="btn ghost lp-btn" to="/login">
              Open console
            </Link>
            <Link className="btn primary lp-btn hide-mobile" to="/register">
              Create reporter account
            </Link>
          </div>
        </header>
      </div>

      <main className="lp-main">
        <section className="lp-hero lp-docs-hero" id="platform">
          <div className="lp-hero-copy">
            <div className="console-kicker">
              <TerminalSquareIcon size={14} />
              opspilot / incident-workflow
            </div>
            <h1>Reliable incident response for role-based operations teams.</h1>
            <p>
              OpsPilot brings incident intake, ownership, SLA monitoring, real-time alerts,
              and AI-assisted severity review into one operational workspace.
            </p>

            <div className="lp-hero-points" aria-label="Platform highlights">
              {valuePoints.map((point) => (
                <span key={point}>{point}</span>
              ))}
            </div>

            <div className="lp-cta">
              <Link to="/login" className="btn primary lp-btn-inline">
                Open console <ArrowRightIcon size={14} />
              </Link>
              <Link to="/register" className="btn lp-btn-inline">
                Create reporter account
              </Link>
            </div>
          </div>

          <aside className="lp-status-panel" aria-label="System status summary">
            <div className="lp-terminal-head">
              <span>system/status</span>
              <strong>aws</strong>
            </div>
            <div className="lp-terminal-body">
              {statusRows.map(([label, detail, state]) => (
                <div className="lp-status-row" key={label}>
                  <code>{label}</code>
                  <span>{detail}</span>
                  <strong>{state}</strong>
                </div>
              ))}
            </div>
          </aside>
        </section>

        <section className="lp-section" id="features">
          <div className="lp-section-head">
            <span className="section-title">Features</span>
            <h2>Core workflows without extra noise.</h2>
          </div>
          <div className="lp-feature-grid lp-feature-grid-four">
            {features.map(({ title, body, Icon }) => (
              <article className="lp-feature-card" key={title}>
                <Icon size={18} />
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="lp-section lp-split-section" id="ai">
          <div className="lp-section-head">
            <span className="section-title">AI capabilities</span>
            <h2>Useful review support, kept behind human decisions.</h2>
            <p>AI suggestions support human review and never silently override operational decisions.</p>
          </div>
          <div className="lp-ai-grid">
            {aiCapabilities.map(([title, Icon]) => (
              <article className="lp-ai-card" key={title}>
                <Icon size={17} />
                <h3>{title}</h3>
              </article>
            ))}
          </div>
        </section>

        <section className="lp-section" id="architecture">
          <div className="lp-section-head">
            <span className="section-title">Architecture and reliability</span>
            <h2>Production pieces shown as a compact flow.</h2>
          </div>

          <div className="lp-architecture-flow" aria-label="Architecture flow">
            {["React + CloudFront", "Spring Boot on EC2", "Redis + Amazon RDS", "Gemini API"].map((item, index) => (
              <React.Fragment key={item}>
                <div className="lp-flow-node">{item}</div>
                {index < 3 && <ArrowRightIcon className="lp-flow-arrow" size={17} aria-hidden="true" />}
              </React.Fragment>
            ))}
          </div>

          <div className="lp-architecture-grid">
            {engineeringPoints.map(([title, Icon]) => (
              <article className="lp-architecture-item" key={title}>
                <Icon size={17} />
                <h3>{title}</h3>
              </article>
            ))}
          </div>
        </section>

        <section className="lp-section lp-role-section" id="roles">
          <div>
            <span className="section-title">Role demo</span>
            <h2>Three product paths.</h2>
            <p>Explore the product through three role-specific workflows.</p>
          </div>
          <div className="lp-role-grid">
            {roles.map(([name, scope, Icon]) => (
              <article className="lp-role-card" key={name}>
                <Icon size={17} />
                <strong>{name}</strong>
                <span>{scope}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="lp-section lp-split-section" id="project">
          <div className="lp-section-head">
            <span className="section-title">Explore the project</span>
            <h2>Demo, docs, architecture, and source in one place.</h2>
          </div>
          <div className="lp-doc-link-grid">
            {projectLinks.map(([label, href, external]) =>
              external ? (
                <a key={label} href={href} {...externalProps}>
                  <FileTextIcon size={16} />
                  <span>{label}</span>
                  <ExternalLinkIcon size={14} />
                </a>
              ) : (
                <Link key={label} to={href}>
                  <TerminalSquareIcon size={16} />
                  <span>{label}</span>
                  <ArrowRightIcon size={14} />
                </Link>
              ),
            )}
          </div>
        </section>

        <section className="lp-evidence" aria-label="Engineering evidence">
          <div className="lp-evidence-head">
            <span>Engineering evidence</span>
            <a
              href="https://github.com/shashank35i/OpsPilot-AI/actions/workflows/ci.yml"
              {...externalProps}
            >
              View latest CI run
            </a>
          </div>
          <div className="lp-evidence-grid">
            {evidence.map(([label, value, Icon]) => (
              <div className="lp-evidence-item" key={label}>
                <Icon size={16} />
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="lp-final-cta">
          <CheckCircle2Icon size={18} />
          <span>Ready to explore the incident workflow?</span>
          <div className="lp-final-actions">
            <Link to="/login" className="btn primary lp-btn-inline">
              Open console
            </Link>
            <a href="https://github.com/shashank35i/OpsPilot-AI" className="btn lp-btn-inline" {...externalProps}>
              View GitHub
            </a>
          </div>
        </section>
      </main>
    </div>
  );
};
