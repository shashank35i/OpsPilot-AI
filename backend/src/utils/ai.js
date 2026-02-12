const priorityModel = {
  name: "OpsPilot Priority Model",
  version: "1.1",
  weights: {
    severity: { Low: 1, Medium: 2, High: 3, Critical: 5 },
    status: { Open: 3, Investigating: 2, Mitigated: 1, Resolved: 0 },
    ageHoursCap: 72,
    severityMultiplier: 15,
    statusMultiplier: 10,
    ageMultiplier: 1,
  },
  thresholds: [
    { label: "Critical", min: 121 },
    { label: "High", min: 81 },
    { label: "Medium", min: 46 },
    { label: "Low", min: 0 },
  ],
};

function summarizeIncident(incident) {
  const title = incident.title || "Incident";
  const severity = incident.severity || "Medium";
  const status = incident.status || "Open";
  const summary = `Summary: ${title} is ${status.toLowerCase()} with ${severity.toLowerCase()} severity.\n`;
  const plan = "Action plan: confirm impact, assign owner, communicate ETA, and track mitigation steps.";
  return { summary, plan };
}

function scoreIncident(incident) {
  const { weights, thresholds } = priorityModel;
  const severity = weights.severity[incident.severity] || 2;
  const status = weights.status[incident.status] || 1;
  const ageHours = incident.createdAt
    ? Math.min(weights.ageHoursCap, (Date.now() - new Date(incident.createdAt).getTime()) / 3600000)
    : 1;

  const score = Math.round(
    severity * weights.severityMultiplier +
      status * weights.statusMultiplier +
      ageHours * weights.ageMultiplier
  );
  const label = thresholds.find((t) => score >= t.min)?.label || "Low";
  return { score, label };
}

function getPriorityModel() {
  return priorityModel;
}

module.exports = { summarizeIncident, scoreIncident, getPriorityModel };
