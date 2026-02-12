const incidentBadges = {
  Open: { label: "Open", color: "#ef4444" },
  Investigating: { label: "Investigating", color: "#f59e0b" },
  Mitigated: { label: "Mitigated", color: "#10b981" },
  Resolved: { label: "Resolved", color: "#64748b" },
};

function timeLeft(dueAt) {
  if (!dueAt) return "No SLA";
  const diff = new Date(dueAt).getTime() - Date.now();
  if (diff <= 0) return "SLA breached";
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  return `${hours}h ${mins}m left`;
}

export { incidentBadges, timeLeft };
