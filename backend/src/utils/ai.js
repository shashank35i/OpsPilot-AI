function summarizeIncident(incident) {
  const title = incident.title || "Incident";
  const severity = incident.severity || "Medium";
  const status = incident.status || "Open";
  const summary = `Summary: ${title} is ${status.toLowerCase()} with ${severity.toLowerCase()} severity.\n`;
  const plan = "Action plan: confirm impact, assign owner, communicate ETA, and track mitigation steps.";
  return { summary, plan };
}

function scoreIncident(incident) {
  const sevWeight = { Low: 1, Medium: 2, High: 3, Critical: 5 };
  const statusWeight = { Open: 3, Investigating: 2, Mitigated: 1, Resolved: 0 };
  const severity = sevWeight[incident.severity] || 2;
  const status = statusWeight[incident.status] || 1;
  const ageHours = incident.createdAt
    ? Math.min(72, (Date.now() - new Date(incident.createdAt).getTime()) / 3600000)
    : 1;

  const score = Math.round(severity * 15 + status * 10 + ageHours);
  const label = score > 120 ? "Critical" : score > 80 ? "High" : score > 45 ? "Medium" : "Low";
  return { score, label };
}

module.exports = { summarizeIncident, scoreIncident };
