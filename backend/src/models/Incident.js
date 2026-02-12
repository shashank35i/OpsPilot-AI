const mongoose = require("mongoose");

const IncidentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    severity: { type: String, enum: ["Low", "Medium", "High", "Critical"], default: "Medium" },
    status: { type: String, enum: ["Open", "Investigating", "Mitigated", "Resolved"], default: "Open" },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    tags: { type: [String], default: [] },
    slaHours: { type: Number, default: 24 },
    dueAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Incident", IncidentSchema);
