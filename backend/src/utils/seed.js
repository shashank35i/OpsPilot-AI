const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Incident = require("../models/Incident");
const Task = require("../models/Task");
const Activity = require("../models/Activity");

async function seed() {
  const existing = await User.findOne({ email: "admin@opspilot.ai" });
  if (existing) return { ok: true, message: "Seed already present" };

  const admin = await User.create({
    name: "Demo Admin",
    email: "admin@opspilot.ai",
    passwordHash: await bcrypt.hash("Admin@123", 10),
    role: "Admin",
  });
  const manager = await User.create({
    name: "Ops Manager",
    email: "manager@opspilot.ai",
    passwordHash: await bcrypt.hash("Manager@123", 10),
    role: "Manager",
  });
  const agent = await User.create({
    name: "Response Agent",
    email: "agent@opspilot.ai",
    passwordHash: await bcrypt.hash("Agent@123", 10),
    role: "Agent",
  });

  const incidents = await Incident.insertMany([
    {
      title: "Payment gateway latency spike",
      description: "Increased latency on checkout payments in US-East.",
      severity: "High",
      status: "Investigating",
      owner: manager._id,
      assignee: agent._id,
      slaHours: 6,
      dueAt: new Date(Date.now() + 6 * 3600 * 1000),
      tags: ["payments", "latency"],
    },
    {
      title: "Mobile app crash on login",
      description: "Crash reports from iOS 17 users.",
      severity: "Critical",
      status: "Open",
      owner: manager._id,
      assignee: agent._id,
      slaHours: 4,
      dueAt: new Date(Date.now() + 4 * 3600 * 1000),
      tags: ["mobile", "crash"],
    },
    {
      title: "Inventory sync delayed",
      description: "Warehouse sync running 30 mins behind.",
      severity: "Medium",
      status: "Mitigated",
      owner: admin._id,
      assignee: agent._id,
      slaHours: 12,
      dueAt: new Date(Date.now() + 12 * 3600 * 1000),
      tags: ["inventory"],
    },
  ]);

  await Task.insertMany([
    { title: "Communicate incident update", status: "In Progress", priority: "High", incident: incidents[0]._id },
    { title: "Prepare rollback plan", status: "Todo", priority: "High", incident: incidents[1]._id },
    { title: "Verify sync backlog", status: "Todo", priority: "Medium", incident: incidents[2]._id },
  ]);

  await Activity.create({
    actor: admin._id,
    type: "SEED",
    entityType: "System",
    message: "Seeded demo data",
  });

  return { ok: true, message: "Seed completed" };
}

module.exports = { seed };
