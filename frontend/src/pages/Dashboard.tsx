import React, { useEffect, useState } from "react";
import { api } from "../lib/api";

export const Dashboard: React.FC = () => {
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    api("/api/analytics/summary")
      .then(setSummary)
      .catch(() => setSummary(null));
  }, []);

  return (
    <div className="grid grid-3">
      <div className="card">
        <div className="muted">Open Incidents</div>
        <h2>{summary?.incidents?.open ?? "--"}</h2>
      </div>
      <div className="card">
        <div className="muted">Investigating</div>
        <h2>{summary?.incidents?.investigating ?? "--"}</h2>
      </div>
      <div className="card">
        <div className="muted">Tasks Open</div>
        <h2>{summary?.tasksOpen ?? "--"}</h2>
      </div>
      <div className="card">
        <div className="muted">Mitigated</div>
        <h2>{summary?.incidents?.mitigated ?? "--"}</h2>
      </div>
      <div className="card">
        <div className="muted">Resolved</div>
        <h2>{summary?.incidents?.resolved ?? "--"}</h2>
      </div>
    </div>
  );
};
