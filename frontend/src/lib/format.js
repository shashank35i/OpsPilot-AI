const incidentBadges = {
  Open: { label: "Open", tone: "danger" },
  Acknowledged: { label: "Acknowledged", tone: "warning" },
  "In Progress": { label: "In Progress", tone: "warning" },
  Investigating: { label: "Investigating", tone: "warning" },
  Mitigated: { label: "Mitigated", tone: "success" },
  Resolved: { label: "Resolved", tone: "neutral" },
};

const taskBadges = {
  Todo: { label: "Todo", tone: "neutral" },
  "In Progress": { label: "In Progress", tone: "warning" },
  Done: { label: "Done", tone: "success" },
};

function timeLeft(dueAt) {
  if (!dueAt) return "No SLA";
  const diff = new Date(dueAt).getTime() - Date.now();
  if (diff <= 0) return "SLA breached";
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  return `${hours}h ${mins}m left`;
}

function slaProgress(dueAt, createdAt) {
  if (!dueAt || !createdAt) return 0;
  const start = new Date(createdAt).getTime();
  const end = new Date(dueAt).getTime();
  const now = Date.now();
  if (now >= end) return 100;
  if (now <= start) return 0;
  return Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
}

function slaTone(dueAt) {
  if (!dueAt) return "neutral";
  const diff = new Date(dueAt).getTime() - Date.now();
  if (diff <= 0) return "danger";
  if (diff < 2 * 3600000) return "warning";
  return "success";
}

export { incidentBadges, taskBadges, timeLeft, slaProgress, slaTone };
