const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { z } = require("zod");

dotenv.config();

const User = require("./models/User");
const Incident = require("./models/Incident");
const Task = require("./models/Task");
const Activity = require("./models/Activity");
const { auth, requireRole } = require("./middleware/auth");
const { summarizeIncident, scoreIncident, getPriorityModel } = require("./utils/ai");
const { seed } = require("./utils/seed");
const { cacheGet, cacheSet, cacheDel } = require("./utils/redis");

const app = express();
const allowedOrigins = (process.env.CLIENT_ORIGIN || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);
app.use(
  cors({
    origin(origin, callback) {
      // Allow server-to-server and tools without Origin header
      if (!origin) return callback(null, true);
      if (allowedOrigins.length === 0) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
  })
);
app.use(express.json({ limit: "2mb" }));

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change";
const PORT = process.env.PORT || 8080;
const APP_VERSION = process.env.APP_VERSION || require("../package.json").version || "1.0.0";
const STARTED_AT = Date.now();
const INCIDENT_CACHE_KEYS = [
  "incidents:all",
  "incidents:Open",
  "incidents:Investigating",
  "incidents:Mitigated",
  "incidents:Resolved",
];

async function connectMongo() {
  const uri = process.env.MONGO_URL || "";
  if (!uri) {
    console.error("Missing MONGO_URL");
    process.exit(1);
  }
  await mongoose.connect(uri);
  console.log("Mongo connected");
}

function createToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: "8h" }
  );
}

async function logActivity({ actor, type, entityType, entityId, message, metadata }) {
  try {
    await Activity.create({ actor, type, entityType, entityId, message, metadata });
  } catch (e) {
    console.error("Activity log failed", e?.message || e);
  }
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// --- Auth
app.post("/api/auth/register", async (req, res) => {
  try {
    const schema = z.object({
      name: z.string().min(2),
      email: z.string().email(),
      password: z.string().min(6),
      role: z.enum(["Admin", "Manager", "Agent"]).optional(),
    });
    const { name, email, password, role } = schema.parse(req.body);

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(409).json({ message: "Email already registered" });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email: email.toLowerCase(), passwordHash, role: role || "Agent" });

    const token = createToken(user);
    return res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (e) {
    return res.status(400).json({ message: e?.message || "Invalid input" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const schema = z.object({ email: z.string().email(), password: z.string() });
    const { email, password } = schema.parse(req.body);

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = createToken(user);
    return res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (e) {
    return res.status(400).json({ message: e?.message || "Invalid input" });
  }
});

app.get("/api/auth/me", auth, async (req, res) => {
  const user = await User.findById(req.user.id).select("name email role");
  if (!user) return res.status(404).json({ message: "User not found" });
  return res.json({ user });
});

// --- Incidents
app.get("/api/incidents", auth, async (req, res) => {
  const status = String(req.query.status || "").trim();
  const q = String(req.query.q || "").trim();
  const filter = {};
  if (status) filter.status = status;
  if (q) filter.title = { $regex: escapeRegex(q), $options: "i" };

  // Query searches are not cached to avoid key explosion.
  if (!q) {
    const cacheKey = `incidents:${status || "all"}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return res.json(cached);
  }

  const incidents = await Incident.find(filter).sort({ createdAt: -1 }).limit(200);
  const items = incidents.map((i) => ({
    ...i.toObject(),
    score: scoreIncident(i),
  }));
  const payload = { items };
  if (!q) {
    const cacheKey = `incidents:${status || "all"}`;
    await cacheSet(cacheKey, payload, 20);
  }
  res.json(payload);
});

app.post("/api/incidents", auth, async (req, res) => {
  try {
    const schema = z.object({
      title: z.string().min(3),
      description: z.string().optional(),
      severity: z.enum(["Low", "Medium", "High", "Critical"]).optional(),
      tags: z.array(z.string()).optional(),
      slaHours: z.number().optional(),
    });
    const data = schema.parse(req.body);

    const dueAt = data.slaHours ? new Date(Date.now() + data.slaHours * 3600 * 1000) : undefined;
    const incident = await Incident.create({
      ...data,
      owner: req.user.id,
      dueAt,
    });

    await logActivity({
      actor: req.user.id,
      type: "INCIDENT_CREATED",
      entityType: "Incident",
      entityId: incident._id,
      message: `Incident created: ${incident.title}`,
    });
    await cacheDel([...INCIDENT_CACHE_KEYS, "analytics:summary", "activities:latest"]);

    res.json({ item: incident });
  } catch (e) {
    res.status(400).json({ message: e?.message || "Invalid input" });
  }
});

app.patch("/api/incidents/:id", auth, async (req, res) => {
  try {
    const schema = z.object({
      status: z.enum(["Open", "Investigating", "Mitigated", "Resolved"]).optional(),
      assignee: z.string().optional(),
      severity: z.enum(["Low", "Medium", "High", "Critical"]).optional(),
      description: z.string().optional(),
      tags: z.array(z.string()).optional(),
    });
    const data = schema.parse(req.body);

    const incident = await Incident.findByIdAndUpdate(req.params.id, data, { new: true });
    if (!incident) return res.status(404).json({ message: "Incident not found" });

    await logActivity({
      actor: req.user.id,
      type: "INCIDENT_UPDATED",
      entityType: "Incident",
      entityId: incident._id,
      message: `Incident updated: ${incident.title}`,
      metadata: data,
    });
    await cacheDel([...INCIDENT_CACHE_KEYS, "analytics:summary", "activities:latest"]);

    res.json({ item: incident });
  } catch (e) {
    res.status(400).json({ message: e?.message || "Invalid input" });
  }
});

app.post("/api/incidents/:id/auto-tasks", auth, async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id);
    if (!incident) return res.status(404).json({ message: "Incident not found" });

    const severityToPriority = {
      Low: "Low",
      Medium: "Medium",
      High: "High",
      Critical: "High",
    };
    const priority = severityToPriority[incident.severity] || "Medium";
    const etaHours = incident.severity === "Critical" ? 2 : incident.severity === "High" ? 4 : 8;
    const dueAt = new Date(Date.now() + etaHours * 3600 * 1000);

    const base = incident.title.trim();
    const templates = [
      `Triage impact and identify blast radius for \"${base}\"`,
      `Execute mitigation for \"${base}\" and verify rollback path`,
      `Publish status update and close post-incident notes for \"${base}\"`,
    ];

    const docs = templates.map((title) => ({
      title,
      status: "Todo",
      priority,
      incident: incident._id,
      dueAt,
    }));

    const items = await Task.insertMany(docs);
    await logActivity({
      actor: req.user.id,
      type: "TASKS_AUTOGENERATED",
      entityType: "Incident",
      entityId: incident._id,
      message: `Auto-generated ${items.length} tasks for incident: ${incident.title}`,
      metadata: { priority, etaHours },
    });
    await cacheDel([...INCIDENT_CACHE_KEYS, "tasks:all", "analytics:summary", "activities:latest"]);

    return res.json({ items });
  } catch (e) {
    return res.status(500).json({ message: "Failed to auto-generate tasks" });
  }
});

// --- Tasks
app.get("/api/tasks", auth, async (req, res) => {
  const q = String(req.query.q || "").trim();
  if (!q) {
    const cached = await cacheGet("tasks:all");
    if (cached) return res.json(cached);
  }

  const filter = q ? { title: { $regex: escapeRegex(q), $options: "i" } } : {};
  const tasks = await Task.find(filter).sort({ createdAt: -1 }).limit(200);
  const payload = { items: tasks };
  if (!q) await cacheSet("tasks:all", payload, 20);
  res.json(payload);
});

app.post("/api/tasks", auth, async (req, res) => {
  try {
    const schema = z.object({
      title: z.string().min(3),
      status: z.enum(["Todo", "In Progress", "Done"]).optional(),
      priority: z.enum(["Low", "Medium", "High"]).optional(),
      incident: z.string().optional(),
    });
    const data = schema.parse(req.body);
    const task = await Task.create(data);

    await logActivity({
      actor: req.user.id,
      type: "TASK_CREATED",
      entityType: "Task",
      entityId: task._id,
      message: `Task created: ${task.title}`,
    });
    await cacheDel(["tasks:all", "analytics:summary", "activities:latest"]);

    res.json({ item: task });
  } catch (e) {
    res.status(400).json({ message: e?.message || "Invalid input" });
  }
});

app.patch("/api/tasks/:id", auth, async (req, res) => {
  try {
    const schema = z.object({
      status: z.enum(["Todo", "In Progress", "Done"]).optional(),
      priority: z.enum(["Low", "Medium", "High"]).optional(),
      title: z.string().min(3).optional(),
    });
    const data = schema.parse(req.body);

    const task = await Task.findByIdAndUpdate(req.params.id, data, { new: true });
    if (!task) return res.status(404).json({ message: "Task not found" });

    await logActivity({
      actor: req.user.id,
      type: "TASK_UPDATED",
      entityType: "Task",
      entityId: task._id,
      message: `Task updated: ${task.title}`,
      metadata: data,
    });
    await cacheDel(["tasks:all", "analytics:summary", "activities:latest"]);

    res.json({ item: task });
  } catch (e) {
    res.status(400).json({ message: e?.message || "Invalid input" });
  }
});

// --- Analytics
app.get("/api/analytics/summary", auth, async (req, res) => {
  const cached = await cacheGet("analytics:summary");
  if (cached) return res.json(cached);

  const [open, investigating, mitigated, resolved] = await Promise.all([
    Incident.countDocuments({ status: "Open" }),
    Incident.countDocuments({ status: "Investigating" }),
    Incident.countDocuments({ status: "Mitigated" }),
    Incident.countDocuments({ status: "Resolved" }),
  ]);
  const tasksOpen = await Task.countDocuments({ status: { $ne: "Done" } });
  const payload = {
    incidents: { open, investigating, mitigated, resolved },
    tasksOpen,
  };
  await cacheSet("analytics:summary", payload, 30);
  res.json(payload);
});

// --- Model metadata (local scoring model)
app.get("/api/models/priority", auth, (_req, res) => {
  res.json({ model: getPriorityModel() });
});

// --- AI summary (local model)
app.post("/api/ai/incident-summary", auth, async (req, res) => {
  try {
    const { incidentId } = req.body || {};
    let incident = req.body?.incident;

    if (incidentId) {
      incident = await Incident.findById(incidentId);
    }

    if (!incident) return res.status(400).json({ message: "Incident missing" });

    const ai = summarizeIncident(incident);
    const score = scoreIncident(incident);
    res.json({ ...ai, score });
  } catch (e) {
    res.status(500).json({ message: "Failed to generate summary" });
  }
});

// --- Activities
app.get("/api/activities", auth, async (req, res) => {
  const cached = await cacheGet("activities:latest");
  if (cached) return res.json(cached);

  const items = await Activity.find({}).sort({ createdAt: -1 }).limit(50);
  const payload = { items };
  await cacheSet("activities:latest", payload, 15);
  res.json(payload);
});

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "opspilot-backend",
    version: APP_VERSION,
    uptimeSeconds: Math.floor((Date.now() - STARTED_AT) / 1000),
    timestamp: new Date().toISOString(),
  });
});

connectMongo()
  .then(async () => {
    if (process.env.SEED_ON_START === "1") {
      await seed();
      console.log("Seed completed");
    }
    app.listen(PORT, () => {
      console.log(`OpsPilot backend running on :${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Mongo connect failed", err);
    process.exit(1);
  });
