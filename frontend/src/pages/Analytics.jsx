import React, { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { readCache, writeCache } from "../lib/cache";
import { InboxIcon } from "lucide-react";

const sumValues = (items = {}) => Object.values(items).reduce((total, value) => total + Number(value || 0), 0);
const maxValue = (values) => Math.max(1, ...values.map((value) => Number(value || 0)));

const Kpi = ({ label, value }) => (
  <article className="card kpi-card">
    <span className="muted">{label}</span>
    <strong>{value ?? "--"}</strong>
  </article>
);

const Bars = ({ title, items = {} }) => {
  const rows = Object.entries(items).sort((a, b) => Number(b[1]) - Number(a[1]));
  const max = maxValue(rows.map(([, value]) => value));
  return (
    <article className="card analytics-card">
      <div className="section-title">{title}</div>
      <div className="bar-list">
        {rows.length === 0 ? <div className="empty-inline">No data yet</div> : null}
        {rows.map(([label, value]) => (
          <div className="bar-row" key={label}>
            <span>{label}</span>
            <div><i style={{ width: `${(Number(value || 0) / max) * 100}%` }} /></div>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
    </article>
  );
};

const Trend = ({ title, rows = [], keys }) => {
  const max = maxValue(rows.flatMap((row) => keys.map((key) => row[key])));
  return (
    <article className="card analytics-card">
      <div className="section-title">{title}</div>
      <div className="trend-chart">
        {rows.length === 0 ? <div className="empty-inline">No trend data yet</div> : null}
        {rows.map((row) => (
          <div className="trend-column" key={row.date} title={row.date}>
            {keys.map((key) => (
              <span key={key} className={`trend-${key}`} style={{ height: `${Math.max(4, (Number(row[key] || 0) / max) * 100)}%` }} />
            ))}
          </div>
        ))}
      </div>
      <div className="trend-legend">
        {keys.map((key) => <span key={key}><i className={`trend-${key}`} /> {key}</span>)}
      </div>
    </article>
  );
};

export const Analytics = () => {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    const cachedSummary = readCache("analytics:summary");
    if (cachedSummary) {
      setSummary(cachedSummary);
      return;
    }

    api("/api/analytics/summary")
      .then((data) => {
        setSummary(data);
        writeCache("analytics:summary", data, 30_000);
      })
      .catch(() => setSummary(null));
  }, []);

  const totals = useMemo(() => {
    const incidents = summary?.incidents || {};
    const open = ["Open", "Acknowledged", "In Progress", "Investigating", "Mitigated"].reduce((total, key) => total + Number(incidents[key] || 0), 0);
    return { total: sumValues(incidents), open, resolved: Number(incidents.Resolved || 0) + Number(incidents.Closed || 0) };
  }, [summary]);

  const hasSummary = summary && (totals.total > 0 || (summary.tasksOpen || 0) > 0);

  return (
    <div className="page analytics-page">
      <section className="grid grid-3">
        <Kpi label="Incident volume" value={summary ? totals.total : "--"} />
        <Kpi label="Open workload" value={summary ? totals.open : "--"} />
        <Kpi label="Resolved or closed" value={summary ? totals.resolved : "--"} />
        <Kpi label="Average resolution" value={summary?.averageResolutionTime || "--"} />
        <Kpi label="SLA compliance" value={summary?.slaComplianceRate == null ? "--" : `${summary.slaComplianceRate}%`} />
        <Kpi label="Open tasks" value={summary?.tasksOpen ?? "--"} />
      </section>

      {!hasSummary ? (
        <section className="card">
          <div className="empty-state">
            <InboxIcon size={20} />
            <div>
              <strong>No analytics data yet</strong>
              <p>Create incidents or tasks to populate operational analytics.</p>
            </div>
          </div>
        </section>
      ) : null}

      <section className="grid grid-2">
        <Trend title="Incident volume over time" rows={summary?.volumeTrend || []} keys={["count"]} />
        <Trend title="Open versus resolved trend" rows={summary?.openResolvedTrend || []} keys={["open", "resolved"]} />
        <Bars title="Incidents by severity" items={summary?.bySeverity || {}} />
        <Bars title="Incidents by category" items={summary?.byCategory || {}} />
        <Bars title="Responder workload distribution" items={Object.fromEntries((summary?.responderWorkload || []).map((row) => [row.name, row.count]))} />
        <Bars title="Top recurring incident categories" items={summary?.topCategories || {}} />
      </section>
    </div>
  );
};
