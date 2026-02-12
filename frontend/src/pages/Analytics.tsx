import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import { readCache, writeCache } from "../lib/cache";
import { InboxIcon } from "lucide-react";

type SummaryResponse = {
  incidents: { open: number; investigating: number; mitigated: number; resolved: number };
  tasksOpen: number;
};

type PriorityModel = {
  name: string;
  version: string;
  weights: {
    severity: Record<string, number>;
    status: Record<string, number>;
  };
  thresholds: Array<{ label: string; min: number }>;
};

export const Analytics: React.FC = () => {
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [model, setModel] = useState<PriorityModel | null>(null);

  useEffect(() => {
    const cachedSummary = readCache<SummaryResponse>("analytics:summary");
    const cachedModel = readCache<{ model: PriorityModel }>("analytics:model");
    if (cachedSummary) setSummary(cachedSummary);
    if (cachedModel?.model) setModel(cachedModel.model);
    if (cachedSummary && cachedModel?.model) return;

    api<SummaryResponse>("/api/analytics/summary")
      .then((data) => {
        setSummary(data);
        writeCache("analytics:summary", data, 30_000);
      })
      .catch(() => setSummary(null));

    api<{ model: PriorityModel }>("/api/models/priority")
      .then((d) => {
        setModel(d.model);
        writeCache("analytics:model", d, 60_000);
      })
      .catch(() => setModel(null));
  }, []);

  const hasSummary =
    (summary?.incidents?.open || 0) +
      (summary?.incidents?.investigating || 0) +
      (summary?.incidents?.mitigated || 0) +
      (summary?.incidents?.resolved || 0) +
      (summary?.tasksOpen || 0) >
    0;

  return (
    <div className="page">
      <section className="grid grid-3">
        <article className="card kpi-card">
          <span className="muted">Open</span>
          <strong>{summary?.incidents?.open ?? "--"}</strong>
        </article>
        <article className="card kpi-card">
          <span className="muted">Investigating</span>
          <strong>{summary?.incidents?.investigating ?? "--"}</strong>
        </article>
        <article className="card kpi-card">
          <span className="muted">Resolved</span>
          <strong>{summary?.incidents?.resolved ?? "--"}</strong>
        </article>
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

      <section className="card">
        <div className="section-title">Local Model Registry</div>
        <h2 style={{ marginTop: 8 }}>{model?.name || "Local scoring model"}</h2>
        <div className="muted">Version {model?.version || "--"} · On-device rules engine</div>

        <div className="grid grid-3" style={{ marginTop: 16 }}>
          <article className="card">
            <div className="section-title">Severity Weights</div>
            <div className="list-lines">
              {model?.weights?.severity ? (
                Object.entries(model.weights.severity).map(([k, v]) => (
                  <div key={k}><span>{k}</span><strong>{v}</strong></div>
                ))
              ) : (
                <div className="empty-inline">No model data</div>
              )}
            </div>
          </article>
          <article className="card">
            <div className="section-title">Status Weights</div>
            <div className="list-lines">
              {model?.weights?.status ? (
                Object.entries(model.weights.status).map(([k, v]) => (
                  <div key={k}><span>{k}</span><strong>{v}</strong></div>
                ))
              ) : (
                <div className="empty-inline">No model data</div>
              )}
            </div>
          </article>
          <article className="card">
            <div className="section-title">Thresholds</div>
            <div className="list-lines">
              {model?.thresholds?.length ? (
                model.thresholds.map((t) => (
                  <div key={t.label}><span>{t.label}</span><strong>{t.min}+</strong></div>
                ))
              ) : (
                <div className="empty-inline">No threshold data</div>
              )}
            </div>
          </article>
        </div>
      </section>
    </div>
  );
};
