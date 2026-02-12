import React, { useEffect, useState } from "react";
import { api } from "../lib/api";

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
    api<SummaryResponse>("/api/analytics/summary").then(setSummary).catch(() => setSummary(null));
    api<{ model: PriorityModel }>("/api/models/priority").then((d) => setModel(d.model)).catch(() => setModel(null));
  }, []);

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

      <section className="card">
        <div className="section-title">Local Model Registry</div>
        <h2 style={{ marginTop: 8 }}>{model?.name || "Local scoring model"}</h2>
        <div className="muted">Version {model?.version || "--"} · On-device rules engine</div>

        <div className="grid grid-3" style={{ marginTop: 16 }}>
          <article className="card">
            <div className="section-title">Severity Weights</div>
            <div className="list-lines">
              {model?.weights?.severity
                ? Object.entries(model.weights.severity).map(([k, v]) => (
                    <div key={k}><span>{k}</span><strong>{v}</strong></div>
                  ))
                : "No data"}
            </div>
          </article>
          <article className="card">
            <div className="section-title">Status Weights</div>
            <div className="list-lines">
              {model?.weights?.status
                ? Object.entries(model.weights.status).map(([k, v]) => (
                    <div key={k}><span>{k}</span><strong>{v}</strong></div>
                  ))
                : "No data"}
            </div>
          </article>
          <article className="card">
            <div className="section-title">Thresholds</div>
            <div className="list-lines">
              {model?.thresholds
                ? model.thresholds.map((t) => (
                    <div key={t.label}><span>{t.label}</span><strong>{t.min}+</strong></div>
                  ))
                : "No data"}
            </div>
          </article>
        </div>
      </section>
    </div>
  );
};
